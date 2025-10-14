import { useContext, useState } from "react";
import { CartContext } from "../context/CartContext";
import type { Product } from "../types/product";
import { Modal } from "./Modal";
import ProductModal from "./ProductModal";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart, cart } = useContext(CartContext);
  const [showModal, setShowModal] = useState(false);

  const isInCart = cart.some((item) => item.product.id === product.id);

  const handleAdd = () => {
    if (!isInCart) {
      addToCart(product, 1);
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100">
        <div className="relative">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-48 object-cover"
          />
          <button
            onClick={() => setShowModal(true)}
            className="absolute top-3 hover:bg-green-500 right-3 bg-white bg-opacity-90 hover:bg-opacity-100 p-2 rounded-full shadow-lg transition-all cursor-pointer"
          >
            <svg
              className="w-4 h-4 text-gray-600 hover:text-white"
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
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {product.name}
          </h3>
          <p className="text-2xl font-bold text-green-600 mb-3">
            N{product.price.toFixed(2)}
          </p>
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {product.description}
          </p>

          <button
            onClick={handleAdd}
            disabled={isInCart}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-all cursor-pointer ${
              isInCart
                ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transform hover:scale-105"
            }`}
          >
            {isInCart ? "Added to Cart" : "Add to Cart"}
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
