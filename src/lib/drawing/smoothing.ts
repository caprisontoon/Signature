import type { Point } from "@/types";

export function smoothStroke(points: Point[], level: number): Point[] {
  const lv = Math.max(0, Math.round(level || 0));
  if (lv === 0 || points.length < 3) return points.slice();
  const minDist = 1.2 * Math.pow(lv, 1.65);
  const iterations = Math.ceil(lv * 0.6);
  let pts = points.slice();
  const simplified: Point[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const last = simplified[simplified.length - 1];
    const dx = pts[i].x - last.x, dy = pts[i].y - last.y;
    if (Math.sqrt(dx * dx + dy * dy) >= minDist || i === pts.length - 1) {
      simplified.push(pts[i]);
    }
  }
  pts = simplified;
  for (let iter = 0; iter < iterations; iter++) {
    if (pts.length < 3) break;
    const result: Point[] = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i], p1 = pts[i + 1];
      result.push({ x: 0.75 * p0.x + 0.25 * p1.x, y: 0.75 * p0.y + 0.25 * p1.y, t: p0.t, p: p0.p });
      result.push({ x: 0.25 * p0.x + 0.75 * p1.x, y: 0.25 * p0.y + 0.75 * p1.y, t: p1.t, p: p1.p });
    }
    result.push(pts[pts.length - 1]);
    pts = result;
  }
  return pts;
}

export function reapplySmoothingFromRaw(strokes: any[], level: number): any[] {
  return strokes.map((s) => {
    const raw = s.rawPoints || s.points;
    return { ...s, rawPoints: raw, points: smoothStroke(raw, level) };
  });
}

export function stepSmooth(current: number, delta: number, max: number): number {
  return Math.min(max, Math.max(0, current + delta));
}
