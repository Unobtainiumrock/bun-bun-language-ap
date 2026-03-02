import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Send, Sparkles } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (message: string) => void;
}

export function ChatInput({ value, onChange, onSend }: ChatInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (value.trim()) {
      onSend(value.trim());
      onChange('');
    }
  };

  const insertExamplePrompt = () => {
    const examplePrompt = "Je suis allé au magasin hier et j'ai acheté un pomme et deux baguette. Je parle avec mon ami et il me dit que c'est un bon jour pour faire du shopping. Je suis très excité pour mon vacance en France le prochain semaine!";
    onChange(examplePrompt);
  };

  return (
    <div className="space-y-2">
      <button
        onClick={insertExamplePrompt}
        className="flex items-center space-x-1 text-xs sm:text-sm text-blue-500 hover:text-blue-600 transition-colors duration-200 p-1"
      >
        <Sparkles size={14} className="sm:w-4 sm:h-4" />
        <span className="hidden sm:inline">Insert Example with Common Mistakes</span>
        <span className="sm:hidden">Try Example</span>
      </button>
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Type your message in French..."
          className={`w-full p-3 pr-12 sm:pr-14 rounded-lg border text-sm sm:text-base ${
            isFocused ? 'border-blue-500' : 'border-gray-300'
          } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none`}
          rows={1}
          style={{ minHeight: '44px', maxHeight: '120px' }}
        />
        <button
          onClick={handleSend}
          disabled={!value.trim()}
          className={`absolute right-2 bottom-2 p-2 sm:p-2.5 rounded-full ${
            value.trim()
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          } transition-colors duration-200`}
        >
          <Send size={18} className="sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>
  );
} 