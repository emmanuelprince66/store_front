import { AKAWOPAY_SIGNUP_URL } from "../utils/akawopay";

interface BnplActivationProps {
  /** Dismisses the screen and leaves Pay Later selected. */
  onProceed: () => void;
}

/**
 * Shown the first time a buyer picks Pay Later.
 *
 * BNPL fails at submit for anyone without a verified AkawoPay account, and the
 * API's "Invalid PIN" doesn't tell them that — it reads as a typo, not a
 * missing account. Explaining the requirement before the PIN field turns a
 * dead end into a signup. Shown once per store and then remembered, so repeat
 * buyers aren't nagged.
 */
export const BnplActivation = ({ onProceed }: BnplActivationProps) => (
  <div className="p-6">
    <div className="mb-5 flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f0f0f0]">
        <svg
          className="h-5 w-5 text-black"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </span>
      <div>
        <h2 className="font-display text-xl uppercase tracking-wide text-[var(--brand-primary)]">
          Activate Buy Now, Pay Later
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          To use Buy Now, Pay Later, you need an AkawoPay account with completed
          KYC.
        </p>
      </div>
    </div>

    <div className="space-y-3">
      <div className="rounded-xl border border-gray-200 bg-[#f0f0f0] p-4">
        <p className="text-sm font-semibold text-black">New to AkawoPay?</p>
        <p className="mt-1 text-xs leading-relaxed text-gray-600">
          Create and verify your account to access up to ₦50,000 in credit.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 p-4">
        <p className="text-sm font-semibold text-black">
          Already have an AkawoPay account?
        </p>
        <p className="mt-1 text-xs leading-relaxed text-gray-600">
          You can proceed directly to checkout.
        </p>
      </div>
    </div>

    <div className="mt-6 space-y-3">
      <a
        href={AKAWOPAY_SIGNUP_URL}
        target="_blank"
        // noreferrer alongside noopener: the buyer is mid-checkout, and the
        // new tab has no business reaching back into this one.
        rel="noopener noreferrer"
        className="block w-full rounded-full border-2 border-[var(--brand-primary)] py-3 text-center text-sm font-semibold text-[var(--brand-primary)] transition hover:bg-[#f0f0f0]"
      >
        Create AkawoPay Account
      </a>

      <button
        onClick={onProceed}
        className="w-full cursor-pointer rounded-full bg-[var(--brand-primary)] py-3.5 text-sm font-semibold text-[var(--brand-on-primary)] transition hover:opacity-90"
      >
        Proceed to Checkout
      </button>
    </div>
  </div>
);
