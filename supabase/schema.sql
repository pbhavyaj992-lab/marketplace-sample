-- Marketplace Sample — Supabase schema + RLS (PostgreSQL)
-- Multi-vendor marketplace: sellers, listings, orders, payouts.
-- Tenancy: the platform operator is the tenant (tenants/profiles as in
-- the CRM/ERP samples). Sellers are isolated from EACH OTHER by
-- seller_id: a seller's RLS policy (added when per-seller login is
-- built) must compare order_items/listings.seller_id with
-- profiles.seller_id. Until then, platform-admin access is tenant-wide
-- and the seller dashboard shows demo data explicitly labelled as such.
create extension if not exists "pgcrypto";
create table if not exists public.tenants (id uuid primary key default gen_random_uuid(), name text not null, slug text unique not null, created_at timestamptz not null default now());
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  tenant_id uuid references public.tenants (id) on delete cascade,
  seller_id uuid, full_name text, created_at timestamptz not null default now()
);
create table if not exists public.sellers (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants (id) on delete cascade,
  shop_name text not null, owner_name text, status text not null default 'pending' check (status in ('pending','active','suspended')),
  commission_rate numeric not null default 0.10 check (commission_rate >= 0 and commission_rate < 1),
  created_at timestamptz not null default now()
);
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants (id) on delete cascade,
  seller_id uuid not null references public.sellers (id) on delete cascade,
  title text not null, description text, price_inr numeric not null check (price_inr >= 0),
  stock_qty int not null default 0 check (stock_qty >= 0), category text,
  status text not null default 'draft' check (status in ('draft','active','paused','sold_out')),
  created_at timestamptz not null default now()
);
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants (id) on delete cascade,
  order_number text not null, buyer_name text not null, buyer_email text,
  status text not null default 'placed' check (status in ('placed','paid','shipped','delivered','cancelled','refunded')),
  total_inr numeric not null default 0, placed_at timestamptz not null default now(), unique (tenant_id, order_number)
);
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants (id) on delete cascade,
  order_id uuid not null references public.orders (id) on delete cascade,
  listing_id uuid references public.listings (id) on delete set null,
  seller_id uuid not null references public.sellers (id),
  qty int not null check (qty > 0), unit_price_inr numeric not null default 0,
  commission_inr numeric not null default 0 check (commission_inr >= 0)
);
create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants (id) on delete cascade,
  seller_id uuid not null references public.sellers (id) on delete cascade,
  amount_inr numeric not null check (amount_inr >= 0),
  status text not null default 'pending' check (status in ('pending','paid','failed')),
  period_start date, period_end date, created_at timestamptz not null default now()
);
-- Reviews / ratings: a buyer rates a listing (1–5 stars). order_id is
-- nullable — a review may be tied to a delivered order or left without
-- one — but one order may review a given listing only once.
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants (id) on delete cascade,
  listing_id uuid not null references public.listings (id) on delete cascade,
  order_id uuid references public.orders (id) on delete set null,
  seller_id uuid not null references public.sellers (id) on delete cascade,
  reviewer_name text not null, rating int not null check (rating between 1 and 5),
  title text, body text, created_at timestamptz not null default now(),
  unique (order_id, listing_id)
);
-- Shipments / tracking: one shipment record per order. The tracking
-- number is unique per tenant; status moves label_created → picked_up
-- → in_transit → out_for_delivery → delivered (or failed / returned).
create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants (id) on delete cascade,
  order_id uuid not null references public.orders (id) on delete cascade,
  carrier text not null, tracking_number text not null,
  status text not null default 'label_created' check (status in ('label_created','picked_up','in_transit','out_for_delivery','delivered','failed','returned')),
  shipped_at timestamptz, delivered_at timestamptz, notes text, created_at timestamptz not null default now(),
  unique (tenant_id, tracking_number),
  unique (order_id)
);
create index if not exists reviews_listing_idx on public.reviews (listing_id, created_at desc);
create index if not exists reviews_seller_idx on public.reviews (seller_id, rating);
create index if not exists shipments_tenant_idx on public.shipments (tenant_id, status);
-- Payout-due view: delivered orders only. Cancelled/refunded orders
-- contribute nothing. This is the single source of truth for /payouts
-- and must match src/lib/commission.ts payoutDue().
-- security_invoker = true so the view respects the caller's RLS
-- instead of bypassing it as an owner view (fixed 13 Nov 2026: the
-- original view had no tenant filter and leaked across tenants).
create or replace view public.seller_payout_due with (security_invoker = true) as
  select s.id as seller_id, s.shop_name,
    coalesce(sum(oi.qty * oi.unit_price_inr), 0) as total_gross_inr,
    coalesce(sum(oi.commission_inr), 0) as total_commission_inr,
    coalesce(sum(oi.qty * oi.unit_price_inr - oi.commission_inr), 0) as payout_due_inr
  from public.sellers s
  left join public.order_items oi on oi.seller_id = s.id
  left join public.orders o on o.id = oi.order_id and o.status = 'delivered'
  where oi.id is null or o.id is not null
  group by s.id, s.shop_name;
