// Recolours the browser-tab and home-screen icons to the store's brand.
//
// public/favicon.svg and public/apple-touch-icon.png are the neutral defaults
// served before any JavaScript runs. Once the store's theme is known, both are
// swapped for copies drawn in its colours, so a tab or a home-screen shortcut
// for "cap & Co" looks like cap & Co rather than like every other storefront.

/**
 * The shopfront mark in a given pair of colours.
 *
 * Same geometry as public/favicon.svg — keep the two in step if either
 * changes. Colours arrive already validated as hex by the theme store, so they
 * are safe to interpolate into markup.
 */
export const buildFaviconSvg = (background: string, foreground: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">` +
  `<rect width="64" height="64" rx="14" fill="${background}"/>` +
  `<path d="M13 15h38l5 13H8z" fill="${foreground}"/>` +
  `<path d="M8 28a6 6 0 0 0 12 0a6 6 0 0 0 12 0a6 6 0 0 0 12 0a6 6 0 0 0 12 0z" fill="${foreground}"/>` +
  `<path d="M24.5 15h4.5l-1 13h-5.5zM35 15h4.5l2 13H36z" fill="${background}"/>` +
  `<path d="M13 37v14h38V37" fill="none" stroke="${foreground}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>` +
  `<rect x="27" y="40" width="10" height="11" rx="1.5" fill="${foreground}"/>` +
  `</svg>`;

const toDataUrl = (svg: string) =>
  `data:image/svg+xml,${encodeURIComponent(svg)}`;

/** Points an existing <link rel=…> at a new icon, creating it if missing. */
const setIconLink = (rel: string, href: string, type?: string) => {
  let link = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!link) {
    link = document.createElement("link");
    link.rel = rel;
    document.head.appendChild(link);
  }
  if (type) link.type = type;
  link.href = href;
};

/**
 * iOS only accepts a PNG for the home-screen icon, so the SVG is drawn onto a
 * canvas first. The background is painted edge to edge: iOS rounds the corners
 * itself and shows any transparent pixels there as black.
 */
const rasterise = (svg: string, size: number, background: string) =>
  new Promise<string>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("No 2D canvas"));
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(image, 0, 0, size, size);
      resolve(canvas.toDataURL("image/png"));
    };
    image.onerror = () => reject(new Error("Icon failed to load"));
    image.src = toDataUrl(svg);
  });

export const applyStoreFavicon = (background: string, foreground: string) => {
  const svg = buildFaviconSvg(background, foreground);
  setIconLink("icon", toDataUrl(svg), "image/svg+xml");

  // Best effort: the tab icon above is what almost everyone sees, so a canvas
  // that won't cooperate just leaves the default home-screen icon in place.
  rasterise(svg, 180, background)
    .then((png) => setIconLink("apple-touch-icon", png))
    .catch(() => {});
};
