import type { StaffOption } from "../../api/services";

export const ANY_STAFF_LABEL = "Any available attendant";

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "?";

interface StaffPickerProps {
  staff: StaffOption[];
  selectedStaffId: string | null;
  onSelect: (staffId: string | null) => void;
  disabled?: boolean;
}

/** Attendant choice for a service booking; `null` means any available attendant. */
export const StaffPicker = ({
  staff,
  selectedStaffId,
  onSelect,
  disabled = false,
}: StaffPickerProps) => {
  const options: Array<{ id: string | null; name: string; role?: string | null; image?: string | null }> = [
    { id: null, name: ANY_STAFF_LABEL, role: "First free attendant" },
    ...staff,
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
          Choose Attendant
        </h3>
        <span className="truncate text-xs font-semibold text-[var(--brand-primary)]">
          {staff.find((s) => s.id === selectedStaffId)?.name ?? "Any"}
        </span>
      </div>

      <div
        role="radiogroup"
        aria-label="Choose attendant"
        className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1 snap-x sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-4"
      >
        {options.map((option) => {
          const isSelected = option.id === selectedStaffId;
          const isAny = option.id === null;
          return (
            <button
              key={option.id ?? "__any__"}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => onSelect(option.id)}
              className={`flex min-w-[9.5rem] shrink-0 snap-start items-center gap-3 rounded-2xl border p-3 text-left transition sm:min-w-0 disabled:cursor-not-allowed disabled:opacity-60 ${
                isSelected
                  ? "border-[var(--brand-primary)] bg-[var(--brand-surface)] ring-2 ring-[var(--brand-primary)] shadow-sm"
                  : "border-gray-200 bg-white hover:border-[var(--brand-primary)]"
              }`}
            >
              {option.image ? (
                <img
                  src={option.image}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    isSelected
                      ? "bg-[var(--brand-primary)] text-[var(--brand-on-primary)]"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {isAny ? "★" : getInitials(option.name)}
                </span>
              )}
              <span className="min-w-0">
                <span
                  className={`block truncate text-xs font-bold ${
                    isSelected ? "text-[var(--brand-primary)]" : "text-gray-900"
                  }`}
                >
                  {isAny ? "Any available" : option.name}
                </span>
                {option.role && (
                  <span className="block truncate text-[10px] text-gray-500">
                    {option.role}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
