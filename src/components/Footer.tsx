export const Footer = ({ storeData }: { storeData: any }) => {
  // console.log("Store data:", storeData);
  const storeName = storeData?.results?.info?.name || "OutStore Premium";
  const location = storeData?.results?.info?.state;

  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Store Info */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-3">
              {storeName}
            </h3>
            {location && <p className="text-sm mb-2">{location}</p>}
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-3">
              Contact Us
            </h3>
            <a
              href="tel:09035271187"
              className="text-sm hover:text-white transition-colors"
            >
              09035271187
            </a>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-3">
              Information
            </h3>
            <p className="text-sm">Quality products, exceptional service.</p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
          <p>
            © {new Date().getFullYear()} {storeName}. All rights reserved.
          </p>
          <p className="text-gray-400">
            Powered by <span className="text-white font-medium">Sync360</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
