import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Send, 
  Sparkles, 
  BookOpen, 
  Share2, 
  Download, 
  Trash2, 
  Archive, 
  ArchiveRestore, 
  Edit3, 
  Check, 
  X, 
  Plus, 
  Target, 
  Lightbulb, 
  HelpCircle, 
  Compass, 
  FileText, 
  ArrowLeft, 
  RotateCcw, 
  CheckCircle2,
  Copy,
  Tag as TagIcon,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Pause,
  Play,
  Square,
  Sliders,
  Maximize2
} from 'lucide-react';
import { useAuth } from '../lib/authContext';
import { sendChatMessage, executeAIAction } from '../lib/geminiClient';
import { 
  getJournalMessages, 
  addJournalMessage, 
  updateJournal, 
  deleteJournalMessage,
  createGoal,
  createInsight,
} from '../lib/firestoreService';
import { JournalEntry, JournalMessage, JournalCategory, MoodType, GoalItem } from '../types';
import { ConfirmationModal } from './ConfirmationModal';
import { GoalModal } from './GoalModal';
import { useVoiceAssistant } from '../lib/useVoiceAssistant';
import { VoiceStatusBar } from './VoiceStatusBar';
import { VoiceSettingsModal } from './VoiceSettingsModal';
import { VoiceReflectionRoom } from './VoiceReflectionRoom';

interface JournalChatViewProps {
  journal: JournalEntry;
  onBack: () => void;
  onJournalUpdated: (updated: Partial<JournalEntry>) => void;
  onJournalDeleted: (journalId: string) => void;
  onShowToast: (type: 'success' | 'error' | 'info', text: string) => void;
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

export const JournalChatView: React.FC<JournalChatViewProps> = ({
  journal,
  onBack,
  onJournalUpdated,
  onJournalDeleted,
  onShowToast,
}) => {
  const { user, getIdToken } = useAuth();
  const [messages, setMessages] = useState<JournalMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(journal.title);
  const [newTagInput, setNewTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);

  // Modals
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [suggestedGoal, setSuggestedGoal] = useState<Partial<GoalItem> | undefined>(undefined);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [showVoiceRoom, setShowVoiceRoom] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  // Handle transcribed speech submission
  const handleVoiceTranscriptSubmitted = useCallback(
    async (transcribedText: string) => {
      if (!user || !transcribedText.trim() || isGenerating) return;
      await processUserMessage(transcribedText.trim(), true);
    },
    [user, isGenerating, messages]
  );

  // Voice Assistant Hook
  const voice = useVoiceAssistant({
    onTranscriptSubmitted: handleVoiceTranscriptSubmitted,
  });

  // Process user text input or transcribed speech
  const processUserMessage = async (text: string, isFromVoice = false) => {
    if (!user || !text.trim() || isGenerating) return;

    try {
      // 1. Save user message to Firestore
      const userMsg = await addJournalMessage(user.uid, journal.id, {
        role: 'user',
        content: text,
        actionType: 'chat',
      });

      const updatedHistory = [...messages, userMsg];
      setMessages(updatedHistory);
      setIsGenerating(true);
      if (isFromVoice) {
        voice.setVoiceState('processing');
      }

      // 2. Call Gemini backend with history
      const res = await sendChatMessage(getIdToken, {
        prompt: text,
        history: updatedHistory.map((m) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content,
        })),
        actionType: 'chat',
      });

      // 3. Save assistant message to Firestore
      const aiMsg = await addJournalMessage(user.uid, journal.id, {
        role: 'assistant',
        content: res.text,
        actionType: 'chat',
      });

      setMessages([...updatedHistory, aiMsg]);
      onJournalUpdated({
        messageCount: updatedHistory.length + 1,
        updatedAt: new Date().toISOString(),
      });

      // 4. If voice was used or auto-speak is enabled, speak Gemini's response
      if (voice.settings.autoSpeak) {
        voice.speakText(res.text, aiMsg.id, () => {
          // If continuous conversation mode is enabled, restart microphone listening!
          if (voice.settings.continuousMode) {
            setTimeout(() => {
              voice.startListening();
            }, 400);
          }
        });
      } else if (isFromVoice) {
        voice.setVoiceState('idle');
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      onShowToast('error', err.message || 'Failed to send message');
      voice.setVoiceState('idle');
    } finally {
      setIsGenerating(false);
    }
  };

