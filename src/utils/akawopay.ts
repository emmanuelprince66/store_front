/**
 * Where a buyer without an Akawopay account goes to open one and finish KYC.
 *
 * Kept in one place because two screens link to it — the first-time activation
 * modal and the PIN field — and a signup URL that works in one but 404s in the
 * other is the kind of drift nobody notices until a customer is stuck at
 * checkout with no way to get a PIN.
 */
export const AKAWOPAY_SIGNUP_URL = "https://web.akawopay.com/create-account";

/**
 * Whether a phone looks dialable. Deliberately loose — 0801..., +234801... and
 * 234801... all reach the same account, and rejecting a real number here would
 * block a sale that Akawopay itself would have accepted.
 */
export const isValidAkawopayPhone = (value: string) =>
  /^\+?\d{10,14}$/.test(value.replace(/[\s()-]/g, ""));
