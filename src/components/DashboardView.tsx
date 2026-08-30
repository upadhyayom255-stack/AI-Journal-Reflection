import React, { useState } from 'react';
import { 
  Plus, 
  Sparkles, 
  BookOpen, 
  MessageSquare, 
  Target, 
  ArrowRight, 
  Calendar, 
  Smile, 
  Frown, 
  Meh, 
  Flame, 
  CheckCircle2, 
  Clock, 
  Tag, 
  Folder,
  Lightbulb
} from 'lucide-react';
import { useAuth } from '../lib/authContext';
import { JournalEntry, GoalItem, MoodType, JournalCategory, ViewMode } from '../types';

interface DashboardViewProps {
  journals: JournalEntry[];
  goals: GoalItem[];
  loading: boolean;
  onNavigate: (view: ViewMode) => void;
  onSelectJournal: (journalId: string) => void;
  onQuickStartPrompt: (prompt: string, category: JournalCategory, mood?: MoodType) => void;
  onOpenGoalModal: () => void;
  onToggleTask: (goalId: string, taskId: string) => void;
}

const QUICK_PROMPTS = [
  {
    title: 'Career Direction',
    category: 'Career' as JournalCategory,
    prompt: "I'm thinking about my career path and where I want to grow over the next 6 months. Here is what I'm weighing...",
    color: 'border-blue-900/40 bg-blue-950/20 text-blue-300',
  },
  {
    title: 'Overcoming a Blocker',
    category: 'Projects' as JournalCategory,
    prompt: "I've been feeling stuck on a challenging problem today. Here is the context and what seems to be blocking progress...",
    color: 'border-purple-900/40 bg-purple-950/20 text-purple-300',
  },
  {
    title: 'Daily Reflection & Wins',
    category: 'Daily Journal' as JournalCategory,
    prompt: "Reflecting on today: What went well, what felt energizing, and what do I want to improve tomorrow?",
    color: 'border-emerald-900/40 bg-emerald-950/20 text-emerald-300',
  },
  {
    title: 'New Idea Brainstorm',
    category: 'Ideas' as JournalCategory,
    prompt: "I had a spark for a new project or approach. Help me stress-test the concept, identify blindspots, and outline MVP steps:",
    color: 'border-amber-900/40 bg-amber-950/20 text-amber-300',
  },
];

