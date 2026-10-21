import type { ReactNode } from "react";
import { FiAlertCircle, FiCalendar, FiClock, FiCreditCard, FiFileText, FiX } from "react-icons/fi";
import type { ServicePolicy } from "../../api/services";
import { Modal } from "../Modal";

const plural = (value: number, unit: string) =>
  `${value} ${unit}${value === 1 ? "" : "s"}`;

type PolicySection = {
  key: string;
  icon: ReactNode;
  title: string;
  body: ReactNode;
  tone?: "warning";
};

/** Builds the customer-facing policy sections from the raw API fields. */
const buildSections = (
  policy: ServicePolicy,
  formatAmount: (amount: number | string) => string,
  includeDeposit: boolean,
): PolicySection[] => {
  const sections: PolicySection[] = [
    {
      key: "notice",
      icon: <FiClock className="h-4 w-4" />,
      title: "Advance notice",
      body:
        policy.min_notice_hours > 0
          ? `Bookings must be made at least ${plural(policy.min_notice_hours, "hour")} ahead.`
          : "Bookings can be made up to the start time.",
    },
  ];

  if (includeDeposit && policy.min_deposit_percentage != null) {
    const amount =
      policy.min_deposit_amount != null && policy.min_deposit_amount !== ""
        ? ` (${formatAmount(policy.min_deposit_amount)})`
        : "";
    sections.push({
      key: "deposit",
      icon: <FiCreditCard className="h-4 w-4" />,
      title: "Deposit",
      tone: policy.is_deposit_non_refundable ? "warning" : undefined,
      body: (
        <>
          A minimum {policy.min_deposit_percentage}% deposit{amount} secures
          your booking.
          {policy.is_deposit_non_refundable && (
            <strong className="mt-1 block font-semibold">
              Deposits are strictly non-refundable.
            </strong>
          )}
        </>
      ),
    });
  }

  sections.push({
    key: "cancellation",
    icon: <FiCalendar className="h-4 w-4" />,
    title: "Cancellation",
    tone: policy.cancellation_window_hours === 0 ? "warning" : undefined,
    body:
      policy.cancellation_window_hours === 0
        ? "Cancellations are not allowed once a booking is made. You can still reschedule."
        : `Cancellations must be made at least ${plural(policy.cancellation_window_hours, "hour")} before the scheduled time.`,
  });

  if (policy.custom_policy_text) {
    sections.push({
      key: "terms",
      icon: <FiFileText className="h-4 w-4" />,
      title: "Special terms",
      body: (
        <span className="whitespace-pre-line">{policy.custom_policy_text}</span>
      ),
    });
  }

  return sections;
};

const SectionList = ({ sections }: { sections: PolicySection[] }) => (
  <ul className="space-y-3">
    {sections.map((section) => (
      <li key={section.key} className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            section.tone === "warning"
              ? "bg-amber-50 text-amber-700"
              : "bg-[var(--brand-surface)] text-[var(--brand-primary)]"
          }`}
        >
          {section.icon}
        </span>
        <div className="min-w-0 text-sm">
          <p className="font-semibold text-gray-900">{section.title}</p>
          <div className="mt-0.5 leading-relaxed text-gray-600">{section.body}</div>
        </div>
      </li>
    ))}
  </ul>
);

/** Compact policy card shown while picking a slot. */
export const BookingPolicySummary = ({
  policy,
  formatAmount,
  showDeposit,
  onViewFull,
}: {
  policy: ServicePolicy;
  formatAmount: (amount: number | string) => string;
  showDeposit: boolean;
  onViewFull: () => void;
}) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
    <div className="mb-4 flex items-center justify-between gap-3">
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
        Booking policy
      </h3>
      <button
        type="button"
        onClick={onViewFull}
        className="cursor-pointer text-xs font-semibold text-[var(--brand-primary)] underline-offset-2 hover:underline"
      >
        View full policy
      </button>
    </div>
    <SectionList sections={buildSections(policy, formatAmount, showDeposit)} />
  </div>
);

export const BookingPolicyModal = ({
  isOpen,
  onClose,
  policy,
  formatAmount,
  showDeposit,
  businessName,
}: {
  isOpen: boolean;
  onClose: () => void;
  policy: ServicePolicy;
  formatAmount: (amount: number | string) => string;
  showDeposit: boolean;
  businessName?: string;
}) => (
  <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg">
    <div role="dialog" aria-modal="true" aria-labelledby="booking-policy-title">
      <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-5">
        <div>
          <h2 id="booking-policy-title" className="text-lg font-bold text-gray-900">
            Booking &amp; cancellation policy
          </h2>
          {businessName && (
            <p className="mt-0.5 text-xs text-gray-500">Set by {businessName}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close policy"
          className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
        >
          <FiX className="h-4 w-4" />
        </button>
      </div>
      <div className="p-5">
        <SectionList sections={buildSections(policy, formatAmount, showDeposit)} />
      </div>
      <div className="border-t border-gray-100 p-5">
        <button
          type="button"
          onClick={onClose}
          className="w-full cursor-pointer rounded-full bg-[var(--brand-primary)] py-3 text-sm font-semibold text-[var(--brand-on-primary)] transition hover:opacity-90"
        >
          Got it
        </button>
      </div>
    </div>
  </Modal>
);

/** Required "I agree" checkbox shown above the pay button. */
export const BookingPolicyAgreement = ({
  checked,
  onChange,
  onViewPolicy,
  depositNonRefundable,
  cancellationNote,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  onViewPolicy: () => void;
  depositNonRefundable: boolean;
  /** e.g. "Free cancellation until Tue, Oct 21 · 9:00 AM" for the chosen slot. */
  cancellationNote?: string | null;
}) => (
  <div className="space-y-2">
    {cancellationNote && (
      <p className="flex items-start gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs leading-relaxed text-gray-700">
        <FiCalendar className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {cancellationNote}
      </p>
    )}
    {depositNonRefundable && (
      <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
        <FiAlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Deposits for this business are non-refundable if you cancel.
      </p>
    )}
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[var(--brand-primary)]"
      />
      <span>
        I agree to the{" "}
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            onViewPolicy();
          }}
          className="cursor-pointer font-semibold text-[var(--brand-primary)] underline underline-offset-2"
        >
          cancellation and booking policy
        </button>
        .
      </span>
    </label>
  </div>
);
