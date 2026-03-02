import React, { useState, useEffect } from 'react';
import { TrendingUp, BarChart3, PieChart, Target, AlertTriangle, CheckCircle, Clock, Zap } from 'lucide-react';
import type { Mistake, MistakeType } from '@/types/mistakes';
import { MISTAKE_CATEGORIES } from '@/types/mistakes';

interface PatternGroup {
  id: string;
  category: MistakeType;
  subcategory: string;
  mistakes: Mistake[];
  frequency: number;
  severity: 'minor' | 'moderate' | 'major';
  trend: 'improving' | 'stable' | 'worsening';
  firstSeen: Date;
  lastSeen: Date;
  improvementRate: number; // percentage improvement over time
}

interface PatternAnalysisProps {
  mistakes: Mistake[];
}

export const PatternAnalysis: React.FC<PatternAnalysisProps> = ({ mistakes }) => {
  const [patterns, setPatterns] = useState<PatternGroup[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'all'>('month');
  const [sortBy, setSortBy] = useState<'frequency' | 'recent' | 'severity'>('frequency');

  useEffect(() => {
    analyzePatterns();
  }, [mistakes, selectedTimeframe]);

  const analyzePatterns = () => {
    // Filter mistakes by timeframe
    const cutoffDate = getCutoffDate(selectedTimeframe);
    const filteredMistakes = mistakes.filter(mistake => 
      new Date(mistake.createdAt) >= cutoffDate
    );

    // Group mistakes by category + subcategory
    const groups = new Map<string, Mistake[]>();
    
    filteredMistakes.forEach(mistake => {
      const key = `${mistake.category}-${mistake.subcategory || 'general'}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(mistake);
    });

    // Convert to pattern groups with analysis
    const patternGroups: PatternGroup[] = Array.from(groups.entries()).map(([key, mistakeGroup]) => {
      const [category, subcategory] = key.split('-');
      const sortedMistakes = mistakeGroup.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      return {
        id: key,
        category: category as MistakeType,
        subcategory,
        mistakes: sortedMistakes,
        frequency: mistakeGroup.length,
        severity: calculateGroupSeverity(mistakeGroup),
        trend: calculateTrend(sortedMistakes),
        firstSeen: new Date(sortedMistakes[0].createdAt),
        lastSeen: new Date(sortedMistakes[sortedMistakes.length - 1].createdAt),
        improvementRate: calculateImprovementRate(sortedMistakes)
      };
    });

    // Sort patterns
    const sortedPatterns = sortPatterns(patternGroups, sortBy);
    setPatterns(sortedPatterns);
  };

  const getCutoffDate = (timeframe: 'week' | 'month' | 'all'): Date => {
    const now = new Date();
    switch (timeframe) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case 'all':
        return new Date(0);
    }
  };

  const calculateGroupSeverity = (mistakes: Mistake[]): 'minor' | 'moderate' | 'major' => {
    const severityCounts = mistakes.reduce((acc, mistake) => {
      acc[mistake.severity] = (acc[mistake.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Determine overall severity based on most common or highest severity
    if (severityCounts.major > 0) return 'major';
    if (severityCounts.moderate > mistakes.length / 2) return 'moderate';
    return 'minor';
  };

  const calculateTrend = (mistakes: Mistake[]): 'improving' | 'stable' | 'worsening' => {
    if (mistakes.length < 3) return 'stable';

    const recentMistakes = mistakes.slice(-3);
    const olderMistakes = mistakes.slice(0, -3);

    if (olderMistakes.length === 0) return 'stable';

    const recentRate = recentMistakes.length / 3;
    const olderRate = olderMistakes.length / Math.max(olderMistakes.length, 3);

    if (recentRate < olderRate * 0.7) return 'improving';
    if (recentRate > olderRate * 1.3) return 'worsening';
    return 'stable';
  };

  const calculateImprovementRate = (mistakes: Mistake[]): number => {
    if (mistakes.length < 2) return 0;

    const timeSpan = new Date(mistakes[mistakes.length - 1].createdAt).getTime() - 
                    new Date(mistakes[0].createdAt).getTime();
    const days = timeSpan / (1000 * 60 * 60 * 24);
    
    if (days < 1) return 0;

    // Calculate mistakes per day trend
    const firstHalf = mistakes.slice(0, Math.floor(mistakes.length / 2));
    const secondHalf = mistakes.slice(Math.floor(mistakes.length / 2));

    const firstHalfRate = firstHalf.length / (days / 2);
    const secondHalfRate = secondHalf.length / (days / 2);

    return Math.round(((firstHalfRate - secondHalfRate) / firstHalfRate) * 100);
  };

  const sortPatterns = (patterns: PatternGroup[], sortBy: string): PatternGroup[] => {
    return [...patterns].sort((a, b) => {
      switch (sortBy) {
        case 'frequency':
          return b.frequency - a.frequency;
        case 'recent':
          return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
        case 'severity':
          const severityOrder = { major: 3, moderate: 2, minor: 1 };
          return severityOrder[b.severity] - severityOrder[a.severity];
        default:
          return 0;
      }
    });
  };

  const getCategoryInfo = (category: MistakeType, subcategory: string) => {
    const categoryData = MISTAKE_CATEGORIES[category];
    if (!categoryData) return { name: category, description: 'Unknown category' };
    
    const subcategoryData = categoryData.find(cat => cat.id === subcategory);
    return {
      name: subcategoryData?.name || subcategory.replace('_', ' '),
      description: subcategoryData?.description || 'Pattern analysis'
    };
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'worsening':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Target className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'text-green-600 bg-green-50';
      case 'worsening':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'major':
        return 'bg-red-100 text-red-800';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const totalMistakes = patterns.reduce((sum, pattern) => sum + pattern.frequency, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-lg">
        <div className="flex items-center mb-2">
          <BarChart3 className="w-6 h-6 mr-3" />
          <h2 className="text-2xl font-bold">Pattern Analysis</h2>
        </div>
        <p className="text-indigo-100">Advanced mistake pattern recognition and trend analysis</p>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time Period</label>
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value as any)}
                className="border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="all">All Time</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="frequency">Frequency</option>
                <option value="recent">Most Recent</option>
                <option value="severity">Severity</option>
              </select>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-medium">{patterns.length}</span> patterns found • 
            <span className="font-medium ml-1">{totalMistakes}</span> total mistakes
          </div>
        </div>
      </div>

      {/* Pattern Cards */}
      {patterns.length === 0 ? (
        <div className="bg-white p-8 rounded-lg border border-gray-200 text-center">
          <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Patterns Found</h3>
          <p className="text-gray-600">
            No mistake patterns detected for the selected time period. 
            Try expanding your timeframe or practice more conversations.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {patterns.map((pattern) => {
            const categoryInfo = getCategoryInfo(pattern.category, pattern.subcategory);
            const progressWidth = Math.min((pattern.frequency / Math.max(...patterns.map(p => p.frequency))) * 100, 100);

            return (
              <div key={pattern.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {categoryInfo.name}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(pattern.severity)}`}>
                        {pattern.severity}
                      </span>
                      <div className={`flex items-center px-2 py-1 text-xs rounded-full ${getTrendColor(pattern.trend)}`}>
                        {getTrendIcon(pattern.trend)}
                        <span className="ml-1 capitalize">{pattern.trend}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{categoryInfo.description}</p>
                    
                    {/* Frequency Bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">Frequency</span>
                        <span className="font-medium">{pattern.frequency} occurrences</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${progressWidth}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pattern Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-gray-600">First Seen</p>
                      <p className="font-medium">{formatDate(pattern.firstSeen)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-gray-600">Last Seen</p>
                      <p className="font-medium">{formatDate(pattern.lastSeen)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-gray-600">Improvement</p>
                      <p className={`font-medium ${pattern.improvementRate > 0 ? 'text-green-600' : pattern.improvementRate < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                        {pattern.improvementRate > 0 ? '+' : ''}{pattern.improvementRate}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-gray-600">Category</p>
                      <p className="font-medium capitalize">{pattern.category}</p>
                    </div>
                  </div>
                </div>

                {/* Recent Examples */}
                {pattern.mistakes.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-700 mb-2">Recent Examples:</p>
                    <div className="space-y-2">
                      {pattern.mistakes.slice(-2).map((mistake, index) => (
                        <div key={mistake.id || index} className="bg-gray-50 rounded p-3 text-sm">
                          <div className="flex items-start space-x-3">
                            <div className="flex-1">
                              <p className="text-red-700 mb-1">
                                <span className="font-medium">Original:</span> {mistake.userInput}
                              </p>
                              <p className="text-green-700">
                                <span className="font-medium">Corrected:</span> {mistake.correction}
                              </p>
                            </div>
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                              {formatDate(new Date(mistake.createdAt))}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PatternAnalysis; 