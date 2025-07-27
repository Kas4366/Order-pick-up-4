import React, { useEffect, useState } from 'react';
import { Search, QrCode, ArrowUp, ArrowDown, Scan } from 'lucide-react';

interface CustomerSearchProps {
  onCustomerSearch: (customerName: string) => void;
  onQRCodeScan?: (qrData: string) => void;
  onArrowNavigation?: (direction: 'up' | 'down') => void;
  searchMessage?: string;
  onClearMessage?: () => void;
}

export const CustomerSearch: React.FC<CustomerSearchProps> = ({ 
  onCustomerSearch, 
  onQRCodeScan,
  onArrowNavigation,
  searchMessage,
  onClearMessage
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [searchMode, setSearchMode] = useState<'manual' | 'scanner' | 'arrows'>('manual');
  const [lastScannedPostcode, setLastScannedPostcode] = useState('');

  // Listen for barcode scanner input and arrow key navigation
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyPress = (e: KeyboardEvent) => {
      const currentTime = Date.now();
      
      // Handle arrow key navigation when in arrow mode
      if (searchMode === 'arrows') {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
          if (onArrowNavigation) {
            onArrowNavigation(e.key === 'ArrowUp' ? 'up' : 'down');
          }
          return;
        }
      }
      
      // If the delay between keystrokes is > 100ms, assume it's manual typing
      if (currentTime - lastKeyTime > 100) {
        buffer = '';
      }
      
      // Ignore if the input is focused (manual typing) or not in scanner mode
      if (document.activeElement?.tagName === 'INPUT' || 
          document.activeElement?.tagName === 'TEXTAREA' ||
          searchMode !== 'scanner') {
        return;
      }

      if (e.key === 'Enter') {
        if (buffer) {
          console.log('📱 Detected QR code scan:', buffer);
          
          // Extract postcode from QR data
          const extractedPostcode = extractPostcodeFromQRData(buffer);
          
          if (extractedPostcode) {
            console.log('📮 Extracted postcode from QR scan:', extractedPostcode);
            setSearchInput(extractedPostcode);
            setLastScannedPostcode(extractedPostcode);
            
            // Automatically search for orders with this postcode
            onCustomerSearch(extractedPostcode);
          } else {
            console.log('⚠️ No valid postcode found in QR data');
            // Still call the QR scan handler for backward compatibility
            if (onQRCodeScan) {
              onQRCodeScan(buffer);
            }
          }
          
          buffer = '';
        }
      } else {
        buffer += e.key;
      }
      
      lastKeyTime = currentTime;
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onCustomerSearch, onQRCodeScan, onArrowNavigation, searchMode]);

  // Extract postcodes from QR code data
  const extractPostcodeFromQRData = (qrData: string): string => {
    // UK postcode regex pattern
    const postcodeRegex = /\b([A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2})\b/g;
    const matches = qrData.match(postcodeRegex) || [];
    
    // Known sender postcodes to filter out
    const KNOWN_SENDER_POSTCODES = ['LU56RT', 'LU33RZ'];
    
    const validPostcodes = matches
      .map(match => match.replace(/\s/g, '').toUpperCase()) // Normalize postcodes
      .filter(postcode => 
        !KNOWN_SENDER_POSTCODES.some(sender => 
          postcode.startsWith(sender) || sender.startsWith(postcode.substring(0, 4))
        )
      );
    
    // Return the first valid postcode found
    return validPostcodes[0] || '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onCustomerSearch(searchInput.trim());
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    
    // Clear search message when user starts typing
    if (onClearMessage && searchMessage) {
      onClearMessage();
    }
    
    // Auto-detect QR code data and process immediately in scanner mode
    if (searchMode === 'scanner' && value.length > 20 && (value.includes('\n') || value.includes('JGB') || value.includes('GB'))) {
      const extractedPostcode = extractPostcodeFromQRData(value);
      
      if (extractedPostcode) {
        console.log('📮 Extracted postcode from manual input:', extractedPostcode);
        setSearchInput(extractedPostcode);
        setLastScannedPostcode(extractedPostcode);
        onCustomerSearch(extractedPostcode);
      } else if (onQRCodeScan) {
        onQRCodeScan(value);
      }
    }
  };

  const handleModeChange = (newMode: 'manual' | 'scanner' | 'arrows') => {
    setSearchMode(newMode);
    
    // Clear search input when switching modes, except when switching to scanner mode
    // and we have a last scanned postcode
    if (newMode === 'scanner' && lastScannedPostcode) {
      setSearchInput(lastScannedPostcode);
    } else if (newMode !== 'scanner') {
      setSearchInput('');
      setLastScannedPostcode('');
    }
  };

  return (
    <div className="space-y-3">
      {/* Search Mode Selection */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium text-gray-700">Search Mode:</span>
        <div className="flex rounded-lg border border-gray-300 overflow-hidden">
          <button
            type="button"
            onClick={() => handleModeChange('manual')}
            className={`px-3 py-1 text-sm font-medium transition-colors flex items-center gap-1 ${
              searchMode === 'manual'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Search className="h-3 w-3" />
            Manual
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('scanner')}
            className={`px-3 py-1 text-sm font-medium transition-colors flex items-center gap-1 border-l border-gray-300 ${
              searchMode === 'scanner'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <QrCode className="h-3 w-3" />
            Scanner
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('arrows')}
            className={`px-3 py-1 text-sm font-medium transition-colors flex items-center gap-1 border-l border-gray-300 ${
              searchMode === 'arrows'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <ArrowUp className="h-3 w-3" />
            <ArrowDown className="h-3 w-3" />
            Arrows
          </button>
        </div>
      </div>

      {/* Search Input */}
      <form onSubmit={handleSubmit} className="w-full">
        <div className="relative">
          <input
            type="text"
            value={searchInput}
            onChange={handleInputChange}
            placeholder={
              searchMode === 'manual' 
                ? "Search by customer name, order ID, or postcode..."
                : searchMode === 'scanner'
                ? lastScannedPostcode 
                  ? `${lastScannedPostcode} - Scan next label to replace...`
                  : "Scan QR code - postcode will appear here..."
                : "Use arrow keys to navigate orders..."
            }
            className="w-full px-4 py-2 pl-10 pr-12 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={searchMode === 'arrows'}
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          
          {searchMode === 'scanner' && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Scan className="h-5 w-5 text-blue-600" />
            </div>
          )}
          
          {searchMode === 'arrows' && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              <ArrowUp className="h-4 w-4 text-green-600" />
              <ArrowDown className="h-4 w-4 text-green-600" />
            </div>
          )}
        </div>
      </form>
      
      {/* Search Message */}
      {searchMessage && (
        <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-800">{searchMessage}</p>
        </div>
      )}
      
      {/* Simplified mode instructions */}
      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
        {searchMode === 'manual' && (
          <p>Type customer name, order ID, or postcode to search</p>
        )}
        
        {searchMode === 'scanner' && (
          <p>Scan shipping labels to extract buyer postcodes automatically</p>
        )}
        
        {searchMode === 'arrows' && (
          <p>Use ↑ and ↓ arrow keys to navigate through orders</p>
        )}
      </div>
    </div>
  );
};