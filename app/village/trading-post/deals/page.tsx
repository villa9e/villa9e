'use client';
import { useState, useEffect, useRef } from 'react';
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
  profiles?: { username: string; display_name: string };
}

// ── Mock deals for when DB is empty ──────────────────────────────────────────
const MOCK_DEALS: Deal[] = [
  { id: 'm1', name: 'Meridian Solar Grid', hook: 'First solar microgrid network serving underbanked rural communities — 10,000 homes, 12% projected IRR.', industry: 'Energy', deal_type: 'Equity', seeking: 'LP', raise_amount: 2500000, deal_length: '7 years', elevator_pitch: 'We deploy modular solar microgrids in rural markets where utility infrastructure is absent or unreliable. Each grid serves 200–400 homes, operates on a subscription model, and is managed by local co-op operators we train and certify. We have 3 operating sites with 18-month positive cash flow history.', view_count: 312, match_count: 14, profiles: { username: 'solargrid', display_name: 'Marcus B.' } },
  { id: 'm2', name: 'Nara Health Platform', hook: 'AI-powered preventive care for underserved communities. $4B TAM, 22% month-over-month growth.', industry: 'Healthcare', deal_type: 'Convertible Note', seeking: 'Accredited', raise_amount: 750000, deal_length: '18 months', elevator_pitch: 'Nara pairs community health workers with an AI triage platform to catch chronic disease early in communities that rarely see a primary care physician. We reduce ER visits by 38% per enrolled member and generate $280 PMPM in value-based care contracts.', view_count: 188, match_count: 9, profiles: { username: 'narahealth', display_name: 'Dr. Aisha T.' } },
  { id: 'm3', name: 'FleetOps Logistics', hook: 'SaaS for independent truckers — $40B fragmented market, $180 MRR per truck, 94% retention.', industry: 'Technology', deal_type: 'Revenue Share', seeking: 'Family Office', raise_amount: 1200000, deal_length: '5 years', elevator_pitch: 'FleetOps gives independent owner-operators the dispatch, compliance, and invoicing tools that used to require a fleet manager. 2,200 active trucks. We take 2.5% of invoiced revenue. Net revenue retention is 118%.', view_count: 241, match_count: 6, profiles: { username: 'fleetops', display_name: 'Jordan C.' } },
];

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

