
import { NextRequest, NextResponse } from "next/server";
import { readOrders, writeOrders } from "@/lib/db";
import type { Order } from "@/types";

function err(msg: string, status = 500) {
  console.error("[orders]", msg);
  return NextResponse.json({ error: msg }, { status });
}

export async function GET() {
  try {
    return NextResponse.json(await readOrders());
  } catch (e) { return err(String(e)); }
}

export async function POST(req: NextRequest) {
  try {
    const order: Order = await req.json();
    // Append directly to the sheet — no need to read all orders first.
    // The client maintains its own state; the server just persists.
    const current = await readOrders();
    const updated = await writeOrders([order, ...current]);
    return NextResponse.json(updated, { status: 201 });
  } catch (e) { return err(String(e)); }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const current = await readOrders();
    const updated = await writeOrders(
      current.map(o => {
        if (o.id !== body.id) return o;
        // Merge any provided fields: status, items, amount
        return {
          ...o,
          ...(body.status !== undefined && { status: body.status }),
          ...(body.items  !== undefined && { items:  body.items  }),
          ...(body.amount !== undefined && { amount: body.amount }),
        };
      })
    );
    return NextResponse.json(updated);
  } catch (e) { return err(String(e)); }
}

export async function DELETE(req: NextRequest) {
  try {
    const { ids }: { ids: string[] } = await req.json();
    const current = await readOrders();
    const updated = await writeOrders(current.filter(o => !ids.includes(o.id)));
    return NextResponse.json(updated);
  } catch (e) { return err(String(e)); }
}