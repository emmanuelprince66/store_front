import QRCode from "qrcode";

// Layout of the saved image, in canvas pixels, top to bottom. Drawn large so
// the QR still scans cleanly after a phone's gallery compresses or downsizes
// it. Every vertical gap is named so the stack stays balanced when one moves.
const WIDTH = 720;
const PAD_Y = 56;
const LABEL_LINE = 32;
const LABEL_TO_CODE = 8;
const CODE_LINE = 84;
const CODE_TO_FRAME = 36;
const QR_SIZE = 560;
const FRAME_PADDING = 20;
const FRAME_RADIUS = 28;
const FRAME_TO_FOOTER = 32;
const FOOTER_LINE = 32;

const FRAME_SIZE = QR_SIZE + FRAME_PADDING * 2;
const HEIGHT =
  PAD_Y +
  LABEL_LINE +
  LABEL_TO_CODE +
  CODE_LINE +
  CODE_TO_FRAME +
  FRAME_SIZE +
  FRAME_TO_FOOTER +
  FOOTER_LINE +
  PAD_Y;

const FONT_STACK =
  "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";

/** Draws text centred in a line box, so position never depends on font metrics. */
const drawCentredLine = (
  ctx: CanvasRenderingContext2D,
  text: string,
  top: number,
  lineHeight: number,
) => ctx.fillText(text, WIDTH / 2, top + lineHeight / 2);

/**
 * Rounded rectangle path, built by hand because ctx.roundRect is missing on
 * iOS before 16 and older Android WebViews — where it would throw and take
 * the whole download down with it.
 */
const roundedRectPath = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  radius: number,
) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + size, y, x + size, y + size, radius);
  ctx.arcTo(x + size, y + size, x, y + size, radius);
  ctx.arcTo(x, y + size, x, y, radius);
  ctx.arcTo(x, y, x + size, y, radius);
  ctx.closePath();
};

/**
 * Renders the counter pass as a standalone PNG: order code on top, QR below,
 * matching the on-screen pass.
 *
 * The code is drawn into the image, not just encoded in the QR. A saved
 * screenshot can be shown on a cracked screen or at low brightness, and a
 * cashier can still type "INS-6290" when the camera won't read it — the same
 * reason the on-screen pass shows the code as text.
 */
export const buildOrderQrImage = async (code: string): Promise<Blob> => {
  const qrCanvas = document.createElement("canvas");
  // Raw code only, no JSON wrapper — the POS scanner passes decoded text
  // straight to its lookup, exactly as with the on-screen QR. The 2-module
  // margin plus the frame padding keep text and border out of the quiet zone
  // scanners need around the code.
  await QRCode.toCanvas(qrCanvas, code, {
    width: QR_SIZE,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#000000", light: "#ffffff" },
  });

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser can't create images");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  let y = PAD_Y;

  ctx.fillStyle = "#6b7280";
  ctx.font = `600 24px ${FONT_STACK}`;
  drawCentredLine(ctx, "ORDER CODE", y, LABEL_LINE);
  y += LABEL_LINE + LABEL_TO_CODE;

  // Shrinks to fit rather than overflow, in case codes ever grow longer.
  const maxTextWidth = WIDTH - PAD_Y * 2;
  let codeSize = 72;
  ctx.font = `700 ${codeSize}px ${FONT_STACK}`;
  while (ctx.measureText(code).width > maxTextWidth && codeSize > 32) {
    codeSize -= 4;
    ctx.font = `700 ${codeSize}px ${FONT_STACK}`;
  }
  ctx.fillStyle = "#000000";
  drawCentredLine(ctx, code, y, CODE_LINE);
  y += CODE_LINE + CODE_TO_FRAME;

  const frameX = (WIDTH - FRAME_SIZE) / 2;
  roundedRectPath(ctx, frameX, y, FRAME_SIZE, FRAME_RADIUS);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#e5e7eb";
  ctx.stroke();
  ctx.drawImage(
    qrCanvas,
    frameX + FRAME_PADDING,
    y + FRAME_PADDING,
    QR_SIZE,
    QR_SIZE,
  );
  y += FRAME_SIZE + FRAME_TO_FOOTER;

  ctx.fillStyle = "#6b7280";
  ctx.font = `500 24px ${FONT_STACK}`;
  drawCentredLine(ctx, "Show this to the cashier", y, FOOTER_LINE);

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Couldn't create the image")),
      "image/png",
    ),
  );
};

export type SaveOutcome = "shared" | "downloaded" | "cancelled";

/**
 * Gets the image onto the customer's device the way their device expects.
 *
 * On phones the share sheet is used, because it offers "Save Image" straight
 * into the photo gallery. A plain download link there is unreliable: iOS
 * Safari opens a data/blob link in a new tab instead of saving it, and the
 * file lands in a Downloads folder most people never open — not where they'll
 * look for it at the till. Desktop browsers get an ordinary file download,
 * since a share sheet is an odd way to save a file on a computer.
 */
export const saveOrderQr = async (code: string): Promise<SaveOutcome> => {
  const blob = await buildOrderQrImage(code);
  const filename = `${code}.png`;
  const file = new File([blob], filename, { type: "image/png" });

  const isTouchDevice = window.matchMedia?.("(pointer: coarse)").matches;

  if (isTouchDevice && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: `Order ${code}` });
      return "shared";
    } catch (error) {
      // Closing the share sheet is a choice, not a failure.
      if (error instanceof Error && error.name === "AbortError") {
        return "cancelled";
      }
      // Anything else (share blocked by policy, etc.) — fall through to a
      // regular download rather than leave the customer with nothing.
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoked on a delay: some browsers read the URL asynchronously after the
  // click, and revoking immediately cancels the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  return "downloaded";
};
