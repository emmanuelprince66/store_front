// Typed wrappers over the Sync360 order endpoints used by the storefront.
//
// Paths here are the ones the API actually serves (verified against the live
// OpenAPI schema at https://api.sync360.africa/?format=openapi). The BNPL
// integration guide circulated a different set — /order/instore/draft/,
// /order/instore/lookup/{code}/ and /order/confirm-order-payment/{ref}/ — and
// all three 404. The response *shapes* in that guide are accurate; only the
// routes were stale, so don't "fix" these back to match the document.

import { ApiError, apiRequest } from "./client";

// ---- Shared -----------------------------------------------------------

export type PaymentMethod = "BANK-TRANSFER" | "CARD" | "BNPL" | "COD";

/** In-store uses its own vocabulary: payment_type, not payment_method. */
export type InStorePaymentType = "COUNTER" | "ONLINE" | "BNPL";

/** Akawopay PINs are 4 to 6 digits — card PINs remain exactly 4. */
export const PAYMENT_PIN_PATTERN = /^\d{4,6}$/;

export interface CheckoutProduct {
  product_id: string;
  /** Combo products carry no per-unit quantity — the key is omitted for them. */
  quantity?: number;
  unit_price?: number;
  discount?: number;
  /** Not in the published schema, but the out-store flow has always sent it
   * alongside the variation UUID in `product_id`. Left as-is: this endpoint
   * works today and BNPL is not the change to renegotiate it under. */
  variation_id?: string;
}

export interface DeliveryAddressPayload {
  first_name: string;
  last_name: string;
  phone: string;
  alt_phone?: string | null;
  email: string;
  shipping_address: string;
  country: string;
  state: string;
  city?: string | null;
  latitude?: string;
  longitude?: string;
}

// ---- Out-store checkout ----------------------------------------------

interface OutstorePaymentFields {
  payment_method: PaymentMethod;
  card_number?: string;
  expiry_date?: string;
  card_pin?: string;
  cvv?: string;
  /** Required when payment_method is "BNPL". */
  payment_pin?: string;
}

/** POST /order/business/{business_id}/outstore-checkout/ — static shipping. */
export interface LegacyOutstoreCheckoutPayload extends OutstorePaymentFields {
  products: CheckoutProduct[];
  address: DeliveryAddressPayload;
  note?: string;
  /**
   * Omitted for collection — there is no courier to pick. Sending an empty
   * one would look like a delivery whose option was never chosen.
   */
  shipping_id?: string;
  /**
   * Collection bypasses couriers entirely, so even a Shipbubble store posts
   * here with "PICKUP" rather than going through the rate flow.
   */
  delivery_type?: "IN-HOUSE" | "SHIPBUBBLE" | "PICKUP";
  referral_code?: string;
}

/** POST /order/outstore-checkout/{reference}/ — Shipbubble couriers. */
export interface ShipbubbleOutstoreCheckoutPayload
  extends OutstorePaymentFields {
  request_token: string;
  service_code: string;
  courier_id: string;
}

/**
 * Union of every shape the checkout endpoints return. Which fields are present
 * depends on the payment method, so callers must narrow before reading.
 */
export interface CheckoutResponse {
  /** "pending" for BNPL, "otp" when a card needs verification, else "success". */
  message?: string;
  reference?: string;
  /** BNPL only — the Akawopay charge handle. Poll with `reference`, not this. */
  charge_id?: string;
  amount?: string;
  account_number?: string;
  account_name?: string;
  bank_name?: string;
  bank_details?: {
    account_number?: string;
    account_name?: string;
    bank_name?: string;
    amount?: string;
  };
}

export const checkoutOutstoreLegacy = (
  businessId: string,
  payload: LegacyOutstoreCheckoutPayload,
) =>
  apiRequest<CheckoutResponse>(
    `/order/business/${businessId}/outstore-checkout/`,
    { method: "POST", body: payload, errorMessage: "Failed to place order" },
  );

