// ============================================
// FILE: components/ProductCard.tsx
// ============================================

import { useContext, useState } from "react";
import { CartContext } from "../context/CartContext";
import type { Product } from "../type";
import { Modal } from "./Modal";
import { ProductModal } from "./ProductModal";

export const ProductCard = ({
  product,
  currency,
}: {
  product: Product;
  currency: string;
}) => {
  const { addToCart, cart } = useContext(CartContext);
  const [showModal, setShowModal] = useState(false);

  const hasVariations = product.variations && product.variations.length > 0;
  const isInCart = cart.some((item) => item.product.id === product.id);
  const displayPrice = hasVariations
    ? Math.min(...product.variations!.map((v) => v.selling_price))
    : product.selling_price || 0;

  // Check if product is available for purchase
  const isOutOfStock = product.status === "OUT-OF-STOCK";
  const isLowStock = product.status === "LOW";
  // const isInStock = product.status === "IN-STOCK";

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Don't allow adding out of stock items
    if (isOutOfStock) return;

    if (!hasVariations && !isInCart && !isOutOfStock) {
      addToCart(product, 1);
    } else {
      setShowModal(true);
    }
  };

  // Get stock status display info
  const getStockStatus = () => {
    if (isOutOfStock) {
      return {
        dotColor: "bg-red-500",
        textColor: "text-red-700",
        label: "Out of Stock",
      };
    }
    if (isLowStock) {
      return {
        dotColor: "bg-yellow-500",
        textColor: "text-yellow-700",
        label: `Low Stock (${product.quantity})`,
      };
    }
    return {
      dotColor: "bg-green-500",
      textColor: "text-green-700",
      label: `In Stock (${product.quantity})`,
    };
  };

  const stockStatus = getStockStatus();

  return (
    <>
      <div
        onClick={() => setShowModal(true)}
        className="group bg-white rounded-2xl cursor-pointer shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 transform hover:-translate-y-1"
      >
        <div className="relative overflow-hidden">
          <img
            src={
              product.image ||
              "https://via.placeholder.com/400x300?text=No+Image"
            }
            alt={product.name}
            className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://via.placeholder.com/400x300?text=No+Image";
            }}
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {hasVariations && (
              <span className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
                {product.variations!.length} Options
              </span>
            )}

            {isOutOfStock && (
              <span className="bg-red-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
                Out of Stock
              </span>
            )}

            {isLowStock && (
              <span className="bg-yellow-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
                Low Stock
              </span>
            )}
          </div>

          <div className="absolute bottom-3 left-3">
            <span className="bg-white bg-opacity-90 text-gray-800 text-xs font-semibold px-3 py-1 rounded-full capitalize">
              {product.category}
            </span>
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-sm font-bold text-gray-900 line-clamp-2 flex-1 pr-2">
              {product.name}
            </h3>
            <div className="flex-shrink-0">
              <p className="text-sm font-bold text-green-600">
                {currency}
                {hasVariations
                  ? `${displayPrice.toFixed(2)}+`
                  : displayPrice.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center text-sm">
              <div
                className={`w-2 h-2 ${stockStatus.dotColor} rounded-full mr-2`}
              ></div>
              <span className={`${stockStatus.textColor} font-medium`}>
                {stockStatus.label}
              </span>
            </div>
          </div>

          <button
            onClick={handleQuickAdd}
            disabled={isOutOfStock || (isInCart && !hasVariations)}
            className={`w-full py-3 px-4 rounded-xl font-semibold transition-all transform ${
              isOutOfStock || (isInCart && !hasVariations)
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 hover:shadow-lg hover:scale-105 active:scale-95"
            }`}
          >
            {isOutOfStock ? (
              <span className="flex items-center justify-center">
                <svg
                  className="w-5 h-5 mr-2"
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
                Out of Stock
              </span>
            ) : isInCart && !hasVariations ? (
              <span className="flex items-center justify-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Added to Cart
              </span>
            ) : hasVariations ? (
              "Select Options"
            ) : (
              <span className="flex items-center justify-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                Add to Cart
              </span>
            )}
          </button>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <ProductModal
          product={product}
          onClose={() => setShowModal(false)}
          currency={currency}
        />
      </Modal>
    </>
  );
};
