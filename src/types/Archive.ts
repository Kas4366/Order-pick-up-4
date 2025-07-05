export interface ArchivedOrder {
  id?: number; // IndexedDB auto-generated ID
  orderNumber: string;
  customerName: string;
  sku: string;
  quantity: number;
  location: string;
  imageUrl?: string;
  additionalDetails?: string;
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
  // Packaging information
  packagingType?: string;
  // API-specific fields
  selroOrderId?: string;
  selroItemId?: string;
  veeqoOrderId?: string;
  veeqoItemId?: string;
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