
import { NextRequest, NextResponse } from "next/server";
import { readDB, writeDB } from "@/lib/db";
import type { DB } from "@/lib/db";

export async function GET() {
  try {
    return NextResponse.json(await readDB());
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to load snapshot from backend",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 503 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: Partial<DB> = await req.json();
    const current = await readDB();
    const updated = await writeDB({ ...current, ...body });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to save snapshot",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 503 }
    );
  }
}