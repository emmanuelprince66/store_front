import { useContext, useState } from "react";
import { CartContext } from "../context/CartContext";
import CartModal from "./CartModal";
import { Modal } from "./Modal";

const CartIcon = ({ onCheckout }: any) => {
  const { getTotalItems } = useContext(CartContext);
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="relative flex-shrink-0">
        <button
          className="text-black p-2.5 sm:p-3 rounded-full cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => setShowModal(true)}
          aria-label="Open cart"
        >
          <svg
            className="w-6 h-6 sm:w-7 sm:h-7"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </button>

        {getTotalItems() > 0 && (
          <span className="absolute -top-1 -right-1 bg-[var(--brand-primary)] text-[var(--brand-on-primary)] text-[10px] font-bold min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center">
            {getTotalItems()}
          </span>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        className="max-w-xl"
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
