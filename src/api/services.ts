import { ApiError, apiRequest } from "./client";

// ============================================================================
// Types & Contracts
// ============================================================================

export interface StoreBusinessInfo {
  id: string;
  name: string;
  currency: string;
  logo?: string | null;
  phone?: string | null;
  pay_transaction_charges?: boolean;
}

export type PaymentRequirement = "ANY" | "FULL_PAYMENT" | "DEPOSIT" | "PAY_AT_BUSINESS";

export interface StoreServiceItem {
  id: string;
  name: string;
  description?: string | null;
  amount: string;
  duration: number;
  duration_display?: string;
  image?: string | null;
  category?: string | null;
  payment_requirement?: PaymentRequirement;
  min_deposit_percentage?: number | null;
  min_deposit_amount?: string | null;
  deposit_amount?: string | null;
  max_capacity?: number;
}

export interface ServiceCategory {
  id: string;
  name: string;
  type: "SERVICE" | string;
}

export interface ServicesListResponse {
  business: StoreBusinessInfo;
  categories?: ServiceCategory[];
  services: StoreServiceItem[];
}

export interface StaffOption {
  id: string | null;
  name: string;
}

export interface AvailableSlot {
  start_time: string;
  end_time: string;
  display: string;
  max_capacity: number;
  remaining_capacity: number;
  available_staff: StaffOption[];
}

export interface PaymentOptionsConfig {
  allow_full_payment: boolean;
  allow_deposit: boolean;
  min_deposit_percentage?: number | null;
  min_deposit_amount?: string | null;
  deposit_amount?: string | null;
  effective_deposit_amount?: string | null;
  allow_pay_at_business: boolean;
  channels?: Array<"BANK-TRANSFER" | "CARD" | "BNPL" | "PAY_AT_BUSINESS" | string>;
}

export interface BookingRules {
  min_notice_hours: number;
  max_advance_days: number;
  cancellation_window_hours: number;
  cancellation_policy_text: string;
  booking_interval: number;
}

export interface OperatingDaySchedule {
  day: string;
  day_of_week: number;
  is_closed: boolean;
  open_time: string | null;
  close_time: string | null;
}

export interface ServiceDetailResponse {
  service: StoreServiceItem;
  staff_options: StaffOption[];
  payment_options: PaymentOptionsConfig;
  booking_rules: BookingRules;
  operating_schedule: OperatingDaySchedule[];
  selected_date: string;
  available_slots: AvailableSlot[];
}

export type BookingPaymentOption = "FULL_PAYMENT" | "DEPOSIT" | "PAY_AT_BUSINESS";
export type BookingPaymentChannel = "BANK-TRANSFER" | "CARD" | "BNPL" | "PAY_AT_BUSINESS";

export interface CreateBookingHoldPayload {
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  booking_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  staff_id?: string | null;
  payment_option: BookingPaymentOption;
  // Only with payment_option "DEPOSIT": the customer's chosen amount, between
  // min_deposit_amount and the service price. Omitted → backend uses the minimum.
  deposit_amount?: number;
  payment_method?: BookingPaymentChannel;
  card_number?: string;
  expiry_date?: string; // MM/YY
  cvv?: string;
  card_pin?: string;
  payment_pin?: string; // Akawopay BNPL PIN
  notes?: string;
}

export interface BookingVirtualAccount {
  bank_name: string;
  account_number: string;
  account_name: string;
  amount: string;
  service_amount?: string;
  charges?: string;
  pay_charges?: boolean;
  reference: string;
}

export interface BookingHoldDetails {
  id: string;
  reference: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "EXPIRED" | string;
  payment_option: BookingPaymentOption | string;
  payment_status: "UNPAID" | "DEPOSIT_PAID" | "PAID" | "REFUND_PENDING" | "REFUNDED" | string;
  service_name: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  duration?: string;
  staff_name?: string;
  service_price: string;
  service_amount: string;
  charges: string;
  pay_charges: boolean;
  amount_due_now: string;
  refundable_amount: string;
  balance_due_later: string;
  expires_at: string | null;
}

export interface BookingHoldPaymentResponse {
  method: BookingPaymentChannel | string;
  status:
    | "PENDING_TRANSFER"
    | "OTP_REQUIRED"
    | "REDIRECT_REQUIRED"
    | "CONFIRMED"
    | "FAILED"
    | string;
  message?: string;
  reference?: string;
  amount?: string;
  service_amount?: string;
  charges?: string;
  pay_charges?: boolean;
  redirect_html?: string;
  bank_accounts?: BookingVirtualAccount[];
}

export interface CreateBookingHoldResponse {
  message: string;
  booking: BookingHoldDetails;
  payment?: BookingHoldPaymentResponse;
  bank_accounts?: BookingVirtualAccount[];
}

export interface VerifyPaymentResponse {
  message: string;
  status: "CONFIRMED" | "PENDING" | "EXPIRED" | "FAILED" | string;
  payment_status?: "PAID" | "DEPOSIT_PAID" | "UNPAID" | string;
  booking_id?: string;
  reference?: string;
  expires_at?: string | null;
}

