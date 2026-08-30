import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Archive, 
  ArchiveRestore, 
  Trash2, 
  Clock, 
  Tag, 
  Plus, 
  Download, 
  Folder, 
  ArrowRight,
  BookOpen,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { JournalEntry, JournalCategory, MoodType, ViewMode } from '../types';
import { ConfirmationModal } from './ConfirmationModal';

interface HistoryViewProps {
  journals: JournalEntry[];
  loading: boolean;
  onSelectJournal: (journalId: string) => void;
  onNewJournal: () => void;
  onArchiveJournal: (journalId: string, currentArchived: boolean) => void;
  onDeleteJournal: (journalId: string) => void;
  onShowToast: (type: 'success' | 'error' | 'info', text: string) => void;
}

const CATEGORIES: ('All' | JournalCategory)[] = [
  'All',
  'Daily Journal',
  'Reflection',
  'Career',
  'Study',
  'Ideas',
  'Goals',
  'Projects',
  'General',
];

const MOODS: { type: MoodType; label: string; icon: string }[] = [
  { type: 'great', label: 'Great', icon: '✨' },
  { type: 'good', label: 'Good', icon: '😊' },
  { type: 'okay', label: 'Okay', icon: '😐' },
  { type: 'difficult', label: 'Difficult', icon: '🌧️' },
  { type: 'low', label: 'Low', icon: '📉' },
];

