
import { NextRequest, NextResponse } from "next/server";
import { readStock, writeStock } from "@/lib/db";
import type { StockItem } from "@/types";

function err(msg: string, status = 500) {
  console.error("[stock]", msg);
  return NextResponse.json({ error: msg }, { status });
}

export async function GET() {
  try {
    return NextResponse.json(await readStock());
  } catch (e) { return err(String(e)); }
}

export async function PUT(req: NextRequest) {
  try {
    const items: StockItem[] = await req.json();
    return NextResponse.json(await writeStock(items));
  } catch (e) { return err(String(e)); }
}