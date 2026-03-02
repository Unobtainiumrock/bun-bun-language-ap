import React, { useState } from 'react';
import { Download, Smartphone, RefreshCw, Trash2 } from 'lucide-react';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export const Settings: React.FC = () => {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const { isInstallable, installApp, resetInstallPrompt } = usePWAInstall();

  // Check if app is already installed
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isInWebAppiOS = (window.navigator as any).standalone === true;
  const isInstalled = isStandalone || isInWebAppiOS;

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all app data? This will remove all your progress and cannot be undone.')) {
      localStorage.clear();
      if ('indexedDB' in window) {
        indexedDB.deleteDatabase('FrenchAppDB');
      }
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
      
      {/* PWA Installation Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Smartphone className="w-5 h-5 mr-2 text-blue-500" />
          App Installation
        </h3>
        
        {isInstalled ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Download className="w-5 h-5 text-green-500" />
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-green-800">App Installed</h4>
                <p className="text-sm text-green-700">
                  BunBun is installed and running as a standalone app!
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600 text-sm">
              Install BunBun as an app for the best experience with offline access and faster loading.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowInstallPrompt(true)}
                className="flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Install App Guide
              </button>
              
              {isInstallable && (
                <button
                  onClick={installApp}
                  className="flex items-center justify-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Install Now
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* App Data Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <RefreshCw className="w-5 h-5 mr-2 text-blue-500" />
          App Data
        </h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Reset Install Prompt</h4>
            <p className="text-sm text-gray-600 mb-3">
              Show the app installation guide again if you dismissed it earlier.
            </p>
            <button
              onClick={resetInstallPrompt}
              className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset Install Prompt
            </button>
          </div>
          
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Clear All Data</h4>
            <p className="text-sm text-gray-600 mb-3">
              Remove all your progress, conversations, and app data. This cannot be undone.
            </p>
            <button
              onClick={handleClearData}
              className="flex items-center px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All Data
            </button>
          </div>
        </div>
      </div>

      {/* App Info Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">About</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p><strong>App:</strong> BunBun - Language Learning</p>
          <p><strong>Version:</strong> 1.0.0</p>
          <p><strong>Mode:</strong> {isInstalled ? 'Standalone App' : 'Web Browser'}</p>
          <p><strong>Offline:</strong> {navigator.onLine ? 'Online' : 'Offline'}</p>
        </div>
      </div>

      {/* Install Prompt Modal */}
      {showInstallPrompt && (
        <PWAInstallPrompt
          onClose={() => setShowInstallPrompt(false)}
          onInstall={installApp}
        />
      )}
    </div>
  );
}; 