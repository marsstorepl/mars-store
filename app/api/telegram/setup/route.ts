
import { NextResponse } from "next/server";

export async function GET() {
  return new NextResponse(`<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>MARS STORE Setup</title>
</head>
<body style="background:#111;color:white;font-family:Arial;padding:30px">
<h2>MARS STORE — Telegram Setup</h2>
<form method="POST">
<label>Wpisz TELEGRAM_WEBHOOK_SECRET:</label><br><br>
<input name="secret" type="password" required
style="padding:12px;width:100%;max-width:350px">
<br><br>
<button style="padding:12px 25px">POŁĄCZ BOTA</button>
</form>
</body>
</html>`, {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const entered = String(form.get("secret") || "");
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
    const token = process.env.TELEGRAM_BOT_TOKEN;

    if (!secret || entered !== secret) {
      return new NextResponse("Nieprawidłowe hasło.", { status: 401 });
    }

    if (!token) {
      return new NextResponse("Brakuje tokena bota.", { status: 500 });
    }

    const domain =
      process.env.VERCEL_PROJECT_PRODUCTION_URL ||
      process.env.VERCEL_URL;

    if (!domain) {
      return new NextResponse("Nie znaleziono adresu Vercel.", {
        status: 500
      });
    }

    const response = await fetch(
      `https://api.telegram.org/bot${token}/setWebhook`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: `https://${domain}/api/telegram/webhook`,
          secret_token: secret
        })
      }
    );

    const result = await response.json();

    return new NextResponse(
      result.ok
        ? "SUKCES! Telegram został połączony z MARS STORE. Możesz zamknąć tę stronę."
        : "Błąd Telegrama: " + JSON.stringify(result),
      { status: result.ok ? 200 : 500 }
    );
  } catch {
    return new NextResponse("Wystąpił błąd konfiguracji.", {
      status: 500
    });
  }
}
