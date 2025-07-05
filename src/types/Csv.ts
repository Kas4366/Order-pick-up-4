export type CsvField = 'orderNumber' | 'customerFirstName' | 'customerLastName' | 'sku' | 'quantity' | 'location' | 'buyerPostcode' | 'imageUrl' | 'remainingStock' | 'orderValue' | 'channelType' | 'channel' | 'packagingType';

export interface CsvColumnMapping {
  [key: string]: string; // Maps CsvField to the actual CSV column header
}

export const defaultCsvColumnMapping: CsvColumnMapping = {
  orderNumber: 'Order Number',
  customerFirstName: 'Customer First Name',
  customerLastName: 'Customer Last Name',
  sku: 'SKU',
  quantity: 'Quantity',
  location: 'Location',
  buyerPostcode: 'Buyer Postcode',
  imageUrl: 'Image URL',
  remainingStock: 'Remaining Stock',
  orderValue: 'Order Value',
  channelType: 'Channel Type',
  channel: 'Channel',
  packagingType: 'Packaging Type',
};

// New interface for SKU-Image mapping
export interface SkuImageMap {
  [sku: string]: string; // Maps SKU to image URL
}

// Interface for SKU-Image CSV file info
export interface SkuImageCsvInfo {
  fileName: string;
  uploadedAt: string;
  skuCount: number;
}