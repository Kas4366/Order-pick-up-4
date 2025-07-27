import React from 'react';
import { Search, Settings as SettingsIcon } from 'lucide-react';
import { FileUploadArea } from './FileUploadArea';

interface NoOrdersStateProps {
  onFileUpload: (file: File | any) => void;
  onOpenSettings: () => void;
  isArchiveInitialized: boolean;
}

export const NoOrdersState: React.FC<NoOrdersStateProps> = ({
  onFileUpload,
  onOpenSettings,
  isArchiveInitialized
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-10 text-center">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center">
            <Search className="h-8 w-8 text-gray-500" />
          </div>
        </div>
        
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          No Orders Loaded
        </h3>
        
        <p className="text-gray-600 max-w-md mx-auto mb-6">
          Use the settings menu to connect to Selro, Veeqo, upload HTML files, or import CSV data to get started with order picking.
        </p>
        
        {/* Archive Status Indicator */}
        {isArchiveInitialized && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 max-w-md mx-auto">
            <p className="text-sm text-green-800">
              📋 <strong>Archive System Active:</strong> All processed orders are automatically saved for future reference. 
              Search old orders by scanning QR codes or using the Archive tab in settings.
            </p>
          </div>
        )}
        
        <div className="flex justify-center">
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <SettingsIcon className="h-5 w-5" />
            Open Settings
          </button>
        </div>
      </div>
      
      <FileUploadArea onFileUpload={onFileUpload} />
    </div>
  );
};