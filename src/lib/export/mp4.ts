import type { FramePlan } from "@/types";
import { ensureFFmpeg } from "./ffmpeg";

export async function encodeMp4FromFramePlan(
  plan: FramePlan,
  options: { fps?: number; onProgress?: (label: string, ratio: number) => void } = {}
): Promise<{ url: string; ext: string; mime: string }> {
  const { fps = 24, onProgress } = options;
  const { renderFrame, totalFrames, W, outH } = plan;

  const evenW = W % 2 === 0 ? W : W - 1;
  const evenH = outH % 2 === 0 ? outH : outH - 1;

  const mp4Candidates = ["video/mp4;codecs=h264", "video/mp4;codecs=avc1", "video/mp4"];
  const nativeMp4Mime = mp4Candidates.find(
    (m) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m)
  );

  if (nativeMp4Mime) {
    if (onProgress) onProgress("MP4 녹화 중...", 0.05);
    const tmp = document.createElement("canvas");
    tmp.width = evenW; tmp.height = evenH;
    const tctx = tmp.getContext("2d")!;
    const stream = (tmp as any).captureStream(fps);
    const recorder = new MediaRecorder(stream, {
      mimeType: nativeMp4Mime,
      videoBitsPerSecond: 6_000_000,
    });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    recorder.start();
    const frameInterval = 1000 / fps;
    for (let f = 0; f < totalFrames; f++) {
      const t = (f + 1) / totalFrames;
      tctx.fillStyle = "#000000";
      tctx.fillRect(0, 0, evenW, evenH);
      renderFrame(tctx, t);
      const track = stream.getVideoTracks()[0];
      if (track && typeof track.requestFrame === "function") track.requestFrame();
      await new Promise((r) => setTimeout(r, frameInterval));
      if (onProgress) onProgress("MP4 녹화 중...", 0.05 + (f / totalFrames) * 0.90);
    }
    await new Promise((r) => setTimeout(r, 300));
    const blob = await new Promise<Blob>((resolve) => {
      recorder.onstop = () => resolve(new Blob(chunks, { type: nativeMp4Mime }));
      recorder.stop();
    });
    stream.getTracks().forEach((t: any) => t.stop());
    if (onProgress) onProgress("완료", 1.0);
    return { url: URL.createObjectURL(blob), ext: "mp4", mime: nativeMp4Mime };
  }

  // Fallback: WebM → ffmpeg transcode
  if (onProgress) onProgress("WebM 녹화 중 (트랜스코딩 준비)...", 0.05);
  const webmCandidates = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
  const webmMime = webmCandidates.find((m) => MediaRecorder.isTypeSupported(m));
  if (!webmMime) throw new Error("이 브라우저는 영상 녹화를 지원하지 않습니다.");

  const tmp2 = document.createElement("canvas");
  tmp2.width = evenW; tmp2.height = evenH;
  const tctx2 = tmp2.getContext("2d")!;
  const stream2 = (tmp2 as any).captureStream(fps);
  const recorder2 = new MediaRecorder(stream2, { mimeType: webmMime, videoBitsPerSecond: 6_000_000 });
  const chunks2: Blob[] = [];
  recorder2.ondataavailable = (e) => { if (e.data && e.data.size) chunks2.push(e.data); };
  recorder2.start();
  for (let f = 0; f < totalFrames; f++) {
    const t = (f + 1) / totalFrames;
    tctx2.fillStyle = "#000000";
    tctx2.fillRect(0, 0, evenW, evenH);
    renderFrame(tctx2, t);
    const track = stream2.getVideoTracks()[0];
    if (track && typeof track.requestFrame === "function") track.requestFrame();
    await new Promise((r) => setTimeout(r, 1000 / fps));
    if (onProgress) onProgress("WebM 녹화 중...", 0.05 + (f / totalFrames) * 0.40);
  }
  await new Promise((r) => setTimeout(r, 300));
  const webmBlob = await new Promise<Blob>((resolve) => {
    recorder2.onstop = () => resolve(new Blob(chunks2, { type: webmMime }));
    recorder2.stop();
  });
  stream2.getTracks().forEach((t: any) => t.stop());
  if (onProgress) onProgress("FFmpeg 로딩...", 0.50);
  const ffmpeg = await ensureFFmpeg((label, r) => {
    if (onProgress) onProgress(label, 0.50 + r * 0.10);
  });
  const inputName = "in.webm";
  await ffmpeg.writeFile(inputName, new Uint8Array(await webmBlob.arrayBuffer()));
  if (onProgress) onProgress("MP4로 변환 중...", 0.65);
  await ffmpeg.exec([
    "-i", inputName,
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-preset", "medium",
    "-crf", "20",
    "-movflags", "+faststart",
    "out.mp4",
  ]);
  try { await ffmpeg.deleteFile(inputName); } catch (_) {}
  const data = await ffmpeg.readFile("out.mp4");
  try { await ffmpeg.deleteFile("out.mp4"); } catch (_) {}
  const blob = new Blob([data.buffer], { type: "video/mp4" });
  if (onProgress) onProgress("완료", 1.0);
  return { url: URL.createObjectURL(blob), ext: "mp4", mime: "video/mp4" };
}
