import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import { ToastContainer } from "react-toastify";
import Success from "./components/Success";
import { CartProvider } from "./context/CartContext";
import CartLinkCheckout from "./pages/CartLinkCheckout";
import InStore from "./pages/InStore";
import { OutStore } from "./pages/Outstore";
import ProductPage from "./pages/ProductPage";
import Services from "./pages/Services";

// Bare domain (e.g. https://mycliq.neospringcare.com.ng/) defaults to the out-store view.
// Redirect (rather than render) so pathname-based "/out" checks keep working.
function DefaultToOutStore() {
  const { search, hash } = useLocation();
  return <Navigate to={{ pathname: "/out", search, hash }} replace />;
}

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DefaultToOutStore />} />
          <Route path="/in" element={<InStore />} />
          <Route path="/out" element={<OutStore />} />
          {/* Cart deep links (?items=<productId>:<qty>,…) sent by merchants. */}
          <Route path="/out/checkout" element={<CartLinkCheckout />} />
          <Route path="/o/:slug/checkout" element={<CartLinkCheckout />} />
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
          <Route path="/services" element={<Services />} />
          <Route path="/services/:serviceId" element={<Services />} />
          <Route path="/services/bookings/:reference" element={<Services />} />
          <Route path="/bookings/:reference" element={<Services />} />
          <Route path="/i/:slug" element={<InStore />} />
          <Route path="/o/:slug" element={<OutStore />} />
          <Route path="/i/:slug/services" element={<Services />} />
          <Route path="/o/:slug/services" element={<Services />} />
          <Route path="/i/:slug/services/:serviceId" element={<Services />} />
          <Route path="/o/:slug/services/:serviceId" element={<Services />} />
          <Route
            path="/i/:slug/services/bookings/:reference"
            element={<Services />}
          />
          <Route
            path="/o/:slug/services/bookings/:reference"
            element={<Services />}
          />
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
          {/* Shareable services link without a custom domain:
              store.sync360.africa/<slug>/services. Declared after the
              static-prefixed routes so /o, /i, /services and /bookings keep
              winning any tie. */}
          <Route path="/:slug/services" element={<Services />} />
          <Route path="/:slug/services/:serviceId" element={<Services />} />
          <Route
            path="/:slug/services/bookings/:reference"
            element={<Services />}
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
