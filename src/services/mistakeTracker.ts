import { dbUtils, db } from '@/db';
import type { 
  Mistake, 
  MistakeType, 
  DetailedCorrection
} from '@/types/mistakes';
import { createDiffSegments } from '@/types/mistakes';

const DEBUG = import.meta.env.DEV;
function log(...args: unknown[]) { if (DEBUG) console.log(...args); }

export interface AIResponse {
  response: string;
  mistakes?: Mistake[];
}

export class MistakeTracker {
  private currentSessionId: number | null = null;

  setCurrentSession(sessionId: number) {
    this.currentSessionId = sessionId;
  }

  static parseAIResponse(aiResponseText: string): { 
    conversationalResponse: string; 
    mistakes: Mistake[] 
  } {
    try {
      // Try to extract JSON from the AI response
      const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        const parsed: AIResponse = JSON.parse(jsonStr);
        log('Parsed JSON, mistakes:', parsed.mistakes?.length || 0);
        
        return {
          conversationalResponse: parsed.response || aiResponseText,
          mistakes: parsed.mistakes || []
        };
      }
      
      // Fallback: try to parse legacy format or return no mistakes
      const legacyMistakes = this.parseLegacyFormat(aiResponseText);
      log('Legacy parsing found:', legacyMistakes.length, 'mistakes');
      
      return {
        conversationalResponse: aiResponseText,
        mistakes: legacyMistakes
      };
      
    } catch (error) {
      console.warn('Failed to parse AI response for mistakes:', error);
      return {
        conversationalResponse: aiResponseText,
        mistakes: []
      };
    }
  }

  static parseLegacyFormat(text: string): Mistake[] {
    const mistakes: Mistake[] = [];
    
    // Method 1: Look for structured format with MISTAKE_TYPE
    const structuredPattern = /MISTAKE_TYPE:\s*(\w+)\s*\|\s*SUBCATEGORY:\s*([\w_]+)\s*\|\s*SEVERITY:\s*(\w+)/gi;
    let match;

    while ((match = structuredPattern.exec(text)) !== null) {
      const [fullMatch, mistakeType, subcategory, severity] = match;
      
      if (this.isValidMistakeType(mistakeType)) {
        // Find the text block for this specific mistake (from current match to next mistake or end)
        const currentIndex = match.index;
        const nextMistakeMatch = structuredPattern.exec(text);
        const endIndex = nextMistakeMatch ? nextMistakeMatch.index : text.length;
        
        // Reset regex position to continue from where we were
        structuredPattern.lastIndex = currentIndex + fullMatch.length;
        
        const mistakeBlock = text.substring(currentIndex, endIndex);
        
        // Look for all correction details in this specific block
        const userInputMatch = mistakeBlock.match(/USER_INPUT:\s*["""]([^"""]+)["""]/);
        const correctionMatch = mistakeBlock.match(/CORRECTION:\s*["""]([^"""]+)["""]/);
        const explanationMatch = mistakeBlock.match(/EXPLANATION:\s*["""]([^"""]+)["""]/);
        const grammarRuleMatch = mistakeBlock.match(/GRAMMAR_RULE:\s*["""]([^"""]+)["""]/);
        const examplesMatch = mistakeBlock.match(/EXAMPLES:\s*\[([\s\S]*?)\]/);
        
        // Parse examples if present
        let examples: string[] = [];
        if (examplesMatch) {
          examples = examplesMatch[1]
            .split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('[') && !line.startsWith(']'))
            .map(line => line.replace(/^["']|["']$/g, '').trim());
        }

        // Validate severity
        const validSeverity = ['minor', 'moderate', 'major'].includes(severity.toLowerCase())
          ? severity.toLowerCase() as 'minor' | 'moderate' | 'major'
          : 'moderate';
        
        // Create detailed correction
        const detailedCorrection: DetailedCorrection = {
          originalText: userInputMatch?.[1] || '',
          correctedText: correctionMatch?.[1] || '',
          diffSegments: createDiffSegments(
            userInputMatch?.[1] || '',
            correctionMatch?.[1] || ''
          ),
          explanation: explanationMatch?.[1] || 'Correction from AI',
          grammarRule: grammarRuleMatch?.[1],
          examples: examples.length > 0 ? examples : []
        };
        
        mistakes.push({
          sessionId: 'temp',
          timestamp: new Date(),
          category: mistakeType as MistakeType,
          subcategory,
          severity: validSeverity,
          userInput: userInputMatch?.[1] || '',
          correction: correctionMatch?.[1] || '',
          explanation: explanationMatch?.[1] || 'Correction from AI',
          context: mistakeBlock.substring(0, 200),
          isRepeated: false,
          relatedMistakes: [],
          detailedCorrection,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    // Method 2: Look for emoji correction patterns (fallback)
    if (mistakes.length === 0) {
      const correctionPattern = /❌\s*"([^"]+)"\s*→\s*✅\s*"([^"]+)"/g;
      
      while ((match = correctionPattern.exec(text)) !== null) {
        const [, original, corrected] = match;
        
        mistakes.push({
          sessionId: 'temp',
          timestamp: new Date(),
          category: 'grammar', // Default category for legacy
          severity: 'moderate',
          userInput: original,
          correction: corrected,
          explanation: 'Correction détectée dans le format legacy',
          context: text.substring(Math.max(0, match.index - 50), match.index + 100),
          isRepeated: false,
          relatedMistakes: [],
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    // Method 3: Look for common French correction phrases (fallback)
    if (mistakes.length === 0) {
      const correctionPhrases = [
        /(?:On dit plutôt|Il faut dire)\s*[\"«]?([^\"»\n]+)[\"»]?/gi,
        /(?:C'est|Dis)\s*[\"«]?([^\"»\n]+)[\"»]?\s*(?:pas|plutôt que)/gi,
        /(?:Attention|Correction).*?[\"«]([^\"»\n]+)[\"»]/gi
      ];

      correctionPhrases.forEach(pattern => {
        while ((match = pattern.exec(text)) !== null) {
          mistakes.push({
            sessionId: 'temp',
            timestamp: new Date(),
            category: 'grammar', // Default to grammar
            subcategory: 'general',
            severity: 'moderate',
            userInput: '',
            correction: match[1],
            explanation: match[0],
            context: text.substring(Math.max(0, match.index - 50), match.index + 100),
            isRepeated: false,
            relatedMistakes: [],
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      });
    }

    return mistakes;
  }

  static isValidMistakeType(type: string): type is MistakeType {
    const validTypes: MistakeType[] = [
      'grammar', 'vocabulary', 'syntax', 'orthography', 
      'pronunciation', 'pragmatic', 'cultural'
    ];
    return validTypes.includes(type.toLowerCase() as MistakeType);
  }

  static createMistakeRecord(
    sessionId: string, 
    mistake: Mistake
  ): Mistake {
    // Create detailed correction with diff segments
    let detailedCorrection: DetailedCorrection | undefined;
    
    if (mistake.detailedCorrection) {
      // Validate and ensure all fields are present
      const diffSegments = createDiffSegments(
        mistake.detailedCorrection.originalText || mistake.userInput,
        mistake.detailedCorrection.correctedText || mistake.correction
      );
      
      detailedCorrection = {
        originalText: mistake.detailedCorrection.originalText || mistake.userInput,
        correctedText: mistake.detailedCorrection.correctedText || mistake.correction,
        diffSegments,
        explanation: mistake.detailedCorrection.explanation || mistake.explanation,
        grammarRule: mistake.detailedCorrection.grammarRule,
        examples: mistake.detailedCorrection.examples || []
      };
    } else {
      // Create basic diff if detailed correction not provided
      const diffSegments = createDiffSegments(
        mistake.userInput,
        mistake.correction
      );
      
      detailedCorrection = {
        originalText: mistake.userInput,
        correctedText: mistake.correction,
        diffSegments,
        explanation: mistake.explanation,
        examples: [] // Initialize empty examples array
      };
    }

    // Validate severity
    const severity = ['minor', 'moderate', 'major'].includes(mistake.severity) 
      ? mistake.severity 
      : 'moderate';

    // Validate category
    const category = this.isValidMistakeType(mistake.category)
      ? mistake.category
      : 'grammar';

    return {
      ...mistake,
      sessionId,
      timestamp: new Date(),
      severity,
      category,
      detailedCorrection,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  static extractMistakesFromConversation(
    sessionId: string,
    _userMessage: string,
    aiResponse: string
  ): Mistake[] {
    const { mistakes: parsedMistakes } = this.parseAIResponse(aiResponse);
    
    return parsedMistakes.map(parsedMistake => 
      this.createMistakeRecord(sessionId, parsedMistake)
    );
  }

  async startSession(): Promise<number> {
    const sessionId = await dbUtils.startLearningSession('conversation');
    this.currentSessionId = sessionId;
    return sessionId;
  }

  /**
   * Process and store mistakes from a conversation
   */
  async processMistakesFromConversation(
    userMessage: string,
    aiResponse: string
  ): Promise<void> {
    try {
      if (!this.currentSessionId) {
        throw new Error('No active session');
      }

      // Parse the AI response
      const { conversationalResponse, mistakes } = MistakeTracker.parseAIResponse(aiResponse);
      
      // Process each mistake
      for (const mistake of mistakes) {
        // Create a proper mistake record
        const mistakeRecord = MistakeTracker.createMistakeRecord(
          this.currentSessionId.toString(),
          {
            ...mistake,
            context: this.extractContext(userMessage, conversationalResponse)
          }
        );

        // Check if this is a repeated mistake
        const isRepeated = await this.checkForRepeatedMistakes(
          mistakeRecord.category,
          mistakeRecord.subcategory || ''
        );

        // Update the record with repetition status
        mistakeRecord.isRepeated = isRepeated;

        // Save to database (this automatically updates mistake patterns)
        await dbUtils.recordMistake(mistakeRecord);
      }
    } catch (error) {
      console.error('Error processing mistakes:', error);
      throw error;
    }
  }



  async endSession(): Promise<void> {
    if (!this.currentSessionId) return;
    
    try {
      // Get all mistakes from this session
      const mistakes = await db.userMistakes
        .where('sessionId')
        .equals(this.currentSessionId.toString())
        .toArray();
      
      await dbUtils.endLearningSession(this.currentSessionId, mistakes);
      this.currentSessionId = null;
    } catch (error) {
      console.error('Error ending session:', error);
    }
  }

  /**
   * Get mistake analysis for the current user
   */
  async getMistakeAnalysis(timeframe: 'week' | 'month' | 'all' = 'month') {
    return await dbUtils.getMistakeAnalysis(timeframe);
  }

  /**
   * Get the most problematic areas for focused practice
   */
  async getFocusAreas(): Promise<Array<{type: MistakeType, count: number, severity: number}>> {
    const analysis = await this.getMistakeAnalysis('month');
    
    return Object.entries(analysis.mistakesByCategory)
      .map(([type, count]) => ({
        type: type as MistakeType,
        count,
        severity: this.calculateAreaSeverity(type as MistakeType)
      }))
      .sort((a, b) => b.count * b.severity - a.count * a.severity)
      .slice(0, 5);
  }

  async checkForRepeatedMistakes(mistakeType: MistakeType, subcategory: string): Promise<boolean> {
    const pattern = await db.mistakePatterns
      .where({ mistakeType, subcategory })
      .first();
    
    return pattern ? pattern.frequency >= 3 : false;
  }

  private extractContext(userMessage: string, aiResponse: string): string {
    // Extract relevant context around the mistake
    const maxLength = 200;
    const combined = `User: ${userMessage}\nAI: ${aiResponse}`;
    
    if (combined.length <= maxLength) {
      return combined;
    }
    
    return combined.substring(0, maxLength) + '...';
  }

  private calculateAreaSeverity(mistakeType: MistakeType): number {
    // Return a difficulty multiplier based on mistake type
    const difficultyMap: Record<MistakeType, number> = {
      'grammar': 2.0,
      'vocabulary': 1.5,
      'syntax': 2.5,
      'orthography': 1.0,
      'pronunciation': 1.5,
      'pragmatic': 1.0,
      'cultural': 0.5
    };
    
    return difficultyMap[mistakeType] || 1.0;
  }
}

// Create a singleton instance
export const mistakeTracker = new MistakeTracker(); 