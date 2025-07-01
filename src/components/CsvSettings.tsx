import React, { useState, useEffect } from 'react';
import { Upload, FileText, Map, Save, AlertCircle, CheckCircle, Image, Hash, RefreshCw, Package, Trash2, Download } from 'lucide-react';
import { CsvColumnMapping, CsvField, defaultCsvColumnMapping, SkuImageCsvInfo } from '../types/Csv';
import { getCsvHeaders } from '../utils/csvUtils';

interface CsvSettingsProps {
  onCsvUpload: (file: File, mappings: CsvColumnMapping) => void;
  onSaveMappings: (mappings: CsvColumnMapping) => void;
  savedMappings: CsvColumnMapping;
  // SKU-Image CSV props
  skuImageCsvInfo?: SkuImageCsvInfo | null;
  onSkuImageCsvUpload?: (file: File) => Promise<SkuImageCsvInfo>;
  onClearSkuImageCsv?: () => void;
}

export const CsvSettings: React.FC<CsvSettingsProps> = ({
  onCsvUpload,
  onSaveMappings,
  savedMappings,
  skuImageCsvInfo,
  onSkuImageCsvUpload,
  onClearSkuImageCsv,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [currentMappings, setCurrentMappings] = useState<CsvColumnMapping>(savedMappings);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // SKU-Image CSV state
  const [selectedSkuImageFile, setSelectedSkuImageFile] = useState<File | null>(null);
  const [isProcessingSkuImage, setIsProcessingSkuImage] = useState(false);
  const [skuImageMessage, setSkuImageMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const mappableFields: { key: CsvField; label: string; required: boolean; icon?: React.ReactNode; description?: string }[] = [
    { key: 'orderNumber', label: 'Order Number/ID', required: true, icon: <Hash className="h-4 w-4" />, description: 'Unique identifier for the order (e.g., "number" column)' },
    { key: 'customerFirstName', label: 'Customer First Name', required: true, description: 'Customer\'s first name (try billing_address_first_name or shipping_address_first_name)' },
    { key: 'customerLastName', label: 'Customer Last Name', required: true, description: 'Customer\'s last name (try billing_address_last_name or shipping_address_last_name)' },
    { key: 'sku', label: 'SKU', required: true, description: 'Product SKU or item code' },
    { key: 'quantity', label: 'Quantity', required: true, description: 'Number of items ordered' },
    { key: 'location', label: 'Location', required: false, description: 'Warehouse location or bin (optional - will use "bin_location" if available)' },
    { key: 'buyerPostcode', label: 'Buyer Postcode', required: false, description: 'Customer\'s postcode for QR matching (try billing_address_zip or shipping_address_zip)' },
    { key: 'imageUrl', label: 'Image URL', required: false, icon: <Image className="h-4 w-4" />, description: 'URL to product image (optional - fallback available)' },
    { key: 'remainingStock', label: 'Remaining Stock', required: false, icon: <Package className="h-4 w-4" />, description: 'Current stock level for the item (optional)' },
  ];

  // Initialize with saved mappings
  useEffect(() => {
    console.log('🔄 Loading saved CSV mappings:', savedMappings);
    setCurrentMappings(savedMappings);
  }, [savedMappings]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setMessage(null);
      try {
        const headers = await getCsvHeaders(file);
        setCsvHeaders(headers);
        console.log('📋 CSV headers loaded:', headers);
        
        setMessage({ type: 'success', text: `CSV headers loaded! Found ${headers.length} columns. Please verify your column mappings below.` });
      } catch (error) {
        console.error('Error reading CSV headers:', error);
        setMessage({ type: 'error', text: 'Failed to read CSV headers. Please ensure it is a valid CSV file.' });
        setCsvHeaders([]);
      }
    }
  };

  const handleSkuImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedSkuImageFile(file);
      setSkuImageMessage(null);
    }
  };

  const handleSkuImageUpload = async () => {
    if (!selectedSkuImageFile || !onSkuImageCsvUpload) {
      setSkuImageMessage({ type: 'error', text: 'Please select a SKU-Image CSV file first.' });
      return;
    }

    setIsProcessingSkuImage(true);
    setSkuImageMessage(null);
    
    try {
      console.log('🖼️ Uploading SKU-Image CSV:', selectedSkuImageFile.name);
      
      const csvInfo = await onSkuImageCsvUpload(selectedSkuImageFile);
      setSkuImageMessage({ 
        type: 'success', 
        text: `Successfully uploaded ${csvInfo.skuCount} SKU-Image mappings from ${csvInfo.fileName}!` 
      });
      setSelectedSkuImageFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('sku-image-file-input') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      
    } catch (error) {
      console.error('Error uploading SKU-Image CSV:', error);
      setSkuImageMessage({ 
        type: 'error', 
        text: `Failed to process SKU-Image CSV: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    } finally {
      setIsProcessingSkuImage(false);
    }
  };

  const handleClearSkuImageCsv = () => {
    if (confirm('Are you sure you want to clear the SKU-Image CSV data? This will remove all image URL fallbacks.')) {
      if (onClearSkuImageCsv) {
        onClearSkuImageCsv();
        setSkuImageMessage({ type: 'success', text: 'SKU-Image CSV data cleared successfully.' });
      }
    }
  };

  const handleAutoMap = () => {
    console.log('🔄 Attempting auto-mapping...');
    
    const newMappings: CsvColumnMapping = { ...currentMappings };
    let mappedCount = 0;
    
    mappableFields.forEach(field => {
      // Try to find a matching header for this field
      let matchedHeader = '';
      
      // Define possible header variations for each field
      const headerVariations: { [key: string]: string[] } = {
        orderNumber: ['number', 'order number', 'order id', 'order_number', 'order_id', 'ordernumber', 'orderid', 'order no', 'order #'],
        customerFirstName: [
          'billing_address_first_name', 'shipping_address_first_name',
          'first name', 'firstname', 'first_name', 'customer first name', 'customer_first_name', 'fname', 'given name'
        ],
        customerLastName: [
          'billing_address_last_name', 'shipping_address_last_name',
          'last name', 'lastname', 'last_name', 'customer last name', 'customer_last_name', 'lname', 'surname', 'family name'
        ],
        sku: ['sku', 'product code', 'item code', 'product_code', 'item_code', 'productcode', 'itemcode', 'part number'],
        quantity: ['quantity', 'qty', 'amount', 'count', 'number', 'units'],
        location: ['bin_location', 'location', 'warehouse location', 'bin', 'shelf', 'position', 'warehouse_location', 'bin_location'],
        buyerPostcode: [
          'billing_address_zip', 'shipping_address_zip',
          'postcode', 'postal code', 'zip code', 'buyer postcode', 'customer postcode', 'postal_code', 'zip_code', 'buyer_postcode', 'customer_postcode'
        ],
        imageUrl: ['image url', 'image_url', 'imageurl', 'photo url', 'picture url', 'image', 'photo', 'picture'],
        remainingStock: ['remaining stock', 'remaining_stock', 'stock', 'stock level', 'stock_level', 'inventory', 'available', 'on hand', 'on_hand']
      };
      
      const variations = headerVariations[field.key] || [field.key];
      
      // Try to find exact or partial matches
      for (const variation of variations) {
        const matchedHeaderExact = csvHeaders.find(h => h.toLowerCase().trim() === variation.toLowerCase());
        if (matchedHeaderExact) {
          matchedHeader = matchedHeaderExact;
          break;
        }
        
        // Try partial match
        const matchedHeaderPartial = csvHeaders.find(h => {
          const headerLower = h.toLowerCase().trim();
          const variationLower = variation.toLowerCase();
          return headerLower.includes(variationLower) || variationLower.includes(headerLower);
        });
        
        if (matchedHeaderPartial) {
          matchedHeader = matchedHeaderPartial;
          break;
        }
      }
      
      if (matchedHeader) {
        newMappings[field.key] = matchedHeader;
        mappedCount++;
        console.log(`✅ Auto-mapped ${field.key} to "${matchedHeader}"`);
      } else {
        console.log(`❌ Could not auto-map ${field.key}`);
      }
    });
    
    setCurrentMappings(newMappings);
    setMessage({ 
      type: mappedCount > 0 ? 'success' : 'error', 
      text: `Auto-mapping completed! Mapped ${mappedCount} out of ${mappableFields.length} fields. Please verify and adjust as needed.` 
    });
  };

  const handleMappingChange = (field: CsvField, header: string) => {
    console.log(`🔄 Mapping changed: ${field} -> "${header}"`);
    setCurrentMappings(prev => ({ ...prev, [field]: header }));
  };

  const handleSaveMappings = () => {
    console.log('💾 Saving CSV mappings:', currentMappings);
    onSaveMappings(currentMappings);
    setMessage({ type: 'success', text: 'Column mappings saved successfully! These will be used for future CSV uploads.' });
  };

  const handleUploadCsv = async () => {
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Please select a CSV file first.' });
      return;
    }

    // Validate required mappings
    const missingMappings = mappableFields.filter(field => field.required && (!currentMappings[field.key] || currentMappings[field.key].trim() === ''));
    if (missingMappings.length > 0) {
      setMessage({ type: 'error', text: `Please map all required fields: ${missingMappings.map(m => m.label).join(', ')}` });
      return;
    }

    setIsProcessing(true);
    setMessage(null);
    try {
      console.log('🚀 Uploading CSV with mappings:', currentMappings);
      
      // Save mappings before upload to ensure they persist
      onSaveMappings(currentMappings);
      
      await onCsvUpload(selectedFile, currentMappings);
      setMessage({ type: 'success', text: 'CSV file uploaded and orders processed successfully!' });
      
    } catch (error) {
      console.error('Error uploading CSV:', error);
      setMessage({ type: 'error', text: `Failed to process CSV: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetMappings = () => {
    console.log('🔄 Resetting mappings to default');
    setCurrentMappings(defaultCsvColumnMapping);
    setMessage({ type: 'success', text: 'Mappings reset to default values.' });
  };

  const getValidationStatus = (field: { key: CsvField; required: boolean }) => {
    const isMapped = currentMappings[field.key] && currentMappings[field.key].trim() !== '';
    const isValid = !field.required || isMapped;
    
    return {
      isMapped,
      isValid,
      className: field.required && !isMapped ? 'border-red-300 bg-red-50' : isMapped ? 'border-green-300 bg-green-50' : 'border-gray-300'
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          CSV File Upload
        </h3>
        <p className="text-gray-600 mb-4">
          Upload order data from a CSV file. The system will automatically handle missing billing address names by using shipping address names as fallback.
        </p>
      </div>

      {/* SKU-Image CSV Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="text-md font-semibold text-blue-800 mb-4 flex items-center gap-2">
          <Image className="h-5 w-5" />
          SKU-Image CSV (Image URL Fallback)
        </h4>
        
        <p className="text-blue-700 mb-4 text-sm">
          Upload a separate CSV file with SKU-to-image URL mappings. This will be used as a fallback when the main order CSV doesn't have image URLs.
          <br />
          <strong>Expected format:</strong> First column = SKU, Second column = Image URL
        </p>

        {/* Current SKU-Image CSV Info */}
        {skuImageCsvInfo && (
          <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-blue-800">Current SKU-Image CSV:</p>
                <p className="text-sm text-blue-700">{skuImageCsvInfo.fileName}</p>
                <p className="text-xs text-blue-600">
                  {skuImageCsvInfo.skuCount} SKU mappings • Uploaded {formatDate(skuImageCsvInfo.uploadedAt)}
                </p>
              </div>
              <button
                onClick={handleClearSkuImageCsv}
                className="flex items-center gap-2 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                title="Clear SKU-Image CSV data"
              >
                <Trash2 className="h-3 w-3" />
                Clear
              </button>
            </div>
          </div>
        )}

        {/* SKU-Image CSV Upload */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              id="sku-image-file-input"
              type="file"
              accept=".csv"
              onChange={handleSkuImageFileChange}
              className="hidden"
            />
            <label
              htmlFor="sku-image-file-input"
              className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
            >
              <Upload className="h-4 w-4" />
              {selectedSkuImageFile ? selectedSkuImageFile.name : 'Choose SKU-Image CSV'}
            </label>
            
            {selectedSkuImageFile && (
              <button
                onClick={handleSkuImageUpload}
                disabled={isProcessingSkuImage}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isProcessingSkuImage ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Upload & Save
                  </>
                )}
              </button>
            )}
          </div>

          {/* SKU-Image Messages */}
          {skuImageMessage && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              skuImageMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {skuImageMessage.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              <span className="text-sm">{skuImageMessage.text}</span>
            </div>
          )}

          {/* Example Format */}
          <div className="bg-white border border-blue-200 rounded p-3">
            <p className="text-xs font-medium text-blue-800 mb-2">Example SKU-Image CSV format:</p>
            <div className="bg-gray-50 rounded border p-2 text-xs font-mono">
              <div className="text-gray-600">SKU,Image URL</div>
              <div className="text-gray-800">ABC-123,https://example.com/images/abc-123.jpg</div>
              <div className="text-gray-800">XYZ-456,https://example.com/images/xyz-456.png</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main CSV Upload Section */}
      <div>
        <h4 className="text-md font-semibold text-gray-800 mb-4">Main Order CSV Upload</h4>
        
        {/* File Selection */}
        <div className="border border-gray-300 rounded-lg p-4 flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-gray-500" />
            <div>
              <p className="font-medium text-gray-700">
                {selectedFile ? selectedFile.name : 'No CSV file selected'}
              </p>
              {selectedFile && (
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / 1024).toFixed(2)} KB • {csvHeaders.length} columns detected
                </p>
              )}
            </div>
          </div>
          <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Browse CSV
            <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
          </label>
        </div>

        {/* CSV Headers Display */}
        {csvHeaders.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Detected CSV Columns ({csvHeaders.length}):</h4>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {csvHeaders.map((header, index) => (
                <span key={index} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                  {header}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Column Mapping */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-semibold text-gray-800 flex items-center gap-2">
              <Map className="h-5 w-5" />
              Column Mapping
            </h4>
            <div className="flex gap-2">
              {csvHeaders.length > 0 && (
                <button
                  onClick={handleAutoMap}
                  className="px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center gap-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  Auto-Map
                </button>
              )}
              <button
                onClick={handleResetMappings}
                className="px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                Reset
              </button>
              <button
                onClick={handleSaveMappings}
                className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
              >
                <Save className="h-3 w-3" />
                Save
              </button>
            </div>
          </div>
          
          <p className="text-gray-600 text-sm">
            Map your CSV columns to the required order fields. The system will automatically use shipping address names if billing address names are missing.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mappableFields.map(field => {
              const validation = getValidationStatus(field);
              
              return (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    {field.icon}
                    {field.label}
                    {field.required && <span className="text-red-500">*</span>}
                    {!field.required && <span className="text-gray-400 text-xs">(optional)</span>}
                  </label>
                  {field.description && (
                    <p className="text-xs text-gray-500 mb-2">{field.description}</p>
                  )}
                  <select
                    value={currentMappings[field.key] || ''}
                    onChange={(e) => handleMappingChange(field.key, e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${validation.className}`}
                  >
                    <option value="">-- Select Column --</option>
                    {csvHeaders.map(header => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                  {validation.isMapped && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Mapped to: {currentMappings[field.key]}
                    </p>
                  )}
                  {field.required && !validation.isMapped && (
                    <p className="text-xs text-red-600 mt-1">
                      ⚠️ This field is required
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={handleUploadCsv}
            disabled={!selectedFile || isProcessing}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processing...
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" />
                Upload & Process CSV
              </>
            )}
          </button>
        </div>

        {/* Messages */}
        {message && (
          <div className={`flex items-center gap-2 p-3 rounded-lg mt-4 ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            <span className="text-sm">{message.text}</span>
          </div>
        )}
      </div>

      {/* Current Mappings Display */}
      {Object.values(currentMappings).some(value => value && value.trim() !== '') && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Current Mappings:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {mappableFields.map(field => (
              currentMappings[field.key] && (
                <div key={field.key} className="flex justify-between">
                  <span className="text-blue-700">{field.label}:</span>
                  <span className="font-medium text-blue-800">"{currentMappings[field.key]}"</span>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {/* Smart Features Notice */}
      <div className="bg-green-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-green-800 mb-2">Smart Features:</h4>
        <div className="text-xs text-green-700 space-y-1">
          <p>✅ <strong>Image URL Fallback:</strong> If main CSV lacks image URLs, SKU-Image CSV will be used automatically</p>
          <p>✅ <strong>Customer Name Fallback:</strong> If billing address names are missing, shipping address names will be used</p>
          <p>✅ <strong>Flexible mapping:</strong> You can map to either billing_address_first_name or shipping_address_first_name</p>
          <p>✅ <strong>Order preservation:</strong> Orders are processed in the same order as your CSV file</p>
          <p>✅ <strong>Smart grouping:</strong> Orders with the same order number and customer name are grouped together</p>
          <p>✅ <strong>Stock tracking:</strong> Map remaining stock column to track inventory levels</p>
        </div>
      </div>

      {/* Example CSV Format */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-800 mb-2">Your CSV Format (based on uploaded file):</h4>
        <div className="bg-white rounded border p-3 text-xs font-mono overflow-x-auto">
          <div className="text-gray-600 whitespace-nowrap">number,billing_address_first_name,billing_address_last_name,sku,quantity,bin_location,billing_address_zip,remaining_stock</div>
          <div className="text-gray-800 whitespace-nowrap">15-13169-30112,Abjol,Miah,MBMB-5092,2,SM1,NE8 2BG,15</div>
          <div className="text-gray-800 whitespace-nowrap">26-13195-58725,Linda,Elliott,506,1,SM1,NG21 9RA,8</div>
        </div>
        <div className="mt-3 space-y-1 text-xs text-gray-600">
          <p><strong>Auto-mapping suggestions:</strong></p>
          <p>• Order Number → "number"</p>
          <p>• Customer First Name → "billing_address_first_name" (fallback: "shipping_address_first_name")</p>
          <p>• Customer Last Name → "billing_address_last_name" (fallback: "shipping_address_last_name")</p>
          <p>• SKU → "sku"</p>
          <p>• Quantity → "quantity"</p>
          <p>• Location → "bin_location"</p>
          <p>• Buyer Postcode → "billing_address_zip" (fallback: "shipping_address_zip")</p>
          <p>• Image URL → "image_url" (fallback: SKU-Image CSV)</p>
          <p>• Remaining Stock → "remaining_stock" (optional)</p>
        </div>
      </div>
    </div>
  );
};