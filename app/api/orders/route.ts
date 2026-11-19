
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const required = ["first_name", "last_name", "email", "phone"];

    if (required.some(k => typeof b[k] !== "string" || !b[k].trim())) {
      return NextResponse.json({ error: "Uzupełnij wszystkie dane kontaktowe." }, { status: 400 });
    }

    if (!Array.isArray(b.items) || b.items.length === 0) {
      return NextResponse.json({ error: "Koszyk jest pusty." }, { status: 400 });
    }

    if (!["courier", "inpost"].includes(b.delivery_method)) {
      return NextResponse.json({ error: "Nieprawidłowa metoda dostawy." }, { status: 400 });
    }

    if (b.delivery_method === "courier" && ["street", "building_number", "postal_code", "city"].some(k => typeof b[k] !== "string" || !b[k].trim())) {
      return NextResponse.json({ error: "Uzupełnij adres dostawy." }, { status: 400 });
    }

    if (b.delivery_method === "inpost" && (typeof b.paczkomat_code !== "string" || !b.paczkomat_code.trim())) {
      return NextResponse.json({ error: "Wpisz kod Paczkomatu." }, { status: 400 });
    }

    const db = supabaseAdmin();
    const productIds = b.items.map((x: any) => x.product_id);

    const { data: products, error: pErr } = await db
      .from("products")
      .select("id,name,price,is_active")
      .in("id", productIds)
      .eq("is_active", true);

    if (pErr || !products || products.length !== new Set(productIds).size) {
      return NextResponse.json({ error: "Jeden z produktów nie jest już dostępny." }, { status: 400 });
    }

    let total = 0;

    const items = b.items.map((x: any) => {
      const p = products.find((p: any) => p.id === x.product_id);

      if (!p) {
        throw new Error("Nie znaleziono produktu.");
      }

      const qty = Math.max(1, Math.min(20, Number(x.quantity) || 1));
      total += Number(p.price) * qty;

      return {
        product_id: p.id,
        product_name: p.name,
        size: String(x.size || ""),
        color: String(x.color || ""),
        quantity: qty,
        unit_price: p.price
      };
    });

    const { data: order, error: oErr } = await db.from("orders").insert({
      first_name: b.first_name.trim(),
      last_name: b.last_name.trim(),
      email: b.email.trim(),
      phone: b.phone.trim(),
      delivery_method: b.delivery_method,
      street: b.delivery_method === "courier" ? b.street : null,
      building_number: b.delivery_method === "courier" ? b.building_number : null,
      apartment_number: b.delivery_method === "courier" ? b.apartment_number || null : null,
      postal_code: b.delivery_method === "courier" ? b.postal_code : null,
      city: b.delivery_method === "courier" ? b.city : null,
      paczkomat_code: b.delivery_method === "inpost" ? b.paczkomat_code : null,
      paczkomat_address: b.delivery_method === "inpost" ? b.paczkomat_address || null : null,
      total,
      status: "new"
    }).select("id").single();

    if (oErr || !order) {
      throw oErr || new Error("Nie udało się zapisać zamówienia.");
    }

    const { error: iErr } = await db.from("order_items").insert(
      items.map((x: any) => ({ ...x, order_id: order.id }))
    );

    if (iErr) {
      throw iErr;
    }

    return NextResponse.json({ ok: true, order_id: order.id });

  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Błąd składania zamówienia." },
      { status: 500 }
    );
  }
}

   
