"use client";

import { useEffect, useRef } from "react";
import { getEffectsState } from "@/lib/effects";
import { renderStaticWithEffects } from "@/lib/ink";
import { renderTypeToTransparentCanvas } from "@/lib/type";
import { makeFramePlanFromCanvas, makeFramePlanFromStrokes } from "@/lib/export/plan";
import { renderGifFromPlan, generateGifFromCanvas } from "@/lib/export/gif";
import { attachSvipFooter } from "@/lib/ink";
import { saveToGallery } from "@/lib/gallery-storage";
import { toast, downloadURL } from "@/lib/utils";
import type { Stroke } from "@/types";

interface PreviewState {
  source: "type" | "draw" | "photo" | null;
  rawCanvas: HTMLCanvasElement | null;
  pngCanvas: HTMLCanvasElement | null;
  gifBlobURL: string | null;
  format: "png" | "gif";
  modalTab: "full" | "donation";
  signatureName: string;
}

// Simulation constants (must match CSS @keyframes durations)
const SIM_CYCLE_MS = 7000;
const SIM_PHASE2_START_MS = 3010;

export default function PreviewModal() {
  const stateRef = useRef<PreviewState>({
    source: null,
    rawCanvas: null,
    pngCanvas: null,
    gifBlobURL: null,
    format: "gif",
    modalTab: "full",
    signatureName: "",
  });
  const simTimers = useRef<(ReturnType<typeof setTimeout>)[]>([]);

  useEffect(() => {
    const ps = stateRef.current;
    const modal = document.getElementById("previewModal") as HTMLElement | null;
    if (!modal) return;

    // ── Expose openPreview globally so view buttons can call it ──
    async function openPreview(sourceTab: "type" | "draw" | "photo") {
      const fxState = getEffectsState();

      if (sourceTab === "type") {
        const text = (document.getElementById("typeText") as HTMLInputElement)?.value.trim();
        if (!text) { toast("먼저 이름을 입력해주세요"); return; }
        ps.signatureName = text;
        const fontGrid = document.getElementById("fontGrid");
        const fontIdx = parseInt((fontGrid?.querySelector(".font-chip.active") as HTMLElement)?.dataset.font ?? "0");
        const FONTS_CONST = (await import("@/lib/constants")).FONTS;
        const stroke = parseFloat((document.getElementById("typeStroke") as HTMLInputElement)?.value ?? "3");
        const slant = parseInt((document.getElementById("typeSlant") as HTMLInputElement)?.value ?? "-8");
        const flourish = (document.getElementById("typeFlourish") as HTMLSelectElement)?.value ?? "underline";
        ps.rawCanvas = renderTypeToTransparentCanvas({ text, font: FONTS_CONST[fontIdx], stroke, slant, flourish });
      } else if (sourceTab === "draw") {
        const drawCanvas = document.getElementById("drawCanvas") as HTMLCanvasElement | null;
        if (!drawCanvas) return;
        ps.signatureName = "나만의 시그니처";
        ps.rawCanvas = drawCanvas;
      } else if (sourceTab === "photo") {
        const photoCanvas = document.getElementById("photoCanvas") as HTMLCanvasElement | null;
        if (!photoCanvas) return;
        ps.signatureName = "나만의 시그니처";
        ps.rawCanvas = photoCanvas;
      } else {
        return;
      }

      ps.source = sourceTab;
      ps.format = "gif";
      ps.modalTab = "full";

      if (!ps.rawCanvas) return;
      ps.pngCanvas = renderStaticWithEffects(ps.rawCanvas, fxState);

      if (ps.gifBlobURL) {
        URL.revokeObjectURL(ps.gifBlobURL);
        ps.gifBlobURL = null;
      }

      const sourceLabels: Record<string, string> = {
        type: "Type · 텍스트로 만든 시그니처",
        draw: "Draw · 직접 그린 시그니처",
        photo: "Photo · 사진에서 변환",
      };
      const src = document.getElementById("previewSource");
      if (src) src.textContent = "— " + sourceLabels[sourceTab];
      const meta = document.getElementById("previewMeta");
      if (meta && ps.pngCanvas) meta.textContent = `${ps.pngCanvas.width} × ${ps.pngCanvas.height} px`;

      // Format toggle reset to GIF
      document.querySelectorAll("#previewFormatToggle button").forEach(b => {
        b.classList.toggle("active", (b as HTMLElement).dataset.format === "gif");
      });

      // Modal tab reset
      document.querySelectorAll(".modal-tab").forEach(b => {
        b.classList.toggle("active", (b as HTMLElement).dataset.modalTab === "full");
      });
      document.querySelectorAll(".modal-pane").forEach(p => {
        (p as HTMLElement).style.display = (p as HTMLElement).dataset.pane === "full" ? "block" : "none";
      });

      renderPreviewViewport();
      updateSimulation();

      modal?.classList.add("open");
      document.body.style.overflow = "hidden";
    }

    function closePreview() {
      modal?.classList.remove("open");
      document.body.style.overflow = "";
      const scene = document.getElementById("simScene");
      if (scene) scene.classList.remove("playing");
      clearSimTimers();
    }

    function renderPreviewViewport() {
      const vp = document.getElementById("previewViewport");
      const replay = document.getElementById("previewReplay") as HTMLButtonElement | null;
      if (!vp) return;
      vp.innerHTML = "";
      if (ps.format === "png") {
        if (replay) replay.style.display = "none";
        if (ps.pngCanvas) {
          const img = new Image();
          img.src = ps.pngCanvas.toDataURL("image/png");
          vp.appendChild(img);
        }
      } else {
        if (replay) replay.style.display = "inline-flex";
        if (ps.gifBlobURL) {
          const img = new Image();
          img.src = ps.gifBlobURL;
          vp.appendChild(img);
        } else {
          vp.innerHTML = '<div class="preview-loading"><span class="loader"></span>GIF 생성 중… (10~15초)</div>';
          generatePreviewGif();
        }
      }
    }

    async function generatePreviewGif() {
      try {
        const fxState = getEffectsState();
        let url: string;
        if (ps.source === "draw") {
          const drawCanvas = document.getElementById("drawCanvas") as HTMLCanvasElement | null;
          if (drawCanvas) {
            const plan = makeFramePlanFromCanvas(drawCanvas, { transparentMode: false, outputFormat: "gif" });
            url = await renderGifFromPlan(plan, {});
          } else {
            return;
          }
        } else if (ps.rawCanvas) {
          url = await generateGifFromCanvas(ps.rawCanvas, { frames: 54, fx: fxState });
        } else {
          return;
        }
        ps.gifBlobURL = url;
        if (ps.format === "gif") {
          const vp = document.getElementById("previewViewport");
          if (vp) {
            vp.innerHTML = "";
            const img = new Image();
            img.src = url;
            vp.appendChild(img);
          }
          if (ps.modalTab === "donation") updateSimulation();
        }
      } catch (err: any) {
        console.error("Preview GIF 실패:", err);
        const vp = document.getElementById("previewViewport");
        if (vp) vp.innerHTML = `<div class="preview-loading" style="color:var(--status-negative);">GIF 생성 실패: ${err.message || err}</div>`;
      }
    }

    function updateSimulation() {
      let sigSrc: string | null = null;
      if (ps.gifBlobURL && ps.format === "gif") {
        sigSrc = ps.gifBlobURL;
      } else if (ps.pngCanvas) {
        sigSrc = ps.pngCanvas.toDataURL("image/png");
      }
      const phaseSig = document.getElementById("simPhaseSig");
      if (phaseSig) {
        phaseSig.innerHTML = "";
        if (sigSrc) {
          const img = new Image();
          img.src = sigSrc;
          phaseSig.appendChild(img);
        }
      }
      playSimulationSequence();
    }

    function clearSimTimers() {
      simTimers.current.forEach(id => clearTimeout(id));
      simTimers.current = [];
    }

    function restartDonationGif() {
      const gifImg = document.getElementById("simPhaseGifImg") as HTMLImageElement | null;
      if (!gifImg) return;
      const src = gifImg.src;
      gifImg.src = "";
      requestAnimationFrame(() => { gifImg.src = src; });
    }

    function playSimulationSequence() {
      const scene = document.getElementById("simScene");
      if (!scene) return;
      scene.classList.remove("playing");
      clearSimTimers();
      void (scene as HTMLElement).offsetWidth;
      scene.classList.add("playing");
      simTimers.current.push(setTimeout(restartDonationGif, SIM_PHASE2_START_MS));
      function scheduleNext() {
        const id = setTimeout(() => {
          restartDonationGif();
          scheduleNext();
        }, SIM_CYCLE_MS);
        simTimers.current.push(id);
      }
      const followUp = setTimeout(() => {
        restartDonationGif();
        scheduleNext();
      }, SIM_PHASE2_START_MS + SIM_CYCLE_MS);
      simTimers.current.push(followUp);
    }

    // ── Wire up preview buttons in each view ──
    document.getElementById("previewType")?.addEventListener("click", () => openPreview("type"));
    document.getElementById("previewDraw")?.addEventListener("click", () => openPreview("draw"));
    document.getElementById("previewPhoto")?.addEventListener("click", () => openPreview("photo"));

    // ── Modal controls ──
    document.getElementById("previewClose")?.addEventListener("click", closePreview);
    modal.addEventListener("click", e => { if (e.target === modal) closePreview(); });
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && modal.classList.contains("open")) closePreview();
    });

    // ── Format toggle ──
    document.querySelectorAll("#previewFormatToggle button").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("#previewFormatToggle button").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        ps.format = (btn as HTMLElement).dataset.format as "png" | "gif";
        renderPreviewViewport();
      });
    });

    // ── Modal tab switch ──
    document.querySelectorAll(".modal-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        document.querySelectorAll(".modal-tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        const pane = (tab as HTMLElement).dataset.modalTab ?? "full";
        ps.modalTab = pane as "full" | "donation";
        document.querySelectorAll(".modal-pane").forEach(p => {
          (p as HTMLElement).style.display = (p as HTMLElement).dataset.pane === pane ? "block" : "none";
        });
        if (pane === "donation") updateSimulation();
      });
    });

    // ── Replay button ──
    document.getElementById("previewReplay")?.addEventListener("click", () => {
      ps.gifBlobURL = null;
      renderPreviewViewport();
    });
    document.getElementById("simReplay")?.addEventListener("click", () => {
      playSimulationSequence();
    });

    // ── Download ──
    document.getElementById("previewDownload")?.addEventListener("click", () => {
      if (ps.format === "png" && ps.pngCanvas) {
        ps.pngCanvas.toBlob(blob => {
          if (!blob) return;
          downloadURL(URL.createObjectURL(blob), `${ps.signatureName || "signature"}.png`);
        });
      } else if (ps.format === "gif" && ps.gifBlobURL) {
        downloadURL(ps.gifBlobURL, `${ps.signatureName || "signature"}.gif`);
      }
    });

    // ── Save to gallery ──
    document.getElementById("previewSave")?.addEventListener("click", () => {
      if (!ps.pngCanvas) return;
      const out = document.createElement("canvas");
      out.width = ps.pngCanvas.width;
      out.height = ps.pngCanvas.height;
      const ctx = out.getContext("2d")!;
      ctx.drawImage(ps.pngCanvas, 0, 0);
      attachSvipFooter(out);
      saveToGallery(out.toDataURL("image/png"), ps.signatureName || "signature");
      toast("보관함에 저장했습니다");
    });
  }, []);

  return (
    <div className="modal-backdrop" id="previewModal">
      <div className="modal" role="dialog" aria-labelledby="previewTitle">
        <div className="modal-header">
          <div className="modal-title" id="previewTitle">미리보기</div>
          <button className="modal-close" id="previewClose" aria-label="닫기">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M5 5l8 8M5 13l8-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="modal-tabs">
          <button className="modal-tab active" data-modal-tab="full">
            <svg className="modal-tab-icon" viewBox="0 0 16 16" fill="none">
              <path d="M2 4.5L4 2.5h8L14 4.5M2 4.5v8.5a.5.5 0 00.5.5h11a.5.5 0 00.5-.5V4.5M2 4.5h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M5.5 8.5l1.5 1.5L10.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            시그니처 미리보기
          </button>
          <button className="modal-tab" data-modal-tab="donation">
            <svg className="modal-tab-icon" viewBox="0 0 16 16" fill="none">
              <path d="M3 6.5a5 5 0 0110 0v2.8c0 .4.2.8.5 1l1 .9c.3.3.1.8-.3.8H1.8c-.4 0-.6-.5-.3-.8l1-.9c.3-.2.5-.6.5-1V6.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M6.5 13.5a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            알림 위젯 시뮬레이션
          </button>
        </div>

        <div className="modal-body">
          {/* Full preview pane */}
          <div className="modal-pane" data-pane="full">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="badge badge-blue" id="previewMeta">800 × 320 px</span>
              </div>
              <div className="format-toggle" id="previewFormatToggle">
                <button data-format="png">PNG</button>
                <button className="active" data-format="gif">GIF</button>
              </div>
            </div>
            <div className="preview-viewport" id="previewViewport">
              <div className="preview-loading"><span className="loader"></span>준비 중…</div>
            </div>
          </div>

          {/* Donation simulation pane */}
          <div className="modal-pane" data-pane="donation" style={{ display: "none" }}>
            <div className="sim-scene" id="simScene">
              <div className="sim-phase-sig" id="simPhaseSig"></div>
              <div className="sim-phase-gif" id="simPhaseGif">
                {/* Donation GIF placeholder — src filled dynamically */}
                <img id="simPhaseGifImg" src="" alt="" style={{ display: "block", maxWidth: "100%", maxHeight: "100%" }} />
              </div>
              <div className="sim-controls">
                <button className="sim-replay" id="simReplay" title="다시 재생" aria-label="다시 재생">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M2 8a6 6 0 1011-3M13 4V2M13 4h-2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <div className="modal-footer-info" id="previewSource">— Type</div>
          <div className="modal-footer-actions">
            <button className="btn btn-outline" id="previewReplay" style={{ display: "none" }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7a5 5 0 109-3M11 4V2M11 4h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              다시 재생
            </button>
            <button className="btn btn-secondary" id="previewDownload">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 2v8M4 7l3 3 3-3M2 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              다운로드
            </button>
            <button className="btn btn-svip" id="previewSave">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1L8.6 4.4L12.4 5L9.7 7.6L10.4 11.4L7 9.6L3.6 11.4L4.3 7.6L1.6 5L5.4 4.4L7 1Z" fill="currentColor"/>
              </svg>
              보관함에 저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
