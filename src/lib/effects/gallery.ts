// FX_CARD_META, initEffectGallery, _fxLoop
import type { FxState, ParticleCache } from "@/types";
import {
  buildParticleCache, paintBackground, applyBackEffects, applyFrontEffects,
  renderStyledInk, inkStyleFor, _fxBgImage,
} from "./index";
import { drawStampFrame } from "./stamp";
import { computeInkBBox } from "@/lib/utils";

export const FX_CARD_META = [
  { id: "none",         label: "— 없음",    sub: "효과 끄기" },
  { id: "custom-video", label: "내 영상",   sub: "영상 업로드" },
  { id: "stamp",        label: "Stamp",     sub: "도장 · 낙관" },
  { id: "epic-fire",    label: "Epic Fire", sub: "불꽃 시네마틱" },
  { id: "matrix",       label: "Matrix",    sub: "디지털 레인" },
  { id: "sparks",       label: "Sparks",    sub: "불꽃" },
  { id: "cinematic",    label: "Cinematic", sub: "시네마틱" },
  { id: "svip-gold",    label: "SVIP Gold", sub: "황금 별빛" },
  { id: "svip-purple",  label: "SVIP Purple", sub: "보랏빛 광선" },
  { id: "vip-aqua",     label: "VIP Aqua",  sub: "청록 링" },
] as const;

interface FxCard {
  effectId: string;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  fx: FxState;
  cache: ParticleCache;
  themedInk: HTMLCanvasElement;
}

let _fxCards: FxCard[] = [];
let _fxClockStart = 0;
let _fxRafId: number | null = null;
let _fxLastFrameMs = 0;
const _FX_FPS = 30;

function _buildFxCardThemedInk(W: number, H: number, fx: FxState): HTMLCanvasElement {
  const tmpC = document.createElement("canvas");
  tmpC.width = W; tmpC.height = H;
  const tctx = tmpC.getContext("2d")!;
  tctx.font = "italic 22px 'Caveat', cursive";
  tctx.textAlign = "center";
  tctx.textBaseline = "middle";
  tctx.fillStyle = (fx.background === "transparent" && fx.effect === "none") ? "#0f0e0c" : "#f0f0f0";
  tctx.fillText("Signature", W / 2, H / 2);
  return renderStyledInk(tmpC, W, H, fx.inkStyle);
}

function _renderFxCardFrame(card: FxCard, t: number) {
  const { canvas, ctx, fx, cache, themedInk } = card;
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  paintBackground(ctx, W, H, fx);
  applyBackEffects(ctx, W, H, t, fx, cache);
  if (fx.effect === "stamp") {
    drawStampFrame(ctx, themedInk, t, W, H, cache);
  } else {
    ctx.drawImage(themedInk, 0, 0);
  }
  applyFrontEffects(ctx, W, H, t, fx, cache);
}

export function _fxLoop(nowMs: number) {
  _fxRafId = requestAnimationFrame(_fxLoop);
  if (nowMs - _fxLastFrameMs < 1000 / _FX_FPS) return;
  _fxLastFrameMs = nowMs;
  if (document.hidden) return;
  const bar = document.getElementById("fxBar");
  if (!bar || bar.offsetParent === null) return;
  if (_fxClockStart === 0) _fxClockStart = nowMs;
  const loopMs = 3000;
  const t = ((nowMs - _fxClockStart) % loopMs) / loopMs;
  for (const card of _fxCards) {
    if (card.canvas.offsetParent === null) continue;
    _renderFxCardFrame(card, t);
  }
}

export function initEffectGallery() {
  const grid = document.getElementById("fxGrid");
  if (!grid) return;
  grid.innerHTML = "";
  _fxCards = [];

  for (const meta of FX_CARD_META) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "fx-card";
    card.dataset.effect = meta.id;
    card.innerHTML = `
      <canvas class="fx-card-canvas" width="280" height="128"></canvas>
      <div class="fx-card-name">${meta.label}<small>${meta.sub}</small></div>
      <div class="fx-card-check">✓</div>
    `;
    card.addEventListener("click", () => selectEffect(meta.id));
    grid.appendChild(card);

    const canvas = card.querySelector(".fx-card-canvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d")!;
    const fx: FxState = {
      background: "transparent",
      bgImage: _fxBgImage,
      effect: meta.id as FxState["effect"],
      inkStyle: "plain",
    };
    fx.inkStyle = inkStyleFor(fx);
    const cache = buildParticleCache(canvas.width, canvas.height, fx, 12345);

    if (fx.effect === "stamp") {
      const inkPreview = _buildFxCardThemedInk(canvas.width, canvas.height, fx);
      const tmpForBBox = document.createElement("canvas");
      tmpForBBox.width = canvas.width; tmpForBBox.height = canvas.height;
      const tctx = tmpForBBox.getContext("2d")!;
      tctx.font = "italic 22px 'Caveat', cursive";
      tctx.textAlign = "center"; tctx.textBaseline = "middle";
      tctx.fillStyle = "#000";
      tctx.fillText("Signature", canvas.width / 2, canvas.height / 2);
      const bbox = computeInkBBox(tmpForBBox);
      if (bbox) cache.stampBBox = bbox;
      _fxCards.push({ effectId: meta.id, canvas, ctx, fx, cache, themedInk: inkPreview });
    } else {
      const themedInk = _buildFxCardThemedInk(canvas.width, canvas.height, fx);
      _fxCards.push({ effectId: meta.id, canvas, ctx, fx, cache, themedInk });
    }
  }

  highlightSelectedFxCard();

  if (_fxRafId === null) {
    _fxClockStart = 0;
    _fxRafId = requestAnimationFrame(_fxLoop);
  }
}

export function rebuildEffectGalleryStates() {
  for (const card of _fxCards) {
    const W = card.canvas.width, H = card.canvas.height;
    card.fx = {
      background: "transparent",
      bgImage: _fxBgImage,
      effect: card.effectId as FxState["effect"],
      inkStyle: "plain",
    };
    card.fx.inkStyle = inkStyleFor(card.fx);
    card.cache = buildParticleCache(W, H, card.fx, 12345);
    if (card.fx.effect === "stamp") {
      const tmpForBBox = document.createElement("canvas");
      tmpForBBox.width = W; tmpForBBox.height = H;
      const tctx = tmpForBBox.getContext("2d")!;
      tctx.font = "italic 22px 'Caveat', cursive";
      tctx.textAlign = "center"; tctx.textBaseline = "middle";
      tctx.fillStyle = "#000";
      tctx.fillText("Signature", W / 2, H / 2);
      const bbox = computeInkBBox(tmpForBBox);
      if (bbox) card.cache.stampBBox = bbox;
    }
    card.themedInk = _buildFxCardThemedInk(W, H, card.fx);
  }
}

export function highlightSelectedFxCard() {
  const sel = document.getElementById("fxEffect") as HTMLSelectElement | null;
  const selected = sel?.value || "none";
  document.querySelectorAll(".fx-card").forEach((c) => {
    (c as HTMLElement).classList.toggle("active", (c as HTMLElement).dataset.effect === selected);
  });
}

export function selectEffect(effectId: string) {
  if (effectId === "custom-video") {
    // if no video loaded, open file picker
    const input = document.getElementById("fxVideoInput") as HTMLInputElement | null;
    if (input) input.click();
    return;
  }
  const sel = document.getElementById("fxEffect") as HTMLSelectElement | null;
  if (sel) {
    sel.value = effectId;
    sel.dispatchEvent(new Event("change"));
  }
  highlightSelectedFxCard();
}
