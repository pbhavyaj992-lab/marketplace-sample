import { createClient } from "@/lib/supabase/server";
import StatCard from "@/components/StatCard"; import Badge from "@/components/Badge"; import { inr } from "@/lib/format";
export const dynamic = "force-dynamic";
export default async function Storefront() {
  const supabase = createClient();
  const { data: listings } = await supabase.from("listings").select("id,title,price_inr,stock_qty,category,status").eq("status", "active").order("created_at", { ascending: false }).limit(12);
  const { data: sellers } = await supabase.from("sellers").select("id,shop_name,status");
  const { data: orders } = await supabase.from("orders").select("id,total_inr,status").neq("status", "cancelled");
  const { data: reviews } = await supabase.from("reviews").select("listing_id,rating");
  const { data: shipments } = await supabase.from("shipments").select("id,status");
  const gmv = (orders ?? []).reduce((s, o) => s + o.total_inr, 0);
  const avgRating = (reviews ?? []).length ? ((reviews ?? []).reduce((s, r) => s + r.rating, 0) / (reviews ?? []).length).toFixed(1) : "—";
  const inTransit = (shipments ?? []).filter((s) => ["picked_up", "in_transit", "out_for_delivery"].includes(s.status)).length;
  const ratingByListing = new Map<string, { n: number; sum: number }>();
  (reviews ?? []).forEach((r) => { const cur = ratingByListing.get(r.listing_id) ?? { n: 0, sum: 0 }; cur.n += 1; cur.sum += r.rating; ratingByListing.set(r.listing_id, cur); });
  return (<div><h1 className="text-2xl font-bold">Demo Bazaar — storefront</h1>
    <p className="mt-1 text-sm text-slate-500">Fictional sellers and listings. No real products, no real payments — checkout is not connected.</p>
    <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
      <StatCard label="Active sellers" value={String((sellers ?? []).filter((s) => s.status === "active").length)} />
      <StatCard label="Active listings" value={String((listings ?? []).length)} sub="Showing up to 12" />
      <StatCard label="Orders (not cancelled)" value={String((orders ?? []).length)} />
      <StatCard label="Gross merchandise value" value={inr(gmv)} sub="Demo orders only" />
      <StatCard label="Average rating" value={`${avgRating} / 5`} sub={`${(reviews ?? []).length} demo reviews`} />
      <StatCard label="Shipments on the way" value={String(inTransit)} sub="Picked up, in transit or out for delivery" />
    </div>
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {(listings ?? []).map((l) => {
        const r = ratingByListing.get(l.id);
        return (
        <article key={l.id} className="rounded-xl border bg-white p-4">
          <div className="flex items-start justify-between"><h2 className="font-semibold">{l.title}</h2><Badge value={l.status} /></div>
          <p className="mt-1 text-xs text-slate-500">{l.category ?? "General"} · {l.stock_qty} in stock{r ? ` · ★ ${(r.sum / r.n).toFixed(1)} (${r.n})` : ""}</p>
          <p className="mt-3 text-lg font-bold">{inr(l.price_inr)}</p>
          <a href="/listings" className="mt-2 inline-block text-sm text-blue-700 underline">View in listings →</a>
        </article>);})}
      {(listings ?? []).length === 0 && <p className="rounded-xl border bg-white p-4 text-sm text-slate-500">No active listings yet — run supabase/seed.sql.</p>}
    </div></div>);
}
