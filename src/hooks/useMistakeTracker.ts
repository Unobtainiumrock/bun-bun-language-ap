import { useState } from 'react';
import type { Correction } from '@/types/mistakes';
import type { ChatResponse } from '@/types/mistakes';
import { dbUtils } from '@/db';

export function useMistakeTracker() {
  const [mistakes, setMistakes] = useState<Correction[]>([]);

  const processMistakesFromConversation = async (userInput: string, aiResponse: ChatResponse) => {
    try {
      console.log('🔄 Starting mistake processing for:', userInput);
      
      // Convert AI corrections to our Correction type
      const newMistakes = aiResponse.corrections.map(correction => ({
        id: Date.now().toString(),
        type: correction.mistakeType as any, // TODO: Fix type mapping
        subcategory: correction.subcategory,
        severity: correction.severity,
        userInput: correction.userInput,
        correction: correction.correction,
        explanation: correction.explanation,
        grammarRule: correction.grammarRule || '',
        examples: correction.examples || []
      }));

      console.log('📝 Converted corrections:', newMistakes);

      // Add to local state
      setMistakes(prev => [...prev, ...newMistakes]);

      // Store in database (this automatically updates mistake patterns)
      let savedCount = 0;
      for (const mistake of newMistakes) {
        console.log('💾 Storing mistake in database:', mistake);
        await dbUtils.recordMistake({
          sessionId: Date.now().toString(),
          timestamp: new Date(),
          category: mistake.type,
          subcategory: mistake.subcategory,
          severity: mistake.severity,
          userInput: mistake.userInput,
          correction: mistake.correction,
          explanation: mistake.explanation,
          context: userInput,
          isRepeated: false,
          relatedMistakes: [],
          detailedCorrection: {
            originalText: mistake.userInput,
            correctedText: mistake.correction,
            diffSegments: [],
            explanation: mistake.explanation,
            grammarRule: mistake.grammarRule,
            examples: mistake.examples
          }
        });
        savedCount++;
      }

      console.log(`✅ Successfully processed ${savedCount} mistakes`);

    } catch (error) {
      console.error('❌ Error processing mistakes:', error);
    }
  };

  return {
    mistakes,
    processMistakesFromConversation
  };
} 