export interface Order {
  orderNumber: string;
  customerName: string;
  sku: string;
  quantity: number;
  location: string;
  imageUrl?: string;
  additionalDetails?: string;
  completed?: boolean;
  // Selro-specific fields for API integration
  selroOrderId?: string;
  selroItemId?: string;
  // Veeqo-specific fields for API integration
  veeqoOrderId?: string;
  veeqoItemId?: string;
  // Buyer postcode for QR code matching
  buyerPostcode?: string;
  // Stock information
  remainingStock?: number;
  // File date tracking
  fileDate?: string;
  // Order value
  orderValue?: number;
  // Channel information
  channelType?: string;
  channel?: string;
  // Packaging information
  packagingType?: string;
}