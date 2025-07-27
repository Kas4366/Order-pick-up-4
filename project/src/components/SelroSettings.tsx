import React, { useState, useEffect } from 'react';
import { Settings, Server, Folder, RefreshCw, CheckCircle, AlertCircle, Key, Lock, ExternalLink, Globe, AlertTriangle } from 'lucide-react';
import { selroApi } from '../services/selroApi';
import { SelroConfig, SelroFolder } from '../types/Selro';

interface SelroSettingsProps {
  onFolderSelect: (folderId: string, folderName: string) => void;
  selectedFolderId?: string;
}

export const SelroSettings: React.FC<SelroSettingsProps> = ({ 
  onFolderSelect, 
  selectedFolderId 
}) => {
  const [config, setConfig] = useState<SelroConfig>({
    apiKey: '',
    apiSecret: '',
    baseUrl: 'https://api.selro.com/4'
  });
  const [folders, setFolders] = useState<SelroFolder[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isLocalDevelopment, setIsLocalDevelopment] = useState(false);

  // Check if we're in local development
  useEffect(() => {
    const isLocal = window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1' || 
                   window.location.hostname.includes('localhost');
    setIsLocalDevelopment(isLocal);
  }, []);

  // Load saved config on mount
  useEffect(() => {
    const savedConfig = selroApi.getConfig();
    if (savedConfig) {
      setConfig(savedConfig);
      if (!isLocalDevelopment) {
        testConnection(savedConfig);
      }
    }
  }, [isLocalDevelopment]);

  const testConnection = async (configToTest?: SelroConfig) => {
    setIsTestingConnection(true);
    setError(null);
    
    try {
      if (configToTest) {
        selroApi.setConfig(configToTest);
      }
      
      const connected = await selroApi.testConnection();
      setIsConnected(connected);
      
      if (connected) {
        await loadFolders();
      } else {
        setError('Failed to connect to Selro API via Netlify Function. Please check the server logs for more details.');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setError(error instanceof Error ? error.message : 'Connection failed');
      setIsConnected(false);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const loadFolders = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const folderList = await selroApi.getFolders();
      setFolders(folderList);
      console.log('📁 Loaded folders:', folderList);
    } catch (error) {
      console.error('Failed to load folders:', error);
      setError(error instanceof Error ? error.message : 'Failed to load folders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!config.apiKey.trim()) {
      setError('Please enter your Selro API key');
      return;
    }

    if (!config.apiSecret.trim()) {
      setError('Please enter your Selro API secret');
      return;
    }

    if (isLocalDevelopment) {
      setError('Cannot test connection in local development. Please deploy to Netlify to use Selro API integration.');
      return;
    }

    await testConnection(config);
  };

  const handleFolderSelect = (folder: SelroFolder) => {
    console.log('📁 Folder selected:', folder);
    onFolderSelect(folder.id, folder.name);
  };

  return (
    <div className="space-y-6">
      {/* Development Environment Warning */}
      {isLocalDevelopment && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-amber-800 mb-2">
                Local Development Environment Detected
              </p>
              <p className="text-amber-700 mb-3">
                The Selro API integration requires Netlify Functions, which are only available when deployed to Netlify. 
                Local development does not support these serverless functions.
              </p>
              <div className="bg-amber-100 rounded p-3">
                <p className="font-medium text-amber-800 mb-2">To use Selro API integration:</p>
                <ol className="text-amber-700 text-sm space-y-1 list-decimal list-inside">
                  <li>Deploy this application to Netlify</li>
                  <li>Configure environment variables in Netlify</li>
                  <li>Access your deployed application</li>
                </ol>
              </div>
              <p className="text-amber-700 mt-2 text-xs">
                Refer to the deployment guide (COMPLETE_DEPLOYMENT_GUIDE.md) for detailed instructions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Important Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Server className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-blue-800 mb-2">
              Server Configuration Required
            </p>
            <p className="text-blue-700 mb-3">
              Your API credentials need to be configured on the server for security. The administrator needs to set these environment variables:
            </p>
            <div className="bg-blue-100 rounded p-2 font-mono text-xs text-blue-800">
              <div>SELRO_API_KEY={config.apiKey || 'your_api_key_here'}</div>
              <div>SELRO_API_SECRET={config.apiSecret || 'your_api_secret_here'}</div>
            </div>
            <p className="text-blue-700 mt-2">
              Contact your system administrator to configure these on the Netlify deployment.
            </p>
          </div>
        </div>
      </div>

      {/* API Configuration */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Server className="h-5 w-5" />
          Selro API Configuration
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Key className="h-4 w-4" />
              API Key
            </label>
            <input
              type="password"
              value={config.apiKey}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              placeholder="Enter your Selro API key (e.g., app4_keyd1cb8bad-c750-437f-b722-071d9318dde9)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLocalDevelopment}
            />
            <p className="text-xs text-gray-500 mt-1">
              Found in Channel Integration → API section of your Selro account
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Lock className="h-4 w-4" />
              API Secret
            </label>
            <input
              type="password"
              value={config.apiSecret}
              onChange={(e) => setConfig({ ...config, apiSecret: e.target.value })}
              placeholder="Enter your Selro API secret (e.g., app4_secretbbcdfc8c-bbd3-4e3e-adc0-2680ca8e98b6)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLocalDevelopment}
            />
            <p className="text-xs text-gray-500 mt-1">
              Found alongside your API key in the Channel Integration settings
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Endpoint URL
            </label>
            <input
              type="text"
              value="https://api.selro.com/4"
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              Official Selro API endpoint (accessed via secure Netlify Function)
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveConfig}
              disabled={isTestingConnection || isLocalDevelopment}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isTestingConnection ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Testing Connection...
                </>
              ) : (
                <>
                  <Settings className="h-4 w-4" />
                  {isLocalDevelopment ? 'Deploy to Test' : 'Test Connection'}
                </>
              )}
            </button>
            
            {isConnected && !isLocalDevelopment && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Connected Successfully</span>
              </div>
            )}
          </div>
          
          {error && (
            <div className="flex items-start gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium mb-1">Connection Error</p>
                <p className="whitespace-pre-line">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Folder Selection */}
      {isConnected && !isLocalDevelopment && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Folder className="h-5 w-5" />
              Order Processing Folders
            </h3>
            <button
              onClick={loadFolders}
              disabled={isLoading}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh folders"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <Folder className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-green-800 mb-2">
                  Tag-Based Folder Filtering
                </p>
                <p className="text-green-700 mb-2">
                  The app now filters orders by the tags/folders you've created in Selro's Processing Orders tab. 
                  When you select a folder below, only orders with that specific tag will be loaded.
                </p>
                <div className="text-xs text-green-600">
                  <p>✅ Supports custom folder names like "PCK Picked", "Ready to Pick", etc.</p>
                  <p>✅ Only shows folders that contain orders</p>
                  <p>✅ "All Orders" shows unfiltered results</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                Loading folders...
              </div>
            ) : folders.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No folders found. Using default order processing.
              </div>
            ) : (
              folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => handleFolderSelect(folder)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                    selectedFolderId === folder.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">{folder.name}</p>
                      {folder.description && (
                        <p className="text-sm text-gray-500">{folder.description}</p>
                      )}
                      {folder.id !== 'all' && (
                        <p className="text-xs text-blue-600 mt-1">
                          Tag: "{folder.name}"
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {folder.orderCount} orders
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
          
          {selectedFolderId && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Selected folder:</strong> {folders.find(f => f.id === selectedFolderId)?.name || 'Default'}
              </p>
              {selectedFolderId !== 'all' && (
                <p className="text-xs text-blue-600 mt-1">
                  Only orders tagged with "{folders.find(f => f.id === selectedFolderId)?.name}" will be loaded
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-800 mb-2">Setup Instructions:</h4>
        <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
          <li>Log into your Selro account</li>
          <li>Go to Channel Integration → API section</li>
          <li>Copy your API Key and API Secret</li>
          <li>Paste them in the fields above</li>
          <li>Contact your administrator to configure server environment variables</li>
          <li>{isLocalDevelopment ? 'Deploy the application to Netlify' : 'Click "Test Connection" to verify setup'}</li>
          <li>Select your preferred order processing folder</li>
        </ol>
        
        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Note:</strong> Your API credentials are securely stored on the server and never exposed to the browser. 
            The API key should start with "app4_key\" and the secret should start with \"app4_secret".
          </p>
        </div>
        
        <div className="mt-2 p-3 bg-yellow-50 rounded-lg">
          <p className="text-xs text-yellow-800">
            <strong>Need Help?</strong> If you get connection errors:
            <br />• Verify your API credentials are correct and active
            <br />• Ensure your Selro account has API access enabled
            <br />• Contact your administrator to confirm server configuration
            <br />• Check that the Netlify Function is properly deployed
            {isLocalDevelopment && <><br />• Deploy to Netlify to enable API functionality</>}
          </p>
        </div>
      </div>
    </div>
  );
};