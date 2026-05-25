'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function WorkshopPage() {
  const [goalInput, setGoalInput] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [savedMsg, setSavedMsg] = useState('');
  const supabase = createClient();

  useEffect(() => { loadGoals(); }, []);

  async function loadGoals() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('goals').select('*, goal_steps(id,status)').eq('user_id', user.id).eq('status', 'active').order('created_at', { ascending: false }).limit(10);
    if (data) setGoals(data);
  }

  async function analyzeGoal() {
    if (!goalInput.trim()) return;
    setAnalyzing(true);
    setAnalysis(null);
    try {
      const res = await fetch('/api/claude/goal-analysis', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: goalInput }),
      });
      const data = await res.json();
      setAnalysis(data);
    } catch (e) { console.error(e); }
    setAnalyzing(false);
  }

  async function saveGoal() {
    if (!analysis || !goalInput.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/goals/save', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: goalInput, ai_analysis: analysis, estimated_weeks: analysis.estimated_weeks }),
      });
      const data = await res.json();
      if (data.goal) {
        setSavedMsg(data.isFirstGoal ? '🎉 First goal! +25 VLG earned' : '✅ Goal saved to your GPS!');
        setGoalInput('');
        setAnalysis(null);
        loadGoals();
        setTimeout(() => setSavedMsg(''), 4000);
      }
    } catch (e) { console.error(e); }
    setSaving(false);
  }

  function stepsDone(g: any) { return g.goal_steps?.filter((s: any) => s.status === 'completed').length ?? 0; }
  function stepsTotal(g: any) { return g.goal_steps?.length ?? 0; }

  return (
    <div className="min-h-screen bg-village-bg">
      <div className="bg-orange-500 text-white px-6 py-4 flex items-center gap-3">
        <Link href="/village/map" className="text-xl">←</Link>
        <span className="text-2xl">🔨</span>
        <div>
          <h1 className="text-xl font-bold leading-tight">Workshop</h1>
          <p className="text-orange-100 text-xs">Goal GPS Engine</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Active goals */}
        {goals.length > 0 && (
          <div className="village-card">
            <h2 className="font-bold mb-3 text-sm text-gray-500 uppercase tracking-wide">Active Goals</h2>
            <div className="space-y-3">
              {goals.map(g => {
                const done = stepsDone(g); const total = stepsTotal(g);
                const pct = total ? Math.round((done / total) * 100) : 0;
                return (
                  <div key={g.id} className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="font-medium text-sm truncate">{g.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full village-gradient" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-400">{done}/{total} steps</span>
                        <span className="text-xs font-bold text-village-blue">{g.probability_score}%</span>
                      </div>
                    </div>
                    <Link href={`/village/workshop/goal/${g.id}`} className="text-xs text-village-blue font-medium hover:underline">
                      View →
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* New goal */}
        <div className="village-card">
          <h2 className="font-bold text-lg mb-1">Set a New Goal</h2>
          <p className="text-sm text-gray-500 mb-4">Spirit will build your full GPS plan — steps, resources, timeline, and probability score.</p>
          <textarea
            value={goalInput}
            onChange={e => setGoalInput(e.target.value)}
            placeholder="What would you like to achieve? Be specific. (e.g. 'Record and release my first EP on Spotify within 3 months')"
            rows={3}
            className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none text-sm"
          />
          <button
            onClick={analyzeGoal}
            disabled={analyzing || !goalInput.trim()}
            className="mt-3 bg-orange-500 hover:bg-orange-600 text-white rounded-full px-6 py-2.5 font-semibold w-full disabled:opacity-50 transition-colors"
          >
            {analyzing ? '🤖 Spirit is analyzing…' : '📡 Get My GPS Plan'}
          </button>
        </div>

        {/* Success message */}
        <AnimatePresence>
          {savedMsg && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center text-green-700 font-medium">
              {savedMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Analysis result */}
        {analysis && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Probability score */}
            <div className="village-card">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold">GPS Probability Score</h3>
                  <p className="text-xs text-gray-500">Live score — improves as you complete steps</p>
                </div>
                <span className={`text-3xl font-bold ${analysis.probability_score >= 70 ? 'text-green-600' : analysis.probability_score >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
                  {analysis.probability_score}%
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div className="h-3 rounded-full village-gradient" style={{ width: `${analysis.probability_score}%` }} />
              </div>
              {analysis.probability_reason && <p className="text-xs text-gray-500 mt-2">{analysis.probability_reason}</p>}
            </div>

            {/* Steps */}
            {analysis.steps?.length > 0 && (
              <div className="village-card">
                <h3 className="font-bold mb-3">📍 GPS Steps ({analysis.steps.length})</h3>
                <ol className="space-y-3">
                  {analysis.steps.map((step: any, i: number) => (
                    <li key={i} className="flex items-start gap-3 p-2 rounded-xl hover:bg-gray-50">
                      <span className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">{i + 1}</span>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{step.title}</p>
                        {step.description && <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>}
                        {step.estimated_hours && <p className="text-xs text-orange-500 mt-0.5">~{step.estimated_hours}h</p>}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Cost + timeline + roles */}
            <div className="grid grid-cols-3 gap-3">
              <div className="village-card text-center">
                <p className="text-xs text-gray-400">Est. Cost</p>
                <p className="text-lg font-bold text-orange-500">${analysis.estimated_cost?.toLocaleString() ?? '—'}</p>
              </div>
              <div className="village-card text-center">
                <p className="text-xs text-gray-400">Timeline</p>
                <p className="text-lg font-bold text-village-blue">{analysis.estimated_weeks ?? '—'}w</p>
              </div>
              <div className="village-card text-center">
                <p className="text-xs text-gray-400">Hrs/Week</p>
                <p className="text-lg font-bold text-purple-600">{analysis.weekly_hours_needed ?? '—'}h</p>
              </div>
            </div>

            {/* Roles needed */}
            {analysis.roles_needed?.length > 0 && (
              <div className="village-card">
                <h3 className="font-bold mb-2 text-sm">👥 Villagers You'll Need</h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.roles_needed.map((role: string, i: number) => (
                    <span key={i} className="bg-purple-50 text-purple-700 text-xs px-3 py-1 rounded-full border border-purple-100">{role}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Save */}
            <button
              onClick={saveGoal}
              disabled={saving}
              className="bg-village-blue hover:bg-village-blueDark text-white rounded-2xl px-6 py-4 font-bold w-full text-lg disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : '🗺️ Save Goal to My GPS'}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
