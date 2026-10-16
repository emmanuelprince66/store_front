import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import type { StoreTarget, VerifyPaymentResponse } from "../../api/services";
import { pollBookingPaymentVerification } from "../../api/services";
import { isAbortError } from "../../api/client";

interface ThreeDsRedirectModalProps {
  target: StoreTarget;
  reference: string;
  redirectHtml?: string;
  onSuccess: (res: VerifyPaymentResponse) => void;
  onClose: () => void;
}

export const ThreeDsRedirectModal = ({
  target,
  reference,
  redirectHtml,
  onSuccess,
  onClose,
}: ThreeDsRedirectModalProps) => {
  const [isPolling, setIsPolling] = useState(true);
  const onSuccessRef = useRef(onSuccess);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onCloseRef.current = onClose;
  }, [onSuccess, onClose]);

  useEffect(() => {
    const controller = new AbortController();

    const startPolling = async () => {
      try {
        const result = await pollBookingPaymentVerification(target, reference, {
          intervalMs: 4000,
          timeoutMs: 180_000,
          signal: controller.signal,
        });

        if (result.outcome === "CONFIRMED" && result.response) {
          onSuccessRef.current(result.response);
        } else if (result.outcome === "EXPIRED") {
          toast.error("Booking hold expired before card verification completed.");
          onCloseRef.current();
        } else if (result.outcome === "FAILED") {
          toast.error(
            result.response?.message || "Card payment verification failed.",
          );
          onCloseRef.current();
        } else {
          toast.error("Card verification timed out. Please try again.");
          onCloseRef.current();
        }
      } catch (error) {
        if (!isAbortError(error)) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Card payment verification failed.",
          );
          onCloseRef.current();
        }
      } finally {
        setIsPolling(false);
      }
    };

    startPolling();
    return () => controller.abort();
  }, [target, reference]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative flex h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 bg-gray-50">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-sm font-bold text-gray-800">3D-Secure Card Authentication</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 bg-white">
          {redirectHtml ? (
            <iframe
              title="3DS Authorization"
              srcDoc={redirectHtml}
              className="h-full w-full border-0"
              sandbox="allow-forms allow-scripts allow-same-origin allow-top-navigation"
            />
          ) : (
            <div className="flex h-full items-center justify-center p-6 text-center text-sm text-gray-500">
              Loading 3D-Secure provider...
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 px-4 py-3 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
          <span>{isPolling ? "Waiting for authorization confirmation..." : "Authentication completed or timed out."}</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-100 transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
