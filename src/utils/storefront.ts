export type StorefrontType = "in-store" | "out-store";

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
