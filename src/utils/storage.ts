// Namespaced, per-store persistence on top of localStorage.
//
// Checkout state lives inside <Checkout/>, which unmounts whenever the buyer
// goes back to the store or opens a product page. Without this the saved
// delivery address dies with it and has to be retyped every time.
//
// Every read and write is guarded: Safari private mode throws on access,
// storage can be disabled by policy, and a half-written value from an older
// build must never crash the checkout. A failed read just yields the fallback.

const NAMESPACE = "sync360";

/** Keys are scoped per store slug so two storefronts never share an address. */
const buildKey = (scope: string, name: string) =>
  `${NAMESPACE}:${scope}:${name}`;

export const readStored = <T>(
  scope: string,
  name: string,
  fallback: T,
): T => {
  try {
    const raw = window.localStorage.getItem(buildKey(scope, name));
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
};

export const writeStored = <T>(scope: string, name: string, value: T) => {
  try {
    window.localStorage.setItem(buildKey(scope, name), JSON.stringify(value));
  } catch {
    // Quota exceeded or storage blocked — persistence is a convenience, not a
    // requirement, so the checkout carries on with in-memory state only.
  }
};

export const clearStored = (scope: string, name: string) => {
  try {
    window.localStorage.removeItem(buildKey(scope, name));
  } catch {
    // Nothing to do — see writeStored.
  }
};
