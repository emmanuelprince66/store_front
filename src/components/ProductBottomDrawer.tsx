// File: src/components/ProductBottomDrawer.tsx
import { useContext, useState } from "react";
import { CartContext } from "../context/CartContext";
import type { Product } from "../dummy-product";

interface ProductBottomDrawerProps {
  product: Product;
  onClose: () => void;
}

const ProductBottomDrawer = ({
  product,
  onClose,
}: ProductBottomDrawerProps) => {
  const { addToCart, cart } = useContext(CartContext);
  const [selectedColor, setSelectedColor] = useState<string | null>(
    product.variations?.[0]?.color || null
  );
  const [selectedSize, setSelectedSize] = useState<string | null>(
    product.variations?.[0]?.size || null
  );
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // Get unique colors and sizes from variations
  const colors = product.variations
    ? [...new Set(product.variations.map((v) => v.color).filter(Boolean))]
    : [];
  const sizes = product.variations
    ? [...new Set(product.variations.map((v) => v.size).filter(Boolean))]
    : [];

  // Find the selected variation based on color and size
  const selectedVariation = product.variations?.find(
    (v) => v.color === selectedColor && v.size === selectedSize
  );

  // Get current images based on selected color
  const currentImages =
    product.variations && selectedColor
      ? product.variations.find((v) => v.color === selectedColor)?.images ||
        product.images || [product.image]
      : product.images || [product.image];
  const currentImage = currentImages[currentImageIndex];

  const isInCart = cart.some((item) => item.product.id === product.id);

  const handleAddToCart = () => {
    if (
      !product.hasVariations ||
      (selectedColor && selectedSize && selectedVariation)
    ) {
      addToCart(product, quantity, selectedVariation?.id);
      onClose();
    }
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setCurrentImageIndex(0);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % currentImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex(
      (prev) => (prev - 1 + currentImages.length) % currentImages.length
    );
  };

  return (
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

        {/* Image Carousel */}
        <div className="relative bg-gray-100">
          <img
            src={currentImage}
            alt={product.name}
            className="w-full h-64 object-cover"
          />

          {/* Image Navigation */}
          {currentImages.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-75 hover:bg-opacity-100 p-3 rounded-full shadow-lg transition-all"
              >
                <svg
                  className="w-5 h-5 text-gray-800"
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
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-75 hover:bg-opacity-100 p-3 rounded-full shadow-lg transition-all"
              >
                <svg
                  className="w-5 h-5 text-gray-800"
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

              {/* Image Indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {currentImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentImageIndex
                        ? "bg-white w-8"
                        : "bg-white bg-opacity-50"
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Category Badge */}
          <div className="absolute top-4 left-4">
            <span className="bg-white bg-opacity-90 text-gray-800 text-sm font-semibold px-4 py-2 rounded-full shadow-lg">
              {product.category}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Header */}
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {product.name}
            </h2>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold text-green-600">
                ₦{product.price.toFixed(2)}
              </p>
              <div className="flex items-center">
                {product.inStock ? (
                  <>
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-green-700 font-semibold">
                      In Stock
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
          {product.hasVariations && product.variations && (
            <div className="mb-4 space-y-4">
              {/* Color Selection */}
              {colors.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2 uppercase">
                    Color
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => handleColorSelect(color!)}
                        className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                          selectedColor === color
                            ? "border-black bg-black text-white"
                            : "border-gray-300 bg-white text-gray-800 hover:border-gray-400"
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size Selection */}
              {sizes.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2 uppercase">
                    Size
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((size) => {
                      const variation = product.variations?.find(
                        (v) => v.size === size && v.color === selectedColor
                      );
                      const isAvailable = variation?.inStock ?? true;

                      return (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size!)}
                          disabled={!isAvailable}
                          className={`px-4 py-2 rounded-lg border-2 font-medium transition-all min-w-[60px] ${
                            selectedSize === size
                              ? "border-black bg-black text-white"
                              : isAvailable
                              ? "border-gray-300 bg-white text-gray-800 hover:border-gray-400"
                              : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                  {selectedVariation && (
                    <p className="text-sm text-gray-500 mt-2">
                      {selectedVariation.quantity} available
                    </p>
                  )}
                </div>
              )}
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
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-lg border-2 border-gray-300 hover:border-gray-400 flex items-center justify-center transition-colors text-xl font-bold"
              >
                +
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              Description
            </h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={
              (product.hasVariations &&
                (!selectedColor || !selectedSize || !selectedVariation)) ||
              (isInCart && !product.hasVariations)
            }
            className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all transform ${
              (product.hasVariations &&
                (!selectedColor || !selectedSize || !selectedVariation)) ||
              (isInCart && !product.hasVariations)
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 hover:shadow-xl"
            }`}
          >
            {isInCart && !product.hasVariations ? (
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
            ) : product.hasVariations && (!selectedColor || !selectedSize) ? (
              "Please Select All Options"
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
  );
};

export default ProductBottomDrawer;
