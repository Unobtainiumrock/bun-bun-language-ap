import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { MessageCircle, Book, TrendingUp, Settings, BarChart3, WifiOff } from 'lucide-react';

export const Layout: React.FC = () => {
  const location = useLocation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Book className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mr-2 sm:mr-3" />
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">BunBun</h1>
              {!isOnline && (
                <div className="ml-3 flex items-center text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                  <WifiOff className="w-3 h-3 mr-1" />
                  <span className="text-xs font-medium">Offline</span>
                </div>
              )}
            </div>
            
            <div className="flex space-x-2 sm:space-x-8">
              <Link
                to="/practice"
                className={`inline-flex items-center px-1 pt-1 text-xs sm:text-sm font-medium ${
                  isActive('/practice')
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Practice</span>
                <span className="sm:hidden">Chat</span>
              </Link>
              
              <Link
                to="/progress"
                className={`inline-flex items-center px-1 pt-1 text-xs sm:text-sm font-medium ${
                  isActive('/progress')
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Progress
              </Link>

              <Link
                to="/analytics"
                className={`inline-flex items-center px-1 pt-1 text-xs sm:text-sm font-medium ${
                  isActive('/analytics')
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Analytics</span>
                <span className="sm:hidden">Stats</span>
              </Link>
              
              <Link
                to="/settings"
                className={`inline-flex items-center px-1 pt-1 text-xs sm:text-sm font-medium ${
                  isActive('/settings')
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Settings</span>
                <span className="sm:hidden">Set</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto">
        <div className="h-[calc(100vh-4rem)]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}; 