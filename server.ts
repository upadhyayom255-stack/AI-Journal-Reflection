import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initialize Google Gen AI
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY environment variable is missing.');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

const DEFAULT_SYSTEM_INSTRUCTION = `You are an AI journaling and reflection assistant.

Your purpose is to help the user:
* Understand their thoughts and feelings
* Organize their ideas clearly
* Summarize reflections with key takeaways
* Brainstorm possibilities and novel angles
* Identify recurring themes and habits
* Ask useful, thoughtful reflection questions
* Convert thoughts into practical, step-by-step goals
* Develop actionable plans

Tone and Safety Guidelines:
- Only use information available in the current conversation and authorized user context.
- Never reveal or infer private information belonging to another user.
- Do not claim certainty about information that is not known.
- Be supportive, thoughtful, clear, practical, and concise.
- Structure responses cleanly using Markdown (bullet points, clear headers, bold accents, blockquotes for key takeaways).
- Do not present yourself as a medical, psychiatric, or mental-health professional.
- When appropriate, encourage the user to seek qualified professional help for serious personal or health concerns.`;

// Middleware to verify Firebase Auth token
interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
  };
}

async function authenticateFirebaseUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    res.status(401).json({ error: 'Unauthorized: Token not provided' });
    return;
  }

  try {
    // Verify via Google tokeninfo endpoint
    const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
    if (verifyRes.ok) {
      const data = await verifyRes.json();
      const uid = data.user_id || data.sub;
      if (uid) {
        req.user = { uid, email: data.email };
        return next();
      }
    }

    // Fallback: Verify JWT structure
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
      const uid = payload.user_id || payload.sub;
      if (uid) {
        req.user = { uid, email: payload.email };
        return next();
      }
    }

    res.status(401).json({ error: 'Unauthorized: Invalid authentication token' });
  } catch (err: any) {
    console.error('Token verification error:', err);
    res.status(401).json({ error: 'Unauthorized: Token verification failed' });
  }
}

/* =========================================================================
   API ROUTES
   ========================================================================= */

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    model: process.env.GEMINI_MODEL || 'gemini-3.7-flash',
  });
});

// Multi-turn Chat / Generation Endpoint
app.post('/api/gemini/chat', authenticateFirebaseUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { prompt, history, actionType } = req.body;

    if (!prompt && (!history || history.length === 0)) {
      res.status(400).json({ error: 'Prompt or conversation history is required' });
      return;
    }

    const ai = getGenAI();
    const model = process.env.GEMINI_MODEL || 'gemini-3.7-flash';

    // Format history for Gemini SDK
    const contents: any[] = [];

    if (Array.isArray(history)) {
      for (const item of history) {
        if (item.role === 'user') {
          contents.push({
            role: 'user',
            parts: [{ text: item.content }],
          });
        } else if (item.role === 'assistant') {
          contents.push({
            role: 'model',
            parts: [{ text: item.content }],
          });
        }
      }
    }

    // Append latest prompt if provided and not already in history
    if (prompt) {
      contents.push({
        role: 'user',
        parts: [{ text: prompt }],
      });
    }

    let dynamicInstruction = DEFAULT_SYSTEM_INSTRUCTION;

    if (actionType === 'summarize') {
      dynamicInstruction += `\n\nTask: Provide a high-level, beautifully structured summary of the user's reflection session.
Format with:
- **Core Focus & Theme**
- **Key Thoughts & Realizations**
- **Noted Blockers or Concerns**
- **Constructive Takeaways**`;
    } else if (actionType === 'reflect') {
      dynamicInstruction += `\n\nTask: Pose 3 to 4 deeply thoughtful, open-ended reflection questions that help the user examine their assumptions, values, and next emotional or practical steps.`;
    } else if (actionType === 'brainstorm') {
      dynamicInstruction += `\n\nTask: Brainstorm creative, diverse, and practical solutions/ideas related to the user's topic. Group them clearly by difficulty or angle.`;
    } else if (actionType === 'insights') {
      dynamicInstruction += `\n\nTask: Analyze the patterns, mindset shifts, decisions, and recurring themes in this reflection. Highlight constructive opportunities for growth.`;
    } else if (actionType === 'goals') {
      dynamicInstruction += `\n\nTask: Extract tangible, actionable goals from the conversation. Break each goal down into 2-4 concrete, achievable tasks.`;
    }

    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: dynamicInstruction,
        temperature: 0.7,
      },
    });

    const replyText = response.text || 'I have reflected on your thoughts. How would you like to proceed?';

    res.json({
      text: replyText,
      model,
      actionType: actionType || 'chat',
    });
  } catch (error: any) {
    console.error('Gemini chat error:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate response from Gemini API',
    });
  }
});

