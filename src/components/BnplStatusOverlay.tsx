import type { BnplStage } from "../useCheckoutHook";

interface BnplStatusOverlayProps {
  stage: BnplStage;
  message: string;
  /** Dismisses the overlay so another payment method can be chosen. */
  onDismiss: () => void;
}

/**
 * Blocking overlay shown while Akawopay decides on an out-store order.
 *
 * Authorization is asynchronous — the charge is initiated, then a webhook
 * settles it — so there is a real wait with nothing to show but progress.
 * It is intentionally not dismissible while authorizing: closing it would
 * abandon a charge that is already in flight against the buyer's credit.
 */
export const BnplStatusOverlay = ({
  stage,
  message,
  onDismiss,
}: BnplStatusOverlayProps) => {
  if (stage === "idle" || stage === "approved") return null;

  const isWaiting = stage === "authorizing";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-live="polite"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center">
        {isWaiting ? (
          <>
            <div
              className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-[var(--brand-primary)]"
              aria-hidden
            />
            <h3 className="font-display text-xl uppercase tracking-wide text-black">
              Securing your plan
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              {message || "Securing your installment plan with Akawopay..."}
            </p>
            <p className="mt-4 text-xs text-gray-500">
              This usually takes a few seconds. Please don't close this page.
            </p>
          </>
        ) : (
          <>
            <div
              className={`mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full ${
                stage === "rejected" ? "bg-red-50" : "bg-amber-50"
              }`}
            >
              <svg
                className={`h-6 w-6 ${
                  stage === "rejected" ? "text-red-600" : "text-amber-600"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d={
                    stage === "rejected"
                      ? "M6 18L18 6M6 6l12 12"
                      : "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  }
                />
              </svg>
            </div>

            <h3 className="font-display text-xl uppercase tracking-wide text-black">
              {stage === "rejected" ? "Not approved" : "Still processing"}
            </h3>
            <p className="mt-2 text-sm text-gray-600">{message}</p>

            <button
              onClick={onDismiss}
              className="mt-6 w-full cursor-pointer rounded-full bg-[var(--brand-primary)] py-3 font-medium text-[var(--brand-on-primary)] transition hover:opacity-90"
            >
              {stage === "rejected" ? "Choose another method" : "Got it"}
            </button>

            {stage === "rejected" && (
              <p className="mt-3 text-xs text-gray-500">
                Your basket is untouched — card and bank transfer are still
                available.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};
