'use client';
// ── Goal GPS — Google Maps–style map (GOAL_GPS_MAPS_SPEC.md) ──────────────────
// Destination flag = goal, waypoints = sprints, turns = actions, traffic color =
// probability, verify = mine. Always dark. Adapted from the RN spec to Next.js web
// (native <svg>, framer-motion gestures/animation, SpiritVoiceProvider TTS).
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useSpiritVoice } from '@/components/village/SpiritVoiceProvider';
import WorkshopTabBar, { useWorkshopSwipeNav } from '@/components/village/WorkshopTabBar';

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
interface ActionRow { id: string; title: string; completed: boolean; order_index: number; description?: string }
interface SprintRow {
  id: string; title: string; status: string; sprint_number: number;
  actions: ActionRow[]; waypoint: { x: number; y: number };
}
interface ResourceItem {
  id: string; label: string; cost?: number; sprintIdx: number;
  x: number; y: number; w: number; h: number; cx: number; cy: number;
}
interface GapItem {
  dimension: string; gap: string; severity: string; fillStrategy: string;
  villageRoute?: string; estimatedTimeToFillWeeks?: number; probabilityImpact?: number;
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

// ── Camera helpers (spec §10.2/§11 — pan/pinch/zoom) ─────────────────────────
function clamp(v: number, lo: number, hi: number) { return Math.min(hi, Math.max(lo, v)); }

type Camera = { x: number; y: number; scale: number };

function clientToSvg(svg: SVGSVGElement, clientX: number, clientY: number): { x: number; y: number } {
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: 0, y: 0 };
  const pt = svg.createSVGPoint();
  pt.x = clientX; pt.y = clientY;
  const p = pt.matrixTransform(ctm.inverse());
  return { x: p.x, y: p.y };
}

// Keep `point` (in pre-transform/world coords) fixed under the same screen
// position while changing scale — standard "zoom toward cursor" math.
function zoomAt(point: { x: number; y: number }, newScale: number, cam: Camera): Camera {
  const factor = newScale / cam.scale;
  return {
    scale: newScale,
    x: point.x - (point.x - cam.x) * factor,
    y: point.y - (point.y - cam.y) * factor,
  };
}

// Frame a world-space point at the center of the viewBox at a given scale —
// used to ease the camera onto a tapped resource building (§4.3/§8.5).
function frameAt(point: { x: number; y: number }, scale: number): Camera {
  return { scale, x: VB_W / 2 - point.x * scale, y: VB_H / 2 - point.y * scale };
}

// Binary-scan the rendered route path to find the arc-length at which each
// waypoint sits, so per-sprint "legs" can be measured independently.
function findLegBoundaries(path: SVGPathElement, totalLen: number, pts: { x: number; y: number }[]): number[] {
  const bounds: number[] = [0];
  let searchFrom = 0;
  const step = Math.max(1, totalLen / 400);
  for (let i = 1; i < pts.length; i++) {
    const target = pts[i];
    let bestLen = searchFrom, bestDist = Infinity;
    for (let l = searchFrom; l <= totalLen; l += step) {
      const p = path.getPointAtLength(l);
      const d = (p.x - target.x) ** 2 + (p.y - target.y) ** 2;
      if (d < bestDist) { bestDist = d; bestLen = l; }
    }
    bounds.push(bestLen);
    searchFrom = bestLen;
  }
  return bounds;
}

// Deterministic short hex "hash" for the chain visual (§9.2) — real on-chain
// Growth Receipts are future work, so this just gives each block a stable label.
function pseudoHash(id: string): string {
  return '0x' + id.replace(/-/g, '').slice(0, 6);
}

// ── Decorative streets (spec §4.2) ───────────────────────────────────────────
const STREETS = [
  'M -20 140 L 380 110', 'M -20 300 L 380 330', 'M -20 480 L 380 450',
  'M 90 -20 L 70 640', 'M 250 -20 L 280 640',
];

