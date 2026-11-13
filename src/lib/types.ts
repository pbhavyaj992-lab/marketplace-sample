export type Seller = { id: string; tenant_id: string; shop_name: string; owner_name: string | null; status: "pending" | "active" | "suspended"; commission_rate: number; created_at: string };
export type Listing = { id: string; tenant_id: string; seller_id: string; title: string; description: string | null; price_inr: number; stock_qty: number; category: string | null; status: "draft" | "active" | "paused" | "sold_out"; created_at: string };
export type OrderStatus = "placed" | "paid" | "shipped" | "delivered" | "cancelled" | "refunded";
export type Order = { id: string; tenant_id: string; order_number: string; buyer_name: string; buyer_email: string | null; status: OrderStatus; total_inr: number; placed_at: string };
export type OrderItem = { id: string; tenant_id: string; order_id: string; listing_id: string | null; seller_id: string; qty: number; unit_price_inr: number; commission_inr: number };
export type Payout = { id: string; tenant_id: string; seller_id: string; amount_inr: number; status: "pending" | "paid" | "failed"; period_start: string | null; period_end: string | null; created_at: string };
export type Review = { id: string; tenant_id: string; listing_id: string; order_id: string | null; seller_id: string; reviewer_name: string; rating: number; title: string | null; body: string | null; created_at: string };
export type ShipmentStatus = "label_created" | "picked_up" | "in_transit" | "out_for_delivery" | "delivered" | "failed" | "returned";
export type Shipment = { id: string; tenant_id: string; order_id: string; carrier: string; tracking_number: string; status: ShipmentStatus; shipped_at: string | null; delivered_at: string | null; notes: string | null; created_at: string };
// Tenancy: the platform is one tenant per deployment in this sample
// (tenants row = the marketplace operator). Sellers are isolated from
// each other by seller_id in RLS — see schema.sql. A seller must never
// see another seller's orders, listings or payouts.
