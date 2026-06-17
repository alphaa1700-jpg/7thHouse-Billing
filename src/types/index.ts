
export type NavPage =
  | "dashboard" | "pos" | "orders" | "tables" | "menu"
  | "inventory" | "staff" | "analytics" | "customers" | "settings";

export interface CartItem   { name: string; price: number; qty: number; }

export interface Order {
  id: string;
  items: string;
  customer: string;
  phone?: string;
  tableNumber?: string;
  time: string;
  amount: number;
  status: "Ready" | "Prep" | "Done" | "Picked Up";
}

export interface TableSession {
  tableId: string;
  tableNumber: number;
  customerName: string;
  phone: string;
  orderId: string;
  items: CartItem[];
  total: number;
  startTime: string;
  status: "occupied" | "ready" | "done";
}

export interface CafeTable {
  id: string;
  number: number;
  capacity: number;
  status: "available" | "occupied" | "reserved" | "cleaning";
  session?: TableSession;
  shape: "round" | "square" | "rect";
}

export interface MenuItem   { emoji: string; name: string; category: string; price: number; availability: "Available"|"Low Stock"|"Unavailable"; ordersToday: number; trending?: boolean; hot?: boolean; }
export interface StockItem  { name: string; category: string; stock: number; unit: string; reorderAt: string; status: "Critical"|"Low"|"Good"; fillPercent: number; }
export interface StaffMember{ initials: string; name: string; role: string; shift: "Shift A"|"Shift B"; onDuty: boolean; color: string; hours?: string; }
export interface Customer   { name: string; visits: number; spent: string; favItem: string; lastVisit: string; tier: "Gold"|"Silver"|"Regular"; }
export interface Notification{ id: string; message: string; leaving?: boolean; }

export interface NavItemDef {
  page: NavPage; label: string; icon: string;
  section?: string; badge?: string; badgeType?: "live"|"count"|"alert";
}