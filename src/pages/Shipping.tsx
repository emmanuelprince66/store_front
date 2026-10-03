// ============================================
// FILE: pages/Shipping.tsx
// Inline courier list rendered directly in the checkout (no modal).
// ============================================

const formatFee = (amount: string, currency = "₦") => {
  const symbol = currency === "NGN" ? "₦" : currency || "₦";
  return `${symbol}${Number(amount || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const CourierOptions = ({
  shippingOptions,
  selectedShipping,
  handleShippingSelect,
  isFetchingRates,
  ratesError,
  refetchShipmentRates,
}: any) => {
  // Loading skeletons
  if (isFetchingRates) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-2xl border-2 border-gray-100 p-4"
          >
            <div className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-32 animate-pulse rounded bg-gray-200" />
              <div className="h-2.5 w-24 animate-pulse rounded bg-gray-100" />
            </div>
            <div className="h-3 w-14 animate-pulse rounded bg-gray-200" />
          </div>
        ))}
        <p className="pt-1 text-center text-sm text-gray-500">
          Fetching delivery options…
        </p>
      </div>
    );
  }

  // Error / empty with retry
  if (ratesError) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 py-8 text-center">
        <p className="mb-4 px-4 text-sm text-gray-600">{ratesError}</p>
        {refetchShipmentRates && (
          <button
            onClick={() => refetchShipmentRates()}
            className="rounded-full bg-[var(--brand-primary)] px-6 py-2.5 text-sm font-medium text-[var(--brand-on-primary)] transition hover:opacity-90"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  if (!shippingOptions || shippingOptions.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-gray-500">
        No delivery options available
      </p>
    );
  }

  return (
    <div className="space-y-4 mb-3 gap-3 flex flex-col">
      {shippingOptions.map((option: any) => {
        const isSelected = selectedShipping?.id === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => handleShippingSelect(option)}
            className={`flex w-full cursor-pointer items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all ${
              isSelected
                ? "border-[var(--brand-primary)] bg-[var(--brand-surface)]"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            {/* Courier logo */}
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white border border-gray-100">
              {option.image ? (
                <img
                  src={option.image}
                  alt={option.location}
                  className="h-full w-full object-contain p-1"
                />
              ) : (
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1h4m0 0V8a1 1 0 011-1h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1"
                  />
                </svg>
              )}
            </div>

            {/* Name + ETA + meta */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-black">
                  {option.location}
                </p>
                {option.discountPercentage > 0 && (
                  <span className="shrink-0 rounded-full bg-[#FF3333]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#FF3333]">
                    -{option.discountPercentage}%
                  </span>
                )}
              </div>
              {option.description && (
                <p className="truncate text-xs text-gray-500">
                  {option.description}
                </p>
              )}
              <div className="mt-0.5 flex items-center gap-2">
                {typeof option.rating === "number" && (
                  <span className="flex items-center gap-0.5 text-[11px] text-gray-500">
                    <svg
                      className="h-3 w-3 text-[#FFC633]"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.96a1 1 0 00.95.69h4.165c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.96c.3.922-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.196-1.539-1.118l1.287-3.96a1 1 0 00-.364-1.118L2.05 9.387c-.783-.57-.38-1.81.588-1.81h4.166a1 1 0 00.95-.69l1.285-3.96z" />
                    </svg>
                    {option.rating}
                  </span>
                )}
                {option.codAvailable && (
                  <span className="rounded-full bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-700">
                    COD
                  </span>
                )}
              </div>
            </div>

            {/* Price + selected check */}
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="text-sm font-bold text-[var(--brand-primary)]">
                {formatFee(option.amount, option.currency)}
              </span>
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                  isSelected
                    ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]"
                    : "border-gray-300"
                }`}
              >
                {isSelected && (
                  <svg
                    className="h-3 w-3 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default CourierOptions;
