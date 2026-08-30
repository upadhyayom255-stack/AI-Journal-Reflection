export type MoodType = 'great' | 'good' | 'okay' | 'difficult' | 'low';

export type JournalCategory = 
  | 'Daily Journal'
  | 'Reflection'
  | 'Career'
  | 'Study'
  | 'Ideas'
  | 'Goals'
  | 'Projects'
  | 'General';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt?: string;
  lastLoginAt?: string;
}

export interface JournalMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string; // ISO string
  actionType?: 'chat' | 'summarize' | 'reflect' | 'brainstorm' | 'goals' | 'insights';
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  category: JournalCategory;
  tags: string[];
  summary?: string;
  mood?: MoodType;
  archived: boolean;
  messageCount: number;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface GoalTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface GoalItem {
  id: string;
  userId: string;
  journalId?: string;
  title: string;
  description: string;
  tasks: GoalTask[];
  status: 'Not Started' | 'In Progress' | 'Completed';
  category?: JournalCategory;
  targetDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InsightItem {
  id: string;
  userId: string;
  type: 'theme' | 'pattern' | 'reflection' | 'milestone';
  content: string;
  title?: string;
  journalId?: string;
  createdAt: string;
}

export type ViewMode = 
  | 'dashboard'
  | 'journal-new'
  | 'journal-chat'
  | 'history'
  | 'goals'
  | 'insights'
  | 'settings';

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'paused' | 'error';

export interface VoiceSettings {
  autoSpeak: boolean;
  continuousMode: boolean;
  speechRate: number;
  speechPitch: number;
  voiceURI: string | null;
  language: string;
}

