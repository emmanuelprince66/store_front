import type { FC } from "react";
import { useState } from "react";
const BarcodeScanner: FC = () => {
  const [barcode, setBarcode] = useState("");
  // const { addToCart } = useContext(CartContext);

  const handleAdd = () => {
    // const id = parseInt(barcode);
    // const product = dummyProducts.find((p) => p.id === id);
    // if (product) {
    //   addToCart(product, 1);
    //   setBarcode("");
    // } else {
    //   alert("Product not found.");
    // }
  };

  return (
    <div className="p-4 text-center">
      <h2 className="text-xl font-bold mb-4">In-Store Barcode Scanning</h2>
      <p className="mb-4">Enter barcode (product ID for demo):</p>
      <input
        type="text"
        placeholder="Enter barcode"
        value={barcode}
        onChange={(e) => setBarcode(e.target.value)}
        className="p-2 border rounded mr-2"
      />
      <button
        onClick={handleAdd}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Add to Cart
      </button>
      <p className="mt-4 text-gray-500">
        Note: Real barcode scanning not implemented. Use product IDs 1-10.
      </p>
    </div>
  );
};

export default BarcodeScanner;
