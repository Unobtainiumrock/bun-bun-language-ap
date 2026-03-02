import Dexie, { type Table } from 'dexie';
import type { Mistake, MistakeAnalysis, MistakeType } from '@/types/mistakes';

// TypeScript interfaces for our data models - Core mistake tracking system

export interface AICache {
  id?: number;
  requestHash: string;
  response: string;
  timestamp: Date;
  expiresAt: Date;
}

// Feedback interface for user feedback system
export interface UserFeedback {
  id?: number;
  type: 'bug' | 'feature' | 'improvement' | 'general';
  rating: number;
  title: string;
  description: string;
  userContext?: {
    sessionId?: string;
    lastMistakeCount?: number;
    currentScreen?: string;
    timestamp: Date;
  };
  submitted: boolean;
  synced?: boolean; // Whether sent to server
  createdAt: Date;
  updatedAt: Date;
}

// Using unified Mistake interface from types/mistakes.ts

export interface MistakePattern {
  id?: number;
  mistakeType: MistakeType;
  subcategory: string;
  frequency: number;
  firstOccurrence: Date;
  lastOccurrence: Date;
  improvementRate: number; // Mistakes per week trend
  masteryLevel: number; // 0-100 how well this type is mastered
  createdAt: Date;
  updatedAt: Date;
}

export interface LearningSession {
  id?: number;
  startTime: Date;
  endTime?: Date;
  sessionType: 'conversation' | 'vocabulary' | 'grammar' | 'mixed';
  totalMessages: number;
  totalMistakes: number;
  mistakeBreakdown: Record<MistakeType, number>;
  improvementScore: number; // 0-100 based on mistake reduction
  focusAreas: string[]; // Areas that need attention
  createdAt: Date;
  updatedAt: Date;
}

// Dexie database class - Streamlined for mistake tracking
class FrenchAppDB extends Dexie {
  aiCache!: Table<AICache>;
  userMistakes!: Table<Mistake>;
  mistakePatterns!: Table<MistakePattern>;
  learningSessions!: Table<LearningSession>;
  userFeedback!: Table<UserFeedback>;

  constructor() {
    super('FrenchAppDB');
    
    this.version(3).stores({
      userMistakes: '++id, sessionId, category, subcategory, severity, timestamp, isRepeated, createdAt, updatedAt',
      mistakePatterns: '++id, mistakeType, subcategory, frequency, firstOccurrence, lastOccurrence, masteryLevel, createdAt, updatedAt',
      learningSessions: '++id, startTime, endTime, sessionType, totalMistakes, improvementScore, createdAt, updatedAt',
      aiCache: '++id, requestHash, timestamp, expiresAt',
      userFeedback: '++id, type, rating, submitted, synced, createdAt, updatedAt'
    });

    this.version(3).upgrade(_tx => {
      console.log('Upgrading database to version 3: Streamlined mistake tracking...');
      // Migration logic would go here if needed
    });
  }
}

// Create and export database instance
export const db = new FrenchAppDB();

