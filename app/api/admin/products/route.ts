import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function authorized(req: Request) {
  const expected = process.env.MARS_ADMIN_PASSWORD;
  return !!expected && req.headers.get("x-admin-password") === expected;
}

export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Brak dostępu." }, { status: 401 });
  try {
    const b = await req.json();
    if (!b.name || !b.category || !Number.isFinite(Number(b.price)) || Number(b.price) < 0) return NextResponse.json({ error: "Podaj nazwę, kategorię i prawidłową cenę." }, { status: 400 });
    const db = supabaseAdmin();
    const { data, error } = await db.from("products").insert({ name: b.name, category: b.category, description: b.description || "", price: Number(b.price), image_urls: Array.isArray(b.image_urls) ? b.image_urls : [], is_active: true }).select("id").single();
    if (error) throw error;
    if (Array.isArray(b.variants) && b.variants.length) {
      const { error: vErr } = await db.from("product_variants").insert(b.variants.map((v: any) => ({ product_id: data.id, size: v.size || null, color: v.color || null })));
      if (vErr) throw vErr;
    }
    return NextResponse.json({ ok: true, id: data.id });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Nie udało się dodać produktu." }, { status: 500 });
  }
}