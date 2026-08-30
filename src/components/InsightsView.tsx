import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  BarChart3, 
  Sparkles, 
  Brain, 
  TrendingUp, 
  Calendar, 
  Trash2, 
  Compass, 
  MessageSquare, 
  Target, 
  BookOpen, 
  Smile, 
  Frown, 
  Meh, 
  AlertCircle,
  Lightbulb
} from 'lucide-react';
import { useAuth } from '../lib/authContext';
import { generateMetaInsights } from '../lib/geminiClient';
import { createInsight } from '../lib/firestoreService';
import { JournalEntry, GoalItem, InsightItem, MoodType } from '../types';

interface InsightsViewProps {
  journals: JournalEntry[];
  goals: GoalItem[];
  insights: InsightItem[];
  loading: boolean;
  onDeleteInsight: (id: string) => void;
  onInsightAdded: (insight: InsightItem) => void;
  onShowToast: (type: 'success' | 'error' | 'info', text: string) => void;
}

const MOOD_DATA: { type: MoodType; label: string; icon: string; bg: string }[] = [
  { type: 'great', label: 'Great', icon: '✨', bg: 'bg-emerald-400' },
  { type: 'good', label: 'Good', icon: '😊', bg: 'bg-teal-400' },
  { type: 'okay', label: 'Okay', icon: '😐', bg: 'bg-stone-400' },
  { type: 'difficult', label: 'Difficult', icon: '🌧️', bg: 'bg-amber-400' },
  { type: 'low', label: 'Low', icon: '📉', bg: 'bg-rose-400' },
];

