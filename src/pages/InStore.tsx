// ============================================
// FILE: pages/InStore.tsx
// ============================================

import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { BaseUrl } from "../base-url";
import { HeaderSkeleton } from "../components/CardSkeleton";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";
import ProductBottomDrawer from "../components/ProductBottomDrawer";
import { ProductList } from "../components/ProductList";
import ScannerModal from "../components/ScannerModal";
import { WhatsAppButton } from "../components/WhatsAppButton";
import type { Product, StoreData } from "../type";
import useFetchData from "../useFetchDataHook";
import { useStoreTheme } from "../utils/theme";
import { Checkout } from "./Checkout";

const InStore = () => {
  const location = useLocation();
  const navState = location.state as {
    openCheckout?: boolean;
    categoryId?: string | null;
    search?: string;
  } | null;

  const [showScanner, setShowScanner] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [currentView, setCurrentView] = useState(
    navState?.openCheckout ? "checkout" : "store",
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    navState?.categoryId ?? null,
  );
  const [bannerLoaded, setBannerLoaded] = useState(false);
  const [bannerImage, setBannerImage] = useState<string>("");

  // Use useParams to get the slug from the URL path
  const { slug } = useParams<{ slug: string }>();

  console.log("Slug from URL:", slug);

  const [searchQuery, setSearchQuery] = useState(navState?.search ?? "");
  const [currentPage, setCurrentPage] = useState(1);
  const [isSearchingBarcode, setIsSearchingBarcode] = useState(false);

  // Fetch store data with filters
  const {
    data: storeData,
    isLoading,
    error,
    hasMore,
    totalPages,
    isFromCache,
  } = useFetchData<StoreData>({
    store_url: slug || "",
    category_id: selectedCategoryId,
    search: searchQuery,
    page: currentPage,
    limit: 20,
  });

  const { vars: themeVars } = useStoreTheme(storeData, slug, !isFromCache);

  const handleCategoryChange = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
    setCurrentPage(1);
  };

  // Track banner image changes
  useEffect(() => {
    const storeBanner = storeData?.results?.info?.banner || "";

    // Only use placeholder if banner is undefined, empty string, or falsy
    if (!storeBanner && !isLoading) {
      setBannerImage(
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80",
      );
      setBannerLoaded(false);
    } else {
      // Reset loaded state when banner URL changes
      setBannerLoaded(false);
      setBannerImage(storeBanner);
    }
  }, [storeData?.results?.info?.banner, isLoading]);

  const handleSearchChange = (search: string) => {
    setSearchQuery(search);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getStoreUrl = () => {
    return slug || "cap&";
  };

  const searchProductByBarcode = async (barcode: string) => {
    const storeUrl = getStoreUrl();
    const searchUrl = `${BaseUrl}/${storeUrl}?search=${encodeURIComponent(
      barcode,
    )}&page=1&limit=1`;

    console.log("Searching barcode:", barcode, "URL:", searchUrl);

    try {
      const response = await fetch(searchUrl, {
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

      console.log("data", data);
      if (data.results?.products && data.results.products.length > 0) {
        return data.results.products[0];
      }

      return null;
    } catch (error) {
      console.error("Barcode search error:", error);
      throw error;
    }
  };

  const handleScanSuccess = async (decodedText: string, decodedResult: any) => {
    console.log("Scan success:", decodedText);
    console.log("Decoded result:", decodedResult);

    // Prevent multiple searches
    if (isSearchingBarcode) {
      console.log("Already searching, ignoring scan");
      return;
    }

    setIsSearchingBarcode(true);

    try {
      console.log("fetching product");
      const product = await searchProductByBarcode(decodedText);

      console.log("product", product);

      if (product) {
        setScannedProduct(product);
        toast.success(`Found: ${product.name}`, {
          position: "top-center",
          autoClose: 2000,
        });
      } else {
        toast.error(
          `No product found for barcode "${decodedText}". Please try another barcode.`,
          {
            position: "top-center",
            autoClose: 4000,
          },
        );
      }
    } catch (error) {
      toast.error("Failed to search for product. Please try again.", {
        position: "top-center",
        autoClose: 3000,
      });
    } finally {
      // Allow new scans after a short delay
      setTimeout(() => {
        setIsSearchingBarcode(false);
      }, 1500);
    }
  };

  if (currentView === "checkout") {
    return (
      <div className="min-h-screen bg-white" style={themeVars}>
        <Checkout
          storeData={storeData}
          type={"in-store"}
          onBack={() => setCurrentView("store")}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <svg
            className="mx-auto h-16 w-16 text-black mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h2 className="font-display text-3xl text-black mb-2 uppercase tracking-wide">
            Error Loading Store
          </h2>
          <p className="text-gray-600 mb-6">Please try again.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="flex flex-col min-h-screen bg-white"
        style={themeVars}
      >
        {/* Header */}
        {isLoading && !storeData ? (
          <HeaderSkeleton />
        ) : (
          <Navbar
            storeData={storeData}
            categories={storeData?.results?.categories || []}
            selectedCategoryId={selectedCategoryId}
            onCategoryChange={handleCategoryChange}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            onCheckout={() => setCurrentView("checkout")}
          />
        )}

        {/* Hero Banner */}
        <div className="relative text-white overflow-hidden">
          <div className="absolute inset-0">
            {!bannerLoaded && (
              <div className="w-full h-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
            )}

            {bannerImage && (
              <img
                src={bannerImage}
                alt="Shopping background"
                fetchPriority="high"
                decoding="async"
                className={`w-full h-full object-cover transition-opacity duration-700 ${
                  bannerLoaded ? "opacity-100" : "opacity-0"
                }`}
                onLoad={() => setBannerLoaded(true)}
              />
            )}
            <div className="absolute inset-0 bg-black/55" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-28">
            <div className="max-w-3xl">
              <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl uppercase leading-[1.05] mb-5 text-white">
                {isLoading && !storeData
                  ? "Loading..."
                  : storeData?.results?.info.tag_line ||
                    `Welcome to ${storeData?.results?.info.name || "InStore"}`}
              </h1>
              <p className="text-base sm:text-lg text-white/90 mb-8 max-w-xl">
                {isLoading && !storeData
                  ? "Please wait..."
                  : storeData?.results?.info.description ||
                    "Scan products instantly with our barcode scanner. Quick, easy, and convenient shopping."}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content - Product List */}
        <main className="flex-1 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <ProductList
              products={storeData?.results?.products || []}
              categories={storeData?.results?.categories || []}
              currency={storeData?.results?.info.currency || "₦"}
              isLoading={isLoading}
              selectedCategoryId={selectedCategoryId}
              onCategoryChange={handleCategoryChange}
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              hasMore={hasMore}
              totalProducts={storeData?.total || 0}
            />
          </div>
        </main>

        {/* Scanner Modal */}
        {showScanner && (
          <ScannerModal
            onClose={() => setShowScanner(false)}
            onScanSuccess={handleScanSuccess}
            isSearching={isSearchingBarcode}
          />
        )}

        {/* Floating Scan Button */}
        {!showScanner && !isLoading && (
          <button
            onClick={() => setShowScanner(true)}
            className="fixed bottom-6 right-6 z-30 group"
            aria-label="Scan product barcode"
          >
            <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--brand-primary)] opacity-30 animate-ping"></span>

            <div className="relative cursor-pointer bg-[var(--brand-primary)] text-[var(--brand-on-primary)] px-6 py-3.5 sm:py-4 rounded-full shadow-xl hover:opacity-90 hover:scale-105 transition-all flex items-center gap-2.5">
              <svg
                className="w-6 h-6 sm:w-7 sm:h-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                />
              </svg>
              <span className="font-medium text-sm sm:text-base whitespace-nowrap">
                Scan Product
              </span>
            </div>
          </button>
        )}

        <style>{`
          @keyframes ping {
            75%, 100% {
              transform: scale(1.5);
              opacity: 0;
            }
          }
          
          .animate-ping {
            animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
          }
        `}</style>

        {/* Product Bottom Drawer */}
        {scannedProduct && storeData && (
          <ProductBottomDrawer
            product={scannedProduct}
            onClose={() => setScannedProduct(null)}
            currency={storeData.results.info.currency}
          />
        )}

        <WhatsAppButton
          storeName={storeData?.results?.info?.name}
          storeData={storeData}
          storeSlug={slug}
          stacked
        />

        <Footer storeData={storeData} />
      </div>
    </>
  );
};

export default InStore;
