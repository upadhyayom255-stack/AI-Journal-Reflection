export interface GeminiChatResponse {
  text: string;
  model: string;
  actionType: string;
}

export interface ExtractedGoal {
  title: string;
  description: string;
  tasks: string[];
}

export async function sendChatMessage(
  getIdToken: () => Promise<string | null>,
  params: {
    prompt?: string;
    history?: { role: 'user' | 'assistant'; content: string }[];
    actionType?: 'chat' | 'summarize' | 'reflect' | 'brainstorm' | 'goals' | 'insights';
  }
): Promise<GeminiChatResponse> {
  const token = await getIdToken();
  if (!token) {
    throw new Error('Authentication required. Please sign in.');
  }

  const response = await fetch('/api/gemini/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export async function executeAIAction(
  getIdToken: () => Promise<string | null>,
  params: {
    action: 'summarize' | 'reflect' | 'brainstorm' | 'insights' | 'goals';
    messages: { role: string; content: string }[];
    contextTitle?: string;
    category?: string;
  }
): Promise<any> {
  const token = await getIdToken();
  if (!token) {
    throw new Error('Authentication required. Please sign in.');
  }

  const response = await fetch('/api/gemini/action', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `AI action failed with status ${response.status}`);
  }

  return response.json();
}

export async function generateMetaInsights(
  getIdToken: () => Promise<string | null>,
  params: {
    journalSummaries: { title: string; category?: string; summary?: string; snippet?: string }[];
    goalSummaries?: { title: string; status: string }[];
  }
): Promise<{ metaAnalysis: string }> {
  const token = await getIdToken();
  if (!token) {
    throw new Error('Authentication required. Please sign in.');
  }

  const response = await fetch('/api/gemini/meta-insights', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Insights synthesis failed with status ${response.status}`);
  }

  return response.json();
}
