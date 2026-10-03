import { AKAWOPAY_SIGNUP_URL, isValidAkawopayPhone } from "../utils/akawopay";

interface PaymentPinFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** The order's phone, which is what Akawopay charges against. */
  phone: string;
  onPhoneChange: (value: string) => void;
  onPhoneBlur?: () => void;
  /** Out-store the phone is also the rider's contact, so the copy says so. */
  flow: "in-store" | "out-store";
}

/**
 * Akawopay transaction PIN entry.
 *
 * Shared by the in-store and out-store flows so the security copy and the 4–6
 * digit rule can't drift apart between them. The value is held in component
 * state only — it is never persisted and never lands in an order snapshot.
 */
export const PaymentPinField = ({
  value,
  onChange,
  phone,
  onPhoneChange,
  onPhoneBlur,
  flow,
}: PaymentPinFieldProps) => {
  const phoneLooksWrong = phone.length > 0 && !isValidAkawopayPhone(phone);

  return (
    <div className="mb-6 space-y-4 rounded-xl border-2 border-gray-200 bg-[#f0f0f0] p-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-800">
          Akawopay Buy Now, Pay Later
        </h3>
        <p className="mt-1 text-xs text-gray-600">
          Akawopay will check your credit and confirm in a few seconds.
        </p>
      </div>

      <div>
        <label
          htmlFor="akawopay-pin"
          className="mb-1 block text-xs font-medium text-gray-700"
        >
          Akawopay PIN *
        </label>
        <input
          id="akawopay-pin"
          name="akawopay-pin"
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          placeholder="4 to 6 digits"
          value={value}
          onChange={(event) => {
            const digits = event.target.value.replace(/\D/g, "");
            if (digits.length <= 6) onChange(digits);
          }}
          maxLength={6}
          className="w-full rounded-lg border border-gray-800 bg-[#f0f0f0] px-4 py-2.5 text-sm placeholder-gray-500 focus:outline-none "
        />
        {value.length > 0 && value.length < 4 && (
          <p className="mt-1 text-xs text-red-600">
            Your PIN is at least 4 digits.
          </p>
        )}

        {/* Under the PIN and prefilled: for most buyers their Akawopay number
            is the one they already gave, so the common case is no typing.
            There is no separate Akawopay field on the API — it charges the
            order's own phone — so this edits THAT phone rather than holding a
            second number the backend would silently ignore. */}
        <label
          htmlFor="akawopay-phone"
          className="mb-1 mt-4 block text-xs font-medium text-gray-700"
        >
          Akawopay phone number *
        </label>
        <input
          id="akawopay-phone"
          name="akawopay-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="e.g. 08012345678"
          value={phone}
          onChange={(event) => onPhoneChange(event.target.value)}
          onBlur={onPhoneBlur}
          className="w-full rounded-lg border border-gray-800 bg-[#f0f0f0] px-4 py-2.5 text-sm placeholder-gray-500 focus:outline-none "
        />
        {phoneLooksWrong ? (
          <p className="mt-1 text-xs text-red-600">
            Enter the phone number on your Akawopay account.
          </p>
        ) : (
          <p className="mt-1 text-xs text-gray-600">
            {flow === "out-store"
              ? "Filled in from your delivery details. If your Akawopay account uses a different number, change it here — the delivery rider will also use this number to reach you."
              : "Filled in from your details. If your Akawopay account uses a different number, change it here."}
          </p>
        )}

        {/* Always here, unlike the first-time activation modal, which is shown
          once per store and then remembered. Without this a buyer who tapped
          past that modal — or who comes back weeks later on the same phone —
          faces a PIN field with no way to get a PIN. */}
        <p className="mt-3 text-xs text-gray-600">
          No Akawopay account?{" "}
          <a
            href={AKAWOPAY_SIGNUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[var(--brand-primary)] underline"
          >
            Set one up
          </a>{" "}
          — you'll need one with completed KYC to pay later.
        </p>
      </div>

      <p className="flex items-start gap-2 text-xs text-gray-600">
        <svg
          className="mt-0.5 h-4 w-4 flex-shrink-0 text-black"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        Only ever enter this on your own device. Staff will never ask you for
        it.
      </p>
    </div>
  );
};
