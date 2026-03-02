// Comprehensive mistake tracking system for French language learning

export interface MistakeCategory {
  id: string;
  name: string;
  description: string;
  severity: 'minor' | 'moderate' | 'major';
  examples: string[];
}

// Enhanced diff information for detailed mistake analysis
export interface DiffSegment {
  text: string;
  type: 'correct' | 'incorrect' | 'added' | 'removed';
  startIndex: number;
  endIndex: number;
}

export interface DetailedCorrection {
  originalText: string;
  correctedText: string;
  diffSegments: DiffSegment[];
  explanation: string;
  grammarRule?: string;
  examples?: string[];
}

export interface Mistake {
  id?: number;                    // Optional for new records, number for database
  sessionId: string;
  timestamp: Date;
  category: MistakeType;
  subcategory?: string;
  severity: 'minor' | 'moderate' | 'major';
  userInput: string;
  correction: string;
  explanation: string;
  context: string;
  isRepeated: boolean;
  relatedMistakes: string[];     // IDs of similar mistakes
  // Enhanced fields for diff view
  detailedCorrection?: DetailedCorrection;  // Contains grammarRule and examples
  mistakeSpans?: Array<{
    start: number;
    end: number;
    type: 'word' | 'phrase' | 'punctuation';
  }>;
  // Database fields
  userId?: string;               // For future multi-user support
  createdAt: Date;
  updatedAt: Date;
}

export type MistakeType = 'grammar' | 'vocabulary' | 'pragmatic' | 'pronunciation' | 'syntax' | 'orthography' | 'cultural';
export type MistakeSeverity = 'minor' | 'moderate' | 'major';

export interface MistakeAnalysis {
  totalMistakes: number;
  mistakesByCategory: Record<MistakeType, number>;
  mostCommonMistakes: Array<{
    category: MistakeType;
    subcategory: string;
    count: number;
    improvement: number; // percentage improvement over time
  }>;
  improvementTrends: Array<{
    date: Date;
    category: MistakeType;
    mistakeCount: number;
  }>;
  mastery: Record<MistakeType, number>; // 0-100 mastery level per category
}

// Comprehensive mistake taxonomy for French
export const MISTAKE_CATEGORIES: Record<MistakeType, MistakeCategory[]> = {
  grammar: [
    {
      id: 'verb_conjugation',
      name: 'Conjugaison des verbes',
      description: 'Incorrect verb conjugation',
      severity: 'major',
      examples: ['je mange → je mangé', 'nous avons → nous ont']
    },
    {
      id: 'gender_agreement',
      name: 'Accord de genre',
      description: 'Incorrect gender agreement (masculine/feminine)',
      severity: 'moderate',
      examples: ['une chat → un chat', 'le table → la table']
    },
    {
      id: 'number_agreement',
      name: 'Accord de nombre',
      description: 'Incorrect plural agreement',
      severity: 'moderate',
      examples: ['les chat → les chats', 'des pomme → des pommes']
    },
    {
      id: 'article_usage',
      name: 'Usage des articles',
      description: 'Incorrect definite/indefinite article usage',
      severity: 'moderate',
      examples: ['le eau → l\'eau', 'un France → la France']
    },
    {
      id: 'tense_usage',
      name: 'Usage des temps',
      description: 'Incorrect tense selection',
      severity: 'major',
      examples: ['hier je mange → hier j\'ai mangé']
    },
    {
      id: 'subjunctive',
      name: 'Subjonctif',
      description: 'Incorrect subjunctive usage',
      severity: 'major',
      examples: ['il faut que je vais → il faut que j\'aille']
    },
    {
      id: 'prepositions',
      name: 'Prépositions',
      description: 'Incorrect preposition usage',
      severity: 'moderate',
      examples: ['penser sur → penser à', 'différent de → différent de']
    }
  ],
  
  vocabulary: [
    {
      id: 'word_choice',
      name: 'Choix de mots',
      description: 'Incorrect word selection',
      severity: 'moderate',
      examples: ['Je suis excité → Je suis enthousiaste']
    },
    {
      id: 'false_friends',
      name: 'Faux amis',
      description: 'False cognates (English-French false friends)',
      severity: 'moderate',
      examples: ['actuellement → currently (not actually)', 'library → bibliothèque (not librairie)']
    },
    {
      id: 'anglicisms',
      name: 'Anglicismes',
      description: 'Using English words/structures in French',
      severity: 'minor',
      examples: ['parking → stationnement', 'shopping → magasinage']
    },
    {
      id: 'register',
      name: 'Registre de langue',
      description: 'Inappropriate language register (formal/informal)',
      severity: 'minor',
      examples: ['Using "tu" in formal context', 'Using slang in formal speech']
    }
  ],

  syntax: [
    {
      id: 'word_order',
      name: 'Ordre des mots',
      description: 'Incorrect word order',
      severity: 'moderate',
      examples: ['Rouge voiture → Voiture rouge', 'Je ne pas mange → Je ne mange pas']
    },
    {
      id: 'question_formation',
      name: 'Formation des questions',
      description: 'Incorrect question structure',
      severity: 'moderate',
      examples: ['Comment tu appelles? → Comment tu t\'appelles?']
    },
    {
      id: 'negation',
      name: 'Négation',
      description: 'Incorrect negation structure',
      severity: 'moderate',
      examples: ['Je pas mange → Je ne mange pas']
    },
    {
      id: 'relative_pronouns',
      name: 'Pronoms relatifs',
      description: 'Incorrect relative pronoun usage',
      severity: 'major',
      examples: ['La personne que je parle → La personne à qui je parle']
    }
  ],

  orthography: [
    {
      id: 'accents',
      name: 'Accents',
      description: 'Missing or incorrect accents',
      severity: 'minor',
      examples: ['cafe → café', 'élève → élève']
    },
    {
      id: 'homophones',
      name: 'Homophones',
      description: 'Confusion between words that sound the same',
      severity: 'moderate',
      examples: ['a/à', 'et/est', 'son/sont']
    },
    {
      id: 'capitalization',
      name: 'Majuscules',
      description: 'Incorrect capitalization',
      severity: 'minor',
      examples: ['Français → français (nationality)', 'Lundi → lundi (days of week)']
    }
  ],

  pronunciation: [
    {
      id: 'liaison',
      name: 'Liaisons',
      description: 'Incorrect liaison usage',
      severity: 'moderate',
      examples: ['les_amis', 'nous_avons']
    },
    {
      id: 'silent_letters',
      name: 'Lettres muettes',
      description: 'Pronouncing silent letters',
      severity: 'minor',
      examples: ['Silent "h" in "heure"', 'Silent "s" in "français"']
    },
    {
      id: 'nasal_sounds',
      name: 'Sons nasaux',
      description: 'Incorrect nasal sound production',
      severity: 'moderate',
      examples: ['bon, blanc, brun', 'pain, pein, poin']
    }
  ],

  pragmatic: [
    {
      id: 'politeness',
      name: 'Politesse',
      description: 'Inappropriate politeness level',
      severity: 'moderate',
      examples: ['Not using "s\'il vous plaît"', 'Too direct requests']
    },
    {
      id: 'discourse_markers',
      name: 'Marqueurs de discours',
      description: 'Missing or incorrect discourse markers',
      severity: 'minor',
      examples: ['Missing "alors", "donc", "en fait"']
    }
  ],

  cultural: [
    {
      id: 'cultural_context',
      name: 'Contexte culturel',
      description: 'Culturally inappropriate expressions or references',
      severity: 'minor',
      examples: ['Using American cultural references', 'Inappropriate greeting customs']
    },
    {
      id: 'regional_variations',
      name: 'Variations régionales',
      description: 'Mixing different regional French varieties',
      severity: 'minor',
      examples: ['Mixing Quebec French with Metropolitan French']
    }
  ]
};

