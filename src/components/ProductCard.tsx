import { useContext, useState } from "react";
import { CartContext } from "../context/CartContext";
import type { Product } from "../dummy-product";
import { Modal } from "./Modal";
import ProductModal from "./ProductModal";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart, cart } = useContext(CartContext);
  const [showModal, setShowModal] = useState(false);

  const isInCart = cart.some((item) => item.product.id === product.id);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isInCart && !product.hasVariations) {
      addToCart(product, 1);
    } else if (product.hasVariations) {
      setShowModal(true);
    }
  };

  return (
    <>
      <div
        onClick={() => setShowModal(true)}
        className="group bg-white rounded-2xl cursor-pointer shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 transform hover:-translate-y-1"
      >
        {/* Image Section */}
        <div className="relative overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500"
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.hasVariations && (
              <span className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
                Multiple Options
              </span>
            )}
            {!product.inStock && (
              <span className="bg-red-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
                Out of Stock
              </span>
            )}
          </div>

          {/* Quick View Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowModal(true);
            }}
            className="absolute top-3 right-3 bg-white bg-opacity-90 hover:bg-green-500 p-2.5 rounded-full shadow-lg transition-all group/btn"
          >
            <svg
              className="w-5 h-5 text-gray-600 group-hover/btn:text-white transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </button>

          {/* Category Badge */}
          <div className="absolute bottom-3 left-3">
            <span className="bg-white bg-opacity-90 text-gray-800 text-xs font-semibold px-3 py-1 rounded-full">
              {product.category}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-5">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-bold text-gray-900 line-clamp-2 flex-1 pr-2">
              {product.name}
            </h3>
            <div className="flex-shrink-0">
              <p className="text-2xl font-bold text-green-600">
                ₦{product.price.toFixed(2)}
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          {/* Stock Info */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center text-sm">
              {product.inStock ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-green-700 font-medium">In Stock</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                  <span className="text-red-700 font-medium">Out of Stock</span>
                </>
              )}
            </div>
            <span className="text-xs text-gray-500">{product.gender}</span>
          </div>

          {/* Action Button */}
          <button
            onClick={handleAdd}
            disabled={isInCart && !product.hasVariations}
            className={`w-full py-3 px-4 rounded-xl font-semibold transition-all transform ${
              isInCart && !product.hasVariations
                ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 hover:shadow-lg hover:scale-105 active:scale-95"
            }`}
          >
            {isInCart && !product.hasVariations ? (
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
            ) : product.hasVariations ? (
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
        <ProductModal product={product} onClose={() => setShowModal(false)} />
      </Modal>
    </>
  );
};

export default ProductCard;
