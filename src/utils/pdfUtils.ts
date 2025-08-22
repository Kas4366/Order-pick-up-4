import { Order } from '../types/Order';
import { findImageFile } from './imageUtils';

export const parseHtmlContent = async (
  file: File, 
  imagesFolderHandle?: FileSystemDirectoryHandle,
  fileDate?: string
): Promise<Order[]> => {
  try {
    console.log('🔍 Starting HTML parsing...');
    console.log('📁 Images folder handle:', imagesFolderHandle ? `✅ Available (${imagesFolderHandle.name})` : '❌ Not available');
    console.log('📅 File date:', fileDate || 'Not provided');
    
    const text = await file.text();
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    
    const rawOrders: any[] = [];
    
    // Find all order rows (they are in pairs - header row and details row)
    const orderRows = doc.querySelectorAll('tr.shippeditem');
    console.log(`📋 Found ${orderRows.length} order rows in HTML`);
    
    for (let orderIndex = 0; orderIndex < orderRows.length; orderIndex++) {
      const row = orderRows[orderIndex];
      
      // Get the next row which contains the order details
      const detailsRow = row.nextElementSibling;
      if (!detailsRow) continue;
      
      // Find the details table within the details row
      const detailsTable = detailsRow.querySelector('table');
      if (!detailsTable) continue;
      
      // Find all order details rows within the details table (there might be multiple items per order)
      const orderDetailsRows = detailsTable.querySelectorAll('tr.shippeditem');
      if (!orderDetailsRows || orderDetailsRows.length === 0) continue;
      
      // Extract order-level information from the main row
      const orderNumber = row.querySelector('td')?.textContent?.trim() || `Order-${orderIndex + 1}`;
      
      // Extract buyer postcode from shipping address (4th column in main order row)
      const shippingAddressCell = row.querySelector('td:nth-child(4)');
      let buyerPostcode = '';
      
      if (shippingAddressCell) {
        const addressText = shippingAddressCell.textContent || '';
        console.log(`🏠 Raw shipping address for order ${orderNumber}:`, addressText);
        
        // Extract UK postcode from the address using regex
        const postcodeMatch = addressText.match(/\b([A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2})\b/);
        if (postcodeMatch) {
          buyerPostcode = postcodeMatch[1].replace(/\s/g, ''); // Remove spaces
          console.log(`📮 Extracted buyer postcode for order ${orderNumber}: ${buyerPostcode}`);
        } else {
          console.log(`⚠️ No postcode found in address for order ${orderNumber}`);
        }
      }
      
      console.log(`📦 Processing order ${orderNumber} with ${orderDetailsRows.length} items`);
      
      // Process each item in this order
      for (let itemIndex = 0; itemIndex < orderDetailsRows.length; itemIndex++) {
        const orderDetails = orderDetailsRows[itemIndex];
        
        // Extract item-specific information
        const sku = orderDetails.querySelector('td:nth-child(2)')?.textContent?.trim().replace(/\s+/g, ' ') || `SKU-${orderNumber}-${itemIndex + 1}`;
        const quantityText = orderDetails.querySelector('td span strong')?.textContent?.trim() || '0';
        const quantity = parseInt(quantityText);
        const customerName = orderDetails.querySelector('td:nth-child(7)')?.textContent?.trim() || 'Unknown Customer';
        
        // Extract location from the correct cell (5th column)
        const locationCell = orderDetails.querySelector('td:nth-child(5)');
        const location = locationCell?.textContent?.trim() || 'Not specified';

        // Extract order value from the 6th column
        let orderValue: number | undefined = undefined;
        const orderValueCell = orderDetails.querySelector('td:nth-child(6)');
        if (orderValueCell) {
          const valueText = orderValueCell.textContent?.trim() || '';
          console.log(`💰 Raw order value text for ${sku}:`, valueText);
          
          // Clean the value text - remove currency symbols, commas, and extra spaces
          const cleanedValue = valueText
            .replace(/[£$€¥₹₽¢]/g, '') // Remove common currency symbols
            .replace(/[,\s]/g, '') // Remove commas and spaces
            .replace(/[^\d.-]/g, ''); // Keep only digits, dots, and minus signs
          
          if (cleanedValue) {
            const parsedValue = parseFloat(cleanedValue);
            if (!isNaN(parsedValue)) {
              orderValue = parsedValue;
              console.log(`💰 Extracted order value for ${sku}: ${orderValue}`);
            } else {
              console.log(`⚠️ Could not parse order value for ${sku}: "${cleanedValue}"`);
            }
          } else {
            console.log(`⚠️ No order value found for ${sku}`);
          }
        }

        // Extract channel type and channel from appropriate columns (adjust column numbers as needed)
        let channelType = '';
        let channel = '';
        let width: number | undefined = undefined;
        let weight: number | undefined = undefined;
        
        // Try to extract from additional columns if they exist
        const channelTypeCell = orderDetails.querySelector('td:nth-child(8)');
        if (channelTypeCell) {
          channelType = channelTypeCell.textContent?.trim() || '';
        }
        
        const channelCell = orderDetails.querySelector('td:nth-child(9)');
        if (channelCell) {
          channel = channelCell.textContent?.trim() || '';
        }
        
        // Try to extract width from column 10
        const widthCell = orderDetails.querySelector('td:nth-child(10)');
        if (widthCell) {
          const widthText = widthCell.textContent?.trim() || '';
          const parsedWidth = parseFloat(widthText);
          if (!isNaN(parsedWidth)) {
            width = parsedWidth;
            console.log(`📏 Extracted width for ${sku}: ${width}cm`);
          }
        }
        
        // Try to extract weight from column 11
        const weightCell = orderDetails.querySelector('td:nth-child(11)');
        if (weightCell) {
          const weightText = weightCell.textContent?.trim() || '';
          const parsedWeight = parseFloat(weightText);
          if (!isNaN(parsedWeight)) {
            weight = parsedWeight;
            console.log(`⚖️ Extracted weight for ${sku}: ${weight}g`);
          }
        }

        // Extract remaining stock information from HTML - IMPROVED LOGIC
        let remainingStock: number | undefined = undefined;
        
        // Try to find stock information in various possible locations
        const stockCells = orderDetails.querySelectorAll('td');
        
        // First, look for explicit "Stock Remaining" column or similar headers
        const headerRow = detailsTable.querySelector('tr:first-child');
        let stockColumnIndex = -1;
        
        if (headerRow) {
          const headers = headerRow.querySelectorAll('td, th');
          headers.forEach((header, index) => {
            const headerText = header.textContent?.toLowerCase() || '';
            if (headerText.includes('stock remaining') || 
                headerText.includes('remaining stock') || 
                headerText.includes('stock level') ||
                headerText.includes('available stock') ||
                headerText.includes('on hand') ||
                headerText.includes('inventory')) {
              stockColumnIndex = index;
              console.log(`📦 Found stock column at index ${index}: "${header.textContent}"`);
            }
          });
        }
        
        // If we found a stock column, extract from that specific column
        if (stockColumnIndex >= 0 && stockCells[stockColumnIndex]) {
          const stockText = stockCells[stockColumnIndex].textContent?.trim() || '';
          
          // Handle explicit zero values first
          if (stockText === '0') {
            remainingStock = 0;
            console.log(`📦 Found explicit zero stock from column ${stockColumnIndex} for ${sku}: ${remainingStock}`);
          } else {
            const stockValue = parseInt(stockText, 10);
            if (!isNaN(stockValue)) {
              remainingStock = stockValue;
              console.log(`📦 Found remaining stock from column ${stockColumnIndex} for ${sku}: ${remainingStock}`);
            } else if (stockText === '') {
              remainingStock = 0; // Empty cell means zero stock
              console.log(`📦 Found empty stock cell (treating as zero) from column ${stockColumnIndex} for ${sku}: ${remainingStock}`);
            }
          }
        }
        
        // Fallback: search all cells for stock patterns
        if (remainingStock === undefined) {
          for (const cell of stockCells) {
            const cellText = cell.textContent?.toLowerCase() || '';
            
            // Look for patterns like "Stock: 15", "Available: 8", "Remaining: 12", etc.
            const stockMatch = cellText.match(/(?:stock|available|remaining|on hand|inventory):\s*(\d+)/i);
            if (stockMatch) {
              remainingStock = parseInt(stockMatch[1], 10);
              console.log(`📦 Found remaining stock pattern for ${sku}: ${remainingStock}`);
              break;
            }
            
            // Look for standalone numbers that might represent stock
            const numberMatch = cellText.match(/^\s*(\d+)\s*$/);
            if (numberMatch && cellText !== quantityText) {
              const potentialStock = parseInt(numberMatch[1], 10);
              // Only consider if it's different from the order quantity
              if (potentialStock !== quantity) {
                remainingStock = potentialStock;
                console.log(`📦 Inferred remaining stock for ${sku}: ${remainingStock}`);
                break;
              }
            }
            
            // Handle explicit zero values
            if (cellText.trim() === '0' && cellText !== quantityText) {
              remainingStock = 0;
              console.log(`📦 Found explicit zero stock for ${sku}: ${remainingStock}`);
              break;
            }
          }
        }
        
        // If still no stock found, check if there's a pattern in the entire row text
        if (remainingStock === undefined) {
          const rowText = orderDetails.textContent || '';
          const stockPattern = rowText.match(/stock[:\s]*(\d+)/i);
          if (stockPattern) {
            remainingStock = parseInt(stockPattern[1], 10);
            console.log(`📦 Found stock in row text for ${sku}: ${remainingStock}`);
          }
        }
        
        // Log final stock result
        if (remainingStock !== undefined) {
          console.log(`✅ Final remaining stock for ${sku}: ${remainingStock}`);
        } else {
          console.log(`⚠️ No remaining stock found for ${sku}`);
        }
        
        // Extract the image URL and handle local file paths
        let imageUrl = '';
        
        // Try multiple ways to find the image element
        console.log(`🔍 Looking for image element for SKU: ${sku}`);
        
        // Method 1: Look in the first column of the order details row
        let imgElement = orderDetails.querySelector('td:first-child img');
        
        // Method 2: Look anywhere in the order details row
        if (!imgElement) {
          imgElement = orderDetails.querySelector('img');
        }
        
        // Method 3: Look in the entire details table
        if (!imgElement) {
          imgElement = detailsTable.querySelector('img');
        }
        
        // Method 4: Look in the entire details row
        if (!imgElement) {
          imgElement = detailsRow.querySelector('img');
        }
        
        // Method 5: Look in the main order row
        if (!imgElement) {
          imgElement = row.querySelector('img');
        }
        
        if (imgElement) {
          console.log(`🖼️  Found image element for SKU ${sku}`);
          const src = imgElement.getAttribute('src') || '';
          console.log(`🖼️  Image src for SKU ${sku}:`, src);
          
          if (src) {
            if (imagesFolderHandle) {
              console.log(`📁 Processing image with folder handle for SKU ${sku}`);
              
              // Handle different types of image paths
              let filename = '';
              
              if (src.startsWith('./')) {
                // Handle relative paths like "./exportpacklist4_files/image.jpg"
                const pathParts = src.split('/');
                filename = pathParts[pathParts.length - 1]; // Get the last part (filename)
                console.log(`📁 Extracted filename from relative path: "${filename}"`);
              } else if (src.startsWith('file:///')) {
                // Handle file:// URLs - decode URI and extract filename
                try {
                  const decodedPath = decodeURIComponent(src);
                  console.log('📁 Decoded file path:', decodedPath);
                  filename = decodedPath.split(/[\/\\]/).pop() || '';
                } catch (error) {
                  console.warn('⚠️  Failed to decode URI:', src);
                  filename = src.split(/[\/\\]/).pop() || '';
                }
              } else {
                // Handle other relative paths
                filename = src.split(/[\/\\]/).pop() || '';
              }
              
              // Remove any query parameters or fragments
              filename = filename.split('?')[0].split('#')[0];
              
              console.log(`🔍 Looking for image file: "${filename}" in folder: "${imagesFolderHandle.name}"`);
              
              // Try to find the image file
              imageUrl = await findImageFileForHtml(imagesFolderHandle, filename, sku);
              
              if (imageUrl) {
                console.log(`✅ Successfully loaded image for SKU ${sku}`);
                
                // Mark this order as having a local image
                item._isLocalImage = true;
                item._originalSkuForLocalImage = sku;
              } else {
                console.log(`❌ Failed to load image for SKU ${sku}`);
              }
            } else {
              console.log(`⚠️  No images folder handle available for SKU ${sku} - cannot load image`);
            }
          } else {
            console.log(`⚠️  No src attribute found for image element for SKU ${sku}`);
          }
        } else {
          console.log(`❌ No image element found for SKU ${sku}`);
        }
        
        // Extract product name from the HTML table
        let productName = '';
        
        // Try to find product name in various columns
        const productNameCell = orderDetails.querySelector('td:nth-child(3)'); // Adjust column as needed
        if (productNameCell) {
          productName = productNameCell.textContent?.trim() || '';
        }
        
        // If not found in column 3, try other common locations
        if (!productName) {
          // Try looking for a cell that contains product information
          const allCells = orderDetails.querySelectorAll('td');
          for (const cell of allCells) {
            const cellText = cell.textContent?.trim() || '';
            // Skip cells that are clearly not product names (numbers, short codes, etc.)
            if (cellText && 
                cellText !== sku && 
                cellText !== quantityText && 
                cellText !== customerName && 
                cellText !== location &&
                cellText.length > 5 && // Reasonable length for a product name
                !cellText.match(/^\d+$/) && // Not just numbers
                !cellText.match(/^[A-Z]{2,}\d+$/) // Not just codes like "ABC123"
               ) {
              productName = cellText;
              break;
            }
          }
        }
        
        console.log(`📝 Extracted product name for ${sku}: "${productName}"`);
        
        // Store raw order data with original index for sorting
        rawOrders.push({
          orderNumber: orderNumber,
          customerName: customerName,
          sku: sku,
          quantity: quantity,
          location: location,
          buyerPostcode: buyerPostcode,
          imageUrl: imageUrl,
          remainingStock: remainingStock,
          orderValue: orderValue,
          fileDate: fileDate,
          channelType: channelType,
          channel: channel || '',
         width: width,
         weight: weight,
          itemName: productName,
          originalIndex: orderIndex, // Use order index for grouping
          itemIndex: itemIndex, // Track item position within order
        });
        
        console.log('📦 Parsed order item:', {
          orderNumber,
          customerName,
          sku,
          quantity,
          location,
          buyerPostcode,
          remainingStock,
          orderValue,
          fileDate,
          channelType,
          channel,
          width,
          weight,
          hasImage: !!imageUrl,
          itemIndex
        });
      }
    }
    
    console.log(`📊 Collected ${rawOrders.length} order items from ${orderRows.length} orders`);

    if (rawOrders.length === 0) {
      console.error('❌ No valid orders found in HTML.');
      throw new Error('No valid orders found in HTML file.');
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

    console.log(`📊 Grouped ${rawOrders.length} order items into ${orderGroups.size} order groups`);

    // Create final order objects, preserving original order and item sequence
    const finalOrders: Order[] = [];
    
    // Sort groups by the minimum original index to preserve order sequence
    const sortedGroups = Array.from(orderGroups.entries()).sort((a, b) => {
      const minIndexA = Math.min(...a[1].map(order => order.originalIndex));
      const minIndexB = Math.min(...b[1].map(order => order.originalIndex));
      return minIndexA - minIndexB;
    });

    for (const [groupKey, groupOrders] of sortedGroups) {
      // Sort items within each group by item index to preserve item order
      groupOrders.sort((a, b) => a.itemIndex - b.itemIndex);
      
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
          orderValue: rawOrder.orderValue,
          fileDate: rawOrder.fileDate,
         channelType: rawOrder.channelType,
         channel: rawOrder.channel || '',
          width: rawOrder.width,
          weight: rawOrder.weight,
          itemName: rawOrder.itemName,
          completed: false,
          _sourceFileName: rawOrder._sourceFileName,
          _isLocalImage: rawOrder._isLocalImage,
          _originalSkuForLocalImage: rawOrder._originalSkuForLocalImage,
          _sourceFileName: file.name,
        };

        finalOrders.push(order);
        
        console.log(`✅ Created final order:`, {
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          sku: order.sku,
          quantity: order.quantity,
          location: order.location,
          buyerPostcode: order.buyerPostcode,
          orderValue: order.orderValue,
          fileDate: order.fileDate,
          channelType: order.channelType,
          channel: order.channel || '',
          packagingType: order.packagingType || '',
          hasImage: !!order.imageUrl,
          remainingStock: order.remainingStock
        });
      }
    }

    console.log(`✅ Successfully processed ${finalOrders.length} final orders`);

    // Log summary
    const customerCounts = new Map<string, number>();
    const orderCounts = new Map<string, number>();
    
    for (const order of finalOrders) {
      customerCounts.set(order.customerName, (customerCounts.get(order.customerName) || 0) + 1);
      orderCounts.set(order.orderNumber, (orderCounts.get(order.orderNumber) || 0) + 1);
    }

    console.log('📊 Final Processing Summary:');
    console.log(`  📋 Total order items: ${finalOrders.length}`);
    console.log(`  👥 Unique customers: ${customerCounts.size}`);
    console.log(`  🔢 Unique order numbers: ${orderCounts.size}`);
    console.log(`  🖼️ Items with images: ${finalOrders.filter(o => !!o.imageUrl).length}`);
    console.log(`  💰 Items with order values: ${finalOrders.filter(o => o.orderValue !== undefined).length}`);
    console.log(`  📅 File date: ${fileDate || 'Not provided'}`);
    
    // Show customers with multiple items
    for (const [customer, count] of customerCounts.entries()) {
      if (count > 1) {
        console.log(`  👤 ${customer}: ${count} items`);
      }
    }

    return finalOrders;
  } catch (error) {
    console.error('❌ Error parsing HTML:', error);
    throw new Error('Failed to parse HTML file');
  }
};