export const HistoryView: React.FC<HistoryViewProps> = ({
  journals,
  loading,
  onSelectJournal,
  onNewJournal,
  onArchiveJournal,
  onDeleteJournal,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | JournalCategory>('All');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [showArchivedTab, setShowArchivedTab] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'messages' | 'title'>('newest');

  // Deletion modal
  const [deletingJournalId, setDeletingJournalId] = useState<string | null>(null);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    journals.forEach((j) => {
      j.tags.forEach((t) => set.add(t));
    });
    return Array.from(set);
  }, [journals]);

  // Filtered and sorted journals
  const filteredJournals = useMemo(() => {
    return journals
      .filter((j) => {
        // Archive tab check
        if (showArchivedTab ? !j.archived : j.archived) return false;

        // Category check
        if (selectedCategory !== 'All' && j.category !== selectedCategory) return false;

        // Tag check
        if (selectedTag && !j.tags.includes(selectedTag)) return false;

        // Mood check
        if (selectedMood && j.mood !== selectedMood) return false;

        // Search query check (title, summary, tags, category)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = j.title.toLowerCase().includes(q);
          const matchSummary = j.summary ? j.summary.toLowerCase().includes(q) : false;
          const matchCategory = j.category.toLowerCase().includes(q);
          const matchTags = j.tags.some((t) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchSummary && !matchCategory && !matchTags) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        if (sortBy === 'oldest') return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        if (sortBy === 'messages') return (b.messageCount || 0) - (a.messageCount || 0);
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        return 0;
      });
  }, [journals, showArchivedTab, selectedCategory, selectedTag, selectedMood, searchQuery, sortBy]);

  const activeCount = journals.filter((j) => !j.archived).length;
  const archivedCount = journals.filter((j) => j.archived).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-200">
      {/* Top Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-100 flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-amber-400" />
            <span>Journal Archive &amp; History</span>
          </h1>
          <p className="text-sm text-stone-400 mt-1">
            Search, filter, review, and export all your personal reflections.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Active / Archived Tab Selector */}
          <div className="bg-stone-900 border border-stone-800 p-1 rounded-xl flex items-center gap-1">
            <button
              onClick={() => setShowArchivedTab(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                !showArchivedTab
                  ? 'bg-stone-800 text-amber-400 shadow-inner'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setShowArchivedTab(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                showArchivedTab
                  ? 'bg-stone-800 text-amber-400 shadow-inner'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Archived ({archivedCount})
            </button>
          </div>

          <button
            onClick={onNewJournal}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-xl text-xs font-bold uppercase tracking-wider transition active:scale-95 shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="hidden sm:inline">New Journal</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-4 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Search Input */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, AI summary, #tag, or category..."
              className="w-full pl-10 pr-4 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-xs focus:outline-none focus:border-amber-500/60 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-500 hover:text-stone-300"
              >
                Clear
              </button>
            )}
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-stone-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 text-xs focus:outline-none focus:border-amber-500/60"
            >
              <option value="newest">Recently Updated</option>
              <option value="oldest">Oldest First</option>
              <option value="messages">Most Dialogue Messages</option>
              <option value="title">Title (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-stone-500 font-mono uppercase text-[10px] shrink-0 mr-1">
            Category:
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-xl shrink-0 font-medium transition border ${
                selectedCategory === cat
                  ? 'bg-amber-400/20 text-amber-300 border-amber-500/50'
                  : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Tag pills if any exist */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-stone-800/60 text-xs">
            <span className="text-stone-500 text-[11px] font-mono mr-1">Tags:</span>
            {allTags.map((t) => {
              const active = selectedTag === t;
              return (
                <button
                  key={t}
                  onClick={() => setSelectedTag(active ? null : t)}
                  className={`px-2.5 py-0.5 rounded-lg transition text-[11px] border ${
                    active
                      ? 'bg-stone-100 text-stone-950 border-stone-100 font-semibold'
                      : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200'
                  }`}
                >
                  #{t}
                </button>
              );
            })}
            {selectedTag && (
              <button
                onClick={() => setSelectedTag(null)}
                className="text-[11px] text-amber-400 hover:underline ml-2"
              >
                Reset tag filter
              </button>
            )}
          </div>
        )}
      </div>

      {/* Journals Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-stone-900 animate-pulse border border-stone-800" />
          ))}
        </div>
      ) : filteredJournals.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-stone-900/40 border border-stone-800 space-y-3">
          <BookOpen className="w-10 h-10 text-stone-600 mx-auto" />
          <h3 className="font-semibold text-stone-200">No journals found</h3>
          <p className="text-xs text-stone-400 max-w-sm mx-auto">
            {searchQuery || selectedCategory !== 'All' || selectedTag
              ? 'No reflections matched your search or filters. Try adjusting your query.'
              : showArchivedTab
              ? 'You have no archived journals.'
              : 'Start your first journal to begin exploring your thoughts with Gemini.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredJournals.map((j) => (
            <div
              key={j.id}
              className="bg-stone-900 border border-stone-800 hover:border-stone-700 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:shadow-xl transition group relative"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-stone-950 text-amber-400 border border-stone-800 font-semibold">
                    {j.category}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-stone-500">
                    {j.mood && (
                      <span title={`Mood: ${j.mood}`}>
                        {MOODS.find((m) => m.type === j.mood)?.icon}
                      </span>
                    )}
                    <span className="text-[11px]">
                      {new Date(j.updatedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                <h3
                  onClick={() => onSelectJournal(j.id)}
                  className="font-serif text-lg font-bold text-stone-100 group-hover:text-amber-300 cursor-pointer transition line-clamp-1"
                >
                  {j.title}
                </h3>

                {j.summary ? (
                  <p className="text-xs text-stone-400 line-clamp-3 leading-relaxed">
                    {j.summary}
                  </p>
                ) : (
                  <p className="text-xs text-stone-500 italic">
                    {j.messageCount} messages recorded in this reflection.
                  </p>
                )}

                {j.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {j.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] px-2 py-0.5 rounded bg-stone-950 text-stone-400 border border-stone-800"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Card Footer Tools */}
              <div className="pt-3 border-t border-stone-800 flex items-center justify-between">
                <span className="text-xs text-stone-500 font-mono">
                  {j.messageCount} msgs
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onArchiveJournal(j.id, j.archived)}
                    className="p-1.5 text-stone-500 hover:text-stone-200 rounded-lg hover:bg-stone-800 transition"
                    title={j.archived ? 'Restore' : 'Archive'}
                  >
                    {j.archived ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => setDeletingJournalId(j.id)}
                    className="p-1.5 text-stone-500 hover:text-red-400 rounded-lg hover:bg-red-950/40 transition"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onSelectJournal(j.id)}
                    className="flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300 pl-2 group-hover:translate-x-0.5 transition"
                  >
                    <span>Open</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal for Deletion */}
      <ConfirmationModal
        isOpen={Boolean(deletingJournalId)}
        title="Delete Journal"
        message="Are you sure you want to delete this journal and all its conversation history? This cannot be undone."
        confirmLabel="Delete"
        isDestructive={true}
        onConfirm={() => {
          if (deletingJournalId) {
            onDeleteJournal(deletingJournalId);
            setDeletingJournalId(null);
          }
        }}
        onCancel={() => setDeletingJournalId(null)}
      />
    </div>
  );
};
