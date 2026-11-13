"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Shipment, ShipmentStatus, Order } from "@/lib/types"; import Badge from "@/components/Badge"; import { fmtDate } from "@/lib/format";
const STATUSES: ShipmentStatus[] = ["label_created", "picked_up", "in_transit", "out_for_delivery", "delivered", "failed", "returned"];
const CARRIERS = ["Delhivery", "Blue Dart", "DTDC", "India Post", "Other"];
type ShipmentRow = Shipment & { orders?: { order_number: string; buyer_name: string; status: string } | null };
export default function ShipmentsPage() {
  const supabase = createClient();
  const [rows, setRows] = useState<ShipmentRow[]>([]); const [orders, setOrders] = useState<Order[]>([]);
  const [orderId, setOrderId] = useState(""); const [carrier, setCarrier] = useState(CARRIERS[0]);
  const [tracking, setTracking] = useState(""); const [notes, setNotes] = useState(""); const [msg, setMsg] = useState("");
  async function load() {
    const { data } = await supabase.from("shipments").select("*,orders(order_number,buyer_name,status)").order("created_at", { ascending: false });
    setRows((data as ShipmentRow[]) ?? []);
    const { data: o } = await supabase.from("orders").select("*").order("placed_at", { ascending: false });
    setOrders((o as Order[]) ?? []);
  }
  useEffect(() => { load(); }, []);
  // One shipment per order (unique order_id): orders already shipped are excluded.
  const shippedOrderIds = new Set(rows.map((r) => r.order_id));
  const unshipped = orders.filter((o) => o.status !== "cancelled" && o.status !== "refunded" && !shippedOrderIds.has(o.id));
  async function addShipment(e: React.FormEvent) {
    e.preventDefault(); setMsg("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMsg("Sign in first — shipments are scoped to your tenant."); return; }
    const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single();
    const tenant_id = (profile as { tenant_id: string } | null)?.tenant_id;
    if (!tenant_id) { setMsg("No tenant on your profile yet."); return; }
    if (!orderId || !tracking.trim()) { setMsg("Pick an order and a tracking number."); return; }
    const { error } = await supabase.from("shipments").insert({ tenant_id, order_id: orderId, carrier, tracking_number: tracking.trim(), status: "label_created", shipped_at: new Date().toISOString(), notes: notes || null });
    if (error) setMsg(error.message);
    else {
      // Creating a shipment means the order is on its way.
      await supabase.from("orders").update({ status: "shipped" }).eq("id", orderId);
      setOrderId(""); setTracking(""); setNotes(""); load();
    }
  }
  async function move(id: string, status: ShipmentStatus) {
    const patch: Partial<Shipment> = { status };
    if (status === "delivered") patch.delivered_at = new Date().toISOString();
    await supabase.from("shipments").update(patch).eq("id", id);
    // Keep the order in step: a delivered shipment delivers the order.
    const row = rows.find((r) => r.id === id);
    if (row && status === "delivered") await supabase.from("orders").update({ status: "delivered" }).eq("id", row.order_id);
    load();
  }
  const inTransit = rows.filter((r) => ["picked_up", "in_transit", "out_for_delivery"].includes(r.status)).length;
  return (<div><h1 className="text-2xl font-bold">Shipments &amp; tracking</h1>
    <p className="mt-1 text-sm text-slate-500">{inTransit} shipment{inTransit === 1 ? "" : "s"} currently on the way · {rows.filter((r) => r.status === "delivered").length} delivered. One shipment per order; the tracking number is unique per marketplace.</p>
    <form onSubmit={addShipment} className="mt-4 grid gap-2 rounded-xl border bg-white p-4 sm:grid-cols-4">
      <select required value={orderId} onChange={(e) => setOrderId(e.target.value)} className="rounded border px-3 py-2 text-sm">
        <option value="">Ship order…</option>
        {unshipped.map((o) => <option key={o.id} value={o.id}>{o.order_number} · {o.buyer_name} ({o.status})</option>)}
      </select>
      <select value={carrier} onChange={(e) => setCarrier(e.target.value)} className="rounded border px-3 py-2 text-sm">
        {CARRIERS.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <input required value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Tracking number, e.g. DLV-123456" className="rounded border px-3 py-2 text-sm" />
      <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" className="rounded border px-3 py-2 text-sm" />
      <button className="rounded bg-slate-900 px-3 py-2 text-sm text-white sm:col-span-4">Create shipment</button></form>
    {msg && <p className="mt-2 text-sm text-rose-600">{msg}</p>}
    {unshipped.length === 0 && <p className="mt-2 text-sm text-slate-500">No unshipped orders right now — every shippable order already has a shipment.</p>}
    <div className="mt-4 overflow-x-auto rounded-xl border bg-white"><table className="w-full text-sm">
      <thead><tr className="border-b text-left text-slate-500"><th className="px-4 py-2">Order</th><th className="px-4 py-2">Carrier / tracking</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Shipped</th><th className="px-4 py-2">Delivered</th><th className="px-4 py-2">Update</th></tr></thead>
      <tbody>{rows.map((r) => (<tr key={r.id} className="border-b">
        <td className="px-4 py-2 font-mono text-xs">{r.orders?.order_number ?? r.order_id}<span className="block font-sans text-xs text-slate-500">{r.orders?.buyer_name ?? ""}</span></td>
        <td className="px-4 py-2">{r.carrier}<span className="block font-mono text-xs text-slate-500">{r.tracking_number}</span></td>
        <td className="px-4 py-2"><Badge value={r.status} /></td>
        <td className="px-4 py-2">{fmtDate(r.shipped_at)}</td>
        <td className="px-4 py-2">{fmtDate(r.delivered_at)}</td>
        <td className="px-4 py-2"><select value={r.status} onChange={(e) => move(r.id, e.target.value as ShipmentStatus)} className="rounded border px-2 py-1 text-xs">
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></td></tr>))}
        {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">No shipments yet — run supabase/seed.sql, or create one above.</td></tr>}</tbody></table></div>
  </div>);
}
