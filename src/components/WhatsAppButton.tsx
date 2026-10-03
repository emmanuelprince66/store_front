import type { StoreData } from "../type";
import { useThemeSnapshot } from "../utils/theme";

const toWhatsAppDigits = (phone: string) =>
  phone.replace(/\D/g, "").replace(/^0/, "234");

export const WhatsAppButton = ({
  storeName,
  storeData,
  storeSlug,
  stacked = false,
}: {
  storeName?: string;
  storeData?: StoreData | null;
  storeSlug?: string;
  stacked?: boolean;
}) => {
  const info = storeData?.results?.info;
  const message = `Hi${storeName ? ` ${storeName}` : ""}, I have a question about your products.`;

  // Set colors directly (not via inherited CSS var) so the button is never
  // dependent on being mounted inside a themed wrapper. Read-only subscribe —
  // the parent page already owns syncing storeData into the shared store.
  const { theme } = useThemeSnapshot(storeSlug);

  // No merchant-provided WhatsApp contact — don't show a button that would
  // message a number that isn't actually this store's.
  if (!info?.whatsapp_link && !info?.whatsapp_number) return null;

  const href = info.whatsapp_link
    ? info.whatsapp_link
    : `https://wa.me/${toWhatsAppDigits(
        info.whatsapp_number as string,
      )}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Message us on WhatsApp"
      style={{ backgroundColor: theme.primary, color: theme.on_primary }}
      className={`fixed right-6 z-30 flex items-center justify-center w-14 h-14 rounded-full shadow-xl hover:opacity-90 hover:scale-105 transition-all ${
        stacked ? "bottom-24 sm:bottom-28" : "bottom-6"
      }`}
    >
      <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 004.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.87 9.87 0 0012.04 2zm0 18.15h-.01a8.23 8.23 0 01-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.23 8.23 0 01-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 012.41 5.83c0 4.55-3.7 8.24-8.23 8.24zm4.52-6.17c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.24-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.16-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43-.14-.01-.31-.01-.48-.01a.93.93 0 00-.67.31c-.23.25-.87.85-.87 2.08s.89 2.41 1.02 2.58c.12.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.08.15-1.18-.06-.11-.23-.17-.48-.29z" />
      </svg>
    </a>
  );
};

export default WhatsAppButton;
