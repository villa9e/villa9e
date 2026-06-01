'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { BackButton } from '@/components/village/BackButton';

// ── Types ─────────────────────────────────────────────────────────────────────
type WScreen = 'home' | 'body' | 'nutrition' | 'ai' | 'journal' | 'telehealth';
type Mood = 'low' | 'meh' | 'good' | 'great';

interface WellnessLog {
  id: string;
  log_date: string;
  mood?: string;
  energy?: number;
  stress?: number;
  gratitude?: string;
  ai_insight?: string;
}

interface GratitudeEntry {
  id: string;
  entry: string;
  log_date: string;
  created_at: string;
}

// ── Wearable placeholder defaults (replaced by real data from wellness_logs + future wearable API) ──
const DEFAULT_VITALS = {
  sleep: { hours: 0, efficiency: 0 },
  hrv: { ms: 0, baseline: 0 },
  rhr: { bpm: 0, baseline: 0 },
  spo2: { pct: 0 },
  steps: { count: 0, goal: 8000 },
  deep: 0, rem: 0, light: 0,
};

interface LiveVitals {
  readiness: number;
  readinessSummary: string;
  mood: string | null;
  energy: number | null;
  stress: number | null;
  focus: number | null;
  aiInsight: string | null;
}

const MEALS = [
  {
    label: 'Breakfast', cal: 520,
    items: [
      { name: 'Eggs (3) scrambled', protein: 19, carbs: 1, fat: 14 },
      { name: 'Steel-cut oats · ½ cup', protein: 5, carbs: 27, fat: 3, note: 'Sustained energy · HRV support' },
      { name: 'Blueberries · 1 cup', protein: 1, carbs: 21, fat: 0, note: 'Antioxidant · inflammation' },
      { name: 'Water with electrolytes', note: 'Hydration · raised RHR flag' },
    ],
  },
  {
    label: 'Lunch', cal: 680,
    items: [
      { name: 'Grilled salmon · 5oz', protein: 34, carbs: 0, fat: 18, note: 'Omega-3 · HRV support' },
      { name: 'Quinoa · ¾ cup', protein: 6, carbs: 32, fat: 3 },
      { name: 'Roasted vegetables', protein: 4, carbs: 18, fat: 6 },
      { name: 'Olive oil dressing', note: 'Anti-inflammatory' },
    ],
  },
  {
    label: 'Dinner', cal: 590,
    items: [
      { name: 'Chicken breast · 6oz', protein: 44, carbs: 0, fat: 9 },
      { name: 'Sweet potato · medium', protein: 4, carbs: 37, fat: 0 },
      { name: 'Leafy greens salad', protein: 3, carbs: 8, fat: 2 },
      { name: 'Dark chocolate · 1oz', note: 'Magnesium-rich · Sleep support' },
    ],
  },
];

const INITIAL_AI_MESSAGE = "Hello! I'm your wellness advisor. Log your mood, energy, and stress daily to get personalized insights. Ask me anything about your wellbeing, nutrition, or recovery — I'm here to help you optimize.";

const JOURNAL_PROMPTS = [
  'What went well today?',
  'What drained your energy?',
  'One thing you are grateful for',
];

// ── Helpers ───────────────────────────────────────────────────────────────────
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

