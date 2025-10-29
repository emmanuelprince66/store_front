import { Html5Qrcode } from "html5-qrcode";
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
        // Check camera permission first
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        stream.getTracks().forEach((track) => track.stop());

        if (!isMountedRef.current) return;

        // Create scanner instance
        const html5QrCode = new Html5Qrcode(qrcodeRegionId, {
          formatsToSupport: [
            0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
          ],
          verbose: verbose,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true,
          },
        });

        scannerRef.current = html5QrCode;

        const config = {
          fps,
          qrbox: { width: qrbox, height: qrbox },
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

        // Get cameras and start scanning
        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length > 0) {
          // Prefer back camera
          const backCamera = cameras.find((device) =>
            device.label.toLowerCase().includes("back")
          );
          const cameraId = backCamera?.id || cameras[0].id;

          if (!isMountedRef.current) return;

          await html5QrCode.start(cameraId, config, onScanSuccess, onScanError);

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

          // Apply custom styles after successful start
          setTimeout(() => {
            if (!isMountedRef.current) return;

            const scannerElement = document.getElementById(qrcodeRegionId);
            if (scannerElement) {
              // Style buttons
              const buttons = scannerElement.querySelectorAll("button");
              buttons.forEach((button) => {
                button.style.cssText = `
                  background: linear-gradient(to right, #10b981, #059669) !important;
                  color: white !important;
                  border: none !important;
                  padding: 12px 24px !important;
                  border-radius: 8px !important;
                  font-weight: 600 !important;
                  cursor: pointer !important;
                  transition: all 0.3s ease !important;
                  margin: 8px !important;
                `;

                button.onmouseover = () => {
                  button.style.transform = "scale(1.05)";
                  button.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.4)";
                };

                button.onmouseout = () => {
                  button.style.transform = "scale(1)";
                  button.style.boxShadow = "none";
                };
              });

              // Style select elements
              const selects = scannerElement.querySelectorAll("select");
              selects.forEach((select) => {
                select.style.cssText = `
                  padding: 10px 16px !important;
                  border: 2px solid #d1d5db !important;
                  border-radius: 8px !important;
                  font-size: 14px !important;
                  background-color: white !important;
                  cursor: pointer !important;
                  margin: 8px !important;
                  width: auto !important;
                  min-width: 200px !important;
                `;
              });
            }
          }, 100);
        }
      } catch (err: any) {
        console.error("Scanner initialization error:", err);
        const errorMsg =
          err.name === "NotAllowedError"
            ? "Camera permission denied"
            : err?.message || "Failed to initialize scanner";

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
            const state = await scannerRef.current.getState();
            console.log("Scanner state:", state);

            if (state === 2) {
              // SCANNING
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

    const handlePauseResume = async () => {
      try {
        const state = await scannerRef.current!.getState();

        if (isPaused && state === 2) {
          // Pause scanning by not processing results
          console.log("Scanner paused");
        } else if (!isPaused && state === 2) {
          console.log("Scanner resumed");
        }
      } catch (err) {
        console.warn("Error handling pause/resume:", err);
      }
    };

    handlePauseResume();
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
