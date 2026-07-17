"use client";
import clsx from "clsx";
import { Icon } from "@/components/atoms/Icon";
import { NavItemDef, NavPage } from "@/types";
interface P { item: NavItemDef; active: boolean; onNavigate: (p:NavPage)=>void; }
export function NavItem({ item, active, onNavigate }: P) {
  return (
    <button
      className={clsx("sidebar__nav-item", active && "sidebar__nav-item--active")}
      onClick={() => onNavigate(item.page)}
      title={item.label}
    >
      <Icon name={item.icon} />
      <span>{item.label}</span>
      {item.badge && <span className={clsx("sidebar__badge", `sidebar__badge--${item.badgeType}`)}>{item.badge}</span>}
    </button>
  );
}
