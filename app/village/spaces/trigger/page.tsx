'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Suspense } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
type EnergyType = 'high' | 'focused' | 'creative' | 'energize' | 'calm';

const ENERGY_COLORS: Record<EnergyType, string> = {
  high: '#7C3AED',
  focused: '#2952E8',
  creative: '#D97706',
  energize: '#059669',
  calm: '#475569',
};

const ENERGY_LABELS: Record<EnergyType, string> = {
  high: 'High Performance',
  focused: 'Focused',
  creative: 'Creative',
  energize: 'Energize',
  calm: 'Calm',
};

const AFFIRMATIONS: Record<EnergyType, string> = {
  high: 'I am prepared, confident, and ready to deliver at my best. This moment is mine.',
  focused: 'My mind is clear. Distractions fall away. I produce work that matters.',
  creative: 'Creativity flows through me freely. I trust the process and explore without limits.',
  energize: 'My body is capable and strong. Every rep, every stride — I grow.',
  calm: 'I am present and grounded. I meet this moment with openness and grace.',
};

const FOCUS_SENTENCES: Record<EnergyType, string> = {
  high: 'Walk in ready. Speak with authority. This is your moment.',
  focused: 'One task. Full attention. Create something real.',
  creative: 'Open your mind. Play with ideas. Nothing is wrong yet.',
  energize: 'Move with intention. Push past comfort. Get stronger.',
  calm: 'Be present. Be open. Show up as you are.',
};

const PLAYLISTS: Record<EnergyType, string> = {
  high: 'Power Mode',
  focused: 'Deep Focus',
  creative: 'Creative Flow',
  energize: 'Energy Boost',
  calm: 'Ambient Calm',
};

interface CheckItem {
  id: string;
  category: 'BODY' | 'MIND' | 'SPACE';
  text: string;
  done: boolean;
}

const CHECKLIST_BY_ENERGY: Record<EnergyType, Omit<CheckItem, 'done'>[]> = {
  high: [
    { id: 'body', category: 'BODY', text: 'Shake out tension — 30 seconds of full-body movement' },
    { id: 'breath', category: 'MIND', text: '4-4-4 breathing — 4 counts in, hold, out' },
    { id: 'space', category: 'SPACE', text: 'Clear your desk, get water, silence your phone' },
    { id: 'walk', category: 'MIND', text: 'Close your eyes — walk through the first 3 minutes' },
    { id: 'posture', category: 'BODY', text: 'Power pose for 60 seconds — shoulders back, chin up' },
  ],
  focused: [
    { id: 'body', category: 'BODY', text: 'Shake out tension — 30 seconds of movement' },
    { id: 'breath', category: 'MIND', text: '4-4-4 breathing — 4 counts in, hold, out' },
    { id: 'space', category: 'SPACE', text: 'Clear your desk, get water, silence your phone' },
    { id: 'tabs', category: 'SPACE', text: 'Close all other tabs — open only what you need' },
  ],
  creative: [
    { id: 'body', category: 'BODY', text: 'Loosen up — stretch your arms, roll your neck' },
    { id: 'breath', category: 'MIND', text: 'Box breathing — 4 in, 4 hold, 4 out, 4 hold' },
    { id: 'space', category: 'SPACE', text: 'Clear clutter, get a drink, let in natural light' },
    { id: 'prompt', category: 'MIND', text: 'Write one wild idea — no editing, just output' },
  ],
  energize: [
    { id: 'body', category: 'BODY', text: 'Dynamic warm-up — leg swings, arm circles, hip rolls' },
    { id: 'breath', category: 'MIND', text: 'Power breathing — 3 deep breaths, exhale strong' },
    { id: 'space', category: 'SPACE', text: 'Fill your water bottle, lace up, silence your phone' },
    { id: 'intention', category: 'MIND', text: 'Set one intention — what will you prove today?' },
  ],
  calm: [
    { id: 'body', category: 'BODY', text: 'Ground your feet — feel the floor beneath you' },
    { id: 'breath', category: 'MIND', text: '4-7-8 breathing — breathe in 4, hold 7, out 8' },
    { id: 'space', category: 'SPACE', text: 'Create calm — dim lights, quiet space, slow down' },
    { id: 'anchor', category: 'MIND', text: 'Name 3 things you can control in this situation' },
  ],
};

