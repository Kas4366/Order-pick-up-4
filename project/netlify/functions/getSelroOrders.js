exports.handler = async function (event, context) {
  const API_KEY = process.env.SELRO_API_KEY;
  const API_SECRET = process.env.SELRO_API_SECRET;

  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Check if API credentials are configured
  if (!API_KEY || !API_SECRET) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Selro API credentials not configured. Please set SELRO_API_KEY and SELRO_API_SECRET environment variables.' 
      }),
    };
  }

  try {
    // Parse query parameters for additional options
    const queryParams = event.queryStringParameters || {};
    const pagesize = queryParams.pagesize || '100'; // Increased default page size
    const page = queryParams.page || '1';
    const endpoint = queryParams.endpoint || 'orders';
    const tag = queryParams.tag; // Tag filtering parameter
    const sortBy = queryParams.sortBy || 'created'; // Sort by creation date
    const sortOrder = queryParams.sortOrder || 'desc'; // Most recent first

    // Build the Selro API URL with improved parameters
    let url = `https://api.selro.com/4/${endpoint}?key=${API_KEY}&secret=${API_SECRET}&pagesize=${pagesize}&page=${page}`;
    
    // Add sorting to get most recent orders first
    url += `&sortby=${sortBy}&sortorder=${sortOrder}`;
    
    // Add date filter to get recent orders (last 30 days by default)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateFilter = thirtyDaysAgo.toISOString().split('T')[0]; // YYYY-MM-DD format
    url += `&createdfrom=${dateFilter}`;
    
    // Add tag filter if provided
    if (tag && tag !== 'all' && tag !== 'All Orders') {
      // For Selro API, tags are typically filtered using custom fields or specific parameters
      // The exact parameter name may vary - common ones are 'tag', 'custom_field', or 'folder'
      url += `&tag=${encodeURIComponent(tag)}`;
    }
    
    console.log('Making request to Selro API:', url.replace(/key=[^&]+/, 'key=***').replace(/secret=[^&]+/, 'secret=***'));

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'OrderPick-App/1.0',
      },
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('Selro API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText.substring(0, 500),
      });
      
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          error: `Selro API Error (${response.status}): ${response.statusText}`,
          details: responseText,
        }),
      };
    }

    // Parse JSON response
    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      console.error('Failed to parse Selro API response as JSON:', parseError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Invalid JSON response from Selro API',
          rawResponse: responseText.substring(0, 500),
        }),
      };
    }

    // Log response details for debugging
    console.log('Selro API Response Summary:', {
      hasOrders: !!(data.orders),
      orderCount: data.orders ? data.orders.length : 0,
      totalCount: data.total || 'unknown',
      currentPage: data.page || page,
      pageSize: data.pagesize || pagesize,
      hasMorePages: data.hasmore || false
    });

    // If tag filtering is requested but the API doesn't support it directly,
    // we need to filter the results on the server side
    if (tag && tag !== 'all' && tag !== 'All Orders' && data.orders) {
      console.log(`Filtering orders by tag: "${tag}"`);
      
      const originalCount = data.orders.length;
      
      // Filter orders that have the specified tag
      data.orders = data.orders.filter(order => {
        // Check various possible tag fields in the order object
        const orderTags = [
          order.tag,
          order.tags,
          order.folder,
          order.folderName,
          order.customField1,
          order.customField2,
          order.customField3,
          order.processingFolder,
          order.status,
          order.orderStatus,
          order.notes
        ].filter(Boolean); // Remove null/undefined values
        
        // Convert all tags to strings and check for matches
        const tagStrings = orderTags.map(t => String(t).toLowerCase());
        const searchTag = tag.toLowerCase();
        
        // Check if any of the order's tags match the requested tag
        const hasMatchingTag = tagStrings.some(orderTag => 
          orderTag === searchTag || 
          orderTag.includes(searchTag) ||
          searchTag.includes(orderTag)
        );
        
        if (hasMatchingTag) {
          console.log(`Order ${order.id || order.orderId} matches tag "${tag}"`);
        }
        
        return hasMatchingTag;
      });
      
      console.log(`Filtered ${originalCount} orders down to ${data.orders.length} orders with tag "${tag}"`);
    }

    // Add metadata about the request for debugging
    data._metadata = {
      requestedAt: new Date().toISOString(),
      pageSize: pagesize,
      page: page,
      sortBy: sortBy,
      sortOrder: sortOrder,
      dateFilter: dateFilter,
      tag: tag || 'none',
      filteredCount: data.orders ? data.orders.length : 0
    };

    console.log('Successfully fetched and processed data from Selro API');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('Function error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to fetch from Selro API',
        message: error.message 
      }),
    };
  }
};