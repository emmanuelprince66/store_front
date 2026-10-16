// base-url.ts

// Root API base — configurable via VITE_API_BASE, defaults to staging.
export const ApiBase =
  (import.meta.env.VITE_API_BASE as string | undefined) ||
  "https://staging-api.sync360.africa/api/v1";

// Store endpoints live under /store (used by the storefront data fetch).
export const BaseUrl = `${ApiBase}/store`;
