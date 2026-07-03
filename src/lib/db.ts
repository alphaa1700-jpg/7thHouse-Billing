import { MENU_ITEMS, STOCK_ITEMS, INITIAL_TABLES } from "@/lib/data";
import type { Order, MenuItem, StockItem, CafeTable, Customer } from "@/types";
import { createPrivateKey, createSign } from "crypto";
export interface StaffEntry {
  initials: string; name: string; role: string;
  shift: "Shift A" | "Shift B"; onDuty: boolean; color: string; hours?: string;
  checkInTime?: string; checkOutTime?: string;
  hoursLog: { date: string; checkIn: string; checkOut?: string }[];
  firstName?: string; lastName?: string; phone?: string; imageUrl?: string;
}
export interface DB {
  orders:      Order[];
  menuItems:   MenuItem[];
  stockItems:  StockItem[];
  tables:      CafeTable[];
  staff:       StaffEntry[];
  customers:   Customer[];
  lastUpdated: string;
}
const TAB = {
  orders:    "Orders",
  menu:      "Menu",
  stock:     "Stock",
  tables:    "Tables",
  staff:     "Staff",
  customers: "Customers",
} as const;
const COLS = {
  orders:    ["id","items","customer","phone","tableNumber","time","amount","status"],
  menu:      ["emoji","name","category","price","availability","ordersToday","trending","hot"],
  stock:     ["name","category","stock","unit","reorderAt","status","fillPercent"],
  tables:    ["id","number","capacity","status","shape","session"],
  customers: ["name","visits","spent","favItem","lastVisit","tier"],
  staff:     ["initials","name","firstName","lastName","phone","imageUrl",
              "role","shift","onDuty","color","hours",
              "checkInTime","checkOutTime","hoursLog"],
} as const;
let _accessToken: string | null = null;
let _tokenExpiry = 0;

function hasSheetConfig(): boolean {
  return Boolean(process.env.GOOGLE_SERVICE_ACCOUNT && process.env.GOOGLE_SHEET_ID);
}

function parseServiceAccount() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT;
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT env var is missing");

  const normalizeJson = (value: string) => value.replace(/\r\n/g, "\n").replace(/\n/g, "\\n");

  try {
    return JSON.parse(raw) as {
      client_email: string;
      private_key: string;
    };
  } catch (firstError) {
    try {
      return JSON.parse(normalizeJson(raw)) as {
        client_email: string;
        private_key: string;
      };
    } catch (secondError) {
      throw new Error(
        `GOOGLE_SERVICE_ACCOUNT is not valid JSON: ${secondError instanceof Error ? secondError.message : String(secondError)}`
      );
    }
  }
}

