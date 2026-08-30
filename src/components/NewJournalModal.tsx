import React, { useState } from 'react';
import { Sparkles, X, Plus, BookOpen } from 'lucide-react';
import { JournalCategory, MoodType } from '../types';

interface NewJournalModalProps {
  isOpen: boolean;
  initialPrompt?: string;
  initialCategory?: JournalCategory;
  initialMood?: MoodType;
  onCreate: (params: {
    title: string;
    category: JournalCategory;
    tags: string[];
    mood?: MoodType;
    initialPrompt?: string;
  }) => Promise<void>;
  onClose: () => void;
}

const CATEGORIES: JournalCategory[] = [
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

export const NewJournalModal: React.FC<NewJournalModalProps> = ({
  isOpen,
  initialPrompt = '',
  initialCategory = 'Daily Journal',
  initialMood = 'good',
  onCreate,
  onClose,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<JournalCategory>(initialCategory);
  const [mood, setMood] = useState<MoodType | undefined>(initialMood);
  const [prompt, setPrompt] = useState(initialPrompt);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAddTag = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = tagInput.trim().replace(/^#/, '').toLowerCase();
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (t: string) => {
    setTags(tags.filter((tag) => tag !== t));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const computedTitle = title.trim() || prompt.slice(0, 45).trim() || 'Daily Reflection';
      await onCreate({
        title: computedTitle,
        category,
        tags,
        mood,
        initialPrompt: prompt.trim() || undefined,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-stone-900 border border-stone-800 text-stone-100 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-900">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-stone-100 text-lg">New Reflection Session</h3>
              <p className="text-xs text-stone-400">Set the theme and mood for your dialogue</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-200 p-1.5 rounded-lg hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
              Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Career Transition Strategy &amp; Next Steps"
              className="w-full px-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm focus:outline-none focus:border-amber-500/60 transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as JournalCategory)}
                className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-200 text-sm focus:outline-none focus:border-amber-500/60"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
                Current Mood State
              </label>
              <div className="flex items-center gap-1 bg-stone-950 border border-stone-800 rounded-xl p-1">
                {MOODS.map((m) => (
                  <button
                    key={m.type}
                    type="button"
                    onClick={() => setMood(m.type)}
                    title={m.label}
                    className={`flex-1 py-1.5 rounded-lg text-sm transition flex items-center justify-center ${
                      mood === m.type
                        ? 'bg-amber-400/20 text-amber-300 ring-1 ring-amber-400/50'
                        : 'text-stone-500 hover:text-stone-300 hover:bg-stone-850'
                    }`}
                  >
                    {m.icon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
              Opening Thought / Reflection Prompt
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="What are you processing right now? (You can also leave this blank and start typing in the chat)"
              className="w-full px-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm focus:outline-none focus:border-amber-500/60 transition resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
              Tags
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-stone-950 border border-stone-800 text-stone-400 text-xs"
                >
                  <span>#{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="e.g. cybersecurity, mindset..."
                className="flex-1 px-3 py-1.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-xs focus:outline-none focus:border-amber-500/60"
              />
              <button
                type="button"
                onClick={() => handleAddTag()}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-medium transition"
              >
                Add
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-stone-300 hover:text-stone-100 bg-stone-800 hover:bg-stone-700/80 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-xl transition shadow-md flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 fill-stone-950" />
              <span>{loading ? 'Creating...' : 'Start Reflection'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
