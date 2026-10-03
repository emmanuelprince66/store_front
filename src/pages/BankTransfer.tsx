import { useState } from "react";
import { toast } from "react-toastify";

const BankTransfer = ({
  total,
  formatCurrency,
  bankTransferDetails,
  onConfirmPayment,
}: {
  total: number;
  formatCurrency: (value: number) => string;
  bankTransferDetails: {
    bank_name: string;
    account_number: string;
    account_name: string;
  } | null;
  onConfirmPayment: () => Promise<void>;
}) => {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirmPayment = async () => {
    setIsConfirming(true);
    try {
      await onConfirmPayment();
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <>
      <div className="p-8 w-full ">
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Complete Your Payment
          </h3>
          <p className="text-sm text-gray-600">
            Transfer ₦{formatCurrency(total)} to the account below
          </p>
        </div>

        {bankTransferDetails && (
          <div className="bg-gray-50 rounded-lg p-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Bank Name
              </label>
              <div className="flex items-center justify-between bg-white p-3 rounded border">
                <span className="font-semibold text-gray-900">
                  {bankTransferDetails.bank_name}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Account Number
              </label>
              <div className="flex items-center justify-between bg-[var(--brand-surface)] p-3 rounded border border-[var(--brand-primary)]">
                <span className="font-bold text-[var(--brand-primary)] text-lg tracking-wider">
                  {bankTransferDetails.account_number}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      bankTransferDetails.account_number,
                    );
                    toast.success("Account number copied!");
                  }}
                  className="text-[var(--brand-primary)] cursor-pointer hover:opacity-75 underline text-sm font-medium"
                >
                  Copy
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Account Name
              </label>
              <div className="bg-white p-3 rounded border">
                <span className="font-semibold text-gray-900">
                  {bankTransferDetails.account_name}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Amount
              </label>
              <div className="bg-white p-3 rounded border">
                <span className="font-bold text-[var(--brand-primary)] text-lg">
                  ₦{formatCurrency(total)}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-[#f0f0f0] rounded-xl border border-gray-200 mb-4">
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
              <p className="font-semibold mb-2">
                Payment Confirmation Process:
              </p>
              <ul className="space-y-1.5 list-disc list-inside">
                <li>Complete your bank transfer using the details above</li>
                <li>Click "I've Made the Transfer" button below</li>
                <li>Confirmation typically takes a few seconds to a minute</li>
                <li>You can retry the confirmation if needed</li>
                <li>Your order will be processed once payment is verified</li>
              </ul>
            </div>
          </div>
        </div>

        <button
          onClick={handleConfirmPayment}
          disabled={isConfirming}
          className="w-full mt-6 bg-[var(--brand-primary)] cursor-pointer text-[var(--brand-on-primary)] py-3.5 rounded-full hover:opacity-90 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isConfirming ? "Confirming Payment..." : "I've Made the Transfer"}
        </button>
      </div>
    </>
  );
};

export default BankTransfer;