export interface CustomerBookingLookupResponse {
  reference: string;
  status: "CONFIRMED" | "PENDING" | "CANCELLED" | "COMPLETED" | "EXPIRED" | string;
  payment_status: "UNPAID" | "DEPOSIT_PAID" | "PAID" | "REFUND_PENDING" | "REFUNDED" | string;
  service: {
    id: string;
    name: string;
    duration_minutes: number;
    price: string;
  };
  booking_date: string;
  start_time: string;
  end_time: string;
  staff?: string | null;
  notes?: string | null;
  amount_paid: string;
  refundable_amount: string;
  balance_due: string;
  payment_option: BookingPaymentOption | string;
  cancellation_reason?: string | null;
  policy: {
    cancellation_window_hours: number;
    allows_cancellation: boolean;
  };
  can_cancel: boolean;
  can_reschedule: boolean;
}

export interface CancelBookingResponse {
  message: string;
  reference: string;
  status: "CANCELLED" | string;
  payment_status: "REFUND_PENDING" | "REFUNDED" | "UNPAID" | string;
  refund_amount?: string;
  refund_note?: string;
}

export interface RescheduleBookingResponse {
  message: string;
  reference: string;
  status: "CONFIRMED" | string;
  booking_date: string;
  start_time: string;
  end_time: string;
}

// ============================================================================
// Store Path Resolution
// ============================================================================

export interface StoreTarget {
  storeSlug?: string;
  storeDomain?: string;
}

/**
 * Resolves the URL prefix for service endpoints.
 * Dual routing:
 * - Domain: `/store/domain/<domain>/services`
 * - Slug: `/store/<store_url>/services`
 */
export const getServiceBasePath = (target: StoreTarget): string => {
  if (target.storeDomain) {
    return `/store/domain/${encodeURIComponent(target.storeDomain)}/services`;
  }
  if (target.storeSlug) {
    return `/store/${encodeURIComponent(target.storeSlug)}/services`;
  }
  throw new Error("Either storeSlug or storeDomain must be provided");
};

// ============================================================================
// Service Booking API Calls
// ============================================================================

/**
 * 3.1 List Services
 * GET /api/v1/store/<store_url>/services/ OR GET /api/v1/store/domain/<domain>/services/
 */
export const fetchStoreServices = async (
  target: StoreTarget,
  params?: { category_id?: string | null; search?: string },
  signal?: AbortSignal,
): Promise<ServicesListResponse> => {
  const base = getServiceBasePath(target);
  const query = new URLSearchParams();
  if (params?.category_id) query.set("category_id", params.category_id);
  if (params?.search && params.search.trim()) query.set("search", params.search.trim());

  const queryString = query.toString();
  const path = queryString ? `${base}/?${queryString}` : `${base}/`;

  return apiRequest<ServicesListResponse>(path, {
    method: "GET",
    signal,
    errorMessage: "Failed to load services",
  });
};

/**
 * 3.2 Service Detail, Policy & Dynamic Available Slots
 * GET /api/v1/store/<store_url>/services/<service_id>/
 */
export const fetchServiceDetail = async (
  target: StoreTarget,
  serviceId: string,
  params?: { date?: string; staff_id?: string | null },
  signal?: AbortSignal,
): Promise<ServiceDetailResponse> => {
  const base = getServiceBasePath(target);
  const query = new URLSearchParams();
  if (params?.date) query.set("date", params.date);
  if (params?.staff_id) query.set("staff_id", params.staff_id);

  const queryString = query.toString();
  const path = queryString
    ? `${base}/${encodeURIComponent(serviceId)}/?${queryString}`
    : `${base}/${encodeURIComponent(serviceId)}/`;

  return apiRequest<ServiceDetailResponse>(path, {
    method: "GET",
    signal,
    errorMessage: "Failed to load service slot details",
  });
};

/**
 * 3.3 Create Booking Hold
 * POST /api/v1/store/<store_url>/services/<service_id>/book/
 */
export const createBookingHold = async (
  target: StoreTarget,
  serviceId: string,
  payload: CreateBookingHoldPayload,
  signal?: AbortSignal,
): Promise<CreateBookingHoldResponse> => {
  const base = getServiceBasePath(target);
  const path = `${base}/${encodeURIComponent(serviceId)}/book/`;

  return apiRequest<CreateBookingHoldResponse>(path, {
    method: "POST",
    body: payload,
    signal,
    errorMessage: "Failed to create booking reservation",
  });
};

/**
 * 3.4 Payment Verification Endpoint
 * GET/POST /api/v1/store/<store_url>/services/bookings/<reference>/verify/
 */
