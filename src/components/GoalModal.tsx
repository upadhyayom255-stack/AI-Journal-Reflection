import React, { useState, useEffect } from 'react';
import { Target, Plus, Trash2, X, Calendar, CheckSquare } from 'lucide-react';
import { GoalItem, JournalCategory } from '../types';

interface GoalModalProps {
  isOpen: boolean;
  initialData?: Partial<GoalItem>;
  journalId?: string;
  onSave: (goal: {
    title: string;
    description: string;
    tasks: { text: string; completed?: boolean }[];
    category?: JournalCategory;
    targetDate?: string;
    status?: 'Not Started' | 'In Progress' | 'Completed';
  }) => Promise<void>;
  onClose: () => void;
}

const CATEGORIES: JournalCategory[] = [
  'Goals',
  'Career',
  'Study',
  'Projects',
  'Daily Journal',
  'Reflection',
  'Ideas',
  'General',
];

export const GoalModal: React.FC<GoalModalProps> = ({
  isOpen,
  initialData,
  journalId,
  onSave,
  onClose,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tasks, setTasks] = useState<{ id?: string; text: string; completed?: boolean }[]>([]);
  const [newTaskInput, setNewTaskInput] = useState('');
  const [category, setCategory] = useState<JournalCategory>('Goals');
  const [status, setStatus] = useState<'Not Started' | 'In Progress' | 'Completed'>('Not Started');
  const [targetDate, setTargetDate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setTasks(initialData.tasks ? [...initialData.tasks] : []);
      setCategory(initialData.category || 'Goals');
      setStatus(initialData.status || 'Not Started');
      setTargetDate(initialData.targetDate || '');
    } else {
      setTitle('');
      setDescription('');
      setTasks([]);
      setCategory('Goals');
      setStatus('Not Started');
      setTargetDate('');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleAddTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTaskInput.trim()) return;
    setTasks([...tasks, { text: newTaskInput.trim(), completed: false }]);
    setNewTaskInput('');
  };

  const handleRemoveTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        tasks: tasks.map(t => ({ text: t.text, completed: Boolean(t.completed) })),
        category,
        targetDate: targetDate || undefined,
        status,
      });
      onClose();
    } catch (err) {
      console.error('Failed to save goal:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-stone-900 border border-stone-800 text-stone-100 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-100 text-lg">
                {initialData?.title ? 'Edit Goal' : 'Add New Goal'}
              </h3>
              <p className="text-xs text-stone-400">Turn reflections into concrete milestones</p>
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
              Goal Title <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Build cybersecurity lab & master Linux permissions"
              className="w-full px-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition"
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
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
                Target Date (Optional)
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-200 text-sm focus:outline-none focus:border-amber-500/60"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
              Description & Context
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why this goal matters and what success looks like..."
              className="w-full px-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition resize-none"
            />
          </div>

          {/* Actionable Subtasks */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
              Action Steps / Tasks ({tasks.length})
            </label>
            
            <div className="space-y-2 mb-3">
              {tasks.map((task, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-stone-950 border border-stone-800/80 group"
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <CheckSquare className="w-4 h-4 text-amber-500/70 shrink-0" />
                    <span className="text-sm text-stone-200 truncate">{task.text}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveTask(idx)}
                    className="text-stone-500 hover:text-red-400 p-1 rounded transition opacity-80 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newTaskInput}
                onChange={(e) => setNewTaskInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTask();
                  }
                }}
                placeholder="Add a concrete action step..."
                className="flex-1 px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm focus:outline-none focus:border-amber-500/60"
              />
              <button
                type="button"
                onClick={() => handleAddTask()}
                className="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-sm font-medium transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
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
              disabled={saving || !title.trim()}
              className="px-5 py-2 text-sm font-medium text-stone-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:pointer-events-none rounded-xl transition font-semibold shadow-sm"
            >
              {saving ? 'Saving...' : initialData?.title ? 'Update Goal' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
