// Cinematic helpers: spotlight, radial burst, epic-fire helpers, fire-ring

import { FX_PRESETS, FIRE_RING_PALETTE } from "@/lib/constants";
import { mulberry32 } from "./particles";

export function drawSpotlight(ctx: CanvasRenderingContext2D, W: number, H: number, intensity = 0.6) {
  ctx.save();
  const cx = W / 2, cy = H * 0.15;
  const radius = Math.max(W, H) * 0.7;
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  grad.addColorStop(0, `rgba(255, 250, 235, ${0.35 * intensity})`);
  grad.addColorStop(0.4, `rgba(180, 170, 150, ${0.12 * intensity})`);
  grad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

export function drawRadialBurst(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  W: number, H: number,
  t: number,
  opts: { color: { r: number; g: number; b: number }; count?: number; rotation?: number; intensity?: number }
) {
  const { color, count = 24, rotation = 0, intensity = 1 } = opts;
  const maxLen = Math.hypot(W, H);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation + t * 0.4);
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const len = maxLen * (0.4 + Math.sin(t * Math.PI * 2 + i) * 0.15 + 0.6);
    const w = 6 + Math.sin(t * 8 + i * 1.7) * 4;
    ctx.save();
    ctx.rotate(angle);
    const grad = ctx.createLinearGradient(0, 0, len, 0);
    grad.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${0.6 * intensity})`);
    grad.addColorStop(0.3, `rgba(${color.r}, ${color.g}, ${color.b}, ${0.3 * intensity})`);
    grad.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -w / 2);
    ctx.lineTo(len, -w * 0.2);
    ctx.lineTo(len, w * 0.2);
    ctx.lineTo(0, w / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

export function drawGiantStar(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  size: number,
  t: number,
  opts: { color: { r: number; g: number; b: number }; glow: number }
) {
  const { color, glow } = opts;
  ctx.save();
  for (let layer = 0; layer < 3; layer++) {
    const scale = size * (1 + layer * 0.15);
    const pulse = 0.7 + Math.sin(t * Math.PI * 2 + layer) * 0.15;
    ctx.lineWidth = 8 - layer * 2;
    ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${pulse * (1 - layer * 0.3)})`;
    ctx.shadowBlur = glow * pulse;
    ctx.shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, 0.9)`;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const outer = (i * 2 / 5) * Math.PI - Math.PI / 2;
      const inner = ((i * 2 + 1) / 5) * Math.PI - Math.PI / 2;
      const ox = cx + Math.cos(outer) * scale;
      const oy = cy + Math.sin(outer) * scale;
      const ix = cx + Math.cos(inner) * scale * 0.4;
      const iy = cy + Math.sin(inner) * scale * 0.4;
      if (i === 0) ctx.moveTo(ox, oy);
      else ctx.lineTo(ox, oy);
      ctx.lineTo(ix, iy);
    }
    ctx.closePath();
    ctx.stroke();
  }
  ctx.restore();
}

export function drawRotatingRing(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  radius: number,
  t: number,
  color: { r: number; g: number; b: number }
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.globalCompositeOperation = "lighter";
  ctx.rotate(t * Math.PI * 2);
  ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.5)`;
  ctx.lineWidth = 2;
  ctx.shadowBlur = 20;
  ctx.shadowColor = `rgb(${color.r}, ${color.g}, ${color.b})`;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.save();
  ctx.rotate(-t * Math.PI * 3);
  ctx.fillStyle = `rgba(${color.r + 50}, ${color.g + 50}, ${color.b + 50}, 0.9)`;
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const x = Math.cos(a) * radius * 0.92;
    const y = Math.sin(a) * radius * 0.92;
    const sz = (i % 6 === 0) ? 3 : 1.2;
    ctx.beginPath();
    ctx.arc(x, y, sz, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.7)`;
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 30; i++) {
    const a = (i / 30) * Math.PI * 2;
    const inner = radius * 0.95;
    const outer = radius * 1.03;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
    ctx.lineTo(Math.cos(a) * outer, Math.sin(a) * outer);
    ctx.stroke();
  }
  ctx.shadowBlur = 30;
  const burstAngles = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
  for (const a of burstAngles) {
    const x = Math.cos(a) * radius * 1.05;
    const y = Math.sin(a) * radius * 1.05;
    const pulse = (Math.sin(t * Math.PI * 4 + a) + 1) / 2;
    const sz = 8 + pulse * 10;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, sz);
    grad.addColorStop(0, `rgba(255, 255, 255, ${0.9 * pulse})`);
    grad.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, ${0.5 * pulse})`);
    grad.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, sz, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawLensFlare(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  W: number, H: number,
  t: number,
  color: { r: number; g: number; b: number }
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.globalCompositeOperation = "lighter";
  const pulse = (Math.sin(t * Math.PI * 2) + 1) / 2;
  const reach = Math.max(W, H) * 0.7;
  for (let pass = 0; pass < 2; pass++) {
    ctx.save();
    if (pass === 1) ctx.rotate(Math.PI / 4);
    const a = pass === 0 ? 0.7 : 0.35;
    const horiz = ctx.createLinearGradient(-reach, 0, reach, 0);
    horiz.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
    horiz.addColorStop(0.5, `rgba(255, 255, 255, ${a * (0.6 + pulse * 0.4)})`);
    horiz.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
    ctx.fillStyle = horiz;
    ctx.fillRect(-reach, -1.5, reach * 2, 3);
    const vert = ctx.createLinearGradient(0, -reach, 0, reach);
    vert.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
    vert.addColorStop(0.5, `rgba(255, 255, 255, ${a * (0.6 + pulse * 0.4)})`);
    vert.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
    ctx.fillStyle = vert;
    ctx.fillRect(-1.5, -reach, 3, reach * 2);
    ctx.restore();
  }
  const coreSz = 30 + pulse * 20;
  const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, coreSz);
  coreGrad.addColorStop(0, `rgba(255, 255, 255, ${0.9 * (0.5 + pulse * 0.5)})`);
  coreGrad.addColorStop(0.3, `rgba(${color.r + 80}, ${color.g + 30}, ${color.b}, ${0.6 * (0.5 + pulse * 0.5)})`);
  coreGrad.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(0, 0, coreSz, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawColoredBackground(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  baseColor: { r: number; g: number; b: number }
) {
  ctx.save();
  const grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7);
  grad.addColorStop(0, `rgb(${baseColor.r * 0.6}, ${baseColor.g * 0.6}, ${baseColor.b * 0.6})`);
  grad.addColorStop(1, `rgb(${baseColor.r * 0.15}, ${baseColor.g * 0.15}, ${baseColor.b * 0.15})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

export function drawBackGlow(ctx: CanvasRenderingContext2D, W: number, H: number, t: number, intensity = 1.0) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const breath = 0.85 + 0.15 * Math.sin(t * Math.PI * 2);
  const cx = W * 0.5, cy = H * 0.35;
  const r = Math.max(W, H) * 0.6;
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, `rgba(180, 220, 255, ${0.30 * breath * intensity})`);
  g.addColorStop(0.4, `rgba(110, 160, 230, ${0.14 * breath * intensity})`);
  g.addColorStop(1, "rgba(20, 30, 60, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

export function drawVignette(ctx: CanvasRenderingContext2D, W: number, H: number, strength = 0.55) {
  ctx.save();
  const g = ctx.createRadialGradient(
    W / 2, H / 2, Math.min(W, H) * 0.3,
    W / 2, H / 2, Math.max(W, H) * 0.75
  );
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

export function makeFireRingBlobs(W: number, H: number, count: number, seed: number) {
  const rng = mulberry32(seed);
  const blobs = [];
  for (let i = 0; i < count; i++) {
    blobs.push({
      angle: rng() * Math.PI * 2,
      angularVel: (rng() - 0.5) * 1.4,
      radialOffset: (rng() - 0.5) * 30,
      radialPulseMag: 4 + rng() * 10,
      radialPulseFreq: 0.8 + rng() * 1.6,
      phase: rng() * Math.PI * 2,
      r: 22 + rng() * 50,
      lifeOffset: rng(),
      hueShift: rng(),
    });
  }
  return blobs;
}

export function makeFireRingSparks(W: number, H: number, count: number, seed: number) {
  const rng = mulberry32(seed);
  const sparks = [];
  for (let i = 0; i < count; i++) {
    const angle = rng() * Math.PI * 2;
    const speed = 80 + rng() * 240;
    sparks.push({ angle, speed, r: 1.2 + rng() * 2.5, lifeOffset: rng(), hot: rng() < 0.5 });
  }
  return sparks;
}

export function drawFireRingBlobs(
  ctx: CanvasRenderingContext2D,
  blobs: any[],
  t: number,
  W: number, H: number,
  baseRadius: number,
  intensity: number
) {
  if (!blobs || intensity <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const cx = W / 2, cy = H / 2;
  for (const b of blobs) {
    const angle = b.angle + b.angularVel * t * Math.PI * 2;
    const radialPulse = Math.sin(t * b.radialPulseFreq * 6 + b.phase) * b.radialPulseMag;
    const r = baseRadius + b.radialOffset + radialPulse;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    const blobR = b.r * intensity * (0.85 + 0.15 * Math.sin(t * 12 + b.phase));
    const alpha = intensity * 0.85;
    const g = ctx.createRadialGradient(x, y, 0, x, y, blobR);
    if (b.hueShift < 0.5) {
      g.addColorStop(0,    `rgba(255, 235, 130, ${0.95 * alpha})`);
      g.addColorStop(0.30, `rgba(255, 165, 55,  ${0.80 * alpha})`);
      g.addColorStop(0.60, `rgba(225, 75, 25,   ${0.50 * alpha})`);
    } else {
      g.addColorStop(0,    `rgba(255, 205, 95,  ${0.85 * alpha})`);
      g.addColorStop(0.40, `rgba(235, 105, 35,  ${0.70 * alpha})`);
      g.addColorStop(0.70, `rgba(185, 40, 20,   ${0.40 * alpha})`);
    }
    g.addColorStop(1, "rgba(70, 5, 0, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, blobR, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawGlowRing(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  radius: number,
  t: number,
  alpha: number
) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const cx = W / 2, cy = H / 2;
  ctx.strokeStyle = `rgba(${FIRE_RING_PALETTE.ringHot.join(",")}, ${0.9 * alpha})`;
  ctx.lineWidth = 2;
  ctx.shadowColor = `rgba(${FIRE_RING_PALETTE.ringMid.join(",")}, ${0.8 * alpha})`;
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = `rgba(${FIRE_RING_PALETTE.ringMid.join(",")}, ${0.45 * alpha})`;
  ctx.lineWidth = 5;
  ctx.shadowBlur = 22;
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.restore();
}

export function drawFireRingSparks(
  ctx: CanvasRenderingContext2D,
  sparks: any[],
  t: number,
  W: number, H: number,
  baseRadius: number,
  intensity: number
) {
  if (!sparks || intensity <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const cx = W / 2, cy = H / 2;
  for (const s of sparks) {
    const localT = Math.min(1, (t + s.lifeOffset * 0.3));
    const dist = baseRadius * 0.6 + localT * s.speed * 0.8;
    const x = cx + Math.cos(s.angle) * dist;
    const y = cy + Math.sin(s.angle) * dist + localT * localT * 30;
    const a = (1 - localT) * intensity;
    if (a <= 0) continue;
    ctx.fillStyle = s.hot ? `rgba(255, 240, 180, ${a})` : `rgba(255, 170, 70, ${a * 0.9})`;
    ctx.beginPath();
    ctx.arc(x, y, s.r, 0, Math.PI * 2);
    ctx.fill();
    const g = ctx.createRadialGradient(x, y, 0, x, y, s.r * 5);
    g.addColorStop(0, `rgba(255, 200, 90, ${0.6 * a})`);
    g.addColorStop(1, "rgba(255, 100, 30, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, s.r * 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawFireRingFrame(
  ctx: CanvasRenderingContext2D,
  inkSource: HTMLCanvasElement,
  t: number,
  W: number, H: number,
  cache: any
) {
  const blobs = cache.fireRingBlobs;
  const sparks = cache.fireRingSparks;
  const finalRadius = Math.min(W, H) * 0.32;
  const ringGrowU = Math.min(1, t / 0.20);
  const ringGrowEase = 1 - Math.pow(1 - ringGrowU, 3);
  const ringRadius = finalRadius * ringGrowEase;
  let infernoIntensity: number;
  if (t < 0.20) infernoIntensity = ringGrowEase;
  else if (t < 0.55) infernoIntensity = 1.0;
  else if (t < 0.85) infernoIntensity = 1.0 - (t - 0.55) / 0.30;
  else infernoIntensity = 0;
  let inkAlpha: number;
  if (t < 0.35) inkAlpha = 0;
  else if (t < 0.60) inkAlpha = (t - 0.35) / 0.25;
  else inkAlpha = 1.0;
  const glowAlpha = t < 0.55 ? 0 : Math.min(1, (t - 0.55) / 0.30);
  if (blobs && infernoIntensity > 0 && ringRadius > 0) {
    const half = blobs.slice(0, Math.floor(blobs.length / 2));
    drawFireRingBlobs(ctx, half, t, W, H, ringRadius, infernoIntensity);
  }
  if (inkAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = inkAlpha;
    ctx.drawImage(inkSource, 0, 0);
    ctx.restore();
  }
  if (blobs && infernoIntensity > 0 && ringRadius > 0) {
    const half = blobs.slice(Math.floor(blobs.length / 2));
    drawFireRingBlobs(ctx, half, t, W, H, ringRadius, infernoIntensity);
  }
  if (sparks && t > 0.25) {
    const sparkProgress = (t - 0.25) / 0.55;
    drawFireRingSparks(ctx, sparks, sparkProgress, W, H, finalRadius, Math.max(0, 1 - sparkProgress));
  }
  if (glowAlpha > 0) {
    drawGlowRing(ctx, W, H, finalRadius, t, glowAlpha);
  }
}
