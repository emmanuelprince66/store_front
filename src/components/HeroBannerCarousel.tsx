import { useEffect, useState } from "react";

const ROTATE_MS = 5000;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Full-bleed hero background: crossfades between banners (auto-advancing when
 * there is more than one) under the dark overlay. Render it inside the hero's
 * `relative` wrapper; page content placed after it sits on top.
 */
export const HeroBannerCarousel = ({
  images,
  alt = "Store banner",
}: {
  images: string[];
  alt?: string;
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const [paused, setPaused] = useState(false);
  const imagesKey = images.join("|");

  useEffect(() => {
    setActiveIndex(0);
  }, [imagesKey]);

  useEffect(() => {
    if (images.length < 2 || paused || prefersReducedMotion()) return;
    const timer = window.setInterval(
      () => setActiveIndex((current) => (current + 1) % images.length),
      ROTATE_MS,
    );
    return () => window.clearInterval(timer);
  }, [images.length, paused, imagesKey]);

  const activeImage = images[activeIndex];
  const showSkeleton = !activeImage || !loaded[activeImage];

  return (
    <div
      className="absolute inset-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {showSkeleton && (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
      )}

      {images.map((src, index) => (
        <img
          key={src}
          src={src}
          alt={index === activeIndex ? alt : ""}
          aria-hidden={index !== activeIndex}
          fetchPriority={index === 0 ? "high" : "low"}
          loading={index === 0 ? "eager" : "lazy"}
          decoding="async"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
            index === activeIndex && loaded[src] ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setLoaded((current) => ({ ...current, [src]: true }))}
        />
      ))}

      <div className="absolute inset-0 bg-black/55" />

      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {images.map((src, index) => (
            <button
              key={src}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Show banner ${index + 1} of ${images.length}`}
              aria-current={index === activeIndex}
              className={`h-2 cursor-pointer rounded-full transition-all ${
                index === activeIndex ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
