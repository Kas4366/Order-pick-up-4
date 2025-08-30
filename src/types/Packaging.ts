export type RuleOperator = 'contains' | 'equals' | 'greater_than' | 'less_than' | 'greater_equal' | 'less_equal' | 'starts_with' | 'ends_with';

export type RuleField = 'sku' | 'quantity' | 'width' | 'weight' | 'location' | 'orderValue' | 'channel' | 'shipFromLocation';

export interface RuleCondition {
  id: string;
  field: RuleField;
  operator: RuleOperator;
  value: string | number;
}

export interface PackagingRule {
  id: string;
  name: string;
  description?: string;
  conditions: RuleCondition[];
  ruleType: 'packaging' | 'box';
  resultValue: string;
  priority: number;
  enabled: boolean;
  color?: string; // Color theme for box rules
  createdAt: string;
  updatedAt: string;
}

export interface PackagingRulesState {
  rules: PackagingRule[];
  boxRules: PackagingRule[];
}

export const defaultPackagingRules: PackagingRule[] = [
  {
    id: 'default-letter',
    name: 'Default Letter',
    description: 'Small items that fit in a letter',
    conditions: [
      {
        id: 'cond-1',
        field: 'quantity',
        operator: 'less_equal',
        value: 1
      }
    ],
    ruleType: 'packaging',
    resultValue: 'Letter',
    priority: 100,
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const fieldLabels: Record<RuleField, string> = {
  sku: 'SKU',
  quantity: 'Quantity',
  width: 'Width (cm)',
  weight: 'Weight (g)',
  location: 'Location',
  orderValue: 'Order Value',
  channel: 'Channel',
  shipFromLocation: 'Ship From Location',
  packageDimension: 'Package Dimension',
  channelType: 'Channel Type'
};

export const operatorLabels: Record<RuleOperator, string> = {
  contains: 'Contains',
  equals: 'Equals',
  greater_than: 'Greater than',
  less_than: 'Less than',
  greater_equal: 'Greater than or equal',
  less_equal: 'Less than or equal',
  starts_with: 'Starts with',
  ends_with: 'Ends with'
};

export const defaultPackagingTypes = [
  'Letter',
  'Large Letter',
  'Small Packet',
  'Medium Packet',
  'Large Packet',
  'Parcel',
  'Box',
  'Envelope',
  'Bubble Wrap',
  'Custom'
];

export const defaultBoxNames = [
  'SM OBA',
  'CC OBA', 
  'Click & Drop',
  'Local Pickup',
  'Express Box',
  'Standard Box'
];

export const defaultBoxRules: PackagingRule[] = [
  {
    id: 'default-sm-oba',
    name: 'SM OBA Box',
    description: 'Orders going to SM OBA location',
    conditions: [
      {
        id: 'cond-sm-1',
        field: 'shipFromLocation',
        operator: 'contains',
        value: 'SM'
      }
    ],
    ruleType: 'box',
    resultValue: 'SM OBA',
    priority: 50,
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export function validateRule(rule: Partial<PackagingRule>): string[] {
  const errors: string[] = [];
  
  if (!rule.name || rule.name.trim() === '') {
    errors.push('Rule name is required');
  }
  
  if (!rule.resultValue || rule.resultValue.trim() === '') {
    errors.push('Result value is required');
  }
  
  if (!rule.ruleType) {
    errors.push('Rule type is required');
  }
  
  if (!rule.conditions || rule.conditions.length === 0) {
    errors.push('At least one condition is required');
  }
  
  return errors;
}

/**
 * Legacy function for backward compatibility
 */
export function validatePackagingRule(rule: Partial<PackagingRule>): string[] {
  return validateRule(rule);
}