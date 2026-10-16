import type { Category } from "../type";

export type StorefrontType = "in-store" | "out-store";

/**
 * The main store endpoint returns product AND service categories together;
 * product pages must only show product ones. Anything not explicitly
 * "SERVICE" is kept so older responses without `type` still work.
 */
export const getProductCategories = (categories?: Category[] | null) =>
  (categories ?? []).filter((c) => c.type !== "SERVICE");

const PLATFORM_HOSTNAMES = new Set([
  "store.sync360.africa",
  "localhost",
  "127.0.0.1",
]);

export const getCustomStoreDomain = (): string | undefined => {
  const hostname = window.location.hostname.toLowerCase().replace(/^www\./, "");
  return PLATFORM_HOSTNAMES.has(hostname) ? undefined : hostname;
};

export const getStoreDataPath = (
  storeSlug?: string,
  storeDomain?: string,
): string | undefined => {
  if (storeDomain) return `/domain/${encodeURIComponent(storeDomain)}`;
  if (storeSlug) return `/${encodeURIComponent(storeSlug)}`;
  return undefined;
};

export const getStorefrontPath = (
  type: StorefrontType,
  storeSlug?: string,
): string => {
  const mode = type === "in-store" ? "in" : "out";
  const legacyMode = type === "in-store" ? "i" : "o";

  if (getCustomStoreDomain()) return `/${mode}`;
  return `/${legacyMode}/${encodeURIComponent(storeSlug || "")}`;
};

export const getStoreSuccessPath = (
  type: StorefrontType,
  storeSlug?: string,
): string => {
  if (getCustomStoreDomain()) {
    return `${getStorefrontPath(type, storeSlug)}/success`;
  }

  return `/o/success/${encodeURIComponent(storeSlug || "")}`;
};
