import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Modal } from "../components/Modal";
import { OrderQrCode } from "../components/OrderQrCode";
import type { InStoreDraftResponse } from "../api/orders";
import type { BnplStage } from "../useCheckoutHook";
import { saveOrderQr } from "../utils/orderQrImage";

interface InStoreCounterPassProps {
  draft: InStoreDraftResponse;
  bnplStage: BnplStage;
  bnplMessage: string;
  formatCurrency: (amount: number) => string;
  onDone: () => void;
  /** Back to checkout with the basket intact — used once the code expires. */
  onRestart: () => void;
}

interface StatusBadge {
  tone: "pending" | "approved" | "rejected" | "neutral";
  label: string;
  detail: string;
}

const TONE_CLASSES: Record<StatusBadge["tone"], string> = {
  approved: "bg-green-50 border-green-200 text-green-800",
  pending: "bg-amber-50 border-amber-200 text-amber-800",
  rejected: "bg-red-50 border-red-200 text-red-800",
  neutral: "bg-[#f0f0f0] border-gray-200 text-black",
};

/**
 * What the buyer is told while standing at the counter.
 *
 * BNPL is the only type with a live status worth showing — COUNTER and ONLINE
 * are resolved by the cashier, and the storefront never hears about it.
 */
const describeStatus = (
  draft: InStoreDraftResponse,
  bnplStage: BnplStage,
  bnplMessage: string,
): StatusBadge => {
  if (draft.payment_type !== "BNPL") {
    return draft.payment_type === "ONLINE"
      ? {
          tone: "neutral",
          label: "Transfer, then show this code",
          detail:
            "Send the exact total to the account below. Once it lands, show this code to the cashier.",
        }
      : {
          tone: "neutral",
          label: "Pay at the counter",
          detail:
            "Show this code to the cashier. They'll check your items and take payment.",
        };
  }

  switch (bnplStage) {
    case "approved":
      return {
        tone: "approved",
        label: "Approved by Akawopay",
        detail:
          "Your installment plan is active. Show this code and the cashier will hand over your items.",
      };
    case "rejected":
      return {
        tone: "rejected",
        label: "Declined by Akawopay",
        detail:
          bnplMessage ||
          "Your BNPL request was declined. You can still pay the cashier by cash, card or transfer.",
      };
    case "timeout":
      return {
        tone: "pending",
        label: "Still processing",
        detail:
          bnplMessage ||
          "Akawopay is taking longer than usual. The cashier can check your status at the counter.",
      };
    default:
      return {
        tone: "pending",
        label: "Authorizing with Akawopay",
        detail:
          "Hold on while your installment plan is approved. You can walk to the counter in the meantime.",
      };
  }
};

/**
 * When this draft stops being valid, as a local timestamp — or null if the
 * API didn't say.
 *
 * Anchored to when the response arrived plus the server's duration, rather
 * than to `expires_at`. That field is in server time, and a phone whose clock
 * is a few minutes off would count down to the wrong moment; a duration can't
 * be skewed that way, and the round-trip it ignores is a second at most.
 * `expires_at` is only used when no duration came back.
 */
const resolveDeadline = (
  draft: InStoreDraftResponse,
  receivedAt: number,
): number | null => {
  if (draft.expires_in_ms) return receivedAt + draft.expires_in_ms;
  if (draft.expires_in_seconds)
    return receivedAt + draft.expires_in_seconds * 1000;
  if (draft.expires_at) {
    const absolute = Date.parse(draft.expires_at);
    return Number.isNaN(absolute) ? null : absolute;
  }
  return null;
};

