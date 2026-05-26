'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const MOCK_CAMPAIGNS = [
  {
    id: '1', title: 'Launch My Music Studio', goal_amount: 5000, raised_amount: 3200, backer_count: 47,
    days_left: 12, creator: 'Deon M.', creator_score: 1240, category: 'Creative',
    description: 'Turning my bedroom setup into a professional recording space to produce music for local artists.',
    probability_score: 81, goal_title: 'Build Professional Music Studio',
    perks: [{ amount: 25, label: 'Early Access', desc: 'First listen to 3 tracks' }, { amount: 100, label: 'Studio Session', desc: '1-hour recording session when we open' }],
  },
  {
    id: '2', title: 'Food Truck Launch Fund', goal_amount: 15000, raised_amount: 11400, backer_count: 203,
    days_left: 5, creator: 'Priya K.', creator_score: 2100, category: 'Business',
    description: 'My jerk chicken food truck needs a final push to cover licensing, equipment, and first month\'s location fees.',
    probability_score: 88, goal_title: 'Launch Jerk Chicken Food Truck',
    perks: [{ amount: 10, label: 'Supporter', desc: 'Name on the thank you board' }, { amount: 50, label: 'VIP', desc: '5 free meals when we launch' }],
  },
  {
    id: '3', title: 'Tech Bootcamp Tuition', goal_amount: 3000, raised_amount: 850, backer_count: 18,
    days_left: 30, creator: 'Jaylen T.', creator_score: 340, category: 'Education',
    description: 'I got accepted to a 12-week full stack coding bootcamp but need help covering the tuition. All completed goals shared publicly.',
    probability_score: 74, goal_title: 'Complete Full Stack Bootcamp',
    perks: [{ amount: 15, label: 'Believer', desc: 'Shoutout on Dream Line' }, { amount: 75, label: 'Mentor Credit', desc: 'One free session when I\'m employed' }],
  },
];

