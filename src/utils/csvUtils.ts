import { Order } from '../types/Order';
import { CsvColumnMapping, CsvField, SkuImageMap } from '../types/Csv';

/**
 * Robust CSV parser that handles quoted fields, commas within quotes, and newlines
 * @param csvText The raw CSV text content
 * @returns A 2D array where each inner array represents a row of parsed values
 */
function parseCsv(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;

  while (i < csvText.length) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Handle escaped quotes ("")
        currentField += '"';
        i += 2; // Skip both quotes
        continue;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      // End of row
      if (currentField || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        if (currentRow.some(field => field.length > 0)) {
          // Only add non-empty rows
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      }
      
      // Skip \r\n combinations
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
    } else if (char !== '\r') {
      // Add character to current field (skip standalone \r)
      currentField += char;
    }
    
    i++;
  }

  // Handle the last field and row
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(field => field.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Parses a SKU-Image CSV file and returns a map of SKU to image URL.
 * Expected format: First column = SKU, Second column = Image URL
 *
 * @param file The SKU-Image CSV file to parse.
 * @returns A Promise that resolves to a SkuImageMap object.
 */
export const parseSkuImageCsv = async (file: File): Promise<SkuImageMap> => {
  console.log('🖼️ Starting SKU-Image CSV parsing:', file.name);
  
  const text = await file.text();
  const allRows = parseCsv(text);

  console.log(`📄 SKU-Image CSV file has ${allRows.length} rows (including header)`);

  if (allRows.length === 0) {
    console.warn('⚠️ SKU-Image CSV file is empty');
    return {};
  }

  // Skip header row if it exists
  const dataRows = allRows.length > 1 && 
    (allRows[0][0]?.toLowerCase().includes('sku') || allRows[0][1]?.toLowerCase().includes('image'))
    ? allRows.slice(1) 
    : allRows;

  console.log(`📄 Processing ${dataRows.length} data rows from SKU-Image CSV`);

  const skuImageMap: SkuImageMap = {};
  let processedCount = 0;

  for (let i = 0; i < dataRows.length; i++) {
    const values = dataRows[i];
    const rowNumber = i + (allRows.length > dataRows.length ? 2 : 1); // Account for header
    
    if (values.length < 2) {
      console.warn(`⚠️ Skipping row ${rowNumber} - insufficient columns (need at least 2)`);
      continue;
    }

    const sku = values[0]?.trim();
    const imageUrl = values[1]?.trim();

    if (!sku || !imageUrl) {
      console.warn(`⚠️ Skipping row ${rowNumber} - missing SKU or image URL`);
      continue;
    }

    // Validate that the image URL looks like a URL
    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://') && !imageUrl.startsWith('data:')) {
      console.warn(`⚠️ Row ${rowNumber} - image URL doesn't look like a valid URL: ${imageUrl.substring(0, 50)}...`);
      // Still add it in case it's a relative URL or other valid format
    }

    skuImageMap[sku] = imageUrl;
    processedCount++;

    console.log(`✅ Row ${rowNumber}: Mapped SKU "${sku}" to image URL`);
  }

  console.log(`✅ Successfully processed ${processedCount} SKU-Image mappings from ${dataRows.length} rows`);
  console.log(`📊 Sample mappings:`, Object.keys(skuImageMap).slice(0, 5).map(sku => ({ sku, hasUrl: !!skuImageMap[sku] })));

  return skuImageMap;
};

/**
 * Parses a CSV file and returns an array of Order objects based on the provided column mappings.
 * Groups orders by order number and customer name, preserving the original CSV order.
 * Uses SKU-Image map as fallback for image URLs.
 *
 * @param file The CSV file to parse.
 * @param mappings An object mapping Order properties to CSV column headers.
 * @param skuImageMap Optional map of SKU to image URL for fallback.
 * @returns A Promise that resolves to an array of Order objects.
 */
