import { useEffect } from "react";

export const Modal = ({ isOpen, onClose, children, className = "" }: any) => {
  useEffect(() => {
    const handleEscape = (e: any) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthClass = className || "max-w-3xl";

  return (
    <div
      className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl mx-auto w-full max-h-[92vh] overflow-y-auto ${widthClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};
