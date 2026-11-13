"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Listing } from "@/lib/types"; import Badge from "@/components/Badge"; import { inr } from "@/lib/format";
export default function ListingsPage() {
  const supabase = createClient();
  const [listings, setListings] = useState<(Listing & { sellers?: { shop_name: string } })[]>([]);
  const [q, setQ] = useState(""); const [cat, setCat] = useState("all");
  async function load() { const { data } = await supabase.from("listings").select("*,sellers(shop_name)").order("created_at", { ascending: false }); setListings((data as never[]) ?? []); }
  useEffect(() => { load(); }, []);
  const cats = ["all", ...Array.from(new Set(listings.map((l) => l.category).filter(Boolean) as string[]))];
  const shown = listings.filter((l) => (cat === "all" || l.category === cat) && l.title.toLowerCase().includes(q.toLowerCase()));
  return (<div><h1 className="text-2xl font-bold">Browse listings</h1>
    <div className="mt-4 flex gap-2">
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search listings…" className="flex-1 rounded border bg-white px-3 py-2 text-sm" />
      <select value={cat} onChange={(e) => setCat(e.target.value)} className="rounded border bg-white px-3 py-2 text-sm">{cats.map((c) => <option key={c} value={c}>{c}</option>)}</select>
    </div>
    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{shown.map((l) => (
      <article key={l.id} className="rounded-xl border bg-white p-4">
        <div className="flex items-start justify-between"><h2 className="font-semibold">{l.title}</h2><Badge value={l.status} /></div>
        <p className="mt-1 text-xs text-slate-500">{l.sellers?.shop_name ?? "—"} · {l.category ?? "General"}</p>
        <p className="mt-1 text-sm text-slate-600">{l.description ?? ""}</p>
        <p className="mt-3 text-lg font-bold">{inr(l.price_inr)} <span className="text-xs font-normal text-slate-500">· {l.stock_qty} in stock</span></p>
        <p className="mt-2 text-xs text-slate-400">Checkout is not connected in this sample — see README.</p>
      </article>))}
      {shown.length === 0 && <p className="rounded-xl border bg-white p-4 text-sm text-slate-500">No listings match.</p>}</div></div>);
}
