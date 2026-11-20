
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

async function sendMessage(chatId: number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) throw new Error("Brakuje TELEGRAM_BOT_TOKEN.");

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text
    })
  });
}

export async function POST(req: Request) {
  try {
    const update = await req.json();
    const message = update.message;

    if (!message?.text || !message?.chat?.id) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id;
    const userId = String(message.from?.id || "");
    const adminId = process.env.TELEGRAM_ADMIN_ID;

    if (!adminId || userId !== adminId) {
      await sendMessage(chatId, "Brak dostępu.");
      return NextResponse.json({ ok: true });
    }

    const command = message.text.trim().split(" ")[0].toLowerCase();

    if (command === "/start") {
      await sendMessage(
        chatId,
        "Witaj w panelu MARS STORE!\\n\\nDostępne polecenia:\\n/id — sprawdź swoje ID\\n/products — lista produktów\\n/orders — lista zamówień"
      );
    } else if (command === "/id") {
      await sendMessage(chatId, `Twoje Telegram ID: ${userId}`);
    } else if (command === "/products") {
      const db = supabaseAdmin();
      const { data, error } = await db
        .from("products")
        .select("id,name,price,is_active")
        .order("created_at", { ascending: false })
        .limit(30);

      if (error) throw error;

      const list = (data || []).map(
        (p) => `${p.is_active ? "✅" : "❌"} ${p.name} — ${p.price} zł (ID: ${p.id})`
      );

      await sendMessage(
        chatId,
        list.length ? list.join("\\n") : "Nie ma jeszcze produktów."
      );
    } else if (command === "/orders") {
      const db = supabaseAdmin();
      const { data, error } = await db
        .from("orders")
        .select("id,first_name,last_name,phone,total,status,delivery_method")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      const list = (data || []).map(
        (o) =>
          `Zamówienie #${o.id}\\n${o.first_name} ${o.last_name}\\nTel: ${o.phone}\\nKwota: ${o.total} zł\\nStatus: ${o.status}\\nDostawa: ${o.delivery_method}`
      );

      await sendMessage(
        chatId,
        list.length ? list.join("\\n\\n") : "Nie ma jeszcze zamówień."
      );
    } else {
      await sendMessage(chatId, "Nie znam tego polecenia. Wyślij /start.");
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