// ── Animated Music Bars ───────────────────────────────────────────────────────
function MusicBars({ color }: { color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 14 }}>
      {[1, 0.6, 0.9, 0.4, 0.75].map((h, i) => (
        <motion.div
          key={i}
          style={{ width: 3, borderRadius: 2, background: color }}
          animate={{ height: [14 * h, 14 * (h * 0.4), 14 * h] }}
          transition={{ duration: 0.8, delay: i * 0.12, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

// ── Category Badge ────────────────────────────────────────────────────────────
function CategoryBadge({ cat }: { cat: CheckItem['category'] }) {
  const colors: Record<CheckItem['category'], string> = { BODY: '#059669', MIND: '#7C3AED', SPACE: '#2952E8' };
  return (
    <span style={{ fontSize: 8, fontWeight: 900, color: colors[cat], letterSpacing: '0.06em' }}>{cat}</span>
  );
}

// ── Trigger Inner ─────────────────────────────────────────────────────────────
function TriggerInner() {
  const router = useRouter();
  const params = useSearchParams();

  const eventTitle = params.get('title') ?? 'Event Preparation';
  const rawEnergy = params.get('energy') ?? 'focused';
  const energy: EnergyType = (['high', 'focused', 'creative', 'energize', 'calm'].includes(rawEnergy)
    ? rawEnergy : 'focused') as EnergyType;
  const triggerMin = parseInt(params.get('trigger_min') ?? '15', 10);
  const affirmation = params.get('affirmation') ?? AFFIRMATIONS[energy];
  const playlist = params.get('playlist') ?? PLAYLISTS[energy];

  const [seconds, setSeconds] = useState(triggerMin * 60);
  const [checklist, setChecklist] = useState<CheckItem[]>(() =>
    CHECKLIST_BY_ENERGY[energy].map(item => ({ ...item, done: false }))
  );

  useEffect(() => {
    const t = setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const doneCount = checklist.filter(c => c.done).length;
  const primaryColor = ENERGY_COLORS[energy];

  function toggle(id: string) {
    setChecklist(cl => cl.map(c => c.id === id ? { ...c, done: !c.done } : c));
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0D0920', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

      {/* Done button — only exit */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 16px 0', flexShrink: 0 }}>
        <button onClick={() => router.back()} style={{
          fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.45)',
          background: 'rgba(255,255,255,0.08)', padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
        }}>Done</button>
      </div>

      {/* ── Countdown + Event + Affirmation ── */}
      <div style={{ padding: '20px 20px 28px', textAlign: 'center', flexShrink: 0 }}>
        <p style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', marginBottom: 16 }}>
          PREPARING FOR
        </p>

        {/* Live Countdown */}
        <div style={{
          fontSize: 56, fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums',
          lineHeight: 1, letterSpacing: '-0.02em', marginBottom: 12,
          textShadow: `0 0 40px ${primaryColor}60`,
        }}>
          {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </div>

        {/* Countdown progress arc */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{ width: 120, height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
            <motion.div
              style={{ height: '100%', background: primaryColor, borderRadius: 2 }}
              animate={{ width: `${(seconds / (triggerMin * 60)) * 100}%` }}
              transition={{ duration: 1, ease: 'linear' }}
            />
          </div>
        </div>

        {/* Event name */}
        <p style={{ fontSize: 16, fontWeight: 800, color: 'rgba(255,255,255,0.85)', marginBottom: 20, lineHeight: 1.3 }}>
          {eventTitle}
        </p>

        {/* Affirmation block */}
        <div style={{
          background: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: '14px 18px',
          borderLeft: `3px solid ${primaryColor}`,
        }}>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', fontStyle: 'italic', lineHeight: 1.6, margin: 0 }}>
            "{affirmation}"
          </p>
        </div>
      </div>

      {/* ── Now Playing ── */}
      <div style={{ margin: '0 16px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10, flexShrink: 0,
          background: `${primaryColor}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={primaryColor} strokeWidth="2" strokeLinecap="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 3 }}>{playlist}</p>
          <span style={{
            fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 20,
            background: `${primaryColor}20`, color: primaryColor,
            border: `1px solid ${primaryColor}40`, letterSpacing: '0.04em',
          }}>
            {ENERGY_LABELS[energy].toUpperCase()}
          </span>
        </div>
        <MusicBars color={primaryColor} />
      </div>

      {/* ── Prep Checklist ── */}
      <div style={{ padding: '0 16px', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.07em' }}>PREP CHECKLIST</p>
          <p style={{ fontSize: 11, color: '#059669', fontWeight: 800 }}>{doneCount}/{checklist.length} done</p>
        </div>

        {checklist.map(c => (
          <motion.button key={c.id} whileTap={{ scale: 0.98 }} onClick={() => toggle(c.id)} style={{
            width: '100%', textAlign: 'left', display: 'flex', alignItems: 'flex-start', gap: 12,
            padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)',
            marginBottom: 6, border: 'none', cursor: 'pointer',
          }}>
            <div style={{
              width: 20, height: 20, borderRadius: 10, flexShrink: 0,
              border: c.done ? 'none' : '2px solid rgba(255,255,255,0.2)',
              background: c.done ? '#059669' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1,
            }}>
              {c.done && (
                <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: 3 }}>
                <CategoryBadge cat={c.category} />
              </div>
              <span style={{
                fontSize: 13, color: c.done ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.85)',
                fontWeight: 600, textDecoration: c.done ? 'line-through' : 'none', lineHeight: 1.4,
              }}>
                {c.text}
              </span>
            </div>
          </motion.button>
        ))}
      </div>

      {/* ── Focus Sentence ── */}
      <div style={{ padding: '16px 16px 36px', flexShrink: 0 }}>
        <div style={{
          background: `${primaryColor}14`, border: `1px solid ${primaryColor}30`,
          borderRadius: 16, padding: '16px 18px',
        }}>
          <p style={{ fontSize: 9, fontWeight: 900, color: primaryColor, letterSpacing: '0.1em', marginBottom: 8 }}>FOCUS</p>
          <p style={{ fontSize: 16, fontWeight: 900, color: '#fff', lineHeight: 1.45, margin: 0 }}>
            {FOCUS_SENTENCES[energy]}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Page (wrapped in Suspense for useSearchParams) ────────────────────────────
export default function TriggerPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#0D0920', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 8, height: 8, borderRadius: 4, background: '#7C3AED' }} />
      </div>
    }>
      <TriggerInner />
    </Suspense>
  );
}
