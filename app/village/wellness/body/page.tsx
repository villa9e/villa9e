'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { BackButton } from '@/components/village/BackButton';
import { WellnessNav } from '@/components/wellness/WellnessNav';

interface WellnessLog {
  readiness: number | null;
  mood: string | null;
  energy: number | null;
  stress: number | null;
  focus: number | null;
  ai_insight: string | null;
}

function ReadinessRing({ score }: { score: number }) {
  const pct = score / 10;
  const r = 44, c = 2 * Math.PI * r;
  const color = score >= 7 ? '#22C55E' : score >= 5 ? '#F59E0B' : '#EF4444';
  return (
    <svg width={90} height={90} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={45} cy={45} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={7} />
      <circle cx={45} cy={45} r={r} fill="none" stroke={color} strokeWidth={7}
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
      <p style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>
        {value}<span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginLeft: 3 }}>{unit}</span>
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

export default function BodyPage() {
  const router = useRouter();
  const supabase = createClient();
  const [log, setLog] = useState<WellnessLog | null>(null);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const today = new Date().toISOString().split('T')[0];
      const { data } = await (supabase as any)
        .from('wellness_logs')
        .select('readiness,mood,energy,stress,focus,ai_insight')
        .eq('user_id', user.id)
        .eq('log_date', today)
        .single();

      if (data) {
        setLog(data);
        setAiInsight(data.ai_insight ?? null);
      }

      // Fetch AI insight if missing
      if (data && !data.ai_insight && (data.mood || data.energy || data.stress)) {
        try {
          const res = await fetch('/api/wellness/insight');
          if (res.ok) {
            const { insight } = await res.json();
            if (insight) setAiInsight(insight);
          }
        } catch {
          // fail silently
        }
      }
    });
  }, []);

  const readiness = parseFloat(String(log?.readiness ?? 0));
  const readinessSummary = readiness >= 7
    ? 'High readiness · Great day for focused work'
    : readiness >= 5
    ? 'Moderate readiness · Balanced effort recommended'
    : readiness > 0
    ? 'Lower readiness · Prioritize recovery today'
    : 'Log mood and energy to compute readiness';

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
        <p style={{ fontSize: 20, fontWeight: 900, flex: 1 }}>Body</p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 96px' }}>

        {/* Readiness card */}
        <div style={{ background: 'linear-gradient(135deg,#052E16,#065F46)', borderRadius: 20, padding: 20, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ position: 'relative', width: 90, height: 90, flexShrink: 0 }}>
            <ReadinessRing score={readiness} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{readiness > 0 ? readiness : '—'}</span>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)' }}>/10</span>
            </div>
          </div>
          <div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', marginBottom: 4 }}>READINESS</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.45 }}>{readinessSummary}</p>
          </div>
        </div>

        {/* 6 vital stat tiles: RHR, HRV, Sleep, SpO2, Steps, Stress */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          <VitalTile label="RHR" value="—" unit="bpm" barColor="#EF4444" trendLabel="Connect wearable" />
          <VitalTile label="HRV" value="—" unit="ms" barColor="#8B5CF6" trendLabel="Connect wearable" />
          <VitalTile label="Sleep" value="—" unit="hrs" barColor="#22C55E" trendLabel="Connect wearable" />
          <VitalTile label="SpO2" value="—" unit="%" barColor="#1877F2" trendLabel="Connect wearable" />
          <VitalTile
            label="Steps"
            value="—"
            unit=""
            bar={0}
            barColor="#F59E0B"
            trendLabel="Connect wearable"
          />
          <VitalTile
            label="Stress"
            value={log?.stress ? `${log.stress}/5` : '—'}
            bar={log?.stress ? (log.stress / 5) * 100 : 0}
            barColor="#F59E0B"
            trendLabel="Logged today"
          />
        </div>

        {/* Logged metrics from wellness_logs */}
        <p style={{ fontSize: 12, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', marginBottom: 10 }}>LOGGED TODAY</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          <VitalTile
            label="Mood"
            value={log?.mood ?? '—'}
            trendLabel="Daily check-in"
          />
          <VitalTile
            label="Energy"
            value={log?.energy ? `${log.energy}/5` : '—'}
            bar={log?.energy ? (log.energy / 5) * 100 : 0}
            barColor="#22C55E"
            trendLabel="Logged today"
          />
          <VitalTile
            label="Focus"
            value={log?.focus ? `${log.focus}/5` : '—'}
            bar={log?.focus ? (log.focus / 5) * 100 : 0}
            barColor="#1877F2"
            trendLabel="Logged today"
          />
        </div>

        {/* AI pattern card */}
        <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 16, padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
            <span style={{ fontSize: 10, fontWeight: 900, color: '#34D399', letterSpacing: '0.08em' }}>AI INSIGHT · 5-DAY TREND</span>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.55 }}>
            {aiInsight
              ? aiInsight
              : 'Log your mood, energy, and stress daily to unlock personalized AI pattern analysis. Connect a wearable to add HRV, sleep, and step data.'}
          </p>
        </div>

        {/* Sleep stages */}
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', marginBottom: 12 }}>LAST NIGHT&apos;S SLEEP</p>
          {[
            { label: 'Deep Sleep', desc: 'Physical recovery', color: '#1877F2', value: '—' },
            { label: 'REM Sleep', desc: 'Memory + emotional processing', color: '#8B5CF6', value: '—' },
            { label: 'Light Sleep', desc: 'Rest stage', color: '#22C55E', value: '—' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{ width: 12, height: 12, borderRadius: 6, background: s.color, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{s.label}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{s.desc}</p>
              </div>
              <p style={{ fontSize: 16, fontWeight: 900, color: 'rgba(255,255,255,0.4)' }}>{s.value}</p>
            </div>
          ))}
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 4 }}>Connect Gadgetbridge or Apple Health to see sleep stages</p>
        </div>
      </div>

      <WellnessNav />
    </div>
  );
}
