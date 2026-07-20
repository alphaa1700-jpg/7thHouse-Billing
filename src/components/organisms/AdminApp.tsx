"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import {
  NavPage, Notification, MenuItem, Order, Customer,
  CafeTable, TableSession, StockItem,
} from "@/types";
import { NOTIF_MESSAGES }        from "@/lib/data";
import { api }                   from "@/lib/api";
import type { StaffEntry }       from "@/lib/db";
import { Sidebar }               from "@/components/organisms/Sidebar";
import { Topbar }                from "@/components/organisms/Topbar";
import { NotificationArea }      from "@/components/organisms/NotificationArea";
import { DashboardPage }         from "@/components/organisms/pages/DashboardPage";
import { POSPage }               from "@/components/organisms/pages/POSPage";
import { OrdersPage }            from "@/components/organisms/pages/OrdersPage";
import { TablesPage }            from "@/components/organisms/pages/TablesPage";
import { MenuPage }              from "@/components/organisms/pages/MenuPage";
import { InventoryPage }         from "@/components/organisms/pages/InventoryPage";
import { StaffPage }             from "@/components/organisms/pages/StaffPage";
import { AnalyticsPage }         from "@/components/organisms/pages/AnalyticsPage";
import { CustomersPage }         from "@/components/organisms/pages/CustomersPage";
import { SettingsPage }          from "@/components/organisms/pages/SettingsPage";
export function AdminApp() {
  const [page,       setPage]       = useState<NavPage>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifs,     setNotifs]     = useState<Notification[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [menuItems,      setMenuItems]      = useState<MenuItem[]>([]);
  const [orders,         setOrders]         = useState<Order[]>([]);
  const [allOrdersToday, setAllOrdersToday] = useState<Order[]>([]);
  const [allOrders,      setAllOrders]      = useState<Order[]>([]);
  const [tables,         setTables]         = useState<CafeTable[]>([]);
  const [stockItems,     setStockItems]     = useState<StockItem[]>([]);
  const [staffList,      setStaffList]      = useState<StaffEntry[]>([]);
  const [customers,      setCustomers]      = useState<Customer[]>([]);
  const tablesRef    = useRef<CafeTable[]>([]);
  const customersRef = useRef<Customer[]>([]);
  useEffect(() => { tablesRef.current    = tables;    }, [tables]);
  useEffect(() => { customersRef.current = customers; }, [customers]);
  useEffect(() => {
    const todayStr = new Date().toDateString();
    api.snapshot.get()
      .then(db => {
        setMenuItems(db.menuItems);
        const todaysOrders = db.orders.filter(o => {
          try { return new Date(o.time).toDateString() === todayStr; } catch { return false; }
        });
        setOrders(todaysOrders.filter(o => o.status === "Prep" || o.status === "Ready"));
        setAllOrdersToday(todaysOrders);
        setAllOrders(db.orders);
        setTables(db.tables);
        setStockItems(db.stockItems);
        setStaffList(db.staff);
        setCustomers(db.customers ?? []);
      })
      .catch(() => pushNotif("⚠️ Could not connect to server — using cached data"))
      .finally(() => setLoading(false));
  }, []);
  const pushNotif = useCallback((message: string) => {
    const id = Date.now().toString();
    setNotifs(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, leaving: true } : n));
      setTimeout(() => setNotifs(prev => prev.filter(n => n.id !== id)), 400);
    }, 4500);
  }, []);
  const dismissNotif = useCallback((id: string) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, leaving: true } : n));
    setTimeout(() => setNotifs(prev => prev.filter(n => n.id !== id)), 400);
  }, []);
  useEffect(() => {
    if (loading) return;
    const t1 = setTimeout(() => pushNotif(NOTIF_MESSAGES[0]), 1800);
    const t2 = setTimeout(() => pushNotif(NOTIF_MESSAGES[1]), 7000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [loading, pushNotif]);
  const [addToOrderTableId,  setAddToOrderTableId]  = useState<string | null>(null);
  const [preselectedTableId, setPreselectedTableId] = useState<string | null>(null);
  const handlePlaceOrder = useCallback(async (
    newOrder: Order, session: TableSession, tableId: string
  ) => {
    const addNew = (prev: Order[]) => [newOrder, ...prev];
    setOrders(addNew);
    setAllOrdersToday(addNew);
    setAllOrders(addNew);
    const nextTables = tablesRef.current.map(t =>
      t.id === tableId
        ? { ...t, status: "occupied" as const, session: { ...session, status: "occupied" as const } }
        : t
    );
    setTables(nextTables);
    pushNotif(`Order ${newOrder.id} placed — Table ${session.tableNumber} · ${session.customerName}`);
    Promise.all([
      api.orders.add(newOrder),
      api.tables.update(nextTables),
    ]).catch(() => pushNotif("⚠️ Order saved locally but failed to sync with server"));
  }, [pushNotif]);
  const handleAddToOrder = useCallback(async (
    tableId: string, newItems: import("@/types").CartItem[], extraTotal: number
  ) => {
    const table = tablesRef.current.find(t => t.id === tableId);
    if (!table?.session) return;
    const merged = [...table.session.items];
    newItems.forEach(incoming => {
      const existing = merged.find(i => i.name === incoming.name);
      if (existing) existing.qty += incoming.qty;
      else merged.push({ ...incoming });
    });
    const newTotal = table.session.total + extraTotal;
    const itemsStr = merged.map(i => `${i.name}${i.qty > 1 ? ` ×${i.qty}` : ""}`).join(", ");
    const orderId  = table.session.orderId;
    const nextTables = tablesRef.current.map(t =>
      t.id === tableId ? { ...t, session: { ...t.session!, items: merged, total: newTotal } } : t
    );
    setTables(nextTables);
    const updateOrder = (o: Order) =>
      o.id === orderId ? { ...o, items: itemsStr, amount: newTotal } : o;
    setOrders(prev => prev.map(updateOrder));
    setAllOrdersToday(prev => prev.map(updateOrder));
    setAllOrders(prev => prev.map(updateOrder));
    setAddToOrderTableId(null);
    pushNotif(`Items added to Table ${table.number} — new total ₹${newTotal}`);
    Promise.all([
      api.tables.update(nextTables),
      fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, items: itemsStr, amount: newTotal }),
      }),
    ]).catch(() => pushNotif("⚠️ Items added locally but failed to sync"));
  }, [pushNotif]);
  const handleClearTable = useCallback(async (tableId: string) => {
    const currentTables    = tablesRef.current;
    const currentCustomers = customersRef.current;
    const table   = currentTables.find(t => t.id === tableId);
    const session = table?.session;
    let updatedCustomers: Customer[] = currentCustomers;
    if (session) {
      const today   = new Date().toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" });
      const favItem = [...session.items].sort((a, b) => b.qty - a.qty)[0]?.name ?? "—";
      const existing = currentCustomers.find(c => c.name === session.customerName);
      if (existing) {
        const prevSpent = parseFloat(existing.spent.replace(/[₹,]/g, "")) || 0;
        updatedCustomers = currentCustomers.map(c => c.name === session.customerName ? {
          ...c, visits: c.visits + 1,
          spent: `₹${(prevSpent + session.total).toLocaleString("en-IN")}`,
          lastVisit: "Today", favItem,
          tier: (c.visits + 1 >= 20 ? "Gold" : c.visits + 1 >= 10 ? "Silver" : "Regular") as Customer["tier"],
        } : c);
      } else {
        updatedCustomers = [{
          name: session.customerName, visits: 1,
          spent: `₹${session.total.toLocaleString("en-IN")}`,
          favItem, lastVisit: today, tier: "Regular" as const,
        }, ...currentCustomers];
      }
    }
    const completedOrderId = session?.orderId ?? null;
    setOrders(prev => prev.filter(o => o.id !== completedOrderId));
    if (completedOrderId) {
      const markDone = (o: Order) => o.id === completedOrderId ? { ...o, status: "Done" as const } : o;
      setAllOrdersToday(prev => prev.map(markDone));
      setAllOrders(prev => prev.map(markDone));
    }
    setCustomers(updatedCustomers);
    const nextTables = currentTables.map(t =>
      t.id === tableId ? { ...t, status: "available" as const, session: undefined } : t
    );
    setTables(nextTables);
    pushNotif("Table cleared — now available");
    Promise.all([
      api.tables.update(nextTables),
      api.customers.update(updatedCustomers),
      completedOrderId ? api.orders.update(completedOrderId, "Done") : Promise.resolve(),
    ]).catch(() => pushNotif("⚠️ Table cleared locally but failed to sync"));
  }, [pushNotif]);
  const handleMarkReady = useCallback(async (tableId: string) => {
    const currentTables = tablesRef.current;
    let updatedOrderId = "";
    const nextTables = currentTables.map(t => {
      if (t.id !== tableId || !t.session) return t;
      updatedOrderId = t.session.orderId;
      return { ...t, session: { ...t.session, status: "ready" as const } };
    });
    setTables(nextTables);
    if (updatedOrderId) {
      const markReady = (o: Order) => o.id === updatedOrderId ? { ...o, status: "Ready" as const } : o;
      setOrders(prev => prev.map(markReady));
      setAllOrdersToday(prev => prev.map(markReady));
      setAllOrders(prev => prev.map(markReady));
    }
    pushNotif("Order marked ready — table notified");
    if (updatedOrderId) {
      Promise.all([
        api.tables.update(nextTables),
        api.orders.update(updatedOrderId, "Ready"),
      ]).catch(() => pushNotif("⚠️ Status updated locally but failed to sync"));
    }
  }, [pushNotif]);
  const handleMoveTable = useCallback(async (fromTableId: string, toTableId: string) => {
    const currentTables = tablesRef.current;
    const sourceTable = currentTables.find(t => t.id === fromTableId);
    const destTable = currentTables.find(t => t.id === toTableId);

    if (!sourceTable || !sourceTable.session || !destTable) return;

    const sessionToMove = {
      ...sourceTable.session,
      tableNumber: destTable.number,
    };

    const nextTables = currentTables.map(t => {
      if (t.id === fromTableId) {
        return { ...t, status: "available" as const, session: undefined };
      }
      if (t.id === toTableId) {
        return { ...t, status: sourceTable.status, session: sessionToMove };
      }
      return t;
    });

    setTables(nextTables);
    pushNotif(`Moved order from Table ${sourceTable.number} to Table ${destTable.number}`);

    try {
      await api.tables.update(nextTables);
    } catch {
      pushNotif("⚠️ Table moved locally but failed to sync");
    }
  }, [pushNotif]);
  const handleDeleteOrders = useCallback(async (ids: string[]) => {
    setOrders(prev => prev.filter(o => !ids.includes(o.id)));
    const markDone = (o: Order) => ids.includes(o.id) ? { ...o, status: "Done" as const } : o;
    setAllOrdersToday(prev => prev.map(markDone));
    setAllOrders(prev => prev.map(markDone));
    Promise.all(ids.map(id => api.orders.update(id, "Done")))
      .catch(() => pushNotif("⚠️ Status updated locally but failed to sync with server"));
  }, [pushNotif]);
  const handleMarkDone = useCallback((id: string) => {
    setOrders(prev => prev.filter(o => o.id !== id));
    const markDone = (o: Order) => o.id === id ? { ...o, status: "Done" as const } : o;
    setAllOrdersToday(prev => prev.map(markDone));
    setAllOrders(prev => prev.map(markDone));
    api.orders.update(id, "Done")
      .catch(() => pushNotif("⚠️ Status updated locally but failed to sync with server"));
  }, [pushNotif]);
  const handleOrdersChange = useCallback((updated: Order[]) => {
    setOrders(updated);
    setAllOrdersToday(prev => prev.map(o => {
      const match = updated.find(u => u.id === o.id);
      return match ? { ...o, ...match } : o;
    }));
    setAllOrders(prev => prev.map(o => {
      const match = updated.find(u => u.id === o.id);
      return match ? { ...o, ...match } : o;
    }));
  }, []);
  const handleMenuChange = useCallback(async (items: MenuItem[]) => {
    setMenuItems(items);
    try { await api.menu.update(items); } catch { pushNotif("⚠️ Menu saved locally but failed to sync"); }
    pushNotif(`Menu updated — ${items.length} items total`);
  }, [pushNotif]);
  const handleStockChange = useCallback(async (items: StockItem[]) => {
    setStockItems(items);
    try { await api.stock.update(items); } catch { pushNotif("⚠️ Stock saved locally but failed to sync"); }
    const critical = items.filter(i => i.status === "Critical").length;
    if (critical > 0) pushNotif(`⚠️ ${critical} item${critical > 1 ? "s" : ""} critically low in stock`);
  }, [pushNotif]);
  const handleStaffChange = useCallback(async (updated: StaffEntry[]) => {
    updated.forEach(m => {
      const old = staffList.find(p => p.name === m.name);
      if (!old) return;
      if (!old.onDuty && m.onDuty)  pushNotif(`${m.name} checked in ✅`);
      if (old.onDuty  && !m.onDuty) pushNotif(`${m.name} checked out 👋`);
    });
    setStaffList(updated);
    try { await api.staff.update(updated); } catch { pushNotif("⚠️ Staff status saved locally but failed to sync"); }
  }, [staffList, pushNotif]);
  const navigate = useCallback((p: NavPage) => { setPage(p); setMobileOpen(false); }, []);
  const activeOrderCount   = orders.length;
  const occupiedTableCount = tables.filter(t => t.status === "occupied").length;
  const criticalStockCount = stockItems.filter(i => i.status === "Critical").length;
  const badgeCounts: Partial<Record<NavPage, string | number>> = {
    orders:    activeOrderCount   > 0 ? activeOrderCount   : "",
    tables:    occupiedTableCount > 0 ? occupiedTableCount : "",
    inventory: criticalStockCount > 0 ? criticalStockCount : "",
  };
  const completedOrders = allOrdersToday.filter(o => o.status === "Done" || o.status === "Picked Up");
  if (loading) {
    return (
      <div style={{
        minHeight:"100vh", display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        background:"#1A0F07", gap:16,
      }}>
        <div style={{ fontSize:40 }}>☕</div>
        <div style={{ color:"var(--c-c200)", fontFamily:"DM Sans, sans-serif", fontSize:18, fontWeight:600 }}>
          7th House Coffee
        </div>
        <div style={{ color:"var(--c-faint)", fontSize:13 }}>Loading your café data…</div>
        <div style={{ width:180, height:3, background:"#3a2510", borderRadius:4, overflow:"hidden", marginTop:8 }}>
          <div style={{ height:"100%", background:"var(--c-c200)", borderRadius:4, animation:"progress 1.4s ease-in-out infinite" }}/>
        </div>
        <style>{`@keyframes progress { 0%{width:0%} 60%{width:80%} 100%{width:100%} }`}</style>
      </div>
    );
  }
  return (
    <div className="flex min-h-screen bg-[var(--c-bg-800)] overflow-hidden">
      <Sidebar
        activePage={page} onNavigate={navigate}
        mobileOpen={mobileOpen} onOverlayClick={() => setMobileOpen(false)}
        badgeCounts={badgeCounts}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar
          activePage={page}
          onNewOrder={() => navigate("pos")}
          onAlert={() => pushNotif(NOTIF_MESSAGES[Math.floor(Math.random() * NOTIF_MESSAGES.length)])}
          onMenuToggle={() => setMobileOpen(o => !o)}
        />
        <div className="relative flex-1 overflow-hidden flex flex-col">
          <NotificationArea notifications={notifs} onDismiss={dismissNotif}/>
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">

            {page === "dashboard" && (
              <DashboardPage
                orders={orders}
                allOrdersToday={allOrdersToday}
                stockItems={stockItems}
                staffOnDuty={staffList}
              />
            )}
            {page === "pos" && (
              <POSPage
                menuItems={menuItems}
                tables={tables}
                onPlaceOrder={handlePlaceOrder}
                onAddToOrder={handleAddToOrder}
                addToOrderTableId={addToOrderTableId}
                onClearAddMode={() => setAddToOrderTableId(null)}
                preselectedTableId={preselectedTableId}
                onClearPreselect={() => setPreselectedTableId(null)}
              />
            )}
            {page === "orders" && (
              <OrdersPage
                orders={orders}
                completedOrders={completedOrders}
                onOrdersChange={handleOrdersChange}
                onDeleteOrders={handleDeleteOrders}
                onMarkDone={handleMarkDone}
                onNotify={pushNotif}
                onNewOrder={() => navigate("pos")}
              />
            )}
            {page === "tables" && (
              <TablesPage
                tables={tables}
                onClearTable={handleClearTable}
                onMarkReady={handleMarkReady}
                onMoveTable={handleMoveTable}
                onAddItems={(tableId) => { setAddToOrderTableId(tableId); navigate("pos"); }}
                onNewOrder={(tableId) => { setPreselectedTableId(tableId); navigate("pos"); }}
              />
            )}
            {page === "menu" && (
              <MenuPage menuItems={menuItems} onMenuChange={handleMenuChange}/>
            )}
            {page === "inventory" && (
              <InventoryPage stockItems={stockItems} onStockChange={handleStockChange}/>
            )}
            {page === "staff" && (
              <StaffPage staffList={staffList} onStaffChange={handleStaffChange}/>
            )}
            {page === "analytics" && (
              <AnalyticsPage allOrders={allOrders}/>
            )}
            {page === "customers" && (
              <CustomersPage customers={customers}/>
            )}
            {page === "settings" && (
              <SettingsPage onSave={pushNotif}/>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}