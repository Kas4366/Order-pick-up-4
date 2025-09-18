export interface ArchivedOrder {
  id?: number; // IndexedDB auto-generated ID
  orderNumber: string;
  customerName: string;
  sku: string;
  quantity: number;
  location: string;
  imageUrl?: string;
  itemName?: string;
  buyerPostcode?: string;
  remainingStock?: number;
  orderValue?: number;
  fileDate: string; // Required for archive - when the file was processed
  fileName: string; // Name of the source file
  archivedAt: string; // When it was archived
  completed?: boolean;
  // Channel information
  channelType?: string;
  channel?: string;
  // Packaging and shipping information
  width?: number; // Product width in centimeters
  weight?: number; // Product weight in grams
  shipFromLocation?: string; // Location where the order ships from
  packageDimension?: string; // Package size/dimension information
  packagingType?: string; // Legacy packaging type field
  selroOrderId?: string;
  selroItemId?: string;
  veeqoOrderId?: string;
  veeqoItemId?: string;
  localImageSource?: {
    sku: string;
    folderName: string;
  };
  notes?: string; // Order notes
}

export interface ArchiveStats {
  totalOrders: number;
  totalFiles: number;
  oldestFileDate: string;
  newestFileDate: string;
  lastUpdated: string;
}

export interface ArchiveSearchResult {
  orders: ArchivedOrder[];
  foundInArchive: boolean;
  searchTerm: string;
  matchCount: number;
}