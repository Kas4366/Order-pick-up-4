import { VeeqoConfig, VeeqoOrder, VeeqoWarehouse, VeeqoApiResponse } from '../types/Veeqo';
import { Order } from '../types/Order';

class VeeqoApiService {
  private config: VeeqoConfig | null = null;

  setConfig(config: VeeqoConfig) {
    this.config = config;
    // Save to localStorage for persistence
    localStorage.setItem('veeqoConfig', JSON.stringify(config));
  }

  getConfig(): VeeqoConfig | null {
    if (this.config) return this.config;
    
    // Try to load from localStorage
    const saved = localStorage.getItem('veeqoConfig');
    if (saved) {
      this.config = JSON.parse(saved);
      return this.config;
    }
    
    return null;
  }

  private async makeNetlifyFunctionRequest<T>(
    endpoint: string = 'orders', 
    additionalParams?: Record<string, string>
  ): Promise<T> {
    const config = this.getConfig();
    if (!config) {
      throw new Error('Veeqo API not configured. Please add your API key in settings.');
    }

    // Build the Netlify Function URL
    const functionUrl = new URL('/.netlify/functions/getVeeqoOrders', window.location.origin);
    
    // Add parameters
    functionUrl.searchParams.set('endpoint', endpoint);
    if (additionalParams) {
      Object.entries(additionalParams).forEach(([key, value]) => {
        functionUrl.searchParams.set(key, value);
      });
    }
    
    console.log('🔗 Making request via Netlify Function to Veeqo:', functionUrl.toString());
    
    try {
      const response = await fetch(functionUrl.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      console.log('📡 Netlify Function response status:', response.status, response.statusText);

      // Read response text first to handle both success and error cases
      const responseText = await response.text();
      console.log('📡 Raw response length:', responseText.length);

      if (!response.ok) {
        console.error('❌ Netlify Function Error Details:', {
          status: response.status,
          statusText: response.statusText,
          body: responseText,
        });
        
        // Try to parse error response
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch (e) {
          errorData = { error: responseText };
        }
        
        if (response.status === 500 && errorData.error?.includes('credentials not configured')) {
          throw new Error('Veeqo API credentials not configured on the server. Please contact the administrator to set up VEEQO_API_KEY environment variable.');
        } else if (response.status === 403) {
          throw new Error(`Access forbidden (403). Please verify:
• Your API key is correct and active
• Your API key has permission to access orders  
• Your Veeqo account has API access enabled

API Key should be in format: [your-api-key]`);
        } else if (response.status === 401) {
          throw new Error('Unauthorized (401). Please check your API key is valid.');
        } else if (response.status === 404) {
          throw new Error('API endpoint not found (404). Please contact Veeqo support to confirm the correct endpoint.');
        } else {
          throw new Error(`Server Error (${response.status}): ${errorData.error || response.statusText}`);
        }
      }

      // Try to parse JSON response
      let responseData: any;
      try {
        responseData = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.warn('⚠️ Failed to parse JSON response:', parseError);
        throw new Error('Invalid response format from server');
      }
      
      console.log('✅ Netlify Function Response received:', typeof responseData);
      return responseData;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('❌ Network error details:', error);
        throw new Error('Network error. Please check your internet connection and ensure the app is properly deployed.');
      }
      
      // Re-throw our custom errors
      if (error instanceof Error && (error.message.includes('credentials not configured') || error.message.includes('Access forbidden'))) {
        throw error;
      }
      
      // Handle other errors
      console.error('❌ Unexpected error:', error);
      throw new Error(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing Veeqo API connection via Netlify Function...');
      
      // Test with a small request to verify connection
      const response = await this.makeNetlifyFunctionRequest('orders', { 
        page_size: '1' 
      });
      
      console.log('✅ Veeqo API connection test successful via Netlify Function');
      return true;
    } catch (error) {
      console.error('❌ Veeqo API connection test failed:', error);
      return false;
    }
  }

  async getWarehouses(): Promise<VeeqoWarehouse[]> {
    try {
      console.log('🔍 Fetching warehouses from Veeqo API...');
      
      const warehousesData = await this.makeNetlifyFunctionRequest<VeeqoWarehouse[]>('warehouses');
      
      console.log(`✅ Found ${warehousesData.length} warehouses from Veeqo API`);
      return warehousesData;
    } catch (error) {
      console.error('❌ Error fetching warehouses from Veeqo:', error);
      throw error;
    }
  }

  async getOrdersByStatus(status: string = 'allocated', warehouseId?: number): Promise<Order[]> {
    try {
      console.log(`🔍 Fetching orders from Veeqo API with status: "${status}"`);
      
      const params: Record<string, string> = {
        page_size: '50',
        status: status
      };
      
      if (warehouseId) {
        params.warehouse_id = warehouseId.toString();
      }
      
      // Fetch orders from Veeqo API using the Netlify Function
      const ordersData = await this.makeNetlifyFunctionRequest<VeeqoOrder[]>('orders', params);
      
      console.log(`📦 Found ${ordersData.length} orders from Veeqo API for status "${status}"`);
      
      // Convert Veeqo orders to our Order format
      const convertedOrders: Order[] = [];
      
      for (let i = 0; i < ordersData.length; i++) {
        const veeqoOrder = ordersData[i];
        console.log(`🔍 Processing order ${i + 1}/${ordersData.length}:`, {
          id: veeqoOrder.id,
          number: veeqoOrder.number,
          customerName: `${veeqoOrder.customer.first_name} ${veeqoOrder.customer.last_name}`,
          lineItemsCount: veeqoOrder.line_items?.length || 0,
          status: veeqoOrder.status
        });
        
        // Extract order-level information
        const orderNumber = veeqoOrder.number || `Order-${veeqoOrder.id}`;
        const customerName = `${veeqoOrder.customer.first_name} ${veeqoOrder.customer.last_name}`.trim() || 
                           'Unknown Customer';
        
        // Extract buyer postcode from delivery address
        const buyerPostcode = veeqoOrder.deliver_to?.zip?.replace(/\s/g, '') || '';
        
        // Handle line items (this is where the actual products are)
        const lineItems = veeqoOrder.line_items || [];
        
        if (!Array.isArray(lineItems) || lineItems.length === 0) {
          console.log(`⚠️ No line items found for order ${orderNumber}`);
          continue;
        }
        
        console.log(`📦 Processing ${lineItems.length} line items for order ${orderNumber}`);
        
        for (let j = 0; j < lineItems.length; j++) {
          const item = lineItems[j];
          
          const sku = item.sellable?.sku_code || `SKU-${orderNumber}-${j + 1}`;
          const quantity = parseInt(String(item.quantity || '1'));
          const productName = item.sellable?.product_title || '';
          
          // Get the primary image
          const images = item.sellable?.images || [];
          const primaryImage = images.find(img => img.position === 1) || images[0];
          const imageUrl = primaryImage?.src || '';
          
          // Get warehouse location and stock info
          const inventoryEntries = item.sellable?.inventory_entries || [];
          let location = 'Not specified';
          let remainingStock: number | undefined = undefined;
          
          if (inventoryEntries.length > 0) {
            // Use the first inventory entry or find one matching the warehouse
            const inventoryEntry = warehouseId 
              ? inventoryEntries.find(entry => entry.warehouse_id === warehouseId) || inventoryEntries[0]
              : inventoryEntries[0];
            
            location = inventoryEntry.location || inventoryEntry.warehouse_name || 'Not specified';
            remainingStock = inventoryEntry.available || 0;
          }
          
          const order: Order = {
            orderNumber: String(orderNumber),
            customerName: String(customerName),
            sku: String(sku),
            quantity: isNaN(quantity) ? 1 : quantity,
            location: String(location),
            imageUrl: String(imageUrl),
            additionalDetails: String(productName),
            buyerPostcode: String(buyerPostcode),
            remainingStock: remainingStock,
            completed: false,
            // Add Veeqo-specific data for updates
            veeqoOrderId: String(veeqoOrder.id || ''),
            veeqoItemId: String(item.id || ''),
          };

          console.log(`✅ Converted order item ${j + 1}:`, {
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            sku: order.sku,
            quantity: order.quantity,
            location: order.location,
            buyerPostcode: order.buyerPostcode,
            remainingStock: order.remainingStock,
            hasImage: !!order.imageUrl,
            status: status
          });

          convertedOrders.push(order);
        }
      }
      
      console.log(`✅ Successfully converted ${convertedOrders.length} order items for status "${status}"`);
      return convertedOrders;
    } catch (error) {
      console.error('❌ Error fetching orders from Veeqo:', error);
      throw error;
    }
  }

  async updateOrderStatus(orderId: string, status: 'shipped' | 'cancelled'): Promise<void> {
    try {
      console.log(`🔄 Updating order ${orderId} to status: ${status}`);
      
      // For now, we'll just log this since the Netlify function is read-only
      // In a full implementation, you'd need a separate function for updates
      console.log(`⚠️ Order status update not implemented yet - would update order ${orderId} to ${status}`);
      
      // TODO: Implement order status updates via a separate Netlify function
      // This would require a POST endpoint that can handle order updates
      
    } catch (error) {
      console.error('❌ Error updating order status:', error);
      throw error;
    }
  }

  async searchOrdersByCustomer(customerName: string, status: string = 'allocated'): Promise<Order[]> {
    try {
      console.log(`🔍 Searching orders for customer: ${customerName} with status: ${status}`);
      
      const params: Record<string, string> = {
        page_size: '50',
        status: status,
        customer_name: customerName
      };
      
      const ordersData = await this.makeNetlifyFunctionRequest<VeeqoOrder[]>('orders', params);
      
      // Filter orders by customer name (client-side filtering as backup)
      const filteredOrders = ordersData.filter(order => {
        const customer = `${order.customer.first_name} ${order.customer.last_name}`;
        return customer.toLowerCase().includes(customerName.toLowerCase());
      });
      
      console.log(`🔍 Found ${filteredOrders.length} orders matching customer: ${customerName} with status: ${status}`);
      
      // Convert to our Order format (similar to getOrdersByStatus)
      const convertedOrders: Order[] = [];
      
      for (const veeqoOrder of filteredOrders) {
        const orderNumber = veeqoOrder.number || `Order-${veeqoOrder.id}`;
        const customer = `${veeqoOrder.customer.first_name} ${veeqoOrder.customer.last_name}`.trim();
        const buyerPostcode = veeqoOrder.deliver_to?.zip?.replace(/\s/g, '') || '';
        
        const lineItems = veeqoOrder.line_items || [];
        
        for (const item of lineItems) {
          const sku = item.sellable?.sku_code || 'Unknown SKU';
          const quantity = parseInt(String(item.quantity || '1'));
          const productName = item.sellable?.product_title || '';
          
          const images = item.sellable?.images || [];
          const primaryImage = images.find(img => img.position === 1) || images[0];
          const imageUrl = primaryImage?.src || '';
          
          const inventoryEntries = item.sellable?.inventory_entries || [];
          let location = 'Not specified';
          let remainingStock: number | undefined = undefined;
          
          if (inventoryEntries.length > 0) {
            const inventoryEntry = inventoryEntries[0];
            location = inventoryEntry.location || inventoryEntry.warehouse_name || 'Not specified';
            remainingStock = inventoryEntry.available || 0;
          }

          const order: Order = {
            orderNumber: String(orderNumber),
            customerName: String(customer),
            sku: String(sku),
            quantity: isNaN(quantity) ? 1 : quantity,
            location: String(location),
            imageUrl: String(imageUrl),
            additionalDetails: String(productName),
            buyerPostcode: String(buyerPostcode),
            remainingStock: remainingStock,
            completed: false,
            veeqoOrderId: String(veeqoOrder.id || ''),
            veeqoItemId: String(item.id || ''),
          };

          convertedOrders.push(order);
        }
      }
      
      return convertedOrders;
    } catch (error) {
      console.error('❌ Error searching orders by customer:', error);
      throw error;
    }
  }
}

export const veeqoApi = new VeeqoApiService();