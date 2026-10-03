// ============================================
// FILE: components/NoImagePlaceholder.tsx
// ============================================

import { useEffect, useRef, useState } from "react";

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

const LoadingSkeleton = ({ className = "" }: { className?: string }) => {
  return (
    <div
      className={`bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 animate-pulse ${className}`}
    >
      <div className="w-full h-full flex items-center justify-center">
        <svg
          className="w-10 h-10 text-gray-300"
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
    </div>
  );
};

interface ProductImageWithPlaceholderProps {
  product: {
    image?: string | null;
    name: string;
  };
  className?: string;
  objectFit?: "cover" | "contain";
}

export const ProductImageWithPlaceholder = ({
  product,
  className = "",
  objectFit = "cover",
}: ProductImageWithPlaceholderProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [product.image]);

  // Only start loading the image when it enters the viewport
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!product.image || imageError) {
    return <NoImagePlaceholder className={className} />;
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Animated skeleton while loading */}
      {!imageLoaded && <LoadingSkeleton className="absolute inset-0" />}

      {/* Only render img when near viewport */}
      {isVisible && (
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className={`w-full h-full ${
            objectFit === "contain" ? "object-contain" : "object-cover"
          } transition-opacity duration-300 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
        />
      )}
    </div>
  );
};
