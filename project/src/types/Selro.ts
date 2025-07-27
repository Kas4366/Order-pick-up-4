export interface SelroConfig {
  apiKey: string;
  apiSecret: string;
  baseUrl: string;
}

export interface SelroFolder {
  id: string;
  name: string;
  orderCount: number;
  description?: string;
}

export interface SelroOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  status: string;
  folderId: string;
  folderName: string;
  items: SelroOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface SelroOrderItem {
  id: string;
  sku: string;
  productName: string;
  quantity: number;
  location: string;
  productId: string;
  imageUrl?: string;
}

export interface SelroProduct {
  id: string;
  sku: string;
  name: string;
  images: SelroProductImage[];
  locations: SelroProductLocation[];
}

export interface SelroProductImage {
  id: string;
  url: string;
  isPrimary: boolean;
}

export interface SelroProductLocation {
  locationId: string;
  locationName: string;
  quantity: number;
}

export interface SelroApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}