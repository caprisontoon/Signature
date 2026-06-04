"use client";

import { useEffect, useRef } from "react";
import { initEffectGallery, selectEffect, _fxLoop } from "@/lib/effects/gallery";
import { handleFxVideoFile, clearFxVideo } from "@/lib/effects/video";

export default function EffectsBar() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Build effect gallery cards
    initEffectGallery();

    // Start the rAF preview loop
    requestAnimationFrame(_fxLoop);

    // FX Effect select change listener
    const sel = document.getElementById("fxEffect") as HTMLSelectElement | null;
    if (sel) {
      sel.addEventListener("change", () => {
        selectEffect(sel.value as any);
      });
    }

    // Toggle accordion expand/collapse
    const toggle = document.getElementById("fxToggle");
    const grid = document.getElementById("fxGrid");
    if (toggle && grid) {
      toggle.addEventListener("click", () => {
        const expanded = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", String(!expanded));
        const pill = toggle.querySelector(".fx-toggle-text");
        if (pill) pill.textContent = expanded ? "더 보기" : "접기";
        grid.classList.toggle("fx-grid-collapsed", expanded);
      });
    }

    // Video file upload
    const videoInput = document.getElementById("fxVideoInput") as HTMLInputElement | null;
    const videoName = document.getElementById("fxVideoName");
    const videoRemove = document.getElementById("fxVideoRemove") as HTMLButtonElement | null;

    if (videoInput) {
      videoInput.addEventListener("change", async () => {
        const file = videoInput.files?.[0];
        if (!file) return;
        await handleFxVideoFile(file);
        if (videoName) videoName.textContent = file.name;
        if (videoRemove) videoRemove.style.display = "";
        videoInput.value = "";
      });
    }

    if (videoRemove) {
      videoRemove.addEventListener("click", () => {
        clearFxVideo();
        if (videoName) videoName.textContent = "";
        videoRemove.style.display = "none";
      });
    }
  }, []);

  return (
    <div className="fx-bar" id="fxBar">
      <div className="fx-section fx-section-effects">
        <div className="fx-label">특수 효과 — 카드를 클릭해서 선택</div>
        <div className="fx-grid fx-grid-collapsed" id="fxGrid">
          {/* Cards injected by JS via initEffectGallery() */}
        </div>
        <button type="button" className="fx-toggle" id="fxToggle" aria-expanded="false">
          <span className="fx-toggle-line"></span>
          <span className="fx-toggle-pill">
            <span className="fx-toggle-text">더 보기</span>
            <svg className="fx-toggle-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          <span className="fx-toggle-line"></span>
        </button>

        {/* Hidden select — source of truth read by existing lib code */}
        <select id="fxEffect" style={{ display: "none" }}>
          <option value="none">— 없음</option>
          <option value="custom-video">내 영상 · 영상 업로드</option>
          <option value="stamp">Stamp · 도장 · 낙관</option>
          <option value="epic-fire">Epic Fire · 불꽃 시네마틱</option>
          <option value="matrix">Matrix · 디지털 레인</option>
          <option value="sparks">Sparks · 불꽃</option>
          <option value="cinematic">Cinematic · 시네마틱</option>
          <option value="svip-gold">SVIP Gold · 황금 별빛</option>
          <option value="svip-purple">SVIP Purple · 보랏빛 광선</option>
          <option value="vip-aqua">VIP Aqua · 청록 링</option>
        </select>

        <div className="fx-video-row">
          <label className="fx-file" id="fxVideoUpload">
            <input type="file" accept="video/mp4,video/webm,video/*" id="fxVideoInput" />
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ verticalAlign: "-2px", marginRight: "4px" }}>
              <path d="M1 3.5A1.5 1.5 0 012.5 2h6A1.5 1.5 0 0110 3.5v7A1.5 1.5 0 018.5 12h-6A1.5 1.5 0 011 10.5v-7z" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M10 5.5L13 4v6l-3-1.5" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
            </svg>
            내 영상 업로드
          </label>
          <span className="fx-video-name" id="fxVideoName"></span>
          <button type="button" className="fx-video-remove" id="fxVideoRemove" style={{ display: "none" }}>삭제</button>
        </div>
      </div>
    </div>
  );
}
