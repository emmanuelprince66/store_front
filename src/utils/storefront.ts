import type { Category, StoreInfo } from "../type";

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

// Netlify test and preview deploys: not a merchant's domain, so the store comes
// from the URL (/o/<slug>) just as on store.sync360.africa.
const isTestDeployHost = (hostname: string) =>
  hostname.endsWith(".netlify.app");

export const getCustomStoreDomain = (): string | undefined => {
  const hostname = window.location.hostname.toLowerCase().replace(/^www\./, "");
  return PLATFORM_HOSTNAMES.has(hostname) || isTestDeployHost(hostname)
    ? undefined
    : hostname;
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

const FALLBACK_BANNER =
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=70";

/** Hero images in priority order: `banners`, then the single `banner`, then
 * the logo. Returns [] while store info hasn't arrived. */
export const getStoreBanners = (
  info: Partial<StoreInfo> | null | undefined,
): string[] => {
  if (!info) return [];
  const banners = Array.isArray(info.banners)
    ? info.banners.filter((url): url is string => typeof url === "string" && Boolean(url))
    : [];
  if (banners.length) return banners;
  if (info.banner) return [info.banner];
  if (info.logo) return [info.logo];
  return [FALLBACK_BANNER];
};
