export interface StockTrackingItem {
  sku: string;
  markedDate: string;
  orderNumber: string;
  customerName: string;
  currentStock: number;
  location: string;
}

export interface StockTrackingState {
  items: StockTrackingItem[];
}