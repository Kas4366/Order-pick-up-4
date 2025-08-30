import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit2, Trash2, Save, X, ArrowUp, ArrowDown, Play, Pause, AlertCircle, CheckCircle, Settings, Box, Download, Upload } from 'lucide-react';
import { PackagingRule, RuleCondition, RuleField, RuleOperator, fieldLabels, operatorLabels, defaultPackagingTypes, defaultPackagingRules, defaultBoxNames, defaultBoxRules, validateRule } from '../types/Packaging';

interface PackagingRulesSettingsProps {
  rules: PackagingRule[];
  onSaveRules: (rules: PackagingRule[]) => void;
  customPackagingTypes: string[];
  onSavePackagingTypes: (types: string[]) => void;
  boxRules?: PackagingRule[];
  onSaveBoxRules?: (rules: PackagingRule[]) => void;
  customBoxNames?: string[];
  onSaveBoxNames?: (names: string[]) => void;
}

export const PackagingRulesSettings: React.FC<PackagingRulesSettingsProps> = ({
  rules,
  onSaveRules,
  customPackagingTypes,
  onSavePackagingTypes,
  boxRules = [],
  onSaveBoxRules = () => {},
  customBoxNames = [],
  onSaveBoxNames = () => {},
}) => {
  const [localRules, setLocalRules] = useState<PackagingRule[]>(rules);
  const [localBoxRules, setLocalBoxRules] = useState<PackagingRule[]>(boxRules);
  const [localPackagingTypes, setLocalPackagingTypes] = useState<string[]>(customPackagingTypes);
  const [localBoxNames, setLocalBoxNames] = useState<string[]>(customBoxNames);
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editingRuleType, setEditingRuleType] = useState<'packaging' | 'box'>('packaging');
  const [isManagingTypes, setIsManagingTypes] = useState(false);
  const [isManagingBoxes, setIsManagingBoxes] = useState(false);
  const [newPackagingType, setNewPackagingType] = useState('');
  const [newBoxName, setNewBoxName] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importExportMessage, setImportExportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [newRule, setNewRule] = useState<Partial<PackagingRule>>({
    name: '',
    description: '',
    conditions: [],
    ruleType: 'packaging',
    resultValue: '',
    priority: 50,
    enabled: true,
    color: '#3B82F6'
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    setLocalRules(rules);
    setLocalBoxRules(boxRules);
    setLocalPackagingTypes(customPackagingTypes);
    setLocalBoxNames(customBoxNames);
  }, [rules, boxRules, customPackagingTypes, customBoxNames]);

  const generateId = (): string => {
    return `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const generateConditionId = (): string => {
    return `cond-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleAddRule = () => {
    const errors = validateRule(newRule);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    const rule: PackagingRule = {
      id: generateId(),
      name: newRule.name!.trim(),
      description: newRule.description?.trim() || '',
      conditions: newRule.conditions || [],
      ruleType: newRule.ruleType || 'packaging',
      resultValue: newRule.resultValue!.trim(),
      priority: newRule.priority || 50,
      enabled: newRule.enabled !== false,
      color: newRule.color || '#3B82F6',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (rule.ruleType === 'packaging') {
      const updatedRules = [...localRules, rule];
      setLocalRules(updatedRules);
      onSaveRules(updatedRules);
    } else {
      const updatedBoxRules = [...localBoxRules, rule];
      setLocalBoxRules(updatedBoxRules);
      onSaveBoxRules(updatedBoxRules);
    }
    
    resetForm();
  };

  const handleUpdateRule = () => {
    if (!editingRuleId) return;

    const errors = validateRule(newRule);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    const updatedRule = {
      name: newRule.name!.trim(),
      description: newRule.description?.trim() || '',
      conditions: newRule.conditions || [],
      ruleType: newRule.ruleType || 'packaging',
      resultValue: newRule.resultValue!.trim(),
      priority: newRule.priority || 50,
      enabled: newRule.enabled !== false,
      color: newRule.color || '#3B82F6',
      updatedAt: new Date().toISOString()
    };

    if (editingRuleType === 'packaging') {
      const updatedRules = localRules.map(rule => 
        rule.id === editingRuleId ? { ...rule, ...updatedRule } : rule
      );
      setLocalRules(updatedRules);
      onSaveRules(updatedRules);
    } else {
      const updatedBoxRules = localBoxRules.map(rule => 
        rule.id === editingRuleId ? { ...rule, ...updatedRule } : rule
      );
      setLocalBoxRules(updatedBoxRules);
      onSaveBoxRules(updatedBoxRules);
    }
    
    resetForm();
  };

  const handleEditRule = (ruleId: string, ruleType: 'packaging' | 'box') => {
    const rulesList = ruleType === 'packaging' ? localRules : localBoxRules;
    const rule = rulesList.find(r => r.id === ruleId);
    if (rule) {
      setNewRule({
        name: rule.name,
        description: rule.description,
        conditions: [...rule.conditions],
        ruleType: rule.ruleType,
        resultValue: rule.resultValue,
        priority: rule.priority,
        enabled: rule.enabled,
        color: rule.color || '#3B82F6'
      });
      setEditingRuleId(ruleId);
      setEditingRuleType(ruleType);
      setValidationErrors([]);
    }
  };

  const handleDeleteRule = (ruleId: string, ruleType: 'packaging' | 'box') => {
    if (confirm('Are you sure you want to delete this rule?')) {
      if (ruleType === 'packaging') {
        const updatedRules = localRules.filter(rule => rule.id !== ruleId);
        setLocalRules(updatedRules);
        onSaveRules(updatedRules);
      } else {
        const updatedBoxRules = localBoxRules.filter(rule => rule.id !== ruleId);
        setLocalBoxRules(updatedBoxRules);
        onSaveBoxRules(updatedBoxRules);
      }
    }
  };

  const handleToggleRule = (ruleId: string, ruleType: 'packaging' | 'box') => {
    if (ruleType === 'packaging') {
      const updatedRules = localRules.map(rule => 
        rule.id === ruleId 
          ? { ...rule, enabled: !rule.enabled, updatedAt: new Date().toISOString() }
          : rule
      );
      setLocalRules(updatedRules);
      onSaveRules(updatedRules);
    } else {
      const updatedBoxRules = localBoxRules.map(rule => 
        rule.id === ruleId 
          ? { ...rule, enabled: !rule.enabled, updatedAt: new Date().toISOString() }
          : rule
      );
      setLocalBoxRules(updatedBoxRules);
      onSaveBoxRules(updatedBoxRules);
    }
  };

  const handleMovePriority = (ruleId: string, direction: 'up' | 'down', ruleType: 'packaging' | 'box') => {
    if (ruleType === 'packaging') {
      const ruleIndex = localRules.findIndex(r => r.id === ruleId);
      if (ruleIndex === -1) return;

      const updatedRules = [...localRules];
      const rule = updatedRules[ruleIndex];
      
      if (direction === 'up' && rule.priority > 1) {
        rule.priority -= 1;
      } else if (direction === 'down') {
        rule.priority += 1;
      }
      
      rule.updatedAt = new Date().toISOString();
      
      setLocalRules(updatedRules);
      onSaveRules(updatedRules);
    } else {
      const ruleIndex = localBoxRules.findIndex(r => r.id === ruleId);
      if (ruleIndex === -1) return;

      const updatedBoxRules = [...localBoxRules];
      const rule = updatedBoxRules[ruleIndex];
      
      if (direction === 'up' && rule.priority > 1) {
        rule.priority -= 1;
      } else if (direction === 'down') {
        rule.priority += 1;
      }
      
      rule.updatedAt = new Date().toISOString();
      
      setLocalBoxRules(updatedBoxRules);
      onSaveBoxRules(updatedBoxRules);
    }
  };

  const handleAddPackagingType = () => {
    if (!newPackagingType.trim()) return;
    
    const trimmedType = newPackagingType.trim();
    if (localPackagingTypes.includes(trimmedType)) {
      alert('This packaging type already exists');
      return;
    }
    
    const updatedTypes = [...localPackagingTypes, trimmedType];
    setLocalPackagingTypes(updatedTypes);
    onSavePackagingTypes(updatedTypes);
    setNewPackagingType('');
  };

  const handleRemovePackagingType = (typeToRemove: string) => {
    if (confirm(`Are you sure you want to remove "${typeToRemove}"? This may affect existing rules.`)) {
      const updatedTypes = localPackagingTypes.filter(type => type !== typeToRemove);
      setLocalPackagingTypes(updatedTypes);
      onSavePackagingTypes(updatedTypes);
    }
  };

  const handleResetPackagingTypes = () => {
    if (confirm('Reset to default packaging types? This will remove all custom types.')) {
      setLocalPackagingTypes(defaultPackagingTypes);
      onSavePackagingTypes(defaultPackagingTypes);
    }
  };

  const handleAddBoxName = () => {
    if (!newBoxName.trim()) return;
    
    const trimmedName = newBoxName.trim();
    if (localBoxNames.includes(trimmedName)) {
      alert('This box name already exists');
      return;
    }
    
    const updatedNames = [...localBoxNames, trimmedName];
    setLocalBoxNames(updatedNames);
    onSaveBoxNames(updatedNames);
    setNewBoxName('');
  };

  const handleRemoveBoxName = (nameToRemove: string) => {
    if (confirm(`Are you sure you want to remove "${nameToRemove}"? This may affect existing box rules.`)) {
      const updatedNames = localBoxNames.filter(name => name !== nameToRemove);
      setLocalBoxNames(updatedNames);
      onSaveBoxNames(updatedNames);
    }
  };

  const handleResetBoxNames = () => {
    if (confirm('Reset to default box names? This will remove all custom box names.')) {
      setLocalBoxNames(defaultBoxNames);
      onSaveBoxNames(defaultBoxNames);
    }
  };

  const resetForm = () => {
    setNewRule({
      name: '',
      description: '',
      conditions: [],
      ruleType: 'packaging',
      resultValue: '',
      priority: 50,
      enabled: true,
      color: '#3B82F6'
    });
    setIsAddingRule(false);
    setEditingRuleId(null);
    setEditingRuleType('packaging');
    setValidationErrors([]);
    setImportExportMessage(null);
  };

  const handleAddCondition = () => {
    const newCondition: RuleCondition = {
      id: generateConditionId(),
      field: 'sku',
      operator: 'contains',
      value: ''
    };
    
    setNewRule(prev => ({
      ...prev,
      conditions: [...(prev.conditions || []), newCondition]
    }));
  };

  const handleUpdateCondition = (conditionId: string, updates: Partial<RuleCondition>) => {
    setNewRule(prev => ({
      ...prev,
      conditions: (prev.conditions || []).map(cond => 
        cond.id === conditionId ? { ...cond, ...updates } : cond
      )
    }));
  };

  const handleRemoveCondition = (conditionId: string) => {
    setNewRule(prev => ({
      ...prev,
      conditions: (prev.conditions || []).filter(cond => cond.id !== conditionId)
    }));
  };

  const handleResetToDefaults = () => {
    if (confirm('Reset to default rules? This will remove all custom rules.')) {
      setLocalRules(defaultPackagingRules);
      onSaveRules(defaultPackagingRules);
      setLocalBoxRules(defaultBoxRules);
      onSaveBoxRules(defaultBoxRules);
    }
  };

  const handleExportRules = async () => {
    setIsExporting(true);
    setImportExportMessage(null);
    
    try {
      const allRules = [...localRules, ...localBoxRules];
      
      if (allRules.length === 0) {
        setImportExportMessage({ type: 'error', text: 'No rules to export' });
        return;
      }

      // Create CSV content with proper escaping
      const headers = [
        'ID', 'Name', 'Description', 'Rule Type', 'Result Value', 'Priority', 
        'Enabled', 'Color', 'Conditions', 'Created At', 'Updated At'
      ];
      
      const csvContent = [
        headers.join(','),
        ...allRules.map(rule => {
          const safeName = (rule.name || '').replace(/"/g, '""');
          const safeDescription = (rule.description || '').replace(/"/g, '""');
          const safeResultValue = (rule.resultValue || '').replace(/"/g, '""');
          const safeConditions = JSON.stringify(rule.conditions || []).replace(/"/g, '""');
          
          return [
            `"${rule.id || ''}"`,
            `"${safeName}"`,
            `"${safeDescription}"`,
            `"${rule.ruleType || 'packaging'}"`,
            `"${safeResultValue}"`,
            rule.priority || 50,
            rule.enabled ? 'true' : 'false',
            `"${rule.color || '#3B82F6'}"`,
            `"${safeConditions}"`,
            `"${rule.createdAt || ''}"`,
            `"${rule.updatedAt || ''}"`
          ].join(',');
        })
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `packaging-rules-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setImportExportMessage({ 
        type: 'success', 
        text: `Successfully exported ${allRules.length} rules to CSV file` 
      });
    } catch (error) {
      console.error('Export error:', error);
      setImportExportMessage({ type: 'error', text: 'Failed to export rules' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportRules = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportExportMessage(null);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        setImportExportMessage({ type: 'error', text: 'Invalid CSV file format' });
        return;
      }

      const importedRules: PackagingRule[] = [];
      let errorCount = 0;

      // Parse CSV manually to handle quoted fields properly
      const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          const nextChar = line[i + 1];
          
          if (char === '"') {
            if (inQuotes && nextChar === '"') {
              current += '"';
              i++; // Skip next quote
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current);
        return result;
      };

      for (let i = 1; i < lines.length; i++) {
        try {
          const values = parseCSVLine(lines[i]);
          if (values.length < 11) continue; // Minimum required columns

          // Parse conditions JSON
          let conditions: RuleCondition[] = [];
          try {
            const conditionsStr = values[8] ? values[8].replace(/^"/, '').replace(/"$/, '').replace(/""/g, '"') : '[]';
            conditions = JSON.parse(conditionsStr);
          } catch {
            conditions = [];
          }

          const rule: PackagingRule = {
            id: generateId(), // Generate new ID to prevent conflicts
            name: (values[1] || '').replace(/^"/, '').replace(/"$/, '').replace(/""/g, '"'),
            description: (values[2] || '').replace(/^"/, '').replace(/"$/, '').replace(/""/g, '"'),
            ruleType: (values[3] || 'packaging') as 'packaging' | 'box',
            resultValue: (values[4] || '').replace(/^"/, '').replace(/"$/, '').replace(/""/g, '"'),
            priority: parseInt(values[5]) || 50,
            enabled: (values[6] || 'true') === 'true',
            color: (values[7] || '#3B82F6').replace(/^"/, '').replace(/"$/, ''),
            conditions,
            createdAt: (values[9] || '').replace(/^"/, '').replace(/"$/, '') || new Date().toISOString(),
            updatedAt: (values[10] || '').replace(/^"/, '').replace(/"$/, '') || new Date().toISOString()
          };

          // Validate rule
          const errors = validateRule(rule);
          if (errors.length === 0) {
            importedRules.push(rule);
          } else {
            console.warn('Skipping invalid rule:', rule.name, errors);
            errorCount++;
          }
        } catch {
          console.warn('Failed to parse rule at line:', i + 1);
          errorCount++;
        }
      }

      if (importedRules.length === 0) {
        setImportExportMessage({ type: 'error', text: 'No valid rules found in the CSV file' });
        return;
      }

      // Separate packaging and box rules
      const newPackagingRules = importedRules.filter(r => r.ruleType === 'packaging');
      const newBoxRules = importedRules.filter(r => r.ruleType === 'box');

      // Add to existing rules
      if (newPackagingRules.length > 0) {
        const updatedPackagingRules = [...localRules, ...newPackagingRules];
        setLocalRules(updatedPackagingRules);
        onSaveRules(updatedPackagingRules);
      }

      if (newBoxRules.length > 0) {
        const updatedBoxRules = [...localBoxRules, ...newBoxRules];
        setLocalBoxRules(updatedBoxRules);
        onSaveBoxRules(updatedBoxRules);
      }

      let message = `Successfully imported ${importedRules.length} rules`;
      if (errorCount > 0) {
        message += ` (${errorCount} rules skipped due to errors)`;
      }
      
      setImportExportMessage({ type: 'success', text: message });
    } catch (error) {
      console.error('Import error:', error);
      setImportExportMessage({ type: 'error', text: 'Failed to import rules from CSV file' });
    } finally {
      setIsImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const sortedPackagingRules = [...localRules].sort((a, b) => a.priority - b.priority);
  const sortedBoxRules = [...localBoxRules].sort((a, b) => a.priority - b.priority);

  // Get available result values based on rule type
  const getAvailableResultValues = () => {
    return newRule.ruleType === 'box' ? localBoxNames : localPackagingTypes;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Package className="h-5 w-5" />
          Packaging & Box Rules
        </h3>
        <p className="text-gray-600 mb-4">
          Create rules to automatically determine packaging types and shipping boxes based on SKU, quantity, dimensions, channel, and shipping location.
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {localRules.length} packaging rules • {localBoxRules.length} box rules • {localRules.filter(r => r.enabled).length + localBoxRules.filter(r => r.enabled).length} enabled
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleResetToDefaults}
            className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Reset to Defaults
          </button>
          <button
            onClick={() => setIsAddingRule(true)}
            disabled={isAddingRule || editingRuleId !== null}
            className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm"
          >
            <Plus className="h-3 w-3" />
            Add Rule
          </button>
        </div>
      </div>

      {/* Add/Edit Rule Form */}
      {(isAddingRule || editingRuleId) && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h5 className="text-sm font-medium text-gray-800 mb-3">
            {editingRuleId ? 'Edit Rule' : 'Add New Rule'}
          </h5>
          
          {/* Basic Rule Info */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Rule Name *
              </label>
              <input
                type="text"
                value={newRule.name || ''}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                placeholder="Enter rule name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Rule Type *
              </label>
              <select
                value={newRule.ruleType || 'packaging'}
                onChange={(e) => setNewRule({ ...newRule, ruleType: e.target.value as 'packaging' | 'box', resultValue: '' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="packaging">Packaging Type</option>
                <option value="box">Shipping Box</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {newRule.ruleType === 'box' ? 'Box Name' : 'Packaging Type'} *
              </label>
              <select
                value={newRule.resultValue || ''}
                onChange={(e) => setNewRule({ ...newRule, resultValue: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">Select {newRule.ruleType === 'box' ? 'box name' : 'packaging type'}</option>
                {getAvailableResultValues().map(value => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Priority
              </label>
              <input
                type="number"
                value={newRule.priority || 50}
                onChange={(e) => setNewRule({ ...newRule, priority: parseInt(e.target.value) || 50 })}
                min="1"
                max="999"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">Lower number = higher priority</p>
            </div>
          </div>

          {/* Color Picker for Box Rules */}
          {newRule.ruleType === 'box' && (
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Box Color Theme
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={newRule.color || '#3B82F6'}
                  onChange={(e) => setNewRule({ ...newRule, color: e.target.value })}
                  className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                />
                <div className="flex gap-2">
                  {[
                    '#EF4444', // Red
                    '#F59E0B', // Orange  
                    '#10B981', // Green
                    '#3B82F6', // Blue
                    '#8B5CF6', // Purple
                    '#EC4899', // Pink
                    '#06B6D4', // Cyan
                    '#84CC16'  // Lime
                  ].map(color => (
                    <button
                      key={color}
                      onClick={() => setNewRule({ ...newRule, color })}
                      className="w-6 h-6 rounded border-2 border-gray-300 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                This color will be used for the shipping box banner when this rule applies
              </p>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={newRule.description || ''}
              onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
              placeholder="Optional description"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Conditions */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-700">
                Conditions (All must be true)
              </label>
              <button
                onClick={handleAddCondition}
                className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-3 w-3" />
                Add Condition
              </button>
            </div>
            
            <div className="space-y-2">
              {(newRule.conditions || []).map((condition, index) => (
                <div key={condition.id} className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded">
                  <select
                    value={condition.field}
                    onChange={(e) => handleUpdateCondition(condition.id, { field: e.target.value as RuleField })}
                    className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {Object.entries(fieldLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  
                  <select
                    value={condition.operator}
                    onChange={(e) => handleUpdateCondition(condition.id, { operator: e.target.value as RuleOperator })}
                    className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {Object.entries(operatorLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  
                  <input
                    type={['quantity', 'width', 'weight', 'orderValue'].includes(condition.field) ? 'number' : 'text'}
                    value={condition.value}
                    onChange={(e) => handleUpdateCondition(condition.id, { 
                      value: ['quantity', 'width', 'weight', 'orderValue'].includes(condition.field) 
                        ? parseFloat(e.target.value) || 0 
                        : e.target.value 
                    })}
                    placeholder="Value"
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  
                  <button
                    onClick={() => handleRemoveCondition(condition.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            
            {(newRule.conditions || []).length === 0 && (
              <p className="text-xs text-gray-500 italic">No conditions added. Click "Add Condition" to start.</p>
            )}
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800">Please fix the following errors:</p>
                  <ul className="text-sm text-red-700 mt-1 list-disc list-inside">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-2">
            <button
              onClick={resetForm}
              className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={editingRuleId ? handleUpdateRule : handleAddRule}
              className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Save className="h-3 w-3" />
              {editingRuleId ? 'Update' : 'Add'} Rule
            </button>
          </div>
        </div>
      )}

      {/* Packaging Types Management */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-semibold text-purple-800 flex items-center gap-2">
            <Package className="h-4 w-4" />
            Manage Packaging Types
          </h4>
          <div className="flex gap-2">
            <button
              onClick={handleResetPackagingTypes}
              className="px-3 py-1 text-sm text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
            >
              Reset to Defaults
            </button>
            <button
              onClick={() => setIsManagingTypes(!isManagingTypes)}
              className="flex items-center gap-2 px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
            >
              <Plus className="h-3 w-3" />
              {isManagingTypes ? 'Done' : 'Add Type'}
            </button>
          </div>
        </div>
        
        {isManagingTypes && (
          <div className="mb-4 p-3 bg-white border border-purple-200 rounded">
            <div className="flex gap-2">
              <input
                type="text"
                value={newPackagingType}
                onChange={(e) => setNewPackagingType(e.target.value)}
                placeholder="Enter new packaging type"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                onKeyPress={(e) => e.key === 'Enter' && handleAddPackagingType()}
              />
              <button
                onClick={handleAddPackagingType}
                disabled={!newPackagingType.trim()}
                className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 text-sm"
              >
                Add
              </button>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {localPackagingTypes.map((type, index) => (
            <div key={type} className="flex items-center justify-between bg-white border border-purple-200 rounded px-3 py-2">
              <span className="text-sm text-purple-900 font-medium">{type}</span>
              {!defaultPackagingTypes.includes(type) && (
                <button
                  onClick={() => handleRemovePackagingType(type)}
                  className="text-red-500 hover:text-red-700 ml-2"
                  title="Remove custom type"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
        
        <p className="text-xs text-purple-700 mt-3">
          {localPackagingTypes.length} packaging types available. Custom types can be removed, default types are protected.
        </p>
      </div>

      {/* Box Names Management */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-semibold text-orange-800 flex items-center gap-2">
            <Box className="h-4 w-4" />
            Manage Box Names
          </h4>
          <div className="flex gap-2">
            <button
              onClick={handleResetBoxNames}
              className="px-3 py-1 text-sm text-orange-600 hover:bg-orange-100 rounded-lg transition-colors"
            >
              Reset to Defaults
            </button>
            <button
              onClick={() => setIsManagingBoxes(!isManagingBoxes)}
              className="flex items-center gap-2 px-3 py-1 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
            >
              <Plus className="h-3 w-3" />
              {isManagingBoxes ? 'Done' : 'Add Box'}
            </button>
          </div>
        </div>
        
        {isManagingBoxes && (
          <div className="mb-4 p-3 bg-white border border-orange-200 rounded">
            <div className="flex gap-2">
              <input
                type="text"
                value={newBoxName}
                onChange={(e) => setNewBoxName(e.target.value)}
                placeholder="Enter new box name (e.g., SM OBA, CC OBA)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                onKeyPress={(e) => e.key === 'Enter' && handleAddBoxName()}
              />
              <button
                onClick={handleAddBoxName}
                disabled={!newBoxName.trim()}
                className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 text-sm"
              >
                Add
              </button>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {localBoxNames.map((name, index) => (
            <div key={name} className="flex items-center justify-between bg-white border border-orange-200 rounded px-3 py-2">
              <span className="text-sm text-orange-900 font-medium">{name}</span>
              {!defaultBoxNames.includes(name) && (
                <button
                  onClick={() => handleRemoveBoxName(name)}
                  className="text-red-500 hover:text-red-700 ml-2"
                  title="Remove custom box name"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
        
        <p className="text-xs text-orange-700 mt-3">
          {localBoxNames.length} box names available. Custom names can be removed, default names are protected.
        </p>
      </div>

      {/* Packaging Rules List */}
      <div>
        <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Package className="h-4 w-4" />
          Packaging Rules ({sortedPackagingRules.length})
        </h4>
        <div className="space-y-2">
          {sortedPackagingRules.map(rule => (
            <div
              key={rule.id}
              className={`p-4 border rounded-lg transition-colors ${
                rule.enabled ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium text-gray-800">{rule.name}</h4>
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                      {rule.resultValue}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      Priority: {rule.priority}
                    </span>
                    {rule.enabled ? (
                      <span className="flex items-center gap-1 text-green-600 text-xs">
                        <Play className="h-3 w-3" />
                        Enabled
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-gray-500 text-xs">
                        <Pause className="h-3 w-3" />
                        Disabled
                      </span>
                    )}
                  </div>
                  
                  {rule.description && (
                    <p className="text-sm text-gray-600 mb-2">{rule.description}</p>
                  )}
                  
                  <div className="text-xs text-gray-500">
                    <p className="mb-1">Conditions ({rule.conditions.length}):</p>
                    {rule.conditions.map((condition, index) => (
                      <span key={condition.id} className="inline-block mr-2 mb-1 px-2 py-1 bg-gray-100 rounded">
                        {fieldLabels[condition.field]} {operatorLabels[condition.operator]} "{condition.value}"
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center gap-1 ml-4">
                  <button
                    onClick={() => handleMovePriority(rule.id, 'up', 'packaging')}
                    disabled={rule.priority <= 1}
                    className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                    title="Increase priority"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleMovePriority(rule.id, 'down', 'packaging')}
                    className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Decrease priority"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleToggleRule(rule.id, 'packaging')}
                    className={`p-1 rounded transition-colors ${
                      rule.enabled 
                        ? 'text-gray-500 hover:text-orange-600 hover:bg-orange-50' 
                        : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
                    }`}
                    title={rule.enabled ? 'Disable rule' : 'Enable rule'}
                  >
                    {rule.enabled ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  </button>
                  <button
                    onClick={() => handleEditRule(rule.id, 'packaging')}
                    disabled={isAddingRule || editingRuleId !== null}
                    className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                    title="Edit rule"
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteRule(rule.id, 'packaging')}
                    disabled={isAddingRule || editingRuleId !== null}
                    className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                    title="Delete rule"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {sortedPackagingRules.length === 0 && (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No packaging rules defined</p>
          </div>
        )}
      </div>

      {/* Box Rules List */}
      <div>
        <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Box className="h-4 w-4" />
          Box Rules ({sortedBoxRules.length})
        </h4>
        <div className="space-y-2">
          {sortedBoxRules.map(rule => (
            <div
              key={rule.id}
              className={`p-4 border rounded-lg transition-colors ${
                rule.enabled ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium text-gray-800">{rule.name}</h4>
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                      {rule.resultValue}
                    </span>
                    {rule.color && (
                      <div 
                        className="w-4 h-4 rounded border border-gray-300" 
                        style={{ backgroundColor: rule.color }}
                        title={`Box color: ${rule.color}`}
                      />
                    )}
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      Priority: {rule.priority}
                    </span>
                    {rule.enabled ? (
                      <span className="flex items-center gap-1 text-green-600 text-xs">
                        <Play className="h-3 w-3" />
                        Enabled
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-gray-500 text-xs">
                        <Pause className="h-3 w-3" />
                        Disabled
                      </span>
                    )}
                  </div>
                  
                  {rule.description && (
                    <p className="text-sm text-gray-600 mb-2">{rule.description}</p>
                  )}
                  
                  <div className="text-xs text-gray-500">
                    <p className="mb-1">Conditions ({rule.conditions.length}):</p>
                    {rule.conditions.map((condition, index) => (
                      <span key={condition.id} className="inline-block mr-2 mb-1 px-2 py-1 bg-gray-100 rounded">
                        {fieldLabels[condition.field]} {operatorLabels[condition.operator]} "{condition.value}"
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center gap-1 ml-4">
                  <button
                    onClick={() => handleMovePriority(rule.id, 'up', 'box')}
                    disabled={rule.priority <= 1}
                    className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                    title="Increase priority"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleMovePriority(rule.id, 'down', 'box')}
                    className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Decrease priority"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleToggleRule(rule.id, 'box')}
                    className={`p-1 rounded transition-colors ${
                      rule.enabled 
                        ? 'text-gray-500 hover:text-orange-600 hover:bg-orange-50' 
                        : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
                    }`}
                    title={rule.enabled ? 'Disable rule' : 'Enable rule'}
                  >
                    {rule.enabled ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  </button>
                  <button
                    onClick={() => handleEditRule(rule.id, 'box')}
                    disabled={isAddingRule || editingRuleId !== null}
                    className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                    title="Edit rule"
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteRule(rule.id, 'box')}
                    disabled={isAddingRule || editingRuleId !== null}
                    className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                    title="Delete rule"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {sortedBoxRules.length === 0 && (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <Box className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No box rules defined</p>
            <p className="text-xs text-gray-400 mt-1">Create rules to automatically determine shipping boxes</p>
          </div>
        )}
      </div>

      {/* Import/Export Section */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Import/Export Rules
        </h4>
        <p className="text-gray-600 text-sm mb-4">
          Export your packaging and box rules to a CSV file for backup or import rules from another system.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Export */}
          <div className="space-y-3">
            <h5 className="text-sm font-medium text-gray-700">Export Rules</h5>
            <p className="text-xs text-gray-600">
              Download all packaging and box rules as a CSV file.
            </p>
            <button
              onClick={handleExportRules}
              disabled={isExporting || (localRules.length === 0 && localBoxRules.length === 0)}
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
                  Export Rules ({localRules.length + localBoxRules.length})
                </>
              )}
            </button>
          </div>

          {/* Import */}
          <div className="space-y-3">
            <h5 className="text-sm font-medium text-gray-700">Import Rules</h5>
            <p className="text-xs text-gray-600">
              Import previously exported rules. New rules will be added to existing ones.
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
                  Import Rules
                </>
              )}
              <input
                type="file"
                accept=".csv"
                onChange={handleImportRules}
                disabled={isImporting}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Import/Export Messages */}
        {importExportMessage && (
          <div className={`flex items-center gap-2 p-3 rounded-lg mt-4 ${
            importExportMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {importExportMessage.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            <span className="text-sm">{importExportMessage.text}</span>
          </div>
        )}

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-800">
              <p className="font-medium mb-1">Import/Export Notes:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Export creates a CSV file with all your packaging and box rules</li>
                <li>Import adds rules to your existing collection (no duplicates by ID)</li>
                <li>Imported rules get new IDs to prevent conflicts</li>
                <li>Colors and all rule settings are preserved during import/export</li>
                <li>Use this feature to backup rules or transfer them between devices</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">How Rules Work:</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p>1. <strong>Rule Types:</strong> Choose "Packaging Type" for packaging materials or "Shipping Box" for destination boxes</p>
          <p>2. <strong>Rule Evaluation:</strong> Rules are checked in priority order (lower number = higher priority)</p>
          <p>3. <strong>Condition Logic:</strong> ALL conditions in a rule must be true for it to match</p>
          <p>4. <strong>First Match Wins:</strong> The first rule that matches determines the result</p>
          <p>5. <strong>Available Fields:</strong> SKU, Quantity, Width, Weight, Location, Order Value, Channel, Ship From Location</p>
        </div>
      </div>
    </div>
  );
};