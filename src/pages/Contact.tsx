import { useEffect, useRef, useState } from "react";
import AddressAutocomplete from "../components/AddressAutocomplete";
import { State } from "country-state-city";
import {
  fetchAddressFromCoordinates,
  formatAccuracy,
  GOOD_ACCURACY_M,
  GPS_WATCH_WINDOW_MS,
  MAX_USABLE_ACCURACY_M,
  type GeocodeSuggestion,
} from "../utils/geocode";

interface ContactProps {
  countryList: any[];
  stateList: any[];
  cityList: any[];
  handleAddressSave: (address: any) => void;
  setShowAddressModal: (show: boolean) => void;
  currentAddressForm: any;
  handleFormChange: (field: any, value: string) => void;
  applyAddressSuggestion: (
    suggestion: GeocodeSuggestion,
    pinSource?: "search" | "gps",
    accuracy?: number | null,
  ) => void;
  setCoordinates?: (
    lat: string,
    lng: string,
    pinSource?: "search" | "gps",
    accuracy?: number | null,
  ) => void;
  clearCoordinates?: () => void;
  setEditAddress: (address: any) => void;
}

const Contact = ({
  countryList,
  stateList,
  cityList,
  handleAddressSave,
  setShowAddressModal,
  currentAddressForm,
  handleFormChange,
  applyAddressSuggestion,
  setCoordinates,
  setEditAddress,
}: ContactProps) => {
  // Dual pin methods: "search" (address autocomplete) or "gps" (live device location)
  const [pinMethod, setPinMethod] = useState<"search" | "gps">(
    currentAddressForm?.pinSource === "gps" ? "gps" : "search",
  );

  // GPS capture state
  const [gpsStatus, setGpsStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >(
    currentAddressForm?.latitude && currentAddressForm?.pinSource === "gps"
      ? "success"
      : "idle",
  );
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(
    currentAddressForm?.gpsAccuracy || null,
  );
  const [liveAccuracy, setLiveAccuracy] = useState<number | null>(null);
  const [resolvingAddress, setResolvingAddress] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);


  const watchIdRef = useRef<number | null>(null);
  const watchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bestFixRef = useRef<GeolocationCoordinates | null>(null);

  const stopWatching = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (watchTimerRef.current) {
      clearTimeout(watchTimerRef.current);
      watchTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopWatching();
    };
  }, []);

  const hasCoordinates = Boolean(
    currentAddressForm?.latitude && currentAddressForm?.longitude,
  );

  // Applies the best GPS fix seen in the watch window
  const applyBestFix = () => {
    stopWatching();

    const coords = bestFixRef.current;
    if (!coords) {
      setGpsStatus("error");
      setGpsError(
        "Could not detect your location. Please check your device location settings and try again.",
      );
      return;
    }

    const { latitude, longitude, accuracy } = coords;

    // Reject inaccurate fixes (e.g. desktop IP geolocation often > 1km off)
    if (Number.isFinite(accuracy) && accuracy > MAX_USABLE_ACCURACY_M) {
      setGpsStatus("error");
      setGpsAccuracy(null);
      setResolvedAddress(null);
      setGpsError(
        `Your device only provided an approximate location within ${formatAccuracy(
          accuracy,
        )}, which is too wide for delivery couriers. This usually happens on desktop PCs using internet provider estimates. Please search your address above or open this store on your mobile phone at your delivery spot.`,
      );
      return;
    }

    const latStr = latitude.toFixed(6);
    const lngStr = longitude.toFixed(6);
    const roundedAccuracy = Number.isFinite(accuracy)
      ? Math.round(accuracy)
      : null;

    if (setCoordinates) {
      setCoordinates(latStr, lngStr, "gps", roundedAccuracy);
    }
    setGpsAccuracy(roundedAccuracy);
    setGpsStatus("success");
    setGpsError(null);

    // Reverse-geocode coordinates to pre-fill street address, city, state, and country
    setResolvingAddress(true);
    fetchAddressFromCoordinates(latitude, longitude)
      .then((suggestion) => {
        if (!suggestion) return;
        setResolvedAddress(suggestion.label || suggestion.address || null);

        // Map country & state
        const targetCountryCode =
          suggestion.countryCode || currentAddressForm.country || "NG";
        const matchedState = targetCountryCode
          ? State.getStatesOfCountry(targetCountryCode).find(
              (s) =>
                s.isoCode === suggestion.stateCode ||
                s.name.toLowerCase() === suggestion.state.toLowerCase(),
            )
          : undefined;

        applyAddressSuggestion(
          {
            ...suggestion,
            countryCode: targetCountryCode,
            stateCode: matchedState?.isoCode || suggestion.stateCode || "",
            latitude: latStr,
            longitude: lngStr,
          },
          "gps",
          roundedAccuracy,
        );
      })
      .finally(() => {
        setResolvingAddress(false);
      });
  };

  const handleCaptureGps = () => {
    if (!navigator.geolocation) {
      setGpsStatus("error");
      setGpsError(
        "Your browser or device does not support GPS location access.",
      );
      return;
    }

    stopWatching();
    bestFixRef.current = null;
    setLiveAccuracy(null);
    setGpsStatus("loading");
    setGpsError(null);
    setResolvedAddress(null);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const best = bestFixRef.current;
        if (!best || position.coords.accuracy < best.accuracy) {
          bestFixRef.current = position.coords;
          setLiveAccuracy(Math.round(position.coords.accuracy));
        }

        // Exit immediately once high precision satellite fix is acquired (<= 100m)
        if (position.coords.accuracy <= GOOD_ACCURACY_M) {
          applyBestFix();
        }
      },
      (err) => {
        stopWatching();
        setGpsStatus("error");
        setGpsAccuracy(null);
        setLiveAccuracy(null);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError(
            "Location permission was denied. Please allow location access in your browser settings and try again.",
          );
        } else if (err.code === err.TIMEOUT) {
          setGpsError(
            "Timed out finding your location. Please move near a window or outdoors and try again.",
          );
        } else {
          setGpsError(
            "Could not get your location. Please try searching your address instead.",
          );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: GPS_WATCH_WINDOW_MS,
        maximumAge: 0,
      },
    );

    // Fallback: take best reading after window expires
    watchTimerRef.current = setTimeout(applyBestFix, GPS_WATCH_WINDOW_MS);
  };

  const switchPinMethod = (method: "search" | "gps") => {
    if (method === "search") {
      stopWatching();
      if (gpsStatus === "loading") setGpsStatus("idle");
      setGpsError(null);
    }
    setPinMethod(method);
  };

  return (
    <>
      <div className="p-5 sm:p-8 w-full max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-100">
          <div>
            <h3 className="font-display text-2xl uppercase tracking-wide text-[var(--brand-primary)]">
              Delivery Details
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Tell couriers where to deliver your order safely and accurately.
            </p>
          </div>
          <button
            onClick={() => {
              setShowAddressModal(false);
              setEditAddress(null);
            }}
            className="text-gray-400 hover:text-gray-700 text-2xl leading-none cursor-pointer w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* Recipient Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                First name *
              </label>
              <input
                type="text"
                placeholder="First name"
                value={currentAddressForm.firstName}
                onChange={(e) => handleFormChange("firstName", e.target.value)}
                className="w-full px-4 py-2.5 bg-[#f0f0f0] border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20 placeholder-gray-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Last name
              </label>
              <input
                type="text"
                placeholder="Last name"
                value={currentAddressForm.lastName}
                onChange={(e) => handleFormChange("lastName", e.target.value)}
                className="w-full px-4 py-2.5 bg-[#f0f0f0] border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20 placeholder-gray-500 text-sm"
              />
            </div>
          </div>

          {/* Phone Numbers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Phone number (for courier calls) *
              </label>
              <input
                type="tel"
                placeholder="e.g. 08012345678"
                value={currentAddressForm.phone}
                onChange={(e) => handleFormChange("phone", e.target.value)}
                className="w-full px-4 py-2.5 bg-[#f0f0f0] border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20 placeholder-gray-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Alternative phone (Optional)
              </label>
              <input
                type="tel"
                placeholder="Alternative phone"
                value={currentAddressForm.altPhone}
                onChange={(e) => handleFormChange("altPhone", e.target.value)}
                className="w-full px-4 py-2.5 bg-[#f0f0f0] border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20 placeholder-gray-500 text-sm"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Email address *
            </label>
            <input
              type="email"
              placeholder="e.g. customer@example.com"
              value={currentAddressForm.email}
              onChange={(e) => handleFormChange("email", e.target.value)}
              className="w-full px-4 py-2.5 bg-[#f0f0f0] border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20 placeholder-gray-500 text-sm"
            />
          </div>

          {/* ========================================================== */}
          {/* LOCATION PINNING METHOD SELECTION & DETAILED DESCRIPTIONS */}
          {/* ========================================================== */}
          <div className="pt-2">
            <div className="mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-800">
                Tag Your Store Location*
              </label>
              <p className="text-xs text-gray-500 mt-0.5">
                For a more accurate price.
              </p>
            </div>

            {/* Segmented Switcher Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-gray-100 border border-gray-200">
              <button
                type="button"
                onClick={() => switchPinMethod("search")}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  pinMethod === "search"
                    ? "bg-white text-gray-900 shadow-xs border border-gray-200"
                    : "text-gray-500 hover:text-gray-900 hover:bg-white/50"
                }`}
              >
                <svg
                  className={`w-3.5 h-3.5 ${
                    pinMethod === "search"
                      ? "text-[var(--brand-primary)]"
                      : "text-gray-400"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <span>Search Address</span>
              </button>

              <button
                type="button"
                onClick={() => switchPinMethod("gps")}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  pinMethod === "gps"
                    ? "bg-white text-gray-900 shadow-xs border border-gray-200"
                    : "text-gray-500 hover:text-gray-900 hover:bg-white/50"
                }`}
              >
                <svg
                  className={`w-3.5 h-3.5 ${
                    pinMethod === "gps"
                      ? "text-emerald-600"
                      : "text-gray-400"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="7" strokeWidth="2" />
                  <circle cx="12" cy="12" r="3" fill="currentColor" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 2v3m0 14v3M2 12h3m14 0h3"
                  />
                </svg>
                <span>Current Location</span>
              </button>
            </div>

            {/* Short hint & tradeoff */}
            <p className="mt-2 text-xs text-gray-500">
              {pinMethod === "search"
                ? "Works on any device without GPS, but may miss unmapped or new streets."
                : "Pins exact doorstep coordinates, but requires being at the spot with GPS enabled."}
            </p>

            {/* Direct Fallback Prompt */}
            <p className="mt-1 text-xs text-gray-500">
              Not working?{" "}
              <button
                type="button"
                onClick={() =>
                  switchPinMethod(pinMethod === "search" ? "gps" : "search")
                }
                className="font-semibold text-[var(--brand-primary)] hover:underline cursor-pointer"
              >
                Use the other option instead
              </button>
            </p>
          </div>

          {/* ========================================================== */}
          {/* FLOW 1: SEARCH FLOW */}
          {/* ========================================================== */}
          {pinMethod === "search" && (
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">
                Search Delivery Address *
              </label>
              <AddressAutocomplete
                value={currentAddressForm.shippingAddress}
                countryCode={currentAddressForm.country}
                hasCoordinates={hasCoordinates}
                placeholder="Start typing your street address, e.g. 14 Allen Avenue, Ikeja"
                onChange={(v: string) => handleFormChange("shippingAddress", v)}
                onSelect={(suggestion) =>
                  applyAddressSuggestion(suggestion, "search")
                }
                renderNoResults={() => (
                  <div className="py-2.5 px-3 text-center text-xs text-gray-600 space-y-1">
                    <p>No exact match found in registry.</p>
                    <p className="text-gray-500">
                      Not working?{" "}
                      <button
                        type="button"
                        onClick={() => switchPinMethod("gps")}
                        className="font-semibold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                      >
                        Use the other option instead
                      </button>
                    </p>
                  </div>
                )}
              />
              <p className="text-[11px] text-gray-500">
                Pick a suggestion from the dropdown to automatically attach
                coordinates for your dispatch courier.
              </p>
            </div>
          )}

          {/* ========================================================== */}
          {/* FLOW 2: CURRENT LOCATION FLOW */}
          {/* ========================================================== */}
          {pinMethod === "gps" && (
            <div className="space-y-3">
              {/* Trigger Card when not yet captured */}
              {(!hasCoordinates || currentAddressForm?.pinSource !== "gps") && (
                <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/60 p-5 text-center">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <circle cx="12" cy="12" r="7" strokeWidth="2" />
                      <circle cx="12" cy="12" r="3" fill="currentColor" />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 2v3m0 14v3M2 12h3m14 0h3"
                      />
                    </svg>
                  </div>
                  <h4 className="text-sm font-bold text-gray-900">
                    Capture Delivery Spot Coordinates
                  </h4>
                  <p className="text-xs text-gray-600 mt-1 max-w-sm mx-auto">
                    Stand at your delivery destination and tap below to pin your
                    live GPS coordinates. Couriers navigate directly to this
                    spot.
                  </p>

                  <button
                    type="button"
                    onClick={handleCaptureGps}
                    disabled={gpsStatus === "loading"}
                    className="mt-3.5 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium text-xs shadow-sm transition cursor-pointer"
                  >
                    {gpsStatus === "loading" ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>
                          {liveAccuracy != null
                            ? `Acquiring fix… ±${formatAccuracy(liveAccuracy)}`
                            : "Getting GPS location…"}
                        </span>
                      </>
                    ) : (
                      <>
                        <span>📍 Use My Current Location</span>
                      </>
                    )}
                  </button>

                  <p className="text-[10px] text-gray-400 mt-2">
                    Ensure browser location permissions are allowed when prompted.
                  </p>

                  <p className="text-[11px] text-gray-500 mt-2 pt-2 border-t border-gray-200/70">
                    Not working?{" "}
                    <button
                      type="button"
                      onClick={() => switchPinMethod("search")}
                      className="font-semibold text-emerald-800 hover:underline cursor-pointer"
                    >
                      Use the other option instead
                    </button>
                  </p>
                </div>
              )}

              {/* Error Box */}
              {gpsStatus === "error" && gpsError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                  <div className="flex items-start gap-2">
                    <span className="text-base leading-none">⚠️</span>
                    <div className="flex-1">
                      <p className="font-semibold text-red-900">
                        Location Capture Issue
                      </p>
                      <p className="mt-0.5 leading-relaxed">{gpsError}</p>
                      <div className="mt-2.5 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCaptureGps}
                          className="px-3 py-1 bg-white border border-red-300 text-red-700 rounded-md font-semibold text-[11px] hover:bg-red-50 transition cursor-pointer"
                        >
                          Try Again
                        </button>
                        <button
                          type="button"
                          onClick={() => switchPinMethod("search")}
                          className="px-3 py-1 bg-red-600 text-white rounded-md font-semibold text-[11px] hover:bg-red-700 transition cursor-pointer"
                        >
                          Use the other option instead
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================== */}
          {/* PINNED STATUS CONFIRMATION CARD (FOR BOTH SEARCH & GPS) */}
          {/* ========================================================== */}
          {hasCoordinates && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 sm:p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                    ✓
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                      {currentAddressForm.pinSource === "gps"
                        ? "Delivery Location Pinned via GPS"
                        : "Delivery Location Pinned via Search"}
                    </p>

                    {/* Resolved address or coordinates */}
                    {resolvingAddress ? (
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-emerald-700">
                        <span className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                        Looking up address from coordinates…
                      </p>
                    ) : resolvedAddress || currentAddressForm.shippingAddress ? (
                      <p className="mt-0.5 text-xs font-semibold text-emerald-900 truncate">
                        {resolvedAddress || currentAddressForm.shippingAddress}
                      </p>
                    ) : (
                      <p className="mt-0.5 font-mono text-[11px] text-emerald-800">
                        {currentAddressForm.latitude},{" "}
                        {currentAddressForm.longitude}
                      </p>
                    )}

                    {/* Source / Accuracy details */}
                    <p className="mt-1 text-[11px] text-emerald-700">
                      {currentAddressForm.pinSource === "gps"
                        ? gpsAccuracy != null
                          ? `Direct satellite fix — accurate to within ±${formatAccuracy(
                              gpsAccuracy,
                            )}`
                          : "Direct satellite fix from your device"
                        : "Pin coordinates matched from address search"}
                    </p>
                  </div>
                </div>

                {/* Recapture or switch button */}
                <div className="shrink-0 flex flex-col items-end gap-1">
                  {pinMethod === "gps" ? (
                    <button
                      type="button"
                      onClick={handleCaptureGps}
                      disabled={gpsStatus === "loading"}
                      className="px-2.5 py-1 rounded-md border border-emerald-400 bg-white hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition cursor-pointer"
                    >
                      {gpsStatus === "loading" ? "Acquiring…" : "Recapture"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => switchPinMethod("gps")}
                      className="text-[11px] font-semibold text-emerald-700 hover:underline cursor-pointer"
                    >
                      Use GPS instead
                    </button>
                  )}
                </div>
              </div>

              {/* Approximate warning if GPS accuracy > 100m */}
              {currentAddressForm.pinSource === "gps" &&
                gpsAccuracy != null &&
                gpsAccuracy > GOOD_ACCURACY_M && (
                  <div className="mt-2 pt-2 border-t border-emerald-200/80 text-[11px] text-amber-800 flex items-start gap-1.5">
                    <span>⚠️</span>
                    <span>
                      This GPS pin is approximate (±{formatAccuracy(gpsAccuracy)}
                      ). If possible, move outdoors for a tighter satellite lock,
                      or switch to Search Address.
                    </span>
                  </div>
                )}
            </div>
          )}

          {/* ========================================================== */}
          {/* STREET ADDRESS INPUT (EDITABLE NOTES / COMPONENT) */}
          {/* ========================================================== */}
          {pinMethod === "gps" && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Street Address / Apartment / Gate Notes *
              </label>
              <textarea
                rows={2}
                placeholder="e.g. 14 Allen Avenue, Flat 4B, Opposite FCMB Bank"
                value={currentAddressForm.shippingAddress}
                onChange={(e) =>
                  handleFormChange("shippingAddress", e.target.value)
                }
                className="w-full px-4 py-2.5 bg-[#f0f0f0] border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20 resize-none placeholder-gray-500 text-sm"
              />
              <p className="mt-1 text-[11px] text-gray-500">
                Your GPS coordinates guide the rider to your building. Add your
                flat number, floor, or gate color above.
              </p>
            </div>
          )}

          {/* Country & State */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Country *
              </label>
              <select
                value={currentAddressForm.country}
                onChange={(e) => handleFormChange("country", e.target.value)}
                className="w-full px-4 py-2.5 bg-[#f0f0f0] border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20 placeholder-gray-500 text-sm"
              >
                <option value="">Select country</option>
                {countryList.map((c: any) => (
                  <option key={c.isoCode} value={c.isoCode}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                State / Region *
              </label>
              <select
                value={currentAddressForm.state}
                onChange={(e) => handleFormChange("state", e.target.value)}
                className="w-full px-4 py-2.5 bg-[#f0f0f0] border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20 placeholder-gray-500 text-sm"
                disabled={!stateList?.length}
              >
                <option value="">Select state</option>
                {stateList.map((s: any) => (
                  <option key={s.isoCode} value={s.isoCode}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* City */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              City (Optional)
            </label>
            <select
              value={currentAddressForm.city}
              onChange={(e) => handleFormChange("city", e.target.value)}
              className="w-full px-4 py-2.5 bg-[#f0f0f0] border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20 placeholder-gray-500 text-sm"
              disabled={!cityList.length}
            >
              <option value="">Select city</option>
              {cityList.map((ct: any) => (
                <option key={ct.name} value={ct.name}>
                  {ct.name}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                stopWatching();
                setShowAddressModal(false);
                setEditAddress(null);
              }}
              className="flex-1 bg-gray-100 text-gray-800 py-3 rounded-full hover:bg-gray-200 transition cursor-pointer font-medium text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                stopWatching();
                handleAddressSave({ ...currentAddressForm });
              }}
              className="flex-1 bg-[var(--brand-primary)] text-[var(--brand-on-primary)] py-3 rounded-full hover:opacity-90 transition cursor-pointer font-medium text-sm shadow-xs"
            >
              Save Address
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Contact;
