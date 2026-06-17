import { Order } from "@/types";
import { Badge } from "@/components/atoms/Badge";
const V: Record<Order["status"],"green"|"amber"|"gray"> = { Ready:"green", Prep:"amber", Done:"gray", "Picked Up":"gray" };

function formatTime(t: string): string {
  try {
    const d = new Date(t);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" });
    }
  } catch {}
  return t; // fallback for old "just now" strings
}

export function OrderRow({ order }: { order: Order }) {
  return (
    <div className="order-row">
      <span className="order-row__num">{order.id}</span>
      <div className="order-row__info">
        <div className="order-row__name">{order.items}</div>
        <div className="order-row__sub">{order.customer} · {formatTime(order.time)}</div>
      </div>
      <Badge variant={V[order.status]}>{order.status}</Badge>
      <span className="order-row__amt">₹{order.amount}</span>
    </div>
  );
}