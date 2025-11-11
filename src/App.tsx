import { BrowserRouter, Route, Routes } from "react-router-dom";

import { ToastContainer } from "react-toastify";
import Success from "./components/Success";
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
            path="/out-store/success"
            element={<Success path={"/out-store"} />}
          />
          <Route
            path="/in-store/success"
            element={<Success path={"/in-store"} />}
          />
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
