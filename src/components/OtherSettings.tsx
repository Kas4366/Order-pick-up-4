import React, { useState, useEffect } from 'react';
import { Settings, Save, RotateCcw, CheckCircle, Download, Upload, AlertTriangle, FileText, Package, Trash2 } from 'lucide-react';
import { archiveService } from '../services/archiveService';
import { packingInstructionService } from '../services/packingInstructionService';
import { PackingInstruction } from '../types/PackingInstructions';

interface OtherSettingsProps {
  autoCompleteEnabled: boolean;
  onSaveSettings: (settings: { autoCompleteEnabled: boolean }) => void;
}

export const OtherSettings: React.FC<OtherSettingsProps> = ({
  autoCompleteEnabled,
  onSaveSettings,
}) => {
  const [settings, setSettings] = useState({
    autoCompleteEnabled: autoCompleteEnabled
  });
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isUploadingInstructions, setIsUploadingInstructions] = useState(false);
  const [instructionsStats, setInstructionsStats] = useState<{ totalInstructions: number; lastUpdated: string } | null>(null);
  const [lastUploadedFile, setLastUploadedFile] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setSettings({ autoCompleteEnabled });
    loadInstructionsStats();
  }, [autoCompleteEnabled]);

  const loadInstructionsStats = async () => {
    try {
      await packingInstructionService.init();
      const stats = await packingInstructionService.getStats();
      setInstructionsStats(stats);
      
      // Load last uploaded file name from localStorage
      const savedFileName = localStorage.getItem('lastPackingInstructionsFile');
      if (savedFileName) {
        setLastUploadedFile(savedFileName);
      }
    } catch (error) {
      console.error('Failed to load packing instructions stats:', error);
    }
  };

  const handleInstructionsUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingInstructions(true);
      setMessage(null);

      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        setMessage({ type: 'error', text: 'CSV file must have at least a header row and one data row.' });
        return;
      }

      // Skip header row and process data
      const dataLines = lines.slice(1);
      const instructions: PackingInstruction[] = [];
      const now = new Date().toISOString();

      for (let i = 0; i < dataLines.length; i++) {
        const line = dataLines[i].trim();
        if (!line) continue;

        // Simple CSV parsing - split by comma and handle basic quotes
        const parts = line.split(',').map(part => part.trim().replace(/^"|"$/g, ''));
        
        if (parts.length < 2) {
          console.warn(`Skipping line ${i + 2}: insufficient columns`);
          continue;
        }

        const sku = parts[0].trim();
        const instruction = parts[1].trim();

        if (!sku || !instruction) {
          console.warn(`Skipping line ${i + 2}: empty SKU or instruction`);
          continue;
        }

        instructions.push({
          sku,
          instruction,
          createdAt: now,
          updatedAt: now
        });
      }

      if (instructions.length === 0) {
        setMessage({ type: 'error', text: 'No valid instructions found in the CSV file.' });
        return;
      }

      // Save instructions to IndexedDB
      await packingInstructionService.saveInstructions(instructions);
      
      // Save file info to localStorage
      localStorage.setItem('lastPackingInstructionsFile', file.name);
      localStorage.setItem('lastPackingInstructionsUpload', now);
      
      setLastUploadedFile(file.name);
      await loadInstructionsStats();
      
      setMessage({ 
        type: 'success', 
        text: `Successfully uploaded ${instructions.length} packing instructions from ${file.name}!` 
      });

    } catch (error) {
      console.error('Instructions upload failed:', error);
      setMessage({ 
        type: 'error', 
        text: 'Failed to upload packing instructions. Please check the file format.' 
      });
    } finally {
      setIsUploadingInstructions(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleClearInstructions = async () => {
    if (!confirm('Are you sure you want to clear all packing instructions? This action cannot be undone.')) {
      return;
    }

    try {
      await packingInstructionService.clearInstructions();
      localStorage.removeItem('lastPackingInstructionsFile');
      localStorage.removeItem('lastPackingInstructionsUpload');
      
      setLastUploadedFile('');
      await loadInstructionsStats();
      
      setMessage({ 
        type: 'success', 
        text: 'All packing instructions cleared successfully!' 
      });
    } catch (error) {
      console.error('Failed to clear instructions:', error);
      setMessage({ 
        type: 'error', 
        text: 'Failed to clear packing instructions. Please try again.' 
      });
    }
  };
  const handleSave = () => {
    onSaveSettings(settings);
    setMessage({ type: 'success', text: 'Settings saved successfully!' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleReset = () => {
    const defaultSettings = { autoCompleteEnabled: false };
    setSettings(defaultSettings);
    onSaveSettings(defaultSettings);
    setMessage({ type: 'success', text: 'Settings reset to defaults!' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleExportArchive = async () => {
    try {
      setIsExporting(true);
      setMessage(null);

      // Get all archive data
      await archiveService.init();
      const stats = await archiveService.getArchiveStats();
      
      if (stats.totalOrders === 0) {
        setMessage({ type: 'error', text: 'No archive data to export.' });
        return;
      }

      // Get all orders from archive
      const searchResult = await archiveService.searchArchive(''); // Empty search returns all
      const allOrders = searchResult.orders;

      if (allOrders.length === 0) {
        setMessage({ type: 'error', text: 'No archive data found to export.' });
        return;
      }

      // Create CSV content
      const headers = [
        'Order Number', 'Customer Name', 'SKU', 'Quantity', 'Location', 
        'Buyer Postcode', 'Image URL', 'Item Name', 'Remaining Stock',
        'Order Value', 'File Date', 'File Name', 'Archived At', 'Completed',
        'Channel Type', 'Channel', 'Packaging Type', 'Notes'
      ];

      const csvContent = [
        headers.join(','),
        ...allOrders.map(order => [
          `"${order.orderNumber}"`,
          `"${order.customerName}"`,
          `"${order.sku}"`,
          order.quantity,
          `"${order.location}"`,
          `"${order.buyerPostcode || ''}"`,
          `"${order.imageUrl || ''}"`,
          `"${order.itemName || ''}"`,
          order.remainingStock || '',
          order.orderValue || '',
          order.fileDate || '',
          `"${order.fileName}"`,
          order.archivedAt,
          order.completed ? 'Yes' : 'No',
          `"${order.channelType || ''}"`,
          `"${order.channel || ''}"`,
          `"${order.packagingType || ''}"`,
          `"${order.notes || ''}"`
        ].join(','))
      ].join('\n');

      // Download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `orderpick-archive-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setMessage({ type: 'success', text: `Successfully exported ${allOrders.length} archived orders!` });
    } catch (error) {
      console.error('Export failed:', error);
      setMessage({ type: 'error', text: 'Failed to export archive data. Please try again.' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportArchive = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      setMessage(null);

      const text = await file.text();
      const lines = text.split('\n');
      
      if (lines.length < 2) {
        setMessage({ type: 'error', text: 'Invalid CSV file format.' });
        return;
      }

      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      const dataLines = lines.slice(1).filter(line => line.trim());

      let importedCount = 0;
      const orders = [];

      for (const line of dataLines) {
        if (!line.trim()) continue;

        const values = line.split(',').map(v => v.replace(/"/g, '').trim());
        
        if (values.length < headers.length) continue;

        const order = {
          orderNumber: values[0] || '',
          customerName: values[1] || '',
          sku: values[2] || '',
          quantity: parseInt(values[3]) || 1,
          location: values[4] || '',
          buyerPostcode: values[5] || '',
          imageUrl: values[6] || '',
          itemName: values[7] || '',
          remainingStock: values[8] ? parseInt(values[8]) : undefined,
          orderValue: values[9] ? parseFloat(values[9]) : undefined,
          fileDate: values[10] || new Date().toISOString(),
          fileName: values[11] || 'Imported',
          archivedAt: values[12] || new Date().toISOString(),
          completed: values[13] === 'Yes',
          channelType: values[14] || '',
          channel: values[15] || '',
          width: values[16] ? parseFloat(values[16]) : undefined,
          weight: values[17] ? parseFloat(values[17]) : undefined,
          shipFromLocation: values[18] || '',
          packageDimension: values[19] || '',
          notes: values[20] || ''
        };

        orders.push(order);
      }

      if (orders.length === 0) {
        setMessage({ type: 'error', text: 'No valid orders found in the CSV file.' });
        return;
      }

      // Import to archive
      await archiveService.init();
      const archived = await archiveService.archiveOrders(orders, `Imported-${file.name}`);
      
      setMessage({ type: 'success', text: `Successfully imported ${archived} orders to archive!` });
      importedCount = archived;

    } catch (error) {
      console.error('Import failed:', error);
      setMessage({ type: 'error', text: 'Failed to import archive data. Please check the file format.' });
    } finally {
      setIsImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Other Settings
        </h3>
        <p className="text-gray-600 mb-4">
          Additional application settings and archive management options.
        </p>
      </div>

      {/* Auto-Complete Setting */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-md font-semibold text-blue-800 mb-3">Auto-Complete Orders</h4>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-700 text-sm mb-1">
              Automatically mark orders as completed when scanned or searched
            </p>
            <p className="text-blue-600 text-xs">
              When enabled, scanning a QR code or searching for an order will automatically mark it as completed.
              This works with all order sources (HTML, CSV, Selro, Veeqo).
            </p>
          </div>
          <button
            onClick={() => setSettings(prev => ({ ...prev, autoCompleteEnabled: !prev.autoCompleteEnabled }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.autoCompleteEnabled ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.autoCompleteEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        {settings.autoCompleteEnabled && (
          <div className="mt-3 p-2 bg-blue-100 rounded">
            <p className="text-xs text-blue-800 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Auto-complete is enabled - orders will be marked as completed automatically
            </p>
          </div>
        )}
      </div>

      {/* Packing Instructions CSV Upload */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h4 className="text-md font-semibold text-purple-800 mb-3 flex items-center gap-2">
          <Package className="h-4 w-4" />
          Packing Instructions CSV Upload
        </h4>
        <p className="text-purple-700 text-sm mb-4">
          Upload a CSV file with special packing instructions for specific SKUs. The file should have two columns: SKU and Instruction.
        </p>
        
        {/* Current Instructions Info */}
        {instructionsStats && instructionsStats.totalInstructions > 0 && (
          <div className="bg-purple-100 border border-purple-300 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-purple-800">
                  📋 {instructionsStats.totalInstructions} instructions loaded
                </p>
                {lastUploadedFile && (
                  <p className="text-sm text-purple-700">
                    From: {lastUploadedFile}
                  </p>
                )}
                {instructionsStats.lastUpdated && (
                  <p className="text-xs text-purple-600">
                    Last updated: {new Date(instructionsStats.lastUpdated).toLocaleDateString('en-GB')}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Upload */}
          <div className="space-y-3">
            <h5 className="text-sm font-medium text-purple-700">Upload Instructions CSV</h5>
            <p className="text-xs text-purple-600">
              CSV format: SKU, Instruction (e.g., "ABC123", "Handle with care - fragile item")
            </p>
            <label className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors cursor-pointer">
              {isUploadingInstructions ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload Instructions
                </>
              )}
              <input
                type="file"
                accept=".csv"
                onChange={handleInstructionsUpload}
                disabled={isUploadingInstructions}
                className="hidden"
              />
            </label>
          </div>

          {/* Clear */}
          <div className="space-y-3">
            <h5 className="text-sm font-medium text-purple-700">Clear Instructions</h5>
            <p className="text-xs text-purple-600">
              Remove all saved packing instructions from the system.
            </p>
            <button
              onClick={handleClearInstructions}
              disabled={!instructionsStats || instructionsStats.totalInstructions === 0}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="h-4 w-4" />
              Clear All Instructions
            </button>
          </div>
        </div>

        <div className="mt-4 p-3 bg-purple-100 border border-purple-200 rounded">
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-purple-800">
              <p className="font-medium mb-1">CSV Format Example:</p>
              <div className="bg-white rounded border p-2 font-mono text-xs">
                <div className="text-gray-600">SKU,Instruction</div>
                <div className="text-gray-800">ABC123,"Handle with care - fragile glass item"</div>
                <div className="text-gray-800">XYZ456,"Pack in bubble wrap and mark as fragile"</div>
                <div className="text-gray-800">DEF789,"Include assembly instructions in package"</div>
              </div>
              <ul className="space-y-1 list-disc list-inside mt-2">
                <li>First column: SKU (must match exactly)</li>
                <li>Second column: Packing instruction text</li>
                <li>Instructions will pop up when these SKUs are processed</li>
                <li>User must acknowledge instructions before continuing</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Archive Import/Export */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-md font-semibold text-gray-800 mb-3">Archive Data Management</h4>
        <p className="text-gray-600 text-sm mb-4">
          Export your archive data for backup or import previously exported archive data.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Export */}
          <div className="space-y-3">
            <h5 className="text-sm font-medium text-gray-700">Export Archive</h5>
            <p className="text-xs text-gray-600">
              Download all archived orders as a CSV file for backup or analysis.
            </p>
            <button
              onClick={handleExportArchive}
              disabled={isExporting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export Archive
                </>
              )}
            </button>
          </div>

          {/* Import */}
          <div className="space-y-3">
            <h5 className="text-sm font-medium text-gray-700">Import Archive</h5>
            <p className="text-xs text-gray-600">
              Import previously exported archive data back into the system.
            </p>
            <label className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
              {isImporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Import Archive
                </>
              )}
              <input
                type="file"
                accept=".csv"
                onChange={handleImportArchive}
                disabled={isImporting}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-yellow-800">
              <p className="font-medium mb-1">Important Notes:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Export creates a CSV file with all archived order data</li>
                <li>Import will add data to existing archive (no duplicates)</li>
                <li>Use export regularly to backup your order history</li>
                <li>Imported data will be searchable in the archive</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-4 border-t border-gray-200">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          Reset to Default
        </button>
        
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Save className="h-4 w-4" />
          Save Settings
        </button>
      </div>

      {/* Messages */}
      {message && (
        <div className={`flex items-center gap-2 p-3 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      {/* Current Settings Summary */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">Current Settings:</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p><strong>Auto-Complete:</strong> {settings.autoCompleteEnabled ? 'Enabled' : 'Disabled'}</p>
        </div>
      </div>
    </div>
  );
};