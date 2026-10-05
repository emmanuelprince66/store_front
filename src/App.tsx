import { BrowserRouter, Route, Routes } from "react-router-dom";

import { ToastContainer } from "react-toastify";
import Success from "./components/Success";
import { CartProvider } from "./context/CartContext";
import InStore from "./pages/InStore";
import { OutStore } from "./pages/Outstore";
import ProductPage from "./pages/ProductPage";

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/in" element={<InStore />} />
          <Route path="/out" element={<OutStore />} />
          <Route
            path="/in/product/:productId"
            element={<ProductPage type="in-store" />}
          />
          <Route
            path="/out/product/:productId"
            element={<ProductPage type="out-store" />}
          />
          <Route
            path="/in/success"
            element={<Success path="/in" />}
          />
          <Route
            path="/out/success"
            element={<Success path="/out" />}
          />
          <Route path="/i/:slug" element={<InStore />} />
          <Route path="/o/:slug" element={<OutStore />} />
          <Route
            path="/i/:slug/product/:productId"
            element={<ProductPage type="in-store" />}
          />
          <Route
            path="/o/:slug/product/:productId"
            element={<ProductPage type="out-store" />}
          />
          {/* Fixed: moved success routes to match the actual navigation */}
          <Route path="/o/success/:slug" element={<Success path={"/o"} />} />
          <Route path="/i/success/:slug" element={<Success path={"/i"} />} />
          <Route
            path="*"
            element={<div className="text-center mt-10">Not Found</div>}
          />
        </Routes>
        <ToastContainer />
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;