// Helper functions for mistake analysis
export function getMistakeCategory(mistakeType: MistakeType, subcategoryId: string): MistakeCategory | undefined {
  return MISTAKE_CATEGORIES[mistakeType]?.find(cat => cat.id === subcategoryId);
}

export function calculateMistakeSeverityScore(mistakes: Mistake[]): number {
  const severityWeights = { minor: 1, moderate: 3, major: 5 };
  const totalWeight = mistakes.reduce((sum, mistake) => sum + severityWeights[mistake.severity], 0);
  return Math.max(0, 100 - (totalWeight / mistakes.length) * 10); // Convert to 0-100 scale
}

export function identifyRepeatedMistakes(mistakes: Mistake[]): Mistake[] {
  const mistakeGroups = new Map<string, Mistake[]>();
  
  mistakes.forEach(mistake => {
    const key = `${mistake.category}-${mistake.subcategory}`;
    if (!mistakeGroups.has(key)) {
      mistakeGroups.set(key, []);
    }
    mistakeGroups.get(key)!.push(mistake);
  });

  return Array.from(mistakeGroups.values())
    .filter(group => group.length > 1)
    .flat()
    .map(mistake => ({ ...mistake, isRepeated: true }));
}

// Utility function to create diff segments for highlighting
export function createDiffSegments(original: string, corrected: string): DiffSegment[] {
  const segments: DiffSegment[] = [];
  const words1 = original.split(/(\s+)/);
  const words2 = corrected.split(/(\s+)/);
  
  let i1 = 0, i2 = 0;
  let charIndex = 0;
  
  while (i1 < words1.length || i2 < words2.length) {
    if (i1 < words1.length && i2 < words2.length && words1[i1] === words2[i2]) {
      // Words match
      segments.push({
        text: words1[i1],
        type: 'correct',
        startIndex: charIndex,
        endIndex: charIndex + words1[i1].length
      });
      charIndex += words1[i1].length;
      i1++;
      i2++;
    } else if (i1 < words1.length && (i2 >= words2.length || words1[i1] !== words2[i2])) {
      // Word in original but not in corrected (or different)
      segments.push({
        text: words1[i1],
        type: 'incorrect',
        startIndex: charIndex,
        endIndex: charIndex + words1[i1].length
      });
      charIndex += words1[i1].length;
      i1++;
    } else if (i2 < words2.length) {
      // Word in corrected but not in original
      segments.push({
        text: words2[i2],
        type: 'added',
        startIndex: charIndex,
        endIndex: charIndex + words2[i2].length
      });
      i2++;
    }
  }
  
  return segments;
}

// Chat-related types
export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  corrections: Correction[];
}

export interface ChatResponse {
  conversation: string;  // Natural conversation flow
  corrections: Array<{
    mistakeType: string;
    subcategory: string;
    severity: 'minor' | 'moderate' | 'major';
    userInput: string;
    correction: string;
    explanation: string;
    grammarRule?: string;
    examples?: string[];
  }>;
  mode: string;
  persona?: {
    name: string;
    age: number;
    location: string;
  };
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Correction type (simplified from DetailedCorrection)
export interface Correction {
  id: string;
  type: MistakeType;
  subcategory: string;
  severity: MistakeSeverity;
  userInput: string;
  correction: string;
  explanation: string;
  grammarRule: string;
  examples: string[];
} 