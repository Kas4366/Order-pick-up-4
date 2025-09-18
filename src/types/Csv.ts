export type CsvField = 'orderNumber' | 'customerFirstName' | 'customerLastName' | 'sku' | 'quantity' | 'location' | 'buyerPostcode' | 'imageUrl' | 'remainingStock' | 'orderValue' | 'channelType' | 'channel' | 'width' | 'weight' | 'itemName' | 'shipFromLocation' | 'packageDimension' | 'notes';

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
  width: 'Width',
  weight: 'Weight',
  itemName: 'Product Name',
  shipFromLocation: 'Ship From Location',
  packageDimension: 'Package Dimension',
  notes: 'Notes',
};

// Local images folder info
export interface LocalImagesFolderInfo {
  folderName: string;
  selectedAt: string;
}