'use client';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface SearchResults {
  users:  any[];
  posts:  any[];
  goals:  any[];
  deals:  any[];
  stores: any[];
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}
function UserIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}
function FileTextIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  );
}
function FlagIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
      <line x1="4" y1="22" x2="4" y2="15"/>
    </svg>
  );
}
function TagIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  );
}
function StoreIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}
function TrendingIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  );
}
function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

export default function DiscoverPage() {
  const router   = useRouter();
  const supabase = createClient();

  const [query,          setQuery]          = useState('');
  const [loading,        setLoading]        = useState(false);
  const [results,        setResults]        = useState<SearchResults | null>(null);
  const [trendingGoals,  setTrendingGoals]  = useState<any[]>([]);
  const [activeCreators, setActiveCreators] = useState<any[]>([]);
  const [openDeals,      setOpenDeals]      = useState<any[]>([]);
  const [newStores,      setNewStores]      = useState<any[]>([]);
  const [defaultLoading, setDefaultLoading] = useState(true);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef    = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDefaults();
    inputRef.current?.focus();
  }, []);

  async function loadDefaults() {
    setDefaultLoading(true);
    const [goalsRes, creatorsRes, dealsRes, storesRes] = await Promise.allSettled([
      (supabase as any).from('goal_templates')
        .select('id,title,category,probability_score,clone_count')
        .order('clone_count', { ascending: false })
        .limit(5),
      (supabase as any).from('profiles')
        .select('id,username,display_name,avatar_url,village_score')
        .order('village_score', { ascending: false })
        .limit(8),
      (supabase as any).from('investor_deals')
        .select('id,name,deal_type,raise_amount')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(3),
      (supabase as any).from('estores')
        .select('id,store_name,tagline')
        .order('created_at', { ascending: false })
        .limit(4),
    ]);

    if (goalsRes.status    === 'fulfilled') setTrendingGoals(goalsRes.value.data    ?? []);
    if (creatorsRes.status === 'fulfilled') setActiveCreators(creatorsRes.value.data ?? []);
    if (dealsRes.status    === 'fulfilled') setOpenDeals(dealsRes.value.data        ?? []);
    if (storesRes.status   === 'fulfilled') setNewStores(storesRes.value.data       ?? []);
    setDefaultLoading(false);
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults(null); return; }
    debounceRef.current = setTimeout(() => runSearch(query.trim()), 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  async function runSearch(q: string) {
    setLoading(true);
    const ilike = `%${q}%`;
    const [usersRes, postsRes, goalsRes, dealsRes, storesRes] = await Promise.allSettled([
      (supabase as any).from('profiles')
        .select('id,username,display_name,avatar_url,village_score')
        .or(`username.ilike.${ilike},display_name.ilike.${ilike}`)
        .limit(5),
      (supabase as any).from('dream_line_posts')
        .select('id,content,created_at')
        .ilike('content', ilike)
        .limit(5),
      (supabase as any).from('goals')
        .select('id,title,category,probability_score')
        .ilike('title', ilike)
        .limit(5),
      (supabase as any).from('investor_deals')
        .select('id,name,deal_type,raise_amount,status')
        .ilike('name', ilike)
        .limit(5),
      (supabase as any).from('estores')
        .select('id,store_name,tagline')
        .ilike('store_name', ilike)
        .limit(5),
    ]);

    setResults({
      users:  usersRes.status  === 'fulfilled' ? (usersRes.value.data  ?? []) : [],
      posts:  postsRes.status  === 'fulfilled' ? (postsRes.value.data  ?? []) : [],
      goals:  goalsRes.status  === 'fulfilled' ? (goalsRes.value.data  ?? []) : [],
      deals:  dealsRes.status  === 'fulfilled' ? (dealsRes.value.data  ?? []) : [],
      stores: storesRes.status === 'fulfilled' ? (storesRes.value.data ?? []) : [],
    });
    setLoading(false);
  }

  const totalResults = results
    ? results.users.length + results.posts.length + results.goals.length + results.deals.length + results.stores.length
    : 0;

  function AvatarPlaceholder({ name, size = 40 }: { name: string; size?: number }) {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        background: 'linear-gradient(135deg,#2952E8,#4D72FF)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.4, fontWeight: 800, color: '#fff',
      }}>
        {name?.[0]?.toUpperCase() ?? '?'}
      </div>
    );
  }

  function SectionHeading({ icon, label, color = '#2952E8' }: { icon: React.ReactNode; label: string; color?: string }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ color }}>{icon}</span>
        <span style={{ fontSize: 12, fontWeight: 900, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
          {label}
        </span>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080E24', color: '#fff', display: 'flex', flexDirection: 'column' }}>

      {/* TOP BAR */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20, padding: '14px 16px 12px',
        background: 'rgba(8,14,36,0.96)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        <p style={{ fontSize: 22, fontWeight: 900, marginBottom: 12, letterSpacing: '-0.02em' }}>Discover</p>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <div style={{ position: 'absolute', left: 12, pointerEvents: 'none' }}>
            <SearchIcon />
          </div>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search people, posts, goals, deals..."
            autoComplete="off"
            style={{
              width: '100%', padding: '11px 40px 11px 40px', borderRadius: 14,
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff', fontSize: 15, outline: 'none',
            }}
          />
          {query && (
            <button onClick={() => setQuery('')}
              style={{ position: 'absolute', right: 12, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <XIcon />
            </button>
          )}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 100px' }}>

        {/* SEARCH RESULTS */}
        {query.trim() && (
          <>
            {loading && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>
                Searching...
              </div>
            )}
            {!loading && results && totalResults === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>No results for &ldquo;{query}&rdquo;</p>
              </div>
            )}
            {!loading && results && totalResults > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

                {results.users.length > 0 && (
                  <section>
                    <SectionHeading icon={<UserIcon />} label="People" color="#4D72FF" />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {results.users.map(u => (
                        <motion.button key={u.id}
                          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                          onClick={() => router.push(`/villager/${u.username}`)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '12px 14px', borderRadius: 14, width: '100%', textAlign: 'left',
                            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer',
                          }}>
                          {u.avatar_url
                            ? <img src={u.avatar_url} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                            : <AvatarPlaceholder name={u.username} size={40} />
                          }
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>@{u.username}</p>
                            {u.display_name && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>{u.display_name}</p>}
                          </div>
                          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>{u.village_score ?? 0} pts</span>
                        </motion.button>
                      ))}
                    </div>
                  </section>
                )}

                {results.posts.length > 0 && (
                  <section>
                    <SectionHeading icon={<FileTextIcon />} label="Posts" color="#10B981" />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {results.posts.map(p => (
                        <motion.div key={p.id}
                          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                          style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
                            {p.content?.slice(0, 120)}{p.content?.length > 120 ? '...' : ''}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </section>
                )}

                {results.goals.length > 0 && (
                  <section>
                    <SectionHeading icon={<FlagIcon />} label="Goals" color="#8B5CF6" />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {results.goals.map(g => (
                        <motion.div key={g.id}
                          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                          style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{g.title}</p>
                          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                            {g.category && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{g.category}</span>}
                            {g.probability_score != null && <span style={{ fontSize: 11, color: '#10B981', fontWeight: 700 }}>{g.probability_score}% GPS</span>}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </section>
                )}

                {results.deals.length > 0 && (
                  <section>
                    <SectionHeading icon={<TagIcon />} label="Deals" color="#F59E0B" />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {results.deals.map(d => (
                        <motion.button key={d.id}
                          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                          onClick={() => router.push(`/village/trading-post/deals/${d.id}`)}
                          style={{ display: 'block', padding: '12px 14px', borderRadius: 14, width: '100%', textAlign: 'left', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer' }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{d.name}</p>
                          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                            {d.deal_type && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{d.deal_type}</span>}
                            {d.raise_amount != null && <span style={{ fontSize: 12, fontWeight: 800, color: '#F59E0B' }}>${d.raise_amount.toLocaleString()}</span>}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </section>
                )}

                {results.stores.length > 0 && (
                  <section>
                    <SectionHeading icon={<StoreIcon />} label="Stores" color="#EC4899" />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {results.stores.map(s => (
                        <motion.button key={s.id}
                          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                          onClick={() => router.push(`/village/trading-post/market/${s.id}`)}
                          style={{ display: 'block', padding: '12px 14px', borderRadius: 14, width: '100%', textAlign: 'left', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer' }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{s.store_name}</p>
                          {s.tagline && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{s.tagline?.slice(0, 80)}</p>}
                        </motion.button>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </>
        )}

        {/* DEFAULT TRENDING STATE */}
        {!query.trim() && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {defaultLoading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Loading...</div>
            ) : (
              <>
                {trendingGoals.length > 0 && (
                  <section>
                    <SectionHeading icon={<TrendingIcon />} label="Trending Goals" color="#8B5CF6" />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {trendingGoals.map((g, i) => (
                        <motion.button key={g.id}
                          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => router.push('/village/workshop/templates')}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 14, padding: '14px', borderRadius: 16,
                            width: '100%', textAlign: 'left', background: 'rgba(139,92,246,0.08)',
                            border: '1px solid rgba(139,92,246,0.18)', cursor: 'pointer',
                          }}>
                          <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: 'rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ color: '#8B5CF6' }}><FlagIcon /></span>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.title}</p>
                            <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                              {g.category && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{g.category}</span>}
                              {(g.clone_count ?? 0) > 0 && <span style={{ fontSize: 11, color: '#8B5CF6', fontWeight: 700 }}>{g.clone_count} clones</span>}
                            </div>
                          </div>
                          {g.probability_score != null && (
                            <span style={{ fontSize: 11, fontWeight: 800, color: '#10B981', background: 'rgba(16,185,129,0.12)', padding: '2px 8px', borderRadius: 20 }}>
                              {g.probability_score}%
                            </span>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </section>
                )}

                {activeCreators.length > 0 && (
                  <section>
                    <SectionHeading icon={<UserIcon />} label="Active Creators" color="#4D72FF" />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                      {activeCreators.map((c, i) => (
                        <motion.button key={c.id}
                          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.04 }}
                          onClick={() => router.push(`/villager/${c.username}`)}
                          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', width: 'calc(25% - 12px)' }}>
                          {c.avatar_url
                            ? <img src={c.avatar_url} alt="" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(77,114,255,0.3)' }} />
                            : (
                              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#2952E8,#4D72FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#fff' }}>
                                {c.username?.[0]?.toUpperCase() ?? '?'}
                              </div>
                            )
                          }
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 600, maxWidth: 64, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            @{c.username}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  </section>
                )}

                {openDeals.length > 0 && (
                  <section>
                    <SectionHeading icon={<TagIcon />} label="Open Deals" color="#F59E0B" />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {openDeals.map((d, i) => (
                        <motion.button key={d.id}
                          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => router.push(`/village/trading-post/deals/${d.id}`)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 14, padding: '14px', borderRadius: 16,
                            width: '100%', textAlign: 'left', background: 'rgba(245,158,11,0.08)',
                            border: '1px solid rgba(245,158,11,0.18)', cursor: 'pointer',
                          }}>
                          <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: 'rgba(245,158,11,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ color: '#F59E0B' }}><TagIcon /></span>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</p>
                            {d.deal_type && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{d.deal_type}</p>}
                          </div>
                          {d.raise_amount != null && (
                            <span style={{ fontSize: 13, fontWeight: 900, color: '#F59E0B', flexShrink: 0 }}>
                              ${d.raise_amount.toLocaleString()}
                            </span>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </section>
                )}

                {newStores.length > 0 && (
                  <section>
                    <SectionHeading icon={<StoreIcon />} label="New in Market" color="#EC4899" />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {newStores.map((s, i) => (
                        <motion.button key={s.id}
                          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => router.push(`/village/trading-post/market/${s.id}`)}
                          style={{ padding: '14px', borderRadius: 16, textAlign: 'left', background: 'rgba(236,72,153,0.07)', border: '1px solid rgba(236,72,153,0.16)', cursor: 'pointer' }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, marginBottom: 8, background: 'rgba(236,72,153,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ color: '#EC4899' }}><StoreIcon /></span>
                          </div>
                          <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.store_name}</p>
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#EC4899', background: 'rgba(236,72,153,0.12)', padding: '2px 6px', borderRadius: 10 }}>NEW</span>
                        </motion.button>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
