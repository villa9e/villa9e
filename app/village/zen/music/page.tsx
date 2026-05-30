'use client';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const MOODS = [
  { value: 'great',    label: 'Great',   emoji: '🌟', desc: 'High energy, motivating',   color: '#F59E0B' },
  { value: 'good',     label: 'Good',    emoji: '😊', desc: 'Feel-good vibes',            color: '#10B981' },
  { value: 'neutral',  label: 'Focused', emoji: '🎯', desc: 'Deep focus, flow state',     color: '#6366F1' },
  { value: 'low',      label: 'Calm',    emoji: '🌿', desc: 'Restore & relax',            color: '#0EA5E9' },
  { value: 'very_low', label: 'Rest',    emoji: '🌙', desc: 'Sleep & deep rest',          color: '#8B5CF6' },
];

// Curated spotify playlists per mood (embed IDs)
const PLAYLISTS: Record<string, { name: string; embed: string; url: string }> = {
  great:    { name: 'High Vibration',   embed: '37i9dQZF1DX0vHZ8elq0UK', url: 'https://open.spotify.com/playlist/37i9dQZF1DX0vHZ8elq0UK' },
  good:     { name: 'Good Vibes',       embed: '37i9dQZF1DX3rxVfibe1L0', url: 'https://open.spotify.com/playlist/37i9dQZF1DX3rxVfibe1L0' },
  neutral:  { name: 'Deep Focus',       embed: '37i9dQZF1DWZeKCadgRdKQ', url: 'https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ' },
  low:      { name: 'Peaceful Piano',   embed: '37i9dQZF1DX4sWSpwq3LiO', url: 'https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO' },
  very_low: { name: 'Sleep',            embed: '37i9dQZF1DWZd79rJ6a7lp', url: 'https://open.spotify.com/playlist/37i9dQZF1DWZd79rJ6a7lp' },
};

export default function ZenMusicPage() {
  const [selectedMood, setSelectedMood] = useState('neutral');
  const currentMood = MOODS.find(m => m.value === selectedMood) ?? MOODS[2];
  const playlist = PLAYLISTS[selectedMood];

  return (
    <div className="min-h-screen" style={{ background: '#F8FFFE' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 border-b border-emerald-100"
        style={{ background: '#FFFFFF' }}>
        <Link href="/village/zen" className="text-xl text-emerald-700">←</Link>
        <span className="text-2xl">🎵</span>
        <div className="flex-1">
          <h1 className="text-lg font-black text-gray-900">Zen Music</h1>
          <p className="text-xs text-gray-400">Mood-matched playlists from Spirit</p>
        </div>
      </div>

      <div className="max-w-md mx-auto p-5 space-y-6">
        {/* Mood selector */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">How are you feeling?</p>
          <div className="grid grid-cols-5 gap-2">
            {MOODS.map(m => (
              <button key={m.value} onClick={() => setSelectedMood(m.value)}
                className="py-3 px-1 rounded-2xl text-center transition-all"
                style={{
                  background: selectedMood === m.value ? `${m.color}18` : '#F3F4F6',
                  border: `2px solid ${selectedMood === m.value ? m.color : 'transparent'}`,
                }}>
                <p className="text-2xl">{m.emoji}</p>
                <p className="text-[10px] mt-1 font-bold" style={{ color: selectedMood === m.value ? m.color : '#6B7280' }}>{m.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Now vibe display */}
        <motion.div key={selectedMood} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-6 text-center"
          style={{ background: `${currentMood.color}12`, border: `1.5px solid ${currentMood.color}30` }}>
          <p className="text-5xl mb-2">{currentMood.emoji}</p>
          <p className="font-black text-lg" style={{ color: currentMood.color }}>{currentMood.label} Mode</p>
          <p className="text-sm text-gray-500 mt-1">{currentMood.desc}</p>
        </motion.div>

        {/* Spotify embed */}
        {playlist && (
          <motion.div key={playlist.embed} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            <div className="px-4 pt-4 pb-2 bg-white">
              <p className="text-xs text-gray-400 mb-1">Spirit-curated for you</p>
              <p className="font-bold text-gray-800">{playlist.name}</p>
            </div>
            <iframe
              src={`https://open.spotify.com/embed/playlist/${playlist.embed}?utm_source=generator`}
              width="100%" height="352" frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
            />
            <div className="p-4 bg-white border-t border-gray-100">
              <a href={playlist.url} target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-full py-3 text-sm font-bold text-white"
                style={{ background: '#1DB954' }}>
                <span>🎧</span> Open in Spotify
              </a>
            </div>
          </motion.div>
        )}

        {/* Spirit quote */}
        <div className="rounded-2xl p-4 flex items-start gap-3"
          style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
          <span className="text-2xl">🌿</span>
          <p className="text-sm text-emerald-700 italic leading-relaxed">
            "Music is medicine. Let it move through you, not just past you. Each playlist was chosen to match your frequency."
          </p>
        </div>
      </div>
    </div>
  );
}
