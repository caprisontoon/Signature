import type { FontDef } from "@/types";

export const SVIP_FOOTER = {
  text: "SVIP Signature Effect",
  bg: "#000028",
  dividerTop: "#D0B888",
  dividerBottom: "rgba(75, 150, 255, 0.25)",
  gold: "#F8C000",
  goldShadow: "#8C6500",
  font: '700 22px "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, sans-serif',
  heightRatio: 0.085,
  minHeight: 44,
  maxHeight: 72,
};

export const FX_PRESETS: Record<
  string,
  { ray: { r: number; g: number; b: number }; star: { r: number; g: number; b: number }; bg: { r: number; g: number; b: number } }
> = {
  "svip-gold":   { ray: { r: 255, g: 200, b: 60 },  star: { r: 255, g: 230, b: 100 }, bg: { r: 80, g: 50, b: 20 } },
  "svip-purple": { ray: { r: 140, g: 100, b: 240 }, star: { r: 180, g: 160, b: 255 }, bg: { r: 30, g: 20, b: 70 } },
  "vip-aqua":    { ray: { r: 80, g: 220, b: 240 },  star: { r: 150, g: 240, b: 255 }, bg: { r: 10, g: 30, b: 60 } },
};

export const STAMP_PALETTE = {
  ink:       "#b21e22",
  inkDeep:   "#7d0e12",
  borderInk: "#a01a1d",
  paper:     "#f3e9d2",
  paperEdge: "#dccaa2",
};

export const FONTS: FontDef[] = [
  { name: "Caveat",      family: '"Caveat", cursive',            size: 110 },
  { name: "Dancing",     family: '"Dancing Script", cursive',    size: 108 },
  { name: "Great Vibes", family: '"Great Vibes", cursive',       size: 130 },
  { name: "Allura",      family: '"Allura", cursive',            size: 130 },
  { name: "Sacramento",  family: '"Sacramento", cursive',        size: 120 },
  { name: "Pinyon",      family: '"Pinyon Script", cursive',     size: 130 },
  { name: "Homemade",    family: '"Homemade Apple", cursive',    size: 90  },
  { name: "나눔손글씨",    family: '"Nanum Pen Script", cursive', size: 130 },
];

export const SMOOTH_MAX_LEVEL = 10;

export const MATRIX_GLYPHS = [
  "○","△","□","×","◇","◯","◎","⬡",
  "0","1","7","9","3","5",
  "A","E","F","I","K","M","S","T","X","Z",
  "+","-","*","/","=","<",">","{","}","[","]",
  "ｱ","ｲ","ｳ","ｴ","ｶ","ｸ","ｺ","ﾅ","ﾆ","ﾑ","ﾐ","ﾒ","ﾗ","ﾘ","ﾙ","ﾜ",
];

export const MATRIX_PALETTE = {
  bg:     "#000d05",
  bgGrad: "#001d10",
  trail:  [0, 230, 80] as [number, number, number],
  leader: [180, 255, 200] as [number, number, number],
  glow:   [0, 255, 110] as [number, number, number],
};

export const BLACK_HOLE_PALETTE = {
  bgInner:  "#0a0a14",
  bgOuter:  "#000000",
  diskHot:  [255, 250, 235] as [number, number, number],
  diskMid:  [255, 195, 110] as [number, number, number],
  diskCool: [180, 80, 25]   as [number, number, number],
  starDust: [220, 220, 240] as [number, number, number],
};

export const FIRE_RING_PALETTE = {
  bgInner:  "#2a160a",
  bgOuter:  "#0a0604",
  ringHot:  [255, 235, 140] as [number, number, number],
  ringMid:  [255, 145, 40]  as [number, number, number],
  ringDeep: [200, 60, 20]   as [number, number, number],
};

export const GALLERY_KEY = "signatures:list";

export const SLACK_WEBHOOK_URL = "PASTE_SLACK_WEBHOOK_URL_HERE";
export const STUDIO_PUBLIC_URL = "";
