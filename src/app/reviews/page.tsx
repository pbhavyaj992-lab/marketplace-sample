"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Review, Listing, Order } from "@/lib/types"; import { fmtDate } from "@/lib/format";

type ReviewRow = Review & { listings?: { title: string } | null; orders?: { order_number: string } | null };
const stars = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);

export default function ReviewsPage() {
  const supabase = createClient();
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [listingId, setListingId] = useState(""); const [orderId, setOrderId] = useState("");
  const [reviewer, setReviewer] = useState(""); const [rating, setRating] = useState("5");
  const [title, setTitle] = useState(""); const [body, setBody] = useState("");
  const [filterListing, setFilterListing] = useState("all"); const [msg, setMsg] = useState("");
  async function load() {
    const { data } = await supabase.from("reviews").select("*,listings(title),orders(order_number)").order("created_at", { ascending: false });
    setReviews((data as ReviewRow[]) ?? []);
    const [l, o] = await Promise.all([
      supabase.from("listings").select("*").order("created_at", { ascending: false }),
      supabase.from("orders").select("*").order("placed_at", { ascending: false }),
    ]);
    setListings((l.data as Listing[]) ?? []); setOrders((o.data as Order[]) ?? []);
  }
  useEffect(() => { load(); }, []);
  const shown = filterListing === "all" ? reviews : reviews.filter((r) => r.listing_id === filterListing);
  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "—";
  const perListing = new Map<string, { n: number; sum: number }>();
  reviews.forEach((r) => { const cur = perListing.get(r.listing_id) ?? { n: 0, sum: 0 }; cur.n += 1; cur.sum += r.rating; perListing.set(r.listing_id, cur); });
  async function addReview(e: React.FormEvent) {
    e.preventDefault(); setMsg("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMsg("Sign in first — reviews are scoped to your tenant."); return; }
    const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single();
    const tenant_id = (profile as { tenant_id: string } | null)?.tenant_id;
    if (!tenant_id) { setMsg("No tenant on your profile yet."); return; }
    const listing = listings.find((l) => l.id === listingId);
    if (!listing) { setMsg("Pick a listing to review."); return; }
    // seller_id is denormalised on the review so seller-scoped RLS and
    // per-seller averages work without joining listings every time.
    const { error } = await supabase.from("reviews").insert({ tenant_id, listing_id: listingId, order_id: orderId || null, seller_id: listing.seller_id, reviewer_name: reviewer.trim(), rating: Number(rating), title: title || null, body: body || null });
    if (error) setMsg(error.message);
    else { setListingId(""); setOrderId(""); setReviewer(""); setRating("5"); setTitle(""); setBody(""); load(); }
  }
  return (<div><h1 className="text-2xl font-bold">Reviews &amp; ratings</h1>
    <p className="mt-1 text-sm text-slate-500">Average rating across all reviews: <strong>{avg} / 5</strong> ({reviews.length} reviews). One order may review a given listing only once — the database enforces it.</p>
    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {listings.filter((l) => perListing.has(l.id)).map((l) => { const p = perListing.get(l.id)!; return (
        <div key={l.id} className="rounded-xl border bg-white p-4 text-sm"><p className="font-semibold">{l.title}</p>
        <p className="mt-1"><span className="text-amber-500">{stars(Math.round(p.sum / p.n))}</span> {(p.sum / p.n).toFixed(1)} / 5 · {p.n} review{p.n === 1 ? "" : "s"}</p></div>); })}
    </div>
    <form onSubmit={addReview} className="mt-4 grid gap-2 rounded-xl border bg-white p-4 sm:grid-cols-3">
      <select required value={listingId} onChange={(e) => setListingId(e.target.value)} className="rounded border px-3 py-2 text-sm">
        <option value="">Review listing…</option>
        {listings.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
      </select>
      <select value={orderId} onChange={(e) => setOrderId(e.target.value)} className="rounded border px-3 py-2 text-sm">
        <option value="">Linked order (optional)</option>
        {orders.filter((o) => o.status !== "cancelled").map((o) => <option key={o.id} value={o.id}>{o.order_number} · {o.buyer_name}</option>)}
      </select>
      <input required value={reviewer} onChange={(e) => setReviewer(e.target.value)} placeholder="Reviewer name" className="rounded border px-3 py-2 text-sm" />
      <select value={rating} onChange={(e) => setRating(e.target.value)} className="rounded border px-3 py-2 text-sm" aria-label="Rating">
        {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n === 1 ? "" : "s"} {stars(n)}</option>)}
      </select>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Review title" className="rounded border px-3 py-2 text-sm" />
      <input value={body} onChange={(e) => setBody(e.target.value)} placeholder="What was good / what was not?" className="rounded border px-3 py-2 text-sm" />
      <button className="rounded bg-slate-900 px-3 py-2 text-sm text-white sm:col-span-3">Add review</button></form>
    {msg && <p className="mt-2 text-sm text-rose-600">{msg}</p>}
    <div className="mt-4 flex gap-2">
      <select value={filterListing} onChange={(e) => setFilterListing(e.target.value)} className="rounded border bg-white px-3 py-2 text-sm">
        <option value="all">All listings</option>
        {listings.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
      </select>
    </div>
    <ul className="mt-4 space-y-2">{shown.map((r) => (
      <li key={r.id} className="rounded-xl border bg-white p-4 text-sm">
        <p className="flex items-center justify-between"><span className="font-semibold">{r.title ?? "Review"} · {r.listings?.title ?? "—"}</span><span className="text-amber-500">{stars(r.rating)}</span></p>
        <p className="mt-1 text-slate-600">{r.body ?? ""}</p>
        <p className="mt-1 text-xs text-slate-500">{r.reviewer_name} · {fmtDate(r.created_at)}{r.orders ? ` · order ${r.orders.order_number}` : " · no linked order"}</p></li>))}
      {shown.length === 0 && <li className="rounded-xl border bg-white p-4 text-sm text-slate-500">No reviews in this view yet — run supabase/seed.sql, or add one above.</li>}</ul>
  </div>);
}
