// ============================================
// FILE: components/ProductGallery.tsx
// Multi-image / multi-video product gallery.
// Main stage (image or inline video) + thumbnail rail, with swipe,
// arrow navigation and a media counter. Mobile-first & responsive.
// ============================================

import { useEffect, useRef, useState } from "react";
import type { Product } from "../type";
import { getProductMedia, type GalleryItem } from "../utils/media";
import { NoImagePlaceholder } from "./ImagePlaceHolder";

interface ProductGalleryProps {
  product: Pick<Product, "image" | "media" | "name">;
  /** "full" shows the thumbnail rail (modal); "compact" hides it (drawer). */
  variant?: "full" | "compact";
  className?: string;
}

const PlayBadge = ({ size = "md" }: { size?: "sm" | "md" }) => (
  <span
    className={`pointer-events-none flex items-center justify-center rounded-full bg-black/55 backdrop-blur-sm ${
      size === "sm" ? "w-7 h-7" : "w-14 h-14"
    }`}
  >
    <svg
      className={size === "sm" ? "w-3 h-3" : "w-6 h-6"}
      fill="white"
      viewBox="0 0 24 24"
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  </span>
);

export const ProductGallery = ({
  product,
  variant = "full",
  className = "",
}: ProductGalleryProps) => {
  const media = getProductMedia(product);
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Reset when the product changes.
  useEffect(() => {
    setActive(0);
    setPlaying(false);
  }, [product.image, product.media]);

  if (media.length === 0) {
    return <NoImagePlaceholder className={`w-full h-full ${className}`} />;
  }

  const current = media[active];
  const hasMany = media.length > 1;

  const go = (next: number) => {
    setActive((next + media.length) % media.length);
    setPlaying(false);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) go(dx < 0 ? active + 1 : active - 1);
    touchStartX.current = null;
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* ---------- Main stage ---------- */}
      <div
        className="group relative aspect-square w-full overflow-hidden rounded-2xl bg-[#f0f0f0]"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {current.type === "VIDEO" ? (
          playing ? (
            <video
              key={current.id}
              src={current.url}
              className="h-full w-full bg-black object-contain"
              controls
              autoPlay
              playsInline
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="absolute inset-0 flex items-center justify-center bg-black"
              aria-label="Play video"
            >
              <video
                src={`${current.url}#t=0.1`}
                className="absolute inset-0 h-full w-full object-contain opacity-80"
                preload="metadata"
                muted
                playsInline
              />
              <PlayBadge />
            </button>
          )
        ) : (
          <img
            key={current.id}
            src={current.url}
            alt={product.name}
            className="h-full w-full object-contain p-4 sm:p-6"
            decoding="async"
          />
        )}

        {/* Counter */}
        {hasMany && (
          <span className="absolute right-3 top-3 z-10 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
            {active + 1} / {media.length}
          </span>
        )}

        {/* Arrows */}
        {hasMany && (
          <>
            <button
              type="button"
              onClick={() => go(active - 1)}
              aria-label="Previous"
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-black shadow-md transition-all hover:bg-white sm:opacity-0 sm:group-hover:opacity-100"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => go(active + 1)}
              aria-label="Next"
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-black shadow-md transition-all hover:bg-white sm:opacity-0 sm:group-hover:opacity-100"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Mobile dots (compact variant has no rail) */}
        {hasMany && variant === "compact" && (
          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
            {media.map((m, i) => (
              <button
                key={m.id}
                onClick={() => go(i)}
                aria-label={`Go to media ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === active ? "w-5 bg-white" : "w-1.5 bg-white/60"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ---------- Thumbnail rail ---------- */}
      {variant === "full" && hasMany && (
        <div className="flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {media.map((item: GalleryItem, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => go(i)}
              aria-label={`View ${item.type === "VIDEO" ? "video" : "image"} ${i + 1}`}
              className={`relative aspect-square w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-[#f0f0f0] transition-all sm:w-20 ${
                i === active
                  ? "border-[var(--brand-primary)]"
                  : "border-transparent hover:border-gray-300"
              }`}
            >
              {item.type === "VIDEO" ? (
                <>
                  <video
                    src={`${item.url}#t=0.1`}
                    className="h-full w-full object-cover"
                    preload="metadata"
                    muted
                    playsInline
                  />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <PlayBadge size="sm" />
                  </span>
                </>
              ) : (
                <img
                  src={item.url}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
