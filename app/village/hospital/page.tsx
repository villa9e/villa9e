'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { BackButton } from '@/components/village/BackButton';

// ── Types ─────────────────────────────────────────────────────────────────────
type WScreen = 'home' | 'body' | 'nutrition' | 'ai' | 'journal';
type Mood = 'low' | 'meh' | 'good' | 'great';

// ── Mock data (real AI/wearable data would come from backend) ─────────────────
const MOCK_VITALS = {
  readiness: 7.4,
  readinessSummary: 'Sleep solid · HRV slightly below baseline · Moderate day ahead',
  sleep: { hours: 7.1, efficiency: 82, trend: 'up' as const },
  hrv: { ms: 58, baseline: 65, trend: 'down' as const },
  rhr: { bpm: 64, baseline: 60, trend: 'up' as const },
  spo2: { pct: 96 },
  steps: { count: 4200, goal: 8000 },
  stress: 'Moderate' as const,
  deep: 1.4, rem: 1.8, light: 4.1,
};
const AI_INSIGHT = "Your HRV is 11% below your 30-day average, likely from yesterday's high-output session. Sleep quality was strong at 82% efficiency. Today is a good day for focused work — avoid high-intensity exercise. Hydrate early and prioritize your afternoon Trigger for the 2 PM block.";

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

const AI_MESSAGES = [
  { role: 'ai' as const, text: "Good morning. Here's what I'm seeing in your data today: your HRV dropped to 58ms overnight — that's 11% below your baseline. Your sleep quality was strong though at 82% efficiency with solid deep sleep. I'm recommending a focused but not high-intensity day. You have a high-performance event at 2 PM. Eat light before that — the lunch plan is optimized for it. What would you like to explore?" },
];

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

