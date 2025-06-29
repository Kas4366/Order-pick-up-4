import { Order } from '../types/Order';

export const parseHtmlContent = async (
  file: File, 
  imagesFolderHandle?: FileSystemDirectoryHandle
): Promise<Order[]> => {
  try {
    console.log('🔍 Starting HTML parsing...');
    console.log('📁 Images folder handle:', imagesFolderHandle ? `✅ Available (${imagesFolderHandle.name})` : '❌ Not available');
    
    const text = await file.text();
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    
    const orders: Order[] = [];
    
    // Find all order rows (they are in pairs - header row and details row)
    const orderRows = doc.querySelectorAll('tr.shippeditem');
    console.log(`📋 Found ${orderRows.length} order rows in HTML`);
    
    for (const row of orderRows) {
      // Get the next row which contains the order details
      const detailsRow = row.nextElementSibling;
      if (!detailsRow) continue;
      
      // Find the details table within the details row
      const detailsTable = detailsRow.querySelector('table');
      if (!detailsTable) continue;
      
      // Find the order details row within the details table
      const orderDetails = detailsTable.querySelector('tr.shippeditem');
      if (!orderDetails) continue;
      
      // Extract order information
      const orderNumber = row.querySelector('td')?.textContent?.trim() || '';
      const sku = orderDetails.querySelector('td:nth-child(2)')?.textContent?.trim().replace(/\s+/g, ' ') || '';
      const quantityText = orderDetails.querySelector('td span strong')?.textContent?.trim() || '0';
      const quantity = parseInt(quantityText);
      const customerName = orderDetails.querySelector('td:nth-child(7)')?.textContent?.trim() || '';
      
      // Extract location from the correct cell (5th column)
      const locationCell = orderDetails.querySelector('td:nth-child(5)');
      const location = locationCell?.textContent?.trim() || 'Not specified';
      
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

      // Extract remaining stock information from HTML
      let remainingStock: number | undefined = undefined;
      
      // Try to find stock information in various possible locations
      const stockCells = orderDetails.querySelectorAll('td');
      for (const cell of stockCells) {
        const cellText = cell.textContent?.toLowerCase() || '';
        
        // Look for patterns like "Stock: 15", "Available: 8", "Remaining: 12", etc.
        const stockMatch = cellText.match(/(?:stock|available|remaining|on hand|inventory):\s*(\d+)/i);
        if (stockMatch) {
          remainingStock = parseInt(stockMatch[1], 10);
          console.log(`📦 Found remaining stock for ${sku}: ${remainingStock}`);
          break;
        }
        
        // Also check for standalone numbers in cells that might represent stock
        if (cellText.match(/^\s*\d+\s*$/) && !cellText.includes(quantityText)) {
          const potentialStock = parseInt(cellText.trim(), 10);
          if (potentialStock > quantity) { // Only consider if it's more than the order quantity
            remainingStock = potentialStock;
            console.log(`📦 Inferred remaining stock for ${sku}: ${remainingStock}`);
          }
        }
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
            imageUrl = await findImageFile(imagesFolderHandle, filename, sku);
            
            if (imageUrl) {
              console.log(`✅ Successfully loaded image for SKU ${sku}`);
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
        
        // Debug: Let's see what's in the first cell
        const firstCell = orderDetails.querySelector('td:first-child');
        if (firstCell) {
          console.log(`🔍 First cell HTML for SKU ${sku}:`, firstCell.innerHTML);
        }
        
        // Debug: Let's see all cells in the order details row
        const allCells = orderDetails.querySelectorAll('td');
        console.log(`🔍 Order details row has ${allCells.length} cells for SKU ${sku}`);
        allCells.forEach((cell, index) => {
          const hasImg = cell.querySelector('img') ? '📷' : '❌';
          console.log(`  Cell ${index + 1}: ${hasImg} ${cell.textContent?.trim().substring(0, 50)}...`);
        });
      }
      
      const order: Order = {
        orderNumber,
        customerName,
        sku,
        quantity,
        location,
        imageUrl,
        remainingStock,
        completed: false,
        // Add buyer postcode for QR code matching
        buyerPostcode
      };
      
      console.log('📦 Parsed order:', {
        orderNumber,
        customerName,
        sku,
        quantity,
        location,
        buyerPostcode,
        remainingStock,
        hasImage: !!imageUrl
      });
      orders.push(order);
    }
    
    console.log(`✅ Successfully parsed ${orders.length} orders`);
    return orders;
  } catch (error) {
    console.error('❌ Error parsing HTML:', error);
    throw new Error('Failed to parse HTML file');
  }
};

// Helper function to find and load image files
async function findImageFile(
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
  imagesFolderHandle?: FileSystemDirectoryHandle
): Promise<Order[]> => {
  console.log('🚀 simulatePdfParsing called with:', {
    fileName: file.name,
    hasImagesFolder: !!imagesFolderHandle,
    imagesFolderName: imagesFolderHandle?.name
  });
  
  return parseHtmlContent(file, imagesFolderHandle);
};