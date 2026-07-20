import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { phone, customerName, total, items, tableNumber, orderId } = await req.json();

  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken  = process.env.TWILIO_AUTH_TOKEN?.trim();
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM?.trim();

  console.log("=== NOTIFY DEBUG ===");
  console.log("SID:", accountSid);
  console.log("TOKEN length:", authToken?.length);
  console.log("FROM:", fromNumber);
  console.log("TO phone:", phone);
  console.log("====================");

  if (!accountSid || !authToken || !fromNumber) {
    return NextResponse.json({ error: "Twilio credentials not configured" }, { status: 500 });
  }

  // Clean phone — ensure it's in E.164 format with whatsapp: prefix
  const rawPhone = String(phone).replace(/\D/g, "");
  const e164 = rawPhone.startsWith("91") ? `+${rawPhone}` : `+91${rawPhone}`;
  const toNumber = `whatsapp:${e164}`;

  const message =
    `☕ *7th House Coffee*\n\n` +
    `Hi ${customerName}! 👋\n\n` +
    `Here's your bill summary:\n` +
    `🪑 Table ${tableNumber} | Order ${orderId}\n\n` +
    `🛒 *Items:*\n` +
    `${items}\n\n` +
    `💰 *Total: ₹${total}*\n` +
    `(Incl. 5% GST)\n\n` +
    `Thank you for visiting us! 🙏\n` +
    `We hope to see you again soon. ☕✨`;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  const body = new URLSearchParams({
    From: fromNumber,
    To:   toNumber,
    Body: message,
  });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Twilio error:", data);
      return NextResponse.json({ error: data.message ?? "Failed to send" }, { status: 502 });
    }

    return NextResponse.json({ success: true, sid: data.sid });
  } catch (err) {
    console.error("Notify route error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}