  // Load conversation messages from Firestore
  useEffect(() => {
    let isMounted = true;
    const fetchMessages = async () => {
      if (!user) return;
      setLoadingMessages(true);
      try {
        const history = await getJournalMessages(user.uid, journal.id);
        if (isMounted) {
          setMessages(history);

          // If there are initial user messages and no assistant reply yet, trigger initial reflection
          if (history.length === 1 && history[0].role === 'user') {
            handleGenerateReply(history);
          }
        }
      } catch (err: any) {
        console.error('Error fetching messages:', err);
        onShowToast('error', 'Failed to load conversation history');
      } finally {
        if (isMounted) setLoadingMessages(false);
      }
    };

    fetchMessages();
    return () => {
      isMounted = false;
    };
  }, [journal.id, user]);

  // Handle title update
  const handleSaveTitle = async () => {
    if (!user || !titleInput.trim()) return;
    try {
      await updateJournal(user.uid, journal.id, { title: titleInput.trim() });
      onJournalUpdated({ title: titleInput.trim() });
      setIsEditingTitle(false);
      onShowToast('success', 'Journal title updated');
    } catch (err) {
      console.error(err);
      onShowToast('error', 'Failed to update title');
    }
  };

  // Handle category update
  const handleCategoryChange = async (cat: JournalCategory) => {
    if (!user) return;
    try {
      await updateJournal(user.uid, journal.id, { category: cat });
      onJournalUpdated({ category: cat });
      onShowToast('success', `Category set to ${cat}`);
    } catch (err) {
      onShowToast('error', 'Failed to change category');
    }
  };

  // Handle mood update
  const handleMoodChange = async (m: MoodType) => {
    if (!user) return;
    try {
      await updateJournal(user.uid, journal.id, { mood: m });
      onJournalUpdated({ mood: m });
      onShowToast('success', 'Mood updated');
    } catch (err) {
      onShowToast('error', 'Failed to update mood');
    }
  };

  // Handle tag additions/removals
  const handleAddTag = async () => {
    if (!user || !newTagInput.trim()) return;
    const cleanTag = newTagInput.trim().replace(/^#/, '').toLowerCase();
    if (journal.tags.includes(cleanTag)) {
      setNewTagInput('');
      setIsAddingTag(false);
      return;
    }

    const updatedTags = [...journal.tags, cleanTag];
    try {
      await updateJournal(user.uid, journal.id, { tags: updatedTags });
      onJournalUpdated({ tags: updatedTags });
      setNewTagInput('');
      setIsAddingTag(false);
    } catch (err) {
      onShowToast('error', 'Failed to add tag');
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!user) return;
    const updatedTags = journal.tags.filter((t) => t !== tagToRemove);
    try {
      await updateJournal(user.uid, journal.id, { tags: updatedTags });
      onJournalUpdated({ tags: updatedTags });
    } catch (err) {
      onShowToast('error', 'Failed to remove tag');
    }
  };

  // Archive / Restore toggle
  const handleToggleArchive = async () => {
    if (!user) return;
    const newStatus = !journal.archived;
    try {
      await updateJournal(user.uid, journal.id, { archived: newStatus });
      onJournalUpdated({ archived: newStatus });
      onShowToast('success', newStatus ? 'Journal archived' : 'Journal restored to active');
    } catch (err) {
      onShowToast('error', 'Failed to update archive state');
    }
  };

  // Delete message
  const handleDeleteMessage = async (msgId: string) => {
    if (!user) return;
    try {
      await deleteJournalMessage(user.uid, journal.id, msgId);
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
      onShowToast('info', 'Message deleted');
    } catch (err) {
      onShowToast('error', 'Failed to delete message');
    }
  };

  // Send message from textarea
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user || !inputPrompt.trim() || isGenerating) return;

    const promptText = inputPrompt.trim();
    setInputPrompt('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    await processUserMessage(promptText, false);
  };

  // Trigger AI reflection on initial prompt
  const handleGenerateReply = async (history: JournalMessage[]) => {
    if (!user || isGenerating) return;
    setIsGenerating(true);
    try {
      const res = await sendChatMessage(getIdToken, {
        history: history.map((m) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content,
        })),
        actionType: 'chat',
      });

