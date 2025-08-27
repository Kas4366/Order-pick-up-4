import React, { useState } from 'react';
import { ImagePreviewModal } from '../components/ImagePreviewModal';
import { FileUploadArea } from '../components/FileUploadArea';
import { OrderDisplay } from '../components/OrderDisplay';
import { NoOrdersState } from '../components/NoOrdersState';
import { OrderSidebar } from '../components/OrderSidebar';
import { CustomerSearch } from '../components/CustomerSearch';
import { SettingsModal } from '../components/SettingsModal';
import { useOrderData } from '../hooks/useOrderData';
import { Settings as SettingsIcon, RefreshCw, Server, Warehouse } from 'lucide-react';
import { FileWithImages } from '../types/Settings';

export const OrderPickView: React.FC = () => {
  const { 
    pdfUploaded,
    setPdfUploaded,
    orders,
    setOrders,
    currentOrder,
    setCurrentOrder,
    currentOrderIndex,
    handleFileUpload,
    handleCsvFileUpload,
    saveCsvMappings,
    csvColumnMappings,
    saveVoiceSettings,
    voiceSettings,
    stockTrackingItems,
    handleMarkForReorder,
    removeStockTrackingItem,
    clearAllStockTrackingItems,
    handleCustomerSearch,
    handleQRCodeScan,
    handleArrowNavigation,
    handleSelroFolderSelect,
    selectedSelroFolderId,
    selectedSelroFolderName,
    handleVeeqoStatusSelect,
    selectedVeeqoStatus,
    selectedVeeqoWarehouseId,
    isUsingSelroApi,
    isUsingVeeqoApi,
    loadOrdersFromSelro,
    loadOrdersFromVeeqo,
    handleOrderComplete,
    // Custom tags
    customTags,
    saveCustomTags,
    selectedSelroTag,
    selectedVeeqoTag,
    handleSelectSelroTag,
    handleSelectVeeqoTag,
    // Other settings
    autoCompleteEnabled,
    saveOtherSettings,
    updateStockTrackingItem,
    // Image preview functionality
    imagePreviewModal,
    handlePreviewImageBySku,
    closeImagePreviewModal,
    searchMessage,
    setSearchMessage,
    // CSV Images Folder
    csvImagesFolderInfo,
    setCsvImagesFolder,
    csvImagesFolderHandle,
    // Archive
    handleLoadArchivedOrder,
    isArchiveInitialized,
    // Packaging rules
    packagingRules,
    savePackagingRules,
    customPackagingTypes,
    saveCustomPackagingTypes,
    currentOrderPackagingType,
  } = useOrderData();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [availableFiles, setAvailableFiles] = useState<FileWithImages[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleFolderSelect = (path: string) => {
    setSelectedFolder(path);
    console.log('Folder selected:', path);
  };

  const handleFileSelect = async (file: FileWithImages) => {
    try {
      console.log('Processing selected file:', file.name, 'with images folder:', file.imagesFolderHandle?.name);
      await handleFileUpload(file);
      setIsSettingsOpen(false);
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing the selected file');
    }
  };

  const handleCsvUpload = async (file: File, mappings: any) => {
    try {
      console.log('Processing CSV file:', file.name);
      await handleCsvFileUpload(file, mappings);
      setIsSettingsOpen(false);
    } catch (error) {
      console.error('Error processing CSV file:', error);
      alert('Error processing the CSV file');
    }
  };

  const handleRefreshOrders = async () => {
    if (isUsingSelroApi && selectedSelroFolderId) {
      setIsRefreshing(true);
      try {
        await loadOrdersFromSelro();
        console.log('Selro orders refreshed successfully');
      } catch (error) {
        console.error('Error refreshing Selro orders:', error);
        alert('Failed to refresh orders from Selro. Please try again.');
      } finally {
        setIsRefreshing(false);
      }
    } else if (isUsingVeeqoApi && selectedVeeqoStatus) {
      setIsRefreshing(true);
      try {
        await loadOrdersFromVeeqo();
        console.log('Veeqo orders refreshed successfully');
      } catch (error) {
        console.error('Error refreshing Veeqo orders:', error);
        alert('Failed to refresh orders from Veeqo. Please try again.');
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  const handleNewUpload = () => {
    setPdfUploaded(false);
    setOrders([]);
    setCurrentOrder(null);
  };

  const getDataSourceInfo = () => {
    if (isUsingSelroApi && selectedSelroFolderName) {
      const tagInfo = selectedSelroTag && selectedSelroTag !== 'all' ? ` (${selectedSelroTag})` : '';
      return {
        icon: <Server className="h-4 w-4" />,
        text: `Selro: ${selectedSelroFolderName}${tagInfo}`,
        color: 'text-blue-600'
      };
    } else if (isUsingVeeqoApi && selectedVeeqoStatus) {
      const warehouseText = selectedVeeqoWarehouseId ? ' (Specific Warehouse)' : ' (All Warehouses)';
      const tagInfo = selectedVeeqoTag && selectedVeeqoTag !== 'all' ? ` (${selectedVeeqoTag})` : '';
      return {
        icon: <Warehouse className="h-4 w-4" />,
        text: `Veeqo: ${selectedVeeqoStatus}${warehouseText}${tagInfo}`,
        color: 'text-purple-600'
      };
    }
    return null;
  };

  const dataSourceInfo = getDataSourceInfo();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
          title="Settings"
        >
          <SettingsIcon className="h-5 w-5 text-gray-600" />
          {stockTrackingItems.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center">
              {stockTrackingItems.length}
            </span>
          )}
        </button>
      </div>

      <div className="flex-1 py-2">
        <div className="flex w-full max-w-[1600px] mx-auto px-4 py-2 gap-6">
          <OrderSidebar 
            orders={orders} 
            currentOrder={currentOrder}
            currentOrderIndex={currentOrderIndex}
            onOrderSelect={setCurrentOrder}
          />
          
          <div className="flex-1">
            <div className="mb-4">
              <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Order Picking Assistant</h2>
                  <div className="flex items-center gap-4 text-gray-600">
                    <span>
                      {orders.length} orders loaded • {orders.filter(order => order.completed).length} completed
                    </span>
                    {dataSourceInfo && (
                      <span className={`flex items-center gap-1 ${dataSourceInfo.color}`}>
                        {dataSourceInfo.icon}
                        {dataSourceInfo.text}
                      </span>
                    )}
                    {currentOrderIndex >= 0 && (
                      <span className="text-blue-600">
                        Order {currentOrderIndex + 1} of {orders.length}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {(isUsingSelroApi || isUsingVeeqoApi) && (
                    <button
                      onClick={handleRefreshOrders}
                      disabled={isRefreshing}
                      className="px-4 py-2 rounded-lg font-medium bg-green-100 text-green-700 border border-green-200 hover:bg-green-200 transition-colors disabled:opacity-50 flex items-center gap-2"
                      title={`Refresh orders from ${isUsingSelroApi ? 'Selro' : 'Veeqo'}`}
                    >
                      <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                      {isRefreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                  )}
                  
                  <button 
                    onClick={handleNewUpload}
                    className="px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-colors"
                  >
                    {(isUsingSelroApi || isUsingVeeqoApi) ? 'Change Source' : 'Upload New File'}
                  </button>
                </div>
              </div>
              
              <div className="mt-3">
                <CustomerSearch 
                  onCustomerSearch={handleCustomerSearch}
                  onQRCodeScan={handleQRCodeScan}
                  onArrowNavigation={handleArrowNavigation}
                  searchMessage={searchMessage}
                  onClearMessage={() => setSearchMessage('')}
                />
              </div>
            </div>
            
            {currentOrder ? (
              <OrderDisplay 
                order={currentOrder}
                orders={orders}
                currentOrderIndex={currentOrderIndex}
                onOrderComplete={handleOrderComplete}
                voiceSettings={voiceSettings}
                onMarkForReorder={handleMarkForReorder}
                stockTrackingItems={stockTrackingItems}
                onUnmarkForReorder={removeStockTrackingItem}
                autoCompleteEnabled={autoCompleteEnabled}
                packagingType={currentOrderPackagingType}
                onPreviewImageBySku={handlePreviewImageBySku}
              />
            ) : (
              <NoOrdersState 
                onFileUpload={handleFileUpload}
                onOpenSettings={() => setIsSettingsOpen(true)}
                isArchiveInitialized={isArchiveInitialized}
              />
            )}
          </div>
        </div>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentFolder={selectedFolder}
        onFolderSelect={handleFolderSelect}
        availableFiles={availableFiles}
        onFileSelect={handleFileSelect}
        onSelroFolderSelect={handleSelroFolderSelect}
        selectedSelroFolderId={selectedSelroFolderId}
        onVeeqoStatusSelect={handleVeeqoStatusSelect}
        selectedVeeqoStatus={selectedVeeqoStatus}
        selectedVeeqoWarehouseId={selectedVeeqoWarehouseId}
        onCsvUpload={handleCsvUpload}
        onSaveCsvMappings={saveCsvMappings}
        savedCsvMappings={csvColumnMappings}
        onSaveVoiceSettings={saveVoiceSettings}
        savedVoiceSettings={voiceSettings}
        stockTrackingItems={stockTrackingItems}
        onRemoveStockItem={removeStockTrackingItem}
        onClearAllStockItems={clearAllStockTrackingItems}
        onUpdateStockItem={updateStockTrackingItem}
        csvImagesFolderHandle={csvImagesFolderHandle}
        customTags={customTags}
        onSaveCustomTags={saveCustomTags}
        selectedSelroTag={selectedSelroTag}
        selectedVeeqoTag={selectedVeeqoTag}
        onSelectSelroTag={handleSelectSelroTag}
        onSelectVeeqoTag={handleSelectVeeqoTag}
        csvImagesFolderInfo={csvImagesFolderInfo}
        onSetCsvImagesFolder={setCsvImagesFolder}
        csvImagesFolderHandle={csvImagesFolderHandle}
        onLoadArchivedOrder={handleLoadArchivedOrder}
        packagingRules={packagingRules}
        onSavePackagingRules={savePackagingRules}
        customPackagingTypes={customPackagingTypes}
        onSaveCustomPackagingTypes={saveCustomPackagingTypes}
        // Other settings
        autoCompleteEnabled={autoCompleteEnabled}
        onSaveOtherSettings={saveOtherSettings}
        csvImagesFolderHandle={csvImagesFolderHandle}
      />

      <ImagePreviewModal
        isOpen={imagePreviewModal.isOpen}
        onClose={closeImagePreviewModal}
        imageUrl={imagePreviewModal.imageUrl}
        sku={imagePreviewModal.sku}
        message={imagePreviewModal.message}
        isLoading={imagePreviewModal.isLoading}
      />
    </div>
  );
};