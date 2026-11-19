"use client";
import { useState } from "react";

export default function Admin() {
  const [password,setPassword] = useState("");
  const [name,setName] = useState(""); const [category,setCategory] = useState("Bluzy");
  const [description,setDescription] = useState(""); const [price,setPrice] = useState("");
  const [images,setImages] = useState(""); const [sizes,setSizes] = useState("S, M, L, XL");
  const [colors,setColors] = useState(""); const [msg,setMsg] = useState("");
  async function add(e: React.FormEvent) {
    e.preventDefault(); setMsg("Zapisywanie...");
    const variants = sizes.split(",").map(s=>s.trim()).filter(Boolean).map(size=>({size,color:""}));
    const image_urls = images.split("\n").map(s=>s.trim()).filter(Boolean);
    const r = await fetch("/api/admin/products",{method:"POST",headers:{"Content-Type":"application/json","x-admin-password":password},body:JSON.stringify({name,category,description,price,image_urls,variants})});
    const d = await r.json(); setMsg(r.ok ? "Produkt dodany! ID: "+d.id : (d.error || "Wystąpił błąd."));
    if(r.ok){setName("");setDescription("");setPrice("");setImages("");}
  }
  return <main className="admin"><a href="/">← Wróć do sklepu</a><p className="eyebrow">MARS STORE / ADMIN</p><h1>PANEL ADMINISTRATORA</h1><p>Dodawaj produkty do swojej kolekcji.</p><form className="form adminForm" onSubmit={add}><label>Hasło administratora<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required /></label><label>Nazwa produktu<input value={name} onChange={e=>setName(e.target.value)} required /></label><label>Kategoria<select value={category} onChange={e=>setCategory(e.target.value)}>{["Bluzy","Koszulki","Spodnie","Kurtki","Buty","Akcesoria","Inne"].map(x=><option key={x}>{x}</option>)}</select></label><label>Opis<textarea value={description} onChange={e=>setDescription(e.target.value)} /></label><label>Cena (zł)<input type="number" min="0" step="0.01" value={price} onChange={e=>setPrice(e.target.value)} required /></label><label>Rozmiary (oddziel przecinkami)<input value={sizes} onChange={e=>setSizes(e.target.value)} placeholder="S, M, L, XL" /></label><label>Kolory (na razie informacyjnie)<input value={colors} onChange={e=>setColors(e.target.value)} placeholder="Czarny, biały" /></label><label>Linki do zdjęć (każdy w osobnej linii)<textarea value={images} onChange={e=>setImages(e.target.value)} placeholder="https://..." /></label><button className="cta full">DODAJ PRODUKT</button>{msg && <p>{msg}</p>}</form></main>;
}