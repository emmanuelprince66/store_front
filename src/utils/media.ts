// ============================================
// FILE: utils/media.ts
// Normalizes a product's media into a single ordered gallery list.
// Bridges the new `media[]` array with the legacy single `image` field.
// ============================================

import type { Product, ProductMediaType } from "../type";

export interface GalleryItem {
  id: string;
  url: string;
  type: ProductMediaType;
}

/**
 * Returns the product's media as an ordered gallery list.
 * - Images are listed before videos so the first item is always a good cover.
 * - The legacy `image` field is folded in as an image when not already present.
 */
export const getProductMedia = (
  product: Pick<Product, "image" | "media">,
): GalleryItem[] => {
  const items: GalleryItem[] = [];

  for (const m of product.media ?? []) {
    if (!m?.file) continue;
    items.push({
      id: m.id,
      url: m.file,
      type: m.type === "VIDEO" ? "VIDEO" : "IMAGE",
    });
  }

  // Fold the legacy single image in if the backend didn't include it in media.
  if (product.image && !items.some((i) => i.url === product.image)) {
    items.unshift({ id: "legacy-image", url: product.image, type: "IMAGE" });
  }

  // Stable sort: images first, videos after.
  return items.sort((a, b) =>
    a.type === b.type ? 0 : a.type === "IMAGE" ? -1 : 1,
  );
};

/** First usable image url for cards / thumbnails (falls back to legacy image). */
export const getPrimaryImage = (
  product: Pick<Product, "image" | "media">,
): string | undefined => {
  const firstImage = getProductMedia(product).find((m) => m.type === "IMAGE");
  return firstImage?.url ?? product.image ?? undefined;
};

export const countMedia = (product: Pick<Product, "image" | "media">) => {
  const media = getProductMedia(product);
  return {
    total: media.length,
    videos: media.filter((m) => m.type === "VIDEO").length,
    images: media.filter((m) => m.type === "IMAGE").length,
  };
};
