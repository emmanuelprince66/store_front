// ============================================
// FILE: components/NoImagePlaceholder.tsx
// ============================================

import { useEffect, useState } from "react";

interface NoImagePlaceholderProps {
  className?: string;
}

export const NoImagePlaceholder = ({
  className = "",
}: NoImagePlaceholderProps) => {
  return (
    <div
      className={`bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center ${className}`}
    >
      <div className="text-center p-6">
        <svg
          className="w-20 h-20 mx-auto text-gray-400 mb-2"
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
        <p className="text-gray-500 font-medium text-sm">No Image Available</p>
      </div>
    </div>
  );
};

interface ProductImageWithPlaceholderProps {
  product: {
    image?: string | null;
    name: string;
  };
  className?: string;
}

export const ProductImageWithPlaceholder = ({
  product,
  className = "",
}: ProductImageWithPlaceholderProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [product.image]);

  if (!product.image || imageError) {
    return <NoImagePlaceholder className={className} />;
  }

  return (
    <>
      {!imageLoaded && <NoImagePlaceholder className={className} />}
      <img
        src={product.image}
        alt={product.name}
        className={`${className} ${imageLoaded ? "block" : "hidden"}`}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
      />
    </>
  );
};

// Demo component showing the placeholder
