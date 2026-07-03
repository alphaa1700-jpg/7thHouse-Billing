"use client";
import { useEffect, useRef, useMemo } from "react";
import { Chart, registerables } from "chart.js";
import { SectionTitle } from "@/components/atoms/SectionTitle";
import { MetricCard }   from "@/components/molecules/MetricCard";
import type { Order }   from "@/types";

Chart.register(...registerables);
function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function startOfWeek(d: Date) {
  const x = startOfDay(d);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function fmtINR(n: number) {
  if (n >= 100000) return `₹${(n/100000).toFixed(2)}L`;
  if (n >= 1000)   return `₹${(n/1000).toFixed(1)}k`;
  return `₹${n}`;
}
function computeAnalytics(orders: Order[]) {
  const now   = new Date();
  const week  = startOfWeek(now);
  const month = startOfMonth(now);
  const done = orders.filter(o => o.status === "Done" || o.status === "Picked Up");
  const last7: { label: string; value: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = startOfDay(new Date());
    day.setDate(day.getDate() - i);
    const next = new Date(day); next.setDate(next.getDate() + 1);
    const total = done
      .filter(o => { const t = new Date(o.time); return t >= day && t < next; })
      .reduce((s, o) => s + o.amount, 0);
    last7.push({ label: day.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" }), value: total });
  }
  const weekTotal  = done.filter(o => new Date(o.time) >= week).reduce((s, o) => s + o.amount, 0);
  const monthTotal = done.filter(o => new Date(o.time) >= month).reduce((s, o) => s + o.amount, 0);
  const todayStr = now.toDateString();
  const todayOrders = orders.filter(o => {
    try { return new Date(o.time).toDateString() === todayStr; } catch { return false; }
  });
  const hourBuckets: Record<number, number> = {};
  for (let h = 7; h <= 21; h++) hourBuckets[h] = 0;
  todayOrders.forEach(o => {
    const h = new Date(o.time).getHours();
    if (h in hourBuckets) hourBuckets[h]++;
  });
  const hourlyLabels = Object.keys(hourBuckets).map(h => {
    const n = Number(h);
    return n < 12 ? `${n}AM` : n === 12 ? "12PM" : `${n-12}PM`;
  });
  const hourlyValues = Object.values(hourBuckets);
  function fmtH(h: number) {
    if (h === 0)  return "12AM";
    if (h === 12) return "12PM";
    return h < 12 ? `${h}AM` : `${h - 12}PM`;
  }
  const peakEntry = Object.entries(hourBuckets).reduce((a, b) => Number(b[1]) > Number(a[1]) ? b : a, ["7", 0]);
  const peakH     = Number(peakEntry[0]);
  const peakLabel = `${fmtH(peakH)}–${fmtH(peakH + 1)}`;
  const peakPct   = todayOrders.length ? Math.round((Number(peakEntry[1]) / todayOrders.length) * 100) : 0;
  const itemCounts: Record<string, { qty: number; revenue: number }> = {};
  orders.forEach(o => {
    const parts = o.items.split(",").map(s => s.trim()).filter(Boolean);
    const totalQty = parts.reduce((s, part) => {
      const m = part.match(/^(.+?)\s*[×x]\s*(\d+)$/);
      return s + (m ? parseInt(m[2]) : 1);
    }, 0);
    parts.forEach(part => {
      const match = part.match(/^(.+?)\s*[×x]\s*(\d+)$/);
      const name  = match ? match[1].trim() : part;
      const qty   = match ? parseInt(match[2]) : 1;
      if (!name) return;
      if (!itemCounts[name]) itemCounts[name] = { qty: 0, revenue: 0 };
      itemCounts[name].qty += qty;
      itemCounts[name].revenue += totalQty > 0 ? Math.round((o.amount / totalQty) * qty) : 0;
    });
  });
  const topSellers = Object.entries(itemCounts)
    .sort((a, b) => b[1].qty - a[1].qty)
    .slice(0, 5)
    .map(([name, { qty, revenue }]) => ({ name, qty, revenue }));
  return {
    last7, weekTotal, monthTotal,
    hourlyLabels, hourlyValues,
    peakLabel, peakPct,
    topItem: topSellers[0]?.name ?? "—",
    topItemQty: topSellers[0]?.qty ?? 0,
    topSellers,
    totalOrders: orders.length,
  };
}
interface AnalyticsPageProps {
  allOrders: Order[]; // all historical orders passed from AdminApp
}
export function AnalyticsPage({ allOrders }: AnalyticsPageProps) {
  const revRef  = useRef<HTMLCanvasElement>(null);
  const hourRef = useRef<HTMLCanvasElement>(null);
  const rC = useRef<Chart|null>(null);
  const hC = useRef<Chart|null>(null);
  const a = useMemo(() => computeAnalytics(allOrders), [allOrders]);
  useEffect(() => {
    // Resolve CSS vars at runtime so charts respond to theme changes
    const style = getComputedStyle(document.documentElement);
    const accent  = style.getPropertyValue("--c-c200").trim() || "#C8761A";
    const textClr = style.getPropertyValue("--c-cream").trim() || "#2c1a0e";
    const gridClr = style.getPropertyValue("--c-bg-500").trim() || "#c8ad88";
    const accentFade = `${accent}44`;

    if (revRef.current) {
      rC.current?.destroy();
      rC.current = new Chart(revRef.current, {
        type: "bar",
        data: {
          labels: a.last7.map(d => d.label),
          datasets: [{
            label: "Revenue",
            data: a.last7.map(d => d.value),
            backgroundColor: a.last7.map((_, i) =>
              i === a.last7.length - 1 ? accent : accentFade
            ),
            borderRadius: 6,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              ticks: { callback: v => `₹${Math.round(Number(v)/1000)}k`, color: textClr },
              grid: { color: `${gridClr}80` }, border: { color: gridClr },
            },
            x: { ticks: { color: textClr, font: { size: 10 } }, grid: { display: false }, border: { color: gridClr } },
          },
        },
      });
    }
    if (hourRef.current) {
      hC.current?.destroy();
      hC.current = new Chart(hourRef.current, {
        type: "bar",
        data: {
          labels: a.hourlyLabels,
          datasets: [{
            label: "Orders",
            data: a.hourlyValues,
            backgroundColor: accent,
            borderRadius: 4,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              ticks: { color: textClr, stepSize: 1 },
              grid: { color: `${gridClr}80` }, border: { color: gridClr },
            },
            x: { ticks: { color: textClr, font: { size: 10 } }, grid: { display: false }, border: { color: gridClr } },
          },
        },
      });
    }
    return () => {
      rC.current?.destroy(); rC.current = null;
      hC.current?.destroy(); hC.current = null;
    };
  }, [a]);

  // Rebuild charts when theme changes (data-theme attribute on <html>)
  useEffect(() => {
    const obs = new MutationObserver(() => {
      rC.current?.destroy(); rC.current = null;
      hC.current?.destroy(); hC.current = null;
      // Re-trigger chart build by dispatching a harmless state update
      // We do this by re-running the chart build inline
      const style = getComputedStyle(document.documentElement);
      const accent  = style.getPropertyValue("--c-c200").trim() || "#C8761A";
      const textClr = style.getPropertyValue("--c-cream").trim() || "#2c1a0e";
      const gridClr = style.getPropertyValue("--c-bg-500").trim() || "#c8ad88";
      const accentFade = `${accent}44`;
      if (revRef.current) {
        rC.current = new (window as any).Chart(revRef.current, { type:"bar", data:{ labels:a.last7.map((d:any)=>d.label), datasets:[{ label:"Revenue", data:a.last7.map((d:any)=>d.value), backgroundColor:a.last7.map((_:any,i:number)=>i===a.last7.length-1?accent:accentFade), borderRadius:6 }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ y:{ticks:{callback:(v:any)=>`₹${Math.round(Number(v)/1000)}k`,color:textClr},grid:{color:`${gridClr}80`},border:{color:gridClr}}, x:{ticks:{color:textClr,font:{size:10}},grid:{display:false},border:{color:gridClr}} } } });
      }
      if (hourRef.current) {
        hC.current = new (window as any).Chart(hourRef.current, { type:"bar", data:{ labels:a.hourlyLabels, datasets:[{ label:"Orders", data:a.hourlyValues, backgroundColor:accent, borderRadius:4 }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ y:{ticks:{color:textClr,stepSize:1},grid:{color:`${gridClr}80`},border:{color:gridClr}}, x:{ticks:{color:textClr,font:{size:10}},grid:{display:false},border:{color:gridClr}} } } });
      }
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, [a]);

  return (
    <div className="animate-page-enter">
      <SectionTitle>Analytics</SectionTitle>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <MetricCard label="This Week"  value={fmtINR(a.weekTotal)}  delta={`${a.last7.filter(d => d.value > 0).length} active days`} deltaType="up"      delay={0.05}/>
        <MetricCard label="This Month" value={fmtINR(a.monthTotal)} delta={`${a.totalOrders} orders total`}                          deltaType="up"      delay={0.1} />
        <MetricCard label="Top Item"   value={a.topItem}            delta={`${a.topItemQty} orders`}                                 deltaType="neutral" delay={0.15}/>
        <MetricCard label="Peak Hour"  value={a.peakLabel}          delta={`${a.peakPct}% of today`}                                 deltaType="neutral" delay={0.2} />
      </div>
      <div className="card mb-4">
        <div className="card__head">
          <div className="card__title">Revenue — Last 7 Days</div>
          <span style={{ fontSize: 11, color: "var(--c-faint)", fontFamily: "DM Sans,sans-serif" }}>
            {fmtINR(a.weekTotal)} this week
          </span>
        </div>
        <div style={{ position: "relative", width: "100%", height: 200 }}>
          <canvas ref={revRef} aria-label="Revenue chart"/>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <div className="card__head"><div className="card__title">Top Sellers</div></div>
          {a.topSellers.length === 0 ? (
            <div style={{ color: "var(--c-cream)", padding: "1rem", textAlign: "center" }}>No orders yet</div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Item</th><th>Qty</th><th>Revenue</th></tr></thead>
              <tbody>
                {a.topSellers.map(({ name, qty, revenue }) => (
                  <tr key={name}>
                    <td style={{ color: "var(--c-cream)" }}>{name}</td>
                    <td>{qty}</td>
                    <td style={{ color: "var(--c-c200)", fontWeight: 700 }}>{fmtINR(revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="card">
          <div className="card__head">
            <div className="card__title">Orders by Hour</div>
            <span style={{ fontSize: 11, color: "var(--c-faint)", fontFamily: "DM Sans,sans-serif" }}>Today</span>
          </div>
          <div style={{ position: "relative", width: "100%", height: 160 }}>
            <canvas ref={hourRef} aria-label="Hourly chart"/>
          </div>
        </div>
      </div>
    </div>
  );
}