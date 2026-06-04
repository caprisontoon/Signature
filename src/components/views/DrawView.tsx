"use client";

import { useEffect, useRef } from "react";
import { startDraw, moveDraw, endDraw, redrawAll } from "@/lib/drawing";
import { reapplySmoothingFromRaw } from "@/lib/drawing/smoothing";
import { renderStaticWithEffects } from "@/lib/ink";
import { makeFramePlanFromStrokes } from "@/lib/export/plan";
import { openFormatPicker } from "@/components/ui/FormatPicker";
import { saveToGallery } from "@/lib/gallery-storage";
import { toast, downloadURL } from "@/lib/utils";
import { getEffectsState } from "@/lib/effects";
import type { Stroke } from "@/types";

export default function DrawView({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const initialized = useRef(false);

  // Ref-wrapped mutable state (matches drawing lib's expected interface)
  const strokes = useRef<Stroke[]>([]);
  const currentStroke = useRef<{ value: Stroke | null }>({ value: null });
  const drawing = useRef<{ value: boolean }>({ value: false });
  const undoStack = useRef<{ value: Stroke[] }>({ value: [] });
  const inkColor = useRef("#0f0e0c");
  const strokeWidth = useRef(10);
  const smoothLevel = useRef(0);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    // Stroke width slider
    const strokeRange = document.getElementById("drawStroke") as HTMLInputElement | null;
    const strokeVal = document.getElementById("drawStrokeVal");
    if (strokeRange && strokeVal) {
      strokeRange.addEventListener("input", () => {
        strokeWidth.current = parseFloat(strokeRange.value);
        strokeVal.textContent = strokeRange.value;
      });
    }

    // Smooth slider
    const smoothRange = document.getElementById("drawSmooth") as HTMLInputElement | null;
    const smoothValEl = document.getElementById("drawSmoothVal");
    const smoothDown = document.getElementById("drawSmoothDown");
    const smoothUp = document.getElementById("drawSmoothUp");

    function updateSmoothUI() {
      if (smoothRange) smoothRange.value = String(smoothLevel.current);
      if (smoothValEl) smoothValEl.textContent = `${smoothLevel.current}단계`;
    }

    function doStepSmooth(next: number) {
      smoothLevel.current = Math.max(0, Math.min(10, next));
      strokes.current = reapplySmoothingFromRaw(strokes.current, smoothLevel.current);
      redrawAll(ctx, canvas, strokes.current);
      updateSmoothUI();
    }

    if (smoothRange) {
      smoothRange.addEventListener("input", () => doStepSmooth(parseInt(smoothRange.value)));
    }
    if (smoothDown) {
      smoothDown.addEventListener("click", () => {
        if (smoothLevel.current <= 0) return;
        doStepSmooth(smoothLevel.current - 1);
      });
    }
    if (smoothUp) {
      smoothUp.addEventListener("click", () => {
        if (smoothLevel.current >= 10) return;
        doStepSmooth(smoothLevel.current + 1);
      });
    }

    // Pointer events
    canvas.addEventListener("pointerdown", e => {
      canvas.setPointerCapture(e.pointerId);
      startDraw(e, canvas, drawing.current, currentStroke.current, undoStack.current, inkColor.current, strokeWidth.current);
    });
    canvas.addEventListener("pointermove", e => moveDraw(e, canvas, ctx, drawing.current, currentStroke.current));
    canvas.addEventListener("pointerup", e => {
      endDraw(e, canvas, ctx, drawing.current, currentStroke.current, strokes.current, smoothLevel.current);
    });
    canvas.addEventListener("pointercancel", e => {
      endDraw(e, canvas, ctx, drawing.current, currentStroke.current, strokes.current, smoothLevel.current);
    });

    // Undo
    document.getElementById("drawUndo")?.addEventListener("click", () => {
      if (strokes.current.length === 0) return;
      undoStack.current.value = [...strokes.current];
      strokes.current.pop();
      redrawAll(ctx, canvas, strokes.current);
    });

    // Clear
    document.getElementById("drawClear")?.addEventListener("click", () => {
      undoStack.current.value = [...strokes.current];
      strokes.current = [];
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    // Preview
    document.getElementById("previewDraw")?.addEventListener("click", () => {
      redrawAll(ctx, canvas, strokes.current);
      toast("미리보기 완료");
    });

    // PNG export
    document.getElementById("exportDrawPNG")?.addEventListener("click", () => {
      const fxState = getEffectsState();
      const out = renderStaticWithEffects(canvas, fxState);
      out.toBlob(blob => {
        if (!blob) return;
        downloadURL(URL.createObjectURL(blob), "signature.png");
      });
    });

    // GIF/MP4/WebM export via format picker
    document.getElementById("exportDrawGIF")?.addEventListener("click", () => {
      openFormatPicker(
        (opts) => makeFramePlanFromStrokes(strokes.current, canvas.width, canvas.height, opts),
        "draw"
      );
    });

    // Save to gallery
    document.getElementById("saveDrawGallery")?.addEventListener("click", () => {
      const fxState = getEffectsState();
      const out = renderStaticWithEffects(canvas, fxState);
      saveToGallery("Draw signature", out.toDataURL("image/png"));
      toast("보관함에 저장했습니다");
    });
  }, []);

  return (
    <div className={`view${active ? " active" : ""}`} id="view-draw">
      <div className="page-header">
        <div className="page-title-group">
          <h1>직접 그려서 만들기</h1>
          <p>마우스나 펜으로 자유롭게 시그니처를 그려보세요</p>
        </div>
      </div>
      <div className="workspace">
        <div className="panel">
          <div className="panel-title">펜 설정</div>

          <div className="field">
            <label>굵기</label>
            <div className="range-row">
              <input type="range" id="drawStroke" min="1" max="20" defaultValue="10" step="0.5" />
              <span className="val" id="drawStrokeVal">10</span>
            </div>
          </div>

          <div className="field">
            <label>곡선 보정</label>
            <div className="smooth-stepper">
              <button type="button" className="smooth-btn" id="drawSmoothDown" aria-label="보정 한 단계 줄이기">−</button>
              <input type="range" id="drawSmooth" min="0" max="10" defaultValue="0" step="1" style={{ flex: 1 }} />
              <button type="button" className="smooth-btn" id="drawSmoothUp" aria-label="보정 한 단계 늘리기">+</button>
            </div>
            <div style={{ textAlign: "center", marginTop: "4px" }}>
              <span className="smooth-level" id="drawSmoothVal">0단계</span>
            </div>
          </div>

          <div className="btn-row">
            <button className="btn btn-secondary" id="drawUndo">되돌리기</button>
            <button className="btn btn-danger" id="drawClear">전체 지우기</button>
          </div>

          <div className="btn-row">
            <button className="btn btn-secondary" id="previewDraw">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 7s2-4 6-4 6 4 6 4-2 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              미리보기
            </button>
          </div>

          <div className="btn-row">
            <button className="btn btn-primary btn-stacked" id="exportDrawPNG">
              <span className="btn-main">이미지 다운로드</span>
              <span className="btn-sub">PNG</span>
            </button>
            <button className="btn btn-svip btn-stacked" id="exportDrawGIF">
              <span className="btn-main">애니메이션 다운로드</span>
              <span className="btn-sub">GIF · MP4 · WebM</span>
            </button>
          </div>
          <div className="btn-row">
            <button className="btn btn-outline" id="saveDrawGallery">보관함에 저장</button>
          </div>

          <div className="hint">
            <strong>SVIP TIP</strong>{" "}
            마우스·트랙패드·애플펜슬로 그린 후 곡선 보정의 + 버튼을 한 번씩 누르면 한 단계씩 더 부드럽게 정돈됩니다. − 버튼으로 한 단계씩 되돌릴 수 있습니다.
          </div>
        </div>

        <div className="stage">
          <div className="stage-header">
            <span className="stage-label">화판</span>
            <span className="stage-meta">자유롭게 그려보세요</span>
          </div>
          <div className="canvas-wrap">
            <canvas ref={canvasRef} id="drawCanvas" width="800" height="380"></canvas>
          </div>
        </div>
      </div>
    </div>
  );
}
