import React, { useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';

// This is the updated component
const WebcamScanner = ({ onScanSuccess, onScanFailure }) => {
  const scannerRegionId = "qr-scanner-region";
  // Use a ref to hold the scanner instance
  const html5QrcodeScannerRef = useRef(null);

  useEffect(() => {
    // 1. Create a new scanner instance and store it in the ref
    html5QrcodeScannerRef.current = new Html5Qrcode(scannerRegionId);
    const html5QrcodeScanner = html5QrcodeScannerRef.current;

    // 2. Configuration with a fixed qrbox size to prevent the error
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 }, // Fixed size
      rememberLastUsedCamera: true,
    };

    // 3. Start the scanner
    html5QrcodeScanner.start(
      { facingMode: "environment" },
      config,
      onScanSuccess,
      onScanFailure
    ).catch(err => {
      console.error("Failed to start scanner", err);
      if (onScanFailure) {
        onScanFailure(`Failed to start scanner: ${err.message}`);
      }
    });

    // 4. Cleanup function to safely stop the scanner
    return () => {
      const scanner = html5QrcodeScannerRef.current;
      if (scanner && scanner.getState() === Html5QrcodeScannerState.SCANNING) {
        scanner.stop().catch(err => {
          console.error("Failed to stop scanner", err);
        });
      }
    };
  }, [onScanSuccess, onScanFailure]);

  return (
    <div id={scannerRegionId} style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}>
      {/* The scanner will mount here */}
    </div>
  );
};

export default WebcamScanner;