"use client";

import { useEffect, useMemo, useState } from "react";

type Product = { id: string; name: string; category: string; description: string | null; price: number; image_urls: string[]; variants: { size: string | null; color: string | null }[] };
type CartLine = { product: Product; size: string; color: string; quantity: number };

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [checkout, setCheckout] = useState(false);
  const [delivery, setDelivery] = useState("courier");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { fetch("/api/products").then(r => r.json()).then(d => setProducts(d.products || [])).catch(() => setMessage("Nie udało się pobrać produktów.")); }, []);
  const total = useMemo(() => cart.reduce((s, x) => s + Number(x.product.price) * x.quantity, 0), [cart]);

  function addToCart() {
    if (!selected) return;
    if (selected.variants.length && !size) { setMessage("Wybierz rozmiar."); return; }
    setCart(c => [...c, { product: selected, size, color, quantity: 1 }]);
    setSelected(null); setSize(""); setColor(""); setMessage("Dodano produkt do koszyka.");
  }

  async function submitOrder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setMessage("");
    const f = new FormData(e.currentTarget);
    const body = {
      first_name: f.get("first_name"), last_name: f.get("last_name"), email: f.get("email"), phone: f.get("phone"),
      delivery_method: delivery, street: f.get("street"), building_number: f.get("building_number"),
      apartment_number: f.get("apartment_number"), postal_code: f.get("postal_code"), city: f.get("city"),
      paczkomat_code: f.get("paczkomat_code"), paczkomat_address: f.get("paczkomat_address"),
      items: cart.map(x => ({ product_id: x.product.id, product_name: x.product.name, size: x.size, color: x.color, quantity: x.quantity, unit_price: x.product.price })),
      total
    };
    try {
      const r = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Nie udało się złożyć zamówienia.");
      setCart([]); setCheckout(false); setMessage("Dziękujemy! Zamówienie zostało przyjęte. Numer: " + d.order_id);
    } catch (err) { setMessage(err instanceof Error ? err.message : "Wystąpił błąd."); }
    finally { setBusy(false); }
  }

  return <main>
    <header className="top"><a className="brand" href="/">MARS<span>STORE</span></a><nav><a href="#produkty">Kolekcja</a><button className="cartButton" onClick={() => setCheckout(true)}>Koszyk ({cart.length})</button><a className="adminLink" href="/admin">Panel</a></nav></header>
    <section className="hero"><p className="eyebrow">STREETWEAR • POLSKA</p><h1>TWÓJ STYL.<br/><em>TWOJE ZASADY.</em></h1><p>Odkryj kolekcję MARS STORE.</p><a className="cta" href="#produkty">ODKRYJ PRODUKTY ↓</a></section>
    <section id="produkty" className="section"><div className="sectionHead"><div><p className="eyebrow">WYBIERZ SWÓJ LOOK</p><h2>KOLEKCJA</h2></div><span>{products.length} produktów</span></div>
      {products.length === 0 ? <div className="empty">Kolekcja w przygotowaniu.<br/>Wkrótce pojawią się tutaj nasze produkty.</div> :
      <div className="grid">{products.map(p => <article className="product" key={p.id}><button className="productImage" onClick={() => {setSelected(p);setSize("");setColor("");}}>{p.image_urls?.[0] ? <img src={p.image_urls[0]} alt={p.name}/> : <span>MARS STORE</span>}</button><div className="productInfo"><small>{p.category}</small><h3>{p.name}</h3><strong>{Number(p.price).toFixed(2).replace(".", ",")} zł</strong><button className="add" onClick={() => {setSelected(p);setSize("");setColor("");}}>WYBIERZ</button></div></article>)}</div>}
    </section>
    {selected && <div className="overlay"><div className="modal"><button className="close" onClick={() => setSelected(null)}>×</button><h2>{selected.name}</h2><p>{selected.description}</p><strong>{Number(selected.price).toFixed(2)} zł</strong>{selected.variants.length > 0 && <><label>Rozmiar<select value={size} onChange={e=>setSize(e.target.value)}><option value="">Wybierz rozmiar</option>{Array.from(new Set(selected.variants.map(v=>v.size).filter(Boolean))).map(v=><option key={v}>{v}</option>)}</select></label><label>Kolor<select value={color} onChange={e=>setColor(e.target.value)}><option value="">Wybierz kolor</option>{Array.from(new Set(selected.variants.map(v=>v.color).filter(Boolean))).map(v=><option key={v}>{v}</option>)}</select></label></>}<button className="cta full" onClick={addToCart}>DODAJ DO KOSZYKA</button></div></div>}
    {checkout && <div className="overlay"><div className="modal wide"><button className="close" onClick={()=>setCheckout(false)}>×</button><h2>TWÓJ KOSZYK</h2>{cart.length===0 ? <p>Koszyk jest pusty.</p> : <><div className="cartLines">{cart.map((x,i)=><div key={i}>{x.product.name} · {x.size} {x.color} — {x.product.price} zł <button onClick={()=>setCart(c=>c.filter((_,j)=>i!==j))}>Usuń</button></div>)}</div><h3>Razem: {total.toFixed(2)} zł</h3><h3>DANE DO DOSTAWY</h3><form onSubmit={submitOrder} className="form"><div className="two"><input name="first_name" placeholder="Imię" required/><input name="last_name" placeholder="Nazwisko" required/></div><input name="phone" placeholder="Numer telefonu" required/><input name="email" type="email" placeholder="Adres e-mail" required/><label>Sposób dostawy<select value={delivery} onChange={e=>setDelivery(e.target.value)}><option value="courier">Kurier na adres</option><option value="inpost">Paczkomat InPost</option></select></label>{delivery==="courier" ? <><input name="street" placeholder="Ulica" required/><div className="two"><input name="building_number" placeholder="Numer domu" required/><input name="apartment_number" placeholder="Numer mieszkania (opcjonalnie)"/></div><div className="two"><input name="postal_code" placeholder="Kod pocztowy" required/><input name="city" placeholder="Miasto" required/></div></> : <><input name="paczkomat_code" placeholder="Kod Paczkomatu, np. WAW..." required/><input name="paczkomat_address" placeholder="Adres Paczkomatu (opcjonalnie)"/></>}<button className="cta full" disabled={busy}>{busy ? "WYSYŁANIE..." : "ZŁÓŻ ZAMÓWIENIE"}</button></form></>}</div></div>}
    {message && <div className="toast" onClick={()=>setMessage("")}>{message} ×</div>}
    <footer>MARS STORE © {new Date().getFullYear()} · TWÓJ STYL. TWOJE ZASADY.</footer>
  </main>;
}