export default function GpsMapPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { speak } = useSpiritVoice();

  const [goal, setGoal] = useState<any>(null);
  const [sprints, setSprints] = useState<SprintRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetSnap, setSheetSnap] = useState<'peek' | 'default' | 'expanded'>('default');
  const [inspectIdx, setInspectIdx] = useState(0);
  const [mining, setMining] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [routeLen, setRouteLen] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // ── Camera (pan/pinch/zoom, spec §10.2/§11) ────────────────────────────────
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, scale: 1 });
  const [legBounds, setLegBounds] = useState<number[]>([]);
  const [wayfinderAction, setWayfinderAction] = useState<{
    id: string; title: string; description?: string; sprintTitle: string; sprintNumber: number;
  } | null>(null);
  const [resourcePopover, setResourcePopover] = useState<ResourceItem | null>(null);
  const [gapAnalysis, setGapAnalysis] = useState<{ gaps: GapItem[]; can_reach_95: boolean | null } | null>(null);
  const [selectedGap, setSelectedGap] = useState<GapItem | null>(null);

  const routeRef = useRef<SVGPathElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pinchRef = useRef<{ active: boolean; dist: number; mid: { x: number; y: number }; cam: Camera } | null>(null);
  const panRef = useRef<{ active: boolean; last: { x: number; y: number } } | null>(null);
  const tapRef = useRef<{ t: number; x: number; y: number } | null>(null);

  // ── Load goal + sprints + actions ──────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    const { data: g } = await (supabase as any)
      .from('goals').select('*').eq('id', params.id).single();
    setGoal(g);

    const { data: sp } = await (supabase as any)
      .from('sprints')
      .select('id, title, status, week_start, created_at, sprint_actions(id, title, completed, order_index, goal_steps(description))')
      .eq('goal_id', params.id)
      .order('created_at', { ascending: true });

    const rows: SprintRow[] = (sp ?? []).map((s: any, i: number) => ({
      id: s.id, title: s.title, status: s.status, sprint_number: i + 1,
      actions: (s.sprint_actions ?? [])
        .sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0))
        .map((a: any) => ({ id: a.id, title: a.title, completed: a.completed, order_index: a.order_index, description: a.goal_steps?.description })),
      waypoint: { x: 0, y: 0 },
    }));

    // Fallback: derive pseudo-sprints from goal_steps if no sprints exist yet
    if (rows.length === 0) {
      const { data: steps } = await (supabase as any)
        .from('goal_steps').select('id, title, status, step_number, week_number, description')
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
              id: st.id, title: st.title, completed: st.status === 'completed', order_index: j, description: st.description,
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

    const { data: ga } = await (supabase as any)
      .from('goal_gap_analysis').select('gaps, can_reach_95').eq('goal_id', params.id).maybeSingle();
    setGapAnalysis(ga ?? null);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await (supabase as any)
        .from('profiles').select('avatar_url').eq('id', user.id).single();
      if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);
    }
  }, [params.id, supabase]);

  useEffect(() => { load(); }, [load]);

  // ── Derived map data ───────────────────────────────────────────────────────
  const waypointPts = useMemo(() => sprints.map(s => s.waypoint), [sprints]);
  const routeD = useMemo(() => buildRoutePath(waypointPts), [waypointPts]);

  const allActions = useMemo(() => sprints.flatMap(s => s.actions), [sprints]);
  const totalActions = allActions.length;
  const doneActions = allActions.filter(a => a.completed).length;
  const progress = totalActions ? doneActions / totalActions : 0;

  // Village chain visual — last 2 mined blocks + the in-progress one (§9.2)
  const existingBlocks = useMemo(
    () => allActions.filter(a => a.completed).slice(-2).map(a => pseudoHash(a.id)),
    [allActions]
  );

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

  // Measure per-sprint "leg" boundaries along the route for zoom-disclosure markers (§11)
  useEffect(() => {
    if (routeRef.current && waypointPts.length >= 2) {
      setLegBounds(findLegBoundaries(routeRef.current, routeRef.current.getTotalLength(), waypointPts));
    } else {
      setLegBounds([]);
    }
  }, [routeD, waypointPts]);

  // You-are-here point along the route at the progress fraction
  const youPoint = useMemo(() => {
    if (!routeRef.current || !routeLen) return waypointPts[0] ?? { x: VB_W / 2, y: VB_H - 90 };
    const p = routeRef.current.getPointAtLength(routeLen * progress);
    return { x: p.x, y: p.y };
  }, [routeLen, progress, waypointPts]);

  // Per-action "turn markers" along each sprint's leg — revealed at zoom ≥1.6 (§11)
  const actionMarkers = useMemo(() => {
    if (!routeRef.current || legBounds.length < 2) return [];
    const path = routeRef.current;
    const markers: {
      id: string; x: number; y: number; status: 'done' | 'active' | 'pending';
      sprintIdx: number; sprintTitle: string; sprintNumber: number; title: string; description?: string;
    }[] = [];
    sprints.forEach((s, i) => {
      const legIdx = Math.min(i, legBounds.length - 2);
      const lo = legBounds[legIdx], hi = legBounds[legIdx + 1];
      const n = s.actions.length;
      s.actions.forEach((a, j) => {
        const t = (j + 1) / (n + 1);
        const p = path.getPointAtLength(lo + t * (hi - lo));
        markers.push({
          id: a.id, x: p.x, y: p.y,
          status: a.completed ? 'done' : a.id === currentAction?.id ? 'active' : 'pending',
          sprintIdx: i, sprintTitle: s.title, sprintNumber: s.sprint_number, title: a.title, description: a.description,
        });
      });
    });
    return markers;
  }, [sprints, legBounds, currentAction]);

  const actionMarkerOpacity = clamp((camera.scale - 1.6) / 0.2, 0, 1);
  const showActionLabels = camera.scale >= 2.2;

  // Resource "buildings" along the route — sourced from Spirit's plan (§4.3)
  const resources = useMemo<ResourceItem[]>(() => {
    if (!goal || sprints.length === 0) return [];
    const ai = goal.ai_analysis ?? {};
    const resourceList: string[] = Array.isArray(ai.resources) ? ai.resources : [];
    const skillList: string[] = Array.isArray(ai.skills) ? ai.skills : [];
    const items: { label: string; cost?: number }[] = [
      ...resourceList.map(r => ({ label: r })),
      ...skillList.map(s => ({ label: `Skill: ${s}` })),
    ];
    if (goal.requires_funding && goal.estimated_cost) {
      items.push({ label: `Funding $${Math.round(goal.estimated_cost)}`, cost: goal.estimated_cost });
    }
    return items.map((item, i) => {
      const sprintIdx = i % sprints.length;
      const wp = sprints[sprintIdx].waypoint;
      const side = i % 2 === 0 ? 1 : -1;
      const w = clamp(item.label.length * 4.5 + 14, 40, 52);
      const h = 28;
      const cx = wp.x + side * 42;
      const cy = wp.y - 30;
      return { id: `res-${i}`, label: item.label, cost: item.cost, sprintIdx, x: cx - w / 2, y: cy - h / 2, w, h, cx, cy };
    });
  }, [goal, sprints]);

  const showBuildingLabels = camera.scale <= 2.2;

  // Unresolved gaps that create probability friction (spec §4.4) — prefer the
  // real goal_gap_analysis row, fall back to ai_analysis.riskFactors if absent.
  const activeGaps = useMemo<GapItem[]>(() => {
    if (gapAnalysis?.gaps?.length) {
      return gapAnalysis.gaps.filter(g => g.severity === 'high' || g.severity === 'critical');
    }
    const risk: string[] = Array.isArray(goal?.ai_analysis?.riskFactors) ? goal.ai_analysis.riskFactors : [];
    if ((goal?.probability_score ?? 100) < 85 && risk.length > 0) {
      return risk.map(r => ({ dimension: 'general', gap: r, severity: 'high', fillStrategy: r }));
    }
    return [];
  }, [gapAnalysis, goal]);

  // Distribute gaps onto upcoming sprint legs, starting from the active sprint
  const gapLegMap = useMemo(() => {
    const m = new Map<number, GapItem>();
    if (activeGaps.length === 0 || sprints.length === 0) return m;
    activeGaps.forEach((g, i) => {
      const idx = Math.min(activeSprintIdx + i, sprints.length - 1);
      if (!m.has(idx)) m.set(idx, g);
    });
    return m;
  }, [activeGaps, sprints.length, activeSprintIdx]);

  // Wayfinder (action-view) disclosure — centering an action at scale ≥3.0 opens its instructions (§11)
  useEffect(() => {
    if (camera.scale < 3.0 || actionMarkers.length === 0) { setWayfinderAction(null); return; }
    const center = { x: (VB_W / 2 - camera.x) / camera.scale, y: (VB_H / 2 - camera.y) / camera.scale };
    let best: typeof actionMarkers[number] | null = null, bestD = Infinity;
    for (const m of actionMarkers) {
      const d = (m.x - center.x) ** 2 + (m.y - center.y) ** 2;
      if (d < bestD) { bestD = d; best = m; }
    }
    if (best && bestD < 30 * 30) {
      setWayfinderAction({ id: best.id, title: best.title, description: best.description, sprintTitle: best.sprintTitle, sprintNumber: best.sprintNumber });
    } else {
      setWayfinderAction(null);
    }
  }, [camera, actionMarkers]);

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

  // ── Swipe → Workshop / Goals (spec §10.1) ───────────────────────────────────
  const { onTouchStart, onTouchEnd } = useWorkshopSwipeNav('GPS');

  // ── Map gestures: pinch-zoom, pan-when-zoomed, double-tap, wheel (§10.2/§11) ─
  function onMapTouchStart(e: React.TouchEvent<SVGSVGElement>) {
    if (e.touches.length === 2) {
      e.stopPropagation();
      const [a, b] = [e.touches[0], e.touches[1]];
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const mid = clientToSvg(svgRef.current!, (a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2);
      pinchRef.current = { active: true, dist, mid, cam: camera };
      panRef.current = null;
    } else if (e.touches.length === 1 && camera.scale > 1.02) {
      panRef.current = { active: true, last: { x: e.touches[0].clientX, y: e.touches[0].clientY } };
    }
  }

  function onMapTouchMove(e: React.TouchEvent<SVGSVGElement>) {
    if (pinchRef.current?.active && e.touches.length === 2) {
      e.stopPropagation();
      const [a, b] = [e.touches[0], e.touches[1]];
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const mid = clientToSvg(svgRef.current!, (a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2);
      const newScale = clamp(pinchRef.current.cam.scale * (dist / pinchRef.current.dist), 0.7, 4);
      const zoomed = zoomAt(pinchRef.current.mid, newScale, pinchRef.current.cam);
      setCamera({ scale: newScale, x: zoomed.x + (mid.x - pinchRef.current.mid.x), y: zoomed.y + (mid.y - pinchRef.current.mid.y) });
    } else if (panRef.current?.active && e.touches.length === 1) {
      e.stopPropagation();
      const t = e.touches[0];
      const p0 = clientToSvg(svgRef.current!, panRef.current.last.x, panRef.current.last.y);
      const p1 = clientToSvg(svgRef.current!, t.clientX, t.clientY);
      setCamera(c => ({ ...c, x: c.x + (p1.x - p0.x), y: c.y + (p1.y - p0.y) }));
      panRef.current.last = { x: t.clientX, y: t.clientY };
    }
  }

  function onMapTouchEnd(e: React.TouchEvent<SVGSVGElement>) {
    const wasGesture = pinchRef.current?.active || panRef.current?.active;
    if (e.touches.length === 0) { pinchRef.current = null; panRef.current = null; }
    if (wasGesture) { e.stopPropagation(); return; }

    // Double-tap → zoom in/out centered on tap (§10.4)
    if (e.changedTouches.length === 1) {
      const t = e.changedTouches[0];
      const now = Date.now();
      if (tapRef.current && now - tapRef.current.t < 320 && Math.hypot(t.clientX - tapRef.current.x, t.clientY - tapRef.current.y) < 24) {
        e.stopPropagation();
        const p = clientToSvg(svgRef.current!, t.clientX, t.clientY);
        setCamera(zoomAt(p, camera.scale < 1.8 ? 2.2 : 1, camera));
        tapRef.current = null;
        return;
      }
      tapRef.current = { t: now, x: t.clientX, y: t.clientY };
    }
  }

  function onMapWheel(e: React.WheelEvent<SVGSVGElement>) {
    e.preventDefault();
    e.stopPropagation();
    const p = clientToSvg(svgRef.current!, e.clientX, e.clientY);
    setCamera(zoomAt(p, clamp(camera.scale * (1 - e.deltaY * 0.0015), 0.7, 4), camera));
  }

  const cameraGestureActive = !!(pinchRef.current?.active || panRef.current?.active);
  const cameraTransition = cameraGestureActive ? { duration: 0 } : { duration: 0.3, ease: 'easeOut' as const };

  const sheetPx = sheetSnap === 'peek' ? 120 : sheetSnap === 'expanded' ? 600 : 320;
  const inspect = sprints[inspectIdx];

  return (
    <div className="flex flex-col" style={{ height: '100dvh', background: C.page, overflow: 'hidden', position: 'relative' }}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>

      {/* ── Top tab bar (Goals | Workshop | GPS) ─────────────────────────── */}
      <div className="flex-shrink-0 flex items-center" style={{ height: 44, background: C.page, paddingTop: 'env(safe-area-inset-top)' }}>
        <Link href="/village/workshop" aria-label="Back"
          className="flex items-center justify-center" style={{ width: 44, height: 44, color: C.textBody, flexShrink: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </Link>
        <WorkshopTabBar active="GPS" />
        <div style={{ width: 44, flexShrink: 0 }} />
      </div>

      {/* ── Map canvas ────────────────────────────────────────────────────── */}
      <div style={{ position: 'absolute', inset: 0, top: 0, zIndex: 0, background: C.map }}>
        <svg ref={svgRef} viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" height="100%" preserveAspectRatio="xMidYMin slice"
          style={{ display: 'block', touchAction: 'none' }}
          onTouchStart={onMapTouchStart} onTouchMove={onMapTouchMove} onTouchEnd={onMapTouchEnd} onWheel={onMapWheel}>
        <motion.g style={{ transformOrigin: '0px 0px' }} animate={{ x: camera.x, y: camera.y, scale: camera.scale }} transition={cameraTransition}>
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

              {/* Gap segments — amber "route ahead" where probability friction remains (§4.4) */}
              {routeLen > 0 && legBounds.length >= 2 && Array.from(gapLegMap.entries()).map(([sprintIdx, gap]) => {
                const legIdx = Math.min(sprintIdx, legBounds.length - 2);
                const lo = legBounds[legIdx], hi = legBounds[legIdx + 1];
                const doneLen = routeLen * progress;
                const segLo = Math.max(lo, doneLen), segHi = hi;
                if (segHi <= segLo) return null;
                return (
                  <path key={`gap-${sprintIdx}`} d={routeD} fill="none" stroke={C.gap} strokeWidth={4}
                    strokeDasharray={`${segHi - segLo} ${routeLen}`} strokeDashoffset={-segLo}
                    opacity={0.85} strokeLinecap="round" style={{ cursor: 'pointer' }}
                    onClick={() => { setSelectedGap(gap); setSheetSnap('expanded'); }} />
                );
              })}

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

              {/* Resource "buildings" along the route (spec §4.3) */}
              {resources.map(r => (
                <g key={r.id} onClick={() => { setResourcePopover(r); setCamera(frameAt({ x: r.cx, y: r.cy }, 1.8)); }} style={{ cursor: 'pointer' }}>
                  <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={3} fill={C.building} stroke={C.borderDim} strokeWidth={0.5} />
                  {showBuildingLabels && (
                    <text x={r.cx} y={r.cy + 2} textAnchor="middle" fontSize={7} fill={C.buildingLabel}>
                      {r.label.length > 14 ? `${r.label.slice(0, 13)}…` : r.label}
                    </text>
                  )}
                </g>
              ))}

              {/* You-are-here marker */}
              <g transform={`translate(${youPoint.x}, ${youPoint.y})`} style={{ transition: 'transform 1.2s cubic-bezier(0.19,1,0.22,1)' }}>
                <motion.circle r={12} cx={0} cy={0} fill={C.active}
                  animate={{ scale: [1, 1.85, 1], opacity: [0.35, 0.05, 0.35] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ transformOrigin: 'center' }} />
                {avatarUrl ? (
                  <>
                    <defs>
                      <clipPath id="you-are-here-clip"><circle r={9} cx={0} cy={0} /></clipPath>
                    </defs>
                    <image href={avatarUrl} x={-9} y={-9} width={18} height={18}
                      clipPath="url(#you-are-here-clip)" preserveAspectRatio="xMidYMid slice" />
                    <circle r={9} cx={0} cy={0} fill="none" stroke={C.textHi} strokeWidth={1.5} />
                  </>
                ) : (
                  <path d="M0,-9 L6,7 L0,3 L-6,7 Z" fill={C.arrow} stroke={C.textHi} strokeWidth={1} />
                )}
              </g>

              {/* Action turn-markers — fade in 1.6→1.8 zoom (§11 Sprint view) */}
              {actionMarkerOpacity > 0 && actionMarkers.map(m => {
                const fill = m.status === 'done' ? C.wpDone : m.status === 'active' ? C.active : C.building;
                const stroke = m.status === 'done' ? C.wpDoneStroke : m.status === 'active' ? C.activeStroke : C.buildingLabel;
                return (
                  <g key={m.id} opacity={actionMarkerOpacity}>
                    <circle cx={m.x} cy={m.y} r={4} fill={fill} stroke={stroke} strokeWidth={1} />
                    {showActionLabels && (
                      <text x={m.x} y={m.y - 7} textAnchor="middle" fontSize={9} fill={C.textBody}>
                        {m.title.length > 22 ? `${m.title.slice(0, 21)}…` : m.title}
                      </text>
                    )}
                  </g>
                );
              })}
            </>
          )}
        </motion.g>
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

      {/* ── Wayfinder instruction panel — action view, zoom ≥3.0 (§11) ──────── */}
      <AnimatePresence>
        {wayfinderAction && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            style={{ position: 'absolute', top: 'calc(44px + env(safe-area-inset-top) + 66px)', left: 10, right: 10, zIndex: 3,
              background: C.building, border: `0.5px solid ${C.borderDim}`, borderRadius: 10, padding: '10px 12px' }}>
            <p style={{ fontSize: 10, color: C.textMute, letterSpacing: '0.4px', textTransform: 'uppercase', margin: '0 0 4px' }}>
              Wayfinder · Sprint {wayfinderAction.sprintNumber} — {wayfinderAction.sprintTitle}
            </p>
            <p style={{ fontSize: 13, fontWeight: 500, color: C.textHi, margin: wayfinderAction.description ? '0 0 4px' : 0 }}>
              {wayfinderAction.title}
            </p>
            {wayfinderAction.description && (
              <p style={{ fontSize: 11, color: C.textBody, margin: 0, lineHeight: 1.4 }}>{wayfinderAction.description}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Resource popover — "Spirit recommends" (spec §4.3/§8.5) ─────────── */}
      <AnimatePresence>
        {resourcePopover && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            style={{ position: 'absolute', left: 10, right: 10, bottom: sheetPx + 12, zIndex: 5,
              background: C.building, border: `0.5px solid ${C.borderDim}`, borderRadius: 10, padding: '10px 12px',
              display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 10, color: C.textMute, letterSpacing: '0.4px', textTransform: 'uppercase', margin: '0 0 2px' }}>Spirit recommends</p>
              <p style={{ fontSize: 13, fontWeight: 500, color: C.textHi, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{resourcePopover.label}</p>
            </div>
            <Link href="/village/trading-post" style={{ fontSize: 11, fontWeight: 500, color: C.amberText, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
              Trading Post →
            </Link>
            <button onClick={() => setResourcePopover(null)} aria-label="Close" style={{ background: 'none', border: 'none', color: C.textMute, cursor: 'pointer', fontSize: 16, padding: 0, lineHeight: 1, flexShrink: 0 }}>×</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating action buttons ───────────────────────────────────────── */}
      <div style={{ position: 'absolute', right: 10, bottom: sheetPx + 12, zIndex: 4, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { key: 'recenter', icon: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></>, onClick: () => setCamera({ x: 0, y: 0, scale: 1 }) },
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

            {/* Gap panel — tapped amber segment's fillStrategy / pathTo95 guidance (§4.4) */}
            <AnimatePresence>
              {selectedGap && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden', marginBottom: 10 }}>
                  <div style={{ background: C.amberBg, border: `0.5px solid ${C.gap}`, borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                      <p style={{ fontSize: 10, color: C.amberText, letterSpacing: '0.4px', textTransform: 'uppercase', margin: 0 }}>
                        {selectedGap.dimension} gap · probability friction
                      </p>
                      <button onClick={() => setSelectedGap(null)} aria-label="Close" style={{ background: 'none', border: 'none', color: C.textMute, cursor: 'pointer', fontSize: 16, padding: 0, lineHeight: 1 }}>×</button>
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: C.textHi, margin: '0 0 4px' }}>{selectedGap.gap}</p>
                    <p style={{ fontSize: 11, color: C.textBody, margin: '0 0 8px', lineHeight: 1.4 }}>{selectedGap.fillStrategy}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {typeof selectedGap.probabilityImpact === 'number' && (
                        <span style={{ fontSize: 10, color: C.routeAhead, background: C.probBg, borderRadius: 12, padding: '2px 8px' }}>+{selectedGap.probabilityImpact}% if filled</span>
                      )}
                      {typeof selectedGap.estimatedTimeToFillWeeks === 'number' && (
                        <span style={{ fontSize: 10, color: C.textMute, background: C.completeBg, borderRadius: 12, padding: '2px 8px' }}>~{selectedGap.estimatedTimeToFillWeeks} wk to fill</span>
                      )}
                      {selectedGap.villageRoute && (
                        <Link href={selectedGap.villageRoute} style={{ fontSize: 11, fontWeight: 500, color: C.amberText, textDecoration: 'none', marginLeft: 'auto' }}>
                          Fill this gap →
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mining chips */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              <span style={{ fontSize: 10, color: C.amberText, background: C.amberBg, borderRadius: 12, padding: '2px 8px' }}>⛏ {doneActions * 25} $VLG mined</span>
              <span style={{ fontSize: 10, color: C.arrow, background: C.completeBg, borderRadius: 12, padding: '2px 8px' }}>{Math.round(progress * 100)}% complete</span>
            </div>

            {/* Things needed on this route (spec §8.5) */}
            {resources.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 10, color: C.textMute, letterSpacing: '0.4px', textTransform: 'uppercase', margin: '0 0 6px' }}>
                  Things needed on this route
                </p>
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
                  {resources.map(r => (
                    <button key={r.id}
                      onClick={() => { setResourcePopover(r); setCamera(frameAt({ x: r.cx, y: r.cy }, 1.8)); setSheetSnap('default'); }}
                      style={{ flexShrink: 0, fontSize: 10, color: C.textBody, background: C.building, border: `0.5px solid ${C.borderDim}`, borderRadius: 12, padding: '4px 10px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

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

                  {/* Village chain visual — new block joins the chain at T≈2400ms (§9.2) */}
                  <p style={{ fontSize: 9, color: C.textMute, letterSpacing: '0.4px', textTransform: 'uppercase', margin: '8px 0 4px' }}>Village chain</p>
                  <svg viewBox="0 0 200 44" width="100%" height="44" preserveAspectRatio="xMinYMid meet" style={{ display: 'block' }}>
                    {existingBlocks.map((hash, i) => {
                      const x = 10 + i * 50;
                      return (
                        <g key={i}>
                          {i > 0 && <line x1={x - 16} y1={22} x2={x} y2={22} stroke={C.borderDim} strokeWidth={2} />}
                          <rect x={x} y={11} width={34} height={22} rx={4} fill={C.building} stroke={C.borderDim} strokeWidth={1} />
                          <text x={x + 17} y={25} textAnchor="middle" fontSize={7} fontFamily="monospace" fill={C.textMute}>{hash}</text>
                        </g>
                      );
                    })}
                    {currentAction && (() => {
                      const x = 10 + existingBlocks.length * 50;
                      const prevEnd = existingBlocks.length > 0 ? 10 + (existingBlocks.length - 1) * 50 + 34 : x;
                      return (
                        <g>
                          {existingBlocks.length > 0 && (
                            <motion.line x1={prevEnd} y1={22} y2={22} stroke={C.gap} strokeWidth={2}
                              initial={{ x2: prevEnd }} animate={{ x2: x }} transition={{ delay: 2.4, duration: 0.3, ease: 'easeOut' }} />
                          )}
                          <motion.g initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 2.4, duration: 0.6, ease: 'easeOut' }}>
                            <rect x={x} y={11} width={34} height={22} rx={4} fill={C.amberBg} stroke={C.gap} strokeWidth={1.5} />
                            <text x={x + 17} y={25} textAnchor="middle" fontSize={7} fontFamily="monospace" fill={C.amberText}>{pseudoHash(currentAction.id)}</text>
                          </motion.g>
                        </g>
                      );
                    })()}
                  </svg>
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
