import React, { useRef, useState } from 'react';
import { Upload, FileText, Folder } from 'lucide-react';

interface FileUploadAreaProps {
  onFileUpload: (file: File | FileWithImages) => void;
}

interface FileWithImages {
  name: string;
  path: string;
  imagesFolderPath: string;
  fileHandle?: File;
  directoryHandle?: FileSystemDirectoryHandle;
  imagesFolderHandle?: FileSystemDirectoryHandle;
}

export const FileUploadArea: React.FC<FileUploadAreaProps> = ({ onFileUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  // Function to find the images folder for a given HTML file
  const findImagesFolder = async (htmlFile: File): Promise<FileSystemDirectoryHandle | null> => {
    try {
      console.log('🔍 Attempting to find images folder for:', htmlFile.name);
      
      // Check if File System Access API is supported
      if (!('showDirectoryPicker' in window)) {
        console.log('⚠️  File System Access API not supported');
        return null;
      }

      // Ask user to select the folder containing the HTML file
      const directoryHandle = await window.showDirectoryPicker({
        mode: 'read',
        startIn: 'documents'
      });

      console.log('📁 User selected directory:', directoryHandle.name);

      // Get the base name of the HTML file (without extension)
      const baseName = htmlFile.name.replace(/\.(html|htm)$/i, '');
      console.log('🔍 Looking for images folder with base name:', baseName);

      // Try to find the images folder with common naming patterns
      const possibleFolderNames = [
        `${baseName}_files`,  // Most common pattern
        `${baseName}`,        // Sometimes without _files suffix
        `${baseName}_images`, // Alternative pattern
        `images`,             // Generic images folder
        `assets`              // Another common pattern
      ];

      for (const folderName of possibleFolderNames) {
        try {
          console.log(`🔍 Trying to find folder: "${folderName}"`);
          const imagesFolderHandle = await directoryHandle.getDirectoryHandle(folderName);
          console.log(`✅ Found images folder: "${folderName}"`);
          return imagesFolderHandle;
        } catch (error) {
          console.log(`❌ Folder "${folderName}" not found`);
          continue;
        }
      }

      console.log('⚠️  No images folder found with standard naming patterns');
      
      // List all directories in the selected folder for debugging
      const allDirs: string[] = [];
      for await (const [name, handle] of directoryHandle.entries()) {
        if (handle.kind === 'directory') {
          allDirs.push(name);
        }
      }
      console.log('📁 Available directories:', allDirs);

      return null;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('🚫 User cancelled folder selection');
      } else {
        console.error('❌ Error finding images folder:', error);
      }
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    
    try {
      console.log('🚀 Processing file:', selectedFile.name);
      
      // Try to find the images folder
      const imagesFolderHandle = await findImagesFolder(selectedFile);
      
      if (imagesFolderHandle) {
        console.log('✅ Images folder found, creating FileWithImages object');
        
        // Create a FileWithImages object similar to the settings modal
        const fileWithImages: FileWithImages = {
          name: selectedFile.name,
          path: selectedFile.name,
          imagesFolderPath: imagesFolderHandle.name,
          fileHandle: selectedFile,
          imagesFolderHandle: imagesFolderHandle
        };
        
        onFileUpload(fileWithImages);
      } else {
        console.log('⚠️  No images folder found, proceeding without images');
        // Proceed with just the HTML file (no images)
        onFileUpload(selectedFile);
      }
    } catch (error) {
      console.error('❌ Error processing file:', error);
      alert('Error processing the file. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 w-full">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to OrderPick</h2>
        <p className="text-gray-600">
          Upload your order HTML file to get started with scanning and processing orders.
        </p>
      </div>
      
      <div 
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
        }`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center">
          <div className="mb-4">
            {selectedFile ? (
              <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            ) : (
              <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center">
                <Upload className="h-8 w-8 text-gray-500" />
              </div>
            )}
          </div>
          
          {selectedFile ? (
            <div>
              <p className="text-lg font-medium text-gray-700">{selectedFile.name}</p>
              <p className="text-sm text-gray-500">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          ) : (
            <div>
              <p className="text-lg font-medium text-gray-700">
                Drop your HTML file here or click to browse
              </p>
              <p className="text-sm text-gray-500 mt-1">
                HTML files only
              </p>
            </div>
          )}
        </div>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".html,.htm"
          className="hidden"
        />
      </div>
      
      {selectedFile && (
        <div className="mt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <Folder className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-blue-800 mb-1">
                  Enhanced Image Support
                </p>
                <p className="text-blue-700">
                  When you click "Process Order HTML", you'll be asked to select the folder containing your HTML file. 
                  This allows the app to automatically find and load product images from the associated images folder.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center">
            <button
              onClick={handleSubmit}
              disabled={isProcessing}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                'Process Order HTML'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};