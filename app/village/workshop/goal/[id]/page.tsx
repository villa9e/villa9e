'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

const PACE_LABELS: Record<number, { name: string; desc: string; color: string }> = {
  1: { name: 'Wayfinder',   desc: 'Every step broken down',       color: '#10B981' },
  2: { name: 'Pathfinder',  desc: 'Guided, basics assumed',        color: '#1877F2' },
  3: { name: 'Trailblazer', desc: 'High-level, you drive',         color: '#8B5CF6' },
};

export default function GoalDetailPage({ params }: { params: { id: string } }) {
  const [goal, setGoal]               = useState<any>(null);
  const [steps, setSteps]             = useState<any[]>([]);
  const [sprints, setSprints]         = useState<any[]>([]);
  const [userId, setUserId]           = useState<string | null>(null);
  const [loading, setLoading]         = useState(true);

  // Navigation
  const [activeTab, setActiveTab]     = useState<'spirit' | 'instructions' | 'workshop'>('instructions');
  const [actionIdx, setActionIdx]     = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [openSprintIdx, setOpenSprintIdx] = useState<number | null>(null);

  // Spirit chat
  const [spiritMessages, setSpiritMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [spiritInput, setSpiritInput]   = useState('');
  const [sendingSpirit, setSendingSpirit] = useState(false);
  const spiritEndRef = useRef<HTMLDivElement>(null);

  // Instructions state
  const [instructions, setInstructions] = useState<any>(null);
  const [loadingInstructions, setLoadingInstructions] = useState(false);
  const [verifying, setVerifying]     = useState(false);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [showVerifyInput, setShowVerifyInput] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [expandedStep, setExpandedStep] = useState<number | null>(0);

  // Workshop state
  const [feed, setFeed]               = useState<any[]>([]);
  const [feedIdx, setFeedIdx]         = useState(0);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [videoPaused, setVideoPaused] = useState(false);
  const [showOoWopAnim, setShowOoWopAnim] = useState(false);
  const [videoOoWops, setVideoOoWops] = useState<Record<string, number>>({});
  const [videoFavorites, setVideoFavorites] = useState<Set<string>>(new Set());
  const [showCommentDrawer, setShowCommentDrawer] = useState(false);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapCountRef = useRef(0);

  // GPS / Life event state
  const [assessing, setAssessing]     = useState(false);
  const [activating, setActivating]   = useState(false);
  const [showLifeEvent, setShowLifeEvent] = useState(false);
  const [lifeEventType, setLifeEventType] = useState('');
  const [lifeEventTitle, setLifeEventTitle] = useState('');
  const [lifeEventDesc, setLifeEventDesc] = useState('');
  const [loggingEvent, setLoggingEvent] = useState(false);
  const [recalibDelta, setRecalibDelta] = useState<any>(null);
  const [recalculating, setRecalculating] = useState(false);
  const [gpsData, setGpsData]         = useState<any>(null);

  // Pace
  const [showPacePicker, setShowPacePicker] = useState(false);
  const [savingPace, setSavingPace]   = useState(false);

  // Share
  const [sharing, setSharing]         = useState(false);
  const [shared, setShared]           = useState(false);

  const { theme } = useVillageTheme();
  const isNight = theme === 'night';
  const router = useRouter();
  const supabase = createClient();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ─── Colors ───────────────────────────────────────────────────────────────
  const accent  = '#1877F2';
  const bg      = isNight ? '#0A0B12' : '#FFF8EE';
  const cardBg  = isNight ? '#12152A' : '#FFFFFF';
  const border  = isNight ? '#1E2240' : '#E8E8F0';
  const text    = isNight ? '#F0EBE0' : '#1E1B4B';
  const muted   = isNight ? '#4A4F72' : '#6B7280';

  // ─── Load goal ────────────────────────────────────────────────────────────
  useEffect(() => { loadGoal(); }, [params.id]);

  async function loadGoal() {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id ?? null);

    const [{ data: g }, { data: s }] = await Promise.all([
      supabase.from('goals').select('*').eq('id', params.id).single(),
      supabase.from('goal_steps').select('*').eq('goal_id', params.id).order('step_number'),
    ]);
    setGoal(g);
    setSteps(s ?? []);

    // Load sprints
    const sprintRes = await fetch(`/api/sprints?goal_id=${params.id}`);
    if (sprintRes.ok) {
      const sp = await sprintRes.json();
      if (sp) setSprints(Array.isArray(sp) ? sp : [sp]);
    }

    // Set action index to first incomplete step
    const firstIncomplete = (s ?? []).findIndex((st: any) => st.status !== 'completed');
    setActionIdx(Math.max(0, firstIncomplete));

    // Load completed steps
    const done = new Set((s ?? []).filter((st: any) => st.status === 'completed').map((st: any) => st.id));
    setCompletedSteps(done);

    setLoading(false);
  }

  // ─── Current action ───────────────────────────────────────────────────────
  const currentStep = steps[actionIdx] ?? null;
  const doneCount   = completedSteps.size;
  const isOwner     = goal?.user_id === userId;
  const isActive    = goal?.status_dot !== 'paused';
  const paceLevel   = goal?.pace_level ?? 2;
  const pace        = PACE_LABELS[paceLevel] ?? PACE_LABELS[2];
  const gpsStage    = goal?.gps_stage ?? 'intake';
  const probScore   = goal?.probability_score ?? 0;

  // ─── Fetch instructions when action changes ───────────────────────────────
  useEffect(() => {
    if (!currentStep || !goal) return;
    fetchInstructions();
    fetchWorkshopFeed();
    setExpandedStep(0);
    setVerifyResult(null);
    setShowVerifyInput(false);
  }, [actionIdx, goal?.id]);

  async function fetchInstructions() {
    if (!currentStep || !goal) return;
    setLoadingInstructions(true);
    try {
      const res = await fetch('/api/gps/action-instructions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action_title:      currentStep.title,
          action_description: currentStep.description,
          goal_title:        goal.title,
          goal_category:     goal.category,
          pace_level:        paceLevel,
          sprint_title:      sprints[0]?.title ?? '',
          resources:         goal.ai_analysis?.resources?.map((r: any) => r.name) ?? [],
        }),
      });
      if (res.ok) setInstructions(await res.json());
    } catch { /* silent */ }
    setLoadingInstructions(false);
  }

  async function fetchWorkshopFeed() {
    if (!currentStep || !goal) return;
    setLoadingFeed(true);
    try {
      const res = await fetch('/api/gps/action-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action_title:  currentStep.title,
          goal_title:    goal.title,
          goal_category: goal.category,
          goal_id:       goal.id,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setFeed(data.feed ?? []);
        setFeedIdx(0);
      }
    } catch { /* silent */ }
    setLoadingFeed(false);
  }

  // ─── Action navigation ────────────────────────────────────────────────────
  function goToNextAction() {
    if (actionIdx < steps.length - 1) setActionIdx(a => a + 1);
  }
  function goToPrevAction() {
    if (actionIdx > 0) setActionIdx(a => a - 1);
  }

  function handleActionSwipe(_: any, info: PanInfo) {
    if (info.offset.y < -60) goToNextAction();
    else if (info.offset.y > 60) goToPrevAction();
  }

  function handleFeedSwipe(_: any, info: PanInfo) {
    if (info.offset.y < -60 && feedIdx < feed.length - 1) setFeedIdx(i => i + 1);
    else if (info.offset.y > 60 && feedIdx > 0) setFeedIdx(i => i - 1);
  }

  // ─── Tab swipe ────────────────────────────────────────────────────────────
  const TABS: Array<'spirit' | 'instructions' | 'workshop'> = ['spirit', 'instructions', 'workshop'];
  function handleTabSwipe(_: any, info: PanInfo) {
    const idx = TABS.indexOf(activeTab);
    if (info.offset.x < -60 && idx < TABS.length - 1) setActiveTab(TABS[idx + 1]);
    else if (info.offset.x > 60 && idx > 0) setActiveTab(TABS[idx - 1]);
  }

  async function sendSpiritMessage() {
    if (!spiritInput.trim() || sendingSpirit || !goal) return;
    const userMsg = spiritInput.trim();
    setSpiritInput('');
    const nextMessages = [...spiritMessages, { role: 'user' as const, content: userMsg }];
    setSpiritMessages(nextMessages);
    setSendingSpirit(true);
    try {
      const res = await fetch('/api/spirit/goal-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages,
          context: {
            goal_id:        goal.id,
            goal_title:     goal.title,
            goal_category:  goal.category,
            current_action: currentStep?.title,
            progress:       `${doneCount}/${steps.length} steps done`,
            probability:    probScore,
            pace_level:     paceLevel,
            mode:           'goal_chat',
          },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const reply = data.message ?? data.reply ?? data.text ?? 'Spirit is here with you.';
        setSpiritMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      }
    } catch { /* silent */ }
    setSendingSpirit(false);
    setTimeout(() => spiritEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }

  // ─── Step verification ────────────────────────────────────────────────────
  async function verifyAndComplete() {
    if (!currentStep || verifying) return;
    setVerifying(true);
    try {
      const res = await fetch('/api/goals/verify-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step_id: currentStep.id, goal_id: params.id, notes: verifyNotes }),
      });
      const data = await res.json();
      setVerifyResult(data);
      if (data.verified) {
        await fetch('/api/goals/complete-step', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step_id: currentStep.id, goal_id: params.id }),
        });
        setCompletedSteps(prev => new Set([...prev, currentStep.id]));
        setSteps(prev => prev.map(s => s.id === currentStep.id ? { ...s, status: 'completed' } : s));
        const doneCount = completedSteps.size + 1;
        setGoal((g: any) => g ? { ...g, progress_percentage: Math.round((doneCount / steps.length) * 100) } : g);
        setShowVerifyInput(false);
        setVerifyNotes('');
        // Auto-advance after brief delay
        setTimeout(goToNextAction, 800);
      }
    } catch { /* silent */ }
    setVerifying(false);
  }

  // ─── Pace change ─────────────────────────────────────────────────────────
  async function changePace(level: number) {
    setSavingPace(true);
    await supabase.from('goals').update({ pace_level: level }).eq('id', params.id);
    setGoal((g: any) => g ? { ...g, pace_level: level } : g);
    setShowPacePicker(false);
    setSavingPace(false);
    fetchInstructions();
  }

  // ─── Pause / Resume ───────────────────────────────────────────────────────
  async function togglePause() {
    const newDot = isActive ? 'paused' : 'active';
    await supabase.from('goals').update({ status_dot: newDot }).eq('id', params.id);
    setGoal((g: any) => g ? { ...g, status_dot: newDot } : g);
    setShowDropdown(false);
  }

  // ─── GPS actions ─────────────────────────────────────────────────────────
  async function assessGoal() {
    if (assessing) return;
    setAssessing(true);
    setShowDropdown(false);
    try {
      const res = await fetch('/api/gps/assess', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal_id: params.id }),
      });
      const data = await res.json();
      setGpsData(data);
      setGoal((g: any) => g ? { ...g, probability_score: data.probability?.score ?? g.probability_score, gps_stage: data.stage } : g);
    } catch { /* silent */ }
    setAssessing(false);
  }

  async function activateSprints() {
    if (activating) return;
    setActivating(true);
    setShowDropdown(false);
    try {
      const res = await fetch('/api/gps/activate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal_id: params.id }),
      });
      const data = await res.json();
      if (data.blocked) {
        alert(`GPS activation requires 95% probability. You're at ${probScore}%. Complete the Assess step and talk to Spirit to improve your score.`);
      } else if (data.activated) {
        setGoal((g: any) => g ? { ...g, gps_stage: 'active', estimated_weeks: data.totalWeeks } : g);
        loadGoal();
      } else if (data.error) {
        alert(`Activation failed: ${data.error}`);
      }
    } catch { /* silent */ }
    setActivating(false);
  }

  async function logLifeEvent() {
    if (!lifeEventType || !lifeEventTitle.trim() || loggingEvent) return;
    setLoggingEvent(true);
    try {
      const res = await fetch('/api/gps/life-event', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal_id: params.id, event_type: lifeEventType, title: lifeEventTitle, description: lifeEventDesc }),
      });
      const data = await res.json();
      setRecalibDelta(data.deltas);
      setGoal((g: any) => g ? {
        ...g,
        probability_score: data.recalibration?.newProbability ?? g.probability_score,
        estimated_weeks:   data.recalibration?.newTimelineWeeks ?? g.estimated_weeks,
        gps_stage:         data.newStage ?? g.gps_stage,
      } : g);
      setShowLifeEvent(false);
      setLifeEventType(''); setLifeEventTitle(''); setLifeEventDesc('');
    } catch { /* silent */ }
    setLoggingEvent(false);
  }

  async function shareGoal() {
    if (sharing) return;
    setSharing(true);
    const url = `https://villa9e.app/village/workshop/goal/${params.id}`;
    const text = `Working on "${goal?.title}" — ${probScore}% GPS probability on villa9e\n\n${url}`;
    if (navigator.share) await navigator.share({ title: goal?.title, text, url }).catch(() => {});
    else navigator.clipboard.writeText(text).catch(() => {});
    setShared(true);
    setTimeout(() => { setShared(false); setSharing(false); }, 2000);
  }

  // ─── Workshop tap: single = pause, double = OoWop ────────────────────────
  function handleVideoTap() {
    tapCountRef.current += 1;
    if (tapCountRef.current === 1) {
      tapTimerRef.current = setTimeout(() => {
        if (tapCountRef.current === 1) setVideoPaused(p => !p);
        tapCountRef.current = 0;
      }, 280);
    } else if (tapCountRef.current === 2) {
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
      tapCountRef.current = 0;
      triggerOoWop();
    }
  }

  function triggerOoWop() {
    const vid = feed[feedIdx];
    if (!vid) return;
    setVideoOoWops(prev => ({ ...prev, [vid.id]: (prev[vid.id] ?? 0) + 1 }));
    setShowOoWopAnim(true);
    setTimeout(() => setShowOoWopAnim(false), 900);
    // Call studio OoWop API for studio posts (not YouTube)
    if (vid.source !== 'youtube') {
      fetch('/api/studio/oowop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: vid.id }),
      }).catch(() => {});
    }
  }

  function toggleFavorite() {
    const vid = feed[feedIdx];
    if (!vid) return;
    setVideoFavorites(prev => {
      const next = new Set(prev);
      if (next.has(vid.id)) next.delete(vid.id); else next.add(vid.id);
      return next;
    });
    // Call studio favorite API for studio posts
    if (vid.source !== 'youtube') {
      fetch('/api/studio/favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: vid.id }),
      }).catch(() => {});
    }
  }

  function handleShareVideo() {
    const vid = feed[feedIdx];
    if (!vid) return;
    const url = vid.source === 'youtube'
      ? `https://www.youtube.com/watch?v=${vid.id}`
      : `https://villa9e.app/studio/${vid.id}`;
    if (navigator.share) navigator.share({ title: vid.title, url }).catch(() => {});
    else navigator.clipboard.writeText(url).catch(() => {});
  }

  // ─── Close dropdown on outside click ─────────────────────────────────────
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ─── Loading ─────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: bg }}>
      <div className="text-4xl animate-pulse">🗺️</div>
    </div>
  );
  if (!goal) return <div className="p-8 text-center" style={{ color: muted }}>Goal not found.</div>;

  const isComplete = goal.status === 'completed' || (steps.length > 0 && doneCount === steps.length);
  const currentVideo = feed[feedIdx] ?? null;
  const gaps = gpsData?.gapAnalysis?.gaps ?? goal.gps_plan?.gapAnalysis?.gaps ?? [];
  const THRESHOLD = 95;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: bg }}>

      {/* ── STICKY HEADER ──────────────────────────────────────────────── */}
      <div ref={dropdownRef} className="sticky top-0 z-30"
        style={{ background: isNight ? 'rgba(10,11,18,0.96)' : 'rgba(255,248,238,0.96)', backdropFilter: 'blur(14px)', borderBottom: `1px solid ${border}` }}>

        {/* Top bar */}
        <div className="px-4 py-3 flex items-center gap-3">
          <Link href="/village/workshop" style={{ color: muted, fontSize: 20, lineHeight: 1 }}>←</Link>

          {/* Goal name + status dot + dropdown trigger */}
          <button onClick={() => setShowDropdown(d => !d)}
            className="flex items-center gap-2 flex-1 min-w-0 text-left">
            <span className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: isActive ? '#22C55E' : '#EF4444', boxShadow: isActive ? '0 0 6px #22C55E80' : '0 0 6px #EF444480' }} />
            <span className="font-black text-sm truncate" style={{ color: text }}>{goal.title}</span>
            <span className="text-xs flex-shrink-0" style={{ color: muted }}>{showDropdown ? '▲' : '▼'}</span>
          </button>

          {/* Pace badge */}
          <button onClick={() => setShowPacePicker(p => !p)}
            className="flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: `${pace.color}18`, color: pace.color, border: `1px solid ${pace.color}30` }}>
            {pace.name}
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-4 pb-2 flex items-center gap-3">
          <div className="flex-1 rounded-full h-1.5" style={{ background: isNight ? '#1E2240' : '#E8E8F0' }}>
            <div className="h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${goal.progress_percentage ?? 0}%`, background: 'linear-gradient(90deg,#1877F2,#7C3AED)' }} />
          </div>
          <span className="text-xs flex-shrink-0 font-bold" style={{ color: muted }}>
            {doneCount}/{steps.length}
          </span>
        </div>

        {/* Dropdown */}
        <AnimatePresence>
          {showDropdown && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="absolute left-0 right-0 top-full shadow-2xl overflow-hidden"
              style={{ background: cardBg, borderBottom: `1px solid ${border}`, zIndex: 40 }}>

              {/* Sprint > Action breadcrumb */}
              {currentStep && (
                <div className="px-4 py-3 border-b" style={{ borderColor: border }}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: muted }}>Currently on</p>
                  <p className="text-sm font-black" style={{ color: text }}>
                    {sprints[0]?.title ?? 'Sprint 1'} <span style={{ color: muted }}>›</span> {currentStep.title}
                  </p>
                </div>
              )}

              {/* GPS Status */}
              <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: border }}>
                <div>
                  <p className="text-xs" style={{ color: muted }}>GPS Probability</p>
                  <p className="font-black text-lg" style={{ color: probScore >= THRESHOLD ? '#10B981' : probScore >= 80 ? '#F59E0B' : '#EF4444' }}>{probScore}%</p>
                </div>
                <div className="text-right">
                  <p className="text-xs" style={{ color: muted }}>Timeline</p>
                  <p className="font-black" style={{ color: text }}>{goal.estimated_weeks ?? '?'}w</p>
                </div>
                <div className="text-right">
                  <p className="text-xs" style={{ color: muted }}>Stage</p>
                  <p className="font-bold text-sm" style={{ color: accent }}>{gpsStage}</p>
                </div>
              </div>

              {/* Actions */}
              {isOwner && (
                <div className="px-4 py-3 space-y-1 border-b" style={{ borderColor: border }}>
                  <button onClick={() => { setActiveTab('spirit'); setShowDropdown(false); }}
                    className="w-full text-left text-sm py-2 font-medium" style={{ color: accent, background: 'none', border: 'none', cursor: 'pointer' }}>
                    🌀 Edit / Chat with Spirit
                  </button>
                  {(gpsStage === 'intake' || gpsStage === 'gap_filling') && (
                    <button onClick={assessGoal} disabled={assessing}
                      className="w-full text-left text-sm py-2 font-medium disabled:opacity-50" style={{ color: accent, background: 'none', border: 'none', cursor: 'pointer' }}>
                      {assessing ? '🌀 Assessing…' : '🔍 Assess Goal Circumstances'}
                    </button>
                  )}
                  {gpsStage === 'ready' && (
                    <button onClick={activateSprints} disabled={activating}
                      className="w-full text-left text-sm py-2 font-medium disabled:opacity-50" style={{ color: '#10B981', background: 'none', border: 'none', cursor: 'pointer' }}>
                      {activating ? '🌀 Activating…' : '⚡ Activate GPS Sprints'}
                    </button>
                  )}
                  <button onClick={() => { setShowLifeEvent(true); setShowDropdown(false); }}
                    className="w-full text-left text-sm py-2 font-medium" style={{ color: text, background: 'none', border: 'none', cursor: 'pointer' }}>
                    📍 Log Life Event
                  </button>
                  <button onClick={togglePause}
                    className="w-full text-left text-sm py-2 font-medium" style={{ color: isActive ? '#EF4444' : '#10B981', background: 'none', border: 'none', cursor: 'pointer' }}>
                    {isActive ? '⏸ Pause Goal' : '▶ Resume Goal'}
                  </button>
                  <button onClick={shareGoal}
                    className="w-full text-left text-sm py-2 font-medium" style={{ color: muted, background: 'none', border: 'none', cursor: 'pointer' }}>
                    {shared ? '✅ Copied!' : '📤 Share Goal'}
                  </button>
                </div>
              )}

              {/* All Sprints accordion */}
              {steps.length > 0 && (
                <div className="px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: muted }}>All Sprints</p>
                  {(() => {
                    const sprintGroups = goal.ai_analysis?.sprints ?? [];
                    if (sprintGroups.length === 0) {
                      return steps.map((st: any, i: number) => (
                        <button key={st.id} onClick={() => { setActionIdx(i); setShowDropdown(false); }}
                          className="w-full text-left flex items-center gap-2 py-1.5 text-sm" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                          <span style={{ color: completedSteps.has(st.id) ? '#22C55E' : i === actionIdx ? accent : muted }}>
                            {completedSteps.has(st.id) ? '✓' : i === actionIdx ? '▶' : `${i + 1}.`}
                          </span>
                          <span style={{ color: i === actionIdx ? text : muted }}>{st.title}</span>
                        </button>
                      ));
                    }

                    let offset = 0;
                    return sprintGroups.map((sprint: any, si: number) => {
                      const count = sprint.steps?.length ?? 0;
                      const sprintSteps = steps.slice(offset, offset + count);
                      offset += count;
                      const isOpen = openSprintIdx === si;
                      return (
                        <div key={si} className="mb-1">
                          <button onClick={() => setOpenSprintIdx(isOpen ? null : si)}
                            className="w-full text-left flex items-center justify-between py-1.5 text-sm font-bold"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: text }}>
                            <span>{sprint.title}</span>
                            <span style={{ color: muted }}>{isOpen ? '▲' : '▼'}</span>
                          </button>
                          <AnimatePresence>
                            {isOpen && (
                              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                {sprintSteps.map((st: any, i: number) => {
                                  const globalIdx = (offset - count) + i;
                                  return (
                                    <button key={st.id} onClick={() => { setActionIdx(globalIdx); setShowDropdown(false); }}
                                      className="w-full text-left flex items-center gap-2 py-1 pl-4 text-xs"
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: globalIdx === actionIdx ? accent : muted }}>
                                      <span>{completedSteps.has(st.id) ? '✓' : `${i + 1}.`}</span>
                                      <span>{st.title}</span>
                                    </button>
                                  );
                                })}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Spirit | Instructions | Workshop tabs */}
        <div className="px-4 py-2 flex gap-6">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="text-sm font-bold capitalize pb-1 transition-colors"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: activeTab === tab ? text : muted,
                borderBottom: activeTab === tab ? `2px solid ${accent}` : '2px solid transparent',
              }}>
              {tab === 'spirit' ? 'Spirit' : tab === 'instructions' ? 'Instructions' : 'Workshop'}
            </button>
          ))}
        </div>
      </div>

      {/* ── MAIN CONTENT (swipeable between tabs) ────────────────────────── */}
      <motion.div className="flex-1 overflow-hidden" drag="x" dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleTabSwipe} style={{ touchAction: 'pan-y' }}>

        <AnimatePresence mode="wait">
          {activeTab === 'spirit' ? (

            /* ── SPIRIT TAB ─────────────────────────────────────────────── */
            <motion.div key="spirit" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col" style={{ height: 'calc(100vh - 130px)' }}>

              {/* Context bar */}
              <div className="px-4 py-3 border-b" style={{ background: cardBg, borderColor: border }}>
                <p className="text-xs" style={{ color: muted }}>
                  🌀 Spirit knows your goal, current action, pace, and progress. Ask anything.
                </p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {spiritMessages.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-4xl mb-3">🌀</p>
                    <p className="font-bold mb-1" style={{ color: text }}>Spirit is here</p>
                    <p className="text-sm" style={{ color: muted }}>
                      Ask about your goal, get help with the current action, or talk through any obstacle.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 justify-center">
                      {[
                        `Help me with: ${currentStep?.title ?? 'my next step'}`,
                        'Am I on the right track?',
                        'I hit an obstacle',
                        'Help me update my goal',
                      ].map(s => (
                        <button key={s} onClick={() => { setSpiritInput(s); }}
                          className="text-xs px-3 py-1.5 rounded-full font-medium"
                          style={{ background: isNight ? '#1E2240' : '#EEF2FF', color: accent, border: 'none', cursor: 'pointer' }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {spiritMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm"
                      style={{
                        background: msg.role === 'user'
                          ? 'linear-gradient(135deg,#1877F2,#7C3AED)'
                          : (isNight ? '#12152A' : '#F3F4F6'),
                        color: msg.role === 'user' ? '#fff' : text,
                      }}>
                      {msg.role === 'assistant' && <p className="text-xs font-bold mb-1" style={{ color: '#8B5CF6' }}>🌀 Spirit</p>}
                      <p style={{ lineHeight: 1.5 }}>{msg.content}</p>
                    </div>
                  </div>
                ))}
                {sendingSpirit && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl px-4 py-3 flex gap-1.5 items-center" style={{ background: isNight ? '#12152A' : '#F3F4F6' }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#8B5CF6', animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={spiritEndRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t flex gap-2" style={{ background: cardBg, borderColor: border }}>
                <input value={spiritInput} onChange={e => setSpiritInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendSpiritMessage()}
                  placeholder="Ask Spirit anything about your goal…"
                  className="flex-1 rounded-2xl px-4 py-2.5 text-sm focus:outline-none"
                  style={{ background: isNight ? 'rgba(255,255,255,0.06)' : '#F8FAFF', border: `1px solid ${border}`, color: text }} />
                <button onClick={sendSpiritMessage} disabled={!spiritInput.trim() || sendingSpirit}
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white disabled:opacity-40 flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#8B5CF6,#1877F2)', border: 'none', cursor: 'pointer' }}>
                  ↑
                </button>
              </div>
            </motion.div>

          ) : activeTab === 'instructions' ? (

            /* ── INSTRUCTIONS TAB ──────────────────────────────────────── */
            <motion.div key="instructions" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="flex-1 overflow-y-auto pb-24">

              {/* Gap/GPS banners (only if gaps exist and not active) */}
              {gaps.length > 0 && gpsStage !== 'active' && (
                <div className="mx-4 mt-4 rounded-2xl p-4" style={{ background: isNight ? 'rgba(245,158,11,0.08)' : '#FFFBEB', border: `1px solid ${isNight ? '#3D2E0F' : '#FDE68A'}` }}>
                  <p className="font-black text-sm mb-2" style={{ color: '#D97706' }}>⚠️ {gaps.length} Gap{gaps.length !== 1 ? 's' : ''} to Fill</p>
                  {gaps.slice(0, 3).map((gap: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b last:border-0" style={{ borderColor: isNight ? '#3D2E0F' : '#FDE68A' }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate" style={{ color: text }}>{gap.gap}</p>
                        <p className="text-xs" style={{ color: muted }}>{gap.fillStrategy}</p>
                      </div>
                      {gap.villageRoute && (
                        <Link href={gap.villageRoute} className="ml-3 text-xs font-bold px-2.5 py-1 rounded-full text-white flex-shrink-0" style={{ background: accent }}>Go →</Link>
                      )}
                    </div>
                  ))}
                  {gpsStage === 'ready' && isOwner && (
                    <button onClick={activateSprints} disabled={activating}
                      className="mt-3 w-full py-2.5 rounded-xl text-sm font-black text-white disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg,#10B981,#059669)' }}>
                      {activating ? '🌀 Activating…' : '⚡ Activate GPS Sprints'}
                    </button>
                  )}
                </div>
              )}

              {/* Recalibration delta banner */}
              <AnimatePresence>
                {recalibDelta && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="mx-4 mt-4 rounded-2xl p-3"
                    style={{ background: isNight ? 'rgba(16,185,129,0.08)' : '#ECFDF5', border: `1px solid ${isNight ? '#1A3D2F' : '#A7F3D0'}` }}>
                    <p className="font-bold text-xs mb-1" style={{ color: '#10B981' }}>🗺️ GPS Recalibrated</p>
                    <div className="flex gap-4 text-xs">
                      {recalibDelta.probability?.delta !== 0 && (
                        <span style={{ color: recalibDelta.probability.delta > 0 ? '#10B981' : '#EF4444' }}>
                          Probability {recalibDelta.probability.delta > 0 ? '+' : ''}{recalibDelta.probability.delta}%
                        </span>
                      )}
                      {recalibDelta.timeline?.delta !== 0 && (
                        <span style={{ color: recalibDelta.timeline.delta < 0 ? '#10B981' : '#F59E0B' }}>
                          Timeline {recalibDelta.timeline.delta > 0 ? '+' : ''}{recalibDelta.timeline.delta}w
                        </span>
                      )}
                    </div>
                    <button onClick={() => setRecalibDelta(null)} className="text-xs underline mt-1" style={{ color: muted, background: 'none', border: 'none', cursor: 'pointer' }}>Dismiss</button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Current action card (swipeable up/down) */}
              {steps.length > 0 && currentStep ? (
                <motion.div drag="y" dragConstraints={{ top: 0, bottom: 0 }} onDragEnd={handleActionSwipe}
                  className="mx-4 mt-4" style={{ touchAction: 'pan-x', cursor: 'grab' }}>

                  <AnimatePresence mode="wait">
                    <motion.div key={actionIdx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                      className="rounded-3xl overflow-hidden"
                      style={{ background: cardBg, border: `1.5px solid ${completedSteps.has(currentStep.id) ? '#22C55E' : accent}40`, boxShadow: `0 8px 32px ${accent}18` }}>

                      {/* Action card header */}
                      <div className="px-5 pt-5 pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1.5">
                              {completedSteps.has(currentStep.id) ? (
                                <span className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center text-white font-black text-sm">✓</span>
                              ) : (
                                <span className="w-7 h-7 rounded-full flex items-center justify-center text-white font-black text-sm"
                                  style={{ background: accent }}>{actionIdx + 1}</span>
                              )}
                              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: muted }}>
                                {completedSteps.has(currentStep.id) ? 'Completed' : 'Active Action'}
                              </span>
                            </div>
                            <h2 className="font-black text-lg leading-snug" style={{ color: text }}>{currentStep.title}</h2>
                            {currentStep.description && <p className="text-sm mt-1" style={{ color: muted }}>{currentStep.description}</p>}
                          </div>
                        </div>

                        {/* Meta pills */}
                        <div className="flex flex-wrap gap-2 mt-3">
                          {instructions?.estimatedTotalMinutes && (
                            <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: isNight ? '#1E2240' : '#F3F4F6', color: muted }}>
                              ⏱ ~{instructions.estimatedTotalMinutes}min
                            </span>
                          )}
                          {instructions?.aiCanHelp && (
                            <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: isNight ? 'rgba(24,119,242,0.12)' : '#EEF2FF', color: accent }}>
                              🤖 AI can help
                            </span>
                          )}
                          <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: `${pace.color}15`, color: pace.color }}>
                            {pace.name}
                          </span>
                        </div>
                      </div>

                      {/* Instructions steps */}
                      <div className="px-5 pb-4">
                        {loadingInstructions ? (
                          <div className="py-8 flex flex-col items-center gap-3">
                            <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: accent, borderTopColor: 'transparent' }} />
                            <p className="text-xs" style={{ color: muted }}>Spirit is preparing your instructions…</p>
                          </div>
                        ) : instructions?.steps?.length > 0 ? (
                          <div className="space-y-2 mt-1">
                            {instructions.steps.map((step: any, i: number) => (
                              <div key={i}>
                                <button onClick={() => setExpandedStep(expandedStep === i ? null : i)}
                                  className="w-full text-left flex items-start gap-3 py-2.5 px-3 rounded-2xl transition-colors"
                                  style={{
                                    background: expandedStep === i ? (isNight ? 'rgba(24,119,242,0.1)' : '#EEF2FF') : 'transparent',
                                    border: 'none', cursor: 'pointer',
                                  }}>
                                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5 text-white"
                                    style={{ background: expandedStep === i ? accent : (isNight ? '#1E2240' : '#E5E7EB'), color: expandedStep === i ? '#fff' : muted }}>
                                    {i + 1}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-left leading-snug" style={{ color: text }}>{step.instruction}</p>
                                    <AnimatePresence>
                                      {expandedStep === i && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                          className="overflow-hidden mt-2 space-y-1.5">
                                          {step.why && <p className="text-xs italic" style={{ color: muted }}>{step.why}</p>}
                                          {step.howToKnowItsDone && (
                                            <p className="text-xs" style={{ color: '#10B981' }}>✓ Done when: {step.howToKnowItsDone}</p>
                                          )}
                                          {step.toolOrPlatform && (
                                            <p className="text-xs" style={{ color: accent }}>🛠 Tool: {step.toolOrPlatform}</p>
                                          )}
                                          {step.estimatedMinutes && (
                                            <p className="text-xs" style={{ color: muted }}>⏱ ~{step.estimatedMinutes} min</p>
                                          )}
                                          {step.verifyQuestion && (
                                            <p className="text-xs px-3 py-2 rounded-xl" style={{ background: isNight ? 'rgba(245,158,11,0.1)' : '#FFF7ED', color: '#D97706' }}>
                                              ✋ Check: {step.verifyQuestion}
                                            </p>
                                          )}
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm py-4" style={{ color: muted }}>
                            {currentStep.description ?? 'Complete this action to continue.'}
                          </p>
                        )}

                        {/* Resources */}
                        {instructions?.resourcesNeeded?.length > 0 && (
                          <div className="mt-4 pt-4 border-t" style={{ borderColor: border }}>
                            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: muted }}>Resources Needed</p>
                            <div className="flex flex-wrap gap-2">
                              {instructions.resourcesNeeded.map((r: string, i: number) => (
                                <span key={i} className="text-xs px-2.5 py-1 rounded-full" style={{ background: isNight ? '#1E2240' : '#F3F4F6', color: text }}>
                                  📦 {r}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Spirit note */}
                        {instructions?.spiritNote && (
                          <div className="mt-4 px-4 py-3 rounded-2xl" style={{ background: isNight ? 'rgba(124,58,237,0.08)' : '#F5F3FF', border: `1px solid ${isNight ? 'rgba(124,58,237,0.2)' : '#DDD6FE'}` }}>
                            <p className="text-xs" style={{ color: isNight ? '#A78BFA' : '#7C3AED' }}>🌀 {instructions.spiritNote}</p>
                          </div>
                        )}

                        {/* AI help note */}
                        {instructions?.aiCanHelp && instructions?.aiHelpNote && (
                          <div className="mt-3 px-4 py-3 rounded-2xl" style={{ background: isNight ? 'rgba(24,119,242,0.08)' : '#EEF2FF', border: `1px solid ${isNight ? 'rgba(24,119,242,0.2)' : '#C7D2FE'}` }}>
                            <p className="text-xs" style={{ color: accent }}>🤖 {instructions.aiHelpNote}</p>
                          </div>
                        )}

                        {/* Verify / Complete */}
                        {isOwner && !completedSteps.has(currentStep.id) && (
                          <div className="mt-5">
                            {showVerifyInput ? (
                              <div className="space-y-2">
                                <textarea value={verifyNotes} onChange={e => setVerifyNotes(e.target.value)}
                                  placeholder="Tell Spirit what you did — even a sentence or two."
                                  rows={3} className="w-full text-sm rounded-2xl px-4 py-3 resize-none focus:outline-none"
                                  style={{ background: isNight ? '#0A0B12' : '#FFF8EE', border: `1px solid ${border}`, color: text, fontFamily: 'inherit' }} />
                                <div className="flex gap-2">
                                  <button onClick={() => { setShowVerifyInput(false); setVerifyNotes(''); }}
                                    className="text-sm px-4 py-2.5 rounded-2xl font-bold"
                                    style={{ background: isNight ? '#1E2240' : '#F3F4F6', color: muted, border: 'none', cursor: 'pointer' }}>
                                    Cancel
                                  </button>
                                  <button onClick={verifyAndComplete} disabled={verifying}
                                    className="flex-1 text-sm py-2.5 rounded-2xl font-black text-white disabled:opacity-50"
                                    style={{ background: 'linear-gradient(135deg,#FF6B2B,#E8770A)', border: 'none', cursor: 'pointer' }}>
                                    {verifying ? '🌀 Spirit verifying…' : '✓ Submit for Spirit Review'}
                                  </button>
                                </div>
                                {verifyResult && !verifyResult.verified && (
                                  <div className="rounded-2xl px-4 py-3 text-sm" style={{ background: isNight ? '#0D1020' : '#EEF2FF', border: `1px solid ${isNight ? '#1E2240' : '#C7D2FE'}` }}>
                                    <p className="font-bold text-xs mb-1" style={{ color: accent }}>Spirit says:</p>
                                    <p style={{ color: text }}>{verifyResult.spirit_message}</p>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <button onClick={() => setShowVerifyInput(true)}
                                className="w-full py-4 rounded-2xl font-black text-white text-base"
                                style={{ background: 'linear-gradient(135deg,#FF6B2B,#E8770A)', border: 'none', cursor: 'pointer' }}>
                                ✓ Mark Complete
                              </button>
                            )}
                          </div>
                        )}

                        {/* Already complete check */}
                        {completedSteps.has(currentStep.id) && (
                          <div className="mt-4 py-3 rounded-2xl text-center" style={{ background: isNight ? 'rgba(34,197,94,0.08)' : '#ECFDF5', border: `1px solid ${isNight ? '#1A3D2F' : '#A7F3D0'}` }}>
                            <p className="font-black text-green-600">✓ Completed</p>
                            <button onClick={goToNextAction} className="text-xs mt-1 underline" style={{ color: accent, background: 'none', border: 'none', cursor: 'pointer' }}>
                              Next action →
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              ) : (
                <div className="mx-4 mt-6 pb-24">
                  {isComplete ? (
                    <div className="rounded-3xl p-8 text-center" style={{ background: 'linear-gradient(135deg,#FFF7ED,#FEF3C7)', border: '1px solid #FDE68A' }}>
                      <p className="text-5xl mb-3">🏆</p>
                      <p className="font-black text-xl text-amber-700">Goal Complete!</p>
                    </div>
                  ) : (
                    /* GPS Activation Guide — shown when no sprint steps exist yet */
                    <div className="space-y-4">
                      <div className="rounded-2xl p-4" style={{ background: isNight ? 'rgba(24,119,242,0.08)' : '#EEF2FF', border: `1px solid ${isNight ? 'rgba(24,119,242,0.2)' : '#C7D2FE'}` }}>
                        <p className="font-black text-sm mb-1" style={{ color: accent }}>Your GPS isn't active yet</p>
                        <p className="text-xs" style={{ color: muted }}>Follow these steps to unlock your full action plan.</p>
                      </div>

                      {[
                        {
                          step: 1,
                          icon: '🌀',
                          title: 'Talk to Spirit',
                          desc: 'Open the Spirit tab and share your goal context — what you have, what you need, and what\'s holding you back.',
                          action: () => setActiveTab('spirit'),
                          actionLabel: 'Open Spirit',
                          done: gpsStage !== 'intake' || spiritMessages.length > 0,
                        },
                        {
                          step: 2,
                          icon: '🔍',
                          title: 'Assess Your Circumstances',
                          desc: 'Spirit will analyze your gaps, resources, and probability of success. Tap ▼ on your goal title, then "Assess Goal Circumstances".',
                          action: assessGoal,
                          actionLabel: assessing ? 'Assessing…' : 'Run Assessment',
                          done: gpsStage !== 'intake',
                          hidden: gpsStage === 'active',
                        },
                        {
                          step: 3,
                          icon: '⚡',
                          title: 'Activate GPS Sprints',
                          desc: 'Once assessed, activate your sprints to get a week-by-week action plan with instructions for every step.',
                          action: activateSprints,
                          actionLabel: activating ? 'Activating…' : 'Activate Sprints',
                          done: gpsStage === 'active',
                          disabled: gpsStage !== 'ready',
                        },
                      ].map(item => !item.hidden && (
                        <div key={item.step} className="rounded-2xl overflow-hidden"
                          style={{ background: cardBg, border: `1px solid ${item.done ? '#22C55E40' : border}` }}>
                          <div className="px-4 py-4 flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0"
                              style={{ background: item.done ? '#22C55E' : `${accent}18`, color: item.done ? '#fff' : accent }}>
                              {item.done ? '✓' : item.step}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-black text-sm mb-0.5" style={{ color: text }}>{item.icon} {item.title}</p>
                              <p className="text-xs leading-relaxed" style={{ color: muted }}>{item.desc}</p>
                              {!item.done && isOwner && (
                                <button
                                  onClick={item.action}
                                  disabled={item.disabled || assessing || activating}
                                  className="mt-3 px-4 py-2 rounded-xl text-xs font-black text-white disabled:opacity-40"
                                  style={{ background: `linear-gradient(135deg,${accent},#7C3AED)`, border: 'none', cursor: 'pointer' }}>
                                  {item.actionLabel}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* GPS probability preview if assessed */}
                      {probScore > 0 && gpsStage !== 'intake' && (
                        <div className="rounded-2xl px-4 py-3 flex items-center justify-between"
                          style={{ background: cardBg, border: `1px solid ${border}` }}>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: muted }}>GPS Probability</p>
                            <p className="font-black text-2xl" style={{ color: probScore >= 80 ? '#10B981' : probScore >= 60 ? '#F59E0B' : '#EF4444' }}>
                              {probScore}%
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: muted }}>Stage</p>
                            <p className="font-bold text-sm capitalize" style={{ color: accent }}>{gpsStage}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Remaining actions (mini list) */}
              {steps.length > 1 && (
                <div className="mx-4 mt-4 rounded-2xl overflow-hidden" style={{ border: `1px solid ${border}` }}>
                  {steps.map((st: any, i: number) => {
                    if (i === actionIdx) return null;
                    const isDone = completedSteps.has(st.id);
                    return (
                      <button key={st.id} onClick={() => setActionIdx(i)}
                        className="w-full flex items-center gap-3 px-4 py-3 border-b text-left transition-colors last:border-0"
                        style={{ background: 'none', border: 'none', borderBottom: i < steps.length - 1 ? `1px solid ${border}` : 'none', cursor: 'pointer' }}>
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                          style={{ background: isDone ? '#22C55E' : (isNight ? '#1E2240' : '#F3F4F6'), color: isDone ? '#fff' : muted }}>
                          {isDone ? '✓' : i + 1}
                        </span>
                        <span className="flex-1 text-sm font-medium truncate" style={{ color: isDone ? muted : text, textDecoration: isDone ? 'line-through' : 'none' }}>
                          {st.title}
                        </span>
                        <span style={{ color: muted, fontSize: 12 }}>↓</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Swipe hint */}
              {steps.length > 1 && (
                <p className="text-center text-xs mt-4 mb-2" style={{ color: isNight ? '#2A2E4A' : '#D1D5DB' }}>
                  swipe card up/down to navigate actions
                </p>
              )}
            </motion.div>

          ) : (

            /* ── WORKSHOP TAB — full-screen Reels style ─────────────────── */
            <motion.div key="workshop" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className="relative overflow-hidden"
              style={{ height: 'calc(100vh - 130px)', background: '#000' }}>

              {loadingFeed ? (
                <div className="absolute inset-0 flex items-center justify-center flex-col gap-3">
                  <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: accent, borderTopColor: 'transparent' }} />
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Finding content for this action…</p>
                </div>
              ) : feed.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center flex-col gap-3 p-8">
                  <p className="text-4xl">📺</p>
                  <p className="text-sm text-center" style={{ color: 'rgba(255,255,255,0.5)' }}>No workshop content found for this action yet.</p>
                  <button onClick={fetchWorkshopFeed} className="text-sm font-bold" style={{ color: accent, background: 'none', border: 'none', cursor: 'pointer' }}>Try again</button>
                </div>
              ) : (
                <motion.div className="absolute inset-0" drag="y" dragConstraints={{ top: 0, bottom: 0 }} onDragEnd={handleFeedSwipe}
                  style={{ touchAction: 'pan-x' }}>
                  <AnimatePresence mode="wait">
                    {currentVideo && (
                      <motion.div key={feedIdx} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -40 }}
                        className="absolute inset-0">

                        {/* Full-screen thumbnail — tap to pause, double-tap to OoWop */}
                        <div className="absolute inset-0" onClick={handleVideoTap} style={{ cursor: 'pointer' }}>
                          {currentVideo.thumbnail && (
                            <img src={currentVideo.thumbnail} alt={currentVideo.title}
                              className="absolute inset-0 w-full h-full" style={{ objectFit: 'cover' }} />
                          )}
                          {/* Gradient: dark at top + bottom, clear in middle */}
                          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 35%, transparent 55%, rgba(0,0,0,0.85) 100%)' }} />
                        </div>

                        {/* Pause indicator */}
                        {videoPaused && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
                            </div>
                          </div>
                        )}

                        {/* OoWop fly-up animation */}
                        <AnimatePresence>
                          {showOoWopAnim && (
                            <motion.div
                              initial={{ opacity: 1, scale: 0.6, y: 0 }}
                              animate={{ opacity: 0, scale: 1.8, y: -120 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.85, ease: 'easeOut' }}
                              style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none', zIndex: 20 }}>
                              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 6V4a1 1 0 012 0v2"/>
                                <path d="M11 6.5V3a1 1 0 012 0v3.5"/>
                                <path d="M13 7V5a1 1 0 012 0v2"/>
                                <path d="M7 13V7a1 1 0 012 0v5"/>
                                <path d="M7 12a5 5 0 0010 0v-3a1 1 0 00-2 0V11a1 1 0 01-2 0V7"/>
                              </svg>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Top badges */}
                        <div className="absolute top-3 left-3 flex gap-2" style={{ zIndex: 5 }}>
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                            style={{ background: currentVideo.source === 'studio' ? accent : '#FF0000', color: '#fff' }}>
                            {currentVideo.source === 'studio' ? 'villa9e' : 'YouTube'}
                          </span>
                          {currentVideo.format && (
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                              style={{ background: 'rgba(0,0,0,0.55)', color: '#fff' }}>
                              {currentVideo.format === 'short' ? '⚡ Short' : '📺 Long'}
                            </span>
                          )}
                        </div>

                        {/* Right action rail */}
                        <div className="absolute flex flex-col items-center gap-6"
                          style={{ right: 14, bottom: 100, zIndex: 10 }}>

                          {/* OoWop */}
                          <div className="flex flex-col items-center gap-1">
                            <button onClick={e => { e.stopPropagation(); triggerOoWop(); }}
                              className="flex items-center justify-center transition-transform active:scale-90"
                              style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', border: 'none', cursor: 'pointer' }}>
                              {/* Raised fist */}
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 6V4a1 1 0 012 0v2"/>
                                <path d="M11 6.5V3a1 1 0 012 0v3.5"/>
                                <path d="M13 7V5a1 1 0 012 0v2"/>
                                <path d="M7 13V7a1 1 0 012 0v5"/>
                                <path d="M7 12a5 5 0 0010 0v-3a1 1 0 00-2 0V11a1 1 0 01-2 0V7"/>
                              </svg>
                            </button>
                            <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>
                              {(videoOoWops[currentVideo.id] ?? 0) > 0 ? videoOoWops[currentVideo.id] : 'OoWop'}
                            </span>
                          </div>

                          {/* Not helpful */}
                          <div className="flex flex-col items-center gap-1">
                            <button onClick={e => e.stopPropagation()}
                              className="flex items-center justify-center transition-transform active:scale-90"
                              style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', border: 'none', cursor: 'pointer' }}>
                              {/* Thumbs down */}
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10 9V5a3 3 0 00-3-3l-3 9v4h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H10z"/>
                                <path d="M7 22H4a2 2 0 01-2-2v-4a2 2 0 012-2h3"/>
                              </svg>
                            </button>
                            <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: 700 }}>Skip</span>
                          </div>

                          {/* Comment */}
                          <div className="flex flex-col items-center gap-1">
                            <button onClick={e => { e.stopPropagation(); setShowCommentDrawer(true); }}
                              className="flex items-center justify-center transition-transform active:scale-90"
                              style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', border: 'none', cursor: 'pointer' }}>
                              {/* Speech bubble */}
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                              </svg>
                            </button>
                            <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>Comment</span>
                          </div>

                          {/* Share */}
                          <div className="flex flex-col items-center gap-1">
                            <button onClick={e => { e.stopPropagation(); handleShareVideo(); }}
                              className="flex items-center justify-center transition-transform active:scale-90"
                              style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', border: 'none', cursor: 'pointer' }}>
                              {/* Paper plane */}
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13"/>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                              </svg>
                            </button>
                            <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>Share</span>
                          </div>

                          {/* Save */}
                          <div className="flex flex-col items-center gap-1">
                            <button onClick={e => { e.stopPropagation(); toggleFavorite(); }}
                              className="flex items-center justify-center transition-transform active:scale-90"
                              style={{ width: 48, height: 48, borderRadius: '50%', background: videoFavorites.has(currentVideo.id) ? `${accent}CC` : 'rgba(0,0,0,0.45)', border: 'none', cursor: 'pointer' }}>
                              {/* Bookmark */}
                              <svg width="20" height="20" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"
                                fill={videoFavorites.has(currentVideo.id) ? 'white' : 'none'}
                                stroke="white" strokeWidth="1.7">
                                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
                              </svg>
                            </button>
                            <span style={{ color: videoFavorites.has(currentVideo.id) ? '#fff' : 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 700 }}>Save</span>
                          </div>
                        </div>

                        {/* Bottom overlay — title + channel + action tag */}
                        <div className="absolute left-0 right-16 bottom-0 px-4 pb-6 pt-4" style={{ zIndex: 10 }}>
                          {currentVideo.channel && (
                            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                              @{currentVideo.channel}
                            </p>
                          )}
                          <p style={{ color: '#fff', fontWeight: 800, fontSize: 14, lineHeight: 1.35 }}>
                            {currentVideo.title}
                          </p>
                          {currentStep && (
                            <div className="flex items-center gap-1.5 mt-2">
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: accent, display: 'inline-block', flexShrink: 0 }} />
                              <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11 }}>
                                For: {currentStep.title}
                              </span>
                            </div>
                          )}

                          {/* Open in YouTube link */}
                          {currentVideo.source === 'youtube' && (
                            <a href={`https://www.youtube.com/watch?v=${currentVideo.id}`} target="_blank" rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8, color: '#FF0000', fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="#FF0000"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                              Watch on YouTube
                            </a>
                          )}
                        </div>

                        {/* Vertical progress dots — left edge */}
                        <div className="absolute left-2 flex flex-col gap-1.5 items-center"
                          style={{ top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}>
                          {feed.map((_: any, i: number) => (
                            <button key={i} onClick={e => { e.stopPropagation(); setFeedIdx(i); }}
                              style={{ width: 3, height: i === feedIdx ? 18 : 5, borderRadius: 2, background: i === feedIdx ? '#fff' : 'rgba(255,255,255,0.28)', border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.2s' }} />
                          ))}
                        </div>

                        {/* Swipe hint (fades out) */}
                        <div className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none">
                          <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: 11 }}>swipe up for next · double-tap to OoWop</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* Comment drawer */}
              <AnimatePresence>
                {showCommentDrawer && (
                  <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 28 }}
                    className="absolute bottom-0 left-0 right-0 rounded-t-3xl overflow-hidden"
                    style={{ background: isNight ? '#12152A' : '#fff', zIndex: 30, maxHeight: '65%' }}
                    onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: border }}>
                      <p className="font-black text-sm" style={{ color: text }}>Comments</p>
                      <button onClick={() => setShowCommentDrawer(false)} style={{ color: muted, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer' }}>×</button>
                    </div>
                    <div className="px-5 py-8 text-center">
                      <p className="text-2xl mb-2">💬</p>
                      <p className="text-sm" style={{ color: muted }}>Comments coming soon.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Backdrop for comment drawer */}
              {showCommentDrawer && (
                <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 25 }}
                  onClick={() => setShowCommentDrawer(false)} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── PACE PICKER MODAL ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showPacePicker && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowPacePicker(false)}>
            <motion.div initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl p-6 space-y-4"
              style={{ background: cardBg, border: `1px solid ${border}` }}>
              <div>
                <h2 className="font-black text-lg" style={{ color: text }}>Your Pace</h2>
                <p className="text-xs mt-0.5" style={{ color: muted }}>How much guidance do you need on this goal?</p>
              </div>
              {[1, 2, 3].map(level => {
                const p = PACE_LABELS[level];
                const isSelected = paceLevel === level;
                return (
                  <button key={level} onClick={() => changePace(level)} disabled={savingPace}
                    className="w-full text-left rounded-2xl p-4 transition-all"
                    style={{
                      background: isSelected ? `${p.color}12` : (isNight ? '#0D0F1E' : '#F9FAFB'),
                      border: `${isSelected ? 2 : 1}px solid ${isSelected ? p.color : border}`,
                      cursor: 'pointer',
                    }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-black text-base" style={{ color: isSelected ? p.color : text }}>{p.name}</p>
                        <p className="text-sm mt-0.5" style={{ color: muted }}>{p.desc}</p>
                        <p className="text-xs mt-1" style={{ color: muted }}>
                          {level === 1 && 'Every step broken down. No jargon. Verify each piece. Ideal for new skills or new territory.'}
                          {level === 2 && 'Guided support. You know the basics. Spirit checks in at key checkpoints.'}
                          {level === 3 && 'You know what to do. Upload your work. Spirit reviews quality and gives recommendations.'}
                        </p>
                      </div>
                      {isSelected && <span style={{ color: p.color, fontSize: 20 }}>✓</span>}
                    </div>
                  </button>
                );
              })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── LIFE EVENT MODAL ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showLifeEvent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowLifeEvent(false)}>
            <motion.div initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl p-6 space-y-4 max-h-[85vh] overflow-y-auto"
              style={{ background: cardBg, border: `1px solid ${border}` }}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-black text-lg" style={{ color: text }}>📍 Log Life Event</h2>
                  <p className="text-xs mt-0.5" style={{ color: muted }}>GPS recalibrates based on what changed</p>
                </div>
                <button onClick={() => setShowLifeEvent(false)} style={{ color: muted, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer' }}>×</button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { type: 'skill_acquired',     icon: '🎓', label: 'Learned a skill',    color: '#10B981' },
                  { type: 'team_member_joined',  icon: '👥', label: 'Team member joined', color: '#1877F2' },
                  { type: 'funding_secured',     icon: '💰', label: 'Funding secured',    color: '#10B981' },
                  { type: 'funding_lost',        icon: '📉', label: 'Funding lost',        color: '#EF4444' },
                  { type: 'mentor_connected',    icon: '🧭', label: 'Mentor connected',   color: '#8B5CF6' },
                  { type: 'schedule_change_pos', icon: '⏱️', label: 'Got more time',       color: '#10B981' },
                  { type: 'schedule_change_neg', icon: '⏰', label: 'Less time',           color: '#F59E0B' },
                  { type: 'health_setback',      icon: '🏥', label: 'Health setback',     color: '#EF4444' },
                  { type: 'positive_windfall',   icon: '🌟', label: 'Windfall',            color: '#F59E0B' },
                  { type: 'new_resource',        icon: '🛠️', label: 'New resource',       color: '#1877F2' },
                  { type: 'life_obstacle',       icon: '🚧', label: 'Life obstacle',      color: '#EF4444' },
                  { type: 'scope_change',        icon: '🔄', label: 'Scope changed',      color: '#9CA3AF' },
                ].map(ev => (
                  <button key={ev.type} onClick={() => setLifeEventType(ev.type)}
                    className="flex items-center gap-2 rounded-2xl px-3 py-3 text-left text-sm font-bold transition-all"
                    style={{
                      background: lifeEventType === ev.type ? `${ev.color}18` : (isNight ? 'rgba(255,255,255,0.04)' : '#F9FAFB'),
                      border: `${lifeEventType === ev.type ? 2 : 1}px solid ${lifeEventType === ev.type ? ev.color : border}`,
                      color: lifeEventType === ev.type ? ev.color : text,
                      cursor: 'pointer',
                    }}>
                    <span>{ev.icon}</span><span>{ev.label}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <input value={lifeEventTitle} onChange={e => setLifeEventTitle(e.target.value)}
                  placeholder="Brief title (e.g. 'Found a videographer')"
                  className="w-full rounded-2xl px-4 py-3 text-sm focus:outline-none"
                  style={{ background: isNight ? 'rgba(255,255,255,0.06)' : '#F8FAFF', border: `1px solid ${border}`, color: text }} />
                <textarea value={lifeEventDesc} onChange={e => setLifeEventDesc(e.target.value)} rows={2}
                  placeholder="Details for Spirit (optional)…"
                  className="w-full rounded-2xl px-4 py-3 text-sm focus:outline-none resize-none"
                  style={{ background: isNight ? 'rgba(255,255,255,0.06)' : '#F8FAFF', border: `1px solid ${border}`, color: text, fontFamily: 'inherit' }} />
              </div>

              <button onClick={logLifeEvent} disabled={!lifeEventType || !lifeEventTitle.trim() || loggingEvent}
                className="w-full py-4 rounded-2xl font-black text-white disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg,#1877F2,#7C3AED)', border: 'none', cursor: 'pointer' }}>
                {loggingEvent ? '🌀 Recalibrating GPS…' : '📍 Log + Recalibrate'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
