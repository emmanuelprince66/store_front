// File: src/components/ScannerModal.tsx

import { useContext } from "react";
import { CartContext } from "../context/CartContext";
import Html5QrcodePlugin from "./Html5QrcodePlugin";

interface ScannerModalProps {
  onClose: () => void;
  onScanSuccess: (decodedText: string, decodedResult: any) => void;
}

const ScannerModal = ({ onClose, onScanSuccess }: ScannerModalProps) => {
  const { cart } = useContext(CartContext);

  console.log("Current cart:", cart);

  const handleScanError = (error: string) => {
    // Silent error handling to avoid console spam
    console.warn("Scan error:", error);
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

          <div className="scanner-container rounded-xl overflow-hidden border-4 border-green-500">
            <Html5QrcodePlugin
              fps={10}
              qrbox={250}
              disableFlip={false}
              qrCodeSuccessCallback={onScanSuccess}
              qrCodeErrorCallback={handleScanError}
            />
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            {/* <p className="text-sm text-blue-800 font-medium">
              📋 Test Instructions: Enter product ID (1 or 2) in the scanner
              input field
            </p> */}
          </div>
        </div>
      </div>

      <style>{`
        /* Scanner Container Styles */
        .scanner-container {
          background: #f9fafb;
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
          }
        }
      `}</style>
    </div>
  );
};

export default ScannerModal;