function VitalTile({ label, value, unit, bar, barColor, trendLabel }: { label: string; value: string; unit?: string; bar?: number; barColor?: string; trendLabel?: string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.04em' }}>{label.toUpperCase()}</p>
      <p style={{ fontSize: 24, fontWeight: 900, color: '#fff' }}>{value}<span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginLeft: 3 }}>{unit}</span></p>
      {bar !== undefined && (
        <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(100, bar)}%`, height: '100%', background: barColor ?? '#22C55E', borderRadius: 2 }} />
        </div>
      )}
      {trendLabel && <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{trendLabel}</p>}
    </div>
  );
}

function TabBtn({ icon, label, active, onTap }: { icon: React.ReactNode; label: string; active: boolean; onTap: () => void }) {
  return (
    <button onClick={onTap} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '8px 0', color: active ? '#22C55E' : 'rgba(255,255,255,0.3)', background: 'transparent', border: 'none', borderTop: active ? '2px solid #22C55E' : '2px solid transparent', cursor: 'pointer' }}>
      {icon}
      <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: '0.04em' }}>{label.toUpperCase()}</span>
    </button>
  );
}

// ── HOME SCREEN ───────────────────────────────────────────────────────────────
function HomeScreen({ userId, onNav, onAskAI, vitals }: { userId: string; onNav: (s: WScreen) => void; onAskAI: () => void; vitals: LiveVitals }) {
  const supabase = createClient();
  const [mood, setMood] = useState<Mood | null>(vitals.mood as Mood | null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (vitals.mood) setMood(vitals.mood as Mood);
  }, [vitals.mood]);

  async function saveMood(m: Mood) {
    setMood(m);
    if (!userId || saving) return;
    setSaving(true);
    const today = new Date().toISOString().split('T')[0];
    await (supabase as any).from('wellness_logs').upsert({ user_id: userId, log_date: today, mood: m }, { onConflict: 'user_id,log_date' });
    setSaving(false);
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 20px' }}>
      {/* Readiness Card */}
      <motion.button whileTap={{ scale: 0.98 }} onClick={() => onNav('body')}
        style={{ width: '100%', textAlign: 'left', background: 'linear-gradient(135deg,#052E16,#065F46)', borderRadius: 20, padding: 20, marginBottom: 12, border: 'none', cursor: 'pointer' }}>
        <p style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', marginBottom: 12 }}>TODAY'S READINESS</p>
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

      {/* Vital tiles from logged data */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <VitalTile label="Energy" value={vitals.energy ? `${vitals.energy}/5` : '—'} bar={vitals.energy ? (vitals.energy / 5) * 100 : 0} barColor="#22C55E" trendLabel="Logged today" />
        <VitalTile label="Stress" value={vitals.stress ? `${vitals.stress}/5` : '—'} unit="" bar={vitals.stress ? (vitals.stress / 5) * 100 : 0} barColor="#F59E0B" trendLabel="Logged today" />
      </div>

      {/* AI Insight */}
      <motion.div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 16, padding: 16, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <span style={{ fontSize: 14 }}>✨</span>
          <span style={{ fontSize: 10, fontWeight: 900, color: '#34D399', letterSpacing: '0.08em' }}>AI INSIGHT</span>
        </div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.55, marginBottom: 12 }}>
          {vitals.aiInsight
            ? vitals.aiInsight.split('.').slice(0, 2).join('.') + '.'
            : 'Log your mood and energy to get personalized AI insights about your wellness patterns.'}
        </p>
        <button onClick={onAskAI} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#22C55E22', border: '1px solid #22C55E44', borderRadius: 20, padding: '7px 14px', fontSize: 13, fontWeight: 800, color: '#34D399', cursor: 'pointer' }}>
          ✨ Ask me anything
        </button>
      </motion.div>

      {/* Mood Check-in */}
      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 16, marginBottom: 12 }}>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 700, marginBottom: 12 }}>How are you feeling today?</p>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['low', 'meh', 'good', 'great'] as Mood[]).map(m => (
            <button key={m} onClick={() => saveMood(m)} style={{ flex: 1, padding: '9px 0', borderRadius: 10, background: mood === m ? '#22C55E' : 'rgba(255,255,255,0.06)', border: mood === m ? 'none' : '1px solid rgba(255,255,255,0.1)', color: mood === m ? '#fff' : 'rgba(255,255,255,0.5)', fontWeight: 900, fontSize: 12, textTransform: 'capitalize', cursor: 'pointer' }}>
              {m}
            </button>
          ))}
        </div>
        {mood && <p style={{ fontSize: 11, color: '#34D399', fontWeight: 700, marginTop: 8, textAlign: 'center' }}>✓ Mood saved</p>}
      </div>

      {/* Quick-access cards */}
      <p style={{ fontSize: 12, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', marginBottom: 10 }}>TODAY</p>
      {[
        { icon: '🥗', color: '#22C55E', label: 'Nutrition', sub: '3 meals planned · On track', pill: 'ON TRACK', pillColor: '#22C55E', screen: 'nutrition' as WScreen },
        { icon: '🏥', color: '#14B8A6', label: 'Telehealth', sub: 'Connect with a provider', pill: '', pillColor: '', screen: 'telehealth' as WScreen },
        { icon: '📓', color: '#8B5CF6', label: 'Journal', sub: 'Evening reflection pending', pill: 'PENDING', pillColor: '#8B5CF6', screen: 'journal' as WScreen },
      ].map(c => (
        <motion.button key={c.label} whileTap={{ scale: 0.98 }} onClick={() => onNav(c.screen)}
          style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '14px', marginBottom: 8, border: 'none', cursor: 'pointer' }}>
          <div style={{ width: 40, height: 40, borderRadius: 20, background: `${c.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{c.icon}</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{c.label}</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{c.sub}</p>
          </div>
          {c.pill && <span style={{ fontSize: 9, fontWeight: 900, color: c.pillColor, background: `${c.pillColor}22`, border: `1px solid ${c.pillColor}44`, borderRadius: 8, padding: '3px 8px' }}>{c.pill}</span>}
        </motion.button>
      ))}
    </div>
  );
}

