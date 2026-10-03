// Heroicons outline paths, kept as data so payment buttons can be mapped.
export const ICON_CARD =
  "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z";
export const ICON_CLOCK = "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z";
export const ICON_COUNTER =
  "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z";

export interface PaymentOption<TValue extends string> {
  value: TValue;
  label: string;
  /** One of the ICON_* path constants above. */
  icon: string;
  disabled?: boolean;
  /** Why it's unavailable. Shown under the label, so say something useful. */
  reason?: string;
}

interface PaymentOptionGridProps<TValue extends string> {
  label: string;
  options: PaymentOption<TValue>[];
  selected: TValue;
  onSelect: (value: TValue) => void;
}

/**
 * The payment method picker, shared by the in-store and out-store flows.
 *
 * Unavailable methods are rendered disabled rather than dropped. A buyer who
 * has used Pay Later at another store should be able to see that it exists
 * here and isn't on offer — a method that silently vanishes reads as a broken
 * page, and the layout no longer reshuffles as store settings load in.
 */
export const PaymentOptionGrid = <TValue extends string>({
  label,
  options,
  selected,
  onSelect,
}: PaymentOptionGridProps<TValue>) => (
  <div className="space-y-3 mb-6">
    <label className="block text-sm font-medium text-gray-700 mb-3">
      {label}
    </label>

    <div
      className={`grid gap-3 ${
        options.length > 2 ? "grid-cols-3" : "grid-cols-2"
      }`}
    >
      {options.map((option) => {
        const isSelected = !option.disabled && selected === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            disabled={option.disabled}
            title={option.disabled ? option.reason : undefined}
            aria-label={
              option.disabled && option.reason
                ? `${option.label} — ${option.reason}`
                : option.label
            }
            className={`py-4 px-3 rounded-2xl font-medium transition border-2 ${
              option.disabled
                ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                : isSelected
                  ? "bg-[var(--brand-primary)] border-[var(--brand-primary)] text-[var(--brand-on-primary)] cursor-pointer"
                  : "border-gray-300 text-gray-700 hover:border-gray-400 cursor-pointer"
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d={option.icon}
                />
              </svg>
              <span className="text-sm leading-tight">{option.label}</span>
              {option.disabled && option.reason && (
                <span className="text-[10px] leading-tight text-gray-400">
                  {option.reason}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  </div>
);
