import { useContext, useState } from "react";
import { CartContext } from "../context/CartContext";
import CartModal from "./CartModal";
import { Modal } from "./Modal";

const CartIcon = ({ onCheckout }: any) => {
  const { getTotalItems } = useContext(CartContext);
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div
        className="bg-blue-500 text-white p-3 rounded-full cursor-pointer hover:bg-blue-600 transition-colors shadow-lg"
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
            d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 1.5M7 13l1.5 1.5M17 18h0m-6 0h0"
          />
        </svg>
        {getTotalItems() > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
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
