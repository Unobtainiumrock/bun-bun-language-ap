import type { Mistake } from '@/types/mistakes';
import type { FilterState } from '@/components/MistakeFilters';

/**
 * Advanced filtering utility for mistake analytics
 */
export class MistakeFilterEngine {
  
  /**
   * Apply all filters to a list of mistakes
   */
  static filterMistakes(mistakes: Mistake[], filters: FilterState): Mistake[] {
    let filtered = [...mistakes];

    // Apply search query filter
    if (filters.searchQuery.trim()) {
      filtered = this.applySearchFilter(filtered, filters.searchQuery, filters.searchFields);
    }

    // Apply category filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter(mistake => 
        filters.categories.includes(mistake.category)
      );
    }

    // Apply severity filter
    if (filters.severities.length > 0) {
      filtered = filtered.filter(mistake => 
        filters.severities.includes(mistake.severity)
      );
    }

    // Apply time filter
    filtered = this.applyTimeFilter(filtered, filters.timeframe, filters.dateRange);

    return filtered;
  }

  /**
   * Apply search query across specified fields
   */
  private static applySearchFilter(
    mistakes: Mistake[], 
    query: string, 
    searchFields: FilterState['searchFields']
  ): Mistake[] {
    const searchTerm = query.toLowerCase().trim();
    if (!searchTerm) return mistakes;

    return mistakes.filter(mistake => {
      const searchableContent = this.getSearchableContent(mistake, searchFields);
      return searchableContent.some(content => 
        content.toLowerCase().includes(searchTerm)
      );
    });
  }

  /**
   * Extract searchable content from a mistake based on selected fields
   */
  private static getSearchableContent(
    mistake: Mistake, 
    searchFields: FilterState['searchFields']
  ): string[] {
    const content: string[] = [];

    if (searchFields.includes('userInput')) {
      content.push(mistake.userInput);
    }

    if (searchFields.includes('correction')) {
      content.push(mistake.correction);
    }

    if (searchFields.includes('explanation')) {
      content.push(mistake.explanation);
    }

    if (searchFields.includes('grammarRule') && mistake.detailedCorrection?.grammarRule) {
      content.push(mistake.detailedCorrection.grammarRule);
    }

    // Also search in examples if available
    if (mistake.detailedCorrection?.examples) {
      content.push(...mistake.detailedCorrection.examples);
    }

    // Search in context
    if (mistake.context) {
      content.push(mistake.context);
    }

    // Search in subcategory
    if (mistake.subcategory) {
      content.push(mistake.subcategory.replace('_', ' '));
    }

    return content.filter(Boolean);
  }

  /**
   * Apply time-based filtering
   */
  private static applyTimeFilter(
    mistakes: Mistake[], 
    timeframe: FilterState['timeframe'],
    dateRange: FilterState['dateRange']
  ): Mistake[] {
    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    // Handle predefined timeframes
    switch (timeframe) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
        weekStart.setHours(0, 0, 0, 0);
        startDate = weekStart;
        endDate = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      case 'all':
        // No filtering for 'all'
        break;
    }

    // Override with custom date range if provided
    if (dateRange.start) {
      startDate = new Date(dateRange.start);
      startDate.setHours(0, 0, 0, 0);
    }
    if (dateRange.end) {
      endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);
    }

    // Apply date filtering
    if (startDate || endDate) {
      return mistakes.filter(mistake => {
        const mistakeDate = new Date(mistake.createdAt);
        
        if (startDate && mistakeDate < startDate) return false;
        if (endDate && mistakeDate > endDate) return false;
        
        return true;
      });
    }

    return mistakes;
  }

  /**
   * Get filter statistics for UI display
   */
  static getFilterStats(mistakes: Mistake[], filteredMistakes: Mistake[]): {
    total: number;
    filtered: number;
    categoryBreakdown: Record<string, number>;
    severityBreakdown: Record<string, number>;
    timeBreakdown: Record<string, number>;
  } {
    const categoryBreakdown: Record<string, number> = {};
    const severityBreakdown: Record<string, number> = {};
    const timeBreakdown: Record<string, number> = {};

    // Count categories in filtered results
    filteredMistakes.forEach(mistake => {
      categoryBreakdown[mistake.category] = (categoryBreakdown[mistake.category] || 0) + 1;
      severityBreakdown[mistake.severity] = (severityBreakdown[mistake.severity] || 0) + 1;
    });

    // Time breakdown for filtered results
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    filteredMistakes.forEach(mistake => {
      const mistakeDate = new Date(mistake.createdAt);
      
      if (mistakeDate >= today) {
        timeBreakdown['today'] = (timeBreakdown['today'] || 0) + 1;
      }
      if (mistakeDate >= weekAgo) {
        timeBreakdown['week'] = (timeBreakdown['week'] || 0) + 1;
      }
      if (mistakeDate >= monthAgo) {
        timeBreakdown['month'] = (timeBreakdown['month'] || 0) + 1;
      }
      timeBreakdown['all'] = (timeBreakdown['all'] || 0) + 1;
    });

    return {
      total: mistakes.length,
      filtered: filteredMistakes.length,
      categoryBreakdown,
      severityBreakdown,
      timeBreakdown
    };
  }

  /**
   * Advanced search with highlighting
   */
  static highlightSearchTerms(text: string, searchQuery: string): string {
    if (!searchQuery.trim()) return text;
    
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
  }

  /**
   * Get suggested filters based on current data
   */
  static getSuggestedFilters(mistakes: Mistake[]): {
    mostCommonCategories: Array<{ category: string; count: number }>;
    recentTimeframes: Array<{ timeframe: string; count: number }>;
    severityDistribution: Array<{ severity: string; count: number }>;
  } {
    const categoryCount: Record<string, number> = {};
    const severityCount: Record<string, number> = {};
    
    mistakes.forEach(mistake => {
      categoryCount[mistake.category] = (categoryCount[mistake.category] || 0) + 1;
      severityCount[mistake.severity] = (severityCount[mistake.severity] || 0) + 1;
    });

    const mostCommonCategories = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }));

    const severityDistribution = Object.entries(severityCount)
      .map(([severity, count]) => ({ severity, count }));

    // Calculate recent activity
    const now = new Date();
    const timeframes = [
      { name: 'today', cutoff: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
      { name: 'week', cutoff: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
      { name: 'month', cutoff: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
    ];

    const recentTimeframes = timeframes.map(({ name, cutoff }) => ({
      timeframe: name,
      count: mistakes.filter(mistake => new Date(mistake.createdAt) >= cutoff).length
    }));

    return {
      mostCommonCategories,
      recentTimeframes,
      severityDistribution
    };
  }
}

/**
 * Hook for managing filter state and applying filters
 */
export const useAdvancedFiltering = (mistakes: Mistake[]) => {
  const [filters, setFilters] = React.useState<FilterState>({
    searchQuery: '',
    categories: [],
    severities: [],
    timeframe: 'all',
    dateRange: { start: null, end: null },
    searchFields: ['userInput', 'correction', 'explanation']
  });

  const filteredMistakes = React.useMemo(() => {
    return MistakeFilterEngine.filterMistakes(mistakes, filters);
  }, [mistakes, filters]);

  const filterStats = React.useMemo(() => {
    return MistakeFilterEngine.getFilterStats(mistakes, filteredMistakes);
  }, [mistakes, filteredMistakes]);

  const suggestedFilters = React.useMemo(() => {
    return MistakeFilterEngine.getSuggestedFilters(mistakes);
  }, [mistakes]);

  return {
    filters,
    setFilters,
    filteredMistakes,
    filterStats,
    suggestedFilters,
    highlightText: (text: string) => 
      MistakeFilterEngine.highlightSearchTerms(text, filters.searchQuery)
  };
};

// Import React for the hook
import React from 'react'; 