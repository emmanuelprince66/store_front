import type { CSSProperties } from "react";
import { useEffect, useSyncExternalStore } from "react";
import type { StoreData, StoreTheme } from "../type";
import { applyStoreFavicon } from "./favicon";

// Fallback matches the app's original black/white look for stores that
// haven't been assigned a brand theme yet.
const DEFAULT_THEME: StoreTheme = {
  key: "default",
  label: "Default",
  primary: "#000000",
  on_primary: "#FFFFFF",
  surface: "#F0F0F0",
  accent: "#000000",
};

// ---------------------------------------------------------------------------
// Color validation + WCAG contrast safety
//
// `theme.key` can now be "custom" — merchants can pick arbitrary colors, not
// just the curated 11-preset enum, so we can no longer assume every value
// coming from the API is a well-formed hex color or that primary/on_primary
// pair with safe contrast. Bad input should degrade to the safe default
// rather than render illegible or invisible UI.
// ---------------------------------------------------------------------------

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const isValidHex = (v: unknown): v is string =>
  typeof v === "string" && HEX_RE.test(v.trim());

const hexToRgb = (hex: string) => {
  const h = hex.replace("#", "").trim();
  const full = h.length === 3
    ? h.split("").map((c) => c + c).join("")
    : h;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
};

// WCAG 2.x relative luminance / contrast ratio — see
// https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
const relativeLuminance = ({ r, g, b }: { r: number; g: number; b: number }) => {
  const channel = (c: number) => {
    const cs = c / 255;
    return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

const contrastRatio = (hexA: string, hexB: string) => {
  const lumA = relativeLuminance(hexToRgb(hexA));
  const lumB = relativeLuminance(hexToRgb(hexB));
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
};

// WCAG AA threshold for large text / UI components (buttons, icons).
const MIN_CONTRAST = 3;

// Whichever of black/white reads best against a given background.
const bestOnColor = (bgHex: string): string =>
  contrastRatio(bgHex, "#FFFFFF") >= contrastRatio(bgHex, "#000000")
    ? "#FFFFFF"
    : "#000000";

// Validates every color field and repairs anything that's malformed or would
// render illegibly, so a bad/unexpected API payload can never break the
// storefront's visual usability.
const sanitizeTheme = (raw: Partial<StoreTheme> | null | undefined): StoreTheme => {
  if (!raw) return DEFAULT_THEME;

  const primary = isValidHex(raw.primary) ? raw.primary : DEFAULT_THEME.primary;

  let on_primary = isValidHex(raw.on_primary)
    ? raw.on_primary
    : bestOnColor(primary);
  if (contrastRatio(primary, on_primary) < MIN_CONTRAST) {
    on_primary = bestOnColor(primary);
  }

  // Surface pairs with primary-colored text/icons elsewhere in the UI
  // (variation pills, OTP icon, etc.) — guard against a custom surface too
  // close in tone to primary to still read clearly.
  let surface = isValidHex(raw.surface) ? raw.surface : DEFAULT_THEME.surface;
  if (contrastRatio(primary, surface) < MIN_CONTRAST) {
    surface = DEFAULT_THEME.surface;
  }

  const accent = isValidHex(raw.accent) ? raw.accent : DEFAULT_THEME.accent;

  return {
    key: raw.key || DEFAULT_THEME.key,
    label: raw.label || DEFAULT_THEME.label,
    primary,
    on_primary,
    surface,
    accent,
  };
};

// ---------------------------------------------------------------------------
// Shared, reactive theme store
//
// Each page fetches store data independently (InStore/Outstore/ProductPage/
// Success each hit different query variants), and the generic per-request
// cache in useFetchDataHook is keyed per exact URL — so one page's `storeData`
// can be stale (serving an old cached response) even after another page has
// already fetched the merchant's *new* theme. If every page derived its CSS
// vars from its own local `storeData`, a stale page would keep showing the
// old color until its own specific request happened to refetch.
//
// Instead, every successful fetch anywhere in the app feeds ONE shared,
// versioned, in-memory + localStorage-backed store via `syncThemeCache`, and
// every consumer reads it through `useStoreTheme`'s `useSyncExternalStore`
// subscription — so the instant any fetch resolves with a changed theme,
// every currently-mounted screen re-renders with the correct color, and the
// very next full reload of any screen picks it up from localStorage too.
// ---------------------------------------------------------------------------

// Bumping this prefix invalidates old cached shapes if the schema ever
// changes, instead of silently misreading a stale structure.
const THEME_CACHE_PREFIX = "sf_theme:v1:";

const readCachedTheme = (storeSlug: string): StoreTheme | null => {
  try {
    const raw = localStorage.getItem(THEME_CACHE_PREFIX + storeSlug);
    if (!raw) return null;
    return sanitizeTheme(JSON.parse(raw));
  } catch {
    return null;
  }
};

const writeCachedTheme = (storeSlug: string, theme: StoreTheme) => {
  try {
    localStorage.setItem(THEME_CACHE_PREFIX + storeSlug, JSON.stringify(theme));
  } catch {
    // localStorage unavailable or quota exceeded — cache is best-effort only.
  }
};

type Listener = () => void;
const listeners = new Set<Listener>();
const notifyAll = () => listeners.forEach((l) => l());

// In-memory, same-tab source of truth — always at least as fresh as
// localStorage, and updated immediately (no round-trip) whenever any fetch
// resolves during this session.
const liveThemes = new Map<string, StoreTheme>();

const getLiveTheme = (storeSlug?: string): StoreTheme => {
  if (!storeSlug) return DEFAULT_THEME;
  const existing = liveThemes.get(storeSlug);
  if (existing) return existing;

  const seeded = readCachedTheme(storeSlug) || DEFAULT_THEME;
  liveThemes.set(storeSlug, seeded);
  return seeded;
};

const toCssVars = (theme: StoreTheme): CSSProperties =>
  ({
    "--brand-primary": theme.primary,
    "--brand-on-primary": theme.on_primary,
    "--brand-surface": theme.surface,
    "--brand-accent": theme.accent,
  }) as CSSProperties;

// Call whenever store data is freshly fetched, from any page. Sanitizes and
// compares against the shared store; only touches localStorage and notifies
// subscribers when the (sanitized) theme actually changed.
export const syncThemeCache = (
  storeSlug: string | undefined,
  storeData?: StoreData | null,
) => {
  const rawTheme = storeData?.results?.info?.theme;
  if (!storeSlug || !rawTheme) return;

  const sanitized = sanitizeTheme(rawTheme);
  const current = getLiveTheme(storeSlug);

  if (JSON.stringify(current) !== JSON.stringify(sanitized)) {
    liveThemes.set(storeSlug, sanitized);
    writeCachedTheme(storeSlug, sanitized);
    notifyAll();
  }
};

const subscribe = (listener: Listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/**
 * Read-only subscription to the shared theme store — for components that
 * display brand colors but don't own a fetch (e.g. WhatsAppButton, which
 * receives storeData as a prop from a page that already syncs it). Never
 * writes to the store, so it can't regress an already-correct theme.
 */
export const useThemeSnapshot = (storeSlug?: string) => {
  const theme = useSyncExternalStore(subscribe, () => getLiveTheme(storeSlug));
  return { theme, vars: toCssVars(theme) };
};

/**
 * The hook every screen that OWNS a store-data fetch should use. Syncs
 * `storeData` into the shared store — but only once `isDataFresh` is true.
 *
 * Why `isDataFresh` matters: useFetchDataHook hydrates instantly from its own
 * per-URL local cache before its network request resolves. That cached value
 * can be older than what a *different* page already fetched and synced. If
 * we synced on every `storeData` change unconditionally, this stale
 * cache-hydration hop would overwrite an already-correct shared theme —
 * visible as: correct color → flashes back to stale → corrects again once
 * this page's own network response lands. Gating the sync on confirmed-fresh
 * data (i.e. `!isFromCache` from useFetchDataHook) closes that hole: a stale
 * cache hit can still be *read* for rendering non-theme content, it just
 * never gets to overwrite the shared theme.
 */
export const useStoreTheme = (
  storeData: StoreData | null | undefined,
  storeSlug: string | undefined,
  isDataFresh: boolean,
) => {
  useEffect(() => {
    if (isDataFresh) syncThemeCache(storeSlug, storeData);
  }, [storeSlug, storeData, isDataFresh]);

  const snapshot = useThemeSnapshot(storeSlug);
  const { primary, on_primary } = snapshot.theme;

  // The tab icon follows the brand. Keyed on the two colours rather than the
  // theme object, so it redraws only when the merchant actually re-brands.
  useEffect(() => {
    applyStoreFavicon(primary, on_primary);
  }, [primary, on_primary]);

  return snapshot;
};