export const InsightsView: React.FC<InsightsViewProps> = ({
  journals,
  goals,
  insights,
  loading,
  onDeleteInsight,
  onInsightAdded,
  onShowToast,
}) => {
  const { user, getIdToken } = useAuth();
  const [isGeneratingMeta, setIsGeneratingMeta] = useState(false);
  const [latestAnalysis, setLatestAnalysis] = useState<string | null>(null);

  // Category breakdown
  const categoryCounts = journals.reduce((acc, j) => {
    acc[j.category] = (acc[j.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Mood counts
  const moodCounts = journals.reduce((acc, j) => {
    if (j.mood) {
      acc[j.mood] = (acc[j.mood] || 0) + 1;
    }
    return acc;
  }, {} as Record<MoodType, number>);

  const totalMoodEntries = Object.values(moodCounts).reduce((a, b) => a + b, 0);

  // Trigger Meta Analysis across user's journals
  const handleGenerateMetaSynthesis = async () => {
    if (!user || journals.length === 0 || isGeneratingMeta) return;

    setIsGeneratingMeta(true);
    try {
      const summaries = journals.slice(0, 15).map((j) => ({
        title: j.title,
        category: j.category,
        summary: j.summary || `Reflection on ${j.category} with ${j.messageCount} messages`,
      }));

      const goalSummaries = goals.map((g) => ({
        title: g.title,
        status: g.status,
      }));

      const res = await generateMetaInsights(getIdToken, {
        journalSummaries: summaries,
        goalSummaries,
      });

      setLatestAnalysis(res.metaAnalysis);

      // Save as persistent insight item
      const saved = await createInsight(user.uid, {
        type: 'reflection',
        title: `Comprehensive Growth Synthesis (${new Date().toLocaleDateString()})`,
        content: res.metaAnalysis,
      });

      onInsightAdded(saved);
      onShowToast('success', 'Deep meta-synthesis generated and archived!');
    } catch (err: any) {
      console.error(err);
      onShowToast('error', err.message || 'Failed to generate insights synthesis');
    } finally {
      setIsGeneratingMeta(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-100 flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-amber-400" />
            <span>AI Insights &amp; Growth Synthesis</span>
          </h1>
          <p className="text-sm text-stone-400 mt-1">
            Discover recurring patterns, mood trends, and cross-session themes powered by Gemini.
          </p>
        </div>

        <button
          onClick={handleGenerateMetaSynthesis}
          disabled={isGeneratingMeta || journals.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:pointer-events-none text-stone-950 rounded-xl text-xs font-bold uppercase tracking-wider transition active:scale-95 shadow-md self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4 fill-stone-950" />
          <span>{isGeneratingMeta ? 'Synthesizing...' : 'Synthesize Growth Insights'}</span>
        </button>
      </div>

      {/* Health & Clinical Disclaimer */}
      <div className="bg-stone-900/60 border border-stone-800/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-stone-400">
        <AlertCircle className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-stone-300">Personal Reflection Notice:</strong> This platform and its AI models provide reflective self-inquiry and organization tools. They do not constitute medical, psychiatric, or psychological diagnosis or treatment.
        </p>
      </div>

      {/* Quantitative Stats & Mood Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Metric Summary */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-4">
          <h2 className="font-serif text-lg font-bold text-stone-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span>Activity Overview</span>
          </h2>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs p-3 rounded-xl bg-stone-950 border border-stone-800">
              <span className="text-stone-400">Total Journal Entries</span>
              <span className="font-bold text-stone-100 text-sm">{journals.length}</span>
            </div>
            <div className="flex justify-between items-center text-xs p-3 rounded-xl bg-stone-950 border border-stone-800">
              <span className="text-stone-400">Total AI Interactions</span>
              <span className="font-bold text-stone-100 text-sm">
                {journals.reduce((acc, j) => acc + (j.messageCount || 0), 0)}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs p-3 rounded-xl bg-stone-950 border border-stone-800">
              <span className="text-stone-400">Action Goals Created</span>
              <span className="font-bold text-stone-100 text-sm">{goals.length}</span>
            </div>
            <div className="flex justify-between items-center text-xs p-3 rounded-xl bg-stone-950 border border-stone-800">
              <span className="text-stone-400">Summaries Generated</span>
              <span className="font-bold text-stone-100 text-sm">
                {journals.filter((j) => j.summary).length}
              </span>
            </div>
          </div>
        </div>

        {/* Mood Distribution */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-4">
          <h2 className="font-serif text-lg font-bold text-stone-100 flex items-center gap-2">
            <Smile className="w-4 h-4 text-amber-400" />
            <span>Mood &amp; Energy Trends</span>
          </h2>

          {totalMoodEntries === 0 ? (
            <p className="text-xs text-stone-500 italic pt-4">
              Select a mood state when writing journal entries to view energy trends over time.
            </p>
          ) : (
            <div className="space-y-3">
              {MOOD_DATA.map((m) => {
                const count = moodCounts[m.type] || 0;
                const pct = totalMoodEntries > 0 ? Math.round((count / totalMoodEntries) * 100) : 0;

                return (
                  <div key={m.type} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="flex items-center gap-1.5 text-stone-300">
                        <span>{m.icon}</span>
                        <span>{m.label}</span>
                      </span>
                      <span className="font-mono text-stone-400">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-stone-950 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${m.bg} rounded-full`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-4">
          <h2 className="font-serif text-lg font-bold text-stone-100 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>Focus Categories</span>
          </h2>

          {Object.keys(categoryCounts).length === 0 ? (
            <p className="text-xs text-stone-500 italic pt-4">
              No categories recorded yet.
            </p>
          ) : (
            <div className="space-y-2.5">
              {Object.entries(categoryCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([cat, count]) => {
                  const pct = Math.round((count / journals.length) * 100);
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-stone-300 font-medium">{cat}</span>
                        <span className="font-mono text-stone-400">{count} sessions</span>
                      </div>
                      <div className="w-full h-1.5 bg-stone-950 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400/80 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Generated Meta Synthesis / Latest Report */}
      {(latestAnalysis || isGeneratingMeta) && (
        <div className="bg-stone-900 border border-amber-500/40 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl animate-in fade-in">
          <div className="flex items-center gap-3 pb-3 border-b border-stone-800">
            <div className="p-2 rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/20">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-stone-100">
                Cross-Journal Growth Synthesis
              </h2>
              <p className="text-xs text-amber-400 font-mono">
                {isGeneratingMeta ? 'Synthesizing with Gemini...' : 'Generated Fresh Meta-Analysis'}
              </p>
            </div>
          </div>

          {isGeneratingMeta ? (
            <div className="py-8 space-y-3">
              <div className="h-4 bg-stone-800 rounded animate-pulse w-3/4"></div>
              <div className="h-4 bg-stone-800 rounded animate-pulse w-1/2"></div>
              <div className="h-4 bg-stone-800 rounded animate-pulse w-5/6"></div>
            </div>
          ) : (
            <div className="markdown-body prose prose-invert prose-stone max-w-none text-stone-200 text-sm space-y-3 leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {latestAnalysis || ''}
              </ReactMarkdown>
            </div>
          )}
        </div>
      )}

      {/* Archived Insights & Past Analyses */}
      <section className="space-y-4">
        <h2 className="font-serif text-xl font-bold text-stone-100 flex items-center gap-2">
          <Compass className="w-5 h-5 text-amber-400" />
          <span>Archived Insights &amp; Theme Reports ({insights.length})</span>
        </h2>

        {insights.length === 0 ? (
          <div className="p-8 text-center rounded-3xl bg-stone-900/40 border border-stone-800 space-y-2">
            <p className="text-xs text-stone-400">
              No saved insight reports yet. Run "Key Themes" in any journal or click "Synthesize Growth Insights" above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-stone-950 text-amber-400 border border-stone-800 font-semibold">
                      {insight.type}
                    </span>
                    <span className="text-[11px] text-stone-500">
                      {new Date(insight.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {insight.title && (
                    <h3 className="font-serif text-base font-bold text-stone-100">
                      {insight.title}
                    </h3>
                  )}

                  <div className="markdown-body text-xs text-stone-300 leading-relaxed max-h-44 overflow-y-auto pr-1">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {insight.content}
                    </ReactMarkdown>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-800 flex justify-end">
                  <button
                    onClick={() => onDeleteInsight(insight.id)}
                    className="text-stone-500 hover:text-red-400 p-1 rounded transition"
                    title="Delete Insight"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