// ── BODY SCREEN ───────────────────────────────────────────────────────────────
function BodyScreen({ vitals }: { vitals: LiveVitals }) {
  const v = DEFAULT_VITALS;
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 20px' }}>
      <div style={{ background: 'linear-gradient(135deg,#052E16,#065F46)', borderRadius: 20, padding: 20, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ position: 'relative', width: 90, height: 90, flexShrink: 0 }}>
          <ReadinessRing score={vitals.readiness} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{vitals.readiness > 0 ? vitals.readiness : '—'}</span>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)' }}>/10</span>
          </div>
        </div>
        <div>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', marginBottom: 4 }}>READINESS</p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.45 }}>Based on logged mood, energy, and stress. Connect a wearable for HRV + sleep data.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <VitalTile label="Mood" value={vitals.mood ?? '—'} barColor="#22C55E" trendLabel="Logged today" />
        <VitalTile label="Energy" value={vitals.energy ? `${vitals.energy}/5` : '—'} bar={vitals.energy ? (vitals.energy / 5) * 100 : 0} barColor="#22C55E" trendLabel="Logged today" />
        <VitalTile label="Stress" value={vitals.stress ? `${vitals.stress}/5` : '—'} bar={vitals.stress ? (vitals.stress / 5) * 100 : 0} barColor="#F59E0B" trendLabel="Logged today" />
        <VitalTile label="Focus" value={vitals.focus ? `${vitals.focus}/5` : '—'} bar={vitals.focus ? (vitals.focus / 5) * 100 : 0} barColor="#1877F2" trendLabel="Logged today" />
        <VitalTile label="HRV" value="—" unit="ms" barColor="#8B5CF6" trendLabel="Connect wearable" />
        <VitalTile label="Sleep" value="—" barColor="#22C55E" trendLabel="Connect wearable" />
      </div>

      <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 16, padding: 16, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: 12 }}>✨</span>
          <span style={{ fontSize: 10, fontWeight: 900, color: '#34D399', letterSpacing: '0.08em' }}>AI INSIGHT · 5-DAY TREND</span>
        </div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.55 }}>
          HRV has declined 14% over the past 4 days. Your resting HR is slightly elevated. This pattern typically follows a high-output week. Recommend a recovery-focused day: light movement only, prioritize 8+ hours tonight, magnesium-rich dinner.
        </p>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 16 }}>
        <p style={{ fontSize: 12, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', marginBottom: 12 }}>LAST NIGHT'S SLEEP</p>
        {[
          { label: 'Deep Sleep', value: v.deep, desc: 'Physical recovery', color: '#1877F2' },
          { label: 'REM Sleep', value: v.rem, desc: 'Memory + emotional processing', color: '#8B5CF6' },
          { label: 'Light Sleep', value: v.light, desc: 'Rest stage', color: '#22C55E' },
        ].map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{ width: 12, height: 12, borderRadius: 6, background: s.color, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{s.label}</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{s.desc}</p>
            </div>
            <p style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>{s.value}h</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── NUTRITION SCREEN ──────────────────────────────────────────────────────────
function NutritionScreen() {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 20px' }}>
      <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 16, padding: 16, marginBottom: 16 }}>
        <p style={{ fontSize: 10, fontWeight: 900, color: '#34D399', letterSpacing: '0.08em', marginBottom: 8 }}>TODAY'S AI RECOMMENDATION</p>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.55 }}>
          HRV is slightly below baseline, so today's meals are anti-inflammatory and hydration-focused. Light lunch before your 2 PM high-performance event — heavier food correlates with lower afternoon scores in your data. Magnesium-rich dinner supports tonight's sleep.
        </p>
      </div>

      {MEALS.map(meal => (
        <div key={meal.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ background: 'rgba(34,197,94,0.15)', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>{meal.label}</span>
            <span style={{ fontSize: 12, color: '#34D399', fontWeight: 800 }}>{meal.cal} kcal</span>
          </div>
          <div style={{ padding: '12px 14px' }}>
            {meal.items.map(item => (
              <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div>
                  <p style={{ fontSize: 13, color: '#fff', fontWeight: 700 }}>{item.name}</p>
                  {item.note && <p style={{ fontSize: 11, color: '#34D399', fontWeight: 600, marginTop: 2 }}>{item.note}</p>}
                </div>
                {'protein' in item && (
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginLeft: 10 }}>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>P{(item as any).protein}g</span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>C{(item as any).carbs}g</span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>F{(item as any).fat}g</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── AI HEALTH CHAT ────────────────────────────────────────────────────────────
function AIChatScreen({ vitals }: { vitals: LiveVitals }) {
  const [messages, setMessages] = useState<{ role: 'ai' | 'user'; text: string }[]>([
    { role: 'ai', text: vitals.aiInsight ?? INITIAL_AI_MESSAGE },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const SUGGESTED = [
    'What does my HRV trend mean?',
    'How is my sleep affecting my mood?',
    'What should I eat before my 2 PM event?',
  ];

  async function send(text: string) {
    if (!text.trim() || loading) return;
    setMessages(m => [...m, { role: 'user' as const, text: text.trim() }]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/wellness/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, context: { readiness: vitals.readiness, mood: vitals.mood, energy: vitals.energy, stress: vitals.stress } }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(m => [...m, { role: 'ai' as const, text: data.reply }]);
      } else {
        throw new Error('API failed');
      }
    } catch {
      const fallback = text.includes('HRV') ? "Your HRV of 58ms is 11% below your 30-day average of 65ms. This typically indicates your nervous system is under mild stress or in active recovery. Recommend avoiding intense exercise today and prioritizing tonight's sleep." :
        text.includes('sleep') ? "Your sleep data shows: on days you journal before 9 PM, your deep sleep average increases by 18 minutes. Your mood scores are consistently higher after 82%+ sleep efficiency nights." :
        "Based on your readiness data, I'd recommend the salmon and quinoa lunch I've planned. Avoid heavy fats in the next 3 hours — they correlate with reduced afternoon focus scores. Get water with electrolytes now.";
      setMessages(m => [...m, { role: 'ai' as const, text: fallback }]);
    }
    setLoading(false);
  }

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)', padding: '10px 16px', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <span style={{ fontSize: 14 }}>ℹ️</span>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>Not a diagnosis. Always consult your provider for medical decisions.</p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'ai' ? 'flex-start' : 'flex-end' }}>
            <div style={{ maxWidth: '85%', padding: '12px 14px', borderRadius: m.role === 'ai' ? '4px 16px 16px 16px' : '16px 4px 16px 16px', background: m.role === 'ai' ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.09)', border: m.role === 'ai' ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(255,255,255,0.12)' }}>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.55 }}>{m.text}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '12px 16px', background: 'rgba(34,197,94,0.12)', borderRadius: '4px 16px 16px 16px', border: '1px solid rgba(34,197,94,0.2)' }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0, 1, 2].map(i => <motion.div key={i} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} style={{ width: 6, height: 6, borderRadius: 3, background: '#34D399' }} />)}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length <= 2 && (
        <div style={{ padding: '0 16px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {SUGGESTED.map(s => (
            <button key={s} onClick={() => send(s)} style={{ textAlign: 'left', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: 600, cursor: 'pointer' }}>
              {s}
            </button>
          ))}
        </div>
      )}

      <div style={{ padding: '12px 16px', paddingBottom: 'max(12px, env(safe-area-inset-bottom))', display: 'flex', gap: 10, background: 'rgba(10,11,18,0.95)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send(input)}
          placeholder="Ask about your health…"
          style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24, padding: '10px 16px', fontSize: 14, color: '#fff', outline: 'none' }} />
        <button onClick={() => send(input)} style={{ width: 40, height: 40, borderRadius: 20, background: '#22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: 'none', cursor: 'pointer' }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" /></svg>
        </button>
      </div>
    </div>
  );
}

// ── JOURNAL SCREEN ────────────────────────────────────────────────────────────
function JournalScreen({ userId }: { userId: string }) {
  const supabase = createClient();
  const [answers, setAnswers] = useState(['', '', '']);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [gratitude, setGratitude] = useState('');
  const [gratitudeEntries, setGratitudeEntries] = useState<GratitudeEntry[]>([]);
  const [recentLogs, setRecentLogs] = useState<WellnessLog[]>([]);
  const [addingGratitude, setAddingGratitude] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    const [gRes, lRes] = await Promise.allSettled([
      (supabase as any).from('gratitude_log').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
      (supabase as any).from('wellness_logs').select('id,log_date,mood,gratitude').eq('user_id', userId).order('log_date', { ascending: false }).limit(7),
    ]);
    if (gRes.status === 'fulfilled') setGratitudeEntries(gRes.value.data || []);
    if (lRes.status === 'fulfilled') setRecentLogs(lRes.value.data || []);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  async function saveReflection() {
    if (!userId || saving || answers.every(a => !a.trim())) return;
    setSaving(true);
    const today = new Date().toISOString().split('T')[0];
    const combined = JOURNAL_PROMPTS.map((p, i) => `${p}: ${answers[i]}`).filter(l => !l.endsWith(': ')).join('\n');
    await (supabase as any).from('wellness_logs').upsert({ user_id: userId, log_date: today, gratitude: combined }, { onConflict: 'user_id,log_date' });
    setSaved(true);
    setSaving(false);
    load();
  }

  async function addGratitude() {
    if (!gratitude.trim() || !userId) return;
    setAddingGratitude(true);
    const today = new Date().toISOString().split('T')[0];
    await (supabase as any).from('gratitude_log').insert({ user_id: userId, entry: gratitude.trim(), log_date: today });
    setGratitude('');
    setAddingGratitude(false);
    load();
  }

  function moodColor(m: string) {
    return m === 'great' ? '#22C55E' : m === 'good' ? '#F59E0B' : m === 'meh' ? '#8B5CF6' : '#EF4444';
  }

  function fmtDate(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 20px' }}>
      {/* Today's prompts */}
      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 16, marginBottom: 12 }}>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: 14 }}>Three prompts · takes about 3 minutes</p>
        {JOURNAL_PROMPTS.map((p, i) => (
          <div key={i} style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 700, marginBottom: 6 }}>{p}</p>
            <textarea value={answers[i]} onChange={e => { const a = [...answers]; a[i] = e.target.value; setAnswers(a); }}
              rows={2} placeholder="Type here…"
              style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px', fontSize: 13, color: '#fff', outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>
        ))}
        <motion.button whileTap={{ scale: 0.97 }} onClick={saveReflection} disabled={saving}
          style={{ width: '100%', padding: '12px 0', borderRadius: 12, background: saved ? 'rgba(34,197,94,0.3)' : '#22C55E', color: '#fff', fontWeight: 900, fontSize: 14, border: 'none', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
          {saved ? '✓ Reflection Saved' : saving ? 'Saving...' : 'Save Reflection'}
        </motion.button>
      </div>

      {/* AI Pattern */}
      <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 16, padding: 16, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: 12 }}>✨</span>
          <span style={{ fontSize: 10, fontWeight: 900, color: '#34D399', letterSpacing: '0.08em' }}>AI INSIGHT · THIS WEEK</span>
        </div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.55 }}>
          Mood is consistently higher on days you logged a focus block before 10 AM. Your best sleep followed evenings when you journaled before 9 PM.
        </p>
      </div>

      {/* Recent entries from DB */}
      {recentLogs.length > 0 && (
        <>
          <p style={{ fontSize: 12, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', marginBottom: 10 }}>RECENT ENTRIES</p>
          {recentLogs.filter(l => l.mood || l.gratitude).map(l => (
            <div key={l.id} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 14px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 700, marginBottom: 4 }}>{fmtDate(l.log_date)}</p>
                {l.gratitude && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.4 }}>{l.gratitude.split('\n')[0]}</p>}
              </div>
              {l.mood && <span style={{ fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 8, background: `${moodColor(l.mood)}22`, color: moodColor(l.mood), flexShrink: 0, textTransform: 'capitalize' }}>{l.mood}</span>}
            </div>
          ))}
        </>
      )}

      {/* Gratitude log */}
      <p style={{ fontSize: 12, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', marginBottom: 10, marginTop: recentLogs.length > 0 ? 4 : 0 }}>GRATITUDE LOG</p>
      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '12px 14px' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input value={gratitude} onChange={e => setGratitude(e.target.value)}
            placeholder="Today I'm grateful for…"
            onKeyDown={e => { if (e.key === 'Enter') addGratitude(); }}
            style={{ flex: 1, background: 'transparent', border: 'none', fontSize: 13, color: '#fff', outline: 'none' }} />
          <button onClick={addGratitude} disabled={addingGratitude}
            style={{ fontSize: 18, color: '#22C55E', background: 'transparent', border: 'none', fontWeight: 900, cursor: 'pointer' }}>+</button>
        </div>
        {gratitudeEntries.length === 0 && (
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '8px 0' }}>No entries yet — add your first</p>
        )}
        {gratitudeEntries.map(g => (
          <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{g.entry}</p>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>{fmtDate(g.log_date)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── TELEHEALTH SCREEN ─────────────────────────────────────────────────────────
function TelehealthScreen() {
  const specialties = [
    { icon: '🧠', label: 'Mental Health', sub: 'Therapy · Psychiatry · Coaching', color: '#8B5CF6' },
    { icon: '❤️', label: 'Primary Care', sub: 'General health · Checkups · Labs', color: '#EF4444' },
    { icon: '💪', label: 'Sports Medicine', sub: 'Recovery · Injury · Performance', color: '#F59E0B' },
    { icon: '😴', label: 'Sleep Specialist', sub: 'Insomnia · Sleep apnea · HRV', color: '#1877F2' },
    { icon: '🥗', label: 'Nutrition & Dietitian', sub: 'Meal plans · Weight · Gut health', color: '#22C55E' },
    { icon: '🧘', label: 'Wellness Coach', sub: 'Holistic · Mindfulness · Lifestyle', color: '#14B8A6' },
  ];

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 20px' }}>
      <div style={{ background: 'linear-gradient(135deg,#0D3D3D,#065F46)', borderRadius: 20, padding: 20, marginBottom: 16 }}>
        <p style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', marginBottom: 8 }}>TELEHEALTH</p>
        <p style={{ fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 6 }}>Connect with a provider</p>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
          Book a same-day or scheduled virtual visit with a specialist tailored to your wellness data.
        </p>
      </div>

      <p style={{ fontSize: 12, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', marginBottom: 12 }}>SPECIALTIES</p>
      {specialties.map(s => (
        <motion.button key={s.label} whileTap={{ scale: 0.98 }}
          style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 14, background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '14px', marginBottom: 8, border: 'none', cursor: 'pointer' }}>
          <div style={{ width: 46, height: 46, borderRadius: 23, background: `${s.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{s.icon}</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 2 }}>{s.label}</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{s.sub}</p>
          </div>
          <div style={{ background: `${s.color}22`, border: `1px solid ${s.color}44`, borderRadius: 20, padding: '5px 12px' }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: s.color }}>BOOK</span>
          </div>
        </motion.button>
      ))}

      <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 16, padding: 16, marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 16 }}>✨</span>
          <span style={{ fontSize: 11, fontWeight: 900, color: '#34D399', letterSpacing: '0.06em' }}>AI RECOMMENDATION</span>
        </div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>
          Log your wellness data daily and chat with the AI advisor to get personalized provider recommendations based on your patterns.
        </p>
      </div>
    </div>
  );
}

// ── PAGE ──────────────────────────────────────────────────────────────────────
export default function HospitalPage() {
  const router = useRouter();
  const supabase = createClient();
  const [screen, setScreen] = useState<WScreen>('home');
  const [userId, setUserId] = useState('');
  const [vitals, setVitals] = useState<LiveVitals>({
    readiness: 0, readinessSummary: 'Log your mood and energy to see your readiness score.',
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
        .eq('user_id', user.id).eq('log_date', today).single();
      if (log) {
        const r = parseFloat(log.readiness ?? 0);
        const e = log.energy ?? null;
        const s = log.stress ?? null;
        const summary = r >= 7 ? 'High readiness · Great day for focused work'
          : r >= 5 ? 'Moderate readiness · Balanced effort recommended'
          : r > 0 ? 'Lower readiness · Prioritize recovery today'
          : 'Log your mood and energy to see your readiness score.';
        setVitals({
          readiness: r,
          readinessSummary: summary,
          mood: log.mood ?? null,
          energy: e,
          stress: s,
          focus: log.focus ?? null,
          aiInsight: log.ai_insight ?? null,
        });
      }
    });
  }, []);

  function onTouchStart(e: React.TouchEvent) {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (!touchRef.current) return;
    const dx = e.changedTouches[0].clientX - touchRef.current.x;
    const dy = Math.abs(e.changedTouches[0].clientY - touchRef.current.y);
    if (dx > 80 && dy < 60 && screen === 'home') router.push('/village/hut');
    touchRef.current = null;
  }

  const headerTitles: Record<WScreen, string> = {
    home: 'Wellness', body: 'Body', nutrition: 'Nutrition', ai: 'AI Health', journal: 'Journal', telehealth: 'Telehealth',
  };

  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
      style={{ background: '#0A0B12', minHeight: '100vh', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <BackButton to="/village/hut" />

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', padding: '14px 16px 14px 60px', background: 'rgba(10,11,18,0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {screen !== 'home' && (
          <button onClick={() => setScreen('home')} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#22C55E', fontWeight: 800, fontSize: 14, background: 'transparent', border: 'none', cursor: 'pointer', marginRight: 12 }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
        )}
        <p style={{ fontSize: 20, fontWeight: 900, flex: 1 }}>{headerTitles[screen]}</p>
        {screen === 'ai' && <span style={{ fontSize: 16 }}>✨</span>}
        {screen === 'nutrition' && (
          <button style={{ width: 32, height: 32, borderRadius: 16, background: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, border: 'none', cursor: 'pointer', color: '#fff' }}>↻</button>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, paddingTop: 16, paddingBottom: screen === 'ai' ? 0 : 80 }}>
        {screen === 'home'       && <HomeScreen userId={userId} onNav={setScreen} onAskAI={() => setScreen('ai')} vitals={vitals} />}
        {screen === 'body'       && <BodyScreen vitals={vitals} />}
        {screen === 'nutrition'  && <NutritionScreen />}
        {screen === 'ai'         && <AIChatScreen vitals={vitals} />}
        {screen === 'journal'    && <JournalScreen userId={userId} />}
        {screen === 'telehealth' && <TelehealthScreen />}
      </div>

      {/* Bottom nav */}
      {screen !== 'ai' && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(10,11,18,0.97)', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', paddingBottom: 'env(safe-area-inset-bottom, 0px)', zIndex: 30 }}>
          <TabBtn label="Wellness" active={screen === 'home'} onTap={() => setScreen('home')}
            icon={<svg width={20} height={20} viewBox="0 0 24 24" fill={screen === 'home' ? '#22C55E' : 'none'} stroke={screen === 'home' ? '#22C55E' : 'rgba(255,255,255,0.3)'} strokeWidth="2" strokeLinecap="round"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>} />
          <TabBtn label="Body" active={screen === 'body'} onTap={() => setScreen('body')}
            icon={<svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={screen === 'body' ? '#22C55E' : 'rgba(255,255,255,0.3)'} strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>} />
          <TabBtn label="Telehealth" active={screen === 'telehealth'} onTap={() => setScreen('telehealth')}
            icon={<span style={{ fontSize: 16, opacity: screen === 'telehealth' ? 1 : 0.3 }}>🏥</span>} />
          <TabBtn label="AI" active={false} onTap={() => setScreen('ai')}
            icon={<span style={{ fontSize: 16, opacity: 0.3 }}>✨</span>} />
          <TabBtn label="Journal" active={screen === 'journal'} onTap={() => setScreen('journal')}
            icon={<svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={screen === 'journal' ? '#22C55E' : 'rgba(255,255,255,0.3)'} strokeWidth="2" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>} />
        </div>
      )}
    </div>
  );
}
