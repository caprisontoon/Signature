// Particle systems: spark, dust, star, confetti, streak, pixel, fire, ember, matrix

import { MATRIX_GLYPHS, MATRIX_PALETTE } from "@/lib/constants";

// Deterministic PRNG
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeSparkSystem(W: number, H: number, count: number, seed: number) {
  const rng = mulberry32(seed);
  const sparks = [];
  for (let i = 0; i < count; i++) {
    sparks.push({
      x0: rng() * W,
      y0: H + rng() * 50,
      vx: (rng() - 0.5) * 0.6,
      vy: -(0.5 + rng() * 1.5),
      life: 0.4 + rng() * 0.8,
      birth: rng() * 0.8,
      size: 1 + rng() * 2.5,
      hue: 18 + rng() * 18,
    });
  }
  return sparks;
}

export function makeDustSystem(W: number, H: number, count: number, seed: number) {
  const rng = mulberry32(seed);
  const dust = [];
  for (let i = 0; i < count; i++) {
    dust.push({
      x0: rng() * W,
      y0: rng() * H,
      vx: (rng() - 0.5) * 0.3,
      vy: 0.2 + rng() * 0.8,
      size: 0.6 + rng() * 1.8,
      birth: rng(),
      twinkle: rng() * Math.PI * 2,
      bright: 0.4 + rng() * 0.6,
    });
  }
  return dust;
}

export function makeStarSprites(W: number, H: number, count: number, seed: number) {
  const rng = mulberry32(seed);
  const stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: rng() * W,
      y: rng() * H,
      size: 2 + rng() * 5,
      phase: rng() * Math.PI * 2,
      speed: 1 + rng() * 2,
      birth: rng() * 0.5,
    });
  }
  return stars;
}

export function makeConfetti(W: number, H: number, count: number, seed: number) {
  const rng = mulberry32(seed);
  const cx = W / 2, cy = H / 2;
  const palette = [
    { r: 255, g: 90,  b: 130 },
    { r: 100, g: 220, b: 255 },
    { r: 255, g: 215, b: 70  },
    { r: 140, g: 255, b: 130 },
    { r: 255, g: 150, b: 60  },
    { r: 220, g: 130, b: 255 },
  ];
  const pieces = [];
  for (let i = 0; i < count; i++) {
    const angle = rng() * Math.PI * 2;
    const speed = 0.5 + rng() * 1.5;
    pieces.push({
      cx, cy, angle, speed,
      birth: rng() * 0.3,
      life: 0.6 + rng() * 0.4,
      length: 8 + rng() * 18,
      width: 1.5 + rng() * 2.5,
      color: palette[Math.floor(rng() * palette.length)],
      spin: rng() * Math.PI * 2,
      spinSpeed: (rng() - 0.5) * 4,
    });
  }
  return pieces;
}

export function makeVerticalStreaks(W: number, H: number, count: number, seed: number) {
  const rng = mulberry32(seed);
  const streaks = [];
  for (let i = 0; i < count; i++) {
    streaks.push({
      x: rng() * W,
      offset: rng(),
      speed: 0.5 + rng() * 1.5,
      length: 40 + rng() * 120,
      width: 2 + rng() * 4,
      bright: 0.5 + rng() * 0.5,
    });
  }
  return streaks;
}

export function makePixelRain(W: number, H: number, count: number, seed: number) {
  const rng = mulberry32(seed);
  const drops = [];
  for (let i = 0; i < count; i++) {
    const purple = rng() < 0.6;
    drops.push({
      x: Math.floor(rng() * W / 8) * 8,
      offset: rng(),
      speed: 0.4 + rng() * 1.2,
      length: 30 + Math.floor(rng() * 6) * 12,
      cellH: 6 + Math.floor(rng() * 3) * 2,
      brightness: 0.4 + rng() * 0.6,
      color: purple ? { r: 160, g: 130, b: 255 } : { r: 100, g: 200, b: 255 },
    });
  }
  return drops;
}

export function makeFireBlobs(W: number, H: number, count: number, seed: number) {
  const rng = mulberry32(seed);
  const blobs = [];
  for (let i = 0; i < count; i++) {
    blobs.push({
      baseX: 0.05 * W + rng() * 0.9 * W,
      baseY: H * (0.85 + rng() * 0.20),
      vy: 30 + rng() * 90,
      swayMag: 8 + rng() * 18,
      swayFreq: 0.6 + rng() * 1.6,
      phase: rng() * Math.PI * 2,
      r: 26 + rng() * 60,
      lifeOffset: rng(),
      hueShift: rng(),
    });
  }
  return blobs;
}

