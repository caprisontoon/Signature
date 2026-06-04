import { toast } from "@/lib/utils";
import { rebuildEffectGalleryStates, selectEffect } from "./gallery";
import { setFxVideo, _fxVideo } from "./index";

const FX_VIDEO_MAX_DIM = 720;

export function drawVideoCover(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  src: HTMLVideoElement | HTMLCanvasElement
): boolean {
  const sw = (src as HTMLVideoElement).videoWidth || (src as HTMLCanvasElement).width;
  const sh = (src as HTMLVideoElement).videoHeight || (src as HTMLCanvasElement).height;
  if (!sw || !sh) return false;
  const ar = sw / sh, car = W / H;
  let dw: number, dh: number, dx: number, dy: number;
  if (ar > car) { dh = H; dw = H * ar; dx = (W - dw) / 2; dy = 0; }
  else { dw = W; dh = W / ar; dx = 0; dy = (H - dh) / 2; }
  ctx.drawImage(src as any, dx, dy, dw, dh);
  return true;
}

export function handleFxVideoFile(file: File) {
  if (!file || !file.type.startsWith("video/")) {
    toast("영상 파일(mp4 · webm)만 가능합니다");
    return;
  }
  clearFxVideo();
  const url = URL.createObjectURL(file);
  const v = document.createElement("video");
  v.src = url;
  v.muted = true;
  v.loop = true;
  v.playsInline = true;
  v.preload = "auto";
  v.addEventListener("loadeddata", () => {
    setFxVideo({ url, el: v, frames: null, name: file.name, w: v.videoWidth, h: v.videoHeight });
    v.play().catch(() => {});
    const nameEl = document.getElementById("fxVideoName");
    const removeBtn = document.getElementById("fxVideoRemove");
    if (nameEl) nameEl.textContent = file.name;
    if (removeBtn) removeBtn.style.display = "";
    rebuildEffectGalleryStates();
    selectEffect("custom-video");
    toast("영상이 특수 효과로 적용되었습니다");
  }, { once: true });
  v.addEventListener("error", () => {
    toast("영상을 불러올 수 없습니다");
    clearFxVideo();
  }, { once: true });
}

export function clearFxVideo() {
  if (_fxVideo) {
    try { _fxVideo.el.pause(); } catch (e) {}
    URL.revokeObjectURL(_fxVideo.url);
    setFxVideo(null);
  }
  const nameEl = document.getElementById("fxVideoName");
  const removeBtn = document.getElementById("fxVideoRemove");
  if (nameEl) nameEl.textContent = "";
  if (removeBtn) removeBtn.style.display = "none";
  const sel = document.getElementById("fxEffect") as HTMLSelectElement | null;
  if (sel && sel.value === "custom-video") {
    rebuildEffectGalleryStates();
    selectEffect("none");
  } else {
    rebuildEffectGalleryStates();
  }
}

function seekVideoTo(v: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    const onSeeked = () => { v.removeEventListener("seeked", onSeeked); resolve(); };
    v.addEventListener("seeked", onSeeked);
    const dur = (v.duration && isFinite(v.duration)) ? v.duration : 0;
    try {
      v.currentTime = dur > 0 ? Math.min(time, Math.max(0, dur - 0.05)) : 0;
    } catch (e) {
      v.removeEventListener("seeked", onSeeked);
      resolve();
    }
  });
}

export async function prepareFxVideoFrames(
  count: number,
  onProgress?: (label: string, ratio: number) => void
) {
  const vid = _fxVideo;
  if (!vid) return;
  const v = vid.el;
  const vw = v.videoWidth, vh = v.videoHeight;
  if (!vw || !vh) return;
  const scale = Math.min(1, FX_VIDEO_MAX_DIM / Math.max(vw, vh));
  const w = Math.max(2, Math.round(vw * scale));
  const h = Math.max(2, Math.round(vh * scale));
  const dur = (v.duration && isFinite(v.duration)) ? v.duration : 0;
  const wasPlaying = !v.paused;
  v.pause();
  const frames: HTMLCanvasElement[] = [];
  for (let i = 0; i < count; i++) {
    const time = dur > 0 ? (i / count) * dur : 0;
    await seekVideoTo(v, time);
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    c.getContext("2d")!.drawImage(v, 0, 0, w, h);
    frames.push(c);
    if (onProgress) onProgress("영상 프레임 추출 중...", 0.02 + (i / count) * 0.08);
  }
  vid.frames = frames;
  if (wasPlaying) v.play().catch(() => {});
}
