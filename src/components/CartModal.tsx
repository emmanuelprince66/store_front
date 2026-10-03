import { useContext } from "react";
import { CartContext } from "../context/CartContext";
import { getPrimaryImage } from "../utils/media";

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
      <div className="p-8 sm:p-12 text-center bg-white rounded-2xl flex flex-col items-center">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#f0f0f0] flex items-center justify-center mb-5">
          <svg
            className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h3 className="font-display text-2xl sm:text-3xl text-black uppercase tracking-wide mb-2">
          Your cart is empty
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          Add some products to get started
        </p>
        <button
          onClick={onClose}
          className="bg-black text-white px-8 py-3 rounded-full hover:bg-gray-800 transition-colors font-medium text-sm"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  const subtotal = getTotalPrice();
  const total = subtotal;

  return (
    <div className="w-full flex flex-col h-full bg-white rounded-2xl overflow-hidden max-h-[90vh]">
      {/* Header */}
      <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl sm:text-3xl text-[var(--brand-primary)] uppercase tracking-wide">
            Your Cart
          </h2>
          <span className="text-xs sm:text-sm text-gray-500 bg-[#f0f0f0] px-3 py-1 rounded-full">
            {getTotalItems()} {getTotalItems() === 1 ? "item" : "items"}
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-5 sm:px-6">
        {cart.map((item, index) => {
          const itemPrice =
            item.variation?.selling_price || item.product.selling_price || 0;
          const isCombo = item.product.type === "COMBO";
          const maxQuantity =
            item.variation?.quantity ||
            item.product.quantity ||
            (isCombo ? 99 : 0);
          const itemStatus = item.variation?.status || item.product.status;

          const cartItemKey = item.variation
            ? `${item.product.id}-${item.variation.id}`
            : item.product.id;

          return (
            <div
              key={cartItemKey}
              className={`py-4 flex items-start gap-3 sm:gap-4 ${
                index !== cart.length - 1 ? "border-b border-gray-100" : ""
              }`}
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-[#f0f0f0] flex-shrink-0 overflow-hidden">
                {getPrimaryImage(item.product) ? (
                  <img
                    src={getPrimaryImage(item.product)}
                    alt={item.product.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-bold text-black text-sm sm:text-base line-clamp-2 flex-1">
                    {item.product.name}
                  </h4>
                  <button
                    onClick={() =>
                      removeFromCart(item.product.id, item.variation?.id)
                    }
                    className="text-[#FF3333] hover:text-red-700 transition-colors p-1 -mt-1 -mr-1 flex-shrink-0"
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

                {item.variation && (
                  <p className="text-xs text-gray-500 mb-1">
                    Option:{" "}
                    <span className="text-black">{item.variation.name}</span>
                  </p>
                )}

                {itemStatus === "LOW" && (
                  <p className="text-[11px] text-amber-600 mb-2">
                    {isCombo ? "Low stock" : `Only ${maxQuantity} left`}
                  </p>
                )}

                <div className="flex items-center justify-between mt-2">
                  <span className="font-bold text-[var(--brand-primary)] text-base sm:text-lg">
                    ₦{(itemPrice * item.quantity).toFixed(2)}
                  </span>

                  <div className="flex items-center bg-[#f0f0f0] rounded-full">
                    <button
                      onClick={() =>
                        updateQuantity(
                          item.product.id,
                          item.quantity - 1,
                          item.variation?.id,
                        )
                      }
                      className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-black hover:bg-white rounded-full transition-colors"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="w-7 sm:w-8 text-center text-xs sm:text-sm font-semibold text-black">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(
                          item.product.id,
                          item.quantity + 1,
                          item.variation?.id,
                        )
                      }
                      disabled={item.quantity >= maxQuantity}
                      className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-black hover:bg-white rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Order Summary */}
      <div className="px-5 sm:px-6 pt-4 pb-5 sm:pb-6 border-t border-gray-200 bg-white flex-shrink-0">
        <h3 className="font-bold text-[var(--brand-primary)] mb-3 text-sm">Order Summary</h3>

        <div className="space-y-2 mb-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-semibold text-black">
              ₦{subtotal.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className="font-bold text-black">Total</span>
            <span className="font-bold text-[var(--brand-primary)] text-lg sm:text-xl">
              ₦{total.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-[#f0f0f0] text-black py-3 sm:py-3.5 rounded-full hover:bg-gray-200 transition-colors font-medium text-sm"
          >
            Continue Shopping
          </button>
          <button
            onClick={handleCheckout}
            className="flex-1 bg-[var(--brand-primary)] text-[var(--brand-on-primary)] py-3 sm:py-3.5 rounded-full hover:opacity-90 transition-colors font-medium text-sm flex items-center justify-center gap-2"
          >
            Go to Checkout
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
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartModal;
