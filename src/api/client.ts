import { ApiBase } from "../base-url";

/**
 * Error carrying the parsed response body, not just a message.
 *
 * This matters for BNPL: a declined charge and a still-pending one both come
 * back as HTTP 400 with the same `message`, and only `body.status` tells them
 * apart. A thrown Error that kept just the message would make the two
 * indistinguishable and the poller would spin for the full timeout on a
 * transaction the customer has already been declined for.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

/** First non-empty string among the keys this backend uses for messages. */
const readMessage = (record: Record<string, unknown>): string | null => {
  for (const key of ["message", "detail", "error"]) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return null;
};

/**
 * DRF field errors arrive as `{ payload: { items: ["This field is required."] } }`.
 * Surfacing the field name turns an opaque "This field is required" toast into
 * something the buyer (or we, in the console) can act on.
 */
const readFieldError = (record: Record<string, unknown>): string | null => {
  const payload = record.payload;
  if (!payload || typeof payload !== "object") return null;

  for (const [field, value] of Object.entries(
    payload as Record<string, unknown>,
  )) {
    const first = Array.isArray(value) ? value[0] : value;
    if (typeof first === "string" && first.trim()) {
      return field === "non_field_errors" ? first : `${field}: ${first}`;
    }
  }
  return null;
};

const describeFailure = (body: unknown, fallback: string): string => {
  if (!body || typeof body !== "object") return fallback;
  const record = body as Record<string, unknown>;
  return readFieldError(record) ?? readMessage(record) ?? fallback;
};

/** Message for a caught value of unknown type, without resorting to `any`. */
export const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error && error.message ? error.message : fallback;

/** True for the DOMException an AbortController raises on cancellation. */
export const isAbortError = (error: unknown): boolean =>
  error instanceof Error && error.name === "AbortError";

interface ApiRequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT";
  /** Serialized as JSON. Omit for GET. */
  body?: unknown;
  /** Used as the error message when the response carries none of its own. */
  errorMessage?: string;
  signal?: AbortSignal;
}

/**
 * Calls the Sync360 API and returns the parsed JSON body.
 *
 * `path` is relative to ApiBase and must start with "/" (e.g. "/order/...").
 * Throws ApiError on any non-2xx so callers can branch on `.status`/`.body`.
 */
export const apiRequest = async <T>(
  path: string,
  { method = "GET", body, errorMessage, signal }: ApiRequestOptions = {},
): Promise<T> => {
  const response = await fetch(`${ApiBase}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal,
  });

  // A 204, or an HTML error page from a bad route, leaves nothing to parse.
  const parsed = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      describeFailure(parsed, errorMessage ?? "Request failed"),
      response.status,
      parsed,
    );
  }

  return parsed as T;
};
