"use client";
import { useState } from "react";
import { CafeTable, TableSession } from "@/types";
import { SectionTitle } from "@/components/atoms/SectionTitle";
import { Badge }        from "@/components/atoms/Badge";
import { Button }       from "@/components/atoms/Button";
interface TablesPageProps {
  tables: CafeTable[];
  onClearTable: (tableId: string) => void;
  onMarkReady: (tableId: string) => void;
  onAddItems:  (tableId: string) => void;
  onNewOrder:  (tableId: string) => void;
}
const STATUS_CONFIG = {
  available: { label:"Available", badge:"green"  as const, dot:"var(--c-green)" },
  occupied:  { label:"Occupied",  badge:"amber"  as const, dot:"var(--c-amber)" },
  cleaning:  { label:"Cleaning",  badge:"gray"   as const, dot:"var(--c-faint)" },
};
function TableShape({ table, onClick, isSelected }: { table: CafeTable; onClick: () => void; isSelected: boolean }) {
  const cfg = STATUS_CONFIG[table.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.available;
  const session = table.session;
  return (
    <div
      className={`cafe-table cafe-table--square cafe-table--${table.status} ${isSelected ? "cafe-table--selected" : ""}`}
      onClick={onClick}
      role="button"
      aria-label={`Table ${table.number}`}
    >
      <div className="cafe-table__glow" style={{ background: cfg.dot }} />
      <div className="cafe-table__number">T{table.number}</div>
      <div className="cafe-table__capacity">
        {Array.from({ length: 4 }).map((_, i) => (
          <i key={i} className={`ti ti-armchair cafe-table__chair ${i < (session ? session.items.reduce((s,it)=>s+it.qty,0) : 0) ? "cafe-table__chair--filled" : ""}`}/>
        ))}
      </div>
      {session && (
        <div className="cafe-table__customer">{session.customerName.split(" ")[0]}</div>
      )}
      <div className="cafe-table__status-dot" style={{ background: cfg.dot }} />
    </div>
  );
}
async function sendBillWhatsApp(session: TableSession): Promise<"sent"|"failed"> {
  const mode = process.env.NEXT_PUBLIC_WHATSAPP_MODE || "redirect";

  if (mode === "redirect") {
    try {
      const rawPhone = String(session.phone).replace(/\D/g, "");
      const e164 = rawPhone.startsWith("91") ? rawPhone : `91${rawPhone}`;
      
      const itemsStr = session.items
        .map(i => `• ${i.name} ×${i.qty} — ₹${i.price * i.qty}`)
        .join("\n");
      
      const message =
        `☕ *7th House Coffee*\n\n` +
        `Hi ${session.customerName}! 👋\n\n` +
        `Here's your bill summary:\n` +
        `🪑 Table ${session.tableNumber} | Order ${session.orderId}\n\n` +
        `🛒 *Items:*\n` +
        `${itemsStr}\n\n` +
        `💰 *Total: ₹${session.total}*\n` +
        `(Incl. 5% GST)\n\n` +
        `Thank you for visiting us! 🙏\n` +
        `We hope to see you again soon. ☕✨`;

      const url = `https://wa.me/${e164}?text=${encodeURIComponent(message)}`;
      window.open(url, "_blank");
      return "sent";
    } catch (err) {
      console.error("WhatsApp redirect error:", err);
      return "failed";
    }
  }

  // API Mode
  try {
    const res = await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone:       session.phone,
        customerName: session.customerName,
        total:       session.total,
        items:       session.items.map(i => `• ${i.name} ×${i.qty} — ₹${i.price * i.qty}`).join("\n"),
        tableNumber: session.tableNumber,
        orderId:     session.orderId,
      }),
    });
    return res.ok ? "sent" : "failed";
  } catch { return "failed"; }
}
function SessionDrawer({ table, onClose, onClear, onReady, onAddItems }: {
  table: CafeTable;
  onClose: () => void;
  onClear: () => void;
  onReady: () => void;
  onAddItems: () => void;
}) {
  const [sending, setSending] = useState<"idle"|"sending"|"sent"|"failed">("idle");
  const session = table.session;
  const cfg = STATUS_CONFIG[table.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.available;
  const handleBillPaid = async () => {
    if (!session) return;
    setSending("sending");
    const result = await sendBillWhatsApp(session);
    setSending(result);
    setTimeout(() => { onClear(); }, result === "sent" ? 1800 : 800);
  };
  return (
    <div className="table-drawer">
      <div className="table-drawer__head">
        <div>
          <div className="table-drawer__title">Table {table.number}</div>
          <Badge variant={cfg.badge}>{cfg.label}</Badge>
        </div>
        <button className="modal-box__close" onClick={onClose}><i className="ti ti-x"/></button>
      </div>
      {!session ? (
        <div className="table-drawer__empty">
          <i className="ti ti-armchair table-drawer__empty-icon"/>
          <div className="table-drawer__empty-label">Table is {table.status}</div>
          <div className="table-drawer__empty-sub">
            {table.status === "available" && "Ready for new guests"}
            {table.status === "cleaning"  && "Being cleaned"}
          </div>
          {table.status === "cleaning" && (
            <Button variant="brew-sm" className="mt-4" onClick={onReady}>
              <i className="ti ti-check mr-1"/>Mark Available
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="table-drawer__section">
            <div className="table-drawer__section-label">Customer</div>
            <div className="table-drawer__customer-card">
              <div className="table-drawer__customer-av">
                {session.customerName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="table-drawer__customer-name">{session.customerName}</div>
                <div className="table-drawer__customer-phone">
                  <i className="ti ti-phone mr-1" style={{fontSize:11}}/>
                  {session.phone}
                </div>
              </div>
              <div className="table-drawer__time">
                <i className="ti ti-clock mr-1" style={{fontSize:11}}/>
                {session.startTime}
              </div>
            </div>
          </div>
          <div className="table-drawer__section">
            <div className="table-drawer__section-label">Order · {session.orderId}</div>
            <div className="table-drawer__order-list">
              {session.items.map(item => (
                <div key={item.name} className="table-drawer__order-row">
                  <span className="table-drawer__order-name">{item.name}</span>
                  <span className="table-drawer__order-qty">×{item.qty}</span>
                  <span className="table-drawer__order-price">₹{item.price * item.qty}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="table-drawer__bill">
            <div className="table-drawer__bill-row">
              <span>Subtotal</span>
              <span>₹{Math.round(session.total / 1.05)}</span>
            </div>
            <div className="table-drawer__bill-row">
              <span>Tax (5%)</span>
              <span>₹{session.total - Math.round(session.total / 1.05)}</span>
            </div>
            <div className="table-drawer__bill-total">
              <span>Total</span>
              <strong>₹{session.total}</strong>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <div className={`table-session-status table-session-status--${session.status}`}>
              <i className={`ti ${session.status === "occupied" ? "ti-clock" : session.status === "ready" ? "ti-circle-check" : "ti-checks"} mr-1`}/>
              {session.status === "occupied" ? "Order in progress" : session.status === "ready" ? "Ready to collect" : "Paid & done"}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {(session.status === "occupied" || session.status === "ready") && (
              <Button variant="tab" onClick={onAddItems} className="w-full justify-center"
                style={{ color: "var(--c-c200)", borderColor: "rgba(200,135,74,0.3)" }}>
                <i className="ti ti-plus mr-1"/>Add More Items
              </Button>
            )}
            {session.status === "occupied" && (
              <Button variant="brew" onClick={onReady} className="w-full justify-center">
                <i className="ti ti-circle-check mr-1"/>Mark Ready & Print Bill
              </Button>
            )}
            {sending === "sent" && (
              <div style={{padding:"10px 14px", borderRadius:8, fontSize:13, fontWeight:600,background:"rgba(46,125,50,0.12)", color:"var(--c-green)",border:"1px solid rgba(76,175,80,0.25)", display:"flex", alignItems:"center", gap:8,}}>
                <i className="ti ti-brand-whatsapp" style={{fontSize:18}}/>
                Bill sent to {session.phone} ✓ — clearing table…
              </div>
            )}
            {sending === "failed" && (
              <div style={{padding:"10px 14px", borderRadius:8, fontSize:12,background:"rgba(226,75,74,0.12)", color:"var(--c-red)", border:"1px solid rgba(226,75,74,0.25)", display:"flex", alignItems:"center", gap:8,}}>
                <i className="ti ti-alert-triangle" style={{fontSize:16}}/>
                WhatsApp failed — check Twilio config. Table still cleared.
              </div>
            )}
            <Button
              variant="tab"
              onClick={handleBillPaid}
              disabled={sending === "sending" || sending === "sent"}
              className="w-full justify-center"
              style={{ color:"var(--c-green)", borderColor:"#a8d5b5",
                opacity: (sending === "sending" || sending === "sent") ? 0.7 : 1 }}
            >
              {sending === "sending" ? (
                <><i className="ti ti-loader-2 mr-1" style={{animation:"spin 1s linear infinite"}}/>Sending WhatsApp…</>
              ) : sending === "sent" ? (
                <><i className="ti ti-check mr-1"/>Sent!</>
              ) : (
                <><i className="ti ti-brand-whatsapp mr-1"/>Bill Paid — Send WhatsApp & Clear</>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
export function TablesPage({ tables, onClearTable, onMarkReady, onAddItems, onNewOrder }: TablesPageProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedTable = tables.find(t => t.id === selectedId);
  const stats = {
    available: tables.filter(t => t.status === "available").length,
    occupied:  tables.filter(t => t.status === "occupied").length,
    cleaning:  tables.filter(t => t.status === "cleaning").length,
  };
  return (
    <div className="animate-page-enter">
      <SectionTitle>Tables</SectionTitle>
      <div className="tables-stat-row">
        {[
          { label:"Available", val: stats.available, color:"var(--c-green)", icon:"ti-circle-check" },
          { label:"Occupied",  val: stats.occupied,  color:"var(--c-amber)", icon:"ti-users"        },
          { label:"Cleaning",  val: stats.cleaning,  color:"var(--c-faint)", icon:"ti-wash"         },
        ].map(s => (
          <div key={s.label} className="tables-stat-pill">
            <i className={`ti ${s.icon} tables-stat-pill__icon`} style={{ color: s.color }}/>
            <div className="tables-stat-pill__val" style={{ color: s.color }}>{s.val}</div>
            <div className="tables-stat-pill__label">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="tables-legend">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <div key={key} className="tables-legend__item">
            <div className="tables-legend__dot" style={{ background: cfg.dot }}/>
            <span>{cfg.label}</span>
          </div>
        ))}
      </div>
      <div className={`tables-layout ${selectedTable ? "tables-layout--with-drawer" : ""}`}>
        <div className="tables-floor">
          <div className="tables-floor__label">Floor Plan · 6 tables · 4 seats each</div>
          <div className="tables-floor__grid">
            {tables.map(table => (
              <TableShape
                key={table.id}
                table={table}
                isSelected={selectedId === table.id}
                onClick={() => {
                  if (table.status === "available") {
                    onNewOrder(table.id);
                  } else {
                    setSelectedId(prev => prev === table.id ? null : table.id);
                  }
                }}
              />
            ))}
          </div>
        </div>
        {selectedTable && (
          <SessionDrawer
            table={selectedTable}
            onClose={() => setSelectedId(null)}
            onClear={() => { onClearTable(selectedTable.id); setSelectedId(null); }}
            onReady={() => { onMarkReady(selectedTable.id); }}
            onAddItems={() => { onAddItems(selectedTable.id); setSelectedId(null); }}
          />
        )}
      </div>
    </div>
  );
}