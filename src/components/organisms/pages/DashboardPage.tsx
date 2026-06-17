"use client";
import { useState } from "react";
import { Order, StockItem } from "@/types";
import { OrderRow }     from "@/components/molecules/OrderRow";
import { StockRow }     from "@/components/molecules/StockRow";
import { StaffRow }     from "@/components/molecules/StaffRow";
import { SectionTitle } from "@/components/atoms/SectionTitle";
import { Badge }        from "@/components/atoms/Badge";
interface StaffOnDutyMember {
  initials: string; name: string; role: string;
  shift: string; onDuty: boolean; color: string;
  imageUrl?: string;
}
interface DashboardPageProps {
  orders:          Order[];
  allOrdersToday:  Order[];
  stockItems:      StockItem[];
  staffOnDuty:     StaffOnDutyMember[];
}
function SalesChart({ data, fmtHour }: {
  data: { hour: number; revenue: number }[];
  fmtHour: (h: number) => string;
}) {
  const [tooltip, setTooltip] = useState<{ hour: number; revenue: number; x: number; y: number } | null>(null);
  const activeData  = data.filter(d => d.revenue > 0);
  const maxRevenue  = Math.max(...data.map(d => d.revenue), 1);
  const yMax        = Math.ceil(maxRevenue / 100) * 100 || 500;
  const W = 420, H = 130, padL = 36, padR = 12, padT = 16, padB = 28;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const toX = (i: number) => padL + (i / (data.length - 1)) * chartW;
  const toY = (v: number) => padT + chartH - (v / yMax) * chartH;
  const points = data.map((d, i) => ({ x: toX(i), y: toY(d.revenue), ...d }));
  const pathD = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x},${p.y}`;
    const prev = points[i - 1];
    const cx1 = prev.x + (p.x - prev.x) * 0.5;
    const cx2 = p.x  - (p.x - prev.x) * 0.5;
    return `${acc} C ${cx1},${prev.y} ${cx2},${p.y} ${p.x},${p.y}`;
  }, "");
  const areaD = pathD
    + ` L ${points[points.length - 1].x},${padT + chartH}`
    + ` L ${points[0].x},${padT + chartH} Z`;
  const yLabels = [0, Math.round(yMax * 0.5), yMax];
  return (
    <div style={{ position:"relative" }}>
      {tooltip && (
        <div style={{
          position:"absolute",
          left: Math.min(tooltip.x - 20, W - 110),
          top:  Math.max(0, tooltip.y - 44),
          background:"#1a0e06", border:"1px solid rgba(200,135,74,0.6)",
          borderRadius:8, padding:"5px 11px", fontSize:12,
          color:"#2c1a0e", fontWeight:600, zIndex:20,
          whiteSpace:"nowrap", pointerEvents:"none",
          boxShadow:"0 4px 20px rgba(0,0,0,0.5)",
        }}>
          <span style={{ color:"#C8761A", marginRight:4 }}>{fmtHour(tooltip.hour)}</span>
          ₹{tooltip.revenue.toLocaleString("en-IN")}
        </div>
      )}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%" height={H}
        style={{ overflow:"visible", display:"block" }}
      >
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#C8761A" stopOpacity="0.35"/>
            <stop offset="100%" stopColor="#C8761A" stopOpacity="0.02"/>
          </linearGradient>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#E8A45A"/>
            <stop offset="100%" stopColor="#C8761A"/>
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        {yLabels.map((v, i) => {
          const y = toY(v);
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={W - padR} y2={y}
                stroke={v === 0 ? "#3a2510" : "#1e1008"} strokeWidth={1} strokeDasharray={v > 0 ? "3,4" : ""}/>
              <text x={padL - 4} y={y + 3.5} textAnchor="end"
                style={{ fontSize:9, fill:"#6b4a2a", fontFamily:"DM Sans,sans-serif" }}>
                {v >= 1000 ? `₹${(v/1000).toFixed(1)}k` : `₹${v}`}
              </text>
            </g>
          );
        })}
        <line x1={padL} y1={padT + chartH} x2={W - padR} y2={padT + chartH} stroke="#3a2510" strokeWidth={1}/>
        {activeData.length > 0 && (
          <path d={areaD} fill="url(#areaGrad)"/>
        )}
        {activeData.length > 0 && (
          <path d={pathD} fill="none" stroke="url(#lineGrad)" strokeWidth={2.5}
            strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)"/>
        )}
        {points.map((p, i) => (
          i % 3 === 0 && (
            <text key={i} x={p.x} y={H - 4} textAnchor="middle"
              style={{ fontSize:8, fill: p.revenue > 0 ? "#C8761A" : "#6B4E35", fontFamily:"DM Sans,sans-serif", fontWeight: p.revenue > 0 ? 600 : 400 }}>
              {fmtHour(p.hour)}
            </text>
          )
        ))}
        {points.map((p, i) => p.revenue > 0 && (
          <g key={i}>
            {tooltip?.hour === p.hour && (
              <circle cx={p.x} cy={p.y} r={10} fill="rgba(200,135,74,0.15)" stroke="rgba(200,135,74,0.3)" strokeWidth={1}/>
            )}
            <circle
              cx={p.x} cy={p.y} r={tooltip?.hour === p.hour ? 5 : 4}
              fill={tooltip?.hour === p.hour ? "#FFD09B" : "#C8761A"}
              stroke="#1a0e06" strokeWidth={2}
              style={{ cursor:"pointer", transition:"r 0.15s" }}
              onMouseEnter={() => setTooltip({ ...p })}
              onMouseLeave={() => setTooltip(null)}
            />
          </g>
        ))}
        {activeData.length === 0 && (
          <line x1={padL} y1={padT + chartH / 2} x2={W - padR} y2={padT + chartH / 2}
            stroke="#1e1008" strokeWidth={1.5} strokeDasharray="6,5"/>
        )}
      </svg>
      {activeData.length > 0 && (() => {
        const peak = [...data].sort((a,b) => b.revenue - a.revenue)[0];
        return (
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:2, padding:"6px 0 0", borderTop:"1px solid #2a1a0e" }}>
            <div style={{ fontSize:11, color:"#6b4a2a" }}>
              <span style={{ color:"#C8761A", fontWeight:600 }}>Peak: </span>
              {fmtHour(peak.hour)} · ₹{peak.revenue.toLocaleString("en-IN")}
            </div>
            <div style={{ fontSize:11, color:"#6b4a2a" }}>
              {activeData.length} active hour{activeData.length !== 1 ? "s" : ""}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
export function DashboardPage({ orders, allOrdersToday, stockItems, staffOnDuty }: DashboardPageProps) {
  const totalRevenue  = allOrdersToday.reduce((sum, o) => sum + (o.amount ?? 0), 0);
  const totalOrders   = allOrdersToday.length;
  const avgBill       = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const liveOrders    = orders.filter(o => o.status === "Prep" || o.status === "Ready");
  const activeOrders  = liveOrders.length;
  const prepCount     = orders.filter(o => o.status === "Prep").length;
  const readyCount    = orders.filter(o => o.status === "Ready").length;
  const hourlyMap: Record<number, number> = {};
  const currentHour = new Date().getHours();
  allOrdersToday.forEach(o => {
    try {
      const date = new Date(o.time);
      if (!isNaN(date.getTime())) {
        const hour = date.getHours();
        hourlyMap[hour] = (hourlyMap[hour] ?? 0) + (o.amount ?? 0);
      } else {
        hourlyMap[currentHour] = (hourlyMap[currentHour] ?? 0) + (o.amount ?? 0);
      }
    } catch {
      hourlyMap[currentHour] = (hourlyMap[currentHour] ?? 0) + (o.amount ?? 0);
    }
  });
  const endHour = Math.max(22, currentHour + 1);
  const startHour = Math.min(8, currentHour);
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => i + startHour);
  const hourlyData = hours.map(h => ({ hour: h, revenue: hourlyMap[h] ?? 0 }));
  function fmtHour(h: number) {
    if (h === 0)  return "12AM";
    if (h === 12) return "12PM";
    return h < 12 ? `${h}AM` : `${h - 12}PM`;
  }
  const itemMap: Record<string, { orders: number; revenue: number }> = {};
  allOrdersToday.forEach(o => {
    const parts = o.items.split(",").map(s => s.trim());
    parts.forEach(part => {
      const m = part.match(/^(.+?)\s*[×x]\s*(\d+)$/);
      if (m) {
        const name = m[1].trim();
        const qty  = parseInt(m[2]);
        if (!itemMap[name]) itemMap[name] = { orders: 0, revenue: 0 };
        itemMap[name].orders  += qty;
        const totalItems = parts.reduce((s, p) => {
          const pm = p.match(/[×x]\s*(\d+)$/);
          return s + (pm ? parseInt(pm[1]) : 1);
        }, 0);
        itemMap[name].revenue += totalItems > 0 ? Math.round((o.amount / totalItems) * qty) : 0;
      } else if (part) {
        if (!itemMap[part]) itemMap[part] = { orders: 0, revenue: 0 };
        itemMap[part].orders  += 1;
        itemMap[part].revenue += o.amount;
      }
    });
  });
  const trendingItems = Object.entries(itemMap)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 5);
  const alertItems   = stockItems.filter(s => s.status === "Critical" || s.status === "Low");
  const criticalCount = stockItems.filter(s => s.status === "Critical").length;
  const activeCount  = staffOnDuty.filter(m => m.onDuty).length;
  const EmptyState = ({ icon, text }: { icon: string; text: string }) => (
    <div style={{ padding:"24px 0", textAlign:"center", color:"#6b4a2a", fontSize:13 }}>
      <i className={`ti ${icon}`} style={{ fontSize:28, display:"block", marginBottom:6, opacity:0.6 }}/>
      {text}
    </div>
  );
  return (
    <div className="animate-page-enter">
      <SectionTitle>Dashboard</SectionTitle>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="metric-card animate-card" style={{ animationDelay:"0.05s", opacity:0 }}>
          <div className="metric-card__label">Total Revenue</div>
          <div className="metric-card__value">
            {totalRevenue > 0 ? `₹${totalRevenue.toLocaleString("en-IN")}` : "₹0"}
          </div>
          <div className="metric-card__delta" style={{ color: totalRevenue > 0 ? "#4CAF50" : "#6b4a2a" }}>
            {totalRevenue > 0 ? `From ${totalOrders} order${totalOrders !== 1 ? "s" : ""} today` : "No orders yet"}
          </div>
        </div>
        <div className="metric-card animate-card" style={{ animationDelay:"0.1s", opacity:0 }}>
          <div className="metric-card__label">Daily Active Orders</div>
          <div className="metric-card__value">{activeOrders}</div>
          <div className="metric-card__delta" style={{ color: activeOrders > 0 ? "#EF9F27" : "#6b4a2a" }}>
            {activeOrders > 0
              ? `${prepCount} in prep · ${readyCount} ready`
              : "No active orders"}
          </div>
        </div>
        <div className="metric-card animate-card" style={{ animationDelay:"0.15s", opacity:0 }}>
          <div className="metric-card__label">Avg Bill</div>
          <div className="metric-card__value">
            {avgBill > 0 ? `₹${avgBill}` : "₹0"}
          </div>
          <div className="metric-card__delta" style={{ color: avgBill > 0 ? "#4CAF50" : "#6b4a2a" }}>
            {avgBill > 0 ? "Per order average" : "No orders yet"}
          </div>
        </div>
        <div className="metric-card animate-card" style={{ animationDelay:"0.2s", opacity:0 }}>
          <div className="metric-card__label">Items Sold</div>
          <div className="metric-card__value">
            {Object.values(itemMap).reduce((s, i) => s + i.orders, 0)}
          </div>
          <div className="metric-card__delta" style={{ color: trendingItems.length > 0 ? "#4CAF50" : "#6b4a2a" }}>
            {trendingItems.length > 0 ? `${trendingItems.length} unique items` : "No items yet"}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-[3fr_2fr] gap-4 mb-5">
        <div className="card animate-card" style={{ animationDelay:"0.25s", opacity:0 }}>
          <div className="card__head">
            <div className="card__title">Live Orders</div>
            <div className="flex items-center gap-2">
              <div className="live-dot"/>
              <span style={{ fontSize:11, color:"#4CAF50", fontFamily:"DM Sans,sans-serif" }}>Live</span>
            </div>
          </div>
          {liveOrders.length === 0
            ? <EmptyState icon="ti-clipboard-x" text="No active orders right now"/>
            : liveOrders.slice(0, 6).map(o => <OrderRow key={o.id} order={o}/>)
          }
        </div>
        <div className="flex flex-col gap-4">
          <div className="card animate-card" style={{ animationDelay:"0.28s", opacity:0 }}>
            <div className="card__head">
              <div className="card__title">Today's Sales</div>
              <span style={{ fontSize:11, color: totalRevenue > 0 ? "#C8761A" : "#6b4a2a", fontFamily:"DM Sans,sans-serif", fontWeight:600 }}>
                {totalRevenue > 0 ? `₹${totalRevenue.toLocaleString("en-IN")} total` : "by hour"}
              </span>
            </div>
            {totalRevenue === 0 ? (
              <EmptyState icon="ti-chart-area-line" text="Sales chart will appear as orders come in"/>
            ) : (
              <SalesChart data={hourlyData} fmtHour={fmtHour}/>
            )}
          </div>
          <div className="card animate-card" style={{ animationDelay:"0.32s", opacity:0 }}>
            <div className="card__head">
              <div className="card__title">Stock Alerts</div>
              {criticalCount > 0
                ? <Badge variant="red">{criticalCount} Critical</Badge>
                : <Badge variant="green">All Good</Badge>
              }
            </div>
            {alertItems.length === 0
              ? <EmptyState icon="ti-circle-check" text="No stock alerts"/>
              : alertItems.slice(0, 4).map(s => <StockRow key={s.name} item={s}/>)
            }
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card animate-card" style={{ animationDelay:"0.35s", opacity:0 }}>
          <div className="card__head">
            <div className="card__title">Trending Items</div>
            {trendingItems.length > 0
              ? <Badge variant="trend">🔥 Live data</Badge>
              : <Badge variant="gray">No data yet</Badge>
            }
          </div>
          {trendingItems.length === 0 ? (
            <EmptyState icon="ti-trending-up" text="Trending items will appear after orders are placed"/>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty Sold</th>
                  <th>Revenue</th>
                  <th>Rank</th>
                </tr>
              </thead>
              <tbody>
                {trendingItems.map((item, i) => (
                  <tr key={item.name}>
                    <td style={{ color:"#2c1a0e", fontWeight:500 }}>{item.name}</td>
                    <td>{item.orders}</td>
                    <td>₹{item.revenue.toLocaleString("en-IN")}</td>
                    <td>
                      <Badge variant={i === 0 ? "hot" : i === 1 ? "trend" : "gray"}>
                        {i === 0 ? "🔥 #1" : i === 1 ? "↑ #2" : `#${i + 1}`}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="card animate-card" style={{ animationDelay:"0.38s", opacity:0 }}>
          <div className="card__head">
            <div className="card__title">Staff On Duty</div>
            <Badge variant={activeCount > 0 ? "green" : "gray"}>{activeCount} Active</Badge>
          </div>
          {staffOnDuty.filter(m => m.onDuty).length === 0 ? (
            <EmptyState icon="ti-user-off" text="No staff checked in yet"/>
          ) : (
            staffOnDuty.filter(m => m.onDuty).map(m => <StaffRow key={m.name} member={m}/>)
          )}
        </div>
      </div>
    </div>
  );
}