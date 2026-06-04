import type { FramePlan, FxState, Stroke } from "@/types";
import { SVIP_FOOTER } from "@/lib/constants";
import {
  paintBackground, applyBackEffects, applyFrontEffects,
  buildParticleCache, renderStyledInk, setFxVideoFrameForT,
} from "@/lib/effects/index";
import { drawStampFrame } from "@/lib/effects/stamp";
import { renderFooterStrip } from "@/lib/ink";
import { computeInkBBox } from "@/lib/utils";
import { drawStroke } from "@/lib/drawing/index";

export function makeFramePlanFromCanvas(
  srcCanvas: HTMLCanvasElement,
  options: {
    frames?: number;
    fx?: FxState;
    transparentMode?: boolean;
    outputFormat?: "gif" | "mp4" | "webm";
  } = {}
): FramePlan {
  const frames = options.frames || 54;
  const W = srcCanvas.width, H = srcCanvas.height;
  const fx = options.fx || { background: "transparent" as const, bgImage: null, effect: "none" as const, inkStyle: "plain" as const };
  const transparentMode = !!options.transparentMode;
  const outputFormat = options.outputFormat || "gif";

  const fh = Math.min(
    SVIP_FOOTER.maxHeight,
    Math.max(SVIP_FOOTER.minHeight, Math.round(W * SVIP_FOOTER.heightRatio))
  );
  const outH = transparentMode ? H : H + fh;

  const srcCtx = srcCanvas.getContext("2d")!;
  const srcData = srcCtx.getImageData(0, 0, W, H);
  let minX = W, maxX = 0, minY = H, maxY = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const a = srcData.data[(y * W + x) * 4 + 3];
      if (a > 10) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (minX > maxX) throw new Error("빈 이미지");

  const effectiveFx: FxState = transparentMode
    ? { ...fx, background: "transparent", effect: "none", inkStyle: "plain", bgImage: null, _outputFormat: outputFormat as any }
    : { ...fx, _outputFormat: outputFormat as any };

  const inkSource = renderStyledInk(srcCanvas, W, H, effectiveFx.inkStyle);
  const footerCanvas = transparentMode ? null : renderFooterStrip(W, fh);
  const cache = buildParticleCache(W, H, effectiveFx, 12345);
  if (effectiveFx.effect === "stamp") {
    const bbox = computeInkBBox(srcCanvas) || { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    cache.stampBBox = bbox;
  }

  function renderFrame(tctx: CanvasRenderingContext2D, t: number) {
    if (transparentMode) {
      tctx.clearRect(0, 0, W, outH);
    } else {
      setFxVideoFrameForT(effectiveFx, t);
      paintBackground(tctx, W, H, effectiveFx);
      applyBackEffects(tctx, W, H, t, effectiveFx, cache);
    }
    if (effectiveFx.effect === "stamp") {
      drawStampFrame(tctx, inkSource, t, W, H, cache);
    } else {
      const revealX = minX + (maxX - minX + 1) * t;
      const revealRight = Math.min(W, Math.max(0, Math.ceil(revealX) + 1));
      if (revealRight > 0) {
        tctx.drawImage(inkSource, 0, 0, revealRight, H, 0, 0, revealRight, H);
      }
    }
    if (!transparentMode) {
      applyFrontEffects(tctx, W, H, t, effectiveFx, cache);
      if (footerCanvas) tctx.drawImage(footerCanvas, 0, H);
    }
  }

  return { renderFrame, totalFrames: frames, W, H, outH };
}

export function makeFramePlanFromStrokes(
  strokes: Stroke[],
  W: number,
  H: number,
  options: {
    frames?: number;
    fx?: FxState;
    transparentMode?: boolean;
    outputFormat?: "gif" | "mp4" | "webm";
  } = {}
): FramePlan {
  const frames = options.frames || 54;
  const fx = options.fx || { background: "transparent" as const, bgImage: null, effect: "none" as const, inkStyle: "plain" as const };
  const transparentMode = !!options.transparentMode;
  const outputFormat = options.outputFormat || "gif";

  const fh = Math.min(
    SVIP_FOOTER.maxHeight,
    Math.max(SVIP_FOOTER.minHeight, Math.round(W * SVIP_FOOTER.heightRatio))
  );
  const outH = transparentMode ? H : H + fh;
  const totalPts = strokes.reduce((sum, s) => sum + s.points.length, 0);
  if (totalPts === 0) throw new Error("빈 이미지");

  const effectiveFx: FxState = transparentMode
    ? { ...fx, background: "transparent", effect: "none", inkStyle: "plain", bgImage: null, _outputFormat: outputFormat as any }
    : { ...fx, _outputFormat: outputFormat as any };

  const footerCanvas = transparentMode ? null : renderFooterStrip(W, fh);
  const cache = buildParticleCache(W, H, effectiveFx, 54321);

  let prerenderedInk: HTMLCanvasElement | null = null;
  if (effectiveFx.effect === "stamp") {
    const fullInk = document.createElement("canvas");
    fullInk.width = W; fullInk.height = H;
    const fctx = fullInk.getContext("2d")!;
    for (const stroke of strokes) {
      drawStroke(fctx, stroke);
    }
    prerenderedInk = renderStyledInk(fullInk, W, H, "stamp");
    const bbox = computeInkBBox(fullInk);
    cache.stampBBox = bbox || { x: W * 0.2, y: H * 0.3, w: W * 0.6, h: H * 0.4 };
  }

  function renderFrame(tctx: CanvasRenderingContext2D, t: number) {
    if (transparentMode) {
      tctx.clearRect(0, 0, W, outH);
    } else {
      setFxVideoFrameForT(effectiveFx, t);
      paintBackground(tctx, W, H, effectiveFx);
      applyBackEffects(tctx, W, H, t, effectiveFx, cache);
    }
    if (effectiveFx.effect === "stamp" && prerenderedInk) {
      drawStampFrame(tctx, prerenderedInk, t, W, H, cache);
    } else {
      const targetPts = Math.round(totalPts * t);
      const inkCanvas = document.createElement("canvas");
      inkCanvas.width = W; inkCanvas.height = H;
      const ictx = inkCanvas.getContext("2d")!;
      let drawnPts = 0;
      for (const stroke of strokes) {
        const remaining = targetPts - drawnPts;
        if (remaining <= 0) break;
        const pointsToDraw = Math.min(stroke.points.length, remaining);
        if (pointsToDraw < 2) { drawnPts += pointsToDraw; continue; }
        const partialStroke = { ...stroke, points: stroke.points.slice(0, pointsToDraw) };
        drawStroke(ictx, partialStroke);
        drawnPts += stroke.points.length;
      }
      const inkToUse = renderStyledInk(inkCanvas, W, H, effectiveFx.inkStyle);
      tctx.drawImage(inkToUse, 0, 0);
    }
    if (!transparentMode) {
      applyFrontEffects(tctx, W, H, t, effectiveFx, cache);
      if (footerCanvas) tctx.drawImage(footerCanvas, 0, H);
    }
  }

  return { renderFrame, totalFrames: frames, W, H, outH };
}
