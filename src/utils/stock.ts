import { useSyncExternalStore } from "react";

/**
 * "Sell without stock" (store info `allow_sales_without_stock`). When on,
 * out-of-stock items can still be ordered ("Available on order") and stock
 * caps are lifted; when off, the usual out-of-stock blocking applies.
 *
 * Store info is fetched in one place (useFetchData), which publishes the flag
 * here so cards, the product page and the cart can read it without threading
 * props through every list.
 */
let allowOversell = false;
const listeners = new Set<() => void>();

export const setAllowSalesWithoutStock = (value: boolean) => {
  if (value === allowOversell) return;
  allowOversell = value;
  listeners.forEach((listener) => listener());
};

/** Current value, for non-React code such as the cart's quantity caps. */
export const getAllowSalesWithoutStock = () => allowOversell;

export const useAllowSalesWithoutStock = (): boolean =>
  useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => allowOversell,
    () => false,
  );

/**
 * Stock as a number. The API sometimes sends decimals as text ("10.00"), so
 * a plain `typeof === "number"` check would treat real stock as missing.
 * Null when there's no usable count.
 */
export const toQuantity = (value: unknown): number | null => {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

/** Nothing on hand: flagged out of stock, or a tracked quantity at/below 0. */
export const isStockOut = (item?: {
  status?: string | null;
  quantity?: number | string | null;
} | null): boolean => {
  if (!item) return false;
  const qty = toQuantity(item.quantity);
  return item.status === "OUT-OF-STOCK" || (qty != null && qty <= 0);
};

/**
 * Highest quantity a shopper may pick. `fallback` covers items that carry no
 * stock count (combos), matching each screen's previous behaviour.
 */
export const maxOrderQuantity = (
  available: number | string | null | undefined,
  allow: boolean,
  fallback: number,
): number => {
  if (allow) return Infinity;
  const qty = toQuantity(available);
  return qty != null && qty > 0 ? qty : fallback;
};
