import { useState, useEffect } from 'react';
import { Order } from '../types/Order';
import { simulatePdfParsing } from '../utils/pdfUtils';
import { FileWithImages } from '../types/Settings';
import { selroApi } from '../services/selroApi';
import { veeqoApi } from '../services/veeqoApi';
import { CsvColumnMapping, defaultCsvColumnMapping } from '../types/Csv';
import { VoiceSettings, defaultVoiceSettings } from '../types/VoiceSettings';
import { StockTrackingItem } from '../types/StockTracking';
import { parseCsvFile } from '../utils/csvUtils';

export const useOrderData = () => {
  const [pdfUploaded, setPdfUploaded] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [selectedSelroFolderId, setSelectedSelroFolderId] = useState<string>('');
  const [selectedSelroFolderName, setSelectedSelroFolderName] = useState<string>('');
  const [selectedVeeqoStatus, setSelectedVeeqoStatus] = useState<string>('');
  const [selectedVeeqoWarehouseId, setSelectedVeeqoWarehouseId] = useState<number | undefined>(undefined);
  const [isUsingSelroApi, setIsUsingSelroApi] = useState(false);
  const [isUsingVeeqoApi, setIsUsingVeeqoApi] = useState(false);
  const [currentOrderIndex, setCurrentOrderIndex] = useState<number>(-1);
  const [csvColumnMappings, setCsvColumnMappings] = useState<CsvColumnMapping>(defaultCsvColumnMapping);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(defaultVoiceSettings);
  const [stockTrackingItems, setStockTrackingItems] = useState<StockTrackingItem[]>([]);

  // Load saved settings on component mount
  useEffect(() => {
    const savedSelroFolderId = localStorage.getItem('selectedSelroFolderId');
    const savedSelroFolderName = localStorage.getItem('selectedSelroFolderName');
    const savedVeeqoStatus = localStorage.getItem('selectedVeeqoStatus');
    const savedVeeqoWarehouseId = localStorage.getItem('selectedVeeqoWarehouseId');
    
    if (savedSelroFolderId && savedSelroFolderName) {
      setSelectedSelroFolderId(savedSelroFolderId);
      setSelectedSelroFolderName(savedSelroFolderName);
    }

    if (savedVeeqoStatus) {
      setSelectedVeeqoStatus(savedVeeqoStatus);
    }

    if (savedVeeqoWarehouseId && savedVeeqoWarehouseId !== 'undefined') {
      setSelectedVeeqoWarehouseId(parseInt(savedVeeqoWarehouseId, 10));
    }

    // Load saved CSV mappings
    const savedCsvMappings = localStorage.getItem('csvColumnMappings');
    if (savedCsvMappings) {
      try {
        const parsedMappings = JSON.parse(savedCsvMappings);
        console.log('📋 Loaded saved CSV mappings from localStorage:', parsedMappings);
        setCsvColumnMappings(parsedMappings);
      } catch (e) {
        console.error('Failed to parse saved CSV mappings, using default:', e);
        setCsvColumnMappings(defaultCsvColumnMapping);
      }
    } else {
      console.log('📋 No saved CSV mappings found, using default');
      setCsvColumnMappings(defaultCsvColumnMapping);
    }

    // Load saved voice settings
    const savedVoiceSettings = localStorage.getItem('voiceSettings');
    if (savedVoiceSettings) {
      try {
        const parsedVoiceSettings = JSON.parse(savedVoiceSettings);
        console.log('🔊 Loaded saved voice settings from localStorage:', parsedVoiceSettings);
        setVoiceSettings(parsedVoiceSettings);
      } catch (e) {
        console.error('Failed to parse saved voice settings, using default:', e);
        setVoiceSettings(defaultVoiceSettings);
      }
    } else {
      console.log('🔊 No saved voice settings found, using default');
      setVoiceSettings(defaultVoiceSettings);
    }

    // Load saved stock tracking items
    const savedStockItems = localStorage.getItem('stockTrackingItems');
    if (savedStockItems) {
      try {
        const parsedStockItems = JSON.parse(savedStockItems);
        console.log('📦 Loaded saved stock tracking items from localStorage:', parsedStockItems);
        setStockTrackingItems(parsedStockItems);
      } catch (e) {
        console.error('Failed to parse saved stock tracking items, using empty array:', e);
        setStockTrackingItems([]);
      }
    }

    // Check if APIs are configured
    const selroConfig = selroApi.getConfig();
    const veeqoConfig = veeqoApi.getConfig();
    
    if (selroConfig) {
      setIsUsingSelroApi(true);
    }
    
    if (veeqoConfig) {
      setIsUsingVeeqoApi(true);
    }
  }, []);

  // Update current order index when current order changes
  useEffect(() => {
    if (currentOrder && orders.length > 0) {
      const index = orders.findIndex(order => 
        order.orderNumber === currentOrder.orderNumber && order.sku === currentOrder.sku
      );
      setCurrentOrderIndex(index);
    } else {
      setCurrentOrderIndex(-1);
    }
  }, [currentOrder, orders]);

  // Handle Selro folder selection
  const handleSelroFolderSelect = async (folderId: string, folderName: string) => {
    try {
      setSelectedSelroFolderId(folderId);
      setSelectedSelroFolderName(folderName);
      
      // Save to localStorage
      localStorage.setItem('selectedSelroFolderId', folderId);
      localStorage.setItem('selectedSelroFolderName', folderName);
      
      console.log(`Selected Selro folder: ${folderName} (${folderId})`);
      
      // Automatically load orders from the selected folder using tag filtering
      await loadOrdersFromSelro(folderName);
    } catch (error) {
      console.error('Error selecting Selro folder:', error);
      alert('Failed to load orders from the selected folder. Please try again.');
    }
  };

  // Handle Veeqo status selection
  const handleVeeqoStatusSelect = async (status: string, warehouseId?: number) => {
    try {
      setSelectedVeeqoStatus(status);
      setSelectedVeeqoWarehouseId(warehouseId);
      
      // Save to localStorage
      localStorage.setItem('selectedVeeqoStatus', status);
      localStorage.setItem('selectedVeeqoWarehouseId', warehouseId ? warehouseId.toString() : '');
      
      console.log(`Selected Veeqo status: ${status}, warehouse: ${warehouseId || 'all'}`);
      
      // Automatically load orders from Veeqo
      await loadOrdersFromVeeqo(status, warehouseId);
    } catch (error) {
      console.error('Error selecting Veeqo status:', error);
      alert('Failed to load orders from Veeqo. Please try again.');
    }
  };

  // Load orders from Selro API
  const loadOrdersFromSelro = async (tag?: string) => {
    try {
      const tagToUse = tag || selectedSelroFolderName || 'all';
      
      console.log(`Loading orders from Selro with tag: ${tagToUse}`);
      
      const selroOrders = await selroApi.getOrdersByTag(tagToUse);
      
      setOrders(selroOrders);
      setPdfUploaded(true);
      setCurrentOrder(null);
      setCurrentOrderIndex(-1);
      setIsUsingSelroApi(true);
      setIsUsingVeeqoApi(false);
      
      console.log(`Loaded ${selroOrders.length} orders from Selro with tag "${tagToUse}"`);
    } catch (error) {
      console.error('Error loading orders from Selro:', error);
      throw error;
    }
  };

  // Load orders from Veeqo API
  const loadOrdersFromVeeqo = async (status?: string, warehouseId?: number) => {
    try {
      const statusToUse = status || selectedVeeqoStatus || 'allocated';
      const warehouseToUse = warehouseId !== undefined ? warehouseId : selectedVeeqoWarehouseId;
      
      console.log(`Loading orders from Veeqo with status: ${statusToUse}, warehouse: ${warehouseToUse || 'all'}`);
      
      const veeqoOrders = await veeqoApi.getOrdersByStatus(statusToUse, warehouseToUse);
      
      setOrders(veeqoOrders);
      setPdfUploaded(true);
      setCurrentOrder(null);
      setCurrentOrderIndex(-1);
      setIsUsingVeeqoApi(true);
      setIsUsingSelroApi(false);
      
      console.log(`Loaded ${veeqoOrders.length} orders from Veeqo with status "${statusToUse}"`);
    } catch (error) {
      console.error('Error loading orders from Veeqo:', error);
      throw error;
    }
  };

  // Handle file upload (for HTML files)
  const handleFileUpload = async (file: File | FileWithImages) => {
    try {
      let actualFile: File;
      let imagesFolderHandle: FileSystemDirectoryHandle | undefined;

      if (file instanceof File) {
        actualFile = file;
      } else {
        if (!file.fileHandle) {
          throw new Error('No file handle available');
        }
        actualFile = file.fileHandle;
        imagesFolderHandle = file.imagesFolderHandle;
      }

      const parsedOrders = await simulatePdfParsing(actualFile, imagesFolderHandle);
      
      if (parsedOrders.length === 0) {
        throw new Error('No orders found in the uploaded file');
      }
      
      setOrders(parsedOrders);
      setPdfUploaded(true);
      setCurrentOrder(null);
      setCurrentOrderIndex(-1);
      setIsUsingSelroApi(false);
      setIsUsingVeeqoApi(false);
    } catch (error) {
      console.error('Error processing file:', error);
      throw error;
    }
  };

  // Handle CSV file upload
  const handleCsvFileUpload = async (file: File, mappings: CsvColumnMapping) => {
    try {
      console.log('🚀 Processing CSV file:', file.name, 'with mappings:', mappings);
      
      // Ensure mappings are saved before processing
      saveCsvMappings(mappings);
      
      const parsedOrders = await parseCsvFile(file, mappings);

      if (parsedOrders.length === 0) {
        throw new Error('No orders found in the uploaded CSV file. Please check your column mappings and ensure the CSV has data rows.');
      }

      console.log(`✅ Successfully loaded ${parsedOrders.length} orders from CSV`);
      
      setOrders(parsedOrders);
      setPdfUploaded(true);
      setCurrentOrder(null);
      setCurrentOrderIndex(-1);
      setIsUsingSelroApi(false);
      setIsUsingVeeqoApi(false);
      
    } catch (error) {
      console.error('❌ Error processing CSV file:', error);
      throw error;
    }
  };

  // Save CSV column mappings to localStorage
  const saveCsvMappings = (mappings: CsvColumnMapping) => {
    console.log('💾 Saving CSV column mappings to localStorage:', mappings);
    setCsvColumnMappings(mappings);
    localStorage.setItem('csvColumnMappings', JSON.stringify(mappings));
  };

  // Save voice settings to localStorage
  const saveVoiceSettings = (settings: VoiceSettings) => {
    console.log('💾 Saving voice settings to localStorage:', settings);
    setVoiceSettings(settings);
    localStorage.setItem('voiceSettings', JSON.stringify(settings));
  };

  // Handle marking items for reorder
  const handleMarkForReorder = (order: Order) => {
    if (order.remainingStock === undefined) return;

    const newItem: StockTrackingItem = {
      sku: order.sku,
      markedDate: new Date().toISOString(),
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      currentStock: order.remainingStock,
      location: order.location,
    };

    // Check if item is already tracked
    const existingItem = stockTrackingItems.find(item => 
      item.sku === order.sku && 
      item.orderNumber === order.orderNumber
    );

    if (!existingItem) {
      const updatedItems = [...stockTrackingItems, newItem];
      setStockTrackingItems(updatedItems);
      localStorage.setItem('stockTrackingItems', JSON.stringify(updatedItems));
      console.log('📦 Added item to stock tracking:', newItem);
    }
  };

  // Remove item from stock tracking
  const removeStockTrackingItem = (sku: string, markedDate: string) => {
    const updatedItems = stockTrackingItems.filter(item => 
      !(item.sku === sku && item.markedDate === markedDate)
    );
    setStockTrackingItems(updatedItems);
    localStorage.setItem('stockTrackingItems', JSON.stringify(updatedItems));
    console.log('📦 Removed item from stock tracking:', sku, markedDate);
  };

  // Clear all stock tracking items
  const clearAllStockTrackingItems = () => {
    setStockTrackingItems([]);
    localStorage.removeItem('stockTrackingItems');
    console.log('📦 Cleared all stock tracking items');
  };

  // Normalize postcode for comparison (remove spaces and convert to uppercase)
  const normalizePostcode = (postcode: string): string => {
    return postcode.replace(/\s/g, '').toUpperCase();
  };

  // Extract postcodes from QR code data
  const extractPostcodesFromQRData = (qrData: string): string[] => {
    // UK postcode regex pattern
    const postcodeRegex = /\b([A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2})\b/g;
    const matches = qrData.match(postcodeRegex) || [];
    
    // Known sender postcodes to filter out
    const KNOWN_SENDER_POSTCODES = ['LU56RT', 'LU33RZ'];
    
    return matches
      .map(match => normalizePostcode(match)) // Normalize postcodes
      .filter(postcode => 
        !KNOWN_SENDER_POSTCODES.some(sender => 
          postcode.startsWith(sender) || sender.startsWith(postcode.substring(0, 4))
        )
      );
  };

  // Handle QR code scanning with improved postcode matching
  const handleQRCodeScan = (qrData: string) => {
    console.log('📱 Processing QR code scan:', qrData);
    
    try {
      // Extract postcodes from QR data
      const postcodes = extractPostcodesFromQRData(qrData);
      console.log('📮 Extracted buyer postcodes:', postcodes);
      
      if (postcodes.length === 0) {
        alert('No buyer postcodes found in the scanned label');
        return;
      }
      
      // Try to find an order matching any of the postcodes
      let foundOrder = null;
      
      for (const postcode of postcodes) {
        foundOrder = orders.find(order => {
          // First, try exact match with the extracted buyer postcode (normalized)
          if (order.buyerPostcode && normalizePostcode(order.buyerPostcode) === postcode) {
            console.log('✅ Exact buyer postcode match found:', postcode, 'for order:', order.orderNumber);
            return true;
          }
          
          // Fallback: Check if the order contains this postcode in any field (normalized)
          const orderText = JSON.stringify(order).toUpperCase();
          const normalizedOrderText = orderText.replace(/\s/g, '');
          
          // Try exact match first
          if (normalizedOrderText.includes(postcode)) {
            console.log('✅ Exact postcode match found in order data:', postcode);
            return true;
          }
          
          // Try partial match (first part of postcode)
          const postcodePrefix = postcode.substring(0, Math.min(4, postcode.length - 2));
          if (postcodePrefix.length >= 3 && normalizedOrderText.includes(postcodePrefix)) {
            console.log('✅ Partial postcode match found:', postcodePrefix);
            return true;
          }
          
          return false;
        });
        
        if (foundOrder) break;
      }
      
      if (foundOrder) {
        setCurrentOrder(foundOrder);
        console.log('🎯 Found matching order:', foundOrder.orderNumber, 'with postcode:', foundOrder.buyerPostcode);
      } else {
        alert(`No order found for postcodes: ${postcodes.join(', ')}`);
      }
    } catch (error) {
      console.error('Error processing QR code:', error);
      alert('Error processing the scanned label');
    }
  };

  // Handle customer search
  const handleCustomerSearch = async (searchTerm: string) => {
    if (!searchTerm) return;
    
    try {
      if (isUsingSelroApi && selectedSelroFolderName) {
        // Search using Selro API with tag filtering
        console.log(`Searching Selro for: ${searchTerm} in tag: ${selectedSelroFolderName}`);
        const searchResults = await selroApi.searchOrdersByCustomer(searchTerm, selectedSelroFolderName);
        
        if (searchResults.length > 0) {
          setCurrentOrder(searchResults[0]);
          console.log('Found order via Selro API:', searchResults[0].orderNumber);
        } else {
          console.log('No order found in Selro for:', searchTerm);
          alert(`No order found for: ${searchTerm}`);
        }
      } else if (isUsingVeeqoApi && selectedVeeqoStatus) {
        // Search using Veeqo API
        console.log(`Searching Veeqo for: ${searchTerm} with status: ${selectedVeeqoStatus}`);
        const searchResults = await veeqoApi.searchOrdersByCustomer(searchTerm, selectedVeeqoStatus);
        
        if (searchResults.length > 0) {
          setCurrentOrder(searchResults[0]);
          console.log('Found order via Veeqo API:', searchResults[0].orderNumber);
        } else {
          console.log('No order found in Veeqo for:', searchTerm);
          alert(`No order found for: ${searchTerm}`);
        }
      } else {
        // Search in loaded orders (file-based) - enhanced search with postcode normalization
        const searchTermLower = searchTerm.toLowerCase();
        const normalizedSearchTerm = normalizePostcode(searchTerm);
        
        const matchedOrder = orders.find(order => {
          // Search by customer name
          if (order.customerName.toLowerCase().includes(searchTermLower)) {
            return true;
          }
          
          // Search by order number/ID
          if (order.orderNumber.toLowerCase().includes(searchTermLower)) {
            return true;
          }
          
          // Search by buyer postcode (normalized comparison)
          if (order.buyerPostcode && normalizePostcode(order.buyerPostcode).includes(normalizedSearchTerm)) {
            return true;
          }
          
          // Search by SKU
          if (order.sku.toLowerCase().includes(searchTermLower)) {
            return true;
          }
          
          return false;
        });
        
        if (matchedOrder) {
          setCurrentOrder(matchedOrder);
          console.log('Found order for search term:', searchTerm, 'Order:', matchedOrder.orderNumber);
        } else {
          console.log('No order found for search term:', searchTerm);
          alert(`No order found for: ${searchTerm}`);
        }
      }
    } catch (error) {
      console.error('Error searching:', error);
      alert('Error searching. Please try again.');
    }
  };

  // Handle arrow key navigation
  const handleArrowNavigation = (direction: 'up' | 'down') => {
    if (orders.length === 0) return;
    
    let newIndex = currentOrderIndex;
    
    if (direction === 'up') {
      newIndex = currentOrderIndex <= 0 ? orders.length - 1 : currentOrderIndex - 1;
    } else {
      newIndex = currentOrderIndex >= orders.length - 1 ? 0 : currentOrderIndex + 1;
    }
    
    setCurrentOrderIndex(newIndex);
    setCurrentOrder(orders[newIndex]);
    console.log(`🔄 Arrow navigation: ${direction}, new index: ${newIndex}, order: ${orders[newIndex].orderNumber}`);
  };

  // Handle order completion
  const handleOrderComplete = async (order: Order) => {
    try {
      // Update local state
      order.completed = true;
      setOrders(prevOrders => 
        prevOrders.map(o => 
          o.orderNumber === order.orderNumber && o.sku === order.sku ? order : o
        )
      );

      // If using Selro API, update the order status in Selro
      if (isUsingSelroApi && order.selroOrderId && order.selroItemId) {
        console.log('Updating order status in Selro...');
        await selroApi.updateOrderStatus(order.selroOrderId, order.selroItemId, 'completed');
        console.log('Successfully updated order status in Selro');
      }

      // If using Veeqo API, update the order status in Veeqo
      if (isUsingVeeqoApi && order.veeqoOrderId) {
        console.log('Updating order status in Veeqo...');
        await veeqoApi.updateOrderStatus(order.veeqoOrderId, 'shipped');
        console.log('Successfully updated order status in Veeqo');
      }
    } catch (error) {
      console.error('Error marking order as complete:', error);
      // Revert local state if API update failed
      order.completed = false;
      setOrders(prevOrders => 
        prevOrders.map(o => 
          o.orderNumber === order.orderNumber && o.sku === order.sku ? order : o
        )
      );
      alert('Failed to update order status. Please try again.');
    }
  };

  return {
    pdfUploaded,
    setPdfUploaded,
    orders,
    setOrders,
    currentOrder,
    setCurrentOrder,
    currentOrderIndex,
    handleFileUpload,
    handleCsvFileUpload,
    saveCsvMappings,
    csvColumnMappings,
    saveVoiceSettings,
    voiceSettings,
    stockTrackingItems,
    handleMarkForReorder,
    removeStockTrackingItem,
    clearAllStockTrackingItems,
    handleCustomerSearch,
    handleQRCodeScan,
    handleArrowNavigation,
    handleSelroFolderSelect,
    selectedSelroFolderId,
    selectedSelroFolderName,
    handleVeeqoStatusSelect,
    selectedVeeqoStatus,
    selectedVeeqoWarehouseId,
    isUsingSelroApi,
    isUsingVeeqoApi,
    loadOrdersFromSelro,
    loadOrdersFromVeeqo,
    handleOrderComplete,
  };
};