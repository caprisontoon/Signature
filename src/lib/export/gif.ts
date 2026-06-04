import type { FramePlan } from "@/types";

let cachedWorkerBlobURL: string | null = null;

export async function getWorkerBlobURL(): Promise<string> {
  if (cachedWorkerBlobURL) return cachedWorkerBlobURL;
  const sources = [
    "https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js",
    "https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js",
    "https://unpkg.com/gif.js@0.2.0/dist/gif.worker.js",
  ];
  let lastErr: Error | null = null;
  for (const src of sources) {
    try {
      const resp = await fetch(src);
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      const code = await resp.text();
      const blob = new Blob([code], { type: "application/javascript" });
      cachedWorkerBlobURL = URL.createObjectURL(blob);
      return cachedWorkerBlobURL;
    } catch (e) {
      lastErr = e as Error;
    }
  }
  throw new Error("Worker 스크립트를 불러올 수 없습니다: " + (lastErr && lastErr.message));
}

export function ensureGifLib() {
  if (typeof (window as any).GIF === "undefined") {
    throw new Error("GIF 라이브러리가 로드되지 않았습니다. 인터넷 연결을 확인하세요.");
  }
}

export async function renderGifFromPlan(
  plan: FramePlan,
  options: { onProgress?: (label: string, ratio: number) => void } = {}
): Promise<string> {
  ensureGifLib();
  const { onProgress } = options;
  const { renderFrame, totalFrames, W, outH } = plan;
  const workerURL = await getWorkerBlobURL();
  const GIF = (window as any).GIF;
  const gif = new GIF({
    workers: 2, quality: 10, width: W, height: outH,
    workerScript: workerURL,
  });
  const tmp = document.createElement("canvas");
  tmp.width = W; tmp.height = outH;
  const tctx = tmp.getContext("2d")!;
  const delay = 55;
  for (let f = 0; f < totalFrames; f++) {
    const t = (f + 1) / totalFrames;
    renderFrame(tctx, t);
    const isLast = f === totalFrames - 1;
    gif.addFrame(tctx, { copy: true, delay: isLast ? 1400 : delay });
    if (onProgress) onProgress("프레임 생성 중...", 0.10 + (f / totalFrames) * 0.40);
  }
  return new Promise((resolve, reject) => {
    gif.on("progress", (p: number) => {
      if (onProgress) onProgress("GIF 인코딩 중...", 0.50 + p * 0.45);
    });
    gif.on("finished", (blob: Blob) => {
      if (!blob || blob.size === 0) { reject(new Error("빈 GIF")); return; }
      resolve(URL.createObjectURL(blob));
    });
    gif.on("abort", () => reject(new Error("GIF 생성 중단")));
    gif.render();
  });
}

export async function generateGifFromCanvas(
  srcCanvas: HTMLCanvasElement,
  options: {
    frames?: number;
    delay?: number;
    fx?: any;
  } = {}
): Promise<string> {
  // Legacy path — delegates to renderGifFromPlan
  const { makeFramePlanFromCanvas } = await import("./plan");
  const plan = makeFramePlanFromCanvas(srcCanvas, {
    frames: options.frames || 54,
    fx: options.fx,
    transparentMode: false,
    outputFormat: "gif",
  });
  return renderGifFromPlan(plan);
}
