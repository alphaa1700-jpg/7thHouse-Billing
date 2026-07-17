"use client";
import { useState, useEffect } from "react";
import { CartItem, MenuItem, Order, CafeTable, TableSession } from "@/types";
import { SectionTitle } from "@/components/atoms/SectionTitle";
import { Button }       from "@/components/atoms/Button";
import { Input }        from "@/components/atoms/Input";
import { CartItemRow }  from "@/components/molecules/CartItemRow";
const TABS = ["All", "Hot", "Cold", "Food"];
interface POSPageProps {
  menuItems:           MenuItem[];
  tables:              CafeTable[];
  onPlaceOrder:        (order: Order, session: TableSession, tableId: string) => void;
  addToOrderTableId:   string | null;
  onAddToOrder:        (tableId: string, items: CartItem[], extraTotal: number) => void;
  onClearAddMode:      () => void;
  preselectedTableId?: string | null;
  onClearPreselect?:   () => void;
}
interface OrderModalProps {
  cart:      CartItem[];
  total:     number;
  tables:    CafeTable[];
  onConfirm: (tableId: string, customerName: string, phone: string) => void;
  onClose:   () => void;
}
function OrderModal({ cart, total, tables, onConfirm, onClose, preselectedTableId }: OrderModalProps & { preselectedTableId?: string | null }) {
  const isTableLocked = !!preselectedTableId;
  const [tableId, setTableId] = useState(preselectedTableId ?? "");
  const [name,    setName]    = useState("");
  const [phone,   setPhone]   = useState("");
  const [errors,  setErrors]  = useState<Record<string, string>>({});
  const availableTables = tables.filter(t => t.status === "available");
  const validate = () => {
    const e: Record<string, string> = {};
    if (!tableId)               e.table = "Please select a table";
    if (!name.trim())           e.name  = "Customer name is required";
    if (!phone.trim())          e.phone = "Phone number is required";
    else if (!/^\d{10}$/.test(phone.replace(/\s/g, ""))) e.phone = "Enter a valid 10-digit number";
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const selectedTable = tables.find(t => t.id === tableId);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div className="modal-box__head">
          <div className="modal-box__title">Confirm Order</div>
          <button className="modal-box__close" onClick={onClose}><i className="ti ti-x"/></button>
        </div>
        <div className="pos-order-summary">
          <div className="pos-order-summary__title">Order Summary</div>
          {cart.map(item => (
            <div key={item.name} className="pos-order-summary__row">
              <span className="pos-order-summary__item">{item.name} <span className="pos-order-summary__qty">×{item.qty}</span></span>
              <span className="pos-order-summary__price">₹{item.price * item.qty}</span>
            </div>
          ))}
          <div className="pos-order-summary__divider"/>
          <div className="pos-order-summary__total">
            <span>Total (incl. 5% tax)</span>
            <strong>₹{total}</strong>
          </div>
        </div>
        <div className="modal-box__field">
          <div className="modal-box__label">{isTableLocked ? "Table" : "Select Table"}</div>
          {isTableLocked ? (
            selectedTable && (
              <div className="pos-table-selected-info">
                <i className="ti ti-circle-check" style={{ color: "var(--c-green)", marginRight: 6 }}/>
                Table {selectedTable.number} — seats {selectedTable.capacity} guests
              </div>
            )
          ) : (
            <>
              {availableTables.length === 0 ? (
                <div className="pos-no-tables">All tables are currently occupied</div>
              ) : (
                <div className="pos-table-grid">
                  {tables.map(t => (
                    <button
                      key={t.id}
                      className={`pos-table-chip
                        ${t.status !== "available" ? "pos-table-chip--disabled" : ""}
                        ${tableId === t.id ? "pos-table-chip--active" : ""}
                      `}
                      disabled={t.status !== "available"}
                      onClick={() => setTableId(t.id)}
                    >
                      <i className="ti ti-armchair pos-table-chip__icon"/>
                      <span className="pos-table-chip__num">T{t.number}</span>
                      <span className="pos-table-chip__cap">{t.capacity}p</span>
                      {t.status !== "available" && (
                        <div className="pos-table-chip__overlay">{t.status}</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {selectedTable && (
                <div className="pos-table-selected-info">
                  <i className="ti ti-circle-check" style={{ color: "var(--c-green)", marginRight: 6 }}/>
                  Table {selectedTable.number} — seats {selectedTable.capacity} guests
                </div>
              )}
            </>
          )}
          {errors.table && <div className="modal-box__error">{errors.table}</div>}
        </div>
        <div className="modal-box__field">
          <div className="modal-box__label">Customer Name</div>
          <div className="pos-input-wrap">
            <i className="ti ti-user pos-input-icon"/>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Priya Sharma" className="pos-padded-input"/>
          </div>
          {errors.name && <div className="modal-box__error">{errors.name}</div>}
        </div>
        <div className="modal-box__field">
          <div className="modal-box__label">Phone Number</div>
          <div className="pos-input-wrap">
            <i className="ti ti-phone pos-input-icon"/>
            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. 9876543210" maxLength={10} className="pos-padded-input"/>
          </div>
          {errors.phone && <div className="modal-box__error">{errors.phone}</div>}
        </div>
        <div className="modal-box__actions">
          <Button variant="tab" onClick={onClose}>Cancel</Button>
          <Button variant="brew" onClick={() => { if (validate()) onConfirm(tableId, name.trim(), phone.trim()); }}>
            <i className="ti ti-send mr-1"/>Place Order
          </Button>
        </div>
      </div>
    </div>
  );
}
interface AddItemsModalProps {
  cart:    CartItem[];
  extra:   number;
  table:   CafeTable;
  onConfirm: () => void;
  onClose:   () => void;
}
function AddItemsModal({ cart, extra, table, onConfirm, onClose }: AddItemsModalProps) {
  const session    = table.session!;
  const newTotal   = session.total + extra;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div className="modal-box__head">
          <div className="modal-box__title">Add Items to Table {table.number}</div>
          <button className="modal-box__close" onClick={onClose}><i className="ti ti-x"/></button>
        </div>
        <div style={{display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",background: "rgba(200,135,74,0.08)", borderRadius: 8, marginBottom: 16,border: "1px solid rgba(200,135,74,0.2)",}}>
          <div style={{width: 34, height: 34, borderRadius: "50%", background: "var(--c-c200)",display: "flex", alignItems: "center", justifyContent: "center",fontWeight: 700, color: "#1A0F07", fontSize: 15, flexShrink: 0,}}>
            {session.customerName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: "#E8C49A", fontSize: 14 }}>{session.customerName}</div>
            <div style={{ fontSize: 12, color: "var(--c-faint)" }}>
              <i className="ti ti-armchair" style={{ marginRight: 4 }}/>Table {table.number}
              &nbsp;·&nbsp;
              <i className="ti ti-receipt" style={{ marginRight: 4 }}/>Order {session.orderId}
            </div>
          </div>
        </div>
        <div className="pos-order-summary">
          <div className="pos-order-summary__title">Adding to order</div>
          {cart.map(item => (
            <div key={item.name} className="pos-order-summary__row">
              <span className="pos-order-summary__item">{item.name} <span className="pos-order-summary__qty">×{item.qty}</span></span>
              <span className="pos-order-summary__price">₹{item.price * item.qty}</span>
            </div>
          ))}
          <div className="pos-order-summary__divider"/>
          <div className="pos-order-summary__row" style={{ color: "var(--c-faint)", fontSize: 12 }}>
            <span>Previous total</span><span>₹{session.total}</span>
          </div>
          <div className="pos-order-summary__row" style={{ color: "var(--c-faint)", fontSize: 12 }}>
            <span>Adding now (incl. 5% tax)</span><span>+ ₹{extra}</span>
          </div>
          <div className="pos-order-summary__total" style={{ marginTop: 6 }}>
            <span>New Total</span>
            <strong>₹{newTotal}</strong>
          </div>
        </div>
        <div className="modal-box__actions">
          <Button variant="tab" onClick={onClose}>Cancel</Button>
          <Button variant="brew" onClick={onConfirm}>
            <i className="ti ti-plus mr-1"/>Add to Order
          </Button>
        </div>
      </div>
    </div>
  );
}
interface OrderConfirmationModalProps {
  orderId:     string;
  tableNumber: number;
  items:       CartItem[];
  total:       number;
  onClose:     () => void;
}
function OrderConfirmationModal({ orderId, tableNumber, items, total, onClose }: OrderConfirmationModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div className="modal-box__head">
          <div className="modal-box__title">Order Confirmed</div>
          <button className="modal-box__close" onClick={onClose}><i className="ti ti-x"/></button>
        </div>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <i className="ti ti-circle-check" style={{ fontSize: 42, color: "var(--c-green)" }}/>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#E8C49A", marginTop: 8 }}>
            Order {orderId} placed for Table {tableNumber}
          </div>
        </div>
        <div className="pos-order-summary">
          <div className="pos-order-summary__title">Ordered Items</div>
          {items.map(item => (
            <div key={item.name} className="pos-order-summary__row">
              <span className="pos-order-summary__item">{item.name} <span className="pos-order-summary__qty">×{item.qty}</span></span>
              <span className="pos-order-summary__price">₹{item.price * item.qty}</span>
            </div>
          ))}
          <div className="pos-order-summary__divider"/>
          <div className="pos-order-summary__total">
            <span>Total Amount</span>
            <strong>₹{total}</strong>
          </div>
        </div>
        <div className="modal-box__actions">
          <Button variant="brew" onClick={onClose} className="w-full justify-center">
            <i className="ti ti-check mr-1"/>Done
          </Button>
        </div>
      </div>
    </div>
  );
}
export function POSPage({
  menuItems, tables, onPlaceOrder, addToOrderTableId, onAddToOrder, onClearAddMode,
  preselectedTableId, onClearPreselect,
}: POSPageProps) {
  const [cart,      setCart]      = useState<CartItem[]>([]);
  const [activeTab, setTab]       = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<{
    orderId: string; tableNumber: number; items: CartItem[]; total: number;
  } | null>(null);
  const addToTable = addToOrderTableId
    ? tables.find(t => t.id === addToOrderTableId) ?? null
    : null;
  useEffect(() => { setCart([]); setShowModal(false); }, [addToOrderTableId]);
  useEffect(() => {
    if (preselectedTableId) { setCart([]); }
  }, [preselectedTableId]);
  const posItems = menuItems.filter(i => i.availability !== "Unavailable");
  const addItem = (name: string, price: number) => {
    setCart(prev => {
      const ex = prev.find(i => i.name === name);
      return ex
        ? prev.map(i => i.name === name ? { ...i, qty: i.qty + 1 } : i)
        : [...prev, { name, price, qty: 1 }];
    });
  };
  const changeQty = (index: number, delta: number) => {
    setCart(prev =>
      prev.map((it, i) => i === index ? { ...it, qty: it.qty + delta } : it).filter(i => i.qty > 0)
    );
  };
  const filtered = activeTab === "All" ? posItems
    : posItems.filter(i =>
        activeTab === "Hot"  ? i.category === "Espresso" || i.category === "Specialty"
      : activeTab === "Cold" ? i.category === "Cold"
      : i.category === "Food"
    );
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const tax      = Math.round(subtotal * 0.05);
  const total    = subtotal + tax;
  const handleNewOrderConfirm = (tableId: string, customerName: string, phone: string) => {
    const table   = tables.find(t => t.id === tableId)!;
    const orderId = `#${Date.now().toString(36).toUpperCase().slice(-5)}${Math.random().toString(36).slice(2,4).toUpperCase()}`;
    const itemsStr = cart.map(i => `${i.name}${i.qty > 1 ? ` ×${i.qty}` : ""}`).join(", ");
    const now      = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

    const newOrder: Order = {
      id: orderId, items: itemsStr, customer: customerName, phone,
      tableNumber: String(table.number),
      time: new Date().toISOString(),
      amount: total, status: "Prep",
    };
    const session: TableSession = {
      tableId, tableNumber: table.number, customerName, phone,
      orderId, items: [...cart], total, startTime: now, status: "occupied",
    };
    onPlaceOrder(newOrder, session, tableId);
    setConfirmedOrder({ orderId, tableNumber: table.number, items: [...cart], total });
    setCart([]);
    setShowModal(false);
  };
  const handleAddConfirm = () => {
    if (!addToOrderTableId) return;
    onAddToOrder(addToOrderTableId, [...cart], total);
    setCart([]);
    setShowModal(false);
  };
  const addModeBanner = addToTable ? (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, padding: "10px 16px",
      background: "rgba(239,159,39,0.12)", border: "1px solid rgba(239,159,39,0.35)",
      borderRadius: 10, marginBottom: 16,
    }}>
      <i className="ti ti-plus-equal" style={{ fontSize: 20, color: "var(--c-amber)" }}/>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, color: "var(--c-amber)", fontSize: 14 }}>
          Adding items to Table {addToTable.number}
        </div>
        <div style={{ fontSize: 12, color: "var(--c-faint)" }}>
          Customer: <strong style={{ color: "var(--c-c200)" }}>{addToTable.session?.customerName}</strong>
          &nbsp;·&nbsp;Order: {addToTable.session?.orderId}
          &nbsp;·&nbsp;Current total: ₹{addToTable.session?.total}
        </div>
      </div>
      <button
        onClick={onClearAddMode}
        style={{ background: "none", border: "none", color: "var(--c-faint)", cursor: "pointer", fontSize: 18, padding: 4 }}
        title="Cancel — go back to new order mode"
      >
        <i className="ti ti-x"/>
      </button>
    </div>
  ) : null;
  return (
    <>
      <div className="animate-page-enter">
        <SectionTitle>Point of Sale</SectionTitle>
        {addModeBanner}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-4">
          <div className="card">
            <div className="card__head">
              <div className="card__title">Menu</div>
              <div className="flex gap-1.5 flex-wrap">
                {TABS.map(t => (
                  <Button key={t} variant={activeTab === t ? "tab-active" : "tab"} onClick={() => setTab(t)}>{t}</Button>
                ))}
              </div>
            </div>
            {filtered.length === 0 ? (
              <div className="pos-empty">No items in this category</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {filtered.map(item => (
                  <button key={item.name} className="menu-btn" onClick={() => addItem(item.name, item.price)}>
                    <span className="menu-btn__emoji" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "32px" }}>
                      {item.emoji.startsWith("/") || item.emoji.startsWith("http") ? (
                        <img 
                          src={item.emoji} 
                          alt={item.name} 
                          style={{ width: "32px", height: "32px", objectFit: "cover", borderRadius: "8px" }} 
                        />
                      ) : (
                        item.emoji
                      )}
                    </span>
                    <div className="menu-btn__name">{item.name}</div>
                    <div className="menu-btn__price">₹{item.price}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="order-panel">
            <div className="flex items-center justify-between mb-3">
              <div className="order-panel__title">
                {addToTable ? `Adding to T${addToTable.number}` : "Current Order"}
              </div>
              <button className="order-panel__clear" onClick={() => setCart([])}>Clear all</button>
            </div>
            <div className="flex-1 overflow-y-auto" style={{ minHeight: 180 }}>
              {cart.length === 0
                ? <div className="order-panel__empty">Tap a menu item to start</div>
                : cart.map((item, i) => <CartItemRow key={item.name} item={item} index={i} onChangeQty={changeQty}/>)
              }
            </div>
            <div className="order-panel__footer">
              <div className="order-panel__row"><span>Subtotal</span><span>₹{subtotal}</span></div>
              <div className="order-panel__row"><span>Tax (5%)</span><span>₹{tax}</span></div>
              <div className="order-panel__total"><span>Total</span><span>₹{total}</span></div>
              <Button variant="brew-full" onClick={() => { if (cart.length) setShowModal(true); }}>
                <i className={`ti ${addToTable ? "ti-plus" : "ti-send"} mr-1`}/>
                {addToTable ? "Add to Order" : "Place Order"}
              </Button>
            </div>
          </div>
        </div>
      </div>
      {showModal && !addToTable && (
        <OrderModal
          cart={cart} total={total} tables={tables}
          onConfirm={handleNewOrderConfirm}
          preselectedTableId={preselectedTableId}
          onClose={() => { setShowModal(false); onClearPreselect?.(); }}
        />
      )}
      {showModal && addToTable && (
        <AddItemsModal
          cart={cart} extra={total} table={addToTable}
          onConfirm={handleAddConfirm}
          onClose={() => setShowModal(false)}
        />
      )}
      {confirmedOrder && (
        <OrderConfirmationModal
          orderId={confirmedOrder.orderId}
          tableNumber={confirmedOrder.tableNumber}
          items={confirmedOrder.items}
          total={confirmedOrder.total}
          onClose={() => { setConfirmedOrder(null); onClearPreselect?.(); }}
        />
      )}
    </>
  );
}