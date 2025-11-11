import { useEffect, useState } from "react";
import { FaHome, FaShoppingBag } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { useLocation, useNavigate } from "react-router-dom";

const Success = ({ path }: { path: string }) => {
  const [animate, setAnimate] = useState(false);
  const navigate = useNavigate(); // Changed from useNavigation
  const location = useLocation();
  const slug = location.search.substring(6) || "";

  console.log("Location:", location);

  useEffect(() => {
    setAnimate(true);
  }, []);

  const handleGoHome = () => {
    // "?slug=cap&"
    console.log("Query string:", slug);
    navigate(`${path}?slug=${slug}`);
  };

  // const handleViewOrders = () => {
  //   // Navigate to orders page
  //   console.log("View orders");
  // };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Success Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 text-center">
          {/* Animated Success Icon */}
          <div className="relative inline-block mb-6">
            {/* Outer ring animation */}
            <div
              className={`absolute inset-0 rounded-full bg-green-100 ${
                animate ? "animate-ping" : "opacity-0"
              }`}
              style={{
                animationDuration: "1.5s",
                animationIterationCount: "1",
              }}
            ></div>

            {/* Success checkmark with SVG animation */}
            <div className="relative">
              <svg
                className="w-24 h-24 md:w-32 md:h-32"
                viewBox="0 0 120 120"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Circle background */}
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="#10B981"
                  className={animate ? "animate-scale-in" : "scale-0"}
                  style={{
                    transformOrigin: "center",
                    animation: animate
                      ? "scaleIn 0.5s ease-out forwards"
                      : "none",
                  }}
                />

                {/* Checkmark */}
                <path
                  d="M35 60 L52 77 L85 44"
                  stroke="white"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  className={animate ? "animate-check" : "opacity-0"}
                  style={{
                    strokeDasharray: 100,
                    strokeDashoffset: animate ? 0 : 100,
                    animation: animate
                      ? "drawCheck 0.6s 0.3s ease-out forwards"
                      : "none",
                  }}
                />
              </svg>
            </div>
          </div>

          {/* Success Message */}
          <h1
            className={`text-3xl md:text-4xl font-bold text-gray-800 mb-4 transition-all duration-700 ${
              animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Order Placed Successfully! 🎉
          </h1>

          <p
            className={`text-lg text-gray-600 mb-8 transition-all duration-700 delay-100 ${
              animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Thank you for your purchase! Your order has been received and is
            being processed.
          </p>

          {/* Order Info Card */}
          <div
            className={`bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 mb-8 transition-all duration-700 delay-200 ${
              animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <div className="flex items-center justify-center space-x-3 mb-4">
              <MdEmail className="text-green-600 text-2xl" />
              <p className="text-gray-700 font-medium">
                A confirmation email has been sent to your inbox
              </p>
            </div>

            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <FaShoppingBag className="text-green-600" />
              <p>We'll notify you once your order is on its way</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div
            className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-700 delay-300 ${
              animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <button
              onClick={handleGoHome}
              className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <FaHome className="text-xl" />
              <span>Back to Store</span>
            </button>

            {/* <button
              onClick={handleViewOrders}
              className="flex items-center justify-center space-x-2 bg-white hover:bg-gray-50 text-green-600 font-semibold py-3 px-8 rounded-xl border-2 border-green-600 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
            >
              <FaShoppingBag className="text-xl" />
              <span>View Orders</span>
            </button> */}
          </div>

          {/* Decorative elements */}
          <div className="mt-12 flex justify-center space-x-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full bg-green-400 transition-all duration-500`}
                style={{
                  animationDelay: `${i * 0.2}s`,
                  animation: animate ? "bounce 1s infinite" : "none",
                }}
              ></div>
            ))}
          </div>
        </div>

        {/* Additional Info */}
        <div
          className={`mt-8 text-center text-gray-600 transition-all duration-700 delay-400 ${
            animate ? "opacity-100" : "opacity-0"
          }`}
        >
          <p className="text-sm">
            Need help? Contact our{" "}
            <a
              href="/support"
              className="text-green-600 hover:underline font-medium"
            >
              customer support
            </a>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes scaleIn {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes drawCheck {
          from {
            stroke-dashoffset: 100;
          }
          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }
      `}</style>
    </div>
  );
};

export default Success;