export default function CrowdfundingPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [contributing, setContributing] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [contributed, setContributed] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', goal_amount: '', category: 'Business', days: '30' });
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('crowdfunding_campaigns')
        .select('*, profiles(username, village_score), goals(title, probability_score)')
        .eq('status', 'active')
        .order('raised_amount', { ascending: false })
        .limit(20);
      if (data && data.length > 0) setCampaigns(data);
      else setCampaigns(MOCK_CAMPAIGNS);
    }
    load();
  }, []);

  const pct = (c: any) => Math.min(100, Math.round(((c.raised_amount ?? 0) / (c.goal_amount ?? 1)) * 100));

  async function contribute() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !contributing || !amount) return;
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    await supabase.from('crowdfunding_contributions').insert({
      campaign_id: contributing.id,
      backer_id: user.id,
      amount: amountNum,
      currency: 'USD',
    });

    await supabase.from('crowdfunding_campaigns')
      .update({
        raised_amount: (contributing.raised_amount ?? 0) + amountNum,
        backer_count: (contributing.backer_count ?? 0) + 1,
      })
      .eq('id', contributing.id);

    setContributed(true);
    setTimeout(() => { setContributing(null); setAmount(''); setContributed(false); }, 2500);
  }

  async function createCampaign() {
    setCreating(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCreating(false); return; }

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + parseInt(form.days));

    await supabase.from('crowdfunding_campaigns').insert({
      user_id: user.id,
      title: form.title,
      description: form.description,
      goal_amount: parseFloat(form.goal_amount),
      raised_amount: 0,
      backer_count: 0,
      status: 'active',
      deadline: deadline.toISOString(),
      currency: 'USD',
    });

    setCreating(false);
    setCreated(true);
    setTimeout(() => { setShowCreate(false); setCreated(false); setForm({ title: '', description: '', goal_amount: '', category: 'Business', days: '30' }); }, 2000);
  }

  return (
    <div className="min-h-screen bg-village-bg">
      <div className="bg-blue-600 text-white px-6 py-4 flex items-center gap-3">
        <Link href="/village/bank" className="text-xl">←</Link>
        <span className="text-2xl">🤝</span>
        <div className="flex-1">
          <h1 className="text-xl font-bold leading-tight">Crowdfunding</h1>
          <p className="text-blue-100 text-xs">Back a villager's goal · No platform fee</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="bg-white/20 rounded-full px-4 py-1.5 text-sm font-bold">
          + Campaign
        </button>
      </div>

      {/* Contribution modal */}
      <AnimatePresence>
        {contributing && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-4">
              {contributed ? (
                <div className="text-center py-6 space-y-3">
                  <div className="text-6xl animate-float">✊</div>
                  <h2 className="text-xl font-bold text-blue-600">OoWop! Contribution sent.</h2>
                  <p className="text-sm text-gray-500">You backed {contributing.creator ?? contributing.profiles?.username}. You both earn +15 $VLG.</p>
                </div>
              ) : (
                <>
                  <h2 className="font-bold text-lg">Back "{contributing.title}"</h2>
                  <div className="space-y-2">
                    {(contributing.perks || []).map((p: any, i: number) => (
                      <button key={i} onClick={() => setAmount(String(p.amount))}
                        className={`w-full text-left p-3 rounded-2xl border transition-colors ${amount === String(p.amount) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                        <div className="flex items-center justify-between">
                          <span className="font-bold">${p.amount}</span>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{p.label}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{p.desc}</p>
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Or enter custom amount ($)</label>
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
                      className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => { setContributing(null); setAmount(''); }} className="flex-1 border border-gray-200 rounded-full py-3 text-gray-500 text-sm">
                      Cancel
                    </button>
                    <button onClick={contribute} disabled={!amount || parseFloat(amount) <= 0}
                      className="flex-1 bg-blue-600 text-white rounded-full py-3 font-bold text-sm disabled:opacity-50">
                      Contribute ${amount || '0'}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create campaign modal */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              {created ? (
                <div className="text-center py-8 space-y-3">
                  <div className="text-6xl animate-float">🚀</div>
                  <h2 className="text-2xl font-bold text-blue-600">Campaign Live!</h2>
                  <p className="text-sm text-gray-500">Your campaign is now live. Share it to your Dream Line.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold text-lg">Start a Campaign</h2>
                    <button onClick={() => setShowCreate(false)} className="text-gray-400 text-2xl">×</button>
                  </div>
                  <div className="bg-blue-50 rounded-2xl p-3 text-xs text-blue-700">
                    Campaigns are tied to your goals. Backers can see your progress in real-time. villa9e takes 0% — Stripe handles payment processing.
                  </div>
                  {[
                    { label: 'Campaign Title', key: 'title', placeholder: 'e.g. Help me launch my food truck' },
                    { label: 'Funding Goal ($)', key: 'goal_amount', placeholder: 'e.g. 5000' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="text-xs font-medium text-gray-500">{f.label}</label>
                      <input value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                  ))}
                  <div>
                    <label className="text-xs font-medium text-gray-500">Category</label>
                    <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                      className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                      {['Business', 'Education', 'Creative', 'Health', 'Financial', 'Personal'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Campaign Duration</label>
                    <select value={form.days} onChange={e => setForm(p => ({ ...p, days: e.target.value }))}
                      className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                      {['15', '30', '60', '90'].map(d => <option key={d} value={d}>{d} days</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Tell your story</label>
                    <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                      placeholder="Why does this matter? What will you do with the funds?" rows={4}
                      className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
                  </div>
                  <button onClick={createCampaign} disabled={creating || !form.title || !form.goal_amount || !form.description}
                    className="w-full bg-blue-600 text-white rounded-full py-3 font-bold disabled:opacity-50 hover:bg-blue-700">
                    {creating ? 'Launching…' : '🚀 Launch Campaign'}
                  </button>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <div className="village-card bg-gradient-to-br from-blue-50 to-indigo-50">
          <p className="text-sm text-blue-800">
            <span className="font-bold">No platform fee.</span> village crowdfunding is powered by the community. 100% of what you raise goes to your goal. Backers earn $VLG for supporting.
          </p>
        </div>

        {campaigns.map((c, i) => (
          <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="village-card">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="font-bold">{c.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">by {c.creator ?? c.profiles?.username}</p>
              </div>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex-shrink-0">
                {c.days_left ?? 30}d left
              </span>
            </div>

            <p className="text-xs text-gray-500 mt-2 line-clamp-2">{c.description}</p>

            {/* Progress bar */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span className="font-bold text-blue-600">${(c.raised_amount ?? 0).toLocaleString()} raised</span>
                <span>of ${(c.goal_amount ?? 0).toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all"
                  style={{ width: `${pct(c)}%` }} />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{pct(c)}% funded</span>
                <span>{c.backer_count ?? 0} backers</span>
              </div>
            </div>

            {c.probability_score && (
              <div className="mt-2 text-xs text-gray-400">
                Goal GPS: <span className="font-bold text-orange-500">{c.probability_score}%</span> probability of completion
              </div>
            )}

            <button onClick={() => setContributing(c)}
              className="mt-3 w-full bg-blue-600 text-white rounded-full py-2.5 text-sm font-bold hover:bg-blue-700 transition-colors">
              Back This Goal
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
