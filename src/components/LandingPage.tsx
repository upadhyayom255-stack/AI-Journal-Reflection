import React from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  Cloud, 
  ArrowRight, 
  Lock, 
  Brain, 
  Target, 
  Compass, 
  MessageSquareQuote,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../lib/authContext';

export const LandingPage: React.FC = () => {
  const { signInWithGoogle, loading, error } = useAuth();

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-between selection:bg-amber-400 selection:text-stone-950">
      {/* Top Header */}
      <header className="max-w-7xl w-full mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="font-serif text-xl font-bold tracking-tight text-stone-100">AI Journal</span>
            <span className="text-[10px] tracking-widest uppercase text-amber-400 font-semibold ml-2">
              &amp; Reflection
            </span>
          </div>
        </div>

        <button
          id="header-signin-btn"
          onClick={() => signInWithGoogle()}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-200 rounded-xl text-xs font-semibold tracking-wide transition"
        >
          <span>Sign In</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-6 py-12 text-center flex-1 flex flex-col justify-center items-center">
        {/* Aesthetic pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-900/90 border border-stone-800 text-stone-300 text-xs font-medium mb-8">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Powered by Gemini &amp; Firestore Security Rules</span>
        </div>

        {/* Headlines */}
        <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-stone-100 max-w-3xl leading-[1.1] mb-6">
          Think. Reflect. <span className="italic text-amber-300 font-normal">Grow.</span>
        </h1>

        <p className="text-base sm:text-xl text-stone-400 max-w-2xl mx-auto leading-relaxed mb-10">
          Your private AI-powered journal and reflection companion. Converse with Gemini to unpack ideas, discover themes, and turn reflections into real goals.
        </p>

        {/* Primary Google Login Button */}
        <div className="flex flex-col items-center gap-3 mb-16">
          <button
            id="google-signin-hero-btn"
            onClick={() => signInWithGoogle()}
            disabled={loading}
            className="group relative flex items-center gap-3 px-8 py-4 bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-stone-950 rounded-2xl font-bold text-base shadow-xl shadow-amber-950/20 transition-all duration-200"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{loading ? 'Authenticating...' : 'Continue with Google'}</span>
            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </button>

          {error && (
            <p className="text-xs text-red-400 bg-red-950/60 border border-red-900/60 px-4 py-2 rounded-xl max-w-md">
              {error}
            </p>
          )}

          <div className="flex items-center gap-6 text-xs text-stone-500 mt-2">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Strict UID User Isolation
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              No Passwords Stored
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Instant Cloud Sync
            </span>
          </div>
        </div>

        {/* Feature Cards Grid (3 Required Cards + Rich Sub-features) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full text-left">
          {/* Card 1: Private */}
          <div className="p-6 rounded-2xl bg-stone-900/60 border border-stone-800/80 hover:border-stone-700 transition">
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center mb-4">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-stone-100 mb-2">
              🔒 Strictly Private
            </h3>
            <p className="text-sm text-stone-400 leading-relaxed">
              Your journals and messages are isolated to your authenticated Firebase UID. Protected by enforceable Firestore Security Rules.
            </p>
          </div>

          {/* Card 2: AI Powered */}
          <div className="p-6 rounded-2xl bg-stone-900/60 border border-stone-800/80 hover:border-stone-700 transition">
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center mb-4">
              <Brain className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-stone-100 mb-2">
              🤖 AI Powered
            </h3>
            <p className="text-sm text-stone-400 leading-relaxed">
              Reflect, summarize, brainstorm, and organize your thoughts with multi-turn Gemini conversations and structured action generators.
            </p>
          </div>

          {/* Card 3: Cloud Saved */}
          <div className="p-6 rounded-2xl bg-stone-900/60 border border-stone-800/80 hover:border-stone-700 transition">
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center mb-4">
              <Cloud className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-stone-100 mb-2">
              ☁ Cloud Saved
            </h3>
            <p className="text-sm text-stone-400 leading-relaxed">
              Never lose an insight. All conversations, tags, categories, goals, and moods are persistently saved in Cloud Firestore in real time.
            </p>
          </div>
        </div>

        {/* Reflection Flow Snapshot */}
        <div className="mt-14 w-full p-6 sm:p-8 rounded-3xl bg-stone-900/40 border border-stone-800/60 text-left">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-stone-800">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-semibold">
                Journaling Workflow
              </span>
              <h4 className="font-serif text-xl font-bold text-stone-100 mt-1">
                From wandering thoughts to crystal clarity
              </h4>
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-400">
              <span className="px-2.5 py-1 bg-stone-800 rounded-lg">Summarize</span>
              <span className="px-2.5 py-1 bg-stone-800 rounded-lg">Brainstorm</span>
              <span className="px-2.5 py-1 bg-stone-800 rounded-lg">Extract Goals</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 text-xs text-stone-400">
            <div>
              <span className="font-mono text-stone-500 font-bold block mb-1">01. WRITE FREELY</span>
              <p className="text-stone-300">Share your raw ideas, career dilemmas, study blockers, or daily reflections.</p>
            </div>
            <div>
              <span className="font-mono text-stone-500 font-bold block mb-1">02. DEEP DIALOGUE</span>
              <p className="text-stone-300">Gemini asks purposeful questions, highlights recurring themes, and categorizes observations.</p>
            </div>
            <div>
              <span className="font-mono text-stone-500 font-bold block mb-1">03. TAKE ACTION</span>
              <p className="text-stone-300">Convert the conversation into measurable goals with manageable subtasks in one click.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-900 py-6 text-center text-xs text-stone-500">
        <p>AI Journal &amp; Reflection • End-to-end user isolation with Firebase &amp; Gemini</p>
      </footer>
    </div>
  );
};
