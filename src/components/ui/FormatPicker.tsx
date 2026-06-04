"use client";

import { useEffect, useRef } from "react";
import { makeFramePlanFromCanvas, makeFramePlanFromStrokes } from "@/lib/export/plan";
import { renderGifFromPlan } from "@/lib/export/gif";
import { encodeMp4FromFramePlan } from "@/lib/export/mp4";
import { encodeWebmFromFramePlan } from "@/lib/export/webm";
import { prepareFxVideoFrames } from "@/lib/effects/video";
import { getEffectsState } from "@/lib/effects";
import { toast, downloadURL } from "@/lib/utils";
import type { FramePlan } from "@/types";

import type { OutputFormat } from "@/types";

type PlanFactory = (opts: { transparentMode: boolean; frames?: number; outputFormat: OutputFormat }) => FramePlan;

// Global context set by view buttons
let _pendingFactory: PlanFactory | null = null;
let _pendingBaseName = "signature";

export function openFormatPicker(factory: PlanFactory, baseName: string) {
  _pendingFactory = factory;
  _pendingBaseName = baseName;
  const bd = document.getElementById("fmtPickerBackdrop");
  const prog = document.getElementById("fmtProgress");
  if (prog) prog.style.display = "none";
  document.querySelectorAll(".fmt-option").forEach(o => ((o as HTMLButtonElement).disabled = false));
  if (bd) bd.classList.add("show");
}

export default function FormatPicker() {
  useEffect(() => {
    function setFmtProgress(text: string, ratio: number) {
      const prog = document.getElementById("fmtProgress");
      const txt = document.getElementById("fmtProgressText");
      const fill = document.getElementById("fmtProgressFill");
      if (prog) prog.style.display = "block";
      if (txt) txt.textContent = text;
      if (fill) (fill as HTMLElement).style.width = `${Math.round(ratio * 100)}%`;
    }

    function closePicker() {
      document.getElementById("fmtPickerBackdrop")?.classList.remove("show");
      _pendingFactory = null;
    }

    async function runExport(fmt: string) {
      if (!_pendingFactory) return;
      const factory = _pendingFactory;
      const baseName = _pendingBaseName;

      document.querySelectorAll(".fmt-option").forEach(o => ((o as HTMLButtonElement).disabled = true));
      setFmtProgress("준비 중...", 0.02);

      const fxState = getEffectsState();
      const usingVideo = fxState.effect === "custom-video";

      try {
        if (usingVideo) {
          await prepareFxVideoFrames(fmt === "gif" ? 54 : 72, setFmtProgress);
        }

        if (fmt === "gif") {
          const plan = factory({ transparentMode: false, outputFormat: "gif" as OutputFormat });
          setFmtProgress("GIF 프레임 생성 중...", 0.10);
          const url = await renderGifFromPlan(plan, {
            onProgress: (label: string, r: number) => setFmtProgress(label, r),
          });
          setFmtProgress("완료", 1.0);
          downloadURL(url, `${baseName}_${Date.now()}.gif`);
          toast("GIF 저장 완료");
        } else if (fmt === "mp4") {
          const plan = factory({ transparentMode: false, frames: 72, outputFormat: "mp4" as OutputFormat });
          const out = await encodeMp4FromFramePlan(plan, {
            fps: 24,
            onProgress: (label: string, r: number) => setFmtProgress(label, r),
          });
          downloadURL(out.url, `${baseName}_${Date.now()}.${out.ext}`);
          toast("MP4 저장 완료");
        } else if (fmt === "webm") {
          const plan = factory({ transparentMode: !usingVideo, frames: 72, outputFormat: "webm" as OutputFormat });
          const out = await encodeWebmFromFramePlan(plan, {
            fps: 24,
            onProgress: (label: string, r: number) => setFmtProgress(label, r),
          });
          downloadURL(out.url, `${baseName}_${Date.now()}.${out.ext}`);
          toast("WebM 저장 완료");
        }
        closePicker();
      } catch (err: any) {
        console.error("Export failed:", err);
        toast(`${fmt.toUpperCase()} 실패: ` + (err.message || err));
        document.querySelectorAll(".fmt-option").forEach(o => ((o as HTMLButtonElement).disabled = false));
        setFmtProgress("실패 — 다시 시도해 주세요", 0);
      }
    }

    document.getElementById("fmtClose")?.addEventListener("click", closePicker);

    document.querySelectorAll(".fmt-option").forEach(btn => {
      btn.addEventListener("click", () => {
        const fmt = (btn as HTMLElement).dataset.fmt;
        if (fmt) runExport(fmt);
      });
    });
  }, []);

  return (
    <div id="fmtPickerBackdrop">
      <div className="fmt-modal">
        <div className="fmt-head">
          <h3>애니메이션 포맷 선택</h3>
          <button className="fmt-close" id="fmtClose" aria-label="닫기">×</button>
        </div>
        <div className="fmt-body">
          <button className="fmt-option" data-fmt="mp4">
            <div className="fmt-badge">MP4</div>
            <div className="fmt-info">
              <div className="fmt-title">MP4 영상 <span className="fmt-tag">권장</span></div>
              <div className="fmt-desc">고화질 풀컬러. 투네이션 위젯 권장. 불투명 배경.</div>
            </div>
          </button>
          <button className="fmt-option" data-fmt="webm">
            <div className="fmt-badge fmt-badge-webm">WebM</div>
            <div className="fmt-info">
              <div className="fmt-title">WebM 영상 <span className="fmt-tag">투명</span></div>
              <div className="fmt-desc">고화질 + 진짜 투명 배경. 채팅 오버레이용.</div>
            </div>
          </button>
          <button className="fmt-option" data-fmt="gif">
            <div className="fmt-badge fmt-badge-gif">GIF</div>
            <div className="fmt-info">
              <div className="fmt-title">GIF 애니메이션</div>
              <div className="fmt-desc">호환성 좋음(256색). 어느 플랫폼이든 동작.</div>
            </div>
          </button>
        </div>
        <div className="fmt-progress" id="fmtProgress" style={{ display: "none" }}>
          <div className="fmt-progress-text" id="fmtProgressText">준비 중...</div>
          <div className="fmt-progress-bar">
            <div className="fmt-progress-fill" id="fmtProgressFill"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
