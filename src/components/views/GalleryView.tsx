"use client";

import { useEffect } from "react";
import { renderGallery, deleteFromGallery } from "@/lib/gallery-storage";
import { downloadURL } from "@/lib/utils";
import type { GalleryEntry } from "@/types";

export default function GalleryView({ active }: { active: boolean }) {
  useEffect(() => {
    if (!active) {
      document.body.classList.remove("gallery-mode");
      return;
    }
    document.body.classList.add("gallery-mode");
    doRenderGallery();
  }, [active]);

  function doRenderGallery() {
    const grid = document.getElementById("galleryGrid");
    const empty = document.getElementById("galleryEmpty");
    if (!grid || !empty) return;

    renderGallery(
      grid,
      empty,
      (entry: GalleryEntry) => {
        downloadURL(entry.dataURL, `${entry.name || "signature"}.png`);
      },
      async (entry: GalleryEntry) => {
        await deleteFromGallery(entry.id);
        doRenderGallery();
      },
      (_entry: GalleryEntry) => {
        // Use request — placeholder
        alert("사용 요청 기능은 준비 중입니다.");
      }
    );
  }

  return (
    <div className={`view${active ? " active" : ""}`} id="view-gallery">
      <div className="page-header">
        <div className="page-title-group">
          <h1>내 시그니처 보관함</h1>
          <p>저장된 시그니처는 이 브라우저에만 보관되며, 다른 기기에서는 접근할 수 없습니다.</p>
        </div>
      </div>
      <div id="galleryGrid" className="gallery-grid"></div>
      <div id="galleryEmpty" className="empty-state" style={{ gridColumn: "1/-1" }}>
        <div className="glyph">📁</div>
        <div>아직 보관된 시그니처가 없습니다</div>
      </div>
    </div>
  );
}
