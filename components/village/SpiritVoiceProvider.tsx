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
  const [voiceEnabled, _setVoiceEnabled] = useState(false);
  const [voiceGender,  _setVoiceGender]  = useState<VoiceGender>('female');
  const [speaking,     setSpeaking]      = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Restore preferences from localStorage (client-only)
  useEffect(() => {
    const enabled = localStorage.getItem('spirit_voice_enabled') === 'true';
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
    // Always use the current value from localStorage since state might be stale
    const isEnabled = localStorage.getItem('spirit_voice_enabled') === 'true';
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

      if (!res.ok || ctrl.signal.aborted) { setSpeaking(false); return; }

      const blob = await res.blob();
      if (ctrl.signal.aborted) { setSpeaking(false); return; }

      const url   = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => { URL.revokeObjectURL(url); setSpeaking(false); };
      audio.onerror = () => { URL.revokeObjectURL(url); setSpeaking(false); };

      await audio.play();
    } catch (e: any) {
      if (e.name !== 'AbortError') console.error('Spirit voice error:', e.message);
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
