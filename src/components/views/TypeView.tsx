"use client";

import { useEffect, useRef } from "react";
import { FONTS } from "@/lib/constants";
import { renderType } from "@/lib/type";
import { renderStaticWithEffects } from "@/lib/ink";
import { makeFramePlanFromCanvas } from "@/lib/export/plan";
import { openFormatPicker } from "@/components/ui/FormatPicker";
import { saveToGallery } from "@/lib/gallery-storage";
import { toast, downloadURL } from "@/lib/utils";
import { getEffectsState } from "@/lib/effects";

export default function TypeView({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const fontGrid = document.getElementById("fontGrid");
    if (fontGrid) {
      FONTS.forEach((f, i) => {
        const chip = document.createElement("button");
        chip.className = "font-chip" + (i === 0 ? " active" : "");
        chip.dataset.font = String(i);
        chip.style.cssText = `font-family:'${f.family}',serif;font-size:${Math.min(f.size, 14)}px;`;
        chip.textContent = f.name;
        chip.addEventListener("click", () => {
          fontGrid.querySelectorAll(".font-chip").forEach(c => c.classList.remove("active"));
          chip.classList.add("active");
          doRender();
        });
        fontGrid.appendChild(chip);
      });
    }

    const textInput = document.getElementById("typeText") as HTMLInputElement | null;
    const strokeRange = document.getElementById("typeStroke") as HTMLInputElement | null;
    const strokeVal = document.getElementById("typeStrokeVal");
    const slantRange = document.getElementById("typeSlant") as HTMLInputElement | null;
    const slantVal = document.getElementById("typeSlantVal");
    const flourishSel = document.getElementById("typeFlourish") as HTMLSelectElement | null;

    function doRender() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const fontIdx = parseInt((fontGrid?.querySelector(".font-chip.active") as HTMLElement)?.dataset.font ?? "0");
      const text = textInput?.value ?? "홍길동";
      const strokeW = parseFloat(strokeRange?.value ?? "3");
      const slant = parseInt(slantRange?.value ?? "-8");
      const flourish = (flourishSel?.value ?? "underline") as any;
      renderType(canvas, ctx, { text, font: FONTS[fontIdx], stroke: strokeW, slant, flourish });
    }

    if (strokeRange && strokeVal) {
      strokeRange.addEventListener("input", () => { strokeVal.textContent = strokeRange.value; doRender(); });
    }
    if (slantRange && slantVal) {
      slantRange.addEventListener("input", () => { slantVal.textContent = slantRange.value + "°"; doRender(); });
    }
    if (textInput) textInput.addEventListener("input", doRender);
    if (flourishSel) flourishSel.addEventListener("change", doRender);

    // Initial render
    doRender();

    // Preview button
    document.getElementById("previewType")?.addEventListener("click", () => {
      doRender();
      toast("미리보기 완료");
    });

    // PNG export
    document.getElementById("exportTypePNG")?.addEventListener("click", () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const fxState = getEffectsState();
      const out = renderStaticWithEffects(canvas, fxState);
      out.toBlob(blob => {
        if (!blob) return;
        downloadURL(URL.createObjectURL(blob), "signature.png");
      });
    });

    // GIF/MP4/WebM export via format picker
    document.getElementById("exportTypeGIF")?.addEventListener("click", () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const name = (document.getElementById("typeText") as HTMLInputElement)?.value || "type";
      openFormatPicker((opts) => makeFramePlanFromCanvas(canvas, opts), name);
    });

    // Save to gallery
    document.getElementById("saveTypeGallery")?.addEventListener("click", () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const fxState = getEffectsState();
      const out = renderStaticWithEffects(canvas, fxState);
      saveToGallery(textInput?.value ?? "Type signature", out.toDataURL("image/png"));
      toast("보관함에 저장했습니다");
    });
  }, []);

  // Re-render when view becomes active
  useEffect(() => {
    if (active && canvasRef.current) {
      // Trigger re-render with current settings by dispatching input event on text
      const textInput = document.getElementById("typeText") as HTMLInputElement | null;
      if (textInput) textInput.dispatchEvent(new Event("input"));
    }
  }, [active]);

  return (
    <div className={`view${active ? " active" : ""}`} id="view-type">
      <div className="page-header">
        <div className="page-title-group">
          <h1>이름으로 시그니처 만들기</h1>
          <p>입력한 텍스트로 손글씨 스타일의 시그니처를 자동 생성합니다</p>
        </div>
      </div>
      <div className="workspace">
        <div className="panel">
          <div className="panel-title">서명 설정</div>

          <div className="field">
            <label>이름</label>
            <input type="text" className="input" id="typeText" placeholder="홍길동 or John" defaultValue="홍길동" maxLength={30} />
          </div>

          <div className="field">
            <label>서체</label>
            <div className="font-grid" id="fontGrid"></div>
          </div>

          <div className="field">
            <label>굵기</label>
            <div className="range-row">
              <input type="range" id="typeStroke" min="1" max="8" defaultValue="3" step="0.5" />
              <span className="val" id="typeStrokeVal">3</span>
            </div>
          </div>

          <div className="field">
            <label>기울기</label>
            <div className="range-row">
              <input type="range" id="typeSlant" min="-20" max="20" defaultValue="-8" />
              <span className="val" id="typeSlantVal">-8°</span>
            </div>
          </div>

          <div className="field">
            <label>장식</label>
            <select className="select" id="typeFlourish">
              <option value="none">— None / 없음</option>
              <option value="underline">Underline / 밑줄</option>
              <option value="loop">Loop / 고리</option>
              <option value="swash">Swash / 휘날림</option>
              <option value="dot">Period / 점</option>
            </select>
          </div>

          <div className="btn-row">
            <button className="btn btn-secondary" id="previewType">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 7s2-4 6-4 6 4 6 4-2 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              미리보기
            </button>
          </div>
          <div className="btn-row">
            <button className="btn btn-primary btn-stacked" id="exportTypePNG">
              <span className="btn-main">이미지 다운로드</span>
              <span className="btn-sub">PNG</span>
            </button>
            <button className="btn btn-svip btn-stacked" id="exportTypeGIF">
              <span className="btn-main">애니메이션 다운로드</span>
              <span className="btn-sub">GIF · MP4 · WebM</span>
            </button>
          </div>
          <div className="btn-row">
            <button className="btn btn-outline" id="saveTypeGallery">보관함에 저장</button>
          </div>

          <div className="hint">
            <strong>SVIP TIP</strong>{" "}
            투명 PNG는 즉시 다운로드됩니다. GIF는 시그니처가 그려지는 모습을 담은 애니메이션으로, 처리에 10~15초 정도 걸립니다.
          </div>
        </div>

        <div className="stage">
          <div className="stage-header">
            <span className="stage-label">미리보기</span>
            <span className="stage-meta" id="typeMeta">800 × 320 px</span>
          </div>
          <div className="canvas-wrap">
            <canvas ref={canvasRef} id="typeCanvas" width="800" height="320"></canvas>
          </div>
        </div>
      </div>
    </div>
  );
}
