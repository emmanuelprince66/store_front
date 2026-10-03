// ============================================
// FILE: pages/ProductPage.tsx
// Full-page product detail (replaces the product modal).
// Shows the media gallery, full description, variations and add-to-cart.
// ============================================

import { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";
import { ProductGallery } from "../components/ProductGallery";
import { WhatsAppButton } from "../components/WhatsAppButton";
import { CartContext } from "../context/CartContext";
import type { Product, ProductVariation, StoreData } from "../type";
import useFetchData from "../useFetchDataHook";
import { useStoreTheme } from "../utils/theme";

interface ProductPageProps {
  type: "in-store" | "out-store";
}

export const ProductPage = ({ type }: ProductPageProps) => {
  const { slug, productId } = useParams<{ slug: string; productId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const base = type === "in-store" ? "/i" : "/o";

  const { addToCart, cart } = useContext(CartContext);

  // Product passed instantly via navigation state; store data fetched for
  // the navbar/footer chrome and as a fallback when opened via direct link.
  const passedProduct = (location.state as { product?: Product } | null)
    ?.product;

  const {
    data: storeData,
    isLoading,
    isFromCache,
  } = useFetchData<StoreData>({
    store_url: slug || "",
    limit: 100,
  });

  const product =
    passedProduct ||
    storeData?.results?.products?.find((p) => p.id === productId);

  const currency = storeData?.results?.info?.currency || "₦";

  const [selectedVariation, setSelectedVariation] =
    useState<ProductVariation | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setSelectedVariation(product?.variations?.[0] || null);
    setQuantity(1);
    window.scrollTo({ top: 0 });
  }, [product?.id]);

  const { vars: themeVars } = useStoreTheme(storeData, slug, !isFromCache);

  const goToStore = (state?: Record<string, unknown>) =>
    navigate(`${base}/${slug}`, state ? { state } : undefined);

  // ---------- Loading / not-found ----------
  if (!product) {
    return (
      <div
        className="flex min-h-screen flex-col bg-white"
        style={themeVars}
      >
        <Navbar
          storeData={storeData}
          categories={storeData?.results?.categories || []}
          selectedCategoryId={null}
          onCategoryChange={(id) => goToStore({ categoryId: id })}
          searchQuery=""
          onSearchChange={(s) => goToStore({ search: s })}
          onCheckout={() => goToStore({ openCheckout: true })}
        />
        <div className="flex flex-1 items-center justify-center p-6 text-center">
          {isLoading ? (
            <div className="animate-pulse text-gray-400">Loading product…</div>
          ) : (
            <div className="max-w-md">
              <h2 className="font-display text-2xl uppercase tracking-wide text-black">
                Product not found
              </h2>
              <p className="mt-2 mb-6 text-sm text-gray-500">
                This product may no longer be available.
              </p>
              <button
                onClick={() => goToStore()}
                className="rounded-full bg-black px-8 py-3 text-sm font-medium text-white transition-all hover:bg-gray-800"
              >
                Back to store
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---------- Derived pricing / stock ----------
  const hasVariations = !!product.variations && product.variations.length > 0;

  const isInCart = cart.some((item) =>
    hasVariations && selectedVariation
      ? item.variation?.id === selectedVariation.id
      : item.product.id === product.id && !item.variation,
  );

  // Combo products don't carry a stock count — status (IN-STOCK/LOW/OUT-OF-STOCK)
  // is pre-computed backend-side from the combo's constituent items.
  const isCombo = product.type === "COMBO";

  const displayPrice =
    selectedVariation?.selling_price || product.selling_price || 0;
  const displayQuantity =
    selectedVariation?.quantity || product.quantity || (isCombo ? 99 : 0);
  const currentStatus = selectedVariation
    ? selectedVariation.status
    : product.status;
  const isOutOfStock = currentStatus === "OUT-OF-STOCK";
  const isLowStock = currentStatus === "LOW";

  const activeDiscount = hasVariations
    ? selectedVariation?.discount
    : product.discount;
  const hasDiscount = activeDiscount != null && activeDiscount > 0;
  const originalPrice = hasDiscount ? displayPrice + activeDiscount : null;
  const discountPct =
    hasDiscount && originalPrice
      ? Math.round((activeDiscount / originalPrice) * 100)
      : 0;

  const handleAddToCart = () => {
    if (hasVariations && !selectedVariation) return;
    if (isOutOfStock) return;
    addToCart(product, quantity, selectedVariation || undefined);
  };

  return (
    <div
      className="flex min-h-screen flex-col bg-white"
      style={themeVars}
    >
      <Navbar
        storeData={storeData}
        categories={storeData?.results?.categories || []}
        selectedCategoryId={null}
        onCategoryChange={(id) => goToStore({ categoryId: id })}
        searchQuery=""
        onSearchChange={(s) => goToStore({ search: s })}
        onCheckout={() => goToStore({ openCheckout: true })}
      />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
          {/* Breadcrumb / back */}
          <div className="mb-5 flex items-center gap-2.5">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#f0f0f0] py-2 pl-3 pr-4 text-sm font-semibold text-black transition-colors hover:bg-gray-200"
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
                  strokeWidth="2.5"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back
            </button>
            <span className="text-gray-300">/</span>
            <span className="capitalize text-sm text-gray-400">
              {product.category}
            </span>
          </div>

          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            {/* ---------- Gallery ---------- */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <ProductGallery product={product} variant="full" />
            </div>

            {/* ---------- Details ---------- */}
            <div className="flex flex-col">
              <span className="mb-2 inline-flex w-fit items-center rounded-full bg-[#f0f0f0] px-3 py-1 text-xs font-medium capitalize text-gray-600">
                {product.category}
              </span>

              <h1 className="font-display text-3xl uppercase leading-tight tracking-wide text-[var(--brand-primary)] sm:text-4xl">
                {product.name}
              </h1>

              {/* Price */}
              <div className="mt-4 flex flex-wrap items-center gap-3 border-b border-gray-200 pb-5">
                <span className="text-3xl font-bold text-[var(--brand-primary)]">
                  {currency}
                  {displayPrice.toFixed(2)}
                </span>
                {hasDiscount && originalPrice && (
                  <>
                    <span className="text-xl font-bold text-gray-400 line-through">
                      {currency}
                      {originalPrice.toFixed(2)}
                    </span>
                    <span className="rounded-full bg-[#FF3333]/10 px-2.5 py-1 text-xs font-semibold text-[#FF3333]">
                      -{discountPct}%
                    </span>
                  </>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <div className="border-b border-gray-200 py-5">
                  <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-900">
                    Description
                  </h2>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-gray-600">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Meta chips */}
              <div className="flex flex-wrap gap-2 py-5">
                {(selectedVariation?.sku || product.sku) && (
                  <span className="rounded-lg bg-gray-50 px-3 py-1.5 text-xs text-gray-600">
                    SKU:{" "}
                    <span className="font-medium text-black">
                      {selectedVariation?.sku || product.sku}
                    </span>
                  </span>
                )}
                {product.unit && (
                  <span className="rounded-lg bg-gray-50 px-3 py-1.5 text-xs text-gray-600">
                    Unit:{" "}
                    <span className="font-medium text-black">
                      {product.unit}
                    </span>
                  </span>
                )}
                <span
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                    isOutOfStock
                      ? "bg-[#FF3333]/10 text-[#FF3333]"
                      : isLowStock
                        ? "bg-amber-50 text-amber-600"
                        : "bg-green-50 text-green-700"
                  }`}
                >
                  {isOutOfStock
                    ? "Out of stock"
                    : isLowStock
                      ? isCombo
                        ? "Low stock"
                        : `Only ${displayQuantity} left`
                      : isCombo
                        ? "In stock"
                        : `${displayQuantity} in stock`}
                </span>
              </div>

              {/* Variations */}
              {hasVariations && (
                <div className="pb-5">
                  <h3 className="mb-3 text-sm font-medium text-gray-500">
                    Choose Option
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {product.variations!.map((variation) => {
                      const varOut = variation.status === "OUT-OF-STOCK";
                      const isSelected = selectedVariation?.id === variation.id;
                      return (
                        <button
                          key={variation.id}
                          onClick={() => setSelectedVariation(variation)}
                          disabled={varOut}
                          className={`rounded-full border px-5 py-2 text-sm font-medium transition-all ${
                            isSelected
                              ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-[var(--brand-on-primary)]"
                              : varOut
                                ? "cursor-not-allowed border-gray-100 bg-gray-100 text-gray-400 line-through"
                                : "border-transparent bg-[var(--brand-surface)] text-black hover:border-gray-300"
                          }`}
                        >
                          {variation.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity + Add to cart */}
              <div className="mt-auto flex flex-col gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:items-center">
                <div className="flex items-center justify-between rounded-full bg-[#f0f0f0] px-2 py-1 sm:justify-start">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={isOutOfStock || quantity <= 1}
                    className="flex cursor-pointer h-10 w-10 items-center justify-center rounded-full text-lg font-bold transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    −
                  </button>
                  <span className="w-10 text-center text-base font-semibold text-black">
                    {quantity}
                  </span>
                  <button
                    onClick={() =>
                      setQuantity(Math.min(displayQuantity, quantity + 1))
                    }
                    disabled={isOutOfStock || quantity >= displayQuantity}
                    className="flex cursor-pointer h-10 w-10 items-center justify-center rounded-full text-lg font-bold transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={
                    isOutOfStock || (hasVariations && !selectedVariation)
                  }
                  className={`flex-1 cursor-pointer rounded-full mb-4 px-6 py-3.5 text-base font-medium transition-all ${
                    isOutOfStock || (hasVariations && !selectedVariation)
                      ? "cursor-not-allowed bg-gray-200 text-gray-400"
                      : "bg-[var(--brand-primary)] cursor-pointer text-[var(--brand-on-primary)] hover:opacity-90"
                  }`}
                >
                  {isOutOfStock
                    ? "Out of Stock"
                    : hasVariations && !selectedVariation
                      ? "Select an Option"
                      : isInCart
                        ? `Add ${quantity} More to Cart`
                        : "Add to Cart"}
                </button>
              </div>

              {isInCart && (
                <div className="mt-4 border-t border-gray-200 pt-5">
                  <button
                    onClick={() => goToStore({ openCheckout: true })}
                    className="group mt-3 cursor-pointer flex w-full items-center justify-center gap-2 rounded-full border-2 border-[var(--brand-primary)] bg-white px-6 py-3.5 text-base font-medium text-[var(--brand-primary)] transition-all hover:bg-[var(--brand-primary)] hover:text-[var(--brand-on-primary)]"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    View Cart &amp; Checkout
                    <svg
                      className="h-4 w-4 transition-transform group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <WhatsAppButton
        storeName={storeData?.results?.info?.name}
        storeData={storeData}
      />

      <Footer storeData={storeData} />
    </div>
  );
};

export default ProductPage;
