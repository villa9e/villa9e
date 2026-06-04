'use client';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { BackButton } from '@/components/village/BackButton';
import { WellnessNav } from '@/components/wellness/WellnessNav';

type Mood = 'low' | 'meh' | 'good' | 'great';

interface LiveVitals {
  readiness: number;
  readinessSummary: string;
  mood: string | null;
  energy: number | null;
  stress: number | null;
  focus: number | null;
  aiInsight: string | null;
}

function ReadinessRing({ score }: { score: number }) {
  const pct = score / 10;
  const r = 44, c = 2 * Math.PI * r;
  const color = score >= 7 ? '#22C55E' : score >= 5 ? '#F59E0B' : '#EF4444';
  return (
    <svg width={110} height={110} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={55} cy={55} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={8} />
      <circle cx={55} cy={55} r={r} fill="none" stroke={color} strokeWidth={8}
        strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease' }} />
    </svg>
  );
}

function VitalTile({ label, value, unit, bar, barColor, trendLabel }: {
  label: string; value: string; unit?: string; bar?: number; barColor?: string; trendLabel?: string;
}) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.04em' }}>{label.toUpperCase()}</p>
      <p style={{ fontSize: 24, fontWeight: 900, color: '#fff' }}>
        {value}<span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginLeft: 3 }}>{unit}</span>
      </p>
      {bar !== undefined && (
        <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(100, bar)}%`, height: '100%', background: barColor ?? '#22C55E', borderRadius: 2 }} />
        </div>
      )}
      {trendLabel && <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{trendLabel}</p>}
    </div>
  );
}

export default function WellnessPage() {
  const router = useRouter();
  const supabase = createClient();
  const [userId, setUserId] = useState('');
  const [mood, setMood] = useState<Mood | null>(null);
  const [saving, setSaving] = useState(false);
  const [vitals, setVitals] = useState<LiveVitals>({
    readiness: 0,
    readinessSummary: 'Log your mood and energy to see your readiness score.',
    mood: null, energy: null, stress: null, focus: null, aiInsight: null,
  });

  const touchRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      const today = new Date().toISOString().split('T')[0];

      const { data: log } = await (supabase as any)
        .from('wellness_logs')
        .select('readiness,mood,energy,stress,focus,ai_insight')
        .eq('user_id', user.id)
        .eq('log_date', today)
        .single();

      const r = parseFloat(log?.readiness ?? 0);
      const summary = r >= 7
        ? 'High readiness · Great day for focused work'
        : r >= 5
        ? 'Moderate readiness · Balanced effort recommended'
        : r > 0
        ? 'Lower readiness · Prioritize recovery today'
        : 'Log your mood and energy to see your readiness score.';

      const baseVitals: LiveVitals = {
        readiness: r,
        readinessSummary: summary,
        mood: log?.mood ?? null,
        energy: log?.energy ?? null,
        stress: log?.stress ?? null,
        focus: log?.focus ?? null,
        aiInsight: log?.ai_insight ?? null,
      };

      setVitals(baseVitals);
      if (log?.mood) setMood(log.mood as Mood);

      // Fetch AI insight if missing but data exists
      if (!log?.ai_insight && log && (log.mood || log.energy || log.stress)) {
        try {
          const res = await fetch('/api/wellness/insight');
          if (res.ok) {
            const { insight, readiness: newReadiness } = await res.json();
            if (insight) {
              const updatedReadiness = newReadiness || r;
              const updatedSummary = updatedReadiness >= 7
                ? 'High readiness · Great day for focused work'
                : updatedReadiness >= 5
                ? 'Moderate readiness · Balanced effort recommended'
                : updatedReadiness > 0
                ? 'Lower readiness · Prioritize recovery today'
                : summary;
              setVitals(prev => ({
                ...prev,
                aiInsight: insight,
                readiness: updatedReadiness,
                readinessSummary: updatedSummary,
              }));
            }
          }
        } catch {
          // Insight fetch failed silently — vitals still shown
        }
      }
    });
  }, []);

  async function saveMood(m: Mood) {
    setMood(m);
    if (!userId || saving) return;
    setSaving(true);
    const today = new Date().toISOString().split('T')[0];
    await (supabase as any).from('wellness_logs').upsert(
      { user_id: userId, log_date: today, mood: m },
      { onConflict: 'user_id,log_date' }
    );
    setSaving(false);
  }

  function onTouchStart(e: React.TouchEvent) {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (!touchRef.current) return;
    const dx = e.changedTouches[0].clientX - touchRef.current.x;
    const dy = Math.abs(e.changedTouches[0].clientY - touchRef.current.y);
    if (dx > 80 && dy < 60) router.push('/village/hut');
    touchRef.current = null;
  }

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{ background: '#111827', minHeight: '100vh', color: '#fff', display: 'flex', flexDirection: 'column' }}
    >
      <BackButton to="/village/hut" />

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', padding: '14px 16px 14px 60px', background: 'rgba(17,24,39,0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <p style={{ fontSize: 20, fontWeight: 900, flex: 1 }}>Wellness</p>
        <svg width={20} height={20} viewBox="0 0 24 24" fill="#22C55E" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 96px' }}>

        {/* Readiness Card — taps to /body */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push('/village/wellness/body')}
          style={{ width: '100%', textAlign: 'left', background: 'linear-gradient(135deg,#052E16,#065F46)', borderRadius: 20, padding: 20, marginBottom: 12, border: 'none', cursor: 'pointer' }}
        >
          <p style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', marginBottom: 12 }}>TODAY&apos;S READINESS</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ position: 'relative', width: 110, height: 110, flexShrink: 0 }}>
              <ReadinessRing score={vitals.readiness} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 28, fontWeight: 900, color: '#fff' }}>{vitals.readiness > 0 ? vitals.readiness : '—'}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>/10</span>
              </div>
            </div>
            <div>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>{vitals.readinessSummary}</p>
              <p style={{ fontSize: 12, color: '#34D399', fontWeight: 700, marginTop: 8 }}>Tap for full breakdown →</p>
            </div>
          </div>
        </motion.button>

        {/* Vital stat tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          <VitalTile
            label="Energy"
            value={vitals.energy ? `${vitals.energy}/5` : '—'}
            bar={vitals.energy ? (vitals.energy / 5) * 100 : 0}
            barColor="#22C55E"
            trendLabel="Logged today"
          />
          <VitalTile
            label="Stress"
            value={vitals.stress ? `${vitals.stress}/5` : '—'}
            bar={vitals.stress ? (vitals.stress / 5) * 100 : 0}
            barColor="#F59E0B"
            trendLabel="Logged today"
          />
        </div>

        {/* AI Insight card */}
        <motion.div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 16, padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
            <span style={{ fontSize: 10, fontWeight: 900, color: '#34D399', letterSpacing: '0.08em' }}>AI INSIGHT</span>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.55, marginBottom: 12 }}>
            {vitals.aiInsight
              ? vitals.aiInsight.split('.').slice(0, 2).join('.') + '.'
              : 'Log your mood and energy to get personalized AI insights about your wellness patterns.'}
          </p>
          <button
            onClick={() => router.push('/village/wellness/ai')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 20, padding: '7px 14px', fontSize: 13, fontWeight: 800, color: '#34D399', cursor: 'pointer' }}
          >
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
            Ask me anything
          </button>
        </motion.div>

        {/* Daily Check-in */}
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 16, marginBottom: 12 }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 700, marginBottom: 12 }}>How are you feeling today?</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['low', 'meh', 'good', 'great'] as Mood[]).map(m => (
              <button
                key={m}
                onClick={() => saveMood(m)}
                style={{
                  flex: 1, padding: '9px 0', borderRadius: 10,
                  background: mood === m ? '#22C55E' : 'rgba(255,255,255,0.06)',
                  border: mood === m ? 'none' : '1px solid rgba(255,255,255,0.1)',
                  color: mood === m ? '#fff' : 'rgba(255,255,255,0.5)',
                  fontWeight: 900, fontSize: 12, textTransform: 'capitalize', cursor: 'pointer',
                }}
              >
                {m}
              </button>
            ))}
          </div>
          {mood && <p style={{ fontSize: 11, color: '#34D399', fontWeight: 700, marginTop: 8, textAlign: 'center' }}>Mood saved</p>}
        </div>

        {/* Quick-access cards */}
        <p style={{ fontSize: 12, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', marginBottom: 10 }}>TODAY</p>
        {[
          {
            label: 'Nutrition',
            sub: '3 meals planned · On track',
            pill: 'ON TRACK',
            pillColor: '#22C55E',
            href: '/village/wellness/nutrition',
            iconPath: 'M3 11l19-9-9 19-2-8-8-2z',
          },
          {
            label: 'Journal',
            sub: 'Evening reflection pending',
            pill: 'PENDING',
            pillColor: '#8B5CF6',
            href: '/village/wellness/journal',
            iconPath: 'M4 19.5A2.5 2.5 0 016.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z',
          },
          {
            label: 'Body',
            sub: 'Vitals & sleep stages',
            pill: '',
            pillColor: '',
            href: '/village/wellness/body',
            iconPath: 'M22 12h-4l-3 9L9 3l-3 9H2',
          },
        ].map(c => (
          <motion.button
            key={c.label}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push(c.href)}
            style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '14px', marginBottom: 8, border: 'none', cursor: 'pointer' }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 20, background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={c.iconPath} />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{c.label}</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{c.sub}</p>
            </div>
            {c.pill && (
              <span style={{ fontSize: 9, fontWeight: 900, color: c.pillColor, background: `${c.pillColor}22`, border: `1px solid ${c.pillColor}44`, borderRadius: 8, padding: '3px 8px' }}>
                {c.pill}
              </span>
            )}
          </motion.button>
        ))}
      </div>

      <WellnessNav />
    </div>
  );
}
