export interface VeeqoConfig {
  apiKey: string;
  baseUrl: string;
}

export interface VeeqoOrder {
  id: number;
  number: string;
  status: string;
  customer: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  deliver_to: {
    first_name: string;
    last_name: string;
    company: string;
    address_line_1: string;
    address_line_2: string;
    city: string;
    state: string;
    country: string;
    zip: string;
  };
  line_items: VeeqoLineItem[];
  created_at: string;
  updated_at: string;
  allocated_at: string;
  tags: string[];
}

export interface VeeqoLineItem {
  id: number;
  sellable_id: number;
  quantity: number;
  price_per_unit: string;
  sellable: {
    id: number;
    sku_code: string;
    product_title: string;
    product_brand: string;
    images: VeeqoImage[];
    inventory_entries: VeeqoInventoryEntry[];
  };
}

export interface VeeqoImage {
  id: number;
  src: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface VeeqoInventoryEntry {
  id: number;
  warehouse_id: number;
  warehouse_name: string;
  location: string;
  available: number;
  allocated: number;
  incoming: number;
  on_hand: number;
}

export interface VeeqoApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  pagination?: {
    current_page: number;
    per_page: number;
    total_count: number;
    total_pages: number;
  };
}

export interface VeeqoWarehouse {
  id: number;
  name: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  country: string;
  zip: string;
  created_at: string;
  updated_at: string;
}