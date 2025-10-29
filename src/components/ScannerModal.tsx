// File: src/components/ScannerModal.tsx

import { useContext, useState } from "react";
import { CartContext } from "../context/CartContext";
import Html5QrcodePlugin from "./Html5QrcodePlugin";

interface ScannerModalProps {
  onClose: () => void;
  onScanSuccess: (decodedText: string, decodedResult: any) => void;
  isSearching?: boolean;
}

const ScannerModal = ({
  onClose,
  onScanSuccess,
  isSearching = false,
}: ScannerModalProps) => {
  const { cart } = useContext(CartContext);
  const [isCameraReady, setIsCameraReady] = useState(false);

  console.log("Current cart:", cart);

  const handleScanError = (error: string) => {
    // Silent error handling to avoid console spam
    console.warn("Scan error:", error);
  };

  const handleCameraReady = () => {
    setIsCameraReady(true);
  };

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-transparent z-50 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Scan Barcode</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              disabled={isSearching}
            >
              <svg
                className="w-6 h-6 text-gray-600"
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
          </div>

          <div className="bg-white/95 backdrop-blur-md rounded-lg px-6 py-4 shadow-lg mb-4 border border-gray-200">
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 font-medium">
                  Items in Cart
                </p>
                <p className="text-3xl font-bold text-green-600">
                  {cart.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <p className="text-sm text-gray-600 text-center mb-2">
              Position the barcode within the scanner frame
            </p>
          </div>

          <div className="scanner-container rounded-xl overflow-hidden border-4 border-green-500 relative">
            {/* Camera Loading Spinner */}
            {!isCameraReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-30">
                <div className="text-center">
                  <div className="relative w-20 h-20 mx-auto mb-4">
                    <div className="absolute inset-0 border-4 border-green-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-transparent border-t-green-600 rounded-full animate-spin"></div>
                    <div
                      className="absolute inset-2 border-4 border-transparent border-t-green-400 rounded-full animate-spin"
                      style={{
                        animationDirection: "reverse",
                        animationDuration: "1s",
                      }}
                    ></div>
                  </div>
                  <p className="text-gray-800 font-bold text-lg mb-1">
                    Camera Loading
                  </p>
                  <p className="text-gray-500 text-sm">Please wait...</p>
                </div>
              </div>
            )}

            {/* Product Search Loading Overlay */}
            {isSearching && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-40">
                <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm mx-4">
                  <div className="text-center">
                    <div className="relative w-24 h-24 mx-auto mb-4">
                      <div className="absolute inset-0 border-4 border-green-100 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-transparent border-t-green-600 rounded-full animate-spin"></div>
                      <div
                        className="absolute inset-2 border-4 border-transparent border-t-green-400 rounded-full animate-spin"
                        style={{
                          animationDirection: "reverse",
                          animationDuration: "0.8s",
                        }}
                      ></div>
                      <svg
                        className="absolute inset-0 m-auto w-10 h-10 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-gray-900 font-bold text-xl mb-2">
                      Searching Product
                    </p>
                    <p className="text-gray-600 text-sm">
                      Looking up barcode in database...
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Html5QrcodePlugin
              fps={10}
              qrbox={250}
              disableFlip={false}
              qrCodeSuccessCallback={onScanSuccess}
              qrCodeErrorCallback={handleScanError}
              onCameraReady={handleCameraReady}
              isPaused={isSearching}
            />
          </div>

          {isSearching && (
            <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-800 font-medium text-center">
                🔍 Processing barcode... Please hold steady
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        /* Scanner Container Styles */
        .scanner-container {
          background: #f9fafb;
          min-height: 400px;
        }

        #html5qr-code-full-region {
          border: none !important;
        }

        #html5qr-code-full-region > div {
          padding: 0 !important;
        }

        #html5qr-code-full-region video {
          border-radius: 8px;
        }

        /* Style the scanner region text */
        #html5qr-code-full-region__scan_region {
          background: transparent !important;
        }

        #html5qr-code-full-region__dashboard_section {
          padding: 16px 0 !important;
        }

        #html5qr-code-full-region__dashboard_section_csr {
          text-align: center !important;
          color: #374151 !important;
          font-size: 14px !important;
        }

        /* Camera selection styling */
        #html5qr-code-full-region__camera_selection {
          margin: 16px 0 !important;
        }

        #html5-qrcode-select-camera {
          width: 100% !important;
          max-width: 100% !important;
        }

        /* Hide default styled elements we don't need */
        #html5-qrcode-anchor-scan-type-change {
          display: none !important;
        }

        /* Responsive adjustments */
        @media (max-width: 640px) {
          #html5qr-code-full-region {
            width: 100% !important;
          }

          .scanner-container {
            border-width: 2px;
            min-height: 300px;
          }
        }
      `}</style>
    </div>
  );
};

export default ScannerModal;
