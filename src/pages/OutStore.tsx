import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { HeaderSkeleton } from "../components/CardSkeleton";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";
import { ProductList } from "../components/ProductList";
import { WhatsAppButton } from "../components/WhatsAppButton";
import type { StoreData } from "../type";
import useFetchData from "../useFetchDataHook";
import { useStoreTheme } from "../utils/theme";
import { Checkout } from "./Checkout";

export const OutStore = () => {
  const location = useLocation();
  const navState = location.state as {
    openCheckout?: boolean;
    categoryId?: string | null;
    search?: string;
  } | null;

  const [currentView, setCurrentView] = useState(
    navState?.openCheckout ? "checkout" : "store",
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    navState?.categoryId ?? null,
  );
  const [searchQuery, setSearchQuery] = useState(navState?.search ?? "");
  const [currentPage, setCurrentPage] = useState(1);
  const [bannerLoaded, setBannerLoaded] = useState(false);
  const [bannerImage, setBannerImage] = useState<string>("");

  const { slug } = useParams<{ slug: string }>();

  const {
    data: storeData,
    isLoading,
    error,
    hasMore,
    totalPages,
    isFromCache,
  } = useFetchData<StoreData>({
    store_url: slug,
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

  useEffect(() => {
    const storeBanner = storeData?.results?.info?.banner || "";

    if (!storeBanner && !isLoading) {
      setBannerImage(
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=70",
      );
      setBannerLoaded(false);
    } else {
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

  if (currentView === "checkout") {
    return (
      <div className="min-h-screen bg-white" style={themeVars}>
        <Checkout
          storeData={storeData}
          type={"out-store"}
          onBack={() => setCurrentView("store")}
        />
      </div>
    );
  }

  return (
    <>
      <div
        className="flex flex-col min-h-screen bg-white"
        style={themeVars}
      >
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
                    `Discover ${storeData?.results?.info.name || "Our Store"}`}
              </h1>
              <p className="text-base sm:text-lg text-white/90 mb-8 max-w-xl">
                {isLoading && !storeData
                  ? "Please wait..."
                  : storeData?.results?.info.description ||
                    "Browse curated products at unbeatable prices. Quality guaranteed, satisfaction assured."}
              </p>
              <a
                href="#products"
                className="inline-block bg-white text-[var(--brand-primary)] px-8 sm:px-10 py-3 sm:py-4 rounded-full font-medium text-sm sm:text-base hover:bg-gray-100 transition-colors"
              >
                Shop Now
              </a>
            </div>
          </div>

          {/* Stats Strip */}
          <div className="relative bg-[var(--brand-primary)] border-t border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
              <div className="grid grid-cols-3 gap-4 sm:gap-8 divide-x divide-white/15">
                <div className="text-center sm:text-left sm:pl-2">
                  <p className="font-display text-2xl sm:text-4xl text-white">
                    {storeData?.total ?? "—"}+
                  </p>
                  <p className="text-[10px] sm:text-sm text-white/70 mt-0.5">
                    Products Available
                  </p>
                </div>
                <div className="text-center sm:text-left sm:pl-6">
                  <p className="font-display text-2xl sm:text-4xl text-white">
                    {storeData?.results?.categories?.length ?? "—"}+
                  </p>
                  <p className="text-[10px] sm:text-sm text-white/70 mt-0.5">
                    Categories
                  </p>
                </div>
                <div className="text-center sm:text-left sm:pl-6">
                  <p className="font-display text-2xl sm:text-4xl text-white">
                    24/7
                  </p>
                  <p className="text-[10px] sm:text-sm text-white/70 mt-0.5">
                    Online Shopping
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <main id="products" className="flex-1 bg-white">
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

        <WhatsAppButton
          storeName={storeData?.results?.info?.name}
          storeData={storeData}
          storeSlug={slug}
        />

        <Footer storeData={storeData} />
      </div>
    </>
  );
};
