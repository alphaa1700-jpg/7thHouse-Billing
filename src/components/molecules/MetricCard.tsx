import clsx from "clsx";
interface P { label: string; value: string; delta?: string; deltaType?: "up"|"down"|"neutral"; delay?: number; }
export function MetricCard({ label, value, delta, deltaType="neutral", delay=0 }: P) {
  return (
    <div className="metric-card" style={{ animationDelay:`${delay}s`, opacity:0 }}>
      <div className="metric-card__label">{label}</div>
      <div className="metric-card__value">{value}</div>
      {delta && <div className={clsx("metric-card__delta", `metric-card__delta--${deltaType}`)}>{delta}</div>}
    </div>
  );
}
