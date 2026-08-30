import React, { useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Square, 
  Volume2, 
  VolumeX, 
  Pause, 
  Play, 
  Sparkles, 
  X, 
  Sliders, 
  MessageSquare,
  HelpCircle,
  Minimize2,
  CheckCircle2
} from 'lucide-react';
import { VoiceState, VoiceSettings, JournalEntry, JournalMessage } from '../types';

interface VoiceReflectionRoomProps {
  isOpen: boolean;
  onClose: () => void;
  journal: JournalEntry;
  messages: JournalMessage[];
  voiceState: VoiceState;
  liveTranscript: string;
  settings: VoiceSettings;
  onStartListening: () => void;
  onStopListening: () => void;
  onCancelListening: () => void;
  onStopSpeaking: () => void;
  onPauseSpeaking: () => void;
  onResumeSpeaking: () => void;
  onOpenSettings: () => void;
  onSelectPrompt: (prompt: string) => void;
}

const PROMPT_SUGGESTIONS = [
  "How am I feeling about my progress today?",
  "Help me reflect on a challenge I faced this week",
  "I have a creative idea I want to bounce off you",
  "Help me organize my top 3 priorities for tomorrow",
  "What is something I can let go of to feel more peaceful?",
];

export const VoiceReflectionRoom: React.FC<VoiceReflectionRoomProps> = ({
  isOpen,
  onClose,
  journal,
  messages,
  voiceState,
  liveTranscript,
  settings,
  onStartListening,
  onStopListening,
  onCancelListening,
  onStopSpeaking,
  onPauseSpeaking,
  onResumeSpeaking,
  onOpenSettings,
  onSelectPrompt,
}) => {
  const historyScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      historyScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages, liveTranscript]);

  if (!isOpen) return null;

  const latestGeminiMsg = [...messages].reverse().find((m) => m.role === 'assistant');

  return (
    <div className="fixed inset-0 z-50 bg-stone-950 flex flex-col justify-between p-4 sm:p-8 animate-in fade-in duration-300 overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-2xl bg-amber-400/10 text-amber-400 border border-amber-400/20">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-lg sm:text-xl font-bold text-stone-100">
                Voice Reflection Sanctuary
              </h2>
              {settings.continuousMode && (
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Continuous Mode
                </span>
              )}
            </div>
            <p className="text-xs text-stone-400">
              {journal.title} • Speak naturally with Gemini
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-2 text-stone-400 hover:text-amber-400 hover:bg-stone-900 rounded-xl transition"
            title="Voice Settings"
          >
            <Sliders className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-100 hover:bg-stone-900 rounded-xl transition"
            title="Exit Voice Mode"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Center Visualizer & Conversation Node */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full my-6 text-center space-y-8">
        {/* Animated Ripple / Breathing Node */}
        <div className="relative flex items-center justify-center">
          {/* Outer Pulsing Glow */}
          {voiceState === 'listening' && (
            <>
              <div className="absolute w-44 h-44 sm:w-56 sm:h-56 rounded-full bg-red-500/15 animate-ping duration-1000"></div>
              <div className="absolute w-36 h-36 sm:w-48 sm:h-48 rounded-full bg-red-500/20 animate-pulse"></div>
            </>
          )}

          {voiceState === 'speaking' && (
            <>
              <div className="absolute w-44 h-44 sm:w-56 sm:h-56 rounded-full bg-amber-400/20 animate-ping duration-1000"></div>
              <div className="absolute w-36 h-36 sm:w-48 sm:h-48 rounded-full bg-amber-400/25 animate-pulse"></div>
            </>
          )}

          {voiceState === 'processing' && (
            <div className="absolute w-36 h-36 sm:w-48 sm:h-48 rounded-full bg-purple-500/20 animate-spin"></div>
          )}

          {/* Central orb */}
          <button
            onClick={() => {
              if (voiceState === 'listening') {
                onStopListening();
              } else if (voiceState === 'speaking') {
                onStopSpeaking();
              } else {
                onStartListening();
              }
            }}
            className={`relative z-10 w-28 h-28 sm:w-36 sm:h-36 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-300 transform active:scale-95 ${
              voiceState === 'listening'
                ? 'bg-gradient-to-tr from-red-600 to-red-500 ring-8 ring-red-500/20 text-white'
                : voiceState === 'speaking'
                ? 'bg-gradient-to-tr from-amber-500 to-amber-400 ring-8 ring-amber-400/20 text-stone-950'
                : voiceState === 'processing'
                ? 'bg-gradient-to-tr from-purple-600 to-purple-400 ring-8 ring-purple-500/20 text-white'
                : 'bg-stone-900 border-2 border-stone-750 hover:border-amber-400/60 text-amber-400'
            }`}
          >
            {voiceState === 'listening' ? (
              <>
                <Square className="w-8 h-8 fill-current" />
                <span className="text-[11px] font-mono mt-1 font-bold">TAP TO SEND</span>
              </>
            ) : voiceState === 'speaking' ? (
              <>
                <Volume2 className="w-8 h-8 animate-pulse" />
                <span className="text-[11px] font-mono mt-1 font-bold">TAP TO STOP</span>
              </>
            ) : voiceState === 'processing' ? (
              <>
                <Sparkles className="w-8 h-8 animate-spin" />
                <span className="text-[11px] font-mono mt-1 font-bold">REFLECTING</span>
              </>
            ) : (
              <>
                <Mic className="w-8 h-8" />
                <span className="text-[11px] font-mono mt-1 font-bold">TAP TO SPEAK</span>
              </>
            )}
          </button>
        </div>

        {/* State Label */}
        <div className="space-y-2 max-w-lg">
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-100">
            {voiceState === 'listening' && 'Listening to your thoughts...'}
            {voiceState === 'speaking' && 'Gemini is responding...'}
            {voiceState === 'processing' && 'Synthesizing reflection...'}
            {voiceState === 'idle' && 'Ready for your reflection'}
            {voiceState === 'paused' && 'Speech is paused'}
          </h3>

          {/* Live speech preview or last Gemini response */}
          <div className="min-h-[64px] max-h-40 overflow-y-auto p-4 rounded-2xl bg-stone-900/80 border border-stone-800 text-sm text-stone-200 text-left leading-relaxed">
            {voiceState === 'listening' ? (
              liveTranscript ? (
                <p className="italic text-stone-100">{liveTranscript}</p>
              ) : (
                <p className="text-stone-500 italic text-center">Speak aloud. When you finish, tap the orb or wait for pause.</p>
              )
            ) : latestGeminiMsg ? (
              <p className="line-clamp-4 text-stone-300 text-xs sm:text-sm">{latestGeminiMsg.content}</p>
            ) : (
              <p className="text-stone-500 italic text-center">Start a conversation by tapping the microphone or choosing a reflection starter below.</p>
            )}
          </div>
        </div>

        {/* Quick Conversation Starter Chips (shown when idle) */}
        {voiceState === 'idle' && (
          <div className="space-y-2 w-full">
            <span className="text-[11px] font-mono uppercase tracking-wider text-stone-500">
              Suggested Reflection Starters:
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {PROMPT_SUGGESTIONS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectPrompt(prompt)}
                  className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-850 border border-stone-800 hover:border-amber-400/40 text-stone-300 hover:text-amber-300 text-xs transition"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Controls */}
      <div className="flex items-center justify-between border-t border-stone-900 pt-4 z-10">
        <div className="flex items-center gap-2 text-xs text-stone-500 font-mono">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Local Audio Processing • No Voice Data Retained</span>
        </div>

        <div className="flex items-center gap-2">
          {voiceState === 'speaking' && (
            <button
              onClick={onPauseSpeaking}
              className="flex items-center gap-1.5 px-3 py-2 bg-stone-900 hover:bg-stone-800 text-stone-300 rounded-xl text-xs font-semibold"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </button>
          )}

          {voiceState === 'paused' && (
            <button
              onClick={onResumeSpeaking}
              className="flex items-center gap-1.5 px-3 py-2 bg-stone-900 hover:bg-stone-800 text-amber-300 rounded-xl text-xs font-semibold"
            >
              <Play className="w-3.5 h-3.5 fill-amber-300" />
              <span>Resume</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-750 text-stone-200 rounded-xl text-xs font-semibold transition"
          >
            Back to Journal Editor
          </button>
        </div>
      </div>
    </div>
  );
};
