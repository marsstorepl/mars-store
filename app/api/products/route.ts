import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const db = supabaseAdmin();
    const { data, error } = await db.from("products").select("id,name,category,description,price,image_urls,product_variants(size,color)").eq("is_active", true).order("created_at", { ascending: false });
    if (error) throw error;
    const products = (data || []).map((p: any) => ({ ...p, variants: p.product_variants || [] }));
    return NextResponse.json({ products });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Błąd pobierania produktów." }, { status: 500 });
  }
}