'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: myConns }, { data: inbound }] = await Promise.all([
        supabase.from('connections')
          .select('*, profiles!connections_addressee_id_fkey(username, display_name, village_score, score_tier, personality_type, avatar_url)')
          .eq('requester_id', user.id)
          .eq('status', 'accepted'),
        supabase.from('connections')
          .select('*, profiles!connections_requester_id_fkey(username, display_name, village_score, score_tier, personality_type, avatar_url)')
          .eq('addressee_id', user.id)
          .eq('status', 'pending'),
      ]);

      setConnections(myConns ?? []);
      setPending(inbound ?? []);
      setLoading(false);
    }
    load();
  }, []);

  async function acceptConnection(connId: string, requesterId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('connections').update({ status: 'accepted' }).eq('id', connId);
    // Notify requester
    await supabase.from('notifications').insert({
      user_id: requesterId,
      type: 'match',
      title: 'Connection accepted!',
      body: 'A villager accepted your connection request.',
    });
    // Move from pending to accepted
    const accepted = pending.find(p => p.id === connId);
    if (accepted) {
      setConnections(prev => [...prev, { ...accepted, status: 'accepted' }]);
      setPending(prev => prev.filter(p => p.id !== connId));
    }
  }

  async function declineConnection(connId: string) {
    await supabase.from('connections').update({ status: 'declined' }).eq('id', connId);
    setPending(prev => prev.filter(p => p.id !== connId));
  }

  const ARCHETYPE: Record<string, string> = { architect:'🏗️', spark:'⚡', anchor:'⚓', compass:'🧭', pioneer:'🏔️', sage:'📚', weaver:'🕸️', flame:'🔥' };

  const VillagerCard = ({ profile, showMessage = true }: { profile: any; showMessage?: boolean }) => (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="village-card flex items-center gap-3">
      <Link href={`/villager/${profile?.username}`} className="flex-shrink-0">
        <div className="w-12 h-12 rounded-2xl bg-village-blue/10 flex items-center justify-center text-xl font-bold text-village-blue">
          {profile?.avatar_url
            ? <img src={profile.avatar_url} className="w-full h-full rounded-2xl object-cover" alt="" />
            : (profile?.username?.[0] ?? '?').toUpperCase()}
        </div>
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <Link href={`/villager/${profile?.username}`} className="font-bold text-sm hover:text-village-blue">
            @{profile?.username}
          </Link>
          {profile?.personality_type && <span className="text-sm">{ARCHETYPE[profile.personality_type] ?? ''}</span>}
        </div>
        {profile?.display_name && <p className="text-xs text-gray-500">{profile.display_name}</p>}
        <p className="text-xs text-gray-400">{profile?.score_tier ?? 'Seedling'} · {profile?.village_score ?? 0} pts</p>
      </div>
      {showMessage && (
        <Link href="/messages" className="text-xs bg-village-blue text-white rounded-full px-3 py-1.5 font-medium hover:bg-blue-700 transition-colors">
          Message
        </Link>
      )}
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-village-bg">
      <div className="bg-village-blue text-white px-6 py-4 flex items-center gap-3">
        <Link href="/village/discover" className="text-xl">←</Link>
        <span className="text-2xl">🤝</span>
        <div>
          <h1 className="text-xl font-bold">Connections</h1>
          <p className="text-blue-100 text-xs">Your village network</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-5">
        {/* Pending requests */}
        {pending.length > 0 && (
          <div>
            <h2 className="font-bold text-sm text-gray-500 uppercase tracking-wide mb-3">
              Pending Requests ({pending.length})
            </h2>
            <div className="space-y-3">
              {pending.map(conn => {
                const profile = (conn as any).profiles;
                return (
                  <motion.div key={conn.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    className="village-card border border-amber-200 bg-amber-50">
                    <div className="flex items-center gap-3 mb-3">
                      <Link href={`/villager/${profile?.username}`}>
                        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center font-bold text-amber-600">
                          {(profile?.username?.[0] ?? '?').toUpperCase()}
                        </div>
                      </Link>
                      <div className="flex-1">
                        <p className="font-bold text-sm">@{profile?.username}</p>
                        <p className="text-xs text-gray-400">{profile?.score_tier ?? 'Seedling'} · wants to connect</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => acceptConnection(conn.id, profile?.id ?? conn.requester_id)}
                        className="flex-1 bg-village-blue text-white rounded-full py-2 text-sm font-bold hover:bg-blue-700">
                        Accept
                      </button>
                      <button onClick={() => declineConnection(conn.id)}
                        className="flex-1 bg-gray-100 text-gray-500 rounded-full py-2 text-sm hover:bg-gray-200">
                        Decline
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Connected villagers */}
        <div>
          <h2 className="font-bold text-sm text-gray-500 uppercase tracking-wide mb-3">
            My Connections ({connections.length})
          </h2>
          {loading && <div className="text-center py-8 text-gray-400">Loading…</div>}
          {!loading && connections.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-2">🤝</p>
              <p>No connections yet.</p>
              <p className="text-sm mt-1 mb-4">Discover villagers and build your network.</p>
              <Link href="/village/discover" className="village-btn-primary">Discover Villagers</Link>
            </div>
          )}
          <div className="space-y-3">
            {connections.map(conn => (
              <VillagerCard key={conn.id} profile={(conn as any).profiles} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
