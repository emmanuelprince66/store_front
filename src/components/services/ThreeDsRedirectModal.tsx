import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import type { StoreTarget, VerifyPaymentResponse } from "../../api/services";
import {
  pollBookingPaymentVerification,
  verifyBookingPayment,
} from "../../api/services";
import { isAbortError } from "../../api/client";

interface ThreeDsRedirectModalProps {
  target: StoreTarget;
  reference: string;
  redirectHtml?: string;
  onSuccess: (res: VerifyPaymentResponse) => void;
  onClose: () => void;
  /** The hold ran out; the parent should send the customer to pick a new slot. */
  onExpired?: () => void;
}

export const ThreeDsRedirectModal = ({
  target,
  reference,
  redirectHtml,
  onSuccess,
  onClose,
  onExpired,
}: ThreeDsRedirectModalProps) => {
  const [isPolling, setIsPolling] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const onSuccessRef = useRef(onSuccess);
  const onCloseRef = useRef(onClose);
  const onExpiredRef = useRef(onExpired);
  const pollControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onCloseRef.current = onClose;
    onExpiredRef.current = onExpired;
  }, [onSuccess, onClose, onExpired]);

  const handleExpired = () => {
    toast.error("Booking hold expired before card verification completed.");
    (onExpiredRef.current ?? onCloseRef.current)();
  };

  useEffect(() => {
    const controller = new AbortController();
    pollControllerRef.current = controller;

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
          handleExpired();
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
        if (!controller.signal.aborted) setIsPolling(false);
      }
    };

    startPolling();
    return () => controller.abort();
  }, [target, reference]);

  /**
   * Closing must not throw away an authentication the customer just finished
   * between two polls: check once more and route on the real status.
   */
  const handleClose = async () => {
    if (isClosing) return;
    setIsClosing(true);
    pollControllerRef.current?.abort();
    try {
      const res = await verifyBookingPayment(target, reference);
      if (res.status === "CONFIRMED") {
        onSuccessRef.current(res);
        return;
      }
      if (res.status === "EXPIRED") {
        handleExpired();
        return;
      }
    } catch {
      // Fall through: close anyway. Pressing Pay again re-checks the hold.
    }
    onCloseRef.current();
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="three-ds-title"
        className="relative flex h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 bg-gray-50">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 id="three-ds-title" className="text-sm font-bold text-gray-800">
              3D-Secure Card Authentication
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isClosing}
            aria-label="Close card authentication"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition cursor-pointer disabled:opacity-50"
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

        <div className="border-t border-gray-200 px-4 py-3 bg-gray-50 flex items-center justify-between gap-3 text-xs text-gray-500">
          <span>
            {isClosing
              ? "Checking your payment status..."
              : isPolling
                ? "Waiting for authorization confirmation..."
                : "Authentication completed or timed out."}
          </span>
          <button
            type="button"
            onClick={handleClose}
            disabled={isClosing}
            className="min-h-10 rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 hover:bg-gray-100 transition cursor-pointer disabled:opacity-50"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
