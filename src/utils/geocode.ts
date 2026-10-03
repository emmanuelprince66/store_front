import { City, State } from "country-state-city";

// Address autocomplete + coordinate resolution, powered by Geoapify.
//
// Coordinates go out with the delivery address on
// POST /order/fetch_shipment_rate/{business_id}/ so Shipbubble doesn't have to
// guess the location from free text — that guessing is what makes it reject
// otherwise-valid Nigerian addresses.
//
// Resolution order used at checkout:
//   1. coordinates from the suggestion the buyer picked  (street-level)
//   2. the selected city's centroid                      (kilometre-level)
//   3. the selected state's centroid                     (coarse)
//   4. nothing — the fields are omitted entirely
//
// Steps 2-4 need no network call: country-state-city (already a dependency,
// it powers the country/state/city dropdowns) ships coordinates for every
// entry. Shipbubble uses these for serviceability and zone banding rather
// than the rider's last 50 metres, so a centroid is genuinely useful.
//
// NOTE ON THE KEY: this is a Vite SPA with no server of its own, so the key is
// bundled and therefore public. Geoapify keys can be restricted to specific
// domains from their dashboard — do that for the storefront's domain, which is
// what keeps a public key from being usable elsewhere.

const API_KEY = import.meta.env.VITE_GEOAPIFY_KEY as string | undefined;
const AUTOCOMPLETE_URL = "https://api.geoapify.com/v1/geocode/autocomplete";

export interface GeocodeSuggestion {
  id: string;
  /** Full readable line — what the dropdown row shows. */
  label: string;
  /** Street line only — what goes into the shipping-address field. */
  address: string;
  city: string;
  /** Full state name, e.g. "Lagos". */
  state: string;
  /** ISO subdivision code when available, e.g. "LA". May be "". */
  stateCode: string;
  country: string;
  countryCode: string;
  latitude: string;
  longitude: string;
  /** Geoapify result_type — "building"/"street" are precise, "city" is coarse. */
  precision: string;
}

export interface Coordinates {
  latitude: string;
  longitude: string;
}

export const isGeocodingEnabled = () => Boolean(API_KEY);

const toFixed6 = (v: unknown): string => {
  const num = Number(v);
  return Number.isFinite(num) ? num.toFixed(6) : "";
};

const asCoordinates = (lat: unknown, lng: unknown): Coordinates | null => {
  const latitude = toFixed6(lat);
  const longitude = toFixed6(lng);
  // Both or neither. The API models latitude/longitude as an optional pair,
  // not as nullable fields, so a half-populated pair is worse than none.
  return latitude && longitude ? { latitude, longitude } : null;
};

// Geoapify returns state names as either "Lagos" or "Lagos State";
// country-state-city only knows the bare form.
const normalizeStateName = (name?: string) =>
  (name || "").replace(/\s+state$/i, "").trim();

const mapFeature = (feature: any, index: number): GeocodeSuggestion | null => {
  const p = feature?.properties || {};

  const coords = asCoordinates(
    p.lat ?? feature?.geometry?.coordinates?.[1],
    p.lon ?? feature?.geometry?.coordinates?.[0],
  );
  // A suggestion with no coordinates is useless here — that's the whole point.
  if (!coords) return null;

  const streetLine =
    [p.housenumber, p.street].filter(Boolean).join(" ") ||
    p.address_line1 ||
    p.name ||
    "";

  return {
    id: String(p.place_id || feature?.id || index),
    label: p.formatted || streetLine,
    address: streetLine,
    // Geoapify files towns under any of these depending on size.
    city: p.city || p.town || p.village || p.suburb || "",
    state: normalizeStateName(p.state),
    stateCode: (p.state_code || "").replace(/^[A-Z]{2}-/i, "").toUpperCase(),
    country: p.country || "",
    countryCode: (p.country_code || "").toUpperCase(),
    ...coords,
    precision: p.result_type || "",
  };
};

/**
 * Address suggestions for a partial query.
 * `countryCode` is the ISO-2 the buyer picked in the form — results are
 * filtered to it. This storefront ships internationally, so unlike the admin
 * dashboard it must not hard-code Nigeria.
 */
export const fetchAddressSuggestions = async (
  query: string,
  countryCode?: string,
): Promise<GeocodeSuggestion[]> => {
  if (!API_KEY) return [];
  const text = (query || "").trim();
  if (text.length < 3) return [];

  const params = new URLSearchParams({
    text,
    apiKey: API_KEY,
    lang: "en",
    limit: "6",
  });

  if (countryCode) {
    const filter = `countrycode:${countryCode.toLowerCase()}`;
    params.set("filter", filter);
    params.set("bias", filter);
  }

  try {
    const response = await fetch(`${AUTOCOMPLETE_URL}?${params}`);
    if (!response.ok) return [];
    const data = await response.json();
    const features: any[] = Array.isArray(data?.features) ? data.features : [];
    return features
      .map(mapFeature)
      .filter((s): s is GeocodeSuggestion => s !== null);
  } catch {
    // Autocomplete is an enhancement — a failed lookup must never block
    // checkout. The buyer can still type the address by hand.
    return [];
  }
};

// ─── Offline fallback: city / state centroid ────────────────────────────────

/**
 * Centroid for the picked city, falling back to the state's own centroid.
 * All arguments are ISO codes, matching what the address form holds.
 */
export const cityCentroid = (
  countryCode?: string,
  stateCode?: string,
  cityName?: string,
): Coordinates | null => {
  if (!countryCode || !stateCode) return null;

  if (cityName) {
    const match = City.getCitiesOfState(countryCode, stateCode).find(
      (c) => c.name.toLowerCase() === cityName.trim().toLowerCase(),
    );
    const coords = asCoordinates(match?.latitude, match?.longitude);
    if (coords) return coords;
  }

  const state = State.getStateByCodeAndCountry(stateCode, countryCode);
  return asCoordinates(state?.latitude, state?.longitude);
};

/** Best coordinates available, in resolution order. Null when nothing resolves. */
export const resolveCoordinates = (
  picked?: Partial<Coordinates> | null,
  fallback?: Coordinates | null,
): Coordinates | null =>
  asCoordinates(picked?.latitude, picked?.longitude) || fallback || null;

/** Spreads into a request body: `{...coordinatesPayload(coords)}`. */
export const coordinatesPayload = (coords?: Coordinates | null) =>
  coords ? { latitude: coords.latitude, longitude: coords.longitude } : {};
