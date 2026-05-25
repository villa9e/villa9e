'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const MOODS = [
  { value: 'great', emoji: '🌟', label: 'Great', score: 9 },
  { value: 'good', emoji: '😊', label: 'Good', score: 7 },
  { value: 'neutral', emoji: '😐', label: 'Okay', score: 5 },
  { value: 'low', emoji: '😔', label: 'Low', score: 3 },
  { value: 'very_low', emoji: '😞', label: 'Rough', score: 1 },
];

export default function ZenSpacePage() {
  const [selectedMood, setSelectedMood] = useState('');
  const [spiritResponse, setSpiritResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function checkIn() {
    const mood = MOODS.find(m => m.value === selectedMood);
    if (!mood) return;
    setLoading(true);
    const res = await fetch('/api/claude/spirit-response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'morning', mood: mood.value, mood_score: mood.score, energy_level: mood.score }),
    });
    const data = await res.json();
    setSpiritResponse(data);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-teal-50">
      <div className="bg-cyan-500 text-white px-6 py-4 flex items-center gap-3">
        <Link href="/village/map" className="text-xl">←</Link>
        <span className="text-2xl">🧘</span>
        <h1 className="text-xl font-bold">Zen Space</h1>
      </div>

      <div className="max-w-lg mx-auto p-6 space-y-6">
        <div className="village-card text-center">
          <h2 className="text-2xl font-bold mb-1">Mindful Moment</h2>
          <p className="text-gray-500">How are you feeling right now?</p>
          <div className="flex justify-center gap-4 mt-6">
            {MOODS.map(mood => (
              <button
                key={mood.value}
                onClick={() => setSelectedMood(mood.value)}
                className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${
                  selectedMood === mood.value ? 'bg-cyan-100 scale-110 shadow-md' : 'hover:bg-gray-50'
                }`}
              >
                <span className="text-3xl">{mood.emoji}</span>
                <span className="text-xs text-gray-600">{mood.label}</span>
              </button>
            ))}
          </div>
          <button
            onClick={checkIn}
            disabled={!selectedMood || loading}
            className="mt-6 village-btn-primary w-full disabled:opacity-50"
          >
            {loading ? '🤖 Spirit is listening…' : '✨ Talk to Spirit'}
          </button>
        </div>

        {spiritResponse && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="village-card bg-gradient-to-br from-cyan-50 to-teal-50">
              <p className="font-bold text-cyan-700 mb-2">Spirit says:</p>
              <p className="text-gray-700 mb-3">{spiritResponse.greeting}</p>
              {spiritResponse.affirmation && (
                <div className="bg-white rounded-xl p-3 border border-cyan-100">
                  <p className="text-sm italic text-cyan-700">"{spiritResponse.affirmation}"</p>
                </div>
              )}
              {spiritResponse.focus_tip && (
                <p className="text-sm text-gray-600 mt-3">{spiritResponse.focus_tip}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { emoji: '🧘', label: 'Meditate', href: '#' },
                { emoji: '📓', label: 'Journal', href: '#' },
                { emoji: '🎵', label: 'Music', href: '#' },
                { emoji: '🌿', label: 'Breathe', href: '#' },
              ].map(item => (
                <button key={item.label} className="village-card flex items-center gap-3 hover:shadow-md transition-shadow">
                  <span className="text-2xl">{item.emoji}</span>
                  <span className="font-medium text-sm">{item.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
