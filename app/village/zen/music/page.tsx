'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const MOODS = [
  { value: 'great',    label: 'Great',   emoji: '🌟', desc: 'High energy, motivating' },
  { value: 'good',     label: 'Good',    emoji: '😊', desc: 'Feel-good vibes' },
  { value: 'neutral',  label: 'Focused', emoji: '🎯', desc: 'Deep focus, flow state' },
  { value: 'low',      label: 'Calm',    emoji: '🌿', desc: 'Restore & relax' },
  { value: 'very_low', label: 'Rest',    emoji: '🌙', desc: 'Sleep & deep rest' },
];

export default function ZenMusicPage() {
  const [selectedMood, setSelectedMood] = useState('neutral');
  const [music, setMusic] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<number>(0);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadMusic(selectedMood);
  }, [selectedMood]);

  async function loadMusic(mood: string) {
    setLoading(true);
    setMusic(null);
    try {
      const res = await fetch(`/api/spotify/recommendations?mood=${mood}`);
      if (res.ok) setMusic(await res.json());
    } catch { /* silent */ }
    setLoading(false);
  }

  function playPreview(url: string) {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (url) {
      const audio = new Audio(url);
      audio.play().catch(() => {});
      audioRef.current = audio;
      setPlaying(true);
      audio.onended = () => setPlaying(false);
    }
  }

  function stopPreview() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlaying(false);
  }

  const currentMood = MOODS.find(m => m.value === selectedMood) ?? MOODS[2];

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-900 to-gray-900 text-white">
      <div className="bg-black/30 px-6 py-4 flex items-center gap-3">
        <Link href="/village/zen" className="text-xl text-white/70 hover:text-white">←</Link>
        <span className="text-2xl">🎵</span>
        <h1 className="text-xl font-bold">Zen Music</h1>
      </div>

      <div className="max-w-md mx-auto p-6 space-y-6">
        {/* Mood selector */}
        <div>
          <p className="text-white/60 text-sm mb-3">How are you feeling?</p>
          <div className="grid grid-cols-5 gap-2">
            {MOODS.map(m => (
              <button key={m.value} onClick={() => setSelectedMood(m.value)}
                className={`py-2 px-1 rounded-xl text-center transition-all ${selectedMood === m.value ? 'bg-white/20 ring-2 ring-white/50' : 'bg-white/10 hover:bg-white/15'}`}>
                <p className="text-xl">{m.emoji}</p>
                <p className="text-xs mt-1 font-medium">{m.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Now playing display */}
        <div className="bg-white/10 rounded-3xl p-6 text-center">
          <div className="text-6xl mb-3 animate-pulse">{currentMood.emoji}</div>
          <p className="font-bold text-lg">{currentMood.label} Mode</p>
          <p className="text-white/60 text-sm">{currentMood.desc}</p>
        </div>

        {/* Playlist / tracks */}
        {loading && (
          <div className="text-center py-8 text-white/50">
            <div className="text-3xl mb-2 animate-pulse">🎵</div>
            <p className="text-sm">Finding your music…</p>
          </div>
        )}

        {music && music.type === 'playlist' && (
          <div className="bg-white/10 rounded-2xl p-5">
            <p className="text-white/60 text-xs mb-2">Spirit-curated playlist</p>
            <p className="font-bold mb-3">{music.name}</p>
            <iframe
              src={`https://open.spotify.com/embed/playlist/${music.embed}?utm_source=generator&theme=0`}
              width="100%" height="152" frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy" className="rounded-xl"
            />
            <a href={music.url} target="_blank" rel="noreferrer"
              className="mt-3 flex items-center justify-center gap-2 bg-green-500 text-white rounded-full py-2.5 text-sm font-bold hover:bg-green-600">
              <span>🎧</span> Open in Spotify
            </a>
          </div>
        )}

        {music && music.type === 'tracks' && music.tracks?.length > 0 && (
          <div className="space-y-2">
            {music.tracks.map((track: any, i: number) => (
              <motion.div key={track.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className={`flex items-center gap-3 bg-white/10 rounded-2xl p-3 cursor-pointer hover:bg-white/15 transition-colors ${i === currentTrack ? 'ring-1 ring-white/30' : ''}`}
                onClick={() => { setCurrentTrack(i); track.preview_url ? playPreview(track.preview_url) : window.open(track.spotify_url, '_blank'); }}>
                {track.image && <img src={track.image} alt="" className="w-12 h-12 rounded-xl flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{track.name}</p>
                  <p className="text-white/60 text-xs truncate">{track.artist}</p>
                </div>
                <span className="text-white/40 text-xs">{Math.floor(track.duration_ms / 60000)}:{String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}</span>
              </motion.div>
            ))}
          </div>
        )}

        {playing && (
          <button onClick={stopPreview} className="w-full bg-white/10 text-white rounded-full py-3 text-sm font-medium hover:bg-white/20">
            ⏸ Stop Preview
          </button>
        )}
      </div>
    </div>
  );
}
