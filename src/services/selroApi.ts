import { SelroConfig, SelroFolder, SelroOrder, SelroProduct, SelroApiResponse, SelroOrderItem } from '../types/Selro';
import { Order } from '../types/Order';

class SelroApiService {
  private config: SelroConfig | null = null;

  setConfig(config: SelroConfig) {
    this.config = config;
    // Save to localStorage for persistence
    localStorage.setItem('selroConfig', JSON.stringify(config));
  }

  getConfig(): SelroConfig | null {
    if (this.config) return this.config;
    
    // Try to load from localStorage
    const saved = localStorage.getItem('selroConfig');
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
      throw new Error('Selro API not configured. Please add your API key and secret in settings.');
    }

    // Build the Netlify Function URL
    const functionUrl = new URL('/.netlify/functions/getSelroOrders', window.location.origin);
    
    // Add parameters
    functionUrl.searchParams.set('endpoint', endpoint);
    if (additionalParams) {
      Object.entries(additionalParams).forEach(([key, value]) => {
        functionUrl.searchParams.set(key, value);
      });
    }
    
    const maskedUrl = functionUrl.toString();
    console.log('🔗 Making request via Netlify Function:', maskedUrl);
    
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
          throw new Error('Selro API credentials not configured on the server. Please contact the administrator to set up SELRO_API_KEY and SELRO_API_SECRET environment variables.');
        } else if (response.status === 403) {
          throw new Error(`Access forbidden (403). Please verify:
• Your API key and secret are correct and active
• Your API credentials have permission to access orders  
• Your Selro account has API access enabled

API Key format should be: app4_key[uuid]
API Secret format should be: app4_secret[uuid]`);
        } else if (response.status === 401) {
          throw new Error('Unauthorized (401). Please check your API key and secret are valid.');
        } else if (response.status === 404) {
          throw new Error('API endpoint not found (404). Please contact Selro support to confirm the correct endpoint.');
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
      if (typeof responseData === 'object') {
        console.log('✅ Response keys:', Object.keys(responseData));
        if (responseData.orders && Array.isArray(responseData.orders)) {
          console.log('✅ Found orders array with', responseData.orders.length, 'orders');
        }
      }
      
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
      console.log('🔍 Testing Selro API connection via Netlify Function...');
      
      // Test with a small request to verify connection
      const response = await this.makeNetlifyFunctionRequest('orders', { 
        pagesize: '1' 
      });
      
      console.log('✅ Selro API connection test successful via Netlify Function');
      return true;
    } catch (error) {
      console.error('❌ Selro API connection test failed:', error);
      return false;
    }
  }

  async getFolders(): Promise<SelroFolder[]> {
    try {
      console.log('🔍 Setting up folders for Selro API...');
      
      // Create a list of common processing folder names that users might have
      const commonFolders: SelroFolder[] = [
        {
          id: 'all',
          name: 'All Orders',
          orderCount: 0,
          description: 'All available orders from Selro'
        },
        {
          id: 'PCK Picked',
          name: 'PCK Picked',
          orderCount: 0,
          description: 'Orders in PCK Picked folder'
        },
        {
          id: 'Ready to Pick',
          name: 'Ready to Pick',
          orderCount: 0,
          description: 'Orders ready for picking'
        },
        {
          id: 'In Progress',
          name: 'In Progress',
          orderCount: 0,
          description: 'Orders currently being processed'
        },
        {
          id: 'Urgent',
          name: 'Urgent',
          orderCount: 0,
          description: 'Urgent orders requiring immediate attention'
        },
        {
          id: 'Priority',
          name: 'Priority',
          orderCount: 0,
          description: 'Priority orders'
        }
      ];

      // Try to get order counts for each folder
      for (const folder of commonFolders) {
        try {
          console.log(`🔍 Checking order count for folder: ${folder.name}`);
          
          const params: Record<string, string> = { 
            pagesize: '1'
          };
          
          // Add tag parameter for non-"all" folders
          if (folder.id !== 'all') {
            params.tag = folder.name;
          }
          
          const ordersResponse = await this.makeNetlifyFunctionRequest<any>('orders', params);
          
          // Handle the actual Selro response format
          let orderCount = 0;
          if (ordersResponse && Array.isArray(ordersResponse.orders)) {
            orderCount = ordersResponse.orders.length;
            console.log(`📊 Folder "${folder.name}" has ${orderCount} orders`);
          } else if (ordersResponse && typeof ordersResponse.total === 'number') {
            orderCount = ordersResponse.total;
            console.log(`📊 Folder "${folder.name}" total: ${orderCount}`);
          }
          
          folder.orderCount = orderCount;
        } catch (error) {
          console.warn(`⚠️ Could not get order count for folder "${folder.name}":`, error);
          // Don't throw here, just use 0 count
          folder.orderCount = 0;
        }
      }
      
      // Filter out folders with 0 orders (except "All Orders")
      const availableFolders = commonFolders.filter(folder => 
        folder.id === 'all' || folder.orderCount > 0
      );
      
      console.log(`✅ Found ${availableFolders.length} available folders`);
      return availableFolders;
    } catch (error) {
      console.error('❌ Error setting up folders:', error);
      
      // Return basic default folder even if we can't get order counts
      return [{
        id: 'all',
        name: 'All Orders',
        orderCount: 0,
        description: 'All available orders from Selro'
      }];
    }
  }

  async getOrdersByTag(tag: string): Promise<Order[]> {
    try {
      console.log(`🔍 Fetching orders from Selro API with tag: "${tag}"`);
      
      const params: Record<string, string> = {
        pagesize: '50' // Increase page size for better performance
      };
      
      // Add tag parameter if not "all"
      if (tag !== 'all' && tag !== 'All Orders') {
        params.tag = tag;
      }
      
      // Fetch orders from Selro API using the Netlify Function
      const ordersData = await this.makeNetlifyFunctionRequest<any>('orders', params);
      
      console.log('📦 Raw orders response type:', typeof ordersData);
      console.log('📦 Raw orders response keys:', Object.keys(ordersData || {}));
      
      // Handle the actual Selro response format based on the documentation
      let orders: any[] = [];
      if (ordersData && Array.isArray(ordersData.orders)) {
        orders = ordersData.orders;
        console.log('📦 Found orders in .orders property');
      } else if (Array.isArray(ordersData)) {
        orders = ordersData;
        console.log('📦 Orders data is direct array');
      } else if (ordersData && typeof ordersData === 'object') {
        console.log('📦 Single order object received, treating as array');
        orders = [ordersData];
      } else {
        console.warn('⚠️ Unexpected response format from Selro API:', ordersData);
        return [];
      }
      
      console.log(`📦 Found ${orders.length} orders from Selro API for tag "${tag}"`);
      
      // Convert Selro orders to our Order format based on the actual API response structure
      const convertedOrders: Order[] = [];
      
      for (let i = 0; i < orders.length; i++) {
        const selroOrder = orders[i];
        console.log(`🔍 Processing order ${i + 1}/${orders.length}:`, {
          id: selroOrder.id,
          orderId: selroOrder.orderId,
          buyerName: selroOrder.buyerName,
          shipName: selroOrder.shipName,
          channelSalesCount: selroOrder.channelSales?.length || 0,
          tags: selroOrder.tag || selroOrder.tags || selroOrder.folder || 'none'
        });
        
        // Extract order-level information based on the actual API response
        const orderNumber = selroOrder.orderId || selroOrder.id || `Order-${i + 1}`;
        const customerName = selroOrder.buyerName || 
                           selroOrder.shipName || 
                           'Unknown Customer';
        
        // Handle channelSales items (this is where the actual products are)
        const channelSales = selroOrder.channelSales || [];
        
        if (!Array.isArray(channelSales) || channelSales.length === 0) {
          console.log(`⚠️ No channelSales found for order ${orderNumber}`);
          continue;
        }
        
        console.log(`📦 Processing ${channelSales.length} channel sales items for order ${orderNumber}`);
        
        for (let j = 0; j < channelSales.length; j++) {
          const item = channelSales[j];
          
          const sku = item.sku || item.inventorysku || `SKU-${orderNumber}-${j + 1}`;
          const quantity = parseInt(String(item.quantityPurchased || '1'));
          const location = item.location || 'Not specified';
          const productName = item.title || item.customItemTitle || item.inventoryTitle || '';
          const imageUrl = item.imageUrl || '';
          
          const order: Order = {
            orderNumber: String(orderNumber),
            customerName: String(customerName),
            sku: String(sku),
            quantity: isNaN(quantity) ? 1 : quantity,
            location: String(location),
            imageUrl: String(imageUrl),
            additionalDetails: String(productName),
            completed: false,
            // Add Selro-specific data for updates
            selroOrderId: String(selroOrder.id || ''),
            selroItemId: String(item.id || ''),
          };

          console.log(`✅ Converted order item ${j + 1}:`, {
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            sku: order.sku,
            quantity: order.quantity,
            location: order.location,
            hasImage: !!order.imageUrl,
            tag: tag
          });

          convertedOrders.push(order);
        }
      }
      
      console.log(`✅ Successfully converted ${convertedOrders.length} order items for tag "${tag}"`);
      return convertedOrders;
    } catch (error) {
      console.error('❌ Error fetching orders from Selro:', error);
      throw error;
    }
  }

  // Keep the old method name for backward compatibility, but redirect to new method
  async getOrdersFromFolder(folderId: string): Promise<Order[]> {
    return this.getOrdersByTag(folderId);
  }

  async updateOrderStatus(orderId: string, itemId: string, status: 'completed' | 'pending'): Promise<void> {
    try {
      console.log(`🔄 Updating order ${orderId}, item ${itemId} to status: ${status}`);
      
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

  async searchOrdersByCustomer(customerName: string, tag?: string): Promise<Order[]> {
    try {
      console.log(`🔍 Searching orders for customer: ${customerName} in tag: ${tag || 'all'}`);
      
      const params: Record<string, string> = {
        pagesize: '50'
      };
      
      // Add tag parameter if provided
      if (tag && tag !== 'all' && tag !== 'All Orders') {
        params.tag = tag;
      }
      
      const ordersData = await this.makeNetlifyFunctionRequest<any>('orders', params);
      
      // Handle response format based on actual Selro API structure
      let orders: any[] = [];
      if (ordersData && Array.isArray(ordersData.orders)) {
        orders = ordersData.orders;
      } else if (Array.isArray(ordersData)) {
        orders = ordersData;
      } else if (ordersData && typeof ordersData === 'object') {
        orders = [ordersData];
      }
      
      // Filter orders by customer name
      orders = orders.filter(order => {
        const customer = order.buyerName || order.shipName || '';
        return String(customer).toLowerCase().includes(customerName.toLowerCase());
      });
      
      console.log(`🔍 Found ${orders.length} orders matching customer: ${customerName} in tag: ${tag || 'all'}`);
      
      // Convert to our Order format (similar to getOrdersByTag)
      const convertedOrders: Order[] = [];
      
      for (const selroOrder of orders) {
        const orderNumber = selroOrder.orderId || selroOrder.id || 'Unknown';
        const customer = selroOrder.buyerName || selroOrder.shipName || 'Unknown Customer';
        
        const channelSales = selroOrder.channelSales || [];
        
        for (const item of channelSales) {
          const sku = item.sku || item.inventorysku || 'Unknown SKU';
          const quantity = parseInt(String(item.quantityPurchased || '1'));
          const location = item.location || 'Not specified';
          const productName = item.title || item.customItemTitle || '';
          const imageUrl = item.imageUrl || '';

          const order: Order = {
            orderNumber: String(orderNumber),
            customerName: String(customer),
            sku: String(sku),
            quantity: isNaN(quantity) ? 1 : quantity,
            location: String(location),
            imageUrl: String(imageUrl),
            additionalDetails: String(productName),
            completed: false,
            selroOrderId: String(selroOrder.id || ''),
            selroItemId: String(item.id || ''),
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

export const selroApi = new SelroApiService();