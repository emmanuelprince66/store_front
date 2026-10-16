import { useEffect, useState } from "react";

interface BookingHoldTimerProps {
  expiresAt: string | null | undefined;
  onExpire?: () => void;
  className?: string;
}

export const BookingHoldTimer = ({
  expiresAt,
  onExpire,
  className = "",
}: BookingHoldTimerProps) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(() => {
    if (!expiresAt) return null;
    const diff = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
    return Math.max(0, diff);
  });

  useEffect(() => {
    if (!expiresAt) {
      setSecondsRemaining(null);
      return;
    }

    const calculateRemaining = () => {
      const diff = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
      return Math.max(0, diff);
    };

    setSecondsRemaining(calculateRemaining());

    const timer = setInterval(() => {
      const remaining = calculateRemaining();
      setSecondsRemaining(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        onExpire?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, onExpire]);

  if (secondsRemaining === null) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const isCritical = secondsRemaining <= 120; // Under 2 minutes
  const isExpired = secondsRemaining === 0;

  return (
    <div
      className={`flex items-center justify-between rounded-xl px-4 py-3 text-xs sm:text-sm font-medium transition-colors ${
        isExpired
          ? "border border-red-300 bg-red-50 text-red-800"
          : isCritical
            ? "border border-amber-300 bg-amber-50 text-amber-900 animate-pulse"
            : "border border-blue-200 bg-blue-50 text-blue-900"
      } ${className}`}
    >
      <div className="flex items-center gap-2">
        <svg
          className={`h-4 w-4 shrink-0 ${
            isExpired ? "text-red-600" : isCritical ? "text-amber-600" : "text-blue-600"
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>
          {isExpired
            ? "Booking slot hold has expired"
            : "Slot reserved! Complete payment before hold expires:"}
        </span>
      </div>
      <span
        className={`font-mono text-sm sm:text-base font-bold ${
          isExpired ? "text-red-700" : isCritical ? "text-amber-700" : "text-blue-700"
        }`}
      >
        {isExpired ? "00:00" : formattedTime}
      </span>
    </div>
  );
};
