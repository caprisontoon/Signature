"use client";

import { useEffect, useRef } from "react";
import { handlePhotoFile, processPhoto } from "@/lib/photo";
import { renderStaticWithEffects } from "@/lib/ink";
import { makeFramePlanFromCanvas } from "@/lib/export/plan";
import { openFormatPicker } from "@/components/ui/FormatPicker";
import { saveToGallery } from "@/lib/gallery-storage";
import { toast, downloadURL } from "@/lib/utils";
import { getEffectsState } from "@/lib/effects";

const INK_COLORS = [
  { color: "#0f0e0c", label: "블랙" },
  { color: "#1a3a8a", label: "블루" },
  { color: "#8b2a2a", label: "레드" },
  { color: "#3d5544", label: "그린" },
  { color: "#FFFFFF", label: "화이트" },
];

export default function PhotoView({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const photoInput = document.getElementById("photoInput") as HTMLInputElement | null;
    const fileDrop = document.getElementById("fileDrop");
    const photoClear = document.getElementById("photoClear") as HTMLButtonElement | null;
    const inkColorInput = document.getElementById("photoInkColor") as HTMLInputElement | null;

    let _photoImage: HTMLImageElement | null = null;

    function doProcess() {
      if (!_photoImage || !canvas) return;
      const threshold = parseInt((document.getElementById("photoThreshold") as HTMLInputElement)?.value ?? "150");
      const cleanup = parseInt((document.getElementById("photoCleanup") as HTMLInputElement)?.value ?? "3");
      const color = inkColorInput?.value ?? "#0f0e0c";
      const ctx = canvas.getContext("2d");
      if (ctx) processPhoto(_photoImage, canvas, ctx, threshold, cleanup, color);
    }

    function loadFile(file: File) {
      handlePhotoFile(
        file,
        (img) => {
          _photoImage = img;
          doProcess();
          if (photoClear) photoClear.style.display = "";
        },
        () => toast("이미지 파일만 지원합니다")
      );
    }

    if (photoInput) {
      photoInput.addEventListener("change", () => {
        const file = photoInput.files?.[0];
        if (file) loadFile(file);
      });
    }

    // Drag & drop
    if (fileDrop) {
      fileDrop.addEventListener("dragover", e => { e.preventDefault(); fileDrop.classList.add("drag-over"); });
      fileDrop.addEventListener("dragleave", () => fileDrop.classList.remove("drag-over"));
      fileDrop.addEventListener("drop", (e) => {
        e.preventDefault();
        fileDrop.classList.remove("drag-over");
        const file = (e as DragEvent).dataTransfer?.files[0];
        if (file) loadFile(file);
      });
    }

    if (photoClear) {
      photoClear.addEventListener("click", () => {
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        photoClear.style.display = "none";
      });
    }

    // Ink color chips
    document.querySelectorAll(".photo-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        document.querySelectorAll(".photo-chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        const color = (chip as HTMLElement).dataset.photoColor ?? "#0f0e0c";
        if (inkColorInput) inkColorInput.value = color;
        doProcess();
      });
    });

    // PNG export
    document.getElementById("exportPhotoPNG")?.addEventListener("click", () => {
      const fxState = getEffectsState();
      const out = renderStaticWithEffects(canvas, fxState);
      out.toBlob(blob => {
        if (!blob) return;
        downloadURL(URL.createObjectURL(blob), "signature.png");
      });
    });

    // GIF/MP4/WebM export
    document.getElementById("exportPhotoGIF")?.addEventListener("click", () => {
      openFormatPicker((opts) => makeFramePlanFromCanvas(canvas, opts), "photo");
    });

    // Save to gallery
    document.getElementById("savePhotoGallery")?.addEventListener("click", () => {
      const fxState = getEffectsState();
      const out = renderStaticWithEffects(canvas, fxState);
      saveToGallery("Photo signature", out.toDataURL("image/png"));
      toast("보관함에 저장했습니다");
    });
  }, []);

  return (
    <div className={`view${active ? " active" : ""}`} id="view-photo">
      <div className="page-header">
        <div className="page-title-group">
          <h1>사진에서 가져오기</h1>
          <p>종이에 그린 서명을 사진으로 찍어 디지털로 변환합니다</p>
        </div>
      </div>
      <div className="workspace">
        <div className="panel">
          <div className="panel-title">사진 변환</div>

          <div className="field">
            <label>사진 업로드</label>
            <label className="file-drop" id="fileDrop">
              <div className="icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 14V3M10 3L6 7M10 3L14 7M3 15v1a2 2 0 002 2h10a2 2 0 002-2v-1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p>사진을 끌어다 놓거나 클릭하세요</p>
              <p>JPG · PNG · WEBP</p>
              <input type="file" id="photoInput" accept="image/*" />
            </label>
            <button className="btn btn-outline" id="photoClear" style={{ marginTop: "10px", display: "none" }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ verticalAlign: "-2px" }}>
                <path d="M4 4l6 6M10 4l-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
              사진 삭제
            </button>
          </div>

          <div className="field">
            <label>잉크 색상</label>
            <div className="font-grid" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
              {INK_COLORS.map((c, i) => (
                <button
                  key={c.color}
                  className={`font-chip photo-chip${i === 0 ? " active" : ""}`}
                  data-color={c.color}
                  data-photo-color={c.color}
                  style={{ "--chip-color": c.color } as React.CSSProperties}
                  aria-label={c.label}
                />
              ))}
            </div>
          </div>

          {/* Hidden inputs preserving original IDs */}
          <input type="hidden" id="photoThreshold" value="150" />
          <input type="hidden" id="photoCleanup" value="3" />
          <input type="hidden" id="photoInkColor" value="#0f0e0c" />

          <div className="btn-row">
            <button className="btn btn-secondary" id="previewPhoto">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 7s2-4 6-4 6 4 6 4-2 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              미리보기
            </button>
          </div>
          <div className="btn-row">
            <button className="btn btn-primary btn-stacked" id="exportPhotoPNG">
              <span className="btn-main">이미지 다운로드</span>
              <span className="btn-sub">PNG</span>
            </button>
            <button className="btn btn-svip btn-stacked" id="exportPhotoGIF">
              <span className="btn-main">애니메이션 다운로드</span>
              <span className="btn-sub">GIF · MP4 · WebM</span>
            </button>
          </div>
          <div className="btn-row">
            <button className="btn btn-outline" id="savePhotoGallery">보관함에 저장</button>
          </div>

          <div className="hint">
            <strong>SVIP TIP</strong>{" "}
            흰 종이에 검은 펜으로 서명하고 밝게 찍은 사진이 가장 깔끔하게 변환됩니다.
          </div>
        </div>

        <div className="stage">
          <div className="stage-header">
            <span className="stage-label">변환 결과</span>
            <span className="stage-meta">투명 배경으로 추출됩니다</span>
          </div>
          <div className="canvas-wrap">
            <canvas ref={canvasRef} id="photoCanvas" width="800" height="320"></canvas>
          </div>
        </div>
      </div>
    </div>
  );
}
