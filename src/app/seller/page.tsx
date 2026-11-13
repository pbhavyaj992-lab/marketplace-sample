import { createClient } from "@/lib/supabase/server";
import StatCard from "@/components/StatCard"; import Badge from "@/components/Badge"; import { inr } from "@/lib/format";
export const dynamic = "force-dynamic";
// Seller dashboard: in this sample it shows the first active seller's
// numbers. Per-seller scoping (profiles.seller_id + RLS) is the next
// step — see README "Not yet implemented".
export default async function SellerPage() {
  const supabase = createClient();
  const { data: sellers } = await supabase.from("sellers").select("id,shop_name,commission_rate,status").eq("status", "active").order("created_at");
  const seller = (sellers ?? [])[0];
  if (!seller) return <div><h1 className="text-2xl font-bold">Seller dashboard</h1><p className="mt-2 text-sm text-slate-500">No active sellers yet — run supabase/seed.sql.</p></div>;
  const { data: listings } = await supabase.from("listings").select("id,title,price_inr,stock_qty,status").eq("seller_id", seller.id);
  const { data: items } = await supabase.from("order_items").select("qty,unit_price_inr,commission_inr,order_id").eq("seller_id", seller.id);
  const { data: orders } = await supabase.from("orders").select("id,status").in("id", (items ?? []).map((i) => i.order_id));
  const deliveredIds = new Set((orders ?? []).filter((o) => o.status === "delivered").map((o) => o.id));
  const gross = (items ?? []).reduce((s, i) => s + i.qty * i.unit_price_inr, 0);
  const commission = (items ?? []).reduce((s, i) => s + i.commission_inr, 0);
  const due = (items ?? []).filter((i) => deliveredIds.has(i.order_id)).reduce((s, i) => s + (i.qty * i.unit_price_inr - i.commission_inr), 0);
  return (<div><h1 className="text-2xl font-bold">Seller dashboard</h1>
    <p className="mt-1 text-sm text-slate-500">Showing <strong>{seller.shop_name}</strong> (first active demo seller) · commission {(seller.commission_rate * 100).toFixed(0)}% · payout is due only on delivered orders.</p>
    <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard label="Listings" value={String((listings ?? []).length)} />
      <StatCard label="Gross sales (all orders)" value={inr(gross)} sub="Before commission" />
      <StatCard label="Platform commission" value={inr(commission)} sub="10% default, per seller" />
      <StatCard label="Payout due" value={inr(due)} sub="Delivered orders only" />
    </div>
    <h2 className="mt-6 font-semibold">Your listings</h2>
    <div className="mt-2 overflow-x-auto rounded-xl border bg-white"><table className="w-full text-sm">
      <thead><tr className="border-b text-left text-slate-500"><th className="px-4 py-2">Title</th><th className="px-4 py-2">Price</th><th className="px-4 py-2">Stock</th><th className="px-4 py-2">Status</th></tr></thead>
      <tbody>{(listings ?? []).map((l) => (<tr key={l.id} className="border-b"><td className="px-4 py-2 font-medium">{l.title}</td><td className="px-4 py-2">{inr(l.price_inr)}</td><td className="px-4 py-2">{l.stock_qty}</td><td className="px-4 py-2"><Badge value={l.status} /></td></tr>))}
      {(listings ?? []).length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-500">No listings for this seller.</td></tr>}</tbody></table></div>
    <p className="mt-3 text-xs text-slate-500">Seller onboarding and per-seller login (profiles.seller_id) are not yet built — see README.</p></div>);
}
