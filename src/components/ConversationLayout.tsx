import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatInput } from '@/components/ChatInput';
import { CorrectionsThread } from '@/components/CorrectionsThread';
import { MessageSquare, X, ChevronLeft } from 'lucide-react';
import type { Message, Correction } from '@/types/mistakes';

interface ConversationLayoutProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  inputValue: string;
  setInputValue: (value: string) => void;
  corrections?: Correction[];
  isLoading?: boolean;
}

export function ConversationLayout({
  messages,
  onSendMessage,
  inputValue,
  setInputValue,
  corrections = [],
  isLoading = false
}: ConversationLayoutProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const hasCorrections = corrections.length > 0;

  return (
    <div className="relative h-[calc(100vh-4rem)]">
      {/* Desktop Layout - Hidden on mobile */}
      <div className="hidden lg:flex h-full">
        {/* Conversation Thread */}
        <div className="flex-1 flex flex-col border-r border-gray-200">
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {message.content}
                  </div>
                </motion.div>
              ))}
              <AnimatePresence>
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex justify-start"
                  >
                    <div className="bg-gray-100 rounded-lg p-4">
                      <div className="flex space-x-2">
                        <motion.div
                          animate={{ y: [0, -10, 0] }}
                          transition={{ duration: 0.5, repeat: Infinity }}
                          className="w-2 h-2 bg-gray-400 rounded-full"
                        />
                        <motion.div
                          animate={{ y: [0, -10, 0] }}
                          transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }}
                          className="w-2 h-2 bg-gray-400 rounded-full"
                        />
                        <motion.div
                          animate={{ y: [0, -10, 0] }}
                          transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }}
                          className="w-2 h-2 bg-gray-400 rounded-full"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="border-t border-gray-200 p-4 bg-white sticky bottom-0">
            <ChatInput
              value={inputValue}
              onChange={setInputValue}
              onSend={onSendMessage}
            />
          </div>
        </div>

        {/* Corrections Thread - Desktop */}
        <div className="w-1/3 min-w-[300px] max-w-[400px] flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <CorrectionsThread corrections={corrections} />
          </div>
        </div>
      </div>

      {/* Mobile Layout - Visible on mobile */}
      <div className="lg:hidden h-full flex flex-col">
        {/* Main Conversation Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {message.content}
                  </div>
                </motion.div>
              ))}
              <AnimatePresence>
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex justify-start"
                  >
                    <div className="bg-gray-100 rounded-lg p-4">
                      <div className="flex space-x-2">
                        <motion.div
                          animate={{ y: [0, -10, 0] }}
                          transition={{ duration: 0.5, repeat: Infinity }}
                          className="w-2 h-2 bg-gray-400 rounded-full"
                        />
                        <motion.div
                          animate={{ y: [0, -10, 0] }}
                          transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }}
                          className="w-2 h-2 bg-gray-400 rounded-full"
                        />
                        <motion.div
                          animate={{ y: [0, -10, 0] }}
                          transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }}
                          className="w-2 h-2 bg-gray-400 rounded-full"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          {/* Chat Input */}
          <div className="border-t border-gray-200 p-4 bg-white">
            <ChatInput
              value={inputValue}
              onChange={setInputValue}
              onSend={onSendMessage}
            />
          </div>
        </div>

        {/* Floating Feedback Button - Only show if there are corrections */}
        <AnimatePresence>
          {hasCorrections && !isDrawerOpen && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={() => setIsDrawerOpen(true)}
              className="fixed bottom-20 right-4 bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors z-40"
            >
              <div className="relative">
                <MessageSquare size={24} />
                {corrections.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {corrections.length}
                  </span>
                )}
              </div>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Mobile Drawer Overlay */}
        <AnimatePresence>
          {isDrawerOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-50"
              onClick={() => setIsDrawerOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Mobile Drawer */}
        <AnimatePresence>
          {isDrawerOpen && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-xl z-50 flex flex-col"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center space-x-2">
                  <MessageSquare size={20} className="text-blue-500" />
                  <h3 className="font-semibold text-gray-900">Live Feedback</h3>
                  {corrections.length > 0 && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {corrections.length}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto">
                <CorrectionsThread corrections={corrections} />
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-full flex items-center justify-center space-x-2 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <ChevronLeft size={16} />
                  <span>Back to Chat</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
} 