import { useState, useEffect, useRef, useCallback } from 'react';
import { VoiceSettings, VoiceState } from '../types';

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  autoSpeak: true,
  continuousMode: false,
  speechRate: 1.0,
  speechPitch: 1.0,
  voiceURI: null,
  language: 'en-US',
};

const STORAGE_KEY = 'ai_journal_voice_settings';

export function getStoredVoiceSettings(): VoiceSettings {
  try {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_VOICE_SETTINGS, ...JSON.parse(saved) };
      }
    }
  } catch (e) {
    console.warn('Failed to parse saved voice settings:', e);
  }
  return DEFAULT_VOICE_SETTINGS;
}

export function saveStoredVoiceSettings(settings: VoiceSettings): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }
  } catch (e) {
    console.warn('Failed to save voice settings:', e);
  }
}

// Utility to clean markdown formatting so TTS reads fluidly
export function cleanMarkdownForTTS(text: string): string {
  if (!text) return '';
  return text
    .replace(/^#+\s+/gm, '') // headings
    .replace(/\*\*(.*?)\*\*/g, '$1') // bold
    .replace(/\*(.*?)\*/g, '$1') // italic
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`{3}[\s\S]*?`{3}/g, 'code snippet omitted') // code blocks
    .replace(/`([^`]+)`/g, '$1') // inline code
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // links
    .replace(/^[-*+]\s+/gm, '') // list markers
    .replace(/^\d+\.\s+/gm, '') // numbered lists
    .replace(/---+/g, '') // hr
    .replace(/>\s+/g, '') // blockquotes
    .replace(/📌|✨|🤖|👤|💡|🎯|🌧️|📉|😊|😐/g, '') // icons/emojis
    .replace(/\s+/g, ' ')
    .trim();
}

export function useVoiceAssistant(options?: {
  onTranscriptSubmitted?: (text: string) => void;
}) {
  const [settings, setSettings] = useState<VoiceSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_VOICE_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to parse saved voice settings:', e);
    }
    return DEFAULT_VOICE_SETTINGS;
  });

  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isSupportedSTT, setIsSupportedSTT] = useState(true);
  const [isSupportedTTS, setIsSupportedTTS] = useState(true);

  const recognitionRef = useRef<any>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isManuallyStoppedRef = useRef(false);
  const accumulatedTranscriptRef = useRef('');

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save voice settings:', e);
    }
  }, [settings]);

  // Load available TTS voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSupportedTTS(false);
      return;
    }

    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        setAvailableVoices(voices);
        // If current voiceURI is not selected, pick a good natural default
        if (!settings.voiceURI) {
          const preferred = voices.find(
            (v) => (v.lang.startsWith('en') || v.lang.startsWith(settings.language.slice(0, 2))) &&
                   (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Neural') || v.default)
          ) || voices[0];
          if (preferred) {
            setSettings((prev) => ({ ...prev, voiceURI: preferred.voiceURI }));
          }
        }
      }
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [settings.language]);

  // Check STT support
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupportedSTT(false);
    }
  }, []);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMessageId(null);
    if (voiceState === 'speaking' || voiceState === 'paused') {
      setVoiceState('idle');
    }
  }, [voiceState]);

  // Pause / Resume speech
  const pauseSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
      setVoiceState('paused');
    }
  }, []);

  const resumeSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
      setVoiceState('speaking');
    }
  }, []);

  // Speak text with TTS
  const speakText = useCallback(
    (text: string, messageId?: string, onComplete?: () => void) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        return;
      }

      const cleanText = cleanMarkdownForTTS(text);
      if (!cleanText) return;

      // Cancel any ongoing speech first
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = settings.speechRate;
      utterance.pitch = settings.speechPitch;
      utterance.lang = settings.language;

      // Match voice
      if (settings.voiceURI && availableVoices.length > 0) {
        const matched = availableVoices.find((v) => v.voiceURI === settings.voiceURI);
        if (matched) {
          utterance.voice = matched;
        }
      }

      utterance.onstart = () => {
        setVoiceState('speaking');
        setSpeakingMessageId(messageId || 'current');
      };

      utterance.onend = () => {
        setVoiceState('idle');
        setSpeakingMessageId(null);
        if (onComplete) onComplete();
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis error:', e);
        setVoiceState('idle');
        setSpeakingMessageId(null);
      };

      speechRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [availableVoices, settings]
  );

  // Stop listening
  const stopListening = useCallback((submit = true) => {
    isManuallyStoppedRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore if already stopped
      }
    }
    const finalResult = accumulatedTranscriptRef.current.trim();
    setVoiceState('idle');
    setInterimTranscript('');

    if (submit && finalResult && options?.onTranscriptSubmitted) {
      options.onTranscriptSubmitted(finalResult);
      accumulatedTranscriptRef.current = '';
      setFinalTranscript('');
    }
  }, [options]);

  // Cancel listening without submitting
  const cancelListening = useCallback(() => {
    isManuallyStoppedRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // Ignore
      }
    }
    setVoiceState('idle');
    setInterimTranscript('');
    setFinalTranscript('');
    accumulatedTranscriptRef.current = '';
  }, []);

  // Start listening
  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMessage('Speech recognition is not supported in this browser. Please use Google Chrome, Edge, or Safari.');
      setVoiceState('error');
      return;
    }

    // Stop speaking if playing
    stopSpeaking();

    // Reset transcripts
    setInterimTranscript('');
    setFinalTranscript('');
    accumulatedTranscriptRef.current = '';
    setErrorMessage(null);
    isManuallyStoppedRef.current = false;

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = settings.language;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setVoiceState('listening');
      };

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let currentFinal = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptSegment = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            currentFinal += transcriptSegment + ' ';
          } else {
            currentInterim += transcriptSegment;
          }
        }

        if (currentFinal) {
          accumulatedTranscriptRef.current += currentFinal;
          setFinalTranscript(accumulatedTranscriptRef.current);
        }
        setInterimTranscript(currentInterim);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setErrorMessage('Microphone access was denied. Please allow microphone permissions in your browser settings.');
          setVoiceState('error');
        } else if (event.error === 'no-speech') {
          // If no speech, keep listening unless manually stopped
          if (!isManuallyStoppedRef.current && voiceState === 'listening') {
            // Keep state
          }
        } else if (event.error !== 'aborted') {
          setErrorMessage(`Speech recognition error: ${event.error}`);
          setVoiceState('error');
        }
      };

      recognition.onend = () => {
        // If continuous mode or listening was not aborted
        if (!isManuallyStoppedRef.current && voiceState === 'listening') {
          try {
            recognition.start();
            return;
          } catch (e) {}
        }

        if (voiceState === 'listening') {
          setVoiceState('idle');
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setErrorMessage(err.message || 'Failed to initialize microphone');
      setVoiceState('error');
    }
  }, [settings.language, stopSpeaking, voiceState]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    voiceState,
    setVoiceState,
    settings,
    setSettings,
    interimTranscript,
    finalTranscript,
    fullLiveTranscript: (finalTranscript + ' ' + interimTranscript).trim(),
    errorMessage,
    setErrorMessage,
    availableVoices,
    speakingMessageId,
    isSupportedSTT,
    isSupportedTTS,
    startListening,
    stopListening,
    cancelListening,
    speakText,
    stopSpeaking,
    pauseSpeaking,
    resumeSpeaking,
  };
}
