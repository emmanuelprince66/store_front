import type { FC } from "react";

interface WelcomeScreenProps {
  shop: { name: string; location: string };
  onClose: () => void;
}

const WelcomeScreen: FC<WelcomeScreenProps> = ({ shop, onClose }) => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center z-50 font-['Montserrat']">
      <div className="bg-white p-8 sm:p-12 rounded-2xl shadow-2xl text-center max-w-md w-full mx-4 transform transition-all">
        <div className="mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🛍️</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Welcome to {shop.name}
          </h1>
          <p className="text-gray-600 mb-2">{shop.location}</p>
          <p className="text-sm text-gray-500">
            Discover premium products at unbeatable prices
          </p>
        </div>

        <button
          onClick={onClose}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 cursor-pointer shadow-lg"
        >
          Enter Store
        </button>
      </div>
    </div>
  );
};

export default WelcomeScreen;
