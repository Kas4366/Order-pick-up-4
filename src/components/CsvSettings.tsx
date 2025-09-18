import React, { useState, useEffect } from 'react';
import { Upload, FileText, Map, Save, AlertCircle, CheckCircle, Image, Hash, RefreshCw, Package, Trash2, Download, DollarSign, Store, Truck } from 'lucide-react';
import { CsvColumnMapping, CsvField, defaultCsvColumnMapping, LocalImagesFolderInfo } from '../types/Csv';
import { getCsvHeaders } from '../utils/csvUtils';

interface CsvSettingsProps {
  onCsvUpload: (file: File, mappings: CsvColumnMapping) => void;
  onSaveMappings: (mappings: CsvColumnMapping) => void;
  savedMappings: CsvColumnMapping;
  // Local images folder props
  csvImagesFolderInfo?: LocalImagesFolderInfo | null;
  onSetCsvImagesFolder?: () => Promise<void>;
}

export const CsvSettings: React.FC<CsvSettingsProps> = ({
  onCsvUpload,
  onSaveMappings,
  savedMappings,
  csvImagesFolderInfo,
  onSetCsvImagesFolder,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [currentMappings, setCurrentMappings] = useState<CsvColumnMapping>(savedMappings);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Local images folder state
  const [folderMessage, setFolderMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
    { key: 'orderValue', label: 'Order Value', required: false, icon: <DollarSign className="h-4 w-4" />, description: 'Monetary value of the order item (optional)' },
    { key: 'channelType', label: 'Channel Type', required: false, icon: <Store className="h-4 w-4" />, description: 'Sales channel type (e.g., eBay, Amazon, Etsy, BigCommerce) (optional)' },
    { key: 'channel', label: 'Channel', required: false, icon: <Store className="h-4 w-4" />, description: 'Specific channel information' },
    { key: 'width', label: 'Width (cm)', required: false, icon: <Package className="h-4 w-4" />, description: 'Product width in centimeters (for packaging rules)' },
    { key: 'weight', label: 'Weight (g)', required: false, icon: <Package className="h-4 w-4" />, description: 'Product weight in grams (for packaging rules)' },
    { key: 'itemName', label: 'Item/Product Name', required: false, description: 'Product or item name/title (optional)' },
    { key: 'shipFromLocation', label: 'Ship From Location', required: false, icon: <Truck className="h-4 w-4" />, description: 'Location where the order ships from (for packaging and box rules)' },
    { key: 'packageDimension', label: 'Package Dimension', required: false, icon: <Package className="h-4 w-4" />, description: 'Package size/dimension information (e.g., Small, Medium, Large) for packaging rules' },
    { key: 'notes', label: 'Notes', required: false, description: 'Special notes or instructions for this order item (will display in blocking modal)' },
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

  const handleSelectImagesFolder = async () => {
    if (!onSetCsvImagesFolder) {
      setFolderMessage({ type: 'error', text: 'Folder selection not available.' });
      return;
    }

    try {
      await onSetCsvImagesFolder();
      setFolderMessage({ 
        type: 'success', 
        text: 'Images folder selected successfully!' 
      });
    } catch (error) {
      console.error('Error selecting images folder:', error);
      setFolderMessage({ 
        type: 'error', 
        text: `Failed to select images folder: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
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
        remainingStock: ['remaining stock', 'remaining_stock', 'stock', 'stock level', 'stock_level', 'inventory', 'available', 'on hand', 'on_hand'],
        orderValue: ['order value', 'order_value', 'value', 'price', 'amount', 'total', 'cost', 'item value', 'item_value', 'unit price', 'unit_price'],
        channelType: ['channel type', 'channel_type', 'sales channel', 'sales_channel', 'marketplace', 'platform', 'source'],
        channel: ['channel', 'sales channel name', 'channel name', 'marketplace name', 'platform name'],
        packagingType: ['packaging type', 'packaging_type', 'package type', 'package_type', 'packaging', 'package', 'shipping type', 'shipping_type'],
        itemName: ['product name', 'product_name', 'item name', 'item_name', 'title', 'product title', 'product_title', 'item title', 'item_title', 'description', 'product description'],
        notes: ['notes', 'note', 'special instructions', 'special_instructions', 'order notes', 'order_notes', 'comments', 'remarks', 'instructions']
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
          Upload order data from a CSV file. Images will be loaded from your selected local images folder using SKU as filename.
        </p>
      </div>

      {/* Local Images Folder Section */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h4 className="text-md font-semibold text-green-800 mb-4 flex items-center gap-2">
          <Image className="h-5 w-5" />
          Local Images Folder
        </h4>
        
        <p className="text-green-700 mb-4 text-sm">
          Select a local folder containing product images. Images should be named using the SKU (e.g., "ABC123.jpg", "XYZ456.png").
          <br />
          <strong>Supported formats:</strong> JPG, JPEG, PNG, GIF, WEBP, BMP, SVG
        </p>

        {/* Current Images Folder Info */}
        {csvImagesFolderInfo && (
          <div className="bg-green-100 border border-green-300 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-green-800">Selected Images Folder:</p>
                <p className="text-sm text-green-700">{csvImagesFolderInfo.folderName}</p>
                <p className="text-xs text-green-600">
                  Selected {formatDate(csvImagesFolderInfo.selectedAt)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Folder Selection */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={handleSelectImagesFolder}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Image className="h-4 w-4" />
            {csvImagesFolderInfo ? 'Change Images Folder' : 'Select Images Folder'}
          </button>
        </div>

        {/* Folder Messages */}
        {folderMessage && (
          <div className={`flex items-center gap-2 p-3 rounded-lg ${
            folderMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {folderMessage.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            <span className="text-sm">{folderMessage.text}</span>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-white border border-green-200 rounded p-3">
          <p className="text-xs font-medium text-green-800 mb-2">Image File Naming:</p>
          <div className="bg-gray-50 rounded border p-2 text-xs">
            <div className="text-gray-600 mb-1">Examples of valid image filenames:</div>
            <div className="text-gray-800">• ABC-123.jpg</div>
            <div className="text-gray-800">• XYZ456.png</div>
            <div className="text-gray-800">• product123.jpeg</div>
            <div className="text-gray-800">• ITEM-789.webp</div>
          </div>
          <p className="text-xs text-green-700 mt-2">
            The app will look for images named exactly as the SKU with supported extensions (e.g., ABC-123.jpg, XYZ456.png).
          </p>
          
          {/* Persistence Info */}
          <div className="mt-3 pt-2 border-t border-green-200">
            <p className="text-xs font-medium text-green-800 mb-1">Smart Folder Access:</p>
            <p className="text-xs text-green-700">
              The app remembers your images folder and automatically restores access when possible. 
              Due to browser security, you may occasionally need to re-grant permission with a single click.
            </p>
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
          <p>✅ <strong>Local Image Loading:</strong> Images are loaded from your selected local folder using SKU as filename</p>
          <p>✅ <strong>Customer Name Fallback:</strong> If billing address names are missing, shipping address names will be used</p>
          <p>✅ <strong>Flexible mapping:</strong> You can map to either billing_address_first_name or shipping_address_first_name</p>
          <p>✅ <strong>Order preservation:</strong> Orders are processed in the same order as your CSV file</p>
          <p>✅ <strong>Smart grouping:</strong> Orders with the same order number and customer name are grouped together</p>
          <p>✅ <strong>Stock tracking:</strong> Map remaining stock column to track inventory levels</p>
          <p>✅ <strong>Order value tracking:</strong> Map order value column to display monetary amounts</p>
          <p>✅ <strong>File date tracking:</strong> File modification date is automatically recorded for each order</p>
          <p>✅ <strong>Channel tracking:</strong> Map channel type and channel columns to display sales platform information</p>
          <p>✅ <strong>Packaging tracking:</strong> Map packaging type column to display packaging requirements</p>
          <p>✅ <strong>Strict image matching:</strong> Images must be named exactly as the SKU with supported extensions</p>
        </div>
      </div>

      {/* Example CSV Format */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-800 mb-2">Your CSV Format (based on uploaded file):</h4>
        <div className="bg-white rounded border p-3 text-xs font-mono overflow-x-auto">
          <div className="text-gray-600 whitespace-nowrap">number,billing_address_first_name,billing_address_last_name,sku,quantity,bin_location,billing_address_zip,remaining_stock,order_value,channel_type,channel,packaging_type</div>
          <div className="text-gray-800 whitespace-nowrap">15-13169-30112,Abjol,Miah,MBMB-5092,2,SM1,NE8 2BG,15,24.99,eBay,eBay UK,Small Packet</div>
          <div className="text-gray-800 whitespace-nowrap">26-13195-58725,Linda,Elliott,506,1,SM1,NG21 9RA,8,12.50,Amazon,Amazon FBA,Large Letter</div>
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
          <p>• Image URL → "image_url" (fallback: Local images folder)</p>
          <p>• Remaining Stock → "remaining_stock" (optional)</p>
          <p>• Order Value → "order_value" (optional)</p>
          <p>• Channel Type → "channel_type" (optional)</p>
          <p>• Channel → "channel" (optional)</p>
          <p>• Width → "width" (optional)</p>
          <p>• Weight → "weight" (optional)</p>
          <p>• Item Name → "product_name" or "item_title" (optional)</p>
          <p>• Ship From Location → "ship_from_location" (optional)</p>
        </div>
      </div>
    </div>
  );
};