'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { OoWopButton, OoWopValidationCelebration } from '@/components/village/OoWopButton';
import { awardScore } from '@/lib/village/score';

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
  const supabase = createClient();

  useEffect(() => { loadGoal(); }, [params.id]);

  async function loadGoal() {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id ?? null);

    const [{ data: g }, { data: s }] = await Promise.all([
      supabase.from('goals').select('*').eq('id', params.id).single(),
      supabase.from('goal_steps').select('*').eq('goal_id', params.id).order('step_number'),
    ]);
    setGoal(g); setSteps(s ?? []);

    // Which steps has this user OoWop'd?
    if (user) {
      const { data: ow } = await supabase.from('oowops').select('step_id').eq('giver_id', user.id).not('step_id', 'is', null);
      if (ow) setGivenOoWops(new Set(ow.map((o: any) => o.step_id).filter(Boolean)));
    }
    setLoading(false);
  }

  async function completeStep(step: any) {
    if (step.status === 'completed' || step.user_id !== userId) return;
    await supabase.from('goal_steps').update({ status: 'completed', completed_date: new Date().toISOString() }).eq('id', step.id);
    setSteps(prev => prev.map(s => s.id === step.id ? { ...s, status: 'completed' } : s));

    // Update goal progress
    const totalSteps = steps.length;
    const doneSteps  = steps.filter(s => s.status === 'completed').length + 1;
    const pct = Math.round((doneSteps / totalSteps) * 100);
    await supabase.from('goals').update({ progress_percentage: pct, current_step_index: doneSteps }).eq('id', params.id);
    setGoal((g: any) => g ? { ...g, progress_percentage: pct } : g);
    await awardScore('COMPLETE_GOAL_STEP', step.id);
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

  async function recalculateProbability() {
    if (recalculating) return;
    setRecalculating(true);
    try {
      const res = await fetch('/api/claude/probability-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal_id: params.id }),
      });
      const data = await res.json();
      setRecalcResult(data);
      setGoal((g: any) => g ? { ...g, probability_score: data.probability_score } : g);
    } catch { /* silent */ }
    setRecalculating(false);
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

  return (
    <div className="min-h-screen bg-village-bg">
      <AnimatePresence>
        {celebration && <OoWopValidationCelebration onDismiss={() => setCelebration(false)} />}
      </AnimatePresence>

      <div className="bg-orange-500 text-white px-6 py-4 flex items-center gap-3">
        <Link href="/village/workshop" className="text-xl">←</Link>
        <span className="text-2xl">📍</span>
        <h1 className="text-lg font-bold truncate flex-1">{goal.title}</h1>
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

        {/* Probability + progress */}
        <div className="village-card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">GPS Probability</p>
              <p className="text-3xl font-bold text-village-blue">{goal.probability_score ?? 0}%</p>
              {recalcResult?.delta !== undefined && (
                <p className={`text-xs font-medium mt-0.5 ${recalcResult.delta >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {recalcResult.delta >= 0 ? '+' : ''}{recalcResult.delta}% · {recalcResult.reasoning}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Progress</p>
              <p className="text-2xl font-bold text-orange-500">{doneCount}/{steps.length}</p>
              <p className="text-xs text-gray-400">steps done</p>
            </div>
          </div>
          {isOwner && (
            <button onClick={recalculateProbability} disabled={recalculating}
              className="text-xs text-village-blue font-medium hover:underline disabled:opacity-50">
              {recalculating ? '⟳ Recalculating with Spirit…' : '📡 Recalculate GPS Score'}
            </button>
          )}
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div className="h-3 rounded-full village-gradient transition-all" style={{ width: `${goal.progress_percentage ?? 0}%` }} />
          </div>
          {goal.target_date && (
            <p className="text-xs text-gray-400 mt-2">
              Target: {new Date(goal.target_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>

        {/* Steps */}
        <div className="village-card">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <span>🗺️</span> GPS Steps
            <span className="text-xs text-gray-400 font-normal ml-auto">{doneCount} of {steps.length} complete</span>
          </h2>
          <ol className="space-y-3">
            {steps.map((step, i) => {
              const isDone      = step.status === 'completed';
              const isNext      = !isDone && steps.slice(0, i).every(s => s.status === 'completed');
              const canOoWop    = !isOwner && isDone && !givenOoWops.has(step.id);
              const hasOoWopped = givenOoWops.has(step.id);

              return (
                <motion.li key={step.id} layout className={`flex gap-3 p-3 rounded-2xl transition-colors ${isDone ? 'bg-green-50' : isNext ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'}`}>
                  {/* Step number / check */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5 ${isDone ? 'bg-green-500 text-white' : isNext ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                    {isDone ? '✓' : i + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm ${isDone ? 'line-through text-gray-400' : ''}`}>{step.title}</p>
                    {step.description && <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>}
                    {step.estimated_hours && <p className="text-xs text-orange-400 mt-0.5">~{step.estimated_hours}h estimated</p>}

                    {/* OoWop section for completed steps */}
                    {isDone && (
                      <div className="mt-2 flex items-center gap-3 flex-wrap">
                        {isOwner ? (
                          <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <span>✊</span>
                            <span>{step.oowops_received ?? 0}/{step.oowops_needed ?? 3} OoWops</span>
                            {step.is_validated && <span className="text-green-600 font-medium ml-1">· Validated ✓</span>}
                          </div>
                        ) : (
                          <OoWopButton
                            count={step.oowops_received ?? 0}
                            hasGiven={hasOoWopped}
                            onGive={() => handleOoWop(step)}
                            size="sm"
                            showValidation
                            oowopsNeeded={step.oowops_needed ?? 3}
                          />
                        )}
                      </div>
                    )}

                    {/* Complete button — only owner, only next step */}
                    {isOwner && isNext && (
                      <button onClick={() => completeStep(step)} className="mt-2 bg-orange-500 text-white text-xs px-3 py-1.5 rounded-full font-semibold hover:bg-orange-600 transition-colors">
                        Mark Complete ✓
                      </button>
                    )}
                  </div>
                </motion.li>
              );
            })}
          </ol>
        </div>

        {/* Resources */}
        {goal.ai_analysis?.resources?.length > 0 && (
          <div className="village-card">
            <h2 className="font-bold mb-3">📦 Resources Needed</h2>
            <div className="space-y-2">
              {goal.ai_analysis.resources.map((r: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{r.name}</p>
                    {r.category && <p className="text-xs text-gray-400">{r.category}</p>}
                  </div>
                  {r.estimated_cost > 0 && <span className="text-sm font-bold text-village-blue">${r.estimated_cost.toLocaleString()}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Share to Dream Line */}
        {isOwner && (
          <button onClick={shareGoalToDreamLine} disabled={sharing}
            className="w-full border border-purple-200 text-purple-700 rounded-2xl py-3 text-sm font-medium hover:bg-purple-50 transition-colors disabled:opacity-50">
            {shared ? '✅ Shared to Dream Line!' : sharing ? 'Sharing…' : '✨ Share Progress to Dream Line'}
          </button>
        )}

        {/* Roles needed */}
        {goal.ai_analysis?.roles_needed?.length > 0 && (
          <div className="village-card">
            <h2 className="font-bold mb-3">👥 Find These Villagers</h2>
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
