/**
 * Cart deep links: a merchant (SyncShip "Send customer a link") shares
 *   /o/<store>/checkout?items=<productId>:<qty>,<productId>:<qty>
 * or, on a custom domain,
 *   /out/checkout?items=<productId>:<qty>,...
 * Opening it fills the cart with those products and goes straight to checkout.
 */

export type CartLinkItem = { productId: string; quantity: number };

/** Most lines one link may carry; anything beyond is ignored. */
const MAX_LINK_ITEMS = 50;
const MAX_LINK_QUANTITY = 999;

/** Reads `items=<id>:<qty>,...` (qty optional, defaults to 1). Repeated ids are summed. */
export const parseCartLinkItems = (search: string): CartLinkItem[] => {
  const raw = new URLSearchParams(search).get("items") ?? "";
  const totals = new Map<string, number>();
  for (const entry of raw.split(",")) {
    const [id, qty] = entry.split(":");
    const productId = (id ?? "").trim();
    if (!productId) continue;
    const parsed = Math.floor(Number(qty ?? "1"));
    const quantity = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
    totals.set(productId, Math.min((totals.get(productId) ?? 0) + quantity, MAX_LINK_QUANTITY));
  }
  return [...totals.entries()]
    .slice(0, MAX_LINK_ITEMS)
    .map(([productId, quantity]) => ({ productId, quantity }));
};
