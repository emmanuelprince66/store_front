import { useState } from "react";

interface OtpModalProps {
  onSubmit: (otp: string) => void;
  onClose: () => void;
  isProcessing: boolean;
}

const OtpModal = ({ onSubmit, onClose, isProcessing }: OtpModalProps) => {
  const [otp, setOtp] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim().length >= 4) {
      onSubmit(otp);
    }
  };

  return (
    <div className="p-8 w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-[var(--brand-surface)] rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-[var(--brand-primary)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Enter OTP</h3>
        <p className="text-sm text-gray-600">
          Please enter the OTP sent to your phone by your bank
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            OTP Code
          </label>
          <input
            type="text"
            value={otp}
            onChange={(e) => {
              const value = e.target.value;
              // Only allow numbers
              if (/^\d*$/.test(value)) {
                setOtp(value);
              }
            }}
            placeholder="Enter OTP"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 text-center text-lg tracking-widest"
            maxLength={6}
            autoFocus
          />
        </div>

        <div className="p-4 bg-[#f0f0f0] rounded-lg">
          <div className="flex items-start gap-2">
            <svg
              className="w-5 h-5 text-black flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="text-xs text-gray-700">
              <p className="font-semibold mb-1">Note:</p>
              <p>
                Check your phone for an OTP from your bank. This is to verify
                your payment.
              </p>
              <p className="mt-3">Could take a moment to verify.</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 bg-[#f0f0f0] text-black py-3.5 rounded-full hover:bg-gray-200 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isProcessing || otp.length < 4}
            className="flex-1 bg-[var(--brand-primary)] text-[var(--brand-on-primary)] py-3.5 rounded-full hover:opacity-90 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? "Verifying..." : "Verify Payment"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OtpModal;
