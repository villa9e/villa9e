'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { VillageHeader } from '@/components/village/VillageHeader';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

type Tab = 'my' | 'discover';

export default function TribesPage() {
  const supabase = createClient();
  const router = useRouter();

  // ── shared state ──────────────────────────────────────────────────────────
  const [tab, setTab] = useState<Tab>('my');
  const [userId, setUserId] = useState<string | null>(null);

  // ── My Tribes state ───────────────────────────────────────────────────────
  const [myTribes, setMyTribes] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', is_public: true });
  const [saving, setSaving] = useState(false);

  // ── Discover state ────────────────────────────────────────────────────────
  const [publicTribes, setPublicTribes] = useState<any[]>([]);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());

  // ── theme ─────────────────────────────────────────────────────────────────
  const { theme, toggle } = useVillageTheme();
  const isNight  = theme === 'night';
  const bg       = isNight ? '#0A0B12' : '#FFF0F8';
  const cardBg   = isNight ? '#12152A' : '#FFFFFF';
  const border   = isNight ? '#1E2240' : '#FBCFE8';
  const textMain = isNight ? '#F0EBE0' : '#2D0D1F';
  const textMute = isNight ? '#4A4F72' : '#9D174D';
  const accent   = '#DB2777';
  const accentFg = isNight ? '#F472B6' : '#DB2777';

  // ── init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
    });
    loadMyTribes();
  }, []);

  // When switching to discover, load if empty
  useEffect(() => {
    if (tab === 'discover' && publicTribes.length === 0) {
      loadPublicTribes();
    }
  }, [tab]);

  // ── My Tribes ─────────────────────────────────────────────────────────────
  async function loadMyTribes() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('tribe_members')
      .select('tribe_id, tribes(*, tribe_members(user_id))')
      .eq('user_id', user.id);
    const tribes = data?.map((d: any) => d.tribes).filter(Boolean) ?? [];
    setMyTribes(tribes);
    setJoinedIds(new Set(tribes.map((t: any) => t.id)));
  }

  async function createTribe() {
    if (!form.name.trim()) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const insertPayload: any = {
        name: form.name,
        description: form.description,
        creator_id: user.id,
      };
      // is_public may not exist yet — include it but handle gracefully
      try { insertPayload.is_public = form.is_public; } catch (_) {}

      const { data: tribe, error } = await supabase
        .from('tribes')
        .insert(insertPayload)
        .select()
        .single();

      if (tribe && !error) {
        await supabase.from('tribe_members').insert({ tribe_id: tribe.id, user_id: user.id, role: 'founder' });
        await loadMyTribes();
        setShowCreate(false);
        setForm({ name: '', description: '', is_public: true });
      }
    }
    setSaving(false);
  }

  // ── Discover ──────────────────────────────────────────────────────────────
  const loadPublicTribes = useCallback(async () => {
    setDiscoverLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    // Try with is_public filter first; fall back to all tribes if column missing
    let { data, error } = await supabase
      .from('tribes')
      .select('*, tribe_members(count), profiles!creator_id(username)')
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (error) {
      // Fallback: column probably doesn't exist yet — fetch all tribes
      const fallback = await supabase
        .from('tribes')
        .select('*, tribe_members(count), profiles!creator_id(username)')
        .order('created_at', { ascending: false });
      data = fallback.data;
    }

    setPublicTribes(data ?? []);

    // Mark already-joined tribes
    if (user) {
      const { data: memberships } = await supabase
        .from('tribe_members')
        .select('tribe_id')
        .eq('user_id', user.id);
      if (memberships) {
        setJoinedIds(new Set(memberships.map((m: any) => m.tribe_id)));
      }
    }

    setDiscoverLoading(false);
  }, [supabase]);

  async function joinTribe(tribeId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setJoiningId(tribeId);
    const { error } = await supabase
      .from('tribe_members')
      .insert({ tribe_id: tribeId, user_id: user.id, role: 'member' });
    if (!error) {
      setJoinedIds(prev => new Set([...prev, tribeId]));
      router.push(`/village/tribes/${tribeId}`);
    }
    setJoiningId(null);
  }

  // ── filtered discover list ─────────────────────────────────────────────────
  const filteredTribes = publicTribes.filter(t =>
    !search.trim() ||
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.description?.toLowerCase().includes(search.toLowerCase())
  );

  // ── helpers ───────────────────────────────────────────────────────────────
  function getMemberCount(tribe: any): number {
    const raw = tribe.tribe_members;
    if (!raw) return 0;
    if (Array.isArray(raw)) {
      // aggregate count response: [{ count: N }]
      if (raw.length > 0 && typeof raw[0]?.count === 'number') return raw[0].count;
      return raw.length;
    }
    return 0;
  }

  function getCreatorName(tribe: any): string {
    const p = tribe.profiles;
    if (!p) return 'unknown';
    if (Array.isArray(p)) return p[0]?.username ?? 'unknown';
    return p.username ?? 'unknown';
  }

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: bg }}>

      {/* ── top bar ─────────────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 border-b"
        style={{ background: isNight ? '#12152A' : accent, borderColor: isNight ? '#1E2240' : 'transparent' }}
      >
        <a href="/village/map" className="text-xl" style={{ color: isNight ? '#F0EBE0' : '#fff' }}>←</a>
        <span className="text-2xl">👥</span>
        <div className="flex-1">
          <h1 className="text-lg font-black" style={{ color: isNight ? '#F0EBE0' : '#fff' }}>Tribes</h1>
          <p className="text-xs opacity-70" style={{ color: isNight ? '#7A7FA8' : '#fff' }}>Your project teams & communities</p>
        </div>
        {tab === 'my' && (
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-full px-3 py-1 text-sm font-bold"
            style={{ background: isNight ? '#1E2240' : 'rgba(255,255,255,0.2)', color: '#fff' }}
          >
            + Create
          </button>
        )}
        <button
          onClick={toggle}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: isNight ? '#1E2240' : 'rgba(255,255,255,0.15)' }}
        >
          <span className="text-base">{isNight ? '☀️' : '🌙'}</span>
        </button>
      </div>

      {/* ── tab pills ───────────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 pt-4 pb-0">
        <div
          className="flex rounded-2xl overflow-hidden border"
          style={{ borderColor: border, background: isNight ? '#12152A' : '#FCE7F3' }}
        >
          {(['my', 'discover'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2.5 text-sm font-bold transition-all"
              style={{
                background: tab === t ? accent : 'transparent',
                color: tab === t ? '#fff' : accentFg,
              }}
            >
              {t === 'my' ? '👥 My Tribes' : '🔍 Discover'}
            </button>
          ))}
        </div>
      </div>

      {/* ── create tribe modal ───────────────────────────────────────────── */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md p-6 space-y-4 rounded-3xl"
              style={{ background: cardBg, border: `1px solid ${border}` }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black" style={{ color: textMain }}>Create a Tribe</h2>
                <button onClick={() => setShowCreate(false)} className="text-2xl" style={{ color: textMute }}>×</button>
              </div>

              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Tribe name (e.g. 'The EP Squad')"
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                style={{ background: isNight ? '#0A0B12' : '#FFF0F8', border: `1px solid ${border}`, color: textMain }}
              />

              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="What is this tribe working toward?"
                rows={3}
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none resize-none"
                style={{ background: isNight ? '#0A0B12' : '#FFF0F8', border: `1px solid ${border}`, color: textMain }}
              />

              {/* is_public toggle */}
              <div
                className="flex items-center justify-between rounded-xl px-4 py-3"
                style={{ background: isNight ? '#0A0B12' : '#FFF0F8', border: `1px solid ${border}` }}
              >
                <div>
                  <p className="text-sm font-semibold" style={{ color: textMain }}>Make tribe public</p>
                  <p className="text-xs" style={{ color: textMute }}>
                    {form.is_public ? 'Anyone can discover and join' : 'Invite only'}
                  </p>
                </div>
                <button
                  onClick={() => setForm(f => ({ ...f, is_public: !f.is_public }))}
                  className="w-12 h-6 rounded-full transition-colors relative"
                  style={{ background: form.is_public ? accent : (isNight ? '#1E2240' : '#FBCFE8') }}
                >
                  <span
                    className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
                    style={{ left: form.is_public ? '26px' : '2px' }}
                  />
                </button>
              </div>

              <button
                onClick={createTribe}
                disabled={saving || !form.name.trim()}
                className="w-full rounded-full py-3 font-bold transition-colors disabled:opacity-50"
                style={{ background: accent, color: '#fff' }}
              >
                {saving ? 'Creating…' : '👥 Create Tribe'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── tab content ─────────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto p-4 space-y-3">

        <AnimatePresence mode="wait">

          {/* ══ MY TRIBES ══ */}
          {tab === 'my' && (
            <motion.div
              key="my"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.18 }}
              className="space-y-3"
            >
              {myTribes.map((tribe, i) => (
                <Link key={tribe.id} href={`/village/tribes/${tribe.id}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-2xl p-4 cursor-pointer transition-all"
                    style={{ background: cardBg, border: `1px solid ${border}` }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                        style={{ background: isNight ? '#1E2240' : '#FCE7F3' }}
                      >👥</div>
                      <div className="flex-1">
                        <p className="font-bold" style={{ color: textMain }}>{tribe.name}</p>
                        {tribe.description && (
                          <p className="text-sm mt-0.5 line-clamp-2" style={{ color: textMute }}>{tribe.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs" style={{ color: textMute }}>
                            {tribe.tribe_members?.length ?? 0} members
                          </span>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: isNight ? '#0D2D1A' : '#DCFCE7', color: '#16A34A' }}
                          >
                            {tribe.project_status ?? 'active'}
                          </span>
                        </div>
                      </div>
                      <span className="text-xl" style={{ color: textMute }}>›</span>
                    </div>

                    <div className="flex gap-2 mt-3">
                      {[
                        { label: '📋 Tasks', color: accentFg },
                        { label: '💬 Chat', color: '#1877F2' },
                        { label: '👥 Members', color: textMute },
                      ].map(pill => (
                        <span
                          key={pill.label}
                          className="flex-1 text-center rounded-full py-2 text-xs font-bold"
                          style={{ background: isNight ? '#0A0B12' : '#FDF2F8', color: pill.color }}
                        >
                          {pill.label}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                </Link>
              ))}

              {myTribes.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-5xl mb-3">👥</p>
                  <p className="mb-2" style={{ color: textMute }}>No tribes yet.</p>
                  <p className="text-sm mb-6" style={{ color: isNight ? '#4A4F72' : '#BE185D' }}>
                    Tribes form when you collaborate on goals. Create one to build together.
                  </p>
                  <button
                    onClick={() => setShowCreate(true)}
                    className="rounded-full px-6 py-3 font-bold text-white"
                    style={{ background: accent }}
                  >
                    + Create My First Tribe
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* ══ DISCOVER ══ */}
          {tab === 'discover' && (
            <motion.div
              key="discover"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.18 }}
              className="space-y-3"
            >
              {/* search bar */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base" style={{ color: textMute }}>🔍</span>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search public tribes…"
                  className="w-full rounded-2xl pl-9 pr-4 py-3 text-sm focus:outline-none"
                  style={{ background: cardBg, border: `1px solid ${border}`, color: textMain }}
                />
              </div>

              {/* loading */}
              {discoverLoading && (
                <div className="text-center py-12">
                  <motion.p
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1.4 }}
                    style={{ color: textMute }}
                  >
                    Loading tribes…
                  </motion.p>
                </div>
              )}

              {/* tribe cards */}
              {!discoverLoading && filteredTribes.map((tribe, i) => {
                const memberCount = getMemberCount(tribe);
                const creatorName = getCreatorName(tribe);
                const isJoined = joinedIds.has(tribe.id);
                const isJoining = joiningId === tribe.id;

                return (
                  <motion.div
                    key={tribe.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="rounded-2xl p-4"
                    style={{ background: cardBg, border: `1px solid ${border}` }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                        style={{ background: isNight ? '#1E2240' : '#FCE7F3' }}
                      >👥</div>

                      <div className="flex-1 min-w-0">
                        <p className="font-bold truncate" style={{ color: textMain }}>{tribe.name}</p>
                        {tribe.description && (
                          <p className="text-sm mt-0.5 line-clamp-2" style={{ color: textMute }}>{tribe.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-xs" style={{ color: textMute }}>
                            👤 {memberCount} {memberCount === 1 ? 'member' : 'members'}
                          </span>
                          <span className="text-xs" style={{ color: textMute }}>
                            by @{creatorName}
                          </span>
                        </div>
                      </div>

                      {/* join / view button */}
                      {isJoined ? (
                        <Link href={`/village/tribes/${tribe.id}`}>
                          <button
                            className="rounded-full px-4 py-2 text-sm font-bold whitespace-nowrap transition-all"
                            style={{ background: isNight ? '#1E2240' : '#FCE7F3', color: accentFg, border: `1px solid ${border}` }}
                          >
                            View →
                          </button>
                        </Link>
                      ) : (
                        <button
                          onClick={() => joinTribe(tribe.id)}
                          disabled={isJoining}
                          className="rounded-full px-4 py-2 text-sm font-bold whitespace-nowrap transition-all disabled:opacity-60"
                          style={{ background: accent, color: '#fff' }}
                        >
                          {isJoining ? '…' : 'Join'}
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {/* empty state */}
              {!discoverLoading && filteredTribes.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-5xl mb-3">🌐</p>
                  {search.trim() ? (
                    <>
                      <p className="mb-1 font-semibold" style={{ color: textMute }}>No tribes match "{search}"</p>
                      <p className="text-sm" style={{ color: isNight ? '#4A4F72' : '#BE185D' }}>Try a different search term.</p>
                    </>
                  ) : (
                    <>
                      <p className="mb-1 font-semibold" style={{ color: textMute }}>No public tribes yet.</p>
                      <p className="text-sm mb-6" style={{ color: isNight ? '#4A4F72' : '#BE185D' }}>
                        Create one and make it public!
                      </p>
                      <button
                        onClick={() => { setTab('my'); setShowCreate(true); }}
                        className="rounded-full px-6 py-3 font-bold text-white"
                        style={{ background: accent }}
                      >
                        + Create a Public Tribe
                      </button>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
