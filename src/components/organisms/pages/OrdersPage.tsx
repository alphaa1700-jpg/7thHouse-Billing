"use client";
import { useState, useMemo } from "react";
import { Order } from "@/types";
import { api }   from "@/lib/api";
import { SectionTitle } from "@/components/atoms/SectionTitle";
import { Badge }        from "@/components/atoms/Badge";
import { Button }       from "@/components/atoms/Button";
import { Input }        from "@/components/atoms/Input";
import { Pagination }    from "@/components/molecules/Pagination";
function fmtTime(raw: string): string {
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  } catch {
    return raw;
  }
}
const SV: Record<Order["status"], "green"|"amber"|"gray"> = {
  Ready:"green", Prep:"amber", Done:"gray", "Picked Up":"gray"
};
const STATUS_ICON: Record<Order["status"], string> = {
  Ready: "ti-circle-check", Prep: "ti-clock",
  Done:  "ti-checks",       "Picked Up": "ti-shopping-bag",
};
type SortKey = "id"|"items"|"customer"|"time"|"amount"|"status";
type SortDir = "asc"|"desc";
const NEXT_STATUS: Partial<Record<Order["status"], Order["status"]>> = {
  Prep: "Ready", Ready: "Done",
};
interface OrdersPageProps {
  orders:           Order[];
  completedOrders:  Order[];
  onOrdersChange:   (orders: Order[]) => void;
  onDeleteOrders:   (ids: string[]) => void;
  onMarkDone:       (id: string) => void;
  onNotify:         (msg: string) => void;
  onNewOrder?:      () => void;
}
export function OrdersPage({ orders, completedOrders, onOrdersChange, onDeleteOrders, onMarkDone, onNotify, onNewOrder }: OrdersPageProps) {
  const [tab,      setTab]      = useState("All Orders");
  const [search,   setSearch]   = useState("");
  const [sortKey,  setSortKey]  = useState<SortKey>("id");
  const [sortDir,  setSortDir]  = useState<SortDir>("asc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [receipt,  setReceipt]  = useState<Order | null>(null);
  const [curPage,  setCurPage]  = useState(1);
  const PER_PAGE = 10;
  const handleTabChange = (t: string) => { setTab(t); setCurPage(1); };
  const handleSearch = (v: string) => { setSearch(v); setCurPage(1); };
  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };
  const cycleStatus = async (id: string) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    if (next === "Done") {
      onMarkDone(id);
      onNotify(`Order ${id} marked Done${order.tableNumber ? ` — Table ${order.tableNumber}` : ""}`);
    } else {
      onOrdersChange(orders.map(o => o.id === id ? { ...o, status: next } : o));
      onNotify(`Order ${id} marked Ready${order.tableNumber ? ` — Table ${order.tableNumber}` : ""}${order.customer ? ` · ${order.customer}` : ""}`);
      try { await api.orders.update(id, next); } catch { /* silent */ }
    }
  };
  const displayed = useMemo(() => {
    let list = tab === "Completed"
      ? [...completedOrders]
      : [...orders];
    if (tab === "In Prep")   list = list.filter(o => o.status === "Prep");
    if (tab === "Ready")     list = list.filter(o => o.status === "Ready");
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        o.id.toLowerCase().includes(q) ||
        o.items.toLowerCase().includes(q) ||
        o.customer.toLowerCase().includes(q) ||
        (o.tableNumber && `table ${o.tableNumber}`.includes(q))
      );
    }
    list.sort((a, b) => {
      const av: string|number = sortKey === "amount" ? a.amount : a[sortKey] ?? "";
      const bv: string|number = sortKey === "amount" ? b.amount : b[sortKey] ?? "";
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [orders, completedOrders, tab, search, sortKey, sortDir]);
  const totalPages  = Math.ceil(displayed.length / PER_PAGE);
  const paginated   = displayed.slice((curPage - 1) * PER_PAGE, curPage * PER_PAGE);
  const allIds     = displayed.map(o => o.id);
  const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id));
  const toggleAll  = () => setSelected(prev => {
    const next = new Set(prev);
    allSelected ? allIds.forEach(id => next.delete(id)) : allIds.forEach(id => next.add(id));
    return next;
  });
  const toggleOne  = (id: string) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const Arrow = ({ col }: { col: SortKey }) => (
    <span className={`orders-sort-arrow ${sortKey===col ? "orders-sort-arrow--active" : ""}`}>
      {sortKey === col ? (sortDir === "asc" ? "↑" : "↓") : "⇅"}
    </span>
  );
  const counts = {
    all:   orders.filter(o => o.status === "Prep" || o.status === "Ready").length,
    prep:  orders.filter(o => o.status === "Prep").length,
    ready: orders.filter(o => o.status === "Ready").length,
    done:  completedOrders.length,
  };
  return (
    <>
      <div className="animate-page-enter">
        <SectionTitle>Order Management</SectionTitle>
        <div className="orders-stat-row">
          {[
            { label:"All Orders", val:counts.all,   color:"var(--c-c200)", key:"All Orders" },
            { label:"In Prep",    val:counts.prep,  color:"var(--c-amber)", key:"In Prep"    },
            { label:"Ready",      val:counts.ready, color:"var(--c-green)", key:"Ready"      },
            { label:"Completed",  val:counts.done,  color:"var(--c-blue)", key:"Completed"  },
          ].map(s => (
            <div
              key={s.label}
              className="orders-stat-pill"
              onClick={() => handleTabChange(s.key)}
              style={{ cursor:"pointer", outline: tab===s.key ? `2px solid ${s.color}` : "none", outlineOffset:2, borderRadius:8 }}
            >
              <div className="orders-stat-pill__val" style={{color:s.color}}>{s.val}</div>
              <div className="orders-stat-pill__label">{s.label}</div>
            </div>
          ))}
        </div>
        {tab === "Completed" && (
          <div style={{
            display:"flex", alignItems:"center", gap:10, padding:"10px 16px",
            background:"rgba(96,160,232,0.08)", border:"1px solid rgba(96,160,232,0.2)",
            borderRadius:10, marginBottom:16,
          }}>
            <i className="ti ti-checks" style={{fontSize:18, color:"var(--c-blue)"}}/>
            <div>
              <div style={{fontWeight:600, color:"var(--c-blue)", fontSize:14}}>Completed Orders — Today</div>
              <div style={{fontSize:12, color:"var(--c-faint)"}}>
                {counts.done === 0
                  ? "No orders completed yet today"
                  : `${counts.done} order${counts.done !== 1 ? "s" : ""} completed today`}
              </div>
            </div>
          </div>
        )}
        <div className="card orders-card">
          <div className="orders-toolbar">
            <div className="orders-toolbar__left">
              <div className="orders-search-wrap">
                <i className="ti ti-search orders-search-icon"/>
                <Input value={search} onChange={e=>handleSearch(e.target.value)} placeholder="Search order, table, customer…" className="orders-search-input"/>
                {search && <button className="orders-search-clear" onClick={()=>handleSearch("")}><i className="ti ti-x"/></button>}
              </div>
              {selected.size > 0 && <div className="orders-bulk-label">{selected.size} selected</div>}
            </div>
            <div className="orders-toolbar__right">
              <Button variant="tab"><i className="ti ti-download mr-1"/>Export</Button>
              <Button variant="brew-sm" onClick={onNewOrder}><i className="ti ti-plus mr-1"/>New Order</Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="orders-table">
              <thead>
                <tr>
                  <th className="orders-th orders-th--check">
                    <div className="orders-checkbox" onClick={toggleAll}>{allSelected ? <i className="ti ti-check"/> : ""}</div>
                  </th>
                  {(["id","items","customer","time","amount","status"] as SortKey[]).map(col => (
                    <th key={col} className="orders-th orders-th--sortable" onClick={()=>handleSort(col)}>
                      <span>{col==="id"?"Order #":col.charAt(0).toUpperCase()+col.slice(1)}</span>
                      <Arrow col={col}/>
                    </th>
                  ))}
                  <th className="orders-th">Table</th>
                  <th className="orders-th">Action</th>
                </tr>
              </thead>
              <tbody>
                {displayed.length === 0 && (
                  <tr><td colSpan={9} className="orders-empty">
                    <i className="ti ti-clipboard-x orders-empty__icon"/>
                    <div>No orders found</div>
                  </td></tr>
                )}
                {paginated.map((o, idx) => (
                  <tr
                    key={o.id}
                    className={`orders-row orders-row--${o.status.toLowerCase().replace(" ","-")} ${selected.has(o.id)?"orders-row--selected":""}`}
                    style={{animationDelay:`${idx*0.04}s`, opacity: o.status === "Done" ? 0.75 : 1}}
                  >
                    <td className="orders-td orders-td--check">
                      <div className="orders-checkbox" onClick={()=>toggleOne(o.id)}>{selected.has(o.id)?<i className="ti ti-check"/>:""}</div>
                    </td>
                    <td className="orders-td">
                      <div className="orders-id-wrap">
                        <div className={`orders-status-dot orders-status-dot--${o.status.toLowerCase().replace(" ","-")}`}/>
                        <span className="orders-id">{o.id}</span>
                      </div>
                    </td>
                    <td className="orders-td"><span className="orders-item-name">{o.items}</span></td>
                    <td className="orders-td">
                      <div className="orders-customer-cell">
                        <div className="orders-customer-av">{o.customer.charAt(0)}</div>
                        <div>
                          <div>{o.customer}</div>
                          {o.phone && <div style={{fontSize:11,color:"var(--c-cream)"}}>{o.phone}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="orders-td orders-td--time">
                      <i className="ti ti-clock-hour-4 mr-1" style={{fontSize:11,opacity:0.5}}/>{fmtTime(o.time)}
                    </td>
                    <td className="orders-td orders-td--amount">₹{o.amount}</td>
                    <td className="orders-td">
                      <div className={`orders-status-badge orders-status-badge--${SV[o.status]}`}>
                        <i className={`ti ${STATUS_ICON[o.status]}`}/>{o.status}
                      </div>
                    </td>
                    <td className="orders-td">
                      {o.tableNumber ? (
                        <div className="orders-table-chip">
                          <i className="ti ti-armchair mr-1" style={{fontSize:11}}/>T{o.tableNumber}
                        </div>
                      ) : (
                        <span style={{color:"var(--c-cream)",fontSize:12}}>Takeaway</span>
                      )}
                    </td>
                    <td className="orders-td">
                      <div className="flex gap-1.5 items-center">
                        {NEXT_STATUS[o.status] && (
                          <button className="orders-action-btn orders-action-btn--primary" onClick={()=>cycleStatus(o.id)}>
                            {o.status==="Prep"?<><i className="ti ti-circle-check mr-1"/>Mark Ready</>:<><i className="ti ti-checks mr-1"/>Mark Done</>}
                          </button>
                        )}
                        <button className="orders-action-btn" onClick={()=>setReceipt(o)}>
                          <i className="ti ti-receipt"/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={curPage}
            totalPages={totalPages}
            total={displayed.length}
            perPage={PER_PAGE}
            onPage={setCurPage}
          />
        </div>
      </div>
      {receipt && (
        <div className="modal-overlay" onClick={()=>setReceipt(null)}>
          <div className="receipt-box" onClick={e=>e.stopPropagation()}>
            <div className="receipt-box__header">
              <div>
                <div className="receipt-box__title">Receipt</div>
                <div className="receipt-box__sub">7th House Coffee{receipt.tableNumber ? ` · Table ${receipt.tableNumber}` : ""}</div>
              </div>
              <button className="modal-box__close" onClick={()=>setReceipt(null)}><i className="ti ti-x"/></button>
            </div>
            <div className="receipt-box__divider"/>
            <div className="receipt-box__row"><span>Order</span><strong>{receipt.id}</strong></div>
            <div className="receipt-box__row"><span>Customer</span><span>{receipt.customer}</span></div>
            {receipt.phone && <div className="receipt-box__row"><span>Phone</span><span>{receipt.phone}</span></div>}
            {receipt.tableNumber && <div className="receipt-box__row"><span>Table</span><span>Table {receipt.tableNumber}</span></div>}
            <div className="receipt-box__row"><span>Items</span><span>{receipt.items}</span></div>
            <div className="receipt-box__row"><span>Time</span><span>{fmtTime(receipt.time)}</span></div>
            <div className="receipt-box__divider"/>
            <div className="receipt-box__row"><span>Subtotal</span><span>₹{Math.round(receipt.amount/1.05)}</span></div>
            <div className="receipt-box__row"><span>Tax (5%)</span><span>₹{receipt.amount - Math.round(receipt.amount/1.05)}</span></div>
            <div className="receipt-box__total"><span>Total</span><strong>₹{receipt.amount}</strong></div>
            <div className="receipt-box__divider"/>
            <div className="receipt-box__status">
              <Badge variant={SV[receipt.status]}><i className={`ti ${STATUS_ICON[receipt.status]} mr-1`}/>{receipt.status}</Badge>
            </div>
            <button className="btn-brew btn-brew--full mt-4" onClick={()=>setReceipt(null)}>
              <i className="ti ti-printer mr-1"/>Print Receipt
            </button>
          </div>
        </div>
      )}
    </>
  );
}