async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (_accessToken && now < _tokenExpiry - 60) return _accessToken;

  const sa = parseServiceAccount();
  const iat = Math.max(now - 30, 0);
  const exp = iat + 3300;

  const header  = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    iss:   sa.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud:   "https://oauth2.googleapis.com/token",
    iat,
    exp,
  })).toString("base64url");
  const signingInput = `${header}.${payload}`;

  const privateKey = createPrivateKey({
    key: sa.private_key,
    format: "pem",
  });
  const sign = createSign("RSA-SHA256");
  sign.update(signingInput);
  const signature = sign.sign(privateKey, "base64url");
  const jwt = `${signingInput}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion:  jwt,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to get access token: ${err}`);
  }
  const data = await res.json() as { access_token: string; expires_in: number };
  _accessToken = data.access_token;
  _tokenExpiry = now + data.expires_in;
  return _accessToken;
}
function sheetId(): string {
  const id = process.env.GOOGLE_SHEET_ID;
  if (!id) throw new Error("GOOGLE_SHEET_ID env var is missing");
  return id;
}
async function readSheet<T>(tab: string, cols: readonly string[]): Promise<T[]> {
  const token = await getAccessToken();
  const url   = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId()}/values/${encodeURIComponent(tab + "!A1:Z")}`;
  const res   = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`readSheet ${tab} → ${res.status}`);
  const data  = await res.json() as { values?: string[][] };
  const rows  = data.values ?? [];
  if (rows.length <= 1) return [];
  return rows.slice(1).map(row =>
    Object.fromEntries(cols.map((col, i) => [col, row[i] ?? ""])) as unknown as T
  );
}
async function writeSheet<T extends object>(
  tab: string,
  cols: readonly string[],
  data: T[]
): Promise<void> {
  const token  = await getAccessToken();
  const sid    = sheetId();
  const header = [cols as string[]];
  const rows   = data.map(item =>
    cols.map(col => {
      const v = (item as Record<string, unknown>)[col];
      if (v === undefined || v === null) return "";
      if (typeof v === "object") return JSON.stringify(v);
      return String(v);
    })
  );
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sid}/values/${encodeURIComponent(tab + "!A1")}?valueInputOption=RAW`,
    {
      method:  "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body:    JSON.stringify({ values: [...header, ...rows] }),
    }
  );
  const lastDataRow = rows.length + 1;
  try {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sid}/values/${encodeURIComponent(tab + `!A${lastDataRow + 1}:Z`)}:clear`,
      {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      }
    );
  } catch { /* ignore */ }
}
let _sheetsInitialised = false;
export async function initSheets(): Promise<void> {
  if (!hasSheetConfig()) return;
  if (_sheetsInitialised) return;
  const token = await getAccessToken();
  const sid   = sheetId();

  const res  = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sid}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`initSheets → ${res.status}`);
  const meta = await res.json() as { sheets: { properties: { title: string } }[] };
  const existing = meta.sheets.map(s => s.properties.title);
  const needed   = Object.values(TAB).filter(t => !existing.includes(t));
  if (needed.length > 0) {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sid}:batchUpdate`, {
      method:  "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: needed.map(title => ({ addSheet: { properties: { title } } })),
      }),
    });
  }
  _sheetsInitialised = true;
}
function parseOrders(rows: Record<string,string>[]): Order[] {
  return rows.map(r => ({
    id:          r.id,
    items:       r.items,
    customer:    r.customer,
    phone:       r.phone || undefined,
    tableNumber: r.tableNumber || undefined,
    time:        r.time,
    amount:      Number(r.amount),
    status:      r.status as Order["status"],
  }));
}
function parseMenu(rows: Record<string,string>[]): MenuItem[] {
  return rows.map(r => ({
    emoji:        r.emoji,
    name:         r.name,
    category:     r.category,
    price:        Number(r.price),
    availability: r.availability as MenuItem["availability"],
    ordersToday:  Number(r.ordersToday),
    trending:     r.trending === "true" ? true : undefined,
    hot:          r.hot      === "true" ? true : undefined,
  }));
}
function parseStock(rows: Record<string,string>[]): StockItem[] {
  return rows.map(r => ({
    name:        r.name,
    category:    r.category,
    stock:       Number(r.stock),
    unit:        r.unit,
    reorderAt:   r.reorderAt,
    status:      r.status as StockItem["status"],
    fillPercent: Number(r.fillPercent),
  }));
}
function parseTables(rows: Record<string,string>[]): CafeTable[] {
  return rows.map(r => ({
    id:       r.id,
    number:   Number(r.number),
    capacity: Number(r.capacity),
    status:   r.status as CafeTable["status"],
    shape:    r.shape as CafeTable["shape"],
    session:  r.session ? JSON.parse(r.session) : undefined,
  }));
}
function parseCustomers(rows: Record<string,string>[]): Customer[] {
  return rows.map(r => ({
    name:      r.name,
    visits:    Number(r.visits),
    spent:     r.spent,
    favItem:   r.favItem,
    lastVisit: r.lastVisit,
    tier:      r.tier as Customer["tier"],
  }));
}
function parseStaff(rows: Record<string,string>[]): StaffEntry[] {
  return rows.map(r => ({
    initials:     r.initials,
    name:         r.name,
    firstName:    r.firstName  || undefined,
    lastName:     r.lastName   || undefined,
    phone:        r.phone      || undefined,
    imageUrl:     r.imageUrl   || undefined,
    role:         r.role,
    shift:        r.shift as StaffEntry["shift"],
    onDuty:       r.onDuty === "true",
    color:        r.color,
    hours:        r.hours || undefined,
    checkInTime:  r.checkInTime  || undefined,
    checkOutTime: r.checkOutTime || undefined,
    hoursLog:     r.hoursLog ? JSON.parse(r.hoursLog) : [],
  }));
}
const DEFAULTS: DB = {
  orders:      [],
  menuItems:   [...MENU_ITEMS],
  stockItems:  [...STOCK_ITEMS],
  tables:      [...INITIAL_TABLES],
  staff:       [],
  customers:   [],
  lastUpdated: new Date().toISOString(),
};
export async function readDB(): Promise<DB> {
  if (!hasSheetConfig()) return DEFAULTS;

  try {
    await initSheets();
    const [orderRows, menuRows, stockRows, tableRows, staffRows, customerRows] = await Promise.all([
      readSheet<Record<string,string>>(TAB.orders,    COLS.orders),
      readSheet<Record<string,string>>(TAB.menu,      COLS.menu),
      readSheet<Record<string,string>>(TAB.stock,     COLS.stock),
      readSheet<Record<string,string>>(TAB.tables,    COLS.tables),
      readSheet<Record<string,string>>(TAB.staff,     COLS.staff),
      readSheet<Record<string,string>>(TAB.customers, COLS.customers),
    ]);
  const isFirstRun =
    menuRows.length  === 0 &&
    stockRows.length === 0 &&
    tableRows.length === 0 &&
    staffRows.length === 0;

    if (isFirstRun) {
      await writeDB(DEFAULTS);
      return DEFAULTS;
    }
    return {
      orders:      parseOrders(orderRows),
      menuItems:   menuRows.length  ? parseMenu(menuRows)    : DEFAULTS.menuItems,
      stockItems:  stockRows.length ? parseStock(stockRows)  : DEFAULTS.stockItems,
      tables:      tableRows.length ? parseTables(tableRows) : DEFAULTS.tables,
      staff:       staffRows.length ? parseStaff(staffRows)  : DEFAULTS.staff,
      customers:   parseCustomers(customerRows),
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[db] Failed to load data from Google Sheets:", error);
    throw error;
  }
}
export async function writeDB(data: DB): Promise<DB> {
  if (!hasSheetConfig()) return { ...data, lastUpdated: new Date().toISOString() };
  await initSheets();
  data.lastUpdated = new Date().toISOString();
  await Promise.all([
    writeSheet(TAB.orders,    COLS.orders,    data.orders),
    writeSheet(TAB.menu,      COLS.menu,      data.menuItems),
    writeSheet(TAB.stock,     COLS.stock,     data.stockItems),
    writeSheet(TAB.tables,    COLS.tables,    data.tables),
    writeSheet(TAB.staff,     COLS.staff,     data.staff),
    writeSheet(TAB.customers, COLS.customers, data.customers),
  ]);
  return data;
}
export async function updateDB(patch: Partial<DB>): Promise<DB> {
  const current = await readDB();
  return writeDB({ ...current, ...patch });
}
function fallback<T>(value: T): T {
  return value;
}

export async function readOrders(): Promise<Order[]> {
  if (!hasSheetConfig()) return fallback(DEFAULTS.orders);
  try { return parseOrders(await readSheet<Record<string,string>>(TAB.orders, COLS.orders)); }
  catch (error) { console.warn("[db] readOrders fallback:", error); return DEFAULTS.orders; }
}
export async function writeOrders(orders: Order[]): Promise<Order[]> {
  if (!hasSheetConfig()) return orders;
  try { await writeSheet(TAB.orders, COLS.orders, orders); return orders; }
  catch (error) { console.warn("[db] writeOrders fallback:", error); return orders; }
}
export async function readTables(): Promise<CafeTable[]> {
  if (!hasSheetConfig()) return fallback(DEFAULTS.tables);
  try { return parseTables(await readSheet<Record<string,string>>(TAB.tables, COLS.tables)); }
  catch (error) { console.warn("[db] readTables fallback:", error); return DEFAULTS.tables; }
}
export async function writeTables(tables: CafeTable[]): Promise<CafeTable[]> {
  if (!hasSheetConfig()) return tables;
  try { await writeSheet(TAB.tables, COLS.tables, tables); return tables; }
  catch (error) { console.warn("[db] writeTables fallback:", error); return tables; }
}
export async function readCustomers(): Promise<Customer[]> {
  if (!hasSheetConfig()) return fallback(DEFAULTS.customers);
  try { return parseCustomers(await readSheet<Record<string,string>>(TAB.customers, COLS.customers)); }
  catch (error) { console.warn("[db] readCustomers fallback:", error); return DEFAULTS.customers; }
}
export async function writeCustomers(customers: Customer[]): Promise<Customer[]> {
  if (!hasSheetConfig()) return customers;
  try { await writeSheet(TAB.customers, COLS.customers, customers); return customers; }
  catch (error) { console.warn("[db] writeCustomers fallback:", error); return customers; }
}
export async function readMenu(): Promise<MenuItem[]> {
  if (!hasSheetConfig()) return fallback(DEFAULTS.menuItems);
  try { return parseMenu(await readSheet<Record<string,string>>(TAB.menu, COLS.menu)); }
  catch (error) { console.warn("[db] readMenu fallback:", error); return DEFAULTS.menuItems; }
}
export async function writeMenu(items: MenuItem[]): Promise<MenuItem[]> {
  if (!hasSheetConfig()) return items;
  try { await writeSheet(TAB.menu, COLS.menu, items); return items; }
  catch (error) { console.warn("[db] writeMenu fallback:", error); return items; }
}
export async function readStock(): Promise<StockItem[]> {
  if (!hasSheetConfig()) return fallback(DEFAULTS.stockItems);
  try { return parseStock(await readSheet<Record<string,string>>(TAB.stock, COLS.stock)); }
  catch (error) { console.warn("[db] readStock fallback:", error); return DEFAULTS.stockItems; }
}
export async function writeStock(items: StockItem[]): Promise<StockItem[]> {
  if (!hasSheetConfig()) return items;
  try { await writeSheet(TAB.stock, COLS.stock, items); return items; }
  catch (error) { console.warn("[db] writeStock fallback:", error); return items; }
}
export async function readStaff(): Promise<StaffEntry[]> {
  if (!hasSheetConfig()) return fallback(DEFAULTS.staff);
  try { return parseStaff(await readSheet<Record<string,string>>(TAB.staff, COLS.staff)); }
  catch (error) { console.warn("[db] readStaff fallback:", error); return DEFAULTS.staff; }
}
export async function writeStaff(staff: StaffEntry[]): Promise<StaffEntry[]> {
  if (!hasSheetConfig()) return staff;
  try { await writeSheet(TAB.staff, COLS.staff, staff); return staff; }
  catch (error) { console.warn("[db] writeStaff fallback:", error); return staff; }
}
