import { NextRequest, NextResponse } from "next/server";
import { readCustomers, writeCustomers } from "@/lib/db";
import type { Customer } from "@/types";

function err(msg: string, status = 500) {
  console.error("[customers]", msg);
  return NextResponse.json({ error: msg }, { status });
}

export async function GET() {
  try {
    return NextResponse.json(await readCustomers());
  } catch (e) { return err(String(e)); }
}

export async function PUT(req: NextRequest) {
  try {
    const customers: Customer[] = await req.json();
    return NextResponse.json(await writeCustomers(customers));
  } catch (e) { return err(String(e)); }
}