// Helper function to find and load image files for HTML parsing
async function findImageFileForHtml(
  imagesFolderHandle: FileSystemDirectoryHandle, 
  originalFilename: string, 
  sku: string
): Promise<string> {
  console.log(`🔍 Starting image search for filename: "${originalFilename}", SKU: "${sku}"`);
  console.log(`📁 Searching in folder: "${imagesFolderHandle.name}"`);
  
  // First, try the exact filename as provided
  try {
    console.log(`🔍 Trying exact filename: "${originalFilename}"`);
    const imageFileHandle = await imagesFolderHandle.getFileHandle(originalFilename);
    const imageFile = await imageFileHandle.getFile();
    const imageUrl = URL.createObjectURL(imageFile);
    console.log(`✅ Found exact match: "${originalFilename}" (${imageFile.size} bytes)`);
    return imageUrl;
  } catch (error) {
    console.log(`❌ Exact filename not found: "${originalFilename}"`);
  }
  
  // If exact match fails, try variations
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
  
  // List of filenames to try
  const filenamesToTry = [
    originalFilename.toLowerCase(), // Lowercase version
    originalFilename.toUpperCase(), // Uppercase version
  ];
  
  // Also try using the SKU as filename with different extensions
  const cleanSku = sku.replace(/[^a-zA-Z0-9]/g, ''); // Remove special characters
  imageExtensions.forEach(ext => {
    filenamesToTry.push(`${sku}.${ext}`);
    filenamesToTry.push(`${cleanSku}.${ext}`);
    filenamesToTry.push(`${sku.toLowerCase()}.${ext}`);
    filenamesToTry.push(`${cleanSku.toLowerCase()}.${ext}`);
  });
  
  // If original filename has no extension, try adding common extensions
  if (!originalFilename.includes('.')) {
    imageExtensions.forEach(ext => {
      filenamesToTry.push(`${originalFilename}.${ext}`);
      filenamesToTry.push(`${originalFilename.toLowerCase()}.${ext}`);
    });
  }
  
  console.log(`🔍 Trying ${filenamesToTry.length} filename variations...`);
  
  // Try to find any of these filenames
  for (const filename of filenamesToTry) {
    try {
      console.log(`🔍 Trying variation: "${filename}"`);
      const imageFileHandle = await imagesFolderHandle.getFileHandle(filename);
      const imageFile = await imageFileHandle.getFile();
      
      // Create a blob URL for the image
      const imageUrl = URL.createObjectURL(imageFile);
      console.log(`✅ Found variation match: "${filename}" (${imageFile.size} bytes)`);
      return imageUrl;
    } catch (error) {
      // File not found, continue to next filename
      continue;
    }
  }
  
  // If no exact match found, try to list all files in the folder and find a partial match
  try {
    console.log('🔍 No exact match found, scanning all files in images folder...');
    const allFiles: string[] = [];
    
    for await (const [name, handle] of imagesFolderHandle.entries()) {
      if (handle.kind === 'file') {
        allFiles.push(name);
      }
    }
    
    console.log(`📁 Available image files (${allFiles.length}):`, allFiles.slice(0, 10), allFiles.length > 10 ? '...' : '');
    
    // Try to find a file that contains the SKU or part of the original filename
    const skuLower = sku.toLowerCase();
    const cleanSkuLower = cleanSku.toLowerCase();
    const originalFilenameLower = originalFilename.toLowerCase();
    
    // Extract the base name from the original filename (without extension)
    const originalBaseName = originalFilename.split('.')[0].toLowerCase();
    
    for (const fileName of allFiles) {
      const fileNameLower = fileName.toLowerCase();
      
      // Check if filename contains the SKU, clean SKU, or original filename parts
      if (fileNameLower.includes(skuLower) || 
          fileNameLower.includes(cleanSkuLower) ||
          fileNameLower.includes(originalBaseName) ||
          originalFilenameLower.includes(fileNameLower.split('.')[0])) {
        try {
          console.log(`🎯 Found potential match: "${fileName}"`);
          const imageFileHandle = await imagesFolderHandle.getFileHandle(fileName);
          const imageFile = await imageFileHandle.getFile();
          const imageUrl = URL.createObjectURL(imageFile);
          console.log(`✅ Successfully loaded image by partial match: "${fileName}"`);
          return imageUrl;
        } catch (error) {
          continue;
        }
      }
    }
    
    console.warn(`⚠️  No image found for SKU: "${sku}" with filename: "${originalFilename}" in folder with ${allFiles.length} files`);
  } catch (error) {
    console.error('❌ Error scanning images folder:', error);
  }
  
  return '';
}

// Replace the simulation with actual HTML parsing
export const simulatePdfParsing = async (
  file: File, 
  imagesFolderHandle?: FileSystemDirectoryHandle,
  fileDate?: string
): Promise<Order[]> => {
  console.log('🚀 simulatePdfParsing called with:', {
    fileName: file.name,
    hasImagesFolder: !!imagesFolderHandle,
    imagesFolderName: imagesFolderHandle?.name,
    fileDate: fileDate || 'Not provided'
  });
  
  return parseHtmlContent(file, imagesFolderHandle, fileDate);
};