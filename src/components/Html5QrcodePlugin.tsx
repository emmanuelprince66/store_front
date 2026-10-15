import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
  Html5QrcodeScannerState,
} from "html5-qrcode";
import { useEffect, useRef, useState } from "react";

interface Html5QrcodePluginProps {
  fps?: number;
  qrbox?: number;
  aspectRatio?: number;
  disableFlip?: boolean;
  qrCodeSuccessCallback: (decodedText: string, decodedResult: any) => void;
  qrCodeErrorCallback?: (error: string) => void;
  verbose?: boolean;
  onCameraReady?: () => void;
  isPaused?: boolean;
}

const Html5QrcodePlugin = ({
  fps = 10,
  qrbox = 250,
  aspectRatio = 1.0,
  disableFlip = false,
  qrCodeSuccessCallback,
  qrCodeErrorCallback,
  verbose = false,
  onCameraReady,
  isPaused = false,
}: Html5QrcodePluginProps) => {
  const qrcodeRegionId = "html5qr-code-full-region";
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isMountedRef = useRef(true);
  const isInitializingRef = useRef(false);
  const lastScanTimeRef = useRef<number>(0);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    isMountedRef.current = true;

    if (!qrCodeSuccessCallback) {
      throw new Error("qrCodeSuccessCallback is required callback.");
    }

    const initScanner = async () => {
      // Prevent multiple initializations
      if (isInitializingRef.current) {
        console.log("Already initializing, skipping...");
        return;
      }

      isInitializingRef.current = true;

      try {
        // getCameras() requests permission when needed; opening a temporary
        // stream here first made iPhones initialize the camera twice.
        const html5QrCode = new Html5Qrcode(qrcodeRegionId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODABAR,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.CODE_93,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.DATA_MATRIX,
            Html5QrcodeSupportedFormats.ITF,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
          ],
          verbose: verbose,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true,
          },
        });

        scannerRef.current = html5QrCode;

        const config = {
          fps,
          // Wide, short box sized to the actual video: fewer pixels for the
          // decoder per frame (matters on iPhone, which decodes in JS), and
          // never larger than the stream, which would make the library fall
          // back to decoding the whole frame.
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const width = Math.max(
              50,
              Math.floor(Math.min(viewfinderWidth * 0.85, qrbox)),
            );
            const height = Math.max(
              50,
              Math.floor(Math.min(viewfinderHeight * 0.6, width * 0.6)),
            );
            return { width, height };
          },
          aspectRatio,
          disableFlip,
        };

        const onScanSuccess = (decodedText: string, decodedResult: any) => {
          // Prevent rapid successive scans (debounce)
          const now = Date.now();
          if (now - lastScanTimeRef.current < 1500) {
            console.log("Scan too soon, ignoring");
            return;
          }

          lastScanTimeRef.current = now;
          console.log("Scanned:", decodedText);

          if (isMountedRef.current) {
            qrCodeSuccessCallback(decodedText, decodedResult);
          }
        };

        const onScanError = (errorMessage: string) => {
          // Silently ignore common scanning errors
          if (
            !errorMessage.includes("NotFoundException") &&
            !errorMessage.includes("No MultiFormat Readers") &&
            !errorMessage.includes("No barcode or QR code detected")
          ) {
            if (qrCodeErrorCallback && isMountedRef.current) {
              qrCodeErrorCallback(errorMessage);
            }
          }
        };

        // Ask for the rear camera directly instead of getCameras() + label
        // matching: getCameras() opens the camera once just to read labels
        // (slow on iPhone), and on Pro iPhones the first "back" label can be
        // the ultra-wide lens, which can't focus up close on a barcode.
        if (!isMountedRef.current) return;

        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          onScanSuccess,
          onScanError,
        );

        if (!isMountedRef.current) {
          // If unmounted during start, stop immediately
          await html5QrCode.stop();
          await html5QrCode.clear();
          return;
        }

        // Notify parent that camera is ready
        if (onCameraReady) {
          onCameraReady();
        }
      } catch (err: any) {
        console.error("Scanner initialization error:", err);
        // start() rejects with plain strings, e.g. "Error getting userMedia,
        // error = NotAllowedError: ..."
        const rawMsg = typeof err === "string" ? err : err?.message || "";
        const errorMsg =
          err?.name === "NotAllowedError" || rawMsg.includes("NotAllowedError")
            ? "Camera permission denied"
            : rawMsg || "Failed to initialize scanner";

        if (isMountedRef.current) {
          setError(errorMsg);
          if (qrCodeErrorCallback) {
            qrCodeErrorCallback(errorMsg);
          }
        }
      } finally {
        isInitializingRef.current = false;
      }
    };

    initScanner();

    // Comprehensive cleanup
    return () => {
      console.log("Component unmounting, starting cleanup...");
      isMountedRef.current = false;

      const cleanup = async () => {
        // Stop and clear scanner
        if (scannerRef.current) {
          try {
            const state = scannerRef.current.getState();
            console.log("Scanner state:", state);

            // PAUSED too: the modal can close while a barcode lookup has
            // the scanner paused, and clear() throws unless stop() ran.
            if (
              state === Html5QrcodeScannerState.SCANNING ||
              state === Html5QrcodeScannerState.PAUSED
            ) {
              console.log("Stopping scanner...");
              await scannerRef.current.stop();
              console.log("Scanner stopped");
            }

            await scannerRef.current.clear();
            console.log("Scanner cleared");
          } catch (err) {
            console.warn("Error during scanner cleanup:", err);
          }

          scannerRef.current = null;
        }

        // Force stop all video tracks
        const videoElements = document.querySelectorAll("video");
        console.log("Found video elements:", videoElements.length);

        videoElements.forEach((video, index) => {
          if (video.srcObject) {
            const stream = video.srcObject as MediaStream;
            const tracks = stream.getTracks();
            console.log(`Stopping ${tracks.length} tracks on video ${index}`);

            tracks.forEach((track) => {
              console.log(`Stopping track: ${track.kind} - ${track.id}`);
              track.stop();
            });

            video.srcObject = null;
          }
          video.pause();
          video.removeAttribute("src");
          video.load();
        });

        // Clear DOM
        const element = document.getElementById(qrcodeRegionId);
        if (element) {
          element.innerHTML = "";
        }

        console.log("Cleanup completed");
      };

      cleanup();
    };
  }, []); // Empty deps - only initialize once

  // Handle pause/resume based on isPaused prop
  useEffect(() => {
    if (!scannerRef.current) return;

    const state = scannerRef.current.getState();
    if (isPaused && state === Html5QrcodeScannerState.SCANNING) {
      scannerRef.current.pause(true);
    } else if (!isPaused && state === Html5QrcodeScannerState.PAUSED) {
      scannerRef.current.resume();
    }
  }, [isPaused]);

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700 text-center font-medium">{error}</p>
        <p className="text-red-600 text-center text-sm mt-2">
          Please check camera permissions and try again
        </p>
      </div>
    );
  }

  return (
    <div className="w-full relative">
      <div id={qrcodeRegionId} className="w-full" />
    </div>
  );
};

export default Html5QrcodePlugin;
