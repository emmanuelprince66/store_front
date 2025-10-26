import { BrowserRouter, Route, Routes } from "react-router-dom";

import { ToastContainer } from "react-toastify";
import { CartProvider } from "./context/CartContext";
import InStore from "./pages/InStore";
import { OutStore } from "./pages/OutStore";

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/in-store" element={<InStore />} />
          <Route path="/out-store" element={<OutStore />} />
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
