import React from 'react';
import { CheckCircle2, ArrowRight, Package } from 'lucide-react';
import { Order } from '../types/Order';

interface OrderSidebarProps {
  orders: Order[];
  currentOrder: Order | null;
  currentOrderIndex: number;
  onOrderSelect: (order: Order) => void;
}

interface GroupedOrder {
  customerName: string;
  orderNumber: string;
  items: Order[];
  totalItems: number;
  completedItems: number;
  buyerPostcode?: string;
  originalIndex: number; // Track original position in CSV
}

export const OrderSidebar: React.FC<OrderSidebarProps> = ({ 
  orders, 
  currentOrder, 
  currentOrderIndex,
  onOrderSelect 
}) => {
  // Group orders ONLY when they have the exact same customer name AND order number
  const groupedOrders = React.useMemo(() => {
    const groups = new Map<string, GroupedOrder>();

    orders.forEach((order, index) => {
      // Only group if both customer name and order number are meaningful (not defaults)
      const hasRealCustomerName = order.customerName && !order.customerName.startsWith('Customer-');
      const hasRealOrderNumber = order.orderNumber && !order.orderNumber.startsWith('Row-');
      
      // Create a strict grouping key - only group when both customer and order number match exactly
      const groupKey = hasRealCustomerName && hasRealOrderNumber 
        ? `${order.customerName.trim()}_${order.orderNumber.trim()}`
        : `unique_${index}`; // Make each order unique if no real customer/order data
      
      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          customerName: order.customerName,
          orderNumber: order.orderNumber,
          items: [],
          totalItems: 0,
          completedItems: 0,
          buyerPostcode: order.buyerPostcode,
          originalIndex: index, // Use the first occurrence index for sorting
        });
      }

      const group = groups.get(groupKey)!;
      group.items.push(order);
      group.totalItems += order.quantity;
      if (order.completed) {
        group.completedItems += order.quantity;
      }
    });

    // Sort by original index to preserve CSV order
    const sortedGroups = Array.from(groups.values()).sort((a, b) => a.originalIndex - b.originalIndex);
    
    console.log(`📋 Grouped ${orders.length} orders into ${sortedGroups.length} display groups`);
    
    // Log grouping details
    sortedGroups.forEach((group, index) => {
      if (group.items.length > 1) {
        console.log(`  👥 Group ${index + 1}: ${group.customerName} (Order: ${group.orderNumber}) - ${group.items.length} items`);
      } else {
        console.log(`  👤 Group ${index + 1}: ${group.customerName} (Order: ${group.orderNumber}) - single item`);
      }
    });
    
    return sortedGroups;
  }, [orders]);

  const getCurrentGroup = () => {
    if (!currentOrder) return null;
    return groupedOrders.find(group => 
      group.items.some(item => 
        item.orderNumber === currentOrder.orderNumber && 
        item.sku === currentOrder.sku &&
        item.customerName === currentOrder.customerName
      )
    );
  };

  const currentGroup = getCurrentGroup();

  // Scroll to current order in sidebar
  React.useEffect(() => {
    if (currentOrder && currentOrderIndex >= 0) {
      const currentGroupIndex = groupedOrders.findIndex(group => 
        group.items.some(item => 
          item.orderNumber === currentOrder.orderNumber && 
          item.sku === currentOrder.sku &&
          item.customerName === currentOrder.customerName
        )
      );
      
      if (currentGroupIndex >= 0) {
        const groupElement = document.querySelector(`[data-group-index="${currentGroupIndex}"]`);
        if (groupElement) {
          groupElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }
    }
  }, [currentOrder, currentOrderIndex, groupedOrders]);

  return (
    <div className="w-80 shrink-0 bg-white rounded-lg shadow-md border border-gray-200 h-[calc(100vh-8rem)] overflow-hidden flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800">Orders List</h3>
        <div className="text-sm text-gray-600 mt-1">
          <p>{groupedOrders.length} orders • {orders.length} items total</p>
          {currentOrderIndex >= 0 && (
            <p className="text-blue-600">
              Item {currentOrderIndex + 1} of {orders.length}
            </p>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {groupedOrders.map((group, groupIndex) => {
          const isCurrentGroup = currentGroup === group;
          const isCompleted = group.completedItems === group.totalItems && group.totalItems > 0;
          
          return (
            <div 
              key={`${group.customerName}-${group.orderNumber}-${groupIndex}`} 
              className="border-b border-gray-100"
              data-group-index={groupIndex}
            >
              {/* Group Header - Clickable for single items or group selection */}
              <button
                onClick={() => {
                  // If single item, select it directly
                  if (group.items.length === 1) {
                    onOrderSelect(group.items[0]);
                  } else {
                    // If multiple items, select the first uncompleted item or first item
                    const nextItem = group.items.find(item => !item.completed) || group.items[0];
                    onOrderSelect(nextItem);
                  }
                }}
                className={`w-full text-left p-4 ${isCurrentGroup ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50'} transition-colors`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{group.customerName}</p>
                      {isCurrentGroup && (
                        <ArrowRight className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500">Order #{group.orderNumber}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-500">
                        {group.items.length} SKU{group.items.length !== 1 ? 's' : ''} • {group.totalItems} item{group.totalItems !== 1 ? 's' : ''}
                      </span>
                      {group.completedItems > 0 && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          {group.completedItems}/{group.totalItems} done
                        </span>
                      )}
                    </div>
                    {group.buyerPostcode && (
                      <p className="text-xs text-blue-600 mt-1">
                        📮 {group.buyerPostcode}
                      </p>
                    )}
                  </div>
                  
                  {isCompleted && (
                    <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  )}
                </div>
              </button>

              {/* Individual Items (shown when this is the current group and has multiple items) */}
              {isCurrentGroup && group.items.length > 1 && (
                <div className="bg-blue-25 border-l-4 border-l-blue-500">
                  {group.items.map((item, itemIndex) => {
                    const isCurrentItem = currentOrder?.sku === item.sku && 
                                         currentOrder?.orderNumber === item.orderNumber &&
                                         currentOrder?.customerName === item.customerName;
                    
                    return (
                      <button
                        key={`${item.orderNumber}-${item.sku}-${itemIndex}`}
                        onClick={() => onOrderSelect(item)}
                        className={`w-full text-left px-6 py-3 border-b border-blue-100 hover:bg-blue-100 transition-colors ${
                          isCurrentItem ? 'bg-blue-100' : 'bg-blue-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Package className="h-3 w-3 text-blue-600" />
                            <div>
                              <p className="text-sm font-medium text-gray-800">{item.sku}</p>
                              <p className="text-xs text-gray-600">
                                Qty: {item.quantity} • Location: {item.location}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            {isCurrentItem && (
                              <ArrowRight className="h-3 w-3 text-blue-600" />
                            )}
                            {item.completed && (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};