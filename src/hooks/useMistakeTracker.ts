import { useState, useEffect, useCallback, useRef } from 'react';
import { mistakeTracker } from '@/services/mistakeTracker';
import type { Correction, ChatResponse, MistakeType } from '@/types/mistakes';

const VALID_MISTAKE_TYPES: MistakeType[] = [
  'grammar', 'vocabulary', 'syntax', 'orthography',
  'pronunciation', 'pragmatic', 'cultural',
];

function toMistakeType(raw: string): MistakeType {
  const lower = raw.toLowerCase() as MistakeType;
  return VALID_MISTAKE_TYPES.includes(lower) ? lower : 'grammar';
}

export function useMistakeTracker() {
  const [mistakes, setMistakes] = useState<Correction[]>([]);
  const sessionStarted = useRef(false);

  useEffect(() => {
    if (!sessionStarted.current) {
      sessionStarted.current = true;
      mistakeTracker.startSession().catch(console.error);
    }
    return () => {
      mistakeTracker.endSession().catch(console.error);
    };
  }, []);

  const processMistakesFromConversation = useCallback(
    async (userInput: string, aiResponse: ChatResponse) => {
      try {
        const newCorrections: Correction[] = aiResponse.corrections.map(c => ({
          id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
          type: toMistakeType(c.mistakeType),
          subcategory: c.subcategory,
          severity: c.severity,
          userInput: c.userInput,
          correction: c.correction,
          explanation: c.explanation,
          grammarRule: c.grammarRule || '',
          examples: c.examples || [],
        }));

        setMistakes(prev => [...prev, ...newCorrections]);

        await mistakeTracker.processMistakesFromConversation(
          userInput,
          JSON.stringify(aiResponse),
        );
      } catch (error) {
        console.error('Error processing mistakes:', error);
      }
    },
    [],
  );

  const getFocusAreas = useCallback(() => mistakeTracker.getFocusAreas(), []);
  const getAnalysis = useCallback(
    (timeframe: 'week' | 'month' | 'all' = 'month') =>
      mistakeTracker.getMistakeAnalysis(timeframe),
    [],
  );

  return {
    mistakes,
    processMistakesFromConversation,
    getFocusAreas,
    getAnalysis,
  };
}
