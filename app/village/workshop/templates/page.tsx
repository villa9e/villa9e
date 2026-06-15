'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CountdownOverlay } from '@/components/village/CountdownOverlay';

const CATEGORIES = ['All', 'Business', 'Health', 'Education', 'Creative', 'Financial', 'Personal'];

export default function GoalDNAPage() {
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [cloning, setCloning] = useState(false);
  const [cloned, setCloned] = useState(false);
  const [countdownGoalId, setCountdownGoalId] = useState<string | null>(null);
  const [realTemplates, setRealTemplates] = useState<any[]>([]);
  const [templateStats, setTemplateStats] = useState<Record<string, { cloneTotal: number; completionRate: number; avgWeeks: number | null }>>({});
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function loadTemplates() {
      const { data } = await supabase
        .from('goal_templates')
        .select('*, profiles(username, village_score)')
        .eq('is_public', true)
        .order('use_count', { ascending: false })
        .limit(20);
      if (data && data.length > 0) setRealTemplates(data);
    }
    loadTemplates();
    fetch('/api/templates/stats').then(r => r.ok ? r.json() : { stats: {} })
      .then(d => setTemplateStats(d.stats ?? {})).catch(() => {});
  }, []);

  const templates = realTemplates;

  // Real outcome data (from cloned goals) when available, else the
  // template's own estimates.
  function enrichedStats(t: any) {
    const s = templateStats[t.id];
    return {
      successRate: s ? s.completionRate : t.probability_score,
      successLabel: s ? 'completion rate' : 'est. success',
      timeline: s?.avgWeeks ?? t.estimated_weeks,
      timelineLabel: s?.avgWeeks ? 'avg actual' : 'est. weeks',
      uses: s?.cloneTotal ?? (t.uses ?? t.use_count ?? 0),
    };
  }

  const filtered = templates.filter(t =>
    (category === 'All' || t.category === category) &&
    (search === '' || t.title.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase()))
  );

  async function cloneTemplate(template: any) {
    setCloning(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCloning(false); return; }

    // Create goal from template
    const { data: goal } = await supabase.from('goals').insert({
      user_id: user.id,
      title: template.title,
      description: template.description,
      category: template.category,
      probability_score: template.probability_score,
      estimated_weeks: template.estimated_weeks,
      status: 'active',
      source_template_id: template.id,
    }).select().single();

    if (goal && template.steps_preview) {
      const steps = (template.steps_preview || template.steps || []).map((s: string, i: number) => ({
        goal_id:     goal.id,
        user_id:     user.id,
        title:       s,
        step_number: i + 1,
        status:      'pending',
      }));
      if (steps.length) await supabase.from('goal_steps').insert(steps);
    }

    // Increment use_count
    if (template.id) {
      await supabase.from('goal_templates').update({ use_count: (template.use_count ?? 0) + 1 }).eq('id', template.id);
    }

    setCloning(false);
    setCloned(true);
    if (goal?.id) {
      setTimeout(() => setCountdownGoalId(goal.id), 1200);
    } else {
      setTimeout(() => { setSelected(null); setCloned(false); }, 2000);
    }
  }

  return (
    <div className="min-h-screen bg-village-bg">
      <div className="bg-orange-500 text-white px-6 py-4 flex items-center gap-3">
        <Link href="/village/workshop" className="text-xl">←</Link>
        <span className="text-2xl">🧬</span>
        <div>
          <h1 className="text-xl font-bold leading-tight">Goal DNA</h1>
          <p className="text-orange-100 text-xs">Blueprints from completed goals · Clone in 1 tap</p>
        </div>
      </div>

      {/* Template detail modal */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 max-h-[85vh] overflow-y-auto"
            >
              {cloned ? (
                <div className="text-center py-8 space-y-3">
                  <div className="text-6xl animate-float">🧬</div>
                  <h2 className="text-2xl font-bold text-orange-600">Goal Cloned!</h2>
                  <p className="text-gray-500 text-sm">Your goal is ready in the Workshop.</p>
                </div>
              ) : (
                <>
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="text-xl font-bold flex-1">{selected.title}</h2>
                      <button onClick={() => setSelected(null)} className="text-gray-400 text-2xl leading-none">×</button>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{selected.category}</span>
                      <span className="text-xs text-amber-500">★ {selected.rating}</span>
                      <span className="text-xs text-gray-400">Used by {enrichedStats(selected).uses.toLocaleString()} villagers</span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600">{selected.description}</p>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-gray-50 rounded-xl p-2 text-center">
                      <p className="font-bold text-orange-600">{enrichedStats(selected).successRate}%</p>
                      <p className="text-xs text-gray-400">{enrichedStats(selected).successLabel}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-2 text-center">
                      <p className="font-bold">{enrichedStats(selected).timeline}w</p>
                      <p className="text-xs text-gray-400">{enrichedStats(selected).timelineLabel}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-2 text-center">
                      <p className="font-bold">{selected.steps_count ?? (selected.steps_preview?.length ?? 0)}</p>
                      <p className="text-xs text-gray-400">Steps</p>
                    </div>
                  </div>

                  <div>
                    <p className="font-bold text-sm mb-2">First Steps Preview</p>
                    <div className="space-y-2">
                      {(selected.steps_preview || []).slice(0, 4).map((step: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                          <span className="text-gray-600">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-400 border-t border-gray-100 pt-3">
                    <span>Created by</span>
                    <span className="font-medium text-gray-600">{selected.creator ?? selected.profiles?.username}</span>
                    <span>· Score {(selected.creator_score ?? selected.profiles?.village_score ?? 0).toLocaleString()}</span>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => cloneTemplate(selected)}
                      disabled={cloning}
                      className="w-full bg-orange-500 text-white rounded-full py-3 font-bold text-sm disabled:opacity-50 hover:bg-orange-600 transition-colors"
                    >
                      {cloning ? 'Cloning…' : '🧬 Quick Clone — Add Directly'}
                    </button>
                    <button
                      onClick={() => {
                        sessionStorage.setItem('spirit_template_customize', JSON.stringify({
                          title: selected.title,
                          description: selected.description,
                          steps: selected.steps_preview || selected.steps || [],
                        }));
                        router.push('/village/workshop/chat');
                      }}
                      className="w-full border border-orange-300 text-orange-600 rounded-full py-3 font-bold text-sm hover:bg-orange-50 transition-colors"
                    >
                      Customize with Spirit →
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <div className="village-card bg-gradient-to-br from-orange-50 to-amber-50">
          <p className="text-sm text-orange-800">
            <span className="font-bold">Goal DNA</span> are blueprints extracted from completed goals. Clone one to start with a proven roadmap — then customize it as your own.
          </p>
        </div>

        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search blueprints…"
          className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white shadow-sm" />

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${category === c ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-orange-300'}`}>
              {c}
            </button>
          ))}
        </div>

        {filtered.map((t, i) => (
          <motion.div key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="village-card cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelected(t)}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="font-bold">{t.title}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{t.category}</span>
                  <span className="text-xs text-amber-500">★ {t.rating}</span>
                  <span className="text-xs text-gray-400">{enrichedStats(t).uses.toLocaleString()} uses</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-orange-600">{enrichedStats(t).successRate}%</p>
                <p className="text-xs text-gray-400">{enrichedStats(t).successLabel}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2 line-clamp-2">{t.description}</p>
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span>📅 {enrichedStats(t).timeline}w</span>
                <span>📍 {t.steps_count ?? (t.steps_preview?.length ?? 0)} steps</span>
              </div>
              <button className="bg-orange-500 text-white rounded-full px-4 py-1.5 text-xs font-bold hover:bg-orange-600 transition-colors"
                onClick={e => { e.stopPropagation(); setSelected(t); }}>
                Clone
              </button>
            </div>
          </motion.div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">🧬</p>
            {templates.length === 0 ? (
              <>
                <p className="font-bold text-gray-600 mb-1">No blueprints yet</p>
                <p className="text-sm">Complete a goal in the Workshop and share it as a template — you'll earn VLG and help other villagers start with a proven roadmap.</p>
              </>
            ) : (
              <p>No blueprints found for "{search || category}"</p>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {countdownGoalId && (
          <CountdownOverlay onComplete={() => router.push(`/village/workshop/goal/${countdownGoalId}`)} />
        )}
      </AnimatePresence>
    </div>
  );
}
