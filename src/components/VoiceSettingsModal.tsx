import React, { useState } from 'react';
import { 
  Volume2, 
  Settings2, 
  X, 
  Check, 
  Play, 
  RotateCcw, 
  ShieldCheck, 
  Mic, 
  Sparkles,
  Sliders,
  Globe
} from 'lucide-react';
import { VoiceSettings } from '../types';
import { DEFAULT_VOICE_SETTINGS } from '../lib/useVoiceAssistant';

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: VoiceSettings;
  onUpdateSettings: (settings: VoiceSettings) => void;
  availableVoices: SpeechSynthesisVoice[];
  onTestVoice: (text: string) => void;
}

const SUPPORTED_LANGUAGES = [
  { code: 'en-US', name: 'English (United States)' },
  { code: 'en-IN', name: 'English (India)' },
  { code: 'en-GB', name: 'English (United Kingdom)' },
  { code: 'en-AU', name: 'English (Australia)' },
  { code: 'en-CA', name: 'English (Canada)' },
  { code: 'es-ES', name: 'Spanish (Spain)' },
  { code: 'es-US', name: 'Spanish (United States)' },
  { code: 'fr-FR', name: 'French (France)' },
  { code: 'de-DE', name: 'German (Germany)' },
  { code: 'ja-JP', name: 'Japanese (Japan)' },
];

export const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  availableVoices,
  onTestVoice,
}) => {
  const [localSettings, setLocalSettings] = useState<VoiceSettings>(settings);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateSettings(localSettings);
    onClose();
  };

  const handleReset = () => {
    setLocalSettings(DEFAULT_VOICE_SETTINGS);
  };

  const filteredVoices = availableVoices.filter(
    (v) => v.lang.toLowerCase().startsWith(localSettings.language.toLowerCase().slice(0, 2)) ||
           v.lang.toLowerCase().includes(localSettings.language.toLowerCase())
  );

  const displayVoices = filteredVoices.length > 0 ? filteredVoices : availableVoices;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 text-stone-200 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/20">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-stone-100">
                Voice &amp; Speech Preferences
              </h2>
              <p className="text-xs text-stone-400">
                Customize speech synthesis, recognition language, and hands-free conversation.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="space-y-5 text-sm">
          {/* Toggles */}
          <div className="space-y-3 bg-stone-950 p-4 rounded-2xl border border-stone-800/80">
            <label className="flex items-start justify-between gap-3 cursor-pointer">
              <div className="space-y-0.5">
                <span className="font-semibold text-stone-200 text-xs sm:text-sm">
                  Auto-Read AI Responses
                </span>
                <p className="text-xs text-stone-400">
                  Automatically convert Gemini's reflection and responses into natural speech.
                </p>
              </div>
              <input
                type="checkbox"
                checked={localSettings.autoSpeak}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, autoSpeak: e.target.checked })
                }
                className="w-4 h-4 rounded mt-1 accent-amber-400 cursor-pointer"
              />
            </label>

            <div className="border-t border-stone-800 pt-3">
              <label className="flex items-start justify-between gap-3 cursor-pointer">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-stone-200 text-xs sm:text-sm">
                      Hands-Free Continuous Mode
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-amber-400/10 text-amber-400 text-[10px] font-mono border border-amber-400/20">
                      Live Flow
                    </span>
                  </div>
                  <p className="text-xs text-stone-400">
                    Automatically re-open the microphone after Gemini finishes speaking for seamless voice dialogue.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.continuousMode}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, continuousMode: e.target.checked })
                  }
                  className="w-4 h-4 rounded mt-1 accent-amber-400 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Language Selector */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-300">
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span>Speech Recognition &amp; Voice Language</span>
            </label>
            <select
              value={localSettings.language}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, language: e.target.value })
              }
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-stone-200 focus:outline-none focus:border-amber-400 transition"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name} ({lang.code})
                </option>
              ))}
            </select>
          </div>

          {/* Voice selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-300">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>Text-to-Speech Voice</span>
              </label>
              <button
                type="button"
                onClick={() =>
                  onTestVoice('Welcome to your AI Journal. I am listening and ready to reflect with you.')
                }
                className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300 transition"
              >
                <Play className="w-3 h-3 fill-amber-400" />
                <span>Test Voice</span>
              </button>
            </div>

            <select
              value={localSettings.voiceURI || ''}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, voiceURI: e.target.value })
              }
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-stone-200 focus:outline-none focus:border-amber-400 transition truncate"
            >
              {displayVoices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang}) {v.default ? '★ System Default' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Sliders: Rate and Pitch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-stone-950 p-4 rounded-2xl border border-stone-800/80">
            {/* Speed Rate */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-stone-300">Speaking Rate</span>
                <span className="font-mono text-amber-400">{localSettings.speechRate}x</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.5"
                step="0.05"
                value={localSettings.speechRate}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    speechRate: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-amber-400 cursor-pointer h-1.5 bg-stone-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-stone-500 font-mono">
                <span>0.7x (Calm)</span>
                <span>1.0x (Normal)</span>
                <span>1.5x (Fast)</span>
              </div>
            </div>

            {/* Pitch */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-stone-300">Pitch &amp; Tone</span>
                <span className="font-mono text-amber-400">{localSettings.speechPitch}</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.3"
                step="0.05"
                value={localSettings.speechPitch}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    speechPitch: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-amber-400 cursor-pointer h-1.5 bg-stone-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-stone-500 font-mono">
                <span>Deep</span>
                <span>Natural</span>
                <span>Bright</span>
              </div>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-stone-950/60 border border-stone-800 text-xs text-stone-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-stone-200">Zero Audio Storage:</strong> Voice recognition and speech synthesis occur locally in your browser. Only transcribed text is securely transmitted to your private Firestore database.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-stone-800 pt-4">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-200 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-300 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold transition shadow-md"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Save Preferences</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
