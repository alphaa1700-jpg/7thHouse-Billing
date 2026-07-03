"use client";
import { useEffect, useState } from "react";
import { NavPage } from "@/types";
import { Icon } from "@/components/atoms/Icon";
import { Button } from "@/components/atoms/Button";

const TITLES: Record<NavPage, string> = {
  dashboard:"Dashboard", pos:"Point of Sale", orders:"Orders", tables:"Tables", menu:"Menu",
  inventory:"Inventory", staff:"Staff", analytics:"Analytics", customers:"Customers", settings:"Settings",
};
interface P { activePage:NavPage; onNewOrder:()=>void; onAlert:()=>void; onMenuToggle:()=>void; }

export function Topbar({ activePage, onNewOrder, onAlert, onMenuToggle }: P) {
  const [clock, setClock] = useState("");
  const [theme, setTheme] = useState<"cream"|"coffee">("cream");

  // Load saved theme on mount
  useEffect(() => {
    const saved = (localStorage.getItem("7hc-theme") as "cream"|"coffee") || "cream";
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved === "coffee" ? "coffee" : "");
  }, []);

  // Clock tick
  useEffect(()=>{
    const tick = ()=>setClock(new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",second:"2-digit"}));
    tick(); const id=setInterval(tick,1000); return ()=>clearInterval(id);
  },[]);

  const toggleTheme = () => {
    const next = theme === "cream" ? "coffee" : "cream";
    setTheme(next);
    localStorage.setItem("7hc-theme", next);
    document.documentElement.setAttribute("data-theme", next === "coffee" ? "coffee" : "");
  };

  const isCoffee = theme === "coffee";

  return (
    <header className="topbar">
      <div className="flex items-center gap-3">
        <button className="topbar__chip sm:hidden" onClick={onMenuToggle} aria-label="Open menu">
          <Icon name="ti-menu-2" />
        </button>
        <div className="topbar__title">{TITLES[activePage]}</div>
      </div>
      <div className="topbar__right">
        <div className="topbar__chip hidden sm:flex"><Icon name="ti-clock" /><span>{clock}</span></div>

        {/* Theme toggle */}
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={isCoffee ? "Switch to Cream theme" : "Switch to Coffee theme"}
          title={isCoffee ? "Switch to Cream" : "Switch to Coffee"}
        >
          <span className={`theme-toggle__track ${isCoffee ? "theme-toggle__track--coffee" : "theme-toggle__track--cream"}`}>
            <span className="theme-toggle__thumb">
              {isCoffee
                ? <i className="ti ti-coffee" style={{fontSize:11}}/>
                : <i className="ti ti-sun" style={{fontSize:11}}/>
              }
            </span>
            <span className="theme-toggle__label">
              {isCoffee ? "Coffee" : "Cream"}
            </span>
          </span>
        </button>

        <button className="topbar__chip" onClick={onAlert}><Icon name="ti-bell" /><span className="hidden sm:inline">Alerts</span></button>
        <Button variant="brew" onClick={onNewOrder}><Icon name="ti-plus" /><span className="hidden sm:inline">New Order</span></Button>
      </div>
    </header>
  );
}