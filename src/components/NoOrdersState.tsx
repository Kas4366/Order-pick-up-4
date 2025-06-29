import React from 'react';
import { Search } from 'lucide-react';

export const NoOrdersState: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-10 text-center">
      <div className="flex justify-center mb-4">
        <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center">
          <Search className="h-8 w-8 text-gray-500" />
        </div>
      </div>
      
      <h3 className="text-xl font-bold text-gray-800 mb-2">
        No Order Selected
      </h3>
      
      <p className="text-gray-600 max-w-md mx-auto">
        Search for a customer name, use a barcode scanner, or select an order from the sidebar to view its details.
      </p>
    </div>
  );
};