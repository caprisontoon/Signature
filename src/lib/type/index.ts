import type { FontDef } from "@/types";

interface TypeOptions {
  text: string;
  font: FontDef;
  stroke: number;
  slant: number;
  flourish: string;
  inkColor?: string;
}

export function renderTypeOnContext(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  opts: TypeOptions
) {
  const { text, font, stroke, slant, flourish, inkColor = "#0f0e0c" } = opts;
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate(slant * Math.PI / 180);
  let fontSize = font.size;
  ctx.font = `${fontSize}px ${font.family}`;
  let w = ctx.measureText(text).width;
  if (w > W - 80) {
    fontSize = font.size * ((W - 80) / w);
    ctx.font = `${fontSize}px ${font.family}`;
    w = ctx.measureText(text).width;
  }
  ctx.fillStyle = inkColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 0, 0);
  if (stroke > 1) {
    ctx.strokeStyle = inkColor;
    ctx.lineWidth = (stroke - 1) * 0.4;
    ctx.strokeText(text, 0, 0);
  }
  ctx.strokeStyle = inkColor;
  ctx.lineWidth = stroke * 0.7;
  ctx.lineCap = "round";
  if (flourish === "underline") {
    ctx.beginPath();
    const y = fontSize * 0.45;
    const startX = -w / 2 - 10, endX = w / 2 + 10;
    ctx.moveTo(startX, y);
    ctx.bezierCurveTo(startX + (endX - startX) * 0.3, y + 10, startX + (endX - startX) * 0.7, y - 6, endX, y + 2);
    ctx.stroke();
  } else if (flourish === "loop") {
    ctx.beginPath();
    const y = fontSize * 0.45;
    const cx = w / 2 + 30, cy = y;
    ctx.moveTo(-w / 2 - 20, y - 5);
    ctx.bezierCurveTo(-w / 2, y + 15, w / 4, y - 5, cx - 25, cy);
    ctx.arc(cx, cy, 14, Math.PI, Math.PI * 3, false);
    ctx.lineTo(cx + 30, cy - 8);
    ctx.stroke();
  } else if (flourish === "swash") {
    ctx.beginPath();
    const y = -fontSize * 0.3;
    ctx.moveTo(-w / 2 - 30, y);
    ctx.bezierCurveTo(-w / 2 - 50, y - 30, -w / 2 - 60, y + 20, -w / 2 - 10, y + 10);
    ctx.stroke();
    ctx.beginPath();
    const y2 = fontSize * 0.4;
    ctx.moveTo(w / 2 + 5, y2);
    ctx.bezierCurveTo(w / 2 + 40, y2 + 20, w / 2 + 60, y2 - 20, w / 2 + 25, y2 - 30);
    ctx.stroke();
  } else if (flourish === "dot") {
    ctx.beginPath();
    ctx.arc(w / 2 + 14, fontSize * 0.3, stroke * 1.4, 0, Math.PI * 2);
    ctx.fillStyle = inkColor;
    ctx.fill();
  }
  ctx.restore();
}

export function renderTypeToTransparentCanvas(
  opts: TypeOptions,
  width = 800,
  height = 320
): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = width; c.height = height;
  const ctx = c.getContext("2d")!;
  renderTypeOnContext(ctx, width, height, opts);
  return c;
}

export function renderType(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  opts: TypeOptions
) {
  renderTypeOnContext(ctx, canvas.width, canvas.height, opts);
}
