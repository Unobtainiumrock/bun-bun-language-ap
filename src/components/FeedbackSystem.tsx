import React, { useState, useEffect } from 'react';
import { MessageSquare, Bug, Lightbulb, Heart, Star, Send, X, CheckCircle } from 'lucide-react';
import { db, type UserFeedback } from '@/db';

interface FeedbackSystemProps {
  trigger?: 'manual' | 'session-end' | 'error' | 'milestone';
  context?: {
    sessionId?: string;
    mistakeCount?: number;
    currentScreen?: string;
  };
  onClose?: () => void;
}

export const FeedbackSystem: React.FC<FeedbackSystemProps> = ({
  trigger = 'manual',
  context,
  onClose
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<'type' | 'rating' | 'details' | 'success'>('type');
  const [feedback, setFeedback] = useState<Partial<UserFeedback>>({
    type: 'general',
    rating: 5,
    title: '',
    description: '',
    submitted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Auto-open based on triggers
  useEffect(() => {
    if (trigger === 'session-end' && context?.mistakeCount !== undefined) {
      // Show feedback after learning sessions
      setTimeout(() => setIsOpen(true), 1000);
    } else if (trigger === 'milestone' && context?.mistakeCount === 0) {
      // Show feedback when user has a perfect session
      setTimeout(() => setIsOpen(true), 500);
    }
  }, [trigger, context]);

  const feedbackTypes = [
    {
      id: 'bug' as const,
      icon: Bug,
      title: 'Report Bug',
      description: 'Something is broken or not working correctly',
      color: 'red'
    },
    {
      id: 'feature' as const,
      icon: Lightbulb,
      title: 'Feature Request',
      description: 'Suggest a new feature or improvement',
      color: 'blue'
    },
    {
      id: 'improvement' as const,
      icon: Star,
      title: 'Improvement',
      description: 'How can we make this better?',
      color: 'purple'
    },
    {
      id: 'general' as const,
      icon: Heart,
      title: 'General Feedback',
      description: 'Share your thoughts and experience',
      color: 'green'
    }
  ];

  const handleSubmit = async () => {
    try {
      const now = new Date();
      const feedbackEntry: UserFeedback = {
        ...feedback,
        type: feedback.type || 'general',
        rating: feedback.rating || 5,
        title: feedback.title || '',
        description: feedback.description || '',
        userContext: {
          sessionId: context?.sessionId,
          lastMistakeCount: context?.mistakeCount,
          currentScreen: context?.currentScreen || window.location.pathname,
          timestamp: now,
        },
        submitted: true,
        synced: false,
        createdAt: now,
        updatedAt: now,
      };

      // Store feedback in IndexedDB for offline support
      await db.table('userFeedback').add(feedbackEntry);
      
      // Try to send to server if online
      if (navigator.onLine) {
        await submitToServer(feedbackEntry);
      }

      setCurrentStep('success');
      
      // Auto-close after success
      setTimeout(() => {
        handleClose();
      }, 2000);

    } catch (error) {
      console.error('Failed to submit feedback:', error);
      // Show error state or retry option
    }
  };

  const submitToServer = async (feedbackEntry: UserFeedback) => {
    try {
      // Submit to Google Apps Script instead of Netlify function
      const response = await fetch(import.meta.env.VITE_GOOGLE_SCRIPT_URL || '', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timestamp: feedbackEntry.createdAt.toISOString(),
          type: feedbackEntry.type,
          rating: feedbackEntry.rating,
          title: feedbackEntry.title || '',
          description: feedbackEntry.description,
          sessionId: feedbackEntry.userContext?.sessionId || '',
          mistakeCount: feedbackEntry.userContext?.lastMistakeCount || 0,
          currentScreen: feedbackEntry.userContext?.currentScreen || '',
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback to Google Sheets');
      }

      // Mark as synced in local storage
      await db.table('userFeedback').update(feedbackEntry.id!, { synced: true });
      
      console.log('📊 Feedback submitted to Google Sheets successfully');
    } catch (error) {
      console.error('Google Sheets submission failed:', error);
      // Will retry when online via service worker
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setCurrentStep('type');
    setFeedback({
      type: 'general',
      rating: 5,
      title: '',
      description: '',
      submitted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    onClose?.();
  };

  const getColorClasses = (color: string) => {
    const colors = {
      red: 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100',
      blue: 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100',
      purple: 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100',
      green: 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors z-40"
        title="Give Feedback"
      >
        <MessageSquare size={20} />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {currentStep === 'success' ? 'Thank You!' : 'Give Feedback'}
          </h3>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-4">
          {/* Step 1: Choose Feedback Type */}
          {currentStep === 'type' && (
            <div className="space-y-4">
              <p className="text-gray-600">What would you like to share?</p>
              <div className="space-y-3">
                {feedbackTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => {
                        setFeedback(prev => ({ ...prev, type: type.id }));
                        setCurrentStep('rating');
                      }}
                      className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
                        feedback.type === type.id 
                          ? getColorClasses(type.color)
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <Icon size={20} className="mt-0.5" />
                        <div>
                          <h4 className="font-medium">{type.title}</h4>
                          <p className="text-sm text-gray-600">{type.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Rating */}
          {currentStep === 'rating' && (
            <div className="space-y-4">
              <p className="text-gray-600">How would you rate your overall experience?</p>
              <div className="flex justify-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setFeedback(prev => ({ ...prev, rating: star }))}
                    className="p-1"
                  >
                    <Star
                      size={32}
                      className={`transition-colors ${
                        star <= (feedback.rating || 0)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentStep('type')}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep('details')}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Details */}
          {currentStep === 'details' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title (optional)
                </label>
                <input
                  id="title"
                  type="text"
                  value={feedback.title || ''}
                  onChange={(e) => setFeedback(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Brief summary..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Details
                </label>
                <textarea
                  id="description"
                  value={feedback.description || ''}
                  onChange={(e) => setFeedback(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Tell us more about your experience..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Context Info */}
              {context && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Context (automatically included):</p>
                  <ul className="text-xs text-gray-500 space-y-1">
                    {context.sessionId && <li>Session: {context.sessionId.slice(0, 8)}...</li>}
                    {context.mistakeCount !== undefined && <li>Mistakes this session: {context.mistakeCount}</li>}
                    {context.currentScreen && <li>Screen: {context.currentScreen}</li>}
                  </ul>
                </div>
              )}

              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentStep('rating')}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!feedback.description?.trim()}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <Send size={16} />
                  <span>Submit</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {currentStep === 'success' && (
            <div className="text-center space-y-4">
              <CheckCircle size={48} className="text-green-500 mx-auto" />
              <div>
                <h4 className="text-lg font-medium text-gray-900">Feedback Submitted!</h4>
                <p className="text-gray-600">Thank you for helping us improve the app.</p>
              </div>
              {!navigator.onLine && (
                <p className="text-sm text-yellow-600">
                  Your feedback will be sent when you're back online.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Hook for triggering contextual feedback
export const useFeedbackTrigger = () => {
  const [feedbackContext, setFeedbackContext] = useState<{
    show: boolean;
    trigger: 'manual' | 'session-end' | 'error' | 'milestone';
    context?: any;
  }>({
    show: false,
    trigger: 'manual'
  });

  const triggerFeedback = (
    trigger: 'manual' | 'session-end' | 'error' | 'milestone',
    context?: any
  ) => {
    setFeedbackContext({
      show: true,
      trigger,
      context
    });
  };

  const closeFeedback = () => {
    setFeedbackContext(prev => ({ ...prev, show: false }));
  };

  return {
    feedbackContext,
    triggerFeedback,
    closeFeedback
  };
}; 