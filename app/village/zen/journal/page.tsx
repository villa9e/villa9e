'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const AI_PROMPTS = [
  'What am I most grateful for today?',
  'What challenge taught me the most this week?',
  'What step am I afraid to take, and why?',
  'How did I show up for my goals today?',
  'What would my future self thank me for doing right now?',
  'What is one thing I need to release to move forward?',
  'Who in my village inspired me lately, and why?',
  'What does success actually feel like to me — not what I think it should?',
];

export default function JournalPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [writing, setWriting] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => { loadEntries(); }, []);

  async function loadEntries() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('journal_entries').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20);
    setEntries(data ?? []);
  }

  function getPrompt() {
    const p = AI_PROMPTS[Math.floor(Math.random() * AI_PROMPTS.length)];
    setPrompt(p);
    setContent('');
    setWriting(true);
  }

  async function saveEntry() {
    if (!content.trim()) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('journal_entries').insert({
        user_id:       user.id,
        content:       content.trim(),
        ai_prompt_used: prompt || null,
        is_private:    true,
      });
      loadEntries();
      setContent('');
      setPrompt('');
      setWriting(false);
    }
    setSaving(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-indigo-50">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 flex items-center gap-3">
        <Link href="/village/zen" className="text-xl">←</Link>
        <span className="text-2xl">📓</span>
        <div>
          <h1 className="text-xl font-bold leading-tight">Journal</h1>
          <p className="text-purple-100 text-xs">Private reflections · AI-prompted</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {!writing ? (
          <>
            <div className="village-card text-center">
              <p className="text-4xl mb-3">📓</p>
              <h2 className="font-bold text-lg mb-1">Reflect with Spirit</h2>
              <p className="text-sm text-gray-500 mb-5">Spirit gives you a powerful prompt. You write honestly. Only you can see it.</p>
              <div className="flex gap-3">
                <button onClick={getPrompt} className="flex-1 bg-purple-600 text-white rounded-full py-3 font-bold hover:bg-purple-700">
                  ✨ Get a Prompt
                </button>
                <button onClick={() => { setPrompt(''); setWriting(true); }} className="flex-1 border border-gray-200 rounded-full py-3 font-medium text-gray-600 hover:bg-gray-50">
                  Free Write
                </button>
              </div>
            </div>

            {entries.map((entry, i) => (
              <motion.div key={entry.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="village-card">
                {entry.ai_prompt_used && (
                  <p className="text-xs text-purple-500 mb-2 italic">"{entry.ai_prompt_used}"</p>
                )}
                <p className="text-sm text-gray-700 leading-relaxed line-clamp-4">{entry.content}</p>
                <p className="text-xs text-gray-400 mt-2">{new Date(entry.created_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
              </motion.div>
            ))}

            {entries.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-8">Your journal entries will appear here. All entries are private.</p>
            )}
          </>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {prompt && (
              <div className="village-card bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100">
                <p className="text-xs text-purple-500 font-medium mb-1">Spirit asks:</p>
                <p className="text-lg font-bold text-gray-800">"{prompt}"</p>
              </div>
            )}
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={prompt ? 'Write your honest answer…' : 'What\'s on your mind?'}
              rows={10}
              autoFocus
              className="w-full border border-gray-200 rounded-2xl p-4 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none bg-white"
            />
            <div className="flex gap-3">
              <button onClick={() => setWriting(false)} className="flex-1 border border-gray-200 rounded-full py-3 text-gray-500">Cancel</button>
              <button onClick={saveEntry} disabled={saving || !content.trim()} className="flex-1 bg-purple-600 text-white rounded-full py-3 font-bold disabled:opacity-50">
                {saving ? 'Saving…' : '💾 Save Entry'}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
