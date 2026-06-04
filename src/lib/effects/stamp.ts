import { STAMP_PALETTE } from "@/lib/constants";
import { mulberry32 } from "./particles";
import { computeInkBBox } from "@/lib/utils";

let _stampNoiseCache: HTMLCanvasElement | null = null;

export function getStampNoiseMask(W: number, H: number): HTMLCanvasElement {
  if (_stampNoiseCache && _stampNoiseCache.width === W && _stampNoiseCache.height === H) {
    return _stampNoiseCache;
  }
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, W, H);
  const rng = mulberry32(91173);
  ctx.globalCompositeOperation = "destination-out";
  for (let i = 0; i < Math.floor(W * H / 60); i++) {
    const x = rng() * W, y = rng() * H;
    const r = 0.5 + rng() * 2.0;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0,0,0,${0.3 + rng() * 0.7})`;
    ctx.fill();
  }
  for (let i = 0; i < 14; i++) {
    const x = rng() * W, y = rng() * H;
    const r = 4 + rng() * 10;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0,0,0,${0.15 + rng() * 0.3})`;
    ctx.fill();
  }
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.lineCap = "round";
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = "rgba(0,0,0,0.4)";
    const x0 = rng() * W, y0 = rng() * H;
    const x1 = x0 + (rng() - 0.5) * W * 0.3;
    const y1 = y0 + (rng() - 0.5) * H * 0.3;
    ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  }
  ctx.globalCompositeOperation = "source-over";
  _stampNoiseCache = c;
  return c;
}

export function drawStampBorder(
  ctx: CanvasRenderingContext2D,
  bbox: { x: number; y: number; w: number; h: number },
  W: number,
  H: number,
  alpha = 1
) {
  if (!bbox) return;
  const padX = Math.max(14, bbox.w * 0.07);
  const padY = Math.max(14, bbox.h * 0.15);
  const x = Math.max(4, bbox.x - padX);
  const y = Math.max(4, bbox.y - padY);
  const w = Math.min(W - x - 4, bbox.w + padX * 2);
  const h = Math.min(H - y - 4, bbox.h + padY * 2);
  ctx.save();
  ctx.globalAlpha = alpha;
  const tmp = document.createElement("canvas");
  tmp.width = W; tmp.height = H;
  const tctx = tmp.getContext("2d")!;
  tctx.strokeStyle = STAMP_PALETTE.borderInk;
  tctx.lineWidth = Math.max(3, Math.min(w, h) * 0.025);
  const r = 4;
  tctx.beginPath();
  tctx.moveTo(x + r, y);
  tctx.lineTo(x + w - r, y);
  tctx.arcTo(x + w, y, x + w, y + r, r);
  tctx.lineTo(x + w, y + h - r);
  tctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  tctx.lineTo(x + r, y + h);
  tctx.arcTo(x, y + h, x, y + h - r, r);
  tctx.lineTo(x, y + r);
  tctx.arcTo(x, y, x + r, y, r);
  tctx.closePath();
  tctx.stroke();
  tctx.globalCompositeOperation = "destination-in";
  tctx.drawImage(getStampNoiseMask(W, H), 0, 0);
  ctx.drawImage(tmp, 0, 0);
  ctx.restore();
}

export function renderStampInk(srcCanvas: HTMLCanvasElement, W: number, H: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d")!;
  const inkLayer = document.createElement("canvas");
  inkLayer.width = W; inkLayer.height = H;
  const ictx = inkLayer.getContext("2d")!;
  ictx.drawImage(srcCanvas, 0, 0);
  ictx.globalCompositeOperation = "source-in";
  ictx.fillStyle = STAMP_PALETTE.ink;
  ictx.fillRect(0, 0, W, H);
  ictx.globalCompositeOperation = "destination-in";
  ictx.drawImage(getStampNoiseMask(W, H), 0, 0);
  const bbox = computeInkBBox(srcCanvas);
  if (bbox) {
    drawStampBorder(ctx, bbox, W, H, 1);
  }
  ctx.drawImage(inkLayer, 0, 0);
  ctx.globalCompositeOperation = "source-atop";
  ctx.fillStyle = "rgba(0,0,0,0.10)";
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = "source-over";
  return c;
}

export function makeStampDebris(
  W: number,
  H: number,
  bbox: { x: number; y: number; w: number; h: number } | null,
  seed = 31337
) {
  const rng = mulberry32(seed);
  const debris: any[] = [];
  if (!bbox) return debris;
  const cx = bbox.x + bbox.w / 2;
  const cy = bbox.y + bbox.h * 0.92;
  const count = 26;
  for (let i = 0; i < count; i++) {
    const angle = -Math.PI + rng() * Math.PI;
    const speed = 60 + rng() * 180;
    debris.push({
      x: cx + (rng() - 0.5) * bbox.w * 0.5,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed * 0.6,
      r: 1.2 + rng() * 2.6,
      life: 0.6 + rng() * 0.4,
      color: rng() < 0.55 ? STAMP_PALETTE.ink : "#5a3920",
    });
  }
  return debris;
}

