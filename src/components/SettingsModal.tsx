import React, { useState, useEffect } from 'react';
import { Settings, X, Upload, Server, FileText, Volume2, Package, Warehouse, Tag, Archive, Sliders, Truck } from 'lucide-react';
import { FileWithImages } from '../types/Settings';
import { ArchivedOrder } from '../types/Archive';
import { PackagingRule } from '../types/Packaging';
import { SelroSettings } from './SelroSettings';
import { VeeqoSettings } from './VeeqoSettings';
import { CsvSettings } from './CsvSettings';
import { VoiceSettingsComponent } from './VoiceSettings';
import { StockTrackingTab } from './StockTrackingTab';
import { CustomTagSettings } from './CustomTagSettings';
import { PackagingRulesSettings } from './PackagingRulesSettings';
import { ArchiveSettings } from './ArchiveSettings';
import { OtherSettings } from './OtherSettings';
import { CsvColumnMapping, LocalImagesFolderInfo } from '../types/Csv';
import { VoiceSettings } from '../types/VoiceSettings';
import { StockTrackingItem } from '../types/StockTracking';
import { CustomTag } from '../types/CustomTags';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFolder: string;
  onFolderSelect: (path: string) => void;
  availableFiles: FileWithImages[];
  onFileSelect: (file: FileWithImages) => void;
  onSelroFolderSelect?: (folderId: string, folderName: string) => void;
  selectedSelroFolderId?: string;
  onVeeqoStatusSelect?: (status: string, warehouseId?: number) => void;
  selectedVeeqoStatus?: string;
  selectedVeeqoWarehouseId?: number;
  onCsvUpload: (file: File, mappings: CsvColumnMapping) => void;
  onSaveCsvMappings: (mappings: CsvColumnMapping) => void;
  savedCsvMappings: CsvColumnMapping;
  onSaveVoiceSettings: (settings: VoiceSettings) => void;
  savedVoiceSettings: VoiceSettings;
  stockTrackingItems: StockTrackingItem[];
  onRemoveStockItem: (sku: string, markedDate: string) => void;
  onClearAllStockItems: () => void;
  onUpdateStockItem?: (sku: string, markedDate: string, updates: Partial<StockTrackingItem>) => void;
  // Custom tags props
  customTags?: CustomTag[];
  onSaveCustomTags?: (tags: CustomTag[]) => void;
  selectedSelroTag?: string;
  selectedVeeqoTag?: string;
  onSelectSelroTag?: (tagName: string) => void;
  onSelectVeeqoTag?: (tagName: string) => void;
  // CSV Images Folder props
  csvImagesFolderInfo?: LocalImagesFolderInfo | null;
  onSetCsvImagesFolder?: () => Promise<void>;
  // Archive props
  onLoadArchivedOrder?: (order: ArchivedOrder) => void;
  // Packaging rules props
  packagingRules?: PackagingRule[];
  onSavePackagingRules?: (rules: PackagingRule[]) => void;
  customPackagingTypes?: string[];
  onSaveCustomPackagingTypes?: (types: string[]) => void;
  // Other settings props
  autoCompleteEnabled?: boolean;
  onSaveOtherSettings?: (settings: { autoCompleteEnabled: boolean }) => void;
  // Box rules props
  boxRules?: PackagingRule[];
  onSaveBoxRules?: (rules: PackagingRule[]) => void;
  customBoxNames?: string[];
  onSaveBoxNames?: (names: string[]) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentFolder,
  onFolderSelect,
  availableFiles,
  onFileSelect,
  onSelroFolderSelect,
  selectedSelroFolderId,
  onVeeqoStatusSelect,
  selectedVeeqoStatus,
  selectedVeeqoWarehouseId,
  onCsvUpload,
  onSaveCsvMappings,
  savedCsvMappings,
  onSaveVoiceSettings,
  savedVoiceSettings,
  stockTrackingItems,
  onRemoveStockItem,
  onClearAllStockItems,
  onUpdateStockItem,
  customTags = [],
  onSaveCustomTags = () => {},
  selectedSelroTag,
  selectedVeeqoTag,
  onSelectSelroTag = () => {},
  onSelectVeeqoTag = () => {},
  csvImagesFolderInfo,
  onSetCsvImagesFolder,
  onLoadArchivedOrder,
  packagingRules = [],
  onSavePackagingRules = () => {},
  customPackagingTypes = [],
  onSaveCustomPackagingTypes = () => {},
  autoCompleteEnabled = false,
  onSaveOtherSettings,
  boxRules = [],
  onSaveBoxRules = () => {},
  customBoxNames = [],
  onSaveBoxNames = () => {},
}) => {
  const [activeTab, setActiveTab] = useState<'archive' | 'tags' | 'packaging' | 'selro' | 'veeqo' | 'files' | 'csv' | 'voice' | 'stock' | 'other'>('archive');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-800">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('archive')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'archive'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Archive className="h-4 w-4" />
                Archive
              </div>
            </button>
            <button
              onClick={() => setActiveTab('tags')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'tags'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Custom Tags
              </div>
            </button>
            <button
              onClick={() => setActiveTab('packaging')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'packaging'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Packaging Rules
              </div>
            </button>
            <button
              onClick={() => setActiveTab('selro')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'selro'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                Selro API
              </div>
            </button>
            <button
              onClick={() => setActiveTab('veeqo')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'veeqo'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Warehouse className="h-4 w-4" />
                Veeqo API
              </div>
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'files'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                HTML Upload
              </div>
            </button>
            <button
              onClick={() => setActiveTab('csv')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'csv'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                CSV Upload
              </div>
            </button>
            <button
              onClick={() => setActiveTab('voice')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'voice'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                Voice Control
              </div>
            </button>
            <button
              onClick={() => setActiveTab('stock')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'stock'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Items to Order
                {stockTrackingItems.length > 0 && (
                  <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center">
                    {stockTrackingItems.length}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('other')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'other'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4" />
                Other Settings
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {activeTab === 'archive' && (
            <ArchiveSettings
              onLoadArchivedOrder={onLoadArchivedOrder}
            />
          )}

          {activeTab === 'tags' && (
            <CustomTagSettings
              customTags={customTags}
              onSaveTags={onSaveCustomTags}
              selectedSelroTag={selectedSelroTag}
              selectedVeeqoTag={selectedVeeqoTag}
              onSelectSelroTag={onSelectSelroTag}
              onSelectVeeqoTag={onSelectVeeqoTag}
            />
          )}

          {activeTab === 'packaging' && (
            <PackagingRulesSettings
              rules={packagingRules}
              onSaveRules={onSavePackagingRules}
              customPackagingTypes={customPackagingTypes}
              onSavePackagingTypes={onSaveCustomPackagingTypes}
              boxRules={boxRules}
              onSaveBoxRules={onSaveBoxRules}
              customBoxNames={customBoxNames}
              onSaveBoxNames={onSaveBoxNames}
            />
          )}

          {activeTab === 'selro' && (
            <SelroSettings
              onFolderSelect={onSelroFolderSelect || (() => {})}
              selectedFolderId={selectedSelroFolderId}
            />
          )}

          {activeTab === 'veeqo' && (
            <VeeqoSettings
              onStatusSelect={onVeeqoStatusSelect || (() => {})}
              selectedStatus={selectedVeeqoStatus}
              selectedWarehouseId={selectedVeeqoWarehouseId}
            />
          )}

          {activeTab === 'files' && (
            <FileUploadSettings
              currentFolder={currentFolder}
              onFolderSelect={onFolderSelect}
              availableFiles={availableFiles}
              onFileSelect={onFileSelect}
            />
          )}

          {activeTab === 'csv' && (
            <CsvSettings
              onCsvUpload={onCsvUpload}
              onSaveMappings={onSaveCsvMappings}
              savedMappings={savedCsvMappings}
              csvImagesFolderInfo={csvImagesFolderInfo}
              onSetCsvImagesFolder={onSetCsvImagesFolder}
            />
          )}

          {activeTab === 'voice' && (
            <VoiceSettingsComponent
              onSaveSettings={onSaveVoiceSettings}
              savedSettings={savedVoiceSettings}
            />
          )}

          {activeTab === 'stock' && (
            <StockTrackingTab
              stockItems={stockTrackingItems}
              onRemoveItem={onRemoveStockItem}
              onUpdateItem={onUpdateStockItem}
              csvImagesFolderInfo={csvImagesFolderInfo}
              onSetCsvImagesFolder={onSetCsvImagesFolder}
            />
          )}

          {activeTab === 'other' && (
            <OtherSettings
              autoCompleteEnabled={autoCompleteEnabled}
              onSaveSettings={onSaveOtherSettings || (() => {})}
            />
          )}
        </div>

        <div className="flex justify-end gap-3 p-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// File upload settings component (extracted from original SettingsModal)
const FileUploadSettings: React.FC<{
  currentFolder: string;
  onFolderSelect: (path: string) => void;
  availableFiles: FileWithImages[];
  onFileSelect: (file: FileWithImages) => void;
}> = ({ currentFolder, onFolderSelect, availableFiles, onFileSelect }) => {
  const [selectedFolder, setSelectedFolder] = useState(currentFolder);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<FileWithImages[]>([]);
  const [folderHandle, setFolderHandle] = useState<FileSystemDirectoryHandle | null>(null);

  useEffect(() => {
    const savedFolder = localStorage.getItem('orderPickerFolder');
    if (savedFolder && !currentFolder) {
      setSelectedFolder(savedFolder);
      onFolderSelect(savedFolder);
    }
  }, [currentFolder, onFolderSelect]);

  useEffect(() => {
    setFiles(availableFiles);
  }, [availableFiles]);

  const handleFolderSelect = async () => {
    try {
      setLoading(true);
      const dirHandle = await window.showDirectoryPicker();
      
      setFolderHandle(dirHandle);
      const folderPath = dirHandle.name;
      setSelectedFolder(folderPath);
      localStorage.setItem('orderPickerFolder', folderPath);

      const foundFiles: FileWithImages[] = [];
      
      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file' && (entry.name.endsWith('.html') || entry.name.endsWith('.htm'))) {
          const baseName = entry.name.replace(/\.(html|htm)$/i, '');
          let imagesFolderHandle: FileSystemDirectoryHandle | null = null;
          
          try {
            const imageFolderName = `${baseName}_files`;
            imagesFolderHandle = await dirHandle.getDirectoryHandle(imageFolderName);
          } catch (error) {
            try {
              imagesFolderHandle = await dirHandle.getDirectoryHandle(baseName);
            } catch (error2) {
              console.warn(`No image folder found for ${entry.name}`);
            }
          }

          const fileHandle = await entry.getFile();
          
          foundFiles.push({
            name: entry.name,
            path: `${folderPath}/${entry.name}`,
            imagesFolderPath: imagesFolderHandle ? `${folderPath}/${imagesFolderHandle.name}` : '',
            fileHandle,
            directoryHandle: dirHandle,
            imagesFolderHandle
          });
        }
      }

      setFiles(foundFiles);
      onFolderSelect(folderPath);
    } catch (error) {
      console.error('Error selecting folder:', error);
      if (error.name !== 'AbortError') {
        alert('Failed to access the selected folder. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelection = async (file: FileWithImages) => {
    try {
      if (!file.fileHandle) {
        throw new Error('No file handle available');
      }
      
      await onFileSelect({
        ...file,
        directoryHandle: folderHandle || file.directoryHandle,
        imagesFolderHandle: file.imagesFolderHandle
      });
    } catch (error) {
      console.error('Error selecting file:', error);
      alert('Failed to process the selected file. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Local File Upload
        </h3>
        <p className="text-gray-600 mb-4">
          Upload HTML files from your local computer as an alternative to API integrations.
        </p>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Order Files Location</h4>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={selectedFolder}
            readOnly
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            placeholder="No folder selected"
          />
          <button
            onClick={handleFolderSelect}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            {loading ? 'Scanning...' : 'Browse'}
          </button>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Available Order Files</h4>
        <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-64 overflow-y-auto">
          {files.map((file) => (
            <button
              key={file.path}
              onClick={() => handleFileSelection(file)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center justify-between"
            >
              <div>
                <p className="font-medium text-gray-800">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {file.imagesFolderHandle ? 
                    `✓ Images folder: ${file.imagesFolderHandle.name}` : 
                    '✗ No image folder found'
                  }
                </p>
              </div>
              <Upload className="h-5 w-5 text-gray-400" />
            </button>
          ))}
          {files.length === 0 && (
            <div className="px-4 py-3 text-gray-500 text-center">
              {loading ? 'Scanning folder...' : selectedFolder ? 'No HTML files found in the selected folder' : 'Please select a folder first'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};