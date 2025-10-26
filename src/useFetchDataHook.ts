import { useEffect, useState } from "react";
import { BaseUrl } from "./base-url";

interface UseFetchDataProps {
  store_url?: string;
  autoFetch?: boolean;
}

interface FetchResponse<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

const useFetchData = <T>({
  store_url,
  autoFetch = true,
}: UseFetchDataProps = {}) => {
  const [state, setState] = useState<FetchResponse<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const getStoreUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const paramStoreUrl = urlParams.get("store_url");
    return paramStoreUrl || store_url || "";
  };

  const fetchData = async () => {
    const storeUrl = getStoreUrl();

    if (!storeUrl) {
      setState({
        data: null,
        isLoading: false,
        error: new Error("Store URL is required"),
      });
      return;
    }

    const fullUrl = `${BaseUrl}/${storeUrl}`;
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
      setState({ data, isLoading: false, error: null });
      return data;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error : new Error("Unknown error occurred");
      setState({ data: null, isLoading: false, error: errorMessage });
      throw errorMessage;
    }
  };

  useEffect(() => {
    let isMounted = true;

    if (autoFetch) {
      (async () => {
        try {
          const storeUrl = getStoreUrl();
          if (!storeUrl) return;

          setState((prev) => ({ ...prev, isLoading: true }));

          const fullUrl = `${BaseUrl}/${storeUrl}`;
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
            setState({ data, isLoading: false, error: null });
          }
        } catch (error) {
          if (isMounted) {
            const errorMessage =
              error instanceof Error
                ? error
                : new Error("Unknown error occurred");
            setState({ data: null, isLoading: false, error: errorMessage });
          }
        }
      })();
    }

    return () => {
      isMounted = false;
    };
  }, [store_url, autoFetch]);

  return {
    ...state,
    fetchData,
    refresh: fetchData,
  };
};

export default useFetchData;
