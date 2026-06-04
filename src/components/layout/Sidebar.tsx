"use client";

import { useEffect, useRef } from "react";
import type { ViewId } from "@/types";

interface SidebarProps {
  activeView: ViewId;
  onViewChange: (view: ViewId) => void;
}

export default function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Today date
    const el = document.getElementById("todayDate");
    if (el) {
      const d = new Date();
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      el.textContent = `${yyyy}.${mm}.${dd}`;
    }

    // Theme toggle
    const toggle = document.getElementById("themeToggle");
    if (toggle) {
      const handler = () => {
        const html = document.documentElement;
        html.dataset.theme = html.dataset.theme === "dark" ? "light" : "dark";
      };
      toggle.addEventListener("click", handler);
      return () => toggle.removeEventListener("click", handler);
    }
  }, []);

  useEffect(() => {
    // Sidebar toggle (hamburger)
    const toggle = document.getElementById("sidebarToggle");
    const backdrop = document.getElementById("sidebarBackdrop");
    const sidebar = sidebarRef.current;
    const body = document.body;
    let autoCollapsedOnce = false;

    function applyAutoCollapse() {
      const w = window.innerWidth;
      if (sidebar && w > 768) {
        sidebar.classList.remove("open");
        body.classList.remove("sidebar-open");
      }
      if (w > 1200) {
        body.classList.remove("sidebar-force-open");
      }
      if (w > 768 && w <= 1200) {
        if (!body.classList.contains("sidebar-collapsed")) {
          body.classList.add("sidebar-collapsed");
          autoCollapsedOnce = true;
        }
      } else if (w > 1200) {
        if (autoCollapsedOnce && body.classList.contains("sidebar-collapsed")) {
          body.classList.remove("sidebar-collapsed");
          autoCollapsedOnce = false;
        }
      }
    }

    function handleToggle() {
      const w = window.innerWidth;
      if (w > 1200) {
        body.classList.toggle("sidebar-collapsed");
      } else if (w > 768) {
        body.classList.toggle("sidebar-force-open");
      } else {
        if (sidebar) sidebar.classList.toggle("open");
        body.classList.toggle("sidebar-open");
      }
    }

    function closeMobile() {
      if (sidebar) sidebar.classList.remove("open");
      body.classList.remove("sidebar-open");
    }

    applyAutoCollapse();
    window.addEventListener("resize", applyAutoCollapse);
    toggle?.addEventListener("click", handleToggle);
    backdrop?.addEventListener("click", closeMobile);

    return () => {
      window.removeEventListener("resize", applyAutoCollapse);
      toggle?.removeEventListener("click", handleToggle);
      backdrop?.removeEventListener("click", closeMobile);
    };
  }, []);

  const handleTabClick = (view: ViewId) => {
    if (window.innerWidth <= 768) {
      const sidebar = sidebarRef.current;
      const body = document.body;
      if (sidebar) sidebar.classList.remove("open");
      body.classList.remove("sidebar-open");
    }
    onViewChange(view);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <aside className="sidebar" id="sidebar" ref={sidebarRef}>
      <button className="sidebar-toggle" id="sidebarToggle" aria-label="사이드바 접기/펼치기">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M3 5h12M3 9h12M3 13h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>

      <button
        className="brand"
        id="brandHome"
        type="button"
        aria-label="홈으로 이동"
        onClick={() => handleTabClick("draw")}
      >
        <div className="brand-logo">
          <svg viewBox="0 0 220 80" xmlns="http://www.w3.org/2000/svg">
            <g fill="#5C9CFA">
              <rect x="14" y="14" width="26" height="52" rx="13" />
              <rect x="0" y="28" width="54" height="26" rx="13" />
            </g>
            <g>
              <circle cx="90" cy="40" r="28" fill="#C7DDFF" />
              <circle cx="90" cy="40" r="11" fill="var(--bg-normal)" />
            </g>
            <g>
              <circle cx="158" cy="40" r="28" fill="#5C9CFA" />
              <circle cx="158" cy="40" r="11" fill="var(--bg-normal)" />
            </g>
          </svg>
        </div>
        <div className="brand-text">
          <span className="brand-name">toonation</span>
          <span className="brand-product">Signature Studio</span>
        </div>
      </button>

      <nav className="sidebar-nav">
        <div className="nav-section-label">시그니처</div>
        <button
          className={`tab ${activeView === "draw" ? "active" : ""}`}
          data-view="draw"
          onClick={() => handleTabClick("draw")}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M3 15L4 11L12 3L15 6L7 14L3 15Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10 5L13 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <span className="tab-label">Draw</span>
        </button>
        <button
          className={`tab ${activeView === "type" ? "active" : ""}`}
          data-view="type"
          onClick={() => handleTabClick("type")}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M4 4h10M9 4v10M6 14h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="tab-label">Type</span>
        </button>
        <button
          className={`tab ${activeView === "photo" ? "active" : ""}`}
          data-view="photo"
          onClick={() => handleTabClick("photo")}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="2.5" y="4.5" width="13" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="9" cy="9.5" r="2.5" stroke="currentColor" strokeWidth="1.6" />
            <path d="M6.5 4.5L7.5 2.5h3l1 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <span className="tab-label">Photograph</span>
        </button>

        <div className="nav-section-label">보관함</div>
        <button
          className={`tab ${activeView === "gallery" ? "active" : ""}`}
          data-view="gallery"
          onClick={() => handleTabClick("gallery")}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="2.5" y="2.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.6" />
            <rect x="9.5" y="2.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.6" />
            <rect x="2.5" y="9.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.6" />
            <rect x="9.5" y="9.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.6" />
          </svg>
          <span className="tab-label">보관함</span>
        </button>
      </nav>

      <div className="sidebar-footer">
        <div className="theme-toggle" id="themeToggle">
          <div className="theme-toggle-label">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M13 9.5A5.5 5.5 0 016.5 3 5.5 5.5 0 1013 9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
            <span className="theme-label-text">다크 모드</span>
          </div>
          <div className="toggle-switch"></div>
        </div>
        <div
          style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: "10px",
            color: "var(--label-alternative)",
            marginTop: "12px",
            padding: "0 12px",
            letterSpacing: "0.05em",
          }}
          id="todayDate"
        >
          —
        </div>
      </div>
    </aside>
  );
}
