import type { Stroke, Point } from "@/types";
import { smoothStroke } from "./smoothing";

export function getPointerPos(e: MouseEvent | TouchEvent | PointerEvent, canvas: HTMLCanvasElement): Point {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const evt = (e as TouchEvent).touches ? (e as TouchEvent).touches[0] : (e as MouseEvent | PointerEvent);
  return {
    x: (evt.clientX - rect.left) * scaleX,
    y: (evt.clientY - rect.top) * scaleY,
    t: performance.now(),
    p: (e as PointerEvent).pressure || 0.5,
  };
}

export function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  if (stroke.points.length < 2) return;
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
  for (let i = 1; i < stroke.points.length - 1; i++) {
    const xc = (stroke.points[i].x + stroke.points[i + 1].x) / 2;
    const yc = (stroke.points[i].y + stroke.points[i + 1].y) / 2;
    ctx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, xc, yc);
  }
  const last = stroke.points[stroke.points.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.stroke();
}

export function redrawAll(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, strokes: Stroke[]) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  strokes.forEach((s) => drawStroke(ctx, s));
}

export function startDraw(
  e: MouseEvent | TouchEvent | PointerEvent,
  canvas: HTMLCanvasElement,
  drawing: { value: boolean },
  currentStroke: { value: Stroke | null },
  undoStack: { value: Stroke[] },
  inkColor: string,
  strokeWidth: number
) {
  e.preventDefault();
  drawing.value = true;
  const pt = getPointerPos(e, canvas);
  currentStroke.value = { color: inkColor, width: strokeWidth, points: [pt] };
  undoStack.value = [];
}

export function moveDraw(
  e: MouseEvent | TouchEvent | PointerEvent,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  drawing: { value: boolean },
  currentStroke: { value: Stroke | null }
) {
  if (!drawing.value || !currentStroke.value) return;
  e.preventDefault();
  const pt = getPointerPos(e, canvas);
  currentStroke.value.points.push(pt);
  const pts = currentStroke.value.points;
  const i1 = pts.length - 2;
  const i2 = pts.length - 1;
  if (i1 < 0) return;
  const p1 = pts[i1], p2 = pts[i2];
  ctx.strokeStyle = currentStroke.value.color;
  ctx.lineWidth = currentStroke.value.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();
}

export function endDraw(
  e: MouseEvent | TouchEvent | PointerEvent,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  drawing: { value: boolean },
  currentStroke: { value: Stroke | null },
  strokes: Stroke[],
  smoothLevel: number
) {
  if (!drawing.value) return;
  drawing.value = false;
  if (currentStroke.value && currentStroke.value.points.length > 1) {
    currentStroke.value.rawPoints = currentStroke.value.points.slice();
    currentStroke.value.points = smoothStroke(currentStroke.value.rawPoints, smoothLevel);
    strokes.push(currentStroke.value);
    redrawAll(ctx, canvas, strokes);
  }
  currentStroke.value = null;
}
