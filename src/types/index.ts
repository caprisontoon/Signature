// ─────────────────────────────────────────────
// Shared types for SVIP Signature Effect Studio
// ─────────────────────────────────────────────

export type ViewId = "draw" | "type" | "photo" | "gallery";

export type EffectId =
  | "none"
  | "custom-video"
  | "stamp"
  | "epic-fire"
  | "matrix"
  | "sparks"
  | "cinematic"
  | "svip-gold"
  | "svip-purple"
  | "vip-aqua";

export type InkStyle =
  | "plain"
  | "chrome"
  | "stamp"
  | "gold"
  | "purple-chrome"
  | "aqua-chrome"
  | "matrix-green";

export type OutputFormat = "gif" | "mp4" | "webm";

export interface Point {
  x: number;
  y: number;
  t: number;
  p: number;
}

export interface Stroke {
  color: string;
  width: number;
  points: Point[];
  rawPoints?: Point[];
}

export interface FxState {
  background: "transparent" | "image" | "texture";
  bgImage: HTMLImageElement | null;
  effect: EffectId;
  inkStyle: InkStyle;
  _outputFormat?: OutputFormat;
  _videoFrame?: HTMLCanvasElement;
}

export interface ParticleCache {
  sparks?: any[];
  dust?: any[];
  stars?: any[];
  confetti?: any[];
  streaks?: any[];
  pixels?: any[];
  fireBlobs?: any[];
  embers?: any[];
  matrix?: any;
  stampBBox?: BBox | null;
  stampSeed?: number;
  stampDebris?: any[];
  fireRingBlobs?: any[];
  fireRingSparks?: any[];
}

export interface BBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface GalleryEntry {
  id: string;
  name: string;
  dataURL: string;
  createdAt: string;
}

export interface FxVideoState {
  url: string;
  el: HTMLVideoElement;
  frames: HTMLCanvasElement[] | null;
  name: string;
  w: number;
  h: number;
}

export interface FramePlan {
  renderFrame: (ctx: CanvasRenderingContext2D, t: number) => void;
  totalFrames: number;
  W: number;
  H: number;
  outH: number;
}

export interface FontDef {
  name: string;
  family: string;
  size: number;
}
