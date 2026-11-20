
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

    const domain =
      process.env.VERCEL_PROJECT_PRODUCTION_URL ||
      process.env.VERCEL_URL;

    if (!token || !secret || !domain) {
      return new NextResponse(
        "Blad: brakuje zmiennych w Vercel.",
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://api.telegram.org/bot${token}/setWebhook`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          url: `https://${domain}/api/telegram/webhook`,
          secret_token: secret
        })
      }
    );

    const result = await response.json();

    if (result.ok) {
      return new NextResponse(
        "SUKCES! Bot MARS STORE zostal polaczony z Telegramem."
      );
    }

    return new NextResponse(
      "Blad Telegrama: " + JSON.stringify(result),
      { status: 500 }
    );
  } catch {
    return new NextResponse(
      "Wystapil blad konfiguracji.",
      { status: 500 }
    );
  }
}

