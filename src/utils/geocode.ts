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
const REVERSE_URL = "https://api.geoapify.com/v1/geocode/reverse";

// Accuracy thresholds in metres for GPS geolocation
export const MAX_USABLE_ACCURACY_M = 1000;
export const GOOD_ACCURACY_M = 100;
export const GPS_WATCH_WINDOW_MS = 8000;

/** "12m" / "1.4km" / "604km" - friendly format for accuracy radius */
export const formatAccuracy = (metres: number) =>
  metres < 1000
    ? `${Math.round(metres)}m`
    : `${(metres / 1000).toFixed(metres < 10000 ? 1 : 0)}km`;

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

/**
 * Reverse-geocodes device GPS coordinates into a readable address suggestion.
 * Tries Geoapify if configured, falling back to OpenStreetMap Nominatim.
 * Returns null if no address is found; coordinates can still be used directly.
 */
export const fetchAddressFromCoordinates = async (
  latitude: number,
  longitude: number,
): Promise<GeocodeSuggestion | null> => {
  // 1. Try Geoapify if API_KEY is available
  if (API_KEY) {
    try {
      const params = new URLSearchParams({
        lat: String(latitude),
        lon: String(longitude),
        apiKey: API_KEY,
        lang: "en",
      });
      const response = await fetch(`${REVERSE_URL}?${params}`);
      if (response.ok) {
        const data = await response.json();
        const features: any[] = Array.isArray(data?.features) ? data.features : [];
        if (features.length > 0) {
          const mapped = mapFeature(features[0], 0);
          if (mapped) return mapped;
        }
      }
    } catch {
      // Fall through to Nominatim
    }
  }

  // 2. Free fallback via Nominatim
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
    const response = await fetch(url, {
      headers: { "Accept-Language": "en" },
    });
    if (response.ok) {
      const data = await response.json();
      const addr = data?.address || {};
      const road =
        addr.road ||
        addr.pedestrian ||
        addr.suburb ||
        addr.neighbourhood ||
        "";
      const houseNumber = addr.house_number || "";
      const streetLine =
        [houseNumber, road].filter(Boolean).join(" ") ||
        data?.display_name?.split(",")?.[0] ||
        "";
      const city =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.suburb ||
        addr.county ||
        "";
      const state = normalizeStateName(addr.state || "");
      const country = addr.country || "";
      const countryCode = (addr.country_code || "").toUpperCase();

      return {
        id: String(data.place_id || Date.now()),
        label: data.display_name || streetLine,
        address:
          streetLine ||
          data?.display_name?.split(",").slice(0, 2).join(",") ||
          "",
        city,
        state,
        stateCode: "",
        country,
        countryCode,
        latitude: String(latitude.toFixed(6)),
        longitude: String(longitude.toFixed(6)),
        precision: data.type || "gps",
      };
    }
  } catch {
    // Reverse geocode is best effort
  }

  return null;
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
