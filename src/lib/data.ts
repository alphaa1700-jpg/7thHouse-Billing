import type { MenuItem, StockItem, NavItemDef, CafeTable } from "@/types";

export const MENU_ITEMS: MenuItem[] = [
  { emoji:"/images/cappuccino.jpg", name:"Cappuccino",  category:"Espresso",  price:150, availability:"Available",   ordersToday:38, trending:true },
  { emoji:"/images/latte.jpg",       name:"Latte",       category:"Espresso",  price:160, availability:"Available",   ordersToday:29 },
  { emoji:"/images/cold_brew.jpg",   name:"Cold Brew",   category:"Cold",      price:180, availability:"Available",   ordersToday:24, trending:true },
  { emoji:"/images/matcha_latte.jpg",name:"Matcha Latte",category:"Specialty", price:190, availability:"Low Stock",   ordersToday:18, hot:true },
  { emoji:"/images/espresso.jpg",    name:"Espresso",    category:"Espresso",  price:100, availability:"Available",   ordersToday:12 },
  { emoji:"/images/americano.jpg",   name:"Americano",   category:"Espresso",  price:120, availability:"Available",   ordersToday:16 },
  { emoji:"/images/croissant.jpg",   name:"Croissant",   category:"Food",      price:100, availability:"Unavailable", ordersToday:0  },
  { emoji:"/images/muffin.jpg",      name:"Muffin",      category:"Food",      price:80,  availability:"Available",   ordersToday:8  },
  { emoji:"/images/sandwich.jpg",    name:"Sandwich",    category:"Food",      price:140, availability:"Available",   ordersToday:6  },
];

export const STOCK_ITEMS: StockItem[] = [
  { name:"Espresso Beans", category:"Coffee",    stock:0.8, unit:"kg",    reorderAt:"2 kg",    status:"Critical", fillPercent:20 },
  { name:"Oat Milk",       category:"Dairy Alt", stock:2,   unit:"packs", reorderAt:"5 packs", status:"Critical", fillPercent:15 },
  { name:"Cups (S)",       category:"Supplies",  stock:45,  unit:"pcs",   reorderAt:"100 pcs", status:"Low",      fillPercent:30 },
  { name:"Whole Milk",     category:"Dairy",     stock:12,  unit:"L",     reorderAt:"5 L",     status:"Good",     fillPercent:75 },
  { name:"Matcha Powder",  category:"Tea",       stock:400, unit:"g",     reorderAt:"200 g",   status:"Good",     fillPercent:80 },
  { name:"Cups (L)",       category:"Supplies",  stock:180, unit:"pcs",   reorderAt:"100 pcs", status:"Good",     fillPercent:90 },
];

export const INITIAL_TABLES: CafeTable[] = [
  { id:"t1", number:1, capacity:4, status:"available", shape:"square" },
  { id:"t2", number:2, capacity:4, status:"available", shape:"square" },
  { id:"t3", number:3, capacity:4, status:"available", shape:"square" },
  { id:"t4", number:4, capacity:4, status:"available", shape:"square" },
  { id:"t5", number:5, capacity:4, status:"available", shape:"square" },
  { id:"t6", number:6, capacity:4, status:"available", shape:"square" },
];

export const DASHBOARD_BARS = [
  {label:"7A",value:40},{label:"8A",value:80},{label:"9A",value:100},
  {label:"10A",value:75},{label:"11A",value:55},{label:"12P",value:70},
  {label:"1P",value:60},{label:"2P",value:45},
];

export const NAV_ITEMS: NavItemDef[] = [
  { page:"dashboard", label:"Dashboard",  icon:"ti-layout-dashboard", section:"Overview", badge:"Live", badgeType:"live"  },
  { page:"tables",    label:"Tables",     icon:"ti-armchair",                              badge:"8",    badgeType:"count" },
  { page:"pos",       label:"New Orders", icon:"ti-coffee"                                                                },
  { page:"orders",    label:"Orders",     icon:"ti-clipboard-list",   section:"Manage",   badge:"5",    badgeType:"count" },
  { page:"menu",      label:"Menu",       icon:"ti-book"                                                                  },
  { page:"inventory", label:"Inventory",  icon:"ti-package",                               badge:"3",    badgeType:"alert" },
  { page:"staff",     label:"Staff",      icon:"ti-users"                                                                 },
  { page:"analytics", label:"Analytics",  icon:"ti-chart-bar",        section:"Insights"                                  },
  { page:"customers", label:"Customers",  icon:"ti-heart"                                                                 },
  { page:"settings",  label:"Settings",   icon:"ti-settings",         section:"System"                                    },
];

export const NOTIF_MESSAGES = [
  "Good morning! Peak hour starts soon ☕",
  "Low stock: Espresso Beans (0.8 kg remaining)",
  "New order from Table 6 – Cappuccino ×2",
  "Shift B check-in at 3:00 PM",
];