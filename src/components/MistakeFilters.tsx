import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, Tag, AlertTriangle, X, RotateCcw } from 'lucide-react';
import type { MistakeType } from '@/types/mistakes';
import { MISTAKE_CATEGORIES } from '@/types/mistakes';

export interface FilterState {
  searchQuery: string;
  categories: MistakeType[];
  severities: ('minor' | 'moderate' | 'major')[];
  timeframe: 'today' | 'week' | 'month' | 'all';
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  searchFields: ('userInput' | 'correction' | 'explanation' | 'grammarRule')[];
}

interface MistakeFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
  totalCount: number;
  filteredCount: number;
}

const DEFAULT_FILTERS: FilterState = {
  searchQuery: '',
  categories: [],
  severities: [],
  timeframe: 'all',
  dateRange: { start: null, end: null },
  searchFields: ['userInput', 'correction', 'explanation']
};

export const MistakeFilters: React.FC<MistakeFiltersProps> = ({
  onFiltersChange,
  totalCount,
  filteredCount
}) => {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  // Notify parent when filters change
  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const updateFilters = (updates: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const hasActiveFilters = () => {
    return (
      filters.searchQuery.length > 0 ||
      filters.categories.length > 0 ||
      filters.severities.length > 0 ||
      filters.timeframe !== 'all' ||
      filters.dateRange.start !== null ||
      filters.dateRange.end !== null
    );
  };

  const toggleCategory = (category: MistakeType) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    updateFilters({ categories: newCategories });
  };

  const toggleSeverity = (severity: 'minor' | 'moderate' | 'major') => {
    const newSeverities = filters.severities.includes(severity)
      ? filters.severities.filter(s => s !== severity)
      : [...filters.severities, severity];
    updateFilters({ severities: newSeverities });
  };

  const toggleSearchField = (field: 'userInput' | 'correction' | 'explanation' | 'grammarRule') => {
    const newFields = filters.searchFields.includes(field)
      ? filters.searchFields.filter(f => f !== field)
      : [...filters.searchFields, field];
    updateFilters({ searchFields: newFields });
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const parseDate = (dateString: string) => {
    return dateString ? new Date(dateString) : null;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Filter className="w-5 h-5 text-gray-500" />
            <h3 className="font-medium text-gray-900">Advanced Filters</h3>
            {hasActiveFilters() && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {filteredCount} of {totalCount} mistakes
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {hasActiveFilters() && (
              <button
                onClick={resetFilters}
                className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar - Always Visible */}
      <div className="p-4">
        <div className={`relative transition-all duration-200 ${searchFocused ? 'ring-2 ring-blue-500' : ''}`}>
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search mistakes, corrections, explanations..."
            value={filters.searchQuery}
            onChange={(e) => updateFilters({ searchQuery: e.target.value })}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          {filters.searchQuery && (
            <button
              onClick={() => updateFilters({ searchQuery: '' })}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Field Options */}
        {filters.searchQuery && (
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="text-xs text-gray-500">Search in:</span>
            {[
              { key: 'userInput', label: 'Original Text' },
              { key: 'correction', label: 'Corrections' },
              { key: 'explanation', label: 'Explanations' },
              { key: 'grammarRule', label: 'Grammar Rules' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => toggleSearchField(key as any)}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  filters.searchFields.includes(key as any)
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-100">
          {/* Time Filters */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Time Period
            </h4>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'today', label: 'Today' },
                { key: 'week', label: 'This Week' },
                { key: 'month', label: 'This Month' },
                { key: 'all', label: 'All Time' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => updateFilters({ timeframe: key as any })}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    filters.timeframe === key
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Custom Date Range */}
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">From</label>
                <input
                  type="date"
                  value={filters.dateRange.start ? formatDate(filters.dateRange.start) : ''}
                  onChange={(e) => updateFilters({
                    dateRange: { ...filters.dateRange, start: parseDate(e.target.value) }
                  })}
                  className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">To</label>
                <input
                  type="date"
                  value={filters.dateRange.end ? formatDate(filters.dateRange.end) : ''}
                  onChange={(e) => updateFilters({
                    dateRange: { ...filters.dateRange, end: parseDate(e.target.value) }
                  })}
                  className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Category Filters */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Tag className="w-4 h-4 mr-2" />
              Mistake Categories
            </h4>
            <div className="flex flex-wrap gap-2">
              {Object.keys(MISTAKE_CATEGORIES).map((category) => (
                <button
                  key={category}
                  onClick={() => toggleCategory(category as MistakeType)}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    filters.categories.includes(category as MistakeType)
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                  {filters.categories.includes(category as MistakeType) && (
                    <X className="w-3 h-3 ml-1 inline" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Severity Filters */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Severity Levels
            </h4>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'minor', label: 'Minor', color: 'green' },
                { key: 'moderate', label: 'Moderate', color: 'yellow' },
                { key: 'major', label: 'Major', color: 'red' }
              ].map(({ key, label, color }) => (
                <button
                  key={key}
                  onClick={() => toggleSeverity(key as any)}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    filters.severities.includes(key as any)
                      ? `bg-${color}-500 text-white`
                      : `bg-${color}-100 text-${color}-700 hover:bg-${color}-200`
                  }`}
                >
                  {label}
                  {filters.severities.includes(key as any) && (
                    <X className="w-3 h-3 ml-1 inline" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters() && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
          <div className="flex items-center justify-between">
            <span>
              Showing {filteredCount} of {totalCount} mistakes
              {filters.searchQuery && ` matching "${filters.searchQuery}"`}
            </span>
            <button
              onClick={resetFilters}
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              Clear all filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MistakeFilters; 