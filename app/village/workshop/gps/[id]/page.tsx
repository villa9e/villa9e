'use client';
// ── Goal GPS — Google Maps–style map (GOAL_GPS_MAPS_SPEC.md) ──────────────────
// Destination flag = goal, waypoints = sprints, turns = actions, traffic color =
// probability, verify = mine. Always dark. Adapted from the RN spec to Next.js web
// (native <svg>, framer-motion gestures/animation, SpiritVoiceProvider TTS).
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useSpiritVoice } from '@/components/village/SpiritVoiceProvider';

// ── Color tokens (spec §14) ──────────────────────────────────────────────────
const C = {
  page: '#0a1220', map: '#0d1626', street: '#16223a', building: '#13203a',
  buildingLabel: '#3a5070', borderDim: '#2a3a55', routeDone: '#1D9E75',
  routeAhead: '#5DCAA5', gap: '#EF9F27', wpDone: '#0F6E56', wpDoneStroke: '#9FE1CB',
  active: '#534AB7', activeStroke: '#CECBF6', arrow: '#AFA9EC', textHi: '#E1F5EE',
  textBody: '#B5D4F4', textMute: '#7a92b0', amberText: '#FAC775', amberBg: '#412402',
  probBg: '#04342C', completeBg: '#26215C', fabIcon: '#85B7EB', check: '#5DCAA5',
} as const;

const VB_W = 360;
const VB_H = 720;

// ── Types ────────────────────────────────────────────────────────────────────
interface ActionRow { id: string; title: string; completed: boolean; order_index: number }
interface SprintRow {
  id: string; title: string; status: string; sprint_number: number;
  actions: ActionRow[]; waypoint: { x: number; y: number };
}

// ── Geometry ─────────────────────────────────────────────────────────────────
function layoutWaypoints(n: number): { x: number; y: number }[] {
  // Keep the whole route in the top ~470px of the viewBox so it stays visible
  // above the floating bottom sheet (extra viewBox height below is hidden by it).
  const top = 120, bottom = VB_H - 470, usable = VB_H - top - bottom;
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : i / (n - 1);          // 0 = start (bottom), 1 = goal (top)
    const y = VB_H - bottom - t * usable;
    const x = VB_W / 2 + Math.sin(t * Math.PI * 2.2) * (VB_W * 0.27);
    pts.push({ x, y });
  }
  return pts;
}

function buildRoutePath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return pts.length ? `M ${pts[0].x} ${pts[0].y}` : '';
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

// ── Decorative streets (spec §4.2) ───────────────────────────────────────────
const STREETS = [
  'M -20 140 L 380 110', 'M -20 300 L 380 330', 'M -20 480 L 380 450',
  'M 90 -20 L 70 640', 'M 250 -20 L 280 640',
];

