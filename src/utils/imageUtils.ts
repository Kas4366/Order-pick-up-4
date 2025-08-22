import { Order } from '../types/Order';

/**
 * Helper function to find and load image files from local folder
 * @param imagesFolderHandle The directory handle for the images folder
 * @param sku The SKU to search for
 * @returns Promise<string> The blob URL for the image, or empty string if not found
 */
export async function findImageFile(
  imagesFolderHandle: FileSystemDirectoryHandle, 
  sku: string
): Promise<string> {
  console.log(`🔍 Starting image search for SKU: "${sku}"`);
  console.log(`📁 Searching in folder: "${imagesFolderHandle.name}"`);
  
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
  
  // List of filenames to try
  const filenamesToTry = [
    sku, // Exact SKU match
    sku.toLowerCase(), // Lowercase version
    sku.toUpperCase(), // Uppercase version
  ];
  
  // Also try with different extensions
  const cleanSku = sku.replace(/[^a-zA-Z0-9]/g, ''); // Remove special characters
  imageExtensions.forEach(ext => {
    filenamesToTry.push(`${sku}.${ext}`);
    filenamesToTry.push(`${cleanSku}.${ext}`);
    filenamesToTry.push(`${sku.toLowerCase()}.${ext}`);
    filenamesToTry.push(`${cleanSku.toLowerCase()}.${ext}`);
    filenamesToTry.push(`${sku.toUpperCase()}.${ext}`);
    filenamesToTry.push(`${cleanSku.toUpperCase()}.${ext}`);
  });
  
  console.log(`🔍 Trying ${filenamesToTry.length} filename variations...`);
  
  // Try to find any of these filenames
  for (const filename of filenamesToTry) {
    try {
      console.log(`🔍 Trying variation: "${filename}"`);
      const imageFileHandle = await imagesFolderHandle.getFileHandle(filename);
      const imageFile = await imageFileHandle.getFile();
      
      // Create a blob URL for the image
      const imageUrl = URL.createObjectURL(imageFile);
      console.log(`✅ Found match: "${filename}" (${imageFile.size} bytes)`);
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
    
    // Try to find a file that contains the SKU or part of the SKU
    const skuLower = sku.toLowerCase();
    const cleanSkuLower = cleanSku.toLowerCase();
    
    for (const fileName of allFiles) {
      const fileNameLower = fileName.toLowerCase();
      
      // Check if filename contains the SKU or clean SKU
      if (fileNameLower.includes(skuLower) || 
          fileNameLower.includes(cleanSkuLower) ||
          skuLower.includes(fileNameLower.split('.')[0])) {
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
    
    console.warn(`⚠️ No image found for SKU: "${sku}" in folder with ${allFiles.length} files`);
  } catch (error) {
    console.error('❌ Error scanning images folder:', error);
  }
  
  return '';
}