/** h:mm:ss, or m:ss under an hour — "120:00" reads as a typo. */
const formatRemaining = (ms: number): string => {
  const totalSeconds = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds)}`
    : `${minutes}:${pad(seconds)}`;
};

/**
 * The screen the buyer shows the cashier: order code, QR, and live status.
 *
 * Deliberately a full page rather than a modal — it has one job, and the buyer
 * is holding the phone up to someone else while it's open.
 */
export const InStoreCounterPass = ({
  draft,
  bnplStage,
  bnplMessage,
  formatCurrency,
  onDone,
  onRestart,
}: InStoreCounterPassProps) => {
  const status = describeStatus(draft, bnplStage, bnplMessage);
  const virtualAccount = draft.vfd_virtual_account || draft.bank_accounts?.[0];

  // total_amount is the basket SUBTOTAL; payable_amount is what actually has
  // to be paid once the transaction fee is on it. Showing the subtotal next to
  // "transfer this" is how a buyer underpays by the fee and then waits at the
  // counter for a confirmation that never arrives.
  const subtotal = Number(draft.total_amount) || 0;
  const charges = Number(draft.charges) || 0;
  const payable = Number(draft.payable_amount) || subtotal + charges;
  // pay_charges true means the MERCHANT absorbs it — same polarity as the
  // store's pay_transaction_charges flag.
  //
  // The COUNTER exclusion is belt-and-braces. The API now returns charges
  // 0.00 on counter drafts, so it changes nothing today — but it did return a
  // fee there until recently, and quoting the buyer a figure the till will not
  // collect is a mismatch worth keeping impossible rather than merely fixed
  // upstream.
  const buyerPaysCharges =
    draft.pay_charges === false &&
    charges > 0 &&
    draft.payment_type !== "COUNTER";
  // The figure the account was opened for is what the bank matches against.
  const transferAmount = Number(virtualAccount?.amount) || payable;

  // Drafts expire (currently 2 hours). The deadline is fixed once, on mount,
  // and time left is re-derived from the clock on every tick rather than
  // decremented. Decrementing drifts: phones throttle or suspend timers while
  // the screen is locked, so a customer who pockets their phone in the queue
  // would come back to a countdown showing far more time than they have.
  const [deadline] = useState(() => resolveDeadline(draft, Date.now()));
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (deadline === null) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [deadline]);

  // Once paid, the sale exists and the draft's expiry no longer matters —
  // telling someone with an approved plan their code "expired" would be false.
  const isSettled = draft.can_release_items || bnplStage === "approved";
  const msLeft = deadline === null || isSettled ? null : deadline - now;
  const isExpired = msLeft !== null && msLeft <= 0;

  // Lets the customer keep the code once this tab is gone — they may close
  // the browser, lose signal, or queue long enough for the page to reload.
  const [isSaving, setIsSaving] = useState(false);

  // Copying beats retyping a 10-digit account number into a banking app on
  // the same phone that is showing it.
  const [hasCopied, setHasCopied] = useState(false);

  // Bank transfer is shown payment-first: the code and QR are no use until the
  // money has actually been sent, and putting both on one screen invites the
  // buyer to walk to the counter having paid nothing. They appear once the
  // buyer says they're done transferring.
  const [showPass, setShowPass] = useState(false);

  const handleCopyAccount = async () => {
    if (!virtualAccount?.account_number) return;
    try {
      await navigator.clipboard.writeText(virtualAccount.account_number);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — press and hold the number instead.");
    }
  };

  const handleSaveQr = async () => {
    setIsSaving(true);
    try {
      const outcome = await saveOrderQr(draft.order_code);
      if (outcome === "downloaded") toast.success("QR code saved");
    } catch (error) {
      console.error("Saving QR failed:", error);
      toast.error(
        "Couldn't save the QR code. Take a screenshot of this screen instead.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const payFirst = draft.payment_type === "ONLINE" && !!virtualAccount;

  // The order code, QR and what to do with them. Rendered either inline or,
  // for a transfer, inside the modal that follows payment.
  const passContent = (
    <>
      <div className="mb-6 text-center">
        <h1 className="font-display text-2xl uppercase tracking-wide text-[var(--brand-primary)] sm:text-3xl">
          Order Successful! 🎉
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Your order has been placed successfully.
        </p>
      </div>

      <div className="mb-6 rounded-xl border border-gray-200 bg-[#f0f0f0] p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
          Fast-track your checkout
        </p>
        <p className="mt-1 text-xs leading-relaxed text-gray-600">
          Show this code to the attendant, or let them scan the QR code to load
          your items and print your receipt.
        </p>
      </div>

      <OrderQrCode value={draft.order_code} />

      {/* Centred by a flex row rather than mx-auto on the button, so the
          layout never depends on the button's own margins. */}
      <div className="mt-4 flex justify-center">
        <button
          onClick={handleSaveQr}
          disabled={isSaving}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#f0f0f0] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-gray-200 disabled:cursor-wait disabled:opacity-60"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          {isSaving ? "Saving..." : "Download QR Code"}
        </button>
      </div>

      <p className="mt-4 text-center text-sm font-semibold text-black">
        Please show this screen to the attendant.
      </p>
    </>
  );

  const statusBlock = (
    <div className={`rounded-xl border p-4 ${TONE_CLASSES[status.tone]}`}>
      <div className="flex items-center gap-2">
        {bnplStage === "authorizing" && draft.payment_type === "BNPL" && (
          <span
            className="h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden
          />
        )}
        <p className="text-sm font-semibold">{status.label}</p>
      </div>
      <p className="mt-1 text-xs leading-relaxed">{status.detail}</p>
    </div>
  );

  const totalsBlock = draft.total_amount ? (
    <div className="mt-6 border-t border-gray-200 pt-4">
      {buyerPaysCharges ? (
        <dl className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <dt className="text-gray-600">
              Subtotal
              {draft.item_count ? ` · ${draft.item_count} items` : ""}
            </dt>
            <dd>₦{formatCurrency(subtotal)}</dd>
          </div>
          <div className="flex items-center justify-between text-sm">
            <dt className="text-gray-600">Transaction fee</dt>
            <dd>₦{formatCurrency(charges)}</dd>
          </div>
          <div className="flex items-center justify-between border-t border-gray-200 pt-2">
            <dt className="text-sm font-semibold">Total to pay</dt>
            <dd className="text-lg font-bold text-[var(--brand-primary)]">
              ₦{formatCurrency(payable)}
            </dd>
          </div>
        </dl>
      ) : (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            Total{draft.item_count ? ` · ${draft.item_count} items` : ""}
          </span>
          <span className="text-lg font-bold text-[var(--brand-primary)]">
            ₦{formatCurrency(payable)}
          </span>
        </div>
      )}
    </div>
  ) : null;

  const transferBlock = virtualAccount ? (
    <div className="mt-4 rounded-xl border border-gray-200 bg-[#f0f0f0] p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
        Transfer to
      </p>
      <dl className="space-y-2 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-gray-600">Amount</dt>
          <dd className="text-base font-bold text-[var(--brand-primary)]">
            ₦{formatCurrency(transferAmount)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-gray-600">Account</dt>
          <dd className="flex items-center gap-2">
            <span className="font-mono font-semibold">
              {virtualAccount.account_number}
            </span>
            <button
              onClick={handleCopyAccount}
              className="cursor-pointer rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-black transition hover:bg-gray-100"
            >
              {hasCopied ? "Copied" : "Copy"}
            </button>
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-gray-600">Name</dt>
          <dd className="text-right font-semibold">
            {virtualAccount.account_name}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-gray-600">Bank</dt>
          <dd className="text-right font-semibold">
            {virtualAccount.bank_name}
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-xs leading-relaxed text-gray-600">
        Transfer exactly ₦{formatCurrency(transferAmount)}. A different amount
        won't be matched automatically, and the cashier won't see this order as
        paid.
      </p>
    </div>
  ) : null;

  const expiryBlock = (
    <>
      {msLeft !== null && !isExpired && (
        <p className="mt-4 text-center text-xs text-gray-500">
          This code expires in {formatRemaining(msLeft)}
        </p>
      )}

      {isExpired && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-center">
          <p className="text-sm font-semibold text-red-800">
            This code has expired
          </p>
          <p className="mt-1 text-xs text-red-800">
            The cashier can no longer find it. Your basket is still saved —
            place the order again for a new code.
          </p>
          <button
            onClick={onRestart}
            className="mt-3 cursor-pointer rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Place Order Again
          </button>
        </div>
      )}
    </>
  );

  const doneCaption = (
    <p className="mt-2 text-center text-xs text-gray-500">
      Closing this clears your basket. Keep it open until the cashier has served
      you.
    </p>
  );

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
        {payFirst ? (
          <>
            <div className="mb-6 text-center">
              <h1 className="font-display text-2xl uppercase tracking-wide text-[var(--brand-primary)] sm:text-3xl">
                Almost there
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Send the exact amount below to complete your order.
              </p>
            </div>

            {statusBlock}
            {totalsBlock}
            {transferBlock}
            {expiryBlock}

            <button
              onClick={() => setShowPass(true)}
              className="mt-6 w-full cursor-pointer rounded-full bg-[var(--brand-primary)] py-3.5 font-medium text-[var(--brand-on-primary)] transition hover:opacity-90"
            >
              Done
            </button>
            <p className="mt-2 text-center text-xs text-gray-500">
              Your order code and QR come next — show them to the attendant to
              collect your items.
            </p>
          </>
        ) : (
          <>
            {passContent}
            <div className="mt-6">{statusBlock}</div>
            {totalsBlock}
            {expiryBlock}

            <button
              onClick={onDone}
              className="mt-6 w-full cursor-pointer rounded-full bg-[var(--brand-primary)] py-3.5 font-medium text-[var(--brand-on-primary)] transition hover:opacity-90"
            >
              Done
            </button>
            {doneCaption}
          </>
        )}
      </div>

      {/* Shown after the transfer, so the buyer deals with one thing at a
          time: pay, then collect. Dismissing it returns to the transfer
          details rather than clearing anything. */}
      {payFirst && (
        <Modal isOpen={showPass} onClose={() => setShowPass(false)}>
          <div className="p-6">
            {passContent}
            <button
              onClick={onDone}
              className="mt-6 w-full cursor-pointer rounded-full bg-[var(--brand-primary)] py-3.5 font-medium text-[var(--brand-on-primary)] transition hover:opacity-90"
            >
              Done
            </button>
            {doneCaption}
          </div>
        </Modal>
      )}
    </div>
  );
};
