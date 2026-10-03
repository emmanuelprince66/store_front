import { useEffect, useState } from "react";
import { BaseUrl } from "./base-url";

interface UseFetchDataProps {
  store_url?: string;
  autoFetch?: boolean;
  category_id?: string | null;
  search?: string;
  page?: number;
  limit?: number;
}

interface FetchResponse<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  currentPage: number;
  totalPages: number;
  // True whenever `data` was served from the local cache and hasn't yet been
  // confirmed by a live network response. Consumers that treat `data` as the
  // source of truth for something that must never regress to stale values
  // (e.g. syncing the shared brand-theme store) should wait for this to be
  // false before trusting it — otherwise a stale cache hit can overwrite an
  // already-correct value that a different page already fetched.
  isFromCache: boolean;
}

// Best-effort cache, keyed by the exact request URL, so a page can render
// instantly from the last-known response while it revalidates in the
// background instead of showing a loading state on every navigation.
const CACHE_PREFIX = "sf_cache:";

const readCache = (key: string): any => {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeCache = (key: string, value: unknown) => {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(value));
  } catch {
    // localStorage unavailable or quota exceeded — cache is best-effort only.
  }
};

const useFetchData = <T,>({
  store_url,
  autoFetch = true,
  category_id = null,
  search = "",
  page = 1,
  limit = 20,
}: UseFetchDataProps = {}) => {
  const getStoreUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const paramStoreUrl = urlParams.get("store_url");
    return paramStoreUrl || store_url || "";
  };

  const buildUrl = (pageNum: number) => {
    const storeUrl = getStoreUrl();
    if (!storeUrl) return null;

    const params = new URLSearchParams();
    params.append("page", pageNum.toString());
    params.append("limit", limit.toString());

    if (category_id) {
      params.append("category_id", category_id);
    }

    if (search && search.trim()) {
      params.append("search", search.trim());
    }

    return `${BaseUrl}/${storeUrl}?${params.toString()}`;
  };

  const [state, setState] = useState<FetchResponse<T>>(() => {
    const fullUrl = buildUrl(page);
    const cached = fullUrl ? readCache(fullUrl) : null;

    return {
      data: cached,
      isLoading: !cached,
      error: null,
      hasMore: cached?.links?.next != null,
      currentPage: page,
      totalPages: cached?.pages || 1,
      isFromCache: !!cached,
    };
  });

  const fetchData = async (pageNum: number = page) => {
    const fullUrl = buildUrl(pageNum);

    if (!fullUrl) {
      setState({
        data: null,
        isLoading: false,
        error: new Error("Store URL is required"),
        hasMore: false,
        currentPage: 1,
        totalPages: 1,
        isFromCache: false,
      });
      return;
    }

    // Show the cached response immediately (if we have one for this exact
    // request) while the real fetch revalidates it in the background.
    const cached = readCache(fullUrl);
    if (cached) {
      setState({
        data: cached,
        isLoading: false,
        error: null,
        hasMore: cached?.links?.next != null,
        currentPage: pageNum,
        totalPages: cached?.pages || 1,
        isFromCache: true,
      });
    } else {
      setState((prev) => ({ ...prev, isLoading: true }));
    }

    console.log("Fetching from:", fullUrl);

    try {
      const response = await fetch(fullUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Only touch localStorage when the response actually changed.
      if (JSON.stringify(data) !== JSON.stringify(cached)) {
        writeCache(fullUrl, data);
      }

      setState({
        data,
        isLoading: false,
        error: null,
        hasMore: data.links?.next !== null,
        currentPage: pageNum,
        totalPages: data.pages || 1,
        isFromCache: false,
      });

      return data;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error : new Error("Unknown error occurred");

      // If we already have cached data on screen, don't blank it out just
      // because the background revalidation failed.
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        isFromCache: !!cached,
        ...(cached
          ? {}
          : { data: null, hasMore: false, currentPage: 1, totalPages: 1 }),
      }));
      throw errorMessage;
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchData(page).catch(() => {
        // error state is already set inside fetchData
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store_url, autoFetch, category_id, search, page, limit]);

  return {
    ...state,
    fetchData,
    refresh: () => fetchData(page),
  };
};

export default useFetchData;
