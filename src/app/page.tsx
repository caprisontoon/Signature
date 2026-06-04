"use client";

import { useState } from "react";
import type { ViewId } from "@/types";
import Shell from "@/components/layout/Shell";
import TypeView from "@/components/views/TypeView";
import DrawView from "@/components/views/DrawView";
import PhotoView from "@/components/views/PhotoView";
import GalleryView from "@/components/views/GalleryView";
import PreviewModal from "@/components/ui/PreviewModal";
import FormatPicker from "@/components/ui/FormatPicker";

export default function Home() {
  const [activeView, setActiveView] = useState<ViewId>("draw");

  return (
    <>
      <Shell activeView={activeView} onViewChange={setActiveView}>
        <TypeView active={activeView === "type"} />
        <DrawView active={activeView === "draw"} />
        <PhotoView active={activeView === "photo"} />
        <GalleryView active={activeView === "gallery"} />

        <footer className="app-footer">
          <div className="footer-brand">
            <svg width="20" height="20" viewBox="0 0 220 80">
              <g fill="currentColor">
                <rect x="14" y="14" width="26" height="52" rx="13"/>
                <rect x="0" y="28" width="54" height="26" rx="13"/>
              </g>
              <circle cx="90" cy="40" r="28" fill="currentColor"/>
              <circle cx="90" cy="40" r="11" fill="var(--bg-alternative)"/>
              <circle cx="158" cy="40" r="28" fill="currentColor"/>
              <circle cx="158" cy="40" r="11" fill="var(--bg-alternative)"/>
            </svg>
            © 2026 TOONATION · SVIP Signature Effect Studio
          </div>
          <div style={{ display: "flex", gap: "16px", alignItems: "center", fontFamily: "'JetBrains Mono', monospace" }}>
            <span>v1.0</span>
            <span style={{ color: "var(--toonation-blue)", fontSize: "16px", lineHeight: "1" }}>●</span>
          </div>
        </footer>
      </Shell>

      {/* Global modals rendered outside Shell to avoid stacking context issues */}
      <PreviewModal />
      <FormatPicker />
    </>
  );
}
