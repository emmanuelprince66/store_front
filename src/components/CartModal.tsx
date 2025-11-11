import { useContext } from "react";
import { CartContext } from "../context/CartContext";

interface CartModalProps {
  onClose: () => void;
  onCheckout: () => void;
}

const CartModal = ({ onClose, onCheckout }: CartModalProps) => {
  const { cart, removeFromCart, updateQuantity, getTotalPrice, getTotalItems } =
    useContext(CartContext);

  const handleCheckout = () => {
    onClose();
    onCheckout();
  };

  if (cart.length === 0) {
    return (
      <div className="p-6 sm:p-8 text-center flex w-full flex-col items-center">
        <div className="mb-4">
          <svg
            className="w-20 h-20 sm:w-24 sm:h-24 text-gray-300 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 1.5M7 13l1.5 1.5"
            />
          </svg>
        </div>
        <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
          Your cart is empty
        </h3>
        <p className="text-sm sm:text-base text-gray-600 mb-6">
          Add some products to get started
        </p>
        <button
          onClick={onClose}
          className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors cursor-pointer font-medium w-full sm:w-auto"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col h-full">
      <div className="p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            Shopping Cart
          </h2>
          <span className="text-xs sm:text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            {getTotalItems()} {getTotalItems() === 1 ? "item" : "items"}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {cart.map((item) => (
          <div
            key={item.product.id}
            className="p-4 sm:p-6 border-b border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start sm:items-center gap-3 sm:gap-4">
              <img
                src={item.product.image}
                alt={item.product.name}
                className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg flex-shrink-0 shadow-sm"
              />

              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 text-sm sm:text-base mb-1 line-clamp-2">
                  {item.product.name}
                </h4>
                <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
                  ₦{item?.product?.selling_price?.toFixed(2)} each
                </p>

                <div className="flex items-center justify-between sm:justify-start gap-4">
                  <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() =>
                        updateQuantity(item.product.id, item.quantity - 1)
                      }
                      className="w-7 h-7 sm:w-8 sm:h-8 bg-white hover:bg-gray-200 rounded-md flex items-center justify-center cursor-pointer transition-colors shadow-sm"
                      aria-label="Decrease quantity"
                    >
                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M20 12H4"
                        />
                      </svg>
                    </button>

                    <span className="w-8 sm:w-10 text-center font-semibold text-sm sm:text-base">
                      {item.quantity}
                    </span>

                    <button
                      onClick={() =>
                        updateQuantity(item.product.id, item.quantity + 1)
                      }
                      className="w-7 h-7 sm:w-8 sm:h-8 bg-white hover:bg-gray-200 rounded-md flex items-center justify-center cursor-pointer transition-colors shadow-sm"
                      aria-label="Increase quantity"
                    >
                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </button>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg cursor-pointer transition-colors"
                    aria-label="Remove item"
                  >
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-3 sm:hidden flex items-center justify-between pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-500">Subtotal:</span>
              <span className="font-semibold text-gray-900">
                ₦
                {((item.product?.selling_price ?? 0) * item.quantity).toFixed(
                  2
                )}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 sm:p-6 border-t bg-gradient-to-b from-gray-50 to-white flex-shrink-0">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <span className="text-base sm:text-lg font-semibold text-gray-700">
            Total:
          </span>
          <span className="text-xl sm:text-2xl font-bold text-green-600">
            ₦{getTotalPrice().toFixed(2)}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-800 py-3 sm:py-3.5 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer font-semibold text-sm sm:text-base order-2 sm:order-1"
          >
            Continue Shopping
          </button>
          <button
            onClick={handleCheckout}
            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 sm:py-3.5 rounded-lg hover:from-green-600 hover:to-green-700 transition-all cursor-pointer font-semibold shadow-lg hover:shadow-xl text-sm sm:text-base order-1 sm:order-2"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartModal;