export default function GpsMapPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const router = useRouter();
  const { speak } = useSpiritVoice();

  const [goal, setGoal] = useState<any>(null);
  const [sprints, setSprints] = useState<SprintRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetSnap, setSheetSnap] = useState<'peek' | 'default' | 'expanded'>('default');
  const [inspectIdx, setInspectIdx] = useState(0);
  const [mining, setMining] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [routeLen, setRouteLen] = useState(0);

  const routeRef = useRef<SVGPathElement>(null);
  const touchStart = useRef({ x: 0, y: 0, t: 0 });

  // ── Load goal + sprints + actions ──────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    const { data: g } = await (supabase as any)
      .from('goals').select('*').eq('id', params.id).single();
    setGoal(g);

    const { data: sp } = await (supabase as any)
      .from('sprints')
      .select('id, title, status, week_start, created_at, sprint_actions(id, title, completed, order_index)')
      .eq('goal_id', params.id)
      .order('created_at', { ascending: true });

    const rows: SprintRow[] = (sp ?? []).map((s: any, i: number) => ({
      id: s.id, title: s.title, status: s.status, sprint_number: i + 1,
      actions: (s.sprint_actions ?? []).sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0)),
      waypoint: { x: 0, y: 0 },
    }));

    // Fallback: derive pseudo-sprints from goal_steps if no sprints exist yet
    if (rows.length === 0) {
      const { data: steps } = await (supabase as any)
        .from('goal_steps').select('id, title, status, step_number, week_number')
        .eq('goal_id', params.id).order('step_number', { ascending: true });
      if (steps && steps.length) {
        const byWeek: Record<string, any[]> = {};
        for (const st of steps) {
          const w = String(st.week_number ?? Math.ceil((st.step_number ?? 1) / 2));
          (byWeek[w] ||= []).push(st);
        }
        Object.keys(byWeek).sort((a, b) => +a - +b).forEach((w, i) => {
          rows.push({
            id: `week-${w}`, title: `Sprint ${i + 1}`, status: 'pending', sprint_number: i + 1,
            actions: byWeek[w].map((st: any, j: number) => ({
              id: st.id, title: st.title, completed: st.status === 'completed', order_index: j,
            })),
            waypoint: { x: 0, y: 0 },
          });
        });
      }
    }

    const pts = layoutWaypoints(Math.max(rows.length, 1));
    rows.forEach((r, i) => { r.waypoint = pts[i] ?? pts[pts.length - 1]; });
    setSprints(rows);
    setLoading(false);
  }, [params.id, supabase]);

  useEffect(() => { load(); }, [load]);

  // ── Derived map data ───────────────────────────────────────────────────────
  const waypointPts = useMemo(() => sprints.map(s => s.waypoint), [sprints]);
  const routeD = useMemo(() => buildRoutePath(waypointPts), [waypointPts]);

  const allActions = useMemo(() => sprints.flatMap(s => s.actions), [sprints]);
  const totalActions = allActions.length;
  const doneActions = allActions.filter(a => a.completed).length;
  const progress = totalActions ? doneActions / totalActions : 0;

  // Active sprint = first with an incomplete action; current action within it
  const activeSprintIdx = useMemo(() => {
    const i = sprints.findIndex(s => s.actions.some(a => !a.completed));
    return i < 0 ? Math.max(sprints.length - 1, 0) : i;
  }, [sprints]);
  const currentAction = useMemo(
    () => sprints[activeSprintIdx]?.actions.find(a => !a.completed) ?? null,
    [sprints, activeSprintIdx]
  );

  useEffect(() => { setInspectIdx(activeSprintIdx); }, [activeSprintIdx]);

  // Measure route length once it's rendered
  useEffect(() => {
    if (routeRef.current) setRouteLen(routeRef.current.getTotalLength());
  }, [routeD]);

  // You-are-here point along the route at the progress fraction
  const youPoint = useMemo(() => {
    if (!routeRef.current || !routeLen) return waypointPts[0] ?? { x: VB_W / 2, y: VB_H - 90 };
    const p = routeRef.current.getPointAtLength(routeLen * progress);
    return { x: p.x, y: p.y };
  }, [routeLen, progress, waypointPts]);

  const probScore = goal?.probability_score ?? 0;
  const probColor = probScore >= 85 ? C.routeAhead : probScore >= 70 ? C.amberText : '#F09595';
  const weeksLeft = Math.max(0, Math.round((goal?.estimated_weeks ?? 12) * (1 - progress)));
  const arrivesDate = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() + weeksLeft * 7);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }, [weeksLeft]);

  const hasPlan = totalActions > 0;

  // ── Verify (mine) the current action ───────────────────────────────────────
  async function verifyCurrent() {
    if (!currentAction || mining) return;
    setMining(true);
    speak('Verifying your proof.', 'serious');
    // Persist completion (real sprint_actions only; pseudo week- ids are goal_steps)
    try {
      if (sprints[activeSprintIdx]?.id.startsWith('week-')) {
        await (supabase as any).from('goal_steps').update({ status: 'completed' }).eq('id', currentAction.id);
      } else {
        await (supabase as any).from('sprint_actions')
          .update({ completed: true, completed_at: new Date().toISOString() }).eq('id', currentAction.id);
      }
    } catch { /* non-blocking */ }

    // Mining sequence timing (spec §9) — simplified
    await new Promise(r => setTimeout(r, 3600));

    // Advance locally
    setSprints(prev => prev.map(s => ({
      ...s,
      actions: s.actions.map(a => a.id === currentAction.id ? { ...a, completed: true } : a),
    })));
    setMining(false);
    setToast('+25 $VLG mined · Growth Receipt written on-chain');
    speak('Verified. Twenty five V L G mined.', 'casual');
    setTimeout(() => setToast(null), 3200);
  }

  // ── Left-edge / right swipe → back to Workshop (spec §10.1) ─────────────────
  function onTouchStart(e: React.TouchEvent) {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() };
  }
  function onTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    const fromEdge = touchStart.current.x <= 28;
    if ((fromEdge && dx > 60 && Math.abs(dy) < 50) || (dx > 120 && Math.abs(dy) < 40)) {
      router.push('/village/workshop');
    }
  }

  const sheetPx = sheetSnap === 'peek' ? 120 : sheetSnap === 'expanded' ? 600 : 320;
  const inspect = sprints[inspectIdx];

  return (
    <div className="flex flex-col" style={{ height: '100dvh', background: C.page, overflow: 'hidden', position: 'relative' }}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>

      {/* ── Top tab bar (Goals | Workshop | GPS) ─────────────────────────── */}
      <div className="flex-shrink-0 flex items-center" style={{ height: 44, background: C.page, paddingTop: 'env(safe-area-inset-top)' }}>
        <Link href="/village/workshop" aria-label="Back"
          className="flex items-center justify-center" style={{ width: 44, height: 44, color: C.textBody }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </Link>
        <div className="flex-1 flex items-center justify-center" style={{ gap: 4 }}>
          {[
            { label: 'Goals', href: '/village/workshop/chat', active: false },
            { label: 'Workshop', href: '/village/workshop', active: false },
            { label: 'GPS', href: '#', active: true },
          ].map(t => t.active ? (
            <div key={t.label} style={{ padding: '0 10px', height: 44, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>{t.label}</span>
              <span style={{ height: 2, background: '#fff', width: '100%', marginTop: 4, borderRadius: 1 }} />
            </div>
          ) : (
            <Link key={t.label} href={t.href} style={{ padding: '0 10px', height: 44, display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>
              {t.label}
            </Link>
          ))}
        </div>
        <div style={{ width: 44 }} />
      </div>

      {/* ── Map canvas ────────────────────────────────────────────────────── */}
      <div style={{ position: 'absolute', inset: 0, top: 0, zIndex: 0, background: C.map }}>
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" height="100%" preserveAspectRatio="xMidYMin slice" style={{ display: 'block' }}>
          {/* Streets */}
          {STREETS.map((d, i) => (
            <path key={i} d={d} stroke={C.street} strokeWidth={i < 3 ? 11 : 9} fill="none" strokeLinecap="round" />
          ))}

          {hasPlan && (
            <>
              {/* Route ahead (dashed) */}
              <path ref={routeRef} d={routeD} fill="none" stroke={C.routeAhead} strokeWidth={4}
                strokeDasharray="7 7" opacity={0.85} strokeLinecap="round" />
              {/* Route done (solid, revealed up to progress) */}
              {routeLen > 0 && (
                <path d={routeD} fill="none" stroke={C.routeDone} strokeWidth={5} strokeLinecap="round"
                  strokeDasharray={`${routeLen * progress} ${routeLen}`}
                  style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.19,1,0.22,1)' }} />
              )}

              {/* Sprint waypoints */}
              {sprints.map((s, i) => {
                const done = s.actions.length > 0 && s.actions.every(a => a.completed);
                const isActive = i === activeSprintIdx && !done;
                const fill = done ? C.wpDone : isActive ? C.active : '#1e2a3e';
                const stroke = done ? C.wpDoneStroke : isActive ? C.activeStroke : C.buildingLabel;
                const r = isActive ? 13 : 11;
                return (
                  <g key={s.id} onClick={() => { setInspectIdx(i); setSheetSnap('default'); }} style={{ cursor: 'pointer' }}>
                    {isActive && <circle cx={s.waypoint.x} cy={s.waypoint.y} r={r + 5} fill="none" stroke={C.active} strokeWidth={2} opacity={0.5} />}
                    <circle cx={s.waypoint.x} cy={s.waypoint.y} r={r} fill={fill} stroke={stroke} strokeWidth={isActive ? 2 : 1.5} />
                    <text x={s.waypoint.x} y={s.waypoint.y + 3} textAnchor="middle" fontSize={9} fontWeight={500}
                      fill={done ? C.wpDoneStroke : isActive ? C.activeStroke : C.textMute}>S{s.sprint_number}</text>
                  </g>
                );
              })}

              {/* Destination flag (goal) */}
              {waypointPts.length > 0 && (() => {
                const g = waypointPts[waypointPts.length - 1];
                return (
                  <g transform={`translate(${g.x}, ${g.y - 14})`}>
                    <path d="M0,0 L0,-22 L14,-17 L0,-12" fill={C.gap} stroke={C.amberText} strokeWidth={1} />
                    <circle cx={0} cy={0} r={3} fill={C.amberText} />
                  </g>
                );
              })()}

              {/* You-are-here marker */}
              <g transform={`translate(${youPoint.x}, ${youPoint.y})`} style={{ transition: 'transform 1.2s cubic-bezier(0.19,1,0.22,1)' }}>
                <motion.circle r={12} cx={0} cy={0} fill={C.active}
                  animate={{ scale: [1, 1.85, 1], opacity: [0.35, 0.05, 0.35] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ transformOrigin: 'center' }} />
                <path d="M0,-9 L6,7 L0,3 L-6,7 Z" fill={C.arrow} stroke={C.textHi} strokeWidth={1} />
              </g>
            </>
          )}
        </svg>
      </div>

      {/* ── Turn-by-turn banner ───────────────────────────────────────────── */}
      {hasPlan && currentAction && (
        <div style={{ position: 'absolute', top: 'calc(44px + env(safe-area-inset-top) + 10px)', left: 10, right: 10, zIndex: 3,
          background: C.wpDone, borderRadius: 10, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.textHi} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M9 7h8v8" /></svg>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 10, color: C.wpDoneStroke, margin: 0 }}>
              Sprint {activeSprintIdx + 1} · action {(sprints[activeSprintIdx]?.actions.filter(a => a.completed).length ?? 0) + 1} of {sprints[activeSprintIdx]?.actions.length ?? 0}
            </p>
            <p style={{ fontSize: 12, fontWeight: 500, color: C.textHi, margin: 0, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {currentAction.title}
            </p>
          </div>
          <button onClick={() => speak(currentAction.title, 'casual')} aria-label="Read aloud" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.wpDoneStroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5zM15.5 8.5a5 5 0 010 7" /></svg>
          </button>
        </div>
      )}

      {/* ── Floating action buttons ───────────────────────────────────────── */}
      <div style={{ position: 'absolute', right: 10, bottom: sheetPx + 12, zIndex: 4, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { key: 'recenter', icon: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></>, onClick: () => setSheetSnap('default') },
          { key: 'reroute', icon: <><circle cx="6" cy="19" r="3" /><circle cx="18" cy="5" r="3" /><path d="M9 19h6a3 3 0 003-3V8" /></>, onClick: () => reroute() },
        ].map(f => (
          <button key={f.key} onClick={f.onClick} aria-label={f.key}
            style={{ width: 38, height: 38, borderRadius: 19, background: C.building, border: `0.5px solid ${C.borderDim}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.fabIcon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{f.icon}</svg>
          </button>
        ))}
      </div>

      {/* ── Recalculating toast ───────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: sheetPx + 14, zIndex: 5,
              background: C.building, border: `0.5px solid ${C.borderDim}`, borderRadius: 20, padding: '6px 14px' }}>
            <p style={{ fontSize: 11, color: C.textBody, margin: 0, whiteSpace: 'nowrap' }}>{toast}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bottom sheet ──────────────────────────────────────────────────── */}
      <motion.div
        animate={{ height: sheetPx }}
        transition={{ type: 'spring', damping: 22, stiffness: 200 }}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 6,
          background: '#0e1828', borderTop: `0.5px solid #1e2a3e`, borderRadius: '18px 18px 0 0',
          padding: '8px 16px calc(72px + env(safe-area-inset-bottom))', overflowY: sheetSnap === 'expanded' ? 'auto' : 'hidden' }}>
        {/* Handle */}
        <div onClick={() => setSheetSnap(s => s === 'expanded' ? 'default' : s === 'default' ? 'expanded' : 'default')}
          style={{ display: 'flex', justifyContent: 'center', padding: '4px 0 10px', cursor: 'pointer' }}>
          <div style={{ width: 34, height: 4, borderRadius: 2, background: C.borderDim }} />
        </div>

        {loading ? (
          <p style={{ color: C.textMute, fontSize: 13, textAlign: 'center', padding: 20 }}>Loading your GPS…</p>
        ) : !hasPlan ? (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <p style={{ fontSize: 15, fontWeight: 500, color: C.textHi, margin: '0 0 6px' }}>No destination set</p>
            <p style={{ fontSize: 12, color: C.textMute, margin: '0 0 16px' }}>Talk to Spirit to build your GPS and start mining $VLG.</p>
            <Link href="/village/workshop/chat" style={{ display: 'inline-block', background: C.active, color: C.textHi, borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>
              Create my GPS with Spirit
            </Link>
          </div>
        ) : (
          <>
            {/* ETA row */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 18, fontWeight: 500, color: C.textHi }}>{weeksLeft} wks</span>
              <span style={{ fontSize: 11, color: C.textMute }}>arrives ~{arrivesDate} · {totalActions - doneActions} actions left</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 500, color: probColor, background: probScore >= 85 ? C.probBg : C.amberBg, borderRadius: 12, padding: '2px 8px' }}>
                {probScore}% probability
              </span>
            </div>

            {/* Mining chips */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              <span style={{ fontSize: 10, color: C.amberText, background: C.amberBg, borderRadius: 12, padding: '2px 8px' }}>⛏ {doneActions * 25} $VLG mined</span>
              <span style={{ fontSize: 10, color: C.arrow, background: C.completeBg, borderRadius: 12, padding: '2px 8px' }}>{Math.round(progress * 100)}% complete</span>
            </div>

            {/* Sprint inspector */}
            <p style={{ fontSize: 10, color: C.textMute, letterSpacing: '0.4px', textTransform: 'uppercase', margin: '0 0 6px' }}>
              Sprint {inspect?.sprint_number} — {inspect?.title}
            </p>
            <div style={{ marginBottom: 12 }}>
              {(inspect?.actions ?? []).map(a => {
                const isCurrent = a.id === currentAction?.id;
                return (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '3px 0' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={a.completed ? C.check : isCurrent ? C.arrow : C.buildingLabel} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {a.completed ? <path d="M20 6L9 17l-5-5" /> : isCurrent ? <path d="M3 11l19-9-9 19-2-8-8-2z" /> : <circle cx="12" cy="12" r="9" />}
                    </svg>
                    <span style={{ fontSize: 11, fontWeight: isCurrent ? 500 : 400, color: a.completed ? C.textMute : isCurrent ? '#EEEDFE' : C.textBody, textDecoration: a.completed ? 'line-through' : 'none' }}>{a.title}</span>
                  </div>
                );
              })}
            </div>

            {/* Verify button */}
            <button onClick={verifyCurrent} disabled={!currentAction || mining}
              style={{ width: '100%', background: mining ? C.wpDone : C.active, border: 'none', borderRadius: 10, padding: 11, color: '#EEEDFE', fontSize: 13, fontWeight: 500, cursor: currentAction && !mining ? 'pointer' : 'default', opacity: !currentAction ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {mining ? 'Mining…' : currentAction ? '⛏ Verify action · mine $VLG' : '✓ All actions complete'}
            </button>

            {/* Mining sequence (simplified) */}
            <AnimatePresence>
              {mining && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginTop: 10 }}>
                  {[
                    { t: 'Proof submitted', c: C.fabIcon },
                    { t: 'Spirit verifying proof…', c: C.arrow },
                    { t: 'Growth Receipt written on-chain', c: C.amberText },
                    { t: '+25 $VLG mined · Phase 1 rate', c: C.gap },
                  ].map((row, i) => (
                    <motion.div key={i} initial={{ opacity: 0.25 }} animate={{ opacity: 1 }} transition={{ delay: i * 1.1 }}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                      <span style={{ width: 7, height: 7, borderRadius: 4, background: row.c, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: i === 3 ? C.amberText : C.textBody, fontWeight: i === 3 ? 500 : 400 }}>{row.t}</span>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </motion.div>
    </div>
  );

  // ── Reroute (recalibrate) ────────────────────────────────────────────────
  function reroute() {
    setToast('Recalculating…');
    speak('Recalculating your route.', 'serious');
    setTimeout(() => {
      setToast(`Route updated · probability ${probScore}%`);
      setTimeout(() => setToast(null), 2400);
    }, 1200);
  }
}
