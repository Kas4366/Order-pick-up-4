import { Order } from '../types/Order';

/**
 * Helper function to find and load image files from local folder using STRICT matching
 * Only looks for exact SKU match with common image extensions
 * @param imagesFolderHandle The directory handle for the images folder
 * @param sku The SKU to search for (must match exactly)
 * @returns Promise<string> The blob URL for the image, or empty string if not found
 */
export async function findImageFile(
  imagesFolderHandle: FileSystemDirectoryHandle, 
  sku: string
): Promise<string> {
  console.log(`🔍 Starting STRICT image search for SKU: "${sku}"`);
  console.log(`📁 Searching in folder: "${imagesFolderHandle.name}"`);
  
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
  
  // Only try exact SKU with different extensions (both lowercase and uppercase extensions)
  const filenamesToTry = [
    sku, // Exact SKU without extension
  ];
  
  // Add exact SKU with each extension in both cases
  imageExtensions.forEach(ext => {
    filenamesToTry.push(`${sku}.${ext}`);      // SKU.jpg
    filenamesToTry.push(`${sku}.${ext.toUpperCase()}`); // SKU.JPG
  });
  
  console.log(`🔍 Trying ${filenamesToTry.length} exact filename variations...`);
  
  // Try to find any of these exact filenames
  for (const filename of filenamesToTry) {
    try {
      console.log(`🔍 Trying exact filename: "${filename}"`);
      const imageFileHandle = await imagesFolderHandle.getFileHandle(filename);
      const imageFile = await imageFileHandle.getFile();
      
      // Create a blob URL for the image
      const imageUrl = URL.createObjectURL(imageFile);
      console.log(`✅ Found exact match: "${filename}" (${imageFile.size} bytes)`);
      return imageUrl;
    } catch (error) {
      // File not found, continue to next filename
      continue;
    }
  }
  
  console.warn(`⚠️ No exact image match found for SKU: "${sku}"`);
  console.log(`📋 Searched for exact filenames: ${filenamesToTry.join(', ')}`);
  
  return '';
}