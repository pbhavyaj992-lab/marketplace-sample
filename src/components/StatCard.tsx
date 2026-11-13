export default function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (<div className="rounded-xl border bg-white p-4 shadow-sm">
    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-1 text-2xl font-bold">{value}</p>
    {sub ? <p className="mt-1 text-xs text-slate-500">{sub}</p> : null}
  </div>);
}
