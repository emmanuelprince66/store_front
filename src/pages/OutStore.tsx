import { useEffect, useState } from "react";
import CartIcon from "../components/CartIcon";
import Footer from "../components/Footer";
import ProductList from "../components/ProductList";
import { CartProvider } from "../context/CartContext";
import { Checkout } from "./Checkout";

export const OutStore = () => {
  const [currentView, setCurrentView] = useState("store");
  const [shop, setShop] = useState({ name: "", location: "" });

  useEffect(() => {
    setShop({ name: "OutStore Premium", location: "Global Online Store" });
  }, []);

  if (currentView === "checkout") {
    return (
      <CartProvider>
        <div className="min-h-screen bg-gray-50 font-['Montserrat']">
          <Checkout onBack={() => setCurrentView("store")} />
        </div>
      </CartProvider>
    );
  }

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
              <CartIcon onCheckout={() => setCurrentView("checkout")} />
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
            {/* <div className="absolute inset-0 bg-gradient-to-r from-green-600/90 via-green-500/90 to-emerald-500/90"></div> */}
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
            <div className="text-center">
              <h1 className="text-3xl sm:text-5xl font-bold mb-4 drop-shadow-lg">
                Welcome to OutStore Premium
              </h1>
              <p className="text-lg sm:text-xl mb-6 text-green-50 max-w-2xl mx-auto">
                Discover amazing products at unbeatable prices. Quality
                guaranteed, satisfaction assured.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <div className="bg-white bg-opacity-20 backdrop-blur-sm px-6 py-3 rounded-full">
                  <p className="text-sm font-semibold text-black">
                    🚚 Free Shipping
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

        <main className="flex-1 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <ProductList />
          </div>
        </main>

        <Footer />
      </div>
    </CartProvider>
  );
};
