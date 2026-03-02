import React from 'react';
import type { ChatMessage } from '@/services/aiService';
import { motion, AnimatePresence } from 'framer-motion';

interface ConversationThreadProps {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
}

export const ConversationThread: React.FC<ConversationThreadProps> = ({
  messages,
  isLoading,
  error
}) => {
  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-4">
      <AnimatePresence>
        {messages.map((message, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <motion.div
              className={`max-w-[80%] rounded-lg p-4 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>
      
      {isLoading && (
        <motion.div 
          className="flex justify-start"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="flex space-x-2">
              <motion.div
                className="w-2 h-2 bg-gray-400 rounded-full"
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 0.6 }}
              />
              <motion.div
                className="w-2 h-2 bg-gray-400 rounded-full"
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
              />
              <motion.div
                className="w-2 h-2 bg-gray-400 rounded-full"
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
              />
            </div>
          </div>
        </motion.div>
      )}

      {error && (
        <motion.div 
          className="flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <div className="bg-red-100 text-red-700 rounded-lg p-4">
            {error}
          </div>
        </motion.div>
      )}
    </div>
  );
}; 