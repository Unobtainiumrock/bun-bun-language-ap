import React, { useState, useEffect, useCallback } from 'react';
import { db, dbUtils } from '@/db';
import type { MistakePattern, LearningSession } from '@/db';
import { MISTAKE_CATEGORIES } from '@/types/mistakes';
import type { Mistake } from '@/types/mistakes';
import { TrendingUp, Database, Clock, Target, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { MistakeDetailModal } from '@/components/MistakeDetailModal';
import { MistakeFilters, type FilterState } from '@/components/MistakeFilters';
import { MistakeFilterEngine } from '@/utils/mistakeFiltering';
import { PatternAnalysis } from '@/components/PatternAnalysis';
import { ExportTools } from '@/components/ExportTools';

export const MistakeAnalytics: React.FC = () => {
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [filteredMistakes, setFilteredMistakes] = useState<Mistake[]>([]);
  const [patterns, setPatterns] = useState<MistakePattern[]>([]);
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const [selectedMistake, setSelectedMistake] = useState<Mistake | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    categories: [],
    severities: [],
    timeframe: 'all',
    dateRange: { start: null, end: null },
    searchFields: ['userInput', 'correction', 'explanation']
  });
  const itemsPerPage = 10;

  useEffect(() => {
    loadData();
  }, []);

  // Apply filters whenever mistakes or filters change
  useEffect(() => {
    const filtered = MistakeFilterEngine.filterMistakes(mistakes, filters);
    setFilteredMistakes(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [mistakes, filters]);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load all mistake-related data from IndexedDB
      const [mistakesData, patternsData, sessionsData] = await Promise.all([
        db.userMistakes.orderBy('createdAt').reverse().toArray(),
        db.mistakePatterns.orderBy('frequency').reverse().toArray(),
        db.learningSessions.orderBy('startTime').reverse().toArray()
      ]);

      setMistakes(mistakesData);
      setPatterns(patternsData);
      setSessions(sessionsData);
      
      console.log('Loaded mistake analytics:', {
        mistakes: mistakesData.length,
        patterns: patternsData.length,
        sessions: sessionsData.length
      });
    } catch (error) {
      console.error('Error loading mistake analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearDatabase = async () => {
    if (!confirm('Are you sure you want to clear ALL learning data? This cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Reset the entire database including auto-increment counters
      await dbUtils.resetDatabase();
      
      console.log('🗑️ Database completely reset');
      
      // Reload empty data
      await loadData();
      
      alert('Database reset successfully!');
    } catch (error) {
      console.error('Error resetting database:', error);
      alert('Error resetting database. Check console for details.');
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  const getMistakeCategoryInfo = (category: string, subcategory: string) => {
    const categoryData = MISTAKE_CATEGORIES[category as keyof typeof MISTAKE_CATEGORIES];
    if (!categoryData) return { name: category, description: 'Unknown category' };
    
    const subcategoryData = categoryData.find(cat => cat.id === subcategory);
    return {
      name: subcategoryData?.name || subcategory,
      description: subcategoryData?.description || 'Unknown subcategory'
    };
  };

  // Pagination logic - now uses filtered mistakes
  const totalPages = Math.ceil(filteredMistakes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMistakes = showAll ? filteredMistakes : filteredMistakes.slice(startIndex, endIndex);

  // Highlight search terms in text
  const highlightText = (text: string) => {
    return MistakeFilterEngine.highlightSearchTerms(text, filters.searchQuery);
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleRowClick = (mistake: Mistake) => {
    setSelectedMistake(mistake);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedMistake(null);
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm border">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-blue-600 text-white p-6 rounded-lg">
        <div className="flex items-center mb-2">
          <Database className="w-6 h-6 mr-3" />
          <h2 className="text-2xl font-bold">Mistake Analytics Dashboard</h2>
        </div>
        <p className="text-purple-100">Real-time data from IndexedDB (Dexie.js)</p>
      </div>

      {/* Advanced Filters */}
      <MistakeFilters
        onFiltersChange={handleFiltersChange}
        totalCount={mistakes.length}
        filteredCount={filteredMistakes.length}
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Target className="w-8 h-8 text-red-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Mistakes</p>
              <p className="text-2xl font-bold text-red-600">{mistakes.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Mistake Patterns</p>
              <p className="text-2xl font-bold text-blue-600">{patterns.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Learning Sessions</p>
              <p className="text-2xl font-bold text-green-600">{sessions.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Individual Mistakes Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Individual Mistakes (userMistakes table)</h3>
              <p className="text-sm text-gray-600">
                Real-time data from IndexedDB - 
                {filteredMistakes.length !== mistakes.length 
                  ? `${filteredMistakes.length} filtered of ${mistakes.length} total mistakes`
                  : `${mistakes.length} total mistakes`
                }
              </p>
              <p className="text-xs text-blue-600 mt-1">💡 Click any row to see detailed correction analysis</p>
            </div>
            {filteredMistakes.length > itemsPerPage && (
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 transition-colors"
                >
                  {showAll ? 'Paginate' : 'Show All'}
                </button>
                {!showAll && (
                  <div className="text-sm text-gray-500">
                    Page {currentPage} of {totalPages}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {filteredMistakes.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            {mistakes.length === 0 ? (
              <p>No mistakes recorded yet. Try the conversation practice!</p>
            ) : (
              <p>No mistakes match your current filters. Try adjusting your search criteria.</p>
            )}
          </div>
        ) : (
          <>
            <div className={`overflow-x-auto ${showAll ? 'max-h-96 overflow-y-auto' : ''}`}>
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User Input</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Correction</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentMistakes.map((mistake) => {
                    const categoryInfo = getMistakeCategoryInfo(mistake.category, mistake.subcategory || '');
                    return (
                      <tr 
                        key={mistake.id} 
                        className="hover:bg-blue-50 cursor-pointer transition-colors"
                        onClick={() => handleRowClick(mistake)}
                      >
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {formatDate(mistake.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{categoryInfo.name}</p>
                            <p className="text-xs text-gray-500">{mistake.category}/{mistake.subcategory}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            mistake.severity === 'major' ? 'bg-red-100 text-red-800' :
                            mistake.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {mistake.severity}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                          <div 
                            className="truncate" 
                            title={mistake.userInput}
                            dangerouslySetInnerHTML={{ 
                              __html: highlightText(mistake.userInput) 
                            }}
                          />
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                          <div 
                            className="truncate" 
                            title={mistake.correction}
                            dangerouslySetInnerHTML={{ 
                              __html: highlightText(mistake.correction) 
                            }}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowClick(mistake);
                            }}
                            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                            title="View detailed correction"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            <span className="text-xs">Details</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {!showAll && filteredMistakes.length > itemsPerPage && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredMistakes.length)} of {filteredMistakes.length} mistakes
                  {filteredMistakes.length !== mistakes.length && (
                    <span className="text-blue-600 ml-1">
                      (filtered from {mistakes.length} total)
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <div className="flex items-center space-x-1">
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => goToPage(page)}
                          className={`px-3 py-1 rounded text-sm ${
                            page === currentPage
                              ? 'bg-blue-500 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    {totalPages > 5 && (
                      <>
                        <span className="px-2">...</span>
                        <button
                          onClick={() => goToPage(totalPages)}
                          className={`px-3 py-1 rounded text-sm ${
                            totalPages === currentPage
                              ? 'bg-blue-500 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                  </div>
                  
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Mistake Patterns */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Mistake Patterns (mistakePatterns table)</h3>
          <p className="text-sm text-gray-600">Aggregated frequency data</p>
        </div>
        
        {patterns.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>No patterns identified yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subcategory</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frequency</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">First/Last</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mastery Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {patterns.map((pattern) => (
                  <tr key={pattern.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {pattern.mistakeType}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {pattern.subcategory}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                        {pattern.frequency}x
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      <div>First: {formatDate(pattern.firstOccurrence)}</div>
                      <div>Last: {formatDate(pattern.lastOccurrence)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${pattern.masteryLevel}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600">{pattern.masteryLevel}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Database Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">📊 Database Storage Details</h4>
        <div className="text-xs text-blue-800 space-y-1">
          <p><strong>Database:</strong> FrenchAppDB (IndexedDB via Dexie.js)</p>
          <p><strong>Tables:</strong> userMistakes, mistakePatterns, learningSessions</p>
          <p><strong>Location:</strong> Browser's IndexedDB (persists locally)</p>
          <p><strong>Data Lifetime:</strong> Permanent until manually cleared</p>
          <p><strong>Access:</strong> Chrome DevTools → Application → Storage → IndexedDB → FrenchAppDB</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="text-center space-x-4">
        <button
          onClick={loadData}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          🔄 Refresh Data
        </button>
        <button
          onClick={clearDatabase}
          className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors"
        >
          🗑️ Clear Database
        </button>
      </div>

      {/* Pattern Analysis Section */}
      <PatternAnalysis mistakes={filteredMistakes} />

      {/* Export Tools Section */}
      <ExportTools mistakes={mistakes} filteredMistakes={filteredMistakes} />

      {/* Mistake Detail Modal */}
      <MistakeDetailModal
        mistake={selectedMistake}
        isOpen={modalOpen}
        onClose={closeModal}
      />
    </div>
  );
};

export default MistakeAnalytics; 