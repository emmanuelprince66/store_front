import { useEffect, useState } from "react";
import BarcodeScanner from "../components/BarcodeScanner";
import CartIcon from "../components/CartIcon";
import Footer from "../components/Footer";
import WelcomeScreen from "../components/WelcomeScreen";

const InStore = () => {
  const [showWelcome, setShowWelcome] = useState(true);
  const [shop, setShop] = useState({ name: "", location: "" });

  useEffect(() => {
    // Simulate backend fetch
    setShop({ name: "My In-Store Shop", location: "123 Main St, City" });
  }, []);

  if (showWelcome) {
    return <WelcomeScreen shop={shop} onClose={() => setShowWelcome(false)} />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-blue-500 text-white p-4 text-center">
        <h1 className="text-2xl font-bold">
          {shop.name} - {shop.location}
        </h1>
      </header>
      <main className="flex-1">
        <BarcodeScanner />
      </main>
      <CartIcon />
      <Footer />
    </div>
  );
};

export default InStore;
