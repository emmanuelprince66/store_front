import { useEffect, useRef, useState } from "react";
import {
  fetchAddressSuggestions,
  isGeocodingEnabled,
  type GeocodeSuggestion,
} from "../utils/geocode";

interface AddressAutocompleteProps {
  value: string;
  /** Every keystroke. The caller clears any pinned coordinates here — they
   * describe the address that was just replaced. */
  onChange: (value: string) => void;
  /** A suggestion was picked: carries street/city/state + coordinates. */
  onSelect: (suggestion: GeocodeSuggestion) => void;
  /** ISO-2 of the country picked in the form — scopes the search. */
  countryCode?: string;
  placeholder?: string;
  rows?: number;
  /** Drives the "location pinned" confirmation. Caller owns coordinate state. */
  hasCoordinates?: boolean;
}

const FIELD_CLASSES =
  "w-full px-4 py-3 bg-[#f0f0f0] border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20 resize-none placeholder-gray-500 text-sm";

const AddressAutocomplete = ({
  value,
  onChange,
  onSelect,
  countryCode,
  placeholder = "Start typing your address...",
  rows = 3,
  hasCoordinates = false,
}: AddressAutocompleteProps) => {
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  // Text that arrived programmatically (a picked suggestion). Compared by
  // value rather than tracked with a boolean flag — a flag set for a debounce
  // tick that never fires stays set and swallows the next real search.
  const suppressedQuery = useRef<string | null>(null);

  const enabled = isGeocodingEnabled();

  // Debounce + fetch. Kept in one effect (rather than a shared useDebounce
  // hook) because this project has no hooks directory to put one in.
  useEffect(() => {
    if (!enabled) return;
    if (suppressedQuery.current === value) return;

    const text = (value || "").trim();
    if (text.length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      setIsSearching(false);
      return;
    }

    // Set immediately, not when the request starts — otherwise the 350ms
    // debounce window has no feedback at all and the field reads as frozen.
    setIsSearching(true);

    let ignore = false;
    const timer = setTimeout(async () => {
      const results = await fetchAddressSuggestions(text, countryCode);
      if (ignore) return;
      setSuggestions(results);
      setIsOpen(results.length > 0);
      setIsSearching(false);
    }, 350);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [value, countryCode, enabled]);

  // Close on outside click.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (suggestion: GeocodeSuggestion) => {
    suppressedQuery.current = suggestion.address || suggestion.label;
    setSuggestions([]);
    setIsOpen(false);
    setIsSearching(false);
    onSelect(suggestion);
  };

  return (
    <div ref={containerRef} className="relative">
      <textarea
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(e) => {
          // Typing is always real search intent, even if it lands back on the
          // suppressed string.
          suppressedQuery.current = null;
          onChange(e.target.value);
        }}
        onFocus={() => suggestions.length > 0 && setIsOpen(true)}
        className={FIELD_CLASSES}
      />

      {isSearching && (
        <span className="absolute right-3 top-3 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
      )}

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
          {suggestions.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(s)}
                className="w-full cursor-pointer border-b border-gray-100 px-4 py-2.5 text-left last:border-b-0 hover:bg-gray-50"
              >
                <span className="block truncate text-sm font-medium text-gray-900">
                  {s.address || s.label}
                </span>
                <span className="block truncate text-xs text-gray-500">
                  {[s.city, s.state, s.country].filter(Boolean).join(", ")}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {enabled && (
        <p
          className={`mt-1 text-[11px] ${
            hasCoordinates ? "text-green-600" : "text-gray-500"
          }`}
        >
          {hasCoordinates
            ? "Location pinned — this helps the courier find you."
            : "Pick a suggestion so the courier can find you exactly."}
        </p>
      )}
    </div>
  );
};

export default AddressAutocomplete;
