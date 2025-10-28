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
}

const useFetchData = <T>({
  store_url,
  autoFetch = true,
  category_id = null,
  search = "",
  page = 1,
  limit = 20,
}: UseFetchDataProps = {}) => {
  const [state, setState] = useState<FetchResponse<T>>({
    data: null,
    isLoading: false,
    error: null,
    hasMore: false,
    currentPage: 1,
    totalPages: 1,
  });

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
      });
      return;
    }

    console.log("Fetching from:", fullUrl);

    setState((prev) => ({ ...prev, isLoading: true }));

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

      setState({
        data,
        isLoading: false,
        error: null,
        hasMore: data.links?.next !== null,
        currentPage: pageNum,
        totalPages: data.pages || 1,
      });

      return data;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error : new Error("Unknown error occurred");
      setState({
        data: null,
        isLoading: false,
        error: errorMessage,
        hasMore: false,
        currentPage: 1,
        totalPages: 1,
      });
      throw errorMessage;
    }
  };

  useEffect(() => {
    let isMounted = true;

    if (autoFetch) {
      (async () => {
        try {
          const fullUrl = buildUrl(page);
          if (!fullUrl) return;

          setState((prev) => ({ ...prev, isLoading: true }));

          console.log("Auto-fetching from:", fullUrl);

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

          if (isMounted) {
            setState({
              data,
              isLoading: false,
              error: null,
              hasMore: data.links?.next !== null,
              currentPage: page,
              totalPages: data.pages || 1,
            });
          }
        } catch (error) {
          if (isMounted) {
            const errorMessage =
              error instanceof Error
                ? error
                : new Error("Unknown error occurred");
            setState({
              data: null,
              isLoading: false,
              error: errorMessage,
              hasMore: false,
              currentPage: 1,
              totalPages: 1,
            });
          }
        }
      })();
    }

    return () => {
      isMounted = false;
    };
  }, [store_url, autoFetch, category_id, search, page, limit]);

  return {
    ...state,
    fetchData,
    refresh: () => fetchData(page),
  };
};

export default useFetchData;
