"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Order, OrderStatus } from "@/lib/types"; import Badge from "@/components/Badge"; import { inr, fmtDate } from "@/lib/format";
const STATUSES: OrderStatus[] = ["placed", "paid", "shipped", "delivered", "cancelled", "refunded"];
export default function OrdersPage() {
  const supabase = createClient(); const [orders, setOrders] = useState<Order[]>([]);
  async function load() { const { data } = await supabase.from("orders").select("*").order("placed_at", { ascending: false }); setOrders((data as Order[]) ?? []); }
  useEffect(() => { load(); }, []);
  async function move(id: string, status: OrderStatus) { await supabase.from("orders").update({ status }).eq("id", id); load(); }
  return (<div><h1 className="text-2xl font-bold">Orders</h1>
    <p className="mt-1 text-sm text-slate-500">Platform view: placed → paid → shipped → delivered. Cancelling or refunding an order excludes its items from payout-due (see commission.ts and the seller_payout_due view). Shipments and tracking live on the <a href="/shipments" className="text-blue-700 underline">Shipments</a> page.</p>
    <div className="mt-4 overflow-x-auto rounded-xl border bg-white"><table className="w-full text-sm">
      <thead><tr className="border-b text-left text-slate-500"><th className="px-4 py-2">Order</th><th className="px-4 py-2">Buyer</th><th className="px-4 py-2">Total</th><th className="px-4 py-2">Placed</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Change</th></tr></thead>
      <tbody>{orders.map((o) => (<tr key={o.id} className="border-b"><td className="px-4 py-2 font-mono text-xs">{o.order_number}</td><td className="px-4 py-2">{o.buyer_name}<span className="block text-xs text-slate-500">{o.buyer_email ?? ""}</span></td><td className="px-4 py-2">{inr(o.total_inr)}</td><td className="px-4 py-2">{fmtDate(o.placed_at)}</td>
        <td className="px-4 py-2"><Badge value={o.status} /></td>
        <td className="px-4 py-2"><select value={o.status} onChange={(e) => move(o.id, e.target.value as OrderStatus)} className="rounded border px-2 py-1 text-xs">{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></td></tr>))}
        {orders.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">No orders yet — run supabase/seed.sql.</td></tr>}</tbody></table></div></div>);
}