export const parseCsvFile = async (
  file: File, 
  mappings: CsvColumnMapping, 
  skuImageMap?: SkuImageMap
): Promise<Order[]> => {
  console.log('🔍 Starting CSV parsing with mappings:', mappings);
  console.log('🖼️ SKU-Image map available:', !!skuImageMap, skuImageMap ? `(${Object.keys(skuImageMap).length} entries)` : '');
  
  const text = await file.text();
  const allRows = parseCsv(text);

  console.log(`📄 CSV file has ${allRows.length} rows (including header)`);

  if (allRows.length === 0) {
    console.warn('⚠️ CSV file is empty');
    return [];
  }

  const headers = allRows[0];
  console.log('📋 CSV headers found:', headers);
  
  // Create a mapping from field names to column indices for faster lookup
  const columnIndices: { [key: string]: number } = {};
  
  for (const fieldKey in mappings) {
    const csvColumnHeader = mappings[fieldKey];
    if (csvColumnHeader && csvColumnHeader.trim() !== '') {
      const headerIndex = headers.findIndex(h => h.toLowerCase().trim() === csvColumnHeader.toLowerCase().trim());
      if (headerIndex !== -1) {
        columnIndices[fieldKey] = headerIndex;
        console.log(`📍 Mapped ${fieldKey} to column index ${headerIndex} (${csvColumnHeader})`);
      } else {
        console.warn(`⚠️ Column "${csvColumnHeader}" not found for field "${fieldKey}"`);
      }
    }
  }

  console.log('📍 Column indices mapping:', columnIndices);
  
  // Process all data rows (skip header)
  const dataRows = allRows.slice(1);
  const rawOrders: any[] = [];
  let imageUrlFallbackCount = 0;

  for (let i = 0; i < dataRows.length; i++) {
    const values = dataRows[i];
    const rowNumber = i + 2; // +2 because we skipped header and arrays are 0-indexed
    
    console.log(`🔍 Processing row ${rowNumber}/${allRows.length}: ${values.length} columns`);
    console.log(`📝 Row ${rowNumber} values:`, values.slice(0, 10), values.length > 10 ? '...' : '');

    if (values.length === 0) {
      console.warn(`⚠️ Skipping empty row ${rowNumber}`);
      continue;
    }

    // Extract values using the column indices
    const extractValue = (fieldKey: string): string => {
      const columnIndex = columnIndices[fieldKey];
      if (columnIndex !== undefined && columnIndex < values.length) {
        const value = values[columnIndex]?.trim() || '';
        return value;
      }
      return '';
    };

    // Extract all the values using ONLY the mapped columns
    const orderNumber = extractValue('orderNumber') || `Row-${i + 1}`;
    const customerFirstName = extractValue('customerFirstName');
    const customerLastName = extractValue('customerLastName');
    const sku = extractValue('sku');
    const quantityStr = extractValue('quantity');
    const location = extractValue('location');
    const buyerPostcode = extractValue('buyerPostcode');
    let imageUrl = extractValue('imageUrl'); // Get from CSV first
    const remainingStockStr = extractValue('remainingStock');

    console.log(`🔍 Row ${rowNumber} extracted values:`, {
      orderNumber,
      customerFirstName,
      customerLastName,
      sku,
      quantityStr,
      location,
      buyerPostcode: buyerPostcode ? buyerPostcode.substring(0, 10) + '...' : '',
      hasImageUrl: !!imageUrl,
      remainingStockStr
    });

    // Build customer name from first and last name
    let customerName = '';
    if (customerFirstName || customerLastName) {
      customerName = `${customerFirstName} ${customerLastName}`.trim();
      console.log(`👤 Row ${rowNumber}: Built customer name "${customerName}" from first="${customerFirstName}" last="${customerLastName}"`);
    }

    // Validate that we have the minimum required data
    if (!customerName || !sku) {
      console.warn(`⚠️ Skipping row ${rowNumber} - missing required data:`, {
        customerName: customerName || 'MISSING',
        sku: sku || 'MISSING',
        hasFirstName: !!customerFirstName,
        hasLastName: !!customerLastName,
        orderNumber: orderNumber,
        rowIndex: i,
        columnCount: values.length,
        mappedColumns: {
          customerFirstName: mappings.customerFirstName,
          customerLastName: mappings.customerLastName,
          sku: mappings.sku
        },
        extractedValues: {
          customerFirstName,
          customerLastName,
          sku
        }
      });
      continue;
    }

    // Handle image URL fallback logic
    if (!imageUrl && skuImageMap && sku) {
      const fallbackImageUrl = skuImageMap[sku];
      if (fallbackImageUrl) {
        imageUrl = fallbackImageUrl;
        imageUrlFallbackCount++;
        console.log(`🖼️ Row ${rowNumber}: Using fallback image URL for SKU "${sku}"`);
      } else {
        console.log(`🖼️ Row ${rowNumber}: No fallback image URL found for SKU "${sku}"`);
      }
    }

    // Parse quantity and remaining stock
    const quantity = quantityStr ? Math.max(1, parseInt(quantityStr, 10) || 1) : 1;
    const remainingStock = remainingStockStr ? parseInt(remainingStockStr, 10) : undefined;

    // Store raw order data with original index for sorting
    rawOrders.push({
      orderNumber: orderNumber,
      customerName: customerName,
      sku: sku,
      quantity: quantity,
      location: location || 'Unknown',
      buyerPostcode: buyerPostcode ? buyerPostcode.replace(/\s/g, '') : '', // Normalize postcode
      imageUrl: imageUrl,
      remainingStock: remainingStock,
      originalIndex: i, // Store original CSV row index
    });

    console.log(`✅ Row ${rowNumber}: Successfully processed order:`, {
      orderNumber: orderNumber,
      customerName: customerName,
      sku: sku,
      quantity: quantity,
      location: location || 'Unknown',
      buyerPostcode: buyerPostcode ? buyerPostcode.replace(/\s/g, '') : '',
      hasImageUrl: !!imageUrl,
      imageSource: !extractValue('imageUrl') && imageUrl ? 'fallback' : 'csv',
      remainingStock: remainingStock
    });
  }

  console.log(`📊 Collected ${rawOrders.length} valid orders from ${dataRows.length} CSV rows`);
  console.log(`🖼️ Used fallback image URLs for ${imageUrlFallbackCount} orders`);

  if (rawOrders.length === 0) {
    console.error('❌ No valid orders found in CSV. Check your column mappings and ensure the CSV has data rows.');
    throw new Error('No valid orders found in CSV file. Please check your column mappings and ensure the CSV contains valid data.');
  }

  // Group by order number and customer name, then create individual order items
  const orderGroups = new Map<string, any[]>();
  
  for (const rawOrder of rawOrders) {
    // Create a grouping key based on order number AND customer name
    const groupKey = `${rawOrder.orderNumber}_${rawOrder.customerName}`;
    
    if (!orderGroups.has(groupKey)) {
      orderGroups.set(groupKey, []);
    }
    
    orderGroups.get(groupKey)!.push(rawOrder);
  }

  console.log(`📊 Grouped ${rawOrders.length} orders into ${orderGroups.size} order groups`);

  // Create final order objects, preserving original CSV order
  const finalOrders: Order[] = [];
  
  // Sort groups by the minimum original index to preserve CSV order
  const sortedGroups = Array.from(orderGroups.entries()).sort((a, b) => {
    const minIndexA = Math.min(...a[1].map(order => order.originalIndex));
    const minIndexB = Math.min(...b[1].map(order => order.originalIndex));
    return minIndexA - minIndexB;
  });

  for (const [groupKey, groupOrders] of sortedGroups) {
    // Sort items within each group by original index
    groupOrders.sort((a, b) => a.originalIndex - b.originalIndex);
    
    console.log(`📦 Processing group "${groupKey}" with ${groupOrders.length} items`);
    
    for (const rawOrder of groupOrders) {
      const order: Order = {
        orderNumber: rawOrder.orderNumber,
        customerName: rawOrder.customerName,
        sku: rawOrder.sku,
        quantity: rawOrder.quantity,
        location: rawOrder.location,
        buyerPostcode: rawOrder.buyerPostcode,
        imageUrl: rawOrder.imageUrl,
        remainingStock: rawOrder.remainingStock,
        completed: false,
      };

      finalOrders.push(order);
      
      console.log(`✅ Created final order:`, {
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        sku: order.sku,
        quantity: order.quantity,
        location: order.location,
        buyerPostcode: order.buyerPostcode,
        hasImageUrl: !!order.imageUrl,
        remainingStock: order.remainingStock
      });
    }
  }

  console.log(`✅ Successfully processed ${finalOrders.length} final orders`);
  console.log(`🖼️ Final image URL statistics: ${finalOrders.filter(o => !!o.imageUrl).length} orders have images (${imageUrlFallbackCount} from fallback)`);

  // Log summary
  const customerCounts = new Map<string, number>();
  const orderCounts = new Map<string, number>();
  
  for (const order of finalOrders) {
    customerCounts.set(order.customerName, (customerCounts.get(order.customerName) || 0) + 1);
    orderCounts.set(order.orderNumber, (orderCounts.get(order.orderNumber) || 0) + 1);
  }

  console.log('📊 Final Processing Summary:');
  console.log(`  📋 Total orders: ${finalOrders.length}`);
  console.log(`  👥 Unique customers: ${customerCounts.size}`);
  console.log(`  🔢 Unique order numbers: ${orderCounts.size}`);
  console.log(`  🖼️ Orders with images: ${finalOrders.filter(o => !!o.imageUrl).length}`);
  console.log(`  🖼️ Images from fallback: ${imageUrlFallbackCount}`);
  
  // Show customers with multiple items
  for (const [customer, count] of customerCounts.entries()) {
    if (count > 1) {
      console.log(`  👤 ${customer}: ${count} items`);
    }
  }

  // Show first few customer names for verification
  console.log('👥 First 10 customer names:', finalOrders.slice(0, 10).map(o => o.customerName));

  return finalOrders;
};

/**
 * Reads the headers from a CSV file and returns an array of column headers.
 *
 * @param file The CSV file to read.
 * @returns A Promise that resolves to an array of string headers.
 */
export const getCsvHeaders = async (file: File): Promise<string[]> => {
  const text = await file.text();
  const allRows = parseCsv(text);
  
  if (allRows.length > 0) {
    return allRows[0];
  }
  
  return [];
};