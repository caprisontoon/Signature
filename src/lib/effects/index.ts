import type { FxState, ParticleCache } from "@/types";
import { FX_PRESETS, STAMP_PALETTE, SVIP_FOOTER, MATRIX_PALETTE } from "@/lib/constants";
import { computeInkBBox } from "@/lib/utils";
import {
  makeSparkSystem, makeDustSystem, makeStarSprites, makeConfetti,
  makeVerticalStreaks, makePixelRain, makeFireBlobs, makeEmbers, makeMatrixColumns,
  drawSparks, drawDust, drawStarSprites, drawConfetti, drawVerticalStreaks,
  drawPixelRain, drawFireBlobs, drawEmbers, drawMatrixRain,
} from "./particles";
import { renderStampInk, drawStampFrame } from "./stamp";
import {
  drawSpotlight, drawRadialBurst, drawGiantStar, drawRotatingRing, drawLensFlare,
  drawColoredBackground, drawBackGlow, drawVignette,
  makeFireRingBlobs, makeFireRingSparks,
} from "./cinematic";
import { renderChromeInk, getDarkTexture, paintMatrixBackground } from "./rendering";
import type { InkStyle } from "@/types";

export { drawStampFrame };

// ─── Global mutable video state (window-level in original) ───
export let _fxBgImage: HTMLImageElement | null = null;
export let _fxVideo: {
  url: string;
  el: HTMLVideoElement;
  frames: HTMLCanvasElement[] | null;
  name: string;
  w: number;
  h: number;
} | null = null;

export function setFxBgImage(img: HTMLImageElement | null) { _fxBgImage = img; }
export function setFxVideo(v: typeof _fxVideo) { _fxVideo = v; }

export function drawVideoCover(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  src: HTMLVideoElement | HTMLCanvasElement
): boolean {
  const sw = (src as HTMLVideoElement).videoWidth || (src as HTMLCanvasElement).width;
  const sh = (src as HTMLVideoElement).videoHeight || (src as HTMLCanvasElement).height;
  if (!sw || !sh) return false;
  const ar = sw / sh, car = W / H;
  let dw: number, dh: number, dx: number, dy: number;
  if (ar > car) { dh = H; dw = H * ar; dx = (W - dw) / 2; dy = 0; }
  else { dw = W; dh = W / ar; dx = 0; dy = (H - dh) / 2; }
  ctx.drawImage(src as any, dx, dy, dw, dh);
  return true;
}

export function setFxVideoFrameForT(fx: FxState, t: number) {
  if (fx.effect !== "custom-video") return;
  const vid = _fxVideo;
  if (vid && vid.frames && vid.frames.length) {
    const idx = Math.min(vid.frames.length - 1, Math.floor(t * vid.frames.length));
    (fx as any)._videoFrame = vid.frames[idx];
  }
}

export function getEffectsState(): FxState {
  if (typeof document === "undefined") {
    return { background: "transparent", bgImage: null, effect: "none", inkStyle: "plain" };
  }
  const sel = document.getElementById("fxEffect") as HTMLSelectElement | null;
  const effect = (sel?.value || "none") as FxState["effect"];
  const fx: FxState = {
    background: "transparent",
    bgImage: _fxBgImage,
    effect,
    inkStyle: "plain",
  };
  fx.inkStyle = inkStyleFor(fx);
  return fx;
}

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

export function buildParticleCache(W: number, H: number, fx: FxState, seed: number): ParticleCache {
  const cache: ParticleCache = {};
  if (fx.effect === "sparks" || fx.effect === "cinematic") {
    cache.sparks = makeSparkSystem(W, H, 60, seed);
  }
  if (fx.effect === "cinematic") {
    cache.dust = makeDustSystem(W, H, 80, seed + 1);
  }
  if (fx.effect === "svip-gold" || fx.effect === "svip-purple" || fx.effect === "vip-aqua") {
    cache.stars = makeStarSprites(W, H, 60, seed + 2);
  }
  if (fx.effect === "svip-gold") {
    cache.confetti = makeConfetti(W, H, 80, seed + 4);
  }
  if (fx.effect === "svip-purple") {
    cache.streaks = makeVerticalStreaks(W, H, 30, seed + 3);
    cache.pixels = makePixelRain(W, H, 50, seed + 5);
  }
  if (fx.effect === "stamp") {
    cache.stampSeed = seed + 6;
  }
  if (fx.effect === "epic-fire") {
    cache.fireBlobs = makeFireBlobs(W, H, 60, seed + 7);
    cache.embers = makeEmbers(W, H, 50, seed + 8);
  }
  if (fx.effect === "matrix") {
    cache.matrix = makeMatrixColumns(W, H, seed + 9);
  }
  return cache;
}

