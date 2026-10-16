import { useState } from "react";
import { toast } from "react-toastify";
import { getErrorMessage } from "../../api/client";
import type { BookingVirtualAccount, StoreTarget, VerifyPaymentResponse } from "../../api/services";
import { pollBookingPaymentVerification } from "../../api/services";

interface BankTransferPaymentViewProps {
  target: StoreTarget;
  reference: string;
  accounts: BookingVirtualAccount[];
  amountDue: string;
  currencySymbol?: string;
  onVerified: (verification: VerifyPaymentResponse) => void;
  onExpired?: () => void;
}

export const BankTransferPaymentView = ({
  target,
  reference,
  accounts,
  amountDue,
  currencySymbol = "₦",
  onVerified,
  onExpired,
}: BankTransferPaymentViewProps) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStatusMessage, setVerifyStatusMessage] = useState<string | null>(null);

  const account = accounts[0];

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`);
    } catch {
      toast.error(`Could not copy ${label}. Please copy manually.`);
    }
  };

  const handleVerify = async () => {
    if (isVerifying) return;
    setIsVerifying(true);
    setVerifyStatusMessage("Checking for your incoming transfer with the bank...");

    try {
      const outcome = await pollBookingPaymentVerification(target, reference, {
        intervalMs: 3000,
        timeoutMs: 120_000,
        onPending: (_res, elapsedMs) => {
          const seconds = Math.floor(elapsedMs / 1000);
          if (seconds > 30) {
            setVerifyStatusMessage("Still waiting on the bank gateway. Please stay on this screen...");
          } else {
            setVerifyStatusMessage("Checking for transfer confirmation...");
          }
        },
      });

      if (outcome.outcome === "CONFIRMED" && outcome.response) {
        toast.success(outcome.response.message || "Payment confirmed successfully!");
        onVerified(outcome.response);
      } else if (outcome.outcome === "EXPIRED") {
        toast.error("Booking hold expired before payment was confirmed.");
        onExpired?.();
      } else if (outcome.outcome === "FAILED") {
        toast.error(
          outcome.response?.message || "Transfer verification failed.",
        );
      } else {
        toast.warn(
          "Payment verification timed out. If you already transferred, try again in a moment.",
        );
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to verify transfer"));
    } finally {
      setIsVerifying(false);
      setVerifyStatusMessage(null);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="border-b border-gray-100 pb-3">
        <h3 className="text-base font-bold text-gray-900">Make Bank Transfer</h3>
        <p className="mt-0.5 text-xs text-gray-600">
          Transfer the exact amount to the dedicated virtual account below.
        </p>
      </div>

      {account ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 divide-y divide-gray-100 bg-gray-50/70">
          <div className="flex items-center justify-between p-3.5">
            <div>
              <span className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                Bank Name
              </span>
              <span className="text-sm font-semibold text-gray-900">{account.bank_name}</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3.5">
            <div>
              <span className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                Account Number
              </span>
              <span className="font-mono text-lg font-bold tracking-wider text-gray-900">
                {account.account_number}
              </span>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(account.account_number, "Account number")}
              className="rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm border border-gray-200 hover:bg-gray-100 transition cursor-pointer"
            >
              Copy
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5">
            <div>
              <span className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                Account Name
              </span>
              <span className="text-sm font-semibold text-gray-900">{account.account_name}</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-emerald-50/50">
            <div>
              <span className="block text-[11px] font-medium text-emerald-800 uppercase tracking-wider">
                Amount to Transfer
              </span>
              <span className="text-lg font-extrabold text-emerald-700">
                {currencySymbol}
                {Number(account.amount || amountDue).toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(account.amount || amountDue, "Amount")}
              className="rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm border border-emerald-200 hover:bg-emerald-50 transition cursor-pointer"
            >
              Copy
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5">
            <div>
              <span className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                Payment Reference
              </span>
              <span className="font-mono text-xs font-semibold text-gray-800">
                {account.reference || reference}
              </span>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(account.reference || reference, "Reference")}
              className="rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm border border-gray-200 hover:bg-gray-100 transition cursor-pointer"
            >
              Copy
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-gray-50 p-4 text-center text-sm text-gray-600">
          Generating virtual account details...
        </div>
      )}

      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs leading-5 text-amber-900">
        <strong>Important:</strong> Please ensure you transfer the <strong>exact amount</strong>{" "}
        specified. Once transferred, click the button below to confirm your appointment.
      </div>

      <button
        type="button"
        disabled={isVerifying}
        onClick={handleVerify}
        className="w-full flex items-center justify-center gap-2 rounded-full bg-[var(--brand-primary)] text-[var(--brand-on-primary)] px-6 py-4 text-sm font-semibold shadow hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {isVerifying ? (
          <>
            <svg
              className="h-4 w-4 animate-spin text-white"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            <span>Verifying payment with bank...</span>
          </>
        ) : (
          <span>I have transferred the funds</span>
        )}
      </button>

      {verifyStatusMessage && (
        <p className="text-center text-xs text-gray-600 animate-pulse">
          {verifyStatusMessage}
        </p>
      )}
    </div>
  );
};
