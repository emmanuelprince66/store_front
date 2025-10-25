import { useContext, useState } from "react";
import { CartContext } from "../context/CartContext";
import CartModal from "./CartModal";
import { Modal } from "./Modal";

const CartIcon = ({ onCheckout }: any) => {
  const { getTotalItems } = useContext(CartContext);
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="relative">
        <button
          className="bg-green-500 text-white p-3 rounded-full cursor-pointer hover:bg-green-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
          onClick={() => setShowModal(true)}
        >
          <svg
            className="w-6 h-6"
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
        </button>

        {getTotalItems() > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[24px] h-6 flex items-center justify-center shadow-md">
            {getTotalItems()}
          </span>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        className="max-w-2xl"
      >
        <CartModal
          onClose={() => setShowModal(false)}
          onCheckout={onCheckout}
        />
      </Modal>
    </>
  );
};

export default CartIcon;
