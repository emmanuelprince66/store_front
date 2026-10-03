const toWhatsAppLink = (phone: string, message?: string) => {
  const digits = phone.replace(/\D/g, "").replace(/^0/, "234");
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${text}`;
};

export const Footer = ({ storeData }: { storeData: any }) => {
  const info = storeData?.results?.info;
  const storeName = info?.name || "Store Premium";
  // No fallback — never show a WhatsApp contact that isn't actually this
  // merchant's own number.
  const whatsappNumber: string | null = info?.whatsapp_number || null;
  const whatsappHref =
    info?.whatsapp_link ||
    (whatsappNumber
      ? toWhatsAppLink(
          whatsappNumber,
          `Hi, I'd like to stay up to date on ${storeName}'s latest offers.`,
        )
      : null);
  const address = [info?.street, info?.city, info?.state]
    .filter(Boolean)
    .join(", ");
  const deliveryOptions = (storeData?.results?.shipping || []).filter(
    (s: any) => s.visible,
  );

  return (
    <footer className="bg-white mt-auto">
      {/* Newsletter banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mb-16 sm:-mb-20 relative z-10">
        <div className="bg-[var(--brand-primary)] rounded-2xl sm:rounded-3xl px-6 py-8 sm:p-10 lg:p-12 grid md:grid-cols-2 gap-6 items-center">
          <h3 className="font-display text-2xl sm:text-4xl text-[var(--brand-on-primary)] uppercase tracking-wide leading-tight">
            Stay up to date about our latest offers
          </h3>
          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-white text-[var(--brand-primary)] font-medium text-sm px-6 py-3 sm:py-3.5 rounded-full hover:bg-gray-100 transition-colors w-full md:w-fit md:justify-self-end"
            >
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 004.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.87 9.87 0 0012.04 2zm0 18.15h-.01a8.23 8.23 0 01-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.23 8.23 0 01-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 012.41 5.83c0 4.55-3.7 8.24-8.23 8.24zm4.52-6.17c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.24-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.16-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43-.14-.01-.31-.01-.48-.01a.93.93 0 00-.67.31c-.23.25-.87.85-.87 2.08s.89 2.41 1.02 2.58c.12.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.08.15-1.18-.06-.11-.23-.17-.48-.29z" />
              </svg>
              Message us on WhatsApp
            </a>
          )}
        </div>
      </div>

      {/* Footer body */}
      <div className="bg-[#f0f0f0] pt-24 sm:pt-28 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="lg:col-span-1">
              <h2 className="font-display text-2xl sm:text-3xl text-[var(--brand-primary)] uppercase tracking-wide mb-3">
                {storeName}
              </h2>
              <p className="text-sm text-gray-600 max-w-xs leading-relaxed">
                {info?.description ||
                  "Quality products, exceptional service. Shop with confidence."}
              </p>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-bold text-[var(--brand-primary)] mb-4 text-sm uppercase tracking-wider">
                Contact
              </h3>
              <ul className="space-y-2.5 text-sm text-gray-600">
                {whatsappNumber && (
                  <li>
                    <a
                      href={`tel:${whatsappNumber}`}
                      className="hover:text-[var(--brand-primary)] transition-colors"
                    >
                      {whatsappNumber}
                    </a>
                  </li>
                )}
                {address && <li>{address}</li>}
                {!whatsappNumber && !address && (
                  <li className="text-gray-400">No contact details yet</li>
                )}
              </ul>
            </div>

            {/* Help */}
            <div>
              <h3 className="font-bold text-[var(--brand-primary)] mb-4 text-sm uppercase tracking-wider">
                Help
              </h3>
              <ul className="space-y-2.5 text-sm text-gray-600">
                <li>
                  <a
                    href="#"
                    className="hover:text-[var(--brand-primary)] transition-colors"
                  >
                    Customer Support
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-[var(--brand-primary)] transition-colors"
                  >
                    Delivery Details
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-[var(--brand-primary)] transition-colors"
                  >
                    Terms &amp; Conditions
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-[var(--brand-primary)] transition-colors"
                  >
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>

            {/* Delivery Options */}
            <div>
              <h3 className="font-bold text-[var(--brand-primary)] mb-4 text-sm uppercase tracking-wider">
                Delivery Options
              </h3>
              {deliveryOptions.length > 0 ? (
                <ul className="space-y-2.5 text-sm text-gray-600">
                  {deliveryOptions.map((option: any) => (
                    <li key={option.id} className="flex justify-between gap-3">
                      <span>{option.location}</span>
                      <span className="text-[var(--brand-primary)] font-medium whitespace-nowrap">
                        {storeData?.results?.info?.currency || "₦"}
                        {option.amount}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-600">
                  No delivery options configured yet.
                </p>
              )}
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-300 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs sm:text-sm text-gray-600">
            <p>
              © {new Date().getFullYear()} {storeName}. All rights reserved.
            </p>
            <p>
              Powered by <span className="text-black font-medium">Sync360</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
