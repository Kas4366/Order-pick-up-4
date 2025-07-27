import React from 'react';
import { Package } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  headerContent?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children, headerContent }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-7 w-7 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-800">OrderPick</h1>
            </div>
            {headerContent && (
              <div className="flex items-center gap-4">
                {headerContent}
              </div>
            )}
          </div>
        </div>
      </header>
      
      <main className="flex-1 py-2">
        {children}
      </main>
      
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} OrderPick Assistant • All rights reserved
        </div>
      </footer>
    </div>
  );
};