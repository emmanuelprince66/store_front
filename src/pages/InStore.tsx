// File: src/pages/InStore.tsx
import { useEffect, useState } from "react";
import CartIcon from "../components/CartIcon";
import Footer from "../components/Footer";
import ProductBottomDrawer from "../components/ProductBottomDrawer";
import ProductList from "../components/ProductList";
import ScannerModal from "../components/ScannerModal";
import { CartProvider } from "../context/CartContext";
import { dummyProducts } from "../dummy-product";

const InStore = () => {
  const [shop, setShop] = useState({ name: "", location: "" });
  const [showScanner, setShowScanner] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<any>(null);

  useEffect(() => {
    setShop({ name: "InStore Premium", location: "123 Main St, City" });
  }, []);

  const handleScanSuccess = (decodedText: string, decodedResult: any) => {
    console.log("Scan success:", decodedText);
    console.log("Decoded result:", decodedResult);

    // Parse the scanned ID and find the product
    const productId = parseInt(decodedText);
    const product = dummyProducts.find((p) => p.id === productId);

    if (product) {
      setScannedProduct(product);
    } else {
      alert(
        `Product with ID ${decodedText} not found. Try scanning "1" or "2".`
      );
    }
  };

  return (
    <CartProvider>
      <div className="flex flex-col min-h-screen bg-gray-50 font-['Montserrat']">
        {/* Header */}
        <header className="bg-white shadow-md z-20 sticky top-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center space-x-3">
                {/* Logo */}
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-2 rounded-xl shadow-lg">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
                    {shop.name}
                  </p>
                  <p className="text-xs text-gray-600 hidden sm:block">
                    {shop.location}
                  </p>
                </div>
              </div>
              <CartIcon />
            </div>
          </div>
        </header>

        {/* Hero Banner */}
        <div className="relative bg-gradient-to-r from-green-600 via-green-500 to-emerald-500 text-white overflow-hidden">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"
              alt="Shopping background"
              className="w-full h-full object-cover opacity-30"
            />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
            <div className="text-center">
              <h1 className="text-3xl sm:text-5xl font-bold mb-4 drop-shadow-lg">
                Welcome to InStore Premium
              </h1>
              <p className="text-lg sm:text-xl mb-6 text-green-50 max-w-2xl mx-auto">
                Scan products instantly with our barcode scanner. Quick, easy,
                and convenient shopping experience.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <div className="bg-white bg-opacity-20 backdrop-blur-sm px-6 py-3 rounded-full">
                  <p className="text-sm font-semibold text-black">
                    📱 Instant Scanning
                  </p>
                </div>
                <div className="bg-white bg-opacity-20 backdrop-blur-sm px-6 py-3 rounded-full">
                  <p className="text-sm font-semibold text-black">
                    💯 Quality Assured
                  </p>
                </div>
                <div className="bg-white bg-opacity-20 backdrop-blur-sm px-6 py-3 rounded-full">
                  <p className="text-sm font-semibold text-black">
                    🔒 Secure Payment
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <ProductList />
          </div>
        </main>

        {/* Scanner Modal */}
        {showScanner && (
          <ScannerModal
            onClose={() => setShowScanner(false)}
            onScanSuccess={handleScanSuccess}
          />
        )}

        {/* Floating Scan Button - More Prominent */}
        {!showScanner && (
          <button
            onClick={() => setShowScanner(true)}
            className="fixed bottom-6 right-6 z-30 group"
          >
            {/* Pulsing ring animation */}
            <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping"></span>

            {/* Main button */}
            <div className="relative  cursor-pointer bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all transform active:scale-95 flex items-center gap-3">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                />
              </svg>
              <span className="font-bold text-lg whitespace-nowrap">Scan</span>
            </div>

            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-2 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Scan Product Barcode
              <div className="absolute top-full right-8 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-gray-900"></div>
            </div>
          </button>
        )}

        <style>{`
          @keyframes ping {
            75%, 100% {
              transform: scale(1.5);
              opacity: 0;
            }
          }
          
          .animate-ping {
            animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
          }
        `}</style>

        {/* Product Bottom Drawer */}
        {scannedProduct && (
          <ProductBottomDrawer
            product={scannedProduct}
            onClose={() => setScannedProduct(null)}
          />
        )}

        <Footer />
      </div>
    </CartProvider>
  );
};

export default InStore;
