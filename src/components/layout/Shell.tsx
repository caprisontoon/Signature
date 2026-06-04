"use client";

import type { ReactNode } from "react";
import type { ViewId } from "@/types";
import Sidebar from "./Sidebar";
import EffectsBar from "./EffectsBar";

interface ShellProps {
  activeView: ViewId;
  onViewChange: (v: ViewId) => void;
  children: ReactNode;
}

export default function Shell({ activeView, onViewChange, children }: ShellProps) {
  return (
    <div className="app">
      {/* Mobile floating hamburger */}
      <button
        className="sidebar-toggle-mobile"
        id="sidebarToggleMobile"
        aria-label="메뉴 열기"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M4 6h12M4 10h12M4 14h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Sidebar backdrop (mobile) */}
      <div className="sidebar-backdrop" id="sidebarBackdrop"></div>

      <Sidebar activeView={activeView} onViewChange={onViewChange} />

      <main className="main">
        {/* Hero banner */}
        <div className="hero-banner">
          <div className="hero-content">
            <span className="hero-eyebrow">SVIP EXCLUSIVE</span>
            <div className="hero-title">투네이션 SVIP 시그니처 이펙트</div>
            <div className="hero-subtitle">후원자 화면에 나만의 시그니처를 멋진 이펙트와 함께 노출하세요</div>
          </div>
        </div>

        {/* Effects bar — shared across Type / Draw / Photo views */}
        {activeView !== "gallery" && <EffectsBar />}

        {children}
      </main>
    </div>
  );
}
