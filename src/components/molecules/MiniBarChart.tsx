"use client";
import { useEffect, useState } from "react";
import { DASHBOARD_BARS } from "@/lib/data";
export function MiniBarChart() {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(()=>setReady(true), 100); return ()=>clearTimeout(t); }, []);
  const max = Math.max(...DASHBOARD_BARS.map(b=>b.value));
  return (
    <div>
      <div className="flex items-end gap-1.5 h-[130px] pt-2">
        {DASHBOARD_BARS.map((bar,i) => (
          <div key={bar.label} className="flex-1 flex flex-col items-center">
            <div
              className="mini-bar"
              style={{ height: ready ? `${(bar.value/max)*100}%` : "0%", transition:`height 0.6s cubic-bezier(0.34,1.4,0.64,1) ${i*0.06}s` }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-1.5 mt-2">
        {DASHBOARD_BARS.map(b => (
          <div key={b.label} className="flex-1 text-center" style={{ fontSize:10, color:"#2c1a0e", fontFamily:"DM Sans,sans-serif" }}>{b.label}</div>
        ))}
      </div>
    </div>
  );
}