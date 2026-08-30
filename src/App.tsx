/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './lib/authContext';
import { 
  getJournals, 
  getJournal, 
  createJournal, 
  deleteJournal, 
  archiveJournal,
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  getInsights,
  deleteInsight,
} from './lib/firestoreService';
import { JournalEntry, GoalItem, InsightItem, ViewMode, JournalCategory, MoodType } from './types';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { DashboardView } from './components/DashboardView';
import { JournalChatView } from './components/JournalChatView';
import { HistoryView } from './components/HistoryView';
import { GoalsView } from './components/GoalsView';
import { InsightsView } from './components/InsightsView';
import { SettingsView } from './components/SettingsView';
import { NewJournalModal } from './components/NewJournalModal';
import { GoalModal } from './components/GoalModal';
import { ToastContainer, ToastMessage } from './components/Toast';

const AppContent: React.FC = () => {
  const { user, loading: authLoading } = useAuth();

  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [selectedJournalId, setSelectedJournalId] = useState<string | null>(null);

  // Data state
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Modals & Toasts
  const [isNewJournalModalOpen, setIsNewJournalModalOpen] = useState(false);
  const [newJournalInitialData, setNewJournalInitialData] = useState<{
    prompt?: string;
    category?: JournalCategory;
    mood?: MoodType;
  }>({});
  const [isCustomGoalModalOpen, setIsCustomGoalModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast dispatch
  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load user data on auth
  useEffect(() => {
    let isMounted = true;
    const loadAllUserData = async () => {
      if (!user) {
        setJournals([]);
        setGoals([]);
        setInsights([]);
        return;
      }

      setDataLoading(true);
      try {
        const [loadedJournals, loadedGoals, loadedInsights] = await Promise.all([
          getJournals(user.uid, { includeArchived: true }),
          getGoals(user.uid),
          getInsights(user.uid),
        ]);

        if (isMounted) {
          setJournals(loadedJournals);
          setGoals(loadedGoals);
          setInsights(loadedInsights);
        }
      } catch (err: any) {
        console.error('Error loading Firestore data:', err);
        showToast('error', 'Failed to synchronize with Firestore database');
      } finally {
        if (isMounted) setDataLoading(false);
      }
    };

    loadAllUserData();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Handle Quick Start Reflection from Dashboard
  const handleQuickStartPrompt = (prompt: string, category: JournalCategory, mood?: MoodType) => {
    setNewJournalInitialData({ prompt, category, mood });
    setIsNewJournalModalOpen(true);
  };

  // Create new journal handler
  const handleCreateJournal = async (params: {
    title: string;
    category: JournalCategory;
    tags: string[];
    mood?: MoodType;
    initialPrompt?: string;
  }) => {
    if (!user) return;
    try {
      const { journalId, journal } = await createJournal(user.uid, params);
      setJournals((prev) => [journal, ...prev]);
      setSelectedJournalId(journalId);
      setCurrentView('journal-chat');
      showToast('success', 'New reflection created!');
    } catch (err: any) {
      console.error(err);
      showToast('error', 'Failed to create journal');
    }
  };

  // Select existing journal
  const handleSelectJournal = (journalId: string) => {
    setSelectedJournalId(journalId);
    setCurrentView('journal-chat');
  };

  // Archive / Restore journal
  const handleArchiveJournal = async (journalId: string, currentArchived: boolean) => {
    if (!user) return;
    const nextStatus = !currentArchived;
    try {
      await archiveJournal(user.uid, journalId, nextStatus);
      setJournals((prev) =>
        prev.map((j) => (j.id === journalId ? { ...j, archived: nextStatus } : j))
      );
      showToast('success', nextStatus ? 'Journal archived' : 'Journal restored');
    } catch (err) {
      showToast('error', 'Failed to update archive status');
    }
  };

  // Delete journal
  const handleDeleteJournal = async (journalId: string) => {
    if (!user) return;
    try {
      await deleteJournal(user.uid, journalId);
      setJournals((prev) => prev.filter((j) => j.id !== journalId));
      if (selectedJournalId === journalId) {
        setSelectedJournalId(null);
        setCurrentView('dashboard');
      }
      showToast('info', 'Journal permanently deleted');
    } catch (err) {
      showToast('error', 'Failed to delete journal');
    }
  };

  // Update in-memory journal entry
  const handleJournalUpdated = (updates: Partial<JournalEntry>) => {
    if (!selectedJournalId) return;
    setJournals((prev) =>
      prev.map((j) => (j.id === selectedJournalId ? { ...j, ...updates } : j))
    );
  };

  // Goal handlers
  const handleSaveGoal = async (goalData: {
    title: string;
    description: string;
    tasks: { text: string; completed?: boolean }[];
    category?: JournalCategory;
    targetDate?: string;
    status?: 'Not Started' | 'In Progress' | 'Completed';
  }) => {
    if (!user) return;
    try {
      const created = await createGoal(user.uid, goalData);
      setGoals((prev) => [created, ...prev]);
      showToast('success', 'Goal added to tracker');
    } catch (err) {
      showToast('error', 'Failed to save goal');
    }
  };

  const handleUpdateGoal = async (goalId: string, updates: Partial<GoalItem>) => {
    if (!user) return;
    try {
      await updateGoal(user.uid, goalId, updates);
      setGoals((prev) => prev.map((g) => (g.id === goalId ? { ...g, ...updates } : g)));
    } catch (err) {
      showToast('error', 'Failed to update goal');
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!user) return;
    try {
      await deleteGoal(user.uid, goalId);
      setGoals((prev) => prev.filter((g) => g.id !== goalId));
      showToast('info', 'Goal deleted');
    } catch (err) {
      showToast('error', 'Failed to delete goal');
    }
  };

  const handleToggleTask = async (goalId: string, taskId: string) => {
    if (!user) return;
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;

    const updatedTasks = goal.tasks.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );

    const allCompleted = updatedTasks.length > 0 && updatedTasks.every((t) => t.completed);
    const newStatus = allCompleted ? 'Completed' : 'In Progress';

    setGoals((prev) =>
      prev.map((g) => (g.id === goalId ? { ...g, tasks: updatedTasks, status: newStatus } : g))
    );

    try {
      await updateGoal(user.uid, goalId, { tasks: updatedTasks, status: newStatus });
    } catch (err) {
      console.error(err);
    }
  };

  // Insight Handlers
  const handleDeleteInsight = async (insightId: string) => {
    if (!user) return;
    try {
      await deleteInsight(user.uid, insightId);
      setInsights((prev) => prev.filter((i) => i.id !== insightId));
      showToast('info', 'Insight deleted');
    } catch (err) {
      showToast('error', 'Failed to delete insight');
    }
  };

  // Loading state for initial auth check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center space-y-4 text-stone-100">
        <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 animate-pulse">
          <span className="w-4 h-4 rounded-full bg-amber-400"></span>
        </div>
        <p className="text-xs font-mono tracking-widest uppercase text-stone-400">
          Connecting to Secure Firebase Session...
        </p>
      </div>
    );
  }

  // Unauthenticated user -> Landing Page
  if (!user) {
    return (
      <>
        <LandingPage />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  const currentJournal = journals.find((j) => j.id === selectedJournalId);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col selection:bg-amber-400 selection:text-stone-950 font-sans">
      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => {
          if (view === 'journal-new') {
            setNewJournalInitialData({});
            setIsNewJournalModalOpen(true);
          } else {
            setCurrentView(view);
          }
        }}
        onNewJournal={() => {
          setNewJournalInitialData({});
          setIsNewJournalModalOpen(true);
        }}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {currentView === 'dashboard' && (
          <DashboardView
            journals={journals}
            goals={goals}
            loading={dataLoading}
            onNavigate={(view) => {
              if (view === 'journal-new') {
                setNewJournalInitialData({});
                setIsNewJournalModalOpen(true);
              } else {
                setCurrentView(view);
              }
            }}
            onSelectJournal={handleSelectJournal}
            onQuickStartPrompt={handleQuickStartPrompt}
            onOpenGoalModal={() => setIsCustomGoalModalOpen(true)}
            onToggleTask={handleToggleTask}
          />
        )}

        {currentView === 'journal-chat' && currentJournal && (
          <JournalChatView
            journal={currentJournal}
            onBack={() => setCurrentView('dashboard')}
            onJournalUpdated={handleJournalUpdated}
            onJournalDeleted={handleDeleteJournal}
            onShowToast={showToast}
          />
        )}

        {currentView === 'history' && (
          <HistoryView
            journals={journals}
            loading={dataLoading}
            onSelectJournal={handleSelectJournal}
            onNewJournal={() => {
              setNewJournalInitialData({});
              setIsNewJournalModalOpen(true);
            }}
            onArchiveJournal={handleArchiveJournal}
            onDeleteJournal={handleDeleteJournal}
            onShowToast={showToast}
          />
        )}

        {currentView === 'goals' && (
          <GoalsView
            goals={goals}
            loading={dataLoading}
            onSaveGoal={handleSaveGoal}
            onUpdateGoal={handleUpdateGoal}
            onDeleteGoal={handleDeleteGoal}
            onToggleTask={handleToggleTask}
            onShowToast={showToast}
          />
        )}

        {currentView === 'insights' && (
          <InsightsView
            journals={journals}
            goals={goals}
            insights={insights}
            loading={dataLoading}
            onDeleteInsight={handleDeleteInsight}
            onInsightAdded={(newInsight) => setInsights((prev) => [newInsight, ...prev])}
            onShowToast={showToast}
          />
        )}

        {currentView === 'settings' && (
          <SettingsView
            journals={journals}
            goals={goals}
            insights={insights}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* Global Modals */}
      <NewJournalModal
        isOpen={isNewJournalModalOpen}
        initialPrompt={newJournalInitialData.prompt}
        initialCategory={newJournalInitialData.category}
        initialMood={newJournalInitialData.mood}
        onCreate={handleCreateJournal}
        onClose={() => {
          setIsNewJournalModalOpen(false);
          setNewJournalInitialData({});
        }}
      />

      <GoalModal
        isOpen={isCustomGoalModalOpen}
        onSave={handleSaveGoal}
        onClose={() => setIsCustomGoalModalOpen(false)}
      />

      {/* Global Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
