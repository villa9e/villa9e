'use client';
import { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';

export type VoiceGender = 'female' | 'male';
export type VoiceTone   = 'casual' | 'serious' | 'neutral';

interface SpiritVoiceCtx {
  voiceEnabled:   boolean;
  voiceGender:    VoiceGender;
  speaking:       boolean;
  toggleVoice:    () => void;
  setGender:      (g: VoiceGender) => void;
  speak:          (text: string, tone?: VoiceTone) => void;
  stop:           () => void;
}

const Ctx = createContext<SpiritVoiceCtx>({
  voiceEnabled: false,
  voiceGender:  'female',
  speaking:     false,
  toggleVoice:  () => {},
  setGender:    () => {},
  speak:        () => {},
  stop:         () => {},
});

export const useSpiritVoice = () => useContext(Ctx);

export function SpiritVoiceProvider({ children }: { children: React.ReactNode }) {
  const [voiceEnabled, _setVoiceEnabled] = useState(true); // on by default; muted via 🔇 or settings
  const [voiceGender,  _setVoiceGender]  = useState<VoiceGender>('female');
  const [speaking,     setSpeaking]      = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Restore preferences from localStorage (client-only)
  // Default is ON unless user explicitly set it to 'false'
  useEffect(() => {
    const stored = localStorage.getItem('spirit_voice_enabled');
    const enabled = stored === null ? true : stored === 'true';
    const gender  = (localStorage.getItem('spirit_voice_gender') ?? 'female') as VoiceGender;
    _setVoiceEnabled(enabled);
    _setVoiceGender(gender);
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    // Also cancel any browser-synth fallback that might be playing
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  }, []);

  // Browser-native TTS fallback — used when ElevenLabs is unavailable
  // (e.g. quota exceeded). Free, offline, always available in modern browsers.
  const speakWithBrowser = useCallback((text: string, gender: VoiceGender) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSpeaking(false);
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      // Prefer a natural English voice matching the chosen gender
      const femaleHints = ['samantha', 'female', 'victoria', 'karen', 'moira', 'tessa', 'zira'];
      const maleHints   = ['daniel', 'male', 'alex', 'fred', 'rishi', 'aaron'];
      const hints = gender === 'male' ? maleHints : femaleHints;
      const en = voices.filter(v => v.lang.startsWith('en'));
      const match =
        en.find(v => hints.some(h => v.name.toLowerCase().includes(h))) ??
        en[0] ?? voices[0];
      if (match) utter.voice = match;
      utter.rate  = 1.02;
      utter.pitch = gender === 'male' ? 0.92 : 1.05;
      utter.onend   = () => setSpeaking(false);
      utter.onerror = () => setSpeaking(false);
      setSpeaking(true);
      window.speechSynthesis.speak(utter);
    } catch {
      setSpeaking(false);
    }
  }, []);

  const speak = useCallback(async (text: string, tone?: VoiceTone) => {
    // Read from localStorage; null means default ON
    const stored    = localStorage.getItem('spirit_voice_enabled');
    const isEnabled = stored === null ? true : stored === 'true';
    if (!isEnabled || !text?.trim()) return;

    stop();

    const gender = (localStorage.getItem('spirit_voice_gender') ?? 'female') as VoiceGender;
    const ctrl   = new AbortController();
    abortRef.current = ctrl;
    setSpeaking(true);

    try {
      const res = await fetch('/api/spirit/voice', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ text, gender, tone }),
        signal:  ctrl.signal,
      });

      if (ctrl.signal.aborted) { setSpeaking(false); return; }

      // ElevenLabs unavailable (e.g. quota exceeded) — fall back to browser TTS
      if (!res.ok) {
        console.warn(`Spirit voice API error ${res.status} — falling back to browser voice`);
        speakWithBrowser(text, gender);
        return;
      }

      const blob = await res.blob();
      if (ctrl.signal.aborted) { setSpeaking(false); return; }

      const url   = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => { URL.revokeObjectURL(url); setSpeaking(false); };
      audio.onerror = () => { URL.revokeObjectURL(url); setSpeaking(false); };

      // audio.play() throws DOMException if called before user interaction
      // Caller is responsible for ensuring this runs after a user gesture
      await audio.play();
    } catch (e: any) {
      if (e.name === 'AbortError') { setSpeaking(false); return; }
      // Network/other failure — try the browser voice before giving up
      if (e.name === 'NotAllowedError') {
        console.warn('Spirit voice blocked — needs user interaction first');
        setSpeaking(false);
      } else {
        console.warn('Spirit voice error, falling back to browser voice:', e.message);
        speakWithBrowser(text, gender);
      }
    }
  }, [stop, speakWithBrowser]);

  const toggleVoice = useCallback(() => {
    _setVoiceEnabled(prev => {
      const next = !prev;
      localStorage.setItem('spirit_voice_enabled', String(next));
      if (!next) stop();
      return next;
    });
  }, [stop]);

  const setGender = useCallback((g: VoiceGender) => {
    _setVoiceGender(g);
    localStorage.setItem('spirit_voice_gender', g);
  }, []);

  return (
    <Ctx.Provider value={{ voiceEnabled, voiceGender, speaking, toggleVoice, setGender, speak, stop }}>
      {children}
    </Ctx.Provider>
  );
}
