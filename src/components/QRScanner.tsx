import React, { useEffect, useRef, useState } from 'react';
import { Camera, AlertCircle } from 'lucide-react';

interface QRScannerProps {
  onScan: (data: string) => void;
}

// Note: In a real implementation, you would use a library like react-qr-reader
// For this demo, we'll simulate scanning by generating random customer names
export const QRScanner: React.FC<QRScannerProps> = ({ onScan }) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Simulate camera initialization
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timeout);
  }, []);

  // Simulate scanning a QR code after the component mounts
  const simulateScan = () => {
    // Generate a random customer name from this list
    const customerNames = [
      'John Smith',
      'Emily Johnson',
      'Michael Williams',
      'Sarah Brown',
      'David Jones',
      'Lisa Garcia',
      'Robert Miller',
      'Jennifer Davis'
    ];
    
    // Select a random customer name
    const randomCustomer = customerNames[Math.floor(Math.random() * customerNames.length)];
    
    // Call the onScan callback with the simulated data
    onScan(randomCustomer);
  };

  return (
    <div className="flex flex-col items-center">
      <h3 className="text-lg font-medium mb-3 text-gray-800">QR Code Scanner</h3>
      
      <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
            <p className="text-red-600">{error}</p>
          </div>
        ) : (
          <>
            <video 
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              muted
              playsInline
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="border-2 border-blue-500 w-3/4 h-3/4 opacity-70"></div>
            </div>
          </>
        )}
      </div>
      
      <div className="flex justify-center w-full">
        <button
          onClick={simulateScan}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Camera className="h-4 w-4" />
          Simulate Scan
        </button>
      </div>
      
      <p className="text-sm text-gray-500 mt-4 text-center">
        Position the QR code within the frame to scan. Make sure the code is well-lit and clearly visible.
      </p>
    </div>
  );
};