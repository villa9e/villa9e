'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
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
  notes: string | null;
  session_url: string | null;
  pre_visit_brief: string | null;
  provider: Provider | null;
}

function fmtDateTime(d: string | null) {
  if (!d) return 'Unscheduled';
  return new Date(d).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function TelehealthSessionDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [briefLoading, setBriefLoading] = useState(false);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    fetch('/api/wellness/sessions')
      .then(res => res.json())
      .then(data => {
        const all: Session[] = [...(data.upcoming ?? []), ...(data.past ?? [])];
        setSession(all.find(s => s.id === id) ?? null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function generateBrief(force = false) {
    setBriefLoading(true);
    try {
      const res = await fetch(`/api/wellness/sessions/${id}/brief`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force }),
      });
      const data = await res.json();
      if (data.brief) setSession(prev => prev ? { ...prev, pre_visit_brief: data.brief } : prev);
    } finally {
      setBriefLoading(false);
    }
  }

  const passcode = session?.notes?.match(/Passcode:\s*(\S+)/)?.[1] ?? null;

  return (
    <div style={{ background: '#111827', minHeight: '100vh', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <BackButton to="/village/wellness/sessions" />

      <div style={{ position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', padding: '14px 16px 14px 60px', background: 'rgba(17,24,39,0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <p style={{ fontSize: 20, fontWeight: 900, flex: 1 }}>Session</p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 96px' }}>
        {loading ? (
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 40 }}>Loading…</p>
        ) : !session ? (
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 40 }}>Session not found.</p>
        ) : (
          <>
            {/* Session info */}
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 16, marginBottom: 12 }}>
              <p style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{session.provider?.display_name ?? 'Provider'}</p>
              {session.provider?.specialty && (
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}>{session.provider.specialty}</p>
              )}
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{fmtDateTime(session.scheduled_at)} · {session.duration_min} min</p>
              {passcode && (
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 6 }}>Passcode: <span style={{ color: '#34D399', fontWeight: 800 }}>{passcode}</span></p>
              )}
            </div>

            {/* Pre-visit AI brief */}
            <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 16, padding: 16, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                <span style={{ fontSize: 10, fontWeight: 900, color: '#34D399', letterSpacing: '0.08em' }}>PRE-VISIT BRIEF</span>
              </div>
              {session.pre_visit_brief ? (
                <>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, marginBottom: 12, whiteSpace: 'pre-wrap' }}>{session.pre_visit_brief}</p>
                  <button
                    onClick={() => generateBrief(true)}
                    disabled={briefLoading}
                    style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 20, padding: '7px 14px', fontSize: 12, fontWeight: 800, color: '#34D399', cursor: briefLoading ? 'default' : 'pointer', opacity: briefLoading ? 0.6 : 1 }}
                  >
                    {briefLoading ? 'Refreshing…' : 'Refresh brief'}
                  </button>
                </>
              ) : (
                <>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.55, marginBottom: 12 }}>
                    Generate a personalized summary of your recent wellness patterns to review before your session.
                  </p>
                  <button
                    onClick={() => generateBrief(false)}
                    disabled={briefLoading}
                    style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 20, padding: '8px 16px', fontSize: 13, fontWeight: 800, color: '#34D399', cursor: briefLoading ? 'default' : 'pointer', opacity: briefLoading ? 0.6 : 1 }}
                  >
                    {briefLoading ? 'Generating…' : 'Generate pre-visit brief'}
                  </button>
                </>
              )}
            </div>

            {/* Video room */}
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 16 }}>
              <p style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', marginBottom: 12 }}>VIDEO ROOM</p>
              {!session.session_url ? (
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>No video room set up for this session.</p>
              ) : !joined ? (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setJoined(true)}
                  style={{ width: '100%', background: '#22C55E', border: 'none', borderRadius: 14, padding: '14px', fontSize: 14, fontWeight: 900, color: '#06281A', cursor: 'pointer' }}
                >
                  Join Video Session
                </motion.button>
              ) : (
                <div style={{ borderRadius: 14, overflow: 'hidden', background: '#000' }}>
                  <iframe
                    src={session.session_url}
                    allow="camera; microphone; fullscreen; display-capture; autoplay"
                    style={{ width: '100%', height: 480, border: 0, display: 'block' }}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <WellnessNav />
    </div>
  );
}
