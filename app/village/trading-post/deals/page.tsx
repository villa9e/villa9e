'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Deal {
  id: string;
  name: string;
  hook: string;
  industry: string;
  deal_type: string;
  seeking: string;
  raise_amount: number;
  deal_length: string;
  elevator_pitch: string;
  view_count: number;
  match_count: number;
  user_id?: string;
  profiles?: { username: string; display_name: string };
}

// ── Color tokens ──────────────────────────────────────────────────────────────
const C = {
  bg:     'var(--v-bg)',
  card:   'var(--v-card-bg)',
  border: 'var(--v-card-border)',
  text:   'var(--v-text)',
  muted:  'var(--v-text-muted)',
  sub:    'var(--v-text-sub)',
  brand:  'var(--v-brand)',
  gold:   'var(--v-gold)',
  success:'var(--v-success)',
  danger: 'var(--v-danger)',
};

const fmt = (n: number) => n >= 1000000 ? `$${(n/1000000).toFixed(1)}M` : `$${(n/1000).toFixed(0)}K`;

// ── Swipe Card Component ──────────────────────────────────────────────────────
function SwipeCard({ deal, onSwipe, isTop }: { deal: Deal; onSwipe: (dir: 'match'|'pass') => void; isTop: boolean }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-18, 18]);
  const matchOpacity = useTransform(x, [30, 100], [0, 1]);
  const passOpacity  = useTransform(x, [-100, -30], [1, 0]);
  const controls = useAnimation();

  async function handleDragEnd(_: unknown, info: { offset: { x: number } }) {
    const threshold = 100;
    if (info.offset.x > threshold) {
      await controls.start({ x: 600, opacity: 0, transition: { duration: 0.35 } });
      onSwipe('match');
    } else if (info.offset.x < -threshold) {
      await controls.start({ x: -600, opacity: 0, transition: { duration: 0.35 } });
      onSwipe('pass');
    } else {
      controls.start({ x: 0, rotate: 0, transition: { type: 'spring', stiffness: 300 } });
    }
  }

  async function tap(dir: 'match'|'pass') {
    await controls.start({ x: dir === 'match' ? 600 : -600, opacity: 0, transition: { duration: 0.35 } });
    onSwipe(dir);
  }

  return (
    <motion.div
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      style={{ x, rotate, position: 'absolute', width: '100%', cursor: isTop ? 'grab' : 'default' }}
      animate={controls}
      onDragEnd={handleDragEnd}
      whileDrag={{ cursor: 'grabbing' }}
    >
      {/* MATCH / PASS overlays */}
      {isTop && (
        <>
          <motion.div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, opacity: matchOpacity, border: '3px solid var(--v-success)', borderRadius: 8, padding: '6px 14px' }}>
            <span style={{ color: 'var(--v-success)', fontWeight: 900, fontSize: 18, letterSpacing: 2 }}>MATCH</span>
          </motion.div>
          <motion.div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10, opacity: passOpacity, border: '3px solid var(--v-danger)', borderRadius: 8, padding: '6px 14px' }}>
            <span style={{ color: 'var(--v-danger)', fontWeight: 900, fontSize: 18, letterSpacing: 2 }}>PASS</span>
          </motion.div>
        </>
      )}

      {/* Card body */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, overflow: 'hidden', margin: '0 4px', boxShadow: '0 8px 32px rgba(41,82,232,0.1)' }}>
        {/* Hero zone */}
        <div style={{ height: 120, background: 'linear-gradient(135deg, var(--v-brand-deep), var(--v-brand))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', padding: '0 20px' }}>
            <p style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 6 }}>{deal.name}</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.4 }}>{deal.hook}</p>
          </div>
        </div>

        {/* Snapshot row — 5 data points */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, background: 'var(--v-bg-2)' }}>
          {[
            { label: 'INDUSTRY', value: deal.industry },
            { label: 'TYPE',     value: deal.deal_type },
            { label: 'RAISE',    value: fmt(deal.raise_amount) },
            { label: 'HORIZON',  value: deal.deal_length },
            { label: 'SEEKING',  value: deal.seeking },
          ].map((item, i, arr) => (
            <div key={item.label} style={{
              flex: 1, padding: '10px 4px', textAlign: 'center',
              borderRight: i < arr.length - 1 ? `1px solid ${C.border}` : 'none',
            }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: C.text, marginBottom: 3, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.value}</p>
              <p style={{ fontSize: 8, fontWeight: 700, color: C.sub, letterSpacing: '0.05em', margin: 0 }}>{item.label}</p>
            </div>
          ))}
        </div>

        {/* Pitch */}
        <div style={{ padding: '14px 16px' }}>
          <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {deal.elevator_pitch}
          </p>
          <p style={{ fontSize: 11, color: C.brand, fontWeight: 700, marginTop: 6 }}>Read more</p>
        </div>

        {/* Action buttons */}
        {isTop && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, padding: '14px 16px 18px' }}>
            <button onClick={() => tap('pass')} style={{ width: 52, height: 52, borderRadius: 26, background: 'var(--v-danger-light)', border: '2px solid var(--v-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 22 }}>
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="var(--v-danger)" strokeWidth={2.5} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <button style={{ width: 44, height: 44, borderRadius: 22, background: 'var(--v-brand-light)', border: '2px solid var(--v-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--v-brand)" strokeWidth={2} strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </button>
            <button onClick={() => tap('match')} style={{ width: 52, height: 52, borderRadius: 26, background: 'var(--v-success-light)', border: '2px solid var(--v-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="var(--v-success)" strokeWidth={2.5} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Pass Feedback Modal ───────────────────────────────────────────────────────
function FeedbackModal({ dealId, onClose }: { dealId: string; onClose: () => void }) {
  const supabase = createClient();
  const [rating, setRating] = useState(0);
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
  const [done, setDone] = useState(false);

  const REASONS = ['Valuation too high','Outside my thesis','Team track record','Not enough traction','Deal length too long','Min investment too high','Structure','Other'];

  async function submit() {
    await (supabase as unknown as { from: (t: string) => { insert: (d: unknown) => Promise<unknown> } })
      .from('deal_feedback').insert({ deal_id: dealId, hashed_user_id: Math.random().toString(36).slice(2), rating, reason, comment });
    setDone(true);
    setTimeout(onClose, 1500);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 16 }}>
      <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ background: C.card, borderRadius: 24, width: '100%', maxWidth: 420, padding: 24, paddingBottom: 32 }}>
        {done ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>🙏</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Thanks for the feedback</p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 16, fontWeight: 900, color: C.text, marginBottom: 4 }}>Private feedback</p>
            <p style={{ fontSize: 11, color: C.muted, marginBottom: 16, lineHeight: 1.5 }}>Anonymous. The creator sees your reason — never your name.</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, justifyContent: 'center' }}>
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setRating(s)} style={{ fontSize: 28, background: 'none', border: 'none', cursor: 'pointer', opacity: s <= rating ? 1 : 0.3 }}>★</button>
              ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {REASONS.map(r => (
                <button key={r} onClick={() => setReason(r)} style={{ padding: '6px 12px', borderRadius: 20, border: `1px solid ${reason === r ? 'var(--v-brand)' : C.border}`, background: reason === r ? 'var(--v-brand-light)' : 'transparent', color: reason === r ? 'var(--v-brand-deep)' : C.muted, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                  {r}
                </button>
              ))}
            </div>
            <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="What would make this deal better? (optional)" rows={3}
              style={{ width: '100%', background: 'var(--v-bg-2)', border: `1px solid ${C.border}`, borderRadius: 12, padding: '10px 12px', fontSize: 12, color: C.text, resize: 'none', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 14 }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onClose} style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: `1px solid ${C.border}`, background: 'transparent', color: C.muted, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Skip</button>
              <button onClick={submit} disabled={rating === 0} style={{ flex: 2, padding: '12px 0', borderRadius: 12, background: rating > 0 ? 'var(--v-brand)' : 'var(--v-bg-3)', color: '#fff', fontSize: 13, fontWeight: 900, border: 'none', cursor: rating > 0 ? 'pointer' : 'not-allowed' }}>Submit</button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

// ── Deal Filter Bottom Sheet ──────────────────────────────────────────────────
interface DealFilters {
  industry: string;
  dealType: string;
  minInvestment: string;
  geography: string;
}

const INDUSTRIES = ['All','Energy','Healthcare','Technology','Real Estate','FinTech','Consumer','Education','Other'];
const DEAL_TYPES  = ['All','Equity','Convertible Note','SAFE','Revenue Share','Debt'];
const MIN_INVESTMENTS = ['Any','$10K+','$25K+','$50K+','$100K+','$250K+'];
const GEOGRAPHIES = ['All','North America','Southeast','Southwest','Northeast','Midwest','International'];

function FilterSheet({ filters, onApply, onClose }: { filters: DealFilters; onApply: (f: DealFilters) => void; onClose: () => void }) {
  const [local, setLocal] = useState<DealFilters>({ ...filters });

  function patch<K extends keyof DealFilters>(key: K, val: DealFilters[K]) {
    setLocal(f => ({ ...f, [key]: val }));
  }

  function PillRow({ label, options, field }: { label: string; options: string[]; field: keyof DealFilters }) {
    return (
      <div style={{ marginBottom: 18 }}>
        <p style={{ fontSize: 10, fontWeight: 900, color: C.sub, letterSpacing: '0.06em', marginBottom: 8 }}>{label}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {options.map(o => (
            <button key={o} onClick={() => patch(field, o)}
              style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${local[field] === o ? 'var(--v-brand)' : C.border}`, background: local[field] === o ? 'var(--v-brand)' : 'transparent', color: local[field] === o ? '#fff' : C.muted, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
              {o}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
        style={{ background: C.card, borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 480, maxHeight: '85vh', overflowY: 'auto', padding: '24px 20px', paddingBottom: 'max(32px, env(safe-area-inset-bottom))' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <p style={{ fontSize: 16, fontWeight: 900, color: C.text, margin: 0 }}>Filter Deals</p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 24, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
        <PillRow label="INDUSTRY"       options={INDUSTRIES}     field="industry" />
        <PillRow label="DEAL TYPE"      options={DEAL_TYPES}     field="dealType" />
        <PillRow label="MIN INVESTMENT" options={MIN_INVESTMENTS} field="minInvestment" />
        <PillRow label="GEOGRAPHY"      options={GEOGRAPHIES}    field="geography" />
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button onClick={() => { setLocal({ industry:'All', dealType:'All', minInvestment:'Any', geography:'All' }); }}
            style={{ flex: 1, padding: '13px 0', borderRadius: 14, border: `1px solid ${C.border}`, background: 'transparent', color: C.muted, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Reset
          </button>
          <button onClick={() => { onApply(local); onClose(); }}
            style={{ flex: 2, padding: '13px 0', borderRadius: 14, background: 'var(--v-brand)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 900, cursor: 'pointer' }}>
            Apply Filters
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── My Deals Tab ──────────────────────────────────────────────────────────────
function MyDealsTab({ userId }: { userId: string }) {
  const supabase = createClient();
  const [myDeals, setMyDeals] = useState<Deal[]>([]);
  const [totalPasses, setTotalPasses] = useState(0);

  useEffect(() => {
    (async () => {
      if (userId) {
        const { data } = await (supabase as unknown as { from: (t: string) => { select: (c: string) => { eq: (k: string, v: string) => Promise<{ data: Deal[] | null }> } } })
          .from('investor_deals').select('*').eq('user_id', userId);
        setMyDeals(data ?? []);

        const { data: swipes } = await (supabase as unknown as { from: (t: string) => { select: (c: string) => { eq: (k: string, v: string) => Promise<{ data: { direction: string }[] | null }> } } })
          .from('deal_swipes').select('direction').eq('direction', 'pass');
        setTotalPasses(swipes?.length ?? 0);
      } else {
        setMyDeals([]);
        setTotalPasses(0);
      }
    })();
  }, [userId]);

  const totalViews   = myDeals.reduce((s, d) => s + (d.view_count ?? 0), 0);
  const totalMatches = myDeals.reduce((s, d) => s + (d.match_count ?? 0), 0);
  const matchRate    = totalViews > 0 ? Math.round((totalMatches / totalViews) * 100) : 0;

  const STATS = [
    { label: 'Total Views',  value: totalViews,   color: C.brand },
    { label: 'Matches',      value: totalMatches, color: 'var(--v-success)' },
    { label: 'Passes',       value: totalPasses,  color: 'var(--v-danger)' },
    { label: 'Match Rate',   value: `${matchRate}%`, color: C.gold },
  ];

  return (
    <div style={{ padding: '16px' }}>
      {/* Performance stats */}
      <p style={{ fontSize: 10, fontWeight: 900, color: C.sub, letterSpacing: '0.06em', marginBottom: 10 }}>PERFORMANCE</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
        {STATS.map(s => (
          <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 12px', textAlign: 'center' }}>
            <p style={{ fontSize: 26, fontWeight: 900, color: s.color, margin: '0 0 4px' }}>{s.value}</p>
            <p style={{ fontSize: 10, fontWeight: 700, color: C.sub, margin: 0, letterSpacing: '0.04em' }}>{s.label.toUpperCase()}</p>
          </div>
        ))}
      </div>

      {/* Active deals list */}
      <p style={{ fontSize: 10, fontWeight: 900, color: C.sub, letterSpacing: '0.06em', marginBottom: 10 }}>YOUR ACTIVE DEALS</p>
      {myDeals.length === 0 ? (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '32px 16px', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>You haven't listed any deals yet.</p>
          <Link href="/village/trading-post/deals/create" style={{ display: 'inline-block', background: 'var(--v-brand)', color: '#fff', borderRadius: 20, padding: '10px 24px', fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>
            List a Deal
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {myDeals.map(deal => (
            <div key={deal.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 900, color: C.text, margin: '0 0 2px' }}>{deal.name}</p>
                  <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>{deal.industry} · {deal.deal_type} · {fmt(deal.raise_amount)}</p>
                </div>
                <span style={{ fontSize: 9, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: 'var(--v-success-light)', color: 'var(--v-success)', border: '1px solid var(--v-success)', whiteSpace: 'nowrap', marginLeft: 8 }}>
                  ACTIVE
                </span>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 16, fontWeight: 900, color: C.brand, margin: 0 }}>{deal.view_count ?? 0}</p>
                  <p style={{ fontSize: 9, color: C.sub, margin: 0, letterSpacing: '0.04em' }}>VIEWS</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 16, fontWeight: 900, color: 'var(--v-success)', margin: 0 }}>{deal.match_count ?? 0}</p>
                  <p style={{ fontSize: 9, color: C.sub, margin: 0, letterSpacing: '0.04em' }}>MATCHES</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 16, fontWeight: 900, color: C.muted, margin: 0 }}>
                    {deal.view_count && deal.match_count ? Math.round((deal.match_count / deal.view_count) * 100) : 0}%
                  </p>
                  <p style={{ fontSize: 9, color: C.sub, margin: 0, letterSpacing: '0.04em' }}>RATE</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Private feedback card */}
      <div style={{ background: C.card, border: '1.5px solid var(--v-danger)', borderRadius: 14, padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--v-danger)" strokeWidth={2} strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <p style={{ fontSize: 11, fontWeight: 900, color: 'var(--v-danger)', letterSpacing: '0.05em', margin: 0 }}>PRIVATE FEEDBACK</p>
        </div>
        <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: '0 0 4px' }}>
          {totalPasses} investor{totalPasses !== 1 ? 's' : ''} passed on your deals
        </p>
        <p style={{ fontSize: 11, color: C.muted, margin: 0, lineHeight: 1.5 }}>
          Feedback is anonymous and private to you. Use it to strengthen your pitch.
        </p>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DealsPage() {
  const supabase = createClient();
  const [deals, setDeals]           = useState<Deal[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [feedback, setFeedback]     = useState<string | null>(null);
  const [matched, setMatched]       = useState<Deal | null>(null);
  const [empty, setEmpty]           = useState(false);
  const [userId, setUserId]         = useState('');
  const [tab, setTab]               = useState<'feed'|'mine'>('feed');
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters]       = useState<DealFilters>({ industry: 'All', dealType: 'All', minInvestment: 'Any', geography: 'All' });

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);

      const { data } = await (supabase as unknown as { from: (t: string) => { select: (c: string) => { eq: (k: string, v: string) => { order: (k: string, o: object) => { limit: (n: number) => Promise<{ data: Deal[] | null }> } } } } })
        .from('investor_deals').select('*,profiles(username,display_name)').eq('status','active').order('created_at',{ascending:false}).limit(20);
      setDeals(data ?? []);
    })();
  }, []);

  // Apply filters
  const filteredDeals = deals.filter(d => {
    if (filters.industry !== 'All' && d.industry !== filters.industry) return false;
    if (filters.dealType !== 'All' && d.deal_type !== filters.dealType) return false;
    if (filters.minInvestment !== 'Any') {
      const min = parseInt(filters.minInvestment.replace(/[^0-9]/g,'')) * 1000;
      if (d.raise_amount < min) return false;
    }
    return true;
  });

  const remaining = filteredDeals.slice(currentIdx);

  async function handleSwipe(dir: 'match'|'pass') {
    const deal = remaining[0];
    if (!deal) return;

    if (dir === 'match') {
      setMatched(deal);
      if (userId) {
        await (supabase as unknown as { from: (t: string) => { insert: (d: unknown) => Promise<unknown> } }).from('deal_swipes').insert({ deal_id: deal.id, investor_id: userId, direction: 'match' }).catch(() => {});
      }
      setTimeout(() => setMatched(null), 2000);
    } else {
      setFeedback(deal.id);
    }
    setCurrentIdx(i => i + 1);
    if (currentIdx + 1 >= filteredDeals.length) setEmpty(true);
  }

  const hasActiveFilters = filters.industry !== 'All' || filters.dealType !== 'All' || filters.minInvestment !== 'Any' || filters.geography !== 'All';

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', background: C.card, borderBottom: `1px solid ${C.border}` }}>
        <Link href="/village/trading-post" style={{ color: C.brand, fontWeight: 800, fontSize: 14, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
          Post
        </Link>
        <p style={{ flex: 1, textAlign: 'center', fontSize: 17, fontWeight: 900, color: C.text }}>Deals</p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Filter icon — only visible on feed tab */}
          {tab === 'feed' && (
            <button onClick={() => setShowFilter(true)} style={{ position: 'relative', width: 36, height: 36, borderRadius: 18, background: hasActiveFilters ? 'var(--v-brand-light)' : 'var(--v-bg-2)', border: `1px solid ${hasActiveFilters ? 'var(--v-brand)' : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={hasActiveFilters ? 'var(--v-brand)' : C.muted} strokeWidth={2} strokeLinecap="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
              {hasActiveFilters && <span style={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: 4, background: 'var(--v-brand)' }} />}
            </button>
          )}
          <Link href="/village/trading-post/deals/create" style={{ fontSize: 12, fontWeight: 900, color: 'var(--v-brand)', textDecoration: 'none', background: 'var(--v-brand-light)', borderRadius: 20, padding: '6px 14px' }}>
            + List
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: C.card, borderBottom: `1px solid ${C.border}` }}>
        {(['feed','mine'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ flex: 1, padding: '12px 0', background: 'transparent', border: 'none', borderBottom: tab === t ? '2px solid var(--v-brand)' : '2px solid transparent', color: tab === t ? C.brand : C.muted, fontSize: 13, fontWeight: tab === t ? 900 : 600, cursor: 'pointer', letterSpacing: '0.01em', transition: 'color 0.15s' }}>
            {t === 'feed' ? 'Deal Feed' : 'My Deals'}
          </button>
        ))}
      </div>

      {/* Feed tab content */}
      {tab === 'feed' && (
        <>
          {/* Swipe hints */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 20px', background: C.card }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--v-danger)" strokeWidth={2.5} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              <span style={{ fontSize: 11, color: 'var(--v-danger)', fontWeight: 700 }}>Swipe left to pass</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--v-success)', fontWeight: 700 }}>Swipe right to match</span>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--v-success)" strokeWidth={2.5} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          </div>

          {/* Card stack */}
          <div style={{ flex: 1, position: 'relative', padding: '16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
            {empty || remaining.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: C.muted }}>
                <p style={{ fontSize: 40, marginBottom: 12 }}>🎯</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 8 }}>
                  {hasActiveFilters ? 'No deals match your filters' : deals.length === 0 ? 'No deals yet' : 'You reviewed all current deals'}
                </p>
                <p style={{ fontSize: 12, lineHeight: 1.6, marginBottom: 20 }}>
                  {hasActiveFilters ? 'Try adjusting your filters to see more deals.' : deals.length === 0 ? 'Be the first to list an investment opportunity in the Village.' : 'Check back soon — new deals are added daily.'}
                </p>
                {hasActiveFilters ? (
                  <button onClick={() => { setFilters({ industry:'All', dealType:'All', minInvestment:'Any', geography:'All' }); setCurrentIdx(0); setEmpty(false); }}
                    style={{ display: 'inline-block', background: 'var(--v-brand)', color: '#fff', borderRadius: 20, padding: '12px 28px', fontSize: 13, fontWeight: 900, border: 'none', cursor: 'pointer' }}>
                    Clear Filters
                  </button>
                ) : (
                  <Link href="/village/trading-post/deals/create" style={{ display: 'inline-block', background: 'var(--v-brand)', color: '#fff', borderRadius: 20, padding: '12px 28px', fontSize: 13, fontWeight: 900, textDecoration: 'none' }}>
                    List a Deal
                  </Link>
                )}
              </div>
            ) : (
              <div style={{ position: 'relative', width: '100%', maxWidth: 440, height: 490 }}>
                {remaining.slice(0, 3).reverse().map((deal, i) => {
                  const isTop = i === remaining.slice(0, 3).length - 1;
                  const offset = (remaining.slice(0, 3).length - 1 - i) * 8;
                  return (
                    <div key={deal.id} style={{ position: 'absolute', width: '100%', top: offset, transform: `scale(${1 - (remaining.slice(0,3).length - 1 - i) * 0.03})` }}>
                      <SwipeCard deal={deal} onSwipe={handleSwipe} isTop={isTop} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Deal counter */}
          {!empty && remaining.length > 0 && (
            <div style={{ textAlign: 'center', padding: '8px', color: C.sub, fontSize: 12 }}>
              {currentIdx + 1} of {filteredDeals.length} deals
              {hasActiveFilters && <span style={{ color: C.brand, fontWeight: 700 }}> (filtered)</span>}
            </div>
          )}
        </>
      )}

      {/* My Deals tab content */}
      {tab === 'mine' && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <MyDealsTab userId={userId} />
        </div>
      )}

      {/* Match overlay */}
      <AnimatePresence>
        {matched && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
            style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(29,158,117,0.15)', backdropFilter: 'blur(4px)' }}>
            <div style={{ background: C.card, borderRadius: 24, padding: '40px 32px', textAlign: 'center', border: '2px solid var(--v-success)' }}>
              <p style={{ fontSize: 48, marginBottom: 8 }}>🤝</p>
              <p style={{ fontSize: 22, fontWeight: 900, color: 'var(--v-success)' }}>It's a Match!</p>
              <p style={{ fontSize: 13, color: C.muted, marginTop: 8 }}>{matched.name}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback modal */}
      <AnimatePresence>
        {feedback && <FeedbackModal dealId={feedback} onClose={() => setFeedback(null)} />}
      </AnimatePresence>

      {/* Filter sheet */}
      <AnimatePresence>
        {showFilter && (
          <FilterSheet
            filters={filters}
            onApply={(f) => { setFilters(f); setCurrentIdx(0); setEmpty(false); }}
            onClose={() => setShowFilter(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
