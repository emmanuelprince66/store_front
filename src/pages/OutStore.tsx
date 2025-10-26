import { useState } from "react";
import { HeaderSkeleton } from "../components/CardSkeleton";
import CartIcon from "../components/CartIcon";
import { Footer } from "../components/Footer";
import { ProductList } from "../components/ProductList";
import { CartProvider } from "../context/CartContext";
import type { StoreData } from "../type";
import useFetchData from "../useFetchDataHook"; // Import your existing hook
import { Checkout } from "./Checkout";

export const OutStore = () => {
  const [currentView, setCurrentView] = useState("store");

  // Use your existing hook with mycliq
  const {
    data: storeData,
    isLoading,
    error,
  } = useFetchData<StoreData>({
    store_url: "cap&",
  });

  console.log("Store data:", storeData);

  const categories = storeData?.categories
    ? ["All", ...storeData.categories.map((c) => c.name)]
    : ["All"];

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

  if (currentView === "checkout") {
    return (
      <CartProvider>
        <div className="min-h-screen bg-gray-50 font-['Montserrat']">
          <Checkout onBack={() => setCurrentView("store")} />
        </div>
      </CartProvider>
    );
  }

  return (
    <CartProvider>
      <div className="flex flex-col min-h-screen bg-gray-50 font-['Montserrat']">
        {isLoading ? (
          <HeaderSkeleton />
        ) : (
          <header className="bg-white shadow-md z-20 sticky top-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-20">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-br from-green-500 to-green-600 p-2 rounded-xl shadow-lg overflow-hidden">
                    {storeData?.info.logo ? (
                      <img
                        src={storeData.info.logo}
                        alt={storeData.info.name}
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
                        storeData?.info.logo ? "hidden" : ""
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
                      {storeData?.info.name || "Loading..."}
                    </p>
                    <p className="text-xs text-gray-600 hidden sm:block">
                      {storeData?.info.state || ""}
                    </p>
                  </div>
                </div>
                <CartIcon onCheckout={() => setCurrentView("checkout")} />
              </div>
            </div>
          </header>
        )}

        <div className="relative bg-gradient-to-r from-green-600 via-green-500 to-emerald-500 text-white overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"
              alt="Shopping background"
              className="w-full h-full object-cover opacity-30"
            />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
            <div className="text-center">
              <h1 className="text-3xl sm:text-5xl font-bold mb-4 drop-shadow-lg">
                {storeData?.info.tag_line ||
                  `Welcome to ${storeData?.info.name || "Our Store"}`}
              </h1>
              <p className="text-lg sm:text-xl mb-6 text-green-50 max-w-2xl mx-auto">
                {storeData?.info.description ||
                  "Discover amazing products at unbeatable prices. Quality guaranteed, satisfaction assured."}
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <div className="bg-white bg-opacity-20 backdrop-blur-sm px-6 py-3 rounded-full">
                  <p className="text-sm font-semibold text-black">
                    🚚 Free Shipping
                  </p>
                </div>
                <div className="bg-white bg-opacity-20 backdrop-blur-sm px-6 py-3 rounded-full">
                  <p className="text-sm font-semibold text-black">
                    💯 Quality Assured
                  </p>
                </div>
                <div className="bg-white bg-opacity-20 backdrop-blur-sm px-6 py-3 rounded-full">
                  <p className="text-sm font-semibold text-black">
                    🔒 Secure Payment
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <ProductList
              products={storeData?.products || []}
              categories={categories}
              currency={storeData?.info.currency || "₦"}
              isLoading={isLoading}
            />
          </div>
        </main>

        <Footer />
      </div>
    </CartProvider>
  );
};