export function paintBackground(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  opts: FxState
) {
  if (opts.background === "image" && opts.bgImage) {
    const img = opts.bgImage;
    const ar = img.width / img.height;
    const car = W / H;
    let dw: number, dh: number, dx: number, dy: number;
    if (ar > car) { dh = H; dw = H * ar; dx = (W - dw) / 2; dy = 0; }
    else { dw = W; dh = W / ar; dx = 0; dy = (H - dh) / 2; }
    ctx.drawImage(img, dx, dy, dw, dh);
    return;
  }
  if (opts.effect === "custom-video") {
    const src = (opts as any)._videoFrame || (_fxVideo && _fxVideo.el) || null;
    let drawn = false;
    if (src) drawn = drawVideoCover(ctx, W, H, src);
    if (!drawn) {
      ctx.fillStyle = "#15171c";
      ctx.fillRect(0, 0, W, H);
    }
    return;
  }
  if (opts.effect === "svip-gold" || opts.effect === "svip-purple" || opts.effect === "vip-aqua") {
    drawColoredBackground(ctx, W, H, FX_PRESETS[opts.effect].bg);
    return;
  }
  if (opts.effect === "matrix") {
    paintMatrixBackground(ctx, W, H);
    return;
  }
  if (opts.effect === "stamp") {
    const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7);
    g.addColorStop(0, STAMP_PALETTE.paper);
    g.addColorStop(1, STAMP_PALETTE.paperEdge);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    return;
  }
  if (opts.background === "texture" || opts.effect === "cinematic" || opts.effect === "epic-fire") {
    ctx.drawImage(getDarkTexture(W, H), 0, 0);
    return;
  }
  if ((opts as any)._outputFormat === "mp4") {
    ctx.fillStyle = "#000000";
  } else {
    ctx.fillStyle = "#00ff00";
  }
  ctx.fillRect(0, 0, W, H);
}

export function applyBackEffects(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  t: number,
  fx: FxState,
  particleCache: ParticleCache
) {
  if (fx.effect === "cinematic") {
    drawSpotlight(ctx, W, H, 0.7);
    if (particleCache.dust) drawDust(ctx, particleCache.dust, t, W, H);
  } else if (fx.effect === "svip-gold") {
    drawRadialBurst(ctx, W / 2, H / 2, W, H, t, {
      color: FX_PRESETS["svip-gold"].ray, count: 36, intensity: 1.0,
    });
    const grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.min(W, H) * 0.5);
    grad.addColorStop(0, "rgba(255, 230, 130, 0.55)");
    grad.addColorStop(1, "rgba(255, 230, 130, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    drawGiantStar(ctx, W / 2, H / 2, Math.min(W, H) * 0.42, t, {
      color: FX_PRESETS["svip-gold"].star, glow: 30,
    });
  } else if (fx.effect === "svip-purple") {
    if (particleCache.pixels) drawPixelRain(ctx, particleCache.pixels, t, W, H);
    if (particleCache.streaks) drawVerticalStreaks(ctx, particleCache.streaks, t, W, H, FX_PRESETS["svip-purple"].ray);
    const grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.min(W, H) * 0.55);
    grad.addColorStop(0, "rgba(160, 130, 255, 0.45)");
    grad.addColorStop(1, "rgba(160, 130, 255, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  } else if (fx.effect === "vip-aqua") {
    drawRadialBurst(ctx, W / 2, H / 2, W, H, t, {
      color: FX_PRESETS["vip-aqua"].ray, count: 20, intensity: 0.45,
    });
    const grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.min(W, H) * 0.55);
    grad.addColorStop(0, "rgba(100, 230, 255, 0.45)");
    grad.addColorStop(1, "rgba(100, 230, 255, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  } else if (fx.effect === "epic-fire") {
    drawBackGlow(ctx, W, H, t, 1.0);
    if (particleCache.fireBlobs) {
      const half = particleCache.fireBlobs.slice(0, Math.floor(particleCache.fireBlobs.length / 2));
      drawFireBlobs(ctx, half, t, W, H, 0.85);
    }
  } else if (fx.effect === "matrix") {
    if (particleCache.matrix) drawMatrixRain(ctx, particleCache.matrix, t, W, H);
  }
}

