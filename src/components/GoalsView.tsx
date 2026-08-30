import React, { useState } from 'react';
import { 
  Target, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Calendar, 
  Trash2, 
  Edit3, 
  CheckSquare, 
  Folder,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { GoalItem, JournalCategory } from '../types';
import { ConfirmationModal } from './ConfirmationModal';
import { GoalModal } from './GoalModal';

interface GoalsViewProps {
  goals: GoalItem[];
  loading: boolean;
  onSaveGoal: (goal: {
    title: string;
    description: string;
    tasks: { text: string; completed?: boolean }[];
    category?: JournalCategory;
    targetDate?: string;
    status?: 'Not Started' | 'In Progress' | 'Completed';
  }) => Promise<void>;
  onUpdateGoal: (goalId: string, updates: Partial<GoalItem>) => Promise<void>;
  onDeleteGoal: (goalId: string) => Promise<void>;
  onToggleTask: (goalId: string, taskId: string) => void;
  onShowToast: (type: 'success' | 'error' | 'info', text: string) => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  goals,
  loading,
  onSaveGoal,
  onUpdateGoal,
  onDeleteGoal,
  onToggleTask,
  onShowToast,
}) => {
  const [filterStatus, setFilterStatus] = useState<'All' | 'Not Started' | 'In Progress' | 'Completed'>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalItem | undefined>(undefined);
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);

  const filteredGoals = goals.filter((g) => {
    if (filterStatus !== 'All' && g.status !== filterStatus) return false;
    if (selectedCategory !== 'All' && g.category !== selectedCategory) return false;
    return true;
  });

  const handleStatusChange = async (goal: GoalItem, newStatus: 'Not Started' | 'In Progress' | 'Completed') => {
    try {
      await onUpdateGoal(goal.id, { status: newStatus });
      onShowToast('success', `Goal marked as ${newStatus}`);
    } catch (err) {
      onShowToast('error', 'Failed to update goal status');
    }
  };

  const completedCount = goals.filter((g) => g.status === 'Completed').length;
  const inProgressCount = goals.filter((g) => g.status === 'In Progress').length;
  const notStartedCount = goals.filter((g) => g.status === 'Not Started').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-100 flex items-center gap-2.5">
            <Target className="w-6 h-6 text-amber-400" />
            <span>Goal &amp; Action Tracker</span>
          </h1>
          <p className="text-sm text-stone-400 mt-1">
            Turn your journaling insights and reflections into tangible achievements.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingGoal(undefined);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-xl text-xs font-bold uppercase tracking-wider transition active:scale-95 shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add Custom Goal</span>
        </button>
      </div>

      {/* Overview Metric Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-stone-900 border border-stone-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-stone-500">In Progress</p>
            <p className="text-2xl font-bold text-amber-400 mt-0.5">{inProgressCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-stone-900 border border-stone-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-stone-500">Completed</p>
            <p className="text-2xl font-bold text-emerald-400 mt-0.5">{completedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-400/10 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-stone-900 border border-stone-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-stone-500">Not Started</p>
            <p className="text-2xl font-bold text-stone-300 mt-0.5">{notStartedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-stone-800 text-stone-400 flex items-center justify-center">
            <Circle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-800 pb-3 text-xs overflow-x-auto">
        {(['All', 'In Progress', 'Not Started', 'Completed'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition ${
              filterStatus === status
                ? 'bg-amber-400/20 text-amber-300 border border-amber-500/40'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Goals Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 rounded-2xl bg-stone-900 animate-pulse border border-stone-800" />
          ))}
        </div>
      ) : filteredGoals.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-stone-900/40 border border-stone-800 space-y-3">
          <Target className="w-10 h-10 text-stone-600 mx-auto" />
          <h3 className="font-semibold text-stone-200">No goals found</h3>
          <p className="text-xs text-stone-400 max-w-sm mx-auto">
            {filterStatus !== 'All'
              ? `No goals found with status "${filterStatus}".`
              : 'Ask Gemini in any journal chat to generate goals, or create your first custom goal above.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredGoals.map((goal) => {
            const total = goal.tasks.length;
            const completed = goal.tasks.filter((t) => t.completed).length;
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

            return (
              <div
                key={goal.id}
                className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-4 hover:border-stone-700 transition flex flex-col justify-between shadow-lg"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-semibold px-2 py-0.5 rounded bg-stone-950 border border-stone-800 inline-block mb-1">
                        {goal.category || 'General'}
                      </span>
                      <h3 className="font-serif text-lg font-bold text-stone-100">
                        {goal.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <select
                        value={goal.status}
                        onChange={(e) => handleStatusChange(goal, e.target.value as any)}
                        className={`text-xs px-2.5 py-1 rounded-xl font-medium border focus:outline-none ${
                          goal.status === 'Completed'
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                            : goal.status === 'In Progress'
                            ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                            : 'bg-stone-950 text-stone-400 border-stone-800'
                        }`}
                      >
                        <option value="Not Started">Not Started</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  </div>

                  {goal.description && (
                    <p className="text-xs text-stone-300 leading-relaxed">
                      {goal.description}
                    </p>
                  )}

                  {/* Progress bar */}
                  {total > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-[11px] text-stone-400">
                        <span>Checklist Progress</span>
                        <span className="font-mono">{pct}% ({completed}/{total})</span>
                      </div>
                      <div className="w-full h-1.5 bg-stone-950 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 rounded-full ${
                            pct === 100 ? 'bg-emerald-400' : 'bg-amber-400'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Action Steps Checklist */}
                  {total > 0 && (
                    <div className="space-y-2 pt-2">
                      {goal.tasks.map((task) => (
                        <div
                          key={task.id}
                          onClick={() => onToggleTask(goal.id, task.id)}
                          className="flex items-center gap-2.5 p-2 rounded-xl bg-stone-950 border border-stone-800/80 hover:border-stone-700 cursor-pointer transition text-xs"
                        >
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                              task.completed
                                ? 'bg-amber-400 border-amber-400 text-stone-950'
                                : 'border-stone-700 bg-stone-900'
                            }`}
                          >
                            {task.completed && <CheckSquare className="w-3.5 h-3.5" />}
                          </div>
                          <span
                            className={`flex-1 ${
                              task.completed ? 'line-through text-stone-500' : 'text-stone-200'
                            }`}
                          >
                            {task.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Tools */}
                <div className="pt-3 border-t border-stone-800 flex items-center justify-between text-xs text-stone-500">
                  <div className="flex items-center gap-2">
                    {goal.targetDate && (
                      <span className="flex items-center gap-1 text-[11px] text-amber-400/80">
                        <Calendar className="w-3.5 h-3.5" />
                        Target: {goal.targetDate}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingGoal(goal);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 text-stone-400 hover:text-stone-200 rounded-lg hover:bg-stone-800 transition"
                      title="Edit Goal"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingGoalId(goal.id)}
                      className="p-1.5 text-stone-400 hover:text-red-400 rounded-lg hover:bg-red-950/40 transition"
                      title="Delete Goal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Goal Modal */}
      <GoalModal
        isOpen={isModalOpen}
        initialData={editingGoal}
        onSave={async (goalData) => {
          const formattedTasks = (goalData.tasks || []).map((t, idx) => ({
            id: (t as any).id || `task_${Date.now()}_${idx}`,
            text: t.text,
            completed: !!t.completed,
          }));

          if (editingGoal) {
            await onUpdateGoal(editingGoal.id, {
              ...goalData,
              tasks: formattedTasks,
            });
            onShowToast('success', 'Goal updated');
          } else {
            await onSaveGoal(goalData);
            onShowToast('success', 'Goal created');
          }
        }}
        onClose={() => {
          setIsModalOpen(false);
          setEditingGoal(undefined);
        }}
      />

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={Boolean(deletingGoalId)}
        title="Delete Goal"
        message="Are you sure you want to delete this goal and its checklist?"
        confirmLabel="Delete"
        isDestructive={true}
        onConfirm={async () => {
          if (deletingGoalId) {
            await onDeleteGoal(deletingGoalId);
            setDeletingGoalId(null);
            onShowToast('info', 'Goal deleted');
          }
        }}
        onCancel={() => setDeletingGoalId(null)}
      />
    </div>
  );
};
