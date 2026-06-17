
import { NextRequest, NextResponse } from "next/server";
import { readDB, writeDB } from "@/lib/db";
import type { DB } from "@/lib/db";

export async function GET() {
  return NextResponse.json(await readDB());
}

export async function POST(req: NextRequest) {
  const body: Partial<DB> = await req.json();
  const current = await readDB();
  const updated = await writeDB({ ...current, ...body });
  return NextResponse.json(updated);
}