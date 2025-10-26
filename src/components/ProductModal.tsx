// ============================================
// FILE: components/ProductModal.tsx
// ============================================

import { useContext, useState } from "react";
import { CartContext } from "../context/CartContext";
import type { Product, ProductVariation } from "../type";

interface ProductModalProps {
  product: Product;
  onClose: () => void;
  currency: string;
}

export const ProductModal = ({
  product,
  onClose,
  currency,
}: ProductModalProps) => {
  const { addToCart, cart } = useContext(CartContext);
  const [selectedVariation, setSelectedVariation] =
    useState<ProductVariation | null>(product.variations?.[0] || null);
  const [quantity, setQuantity] = useState(1);

  const hasVariations = product.variations && product.variations.length > 0;
  const isInCart = cart.some(
    (item) =>
      item.product.id === product.id &&
      (!hasVariations || item.variation?.id === selectedVariation?.id)
  );

  const displayPrice =
    selectedVariation?.selling_price || product.selling_price || 0;
  const displayQuantity = selectedVariation?.quantity || product.quantity || 0;

  // Get current status (from variation or product)
  const currentStatus = selectedVariation
    ? selectedVariation.status
    : product.status;
  const isOutOfStock = currentStatus === "OUT-OF-STOCK";
  const isLowStock = currentStatus === "LOW";
  const isInStock = currentStatus === "IN-STOCK";

  const handleAddToCart = () => {
    if (hasVariations && !selectedVariation) return;
    if (isOutOfStock) return;

    addToCart(product, quantity, selectedVariation || undefined);
    onClose();
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
        label: `Low Stock (${displayQuantity})`,
      };
    }
    return {
      dotColor: "bg-green-500",
      textColor: "text-green-700",
      label: `In Stock (${displayQuantity})`,
    };
  };

  const stockStatus = getStockStatus();

  // Get variation status display
  const getVariationStatus = (variation: ProductVariation) => {
    if (variation.status === "OUT-OF-STOCK") {
      return "Out of stock";
    }
    if (variation.status === "LOW") {
      return `Low stock (${variation.quantity})`;
    }
    return `${variation.quantity} available`;
  };

  return (
    <div className="relative max-h-[90vh] w-full overflow-y-auto bg-white rounded-2xl">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 bg-white bg-opacity-90 hover:bg-opacity-100 p-2 rounded-full shadow-lg transition-all"
      >
        <svg
          className="w-6 h-6 text-gray-600"
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

      <div className="relative bg-gray-100">
        <img
          src={
            product.image || "https://via.placeholder.com/800x600?text=No+Image"
          }
          alt={product.name}
          className="w-full h-80 md:h-96 object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://via.placeholder.com/800x600?text=No+Image";
          }}
        />

        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <span className="bg-white bg-opacity-90 text-gray-800 text-sm font-semibold px-4 py-2 rounded-full shadow-lg capitalize">
            {product.category}
          </span>

          {/* Stock Status Badge */}
          {isOutOfStock && (
            <span className="bg-red-500 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-lg">
              Out of Stock
            </span>
          )}
          {isLowStock && (
            <span className="bg-yellow-500 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-lg">
              Low Stock
            </span>
          )}
        </div>
      </div>

      <div className="p-6 md:p-8">
        <div className="mb-6">
          <h2 className="text-xs font-bold text-gray-900 mb-3">
            {product.name}
          </h2>
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-green-600">
              {currency}
              {displayPrice.toFixed(2)}
            </p>
            <div className="flex items-center">
              <div
                className={`w-3 h-3 ${stockStatus.dotColor} rounded-full mr-2`}
              ></div>
              <span className={`${stockStatus.textColor} font-semibold`}>
                {stockStatus.label}
              </span>
            </div>
          </div>
        </div>

        {hasVariations && (
          <div className="mb-6">
            <h3 className="text-base font-semibold text-gray-900 mb-3 uppercase">
              Select Variation
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {product.variations!.map((variation) => {
                const varIsOutOfStock = variation.status === "OUT-OF-STOCK";
                const varIsLowStock = variation.status === "LOW";
                const varIsInStock = variation.status === "IN-STOCK";

                return (
                  <button
                    key={variation.id}
                    onClick={() => setSelectedVariation(variation)}
                    disabled={varIsOutOfStock}
                    className={`p-4 rounded-lg border-2 font-medium transition-all text-left ${
                      selectedVariation?.id === variation.id
                        ? varIsLowStock
                          ? "border-yellow-500 bg-yellow-50 text-yellow-900"
                          : "border-green-500 bg-green-50 text-green-900"
                        : varIsOutOfStock
                        ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                        : varIsLowStock
                        ? "border-yellow-300 bg-white text-gray-800 hover:border-yellow-400"
                        : "border-gray-300 bg-white text-gray-800 hover:border-gray-400"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-bold">{variation.name}</div>
                      {varIsLowStock && (
                        <span className="text-xs bg-yellow-500 text-white px-2 py-0.5 rounded-full">
                          Low
                        </span>
                      )}
                    </div>
                    <div className="text-sm mb-1">
                      {currency}
                      {variation.selling_price.toFixed(2)}
                    </div>
                    <div
                      className={`text-xs ${
                        varIsOutOfStock
                          ? "text-red-600"
                          : varIsLowStock
                          ? "text-yellow-600"
                          : "text-green-600"
                      }`}
                    >
                      {getVariationStatus(variation)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase">
            Quantity
          </h3>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={isOutOfStock}
              className="w-12 h-12 rounded-lg border-2 border-gray-300 hover:border-gray-400 flex items-center justify-center transition-colors text-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              −
            </button>
            <span className="text-2xl font-semibold text-gray-900 w-16 text-center">
              {quantity}
            </span>
            <button
              onClick={() =>
                setQuantity(Math.min(displayQuantity, quantity + 1))
              }
              disabled={isOutOfStock}
              className="w-12 h-12 rounded-lg border-2 border-gray-300 hover:border-gray-400 flex items-center justify-center transition-colors text-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              +
            </button>
          </div>
          {isLowStock && (
            <p className="text-sm text-yellow-600 mt-2">
              ⚠️ Only {displayQuantity} left in stock
            </p>
          )}
        </div>

        {product.sku && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">SKU:</span>{" "}
              {selectedVariation?.sku || product.sku}
            </p>
          </div>
        )}

        <button
          onClick={handleAddToCart}
          disabled={
            isOutOfStock || isInCart || (hasVariations && !selectedVariation)
          }
          className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all transform ${
            isOutOfStock || isInCart || (hasVariations && !selectedVariation)
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 hover:shadow-xl hover:scale-105 active:scale-95"
          }`}
        >
          {isOutOfStock ? (
            <span className="flex items-center justify-center">
              <svg
                className="w-6 h-6 mr-2"
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
          ) : isInCart ? (
            <span className="flex items-center justify-center">
              <svg
                className="w-6 h-6 mr-2"
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
          ) : hasVariations && !selectedVariation ? (
            "Please Select a Variation"
          ) : (
            <span className="flex items-center justify-center">
              <svg
                className="w-6 h-6 mr-2"
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
              Add {quantity} to Cart
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
