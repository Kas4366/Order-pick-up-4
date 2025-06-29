exports.handler = async function (event, context) {
  const API_KEY = process.env.VEEQO_API_KEY;

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
  if (!API_KEY) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Veeqo API credentials not configured. Please set VEEQO_API_KEY environment variable.' 
      }),
    };
  }

  try {
    // Parse query parameters for additional options
    const queryParams = event.queryStringParameters || {};
    const pageSize = queryParams.page_size || '20';
    const page = queryParams.page || '1';
    const endpoint = queryParams.endpoint || 'orders';
    const status = queryParams.status || 'allocated';
    const warehouseId = queryParams.warehouse_id;
    const customerName = queryParams.customer_name;

    // Build the Veeqo API URL
    let url = `https://api.veeqo.com/${endpoint}?page_size=${pageSize}&page=${page}`;
    
    // Add status filter for orders
    if (endpoint === 'orders') {
      url += `&status=${encodeURIComponent(status)}`;
      
      // Add warehouse filter if provided
      if (warehouseId) {
        url += `&warehouse_id=${encodeURIComponent(warehouseId)}`;
      }
      
      // Add customer name filter if provided
      if (customerName) {
        url += `&customer_name=${encodeURIComponent(customerName)}`;
      }
    }
    
    console.log('Making request to Veeqo API:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-api-key': API_KEY,
        'User-Agent': 'OrderPick-App/1.0',
      },
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('Veeqo API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText.substring(0, 500),
      });
      
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          error: `Veeqo API Error (${response.status}): ${response.statusText}`,
          details: responseText,
        }),
      };
    }

    // Parse JSON response
    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      console.error('Failed to parse Veeqo API response as JSON:', parseError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Invalid JSON response from Veeqo API',
          rawResponse: responseText.substring(0, 500),
        }),
      };
    }

    console.log('Successfully fetched data from Veeqo API');

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
        error: 'Failed to fetch from Veeqo API',
        message: error.message 
      }),
    };
  }
};