// ── Swipe Card Component ──────────────────────────────────────────────────────
function SwipeCard({ deal, onSwipe, isTop }: { deal: Deal; onSwipe: (dir: 'match'|'pass') => void; isTop: boolean }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-18, 18]);
  const matchOpacity = useTransform(x, [30, 100], [0, 1]);
  const passOpacity  = useTransform(x, [-100, -30], [1, 0]);
  const controls = useAnimation();

  async function handleDragEnd(_: any, info: any) {
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

  const fmt = (n: number) => n >= 1000000 ? `$${(n/1000000).toFixed(1)}M` : `$${(n/1000).toFixed(0)}K`;

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
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>{deal.hook}</p>
          </div>
        </div>

        {/* Snapshot row */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}` }}>
          {[
            { label: 'Industry',     value: deal.industry },
            { label: 'Type',         value: deal.deal_type },
            { label: 'Raise',        value: fmt(deal.raise_amount) },
            { label: 'Horizon',      value: deal.deal_length },
            { label: 'Seeking',      value: deal.seeking },
          ].map((item, i, arr) => (
            <div key={item.label} style={{ flex: 1, padding: '10px 8px', textAlign: 'center', borderRight: i < arr.length - 1 ? `1px solid ${C.border}` : 'none' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: C.text, marginBottom: 2 }}>{item.value}</p>
              <p style={{ fontSize: 9, color: C.sub, letterSpacing: '0.04em' }}>{item.label.toUpperCase()}</p>
            </div>
          ))}
        </div>

        {/* Pitch */}
        <div style={{ padding: '14px 16px' }}>
          <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {deal.elevator_pitch}
          </p>
          <p style={{ fontSize: 11, color: C.brand, fontWeight: 700, marginTop: 6 }}>Read more →</p>
        </div>

        {/* Action buttons */}
        {isTop && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, padding: '14px 16px 18px' }}>
            <button onClick={() => tap('pass')} style={{ width: 52, height: 52, borderRadius: 26, background: 'var(--v-danger-light)', border: '2px solid var(--v-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 22 }}>✕</button>
            <button style={{ width: 44, height: 44, borderRadius: 22, background: 'var(--v-brand-light)', border: '2px solid var(--v-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16 }}>ℹ</button>
            <button onClick={() => tap('match')} style={{ width: 52, height: 52, borderRadius: 26, background: 'var(--v-success-light)', border: '2px solid var(--v-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 22 }}>✓</button>
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
    await (supabase as any).from('deal_feedback').insert({
      deal_id: dealId,
      hashed_user_id: Math.random().toString(36).slice(2),
      rating,
      reason,
      comment,
    });
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

            {/* Star rating */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, justifyContent: 'center' }}>
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setRating(s)} style={{ fontSize: 28, background: 'none', border: 'none', cursor: 'pointer', opacity: s <= rating ? 1 : 0.3 }}>★</button>
              ))}
            </div>

            {/* Reason pills */}
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

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DealsPage() {
  const supabase = createClient();
  const [deals, setDeals]         = useState<Deal[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [feedback, setFeedback]   = useState<string | null>(null);
  const [matched, setMatched]     = useState<Deal | null>(null);
  const [empty, setEmpty]         = useState(false);
  const [userId, setUserId]       = useState('');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);

      const { data } = await (supabase as any).from('deals').select('*,profiles(username,display_name)').eq('status','active').order('created_at',{ascending:false}).limit(20);
      if (data && data.length > 0) setDeals(data);
      else setDeals(MOCK_DEALS);
    })();
  }, []);

  const remaining = deals.slice(currentIdx);

  async function handleSwipe(dir: 'match'|'pass') {
    const deal = remaining[0];
    if (!deal) return;

    if (dir === 'match') {
      setMatched(deal);
      if (userId && !deal.id.startsWith('m')) {
        await (supabase as any).from('deal_swipes').insert({ deal_id: deal.id, investor_id: userId, direction: 'match' }).catch(() => {});
        await (supabase as any).from('deal_matches').insert({ deal_id: deal.id, investor_id: userId, creator_id: deal.profiles ? userId : userId }).catch(() => {});
      }
      setTimeout(() => setMatched(null), 2000);
    } else {
      setFeedback(deal.id);
    }
    setCurrentIdx(i => i + 1);
    if (currentIdx + 1 >= deals.length) setEmpty(true);
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', background: C.card, borderBottom: `1px solid ${C.border}` }}>
        <Link href="/village/trading-post" style={{ color: C.brand, fontWeight: 800, fontSize: 14, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
          Post
        </Link>
        <p style={{ flex: 1, textAlign: 'center', fontSize: 17, fontWeight: 900, color: C.text }}>Deals</p>
        <Link href="/village/trading-post/deals/create" style={{ fontSize: 12, fontWeight: 900, color: 'var(--v-brand)', textDecoration: 'none', background: 'var(--v-brand-light)', borderRadius: 20, padding: '6px 14px' }}>
          + List
        </Link>
      </div>

      {/* Swipe hints */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 20px', background: C.card }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 16 }}>✕</span>
          <span style={{ fontSize: 11, color: 'var(--v-danger)', fontWeight: 700 }}>Swipe left to pass</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--v-success)', fontWeight: 700 }}>Swipe right to match</span>
          <span style={{ fontSize: 16 }}>✓</span>
        </div>
      </div>

      {/* Card stack */}
      <div style={{ flex: 1, position: 'relative', padding: '16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
        {empty || remaining.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: C.muted }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>🎯</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 8 }}>You reviewed all current deals</p>
            <p style={{ fontSize: 12, lineHeight: 1.6, marginBottom: 20 }}>Check back soon — new deals are added daily. Or list your own deal.</p>
            <Link href="/village/trading-post/deals/create" style={{ display: 'inline-block', background: 'var(--v-brand)', color: '#fff', borderRadius: 20, padding: '12px 28px', fontSize: 13, fontWeight: 900, textDecoration: 'none' }}>
              List a Deal
            </Link>
          </div>
        ) : (
          <div style={{ position: 'relative', width: '100%', maxWidth: 440, height: 480 }}>
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
          {currentIdx + 1} of {deals.length} deals
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
    </div>
  );
}
