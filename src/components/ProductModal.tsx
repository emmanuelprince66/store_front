import type { Product } from "../types/product";

interface ProductModalProps {
  product: Product;
  onClose: () => void;
}

const ProductModal = ({ product, onClose }: ProductModalProps) => {
  return (
    <div className="relative max-h-[90vh] w-full overflow-y-auto">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 bg-white bg-opacity-90 hover:bg-opacity-100 p-2 rounded-full shadow-lg transition-all cursor-pointer"
      >
        <svg
          className="w-5 h-5 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      <img
        src={product.image}
        alt={product.name}
        className="w-full h-64 object-cover rounded-t-2xl"
      />

      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {product.name}
        </h2>
        <p className="text-3xl font-bold text-green-600 mb-4">
          N{product.price.toFixed(2)}
        </p>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Description
          </h3>
          <p className="text-gray-700 leading-relaxed">{product.description}</p>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Key Features
          </h3>
          <ul className="space-y-2">
            {product.features.map((feature, index) => (
              <li key={index} className="flex items-center text-gray-700">
                <svg
                  className="w-4 h-4 text-green-500 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Specifications
          </h3>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Material:</span>
              <span className="text-gray-900">
                {product.specifications.material}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Care:</span>
              <span className="text-gray-900">
                {product.specifications.care}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Origin:</span>
              <span className="text-gray-900">
                {product.specifications.origin}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
