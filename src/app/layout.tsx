import "./globals.css";
import type { ReactNode } from "react";
const nav = [["Storefront", "/"], ["Browse listings", "/listings"], ["Seller dashboard", "/seller"], ["Orders", "/orders"], ["Reviews", "/reviews"], ["Shipments", "/shipments"], ["Payouts", "/payouts"]];
export const metadata = { title: "Marketplace Sample — Demo", description: "Multi-vendor marketplace sample built with Next.js and Supabase. Demo data only." };
export default function RootLayout({ children }: { children: ReactNode }) {
  return (<html lang="en"><body>
    <div className="flex min-h-screen">
      <aside className="w-60 shrink-0 bg-slate-900 p-4 text-white">
        <p className="text-lg font-bold">Marketplace Sample</p>
        <p className="mt-0.5 text-xs text-slate-400">Demo Bazaar · fictional sellers</p>
        <nav className="mt-6 space-y-1">{nav.map(([label, href]) => (
          <a key={href} href={href} className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-800">{label}</a>))}</nav>
        <p className="mt-8 text-xs leading-relaxed text-slate-400">Sellers are isolated by seller_id in RLS. Commission defaults to 10% per seller, overridable per seller.</p>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div></body></html>);
}