export function makeEmbers(W: number, H: number, count: number, seed: number) {
  const rng = mulberry32(seed);
  const embers = [];
  for (let i = 0; i < count; i++) {
    embers.push({
      x: rng() * W,
      y: H * (0.5 + rng() * 0.5),
      vy: 20 + rng() * 80,
      vx: (rng() - 0.5) * 30,
      r: 0.6 + rng() * 1.6,
      lifeOffset: rng(),
      blinkPhase: rng() * Math.PI * 2,
      blinkFreq: 2 + rng() * 6,
    });
  }
  return embers;
}

export function makeMatrixColumns(W: number, H: number, seed: number) {
  const rng = mulberry32(seed);
  const targetCols = 26;
  const cellW = Math.max(14, Math.round(W / targetCols));
  const cellH = Math.max(16, Math.round(cellW * 1.05));
  const cols = Math.ceil(W / cellW) + 1;
  const rows = Math.ceil(H / cellH) + 2;
  const columns = [];
  for (let c = 0; c < cols; c++) {
    columns.push({
      x: c * cellW,
      cellW,
      cellH,
      trailLen: 8 + Math.floor(rng() * 14),
      speed: 0.5 + rng() * 1.2,
      offset: rng() * rows * 2,
      brightness: 0.55 + rng() * 0.45,
      seed: Math.floor(rng() * 2147483647),
      flickerPhase: rng() * Math.PI * 2,
    });
  }
  return { columns, cellW, cellH, rows, cols };
}

