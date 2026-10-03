import type { OrderSummary } from "../useCheckoutHook";

interface PaymentSuccessModalProps {
  order: OrderSummary;
  onContinue: () => void;
}

export const PaymentSuccessModal = ({
  order,
  onContinue,
}: PaymentSuccessModalProps) => (
  <div className="p-8 text-center">
    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand-surface)]">
      <svg
        className="h-8 w-8 text-[var(--brand-primary)]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M5 13l4 4L19 7"
        />
      </svg>
    </div>

    <h2 className="text-2xl font-bold text-gray-900">
      Payment Confirmed
    </h2>
    <p className="mt-2 text-sm text-gray-600">
      Your payment was confirmed and your order is being processed.
    </p>

    {order.reference && (
      <p className="mt-4 text-sm text-gray-500">
        Order reference:{" "}
        <span className="font-semibold text-[var(--brand-primary)]">
          {order.reference}
        </span>
      </p>
    )}

    <button
      type="button"
      onClick={onContinue}
      className="mt-8 w-full rounded-full bg-[var(--brand-primary)] py-3.5 font-medium text-[var(--brand-on-primary)] transition hover:opacity-90"
    >
      View Order Summary
    </button>
  </div>
);
