'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { BackButton } from '@/components/village/BackButton';
import { WellnessNav } from '@/components/wellness/WellnessNav';

interface WellnessLog {
  id: string;
  log_date: string;
  mood: string | null;
  gratitude: string | null;
}

interface GratitudeEntry {
  id: string;
  entry: string;
  log_date: string;
  created_at: string;
}

const JOURNAL_PROMPTS = [
  'What went well today?',
  'What drained your energy?',
  'One thing you are grateful for',
];

function moodColor(m: string) {
  return m === 'great' ? '#22C55E' : m === 'good' ? '#F59E0B' : m === 'meh' ? '#8B5CF6' : '#EF4444';
}

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function JournalPage() {
  const router = useRouter();
  const supabase = createClient();
  const [userId, setUserId] = useState('');
  const [answers, setAnswers] = useState(['', '', '']);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [gratitude, setGratitude] = useState('');
  const [gratitudeEntries, setGratitudeEntries] = useState<GratitudeEntry[]>([]);
  const [recentLogs, setRecentLogs] = useState<WellnessLog[]>([]);
  const [addingGratitude, setAddingGratitude] = useState(false);

  const load = useCallback(async (uid: string) => {
    if (!uid) return;
    const [gRes, lRes] = await Promise.allSettled([
      (supabase as any).from('gratitude_log').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(10),
      (supabase as any).from('wellness_logs').select('id,log_date,mood,gratitude').eq('user_id', uid).order('log_date', { ascending: false }).limit(7),
    ]);
    if (gRes.status === 'fulfilled') setGratitudeEntries(gRes.value.data || []);
    if (lRes.status === 'fulfilled') setRecentLogs(lRes.value.data || []);
  }, [supabase]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      load(user.id);
    });
  }, [load, supabase]);

  async function saveReflection() {
    if (!userId || saving || answers.every(a => !a.trim())) return;
    setSaving(true);
    const today = new Date().toISOString().split('T')[0];
    const combined = JOURNAL_PROMPTS
      .map((p, i) => `${p}: ${answers[i]}`)
      .filter(l => !l.endsWith(': '))
      .join('\n');
    await (supabase as any).from('wellness_logs').upsert(
      { user_id: userId, log_date: today, gratitude: combined },
      { onConflict: 'user_id,log_date' }
    );
    setSaved(true);
    setSaving(false);
    load(userId);
  }

  async function addGratitude() {
    if (!gratitude.trim() || !userId || addingGratitude) return;
    setAddingGratitude(true);
    const today = new Date().toISOString().split('T')[0];
    await (supabase as any).from('gratitude_log').insert({
      user_id: userId,
      entry: gratitude.trim(),
      log_date: today,
    });
    setGratitude('');
    setAddingGratitude(false);
    load(userId);
  }

  return (
    <div style={{ background: '#111827', minHeight: '100vh', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <BackButton to="/village/wellness" />

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', padding: '14px 16px 14px 60px', background: 'rgba(17,24,39,0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          onClick={() => router.push('/village/wellness')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#22C55E', fontWeight: 800, fontSize: 14, background: 'transparent', border: 'none', cursor: 'pointer', marginRight: 12 }}
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <p style={{ fontSize: 20, fontWeight: 900, flex: 1 }}>Journal</p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 96px' }}>

        {/* Evening Reflection — 3 prompts */}
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 16, marginBottom: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', marginBottom: 14 }}>EVENING REFLECTION · 3 MIN</p>
          {JOURNAL_PROMPTS.map((prompt, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 700, marginBottom: 6 }}>{prompt}</p>
              <textarea
                value={answers[i]}
                onChange={e => {
                  const a = [...answers];
                  a[i] = e.target.value;
                  setAnswers(a);
                }}
                rows={2}
                placeholder="Type here..."
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10, padding: '10px 12px', fontSize: 13, color: '#fff',
                  outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                }}
              />
            </div>
          ))}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={saveReflection}
            disabled={saving || answers.every(a => !a.trim())}
            style={{
              width: '100%', padding: '12px 0', borderRadius: 12,
              background: saved ? 'rgba(34,197,94,0.3)' : '#22C55E',
              color: '#fff', fontWeight: 900, fontSize: 14, border: 'none',
              cursor: saving || answers.every(a => !a.trim()) ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saved ? 'Reflection Saved' : saving ? 'Saving...' : 'Save Reflection'}
          </motion.button>
        </div>

        {/* AI Journal Pattern Card */}
        <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 16, padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
            <span style={{ fontSize: 10, fontWeight: 900, color: '#34D399', letterSpacing: '0.08em' }}>AI INSIGHT · THIS WEEK</span>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.55, marginBottom: 10 }}>
            Journal daily to unlock Spirit&apos;s pattern recognition. You&apos;ll start seeing connections between your evening reflections, sleep quality, and next-day mood within 5 days.
          </p>
          <button
            onClick={() => router.push('/village/wellness/ai')}
            style={{ fontSize: 12, fontWeight: 800, color: '#34D399', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            Ask Spirit about my patterns →
          </button>
        </div>

        {/* Recent Entries */}
        {recentLogs.filter(l => l.mood || l.gratitude).length > 0 && (
          <>
            <p style={{ fontSize: 12, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', marginBottom: 10 }}>RECENT ENTRIES</p>
            {recentLogs.filter(l => l.mood || l.gratitude).map(l => (
              <div key={l.id} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 14px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 700, marginBottom: 4 }}>{fmtDate(l.log_date)}</p>
                  {l.gratitude && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.4 }}>{l.gratitude.split('\n')[0]}</p>}
                </div>
                {l.mood && (
                  <span style={{ fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 8, background: `${moodColor(l.mood)}22`, color: moodColor(l.mood), flexShrink: 0, textTransform: 'capitalize' }}>
                    {l.mood}
                  </span>
                )}
              </div>
            ))}
          </>
        )}

        {/* Gratitude Log */}
        <p style={{ fontSize: 12, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', marginBottom: 10, marginTop: 4 }}>GRATITUDE LOG</p>
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '12px 14px' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 10 }}>
            <input
              value={gratitude}
              onChange={e => setGratitude(e.target.value)}
              placeholder="Today I'm grateful for..."
              onKeyDown={e => { if (e.key === 'Enter') addGratitude(); }}
              style={{ flex: 1, background: 'transparent', border: 'none', fontSize: 13, color: '#fff', outline: 'none' }}
            />
            <button
              onClick={addGratitude}
              disabled={addingGratitude || !gratitude.trim()}
              style={{ fontSize: 22, color: '#22C55E', background: 'transparent', border: 'none', fontWeight: 900, cursor: 'pointer', lineHeight: 1 }}
            >
              +
            </button>
          </div>
          {gratitudeEntries.length === 0 && (
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '8px 0' }}>
              No entries yet — add your first
            </p>
          )}
          {gratitudeEntries.map(g => (
            <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{g.entry}</p>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>{fmtDate(g.log_date)}</span>
            </div>
          ))}
        </div>
      </div>

      <WellnessNav />
    </div>
  );
}
