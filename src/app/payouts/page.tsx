import { createClient } from "@/lib/supabase/server";
import Badge from "@/components/Badge"; import { inr, fmtDate } from "@/lib/format";
export const dynamic = "force-dynamic";
export default async function PayoutsPage() {
  const supabase = createClient();
  const { data: due } = await supabase.from("seller_payout_due").select("seller_id,shop_name,total_gross_inr,total_commission_inr,payout_due_inr");
  const { data: payouts } = await supabase.from("payouts").select("id,seller_id,amount_inr,status,period_start,period_end,created_at").order("created_at", { ascending: false });
  const { data: sellers } = await supabase.from("sellers").select("id,shop_name");
  const name = new Map((sellers ?? []).map((s) => [s.id, s.shop_name]));
  return (<div><h1 className="text-2xl font-bold">Payouts</h1>
    <p className="mt-1 text-sm text-slate-500">Payout due = delivered-order earnings (line total minus commission) per seller, from the <code>seller_payout_due</code> view. Cancelled and refunded orders pay nothing. No money moves in this sample — payouts are records only.</p>
    <h2 className="mt-6 font-semibold">Payout due (by seller)</h2>
    <div className="mt-2 overflow-x-auto rounded-xl border bg-white"><table className="w-full text-sm">
      <thead><tr className="border-b text-left text-slate-500"><th className="px-4 py-2">Seller</th><th className="px-4 py-2">Gross</th><th className="px-4 py-2">Commission</th><th className="px-4 py-2">Payout due</th></tr></thead>
      <tbody>{(due ?? []).map((d) => (<tr key={d.seller_id} className="border-b"><td className="px-4 py-2 font-medium">{d.shop_name}</td><td className="px-4 py-2">{inr(d.total_gross_inr)}</td><td className="px-4 py-2">{inr(d.total_commission_inr)}</td><td className="px-4 py-2 font-bold">{inr(d.payout_due_inr)}</td></tr>))}
      {(due ?? []).length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-500">No delivered orders yet, so nothing is due.</td></tr>}</tbody></table></div>
    <h2 className="mt-6 font-semibold">Payout records</h2>
    <ul className="mt-2 space-y-2">{(payouts ?? []).map((p) => (
      <li key={p.id} className="flex justify-between rounded-xl border bg-white p-3 text-sm"><span>{name.get(p.seller_id) ?? p.seller_id} · {inr(p.amount_inr)} · {fmtDate(p.period_start)} – {fmtDate(p.period_end)}</span><Badge value={p.status} /></li>))}
      {(payouts ?? []).length === 0 && <li className="rounded-xl border bg-white p-3 text-sm text-slate-500">No payout records yet.</li>}</ul></div>);
}
