"use client";
import { NavPage, NavItemDef } from "@/types";
import { NAV_ITEMS } from "@/lib/data";
import { NavItem } from "@/components/molecules/NavItem";
import clsx from "clsx";

interface SidebarProps {
  activePage:      NavPage;
  onNavigate:      (p: NavPage) => void;
  mobileOpen?:     boolean;
  onOverlayClick?: () => void;
  badgeCounts?:    Partial<Record<NavPage, string | number>>;
}
export function Sidebar({ activePage, onNavigate, mobileOpen, onOverlayClick, badgeCounts = {} }: SidebarProps) {
  let lastSection: string | undefined;
  const items: NavItemDef[] = NAV_ITEMS.map(item => {
    const live = badgeCounts[item.page];
    return live !== undefined ? { ...item, badge: String(live) } : item;
  });
  return (
    <>
      {mobileOpen && <div className="sidebar-overlay" onClick={onOverlayClick} />}
      <aside className={clsx("sidebar", mobileOpen && "sidebar--open")}>
        <div className="sidebar__logo-area">
          <div className="sidebar__icon-wrap">
            <svg className="sidebar__cup-svg" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="7th House Coffee">
              <circle cx="32" cy="38" r="20" fill="url(#glowGrad)" opacity="0.18" />
              <ellipse cx="32" cy="54" rx="18" ry="4" fill="url(#saucerGrad)" />
              <ellipse cx="32" cy="53" rx="14" ry="2.5" fill="url(#saucerTopGrad)" />
              <path d="M18 32 L20 52 Q20 55 24 55 L40 55 Q44 55 44 52 L46 32 Z" fill="url(#cupGrad)" />
              <ellipse cx="32" cy="32" rx="14" ry="3.5" fill="url(#rimGrad)" />
              <ellipse cx="32" cy="32" rx="11" ry="2.5" fill="url(#coffeeGrad)" />
              <path d="M28 31 Q30 29.5 32 31 Q34 32.5 36 31" stroke="#E8C89A" strokeWidth="0.8" strokeLinecap="round" opacity="0.6" />
              <circle cx="32" cy="31.5" r="1" fill="#E8C89A" opacity="0.35" />
              <path d="M46 36 Q54 36 54 42 Q54 48 46 48" stroke="url(#handleGrad)" strokeWidth="3" strokeLinecap="round" fill="none" />
              <path d="M46 38 Q51 38 51 42 Q51 46 46 46" stroke="url(#handleInnerGrad)" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.4" />
              <path className="sidebar__steam-path sidebar__steam-path--1" d="M26 28 Q24 24 26 20 Q28 16 26 12" stroke="url(#steamGrad)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              <path className="sidebar__steam-path sidebar__steam-path--2" d="M32 27 Q30 22 32 18 Q34 14 32 10" stroke="url(#steamGrad)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              <path className="sidebar__steam-path sidebar__steam-path--3" d="M38 28 Q36 24 38 20 Q40 16 38 12" stroke="url(#steamGrad)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              <path d="M22 36 Q23 32 22 38" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.15" />
              <defs>
                <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#C8874A" /><stop offset="100%" stopColor="#C8874A" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="cupGrad" x1="18" y1="32" x2="46" y2="55" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#C8874A" /><stop offset="50%" stopColor="#A06030" /><stop offset="100%" stopColor="#7a4520" />
                </linearGradient>
                <linearGradient id="rimGrad" x1="18" y1="28" x2="46" y2="36" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#E8A060" /><stop offset="100%" stopColor="#B06030" />
                </linearGradient>
                <radialGradient id="coffeeGrad" cx="40%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="#2a1205" /><stop offset="100%" stopColor="#1a0c04" />
                </radialGradient>
                <linearGradient id="saucerGrad" x1="14" y1="50" x2="50" y2="58" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#8B5E3C" /><stop offset="100%" stopColor="#5a3a20" />
                </linearGradient>
                <linearGradient id="saucerTopGrad" x1="18" y1="50" x2="46" y2="56" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#C8874A" /><stop offset="100%" stopColor="#8B5E3C" />
                </linearGradient>
                <linearGradient id="handleGrad" x1="46" y1="36" x2="54" y2="48" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#C8874A" /><stop offset="100%" stopColor="#8B5E3C" />
                </linearGradient>
                <linearGradient id="handleInnerGrad" x1="46" y1="38" x2="51" y2="46" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#E8C89A" /><stop offset="100%" stopColor="#C8874A" />
                </linearGradient>
                <linearGradient id="steamGrad" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
                  <stop offset="0%" stopColor="#C8874A" stopOpacity="0" />
                  <stop offset="50%" stopColor="#C8874A" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#C8874A" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
            <div className="sidebar__icon-glow" />
          </div>
          <div className="sidebar__logo-name">7th House Coffee</div>
          <div className="sidebar__logo-tag">Admin Console</div>
        </div>
        <nav className="sidebar__nav">
          {items.map((item) => {
            const showSection = item.section && item.section !== lastSection;
            if (item.section) lastSection = item.section;
            return (
              <div key={item.page}>
                {showSection && <div className="sidebar__section-label">{item.section}</div>}
                <NavItem item={item} active={activePage === item.page} onNavigate={onNavigate} />
              </div>
            );
          })}
        </nav>
        <div className="sidebar__footer">
          <div className="sidebar__admin-row">
            <div className="sidebar__admin-av">AD</div>
            <div className="flex-1">
              <div className="sidebar__admin-name">Admin</div>
              <div className="sidebar__admin-role">Owner · Full Access</div>
            </div>
            <div className="online-dot" />
          </div>
        </div>
      </aside>
    </>
  );
}