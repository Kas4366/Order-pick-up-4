import React from 'react';
import { X, Image, AlertCircle, Folder } from 'lucide-react';

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string;
  sku: string;
  message?: string;
  isLoading?: boolean;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  sku,
  message,
  isLoading = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Image className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-800">
              Image Preview: {sku}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Searching for image in local folder...</p>
            </div>
          ) : imageUrl ? (
            <div className="text-center">
              <div className="bg-gray-100 rounded-lg p-4 mb-4 inline-block">
                <img 
                  src={imageUrl} 
                  alt={`Product image for ${sku}`}
                  className="max-w-full max-h-96 object-contain"
                  style={{ maxHeight: '400px' }}
                />
              </div>
              <p className="text-sm text-green-600 flex items-center justify-center gap-2">
                <Image className="h-4 w-4" />
                Image found and loaded successfully
              </p>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="flex flex-col items-center">
                {message?.includes('No local images folder') ? (
                  <>
                    <Folder className="h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">No Images Folder Selected</h3>
                    <p className="text-gray-600 text-center max-w-md">
                      Please select a local images folder in the CSV Upload settings to use this feature.
                    </p>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-16 w-16 text-orange-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">Image Not Found</h3>
                    <p className="text-gray-600 text-center max-w-md">
                      {message || `No image found for SKU "${sku}" in the local images folder.`}
                    </p>
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg text-left">
                      <p className="text-sm text-blue-800 font-medium mb-2">The app searched for:</p>
                      <div className="text-xs text-blue-700 space-y-1">
                        <p>• {sku}.jpg, {sku}.JPG</p>
                        <p>• {sku}.png, {sku}.PNG</p>
                        <p>• {sku}.jpeg, {sku}.JPEG</p>
                        <p>• And other supported extensions (gif, webp, bmp, svg)</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 bg-gray-50 border-t border-gray-200">
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