export const verifyBookingPayment = async (
  target: StoreTarget,
  reference: string,
  options?: { otp?: string },
  signal?: AbortSignal,
): Promise<VerifyPaymentResponse> => {
  const base = getServiceBasePath(target);
  const path = `${base}/bookings/${encodeURIComponent(reference)}/verify/`;

  const isOtp = Boolean(options?.otp);

  try {
    return await apiRequest<VerifyPaymentResponse>(path, {
      method: isOtp ? "POST" : "GET",
      body: isOtp ? { otp: options?.otp } : undefined,
      signal,
      errorMessage: "Payment verification failed",
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 400 && err.body) {
      // Pending and terminal verification statuses are returned as HTTP 400.
      const body = err.body as Partial<VerifyPaymentResponse>;
      const status = body.status;
      if (
        status !== "PENDING" &&
        status !== "CONFIRMED" &&
        status !== "EXPIRED" &&
        status !== "FAILED"
      ) {
        throw err;
      }

      return {
        message: body.message || err.message,
        status,
        payment_status: body.payment_status,
        expires_at: body.expires_at,
        reference: body.reference || reference,
      };
    }
    throw err;
  }
};

/**
 * Polls verify endpoint until terminal status (CONFIRMED / EXPIRED / FAILED) or timeout
 */
export const pollBookingPaymentVerification = async (
  target: StoreTarget,
  reference: string,
  {
    intervalMs = 3000,
    timeoutMs = 120_000,
    signal,
    onPending,
  }: {
    intervalMs?: number;
    timeoutMs?: number;
    signal?: AbortSignal;
    onPending?: (res: VerifyPaymentResponse, elapsedMs: number) => void;
  } = {},
): Promise<{
  outcome: "CONFIRMED" | "EXPIRED" | "FAILED" | "TIMEOUT";
  response: VerifyPaymentResponse | null;
}> => {
  const startedAt = Date.now();
  let latestResponse: VerifyPaymentResponse | null = null;

  while (Date.now() - startedAt < timeoutMs) {
    if (signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    const res = await verifyBookingPayment(target, reference, undefined, signal);
    latestResponse = res;

    if (res.status === "CONFIRMED") {
      return { outcome: "CONFIRMED", response: res };
    }
    if (res.status === "EXPIRED") {
      return { outcome: "EXPIRED", response: res };
    }
    if (res.status === "FAILED") {
      return { outcome: "FAILED", response: res };
    }

    onPending?.(res, Date.now() - startedAt);

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        signal?.removeEventListener("abort", onAbort);
        resolve();
      }, intervalMs);
      const onAbort = () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      };
      if (signal?.aborted) return onAbort();
      signal?.addEventListener("abort", onAbort, { once: true });
    });
  }

  return { outcome: "TIMEOUT", response: latestResponse };
};

/**
 * 4.1 Lookup Booking by Reference
 * GET /api/v1/store/<store_url>/services/bookings/<reference>/
 */
export const lookupBookingByReference = async (
  target: StoreTarget,
  reference: string,
  signal?: AbortSignal,
): Promise<CustomerBookingLookupResponse> => {
  const base = getServiceBasePath(target);
  const path = `${base}/bookings/${encodeURIComponent(reference)}/`;

  return apiRequest<CustomerBookingLookupResponse>(path, {
    method: "GET",
    signal,
    errorMessage: "Booking not found",
  });
};

/**
 * 4.2 Customer Cancel Booking
 * POST /api/v1/store/<store_url>/services/bookings/<reference>/cancel/
 */
export const cancelBooking = async (
  target: StoreTarget,
  reference: string,
  reason?: string,
  signal?: AbortSignal,
): Promise<CancelBookingResponse> => {
  const base = getServiceBasePath(target);
  const path = `${base}/bookings/${encodeURIComponent(reference)}/cancel/`;

  return apiRequest<CancelBookingResponse>(path, {
    method: "POST",
    body: reason ? { reason } : {},
    signal,
    errorMessage: "Failed to cancel booking",
  });
};

/**
 * 4.3 Customer Reschedule Booking
 * POST /api/v1/store/<store_url>/services/bookings/<reference>/reschedule/
 */
export const rescheduleBooking = async (
  target: StoreTarget,
  reference: string,
  payload: { new_date: string; new_start_time: string },
  signal?: AbortSignal,
): Promise<RescheduleBookingResponse> => {
  const base = getServiceBasePath(target);
  const path = `${base}/bookings/${encodeURIComponent(reference)}/reschedule/`;

  return apiRequest<RescheduleBookingResponse>(path, {
    method: "POST",
    body: payload,
    signal,
    errorMessage: "Failed to reschedule booking",
  });
};

// ============================================================================
// Helper Calculations
// ============================================================================

/**
 * Calculates estimated payment processing charges per guide:
 * - Bank Transfer: 1.5% capped at min 100, max 1,000
 * - Card: 1.5% capped at min 100, max 1,500
 * - BNPL: 0
 * - Pay at Business: 0
 */
export const calculateServiceCharges = (
  amount: number,
  method: BookingPaymentChannel,
  payCharges = false,
): { charges: number; totalPayable: number } => {
  if (payCharges || amount <= 0) {
    return { charges: 0, totalPayable: amount };
  }

  let charges = 0;
  if (method === "BANK-TRANSFER") {
    charges = Math.max(100, Math.min(1000, 0.015 * amount));
  } else if (method === "CARD") {
    charges = Math.max(100, Math.min(1500, 0.015 * amount));
  } else if (method === "BNPL" || method === "PAY_AT_BUSINESS") {
    charges = 0;
  }

  return {
    charges,
    totalPayable: amount + charges,
  };
};
