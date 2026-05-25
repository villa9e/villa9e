'use client';
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface SpiritVoiceProps {
  text: string;
  autoPlay?: boolean;
  label?: string;
}

export function SpiritVoice({ text, autoPlay = false, label = 'Listen to Spirit' }: SpiritVoiceProps) {
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (autoPlay && text) { handlePlay(); }
    return () => { audioRef.current?.pause(); };
  }, [text]);

  async function handlePlay() {
    if (playing) { audioRef.current?.pause(); setPlaying(false); return; }
    if (!text) return;
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/spirit/voice', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) { setError('Voice unavailable'); setLoading(false); return; }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      if (audioRef.current) { audioRef.current.pause(); URL.revokeObjectURL(audioRef.current.src); }
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setPlaying(false);
      audio.onerror = () => { setError('Playback error'); setPlaying(false); };
      await audio.play();
      setPlaying(true);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-2">
      <motion.button
        onClick={handlePlay}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        disabled={loading || !text}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
          playing ? 'bg-cyan-600 text-white' : 'bg-cyan-50 text-cyan-700 border border-cyan-200 hover:bg-cyan-100'
        } disabled:opacity-40`}
      >
        {loading ? (
          <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>⟳</motion.span>
        ) : playing ? (
          <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 0.6 }}>🔊</motion.span>
        ) : '🎙️'}
        <span>{loading ? 'Loading…' : playing ? 'Playing…' : label}</span>
      </motion.button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
