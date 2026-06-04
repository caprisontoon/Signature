import { SVIP_FOOTER } from "./constants";
import { renderStyledInk } from "./effects/index";
import type { FxState, InkStyle } from "@/types";

export { renderStyledInk };

export function inkStyleFor(fx: FxState): InkStyle {
  if (fx.effect === "cinematic") return "chrome";
  if (fx.effect === "epic-fire") return "chrome";
  if (fx.effect === "svip-gold") return "gold";
  if (fx.effect === "svip-purple") return "purple-chrome";
  if (fx.effect === "vip-aqua") return "aqua-chrome";
  if (fx.effect === "stamp") return "stamp";
  if (fx.effect === "matrix") return "matrix-green";
  return "plain";
}

export function renderFooterStrip(W: number, fh: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = W; c.height = fh;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = SVIP_FOOTER.bg;
  ctx.fillRect(0, 0, W, fh);
  ctx.fillStyle = SVIP_FOOTER.dividerTop;
  ctx.fillRect(0, 0, W, 1.5);
  const grad = ctx.createLinearGradient(0, 1.5, 0, 8);
  grad.addColorStop(0, "rgba(208, 184, 136, 0.35)");
  grad.addColorStop(1, "rgba(208, 184, 136, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 1.5, W, 7);
  const fontSize = Math.max(14, Math.round(fh * 0.45));
  ctx.font = `700 ${fontSize}px "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const textX = W / 2;
  const textY = fh / 2 + 2;
  ctx.fillStyle = SVIP_FOOTER.goldShadow;
  ctx.fillText(SVIP_FOOTER.text, textX + 1, textY + 1);
  ctx.save();
  ctx.shadowColor = "rgba(248, 192, 0, 0.5)";
  ctx.shadowBlur = 8;
  ctx.fillStyle = SVIP_FOOTER.gold;
  ctx.fillText(SVIP_FOOTER.text, textX, textY);
  ctx.restore();
  ctx.fillStyle = SVIP_FOOTER.gold;
  ctx.fillText(SVIP_FOOTER.text, textX, textY);
  return c;
}

export function attachSvipFooter(srcCanvas: HTMLCanvasElement): HTMLCanvasElement {
  const W = srcCanvas.width;
  const H = srcCanvas.height;
  const fh = Math.min(
    SVIP_FOOTER.maxHeight,
    Math.max(SVIP_FOOTER.minHeight, Math.round(W * SVIP_FOOTER.heightRatio))
  );
  const out = document.createElement("canvas");
  out.width = W; out.height = H + fh;
  const ctx = out.getContext("2d")!;
  ctx.drawImage(srcCanvas, 0, 0);
  const footer = renderFooterStrip(W, fh);
  ctx.drawImage(footer, 0, H);
  return out;
}

export function renderStaticWithEffects(
  srcCanvas: HTMLCanvasElement,
  fxState: FxState
): HTMLCanvasElement {
  const { paintBackground, applyBackEffects, applyFrontEffects, buildParticleCache, isTransparent } =
    require("./effects/index");
  const W = srcCanvas.width, H = srcCanvas.height;
  const fx = fxState;
  let out: HTMLCanvasElement;
  if (isTransparent(fx)) {
    out = srcCanvas;
  } else {
    out = document.createElement("canvas");
    out.width = W; out.height = H;
    const ctx = out.getContext("2d")!;
    const cache = buildParticleCache(W, H, fx, 12345);
    const t = 0.7;
    paintBackground(ctx, W, H, fx);
    applyBackEffects(ctx, W, H, t, fx, cache);
    const inkToUse = renderStyledInk(srcCanvas, W, H, fx.inkStyle);
    ctx.drawImage(inkToUse, 0, 0);
    applyFrontEffects(ctx, W, H, t, fx, cache);
  }
  return attachSvipFooter(out);
}
