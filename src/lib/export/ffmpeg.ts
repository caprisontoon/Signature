let _ffmpegInstance: any = null;
let _ffmpegLoading: Promise<any> | null = null;

export async function ensureFFmpeg(onProgress?: (label: string, ratio: number) => void): Promise<any> {
  if (_ffmpegInstance) return _ffmpegInstance;
  if (_ffmpegLoading) return _ffmpegLoading;

  _ffmpegLoading = (async () => {
    if (typeof (window as any).FFmpegWASM === "undefined" && typeof (window as any).FFmpeg === "undefined") {
      if (onProgress) onProgress("FFmpeg 라이브러리 다운로드 중...", 0.05);
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://unpkg.com/@ffmpeg/ffmpeg@0.12.6/dist/umd/ffmpeg.js";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("FFmpeg 스크립트 로드 실패"));
        document.head.appendChild(script);
      });
    }
    const FFmpegLib = (window as any).FFmpegWASM || (window as any).FFmpeg;
    const FFmpegClass = FFmpegLib.FFmpeg;
    const ffmpeg = new FFmpegClass();
    if (onProgress) {
      ffmpeg.on("progress", ({ progress }: { progress: number }) => {
        if (progress >= 0 && progress <= 1) {
          onProgress("인코딩 중...", 0.4 + progress * 0.55);
        }
      });
    }
    if (onProgress) onProgress("FFmpeg 코어 로딩 중...", 0.15);
    const coreBase = "https://unpkg.com/@ffmpeg/core@0.12.4/dist/umd";
    await ffmpeg.load({
      coreURL: `${coreBase}/ffmpeg-core.js`,
      wasmURL: `${coreBase}/ffmpeg-core.wasm`,
    });
    _ffmpegInstance = ffmpeg;
    return ffmpeg;
  })();

  return _ffmpegLoading;
}

export function getWorkerBlobURL(): Promise<string> {
  // Re-exported from gif.ts for compat
  return Promise.reject(new Error("Use getWorkerBlobURL from gif.ts"));
}
