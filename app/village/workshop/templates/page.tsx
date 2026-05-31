'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const CATEGORIES = ['All', 'Business', 'Health', 'Education', 'Creative', 'Financial', 'Personal'];

// Mock DNA templates until real ones are generated from completed goals
const MOCK_TEMPLATES = [
  {
    id: '1', title: 'Launch a Freelance Business', category: 'Business', uses: 312,
    probability_score: 78, estimated_weeks: 8, steps_count: 12, rating: 4.8,
    creator: 'Amara W.', creator_score: 2340,
    description: 'From zero to first paying client. Covers positioning, portfolio, outreach, and pricing.',
    steps_preview: ['Define your niche and ideal client', 'Build a 3-project portfolio', 'Set up Stripe and contracts', 'Send 20 cold outreach messages'],
    tags: ['freelance', 'income', 'business'],
  },
  {
    id: '2', title: 'Get to 185 lbs (Muscle Cut)', category: 'Health', uses: 891,
    probability_score: 82, estimated_weeks: 16, steps_count: 18, rating: 4.9,
    creator: 'Marcus C.', creator_score: 1870,
    description: 'Structured cut program. Includes meal prep, progressive overload, and weekly check-in protocol.',
    steps_preview: ['Calculate TDEE and set calorie deficit', 'Build 4-day split training schedule', 'Meal prep Sunday + Wednesday', 'Weekly body measurements'],
    tags: ['fitness', 'health', 'weight'],
  },
  {
    id: '3', title: 'Publish My First Book', category: 'Creative', uses: 147,
    probability_score: 71, estimated_weeks: 24, steps_count: 22, rating: 4.7,
    creator: 'Zara O.', creator_score: 1120,
    description: 'Outline to published. Covers daily writing, editing, ISBN, self-publishing vs agent route.',
    steps_preview: ['Write detailed chapter outline', '1,000 words/day writing habit', 'Hire developmental editor', 'Submit to 10 literary agents OR self-publish'],
    tags: ['writing', 'creative', 'publishing'],
  },
  {
    id: '4', title: 'Pay Off $15k in Debt', category: 'Financial', uses: 2104,
    probability_score: 85, estimated_weeks: 52, steps_count: 14, rating: 4.9,
    creator: 'James R.', creator_score: 3200,
    description: 'Debt snowball method. Budgeting, side hustle integration, automatic payments.',
    steps_preview: ['List all debts smallest to largest', 'Cut 3 recurring subscriptions', 'Start $500/month debt payment', 'Find one side income stream'],
    tags: ['finance', 'debt', 'money'],
  },
  {
    id: '5', title: 'Learn Spanish in 6 Months', category: 'Education', uses: 436,
    probability_score: 74, estimated_weeks: 26, steps_count: 16, rating: 4.6,
    creator: 'Camila T.', creator_score: 890,
    description: 'A1 to B1. Daily immersion schedule, speaking partner system, vocabulary spaced repetition.',
    steps_preview: ['30 min Duolingo + Anki daily', 'Find a language exchange partner', 'Watch 1 Spanish show per week', 'Complete 2 italki sessions/month'],
    tags: ['language', 'education', 'skills'],
  },
  {
    id: '6', title: 'Build a Daily Meditation Practice', category: 'Personal', uses: 678,
    probability_score: 88, estimated_weeks: 8, steps_count: 10, rating: 4.9,
    creator: 'Spirit AI', creator_score: 9999,
    description: 'Zero to 20 minutes daily. Progressive habit building with accountability check-ins.',
    steps_preview: ['Start with 5 minutes every morning', 'Download Insight Timer or Waking Up', 'Journal 3 lines post-meditation', 'Find a sitting spot and protect it'],
    tags: ['mindfulness', 'wellness', 'habits'],
  },
];

export default function GoalDNAPage() {
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [cloning, setCloning] = useState(false);
  const [cloned, setCloned] = useState(false);
  const [realTemplates, setRealTemplates] = useState<any[]>([]);
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
  }, []);

  const templates = realTemplates.length > 0 ? realTemplates : MOCK_TEMPLATES;

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
    if (template.id && !MOCK_TEMPLATES.find(m => m.id === template.id)) {
      await supabase.from('goal_templates').update({ use_count: (template.use_count ?? 0) + 1 }).eq('id', template.id);
    }

    setCloning(false);
    setCloned(true);
    setTimeout(() => { setSelected(null); setCloned(false); }, 2000);
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
                      <span className="text-xs text-gray-400">Used by {(selected.uses ?? selected.use_count ?? 0).toLocaleString()} villagers</span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600">{selected.description}</p>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-gray-50 rounded-xl p-2 text-center">
                      <p className="font-bold text-orange-600">{selected.probability_score}%</p>
                      <p className="text-xs text-gray-400">Success rate</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-2 text-center">
                      <p className="font-bold">{selected.estimated_weeks}w</p>
                      <p className="text-xs text-gray-400">Avg timeline</p>
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
                      onClick={() => router.push(`/village/workshop?goal=${encodeURIComponent(selected.title)}`)}
                      className="w-full border border-orange-300 text-orange-600 rounded-full py-3 font-bold text-sm hover:bg-orange-50 transition-colors"
                    >
                      Customize First →
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
                  <span className="text-xs text-gray-400">{(t.uses ?? t.use_count ?? 0).toLocaleString()} uses</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-orange-600">{t.probability_score}%</p>
                <p className="text-xs text-gray-400">success</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2 line-clamp-2">{t.description}</p>
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span>📅 {t.estimated_weeks}w</span>
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
            <p>No blueprints found for "{search || category}"</p>
          </div>
        )}
      </div>
    </div>
  );
}
