import React, { useState } from 'react';
import { Download, FileText, Database, BookOpen, Target, TrendingUp } from 'lucide-react';
import type { Mistake } from '@/types/mistakes';

interface ExportToolsProps {
  mistakes: Mistake[];
  filteredMistakes: Mistake[];
}

type ExportFormat = 'csv' | 'json' | 'flashcards' | 'anki' | 'review-sheet' | 'progress-report';

interface ExportOptions {
  format: ExportFormat;
  includeExplanations: boolean;
  includeExamples: boolean;
  includeContext: boolean;
  groupByCategory: boolean;
  timeframe: 'all' | 'month' | 'week';
  onlyRepeatedMistakes: boolean;
}

export const ExportTools: React.FC<ExportToolsProps> = ({ mistakes, filteredMistakes }) => {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    includeExplanations: true,
    includeExamples: true,
    includeContext: false,
    groupByCategory: false,
    timeframe: 'all',
    onlyRepeatedMistakes: false
  });

  const [isExporting, setIsExporting] = useState(false);

  const updateOptions = (updates: Partial<ExportOptions>) => {
    setExportOptions(prev => ({ ...prev, ...updates }));
  };

  const getExportData = (): Mistake[] => {
    let data = exportOptions.timeframe === 'all' ? filteredMistakes : getTimeframedMistakes();
    
    if (exportOptions.onlyRepeatedMistakes) {
      data = data.filter(mistake => mistake.isRepeated);
    }

    return data;
  };

  const getTimeframedMistakes = (): Mistake[] => {
    const now = new Date();
    const cutoff = exportOptions.timeframe === 'week' 
      ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    return filteredMistakes.filter(mistake => new Date(mistake.createdAt) >= cutoff);
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportAsCSV = () => {
    const data = getExportData();
    const headers = [
      'Date',
      'Category',
      'Subcategory', 
      'Severity',
      'Original Text',
      'Correction',
      ...(exportOptions.includeExplanations ? ['Explanation'] : []),
      ...(exportOptions.includeContext ? ['Context'] : []),
      ...(exportOptions.includeExamples ? ['Grammar Rule', 'Examples'] : []),
      'Session ID',
      'Is Repeated'
    ];

    const csvContent = [
      headers.join(','),
      ...data.map(mistake => [
        new Date(mistake.createdAt).toISOString().split('T')[0],
        mistake.category,
        mistake.subcategory || '',
        mistake.severity,
        `"${mistake.userInput.replace(/"/g, '""')}"`,
        `"${mistake.correction.replace(/"/g, '""')}"`,
        ...(exportOptions.includeExplanations ? [`"${mistake.explanation.replace(/"/g, '""')}"`] : []),
        ...(exportOptions.includeContext ? [`"${mistake.context?.replace(/"/g, '""') || ''}"`] : []),
        ...(exportOptions.includeExamples ? [
          `"${mistake.detailedCorrection?.grammarRule?.replace(/"/g, '""') || ''}"`,
          `"${mistake.detailedCorrection?.examples?.join('; ').replace(/"/g, '""') || ''}"`
        ] : []),
        mistake.sessionId,
        mistake.isRepeated
      ].join(','))
    ].join('\n');

    const filename = `french-mistakes-${exportOptions.timeframe}-${new Date().toISOString().split('T')[0]}.csv`;
    downloadFile(csvContent, filename, 'text/csv');
  };

  const exportAsJSON = () => {
    const data = getExportData();
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        totalMistakes: data.length,
        timeframe: exportOptions.timeframe,
        filters: exportOptions
      },
      mistakes: data.map(mistake => ({
        id: mistake.id,
        date: mistake.createdAt,
        category: mistake.category,
        subcategory: mistake.subcategory,
        severity: mistake.severity,
        userInput: mistake.userInput,
        correction: mistake.correction,
        explanation: exportOptions.includeExplanations ? mistake.explanation : undefined,
        context: exportOptions.includeContext ? mistake.context : undefined,
        grammarRule: exportOptions.includeExamples ? mistake.detailedCorrection?.grammarRule : undefined,
        examples: exportOptions.includeExamples ? mistake.detailedCorrection?.examples : undefined,
        sessionId: mistake.sessionId,
        isRepeated: mistake.isRepeated
      }))
    };

    const filename = `french-mistakes-${exportOptions.timeframe}-${new Date().toISOString().split('T')[0]}.json`;
    downloadFile(JSON.stringify(exportData, null, 2), filename, 'application/json');
  };

  const exportAsFlashcards = () => {
    const data = getExportData();
    const flashcards = data.map(mistake => ({
      front: mistake.userInput,
      back: `${mistake.correction}\n\n${exportOptions.includeExplanations ? mistake.explanation : ''}`,
      category: mistake.category,
      subcategory: mistake.subcategory,
      severity: mistake.severity
    }));

    const flashcardContent = flashcards.map(card => 
      `FRONT: ${card.front}\nBACK: ${card.back}\nCATEGORY: ${card.category}\nSEVERITY: ${card.severity}\n---`
    ).join('\n\n');

    const filename = `french-flashcards-${exportOptions.timeframe}-${new Date().toISOString().split('T')[0]}.txt`;
    downloadFile(flashcardContent, filename, 'text/plain');
  };

  const exportAsAnki = () => {
    const data = getExportData();
    const ankiCards = data.map(mistake => {
      const front = mistake.userInput;
      const back = `<div><strong>Correction:</strong> ${mistake.correction}</div>` +
                   (exportOptions.includeExplanations ? `<div><strong>Explanation:</strong> ${mistake.explanation}</div>` : '') +
                   (exportOptions.includeExamples && mistake.detailedCorrection?.grammarRule ? 
                     `<div><strong>Rule:</strong> ${mistake.detailedCorrection.grammarRule}</div>` : '') +
                   (exportOptions.includeExamples && mistake.detailedCorrection?.examples ? 
                     `<div><strong>Examples:</strong> ${mistake.detailedCorrection.examples.join(', ')}</div>` : '');
      
      const tags = [mistake.category, mistake.subcategory, mistake.severity].filter(Boolean).join(' ');
      
      return `"${front.replace(/"/g, '""')}"\t"${back.replace(/"/g, '""')}"\t"${tags}"`;
    });

    const ankiContent = ankiCards.join('\n');
    const filename = `french-anki-deck-${exportOptions.timeframe}-${new Date().toISOString().split('T')[0]}.txt`;
    downloadFile(ankiContent, filename, 'text/plain');
  };

  const exportAsReviewSheet = () => {
    const data = getExportData();
    const groupedByCategory = exportOptions.groupByCategory ? groupMistakesByCategory(data) : { 'All Mistakes': data };

    let content = `# French Learning Review Sheet\n`;
    content += `Generated on: ${new Date().toLocaleDateString()}\n`;
    content += `Total mistakes: ${data.length}\n`;
    content += `Timeframe: ${exportOptions.timeframe}\n\n`;

    Object.entries(groupedByCategory).forEach(([category, mistakes]) => {
      content += `## ${category} (${mistakes.length} mistakes)\n\n`;
      
      mistakes.forEach((mistake, index) => {
        content += `### ${index + 1}. ${mistake.userInput}\n`;
        content += `**Correction:** ${mistake.correction}\n`;
        if (exportOptions.includeExplanations) {
          content += `**Explanation:** ${mistake.explanation}\n`;
        }
        if (exportOptions.includeExamples && mistake.detailedCorrection?.grammarRule) {
          content += `**Grammar Rule:** ${mistake.detailedCorrection.grammarRule}\n`;
        }
        if (exportOptions.includeExamples && mistake.detailedCorrection?.examples) {
          content += `**Examples:** ${mistake.detailedCorrection.examples.join(', ')}\n`;
        }
        content += `**Severity:** ${mistake.severity} | **Date:** ${new Date(mistake.createdAt).toLocaleDateString()}\n\n`;
      });
    });

    const filename = `french-review-sheet-${exportOptions.timeframe}-${new Date().toISOString().split('T')[0]}.md`;
    downloadFile(content, filename, 'text/markdown');
  };

  const exportAsProgressReport = () => {
    const data = getExportData();
    const allMistakes = mistakes;

    // Calculate statistics
    const categoryStats = calculateCategoryStats(data);
    const severityStats = calculateSeverityStats(data);
    const timeStats = calculateTimeStats(allMistakes);
    const improvementStats = calculateImprovementStats(allMistakes);

    let content = `# French Learning Progress Report\n`;
    content += `Generated on: ${new Date().toLocaleDateString()}\n`;
    content += `Report period: ${exportOptions.timeframe}\n\n`;

    content += `## Summary Statistics\n`;
    content += `- Total mistakes analyzed: ${data.length}\n`;
    content += `- All-time mistakes: ${allMistakes.length}\n`;
    content += `- Repeated mistakes: ${data.filter(m => m.isRepeated).length}\n`;
    content += `- Most common category: ${categoryStats[0]?.category || 'N/A'} (${categoryStats[0]?.count || 0} mistakes)\n\n`;

    content += `## Mistakes by Category\n`;
    categoryStats.forEach(stat => {
      content += `- **${stat.category}**: ${stat.count} mistakes (${stat.percentage.toFixed(1)}%)\n`;
    });
    content += '\n';

    content += `## Mistakes by Severity\n`;
    severityStats.forEach(stat => {
      content += `- **${stat.severity}**: ${stat.count} mistakes (${stat.percentage.toFixed(1)}%)\n`;
    });
    content += '\n';

    content += `## Learning Trends\n`;
    content += `- Average mistakes per day: ${improvementStats.avgPerDay.toFixed(1)}\n`;
    content += `- Improvement trend: ${improvementStats.trend}\n`;
    content += `- Most active learning day: ${timeStats.mostActiveDay}\n\n`;

    content += `## Focus Areas for Improvement\n`;
    const focusAreas = categoryStats.slice(0, 3);
    focusAreas.forEach((area, index) => {
      content += `${index + 1}. **${area.category}** - ${area.count} mistakes\n`;
      const categoryMistakes = data.filter(m => m.category === area.category).slice(0, 2);
      categoryMistakes.forEach(mistake => {
        content += `   - "${mistake.userInput}" → "${mistake.correction}"\n`;
      });
    });

    const filename = `french-progress-report-${exportOptions.timeframe}-${new Date().toISOString().split('T')[0]}.md`;
    downloadFile(content, filename, 'text/markdown');
  };

  const groupMistakesByCategory = (mistakes: Mistake[]) => {
    return mistakes.reduce((groups, mistake) => {
      const category = mistake.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(mistake);
      return groups;
    }, {} as Record<string, Mistake[]>);
  };

  const calculateCategoryStats = (mistakes: Mistake[]) => {
    const counts = mistakes.reduce((acc, mistake) => {
      acc[mistake.category] = (acc[mistake.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .map(([category, count]) => ({
        category,
        count,
        percentage: (count / mistakes.length) * 100
      }))
      .sort((a, b) => b.count - a.count);
  };

  const calculateSeverityStats = (mistakes: Mistake[]) => {
    const counts = mistakes.reduce((acc, mistake) => {
      acc[mistake.severity] = (acc[mistake.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .map(([severity, count]) => ({
        severity,
        count,
        percentage: (count / mistakes.length) * 100
      }))
      .sort((a, b) => b.count - a.count);
  };

  const calculateTimeStats = (mistakes: Mistake[]) => {
    const dayCount = mistakes.reduce((acc, mistake) => {
      const day = new Date(mistake.createdAt).toLocaleDateString();
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostActiveDay = Object.entries(dayCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';

    return { mostActiveDay };
  };

  const calculateImprovementStats = (mistakes: Mistake[]) => {
    if (mistakes.length === 0) return { avgPerDay: 0, trend: 'stable' };

    const sortedMistakes = [...mistakes].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const firstDate = new Date(sortedMistakes[0].createdAt);
    const lastDate = new Date(sortedMistakes[sortedMistakes.length - 1].createdAt);
    const daysDiff = Math.max(1, (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const avgPerDay = mistakes.length / daysDiff;

    // Simple trend calculation
    const recentMistakes = sortedMistakes.slice(-Math.floor(mistakes.length / 3));
    const olderMistakes = sortedMistakes.slice(0, Math.floor(mistakes.length / 3));
    
    const recentRate = recentMistakes.length / Math.max(1, recentMistakes.length);
    const olderRate = olderMistakes.length / Math.max(1, olderMistakes.length);
    
    const trend = recentRate < olderRate * 0.8 ? 'improving' : 
                  recentRate > olderRate * 1.2 ? 'worsening' : 'stable';

    return { avgPerDay, trend };
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      switch (exportOptions.format) {
        case 'csv':
          exportAsCSV();
          break;
        case 'json':
          exportAsJSON();
          break;
        case 'flashcards':
          exportAsFlashcards();
          break;
        case 'anki':
          exportAsAnki();
          break;
        case 'review-sheet':
          exportAsReviewSheet();
          break;
        case 'progress-report':
          exportAsProgressReport();
          break;
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportFormats = [
    { 
      id: 'csv', 
      name: 'CSV Spreadsheet', 
      description: 'Excel-compatible format for data analysis',
      icon: Database,
      recommended: false
    },
    { 
      id: 'json', 
      name: 'JSON Data', 
      description: 'Structured data for developers and advanced users',
      icon: FileText,
      recommended: false
    },
    { 
      id: 'flashcards', 
      name: 'Text Flashcards', 
      description: 'Simple text format for manual flashcard creation',
      icon: BookOpen,
      recommended: true
    },
    { 
      id: 'anki', 
      name: 'Anki Deck', 
      description: 'Import directly into Anki spaced repetition system',
      icon: Target,
      recommended: true
    },
    { 
      id: 'review-sheet', 
      name: 'Study Review Sheet', 
      description: 'Formatted markdown document for studying',
      icon: FileText,
      recommended: true
    },
    { 
      id: 'progress-report', 
      name: 'Progress Report', 
      description: 'Comprehensive analysis with statistics and trends',
      icon: TrendingUp,
      recommended: false
    }
  ];

  const dataCount = getExportData().length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-teal-600 text-white p-6 rounded-lg">
        <div className="flex items-center mb-2">
          <Download className="w-6 h-6 mr-3" />
          <h2 className="text-2xl font-bold">Export Learning Data</h2>
        </div>
        <p className="text-green-100">Export your mistakes and progress in various formats for external use</p>
      </div>

      {/* Export Format Selection */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Choose Export Format</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exportFormats.map((format) => {
            const Icon = format.icon;
            return (
              <div
                key={format.id}
                onClick={() => updateOptions({ format: format.id as ExportFormat })}
                className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  exportOptions.format === format.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {format.recommended && (
                  <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    Recommended
                  </span>
                )}
                <div className="flex items-start space-x-3">
                  <Icon className={`w-6 h-6 mt-1 ${
                    exportOptions.format === format.id ? 'text-blue-600' : 'text-gray-500'
                  }`} />
                  <div>
                    <h4 className="font-medium text-gray-900">{format.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{format.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Export Options</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Content Options */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Content to Include</h4>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportOptions.includeExplanations}
                  onChange={(e) => updateOptions({ includeExplanations: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Include explanations</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportOptions.includeExamples}
                  onChange={(e) => updateOptions({ includeExamples: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Include grammar rules & examples</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportOptions.includeContext}
                  onChange={(e) => updateOptions({ includeContext: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Include conversation context</span>
              </label>
            </div>
          </div>

          {/* Filter Options */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Data Filters</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time Period</label>
                <select
                  value={exportOptions.timeframe}
                  onChange={(e) => updateOptions({ timeframe: e.target.value as any })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Time</option>
                  <option value="month">This Month</option>
                  <option value="week">This Week</option>
                </select>
              </div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportOptions.groupByCategory}
                  onChange={(e) => updateOptions({ groupByCategory: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Group by category</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportOptions.onlyRepeatedMistakes}
                  onChange={(e) => updateOptions({ onlyRepeatedMistakes: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Only repeated mistakes</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Export Summary & Action */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Ready to Export</h3>
            <p className="text-sm text-gray-600 mt-1">
              {dataCount} mistakes will be exported in {exportFormats.find(f => f.id === exportOptions.format)?.name} format
            </p>
            {dataCount === 0 && (
              <p className="text-sm text-red-600 mt-1">
                No data matches your current filters. Adjust your options to include more data.
              </p>
            )}
          </div>
          <button
            onClick={handleExport}
            disabled={isExporting || dataCount === 0}
            className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
              isExporting || dataCount === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </>
            )}
          </button>
        </div>
      </div>

      {/* Usage Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 Export Tips</h4>
        <div className="text-xs text-blue-800 space-y-1">
          <p><strong>Anki:</strong> Import the .txt file using "Import" → "Text separated by tabs or semicolons"</p>
          <p><strong>Flashcards:</strong> Copy and paste into your preferred flashcard app or print for physical cards</p>
          <p><strong>CSV:</strong> Open in Excel, Google Sheets, or any spreadsheet application for analysis</p>
          <p><strong>Review Sheet:</strong> Perfect for printing or viewing in any markdown reader</p>
        </div>
      </div>
    </div>
  );
};

export default ExportTools; 