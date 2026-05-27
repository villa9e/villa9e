'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { VillageSound } from '@/lib/sounds/village';

type Tab = 'pending' | 'connected';

interface Connection {
  id: string;
  status: string;
  requester_id: string;
  addressee_id: string;
  created_at: string;
  requester?: { username: string; display_name: string; village_score: number; score_tier: string };
  addressee?: { username: string; display_name: string; village_score: number; score_tier: string };
}

export default function ConnectionsPage() {
  const [tab, setTab]           = useState<Tab>('pending');
  const [connections, setConns] = useState<Connection[]>([]);
  const [myId, setMyId]         = useState<string | null>(null);
  const [loading, setLoading]   = useState(true);
  const [responding, setResponding] = useState<string | null>(null);
  const supabase = createClient();
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';

  const bg     = isNight ? '#060810' : '#F0F4FF';
  const card   = isNight ? '#0D1020' : '#FFFFFF';
  const border = isNight ? '#1A1F3A' : '#E0E7FF';
  const text   = isNight ? '#F0EBE0' : '#1E1B4B';
  const muted  = isNight ? '#4A4F72' : '#6D28D9';

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setMyId(user.id);
      loadConnections(user.id);
    });
  }, [tab]);

  async function loadConnections(uid: string) {
    setLoading(true);
    const statusFilter = tab === 'pending' ? 'pending' : 'accepted';

    const { data } = await (supabase as any)
      .from('connections')
      .select(`
        id, status, requester_id, addressee_id, created_at,
        requester:profiles!connections_requester_id_fkey(username, display_name, village_score, score_tier),
        addressee:profiles!connections_addressee_id_fkey(username, display_name, village_score, score_tier)
      `)
      .eq('status', statusFilter)
      .or(`requester_id.eq.${uid},addressee_id.eq.${uid}`)
      .order('created_at', { ascending: false })
      .limit(50);

    setConns(data ?? []);
    setLoading(false);
  }

  async function respond(connectionId: string, action: 'accept' | 'decline') {
    setResponding(connectionId);
    const res = await fetch('/api/connections/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connection_id: connectionId, action }),
    });
    if (res.ok) {
      if (action === 'accept') VillageSound.oowop();
      setConns(prev => prev.filter(c => c.id !== connectionId));
    }
    setResponding(null);
  }

  const tier = (t: string) => t === 'legend' ? '🏆' : t === 'elder' ? '⚡' : t === 'builder' ? '🏗️' : t === 'grower' ? '🌱' : '🌾';

  const pending  = connections.filter(c => c.status === 'pending' && c.addressee_id === myId);
  const outgoing = connections.filter(c => c.status === 'pending' && c.requester_id === myId);
  const connected = connections.filter(c => c.status === 'accepted');

  return (
    <div className="min-h-screen pb-24" style={{ background: bg }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-3 flex items-center gap-3"
        style={{ background: isNight ? 'rgba(6,8,16,0.92)' : 'rgba(240,244,255,0.92)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${border}` }}>
        <Link href="/village/discover" className="text-xl" style={{ color: muted }}>←</Link>
        <span className="text-2xl">🤝</span>
        <div className="flex-1">
          <h1 className="text-lg font-black" style={{ color: text }}>Connections</h1>
          <p className="text-xs" style={{ color: muted }}>Your village network</p>
        </div>
        {pending.length > 0 && (
          <div className="w-5 h-5 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-black">
            {pending.length}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b" style={{ background: card, borderColor: border }}>
        {(['pending', 'connected'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-3 text-sm font-semibold relative transition-colors"
            style={{ color: tab === t ? '#1877F2' : muted }}>
            {t === 'pending'
              ? `Pending${pending.length ? ` (${pending.length})` : ''}`
              : `Connected${connected.length ? ` (${connected.length})` : ''}`}
            {tab === t && <motion.div layoutId="conn-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1877F2]" />}
          </button>
        ))}
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-3">

        {/* Pending tab */}
        {tab === 'pending' && (
          <>
            {pending.length > 0 && (
              <>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: muted }}>Requests for you</p>
                {pending.map(conn => {
                  const other = conn.requester;
                  if (!other) return null;
                  return (
                    <motion.div key={conn.id}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl p-4"
                      style={{ background: card, border: `1px solid rgba(24,119,242,0.3)` }}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-white text-sm"
                          style={{ background: 'linear-gradient(135deg,#1877F2,#7C3AED)' }}>
                          {other.username?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <Link href={`/villager/${other.username}`}
                            className="font-bold text-sm" style={{ color: text }}>
                            @{other.username}
                          </Link>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-sm">{tier(other.score_tier)}</span>
                            <span className="text-xs" style={{ color: muted }}>{other.village_score} pts</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <motion.button whileTap={{ scale: 0.95 }}
                            disabled={responding === conn.id}
                            onClick={() => respond(conn.id, 'accept')}
                            className="px-4 py-1.5 rounded-full text-xs font-black text-white disabled:opacity-50"
                            style={{ background: '#1877F2' }}>
                            {responding === conn.id ? '…' : '✓ Accept'}
                          </motion.button>
                          <motion.button whileTap={{ scale: 0.95 }}
                            disabled={responding === conn.id}
                            onClick={() => respond(conn.id, 'decline')}
                            className="px-3 py-1.5 rounded-full text-xs font-semibold disabled:opacity-50"
                            style={{ background: isNight ? 'rgba(255,255,255,0.06)' : '#F3F4F6', color: muted }}>
                            Decline
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </>
            )}

            {outgoing.length > 0 && (
              <>
                <p className="text-xs font-bold uppercase tracking-widest mt-4" style={{ color: muted }}>Sent by you</p>
                {outgoing.map(conn => {
                  const other = conn.addressee;
                  if (!other) return null;
                  return (
                    <div key={conn.id} className="rounded-2xl p-4 flex items-center gap-3"
                      style={{ background: card, border: `1px solid ${border}` }}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-white text-sm"
                        style={{ background: 'linear-gradient(135deg,#1877F2,#7C3AED)' }}>
                        {other.username?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <Link href={`/villager/${other.username}`}
                          className="font-bold text-sm" style={{ color: text }}>
                          @{other.username}
                        </Link>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: 'rgba(24,119,242,0.1)', color: '#60a5fa' }}>
                        Awaiting
                      </span>
                    </div>
                  );
                })}
              </>
            )}

            {pending.length === 0 && outgoing.length === 0 && !loading && (
              <div className="text-center py-16">
                <p className="text-5xl mb-3">🤝</p>
                <p className="font-bold text-sm mb-1" style={{ color: text }}>No pending requests</p>
                <p className="text-xs mb-5" style={{ color: muted }}>Discover villagers to build your network.</p>
                <Link href="/village/discover"
                  className="inline-block px-6 py-2.5 rounded-full text-xs font-black text-white"
                  style={{ background: '#1877F2' }}>
                  Discover Villagers →
                </Link>
              </div>
            )}
          </>
        )}

        {/* Connected tab */}
        {tab === 'connected' && (
          <>
            {connected.map((conn, i) => {
              const other = conn.requester_id === myId ? conn.addressee : conn.requester;
              if (!other) return null;
              return (
                <motion.div key={conn.id}
                  initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}>
                  <Link href={`/villager/${other.username}`}
                    className="flex items-center gap-3 p-4 rounded-2xl"
                    style={{ background: card, border: `1px solid ${border}`, display: 'flex' }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-white text-sm"
                      style={{ background: 'linear-gradient(135deg,#1877F2,#7C3AED)' }}>
                      {other.username?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm" style={{ color: text }}>@{other.username}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-sm">{tier(other.score_tier)}</span>
                        <span className="text-xs" style={{ color: muted }}>{other.village_score} pts</span>
                      </div>
                    </div>
                    <span className="text-xs font-semibold" style={{ color: '#22C55E' }}>Connected ✓</span>
                  </Link>
                </motion.div>
              );
            })}

            {connected.length === 0 && !loading && (
              <div className="text-center py-16">
                <p className="text-5xl mb-3">🌍</p>
                <p className="font-bold text-sm mb-1" style={{ color: text }}>No connections yet</p>
                <p className="text-xs mb-5" style={{ color: muted }}>Start building your village network.</p>
                <Link href="/village/discover"
                  className="inline-block px-6 py-2.5 rounded-full text-xs font-black text-white"
                  style={{ background: '#1877F2' }}>
                  Discover Villagers →
                </Link>
              </div>
            )}
          </>
        )}

        {loading && Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: card }} />
        ))}
      </div>
    </div>
  );
}