function VitalTile({ label, value, unit, bar, barColor, trend, trendLabel }: { label: string; value: string; unit?: string; bar?: number; barColor?: string; trend?: 'up' | 'down' | 'ok'; trendLabel?: string }) {
  const tColor = trend === 'up' ? '#22C55E' : trend === 'down' ? '#F59E0B' : 'rgba(255,255,255,0.4)';
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.04em' }}>{label.toUpperCase()}</p>
      <p style={{ fontSize: 24, fontWeight: 900, color: '#fff' }}>{value}<span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginLeft: 3 }}>{unit}</span></p>
      {bar !== undefined && (
        <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(100, bar)}%`, height: '100%', background: barColor ?? '#22C55E', borderRadius: 2 }} />
        </div>
      )}
      {trendLabel && <p style={{ fontSize: 11, fontWeight: 700, color: tColor }}>{trendLabel}</p>}
    </div>
  );
}

function TabBtn({ icon, label, active, onTap }: { icon: React.ReactNode; label: string; active: boolean; onTap: () => void }) {
  return (
    <button onClick={onTap} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '8px 0', color: active ? '#22C55E' : 'rgba(255,255,255,0.3)', background: 'transparent', borderTop: active ? '2px solid #22C55E' : '2px solid transparent' }}>
      {icon}
      <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: '0.04em' }}>{label.toUpperCase()}</span>
    </button>
  );
}

// ── HOME SCREEN ───────────────────────────────────────────────────────────────
function HomeScreen({ onNav, onAskAI }: { onNav: (s: WScreen) => void; onAskAI: () => void }) {
  const [mood, setMood] = useState<Mood | null>(null);
  const v = MOCK_VITALS;

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 20px' }}>
      {/* Readiness Card */}
      <motion.button whileTap={{ scale: 0.98 }} onClick={() => onNav('body')}
        style={{ width: '100%', textAlign: 'left', background: 'linear-gradient(135deg,#052E16,#065F46)', borderRadius: 20, padding: 20, marginBottom: 12 }}>
        <p style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', marginBottom: 12 }}>TODAY'S READINESS</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ position: 'relative', width: 110, height: 110, flexShrink: 0 }}>
            <ReadinessRing score={v.readiness} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: '#fff' }}>{v.readiness}</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>/10</span>
            </div>
          </div>
          <div>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>{v.readinessSummary}</p>
            <p style={{ fontSize: 12, color: '#34D399', fontWeight: 700, marginTop: 8 }}>Tap for full breakdown →</p>
          </div>
        </div>
      </motion.button>

      {/* Vital tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <VitalTile label="Sleep" value={`${v.sleep.hours}h`} bar={v.sleep.efficiency} barColor="#22C55E" trendLabel={`${v.sleep.efficiency}% efficiency`} trend="ok" />
        <VitalTile label="Resting HR" value={`${v.rhr.bpm}`} unit="bpm" bar={(v.rhr.bpm / 90) * 100} barColor="#F59E0B" trendLabel={`+${v.rhr.bpm - v.rhr.baseline} above baseline`} trend="down" />
      </div>

      {/* AI Insight */}
      <motion.div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 16, padding: 16, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <span style={{ fontSize: 14 }}>✨</span>
          <span style={{ fontSize: 10, fontWeight: 900, color: '#34D399', letterSpacing: '0.08em' }}>AI INSIGHT</span>
        </div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.55, marginBottom: 12 }}>
          {AI_INSIGHT.split('.').slice(0, 2).join('.') + '.'}
        </p>
        <button onClick={onAskAI} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#22C55E22', border: '1px solid #22C55E44', borderRadius: 20, padding: '7px 14px', fontSize: 13, fontWeight: 800, color: '#34D399' }}>
          ✨ Ask me anything
        </button>
      </motion.div>

      {/* Check-in */}
      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 16, marginBottom: 12 }}>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 700, marginBottom: 12 }}>How are you feeling today?</p>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['low', 'meh', 'good', 'great'] as Mood[]).map(m => (
            <button key={m} onClick={() => setMood(m)} style={{ flex: 1, padding: '9px 0', borderRadius: 10, background: mood === m ? '#22C55E' : 'rgba(255,255,255,0.06)', border: mood === m ? 'none' : '1px solid rgba(255,255,255,0.1)', color: mood === m ? '#fff' : 'rgba(255,255,255,0.5)', fontWeight: 900, fontSize: 12, textTransform: 'capitalize' }}>
              {m}
            </button>
          ))}
        </div>
        {mood && <p style={{ fontSize: 11, color: '#34D399', fontWeight: 700, marginTop: 8, textAlign: 'center' }}>✓ Mood logged</p>}
      </div>

      {/* Today cards */}
      <p style={{ fontSize: 12, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', marginBottom: 10 }}>TODAY</p>
      {[
        { icon: '🥗', color: '#22C55E', label: 'Nutrition', sub: '3 meals planned · On track', pill: 'ON TRACK', pillColor: '#22C55E', screen: 'nutrition' as WScreen },
        { icon: '🏥', color: '#14B8A6', label: 'Telehealth', sub: 'No upcoming appointments', pill: '', pillColor: '', screen: 'home' as WScreen },
        { icon: '📓', color: '#8B5CF6', label: 'Journal', sub: 'Evening reflection pending', pill: 'PENDING', pillColor: '#8B5CF6', screen: 'journal' as WScreen },
      ].map(c => (
        <motion.button key={c.label} whileTap={{ scale: 0.98 }} onClick={() => onNav(c.screen)}
          style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '14px', marginBottom: 8 }}>
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
function BodyScreen() {
  const v = MOCK_VITALS;
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 20px' }}>
      <div style={{ background: 'linear-gradient(135deg,#052E16,#065F46)', borderRadius: 20, padding: 20, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ position: 'relative', width: 90, height: 90, flexShrink: 0 }}>
          <ReadinessRing score={v.readiness} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{v.readiness}</span>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)' }}>/10</span>
          </div>
        </div>
        <div>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', marginBottom: 4 }}>READINESS</p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.45 }}>Based on sleep, HRV, activity, and mood from yesterday.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <VitalTile label="Resting HR" value={`${v.rhr.bpm}`} unit="bpm" bar={(v.rhr.bpm/90)*100} barColor="#F59E0B" trendLabel={`+${v.rhr.bpm - v.rhr.baseline} above baseline`} trend="down" />
        <VitalTile label="HRV" value={`${v.hrv.ms}`} unit="ms" bar={(v.hrv.ms/100)*100} barColor="#1877F2" trendLabel={`-${v.hrv.baseline - v.hrv.ms} below avg`} trend="down" />
        <VitalTile label="Sleep" value={`${v.sleep.hours}h`} bar={v.sleep.efficiency} barColor="#22C55E" trendLabel={`${v.sleep.efficiency}% efficiency`} trend="ok" />
        <VitalTile label="SpO₂" value={`${v.spo2.pct}%`} bar={v.spo2.pct} barColor={v.spo2.pct >= 94 ? '#22C55E' : '#EF4444'} trendLabel="Normal range" trend="ok" />
        <VitalTile label="Steps" value={`${(v.steps.count/1000).toFixed(1)}K`} bar={(v.steps.count/v.steps.goal)*100} barColor="#8B5CF6" trendLabel={`of ${(v.steps.goal/1000).toFixed(0)}K goal`} trend="ok" />
        <VitalTile label="Stress" value={v.stress} bar={50} barColor="#F59E0B" trendLabel="Moderate — manageable" trend="ok" />
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
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>P{item.protein}g</span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>C{item.carbs}g</span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>F{item.fat}g</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 16 }}>
        <p style={{ fontSize: 12, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', marginBottom: 12 }}>WHY THIS PLAN</p>
        {[
          { icon: '😴', label: 'Sleep support', text: "Dark chocolate and magnesium-rich dinner support tonight's deep sleep stage based on your patterns." },
          { icon: '❤️', label: 'HRV recovery', text: 'Salmon and blueberries provide omega-3s and antioxidants that correlate with HRV recovery in your data.' },
          { icon: '💧', label: 'Hydration', text: 'Elevated resting HR this morning suggests low hydration — electrolyte water flagged throughout the day.' },
        ].map(r => (
          <div key={r.label} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>{r.icon}</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 2 }}>{r.label}</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.45 }}>{r.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── AI HEALTH CHAT ────────────────────────────────────────────────────────────
function AIChatScreen() {
  const [messages, setMessages] = useState<{ role: 'ai' | 'user'; text: string }[]>(AI_MESSAGES);
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
    const userMsg = { role: 'user' as const, text: text.trim() };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    const response = text.includes('HRV') ? "Your HRV of 58ms is 11% below your 30-day average of 65ms. This typically indicates your nervous system is under mild stress or you're in active recovery from a high-output period. The good news: your sleep quality was strong last night. I recommend avoiding intense exercise today and prioritizing tonight's sleep. If this trend continues for 5+ more days, I'll add a note to your next provider visit brief." :
      text.includes('sleep') ? "Your sleep data shows a pattern: on days you journal before 9 PM, your deep sleep average increases by 18 minutes. Your mood scores are consistently 0.7 points higher the day after achieving 82%+ sleep efficiency. Tonight's nutrition plan is designed to support your sleep architecture — particularly the magnesium and tryptophan in the dinner." :
      "Based on your readiness data, I'd recommend the salmon and quinoa lunch I've planned. Avoid heavy fats in the next 3 hours — your data shows they correlate with reduced afternoon focus scores. Get water with electrolytes now. And your Trigger fires at 1:45 PM — that prep window will make a meaningful difference.";
    setMessages(m => [...m, { role: 'ai' as const, text: response }]);
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
            <button key={s} onClick={() => send(s)} style={{ textAlign: 'left', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>
              {s}
            </button>
          ))}
        </div>
      )}

      <div style={{ padding: '12px 16px', paddingBottom: 'max(12px, env(safe-area-inset-bottom))', display: 'flex', gap: 10, background: 'rgba(10,11,18,0.95)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send(input)}
          placeholder="Ask about your health…"
          style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24, padding: '10px 16px', fontSize: 14, color: '#fff', outline: 'none' }} />
        <button onClick={() => send(input)} style={{ width: 40, height: 40, borderRadius: 20, background: '#22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" /></svg>
        </button>
      </div>
    </div>
  );
}

// ── JOURNAL SCREEN ────────────────────────────────────────────────────────────
function JournalScreen() {
  const [answers, setAnswers] = useState(['', '', '']);
  const [saved, setSaved] = useState(false);
  const [gratitude, setGratitude] = useState('');

  const RECENT = [
    { date: 'May 30', text: 'The product meeting went well. Feeling aligned with the team.', mood: 4 },
    { date: 'May 29', text: 'Low energy day. Need to fix sleep this week.', mood: 2 },
    { date: 'May 28', text: 'Hit all my focus blocks. Best day in weeks.', mood: 5 },
  ];

  function moodColor(m: number) { return m >= 4 ? '#22C55E' : m >= 3 ? '#F59E0B' : '#EF4444'; }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 20px' }}>
      {/* Prompts */}
      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 16, marginBottom: 12 }}>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: 14 }}>Three prompts · takes about 3 minutes</p>
        {JOURNAL_PROMPTS.map((p, i) => (
          <div key={i} style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 700, marginBottom: 6 }}>{p}</p>
            <textarea value={answers[i]} onChange={e => { const a = [...answers]; a[i] = e.target.value; setAnswers(a); }}
              rows={2} placeholder="Type here…"
              style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px', fontSize: 13, color: '#fff', outline: 'none', resize: 'none', fontFamily: 'inherit' }} />
          </div>
        ))}
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => setSaved(true)}
          style={{ width: '100%', padding: '12px 0', borderRadius: 12, background: '#22C55E', color: '#fff', fontWeight: 900, fontSize: 14 }}>
          {saved ? '✓ Reflection Saved' : 'Save Reflection'}
        </motion.button>
      </div>

      {/* AI Pattern */}
      <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 16, padding: 16, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: 12 }}>✨</span>
          <span style={{ fontSize: 10, fontWeight: 900, color: '#34D399', letterSpacing: '0.08em' }}>AI INSIGHT · THIS WEEK</span>
        </div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.55 }}>
          Mood is consistently 0.8 points higher on days you logged a focus block before 10 AM. Your best sleep followed evenings when you journaled before 9 PM. The word "drained" appeared 4 times this week — correlates with days where the deep work block was skipped.
        </p>
      </div>

      {/* Recent entries */}
      <p style={{ fontSize: 12, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', marginBottom: 10 }}>RECENT ENTRIES</p>
      {RECENT.map(e => (
        <div key={e.date} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 14px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 700, marginBottom: 4 }}>{e.date}</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.4 }}>{e.text}</p>
          </div>
          <span style={{ fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 8, background: `${moodColor(e.mood)}22`, color: moodColor(e.mood), flexShrink: 0 }}>Mood {e.mood}/5</span>
        </div>
      ))}

      {/* Gratitude log */}
      <p style={{ fontSize: 12, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', marginBottom: 10, marginTop: 4 }}>GRATITUDE LOG</p>
      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '12px 14px' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input value={gratitude} onChange={e => setGratitude(e.target.value)} placeholder="Today I'm grateful for…"
            style={{ flex: 1, background: 'transparent', border: 'none', fontSize: 13, color: '#fff', outline: 'none' }} />
          <button onClick={() => { if (gratitude.trim()) setGratitude(''); }} style={{ fontSize: 18, color: '#22C55E', background: 'transparent', fontWeight: 900 }}>+</button>
        </div>
        {['Being able to focus this morning', 'My team showed up fully', 'The quiet hour before everyone woke up'].map((g, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{g}</p>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>May {30 - i}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── PAGE ──────────────────────────────────────────────────────────────────────
export default function HospitalPage() {
  const router = useRouter();
  const [screen, setScreen] = useState<WScreen>('home');

  const touchRef = useRef<{ x: number; y: number } | null>(null);

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
    home: 'Wellness', body: 'Body', nutrition: 'Nutrition', ai: 'AI Health', journal: 'Journal',
  };

  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
      style={{ background: '#0A0B12', minHeight: '100vh', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <BackButton to="/village/hut" />

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', padding: '14px 16px 14px 60px', background: 'rgba(10,11,18,0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <p style={{ fontSize: 20, fontWeight: 900, flex: 1 }}>{headerTitles[screen]}</p>
        {screen === 'home' && (
          <button style={{ width: 32, height: 32, borderRadius: 16, background: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
          </button>
        )}
        {screen === 'ai' && <span style={{ fontSize: 16 }}>✨</span>}
        {screen === 'nutrition' && (
          <button style={{ width: 32, height: 32, borderRadius: 16, background: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>↻</button>
        )}
        {screen === 'journal' && (
          <button style={{ width: 32, height: 32, borderRadius: 16, background: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: '#fff' }}>+</button>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, paddingTop: 16, paddingBottom: screen === 'ai' ? 0 : 80 }}>
        {screen === 'home'      && <HomeScreen onNav={setScreen} onAskAI={() => setScreen('ai')} />}
        {screen === 'body'      && <BodyScreen />}
        {screen === 'nutrition' && <NutritionScreen />}
        {screen === 'ai'        && <AIChatScreen />}
        {screen === 'journal'   && <JournalScreen />}
      </div>

      {/* Bottom nav */}
      {screen !== 'ai' && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(10,11,18,0.97)', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', paddingBottom: 'env(safe-area-inset-bottom, 0px)', zIndex: 30 }}>
          <TabBtn label="Wellness" active={screen === 'home'} onTap={() => setScreen('home')}
            icon={<svg width={20} height={20} viewBox="0 0 24 24" fill={screen === 'home' ? '#22C55E' : 'none'} stroke={screen === 'home' ? '#22C55E' : 'rgba(255,255,255,0.3)'} strokeWidth="2" strokeLinecap="round"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>} />
          <TabBtn label="Body" active={screen === 'body'} onTap={() => setScreen('body')}
            icon={<svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={screen === 'body' ? '#22C55E' : 'rgba(255,255,255,0.3)'} strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>} />
          <TabBtn label="Nutrition" active={screen === 'nutrition'} onTap={() => setScreen('nutrition')}
            icon={<span style={{ fontSize: 18, opacity: screen === 'nutrition' ? 1 : 0.3 }}>🥗</span>} />
          <TabBtn label="AI" active={false} onTap={() => setScreen('ai')}
            icon={<span style={{ fontSize: 16, opacity: 0.3 }}>✨</span>} />
          <TabBtn label="Journal" active={screen === 'journal'} onTap={() => setScreen('journal')}
            icon={<svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={screen === 'journal' ? '#22C55E' : 'rgba(255,255,255,0.3)'} strokeWidth="2" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>} />
        </div>
      )}
    </div>
  );
}
