import { useContext } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import type { Product } from "../type";
import { countMedia, getPrimaryImage } from "../utils/media";
import { ProductImageWithPlaceholder } from "./ImagePlaceHolder";

export const ProductCard = ({
  product,
  currency,
}: {
  product: Product;
  currency: string;
}) => {
  const { addToCart, cart } = useContext(CartContext);
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const base = location.pathname.startsWith("/o") ? "/o" : "/i";

  const openProduct = () =>
    navigate(`${base}/${slug}/product/${product.id}`, { state: { product } });

  const hasVariations = product.variations && product.variations.length > 0;

  const primaryImage = getPrimaryImage(product);
  const mediaInfo = countMedia(product);

  const isInCart = hasVariations
    ? cart.some((item) =>
        product.variations?.some((v) => v.id === item.variation?.id),
      )
    : cart.some((item) => item.product.id === product.id && !item.variation);

  const displayPrice = hasVariations
    ? Math.min(...product.variations!.map((v) => v.selling_price))
    : product.selling_price || 0;

  const isOutOfStock = product.status === "OUT-OF-STOCK";
  const isLowStock = product.status === "LOW";
  // Combo products don't carry their own stock count — just show status.
  const isCombo = product.type === "COMBO";

  const hasDiscount =
    product.discount != null && product.discount > 0 && !hasVariations;
  const originalPrice = hasDiscount
    ? displayPrice + (product.discount as number)
    : null;
  const discountPct =
    hasDiscount && originalPrice
      ? Math.round(((product.discount as number) / originalPrice) * 100)
      : 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;

    if (hasVariations || isInCart) {
      openProduct();
    } else {
      addToCart(product, 1);
    }
  };

  return (
    <>
      <div
        onClick={openProduct}
        className="group cursor-pointer flex flex-col"
      >
        {/* Image */}
        <div className="relative w-full aspect-square overflow-hidden rounded-2xl bg-[#f0f0f0]">
          <div className="absolute inset-0 p-4 sm:p-6 transition-transform duration-500 group-hover:scale-105">
            <ProductImageWithPlaceholder
              product={{ image: primaryImage, name: product.name }}
              className="w-full h-full"
              objectFit="contain"
            />
          </div>

          {/* Top-left badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-10">
            {isOutOfStock && (
              <span className="bg-black text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
                Out of Stock
              </span>
            )}
            {isLowStock && (
              <span className="bg-black text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
                Low Stock
              </span>
            )}
            {hasVariations && (
              <span className="bg-white text-black text-[10px] font-semibold px-2.5 py-1 rounded-full shadow-sm">
                {product.variations!.length} Options
              </span>
            )}
          </div>

          {/* Top-right badges: discount + media indicator */}
          <div className="absolute top-2 right-2 z-10 flex flex-col items-end gap-1.5">
            {hasDiscount && (
              <span className="bg-[#FF3333]/10 text-[#FF3333] text-[10px] font-semibold px-2.5 py-1 rounded-full">
                -{discountPct}%
              </span>
            )}
            {mediaInfo.videos > 0 ? (
              <span className="flex items-center gap-1 bg-black/70 text-white text-[10px] font-semibold px-2 py-1 rounded-full backdrop-blur-sm">
                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Video
              </span>
            ) : (
              mediaInfo.total > 1 && (
                <span className="flex items-center gap-1 bg-white/90 text-black text-[10px] font-semibold px-2 py-1 rounded-full shadow-sm backdrop-blur-sm">
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {mediaInfo.total}
                </span>
              )
            )}
          </div>

          {/* Quick add — appears on hover */}
          <button
            onClick={handleQuickAdd}
            disabled={isOutOfStock}
            className={`absolute bottom-3 left-3 right-3 py-2.5 rounded-full text-xs font-semibold transition-all duration-300 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 ${
              isOutOfStock
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-[var(--brand-primary)] text-[var(--brand-on-primary)] hover:opacity-90"
            }`}
          >
            {isOutOfStock
              ? "Unavailable"
              : hasVariations
                ? "Select Options"
                : isInCart
                  ? "View in Cart"
                  : "Add to Cart"}
          </button>
        </div>

        {/* Info */}
        <div className="pt-3 sm:pt-4 px-1">
          <h3
            className="font-bold text-sm sm:text-base text-black truncate mb-1"
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Price */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base sm:text-lg font-bold text-[var(--brand-primary)]">
              {currency}
              {hasVariations
                ? `${displayPrice.toFixed(2)}+`
                : displayPrice.toFixed(2)}
            </span>
            {hasDiscount && originalPrice && (
              <>
                <span className="text-sm sm:text-base font-bold text-gray-400 line-through">
                  {currency}
                  {originalPrice.toFixed(2)}
                </span>
                <span className="bg-[#FF3333]/10 text-[#FF3333] text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  -{discountPct}%
                </span>
              </>
            )}
          </div>

          {/* Stock + cart indicator */}
          <div className="mt-1.5 flex items-center justify-between text-[10px] sm:text-xs">
            <span
              className={`${
                isOutOfStock
                  ? "text-[#FF3333]"
                  : isLowStock
                    ? "text-amber-600"
                    : "text-gray-500"
              }`}
            >
              {isOutOfStock
                ? "Out of stock"
                : isLowStock
                  ? isCombo
                    ? "Low stock"
                    : `Only ${product.quantity} left`
                  : isCombo
                    ? "In stock"
                    : `${product.quantity} in stock`}
            </span>
            {isInCart && (
              <span className="text-black font-semibold">In Cart ✓</span>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
