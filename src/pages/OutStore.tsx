import { useEffect, useState } from "react";
import CartIcon from "../components/CartIcon";
import Footer from "../components/Footer";
import ProductList from "../components/ProductList";
import WelcomeScreen from "../components/WelcomeScreen";
import { CartProvider } from "../context/CartContext";
import { Checkout } from "./Checkout";
// import { CartProvider } from "./context/CartContext";
// import CartIcon from "./components/CartIcon";
// import Footer from "./components/Footer";
// import ProductList from "./components/ProductList";
// import WelcomeScreen from "./components/WelcomeScreen";
// import Checkout from "./components/Checkout";

export const OutStore = () => {
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentView, setCurrentView] = useState("store"); // 'store' or 'checkout'
  const [shop, setShop] = useState({ name: "", location: "" });

  useEffect(() => {
    // Simulate backend fetch
    setShop({ name: "OutStore Premium", location: "Global Online Store" });
  }, []);

  if (showWelcome) {
    return (
      <CartProvider>
        <WelcomeScreen shop={shop} onClose={() => setShowWelcome(false)} />
      </CartProvider>
    );
  }

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
        <header className="bg-white shadow-sm border-b border-gray-200 py-3">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="text-center sm:text-left">
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {shop.name}
                </p>
                <p className="text-sm text-gray-600 hidden sm:block">
                  {shop.location}
                </p>
              </div>
              <div className="relative">
                <CartIcon onCheckout={() => setCurrentView("checkout")} />
              </div>
            </div>
            <div className="sm:hidden pb-3">
              <p className="text-sm text-gray-600 text-center">
                {shop.location}
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <ProductList />
          </div>
        </main>

        <Footer />
      </div>
    </CartProvider>
  );
};
