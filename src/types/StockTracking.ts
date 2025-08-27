export interface StockTrackingItem {
  sku: string;
  markedDate: string;
  orderNumber: string;
  customerName: string;
  currentStock: number;
  location: string; // Original location
  imageUrl?: string; // Image URL for display
  weight?: number; // Manually entered weight in grams
  newLocation?: string; // Manually entered new location
  localImageSource?: {
    sku: string;
    folderName: string;
  }; // Information about local image source for persistence
}