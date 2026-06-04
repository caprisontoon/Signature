import { MATRIX_PALETTE } from "@/lib/constants";
import { mulberry32 } from "./particles";

let cachedTexture: HTMLCanvasElement | null = null;

export function getDarkTexture(W: number, H: number): HTMLCanvasElement {
  if (cachedTexture && cachedTexture.width === W && cachedTexture.height === H) return cachedTexture;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#0a0a0c";
  ctx.fillRect(0, 0, W, H);
  const imgData = ctx.getImageData(0, 0, W, H);
  const rng = mulberry32(42);
  for (let i = 0; i < imgData.data.length; i += 4) {
    const v = rng();
    const n = Math.floor(v * 35);
    imgData.data[i] = 12 + n;
    imgData.data[i + 1] = 12 + n;
    imgData.data[i + 2] = 14 + n;
    imgData.data[i + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);
  for (let i = 0; i < 80; i++) {
    const x = rng() * W, y = rng() * H;
    const r = 20 + rng() * 60;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    const dark = rng() < 0.5;
    grad.addColorStop(0, dark ? "rgba(0,0,0,0.4)" : "rgba(60,55,50,0.15)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.2, W / 2, H / 2, Math.max(W, H) * 0.7);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(0,0,0,0.7)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
  cachedTexture = c;
  return c;
}

export function renderChromeInk(srcCanvas: HTMLCanvasElement, W: number, H: number): HTMLCanvasElement {
  const out = document.createElement("canvas");
  out.width = W; out.height = H;
  const ctx = out.getContext("2d")!;
  ctx.drawImage(srcCanvas, 0, 0);
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "#f5f5f5");
  grad.addColorStop(0.3, "#a8a8a8");
  grad.addColorStop(0.5, "#e8e8e8");
  grad.addColorStop(0.7, "#5a5a5a");
  grad.addColorStop(1, "#cfcfcf");
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = "source-over";
  const glow = document.createElement("canvas");
  glow.width = W; glow.height = H;
  const gctx = glow.getContext("2d")!;
  gctx.filter = "blur(2px)";
  gctx.drawImage(srcCanvas, 0, 0);
  gctx.globalCompositeOperation = "source-in";
  gctx.fillStyle = "rgba(255, 240, 220, 0.5)";
  gctx.fillRect(0, 0, W, H);
  const combined = document.createElement("canvas");
  combined.width = W; combined.height = H;
  const cctx = combined.getContext("2d")!;
  cctx.drawImage(glow, 0, 0);
  cctx.drawImage(out, 0, 0);
  return combined;
}

export function paintMatrixBackground(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7);
  g.addColorStop(0, MATRIX_PALETTE.bgGrad);
  g.addColorStop(1, MATRIX_PALETTE.bg);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}
