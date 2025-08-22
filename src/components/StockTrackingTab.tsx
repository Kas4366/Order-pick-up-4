import React, { useState, useEffect } from 'react';
import { Package, Calendar, MapPin, Trash2, Download, AlertTriangle, Image, Weight, Navigation } from 'lucide-react';
import { StockTrackingItem } from '../types/StockTracking';
import { findImageFile } from '../utils/imageUtils';
import { fileHandlePersistenceService } from '../services/fileHandlePersistenceService';

interface StockTrackingTabProps {
  trackedItems: StockTrackingItem[];
  onRemoveItem: (sku: string, markedDate: string) => void;
  onClearAll: () => void;
  onUpdateItem: (sku: string, markedDate: string, updates: Partial<StockTrackingItem>) => void;
}

export const StockTrackingTab: React.FC<StockTrackingTabProps> = ({
  trackedItems,
  onRemoveItem,
  onClearAll,
  onUpdateItem,
}) => {
  const [sortBy, setSortBy] = useState<'date' | 'sku' | 'stock'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());

  const sortedItems = [...trackedItems].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'date':
        comparison = new Date(a.markedDate).getTime() - new Date(b.markedDate).getTime();
        break;
      case 'sku':
        comparison = a.sku.localeCompare(b.sku);
        break;
      case 'stock':
        comparison = a.currentStock - b.currentStock;
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Load images for items that have local image sources but no current imageUrl
  useEffect(() => {
    const loadMissingImages = async () => {
      for (const item of trackedItems) {
        if (item.localImageSource && !item.imageUrl) {
          const itemKey = `${item.sku}-${item.markedDate}`;
          
          if (loadingImages.has(itemKey)) continue; // Already loading
          
          setLoadingImages(prev => new Set(prev).add(itemKey));
          
          try {
            console.log(`🖼️ Attempting to load image for stock item: ${item.sku}`);
            
            // Try to get the saved folder handle
            const savedHandle = await fileHandlePersistenceService.getHandle('csvImagesFolder');
            
            if (savedHandle && savedHandle.name === item.localImageSource.folderName) {
              // Validate and request permission
              const hasPermission = await fileHandlePersistenceService.validateAndRequestPermission(savedHandle);
              
              if (hasPermission) {
                // Try to find the image using the original SKU
                const imageUrl = await findImageFile(savedHandle, item.localImageSource.sku);
                
                if (imageUrl) {
                  // Update the item with the restored image URL
                  onUpdateItem(item.sku, item.markedDate, { imageUrl });
                  console.log(`✅ Successfully loaded image for stock item: ${item.sku}`);
                } else {
                  console.log(`⚠️ Could not find image file for stock item: ${item.sku}`);
                }
              }
            }
          } catch (error) {
            console.error(`❌ Error loading image for stock item ${item.sku}:`, error);
          } finally {
            setLoadingImages(prev => {
              const newSet = new Set(prev);
              newSet.delete(itemKey);
              return newSet;
            });
          }
        }
      }
    };
    
    loadMissingImages();
  }, [trackedItems, onUpdateItem]);

  const handleWeightChange = (item: StockTrackingItem, weight: string) => {
    const weightValue = weight === '' ? undefined : parseFloat(weight);
    if (weight !== '' && (isNaN(weightValue!) || weightValue! < 0)) return; // Invalid input
    
    onUpdateItem(item.sku, item.markedDate, { weight: weightValue });
  };

  const handleLocationChange = (item: StockTrackingItem, newLocation: string) => {
    onUpdateItem(item.sku, item.markedDate, { newLocation: newLocation.trim() });
  };

  const exportToCSV = () => {
    if (trackedItems.length === 0) return;
    
    const headers = ['SKU', 'Marked Date', 'Order Number', 'Customer', 'Current Stock', 'Original Location', 'Image URL', 'Weight (g)', 'New Location'];
    const csvContent = [
      headers.join(','),
      ...trackedItems.map(item => [
        item.sku,
        item.markedDate,
        item.orderNumber,
        `"${item.customerName}"`,
        item.currentStock,
        item.location,
        `"${item.imageUrl || ''}"`,
        item.weight || '',
        `"${item.newLocation || ''}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-to-order-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStockStatusColor = (stock: number) => {
    if (stock <= 0) return 'text-red-600 bg-red-50';
    if (stock <= 5) return 'text-orange-600 bg-orange-50';
    if (stock <= 10) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Package className="h-5 w-5" />
          Items to Order
        </h3>
        <p className="text-gray-600 mb-4">
          Track items marked for reordering during the picking process. Items marked as low stock will appear here.
        </p>
      </div>

      {trackedItems.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-600 mb-2">No Items Marked</h4>
          <p className="text-gray-500">
            Items marked for reordering during picking will appear here.
          </p>
        </div>
      ) : (
        <>
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'sku' | 'stock')}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="date">Date Marked</option>
                  <option value="sku">SKU</option>
                  <option value="stock">Stock Level</option>
                </select>
              </div>
              
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
              
              <button
                onClick={onClearAll}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                <Trash2 className="h-4 w-4" />
                Clear All
              </button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Total Items</span>
              </div>
              <p className="text-2xl font-bold text-blue-900 mt-1">{trackedItems.length}</p>
            </div>
            
            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="text-sm font-medium text-red-800">Out of Stock</span>
              </div>
              <p className="text-2xl font-bold text-red-900 mt-1">
                {trackedItems.filter(item => item.currentStock <= 0).length}
              </p>
            </div>
            
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">Very Low (≤5)</span>
              </div>
              <p className="text-2xl font-bold text-orange-900 mt-1">
                {trackedItems.filter(item => item.currentStock > 0 && item.currentStock <= 5).length}
              </p>
            </div>
            
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">Low (≤10)</span>
              </div>
              <p className="text-2xl font-bold text-yellow-900 mt-1">
                {trackedItems.filter(item => item.currentStock > 5 && item.currentStock <= 10).length}
              </p>
            </div>
          </div>

          {/* Items List */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
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
                      Original Location
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Weight (g)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      New Location
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
                  {sortedItems.map((item, index) => (
                    <tr key={`${item.sku}-${item.markedDate}`} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                          {item.imageUrl ? (
                            <img 
                              src={item.imageUrl} 
                              alt={`Product ${item.sku}`}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                console.log(`❌ Image failed to load for ${item.sku}`);
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : loadingImages.has(`${item.sku}-${item.markedDate}`) ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          ) : (
                            <Image className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Package className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">{item.sku}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStockStatusColor(item.currentStock)}`}>
                          {item.currentStock}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{item.location}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Weight className="h-4 w-4 text-gray-400 mr-2" />
                          <input
                            type="number"
                            value={item.weight || ''}
                            onChange={(e) => handleWeightChange(item, e.target.value)}
                            placeholder="Enter weight"
                            min="0"
                            step="0.1"
                            className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Navigation className="h-4 w-4 text-gray-400 mr-2" />
                          <input
                            type="text"
                            value={item.newLocation || ''}
                            onChange={(e) => handleLocationChange(item, e.target.value)}
                            placeholder="Enter new location"
                            className="w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{formatDate(item.markedDate)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="font-medium">Order #{item.orderNumber}</div>
                          <div className="text-gray-500">{item.customerName}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <button
                          onClick={() => onRemoveItem(item.sku, item.markedDate)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Remove from list"
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
        </>
      )}

      {/* Enhanced Features Notice */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">Enhanced Features:</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p>✅ <strong>Item Images:</strong> Product images are automatically loaded from your local images folder</p>
          <p>✅ <strong>Editable Weight:</strong> Enter item weight in grams for inventory management</p>
          <p>✅ <strong>New Location:</strong> Update bin locations when items are moved or reorganized</p>
          <p>✅ <strong>Auto-Save:</strong> All changes are saved automatically as you type</p>
          <p>✅ <strong>CSV Export:</strong> Download includes all data including images, weights, and new locations</p>
          <p>✅ <strong>Image Restoration:</strong> Images from archived orders are automatically restored when possible</p>
          <p>✅ <strong>Image Restoration:</strong> Images from archived orders are automatically restored when possible</p>
        </div>
      </div>
    </div>
  );
};