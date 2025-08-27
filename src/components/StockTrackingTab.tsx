import React, { useState, useEffect } from 'react';
import { StockTrackingItem } from '../types/StockTracking';
import { Download, Trash2, Package, Scale, Navigation, Box, ImageIcon, AlertTriangle } from 'lucide-react';
import { findImageFile } from '../utils/imageUtils';

interface StockTrackingTabProps {
  stockItems: StockTrackingItem[];
  onRemoveItem: (sku: string, markedDate: string) => void;
  onUpdateItem?: (sku: string, markedDate: string, updates: Partial<StockTrackingItem>) => void;
  csvImagesFolderHandle?: FileSystemDirectoryHandle | null;
  onSetCsvImagesFolder?: () => Promise<void>;
}

export const StockTrackingTab: React.FC<StockTrackingTabProps> = ({
  stockItems,
  onRemoveItem,
  onUpdateItem,
  csvImagesFolderHandle,
  onSetCsvImagesFolder
}) => {
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());
  const [hoveredImages, setHoveredImages] = useState<Set<string>>(new Set());
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // Auto-load images for items that don't have imageUrl but have localImageSource
  useEffect(() => {
    const loadMissingImages = async () => {
      console.log('🖼️ StockTrackingTab: Starting image loading process...');
      console.log('🖼️ csvImagesFolderHandle state:', csvImagesFolderHandle ? `Available (${csvImagesFolderHandle.name})` : 'Not available');
      console.log('🖼️ Total stock items:', stockItems.length);
      
      // Only proceed if we have a folder handle
      if (!csvImagesFolderHandle) {
        console.log('⚠️ StockTrackingTab: No CSV images folder handle available for loading images');
        return;
      }

      const itemsNeedingImages = stockItems.filter(
        item => !item.imageUrl && item.localImageSource
      );
      
      console.log('🖼️ Items needing images:', itemsNeedingImages.length);
      itemsNeedingImages.forEach((item, index) => {
        console.log(`🖼️ Item ${index + 1}: SKU=${item.sku}, hasLocalImageSource=${!!item.localImageSource}, folderName=${item.localImageSource?.folderName}`);
      });

      for (const item of itemsNeedingImages) {
        const itemKey = `${item.sku}-${item.markedDate}`;
        console.log(`🖼️ Processing item: ${item.sku} (key: ${itemKey})`);
        
        if (!loadingImages.has(itemKey)) {
          setLoadingImages(prev => new Set(prev).add(itemKey));
          console.log(`🖼️ Loading image for SKU: ${item.sku}`);
          
          try {
            const imageUrl = await findImageFile(
              csvImagesFolderHandle,
              item.sku
            );
            
            if (imageUrl) {
              console.log(`✅ Found image for SKU: ${item.sku}`);
              if (onUpdateItem) {
                onUpdateItem(item.sku, item.markedDate, { imageUrl });
                console.log(`✅ Updated item with imageUrl for SKU: ${item.sku}`);
              } else {
                console.log(`⚠️ onUpdateItem not available for SKU: ${item.sku}`);
              }
            } else {
              console.log(`❌ No image found for SKU: ${item.sku}`);
            }
          } catch (error) {
            console.warn(`❌ Failed to load image for SKU ${item.sku}:`, error);
          } finally {
            setLoadingImages(prev => {
              const newSet = new Set(prev);
              newSet.delete(itemKey);
              return newSet;
            });
            console.log(`🔄 Finished processing image for SKU: ${item.sku}`);
          }
        }
      }
    };

    loadMissingImages();
  }, [stockItems, csvImagesFolderHandle, onUpdateItem]);

  const exportToCSV = () => {
    if (stockItems.length === 0) {
      alert('No items to export');
      return;
    }

    const headers = [
      'SKU',
      'Marked Date',
      'Order Number',
      'Customer',
      'Current Stock',
      'Original Location',
      'Image URL',
      'Weight (g)',
      'New Location'
    ];

    const csvContent = [
      headers.join(','),
      ...stockItems.map(item => [
        `"${item.sku}"`,
        `"${item.markedDate}"`,
        `"${item.orderNumber}"`,
        `"${item.customer}"`,
        `"${item.currentStock}"`,
        `"${item.location}"`,
        `"${item.imageUrl || ''}"`,
        `"${item.weight || ''}"`,
        `"${item.newLocation || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `items-to-order-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleWeightChange = (sku: string, markedDate: string, weight: string) => {
    const numericWeight = weight === '' ? undefined : parseFloat(weight);
    if (onUpdateItem) {
      onUpdateItem(sku, markedDate, { weight: numericWeight });
    }
  };

  const handleNewLocationChange = (sku: string, markedDate: string, newLocation: string) => {
    if (onUpdateItem) {
      onUpdateItem(sku, markedDate, { newLocation: newLocation || undefined });
    }
  };

  if (stockItems.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No items marked for reorder</h3>
        <p className="mt-1 text-sm text-gray-500">
          Items will appear here when you mark them for reorder from the order list.
        </p>
      </div>
    );
  }

  // Check if we have items that need images but no folder access
  const itemsNeedingImages = stockItems.filter(item => 
    item.localImageSource && !item.imageUrl
  );
  const needsFolderAccess = !csvImagesFolderHandle && itemsNeedingImages.length > 0;

  return (
    <div className="space-y-4">
      {/* Folder Access Warning */}
      {needsFolderAccess && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-orange-800 mb-2">
                Images Not Loading
              </h4>
              <p className="text-sm text-orange-700 mb-3">
                {itemsNeedingImages.length} item{itemsNeedingImages.length !== 1 ? 's' : ''} have local images that need to be loaded, 
                but the browser doesn't have access to your images folder. Click below to re-grant access.
              </p>
              {onSetCsvImagesFolder && (
                <button
                  onClick={onSetCsvImagesFolder}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                >
                  <ImageIcon className="h-4 w-4" />
                  Re-select Images Folder
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">
          Items to Order ({stockItems.length})
        </h3>
        <button
          onClick={exportToCSV}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Image
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SKU
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock Level
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center">
                  <Scale className="h-4 w-4 mr-1" />
                  Weight (g)
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center">
                  <Navigation className="h-4 w-4 mr-1" />
                  New Location
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Marked Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order Info
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {stockItems.map((item) => (
              <tr key={`${item.sku}-${item.markedDate}`} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center relative">
                    {loadingImages.has(`${item.sku}-${item.markedDate}`) ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                    ) : item.imageUrl && !imageErrors.has(`${item.sku}-${item.markedDate}`) ? (
                      <div
                        className="w-full h-full relative cursor-pointer"
                        onMouseEnter={() => setHoveredImages(prev => new Set(prev).add(`${item.sku}-${item.markedDate}`))}
                        onMouseLeave={() => setHoveredImages(prev => {
                          const newSet = new Set(prev);
                          newSet.delete(`${item.sku}-${item.markedDate}`);
                          return newSet;
                        })}
                      >
                        <img
                          src={item.imageUrl}
                          alt={item.sku}
                          className={`w-full h-full object-cover transition-all duration-300 ${
                            hoveredImages.has(`${item.sku}-${item.markedDate}`) 
                              ? 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 scale-100 z-[9999] shadow-2xl rounded-lg border-4 border-white max-w-md max-h-96' 
                              : ''
                          }`}
                          onError={(e) => {
                            setImageErrors(prev => new Set(prev).add(`${item.sku}-${item.markedDate}`));
                          }}
                        />
                      </div>
                    ) : (
                      <ImageIcon className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{item.sku}</div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    item.currentStock <= 0
                      ? 'bg-red-100 text-red-800'
                      : item.currentStock <= 5
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {item.currentStock}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.location}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <input
                    type="number"
                    value={item.weight || ''}
                    onChange={(e) => handleWeightChange(item.sku, item.markedDate, e.target.value)}
                    placeholder="Enter weight"
                    className="w-24 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    step="0.1"
                    min="0"
                  />
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <input
                    type="text"
                    value={item.newLocation || ''}
                    onChange={(e) => handleNewLocationChange(item.sku, item.markedDate, e.target.value)}
                    placeholder="Enter new location"
                    className="w-32 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(item.markedDate).toLocaleDateString()}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div>
                    <div className="font-medium">{item.orderNumber}</div>
                    <div className="text-gray-500">{item.customer}</div>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => onRemoveItem(item.sku, item.markedDate)}
                    className="text-red-600 hover:text-red-900"
                    title="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};