// base-url.ts

// Root API base — switch this ONE line between staging and production.
export const ApiBase = "https://www.api.sync360.africa/api/v1";
// export const ApiBase = "https://staging-api.sync360.africa/api/v1";

// Store endpoints live under /store (used by the storefront data fetch).
export const BaseUrl = `${ApiBase}/store`;
