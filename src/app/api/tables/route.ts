import { NextRequest, NextResponse } from "next/server";
import { readTables, writeTables } from "@/lib/db";
import type { CafeTable } from "@/types";

function err(msg: string, status = 500) {
  console.error("[tables]", msg);
  return NextResponse.json({ error: msg }, { status });
}

export async function GET() {
  try {
    return NextResponse.json(await readTables());
  } catch (e) { return err(String(e)); }
}

export async function PUT(req: NextRequest) {
  try {
    const tables: CafeTable[] = await req.json();
    return NextResponse.json(await writeTables(tables));
  } catch (e) { return err(String(e)); }
}