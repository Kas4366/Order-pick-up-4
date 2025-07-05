import React, { useState, useEffect } from 'react';
import { Archive, Calendar, FileText, Trash2, Download, Search, Database, Clock, Package, Chrome as Broom } from 'lucide-react';
import { archiveService } from '../services/archiveService';
import { ArchiveStats, ArchivedOrder } from '../types/Archive';

interface ArchiveSettingsProps {
  onLoadArchivedOrder?: (order: ArchivedOrder) => void;
}

export const ArchiveSettings: React.FC<ArchiveSettingsProps> = ({
  onLoadArchivedOrder
}) => {
  const [stats, setStats] = useState<ArchiveStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ArchivedOrder[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [archivedFiles, setArchivedFiles] = useState<string[]>([]);
  const [selectedDateRange, setSelectedDateRange] = useState({
    start: '',
    end: ''
  });
  const [isCleaningOld, setIsCleaningOld] = useState(false);

  // Load archive stats on component mount
  useEffect(() => {
    loadArchiveStats();
    loadArchivedFiles();
  }, []);

  const loadArchiveStats = async () => {
    try {
      setIsLoading(true);
      await archiveService.init();
      const archiveStats = await archiveService.getArchiveStats();
      setStats(archiveStats);
    } catch (error) {
      console.error('Failed to load archive stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadArchivedFiles = async () => {
    try {
      const fileNames = await archiveService.getArchivedFileNames();
      setArchivedFiles(fileNames);
    } catch (error) {
      console.error('Failed to load archived files:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    try {
      setIsSearching(true);
      const result = await archiveService.searchArchive(searchTerm);
      setSearchResults(result.orders);
      
      if (result.orders.length === 0) {
        alert(`No archived orders found for: "${searchTerm}"`);
      }
    } catch (error) {
      console.error('Archive search failed:', error);
      alert('Failed to search archive. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleDateRangeSearch = async () => {
    if (!selectedDateRange.start || !selectedDateRange.end) {
      alert('Please select both start and end dates');
      return;
    }
    
    try {
      setIsSearching(true);
      const orders = await archiveService.getOrdersByDateRange(
        selectedDateRange.start,
        selectedDateRange.end
      );
      setSearchResults(orders);
      
      if (orders.length === 0) {
        alert(`No orders found in date range: ${selectedDateRange.start} to ${selectedDateRange.end}`);
      }
    } catch (error) {
      console.error('Date range search failed:', error);
      alert('Failed to search by date range. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearArchive = async () => {
    if (!confirm('Are you sure you want to clear all archived data? This action cannot be undone.')) {
      return;
    }
    
    try {
      setIsLoading(true);
      await archiveService.clearArchive();
      await loadArchiveStats();
      await loadArchivedFiles();
      setSearchResults([]);
      alert('Archive cleared successfully');
    } catch (error) {
      console.error('Failed to clear archive:', error);
      alert('Failed to clear archive. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanOldData = async () => {
    if (!confirm('Are you sure you want to delete archive data older than 30 days? This action cannot be undone.')) {
      return;
    }
    
    try {
      setIsCleaningOld(true);
      const deletedCount = await archiveService.clearOldArchiveData(30);
      await loadArchiveStats();
      await loadArchivedFiles();
      
      if (deletedCount > 0) {
        alert(`Successfully deleted ${deletedCount} old archive entries (older than 30 days)`);
      } else {
        alert('No old data found to delete');
      }
    } catch (error) {
      console.error('Failed to clean old data:', error);
      alert('Failed to clean old data. Please try again.');
    } finally {
      setIsCleaningOld(false);
    }
  };

  const handleLoadOrder = (order: ArchivedOrder) => {
    if (onLoadArchivedOrder) {
      onLoadArchivedOrder(order);
    }
  };

  const exportSearchResults = () => {
    if (searchResults.length === 0) {
      alert('No search results to export');
      return;
    }
    
    const headers = ['Order Number', 'Customer Name', 'SKU', 'Quantity', 'Location', 'File Date', 'File Name'];
    const csvContent = [
      headers.join(','),
      ...searchResults.map(order => [
        order.orderNumber,
        `"${order.customerName}"`,
        order.sku,
        order.quantity,
        order.location,
        order.fileDate ? new Date(order.fileDate).toLocaleDateString() : '',
        `"${order.fileName}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `archive-search-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Archive className="h-5 w-5" />
          Order Archive System
        </h3>
        <p className="text-gray-600 mb-4">
          The archive automatically stores all processed orders for future reference. Search old orders by customer name, order number, SKU, or postcode.
        </p>
      </div>

      {/* Archive Statistics */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-md font-semibold text-blue-800 mb-3 flex items-center gap-2">
          <Database className="h-4 w-4" />
          Archive Statistics
        </h4>
        
        {isLoading ? (
          <div className="flex items-center gap-2 text-blue-700">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            Loading archive statistics...
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Total Orders</span>
              </div>
              <p className="text-xl font-bold text-blue-900 mt-1">{stats.totalOrders.toLocaleString()}</p>
            </div>
            
            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Total Files</span>
              </div>
              <p className="text-xl font-bold text-blue-900 mt-1">{stats.totalFiles}</p>
            </div>
            
            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Date Range</span>
              </div>
              <p className="text-xs text-blue-700 mt-1">
                {stats.oldestFileDate ? formatDate(stats.oldestFileDate) : 'N/A'} - {stats.newestFileDate ? formatDate(stats.newestFileDate) : 'N/A'}
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Last Updated</span>
              </div>
              <p className="text-xs text-blue-700 mt-1">
                {stats.lastUpdated ? formatDate(stats.lastUpdated) : 'N/A'}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-blue-700">No archive data available</p>
        )}
      </div>

      {/* Search Section */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Search className="h-4 w-4" />
          Search Archive
        </h4>
        
        {/* Text Search */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search by Customer, Order Number, SKU, or Postcode
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Enter search term..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchTerm.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSearching ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Search
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Date Range Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search by File Date Range
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={selectedDateRange.start}
                onChange={(e) => setSelectedDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={selectedDateRange.end}
                onChange={(e) => setSelectedDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleDateRangeSearch}
                disabled={isSearching || !selectedDateRange.start || !selectedDateRange.end}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                Search Dates
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <h4 className="text-md font-semibold text-gray-800">
              Search Results ({searchResults.length} orders)
            </h4>
            <button
              onClick={exportSearchResults}
              className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              <Download className="h-3 w-3" />
              Export CSV
            </button>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">File Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {searchResults.map((order, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-900">{order.orderNumber}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{order.customerName}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{order.sku}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{order.quantity}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {order.fileDate ? formatDate(order.fileDate) : 'N/A'}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleLoadOrder(order)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Load Order
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Archived Files List */}
      {archivedFiles.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Archived Files ({archivedFiles.length})
          </h4>
          
          <div className="max-h-32 overflow-y-auto">
            <div className="space-y-1">
              {archivedFiles.map((fileName, index) => (
                <div key={index} className="text-sm text-gray-600 bg-white rounded px-2 py-1 border">
                  {fileName}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Archive Management */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h4 className="text-md font-semibold text-red-800 mb-3 flex items-center gap-2">
          <Trash2 className="h-4 w-4" />
          Archive Management
        </h4>
        
        <p className="text-red-700 text-sm mb-3">
          Clear all archived data to free up browser storage. This action cannot be undone.
        </p>
        
        <div className="flex gap-3">
          <button
            onClick={handleCleanOldData}
            disabled={isCleaningOld}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
          >
            {isCleaningOld ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Cleaning...
              </>
            ) : (
              <>
                <Broom className="h-4 w-4" />
                Clean Old Data (30+ days)
              </>
            )}
          </button>
          
          <button
            onClick={handleClearArchive}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            Clear All Archive Data
          </button>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-green-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-green-800 mb-2">How the Archive System Works:</h4>
        <div className="text-sm text-green-700 space-y-1">
          <p>✅ <strong>Automatic Archiving:</strong> All processed orders are automatically saved to your browser's local database</p>
          <p>✅ <strong>Auto-Cleanup:</strong> Data older than 30 days is automatically cleaned up daily to save space</p>
          <p>✅ <strong>Persistent Storage:</strong> Archive data persists between browser sessions and app restarts</p>
          <p>✅ <strong>Smart Search:</strong> Search by any field - customer name, order number, SKU, or postcode</p>
          <p>✅ <strong>Date Filtering:</strong> Find orders from specific date ranges using file dates</p>
          <p>✅ <strong>QR Code Integration:</strong> When you scan an old order's QR code, it will be found in the archive</p>
          <p>✅ <strong>No Data Loss:</strong> Loading archived orders doesn't affect your current CSV data</p>
        </div>
      </div>
    </div>
  );
};