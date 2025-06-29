export type CsvField = 'orderNumber' | 'customerFirstName' | 'customerLastName' | 'sku' | 'quantity' | 'location' | 'buyerPostcode' | 'imageUrl' | 'remainingStock';

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
};