export const checkoutOutstoreShipbubble = (
  reference: string,
  payload: ShipbubbleOutstoreCheckoutPayload,
) =>
  apiRequest<CheckoutResponse>(
    `/order/outstore-checkout/${encodeURIComponent(reference)}/`,
    { method: "POST", body: payload, errorMessage: "Failed to place order" },
  );

// ---- In-store draft ---------------------------------------------------

/**
 * One line on an in-store draft.
 *
 * Note the shape change from the old in-store payload: variations now go in
 * `variation_id` with the *parent* product in `product_id`. The previous code
 * put the variation UUID in `product_id`, which this endpoint rejects.
 * `quantity` is a decimal string per the schema.
 */
export interface InStoreDraftItem {
  product_id: string;
  quantity: string;
  variation_id?: string | null;
  unit_price?: string | null;
  discount?: string | null;
}

/** POST /order/business/{business_id}/instore-checkout/ */
export interface InStoreDraftPayload {
  items: InStoreDraftItem[];
  payment_type: InStorePaymentType;
  /** Required when payment_type is "BNPL". */
  payment_pin?: string;
  /** Required when payment_type is "BNPL" — must be registered with Akawopay. */
  customer_phone?: string;
  customer_name?: string;
  customer_email?: string;
  customer_address?: string;
  table_or_room?: string;
  note?: string;
}

export interface VirtualAccount {
  account_number?: string;
  account_name?: string;
  bank_name?: string;
  amount?: string;
}

export type InStoreDraftStatus =
  | "UNPAID"
  | "PENDING_ONLINE_PAYMENT"
  | "PENDING_BNPL_AUTHORIZATION"
  | "BNPL_APPROVED"
  | "BNPL_REJECTED"
  | "PAID";

export interface InStoreDraftResponse {
  message?: string;
  /** The code the buyer shows the cashier, e.g. "INS-9482". */
  order_code: string;
  qr_code_data?: { business_id?: string; code?: string; type?: string };
  total_amount?: string;
  item_count?: number;
  status?: InStoreDraftStatus;
  /** Null on non-BNPL drafts, not absent — observed on a live COUNTER draft. */
  bnpl_status?: "PENDING" | "APPROVED" | "REJECTED" | null;
  payment_type?: InStorePaymentType;
  /** Both of these come back null (not absent) on a COUNTER draft. */
  bank_accounts?: VirtualAccount[] | null;
  vfd_virtual_account?: VirtualAccount | null;
  /** False until payment is confirmed; the cashier won't hand over goods
   * without it. Shown to the buyer so they know where they stand. */
  can_release_items?: boolean;
  /**
   * Money, all as decimal strings. `total_amount` is the basket SUBTOTAL — it
   * is NOT what an ONLINE buyer transfers. `payable_amount` is, and it's the
   * figure the virtual account is opened for; sending `total_amount` instead
   * underpays by the fee and the transfer is never matched.
   */
  charges?: string;
  payable_amount?: string;
  /** True when the merchant absorbs the fee, false when the buyer pays it —
   * the same polarity as StoreInfo.pay_transaction_charges. */
  pay_charges?: boolean;
  /** Draft TTL, currently 7200 (2 hours). Optional throughout: older API
   * builds omit these, and the counter pass hides its countdown rather than
   * inventing a deadline. */
  expires_in_seconds?: number;
  /** The same TTL in milliseconds — what the counter pass counts down from. */
  expires_in_ms?: number;
  /** Absolute expiry in server time. Only a fallback for the countdown: a
   * phone whose clock is wrong would count down to the wrong moment. */
  expires_at?: string;
  created_at?: string;
}

export const createInStoreDraft = (
  businessId: string,
  payload: InStoreDraftPayload,
) =>
  apiRequest<InStoreDraftResponse>(
    `/order/business/${businessId}/instore-checkout/`,
    { method: "POST", body: payload, errorMessage: "Failed to create order" },
  );

