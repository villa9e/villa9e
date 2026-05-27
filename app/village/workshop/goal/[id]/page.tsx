'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { OoWopButton, OoWopValidationCelebration } from '@/components/village/OoWopButton';
import { awardScore } from '@/lib/village/score';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

export default function GoalDetailPage({ params }: { params: { id: string } }) {
  const [goal, setGoal] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [givenOoWops, setGivenOoWops] = useState<Set<string>>(new Set());
  const [celebration, setCelebration] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [recalcResult, setRecalcResult] = useState<any>(null);
  const [verifying, setVerifying] = useState<string | null>(null);   // step_id being verified
  const [verifyResult, setVerifyResult] = useState<Record<string, any>>({});
  const [showVerify, setShowVerify] = useState<string | null>(null);  // step_id showing verify panel
  const [verifyNotes, setVerifyNotes] = useState('');
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteSent, setInviteSent] = useState('');
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [activeSprint, setActiveSprint]       = useState<any>(null);
  const [showSprintModal, setShowSprintModal] = useState(false);
  const [sprintTitle, setSprintTitle]         = useState('');
  const [sprintIntention, setSprintIntention] = useState('');
  const [selectedStepIds, setSelectedStepIds] = useState<Set<string>>(new Set());
  const [creatingSprint, setCreatingSprint]   = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => { loadGoal(); }, [params.id]);

  async function loadGoal() {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id ?? null);

    const [{ data: g }, { data: s }, { data: team }] = await Promise.all([
      supabase.from('goals').select('*').eq('id', params.id).single(),
      supabase.from('goal_steps').select('*').eq('goal_id', params.id).order('step_number'),
      supabase.from('goal_team_members').select('*, profiles(username, village_score)').eq('goal_id', params.id),
    ]);
    setTeamMembers(team ?? []);
    setGoal(g); setSteps(s ?? []);

    // Which steps has this user OoWop'd? + active sprint?
    if (user) {
      const [{ data: ow }, sprintRes] = await Promise.all([
        supabase.from('oowops').select('step_id').eq('giver_id', user.id).not('step_id', 'is', null),
        fetch(`/api/sprints?goal_id=${params.id}`),
      ]);
      if (ow) setGivenOoWops(new Set(ow.map((o: any) => o.step_id).filter(Boolean)));
      if (sprintRes.ok) { const sp = await sprintRes.json(); if (sp) setActiveSprint(sp); }
    }
    setLoading(false);
  }

  async function createSprint() {
    if (!goal || creatingSprint) return;
    setCreatingSprint(true);
    const pendingSteps = steps.filter(s => s.status !== 'completed');
    const actions = selectedStepIds.size > 0
      ? pendingSteps.filter(s => selectedStepIds.has(s.id)).map(s => ({ title: s.title, goal_step_id: s.id }))
      : pendingSteps.slice(0, 5).map(s => ({ title: s.title, goal_step_id: s.id }));

    const res = await fetch('/api/sprints', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        goal_id:          goal.id,
        title:            sprintTitle || `${goal.title} — Week Sprint`,
        focus_intention:  sprintIntention,
        actions,
      }),
    });
    if (res.ok) {
      const sprint = await res.json();
      setShowSprintModal(false);
      setCreatingSprint(false);
      router.push(`/village/workshop/sprint/${sprint.id}`);
    } else {
      setCreatingSprint(false);
    }
  }

  // Spirit verifies first, then completes
  async function verifyStep(step: any) {
    if (step.status === 'completed' || step.user_id !== userId) return;
    setVerifying(step.id);
    try {
      const res = await fetch('/api/goals/verify-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step_id: step.id, goal_id: params.id, notes: verifyNotes }),
      });
      const data = await res.json();
      setVerifyResult(prev => ({ ...prev, [step.id]: data }));

      if (data.verified) {
        // Proceed with completion
        await completeStep(step);
        setShowVerify(null);
        setVerifyNotes('');
      }
    } catch { /* silent */ }
    setVerifying(null);
  }

  async function completeStep(step: any) {
    if (step.status === 'completed' || step.user_id !== userId) return;

    // Call the full complete-step API (awards VLG, posts to Dream Line, etc.)
    await fetch('/api/goals/complete-step', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step_id: step.id, goal_id: params.id }),
    });

    setSteps(prev => prev.map(s => s.id === step.id ? { ...s, status: 'completed' } : s));
    const doneSteps = steps.filter(s => s.status === 'completed').length + 1;
    const pct = Math.round((doneSteps / steps.length) * 100);
    setGoal((g: any) => g ? { ...g, progress_percentage: pct } : g);
  }

  // GPS Recalibration
  async function recalibrate() {
    if (recalculating) return;
    setRecalculating(true);
    try {
      const res = await fetch('/api/goals/recalibrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal_id: params.id, reason: 'user_request' }),
      });
      const data = await res.json();
      setRecalcResult(data);
      if (data.new_probability_score) setGoal((g: any) => g ? { ...g, probability_score: data.new_probability_score } : g);
    } catch { /* silent */ }
    setRecalculating(false);
  }

  async function handleOoWop(step: any) {
    if (!userId || givenOoWops.has(step.id) || step.user_id === userId) return;
    const { error } = await supabase.from('oowops').insert({
      post_id:     step.id,   // Using step ID as reference (post_id column)
      giver_id:    userId,
      receiver_id: step.user_id,
      step_id:     step.id,
      goal_id:     params.id,
    });
    if (!error) {
      setGivenOoWops(prev => new Set([...prev, step.id]));
      let newCount = 0;
      setSteps(prev => prev.map(s => {
        if (s.id !== step.id) return s;
        newCount = (s.oowops_received || 0) + 1;
        const validated = newCount >= (s.oowops_needed ?? 3);
        if (validated) setCelebration(true);
        return { ...s, oowops_received: newCount, is_validated: validated };
      }));
      await awardScore('GIVE_OOWOP', step.id);
      // Notify receiver
      fetch('/api/oowops/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step_id: step.id, giver_id: userId, receiver_id: step.user_id, oowop_count: newCount }),
      }).catch(() => {});
    }
  }

  async function inviteToGoal() {
    if (!inviteUsername.trim() || inviting) return;
    setInviting(true);
    const res = await fetch('/api/goals/invite-team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal_id: params.id, invitee_username: inviteUsername.trim() }),
    });
    const data = await res.json();
    if (res.ok) {
      setInviteSent(`@${data.invitee} invited!`);
      setInviteUsername('');
      setTimeout(() => setInviteSent(''), 3000);
    } else {
      setInviteSent(data.error ?? 'Error sending invite');
      setTimeout(() => setInviteSent(''), 3000);
    }
    setInviting(false);
  }

  async function recalculateProbability() {
    return recalibrate();
  }

  async function shareGoalToDreamLine() {
    if (!userId || sharing) return;
    setSharing(true);
    const doneCount = steps.filter(s => s.status === 'completed').length;
    const content = `📍 Working on my goal: "${goal.title}" — ${doneCount}/${steps.length} steps done (${goal.probability_score ?? 0}% GPS score). Manifesting this. ✊`;
    const { error } = await supabase.from('dream_line_posts').insert({
      user_id: userId, content, visibility: 'public', goal_id: params.id,
    });
    if (!error) { setShared(true); setTimeout(() => setShared(false), 3000); }
    setSharing(false);
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center"><div className="text-4xl animate-float">🗺️</div></div>
  );
  if (!goal) return <div className="p-6 text-gray-500">Goal not found.</div>;

  const doneCount   = steps.filter(s => s.status === 'completed').length;
  const isOwner     = goal.user_id === userId;
  const isComplete  = goal.status === 'completed' || (steps.length > 0 && doneCount === steps.length);
  const medal = goal.medal_type === 'GOLD' || goal.probability_score >= 80 ? '🥇'
              : goal.medal_type === 'SILVER' || goal.probability_score >= 60 ? '🥈'
              : goal.medal_type === 'BRONZE' || goal.probability_score >= 40 ? '🥉' : '';

  const accentHex = isNight ? '#FF6B2B' : '#E8770A';

  return (
    <div className="min-h-screen" style={{ background: 'var(--v-bg)' }}>
      <AnimatePresence>
        {celebration && <OoWopValidationCelebration onDismiss={() => setCelebration(false)} />}
      </AnimatePresence>

      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-3.5 flex items-center gap-3"
        style={{ background: isNight ? 'rgba(10,11,18,0.92)' : 'rgba(255,248,238,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--v-card-border)' }}>
        <Link href="/village/workshop" className="text-xl" style={{ color: 'var(--v-text-muted)' }}>←</Link>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: `${accentHex}20`, border: `1px solid ${accentHex}40` }}>
          📍
        </div>
        <h1 className="text-base font-bold truncate flex-1" style={{ color: 'var(--v-text)' }}>{goal.title}</h1>
        {medal && <span className="text-2xl">{medal}</span>}
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Goal completion banner */}
        {isComplete && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="village-card bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 text-center py-6">
            <p className="text-5xl mb-2">{medal || '🏆'}</p>
            <h2 className="text-xl font-bold text-amber-700">Goal Complete!</h2>
            <p className="text-sm text-amber-600 mt-1">{goal.medal_type === 'GOLD' ? '+200 $VLG earned' : goal.medal_type === 'SILVER' ? '+150 $VLG earned' : '+100 $VLG earned'}</p>
          </motion.div>
        )}

        {/* ── Sprint card ─────────────────────────────────────── */}
        {isOwner && !isComplete && (
          activeSprint ? (
            <Link href={`/village/workshop/sprint/${activeSprint.id}`}>
              <motion.div whileHover={{ scale: 1.01 }} className="village-card cursor-pointer"
                style={{ background: isNight ? 'rgba(24,119,242,0.08)' : '#EEF2FF', border: `1px solid ${isNight ? 'rgba(24,119,242,0.2)' : '#C7D2FE'}` }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide" style={{ color: isNight ? '#60A5FA' : '#4338CA' }}>Active Sprint ⚡</p>
                    <p className="font-bold text-sm mt-0.5" style={{ color: 'var(--v-text)' }}>{activeSprint.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--v-text-muted)' }}>
                      {activeSprint.sprint_actions?.filter((a: any) => a.completed).length ?? 0}/
                      {activeSprint.sprint_actions?.length ?? 0} actions · Tap to track →
                    </p>
                  </div>
                  <div className="text-3xl">⚡</div>
                </div>
              </motion.div>
            </Link>
          ) : (
            <motion.button whileTap={{ scale: 0.98 }} onClick={() => { setSprintTitle(`${goal?.title ?? ''} — Week Sprint`); setShowSprintModal(true); }}
              className="w-full village-card text-left flex items-center gap-4 cursor-pointer"
              style={{ border: `1px dashed ${isNight ? '#1E2240' : '#C7D2FE'}` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: isNight ? 'rgba(24,119,242,0.1)' : '#EEF2FF' }}>⚡</div>
              <div>
                <p className="font-bold text-sm" style={{ color: 'var(--v-text)' }}>Start Weekly Sprint</p>
                <p className="text-xs" style={{ color: 'var(--v-text-muted)' }}>Pick 3–5 actions to focus on this week → track daily</p>
              </div>
            </motion.button>
          )
        )}

        {/* Sprint creation modal */}
        <AnimatePresence>
          {showSprintModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
              onClick={() => setShowSprintModal(false)}>
              <motion.div initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-md rounded-3xl p-6 space-y-4 max-h-[85vh] overflow-y-auto"
                style={{ background: isNight ? '#0D0F1E' : '#fff', border: `1px solid ${isNight ? '#1E2240' : '#E0E7FF'}` }}>
                <div className="flex items-center justify-between">
                  <h2 className="font-black text-lg" style={{ color: 'var(--v-text)' }}>⚡ Start Sprint</h2>
                  <button onClick={() => setShowSprintModal(false)} style={{ color: 'var(--v-text-muted)', background: 'none', border: 'none', fontSize: 22, cursor: 'pointer' }}>×</button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--v-text-muted)' }}>Sprint Title</label>
                    <input value={sprintTitle} onChange={e => setSprintTitle(e.target.value)}
                      className="w-full mt-1 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                      style={{ background: isNight ? 'rgba(255,255,255,0.06)' : '#F8FAFF', border: `1px solid ${isNight ? '#1E2240' : '#E0E7FF'}`, color: 'var(--v-text)' }} />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--v-text-muted)' }}>What will you accomplish this week?</label>
                    <textarea value={sprintIntention} onChange={e => setSprintIntention(e.target.value)} rows={2}
                      placeholder="My intention for this sprint…"
                      className="w-full mt-1 rounded-xl px-3 py-2.5 text-sm focus:outline-none resize-none"
                      style={{ background: isNight ? 'rgba(255,255,255,0.06)' : '#F8FAFF', border: `1px solid ${isNight ? '#1E2240' : '#E0E7FF'}`, color: 'var(--v-text)', fontFamily: 'inherit' }} />
                  </div>

                  {/* Step picker */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--v-text-muted)' }}>
                      Choose focus steps (leave blank = auto-pick top 5)
                    </label>
                    <div className="mt-2 space-y-1.5 max-h-44 overflow-y-auto">
                      {steps.filter(s => s.status !== 'completed').map(step => (
                        <label key={step.id} className="flex items-center gap-2.5 rounded-xl px-3 py-2 cursor-pointer"
                          style={{ background: selectedStepIds.has(step.id) ? (isNight ? 'rgba(24,119,242,0.15)' : '#EEF2FF') : 'transparent' }}>
                          <input type="checkbox" checked={selectedStepIds.has(step.id)}
                            onChange={e => setSelectedStepIds(prev => {
                              const n = new Set(prev);
                              e.target.checked ? n.add(step.id) : n.delete(step.id);
                              return n;
                            })} className="w-4 h-4 rounded" />
                          <span className="text-sm" style={{ color: 'var(--v-text)' }}>{step.title}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <button onClick={createSprint} disabled={creatingSprint || !sprintTitle.trim()}
                  className="w-full py-3.5 rounded-2xl font-black text-white disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#1877F2,#7C3AED)' }}>
                  {creatingSprint ? 'Creating…' : '⚡ Launch Sprint →'}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Probability + progress */}
        <div className="village-card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs uppercase tracking-wide village-text-muted">GPS Probability</p>
              <p className="text-3xl font-bold text-village-blue">{goal.probability_score ?? 0}%</p>
              {recalcResult?.delta !== undefined && (
                <p className={`text-xs font-medium mt-0.5 ${recalcResult.delta >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {recalcResult.delta >= 0 ? '+' : ''}{recalcResult.delta}% · {recalcResult.reasoning}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs village-text-muted">Progress</p>
              <p className="text-2xl font-bold" style={{ color: accentHex }}>{doneCount}/{steps.length}</p>
              <p className="text-xs village-text-sub">steps done</p>
            </div>
          </div>
          {isOwner && (
            <div>
              <button onClick={recalculateProbability} disabled={recalculating}
                className="text-xs font-medium hover:underline disabled:opacity-50" style={{ color: '#1877F2' }}>
                {recalculating ? '🌀 Spirit recalibrating…' : '🗺️ Recalibrate GPS'}
              </button>
              {recalcResult?.spirit_message && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-3 rounded-2xl p-3 text-sm"
                  style={{ background: isNight ? '#0D1020' : '#EEF2FF', border: `1px solid ${isNight ? '#1E2240' : '#C7D2FE'}` }}>
                  <p className="font-bold text-xs mb-1" style={{ color: '#6366F1' }}>🌀 Spirit recalibrated your GPS:</p>
                  <p style={{ color: isNight ? '#C8C3B8' : '#374151' }}>{recalcResult.spirit_message}</p>
                  {recalcResult.momentum_action && (
                    <p className="mt-2 font-semibold text-xs" style={{ color: '#6366F1' }}>
                      Today: {recalcResult.momentum_action}
                    </p>
                  )}
                </motion.div>
              )}
            </div>
          )}
          <div className="w-full rounded-full h-3 village-progress-bg">
            <div className="h-3 rounded-full village-gradient transition-all" style={{ width: `${goal.progress_percentage ?? 0}%` }} />
          </div>
          {goal.target_date && (
            <p className="text-xs village-text-sub mt-2">
              Target: {new Date(goal.target_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>

        {/* GPS Steps — Sprint-grouped if sprints available, flat fallback */}
        {(() => {
          const sprints: any[] = goal.ai_analysis?.sprints ?? [];
          const hasSprints = sprints.length > 0;

          // Build sprint → step mapping by cumulative action count
          const sprintGroups: { sprint: any; steps: typeof steps }[] = [];
          if (hasSprints) {
            let offset = 0;
            for (const sprint of sprints) {
              const actionCount = sprint.steps?.length ?? 0;
              const sprintSteps = steps.slice(offset, offset + actionCount);
              sprintGroups.push({ sprint, steps: sprintSteps });
              offset += actionCount;
            }
            // Catch any remaining steps (in case counts don't match)
            if (offset < steps.length) {
              sprintGroups.push({ sprint: { title: 'Additional Actions', milestone: '' }, steps: steps.slice(offset) });
            }
          }

          const StepItem = ({ step, i }: { step: any; i: number }) => {
            const isDone      = step.status === 'completed';
            const isNext      = !isDone && steps.slice(0, steps.indexOf(step)).every(s => s.status === 'completed');
            const hasOoWopped = givenOoWops.has(step.id);
            const globalIdx   = steps.indexOf(step);

            return (
              <motion.li key={step.id} layout
                className={`flex gap-3 transition-colors ${isDone ? 'village-step-done' : isNext ? 'village-step-next' : 'village-step-idle'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5 ${isDone ? 'bg-green-500 text-white' : isNext ? 'text-white' : 'village-text-sub'}`}
                  style={isNext ? { background: accentHex } : isDone ? {} : { background: 'var(--v-progress-bg)' }}>
                  {isDone ? '✓' : globalIdx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm village-text ${isDone ? 'line-through village-text-sub' : ''}`}>{step.title}</p>
                  {step.description && <p className="text-xs village-text-muted mt-0.5">{step.description}</p>}
                  {step.estimated_hours && <p className="text-xs mt-0.5" style={{ color: accentHex }}>~{step.estimated_hours}h</p>}

                  {isDone && (
                    <div className="mt-2 flex items-center gap-3 flex-wrap">
                      {isOwner ? (
                        <div className="flex items-center gap-1.5 text-xs village-text-muted">
                          <span>✊</span>
                          <span>{step.oowops_received ?? 0}/{step.oowops_needed ?? 3} OoWops</span>
                          {step.is_validated && <span className="text-green-600 font-medium ml-1">· Validated ✓</span>}
                        </div>
                      ) : (
                        <OoWopButton count={step.oowops_received ?? 0} hasGiven={hasOoWopped}
                          onGive={() => handleOoWop(step)} size="sm" showValidation oowopsNeeded={step.oowops_needed ?? 3} />
                      )}
                    </div>
                  )}

                  {isOwner && isNext && (
                    <div className="mt-2">
                      {showVerify === step.id ? (
                        <div className="space-y-2">
                          <textarea value={verifyNotes} onChange={e => setVerifyNotes(e.target.value)}
                            placeholder="Tell Spirit what you did — even one sentence."
                            rows={2} className="w-full text-xs rounded-xl px-3 py-2 resize-none focus:outline-none"
                            style={{ background: isNight ? '#0A0B12' : '#FFF8EE', border: `1px solid ${isNight ? '#1E2240' : '#FED7AA'}`, color: isNight ? '#F0EBE0' : '#2D1F0E' }} />
                          <div className="flex gap-2">
                            <button onClick={() => { setShowVerify(null); setVerifyNotes(''); }}
                              className="text-xs px-3 py-1.5 rounded-full"
                              style={{ background: isNight ? '#1E2240' : '#F3F4F6', color: isNight ? '#7A7FA8' : '#6B7280' }}>Cancel</button>
                            <button onClick={() => verifyStep(step)} disabled={verifying === step.id}
                              className="flex-1 text-xs px-3 py-1.5 rounded-full font-bold text-white disabled:opacity-50"
                              style={{ background: '#FF6B2B' }}>
                              {verifying === step.id ? '🌀 Spirit verifying…' : '✓ Verify with Spirit'}
                            </button>
                          </div>
                          {verifyResult[step.id] && (
                            <div className="rounded-xl p-3 text-xs"
                              style={{ background: isNight ? '#0D1F1A' : '#ECFDF5', border: `1px solid ${isNight ? '#1A3D2F' : '#A7F3D0'}` }}>
                              <p className="font-bold mb-1" style={{ color: '#059669' }}>🌀 Spirit:</p>
                              <p style={{ color: isNight ? '#C8C3B8' : '#374151' }}>{verifyResult[step.id].spirit_message}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <button onClick={() => setShowVerify(step.id)}
                          className="mt-1 text-xs px-3 py-1.5 rounded-full font-bold text-white"
                          style={{ background: '#FF6B2B' }}>✓ Mark Complete</button>
                      )}
                    </div>
                  )}
                </div>
              </motion.li>
            );
          };

          if (hasSprints) {
            return (
              <div className="space-y-4">
                {sprintGroups.map((group, si) => {
                  const sprintDone  = group.steps.every(s => s.status === 'completed');
                  const sprintActive = !sprintDone && group.steps.some(s => s.status !== 'completed') &&
                    (si === 0 || sprintGroups[si - 1]?.steps.every(s => s.status === 'completed'));
                  const sprintPct = group.steps.length
                    ? Math.round((group.steps.filter(s => s.status === 'completed').length / group.steps.length) * 100)
                    : 0;

                  return (
                    <div key={si} className="rounded-2xl overflow-hidden"
                      style={{ border: `1px solid ${sprintDone ? 'rgba(34,197,94,0.4)' : sprintActive ? `${accentHex}50` : 'var(--v-card-border)'}` }}>
                      {/* Sprint header */}
                      <div className="px-4 py-3 flex items-center justify-between"
                        style={{ background: sprintDone ? 'rgba(34,197,94,0.08)' : sprintActive ? `${accentHex}12` : 'var(--v-card-bg)' }}>
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white"
                            style={{ background: sprintDone ? '#22C55E' : sprintActive ? accentHex : 'var(--v-progress-bg)', color: sprintDone || sprintActive ? '#fff' : 'var(--v-text-muted)' }}>
                            {sprintDone ? '✓' : si + 1}
                          </div>
                          <div>
                            <p className="font-black text-sm village-text">{group.sprint.title}</p>
                            {group.sprint.milestone && (
                              <p className="text-xs village-text-muted">🏁 {group.sprint.milestone}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {group.sprint.duration_weeks && (
                            <span className="text-xs village-text-sub">{group.sprint.duration_weeks}w</span>
                          )}
                          <span className="text-xs font-bold" style={{ color: sprintDone ? '#22C55E' : 'var(--v-text-muted)' }}>
                            {sprintPct}%
                          </span>
                        </div>
                      </div>
                      {/* Sprint actions */}
                      <ol className="space-y-2 p-3" style={{ background: 'var(--v-card-bg)' }}>
                        {group.steps.map((step, i) => (
                          <StepItem key={step.id} step={step} i={i} />
                        ))}
                        {group.steps.length === 0 && (
                          <p className="text-xs village-text-muted py-2 px-1">Actions will appear here once the goal is started.</p>
                        )}
                      </ol>
                    </div>
                  );
                })}
              </div>
            );
          }

          // Flat fallback (no sprint structure)
          return (
            <div className="village-card">
              <h2 className="font-bold mb-4 flex items-center gap-2 village-text">
                <span>🗺️</span> GPS Steps
                <span className="text-xs village-text-sub font-normal ml-auto">{doneCount} of {steps.length} complete</span>
              </h2>
              <ol className="space-y-3">
                {steps.map((step, i) => <StepItem key={step.id} step={step} i={i} />)}
              </ol>
            </div>
          );
        })()}

        {/* Resources */}
        {goal.ai_analysis?.resources?.length > 0 && (
          <div className="village-card">
            <h2 className="font-bold mb-3 village-text">📦 Resources Needed</h2>
            <div className="space-y-2">
              {goal.ai_analysis.resources.map((r: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-[var(--v-card-border)] last:border-0">
                  <div>
                    <p className="text-sm font-medium village-text">{r.name}</p>
                    {r.category && <p className="text-xs village-text-sub">{r.category}</p>}
                  </div>
                  {r.estimated_cost > 0 && <span className="text-sm font-bold text-village-blue">${r.estimated_cost.toLocaleString()}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Complete goal button — show when owner and ≥80% done */}
        {isOwner && !isComplete && doneCount > 0 && doneCount >= Math.ceil(steps.length * 0.8) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="village-card bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
            <p className="font-bold text-amber-800 mb-1">🏆 Ready to complete this goal?</p>
            <p className="text-xs text-amber-700 mb-3">You've completed {doneCount}/{steps.length} steps. Declare victory and earn your medal.</p>
            <button onClick={async () => {
              const res = await fetch('/api/goals/complete', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ goal_id: params.id }),
              });
              if (res.ok) {
                const data = await res.json();
                setGoal((g: any) => g ? { ...g, status: 'completed', medal_type: data.medal } : g);
              }
            }} className="w-full bg-amber-500 text-white rounded-full py-2.5 font-bold text-sm hover:bg-amber-600">
              🎯 Declare Goal Complete
            </button>
          </motion.div>
        )}

        {/* Share to Dream Line */}
        {isOwner && (
          <button onClick={shareGoalToDreamLine} disabled={sharing}
            className="w-full rounded-2xl py-3 text-sm font-semibold transition-colors disabled:opacity-50"
            style={{ border: '1px solid rgba(124,58,237,0.35)', color: '#8B5CF6', background: isNight ? 'rgba(124,58,237,0.08)' : 'rgba(124,58,237,0.05)' }}>
            {shared ? '✅ Shared to Dream Line!' : sharing ? 'Sharing…' : '✨ Share Progress to Dream Line'}
          </button>
        )}

        {/* Roles needed */}
        {/* Team members */}
        <div className="village-card">
          <h2 className="font-bold mb-3 village-text">👥 Goal Team</h2>
          {teamMembers.length > 0 && (
            <div className="space-y-2 mb-3">
              {teamMembers.map(m => (
                <div key={m.id} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-600">
                    {(m.profiles?.username?.[0] ?? '?').toUpperCase()}
                  </div>
                  <Link href={`/villager/${m.profiles?.username}`} className="text-sm font-medium hover:text-village-blue">
                    @{m.profiles?.username}
                  </Link>
                  <span className={`text-xs px-2 py-0.5 rounded-full ml-auto ${
                    m.status === 'accepted' ? 'bg-green-100 text-green-700' :
                    m.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                  }`}>{m.role} · {m.status}</span>
                </div>
              ))}
            </div>
          )}
          {isOwner && (
            <div className="flex gap-2">
              <input value={inviteUsername} onChange={e => setInviteUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && inviteToGoal()}
                placeholder="@username to invite…"
                className="flex-1 rounded-xl px-3 py-2 text-sm focus:outline-none village-text"
                style={{ background: 'var(--v-bg)', border: '1px solid var(--v-card-border)' }} />
              <button onClick={inviteToGoal} disabled={inviting || !inviteUsername.trim()}
                className="bg-purple-600 text-white rounded-xl px-4 py-2 text-sm font-bold disabled:opacity-50 hover:bg-purple-700">
                {inviting ? '…' : 'Invite'}
              </button>
            </div>
          )}
          {inviteSent && (
            <p className={`text-xs mt-2 ${inviteSent.includes('!') ? 'text-green-600' : 'text-red-500'}`}>{inviteSent}</p>
          )}
        </div>

        {goal.ai_analysis?.roles_needed?.length > 0 && (
          <div className="village-card">
            <h2 className="font-bold mb-3">🔍 Roles Needed</h2>
            <div className="flex flex-wrap gap-2">
              {goal.ai_analysis.roles_needed.map((role: string, i: number) => (
                <Link key={i} href="/village/trading-post" className="bg-purple-50 text-purple-700 text-sm px-3 py-1.5 rounded-full border border-purple-100 hover:bg-purple-100 transition-colors">
                  {role} →
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
