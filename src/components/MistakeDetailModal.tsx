import React from 'react';
import { X } from 'lucide-react';
import type { Mistake, DiffSegment } from '@/types/mistakes';

interface MistakeDetailModalProps {
  mistake: Mistake | null;
  isOpen: boolean;
  onClose: () => void;
}

const DiffText: React.FC<{ segments: DiffSegment[]; isOriginal?: boolean }> = ({ segments, isOriginal = false }) => {
  return (
    <div className="space-y-1 leading-relaxed">
      {segments.map((segment, index) => {
        if (isOriginal) {
          // For original text, show incorrect parts in red
          if (segment.type === 'incorrect') {
            return (
              <span 
                key={index} 
                className="bg-red-100 text-red-800 px-1 rounded font-medium border border-red-200"
              >
                {segment.text}
              </span>
            );
          } else if (segment.type === 'correct') {
            return <span key={index} className="text-gray-700">{segment.text}</span>;
          } else {
            // Don't show 'added' parts in original
            return null;
          }
        } else {
          // For corrected text, show additions in green
          if (segment.type === 'added') {
            return (
              <span 
                key={index} 
                className="bg-green-100 text-green-800 px-1 rounded font-medium border border-green-200"
              >
                {segment.text}
              </span>
            );
          } else if (segment.type === 'correct') {
            return <span key={index} className="text-gray-700">{segment.text}</span>;
          } else {
            // Don't show 'incorrect' parts in corrected version
            return null;
          }
        }
      })}
    </div>
  );
};

const SeverityBadge: React.FC<{ severity: string }> = ({ severity }) => {
  const colors = {
    minor: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    moderate: 'bg-orange-100 text-orange-800 border-orange-200',
    major: 'bg-red-100 text-red-800 border-red-200'
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${colors[severity as keyof typeof colors] || colors.moderate}`}>
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  );
};

const CategoryBadge: React.FC<{ category: string }> = ({ category }) => {
  const colors = {
    grammar: 'bg-blue-100 text-blue-800',
    vocabulary: 'bg-purple-100 text-purple-800',  
    syntax: 'bg-indigo-100 text-indigo-800',
    orthography: 'bg-green-100 text-green-800',
    pronunciation: 'bg-pink-100 text-pink-800',
    pragmatic: 'bg-teal-100 text-teal-800',
    cultural: 'bg-amber-100 text-amber-800'
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
      {category.charAt(0).toUpperCase() + category.slice(1)}
    </span>
  );
};

export const MistakeDetailModal: React.FC<MistakeDetailModalProps> = ({ 
  mistake, 
  isOpen, 
  onClose 
}) => {
  if (!isOpen || !mistake) return null;

  const diffSegments = mistake.detailedCorrection?.diffSegments || [];
  const hasDetailedCorrection = mistake.detailedCorrection && diffSegments.length > 0;

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gray-50">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-gray-900">Mistake Analysis</h2>
            <CategoryBadge category={mistake.category} />
            <SeverityBadge severity={mistake.severity} />
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"  
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Metadata */}
          <div className="mb-6 text-sm text-gray-600 space-y-1">
            <div><strong>Date:</strong> {formatTimestamp(mistake.timestamp)}</div>
            {mistake.subcategory && (
              <div><strong>Type:</strong> {mistake.subcategory.replace('_', ' ')}</div>
            )}
            <div><strong>Session:</strong> {mistake.sessionId}</div>
          </div>

          {/* Diff Comparison */}
          {hasDetailedCorrection ? (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4 text-gray-900">Correction Comparison</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Original Text */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-red-700">Your Version</h4>
                    <span className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded">Mistakes highlighted</span>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 min-h-[80px]">
                    <DiffText segments={diffSegments} isOriginal={true} />
                  </div>
                </div>

                {/* Corrected Text */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-green-700">Corrected Version</h4>
                    <span className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded">Corrections highlighted</span>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 min-h-[80px]">
                    <DiffText segments={diffSegments} isOriginal={false} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Fallback for basic corrections */
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4 text-gray-900">Correction</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="font-medium text-red-700">Original</h4>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800">{mistake.userInput}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-green-700">Corrected</h4>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800">{mistake.correction}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Explanation */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3 text-gray-900">Explanation</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-900 leading-relaxed">
                {mistake.detailedCorrection?.explanation || mistake.explanation}
              </p>
            </div>
          </div>

          {/* Grammar Rule & Examples */}
          {mistake.detailedCorrection?.grammarRule && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3 text-gray-900">Grammar Rule</h3>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-purple-900 font-medium mb-2">{mistake.detailedCorrection.grammarRule}</p>
                
                {mistake.detailedCorrection.examples && mistake.detailedCorrection.examples.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-purple-800 mb-2">Examples:</h4>
                    <ul className="space-y-1">
                      {mistake.detailedCorrection.examples.map((example, index) => (
                        <li key={index} className="text-sm text-purple-700 flex items-start">
                          <span className="text-purple-400 mr-2">•</span>
                          <span>{example}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Context */}
          {mistake.context && (
            <div>
              <h3 className="text-lg font-medium mb-3 text-gray-900">Context</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-700 text-sm leading-relaxed">{mistake.context}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}; 