import { useState, useCallback, useRef, useEffect } from 'react';
import { ConversationLayout } from '@/components/ConversationLayout';
import { aiService } from '@/services/aiService';
import type { Message, MistakeType } from '@/types/mistakes';
import { useMistakeTracker } from '@/hooks/useMistakeTracker';

const VALID_MISTAKE_TYPES: MistakeType[] = [
  'grammar', 'vocabulary', 'syntax', 'orthography',
  'pronunciation', 'pragmatic', 'cultural',
];

function toMistakeType(raw: string): MistakeType {
  const lower = raw.toLowerCase() as MistakeType;
  return VALID_MISTAKE_TYPES.includes(lower) ? lower : 'grammar';
}

export function ConversationPractice() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { mistakes, processMistakesFromConversation } = useMistakeTracker();
  const messagesRef = useRef<Message[]>([]);

  // Keep ref in sync with state
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const handleSendMessage = useCallback(async (message: string) => {
    try {
      setIsLoading(true);
      setInputValue('');

      // Build conversation history from previous messages (last 10 messages for context)
      // Do this before adding the new message so we have the correct history
      const previousMessages = messagesRef.current;
      const conversationHistory = previousMessages
        .slice(-10)
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        content: message,
        role: 'user',
        timestamp: new Date(),
        corrections: []
      };
      setMessages(prev => [...prev, userMessage]);

      const response = await aiService.sendChatMessage(message, 'frenchTutor', conversationHistory);

      if (response.corrections && response.corrections.length > 0) {
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
          type: toMistakeType(correction.mistakeType),
          subcategory: correction.subcategory,
          severity: correction.severity,
          userInput: correction.userInput,
          correction: correction.correction,
          explanation: correction.explanation,
          grammarRule: correction.grammarRule || '',
          examples: correction.examples || []
        })) || []
      };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message with more details
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: error instanceof Error 
          ? `Désolé, j'ai rencontré une erreur: ${error.message}. Veuillez vérifier votre connexion et réessayer.`
          : "Désolé, j'ai rencontré une erreur. Pouvez-vous réessayer?",
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