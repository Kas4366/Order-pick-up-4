import { useState, useEffect } from 'react';
import { Order } from '../types/Order';
import { ArchivedOrder } from '../types/Archive';
import { simulatePdfParsing } from '../utils/pdfUtils';
import { FileWithImages } from '../types/Settings';
import { selroApi } from '../services/selroApi';
import { veeqoApi } from '../services/veeqoApi';
import { archiveService } from '../services/archiveService';
import { CsvColumnMapping, defaultCsvColumnMapping, LocalImagesFolderInfo } from '../types/Csv';
import { VoiceSettings, defaultVoiceSettings } from '../types/VoiceSettings';
import { StockTrackingItem } from '../types/StockTracking';
import { CustomTag, defaultCustomTags } from '../types/CustomTags';
import { PackagingRule, defaultPackagingRules, defaultPackagingTypes } from '../types/Packaging';
import { evaluatePackagingRules } from '../utils/packagingRules';
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
  
  // Custom tags state
  const [customTags, setCustomTags] = useState<CustomTag[]>(defaultCustomTags);
  const [selectedSelroTag, setSelectedSelroTag] = useState<string>('all');
  const [selectedVeeqoTag, setSelectedVeeqoTag] = useState<string>('all');
  
  // Packaging rules state
  const [packagingRules, setPackagingRules] = useState<PackagingRule[]>(defaultPackagingRules);
  const [customPackagingTypes, setCustomPackagingTypes] = useState<string[]>(defaultPackagingTypes);
  const [currentOrderPackagingType, setCurrentOrderPackagingType] = useState<string | null>(null);

  // Local images folder state
  const [csvImagesFolderHandle, setCsvImagesFolderHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [csvImagesFolderInfo, setCsvImagesFolderInfo] = useState<LocalImagesFolderInfo | null>(null);

  // Archive state
  const [isArchiveInitialized, setIsArchiveInitialized] = useState(false);

  // Other settings state
  const [autoCompleteEnabled, setAutoCompleteEnabled] = useState(false);
  const [lastScannedData, setLastScannedData] = useState<string>('');
  const [searchMessage, setSearchMessage] = useState<string>('');

  // Initialize archive system on component mount
  useEffect(() => {
    const initializeArchive = async () => {
      try {
        await archiveService.init();
        await archiveService.initAutoCleanup(); // Run auto-cleanup check
        setIsArchiveInitialized(true);
        console.log('✅ Archive system initialized');
      } catch (error) {
        console.error('❌ Failed to initialize archive system:', error);
      }
    };

    initializeArchive();
  }, []);

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

    // Load saved custom tags
    const savedCustomTags = localStorage.getItem('customTags');
    if (savedCustomTags) {
      try {
        const parsedCustomTags = JSON.parse(savedCustomTags);
        console.log('🏷️ Loaded saved custom tags from localStorage:', parsedCustomTags);
        setCustomTags(parsedCustomTags);
      } catch (e) {
        console.error('Failed to parse saved custom tags, using default:', e);
        setCustomTags(defaultCustomTags);
      }
    }

    // Load saved tag selections
    const savedSelroTag = localStorage.getItem('selectedSelroTag');
    const savedVeeqoTag = localStorage.getItem('selectedVeeqoTag');
    
    if (savedSelroTag) {
      setSelectedSelroTag(savedSelroTag);
    }
    
    if (savedVeeqoTag) {
      setSelectedVeeqoTag(savedVeeqoTag);
    }
    
    // Load saved packaging rules
    const savedPackagingRules = localStorage.getItem('packagingRules');
    if (savedPackagingRules) {
      try {
        const parsedPackagingRules = JSON.parse(savedPackagingRules);
        console.log('📦 Loaded saved packaging rules from localStorage:', parsedPackagingRules);
        setPackagingRules(parsedPackagingRules);
      } catch (e) {
        console.error('Failed to parse saved packaging rules, using default:', e);
        setPackagingRules(defaultPackagingRules);
      }
    }

    // Load saved custom packaging types
    const savedPackagingTypes = localStorage.getItem('customPackagingTypes');
    if (savedPackagingTypes) {
      try {
        const parsedPackagingTypes = JSON.parse(savedPackagingTypes);
        console.log('📦 Loaded saved packaging types from localStorage:', parsedPackagingTypes);
        setCustomPackagingTypes(parsedPackagingTypes);
      } catch (e) {
        console.error('Failed to parse saved packaging types, using default:', e);
        setCustomPackagingTypes(defaultPackagingTypes);
      }
    }
    // Load other settings
    const savedAutoComplete = localStorage.getItem('autoCompleteEnabled');
    if (savedAutoComplete) {
      setAutoCompleteEnabled(JSON.parse(savedAutoComplete));
    }

    // Load saved CSV images folder info
    const savedCsvImagesFolderInfo = localStorage.getItem('csvImagesFolderInfo');
    
    if (savedCsvImagesFolderInfo) {
      try {
        const parsedCsvImagesFolderInfo = JSON.parse(savedCsvImagesFolderInfo);
        console.log('🖼️ Loaded saved CSV images folder info from localStorage:', parsedCsvImagesFolderInfo);
        setCsvImagesFolderInfo(parsedCsvImagesFolderInfo);
      } catch (e) {
        console.error('Failed to parse saved CSV images folder info, using null:', e);
        setCsvImagesFolderInfo(null);
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

  // Evaluate packaging rules when current order changes
  useEffect(() => {
    if (currentOrder && packagingRules.length > 0) {
      const packagingType = evaluatePackagingRules(currentOrder, packagingRules);
      setCurrentOrderPackagingType(packagingType);
      console.log('📦 Determined packaging type for current order:', packagingType);
    } else {
      setCurrentOrderPackagingType(null);
    }
  }, [currentOrder, packagingRules]);

  // Archive orders when they are loaded (with file name extraction)
  const archiveOrdersWithFileName = async (ordersToArchive: Order[], sourceFile?: File) => {
    if (!isArchiveInitialized || ordersToArchive.length === 0) return;

    try {
      // Extract file name from the source file or generate a default name
      let fileName = 'Unknown File';
      
      if (sourceFile) {
        fileName = sourceFile.name;
      } else if (isUsingSelroApi && selectedSelroFolderName) {
        fileName = `Selro-${selectedSelroFolderName}-${new Date().toISOString().split('T')[0]}`;
      } else if (isUsingVeeqoApi && selectedVeeqoStatus) {
        fileName = `Veeqo-${selectedVeeqoStatus}-${new Date().toISOString().split('T')[0]}`;
      } else {
        fileName = `Orders-${new Date().toISOString().split('T')[0]}`;
      }

      console.log(`🗄️ Archiving ${ordersToArchive.length} orders from: ${fileName}`);
      
      const archivedCount = await archiveService.archiveOrders(ordersToArchive, fileName);
      console.log(`✅ Successfully archived ${archivedCount} orders`);
    } catch (error) {
      console.error('❌ Failed to archive orders:', error);
      // Don't throw error - archiving failure shouldn't break the main flow
    }
  };

  // Custom tags management
  const saveCustomTags = (tags: CustomTag[]) => {
    console.log('🏷️ Saving custom tags to localStorage:', tags);
    setCustomTags(tags);
    localStorage.setItem('customTags', JSON.stringify(tags));
  };

  const handleSelectSelroTag = (tagName: string) => {
    console.log('🏷️ Selected Selro tag:', tagName);
    setSelectedSelroTag(tagName);
    localStorage.setItem('selectedSelroTag', tagName);
    
    // Auto-load orders if Selro is connected and a folder is selected
    if (isUsingSelroApi && selectedSelroFolderId) {
      loadOrdersFromSelro(tagName === 'all' ? undefined : tagName);
    }
  };

  const handleSelectVeeqoTag = (tagName: string) => {
    console.log('🏷️ Selected Veeqo tag:', tagName);
    setSelectedVeeqoTag(tagName);
    localStorage.setItem('selectedVeeqoTag', tagName);
    
    // Auto-load orders if Veeqo is connected and a status is selected
    if (isUsingVeeqoApi && selectedVeeqoStatus) {
      loadOrdersFromVeeqo(selectedVeeqoStatus, selectedVeeqoWarehouseId, tagName === 'all' ? undefined : tagName);
    }
  };
  
  // Packaging rules management
  const savePackagingRules = (rules: PackagingRule[]) => {
    console.log('📦 Saving packaging rules to localStorage:', rules);
    setPackagingRules(rules);
    localStorage.setItem('packagingRules', JSON.stringify(rules));
  };

  // Custom packaging types management
  const saveCustomPackagingTypes = (types: string[]) => {
    console.log('📦 Saving custom packaging types to localStorage:', types);
    setCustomPackagingTypes(types);
    localStorage.setItem('customPackagingTypes', JSON.stringify(types));
  };
  // CSV Images Folder management
  const setCsvImagesFolder = async () => {
    try {
      console.log('🖼️ Selecting CSV images folder...');
      
      const folderHandle = await window.showDirectoryPicker({
        mode: 'read',
        startIn: 'documents'
      });
      
      const newFolderInfo: LocalImagesFolderInfo = {
        folderName: folderHandle.name,
        selectedAt: new Date().toISOString()
      };

      setCsvImagesFolderHandle(folderHandle);
      setCsvImagesFolderInfo(newFolderInfo);

      // Save to localStorage
      localStorage.setItem('csvImagesFolderInfo', JSON.stringify(newFolderInfo));

      console.log(`✅ Successfully selected images folder: ${folderHandle.name}`);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('❌ Error selecting images folder:', error);
        throw error;
      }
    }
  };

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
      const tagToUse = selectedSelroTag === 'all' ? undefined : selectedSelroTag;
      await loadOrdersFromSelro(tagToUse);
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
      const tagToUse = selectedVeeqoTag === 'all' ? undefined : selectedVeeqoTag;
      await loadOrdersFromVeeqo(status, warehouseId, tagToUse);
    } catch (error) {
      console.error('Error selecting Veeqo status:', error);
      alert('Failed to load orders from Veeqo. Please try again.');
    }
  };

  // Load orders from Selro API with tag filtering
  const loadOrdersFromSelro = async (tag?: string) => {
    try {
      const tagToUse = tag || (selectedSelroTag === 'all' ? undefined : selectedSelroTag);
      
      console.log(`Loading orders from Selro with tag: ${tagToUse || 'none'}`);
      
      const selroOrders = await selroApi.getOrdersByTag(tagToUse || 'all');
      
      setOrders(selroOrders);
      setPdfUploaded(true);
      setCurrentOrder(null);
      setCurrentOrderIndex(-1);
      setIsUsingSelroApi(true);
      setIsUsingVeeqoApi(false);
      
      // Archive the loaded orders
      await archiveOrdersWithFileName(selroOrders);
      
      console.log(`Loaded ${selroOrders.length} orders from Selro with tag "${tagToUse || 'all'}"`);
    } catch (error) {
      console.error('Error loading orders from Selro:', error);
      throw error;
    }
  };

  // Load orders from Veeqo API with tag filtering
  const loadOrdersFromVeeqo = async (status?: string, warehouseId?: number, tag?: string) => {
    try {
      const statusToUse = status || selectedVeeqoStatus || 'allocated';
      const warehouseToUse = warehouseId !== undefined ? warehouseId : selectedVeeqoWarehouseId;
      const tagToUse = tag || (selectedVeeqoTag === 'all' ? undefined : selectedVeeqoTag);
      
      console.log(`Loading orders from Veeqo with status: ${statusToUse}, warehouse: ${warehouseToUse || 'all'}, tag: ${tagToUse || 'none'}`);
      
      let veeqoOrders = await veeqoApi.getOrdersByStatus(statusToUse, warehouseToUse);
      
      // Apply client-side tag filtering if a tag is specified
      if (tagToUse) {
        const originalCount = veeqoOrders.length;
        veeqoOrders = veeqoOrders.filter(order => {
          // Check if the order contains the tag in various fields
          const orderText = JSON.stringify(order).toLowerCase();
          const tagLower = tagToUse.toLowerCase();
          
          return orderText.includes(tagLower) || 
                 order.additionalDetails?.toLowerCase().includes(tagLower) ||
                 order.customerName.toLowerCase().includes(tagLower);
        });
        
        console.log(`Filtered ${originalCount} orders down to ${veeqoOrders.length} orders with tag "${tagToUse}"`);
      }
      
      setOrders(veeqoOrders);
      setPdfUploaded(true);
      setCurrentOrder(null);
      setCurrentOrderIndex(-1);
      setIsUsingVeeqoApi(true);
      setIsUsingSelroApi(false);
      
      // Archive the loaded orders
      await archiveOrdersWithFileName(veeqoOrders);
      
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

      // Extract file date from the file's last modified timestamp
      const fileDate = new Date(actualFile.lastModified).toISOString();
      console.log('📅 File date extracted:', fileDate);

      const parsedOrders = await simulatePdfParsing(actualFile, imagesFolderHandle, fileDate);
      
      if (parsedOrders.length === 0) {
        throw new Error('No orders found in the uploaded file');
      }
      
      setOrders(parsedOrders);
      setPdfUploaded(true);
      setCurrentOrder(null);
      setCurrentOrderIndex(-1);
      setIsUsingSelroApi(false);
      setIsUsingVeeqoApi(false);

      // Archive the loaded orders
      await archiveOrdersWithFileName(parsedOrders, actualFile);
    } catch (error) {
      console.error('Error processing file:', error);
      throw error;
    }
  };

  // Handle CSV file upload with SKU-Image fallback
  const handleCsvFileUpload = async (file: File, mappings: CsvColumnMapping) => {
    try {
      console.log('🚀 Processing CSV file:', file.name, 'with mappings:', mappings);
      console.log('🖼️ Using images folder:', csvImagesFolderHandle?.name || 'None selected');
      
      // Ensure mappings are saved before processing
      saveCsvMappings(mappings);
      
      // Extract file date from the file's last modified timestamp
      const fileDate = new Date(file.lastModified).toISOString();
      console.log('📅 File date extracted:', fileDate);
      
      // Pass the images folder handle and file date to the CSV parser
      const parsedOrders = await parseCsvFile(file, mappings, csvImagesFolderHandle || undefined, fileDate);

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

      // Archive the loaded orders
      await archiveOrdersWithFileName(parsedOrders, file);
      
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

  // Handle QR code scanning - ENHANCED WITH ARCHIVE SEARCH
  const handleQRCodeScan = (qrData: string) => {
    console.log('📱 Processing QR code scan:', qrData);
    
    try {
      // Extract postcodes from QR data
      const postcodeRegex = /\b([A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2})\b/g;
      const matches = qrData.match(postcodeRegex) || [];
      
      // Known sender postcodes to filter out
      const KNOWN_SENDER_POSTCODES = ['LU56RT', 'LU33RZ'];
      
      const postcodes = matches
        .map(match => normalizePostcode(match)) // Normalize postcodes
        .filter(postcode => 
          !KNOWN_SENDER_POSTCODES.some(sender => 
            postcode.startsWith(sender) || sender.startsWith(postcode.substring(0, 4))
          )
        );
      
      if (postcodes.length === 0) {
        console.log('⚠️ No buyer postcodes found in QR data');
        return;
      }
      
      // Use the first valid postcode for search
      const postcodeToSearch = postcodes[0];
      console.log('🔍 Using postcode for search:', postcodeToSearch);
      
      // Let the customer search handle the actual order finding (which now includes archive search)
      handleCustomerSearch(postcodeToSearch);
      
    } catch (error) {
      console.error('Error processing QR code:', error);
    }
  };

  // Handle customer search - ENHANCED WITH ARCHIVE SEARCH
  const handleCustomerSearch = async (searchTerm: string) => {
    if (!searchTerm) return;
    
    setSearchMessage(''); // Clear previous message
    
    try {
      let foundOrder: Order | null = null;
      
      if (isUsingSelroApi && selectedSelroFolderName) {
        // Search using Selro API with tag filtering
        const tagToUse = selectedSelroTag === 'all' ? undefined : selectedSelroTag;
        console.log(`Searching Selro for: ${searchTerm} with tag: ${tagToUse || 'none'}`);
        const searchResults = await selroApi.searchOrdersByCustomer(searchTerm, tagToUse || 'all');
        
        if (searchResults.length > 0) {
          foundOrder = searchResults[0];
          console.log('Found order via Selro API:', foundOrder.orderNumber);
        }
      } else if (isUsingVeeqoApi && selectedVeeqoStatus) {
        // Search using Veeqo API
        console.log(`Searching Veeqo for: ${searchTerm} with status: ${selectedVeeqoStatus}`);
        const searchResults = await veeqoApi.searchOrdersByCustomer(searchTerm, selectedVeeqoStatus);
        
        if (searchResults.length > 0) {
          foundOrder = searchResults[0];
          console.log('Found order via Veeqo API:', foundOrder.orderNumber);
        }
      } else {
        // Search in loaded orders (file-based) - enhanced search with postcode normalization
        const searchTermLower = searchTerm.toLowerCase();
        const normalizedSearchTerm = normalizePostcode(searchTerm);
        
        foundOrder = orders.find(order => {
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
      }
      
      if (foundOrder) {
        setCurrentOrder(foundOrder);
        setSearchMessage(''); // Clear message on success
        console.log('Found order for search term:', searchTerm, 'Order:', foundOrder.orderNumber);
      } else {
        // If not found in current orders, search the archive
        console.log('🗄️ Order not found in current data, searching archive...');
        
        if (isArchiveInitialized) {
          try {
            const archiveResult = await archiveService.searchArchive(searchTerm);
            
            if (archiveResult.foundInArchive && archiveResult.orders.length > 0) {
              const archivedOrder = archiveResult.orders[0];
              console.log('✅ Found order in archive:', archivedOrder.orderNumber, 'from file:', archivedOrder.fileName);
              
              // Convert archived order to regular order and set as current
              const orderFromArchive: Order = {
                orderNumber: archivedOrder.orderNumber,
                customerName: archivedOrder.customerName,
                sku: archivedOrder.sku,
                quantity: archivedOrder.quantity,
                location: archivedOrder.location,
                imageUrl: archivedOrder.imageUrl,
                itemName: archivedOrder.itemName,
                buyerPostcode: archivedOrder.buyerPostcode,
                remainingStock: archivedOrder.remainingStock,
                orderValue: archivedOrder.orderValue,
                fileDate: archivedOrder.fileDate,
                channelType: archivedOrder.channelType,
                channel: archivedOrder.channel,
                packagingType: archivedOrder.packagingType,
                completed: archivedOrder.completed || false,
                selroOrderId: archivedOrder.selroOrderId,
                selroItemId: archivedOrder.selroItemId,
                veeqoOrderId: archivedOrder.veeqoOrderId,
                veeqoItemId: archivedOrder.veeqoItemId,
              };
              
              setCurrentOrder(orderFromArchive);
              
              setSearchMessage(''); // Clear message on success
              // Show a notification that this order was found in archive
              const fileDate = archivedOrder.fileDate ? new Date(archivedOrder.fileDate).toLocaleDateString('en-GB') : 'Unknown date';
              console.log(`📋 Loaded archived order from ${archivedOrder.fileName} (${fileDate})`);
              
              // Optionally show a visual indicator that this is from archive
              // You could add a toast notification here if you implement one
              
            } else {
              setSearchMessage(`No order found for "${searchTerm}"`);
              console.log('No order found for search term:', searchTerm);
            }
          } catch (error) {
            setSearchMessage(`No order found for "${searchTerm}"`);
            console.error('Error searching archive:', error);
          }
        } else {
          setSearchMessage(`No order found for "${searchTerm}"`);
          console.log('Archive not initialized, cannot search');
        }
      }
    } catch (error) {
      setSearchMessage(`Error searching for "${searchTerm}"`);
      console.error('Error searching:', error);
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

  // Save other settings
  const saveOtherSettings = (settings: { autoCompleteEnabled: boolean }) => {
    setAutoCompleteEnabled(settings.autoCompleteEnabled);
    localStorage.setItem('autoCompleteEnabled', JSON.stringify(settings.autoCompleteEnabled));
    console.log('💾 Saved other settings:', settings);
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

  // Handle loading archived order
  const handleLoadArchivedOrder = (archivedOrder: ArchivedOrder) => {
    console.log('📋 Loading archived order:', archivedOrder.orderNumber, 'from file:', archivedOrder.fileName);
    
    // Convert archived order to regular order
    const orderFromArchive: Order = {
      orderNumber: archivedOrder.orderNumber,
      customerName: archivedOrder.customerName,
      sku: archivedOrder.sku,
      quantity: archivedOrder.quantity,
      location: archivedOrder.location,
      imageUrl: archivedOrder.imageUrl,
      itemName: archivedOrder.itemName,
      buyerPostcode: archivedOrder.buyerPostcode,
      remainingStock: archivedOrder.remainingStock,
      orderValue: archivedOrder.orderValue,
      fileDate: archivedOrder.fileDate,
      channelType: archivedOrder.channelType,
      channel: archivedOrder.channel,
      packagingType: archivedOrder.packagingType,
      completed: archivedOrder.completed || false,
      selroOrderId: archivedOrder.selroOrderId,
      selroItemId: archivedOrder.selroItemId,
      veeqoOrderId: archivedOrder.veeqoOrderId,
      veeqoItemId: archivedOrder.veeqoItemId,
    };
    
    setCurrentOrder(orderFromArchive);
    
    // Show file date info
    const fileDate = archivedOrder.fileDate ? new Date(archivedOrder.fileDate).toLocaleDateString('en-GB') : 'Unknown date';
    console.log(`✅ Loaded archived order from ${archivedOrder.fileName} (${fileDate})`);
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
    // Custom tags functionality
    customTags,
    saveCustomTags,
    selectedSelroTag,
    selectedVeeqoTag,
    handleSelectSelroTag,
    handleSelectVeeqoTag,
    // CSV Images Folder functionality
    csvImagesFolderHandle,
    csvImagesFolderInfo,
    setCsvImagesFolder,
    // Archive functionality
    handleLoadArchivedOrder,
    isArchiveInitialized,
    // Packaging rules
    packagingRules,
    savePackagingRules,
    customPackagingTypes,
    saveCustomPackagingTypes,
    currentOrderPackagingType,
    // Other settings
    autoCompleteEnabled,
    saveOtherSettings,
    searchMessage,
    setSearchMessage,
  };
};