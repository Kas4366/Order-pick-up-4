export type RuleOperator = 'contains' | 'equals' | 'greater_than' | 'less_than' | 'greater_equal' | 'less_equal' | 'starts_with' | 'ends_with';

export type RuleField = 'sku' | 'quantity' | 'width' | 'weight' | 'location' | 'orderValue';

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
  packagingType: string;
  priority: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PackagingRulesState {
  rules: PackagingRule[];
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
    packagingType: 'Letter',
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
  orderValue: 'Order Value'
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