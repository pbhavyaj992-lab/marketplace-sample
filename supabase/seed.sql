-- Marketplace Sample — DEMO / SAMPLE DATA ONLY. Fictional marketplace
-- "Demo Bazaar" with invented sellers, products and buyers.
-- No real products, sellers, buyers or payments. Run after schema.sql.
insert into public.tenants (id, name, slug) values
  ('33333333-3333-3333-3333-333333333333', 'Demo Bazaar', 'demo-bazaar')
  on conflict (id) do nothing;
insert into public.sellers (id, tenant_id, shop_name, owner_name, status, commission_rate) values
  ('d0000000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'Demo Handicrafts', 'Asha Demo', 'active', 0.10),
  ('d0000000-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', 'Demo Home Store', 'Rohan Demo', 'active', 0.10),
  ('d0000000-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', 'Demo Tech Corner', 'Nina Demo', 'pending', 0.12)
  on conflict (id) do nothing;
insert into public.listings (id, tenant_id, seller_id, title, description, price_inr, stock_qty, category, status) values
  ('e0000000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'd0000000-0000-0000-0000-000000000001', 'Handwoven Demo Basket', 'Fictional handwoven basket, demo listing.', 899, 24, 'Home', 'active'),
  ('e0000000-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', 'd0000000-0000-0000-0000-000000000001', 'Demo Clay Diya Set (6)', 'Fictional clay diya set, demo listing.', 349, 60, 'Home', 'active'),
  ('e0000000-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', 'd0000000-0000-0000-0000-000000000002', 'Demo Cotton Cushion Cover', 'Fictional cushion cover, demo listing.', 499, 0, 'Home', 'sold_out'),
  ('e0000000-0000-0000-0000-000000000004', '33333333-3333-3333-3333-333333333333', 'd0000000-0000-0000-0000-000000000002', 'Demo Brass Lamp', 'Fictional brass lamp, demo listing.', 1499, 12, 'Home', 'active'),
  ('e0000000-0000-0000-0000-000000000005', '33333333-3333-3333-3333-333333333333', 'd0000000-0000-0000-0000-000000000003', 'Demo USB Cable 1m', 'Fictional cable, demo listing (seller pending).', 199, 100, 'Electronics', 'draft');
insert into public.orders (id, tenant_id, order_number, buyer_name, buyer_email, status, total_inr, placed_at) values
  ('f0000000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'ORD-2026-5001', 'Demo Buyer One', 'buyer1@example.in', 'delivered', 2147, now() - interval '5 days'),
  ('f0000000-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', 'ORD-2026-5002', 'Demo Buyer Two', 'buyer2@example.in', 'shipped', 1499, now() - interval '2 days'),
  ('f0000000-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', 'ORD-2026-5003', 'Demo Buyer Three', 'buyer3@example.in', 'cancelled', 899, now() - interval '1 day');
-- Commission is 10% of the line total, rounded (see commission.ts).
insert into public.order_items (tenant_id, order_id, listing_id, seller_id, qty, unit_price_inr, commission_inr) values
  ('33333333-3333-3333-3333-333333333333', 'f0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 2, 899, 180),
  ('33333333-3333-3333-3333-333333333333', 'f0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 1, 349, 35),
  ('33333333-3333-3333-3333-333333333333', 'f0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000002', 1, 1499, 150),
  ('33333333-3333-3333-3333-333333333333', 'f0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 1, 899, 90);
insert into public.payouts (tenant_id, seller_id, amount_inr, status, period_start, period_end) values
  ('33333333-3333-3333-3333-333333333333', 'd0000000-0000-0000-0000-000000000001', 1932, 'paid', current_date - 30, current_date - 1);
-- Reviews: both reviews tied to the delivered order ORD-2026-5001 are
-- from its buyer; the third is a storefront review with no order.
insert into public.reviews (tenant_id, listing_id, order_id, seller_id, reviewer_name, rating, title, body) values
  ('33333333-3333-3333-3333-333333333333', 'e0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Demo Buyer One', 5, 'Beautifully made', 'The basket arrived well packed and looks exactly like the listing. Fictional demo review.'),
  ('33333333-3333-3333-3333-333333333333', 'e0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Demo Buyer One', 4, 'Good value', 'Diyas are neat and even; one was slightly chipped in transit. Fictional demo review.'),
  ('33333333-3333-3333-3333-333333333333', 'e0000000-0000-0000-0000-000000000004', null, 'd0000000-0000-0000-0000-000000000002', 'Demo Buyer Four', 5, 'Sturdy lamp', 'Bought for a gift; the finish is lovely. Fictional demo review.')
  on conflict (order_id, listing_id) do nothing;
-- Shipments: the delivered order has a delivered shipment; the shipped
-- order is in transit. The cancelled order has no shipment — correct,
-- cancelled orders are never shipped.
insert into public.shipments (tenant_id, order_id, carrier, tracking_number, status, shipped_at, delivered_at, notes) values
  ('33333333-3333-3333-3333-333333333333', 'f0000000-0000-0000-0000-000000000001', 'Delhivery', 'DLV-DEMO-5001', 'delivered', now() - interval '4 days', now() - interval '3 days', 'Delivered to Demo Buyer One.'),
  ('33333333-3333-3333-3333-333333333333', 'f0000000-0000-0000-0000-000000000002', 'Blue Dart', 'BLD-DEMO-5002', 'in_transit', now() - interval '1 day', null, 'Left the origin hub; expected in 2 days.')
  on conflict (tenant_id, tracking_number) do nothing;
-- Check: delivered order ORD-2026-5001 pays Demo Handicrafts
-- (2x899 - 180) + (1x349 - 35) = 1618 + 314 = 1932. The paid payout
-- record above matches that delivered total exactly.
