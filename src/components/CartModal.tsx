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
      <div className="p-8 text-center">
        <div className="mb-4">
          <svg
            className="w-16 h-16 text-gray-300 mx-auto"
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
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Your cart is empty
        </h3>
        <p className="text-gray-600 mb-6">Add some products to get started</p>
        <button
          onClick={onClose}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors cursor-pointer"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="p-6 border-b border-gray-200 w-full">
        <div className="flex items-center justify-between w-dfull">
          <h2 className="text-xl font-bold text-gray-900">Shopping Cart</h2>
          <span className="text-sm text-gray-600">{getTotalItems()} items</span>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {cart.map((item) => (
          <div key={item.product.id} className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <img
                src={item.product.image}
                alt={item.product.name}
                className="w-16 h-16 object-cover rounded-lg"
              />

              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">
                  {item.product.name}
                </h4>
                <p className="text-sm text-gray-600">
                  N{item.product.price.toFixed(2)} each
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() =>
                    updateQuantity(item.product.id, item.quantity - 1)
                  }
                  className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center cursor-pointer"
                >
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
                      d="M20 12H4"
                    />
                  </svg>
                </button>

                <span className="w-8 text-center font-semibold">
                  {item.quantity}
                </span>

                <button
                  onClick={() =>
                    updateQuantity(item.product.id, item.quantity + 1)
                  }
                  className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center cursor-pointer"
                >
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </button>
              </div>

              <button
                onClick={() => removeFromCart(item.product.id)}
                className="text-red-500 hover:text-red-700 p-2 cursor-pointer"
              >
                <svg
                  className="w-5 h-5"
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
        ))}
      </div>

      <div className="p-6 border-t bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <span className="text-lg font-semibold">Total:</span>
          <span className="text-2xl font-bold text-green-600">
            N{getTotalPrice().toFixed(2)}
          </span>
        </div>

        <div className="flex space-x-3 gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer font-semibold"
          >
            Continue Shopping
          </button>
          <button
            onClick={handleCheckout}
            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg hover:from-green-600 hover:to-green-700 transition-all cursor-pointer font-semibold"
          >
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartModal;
