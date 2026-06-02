'use client';
import { Suspense } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

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

const DEFAULT_AFFIRMATIONS: Record<EnergyType, string> = {
  high: 'I am prepared, confident, and ready to deliver at my best. This moment is mine.',
  focused: 'My mind is clear. Distractions fall away. I produce work that matters.',
  creative: 'Creativity flows through me freely. I trust the process and explore without limits.',
  energize: 'My body is capable and strong. Every rep, every stride — I grow.',
  calm: 'I am present and grounded. I meet this moment with openness and grace.',
};

const DEFAULT_PLAYLISTS: Record<EnergyType, string> = {
  high: 'Power Mode',
  focused: 'Deep Focus',
  creative: 'Creative Flow',
  energize: 'Energy Boost',
  calm: 'Ambient Calm',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}

function fmtDuration(startIso: string, endIso: string) {
  const mins = Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

function triggerFiresAt(startIso: string, triggerMin: number) {
  const t = new Date(new Date(startIso).getTime() - triggerMin * 60000);
  return t.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

// ── Info Row ──────────────────────────────────────────────────────────────────
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 800, letterSpacing: '0.05em', marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: 14, color: '#fff', fontWeight: 700 }}>{value}</p>
      </div>
    </div>
  );
}

// ── Inner Component ───────────────────────────────────────────────────────────
function EventDetailInner() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const eventId = params.id;

  // Read from query params (passed by home page) or fetch from DB
  const [event, setEvent] = useState<{
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    location?: string;
    energy_type: EnergyType;
    trigger_min: number;
    trigger_enabled: boolean;
    affirmation?: string;
    trigger_playlist?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try query params first (instant)
    const title = search.get('title');
    const start = search.get('start');
    const end = search.get('end');
    const rawEnergy = search.get('energy') ?? 'focused';
    const energy = (['high', 'focused', 'creative', 'energize', 'calm'].includes(rawEnergy)
      ? rawEnergy : 'focused') as EnergyType;

    if (title && start && end) {
      setEvent({
        id: eventId,
        title: decodeURIComponent(title),
        start_time: decodeURIComponent(start),
        end_time: decodeURIComponent(end),
        location: search.get('location') ? decodeURIComponent(search.get('location')!) : undefined,
        energy_type: energy,
        trigger_min: parseInt(search.get('trigger_min') ?? '10', 10),
        trigger_enabled: search.get('trigger_enabled') === 'true',
        affirmation: search.get('affirmation') ? decodeURIComponent(search.get('affirmation')!) : DEFAULT_AFFIRMATIONS[energy],
        trigger_playlist: search.get('playlist') ? decodeURIComponent(search.get('playlist')!) : DEFAULT_PLAYLISTS[energy],
      });
      setLoading(false);
      return;
    }

    // For mock events that don't have DB entries, provide defaults
    if (eventId.startsWith('mock-')) {
      const mockDefaults: Record<string, any> = {
        'mock-1': { title: 'Team Standup', energy_type: 'focused', trigger_min: 10, location: 'Zoom' },
        'mock-2': { title: 'Investor Pitch', energy_type: 'high', trigger_min: 15, location: 'Conference Room A' },
        'mock-3': { title: 'Workout', energy_type: 'energize', trigger_min: 5, location: 'Gym' },
        'mock-4': { title: 'Design Review', energy_type: 'creative', trigger_min: 10, location: 'Studio' },
        'mock-5': { title: 'Strategy Session', energy_type: 'focused', trigger_min: 10 },
      };
      const m = mockDefaults[eventId];
      if (m) {
        const now = new Date();
        const start_time = new Date(now.setHours(14, 0, 0, 0)).toISOString();
        const end_time = new Date(now.setHours(15, 0, 0, 0)).toISOString();
        const et = m.energy_type as EnergyType;
        setEvent({
          id: eventId,
          title: m.title,
          start_time,
          end_time,
          location: m.location,
          energy_type: et,
          trigger_min: m.trigger_min,
          trigger_enabled: true,
          affirmation: DEFAULT_AFFIRMATIONS[et],
          trigger_playlist: DEFAULT_PLAYLISTS[et],
        });
        setLoading(false);
        return;
      }
    }

    // Fetch from DB
    const supabase = createClient();
    (supabase as any).from('calendar_events').select('*').eq('id', eventId).single()
      .then(({ data }: { data: any }) => {
        if (data) {
          const et = (data.energy_type || 'focused') as EnergyType;
          setEvent({
            ...data,
            energy_type: et,
            trigger_min: data.trigger_min ?? 10,
            trigger_enabled: data.trigger_enabled ?? false,
            affirmation: data.affirmation || DEFAULT_AFFIRMATIONS[et],
            trigger_playlist: data.trigger_playlist || DEFAULT_PLAYLISTS[et],
          });
        }
        setLoading(false);
      });
  }, [eventId, search]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#080E24', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 8, height: 8, borderRadius: 4, background: '#7C3AED' }} />
      </div>
    );
  }

  if (!event) {
    return (
      <div style={{ minHeight: '100vh', background: '#080E24', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Event not found</p>
        <button onClick={() => router.back()} style={{ color: '#7C3AED', fontWeight: 800, fontSize: 14, background: 'none', border: 'none', cursor: 'pointer' }}>Go back</button>
      </div>
    );
  }

  const color = ENERGY_COLORS[event.energy_type];

  function goToTrigger() {
    const qs = new URLSearchParams({
      title: event!.title,
      energy: event!.energy_type,
      trigger_min: String(event!.trigger_min),
      ...(event!.affirmation ? { affirmation: event!.affirmation } : {}),
      ...(event!.trigger_playlist ? { playlist: event!.trigger_playlist } : {}),
    });
    router.push(`/village/spaces/trigger?${qs.toString()}`);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080E24', color: '#fff', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center',
        padding: '14px 16px', background: 'rgba(8,14,36,0.96)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <button onClick={() => router.back()} style={{
          display: 'flex', alignItems: 'center', gap: 6, color: '#A78BFA',
          fontWeight: 800, fontSize: 13, background: 'transparent', border: 'none', cursor: 'pointer',
        }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
          Spaces
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: event.trigger_enabled ? 100 : 32 }}>

        {/* ── Event Hero ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          style={{ padding: '24px 16px 20px' }}>
          <div style={{ marginBottom: 10 }}>
            <span style={{
              fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 20,
              background: `${color}20`, color, border: `1px solid ${color}40`, letterSpacing: '0.04em',
            }}>
              {ENERGY_LABELS[event.energy_type].toUpperCase()}
            </span>
          </div>
          <p style={{ fontSize: 28, fontWeight: 900, color: '#fff', lineHeight: 1.15, marginBottom: 8 }}>{event.title}</p>
          <p style={{ fontSize: 22, fontWeight: 800, color: color, marginBottom: 4 }}>
            {fmtTime(event.start_time)}
          </p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
            {fmtDate(event.start_time)} · {fmtDuration(event.start_time, event.end_time)}
          </p>
        </motion.div>

        {/* ── Details Card ── */}
        <div style={{ margin: '0 16px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: 16, overflow: 'hidden' }}>
          {event.location && (
            <InfoRow
              label="LOCATION"
              value={event.location}
              icon={<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>}
            />
          )}
          <InfoRow
            label="DURATION"
            value={fmtDuration(event.start_time, event.end_time)}
            icon={<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
          />
        </div>

        {/* ── Trigger Details ── */}
        {event.trigger_enabled && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ margin: '0 16px 16px', background: `${color}10`, border: `1px solid ${color}25`, borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px 12px', borderBottom: `1px solid ${color}20` }}>
              <p style={{ fontSize: 10, fontWeight: 900, color, letterSpacing: '0.07em', marginBottom: 10 }}>TRIGGER DETAILS</p>
              <InfoRow
                label="FIRES AT"
                value={`${triggerFiresAt(event.start_time, event.trigger_min)} — ${event.trigger_min} min before start`}
                icon={<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>}
              />
              <InfoRow
                label="PREP WINDOW"
                value={`${event.trigger_min} minutes`}
                icon={<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
              />
              {event.trigger_playlist && (
                <InfoRow
                  label="MUSIC"
                  value={event.trigger_playlist}
                  icon={<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>}
                />
              )}
            </div>
          </motion.div>
        )}

        {/* ── Linked Files (mock) ── */}
        <div style={{ margin: '0 16px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '14px 16px' }}>
          <p style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.07em', marginBottom: 12 }}>LINKED FILES</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {['Pitch Deck.pdf', 'Q2 Metrics.xlsx'].map(f => (
              <div key={f} style={{
                display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.06)',
                borderRadius: 10, padding: '8px 12px',
              }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: 700 }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Affirmation ── */}
        {event.affirmation && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            style={{ margin: '0 16px 24px', background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '16px 18px', borderLeft: `3px solid ${color}` }}>
            <p style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.07em', marginBottom: 10 }}>AFFIRMATION</p>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', fontStyle: 'italic', lineHeight: 1.6, margin: 0 }}>
              "{event.affirmation}"
            </p>
          </motion.div>
        )}
      </div>

      {/* ── Start Trigger Button ── */}
      {event.trigger_enabled && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          padding: '16px 16px calc(16px + env(safe-area-inset-bottom, 0px))',
          background: 'rgba(8,14,36,0.97)', borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          <motion.button whileTap={{ scale: 0.97 }} onClick={goToTrigger} style={{
            width: '100%', padding: '17px 0', borderRadius: 16, background: color,
            color: '#fff', fontWeight: 900, fontSize: 16, border: 'none', cursor: 'pointer',
            boxShadow: `0 4px 24px ${color}50`,
          }}>
            Start Trigger Now
          </motion.button>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function EventDetailPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#080E24', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 8, height: 8, borderRadius: 4, background: '#7C3AED' }} />
      </div>
    }>
      <EventDetailInner />
    </Suspense>
  );
}
