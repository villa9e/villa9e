'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface SpiritAction {
  id: string;
  tool_name: string;
  tier: number;
  input: any;
  result?: any;
  status: string;
  created_at: string;
  confirmed_at?: string;
}

const TOOL_LABELS: Record<string, { verb: string; describe: (input: any) => string }> = {
  create_sprint_action: {
    verb: 'added a step to your sprint',
    describe: (i) => `"${i?.title ?? 'an action'}"`,
  },
  complete_sprint_action: {
    verb: 'updated a sprint action',
    describe: (i) => (i?.completed ? 'marked it complete' : 'marked it not done'),
  },
  create_calendar_event: {
    verb: 'added a calendar event',
    describe: (i) => `"${i?.title ?? 'New event'}"`,
  },
  send_tribe_message: {
    verb: 'wants to send a tribe message',
    describe: (i) => `"${(i?.content ?? '').slice(0, 80)}"`,
  },
};

function describeAction(a: SpiritAction): { verb: string; detail: string } {
  const meta = TOOL_LABELS[a.tool_name];
  if (!meta) return { verb: a.tool_name.replace(/_/g, ' '), detail: '' };
  return { verb: meta.verb, detail: meta.describe(a.input) };
}

export default function SpiritActivityFeed() {
  const supabase = createClient();
  const [pending, setPending] = useState<SpiritAction[]>([]);
  const [recent, setRecent] = useState<SpiritAction[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  async function load() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await fetch('/api/spirit/actions', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    setPending(data.pending ?? []);
    setRecent(data.recent ?? []);
    setLoaded(true);
  }

  useEffect(() => { load(); }, []);

  async function resolve(id: string, decision: 'confirm' | 'reject') {
    setBusyId(id);
    const { data: { session } } = await supabase.auth.getSession();
    await fetch(`/api/spirit/actions/${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({ decision }),
    });
    setBusyId(null);
    load();
  }

  if (!loaded || (pending.length === 0 && recent.length === 0)) return null;

  return (
    <div style={{ padding: '0 16px 14px' }}>
      {/* Pending Tier-2 confirmations */}
      {pending.map((a) => {
        const { verb, detail } = describeAction(a);
        return (
          <div
            key={a.id}
            style={{
              background: 'rgba(77,114,255,0.12)',
              border: '1px solid rgba(77,114,255,0.35)',
              borderRadius: 16,
              padding: '12px 14px',
              marginBottom: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 16 }}>🌀</span>
              <p style={{ fontSize: 13, color: '#F0F4FF', lineHeight: 1.45, margin: 0 }}>
                <strong>Spirit</strong> {verb}: {detail}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => resolve(a.id, 'confirm')}
                disabled={busyId === a.id}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 999, border: 'none',
                  background: '#4D72FF', color: '#fff', fontSize: 12, fontWeight: 900,
                  cursor: busyId === a.id ? 'default' : 'pointer', opacity: busyId === a.id ? 0.6 : 1,
                }}
              >
                Send it
              </button>
              <button
                onClick={() => resolve(a.id, 'reject')}
                disabled={busyId === a.id}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 999,
                  border: '1px solid rgba(240,244,255,0.2)', background: 'transparent',
                  color: 'rgba(240,244,255,0.7)', fontSize: 12, fontWeight: 900,
                  cursor: busyId === a.id ? 'default' : 'pointer', opacity: busyId === a.id ? 0.6 : 1,
                }}
              >
                Not now
              </button>
            </div>
          </div>
        );
      })}

      {/* Recent activity (collapsible) */}
      {recent.length > 0 && (
        <div>
          <button
            onClick={() => setExpanded(e => !e)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
              color: 'rgba(240,244,255,0.45)', fontSize: 12, fontWeight: 800, padding: 0, cursor: 'pointer',
            }}
          >
            <span>🌀 Spirit activity</span>
            <span style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', fontSize: 10 }}>▸</span>
          </button>
          {expanded && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {recent.map((a) => {
                const { verb, detail } = describeAction(a);
                const failed = a.status === 'failed' || a.status === 'rejected';
                return (
                  <div key={a.id} style={{ fontSize: 12, color: failed ? 'rgba(240,244,255,0.35)' : 'rgba(240,244,255,0.65)', lineHeight: 1.4 }}>
                    {failed ? '✕ ' : '✓ '}Spirit {verb}{detail ? `: ${detail}` : ''}
                    {a.status === 'rejected' && ' (declined)'}
                    {a.status === 'failed' && ' (failed)'}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
