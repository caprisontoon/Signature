import type { FramePlan } from "@/types";

export async function encodeWebmFromFramePlan(
  plan: FramePlan,
  options: { fps?: number; onProgress?: (label: string, ratio: number) => void } = {}
): Promise<{ url: string; ext: string; mime: string }> {
  const { fps = 18, onProgress } = options;
  const { renderFrame, totalFrames, W, outH } = plan;

  const mimeCandidates = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
  let chosenMime = "";
  for (const m of mimeCandidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m)) {
      chosenMime = m; break;
    }
  }
  if (!chosenMime) throw new Error("이 브라우저는 WebM 녹화를 지원하지 않습니다.");

  const tmp = document.createElement("canvas");
  tmp.width = W; tmp.height = outH;
  const tctx = tmp.getContext("2d")!;
  const stream = (tmp as any).captureStream(fps);
  const recorder = new MediaRecorder(stream, {
    mimeType: chosenMime,
    videoBitsPerSecond: 5_000_000,
  });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
  if (onProgress) onProgress("녹화 중...", 0.05);
  recorder.start();
  const frameInterval = 1000 / fps;
  for (let f = 0; f < totalFrames; f++) {
    const t = (f + 1) / totalFrames;
    renderFrame(tctx, t);
    const track = stream.getVideoTracks()[0];
    if (track && typeof track.requestFrame === "function") track.requestFrame();
    await new Promise((r) => setTimeout(r, frameInterval));
    if (onProgress) onProgress("녹화 중...", 0.05 + (f / totalFrames) * 0.90);
  }
  await new Promise((r) => setTimeout(r, 400));
  const blob = await new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: chosenMime }));
    recorder.stop();
  });
  stream.getTracks().forEach((t: any) => t.stop());
  if (onProgress) onProgress("완료", 1.0);
  return { url: URL.createObjectURL(blob), ext: "webm", mime: chosenMime };
}
