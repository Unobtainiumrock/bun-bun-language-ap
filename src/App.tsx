import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ConversationPractice } from '@/components/ConversationPractice';
import { ProgressDashboard } from '@/components/ProgressDashboard';
import { Settings } from '@/components/Settings';
import MistakeAnalytics from '@/components/MistakeAnalytics';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { FeedbackSystem } from '@/components/FeedbackSystem';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { dbUtils } from '@/db';
import { validateConfig } from '@/config/env';

function App() {
  const { showInstallPrompt, hideInstallPrompt, installApp } = usePWAInstall();

  useEffect(() => {
    // Initialize database and validate configuration on app start
    const initApp = async () => {
      try {
        // Validate configuration
        validateConfig();
        
        // Initialize database (now includes feedback system)
        await dbUtils.initializeDB();
        
        // Sync any pending feedback when app starts
        if (navigator.onLine) {
          try {
            await dbUtils.syncFeedbackToServer();
          } catch {
            // Feedback sync will retry later
          }
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    initApp();

    // Sync feedback when coming back online
    const handleOnline = async () => {
      try {
        await dbUtils.syncFeedbackToServer();
      } catch {
        // Feedback sync will retry later
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/practice" replace />} />
            <Route path="/practice" element={<ConversationPractice />} />
            <Route path="/analytics" element={<MistakeAnalytics />} />
            <Route path="/progress" element={<ProgressDashboard />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>

        {/* PWA Install Prompt */}
        {showInstallPrompt && (
          <PWAInstallPrompt
            onClose={() => hideInstallPrompt(false)}
            onInstall={installApp}
          />
        )}

        {/* Global Feedback System */}
        <FeedbackSystem />
      </div>
    </BrowserRouter>
  );
}

export default App;
