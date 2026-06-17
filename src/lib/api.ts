import type { Order, MenuItem, StockItem, CafeTable, Customer } from "@/types";
import type { StaffEntry, DB } from "@/lib/db";

const BASE = "/api";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json();
}

async function put<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PUT ${path} → ${res.status}`);
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} → ${res.status}`);
  return res.json();
}

async function del<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "DELETE", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`DELETE ${path} → ${res.status}`);
  return res.json();
}

export const api = {
  snapshot: {
    get: () => get<DB>("/snapshot"),
  },
  orders: {
    get:    ()                                    => get<Order[]>("/orders"),
    add:    (order: Order)                        => post<Order[]>("/orders", order),
    update: (id: string, status: Order["status"]) => put<Order[]>("/orders", { id, status }),
    delete: (ids: string[])                       => del<Order[]>("/orders", { ids }),
  },
  tables: {
    get:    ()               => get<CafeTable[]>("/tables"),
    update: (t: CafeTable[]) => put<CafeTable[]>("/tables", t),
  },
  menu: {
    get:    ()              => get<MenuItem[]>("/menu"),
    update: (m: MenuItem[]) => put<MenuItem[]>("/menu", m),
  },
  stock: {
    get:    ()               => get<StockItem[]>("/stock"),
    update: (s: StockItem[]) => put<StockItem[]>("/stock", s),
  },
  staff: {
    get:    ()                => get<StaffEntry[]>("/staff"),
    update: (s: StaffEntry[]) => put<StaffEntry[]>("/staff", s),
    add:    (m: StaffEntry)   => post<StaffEntry[]>("/staff", m),
  },
  customers: {
    get:    ()              => get<Customer[]>("/customers"),
    update: (c: Customer[]) => put<Customer[]>("/customers", c),
  },
};