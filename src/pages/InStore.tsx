// ============================================
// FILE: pages/InStore.tsx
// ============================================

import { useState } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { BaseUrl } from "../base-url";
import { HeaderSkeleton } from "../components/CardSkeleton";
import CartIcon from "../components/CartIcon";
import { Footer } from "../components/Footer";
import ProductBottomDrawer from "../components/ProductBottomDrawer";
import { ProductList } from "../components/ProductList";
import ScannerModal from "../components/ScannerModal";
import { CartProvider } from "../context/CartContext";
import type { Product, StoreData } from "../type";
import useFetchData from "../useFetchDataHook";
import { Checkout } from "./Checkout";

const InStore = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [currentView, setCurrentView] = useState("store");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const location = useLocation();
  const slug = location.search.substring(6) || "";

  console.log("Slug:", slug);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isSearchingBarcode, setIsSearchingBarcode] = useState(false);

  // Fetch store data with filters
  const {
    data: storeData,
    isLoading,
    error,
    hasMore,
    totalPages,
  } = useFetchData<StoreData>({
    store_url: slug,
    category_id: selectedCategoryId,
    search: searchQuery,
    page: currentPage,
    limit: 20,
  });

  console.log("InStore data:", storeData);

  const handleCategoryChange = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
    setCurrentPage(1);
  };

  const handleSearchChange = (search: string) => {
    setSearchQuery(search);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getStoreUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const paramStoreUrl = urlParams.get("store_url");
    return paramStoreUrl || "banvicelectronics";
  };

  const searchProductByBarcode = async (barcode: string) => {
    const storeUrl = getStoreUrl();
    const searchUrl = `${BaseUrl}/${storeUrl}?search=${encodeURIComponent(
      barcode
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
      const product = await searchProductByBarcode(decodedText);

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
          }
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
      <CartProvider>
        <div className="min-h-screen bg-gray-50 font-['Montserrat']">
          <Checkout
            storeData={storeData}
            type={"in-store"}
            onBack={() => setCurrentView("store")}
          />
        </div>
      </CartProvider>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <svg
            className="mx-auto h-16 w-16 text-red-500 mb-4"
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Error Loading Store
          </h2>
          <p className="text-gray-600 mb-4">Please try again.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <CartProvider>
      <div className="flex flex-col min-h-screen bg-gray-50 font-['Montserrat']">
        {/* Header */}
        {isLoading && !storeData ? (
          <HeaderSkeleton />
        ) : (
          <header className="bg-white shadow-md z-20 sticky top-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-20">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl shadow-lg overflow-hidden">
                    {storeData?.results?.info?.logo ? (
                      <img
                        src={storeData.results?.info?.logo}
                        alt={storeData.results?.info?.name}
                        className="w-8 h-8 object-cover rounded"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.style.display = "none";
                          const svg = img.nextElementSibling as HTMLElement;
                          if (svg) svg.classList.remove("hidden");
                        }}
                      />
                    ) : null}
                    <svg
                      className={`w-8 h-8 text-white ${
                        storeData?.results?.info?.logo ? "hidden" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
                      {storeData?.results?.info?.name || "Loading..."}
                    </p>
                    <p className="text-xs text-gray-600 hidden sm:block">
                      {storeData?.results?.info?.state || ""}
                    </p>
                  </div>
                </div>
                <CartIcon onCheckout={() => setCurrentView("checkout")} />
              </div>
            </div>
          </header>
        )}

        {/* Hero Banner */}
        <div className="relative text-white overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"
              alt="Shopping background"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/50 to-black/60"></div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
            <div className="text-center">
              <h1 className="text-3xl sm:text-5xl font-bold mb-4 text-white drop-shadow-2xl [text-shadow:_0_2px_10px_rgb(0_0_0_/_80%)]">
                {isLoading && !storeData
                  ? "Loading..."
                  : storeData?.results?.info.tag_line ||
                    `Welcome to ${storeData?.results?.info.name || "InStore"}`}
              </h1>
              <p className="text-lg sm:text-xl mb-6 text-white max-w-2xl mx-auto drop-shadow-lg [text-shadow:_0_1px_8px_rgb(0_0_0_/_70%)]">
                {isLoading && !storeData
                  ? "Please wait..."
                  : storeData?.results?.info.description ||
                    "Scan products instantly with our barcode scanner. Quick, easy, and convenient shopping experience."}
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg">
                  <p className="text-sm font-semibold text-gray-900">
                    📱 Instant Scanning
                  </p>
                </div>
                <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg">
                  <p className="text-sm font-semibold text-gray-900">
                    💯 Quality Assured
                  </p>
                </div>
                <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg">
                  <p className="text-sm font-semibold text-gray-900">
                    🔒 Secure Payment
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Product List */}
        <main className="flex-1 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping"></span>

            <div className="relative cursor-pointer bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all transform active:scale-95 flex items-center gap-3">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                />
              </svg>
              <span className="font-bold text-lg whitespace-nowrap">
                Scan Product
              </span>
            </div>

            <div className="absolute bottom-full right-0 mb-2 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Scan Product Barcode
              <div className="absolute top-full right-8 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-gray-900"></div>
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

        <Footer storeData={storeData} />
      </div>
    </CartProvider>
  );
};

export default InStore;
