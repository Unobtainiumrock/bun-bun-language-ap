import { useState, useCallback } from 'react';
import { ConversationLayout } from '@/components/ConversationLayout';
import { aiService } from '@/services/aiService';
import type { Message } from '@/types/mistakes';
import { useMistakeTracker } from '@/hooks/useMistakeTracker';

export function ConversationPractice() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { mistakes, processMistakesFromConversation } = useMistakeTracker();

  const handleSendMessage = useCallback(async (message: string) => {
    try {
      setIsLoading(true);
      setInputValue('');

      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        content: message,
        role: 'user',
        timestamp: new Date(),
        corrections: []
      };
      setMessages(prev => [...prev, userMessage]);

      // Get AI response
      console.log('🤖 Sending message to AI:', message);
      const response = await aiService.sendChatMessage(message, 'frenchTutor');
      console.log('📥 Received AI response:', response);
      
      // Process corrections and add to database
      if (response.corrections && response.corrections.length > 0) {
        console.log('🔍 Processing corrections:', response.corrections);
        await processMistakesFromConversation(message, response);
      }

      // Add AI response as a conversation message
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.conversation,
        role: 'assistant',
        timestamp: new Date(),
        corrections: response.corrections?.map(correction => ({
          id: Date.now().toString(),
          type: correction.mistakeType as any, // TODO: Fix type mapping
          subcategory: correction.subcategory,
          severity: correction.severity,
          userInput: correction.userInput,
          correction: correction.correction,
          explanation: correction.explanation,
          grammarRule: correction.grammarRule || '',
          examples: correction.examples || []
        })) || []
      };
      console.log('💬 Adding AI message to conversation:', aiMessage);
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('❌ Error sending message:', error);
      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: "Désolé, j'ai rencontré une erreur. Pouvez-vous réessayer?",
        role: 'assistant',
        timestamp: new Date(),
        corrections: []
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [processMistakesFromConversation]);

  return (
    <div className="h-full">
      <ConversationLayout
        messages={messages}
        onSendMessage={handleSendMessage}
        inputValue={inputValue}
        setInputValue={setInputValue}
        corrections={mistakes}
        isLoading={isLoading}
      />
    </div>
  );
} 