import React from 'react';
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
  Maximize2,
  RefreshCw
} from 'lucide-react';
import { VoiceState, VoiceSettings } from '../types';

interface VoiceStatusBarProps {
  voiceState: VoiceState;
  liveTranscript: string;
  errorMessage: string | null;
  settings: VoiceSettings;
  onStartListening: () => void;
  onStopListening: () => void;
  onCancelListening: () => void;
  onStopSpeaking: () => void;
  onPauseSpeaking: () => void;
  onResumeSpeaking: () => void;
  onOpenSettings: () => void;
  onOpenRoom: () => void;
  onClearError: () => void;
}

export const VoiceStatusBar: React.FC<VoiceStatusBarProps> = ({
  voiceState,
  liveTranscript,
  errorMessage,
  settings,
  onStartListening,
  onStopListening,
  onCancelListening,
  onStopSpeaking,
  onPauseSpeaking,
  onResumeSpeaking,
  onOpenSettings,
  onOpenRoom,
  onClearError,
}) => {
  // If in idle state, show a clean, elegant voice conversation entry pill
  if (voiceState === 'idle') {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-stone-900/90 border border-stone-800 rounded-2xl">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onStartListening}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/20 to-amber-400/10 hover:from-amber-500/30 hover:to-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-bold rounded-xl transition active:scale-95 shadow-sm group"
          >
            <Mic className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            <span>Start Voice Conversation</span>
          </button>

          {settings.continuousMode && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 px-2 py-1 rounded-lg bg-emerald-950/40 border border-emerald-800/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Hands-free active</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenRoom}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-stone-400 hover:text-stone-200 bg-stone-800/60 hover:bg-stone-800 rounded-xl transition"
            title="Open immersive voice reflection room"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Voice Room</span>
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="p-2 text-stone-400 hover:text-amber-400 hover:bg-stone-800 rounded-xl transition"
            title="Voice & Speech Settings"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Error State
  if (voiceState === 'error' && errorMessage) {
    return (
      <div className="flex items-center justify-between gap-3 p-3 bg-red-950/50 border border-red-900/60 rounded-2xl text-xs text-red-300">
        <div className="flex items-center gap-2">
          <MicOff className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onStartListening}
            className="px-2.5 py-1 bg-red-900/60 hover:bg-red-900 rounded-lg text-red-200 font-semibold"
          >
            Retry
          </button>
          <button
            onClick={onClearError}
            className="p-1 hover:text-red-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Listening State
  if (voiceState === 'listening') {
    return (
      <div className="p-3.5 bg-gradient-to-r from-red-950/40 via-stone-900 to-stone-900 border border-red-500/40 rounded-2xl space-y-2.5 shadow-lg animate-in fade-in">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center">
              <span className="w-3.5 h-3.5 rounded-full bg-red-500 animate-ping absolute opacity-75"></span>
              <span className="w-3 h-3 rounded-full bg-red-500 relative"></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-red-300 tracking-wide uppercase font-mono">
                Listening...
              </span>
              <div className="flex items-center gap-0.5 h-3">
                <span className="w-1 bg-red-400 rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-2"></span>
                <span className="w-1 bg-red-400 rounded-full animate-[pulse_0.4s_ease-in-out_infinite] h-3"></span>
                <span className="w-1 bg-red-400 rounded-full animate-[pulse_0.8s_ease-in-out_infinite] h-1.5"></span>
                <span className="w-1 bg-red-400 rounded-full animate-[pulse_0.5s_ease-in-out_infinite] h-3"></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onStopListening()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs rounded-xl shadow transition active:scale-95"
            >
              <Square className="w-3.5 h-3.5 fill-stone-950" />
              <span>Send Transcript</span>
            </button>
            <button
              type="button"
              onClick={onCancelListening}
              className="p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-xl transition"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live speech preview */}
        <div className="p-2.5 rounded-xl bg-stone-950 border border-stone-800/80 text-xs text-stone-200 min-h-[36px] flex items-center">
          {liveTranscript ? (
            <p className="italic text-stone-100 leading-relaxed font-sans">{liveTranscript}</p>
          ) : (
            <p className="text-stone-500 italic">Speak freely... your words will appear here in real-time</p>
          )}
        </div>
      </div>
    );
  }

  // Speaking / Paused State
  if (voiceState === 'speaking' || voiceState === 'paused') {
    return (
      <div className="flex items-center justify-between gap-3 p-3 bg-gradient-to-r from-amber-950/40 via-stone-900 to-stone-900 border border-amber-500/40 rounded-2xl shadow-lg animate-in fade-in">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-400/20 text-amber-400 border border-amber-400/30">
            <Volume2 className={`w-4 h-4 ${voiceState === 'speaking' ? 'animate-pulse' : ''}`} />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-amber-300 tracking-wide font-serif">
                {voiceState === 'speaking' ? 'Gemini is speaking...' : 'Speech Paused'}
              </span>
              {voiceState === 'speaking' && (
                <div className="flex items-center gap-0.5 h-2.5">
                  <span className="w-0.5 bg-amber-400 rounded-full animate-bounce h-2 [animation-delay:0.1s]"></span>
                  <span className="w-0.5 bg-amber-400 rounded-full animate-bounce h-3 [animation-delay:0.3s]"></span>
                  <span className="w-0.5 bg-amber-400 rounded-full animate-bounce h-1.5 [animation-delay:0.2s]"></span>
                </div>
              )}
            </div>
            <p className="text-[11px] text-stone-400">
              {settings.continuousMode
                ? 'Will listen automatically when speech ends'
                : 'Tap mic anytime to speak'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {voiceState === 'speaking' ? (
            <button
              type="button"
              onClick={onPauseSpeaking}
              className="p-2 text-stone-300 hover:text-stone-100 bg-stone-800 hover:bg-stone-750 rounded-xl transition"
              title="Pause speech"
            >
              <Pause className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onResumeSpeaking}
              className="p-2 text-amber-300 hover:text-amber-100 bg-stone-800 hover:bg-stone-750 rounded-xl transition"
              title="Resume speech"
            >
              <Play className="w-4 h-4 fill-amber-300" />
            </button>
          )}

          <button
            type="button"
            onClick={onStopSpeaking}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-red-950/60 hover:text-red-300 text-stone-300 rounded-xl text-xs font-semibold transition border border-stone-700/60"
            title="Stop speaking"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Stop</span>
          </button>
        </div>
      </div>
    );
  }

  // Processing State
  if (voiceState === 'processing') {
    return (
      <div className="flex items-center justify-between gap-3 p-3 bg-stone-900 border border-stone-800 rounded-2xl text-xs">
        <div className="flex items-center gap-2 text-stone-300 font-medium">
          <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
          <span>Gemini is synthesizing reflection...</span>
        </div>
        <button
          onClick={onStopSpeaking}
          className="text-stone-500 hover:text-stone-300 p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return null;
};
