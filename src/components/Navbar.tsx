import { useEffect, useRef, useState } from "react";
import type { Category } from "../type";
import CartIcon from "./CartIcon";

interface NavbarProps {
  storeData: any;
  categories: Category[];
  selectedCategoryId: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  searchQuery: string;
  onSearchChange: (search: string) => void;
  onCheckout: () => void;
}

export const Navbar = ({
  storeData,
  categories,
  selectedCategoryId,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  onCheckout,
}: NavbarProps) => {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const searchTimeoutRef = useRef<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search
  const handleSearchInput = (value: string) => {
    setLocalSearch(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = window.setTimeout(() => {
      onSearchChange(value);
    }, 400);
  };

  // Sync external changes (e.g. clear filters)
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsShopOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Cleanup debounce
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  const activeCategory = categories.find((c) => c.id === selectedCategoryId);
  const storeName = storeData?.results?.info?.name || "Store";
  const logo = storeData?.results?.info?.logo;
  // Same flag the checkout gates the Pay Later option on, so the header can
  // never advertise something the payment screen won't offer.
  const acceptsBnpl = storeData?.results?.info?.enable_bnpl === true;

  const handleCategorySelect = (id: string | null) => {
    onCategoryChange(id);
    setIsShopOpen(false);
  };

  return (
    <header className="bg-white border-b-2 border-gray-200 z-30 sticky top-0">
      {/* Full-bleed strip above the logo row: shoppers decide whether they can
          afford something long before they reach checkout, so the option has
          to be visible on the store front, not only on the payment screen. */}
      {acceptsBnpl && (
        <div className="bg-[var(--brand-primary)] px-4 py-1.5 text-center text-[11px] sm:text-xs font-semibold tracking-wide text-[var(--brand-on-primary)]">
          We accept Buy Now, Pay Later with Akawopay
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-10">
        {/* Top row */}
        <div className="flex items-center justify-between h-20 sm:h-28 gap-4 sm:gap-8">
          {/* Logo + Store Name */}
          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0 flex-shrink-0">
            {logo ? (
              <img
                src={logo}
                alt={storeName}
                loading="eager"
                decoding="async"
                width={44}
                height={44}
                className="w-11 h-11 sm:w-14 sm:h-14 object-cover rounded-md flex-shrink-0"
              />
            ) : (
              <div className="w-11 h-11 sm:w-14 sm:h-14 bg-[var(--brand-primary)] rounded-md flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-6 h-6 sm:w-7 sm:h-7 text-[var(--brand-on-primary)]"
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
            )}
            <p className="font-display font-bold text-xl sm:text-3xl text-[var(--brand-primary)] uppercase tracking-wide truncate">
              {storeName}
            </p>
          </div>

          {/* Shop dropdown - desktop only inline */}
          <div className="hidden md:block relative" ref={dropdownRef}>
            <button
              onClick={() => setIsShopOpen(!isShopOpen)}
              className="flex cursor-pointer items-center gap-1.5 px-4 py-2.5 rounded-full text-base font-bold text-black hover:bg-gray-100 transition-colors"
            >
              <span>{activeCategory ? activeCategory.name : "Shop"}</span>
              <svg
                className={`w-4 h-4 transition-transform ${
                  isShopOpen ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {isShopOpen && (
              <div className="absolute cursor-pointer top-full left-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 max-h-[60vh] overflow-y-auto animate-fadeIn">
                <button
                  onClick={() => handleCategorySelect(null)}
                  className={`w-full cursor-pointer text-left px-4 py-2.5 text-sm transition-colors ${
                    selectedCategoryId === null
                      ? "bg-[var(--brand-primary)] text-[var(--brand-on-primary)] font-medium"
                      : "text-black hover:bg-gray-100"
                  }`}
                >
                  All Products
                </button>
                {categories.length > 0 && (
                  <div className="my-1 border-t border-gray-100" />
                )}
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category.id)}
                    className={`w-full cursor-pointer text-left px-4 py-2.5 text-sm transition-colors capitalize ${
                      selectedCategoryId === category.id
                        ? "bg-[var(--brand-primary)] text-[var(--brand-on-primary)] font-medium"
                        : "text-black hover:bg-gray-100"
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search - desktop */}
          <div className="hidden md:flex flex-1 max-w-xl">
            <SearchInput
              value={localSearch}
              onChange={handleSearchInput}
              onClear={() => {
                setLocalSearch("");
                onSearchChange("");
              }}
            />
          </div>

          {/* Cart */}
          <CartIcon onCheckout={onCheckout} />
        </div>

        {/* Bottom row - mobile search + categories */}
        <div className="md:hidden flex items-center gap-2 pb-3 -mt-1">
          <MobileShopDropdown
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onCategoryChange={handleCategorySelect}
            activeCategoryName={activeCategory?.name}
          />
          <div className="flex-1">
            <SearchInput
              value={localSearch}
              onChange={handleSearchInput}
              onClear={() => {
                setLocalSearch("");
                onSearchChange("");
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
};

const SearchInput = ({
  value,
  onChange,
  onClear,
}: {
  value: string;
  onChange: (val: string) => void;
  onClear: () => void;
}) => (
  <div className="relative w-full">
    <input
      type="text"
      placeholder="Search for products..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full pl-11 pr-10 py-3 text-sm font-medium bg-[#f0f0f0] border-0 rounded-full focus:outline-none focus:ring-2 focus:ring-black/10 transition-all text-black placeholder-gray-500"
    />
    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
      <svg
        className="h-4 w-4 text-gray-500"
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
    {value && (
      <button
        onClick={onClear}
        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-black"
        aria-label="Clear search"
      >
        <svg
          className="h-4 w-4"
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
);

const MobileShopDropdown = ({
  categories,
  selectedCategoryId,
  onCategoryChange,
  activeCategoryName,
}: {
  categories: Category[];
  selectedCategoryId: string | null;
  onCategoryChange: (id: string | null) => void;
  activeCategoryName?: string;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2.5 rounded-full text-sm font-medium text-black bg-[#f0f0f0] hover:bg-gray-200 transition-colors"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
        <span className="text-xs">{activeCategoryName || "Shop"}</span>
        <svg
          className={`w-3.5 h-3.5 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 max-h-[60vh] overflow-y-auto z-40 animate-fadeIn">
          <button
            onClick={() => {
              onCategoryChange(null);
              setOpen(false);
            }}
            className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
              selectedCategoryId === null
                ? "bg-[var(--brand-primary)] text-[var(--brand-on-primary)] font-medium"
                : "text-black hover:bg-gray-100"
            }`}
          >
            All Products
          </button>
          {categories.length > 0 && (
            <div className="my-1 border-t border-gray-100" />
          )}
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => {
                onCategoryChange(category.id);
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors capitalize ${
                selectedCategoryId === category.id
                  ? "bg-[var(--brand-primary)] text-[var(--brand-on-primary)] font-medium"
                  : "text-black hover:bg-gray-100"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
