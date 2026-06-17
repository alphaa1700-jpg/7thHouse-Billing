import { NextRequest, NextResponse } from "next/server";
import { readStaff, writeStaff } from "@/lib/db";
import type { StaffEntry } from "@/lib/db";

function err(msg: string, status = 500) {
  console.error("[staff]", msg);
  return NextResponse.json({ error: msg }, { status });
}

export async function GET() {
  try {
    return NextResponse.json(await readStaff());
  } catch (e) { return err(String(e)); }
}

export async function PUT(req: NextRequest) {
  try {
    const staff: StaffEntry[] = await req.json();
    return NextResponse.json(await writeStaff(staff));
  } catch (e) { return err(String(e)); }
}

export async function POST(req: NextRequest) {
  try {
    const member: StaffEntry = await req.json();
    const current = await readStaff();
    return NextResponse.json(await writeStaff([...current, member]), { status: 201 });
  } catch (e) { return err(String(e)); }
}