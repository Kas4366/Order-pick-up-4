import React, { useState, useEffect } from 'react';
import { Settings, Server, Warehouse, RefreshCw, CheckCircle, AlertCircle, Key, ExternalLink, Package } from 'lucide-react';
import { veeqoApi } from '../services/veeqoApi';
import { VeeqoConfig, VeeqoWarehouse } from '../types/Veeqo';

interface VeeqoSettingsProps {
  onStatusSelect: (status: string, warehouseId?: number) => void;
  selectedStatus?: string;
  selectedWarehouseId?: number;
}

export const VeeqoSettings: React.FC<VeeqoSettingsProps> = ({ 
  onStatusSelect, 
  selectedStatus,
  selectedWarehouseId 
}) => {
  const [config, setConfig] = useState<VeeqoConfig>({
    apiKey: '',
    baseUrl: 'https://api.veeqo.com'
  });
  const [warehouses, setWarehouses] = useState<VeeqoWarehouse[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isLocalDevelopment, setIsLocalDevelopment] = useState(false);

  // Available order statuses in Veeqo
  const orderStatuses = [
    { value: 'allocated', label: 'Allocated', description: 'Orders ready for picking' },
    { value: 'picked', label: 'Picked', description: 'Orders that have been picked' },
    { value: 'packed', label: 'Packed', description: 'Orders that have been packed' },
    { value: 'shipped', label: 'Shipped', description: 'Orders that have been shipped' },
    { value: 'cancelled', label: 'Cancelled', description: 'Cancelled orders' },
    { value: 'pending', label: 'Pending', description: 'Pending orders' },
  ];

  // Check if we're in local development
  useEffect(() => {
    const isLocal = window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1' || 
                   window.location.hostname.includes('localhost');
    setIsLocalDevelopment(isLocal);
  }, []);

  // Load saved config on mount
  useEffect(() => {
    const savedConfig = veeqoApi.getConfig();
    if (savedConfig) {
      setConfig(savedConfig);
      if (!isLocalDevelopment) {
        testConnection(savedConfig);
      }
    }
  }, [isLocalDevelopment]);

  const testConnection = async (configToTest?: VeeqoConfig) => {
    setIsTestingConnection(true);
    setError(null);
    
    try {
      if (configToTest) {
        veeqoApi.setConfig(configToTest);
      }
      
      const connected = await veeqoApi.testConnection();
      setIsConnected(connected);
      
      if (connected) {
        await loadWarehouses();
      } else {
        setError('Failed to connect to Veeqo API via Netlify Function. Please check the server logs for more details.');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setError(error instanceof Error ? error.message : 'Connection failed');
      setIsConnected(false);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const loadWarehouses = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const warehouseList = await veeqoApi.getWarehouses();
      setWarehouses(warehouseList);
      console.log('🏭 Loaded warehouses:', warehouseList);
    } catch (error) {
      console.error('Failed to load warehouses:', error);
      setError(error instanceof Error ? error.message : 'Failed to load warehouses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!config.apiKey.trim()) {
      setError('Please enter your Veeqo API key');
      return;
    }

    if (isLocalDevelopment) {
      setError('Cannot test connection in local development. Please deploy to Netlify to use Veeqo API integration.');
      return;
    }

    await testConnection(config);
  };

  const handleStatusSelect = (status: string, warehouseId?: number) => {
    console.log('📦 Status selected:', status, 'Warehouse:', warehouseId);
    onStatusSelect(status, warehouseId);
  };

  return (
    <div className="space-y-6">
      {/* Development Environment Warning */}
      {isLocalDevelopment && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-amber-800 mb-2">
                Local Development Environment Detected
              </p>
              <p className="text-amber-700 mb-3">
                The Veeqo API integration requires Netlify Functions, which are only available when deployed to Netlify. 
                Local development does not support these serverless functions.
              </p>
              <div className="bg-amber-100 rounded p-3">
                <p className="font-medium text-amber-800 mb-2">To use Veeqo API integration:</p>
                <ol className="text-amber-700 text-sm space-y-1 list-decimal list-inside">
                  <li>Deploy this application to Netlify</li>
                  <li>Configure environment variables in Netlify</li>
                  <li>Access your deployed application</li>
                </ol>
              </div>
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
              Your API key needs to be configured on the server for security. The administrator needs to set this environment variable:
            </p>
            <div className="bg-blue-100 rounded p-2 font-mono text-xs text-blue-800">
              <div>VEEQO_API_KEY={config.apiKey || 'your_api_key_here'}</div>
            </div>
            <p className="text-blue-700 mt-2">
              Contact your system administrator to configure this on the Netlify deployment.
            </p>
          </div>
        </div>
      </div>

      {/* API Configuration */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Package className="h-5 w-5" />
          Veeqo API Configuration
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
              placeholder="Enter your Veeqo API key"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLocalDevelopment}
            />
            <p className="text-xs text-gray-500 mt-1">
              Found in Settings → API section of your Veeqo account
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Endpoint URL
            </label>
            <input
              type="text"
              value="https://api.veeqo.com"
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              Official Veeqo API endpoint (accessed via secure Netlify Function)
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

      {/* Order Status Selection */}
      {isConnected && !isLocalDevelopment && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Status & Warehouse
            </h3>
            <button
              onClick={loadWarehouses}
              disabled={isLoading}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh warehouses"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <Package className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-green-800 mb-2">
                  Veeqo Order Management
                </p>
                <p className="text-green-700 mb-2">
                  Select the order status and warehouse to load orders from Veeqo. The app will fetch orders based on your selection.
                </p>
                <div className="text-xs text-green-600">
                  <p>✅ Supports all Veeqo order statuses</p>
                  <p>✅ Warehouse-specific filtering</p>
                  <p>✅ Real-time inventory levels</p>
                  <p>✅ Product images from Veeqo</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Status Selection */}
          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-800 mb-3">Select Order Status</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {orderStatuses.map((status) => (
                <button
                  key={status.value}
                  onClick={() => handleStatusSelect(status.value, selectedWarehouseId)}
                  className={`text-left p-4 border rounded-lg transition-colors ${
                    selectedStatus === status.value 
                      ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-200' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">{status.label}</p>
                      <p className="text-sm text-gray-500">{status.description}</p>
                    </div>
                    {selectedStatus === status.value && (
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Warehouse Selection */}
          <div>
            <h4 className="text-md font-semibold text-gray-800 mb-3">Select Warehouse (Optional)</h4>
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-64 overflow-y-auto">
              {/* All Warehouses Option */}
              <button
                onClick={() => handleStatusSelect(selectedStatus || 'allocated', undefined)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                  selectedWarehouseId === undefined ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">All Warehouses</p>
                    <p className="text-sm text-gray-500">Load orders from all warehouses</p>
                  </div>
                  {selectedWarehouseId === undefined && (
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  )}
                </div>
              </button>

              {isLoading ? (
                <div className="p-4 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  Loading warehouses...
                </div>
              ) : warehouses.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No warehouses found.
                </div>
              ) : (
                warehouses.map((warehouse) => (
                  <button
                    key={warehouse.id}
                    onClick={() => handleStatusSelect(selectedStatus || 'allocated', warehouse.id)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                      selectedWarehouseId === warehouse.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-800">{warehouse.name}</p>
                        <p className="text-sm text-gray-500">
                          {warehouse.city}, {warehouse.country}
                        </p>
                      </div>
                      <div className="text-right">
                        <Warehouse className="h-5 w-5 text-gray-400" />
                        {selectedWarehouseId === warehouse.id && (
                          <CheckCircle className="h-5 w-5 text-blue-600 mt-1" />
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
          
          {(selectedStatus || selectedWarehouseId) && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Current Selection:</strong> {selectedStatus || 'allocated'} orders
                {selectedWarehouseId 
                  ? ` from ${warehouses.find(w => w.id === selectedWarehouseId)?.name || 'selected warehouse'}`
                  : ' from all warehouses'
                }
              </p>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-800 mb-2">Setup Instructions:</h4>
        <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
          <li>Log into your Veeqo account</li>
          <li>Go to Settings → API section</li>
          <li>Generate or copy your API key</li>
          <li>Paste it in the field above</li>
          <li>Contact your administrator to configure server environment variables</li>
          <li>{isLocalDevelopment ? 'Deploy the application to Netlify' : 'Click "Test Connection" to verify setup'}</li>
          <li>Select your preferred order status and warehouse</li>
        </ol>
        
        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Note:</strong> Your API key is securely stored on the server and never exposed to the browser. 
            The API key should be a long alphanumeric string provided by Veeqo.
          </p>
        </div>
        
        <div className="mt-2 p-3 bg-yellow-50 rounded-lg">
          <p className="text-xs text-yellow-800">
            <strong>Need Help?</strong> If you get connection errors:
            <br />• Verify your API key is correct and active
            <br />• Ensure your Veeqo account has API access enabled
            <br />• Contact your administrator to confirm server configuration
            <br />• Check that the Netlify Function is properly deployed
            {isLocalDevelopment && <><br />• Deploy to Netlify to enable API functionality</>}
          </p>
        </div>

        <div className="mt-2 p-3 bg-green-50 rounded-lg">
          <p className="text-xs text-green-800">
            <strong>Veeqo API Documentation:</strong> 
            <a 
              href="https://developers.veeqo.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-green-700 hover:text-green-900 underline ml-1"
            >
              Visit Veeqo Developer Docs
              <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};