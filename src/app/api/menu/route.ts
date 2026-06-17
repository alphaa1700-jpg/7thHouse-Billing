import { NextRequest, NextResponse } from "next/server";
import { readMenu, writeMenu } from "@/lib/db";
import type { MenuItem } from "@/types";

function err(msg: string, status = 500) {
  console.error("[menu]", msg);
  return NextResponse.json({ error: msg }, { status });
}

export async function GET() {
  try {
    return NextResponse.json(await readMenu());
  } catch (e) { return err(String(e)); }
}

export async function PUT(req: NextRequest) {
  try {
    const items: MenuItem[] = await req.json();
    return NextResponse.json(await writeMenu(items));
  } catch (e) { return err(String(e)); }
}