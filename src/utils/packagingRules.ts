import { Order } from '../types/Order';
import { PackagingRule, RuleCondition, RuleOperator } from '../types/Packaging';

/**
 * Evaluates a single condition against an order
 */
function evaluateCondition(order: Order, condition: RuleCondition): boolean {
  let orderValue: any;
  
  // Get the value from the order based on the field
  switch (condition.field) {
    case 'sku':
      orderValue = order.sku;
      break;
    case 'quantity':
      orderValue = order.quantity;
      break;
    case 'width':
      orderValue = order.width;
      break;
    case 'weight':
      orderValue = order.weight;
      break;
    case 'location':
      orderValue = order.location;
      break;
    case 'orderValue':
      orderValue = order.orderValue;
      break;
    case 'channel':
      orderValue = order.channel;
      break;
    case 'shipFromLocation':
      orderValue = order.shipFromLocation;
      break;
    case 'packageDimension':
      orderValue = order.packageDimension;
      break;
    case 'channelType':
      orderValue = order.channelType;
      break;
    default:
      return false;
  }
  
  // If the order value is undefined/null and we're checking for it, return false
  if (orderValue === undefined || orderValue === null) {
    return false;
  }
  
  const conditionValue = condition.value;
  
  // Evaluate based on operator
  switch (condition.operator) {
    case 'contains':
      return String(orderValue).toLowerCase().includes(String(conditionValue).toLowerCase());
    
    case 'equals':
      if (typeof orderValue === 'number' && typeof conditionValue === 'number') {
        return orderValue === conditionValue;
      }
      return String(orderValue).toLowerCase() === String(conditionValue).toLowerCase();
    
    case 'greater_than':
      const numOrderValue1 = Number(orderValue);
      const numConditionValue1 = Number(conditionValue);
      return !isNaN(numOrderValue1) && !isNaN(numConditionValue1) && numOrderValue1 > numConditionValue1;
    
    case 'less_than':
      const numOrderValue2 = Number(orderValue);
      const numConditionValue2 = Number(conditionValue);
      return !isNaN(numOrderValue2) && !isNaN(numConditionValue2) && numOrderValue2 < numConditionValue2;
    
    case 'greater_equal':
      const numOrderValue3 = Number(orderValue);
      const numConditionValue3 = Number(conditionValue);
      return !isNaN(numOrderValue3) && !isNaN(numConditionValue3) && numOrderValue3 >= numConditionValue3;
    
    case 'less_equal':
      const numOrderValue4 = Number(orderValue);
      const numConditionValue4 = Number(conditionValue);
      return !isNaN(numOrderValue4) && !isNaN(numConditionValue4) && numOrderValue4 <= numConditionValue4;
    
    case 'starts_with':
      return String(orderValue).toLowerCase().startsWith(String(conditionValue).toLowerCase());
    
    case 'ends_with':
      return String(orderValue).toLowerCase().endsWith(String(conditionValue).toLowerCase());
    
    default:
      return false;
  }
}

/**
 * Evaluates all conditions in a rule (AND logic)
 */
function evaluateRule(order: Order, rule: PackagingRule): boolean {
  if (!rule.enabled || rule.conditions.length === 0) {
    return false;
  }
  
  // All conditions must be true for the rule to match
  return rule.conditions.every(condition => evaluateCondition(order, condition));
}

/**
 * Evaluates packaging rules for an order and returns the packaging type
 * Rules are evaluated in priority order (lower number = higher priority)
 */
export function evaluatePackagingRules(order: Order, rules: PackagingRule[], ruleType?: 'packaging' | 'box'): string | null {
  console.log('🔍 Evaluating packaging rules for order:', order.orderNumber, 'SKU:', order.sku);
  
  if (!rules || rules.length === 0) {
    console.log('⚠️ No rules defined for evaluation');
    return null;
  }
  
  // Sort rules by priority (lower number = higher priority)
  // Filter by ruleType if specified
  const sortedRules = [...rules]
    .filter(rule => rule.enabled)
    .filter(rule => !ruleType || rule.ruleType === ruleType)
    .sort((a, b) => a.priority - b.priority);
  
  console.log(`🔍 Evaluating ${sortedRules.length} enabled ${ruleType || 'all'} rules`);
  
  for (const rule of sortedRules) {
    console.log(`🔍 Checking rule: "${rule.name}" (priority: ${rule.priority})`);
    if (evaluateRule(order, rule)) {
      console.log(`✅ Rule "${rule.name}" matched! Result value: ${rule.resultValue}`);
      return rule.resultValue;
    } else {
      console.log(`❌ Rule "${rule.name}" did not match`);
    }
  }
  
  console.log(`⚠️ No ${ruleType || 'packaging'} rules matched for this order`);
  return null;
}

/**
 * Validates a packaging rule
 */
export function validatePackagingRule(rule: Partial<PackagingRule>): string[] {
  const errors: string[] = [];
  
  if (!rule.name || rule.name.trim() === '') {
    errors.push('Rule name is required');
  }
  
  if (!rule.packagingType || rule.packagingType.trim() === '') {
    errors.push('Packaging type is required');
  }
  
  if (!rule.conditions || rule.conditions.length === 0) {
    errors.push('At least one condition is required');
  } else {
    rule.conditions.forEach((condition, index) => {
      if (!condition.field) {
        errors.push(`Condition ${index + 1}: Field is required`);
      }
      
      if (!condition.operator) {
        errors.push(`Condition ${index + 1}: Operator is required`);
      }
      
      if (condition.value === undefined || condition.value === null || condition.value === '') {
        errors.push(`Condition ${index + 1}: Value is required`);
      }
    });
  }
  
  if (typeof rule.priority !== 'number' || rule.priority < 0) {
    errors.push('Priority must be a non-negative number');
  }
  
  return errors;
}