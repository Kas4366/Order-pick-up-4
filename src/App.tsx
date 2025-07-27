import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { HomeView } from './views/HomeView';
import { OrderPickView } from './views/OrderPickView';
import { Home } from 'lucide-react';

type ActiveView = 'home' | 'orderPick';

function App() {
  const [activeView, setActiveView] = useState<ActiveView>('home');

  const handleNavigateToOrderPick = () => {
    setActiveView('orderPick');
  };

  const handleNavigateToHome = () => {
    setActiveView('home');
  };

  // Navigation tabs for the header
  const navigationTabs = (
    <nav className="flex space-x-1">
      <button
        onClick={handleNavigateToHome}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          activeView === 'home'
            ? 'bg-blue-100 text-blue-700 border border-blue-200'
            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
        }`}
      >
        <Home className="h-4 w-4" />
        Home
      </button>
    </nav>
  );

  return (
    <Layout headerContent={navigationTabs}>
      {activeView === 'home' && (
        <HomeView onNavigateToOrderPick={handleNavigateToOrderPick} />
      )}
      {activeView === 'orderPick' && (
        <OrderPickView />
      )}
    </Layout>
  );
}

export default App;