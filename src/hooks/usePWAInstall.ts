import { useState, useEffect } from 'react';

const PWA_INSTALL_PROMPT_KEY = 'pwa-install-prompt-shown';
const PWA_INSTALL_DISMISSED_KEY = 'pwa-install-dismissed';

export function usePWAInstall() {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);

  useEffect(() => {
    // Check if user has already seen the prompt or dismissed it
    const hasSeenPrompt = localStorage.getItem(PWA_INSTALL_PROMPT_KEY) === 'true';
    const hasDismissed = localStorage.getItem(PWA_INSTALL_DISMISSED_KEY) === 'true';
    
    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    const isInstalled = isStandalone || isInWebAppiOS;

    // Show prompt if:
    // 1. User hasn't seen it before
    // 2. User hasn't dismissed it permanently
    // 3. App is not already installed
    // 4. Wait a bit for the user to get oriented (3 seconds)
    if (!hasSeenPrompt && !hasDismissed && !isInstalled) {
      const timer = setTimeout(() => {
        setShowInstallPrompt(true);
      }, 3000); // Show after 3 seconds

      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e);
      setIsInstallable(true);
    };

    // Listen for successful app installation
    const handleAppInstalled = () => {
      setShowInstallPrompt(false);
      setIsInstallable(false);
      localStorage.setItem(PWA_INSTALL_PROMPT_KEY, 'true');
      console.log('PWA was installed successfully');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const hideInstallPrompt = (permanent = false) => {
    setShowInstallPrompt(false);
    localStorage.setItem(PWA_INSTALL_PROMPT_KEY, 'true');
    
    if (permanent) {
      localStorage.setItem(PWA_INSTALL_DISMISSED_KEY, 'true');
    }
  };

  const showInstallPromptManually = () => {
    setShowInstallPrompt(true);
  };

  const installApp = async () => {
    if (installPromptEvent) {
      installPromptEvent.prompt();
      const { outcome } = await installPromptEvent.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        hideInstallPrompt(true);
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setInstallPromptEvent(null);
      setIsInstallable(false);
    }
  };

  const resetInstallPrompt = () => {
    localStorage.removeItem(PWA_INSTALL_PROMPT_KEY);
    localStorage.removeItem(PWA_INSTALL_DISMISSED_KEY);
    setShowInstallPrompt(true);
  };

  return {
    showInstallPrompt,
    isInstallable,
    installPromptEvent,
    hideInstallPrompt,
    showInstallPromptManually,
    installApp,
    resetInstallPrompt
  };
} 