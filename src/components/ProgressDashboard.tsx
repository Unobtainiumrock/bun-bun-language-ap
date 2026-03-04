import React, { useEffect, useState } from 'react';
import { TrendingUp, Target, BarChart3, BookOpen } from 'lucide-react';
import { dbUtils } from '@/db';
import type { MistakeAnalysis, MistakeType } from '@/types/mistakes';

export const ProgressDashboard: React.FC = () => {
  const [analysis, setAnalysis] = useState<MistakeAnalysis | null>(null);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'all'>('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await dbUtils.getMistakeAnalysis(timeframe);
        setAnalysis(data);
      } catch {
        // DB may be empty on first visit
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [timeframe]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  const hasData = analysis && analysis.totalMistakes > 0;

  const categoryLabels: Record<MistakeType, string> = {
    grammar: 'Grammar',
    vocabulary: 'Vocabulary',
    syntax: 'Syntax',
    orthography: 'Orthography',
    pronunciation: 'Pronunciation',
    pragmatic: 'Pragmatic',
    cultural: 'Cultural',
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Your Progress</h2>
        <select
          value={timeframe}
          onChange={e => setTimeframe(e.target.value as typeof timeframe)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {!hasData ? (
        <div className="text-center py-16 space-y-4">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto" />
          <p className="text-gray-500">No mistakes recorded yet. Start a conversation to begin tracking your progress.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<BarChart3 className="w-5 h-5 text-blue-500" />}
              label="Total Mistakes"
              value={analysis.totalMistakes}
            />
            <StatCard
              icon={<Target className="w-5 h-5 text-red-500" />}
              label="Categories"
              value={Object.keys(analysis.mistakesByCategory).length}
            />
            <StatCard
              icon={<TrendingUp className="w-5 h-5 text-green-500" />}
              label="Top Area"
              value={
                analysis.mostCommonMistakes[0]
                  ? categoryLabels[analysis.mostCommonMistakes[0].category] || analysis.mostCommonMistakes[0].category
                  : 'N/A'
              }
            />
            <StatCard
              icon={<BookOpen className="w-5 h-5 text-purple-500" />}
              label="Most Common"
              value={analysis.mostCommonMistakes[0]?.count ?? 0}
            />
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Mistakes by Category</h3>
            <div className="space-y-3">
              {Object.entries(analysis.mistakesByCategory)
                .sort(([, a], [, b]) => b - a)
                .map(([category, count]) => {
                  const pct = Math.round((count / analysis.totalMistakes) * 100);
                  return (
                    <div key={category}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">
                          {categoryLabels[category as MistakeType] || category}
                        </span>
                        <span className="text-gray-500">{count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {analysis.mostCommonMistakes.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Common Mistakes</h3>
              <div className="space-y-2">
                {analysis.mostCommonMistakes.slice(0, 5).map((m, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <span className="font-medium text-gray-800">
                        {categoryLabels[m.category] || m.category}
                      </span>
                      {m.subcategory && (
                        <span className="text-gray-500 text-sm ml-2">/ {m.subcategory}</span>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                      {m.count}x
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center space-x-2 mb-1">{icon}<span className="text-xs text-gray-500">{label}</span></div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