      const aiMsg = await addJournalMessage(user.uid, journal.id, {
        role: 'assistant',
        content: res.text,
        actionType: 'chat',
      });

      setMessages([...history, aiMsg]);

      if (voice.settings.autoSpeak) {
        voice.speakText(res.text, aiMsg.id);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Dedicated AI Action Buttons
  const handleRunAIAction = async (action: 'summarize' | 'reflect' | 'brainstorm' | 'insights' | 'goals') => {
    if (!user || messages.length === 0 || isGenerating) return;
    setActionInProgress(action);
    setIsGenerating(true);

    try {
      if (action === 'goals') {
        const res = await executeAIAction(getIdToken, {
          action: 'goals',
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          contextTitle: journal.title,
          category: journal.category,
        });

        if (res.goals && res.goals.length > 0) {
          const firstGoal = res.goals[0];
          setSuggestedGoal({
            title: firstGoal.title,
            description: firstGoal.description,
            tasks: (firstGoal.tasks || []).map((t: string, idx: number) => ({
              id: `task_${Date.now()}_${idx}`,
              text: t,
              completed: false,
            })),
            category: journal.category,
            journalId: journal.id,
          });
          setShowGoalModal(true);
          onShowToast('success', 'Goals extracted! Review and save to your goals tracker.');
        } else {
          onShowToast('info', 'No explicit goals detected yet. Write more details about your objectives.');
        }
      } else if (action === 'summarize') {
        const res = await executeAIAction(getIdToken, {
          action: 'summarize',
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          contextTitle: journal.title,
        });

        const summaryText = res.summary || '';
        await updateJournal(user.uid, journal.id, { summary: summaryText });
        onJournalUpdated({ summary: summaryText });

        const aiMsg = await addJournalMessage(user.uid, journal.id, {
          role: 'assistant',
          content: `## 📌 Reflection Summary\n\n${summaryText}`,
          actionType: 'summarize',
        });
        setMessages((prev) => [...prev, aiMsg]);
        onShowToast('success', 'Summary generated and saved to journal');

        if (voice.settings.autoSpeak) {
          voice.speakText(summaryText, aiMsg.id);
        }
      } else if (action === 'reflect') {
        const res = await executeAIAction(getIdToken, {
          action: 'reflect',
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          contextTitle: journal.title,
        });

        const aiMsg = await addJournalMessage(user.uid, journal.id, {
          role: 'assistant',
          content: res.reflection,
          actionType: 'reflect',
        });
        setMessages((prev) => [...prev, aiMsg]);
        onShowToast('success', 'Reflection questions generated');

        if (voice.settings.autoSpeak) {
          voice.speakText(res.reflection, aiMsg.id);
        }
      } else if (action === 'brainstorm') {
        const res = await executeAIAction(getIdToken, {
          action: 'brainstorm',
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          contextTitle: journal.title,
        });

        const aiMsg = await addJournalMessage(user.uid, journal.id, {
          role: 'assistant',
          content: res.brainstorm,
          actionType: 'brainstorm',
        });
        setMessages((prev) => [...prev, aiMsg]);
        onShowToast('success', 'Brainstorming ideas generated');

        if (voice.settings.autoSpeak) {
          voice.speakText(res.brainstorm, aiMsg.id);
        }
      } else if (action === 'insights') {
        const res = await executeAIAction(getIdToken, {
          action: 'insights',
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          contextTitle: journal.title,
        });

        const aiMsg = await addJournalMessage(user.uid, journal.id, {
          role: 'assistant',
          content: res.insights,
          actionType: 'insights',
        });
        setMessages((prev) => [...prev, aiMsg]);

        await createInsight(user.uid, {
          type: 'pattern',
          title: `Key Themes: ${journal.title}`,
          content: res.insights,
          journalId: journal.id,
        });

        onShowToast('success', 'Insights extracted and saved');

        if (voice.settings.autoSpeak) {
          voice.speakText(res.insights, aiMsg.id);
        }
      }
    } catch (err: any) {
      console.error('Action error:', err);
      onShowToast('error', err.message || `Failed to perform ${action}`);
    } finally {
      setIsGenerating(false);
      setActionInProgress(null);
    }
  };

  // Export functions (Markdown, TXT, JSON)
  const handleExport = (format: 'markdown' | 'txt' | 'json') => {
    const filename = `${journal.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${new Date().toISOString().slice(0, 10)}`;
    let content = '';
    let mimeType = 'text/plain';

    if (format === 'markdown') {
      mimeType = 'text/markdown';
      content = `# ${journal.title}\n\n`;
      content += `- **Category:** ${journal.category}\n`;
      content += `- **Date:** ${new Date(journal.createdAt).toLocaleString()}\n`;
      if (journal.mood) content += `- **Mood:** ${journal.mood}\n`;
      if (journal.tags.length > 0) content += `- **Tags:** #${journal.tags.join(' #')}\n`;
      if (journal.summary) content += `\n## Summary\n${journal.summary}\n`;
      content += `\n---\n\n## Conversation & Reflections\n\n`;

      messages.forEach((m) => {
        const sender = m.role === 'user' ? '👤 User' : '🤖 Gemini';
        content += `### ${sender} (${new Date(m.timestamp).toLocaleTimeString()})\n\n${m.content}\n\n`;
      });
    } else if (format === 'txt') {
      mimeType = 'text/plain';
      content = `JOURNAL: ${journal.title}\nCategory: ${journal.category}\nDate: ${new Date(journal.createdAt).toLocaleString()}\n\n`;
      messages.forEach((m) => {
        content += `[${m.role.toUpperCase()}]:\n${m.content}\n\n------------------------\n\n`;
      });
    } else if (format === 'json') {
      mimeType = 'application/json';
      content = JSON.stringify({ journal, messages }, null, 2);
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${format === 'markdown' ? 'md' : format}`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast('success', `Exported as ${format.toUpperCase()}`);
  };

  // Copy text helper
  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    onShowToast('info', 'Copied to clipboard');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-in fade-in duration-200">
      {/* Header bar */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-400 hover:text-stone-100 bg-stone-800/80 hover:bg-stone-800 px-3 py-1.5 rounded-xl transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </button>

          {/* Action Tools (Export, Voice Room, Archive, Delete) */}
          <div className="flex items-center gap-1.5">
            {/* Immersive Voice Room Trigger */}
            <button
              onClick={() => setShowVoiceRoom(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/25 rounded-xl text-xs font-semibold transition"
              title="Open Voice Reflection Room"
            >
              <Mic className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Voice Sanctuary</span>
            </button>

            {/* Export Dropdown */}
            <div className="relative group">
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-750 text-stone-300 hover:text-stone-100 rounded-xl text-xs font-medium transition"
                title="Export Journal"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export</span>
              </button>
              <div className="absolute right-0 mt-1 hidden group-hover:flex flex-col w-36 bg-stone-900 border border-stone-800 rounded-xl p-1 shadow-2xl z-30">
                <button
                  onClick={() => handleExport('markdown')}
                  className="px-3 py-1.5 text-left text-xs text-stone-300 hover:text-stone-100 hover:bg-stone-800 rounded-lg"
                >
                  Markdown (.md)
                </button>
                <button
                  onClick={() => handleExport('txt')}
                  className="px-3 py-1.5 text-left text-xs text-stone-300 hover:text-stone-100 hover:bg-stone-800 rounded-lg"
                >
                  Plain Text (.txt)
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="px-3 py-1.5 text-left text-xs text-stone-300 hover:text-stone-100 hover:bg-stone-800 rounded-lg"
                >
                  JSON (.json)
                </button>
              </div>
            </div>

            <button
              onClick={handleToggleArchive}
              className={`p-2 rounded-xl text-xs font-medium transition border ${
                journal.archived
                  ? 'bg-amber-950/60 text-amber-400 border-amber-800/60'
                  : 'bg-stone-800 hover:bg-stone-750 text-stone-400 hover:text-stone-200 border-stone-700/60'
              }`}
              title={journal.archived ? 'Restore from Archive' : 'Archive Journal'}
            >
              {journal.archived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 bg-stone-800 hover:bg-red-950/50 text-stone-400 hover:text-red-400 border border-stone-700/60 rounded-xl transition"
              title="Delete Journal"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Title & Category Row */}
        <div className="space-y-3 pt-1 border-t border-stone-800">
          <div className="flex items-center justify-between gap-3">
            {isEditingTitle ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle();
                    if (e.key === 'Escape') setIsEditingTitle(false);
                  }}
                  autoFocus
                  className="flex-1 px-3 py-1.5 bg-stone-950 border border-amber-500 rounded-xl text-stone-100 font-serif text-xl sm:text-2xl font-bold focus:outline-none"
                />
                <button
                  onClick={handleSaveTitle}
                  className="p-2 bg-amber-400 text-stone-950 rounded-xl hover:bg-amber-300"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                </button>
                <button
                  onClick={() => setIsEditingTitle(false)}
                  className="p-2 bg-stone-800 text-stone-400 rounded-xl hover:bg-stone-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group flex-1">
                <h1 className="font-serif text-xl sm:text-2xl md:text-3xl font-bold text-stone-100 tracking-tight">
                  {journal.title}
                </h1>
                <button
                  onClick={() => {
                    setTitleInput(journal.title);
                    setIsEditingTitle(true);
                  }}
                  className="text-stone-500 hover:text-amber-400 p-1 opacity-60 group-hover:opacity-100 transition"
                  title="Rename"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Metadata chips: Category, Mood, Tags */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Category Dropdown */}
            <select
              value={journal.category}
              onChange={(e) => handleCategoryChange(e.target.value as JournalCategory)}
              className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-1.5 text-stone-300 font-medium focus:outline-none focus:border-amber-500/60"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Mood selector */}
            <div className="flex items-center bg-stone-950 border border-stone-800 rounded-xl p-0.5 gap-0.5">
              {MOODS.map((m) => (
                <button
                  key={m.type}
                  onClick={() => handleMoodChange(m.type)}
                  title={`Mood: ${m.label}`}
                  className={`px-2 py-1 rounded-lg transition ${
                    journal.mood === m.type
                      ? 'bg-amber-400/20 text-amber-300 ring-1 ring-amber-400/50'
                      : 'text-stone-500 hover:text-stone-300 hover:bg-stone-800/40'
                  }`}
                >
                  <span>{m.icon}</span>
                </button>
              ))}
            </div>

            {/* Tags */}
            {journal.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-950 border border-stone-800 text-stone-400"
              >
                <span>#{tag}</span>
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-red-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {isAddingTag ? (
              <div className="inline-flex items-center gap-1">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddTag();
                    if (e.key === 'Escape') setIsAddingTag(false);
                  }}
                  autoFocus
                  placeholder="tag name..."
                  className="px-2 py-1 bg-stone-950 border border-amber-500 rounded-lg text-xs text-stone-200 focus:outline-none w-24"
                />
                <button
                  onClick={handleAddTag}
                  className="p-1 bg-amber-400 text-stone-950 rounded-lg"
                >
                  <Check className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingTag(true)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-stone-950 border border-stone-800/80 text-stone-500 hover:text-stone-300 transition"
              >
                <Plus className="w-3 h-3" />
                <span>Add Tag</span>
              </button>
            )}
          </div>
        </div>

        {/* AI Quick Actions Bar */}
        <div className="pt-2 border-t border-stone-800 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-stone-500 mr-1 hidden sm:inline">
            Gemini Actions:
          </span>

          <button
            id="ai-summarize-btn"
            onClick={() => handleRunAIAction('summarize')}
            disabled={isGenerating || messages.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/25 text-amber-300 text-xs font-semibold transition active:scale-95 disabled:opacity-40"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Summarize</span>
          </button>

          <button
            id="ai-reflect-btn"
            onClick={() => handleRunAIAction('reflect')}
            disabled={isGenerating || messages.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-400/10 hover:bg-purple-400/20 border border-purple-400/25 text-purple-300 text-xs font-semibold transition active:scale-95 disabled:opacity-40"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Reflect</span>
          </button>

          <button
            id="ai-brainstorm-btn"
            onClick={() => handleRunAIAction('brainstorm')}
            disabled={isGenerating || messages.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-400/10 hover:bg-blue-400/20 border border-blue-400/25 text-blue-300 text-xs font-semibold transition active:scale-95 disabled:opacity-40"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Brainstorm</span>
          </button>

          <button
            id="ai-goals-btn"
            onClick={() => handleRunAIAction('goals')}
            disabled={isGenerating || messages.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-400/10 hover:bg-emerald-400/20 border border-emerald-400/25 text-emerald-300 text-xs font-semibold transition active:scale-95 disabled:opacity-40"
          >
            <Target className="w-3.5 h-3.5" />
            <span>Extract Goals</span>
          </button>

          <button
            id="ai-insights-btn"
            onClick={() => handleRunAIAction('insights')}
            disabled={isGenerating || messages.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-300 text-xs font-medium transition active:scale-95 disabled:opacity-40"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Key Themes</span>
          </button>
        </div>
      </div>

      {/* Voice Status & Quick Voice Conversation Bar */}
      <VoiceStatusBar
        voiceState={voice.voiceState}
        liveTranscript={voice.fullLiveTranscript}
        errorMessage={voice.errorMessage}
        settings={voice.settings}
        onStartListening={voice.startListening}
        onStopListening={() => voice.stopListening(true)}
        onCancelListening={voice.cancelListening}
        onStopSpeaking={voice.stopSpeaking}
        onPauseSpeaking={voice.pauseSpeaking}
        onResumeSpeaking={voice.resumeSpeaking}
        onOpenSettings={() => setShowVoiceSettings(true)}
        onOpenRoom={() => setShowVoiceRoom(true)}
        onClearError={() => {
          voice.setErrorMessage(null);
          voice.setVoiceState('idle');
        }}
      />

      {/* Conversation timeline */}
      <div className="space-y-4 min-h-[350px]">
        {loadingMessages ? (
          <div className="space-y-4 py-8">
            <div className="max-w-md p-4 rounded-2xl bg-stone-900 animate-pulse border border-stone-800 h-20"></div>
            <div className="max-w-lg ml-auto p-4 rounded-2xl bg-stone-850 animate-pulse border border-stone-800 h-24"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-stone-900/40 border border-stone-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/10 text-amber-400 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-bold text-stone-200">
              Your reflection canvas is ready
            </h3>
            <p className="text-xs text-stone-400 max-w-md mx-auto leading-relaxed">
              Write or speak whatever is on your mind. Ask Gemini to probe deeper, organize scattered thoughts, or convert ideas into step-by-step action plans.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isSpeakingThisMsg = voice.speakingMessageId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex flex-col group ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-2 mb-1 px-1">
                  <span className="text-[11px] font-mono text-stone-500">
                    {isUser ? 'You' : 'Gemini'} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {msg.actionType && msg.actionType !== 'chat' && (
                    <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.2 bg-stone-800 text-amber-400 rounded">
                      {msg.actionType}
                    </span>
                  )}
                </div>

                <div
                  className={`relative max-w-3xl rounded-2xl p-5 shadow-md leading-relaxed text-sm ${
                    isUser
                      ? 'bg-amber-400 text-stone-950 font-medium selection:bg-stone-900 selection:text-stone-100 rounded-tr-sm'
                      : 'bg-stone-900 border border-stone-800 text-stone-200 rounded-tl-sm'
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div className="markdown-body prose prose-invert prose-stone max-w-none text-stone-200 text-sm space-y-3 prose-headings:font-serif prose-headings:text-stone-100 prose-a:text-amber-400 prose-code:text-amber-300 prose-code:bg-stone-950 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-stone-950 prose-pre:border prose-pre:border-stone-800">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}

                  {/* Message Action Utilities */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-stone-900/80 backdrop-blur rounded-lg p-1 border border-stone-800">
                    {/* Read Aloud TTS button for Gemini responses */}
                    {!isUser && (
                      <button
                        onClick={() => {
                          if (isSpeakingThisMsg) {
                            voice.stopSpeaking();
                          } else {
                            voice.speakText(msg.content, msg.id);
                          }
                        }}
                        className={`p-1 rounded transition ${
                          isSpeakingThisMsg
                            ? 'text-amber-400 bg-amber-400/20'
                            : 'text-stone-400 hover:text-amber-300'
                        }`}
                        title={isSpeakingThisMsg ? 'Stop Reading' : 'Read Aloud'}
                      >
                        {isSpeakingThisMsg ? (
                          <Square className="w-3.5 h-3.5 fill-current" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}

                    <button
                      onClick={() => handleCopyMessage(msg.content)}
                      className="text-stone-400 hover:text-stone-200 p-1"
                      title="Copy content"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteMessage(msg.id)}
                      className="text-stone-400 hover:text-red-400 p-1"
                      title="Delete message"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {isGenerating && (
          <div className="flex flex-col items-start space-y-1">
            <span className="text-[11px] font-mono text-stone-500 px-1">
              Gemini is reflecting...
            </span>
            <div className="bg-stone-900 border border-stone-800 rounded-2xl rounded-tl-sm p-4 flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.4s]"></span>
              </div>
              <span className="text-xs text-stone-400 font-medium">
                {actionInProgress
                  ? `Running ${actionInProgress} analysis...`
                  : 'Synthesizing thoughtful response...'}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Footer */}
      <div className="sticky bottom-4 z-30 space-y-2">
        <form
          onSubmit={handleSendMessage}
          className="bg-stone-900/95 backdrop-blur-md border border-stone-800 rounded-2xl p-2 shadow-2xl focus-within:border-amber-500/70 transition"
        >
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputPrompt}
              onChange={(e) => {
                setInputPrompt(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={
                voice.voiceState === 'listening'
                  ? 'Listening to your speech... (Click mic to stop & send)'
                  : 'Ask Gemini anything, reflect on a situation, or speak aloud... (Enter to send)'
              }
              className="flex-1 max-h-44 p-3 bg-transparent text-stone-100 placeholder:text-stone-500 text-sm focus:outline-none resize-none leading-relaxed"
            />

            {/* Quick Microphone Button */}
            <button
              type="button"
              onClick={() => {
                if (voice.voiceState === 'listening') {
                  voice.stopListening(true);
                } else {
                  voice.startListening();
                }
              }}
              className={`p-3 rounded-xl font-bold transition active:scale-95 shadow-md flex items-center justify-center ${
                voice.voiceState === 'listening'
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-stone-800 hover:bg-stone-750 text-stone-300 hover:text-amber-400 border border-stone-700/80'
              }`}
              title={voice.voiceState === 'listening' ? 'Stop Listening & Send' : 'Speak to Gemini (Voice Input)'}
            >
              {voice.voiceState === 'listening' ? (
                <Square className="w-4 h-4 fill-current" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>

            <button
              type="submit"
              disabled={isGenerating || !inputPrompt.trim()}
              id="chat-send-btn"
              className="p-3 bg-amber-400 hover:bg-amber-300 disabled:opacity-30 disabled:pointer-events-none text-stone-950 rounded-xl font-bold transition active:scale-95 shadow-md"
              title="Send Message"
            >
              <Send className="w-4 h-4 fill-stone-950" />
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation Modal for Journal Deletion */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        title="Delete this reflection?"
        message="This action will permanently delete this journal session and all associated messages. This cannot be undone."
        confirmLabel="Delete Journal"
        isDestructive={true}
        onConfirm={async () => {
          setShowDeleteConfirm(false);
          onJournalDeleted(journal.id);
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Goal Customization Modal */}
      <GoalModal
        isOpen={showGoalModal}
        initialData={suggestedGoal}
        journalId={journal.id}
        onSave={async (goalData) => {
          if (!user) return;
          await createGoal(user.uid, {
            ...goalData,
            journalId: journal.id,
          });
          onShowToast('success', 'Goal successfully saved to your tracker!');
        }}
        onClose={() => {
          setShowGoalModal(false);
          setSuggestedGoal(undefined);
        }}
      />

      {/* Voice Settings Modal */}
      <VoiceSettingsModal
        isOpen={showVoiceSettings}
        onClose={() => setShowVoiceSettings(false)}
        settings={voice.settings}
        onUpdateSettings={(newSettings) => voice.setSettings(newSettings)}
        availableVoices={voice.availableVoices}
        onTestVoice={(sample) => voice.speakText(sample)}
      />

      {/* Immersive Fullscreen Voice Reflection Room */}
      <VoiceReflectionRoom
        isOpen={showVoiceRoom}
        onClose={() => setShowVoiceRoom(false)}
        journal={journal}
        messages={messages}
        voiceState={voice.voiceState}
        liveTranscript={voice.fullLiveTranscript}
        settings={voice.settings}
        onStartListening={voice.startListening}
        onStopListening={() => voice.stopListening(true)}
        onCancelListening={voice.cancelListening}
        onStopSpeaking={voice.stopSpeaking}
        onPauseSpeaking={voice.pauseSpeaking}
        onResumeSpeaking={voice.resumeSpeaking}
        onOpenSettings={() => setShowVoiceSettings(true)}
        onSelectPrompt={async (prompt) => {
          await processUserMessage(prompt, true);
        }}
      />
    </div>
  );
};