-- Public storefront read: active listings are readable without login.
-- Everything else requires an authenticated platform user (tenant RLS).
alter table public.tenants enable row level security; alter table public.profiles enable row level security;
alter table public.sellers enable row level security; alter table public.listings enable row level security;
alter table public.orders enable row level security; alter table public.order_items enable row level security;
alter table public.payouts enable row level security;
alter table public.reviews enable row level security;
alter table public.shipments enable row level security;
create or replace function public.current_tenant_id() returns uuid language sql security definer stable as
  $$ select tenant_id from public.profiles where id = auth.uid() $$;
-- Compatibility: the CRM sample creates public.profiles WITHOUT
-- seller_id. When both samples share one project, the CREATE TABLE IF
-- NOT EXISTS above is a no-op, so add the column idempotently here
-- before anything references it.
alter table public.profiles add column if not exists seller_id uuid;
create or replace function public.current_seller_id() returns uuid language sql security definer stable as
  $$ select seller_id from public.profiles where id = auth.uid() $$;
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists "own tenant" on public.tenants;
create policy "own tenant" on public.tenants for select using (id = public.current_tenant_id());
drop policy if exists "tenant isolation" on public.sellers;
create policy "tenant isolation" on public.sellers for all using (tenant_id = public.current_tenant_id()) with check (tenant_id = public.current_tenant_id());
-- Listings: anyone may read ACTIVE listings (storefront); writes and
-- non-active reads are tenant-scoped.
drop policy if exists "public active listings" on public.listings;
create policy "public active listings" on public.listings for select using (status = 'active');
drop policy if exists "tenant isolation" on public.listings;
create policy "tenant isolation" on public.listings for all using (tenant_id = public.current_tenant_id()) with check (tenant_id = public.current_tenant_id());
drop policy if exists "tenant isolation" on public.orders;
create policy "tenant isolation" on public.orders for all using (tenant_id = public.current_tenant_id()) with check (tenant_id = public.current_tenant_id());
drop policy if exists "tenant isolation" on public.order_items;
create policy "tenant isolation" on public.order_items for all using (tenant_id = public.current_tenant_id()) with check (tenant_id = public.current_tenant_id());
drop policy if exists "tenant isolation" on public.payouts;
create policy "tenant isolation" on public.payouts for all using (tenant_id = public.current_tenant_id()) with check (tenant_id = public.current_tenant_id());
-- Reviews: anyone may read reviews of ACTIVE listings (storefront, same
-- shape as the public-active-listings policy); writes and all other
-- reads are tenant-scoped.
drop policy if exists "public reviews for active listings" on public.reviews;
create policy "public reviews for active listings" on public.reviews for select using (exists (select 1 from public.listings l where l.id = reviews.listing_id and l.status = 'active'));
drop policy if exists "tenant isolation" on public.reviews;
create policy "tenant isolation" on public.reviews for all using (tenant_id = public.current_tenant_id()) with check (tenant_id = public.current_tenant_id());
drop policy if exists "tenant isolation" on public.shipments;
create policy "tenant isolation" on public.shipments for all using (tenant_id = public.current_tenant_id()) with check (tenant_id = public.current_tenant_id());
-- TODO before selling per-seller access: add seller-scoped policies
-- (seller_id = public.current_seller_id()) on listings, order_items,
-- payouts, reviews and shipments, so a logged-in seller sees only
-- their own rows.