const MOODS: { type: MoodType; label: string; icon: string; color: string }[] = [
  { type: 'great', label: 'Great', icon: '✨', color: 'bg-emerald-950 text-emerald-300 border-emerald-800' },
  { type: 'good', label: 'Good', icon: '😊', color: 'bg-teal-950 text-teal-300 border-teal-800' },
  { type: 'okay', label: 'Okay', icon: '😐', color: 'bg-stone-800 text-stone-300 border-stone-700' },
  { type: 'difficult', label: 'Difficult', icon: '🌧️', color: 'bg-amber-950 text-amber-300 border-amber-800' },
  { type: 'low', label: 'Low', icon: '📉', color: 'bg-rose-950 text-rose-300 border-rose-800' },
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  journals,
  goals,
  loading,
  onNavigate,
  onSelectJournal,
  onQuickStartPrompt,
  onOpenGoalModal,
  onToggleTask,
}) => {
  const { userProfile, user } = useAuth();
  const [selectedMood, setSelectedMood] = useState<MoodType | undefined>('good');
  const [quickInput, setQuickInput] = useState('');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = userProfile?.displayName || user?.displayName || 'there';
  const firstName = displayName.split(' ')[0];

  const activeJournals = journals.filter((j) => !j.archived);
  const totalMessages = journals.reduce((acc, j) => acc + (j.messageCount || 0), 0);
  const completedGoals = goals.filter((g) => g.status === 'Completed').length;

  const handleStartCustomJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    onQuickStartPrompt(quickInput.trim(), 'Daily Journal', selectedMood);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Top Banner / Welcome Greeting */}
      <section className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-amber-400 font-semibold mb-1">
                Personal Reflection Sanctuary
              </p>
              <h1 className="font-serif text-2xl sm:text-4xl font-bold text-stone-100">
                {getGreeting()}, {firstName} 👋
              </h1>
              <p className="text-stone-400 text-sm sm:text-base mt-1">
                What would you like to reflect on today?
              </p>
            </div>

            {/* Quick Mood Selector */}
            <div className="bg-stone-950/80 border border-stone-800/80 p-2.5 rounded-2xl flex items-center gap-1.5 self-start sm:self-auto">
              <span className="text-xs text-stone-400 font-medium px-2 hidden sm:inline">
                Current State:
              </span>
              {MOODS.map((m) => (
                <button
                  key={m.type}
                  onClick={() => setSelectedMood(m.type)}
                  title={m.label}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition border ${
                    selectedMood === m.type
                      ? m.color + ' ring-1 ring-amber-400/40 shadow-sm'
                      : 'border-transparent text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
                  }`}
                >
                  <span>{m.icon}</span>
                  <span className="text-[11px]">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Reflection Prompt Input */}
          <form onSubmit={handleStartCustomJournal} className="pt-2">
            <div className="flex flex-col sm:flex-row gap-2 bg-stone-950 border border-stone-800 rounded-2xl p-2 focus-within:border-amber-500/60 transition">
              <input
                type="text"
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                placeholder="What's on your mind? (e.g., career decisions, learning recap, personal goal...)"
                className="flex-1 px-4 py-2.5 bg-transparent text-stone-100 text-sm placeholder:text-stone-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!quickInput.trim()}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:pointer-events-none text-stone-950 rounded-xl text-xs font-bold uppercase tracking-wider transition active:scale-95"
              >
                <Sparkles className="w-4 h-4 fill-stone-950" />
                <span>Begin Journal</span>
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Stats Counter Bar */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-stone-900/80 border border-stone-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/20 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-stone-100">{activeJournals.length}</p>
            <p className="text-xs text-stone-400">Journal Sessions</p>
          </div>
        </div>

        <div className="bg-stone-900/80 border border-stone-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-stone-100">{totalMessages}</p>
            <p className="text-xs text-stone-400">AI Dialogue Exchanges</p>
          </div>
        </div>

        <div className="bg-stone-900/80 border border-stone-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-400/10 text-blue-400 border border-blue-400/20 flex items-center justify-center shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-stone-100">{goals.length}</p>
            <p className="text-xs text-stone-400">
              Active Goals ({completedGoals} Done)
            </p>
          </div>
        </div>

        <div className="bg-stone-900/80 border border-stone-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-400/10 text-purple-400 border border-purple-400/20 flex items-center justify-center shrink-0">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-stone-100">
              {journals.filter((j) => j.summary).length}
            </p>
            <p className="text-xs text-stone-400">Synthesized Summaries</p>
          </div>
        </div>
      </section>

      {/* Quick Start Prompt Cards */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold text-stone-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Guided Reflection Starters</span>
          </h2>
          <span className="text-xs text-stone-500">Click to explore with Gemini</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_PROMPTS.map((item, idx) => (
            <button
              key={idx}
              onClick={() => onQuickStartPrompt(item.prompt, item.category, selectedMood)}
              className={`text-left p-4 rounded-2xl border ${item.color} hover:brightness-110 transition-all flex flex-col justify-between h-36 group`}
            >
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider block opacity-75">
                  {item.category}
                </span>
                <h3 className="font-semibold text-stone-100 text-sm mt-1 group-hover:text-amber-200 transition">
                  {item.title}
                </h3>
              </div>
              <div className="flex items-center justify-between text-xs opacity-80 pt-2">
                <span className="truncate max-w-[160px] text-stone-400">Start reflection</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Main Split: Recent Journals & Active Goals Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Journals (2 cols) */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold text-stone-100 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-400" />
              <span>Recent Journals</span>
            </h2>
            <button
              onClick={() => onNavigate('history')}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition"
            >
              <span>View all ({activeJournals.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-2xl bg-stone-900/60 animate-pulse border border-stone-800/50" />
              ))}
            </div>
          ) : activeJournals.length === 0 ? (
            <div className="p-8 rounded-3xl bg-stone-900/40 border border-stone-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-stone-800 text-amber-400 flex items-center justify-center mx-auto">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-stone-200">No journals yet</h3>
              <p className="text-xs text-stone-400 max-w-sm mx-auto leading-relaxed">
                Start your first reflection and let Gemini help you explore and organize your thoughts.
              </p>
              <button
                onClick={() => onNavigate('journal-new')}
                className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-semibold text-xs rounded-xl inline-flex items-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Create Your First Journal</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {activeJournals.slice(0, 5).map((journal) => (
                <div
                  key={journal.id}
                  onClick={() => onSelectJournal(journal.id)}
                  className="p-4 rounded-2xl bg-stone-900 border border-stone-800 hover:border-stone-700 hover:bg-stone-850 cursor-pointer transition flex items-start justify-between gap-4 group"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-stone-800 text-amber-400 font-semibold">
                        {journal.category}
                      </span>
                      {journal.mood && (
                        <span className="text-xs" title={`Mood: ${journal.mood}`}>
                          {MOODS.find((m) => m.type === journal.mood)?.icon}
                        </span>
                      )}
                      <span className="text-[11px] text-stone-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(journal.updatedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    <h3 className="font-semibold text-stone-100 text-sm group-hover:text-amber-300 transition truncate">
                      {journal.title}
                    </h3>

                    {journal.summary ? (
                      <p className="text-xs text-stone-400 line-clamp-1 leading-relaxed">
                        {journal.summary}
                      </p>
                    ) : (
                      <p className="text-xs text-stone-500 italic">
                        {journal.messageCount} messages in reflection
                      </p>
                    )}

                    {journal.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {journal.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] px-2 py-0.5 rounded bg-stone-950 text-stone-400 border border-stone-800"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-center shrink-0">
                    <span className="text-xs text-stone-500 font-mono">
                      {journal.messageCount} msgs
                    </span>
                    <ArrowRight className="w-4 h-4 text-stone-600 group-hover:text-stone-300 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Active Goals Preview (1 col) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold text-stone-100 flex items-center gap-2">
              <Target className="w-5 h-5 text-amber-400" />
              <span>Action Goals</span>
            </h2>
            <button
              onClick={onOpenGoalModal}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Goal</span>
            </button>
          </div>

          {goals.length === 0 ? (
            <div className="p-6 rounded-3xl bg-stone-900/40 border border-stone-800 text-center space-y-2.5">
              <p className="text-xs text-stone-400">
                Ask Gemini in any journal to transform your reflections into concrete action steps.
              </p>
              <button
                onClick={onOpenGoalModal}
                className="text-xs text-amber-400 hover:underline font-semibold"
              >
                + Create custom goal
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {goals.slice(0, 4).map((goal) => {
                const totalTasks = goal.tasks.length;
                const completedCount = goal.tasks.filter((t) => t.completed).length;
                const pct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

                return (
                  <div
                    key={goal.id}
                    className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 block">
                          {goal.category || 'Goal'}
                        </span>
                        <h4 className="text-sm font-semibold text-stone-100 truncate">
                          {goal.title}
                        </h4>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          goal.status === 'Completed'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : goal.status === 'In Progress'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-stone-800 text-stone-400'
                        }`}
                      >
                        {goal.status}
                      </span>
                    </div>

                    {totalTasks > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[11px] text-stone-400">
                          <span>Progress</span>
                          <span>{pct}% ({completedCount}/{totalTasks})</span>
                        </div>
                        <div className="w-full h-1.5 bg-stone-950 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        {/* First 2 subtasks with direct toggle */}
                        <div className="space-y-1 pt-1">
                          {goal.tasks.slice(0, 2).map((t) => (
                            <button
                              key={t.id}
                              onClick={() => onToggleTask(goal.id, t.id)}
                              className="w-full flex items-center gap-2 text-left text-xs text-stone-300 hover:text-stone-100 group"
                            >
                              <div
                                className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                                  t.completed
                                    ? 'bg-amber-400 border-amber-400 text-stone-950'
                                    : 'border-stone-700 bg-stone-950 group-hover:border-amber-400'
                                }`}
                              >
                                {t.completed && <CheckCircle2 className="w-3 h-3" />}
                              </div>
                              <span className={`truncate ${t.completed ? 'line-through text-stone-500' : ''}`}>
                                {t.text}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              <button
                onClick={() => onNavigate('goals')}
                className="w-full py-2.5 text-center text-xs font-semibold text-stone-400 hover:text-stone-200 bg-stone-900/50 hover:bg-stone-900 border border-stone-800/60 rounded-xl transition"
              >
                Manage All Goals &rarr;
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
