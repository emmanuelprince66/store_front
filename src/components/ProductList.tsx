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
  totalProducts,
}: ProductListProps) => {
  const activeCategory = categories.find((c) => c.id === selectedCategoryId);
  const sectionTitle = activeCategory ? activeCategory.name : "New Arrivals";

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages: (number | string)[] = [];
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
      <div className="flex items-center justify-between gap-2 sm:gap-3 mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-gray-200">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full font-medium text-xs sm:text-sm transition-all border border-gray-200 ${
            currentPage === 1
              ? "text-gray-300 cursor-not-allowed"
              : "text-black hover:bg-gray-100"
          }`}
        >
          <svg
            className="w-3.5 h-3.5 sm:w-4 sm:h-4"
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
          <span className="hidden sm:inline">Previous</span>
        </button>

        <div className="flex items-center gap-1 sm:gap-1.5">
          {getPageNumbers().map((page, index) =>
            page === "..." ? (
              <span
                key={`ellipsis-${index}`}
                className="px-1 text-gray-400 text-xs sm:text-sm"
              >
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page as number)}
                className={`min-w-[32px] sm:min-w-[40px] h-8 sm:h-10 px-2 text-xs sm:text-sm rounded-md font-medium transition-all ${
                  currentPage === page
                    ? "bg-[var(--brand-surface)] text-[var(--brand-primary)]"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {page}
              </button>
            ),
          )}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full font-medium text-xs sm:text-sm transition-all border border-gray-200 ${
            currentPage === totalPages
              ? "text-gray-300 cursor-not-allowed"
              : "text-black hover:bg-gray-100"
          }`}
        >
          <span className="hidden sm:inline">Next</span>
          <svg
            className="w-3.5 h-3.5 sm:w-4 sm:h-4"
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
      <div className="space-y-6 sm:space-y-10">
        <div className="text-center">
          <div className="h-10 sm:h-12 bg-gray-100 rounded animate-pulse w-64 mx-auto" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-8">
          {[...Array(8)].map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-10">
      {/* Section Title */}
      <div className="text-center">
        <h2 className="font-display text-3xl sm:text-5xl text-[var(--brand-primary)] uppercase tracking-wide mb-2">
          {sectionTitle}
        </h2>
        <p className="text-sm text-gray-500">
          {totalProducts > 0
            ? `Showing ${products.length} of ${totalProducts} ${totalProducts === 1 ? "product" : "products"}`
            : "Discover our collection"}
          {currentPage > 1 && (
            <span className="ml-1 text-gray-400">
              · Page {currentPage} of {totalPages}
            </span>
          )}
          {searchQuery && (
            <span className="ml-1 text-gray-400">· "{searchQuery}"</span>
          )}
        </p>
      </div>

      {/* Products Grid */}
      {isLoading && Array.isArray(products) && products.length === 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-8">
          {[...Array(8)].map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products.length > 0 ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-8">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                currency={currency}
              />
            ))}
          </div>

          {renderPagination()}
        </>
      ) : (
        <div className="text-center py-16 sm:py-24">
          <svg
            className="mx-auto h-12 w-12 sm:h-14 sm:w-14 text-gray-300 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="font-display text-2xl sm:text-3xl text-black uppercase tracking-wide mb-2">
            No products found
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Try adjusting your search or filter criteria
          </p>
          <button
            onClick={() => {
              onSearchChange("");
              onCategoryChange(null);
            }}
            className="px-8 py-3 text-sm bg-[var(--brand-primary)] text-[var(--brand-on-primary)] rounded-full font-medium hover:opacity-90 transition-all"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};
