import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Smartphone, Download, Share, Plus, Home, ChevronRight } from 'lucide-react';

interface PWAInstallPromptProps {
  onClose: () => void;
  onInstall?: () => void;
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt({ onClose, onInstall }: PWAInstallPromptProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop' | 'unknown'>('unknown');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isDesktop = !isIOS && !isAndroid;

    if (isIOS) {
      setPlatform('ios');
    } else if (isAndroid) {
      setPlatform('android');
    } else if (isDesktop) {
      setPlatform('desktop');
    }

    // Listen for the beforeinstallprompt event (Chrome/Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        onInstall?.();
        onClose();
      }
      setDeferredPrompt(null);
    }
  };

  const steps = {
    ios: [
      {
        title: "Add to Home Screen",
        description: "Install BunBun as an app on your iPhone for the best experience!",
        icon: <Smartphone className="w-8 h-8 text-blue-500" />,
        instruction: "Tap the Share button at the bottom of your screen",
        visual: <Share className="w-12 h-12 text-blue-500 mx-auto" />
      },
      {
        title: "Find 'Add to Home Screen'",
        description: "Look for the 'Add to Home Screen' option in the share menu",
        icon: <Plus className="w-8 h-8 text-blue-500" />,
        instruction: "Scroll down and tap 'Add to Home Screen'",
        visual: (
          <div className="flex items-center justify-center space-x-2">
            <Plus className="w-6 h-6 text-blue-500" />
            <span className="text-sm font-medium">Add to Home Screen</span>
          </div>
        )
      },
      {
        title: "Confirm Installation",
        description: "Tap 'Add' to install BunBun on your home screen",
        icon: <Home className="w-8 h-8 text-blue-500" />,
        instruction: "Your app will appear on your home screen like any other app!",
        visual: <Home className="w-12 h-12 text-blue-500 mx-auto" />
      }
    ],
    android: [
      {
        title: "Install App",
        description: "Add BunBun to your home screen for quick access!",
        icon: <Smartphone className="w-8 h-8 text-blue-500" />,
        instruction: deferredPrompt ? "Tap the 'Install App' button below" : "Look for the install prompt in your browser",
        visual: <Download className="w-12 h-12 text-blue-500 mx-auto" />
      },
      {
        title: "App Installed!",
        description: "BunBun is now installed on your device",
        icon: <Home className="w-8 h-8 text-blue-500" />,
        instruction: "You can find it in your app drawer or home screen",
        visual: <Home className="w-12 h-12 text-blue-500 mx-auto" />
      }
    ],
    desktop: [
      {
        title: "Install Desktop App",
        description: "Install BunBun as a desktop app for the best experience!",
        icon: <Download className="w-8 h-8 text-blue-500" />,
        instruction: deferredPrompt ? "Click the 'Install App' button below" : "Look for the install icon in your browser's address bar",
        visual: <Download className="w-12 h-12 text-blue-500 mx-auto" />
      },
      {
        title: "App Installed!",
        description: "BunBun is now installed on your computer",
        icon: <Home className="w-8 h-8 text-blue-500" />,
        instruction: "You can launch it from your desktop or start menu",
        visual: <Home className="w-12 h-12 text-blue-500 mx-auto" />
      }
    ],
    unknown: [
      {
        title: "Add to Home Screen",
        description: "Install BunBun for quick access and the best experience!",
        icon: <Smartphone className="w-8 h-8 text-blue-500" />,
        instruction: "Look for the 'Add to Home Screen' or 'Install' option in your browser menu",
        visual: <Download className="w-12 h-12 text-blue-500 mx-auto" />
      }
    ]
  };

  const currentSteps = steps[platform] || steps.unknown;
  const currentStepData = currentSteps[currentStep];
  const isLastStep = currentStep === currentSteps.length - 1;

  const nextStep = () => {
    if (currentStep < currentSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
            <div className="flex items-center space-x-3">
              {currentStepData.icon}
              <div>
                <h2 className="text-xl font-bold">{currentStepData.title}</h2>
                <p className="text-blue-100 text-sm">Step {currentStep + 1} of {currentSteps.length}</p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-gray-200 h-1">
            <motion.div
              className="bg-blue-500 h-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / currentSteps.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="mb-4">
                {currentStepData.visual}
              </div>
              <p className="text-gray-600 mb-4">{currentStepData.description}</p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 font-medium text-sm">{currentStepData.instruction}</p>
              </div>
            </div>

            {/* Special Install Button for Android/Desktop */}
            {(platform === 'android' || platform === 'desktop') && deferredPrompt && currentStep === 0 && (
              <div className="mb-4">
                <button
                  onClick={handleInstallClick}
                  className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
                >
                  <Download size={20} />
                  <span>Install App</span>
                </button>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentStep === 0
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Previous
              </button>

              <div className="flex space-x-2">
                {currentSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentStep ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>

              {isLastStep ? (
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
                >
                  Got it!
                </button>
              ) : (
                <button
                  onClick={nextStep}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center space-x-1"
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 text-center">
            <p className="text-xs text-gray-500">
              Installing the app gives you offline access and a better experience!
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 