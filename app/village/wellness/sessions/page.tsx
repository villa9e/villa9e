'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BackButton } from '@/components/village/BackButton';
import { WellnessNav } from '@/components/wellness/WellnessNav';

interface Provider {
  display_name: string;
  specialty: string | null;
  credential_type: string | null;
}

interface Session {
  id: string;
  session_type: string;
  status: string;
  scheduled_at: string | null;
  duration_min: number;
  rate: number | null;
  session_url: string | null;
  pre_visit_brief: string | null;
  provider: Provider | null;
}

function fmtDateTime(d: string | null) {
  if (!d) return 'Unscheduled';
  return new Date(d).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function SessionCard({ session, onOpen }: { session: Session; onOpen: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onOpen}
      style={{ width: '100%', textAlign: 'left', background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 16, marginBottom: 10, border: 'none', cursor: 'pointer' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <p style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>
          {session.provider?.display_name ?? 'Provider'}
        </p>
        <span style={{ fontSize: 9, fontWeight: 900, color: session.status === 'scheduled' ? '#22C55E' : 'rgba(255,255,255,0.4)', background: session.status === 'scheduled' ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '3px 8px', letterSpacing: '0.05em' }}>
          {session.status.toUpperCase()}
        </span>
      </div>
      {session.provider?.specialty && (
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>{session.provider.specialty}</p>
      )}
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{fmtDateTime(session.scheduled_at)} · {session.duration_min} min</p>
      {session.pre_visit_brief && (
        <p style={{ fontSize: 11, color: '#34D399', fontWeight: 700, marginTop: 8 }}>✓ Pre-visit brief ready</p>
      )}
    </motion.button>
  );
}

export default function TelehealthSessionsPage() {
  const router = useRouter();
  const [upcoming, setUpcoming] = useState<Session[]>([]);
  const [past, setPast] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/wellness/sessions')
      .then(res => res.json())
      .then(data => {
        setUpcoming(data.upcoming ?? []);
        setPast(data.past ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ background: '#111827', minHeight: '100vh', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <BackButton to="/village/wellness" />

      <div style={{ position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', padding: '14px 16px 14px 60px', background: 'rgba(17,24,39,0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <p style={{ fontSize: 20, fontWeight: 900, flex: 1 }}>Telehealth</p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 96px' }}>
        {loading ? (
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 40 }}>Loading sessions…</p>
        ) : (
          <>
            <p style={{ fontSize: 12, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', marginBottom: 10 }}>UPCOMING</p>
            {upcoming.length === 0 && (
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 16, marginBottom: 16, textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>No upcoming sessions.</p>
                <button
                  onClick={() => router.push('/village/hospital')}
                  style={{ marginTop: 10, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 20, padding: '8px 16px', fontSize: 13, fontWeight: 800, color: '#34D399', cursor: 'pointer' }}
                >
                  Browse providers
                </button>
              </div>
            )}
            {upcoming.map(s => (
              <SessionCard key={s.id} session={s} onOpen={() => router.push(`/village/wellness/sessions/${s.id}`)} />
            ))}

            {past.length > 0 && (
              <>
                <p style={{ fontSize: 12, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', margin: '20px 0 10px' }}>PAST</p>
                {past.map(s => (
                  <SessionCard key={s.id} session={s} onOpen={() => router.push(`/village/wellness/sessions/${s.id}`)} />
                ))}
              </>
            )}
          </>
        )}
      </div>

      <WellnessNav />
    </div>
  );
}
