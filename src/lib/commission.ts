// Commission math, in one place so the storefront, seller dashboard and
// payout page can never disagree.
// Default platform commission is 10% of the line total, per seller
// (sellers.commission_rate overrides it). Commission is computed on the
// item line total (qty x unit price), rounded to the nearest rupee.
// Seller earnings = line total - commission.
export const DEFAULT_COMMISSION_RATE = 0.10;
export function lineCommission(qty: number, unitPriceInr: number, rate = DEFAULT_COMMISSION_RATE) {
  return Math.round(qty * unitPriceInr * rate);
}
export function sellerEarnings(qty: number, unitPriceInr: number, rate = DEFAULT_COMMISSION_RATE) {
  return qty * unitPriceInr - lineCommission(qty, unitPriceInr, rate);
}
// A payout is due only for delivered (not cancelled/refunded) order
// items, and only once the platform has been paid. The SQL view
// seller_payout_due in schema.sql encodes exactly that rule.
export function payoutDue(items: { qty: number; unit_price_inr: number; commission_inr: number; order_status: string }[]) {
  return items.filter((i) => i.order_status === "delivered")
    .reduce((s, i) => s + (i.qty * i.unit_price_inr - i.commission_inr), 0);
}
