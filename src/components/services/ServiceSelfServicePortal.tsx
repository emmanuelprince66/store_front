import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import type {
  AvailableSlot,
  CustomerBookingLookupResponse,
  StoreTarget,
} from "../../api/services";
import {
  cancelBooking,
  fetchServiceDetail,
  lookupBookingByReference,
  rescheduleBooking,
} from "../../api/services";

interface ServiceSelfServicePortalProps {
  target: StoreTarget;
  initialReference?: string;
  currencySymbol?: string;
  onBackToBooking?: () => void;
}

export const ServiceSelfServicePortal = ({
  target,
  initialReference = "",
  currencySymbol = "₦",
  onBackToBooking,
}: ServiceSelfServicePortalProps) => {
  const [referenceInput, setReferenceInput] = useState(initialReference);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<CustomerBookingLookupResponse | null>(null);

  // Cancel state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancellationResult, setCancellationResult] = useState<{
    message: string;
    refund_amount?: string;
    refund_note?: string;
  } | null>(null);

  // Reschedule state
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newSlot, setNewSlot] = useState<string | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [isRescheduling, setIsRescheduling] = useState(false);

  const performLookup = async (ref: string) => {
    const cleanRef = ref.trim().toUpperCase();
    if (!cleanRef) {
      toast.warn("Please enter a booking reference code");
      return;
    }

    setLoading(true);
    setCancellationResult(null);

    try {
      const data = await lookupBookingByReference(target, cleanRef);
      setBooking(data);
    } catch (err: any) {
      setBooking(null);
      toast.error(err?.message || "Booking reference not found. Please check and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialReference.trim()) {
      setReferenceInput(initialReference.trim());
      performLookup(initialReference.trim());
    }
  }, [initialReference]);

  const handleCancel = async () => {
    if (!booking) return;
    setIsCancelling(true);

    try {
      const res = await cancelBooking(target, booking.reference, cancelReason);
      toast.success(res.message || "Booking cancelled successfully");
      setCancellationResult({
        message: res.message,
        refund_amount: res.refund_amount,
        refund_note: res.refund_note,
      });
      setShowCancelModal(false);
      performLookup(booking.reference);
    } catch (err: any) {
      toast.error(err?.message || "Unable to cancel booking at this time.");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleOpenReschedule = async () => {
    if (!booking) return;
    setShowRescheduleModal(true);
    setNewDate(booking.booking_date);
    setNewSlot(null);
    loadRescheduleSlots(booking.service.id, booking.booking_date);
  };

  const loadRescheduleSlots = async (serviceId: string, date: string) => {
    setIsLoadingSlots(true);
    try {
      const detail = await fetchServiceDetail(target, serviceId, { date });
      setAvailableSlots(detail.available_slots || []);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load slots for selected date");
      setAvailableSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleDateChange = (date: string) => {
    setNewDate(date);
    setNewSlot(null);
    if (booking?.service.id) {
      loadRescheduleSlots(booking.service.id, date);
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!booking || !newDate || !newSlot) {
      toast.warn("Please select a date and time slot");
      return;
    }

    setIsRescheduling(true);
    try {
      await rescheduleBooking(target, booking.reference, {
        new_date: newDate,
        new_start_time: newSlot,
      });
      toast.success("Booking rescheduled successfully!");
      setShowRescheduleModal(false);
      performLookup(booking.reference);
    } catch (err: any) {
      toast.error(err?.message || "Unable to reschedule booking to this slot.");
    } finally {
      setIsRescheduling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s === "CONFIRMED") {
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
          ● Confirmed
        </span>
      );
    }
    if (s === "PENDING") {
      return (
        <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
          ● Pending Hold
        </span>
      );
    }
    if (s === "CANCELLED") {
      return (
        <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
          ● Cancelled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-800">
        {status}
      </span>
    );
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Search Header */}
      <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-gray-100">
          <div>
            <h2 className="font-display text-2xl uppercase tracking-wide text-gray-900">
              Appointment Self-Service
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Enter your booking reference code to view, reschedule, or cancel.
            </p>
          </div>
          {onBackToBooking && (
            <button
              type="button"
              onClick={onBackToBooking}
              className="text-xs font-semibold text-[var(--brand-primary)] hover:underline cursor-pointer"
            >
              ← Back to Services
            </button>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            performLookup(referenceInput);
          }}
          className="mt-5 flex gap-2.5 sm:gap-3"
        >
          <input
            type="text"
            placeholder="e.g. BK-9B4E21"
            value={referenceInput}
            onChange={(e) => setReferenceInput(e.target.value)}
            className="flex-1 rounded-full border border-gray-300 bg-[#f0f0f0] px-5 py-3 text-sm uppercase tracking-wider outline-none focus:bg-white focus:ring-2 focus:ring-black/10"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-[var(--brand-primary)] text-[var(--brand-on-primary)] px-6 sm:px-8 py-3 text-xs sm:text-sm font-semibold shadow hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Searching..." : "Lookup"}
          </button>
        </form>
      </div>

      {/* Cancellation Notice Alert if present */}
      {cancellationResult && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <div className="flex items-start gap-3.5">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-200 text-red-800 text-sm font-bold">
              ✓
            </span>
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-red-900">
                {cancellationResult.message || "Booking Cancelled Successfully"}
              </h3>
              {cancellationResult.refund_amount && (
                <p className="text-xs font-semibold text-red-800">
                  Refundable Service Amount: {currencySymbol}
                  {Number(cancellationResult.refund_amount).toLocaleString("en-NG", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              )}
              {cancellationResult.refund_note && (
                <p className="text-xs leading-relaxed text-red-700 bg-white/60 p-3 rounded-2xl border border-red-200">
                  {cancellationResult.refund_note}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Booking Details Card */}
      {booking && (
        <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div>
              <span className="block text-xs font-medium text-gray-500">Booking Reference</span>
              <span className="font-mono text-base font-extrabold text-gray-900">
                {booking.reference}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(booking.status)}
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                Payment: {booking.payment_status.replace(/_/g, " ")}
              </span>
            </div>
          </div>

          {/* Service & Schedule info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100">
              <span className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Service
              </span>
              <p className="mt-1 font-bold text-gray-900">{booking.service.name}</p>
              <p className="text-xs text-gray-500">
                Duration: {booking.service.duration_minutes} minutes
              </p>
              <p className="mt-2 text-sm font-extrabold text-[var(--brand-primary)]">
                {currencySymbol}
                {Number(booking.service.price).toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100">
              <span className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Schedule
              </span>
              <p className="mt-1 font-bold text-gray-900">
                {new Intl.DateTimeFormat("en-NG", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }).format(new Date(`${booking.booking_date}T12:00:00`))}
              </p>
              <p className="text-xs text-gray-600">
                {booking.start_time} - {booking.end_time}
              </p>
              <p className="mt-2 text-xs font-medium text-gray-700">
                Attendant: <span className="font-semibold">{booking.staff || "Any Staff"}</span>
              </p>
            </div>
          </div>

          {booking.notes && (
            <div className="rounded-2xl bg-gray-50 p-3.5 text-xs text-gray-700 border border-gray-100">
              <span className="font-semibold">Notes:</span> {booking.notes}
            </div>
          )}

          {/* Financial Breakdown */}
          <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 space-y-2 text-xs">
            <span className="block font-bold text-gray-800 uppercase tracking-wider text-[11px]">
              Payment Summary ({booking.payment_option.replace(/_/g, " ")})
            </span>
            <div className="flex justify-between text-gray-600">
              <span>Amount Paid Online</span>
              <span className="font-semibold text-gray-900">
                {currencySymbol}
                {Number(booking.amount_paid).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Refundable Base Amount</span>
              <span className="font-semibold text-gray-900">
                {currencySymbol}
                {Number(booking.refundable_amount).toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between text-gray-600 border-t border-gray-200 pt-2 font-bold">
              <span>Balance Due at Venue</span>
              <span className="text-[var(--brand-primary)]">
                {currencySymbol}
                {Number(booking.balance_due).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Policy Information */}
          <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-xs text-blue-900 space-y-1">
            <span className="font-bold">Cancellation Policy:</span>
            <p className="text-blue-800">
              Free cancellation and rescheduling up to {booking.policy.cancellation_window_hours}{" "}
              hours before the scheduled start time.
            </p>
          </div>

          {/* Action Buttons: Gated strictly by can_cancel and can_reschedule */}
          <div className="flex flex-wrap gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              disabled={!booking.can_reschedule}
              onClick={handleOpenReschedule}
              className="flex-1 rounded-full bg-[var(--brand-primary)] text-[var(--brand-on-primary)] px-5 py-3.5 text-xs font-semibold hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm cursor-pointer"
            >
              {booking.can_reschedule ? "Reschedule Appointment" : "Reschedule Unavailable"}
            </button>

            <button
              type="button"
              disabled={!booking.can_cancel}
              onClick={() => setShowCancelModal(true)}
              className="flex-1 rounded-full border border-red-300 bg-white px-5 py-3.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {booking.can_cancel ? "Cancel Appointment" : "Cancellation Unavailable"}
            </button>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && booking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-xl space-y-4">
            <h3 className="font-display text-xl uppercase tracking-wide text-gray-900">
              Cancel Appointment?
            </h3>
            <p className="text-xs text-gray-600">
              Are you sure you want to cancel your appointment for{" "}
              <strong>{booking.service.name}</strong> on <strong>{booking.booking_date}</strong>?
            </p>

            <label className="block text-xs font-semibold text-gray-700">
              Reason for Cancellation (Optional)
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Schedule conflict, illness..."
                className="mt-1.5 w-full rounded-2xl border border-gray-300 bg-[#f0f0f0] p-3 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-black/10"
              />
            </label>

            <div className="rounded-2xl bg-amber-50 p-3.5 text-xs text-amber-900 border border-amber-200">
              <strong>Notice:</strong> Gateway processing fees are non-refundable. The refundable
              service amount will be recorded for direct settlement.
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                disabled={isCancelling}
                className="flex-1 rounded-full border border-gray-300 py-3 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isCancelling}
                className="flex-1 rounded-full bg-red-600 py-3 text-xs font-bold text-white hover:bg-red-700 transition disabled:opacity-50 cursor-pointer"
              >
                {isCancelling ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && booking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-7 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-display text-xl uppercase tracking-wide text-gray-900">
                Reschedule Appointment
              </h3>
              <button
                type="button"
                onClick={() => setShowRescheduleModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Select New Date
              </label>
              <input
                type="date"
                value={newDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full rounded-full border border-gray-300 bg-[#f0f0f0] px-4 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-black/10 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Available Slots
              </label>

              {isLoadingSlots ? (
                <div className="p-8 text-center text-xs text-gray-500 animate-pulse">
                  Loading slots for {newDate}...
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 text-center text-xs text-gray-500">
                  No available slots found for this date.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto p-1">
                  {availableSlots.map((slot) => {
                    const isSelected = newSlot === slot.start_time;
                    const isFull = slot.remaining_capacity === 0;

                    return (
                      <button
                        key={slot.start_time}
                        type="button"
                        disabled={isFull}
                        onClick={() => setNewSlot(slot.start_time)}
                        className={`rounded-2xl border p-2.5 text-center transition text-xs font-semibold ${
                          isFull
                            ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 line-through"
                            : isSelected
                              ? "border-[var(--brand-primary)] bg-[var(--brand-surface)] text-[var(--brand-primary)] ring-2 ring-[var(--brand-primary)] cursor-pointer"
                              : "border-gray-200 hover:border-gray-400 text-gray-800 cursor-pointer"
                        }`}
                      >
                        <div>{slot.display || slot.start_time}</div>
                        <div className="text-[10px] font-normal text-gray-500 mt-0.5">
                          {isFull ? "Full" : `${slot.remaining_capacity} left`}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowRescheduleModal(false)}
                disabled={isRescheduling}
                className="flex-1 rounded-full border border-gray-300 py-3 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRescheduleSubmit}
                disabled={isRescheduling || !newSlot}
                className="flex-1 rounded-full bg-[var(--brand-primary)] text-[var(--brand-on-primary)] py-3 text-xs font-bold hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
              >
                {isRescheduling ? "Rescheduling..." : "Confirm New Slot"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