// Draw functions
export function drawSparks(ctx: CanvasRenderingContext2D, sparks: any[], t: number, W: number, H: number) {
  ctx.save();
  for (const s of sparks) {
    const local = (t - s.birth) / s.life;
    if (local < 0 || local > 1) continue;
    const x = s.x0 + s.vx * local * 200;
    const y = s.y0 + s.vy * local * 200;
    const a = local < 0.1 ? local / 0.1 : 1 - (local - 0.1) / 0.9;
    if (a <= 0) continue;
    const sz = s.size * (1 + (1 - local) * 0.3);
    const grad = ctx.createRadialGradient(x, y, 0, x, y, sz * 4);
    grad.addColorStop(0, `hsla(${s.hue}, 100%, 70%, ${a})`);
    grad.addColorStop(0.4, `hsla(${s.hue - 5}, 100%, 50%, ${a * 0.5})`);
    grad.addColorStop(1, `hsla(${s.hue - 10}, 100%, 30%, 0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, sz * 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `hsla(${s.hue + 20}, 100%, 90%, ${a})`;
    ctx.beginPath();
    ctx.arc(x, y, sz * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawDust(ctx: CanvasRenderingContext2D, dust: any[], t: number, W: number, H: number) {
  ctx.save();
  for (const d of dust) {
    const local = (t * 1.2 + d.birth) % 1;
    const x = ((d.x0 + d.vx * local * 300) % W + W) % W;
    const y = (d.y0 + d.vy * local * H) % H;
    const tw = Math.sin(t * Math.PI * 4 + d.twinkle) * 0.3 + 0.7;
    const a = d.bright * tw * 0.6;
    ctx.fillStyle = `rgba(255, 252, 240, ${a})`;
    ctx.beginPath();
    ctx.arc(x, y, d.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawStarSprites(ctx: CanvasRenderingContext2D, stars: any[], t: number, color: { r: number; g: number; b: number }) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const s of stars) {
    const tt = (t + s.birth) % 1;
    const twink = (Math.sin(tt * Math.PI * 2 * s.speed + s.phase) + 1) / 2;
    const a = twink * 0.9;
    if (a < 0.05) continue;
    const sz = s.size * (0.7 + twink * 0.6);
    ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${a})`;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y - sz * 2);
    ctx.lineTo(s.x + sz * 0.4, s.y - sz * 0.4);
    ctx.lineTo(s.x + sz * 2, s.y);
    ctx.lineTo(s.x + sz * 0.4, s.y + sz * 0.4);
    ctx.lineTo(s.x, s.y + sz * 2);
    ctx.lineTo(s.x - sz * 0.4, s.y + sz * 0.4);
    ctx.lineTo(s.x - sz * 2, s.y);
    ctx.lineTo(s.x - sz * 0.4, s.y - sz * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = `rgba(255, 255, 255, ${a * 0.9})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, sz * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawConfetti(ctx: CanvasRenderingContext2D, pieces: any[], t: number, W: number, H: number) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const p of pieces) {
    const local = (t - p.birth) / p.life;
    if (local < 0 || local > 1) continue;
    const dist = local * p.speed * Math.max(W, H) * 0.7;
    const x = p.cx + Math.cos(p.angle) * dist;
    const y = p.cy + Math.sin(p.angle) * dist;
    const a = local < 0.15 ? local / 0.15 : 1 - (local - 0.15) / 0.85;
    if (a <= 0) continue;
    const angle = p.spin + t * p.spinSpeed;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    const c = p.color;
    const grad = ctx.createLinearGradient(-p.length, 0, 0, 0);
    grad.addColorStop(0, `rgba(${c.r}, ${c.g}, ${c.b}, 0)`);
    grad.addColorStop(1, `rgba(${c.r}, ${c.g}, ${c.b}, ${a})`);
    ctx.fillStyle = grad;
    ctx.fillRect(-p.length, -p.width / 2, p.length, p.width);
    ctx.fillStyle = `rgba(255, 255, 255, ${a * 0.8})`;
    ctx.fillRect(-p.width, -p.width / 2, p.width * 1.5, p.width);
    ctx.restore();
  }
  ctx.restore();
}

export function drawVerticalStreaks(
  ctx: CanvasRenderingContext2D,
  streaks: any[],
  t: number,
  W: number,
  H: number,
  color: { r: number; g: number; b: number }
) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const s of streaks) {
    const yProgress = ((t * s.speed + s.offset) % 1) * (H + s.length) - s.length;
    const grad = ctx.createLinearGradient(s.x, yProgress, s.x, yProgress + s.length);
    grad.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
    grad.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, ${0.7 * s.bright})`);
    grad.addColorStop(1, `rgba(255, 255, 255, ${0.9 * s.bright})`);
    ctx.fillStyle = grad;
    ctx.fillRect(s.x - s.width / 2, yProgress, s.width, s.length);
    for (let i = 0; i < 4; i++) {
      const dotY = yProgress + (i / 4) * s.length;
      const dotA = (i / 4) * s.bright * 0.8;
      ctx.fillStyle = `rgba(${color.r + 30}, ${color.g + 30}, ${color.b + 30}, ${dotA})`;
      ctx.beginPath();
      ctx.arc(s.x, dotY, s.width * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

export function drawPixelRain(ctx: CanvasRenderingContext2D, drops: any[], t: number, W: number, H: number) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const d of drops) {
    const totalH = H + d.length;
    const yHead = ((t * d.speed + d.offset) % 1) * totalH - d.length;
    const cellCount = Math.floor(d.length / d.cellH);
    for (let i = 0; i < cellCount; i++) {
      const cy = yHead + i * d.cellH;
      if (cy < -d.cellH || cy > H) continue;
      const fadeIn = (cellCount - i) / cellCount;
      const a = d.brightness * fadeIn * fadeIn;
      if (i === cellCount - 1) {
        ctx.fillStyle = `rgba(255, 255, 255, ${a})`;
      } else {
        ctx.fillStyle = `rgba(${d.color.r}, ${d.color.g}, ${d.color.b}, ${a})`;
      }
      ctx.fillRect(d.x, cy, 6, d.cellH - 1);
    }
  }
  ctx.restore();
}

export function drawFireBlobs(
  ctx: CanvasRenderingContext2D,
  blobs: any[],
  t: number,
  W: number,
  H: number,
  intensity = 1.0
) {
  if (!blobs) return;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const b of blobs) {
    const localT = ((t * 0.8 + b.lifeOffset) % 1);
    const rise = localT * H * 0.55;
    const sway = Math.sin(t * b.swayFreq * 6 + b.phase) * b.swayMag;
    const x = b.baseX + sway;
    const y = b.baseY - rise;
    const r = b.r * (1.0 - localT * 0.45) * intensity;
    const alpha = (1 - localT) * 0.75 * intensity;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    if (b.hueShift < 0.5) {
      g.addColorStop(0,    `rgba(255, 235, 130, ${0.95 * alpha})`);
      g.addColorStop(0.25, `rgba(255, 170, 60,  ${0.80 * alpha})`);
      g.addColorStop(0.55, `rgba(230, 80, 30,   ${0.55 * alpha})`);
    } else {
      g.addColorStop(0,    `rgba(255, 200, 90,  ${0.85 * alpha})`);
      g.addColorStop(0.35, `rgba(240, 110, 40,  ${0.70 * alpha})`);
      g.addColorStop(0.65, `rgba(190, 40, 20,   ${0.45 * alpha})`);
    }
    g.addColorStop(1, "rgba(80, 5, 0, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawEmbers(
  ctx: CanvasRenderingContext2D,
  embers: any[],
  t: number,
  W: number,
  H: number,
  intensity = 1.0
) {
  if (!embers) return;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const e of embers) {
    const localT = ((t * 0.6 + e.lifeOffset) % 1);
    const rise = localT * H * 0.75;
    const drift = Math.sin(t * 4 + e.blinkPhase) * 8;
    const x = e.x + drift + e.vx * localT * 0.3;
    const y = e.y - rise;
    const twinkle = 0.6 + 0.4 * Math.sin(t * e.blinkFreq * 6 + e.blinkPhase);
    const alpha = (1 - localT) * twinkle * intensity;
    const gr = e.r * 4;
    const g = ctx.createRadialGradient(x, y, 0, x, y, gr);
    g.addColorStop(0, `rgba(255, 240, 180, ${0.95 * alpha})`);
    g.addColorStop(0.3, `rgba(255, 170, 60, ${0.6 * alpha})`);
    g.addColorStop(1, "rgba(255, 100, 30, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, gr, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(255, 250, 220, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, e.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function matrixGlyphAt(col: any, cellIdx: number, tSlice: number): string {
  const k = (col.seed ^ (cellIdx * 73856093) ^ (tSlice * 19349663)) >>> 0;
  return MATRIX_GLYPHS[k % MATRIX_GLYPHS.length];
}

export function drawMatrixRain(
  ctx: CanvasRenderingContext2D,
  columnsData: any,
  t: number,
  W: number,
  H: number
) {
  if (!columnsData) return;
  const { columns, cellH, rows } = columnsData;
  const tSlice = Math.floor(t * 8);
  ctx.save();
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  for (const col of columns) {
    const headCells = col.offset + t * col.speed * (rows + col.trailLen) * 2;
    const headCellInt = Math.floor(headCells);
    const subY = (headCells - headCellInt) * col.cellH;
    const flicker = 0.88 + 0.12 * Math.sin(t * 16 + col.flickerPhase);
    ctx.font = `bold ${Math.round(col.cellH * 0.78)}px "Consolas", "Menlo", "JetBrains Mono", monospace`;
    for (let i = col.trailLen - 1; i >= 0; i--) {
      const cellIdx = headCellInt - i;
      const y = (cellIdx * col.cellH) - subY + col.cellH / 2;
      if (y < -col.cellH || y > H + col.cellH) continue;
      const x = col.x + col.cellW / 2;
      const glyph = matrixGlyphAt(col, cellIdx, tSlice);
      const fade = Math.pow(1 - i / col.trailLen, 1.6);
      const intensity = fade * flicker * col.brightness;
      if (i === 0) {
        ctx.shadowColor = `rgba(${MATRIX_PALETTE.glow.join(",")}, ${0.9 * intensity})`;
        ctx.shadowBlur = 14;
        ctx.fillStyle = `rgba(${MATRIX_PALETTE.leader.join(",")}, ${Math.min(1, intensity + 0.2)})`;
      } else if (i < 3) {
        ctx.shadowColor = `rgba(${MATRIX_PALETTE.glow.join(",")}, ${0.55 * intensity})`;
        ctx.shadowBlur = 6;
        ctx.fillStyle = `rgba(${MATRIX_PALETTE.trail.join(",")}, ${intensity})`;
      } else {
        ctx.shadowBlur = 0;
        ctx.fillStyle = `rgba(${MATRIX_PALETTE.trail.join(",")}, ${intensity * 0.85})`;
      }
      ctx.fillText(glyph, x, y);
    }
  }
  ctx.shadowBlur = 0;
  ctx.restore();
}