// Dedicated AI Action Endpoint (Structured outputs for goals, summaries, themes)
app.post('/api/gemini/action', authenticateFirebaseUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { action, messages, contextTitle, category } = req.body;

    if (!action || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Action and conversation messages are required' });
      return;
    }

    const ai = getGenAI();
    const model = process.env.GEMINI_MODEL || 'gemini-3.7-flash';

    const conversationTranscript = messages
      .map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n\n');

    if (action === 'goals') {
      // Structured Goal Extraction
      const prompt = `Based on the following journal conversation titled "${contextTitle || 'Reflection'}" (Category: ${category || 'General'}), convert the user's thoughts into 1 to 3 structured, practical goals.
Return valid JSON only in this exact format:
{
  "goals": [
    {
      "title": "Clear Goal Title",
      "description": "Brief description of the goal and why it matters to the user",
      "tasks": [
        "Concrete task 1",
        "Concrete task 2",
        "Concrete task 3"
      ]
    }
  ]
}

Conversation transcript:
${conversationTranscript}`;

      const response = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction: 'You are an expert personal development and goal-setting assistant. Return ONLY valid JSON format.',
          responseMimeType: 'application/json',
        },
      });

      let parsed = { goals: [] };
      try {
        parsed = JSON.parse(response.text || '{}');
      } catch (e) {
        console.warn('Failed to parse JSON goal response:', response.text);
      }

      res.json({
        goals: parsed.goals || [],
        rawText: response.text,
      });
      return;
    }

    if (action === 'summarize') {
      const prompt = `Please summarize the following journal titled "${contextTitle || 'Reflection'}":

${conversationTranscript}

Provide a concise, thoughtful markdown summary with:
### 📌 Main Topic
### 💡 Core Thoughts & Realizations
### ⚡ Key Concerns / Opportunities
### 🎯 Next Steps & Conclusions`;

      const response = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction: DEFAULT_SYSTEM_INSTRUCTION,
        },
      });

      res.json({ summary: response.text });
      return;
    }

    if (action === 'reflect') {
      const prompt = `Based on this reflection:
${conversationTranscript}

Generate 4 deep, insightful reflection questions that will help the author gain greater clarity on their motivations, perspective, and feelings. Format with rich Markdown.`;

      const response = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction: DEFAULT_SYSTEM_INSTRUCTION,
        },
      });

      res.json({ reflection: response.text });
      return;
    }

    if (action === 'brainstorm') {
      const prompt = `Based on this reflection:
${conversationTranscript}

Brainstorm 5 to 7 innovative, practical ideas, alternatives, or strategies the user could explore. Categorize them into immediate wins, creative angles, and long-term milestones.`;

      const response = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction: DEFAULT_SYSTEM_INSTRUCTION,
        },
      });

      res.json({ brainstorm: response.text });
      return;
    }

    if (action === 'insights') {
      const prompt = `Analyze this reflection session:
${conversationTranscript}

Identify:
1. **Recurring Themes**: Core focus areas
2. **Mindset & Emotional Tone**: Noticeable shifts or patterns
3. **Decisions & Commitments**: Explicit or implied choices
4. **Growth Opportunities**: Practical areas to explore further`;

      const response = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction: DEFAULT_SYSTEM_INSTRUCTION,
        },
      });

      res.json({ insights: response.text });
      return;
    }

    res.status(400).json({ error: `Unsupported action: ${action}` });
  } catch (error: any) {
    console.error('Gemini action error:', error);
    res.status(500).json({
      error: error.message || 'Failed to process AI action',
    });
  }
});

// Global Meta-Analysis across all journals (Insights page)
app.post('/api/gemini/meta-insights', authenticateFirebaseUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { journalSummaries, goalSummaries } = req.body;

    if (!Array.isArray(journalSummaries) || journalSummaries.length === 0) {
      res.status(400).json({ error: 'At least one journal entry is needed for meta-insights' });
      return;
    }

    const ai = getGenAI();
    const model = process.env.GEMINI_MODEL || 'gemini-3.7-flash';

    const journalContext = journalSummaries
      .map((j: any, i: number) => `Journal ${i + 1} [${j.category || 'General'}] "${j.title}": ${j.summary || j.snippet || 'No summary'}`)
      .join('\n');

    const goalContext = Array.isArray(goalSummaries) && goalSummaries.length > 0
      ? goalSummaries.map((g: any) => `- Goal: ${g.title} (${g.status})`).join('\n')
      : 'No active goals recorded yet.';

    const prompt = `Analyze the user's authorized reflection history to generate overarching growth themes, mindset patterns, and focus recommendations.

User Journals Summary:
${journalContext}

User Goals:
${goalContext}

Provide a structured, beautifully formatted markdown analysis with:
# 🌟 Reflection & Growth Synthesis
## 🔍 Top Themes & Recurring Patterns
## 📈 Mindset & Progress Trajectory
## 🎯 Alignment Between Thoughts & Goals
## 💡 Recommended Focus for the Coming Week

Keep it encouraging, grounded, actionable, and concise.`;

    const response = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: DEFAULT_SYSTEM_INSTRUCTION,
      },
    });

    res.json({ metaAnalysis: response.text });
  } catch (error: any) {
    console.error('Meta-insights error:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate overarching insights',
    });
  }
});

/* =========================================================================
   SERVER BOOTSTRAP & VITE MIDDLEWARE
   ========================================================================= */

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Journal server running on http://localhost:${PORT}`);
  });
}

startServer();
