import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  ShieldCheck, 
  User, 
  Download, 
  LogOut, 
  Lock, 
  Database, 
  Key, 
  CheckCircle2,
  ExternalLink,
  Cpu,
  Mic,
  Volume2,
  Sliders,
  Play
} from 'lucide-react';
import { useAuth } from '../lib/authContext';
import { JournalEntry, GoalItem, InsightItem, VoiceSettings } from '../types';
import { getStoredVoiceSettings, saveStoredVoiceSettings, cleanMarkdownForTTS } from '../lib/useVoiceAssistant';

interface SettingsViewProps {
  journals: JournalEntry[];
  goals: GoalItem[];
  insights: InsightItem[];
  onShowToast: (type: 'success' | 'error' | 'info', text: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  journals,
  goals,
  insights,
  onShowToast,
}) => {
  const { user, userProfile, logout } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(getStoredVoiceSettings);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  const handleUpdateVoiceSetting = <K extends keyof VoiceSettings>(key: K, value: VoiceSettings[K]) => {
    const updated = { ...voiceSettings, [key]: value };
    setVoiceSettings(updated);
    saveStoredVoiceSettings(updated);
    onShowToast('info', 'Voice preference saved');
  };

  const handleTestVoice = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      onShowToast('error', 'Speech synthesis is not supported on this browser');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance("Hello! I am your AI reflection companion. I'm ready to listen and reflect with you.");
    utterance.rate = voiceSettings.speechRate;
    utterance.pitch = voiceSettings.speechPitch;
    utterance.lang = voiceSettings.language;

    if (voiceSettings.voiceURI && availableVoices.length > 0) {
      const chosen = availableVoices.find((v) => v.voiceURI === voiceSettings.voiceURI);
      if (chosen) utterance.voice = chosen;
    }

    window.speechSynthesis.speak(utterance);
  };

  const handleFullBackup = () => {
    setExporting(true);
    try {
      const fullArchive = {
        exportedAt: new Date().toISOString(),
        user: {
          uid: user?.uid,
          email: user?.email,
          displayName: user?.displayName,
        },
        stats: {
          totalJournals: journals.length,
          totalGoals: goals.length,
          totalInsights: insights.length,
        },
        journals,
        goals,
        insights,
      };

      const blob = new Blob([JSON.stringify(fullArchive, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-journal-backup-${user?.uid || 'user'}-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      onShowToast('success', 'Complete personal data archive downloaded!');
    } catch (err) {
      console.error(err);
      onShowToast('error', 'Failed to export backup');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Top Header */}
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-100 flex items-center gap-2.5">
          <SettingsIcon className="w-6 h-6 text-amber-400" />
          <span>Account &amp; Privacy Center</span>
        </h1>
        <p className="text-sm text-stone-400 mt-1">
          Review your security parameters, voice preferences, data ownership boundaries, and account credentials.
        </p>
      </div>

      {/* User Identity Profile Card */}
      <section className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-5">
        <h2 className="font-serif text-lg font-bold text-stone-100 flex items-center gap-2">
          <User className="w-4 h-4 text-amber-400" />
          <span>Authenticated Profile</span>
        </h2>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-stone-950 border border-stone-800">
          <div className="flex items-center gap-4">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt="Profile"
                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-amber-400/30"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-stone-800 flex items-center justify-center text-stone-400">
                <User className="w-6 h-6" />
              </div>
            )}
            <div className="space-y-1">
              <h3 className="font-semibold text-stone-100 text-base">
                {userProfile?.displayName || user?.displayName || 'Signed In User'}
              </h3>
              <p className="text-xs text-stone-400">{userProfile?.email || user?.email}</p>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-stone-900 text-stone-400 text-[10px] font-mono border border-stone-800">
                <span>UID:</span>
                <span className="text-amber-400/90 truncate max-w-[200px]">{user?.uid}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="flex items-center gap-2 px-4 py-2 bg-red-950/40 hover:bg-red-950/70 text-red-300 border border-red-900/60 rounded-xl text-xs font-semibold transition self-start sm:self-auto"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </section>

      {/* Voice & Speech Interaction Settings */}
      <section className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold text-stone-100 flex items-center gap-2">
            <Mic className="w-4 h-4 text-amber-400" />
            <span>Voice &amp; Speech Interaction Preferences</span>
          </h2>
          <button
            onClick={handleTestVoice}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-750 text-amber-300 border border-stone-700/80 rounded-xl text-xs font-semibold transition"
          >
            <Play className="w-3.5 h-3.5 fill-amber-300" />
            <span>Test Voice</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Auto Read Responses Toggle */}
          <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-200 block">
                Auto-Read Gemini Responses
              </label>
              <p className="text-[11px] text-stone-400 leading-normal">
                Automatically synthesize speech for reflections when Gemini replies.
              </p>
            </div>
            <input
              type="checkbox"
              checked={voiceSettings.autoSpeak}
              onChange={(e) => handleUpdateVoiceSetting('autoSpeak', e.target.checked)}
              className="w-5 h-5 rounded accent-amber-400 bg-stone-900 border-stone-700 cursor-pointer"
            />
          </div>

          {/* Continuous Mode Toggle */}
          <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-200 block">
                Continuous Conversation Mode
              </label>
              <p className="text-[11px] text-stone-400 leading-normal">
                Automatically listen for speech after Gemini finishes speaking.
              </p>
            </div>
            <input
              type="checkbox"
              checked={voiceSettings.continuousMode}
              onChange={(e) => handleUpdateVoiceSetting('continuousMode', e.target.checked)}
              className="w-5 h-5 rounded accent-amber-400 bg-stone-900 border-stone-700 cursor-pointer"
            />
          </div>

          {/* Language Selection */}
          <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-2">
            <label className="text-xs font-semibold text-stone-200 block">
              Recognition Language
            </label>
            <select
              value={voiceSettings.language}
              onChange={(e) => handleUpdateVoiceSetting('language', e.target.value)}
              className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-200 focus:outline-none focus:border-amber-500"
            >
              <option value="en-US">English (United States) - en-US</option>
              <option value="en-IN">English (India) - en-IN</option>
              <option value="en-GB">English (United Kingdom) - en-GB</option>
              <option value="en-AU">English (Australia) - en-AU</option>
              <option value="en-CA">English (Canada) - en-CA</option>
            </select>
          </div>

          {/* Speech Rate Slider */}
          <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stone-200">
                Speech Rate ({voiceSettings.speechRate}x)
              </label>
            </div>
            <input
              type="range"
              min="0.7"
              max="1.5"
              step="0.05"
              value={voiceSettings.speechRate}
              onChange={(e) => handleUpdateVoiceSetting('speechRate', parseFloat(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>
        </div>
      </section>

      {/* Strict Security & Isolation Verification */}
      <section className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-4">
        <h2 className="font-serif text-lg font-bold text-stone-100 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Security &amp; Data Isolation Architecture</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold font-mono">
              <CheckCircle2 className="w-4 h-4" />
              <span>Firestore Rules Enforced</span>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed">
              Database reads and writes are strictly locked to <code className="text-stone-300">/users/{'{uid}'}/...</code> matching <code className="text-stone-300">request.auth.uid</code>. Cross-user access is impossible at the database layer.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold font-mono">
              <CheckCircle2 className="w-4 h-4" />
              <span>Server-Side Gemini API</span>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed">
              All Gemini operations are executed securely behind server-side authenticated Express endpoints. No API keys or secret credentials are ever exposed in client JavaScript.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold font-mono">
              <CheckCircle2 className="w-4 h-4" />
              <span>Google Identity Token Verification</span>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed">
              Every backend API call validates the cryptographic signature and expiration of the user's Firebase token to verify authenticity before generating reflections.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold font-mono">
              <CheckCircle2 className="w-4 h-4" />
              <span>Client-Side Audio Safety</span>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed">
              Audio transcription and text-to-speech are processed natively via standard Web Speech APIs. No raw voice or audio files are recorded or uploaded.
            </p>
          </div>
        </div>
      </section>

      {/* Full Data Export & Portability */}
      <section className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-4">
        <h2 className="font-serif text-lg font-bold text-stone-100 flex items-center gap-2">
          <Database className="w-4 h-4 text-amber-400" />
          <span>Data Portability &amp; Full Backup</span>
        </h2>
        <p className="text-xs text-stone-400 leading-relaxed">
          You own 100% of your reflections, conversations, goals, and insights. Download a complete JSON archive of all your data at any time.
        </p>

        <div className="pt-2">
          <button
            onClick={handleFullBackup}
            disabled={exporting}
            className="flex items-center gap-2 px-5 py-2.5 bg-stone-800 hover:bg-stone-750 text-stone-200 rounded-xl text-xs font-semibold transition active:scale-95 border border-stone-700"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>{exporting ? 'Preparing Backup...' : 'Download Complete Data Archive (.json)'}</span>
          </button>
        </div>
      </section>
    </div>
  );
};
