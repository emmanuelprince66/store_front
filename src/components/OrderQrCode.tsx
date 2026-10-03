import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface OrderQrCodeProps {
  /** The order code, e.g. "INS-9482". Encoded verbatim. */
  value: string;
  /** Rendered pixel size of the QR square. */
  size?: number;
}

/**
 * The buyer's counter pass: order code above, scannable QR below.
 *
 * The QR encodes the raw code string and nothing else — no JSON wrapper. The
 * POS scanner passes decoded text straight to the lookup endpoint, so wrapping
 * it would make every scan fail silently.
 *
 * The code is always shown as text too. Cameras fail, screens crack, and a
 * cashier can key in "INS-9482" by hand — but only if they can read it.
 */
export const OrderQrCode = ({ value, size = 240 }: OrderQrCodeProps) => {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);

    QRCode.toDataURL(value, {
      // Rendered at 2x so the QR stays sharp on high-density phone screens.
      width: size * 2,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [value, size]);

  return (
    <div className="flex flex-col items-center">
      <p className="text-xs font-medium uppercase tracking-widest text-gray-500">
        Your Code
      </p>
      <p className="mb-4 font-display text-4xl font-bold tracking-wider text-black sm:text-5xl">
        {value}
      </p>

      <div
        className="flex items-center justify-center rounded-2xl border border-gray-200 bg-white p-4"
        style={{ width: size + 32, height: size + 32 }}
      >
        {dataUrl ? (
          <img
            src={dataUrl}
            alt={`QR code for order ${value}`}
            width={size}
            height={size}
            className="h-full w-full"
          />
        ) : failed ? (
          <p className="px-2 text-center text-xs text-gray-500">
            Couldn't draw the QR code — read the order code above to the
            cashier instead.
          </p>
        ) : (
          <div
            className="h-full w-full animate-pulse rounded-lg bg-gray-100"
            aria-hidden
          />
        )}
      </div>
    </div>
  );
};