export function applyFrontEffects(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  t: number,
  fx: FxState,
  particleCache: ParticleCache
) {
  if (fx.effect === "sparks" || fx.effect === "cinematic") {
    if (particleCache.sparks) drawSparks(ctx, particleCache.sparks, t, W, H);
  } else if (fx.effect === "svip-gold") {
    if (particleCache.confetti) drawConfetti(ctx, particleCache.confetti, t, W, H);
    if (particleCache.stars) drawStarSprites(ctx, particleCache.stars, t, FX_PRESETS["svip-gold"].star);
  } else if (fx.effect === "svip-purple") {
    if (particleCache.stars) drawStarSprites(ctx, particleCache.stars, t, FX_PRESETS["svip-purple"].star);
  } else if (fx.effect === "vip-aqua") {
    drawLensFlare(ctx, W / 2, H / 2, W, H, t, FX_PRESETS["vip-aqua"].ray);
    if (particleCache.stars) drawStarSprites(ctx, particleCache.stars, t, FX_PRESETS["vip-aqua"].star);
    const radius = Math.min(W, H) * 0.36;
    drawRotatingRing(ctx, W / 2, H / 2, radius, t, FX_PRESETS["vip-aqua"].ray);
  } else if (fx.effect === "epic-fire") {
    if (particleCache.fireBlobs) {
      const half = particleCache.fireBlobs.slice(Math.floor(particleCache.fireBlobs.length / 2));
      drawFireBlobs(ctx, half, t, W, H, 1.0);
    }
    if (particleCache.embers) drawEmbers(ctx, particleCache.embers, t, W, H, 1.0);
    drawVignette(ctx, W, H, 0.5);
  }
}

export function renderStyledInk(
  srcCanvas: HTMLCanvasElement,
  W: number, H: number,
  style: InkStyle
): HTMLCanvasElement {
  if (style === "plain") return srcCanvas;
  if (style === "chrome") return renderChromeInk(srcCanvas, W, H);
  if (style === "stamp") return renderStampInk(srcCanvas, W, H);

  const stops: Record<string, [string, number][]> = {
    "gold":          [["#ffffff",0],["#fff7c0",0.3],["#ffe066",0.55],["#fffce8",0.75],["#ffd24a",1]],
    "purple-chrome": [["#ffffff",0],["#f0e6ff",0.3],["#c8b0ff",0.55],["#ffffff",0.75],["#e8d8ff",1]],
    "aqua-chrome":   [["#ffffff",0],["#e0fbff",0.3],["#7ee8ff",0.55],["#ffffff",0.75],["#aef0ff",1]],
    "matrix-green":  [["#eaffea",0],["#bdf5bd",0.3],["#5cee7a",0.55],["#dafadc",0.75],["#46d966",1]],
  };

  const tinted = document.createElement("canvas");
  tinted.width = W; tinted.height = H;
  const tctx = tinted.getContext("2d")!;
  tctx.drawImage(srcCanvas, 0, 0);
  const grad = tctx.createLinearGradient(0, 0, 0, H);
  for (const [c, p] of (stops[style] || [])) grad.addColorStop(p, c);
  tctx.globalCompositeOperation = "source-in";
  tctx.fillStyle = grad;
  tctx.fillRect(0, 0, W, H);
  tctx.globalCompositeOperation = "source-over";

  const outline = document.createElement("canvas");
  outline.width = W; outline.height = H;
  const octx = outline.getContext("2d")!;
  octx.filter = "blur(2px)";
  octx.drawImage(srcCanvas, 0, 0);
  octx.filter = "none";
  octx.globalCompositeOperation = "source-in";
  octx.fillStyle = "rgba(0, 0, 0, 0.85)";
  octx.fillRect(0, 0, W, H);

  const glow = document.createElement("canvas");
  glow.width = W; glow.height = H;
  const gctx = glow.getContext("2d")!;
  gctx.filter = "blur(6px)";
  gctx.drawImage(srcCanvas, 0, 0);
  gctx.filter = "none";
  gctx.globalCompositeOperation = "source-in";
  const glowColor =
    style === "gold"          ? "rgba(255, 230, 140, 0.85)" :
    style === "purple-chrome" ? "rgba(200, 170, 255, 0.85)" :
    style === "matrix-green"  ? "rgba(120, 255, 150, 0.85)" :
    "rgba(150, 240, 255, 0.85)";
  gctx.fillStyle = glowColor;
  gctx.fillRect(0, 0, W, H);

  const combined = document.createElement("canvas");
  combined.width = W; combined.height = H;
  const cctx = combined.getContext("2d")!;
  cctx.drawImage(glow, 0, 0);
  cctx.drawImage(glow, 0, 0);
  cctx.drawImage(outline, 0, 0);
  cctx.drawImage(tinted, 0, 0);
  return combined;
}

export function isTransparent(opts: FxState): boolean {
  return opts.background === "transparent" && opts.effect === "none";
}
