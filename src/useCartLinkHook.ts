import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { BaseUrl } from "./base-url";
import { CartContext } from "./context/CartContext";
import type { Product, StoreData } from "./type";
import { parseCartLinkItems } from "./utils/cartLink";
import { isStockOut, maxOrderQuantity, setAllowSalesWithoutStock } from "./utils/stock";
import { getCustomStoreDomain, getStoreDataPath } from "./utils/storefront";

/** Why a linked product didn't go into the cart as asked. */
export type CartLinkIssue = {
  productId: string;
  name: string | null;
  kind: "missing" | "out-of-stock" | "has-options" | "reduced";
  /** For "reduced": how many were added instead of the requested amount. */
  added?: number;
  requested: number;
};

type CartLinkState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; storeData: StoreData; added: number; issues: CartLinkIssue[] };

const PAGE_SIZE = 100;
/** The store endpoint has no product-by-id lookup, so pages are scanned (safety stop: 2,000 products). */
const MAX_PAGES = 20;

const fetchStorePage = async (storePath: string, page: number): Promise<StoreData> => {
  const response = await fetch(`${BaseUrl}${storePath}?page=${page}&limit=${PAGE_SIZE}`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
};

/**
 * Opens a cart deep link: loads the linked products from the store, replaces the cart
 * with them at the linked quantities (within stock and "sell without stock" rules) and
 * reports anything that couldn't be added.
 */
export const useCartLink = () => {
  const { slug } = useParams<{ slug: string }>();
  const { search } = useLocation();
  const { addToCart, clearCart } = useContext(CartContext);
  const storeDomain = getCustomStoreDomain();
  const storePath = getStoreDataPath(slug, storeDomain);
  const [state, setState] = useState<CartLinkState>({ status: "loading" });
  const appliedKey = useRef<string | null>(null);

  const apply = useCallback(async () => {
    const requested = parseCartLinkItems(search);
    if (!storePath) {
      setState({ status: "error", message: "This link doesn’t name a store." });
      return;
    }
    setState({ status: "loading" });
    try {
      const first = await fetchStorePage(storePath, 1);
      const products = new Map<string, Product>();
      const collect = (data: StoreData) => (data.results?.products ?? []).forEach((product) => products.set(product.id, product));
      collect(first);
      const pages = Math.min(first.pages || 1, MAX_PAGES);
      for (let page = 2; page <= pages && requested.some((item) => !products.has(item.productId)); page += 1) {
        collect(await fetchStorePage(storePath, page));
      }

      const allow = first.results?.info?.allow_sales_without_stock === true;
      setAllowSalesWithoutStock(allow);

      const issues: CartLinkIssue[] = [];
      const lines: { product: Product; quantity: number }[] = [];
      for (const item of requested) {
        const product = products.get(item.productId);
        const base = { productId: item.productId, name: product?.name ?? null, requested: item.quantity };
        if (!product) { issues.push({ ...base, kind: "missing" }); continue; }
        // A product with options needs the shopper to pick one on its page.
        if (product.variations?.length) { issues.push({ ...base, kind: "has-options" }); continue; }
        if (isStockOut(product) && !allow) { issues.push({ ...base, kind: "out-of-stock" }); continue; }
        const cap = maxOrderQuantity(product.quantity, allow, product.type === "COMBO" ? 99 : 999);
        const quantity = Math.min(item.quantity, cap);
        if (quantity < item.quantity) issues.push({ ...base, kind: "reduced", added: quantity });
        lines.push({ product, quantity });
      }

      // The link describes the whole order, so it replaces whatever was in the cart.
      clearCart();
      lines.forEach(({ product, quantity }) => addToCart(product, quantity));
      setState({ status: "ready", storeData: first, added: lines.length, issues });
    } catch {
      setState({ status: "error", message: "We couldn’t load this store right now. Check your connection and try again." });
    }
  }, [search, storePath, addToCart, clearCart]);

  useEffect(() => {
    // Once per link (StrictMode runs effects twice in development).
    const key = `${storePath}?${search}`;
    if (appliedKey.current === key) return;
    appliedKey.current = key;
    void apply();
  }, [apply, search, storePath]);

  return {
    state,
    retry: () => void apply(),
    requestedCount: parseCartLinkItems(search).length,
    slug,
    storeKey: slug || storeDomain,
  };
};