export function drawStampDebris(
  ctx: CanvasRenderingContext2D,
  debris: any[],
  u: number,
  W: number,
  H: number
) {
  if (!debris || debris.length === 0) return;
  ctx.save();
  for (const d of debris) {
    const lt = Math.min(1, u / d.life);
    const ease = 1 - Math.pow(1 - lt, 2);
    const x = d.x + d.vx * ease * 0.35;
    const y = d.y + d.vy * ease * 0.35 + ease * ease * 60;
    const alpha = Math.max(0, 1 - lt);
    ctx.fillStyle = d.color;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(x, y, d.r * (1 - lt * 0.5), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawStampShockwave(
  ctx: CanvasRenderingContext2D,
  bbox: { x: number; y: number; w: number; h: number } | null,
  t: number,
  W: number,
  H: number
) {
  if (!bbox) return;
  const cx = bbox.x + bbox.w / 2;
  const cy = bbox.y + bbox.h / 2;
  const maxR = Math.max(bbox.w, bbox.h) * 1.4;
  const r = maxR * t;
  const alpha = (1 - t) * 0.55;
  ctx.save();
  ctx.strokeStyle = `rgba(178, 30, 34, ${alpha})`;
  ctx.lineWidth = 2 + (1 - t) * 4;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export function drawStampFrame(
  ctx: CanvasRenderingContext2D,
  inkSource: HTMLCanvasElement,
  t: number,
  W: number,
  H: number,
  cache: any
) {
  const bbox = cache.stampBBox;
  const cx = (bbox ? bbox.x + bbox.w / 2 : W / 2);
  const cy = (bbox ? bbox.y + bbox.h / 2 : H / 2);

  if (t < 0.10) {
    const u = t / 0.10;
    const offsetY = -H * 0.55 + u * 8;
    const alpha = 0.55 + u * 0.10;
    const scale = 1.40;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(cx, cy + offsetY);
    ctx.scale(scale, scale);
    ctx.translate(-cx, -cy);
    ctx.drawImage(inkSource, 0, 0);
    ctx.restore();
    if (bbox) {
      ctx.save();
      ctx.globalAlpha = 0.12 + u * 0.05;
      const sr = bbox.w * 1.05;
      const sx = cx, sy = bbox.y + bbox.h * 0.95;
      const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
      g.addColorStop(0, "rgba(20,10,5,0.5)");
      g.addColorStop(1, "rgba(20,10,5,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(sx, sy, sr, sr * 0.32, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    return;
  }

  if (t < 0.30) {
    const u = (t - 0.10) / 0.20;
    const eased = u * u * u * u * u;
    const startScale = 1.40;
    const endScale = 1.05;
    const scale = startScale + (endScale - startScale) * eased;
    const startOffsetY = -H * 0.55 + 8;
    const offsetY = startOffsetY * (1 - eased);
    const alpha = 0.65 + 0.35 * eased;
    if (bbox) {
      ctx.save();
      ctx.globalAlpha = 0.17 + 0.40 * eased;
      const sx = cx, sy = bbox.y + bbox.h * 0.95;
      const sr = bbox.w * (1.10 - 0.45 * eased);
      const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
      g.addColorStop(0, "rgba(15,8,4,0.65)");
      g.addColorStop(1, "rgba(15,8,4,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(sx, sy, sr, sr * 0.32, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.save();
    const blurSteps = 4;
    for (let i = 0; i < blurSteps; i++) {
      const k = i / blurSteps;
      const trailOffset = offsetY - eased * 24 * k;
      ctx.globalAlpha = alpha * (0.30 - k * 0.06);
      ctx.translate(cx, cy + trailOffset);
      ctx.scale(scale, scale);
      ctx.translate(-cx, -cy);
      ctx.drawImage(inkSource, 0, 0);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(cx, cy + offsetY);
    ctx.scale(scale, scale);
    ctx.translate(-cx, -cy);
    ctx.drawImage(inkSource, 0, 0);
    ctx.restore();
    return;
  }

  if (t < 0.36) {
    const u = (t - 0.30) / 0.06;
    const squashY = 1.0 - (1 - Math.abs(2 * u - 1)) * 0.12;
    const squashX = 1.0 + (1 - Math.abs(2 * u - 1)) * 0.08;
    const shakeMag = (1 - u) * 6;
    const shakeX = (Math.random() - 0.5) * shakeMag;
    const shakeY = (Math.random() - 0.5) * shakeMag;
    ctx.save();
    ctx.translate(shakeX, shakeY);
    ctx.translate(cx, cy);
    ctx.scale(squashX, squashY);
    ctx.translate(-cx, -cy);
    ctx.drawImage(inkSource, 0, 0);
    ctx.restore();
    drawStampShockwave(ctx, bbox, Math.min(1, u * 1.6), W, H);
    drawStampShockwave(ctx, bbox, Math.min(1, u * 0.9), W, H);
    if (!cache.stampDebris && bbox) {
      cache.stampDebris = makeStampDebris(W, H, bbox, cache.stampSeed || 31337);
    }
    drawStampDebris(ctx, cache.stampDebris, u, W, H);
    const flashAlpha = Math.pow(1 - u, 2) * 0.7;
    if (flashAlpha > 0.01) {
      ctx.save();
      ctx.fillStyle = `rgba(255,255,255,${flashAlpha})`;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
    return;
  }

  if (t < 0.50) {
    const u = (t - 0.36) / 0.14;
    const bounce = Math.sin(u * Math.PI) * 0.025 * (1 - u);
    const scale = 1.0 + bounce;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.translate(-cx, -cy);
    ctx.drawImage(inkSource, 0, 0);
    ctx.restore();
    if (cache.stampDebris) {
      drawStampDebris(ctx, cache.stampDebris, 1 + u * 0.5, W, H);
    }
    return;
  }

  ctx.drawImage(inkSource, 0, 0);
}
