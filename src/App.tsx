import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { FileUploadArea } from './components/FileUploadArea';
import { OrderDisplay } from './components/OrderDisplay';
import { NoOrdersState } from './components/NoOrdersState';
import { OrderSidebar } from './components/OrderSidebar';
import { CustomerSearch } from './components/CustomerSearch';
import { SettingsModal } from './components/SettingsModal';
import { useOrderData } from './hooks/useOrderData';
import { Settings as SettingsIcon, RefreshCw, Server, Warehouse } from 'lucide-react';
import { FileWithImages } from './types/Settings';

function App() {
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
    // SKU-Image CSV
    skuImageCsvInfo,
    handleSkuImageCsvUpload,
    clearSkuImageCsv,
  } = useOrderData();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [availableFiles, setAvailableFiles] = useState<FileWithImages[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load saved folder on component mount
  useEffect(() => {
    const savedFolder = localStorage.getItem('orderPickerFolder');
    if (savedFolder) {
      setSelectedFolder(savedFolder);
    }
  }, []);

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
    <Layout>
      <div className="absolute top-4 right-4">
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

      {!pdfUploaded ? (
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Welcome to OrderPick</h2>
            <p className="text-lg text-gray-600 mb-6">
              Use the settings menu to connect to Selro, Veeqo, upload HTML files, or import CSV data to get started with order picking.
            </p>
            
            <div className="flex justify-center">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <SettingsIcon className="h-5 w-5" />
                Open Settings
              </button>
            </div>
          </div>
          
          <FileUploadArea onFileUpload={handleFileUpload} />
        </div>
      ) : (
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
              />
            ) : (
              <NoOrdersState />
            )}
          </div>
        </div>
      )}

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
        customTags={customTags}
        onSaveCustomTags={saveCustomTags}
        selectedSelroTag={selectedSelroTag}
        selectedVeeqoTag={selectedVeeqoTag}
        onSelectSelroTag={handleSelectSelroTag}
        onSelectVeeqoTag={handleSelectVeeqoTag}
        skuImageCsvInfo={skuImageCsvInfo}
        onSkuImageCsvUpload={handleSkuImageCsvUpload}
        onClearSkuImageCsv={clearSkuImageCsv}
      />
    </Layout>
  );
}

export default App;