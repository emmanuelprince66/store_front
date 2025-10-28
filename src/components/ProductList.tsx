import { useEffect, useRef, useState } from "react";
import type { Category, Product } from "../type";
import { ProductCardSkeleton } from "./CardSkeleton";
import { ProductCard } from "./ProductCard";

interface ProductListProps {
  products: Product[];
  categories: Category[];
  currency: string;
  isLoading: boolean;
  selectedCategoryId: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  searchQuery: string;
  onSearchChange: (search: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasMore: boolean;
  totalProducts: number;
}

export const ProductList = ({
  products,
  categories,
  currency,
  isLoading,
  selectedCategoryId,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  currentPage,
  totalPages,
  onPageChange,
  // hasMore,
  totalProducts,
}: ProductListProps) => {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchQuery);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const categoriesContainerRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<number | null>(null);

  // console.log("products", products);
  // Handle debounced search
  const handleSearchInput = (value: string) => {
    setLocalSearchTerm(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = window.setTimeout(() => {
      onSearchChange(value);
    }, 500);
  };

  // Check scroll availability
  const checkScrollAvailability = () => {
    const container = categoriesContainerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth
      );
    }
  };

  // Category navigation functions
  const scrollCategories = (direction: "left" | "right") => {
    const container = categoriesContainerRef.current;
    if (container) {
      const scrollAmount = 200;
      const currentScroll = container.scrollLeft;
      const newScroll =
        direction === "left"
          ? currentScroll - scrollAmount
          : currentScroll + scrollAmount;

      container.scrollTo({
        left: newScroll,
        behavior: "smooth",
      });
    }
  };

  // Check scroll availability when categories load or container size changes
  useEffect(() => {
    checkScrollAvailability();
    const container = categoriesContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScrollAvailability);
      return () =>
        container.removeEventListener("scroll", checkScrollAvailability);
    }
  }, [categories]);

  // Check on window resize
  useEffect(() => {
    const handleResize = () => checkScrollAvailability();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages = [];
      const maxVisible = 5;

      if (totalPages <= maxVisible) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        if (currentPage <= 3) {
          for (let i = 1; i <= 4; i++) pages.push(i);
          pages.push("...");
          pages.push(totalPages);
        } else if (currentPage >= totalPages - 2) {
          pages.push(1);
          pages.push("...");
          for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
        } else {
          pages.push(1);
          pages.push("...");
          for (let i = currentPage - 1; i <= currentPage + 1; i++)
            pages.push(i);
          pages.push("...");
          pages.push(totalPages);
        }
      }

      return pages;
    };

    return (
      <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
        {/* Previous Button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all ${
            currentPage === 1
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-white text-gray-700 hover:bg-green-50 hover:text-green-600 shadow-sm"
          }`}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Page Numbers */}
        {getPageNumbers().map((page, index) =>
          page === "..." ? (
            <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all ${
                currentPage === page
                  ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md"
                  : "bg-white text-gray-700 hover:bg-green-50 hover:text-green-600 shadow-sm"
              }`}
            >
              {page}
            </button>
          )
        )}

        {/* Next Button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all ${
            currentPage === totalPages
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-white text-gray-700 hover:bg-green-50 hover:text-green-600 shadow-sm"
          }`}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    );
  };

  if (isLoading && products.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <div className="h-14 bg-gray-200 rounded-xl animate-pulse"></div>
          <div className="flex gap-2 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-10 bg-gray-200 rounded-lg w-24 animate-pulse flex-shrink-0"
              ></div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters Section */}
      <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 space-y-4">
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={localSearchTerm}
              onChange={(e) => handleSearchInput(e.target.value)}
              className="w-full px-5 py-3 sm:py-4 pl-12 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-500"
            />
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            {localSearchTerm && (
              <button
                onClick={() => {
                  setLocalSearchTerm("");
                  onSearchChange("");
                }}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Categories */}
        <div className="w-full">
          <div className="flex items-center w-full">
            {/* Left Navigation Button */}
            {canScrollLeft && (
              <button
                onClick={() => scrollCategories("left")}
                className="p-1 sm:p-2 rounded-md transition-all mr-1 sm:mr-2 flex-shrink-0 text-gray-600 hover:text-green-500 hover:bg-green-50"
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            )}

            {/* Categories Container */}
            <div
              ref={categoriesContainerRef}
              className="flex gap-1 sm:gap-2 justify-center mx-auto overflow-x-auto flex-1 py-1"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {/* All Tab */}
              <button
                className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium cursor-pointer rounded-lg transition-all whitespace-nowrap flex-shrink-0 ${
                  selectedCategoryId === null
                    ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => onCategoryChange(null)}
              >
                All
              </button>

              {/* Category Tabs */}
              {categories.map((category) => (
                <button
                  key={category.id}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm cursor-pointer font-medium rounded-lg transition-all whitespace-nowrap flex-shrink-0 ${
                    selectedCategoryId === category.id
                      ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => onCategoryChange(category.id)}
                >
                  {category.name}
                </button>
              ))}
            </div>

            {/* Right Navigation Button */}
            {canScrollRight && (
              <button
                onClick={() => scrollCategories("right")}
                className="p-1 sm:p-2 rounded-md transition-all ml-1 sm:ml-2 flex-shrink-0 text-gray-600 hover:text-green-500 hover:bg-green-50"
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Results Info */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Showing{" "}
            <span className="font-semibold text-green-600">
              {products.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-green-600">
              {totalProducts}
            </span>{" "}
            {totalProducts === 1 ? "product" : "products"}
            {currentPage > 1 && (
              <span className="text-gray-500">
                {" "}
                (Page {currentPage} of {totalPages})
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Products Grid */}
      {isLoading && Array.isArray(products) && products.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                currency={currency}
              />
            ))}
          </div>

          {/* Pagination */}
          {renderPagination()}
        </>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
          <svg
            className="mx-auto h-16 w-16 text-gray-300 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No products found
          </h3>
          <p className="text-gray-500 mb-4">
            Try adjusting your search or filter criteria
          </p>
          <button
            onClick={() => {
              setLocalSearchTerm("");
              onSearchChange("");
              onCategoryChange(null);
            }}
            className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all"
          >
            Clear Filters
          </button>
        </div>
      )}

      <style>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};
