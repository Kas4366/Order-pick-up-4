import React from 'react';
import { Package, Settings, FileText, Server, Warehouse, Archive } from 'lucide-react';

interface HomeViewProps {
  onNavigateToOrderPick: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigateToOrderPick }) => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Welcome Header */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-6">
          <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center">
            <Package className="h-10 w-10 text-blue-600" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome to OrderPick</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Your comprehensive order picking and warehouse management solution. 
          Choose from the features below to get started with streamlined order processing.
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 gap-8 mb-12 max-w-md mx-auto">
        {/* Order Pick - Primary Feature */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-blue-900">Order Picking</h3>
              <p className="text-blue-700 text-sm">Primary Feature</p>
            </div>
          </div>
          <p className="text-blue-800 mb-6">
            Process orders from multiple sources including Selro, Veeqo, HTML files, and CSV imports. 
            Features voice announcements, QR scanning, and real-time inventory tracking.
          </p>
          <button
            onClick={onNavigateToOrderPick}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Start Order Picking
          </button>
        </div>
      </div>

      {/* Quick Start Guide */}
      <div className="bg-gray-50 rounded-xl p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Quick Start Guide</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-blue-600 font-bold">1</span>
            </div>
            <h4 className="font-semibold text-gray-800 mb-2">Choose Data Source</h4>
            <p className="text-sm text-gray-600">Connect to Selro/Veeqo APIs or upload HTML/CSV files</p>
          </div>
          
          <div className="text-center">
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-blue-600 font-bold">2</span>
            </div>
            <h4 className="font-semibold text-gray-800 mb-2">Load Orders</h4>
            <p className="text-sm text-gray-600">Import your orders and configure voice settings</p>
          </div>
          
          <div className="text-center">
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-blue-600 font-bold">3</span>
            </div>
            <h4 className="font-semibold text-gray-800 mb-2">Start Picking</h4>
            <p className="text-sm text-gray-600">Use QR scanning or search to find orders quickly</p>
          </div>
          
          <div className="text-center">
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-blue-600 font-bold">4</span>
            </div>
            <h4 className="font-semibold text-gray-800 mb-2">Track Progress</h4>
            <p className="text-sm text-gray-600">Mark orders complete and track inventory levels</p>
          </div>
        </div>
      </div>

      {/* Features Overview */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
              <Package className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">Multi-Source Integration</h4>
              <p className="text-sm text-gray-600">Support for Selro, Veeqo, HTML, and CSV data sources</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
              <Settings className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">Voice Announcements</h4>
              <p className="text-sm text-gray-600">Configurable voice reading of order details</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
              <FileText className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">QR Code Scanning</h4>
              <p className="text-sm text-gray-600">Fast order lookup using shipping label QR codes</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
              <Archive className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">Automatic Archiving</h4>
              <p className="text-sm text-gray-600">All orders automatically saved for future reference</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
              <Server className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">Stock Tracking</h4>
              <p className="text-sm text-gray-600">Monitor inventory levels and mark items for reorder</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
              <Warehouse className="h-4 w-4 text-yellow-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">Custom Tags</h4>
              <p className="text-sm text-gray-600">Filter orders using custom tags and categories</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};