// Database utility functions - Streamlined for mistake tracking
export const dbUtils = {
  // Initialize database 
  async initializeDB() {
    console.log('Database initialized for mistake tracking');
  },

  // Reset database completely including auto-increment counters
  async resetDatabase() {
    try {
      // Delete the entire database
      await db.delete();
      
      // Recreate the database with fresh tables
      await db.open();
      
      console.log('Database completely reset');
    } catch (error) {
      console.error('Error resetting database:', error);
      throw error;
    }
  },

  // Mistake tracking functions
  async recordMistake(mistake: Omit<Mistake, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const mistakeRecord: Mistake = {
      ...mistake,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const mistakeId = await db.userMistakes.add(mistakeRecord);
    
    // Update or create mistake pattern
    await this.updateMistakePattern(mistake.category, mistake.subcategory || '');
    
    return mistakeId;
  },

  async updateMistakePattern(mistakeType: MistakeType, subcategory: string): Promise<void> {
    const existing = await db.mistakePatterns
      .where({ mistakeType, subcategory })
      .first();

    const now = new Date();

    if (existing) {
      // Update existing pattern
      await db.mistakePatterns.update(existing.id!, {
        frequency: existing.frequency + 1,
        lastOccurrence: now,
        updatedAt: now
      });
    } else {
      // Create new pattern
      await db.mistakePatterns.add({
        mistakeType,
        subcategory,
        frequency: 1,
        firstOccurrence: now,
        lastOccurrence: now,
        improvementRate: 0,
        masteryLevel: 0,
        createdAt: now,
        updatedAt: now
      });
    }
  },

  async getMistakeAnalysis(timeframe: 'week' | 'month' | 'all' = 'all'): Promise<MistakeAnalysis> {
    const cutoffDate = timeframe === 'week' 
      ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      : timeframe === 'month'
      ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      : new Date(0);

    const mistakes = await db.userMistakes
      .where('createdAt')
      .above(cutoffDate)
      .toArray();

    const mistakesByCategory = mistakes.reduce((acc, mistake) => {
      acc[mistake.category] = (acc[mistake.category] || 0) + 1;
      return acc;
    }, {} as Record<MistakeType, number>);

    const patterns = await db.mistakePatterns.toArray();
    const mostCommonMistakes = patterns
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10)
      .map(pattern => ({
        category: pattern.mistakeType,
        subcategory: pattern.subcategory,
        count: pattern.frequency,
        improvement: pattern.improvementRate
      }));

    // Calculate mastery levels
    const mastery = patterns.reduce((acc, pattern) => {
      if (!acc[pattern.mistakeType]) {
        acc[pattern.mistakeType] = 0;
      }
      acc[pattern.mistakeType] = Math.max(acc[pattern.mistakeType], pattern.masteryLevel);
      return acc;
    }, {} as Record<MistakeType, number>);

    return {
      totalMistakes: mistakes.length,
      mistakesByCategory,
      mostCommonMistakes,
      improvementTrends: [], // Would calculate from historical data
      mastery
    };
  },

  async startLearningSession(sessionType: 'conversation' | 'vocabulary' | 'grammar' | 'mixed'): Promise<number> {
    return await db.learningSessions.add({
      startTime: new Date(),
      sessionType,
      totalMessages: 0,
      totalMistakes: 0,
      mistakeBreakdown: {} as Record<MistakeType, number>,
      improvementScore: 0,
      focusAreas: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });
  },

  async endLearningSession(sessionId: number, mistakes: Mistake[]): Promise<void> {
    const mistakeBreakdown = mistakes.reduce((acc, mistake) => {
      acc[mistake.category] = (acc[mistake.category] || 0) + 1;
      return acc;
    }, {} as Record<MistakeType, number>);

    const improvementScore = this.calculateImprovementScore(mistakes);
    const focusAreas = this.identifyFocusAreas(mistakeBreakdown);

    await db.learningSessions.update(sessionId, {
      endTime: new Date(),
      totalMistakes: mistakes.length,
      mistakeBreakdown,
      improvementScore,
      focusAreas,
      updatedAt: new Date()
    });
  },

  calculateImprovementScore(mistakes: Mistake[]): number {
    // Simple implementation - fewer mistakes = higher score
    const severityWeights = { minor: 1, moderate: 3, major: 5 };
    const totalWeight = mistakes.reduce((sum, mistake) => sum + severityWeights[mistake.severity], 0);
    return Math.max(0, 100 - totalWeight);
  },

  identifyFocusAreas(mistakeBreakdown: Record<MistakeType, number>): string[] {
    return Object.entries(mistakeBreakdown)
      .filter(([_, count]) => count >= 2) // Focus on areas with 2+ mistakes
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([type]) => type);
  },

  // Database is now streamlined for mistake tracking only

  // Feedback system functions
  async storeFeedback(feedback: Omit<UserFeedback, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const feedbackRecord: UserFeedback = {
      ...feedback,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const feedbackId = await db.userFeedback.add(feedbackRecord);
    console.log('📝 Feedback stored locally:', feedbackId);
    
    return feedbackId;
  },

  async getUnsyncedFeedback(): Promise<UserFeedback[]> {
    return await db.userFeedback
      .where('synced')
      .anyOf([false, undefined] as any)
      .toArray();
  },

  async markFeedbackSynced(feedbackId: number): Promise<void> {
    await db.userFeedback.update(feedbackId, {
      synced: true,
      updatedAt: new Date()
    });
  },

  async getFeedbackSummary(): Promise<{
    total: number;
    unsynced: number;
    byType: Record<string, number>;
    averageRating: number;
    recentCount: number;
  }> {
    const allFeedback = await db.userFeedback.toArray();
    const unsynced = await this.getUnsyncedFeedback();
    
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recent = allFeedback.filter(f => f.createdAt > weekAgo);
    
    const byType = allFeedback.reduce((acc, feedback) => {
      acc[feedback.type] = (acc[feedback.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const averageRating = allFeedback.length > 0
      ? allFeedback.reduce((sum, f) => sum + f.rating, 0) / allFeedback.length
      : 0;

    return {
      total: allFeedback.length,
      unsynced: unsynced.length,
      byType,
      averageRating: Math.round(averageRating * 10) / 10,
      recentCount: recent.length
    };
  },

  // Sync unsynced feedback to server
  async syncFeedbackToServer(): Promise<{ success: number; failed: number }> {
    const unsyncedFeedback = await this.getUnsyncedFeedback();
    let success = 0;
    let failed = 0;

    // Get Google Apps Script URL from environment
    const googleScriptUrl = process.env.REACT_APP_GOOGLE_SCRIPT_URL;
    
    if (!googleScriptUrl) {
      console.log('📊 Google Apps Script URL not configured, skipping sync');
      return { success: 0, failed: unsyncedFeedback.length };
    }

    for (const feedback of unsyncedFeedback) {
      try {
        const response = await fetch(googleScriptUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            timestamp: feedback.createdAt.toISOString(),
            type: feedback.type,
            rating: feedback.rating,
            title: feedback.title || '',
            description: feedback.description,
            sessionId: feedback.userContext?.sessionId || '',
            mistakeCount: feedback.userContext?.lastMistakeCount || 0,
            currentScreen: feedback.userContext?.currentScreen || '',
            userAgent: navigator.userAgent,
            url: window.location.href
          })
        });

        if (response.ok) {
          await this.markFeedbackSynced(feedback.id!);
          success++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error('Failed to sync feedback to Google Sheets:', error);
        failed++;
      }
    }

    return { success, failed };
  }
}; 