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
    setSpeaking(false);
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

      if (!res.ok || ctrl.signal.aborted) {
        setSpeaking(false);
        if (!res.ok) console.warn(`Spirit voice API error ${res.status} — check ELEVENLABS_API_KEY in Vercel env vars`);
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
      if (e.name !== 'AbortError') {
        // NotAllowedError = browser blocked autoplay; user must interact first
        if (e.name === 'NotAllowedError') {
          console.warn('Spirit voice blocked — needs user interaction first');
        } else {
          console.error('Spirit voice error:', e.message);
        }
      }
      setSpeaking(false);
    }
  }, [stop]);

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
