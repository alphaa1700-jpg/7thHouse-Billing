import { StockItem } from "@/types";
import { Badge } from "@/components/atoms/Badge";
const FC:Record<StockItem["status"],string> = { Critical:"#E24B4A", Low:"#EF9F27", Good:"#4CAF50" };
const BV:Record<StockItem["status"],"red"|"amber"|"green"> = { Critical:"red", Low:"amber", Good:"green" };
export function StockRow({ item }: { item: StockItem }) {
  return (
    <div className="stock-row">
      <span className="stock-row__name">{item.name}</span>
      <div className="stock-row__track">
        <div className="stock-row__fill" style={{ width:`${item.fillPercent}%`, background:FC[item.status] }} />
      </div>
      <span className="stock-row__val" style={{ color:FC[item.status] }}>{item.stock} {item.unit}</span>
      <Badge variant={BV[item.status]}>{item.status}</Badge>
    </div>
  );
}
