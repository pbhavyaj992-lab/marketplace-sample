# Marketplace Sample — Next.js + Supabase (multi-vendor)

A sellable **sample** multi-vendor marketplace built from scratch in
TypeScript / React / Next.js with Supabase (PostgreSQL + Auth + Row Level
Security). Original code only: patterns were studied at a high level from
tools such as Medusa; no code was copied from them, from ISHAN Detailing
OS, or from any other product.

> **Status: sample / demo — not production-ready.** The storefront,
> listings, orders and payout-due flows work end to end against a real
> Supabase project — verified live 13 Nov 2026 in demo project
> bhavya-demo-crm-marketplace (ref axvpeagvzpnjlkxbttho), all checks
> passed. Checkout/payments, seller onboarding and per-seller login are
> not yet built (see "Not yet implemented"). All seed data is fictional
> demo data. No money moves in this sample.

## What is implemented

| Module | What works |
| --- | --- |
| Storefront (`/`) | Active listings, active-seller count, order count, gross merchandise value (demo orders only) |
| Listings (`/listings`) | Search by title and filter by category; seller name shown per listing |
| Seller dashboard (`/seller`) | Per-seller gross sales, platform commission, payout due (delivered orders only), and that seller's listings |
| Orders (`/orders`) | Platform order list; move status placed → paid → shipped → delivered / cancelled / refunded |
| Reviews (`/reviews`) | Star ratings (1–5) per listing, optionally tied to an order; add a review, filter by listing, per-listing and overall averages shown. One order may review a given listing only once (database constraint) |
| Shipments (`/shipments`) | Create a shipment for an unshipped order (carrier, tracking number — unique per marketplace), move status label_created → picked_up → in_transit → out_for_delivery → delivered / failed / returned. Creating a shipment marks the order shipped; marking it delivered marks the order delivered. One shipment per order |
| Payouts (`/payouts`) | Payout due per seller from the `seller_payout_due` SQL view, plus payout records with status |
| Commission logic | `src/lib/commission.ts` — default 10% of the line total, per-seller rate in `sellers.commission_rate`; seller earnings = line total − commission; payout due only on **delivered** orders (cancelled/refunded pay nothing). The SQL view and the TypeScript helper encode the same rule |

## Database

Tables in `supabase/schema.sql`: `tenants`, `profiles` (with a
`seller_id` column ready for per-seller login), `sellers`, `listings`,
`orders`, `order_items` (each line stores its own `commission_inr` and
`seller_id`), `payouts`, `reviews`, `shipments` (9 tables), plus the
`seller_payout_due` view. RLS is
enabled on every table; active listings are publicly readable (the
storefront), and reviews of active listings are publicly readable too;
everything else is tenant-scoped
(`tenant_id = public.current_tenant_id()`). `current_seller_id()` exists
for the per-seller policies that still need to be added (see below).
Two rules live in the database: one shipment per order
(`shipments.order_id` unique, tracking number unique per tenant) and
one review per order per listing.

## Demo / seed data

`supabase/seed.sql` inserts one fictional marketplace, **Demo Bazaar**,
with 3 demo sellers (2 active, 1 pending), 5 listings, 3 orders
(delivered, shipped, cancelled), 1 paid payout, 3 reviews (5★ and 4★
on the delivered order's items, 5★ on the brass lamp) and 2 shipments
(ORD-2026-5001 delivered via Delhivery, ORD-2026-5002 in transit via
Blue Dart; the cancelled order has no shipment). The paid payout
(₹1,932 to Demo Handicrafts) matches the delivered order exactly:
(2 × ₹899 − ₹180) + (1 × ₹349 − ₹35) = ₹1,932. All names, emails
(`@example.in`) and products are invented. No real sellers, buyers,
products or payments.

## Setup / run

```bash
npm install
cp .env.example .env.local   # fill in NEXT_PUBLIC_SUPABASE_URL / ANON_KEY
# In the Supabase SQL editor, run supabase/schema.sql, then supabase/seed.sql
# Create an auth user, then insert a profiles row for tenant
#   '33333333-3333-3333-3333-333333333333' (see CRM README for the SQL shape)
npm run dev                  # http://localhost:3000
npm run build
```

## Not yet implemented

- Checkout and payments (no payment provider is connected; do not claim one is). Cart, payment, and order creation from the storefront are the first build step for a paying client
- Seller onboarding and per-seller login: `profiles.seller_id` and `current_seller_id()` exist, but seller-scoped RLS policies (`seller_id = current_seller_id()`) are not yet added, and the seller dashboard currently shows the first active demo seller rather than the signed-in seller
- Seller listing management from the UI (create/edit/pause a listing)
- Stock decrement on order placement, refunds handling beyond status, dispute handling, search beyond title/category
- Sign-up / sign-in UI (use Supabase Auth or add an auth page), roles, audit log, automated tests

## Tech

TypeScript, React, Next.js 14 (App Router), Tailwind CSS, Supabase
(PostgreSQL, Auth, RLS, views), `@supabase/ssr` /
`@supabase/supabase-js`. Built by Bhavya Patel — B.Tech Computer Science
and Design, GCET Anand; Master of Business Analytics, Deakin University,
GIFT City.
