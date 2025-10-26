// ============================================
// FILE: components/ProductBottomDrawer.tsx
// ============================================

import { useContext, useState } from "react";
import { CartContext } from "../context/CartContext";
import type { Product, ProductVariation } from "../type";

interface ProductBottomDrawerProps {
  product: Product;
  onClose: () => void;
  currency: string;
}

const ProductBottomDrawer = ({
  product,
  onClose,
  currency,
}: ProductBottomDrawerProps) => {
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
  const isInStock = selectedVariation
    ? selectedVariation.status === "IN-STOCK"
    : product.status === "IN-STOCK";

  const handleAddToCart = () => {
    if (hasVariations && !selectedVariation) return;

    addToCart(product, quantity, selectedVariation || undefined);
    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 backdrop-blur-md bg-transparent bg-opacity-50 z-40"
        onClick={onClose}
      ></div>

      <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up">
        <div className="bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto">
          {/* Handle Bar */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-20 bg-white hover:bg-gray-100 p-2 rounded-full shadow-lg transition-all"
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

          {/* Product Image */}
          <div className="relative bg-gray-100">
            <img
              src={
                product.image ||
                "https://via.placeholder.com/800x400?text=No+Image"
              }
              alt={product.name}
              className="w-full h-64 object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://via.placeholder.com/800x400?text=No+Image";
              }}
            />

            {/* Category Badge */}
            <div className="absolute top-4 left-4">
              <span className="bg-white bg-opacity-90 text-gray-800 text-sm font-semibold px-4 py-2 rounded-full shadow-lg capitalize">
                {product.category}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Header */}
            <div className="mb-4">
              <h2 className="text-sm font-bold text-gray-900 mb-2">
                {product.name}
              </h2>
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-green-600">
                  {currency}
                  {displayPrice.toFixed(2)}
                </p>
                <div className="flex items-center">
                  {isInStock ? (
                    <>
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-green-700 font-semibold">
                        In Stock ({displayQuantity})
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                      <span className="text-red-700 font-semibold">
                        Out of Stock
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Variations Section */}
            {hasVariations && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2 uppercase">
                  Select Variation
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {product.variations!.map((variation) => (
                    <button
                      key={variation.id}
                      onClick={() => setSelectedVariation(variation)}
                      disabled={variation.status !== "IN-STOCK"}
                      className={`p-4 rounded-lg border-2 font-medium transition-all text-left ${
                        selectedVariation?.id === variation.id
                          ? "border-green-500 bg-green-50 text-green-900"
                          : variation.status === "IN-STOCK"
                          ? "border-gray-300 bg-white text-gray-800 hover:border-gray-400"
                          : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      <div className="font-bold mb-1">{variation.name}</div>
                      <div className="text-sm">
                        {currency}
                        {variation.selling_price.toFixed(2)}
                      </div>
                      <div className="text-xs mt-1">
                        {variation.status === "IN-STOCK"
                          ? `${variation.quantity} available`
                          : "Out of stock"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2 uppercase">
                Quantity
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg border-2 border-gray-300 hover:border-gray-400 flex items-center justify-center transition-colors text-xl font-bold"
                >
                  −
                </button>
                <span className="text-xl font-semibold text-gray-900 w-12 text-center">
                  {quantity}
                </span>
                <button
                  onClick={() =>
                    setQuantity(Math.min(displayQuantity, quantity + 1))
                  }
                  className="w-10 h-10 rounded-lg border-2 border-gray-300 hover:border-gray-400 flex items-center justify-center transition-colors text-xl font-bold"
                >
                  +
                </button>
              </div>
            </div>

            {/* SKU */}
            {product.sku && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">SKU:</span>{" "}
                  {selectedVariation?.sku || product.sku}
                </p>
              </div>
            )}

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={
                !isInStock || isInCart || (hasVariations && !selectedVariation)
              }
              className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all ${
                !isInStock || isInCart || (hasVariations && !selectedVariation)
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 hover:shadow-xl"
              }`}
            >
              {!isInStock ? (
                "Out of Stock"
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

        <style>{`
          @keyframes slide-up {
            from {
              transform: translateY(100%);
            }
            to {
              transform: translateY(0);
            }
          }
          
          .animate-slide-up {
            animation: slide-up 0.3s ease-out;
          }
        `}</style>
      </div>
    </>
  );
};

export default ProductBottomDrawer;
