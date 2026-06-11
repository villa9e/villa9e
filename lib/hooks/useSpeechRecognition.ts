'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

// ── Minimal Web Speech API typings (not in lib.dom by default) ────────────────
interface SpeechRecognitionAlternative { transcript: string; confidence: number }
interface SpeechRecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event { readonly error: string }
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export interface UseSpeechRecognitionOptions {
  /** Auto-stop after this many ms of silence following speech (default 1400). */
  silenceMs?: number;
  /** BCP-47 language tag (default 'en-US'). */
  lang?: string;
  /** Called with the final transcript when a phrase completes. */
  onResult?: (finalTranscript: string) => void;
}

export interface UseSpeechRecognitionReturn {
  supported:  boolean;
  listening:  boolean;
  /** Live transcript (interim + final) while listening. */
  transcript: string;
  /** Permission / runtime error, if any. */
  error:      string | null;
  start:      () => void;
  stop:       () => void;
  reset:      () => void;
}

/**
 * Speech-to-text via the browser's Web Speech API.
 * Free, real-time, no backend. Works in Chrome / Edge / Safari.
 * Auto-stops after a short silence and fires onResult with the final phrase.
 */
export function useSpeechRecognition(opts: UseSpeechRecognitionOptions = {}): UseSpeechRecognitionReturn {
  const { silenceMs = 1400, lang = 'en-US', onResult } = opts;

  const [supported,  setSupported]  = useState(false);
  const [listening,  setListening]  = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error,      setError]      = useState<string | null>(null);

  const recogRef    = useRef<SpeechRecognitionLike | null>(null);
  const silenceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalRef    = useRef('');
  const onResultRef = useRef(onResult);
  const manualStop  = useRef(false);
  onResultRef.current = onResult;

  useEffect(() => { setSupported(!!getRecognitionCtor()); }, []);

  const clearSilence = () => {
    if (silenceRef.current) { clearTimeout(silenceRef.current); silenceRef.current = null; }
  };

  const stop = useCallback(() => {
    manualStop.current = true;
    clearSilence();
    try { recogRef.current?.stop(); } catch { /* noop */ }
  }, []);

  const reset = useCallback(() => {
    finalRef.current = '';
    setTranscript('');
    setError(null);
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) { setError('Voice input is not supported in this browser.'); return; }
    if (listening) return;

    // Tear down any previous instance
    try { recogRef.current?.abort(); } catch { /* noop */ }

    const recog = new Ctor();
    recog.lang            = lang;
    recog.continuous      = true;
    recog.interimResults  = true;
    recog.maxAlternatives = 1;

    finalRef.current = '';
    manualStop.current = false;
    setTranscript('');
    setError(null);

    // Commit whatever we've heard and stop, letting onend fire onResult.
    const commit = () => {
      clearSilence();
      try { recog.stop(); } catch { /* noop */ }
    };

    recog.onstart = () => setListening(true);

    recog.onresult = (e: SpeechRecognitionEvent) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalRef.current += r[0].transcript;
        else interim += r[0].transcript;
      }
      setTranscript((finalRef.current + interim).trim());

      // Reset the silence timer on every bit of speech
      clearSilence();
      if (finalRef.current.trim() || interim.trim()) {
        silenceRef.current = setTimeout(commit, silenceMs);
      }
    };

    recog.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === 'no-speech') return; // benign — keep waiting
      if (e.error === 'aborted')  return;
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        setError('Microphone access was blocked. Enable it in your browser settings.');
      } else {
        setError(`Voice error: ${e.error}`);
      }
    };

    recog.onend = () => {
      clearSilence();
      setListening(false);
      const finalText = finalRef.current.trim();
      if (finalText && !manualStop.current) onResultRef.current?.(finalText);
    };

    recogRef.current = recog;
    try {
      recog.start();
    } catch {
      // start() throws if called while already started — ignore
    }
  }, [lang, silenceMs, listening]);

  // Cleanup on unmount
  useEffect(() => () => {
    clearSilence();
    try { recogRef.current?.abort(); } catch { /* noop */ }
  }, []);

  return { supported, listening, transcript, error, start, stop, reset };
}