// ---- Card OTP ---------------------------------------------------------

/** POST /order/validate_otp/ — second factor on a card charge. */
export const validateOtp = (reference: string, otp: string) =>
  apiRequest<CheckoutResponse>("/order/validate_otp/", {
    method: "POST",
    body: { reference, otp },
    errorMessage: "Failed to validate OTP",
  });

// ---- Payment confirmation --------------------------------------------

export type PaymentStatus = "PENDING" | "APPROVED" | "PAID" | "REJECTED";

export const isPaymentApproved = (status: PaymentStatus): boolean =>
  status === "APPROVED" || status === "PAID";

export interface PaymentConfirmation {
  status: PaymentStatus;
  message: string;
  detail?: string;
  reference?: string;
  payment_method?: string;
  order_reference?: string;
  sale_id?: string;
}

/**
 * GET /order/confirm_payment/{reference}/
 *
 * Normalizes this endpoint's unusual contract: approval is a 200, but *both*
 * "still waiting" and "declined" are 400s carrying the same message, separated
 * only by `status`. Rather than make every caller unpack an ApiError, those
 * two are returned as values and only genuine failures (404, 5xx, network)
 * are thrown.
 *
 * A 400 with no `status` is treated as PENDING — that's the bank-transfer
 * "not confirmed yet" case, and guessing APPROVED there would hand over goods
 * that were never paid for.
 */
export const confirmPayment = async (
  reference: string,
  signal?: AbortSignal,
): Promise<PaymentConfirmation> => {
  const path = `/order/confirm_payment/${encodeURIComponent(reference)}/`;

  try {
    const data = await apiRequest<Partial<PaymentConfirmation>>(path, {
      signal,
    });
    return {
      ...data,
      status: data.status ?? "APPROVED",
      message: data.message ?? "Payment confirmed",
    };
  } catch (error) {
    const body =
      error instanceof ApiError && error.status === 400 && error.body
        ? (error.body as Partial<PaymentConfirmation>)
        : null;

    if (!body) throw error;

    return {
      ...body,
      status: body.status === "REJECTED" ? "REJECTED" : "PENDING",
      message: body.message ?? "Payment not yet confirmed",
    };
  }
};

export type PollOutcome =
  | { outcome: "APPROVED"; confirmation: PaymentConfirmation }
  | { outcome: "REJECTED"; confirmation: PaymentConfirmation }
  | { outcome: "TIMEOUT"; confirmation: PaymentConfirmation | null };

const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };

    if (signal?.aborted) return onAbort();
    signal?.addEventListener("abort", onAbort, { once: true });
  });

/**
 * Polls until the charge resolves, or the window closes.
 *
 * Stops the moment a terminal status arrives — a declined BNPL request must
 * not leave the buyer staring at a spinner for the rest of the timeout. The
 * 90s default is the upper end of what the backend team suggested (60–90s).
 */
export const pollPaymentConfirmation = async (
  reference: string,
  {
    intervalMs = 3000,
    timeoutMs = 90_000,
    signal,
    onPending,
  }: {
    intervalMs?: number;
    timeoutMs?: number;
    signal?: AbortSignal;
    onPending?: (elapsedMs: number) => void;
  } = {},
): Promise<PollOutcome> => {
  const startedAt = Date.now();
  let latest: PaymentConfirmation | null = null;

  while (Date.now() - startedAt < timeoutMs) {
    const confirmation = await confirmPayment(reference, signal);
    latest = confirmation;

    if (isPaymentApproved(confirmation.status))
      return { outcome: "APPROVED", confirmation };
    if (confirmation.status === "REJECTED")
      return { outcome: "REJECTED", confirmation };

    onPending?.(Date.now() - startedAt);
    await wait(intervalMs, signal);
  }

  return { outcome: "TIMEOUT", confirmation: latest };
};
