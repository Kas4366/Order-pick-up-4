import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit2, Trash2, Save, X, ArrowUp, ArrowDown, Play, Pause, AlertCircle, CheckCircle, Settings } from 'lucide-react';
import { PackagingRule, RuleCondition, RuleField, RuleOperator, fieldLabels, operatorLabels, defaultPackagingTypes, defaultPackagingRules } from '../types/Packaging';
import { validatePackagingRule } from '../utils/packagingRules';

interface PackagingRulesSettingsProps {
  rules: PackagingRule[];
  onSaveRules: (rules: PackagingRule[]) => void;
  customPackagingTypes: string[];
  onSavePackagingTypes: (types: string[]) => void;
}

export const PackagingRulesSettings: React.FC<PackagingRulesSettingsProps> = ({
  rules,
  onSaveRules,
  customPackagingTypes,
  onSavePackagingTypes,
}) => {
  const [localRules, setLocalRules] = useState<PackagingRule[]>(rules);
  const [localPackagingTypes, setLocalPackagingTypes] = useState<string[]>(customPackagingTypes);
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [isManagingTypes, setIsManagingTypes] = useState(false);
  const [newPackagingType, setNewPackagingType] = useState('');
  const [newRule, setNewRule] = useState<Partial<PackagingRule>>({
    name: '',
    description: '',
    conditions: [],
    packagingType: '',
    priority: 50,
    enabled: true
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    setLocalRules(rules);
    setLocalPackagingTypes(customPackagingTypes);
  }, [rules]);

  const generateId = (): string => {
    return `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const generateConditionId = (): string => {
    return `cond-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleAddRule = () => {
    const errors = validatePackagingRule(newRule);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    const rule: PackagingRule = {
      id: generateId(),
      name: newRule.name!.trim(),
      description: newRule.description?.trim() || '',
      conditions: newRule.conditions || [],
      packagingType: newRule.packagingType!.trim(),
      priority: newRule.priority || 50,
      enabled: newRule.enabled !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedRules = [...localRules, rule];
    setLocalRules(updatedRules);
    onSaveRules(updatedRules);
    
    resetForm();
  };

  const handleUpdateRule = () => {
    if (!editingRuleId) return;

    const errors = validatePackagingRule(newRule);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    const updatedRules = localRules.map(rule => 
      rule.id === editingRuleId 
        ? {
            ...rule,
            name: newRule.name!.trim(),
            description: newRule.description?.trim() || '',
            conditions: newRule.conditions || [],
            packagingType: newRule.packagingType!.trim(),
            priority: newRule.priority || 50,
            enabled: newRule.enabled !== false,
            updatedAt: new Date().toISOString()
          }
        : rule
    );

    setLocalRules(updatedRules);
    onSaveRules(updatedRules);
    
    resetForm();
  };

  const handleEditRule = (ruleId: string) => {
    const rule = localRules.find(r => r.id === ruleId);
    if (rule) {
      setNewRule({
        name: rule.name,
        description: rule.description,
        conditions: [...rule.conditions],
        packagingType: rule.packagingType,
        priority: rule.priority,
        enabled: rule.enabled
      });
      setEditingRuleId(ruleId);
      setValidationErrors([]);
    }
  };

  const handleDeleteRule = (ruleId: string) => {
    if (confirm('Are you sure you want to delete this rule?')) {
      const updatedRules = localRules.filter(rule => rule.id !== ruleId);
      setLocalRules(updatedRules);
      onSaveRules(updatedRules);
    }
  };

  const handleToggleRule = (ruleId: string) => {
    const updatedRules = localRules.map(rule => 
      rule.id === ruleId 
        ? { ...rule, enabled: !rule.enabled, updatedAt: new Date().toISOString() }
        : rule
    );
    setLocalRules(updatedRules);
    onSaveRules(updatedRules);
  };

  const handleMovePriority = (ruleId: string, direction: 'up' | 'down') => {
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

  const resetForm = () => {
    setNewRule({
      name: '',
      description: '',
      conditions: [],
      packagingType: '',
      priority: 50,
      enabled: true
    });
    setIsAddingRule(false);
    setEditingRuleId(null);
    setValidationErrors([]);
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
    }
  };

  const sortedRules = [...localRules].sort((a, b) => a.priority - b.priority);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Package className="h-5 w-5" />
          Packaging Rules
        </h3>
        <p className="text-gray-600 mb-4">
          Create rules to automatically determine packaging types based on SKU, quantity, dimensions, and other order properties.
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {localRules.length} rules • {localRules.filter(r => r.enabled).length} enabled
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                Packaging Type *
              </label>
              <select
                value={newRule.packagingType || ''}
                onChange={(e) => setNewRule({ ...newRule, packagingType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">Select packaging type</option>
                {localPackagingTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
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
            <Settings className="h-4 w-4" />
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

      {/* Rules List */}
      <div className="space-y-2">
        {sortedRules.map(rule => (
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
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {rule.packagingType}
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
                  onClick={() => handleMovePriority(rule.id, 'up')}
                  disabled={rule.priority <= 1}
                  className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                  title="Increase priority"
                >
                  <ArrowUp className="h-3 w-3" />
                </button>
                <button
                  onClick={() => handleMovePriority(rule.id, 'down')}
                  className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Decrease priority"
                >
                  <ArrowDown className="h-3 w-3" />
                </button>
                <button
                  onClick={() => handleToggleRule(rule.id)}
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
                  onClick={() => handleEditRule(rule.id)}
                  disabled={isAddingRule || editingRuleId !== null}
                  className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                  title="Edit rule"
                >
                  <Edit2 className="h-3 w-3" />
                </button>
                <button
                  onClick={() => handleDeleteRule(rule.id)}
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

      {localRules.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-600 mb-2">No Packaging Rules</h4>
          <p className="text-sm text-gray-500 mb-4">
            Create your first rule to automatically determine packaging types.
          </p>
          <button
            onClick={() => setIsAddingRule(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
          >
            <Plus className="h-4 w-4" />
            Add First Rule
          </button>
        </div>
      )}

      {/* Usage Instructions */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">How Packaging Rules Work:</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p>1. <strong>Rule Evaluation:</strong> Rules are checked in priority order (lower number = higher priority)</p>
          <p>2. <strong>Condition Logic:</strong> ALL conditions in a rule must be true for it to match</p>
          <p>3. <strong>First Match Wins:</strong> The first rule that matches determines the packaging type</p>
          <p>4. <strong>Available Fields:</strong> SKU, Quantity, Width, Weight, Location, Order Value</p>
          <p>5. <strong>Example:</strong> "If SKU contains 'CK003' AND Width ≤ 40, then use 'Large Letter'"</p>
          <p>6. <strong>Multiple Conditions:</strong> Add multiple conditions to create complex rules (all must be true)</p>
          <p>7. <strong>Custom Types:</strong> Add your own packaging types in the "Manage Packaging Types" section</p>
        </div>
      </div>
    </div>
  );
};