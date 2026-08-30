import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  JournalEntry, 
  JournalMessage, 
  GoalItem, 
  InsightItem, 
  JournalCategory, 
  MoodType 
} from '../types';

// Helper to convert Firestore Timestamps or dates to ISO string
function toIso(val: any): string {
  if (!val) return new Date().toISOString();
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (val.toDate && typeof val.toDate === 'function') return val.toDate().toISOString();
  if (typeof val === 'string') return val;
  return new Date(val).toISOString();
}

/* =========================================================================
   JOURNAL OPERATIONS (Isolated to users/{userId}/journals/{journalId})
   ========================================================================= */

export async function createJournal(
  userId: string,
  params: {
    title: string;
    category?: JournalCategory;
    tags?: string[];
    mood?: MoodType;
    initialPrompt?: string;
  }
): Promise<{ journalId: string; journal: JournalEntry }> {
  const journalsRef = collection(db, 'users', userId, 'journals');
  const newJournalDoc = doc(journalsRef);
  const journalId = newJournalDoc.id;
  const now = new Date().toISOString();

  const journalData: JournalEntry = {
    id: journalId,
    userId,
    title: params.title.trim() || 'Untitled Reflection',
    category: params.category || 'Daily Journal',
    tags: params.tags || [],
    mood: params.mood,
    archived: false,
    messageCount: params.initialPrompt ? 1 : 0,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(newJournalDoc, {
    ...journalData,
    serverCreatedAt: serverTimestamp(),
    serverUpdatedAt: serverTimestamp(),
  });

  if (params.initialPrompt) {
    const messagesRef = collection(db, 'users', userId, 'journals', journalId, 'messages');
    const newMsgDoc = doc(messagesRef);
    await setDoc(newMsgDoc, {
      id: newMsgDoc.id,
      role: 'user',
      content: params.initialPrompt,
      timestamp: now,
      serverTimestamp: serverTimestamp(),
    });
  }

  return { journalId, journal: journalData };
}

export async function getJournals(
  userId: string,
  options?: {
    includeArchived?: boolean;
    category?: string;
    limitCount?: number;
  }
): Promise<JournalEntry[]> {
  const journalsRef = collection(db, 'users', userId, 'journals');
  let q = query(journalsRef, orderBy('serverUpdatedAt', 'desc'));

  if (options?.limitCount) {
    q = query(q, limit(options.limitCount));
  }

  const snap = await getDocs(q);
  const results: JournalEntry[] = [];

  snap.forEach((docSnap) => {
    const data = docSnap.data();
    const isArchived = Boolean(data.archived);

    if (options?.includeArchived === false && isArchived) {
      return;
    }
    if (options?.category && options.category !== 'All' && data.category !== options.category) {
      return;
    }

    results.push({
      id: docSnap.id,
      userId: data.userId || userId,
      title: data.title || 'Untitled',
      category: data.category || 'General',
      tags: Array.isArray(data.tags) ? data.tags : [],
      summary: data.summary,
      mood: data.mood,
      archived: isArchived,
      messageCount: data.messageCount || 0,
      createdAt: toIso(data.serverCreatedAt || data.createdAt),
      updatedAt: toIso(data.serverUpdatedAt || data.updatedAt),
    });
  });

  return results;
}

export async function getJournal(userId: string, journalId: string): Promise<JournalEntry | null> {
  const docRef = doc(db, 'users', userId, 'journals', journalId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;

  const data = snap.data();
  return {
    id: snap.id,
    userId: data.userId || userId,
    title: data.title || 'Untitled',
    category: data.category || 'General',
    tags: Array.isArray(data.tags) ? data.tags : [],
    summary: data.summary,
    mood: data.mood,
    archived: Boolean(data.archived),
    messageCount: data.messageCount || 0,
    createdAt: toIso(data.serverCreatedAt || data.createdAt),
    updatedAt: toIso(data.serverUpdatedAt || data.updatedAt),
  };
}

export async function updateJournal(
  userId: string,
  journalId: string,
  updates: Partial<Omit<JournalEntry, 'id' | 'userId' | 'createdAt'>>
): Promise<void> {
  const docRef = doc(db, 'users', userId, 'journals', journalId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
    serverUpdatedAt: serverTimestamp(),
  });
}

export async function archiveJournal(userId: string, journalId: string, archived: boolean): Promise<void> {
  await updateJournal(userId, journalId, { archived });
}

export async function deleteJournal(userId: string, journalId: string): Promise<void> {
  // Delete subcollection messages first to prevent orphaned data
  const messagesRef = collection(db, 'users', userId, 'journals', journalId, 'messages');
  const messagesSnap = await getDocs(messagesRef);
  
  const batch = writeBatch(db);
  messagesSnap.forEach((mDoc) => {
    batch.delete(mDoc.ref);
  });

  const journalDocRef = doc(db, 'users', userId, 'journals', journalId);
  batch.delete(journalDocRef);

  await batch.commit();
}

/* =========================================================================
   MESSAGES OPERATIONS (users/{userId}/journals/{journalId}/messages)
   ========================================================================= */

export async function getJournalMessages(userId: string, journalId: string): Promise<JournalMessage[]> {
  const messagesRef = collection(db, 'users', userId, 'journals', journalId, 'messages');
  const q = query(messagesRef, orderBy('serverTimestamp', 'asc'));
  
  const snap = await getDocs(q);
  const messages: JournalMessage[] = [];

  snap.forEach((docSnap) => {
    const d = docSnap.data();
    messages.push({
      id: docSnap.id,
      role: d.role || 'user',
      content: d.content || '',
      timestamp: toIso(d.serverTimestamp || d.timestamp),
      actionType: d.actionType,
    });
  });

  return messages;
}

export async function addJournalMessage(
  userId: string,
  journalId: string,
  message: {
    role: 'user' | 'assistant' | 'system';
    content: string;
    actionType?: 'chat' | 'summarize' | 'reflect' | 'brainstorm' | 'goals' | 'insights';
  }
): Promise<JournalMessage> {
  const messagesRef = collection(db, 'users', userId, 'journals', journalId, 'messages');
  const newMsgDoc = doc(messagesRef);
  const now = new Date().toISOString();

  const msgData: JournalMessage = {
    id: newMsgDoc.id,
    role: message.role,
    content: message.content,
    timestamp: now,
    actionType: message.actionType || 'chat',
  };

  await setDoc(newMsgDoc, {
    ...msgData,
    serverTimestamp: serverTimestamp(),
  });

  // Update parent journal's updatedAt and increment message count
  const journalRef = doc(db, 'users', userId, 'journals', journalId);
  const currentSnap = await getDoc(journalRef);
  const currentCount = currentSnap.exists() ? (currentSnap.data().messageCount || 0) : 0;

  await updateDoc(journalRef, {
    messageCount: currentCount + 1,
    updatedAt: now,
    serverUpdatedAt: serverTimestamp(),
  });

  return msgData;
}

export async function deleteJournalMessage(userId: string, journalId: string, messageId: string): Promise<void> {
  const msgRef = doc(db, 'users', userId, 'journals', journalId, 'messages', messageId);
  await deleteDoc(msgRef);

  const journalRef = doc(db, 'users', userId, 'journals', journalId);
  const currentSnap = await getDoc(journalRef);
  if (currentSnap.exists()) {
    const count = Math.max(0, (currentSnap.data().messageCount || 1) - 1);
    await updateDoc(journalRef, {
      messageCount: count,
      updatedAt: new Date().toISOString(),
      serverUpdatedAt: serverTimestamp(),
    });
  }
}

/* =========================================================================
   GOALS OPERATIONS (users/{userId}/goals/{goalId})
   ========================================================================= */

export async function getGoals(userId: string): Promise<GoalItem[]> {
  const goalsRef = collection(db, 'users', userId, 'goals');
  const q = query(goalsRef, orderBy('serverCreatedAt', 'desc'));
  const snap = await getDocs(q);

  const goals: GoalItem[] = [];
  snap.forEach((docSnap) => {
    const d = docSnap.data();
    goals.push({
      id: docSnap.id,
      userId: d.userId || userId,
      journalId: d.journalId,
      title: d.title || 'Untitled Goal',
      description: d.description || '',
      tasks: Array.isArray(d.tasks) ? d.tasks : [],
      status: d.status || 'Not Started',
      category: d.category,
      targetDate: d.targetDate,
      createdAt: toIso(d.serverCreatedAt || d.createdAt),
      updatedAt: toIso(d.serverUpdatedAt || d.updatedAt),
    });
  });

  return goals;
}

export async function createGoal(
  userId: string,
  params: {
    title: string;
    description?: string;
    tasks?: { text: string; completed?: boolean }[];
    category?: JournalCategory;
    journalId?: string;
    targetDate?: string;
    status?: 'Not Started' | 'In Progress' | 'Completed';
  }
): Promise<GoalItem> {
  const goalsRef = collection(db, 'users', userId, 'goals');
  const newGoalDoc = doc(goalsRef);
  const now = new Date().toISOString();

  const formattedTasks = (params.tasks || []).map((t, idx) => ({
    id: `task_${Date.now()}_${idx}`,
    text: t.text,
    completed: Boolean(t.completed),
  }));

  const goalData: GoalItem = {
    id: newGoalDoc.id,
    userId,
    journalId: params.journalId,
    title: params.title.trim(),
    description: params.description || '',
    tasks: formattedTasks,
    status: params.status || 'Not Started',
    category: params.category,
    targetDate: params.targetDate,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(newGoalDoc, {
    ...goalData,
    serverCreatedAt: serverTimestamp(),
    serverUpdatedAt: serverTimestamp(),
  });

  return goalData;
}

export async function updateGoal(
  userId: string,
  goalId: string,
  updates: Partial<Omit<GoalItem, 'id' | 'userId' | 'createdAt'>>
): Promise<void> {
  const docRef = doc(db, 'users', userId, 'goals', goalId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
    serverUpdatedAt: serverTimestamp(),
  });
}

export async function deleteGoal(userId: string, goalId: string): Promise<void> {
  const docRef = doc(db, 'users', userId, 'goals', goalId);
  await deleteDoc(docRef);
}

/* =========================================================================
   INSIGHTS OPERATIONS (users/{userId}/insights/{insightId})
   ========================================================================= */

export async function getInsights(userId: string): Promise<InsightItem[]> {
  const insightsRef = collection(db, 'users', userId, 'insights');
  const q = query(insightsRef, orderBy('serverCreatedAt', 'desc'), limit(50));
  const snap = await getDocs(q);

  const insights: InsightItem[] = [];
  snap.forEach((docSnap) => {
    const d = docSnap.data();
    insights.push({
      id: docSnap.id,
      userId: d.userId || userId,
      type: d.type || 'reflection',
      content: d.content || '',
      title: d.title,
      journalId: d.journalId,
      createdAt: toIso(d.serverCreatedAt || d.createdAt),
    });
  });

  return insights;
}

export async function createInsight(
  userId: string,
  params: {
    type: 'theme' | 'pattern' | 'reflection' | 'milestone';
    content: string;
    title?: string;
    journalId?: string;
  }
): Promise<InsightItem> {
  const insightsRef = collection(db, 'users', userId, 'insights');
  const newDoc = doc(insightsRef);
  const now = new Date().toISOString();

  const insightData: InsightItem = {
    id: newDoc.id,
    userId,
    type: params.type,
    content: params.content,
    title: params.title,
    journalId: params.journalId,
    createdAt: now,
  };

  await setDoc(newDoc, {
    ...insightData,
    serverCreatedAt: serverTimestamp(),
  });

  return insightData;
}

export async function deleteInsight(userId: string, insightId: string): Promise<void> {
  const docRef = doc(db, 'users', userId, 'insights', insightId);
  await deleteDoc(docRef);
}
