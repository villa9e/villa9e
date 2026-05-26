'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { VillageHeader } from '@/components/village/VillageHeader';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

const CATEGORIES = ['All','Creative','Technical','Business','Trades','Wellness','Education','Spiritual'];

export default function TradingPostPage() {
  const [listings, setListings] = useState<any[]>([]);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', skill_offered: '', category: 'Creative', hourly_rate: '', deal_types: ['trade','pay'] });
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [contacting, setContacting] = useState<any>(null);
  const [contactMsg, setContactMsg] = useState('');
  const [contacted, setContacted] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadListings();
    supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id ?? null));
  }, [category, search]);

  async function loadListings() {
    let q = supabase.from('trading_post_listings').select('*, profiles(username, avatar_url, village_score, score_tier)').eq('is_active', true);
    if (category !== 'All') q = q.eq('category', category);
    if (search.trim()) q = q.ilike('skill_offered', `%${search}%`);
    q = q.order('average_rating', { ascending: false }).limit(30);
    const { data } = await q;
    setListings(data ?? []);
  }

  async function createListing() {
    if (!form.skill_offered.trim() || !form.title.trim()) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('trading_post_listings').insert({
        user_id:      user.id,
        title:        form.title,
        description:  form.description,
        skill_offered: form.skill_offered,
        category:     form.category,
        hourly_rate:  form.hourly_rate ? parseFloat(form.hourly_rate) : null,
        deal_types:   form.deal_types,
        is_active:    true,
      });
      setShowCreate(false);
      setForm({ title: '', description: '', skill_offered: '', category: 'Creative', hourly_rate: '', deal_types: ['trade','pay'] });
      loadListings();
    }
    setSaving(false);
  }

  async function sendContact() {
    if (!contacting || !contactMsg.trim()) return;
    const res = await fetch('/api/trading-post/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing_id: contacting.id, message: contactMsg }),
    });
    if (res.ok) { setContacted(true); setTimeout(() => { setContacting(null); setContactMsg(''); setContacted(false); }, 2500); }
  }

  const { theme } = useVillageTheme();
  const isNight  = theme === 'night';
  const bg       = isNight ? '#0A0B12' : '#F0FDF4';
  const cardBg   = isNight ? '#12152A' : '#FFFFFF';
  const border   = isNight ? '#1E2240' : '#BBF7D0';
  const textMain = isNight ? '#F0EBE0' : '#052E16';
  const textMute = isNight ? '#4A4F72' : '#166534';
  const accent   = isNight ? '#4ADE80' : '#16A34A';

  const dealColor = (type: string): React.CSSProperties => ({
    background: type === 'trade' ? (isNight ? '#0D2D1A' : '#DCFCE7') : type === 'pay' ? (isNight ? '#0D1A2D' : '#DBEAFE') : (isNight ? '#1A0D2D' : '#F3E8FF'),
    color: type === 'trade' ? '#16A34A' : type === 'pay' ? '#1D4ED8' : '#7C3AED',
  });

  return (
    <div className="min-h-screen" style={{ background: bg }}>
      <div className="sticky top-0 z-20 flex items-center gap-2 px-4 py-3 border-b"
        style={{ background: isNight ? '#0E1020' : accent, borderColor: isNight ? '#1E2240' : 'transparent' }}>
        <Link href="/village/map" className="text-xl" style={{ color: '#fff' }}>←</Link>
        <span className="text-2xl">🏪</span>
        <div className="flex-1">
          <h1 className="text-lg font-black text-white">Trading Post</h1>
          <p className="text-xs text-white/60">Skills marketplace — trade, hire, or network</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="rounded-full px-3 py-1 text-sm font-bold"
          style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
          + List Skill
        </button>
      </div>

      {/* Contact modal */}
      {contacting && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="w-full max-w-sm p-6 space-y-4 rounded-3xl"
            style={{ background: cardBg, border: `1px solid ${border}` }}>
            {contacted ? (
              <div className="text-center py-6 space-y-2">
                <div className="text-5xl animate-float">💬</div>
                <h2 className="text-xl font-bold text-green-600">Message Sent!</h2>
                <p className="text-sm text-gray-500">@{contacting.profiles?.username} will receive your inquiry.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="font-bold">Contact @{contacting.profiles?.username}</h2>
                  <button onClick={() => { setContacting(null); setContactMsg(''); }} className="text-gray-400 text-2xl">×</button>
                </div>
                <div className="bg-green-50 rounded-2xl p-3 text-xs text-green-700">
                  <p className="font-bold">{contacting.title}</p>
                  {contacting.hourly_rate && <p className="mt-0.5">${contacting.hourly_rate}/hr · {(contacting.deal_types ?? []).join(', ')}</p>}
                </div>
                <textarea value={contactMsg} onChange={e => setContactMsg(e.target.value)}
                  placeholder="Introduce yourself. What do you need? What can you offer in return?"
                  rows={4} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none" />
                <div className="flex gap-3">
                  <button onClick={() => { setContacting(null); setContactMsg(''); }}
                    className="flex-1 border border-gray-200 rounded-full py-3 text-gray-500 text-sm">Cancel</button>
                  <button onClick={sendContact} disabled={!contactMsg.trim()}
                    className="flex-1 bg-green-600 text-white rounded-full py-3 font-bold text-sm disabled:opacity-50">
                    Send Inquiry
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}

      {/* Create listing modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto rounded-3xl"
            style={{ background: cardBg, border: `1px solid ${border}` }}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">List Your Skill</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 text-2xl">×</button>
            </div>
            {[
              { label: 'Listing Title', key: 'title', placeholder: 'e.g. "I\'ll design your logo"' },
              { label: 'Skill Offered', key: 'skill_offered', placeholder: 'e.g. Graphic Design' },
              { label: 'Hourly Rate ($)', key: 'hourly_rate', placeholder: 'e.g. 50 (leave blank if trade-only)' },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="text-sm font-medium text-gray-700">{label}</label>
                <input value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>
            ))}
            <div>
              <label className="text-sm font-medium text-gray-700">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400">
                {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Describe your offer, portfolio, experience…" rows={3}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none" />
            </div>
            <button onClick={createListing} disabled={saving || !form.title.trim()} className="w-full bg-green-600 text-white rounded-full py-3 font-bold hover:bg-green-700 disabled:opacity-50">
              {saving ? 'Listing…' : '🏪 Post to Trading Post'}
            </button>
          </motion.div>
        </div>
      )}

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search skills (e.g. video editing, music production…)"
          className="w-full rounded-2xl px-4 py-3 text-sm focus:outline-none"
          style={{ background: cardBg, border: `1px solid ${border}`, color: textMain }} />

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
              style={{
                background: category === cat ? accent : cardBg,
                color:      category === cat ? '#fff'  : textMute,
                border:     `1px solid ${category === cat ? accent : border}`,
              }}>
              {cat}
            </button>
          ))}
        </div>

        {listings.map((l, i) => (
          <motion.div key={l.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="rounded-2xl p-4" style={{ background: cardBg, border: `1px solid ${border}` }}>
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: isNight ? '#1E2240' : '#DCFCE7' }}>
                {l.profiles?.avatar_url ? <img src={l.profiles.avatar_url} className="w-full h-full rounded-2xl object-cover" alt="" /> : '👤'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-sm" style={{ color: textMain }}>{l.title}</p>
                    <p className="text-xs" style={{ color: textMute }}>@{l.profiles?.username} · {l.skill_offered}</p>
                  </div>
                  {l.hourly_rate && <span className="font-bold text-sm flex-shrink-0" style={{ color: '#1877F2' }}>${l.hourly_rate}/h</span>}
                </div>
                {l.description && <p className="text-xs mt-1.5 line-clamp-2" style={{ color: textMute }}>{l.description}</p>}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {(l.deal_types ?? []).map((dt: string) => (
                    <span key={dt} className="text-xs px-2 py-0.5 rounded-full font-medium" style={dealColor(dt)}>{dt}</span>
                  ))}
                  {l.average_rating > 0 && <span className="text-xs text-amber-500">★ {l.average_rating.toFixed(1)}</span>}
                </div>
              </div>
            </div>
            {l.user_id !== userId && (
              <div className="flex gap-2 mt-3">
                {l.deal_types?.includes('trade') && (
                  <button onClick={() => setContacting(l)} className="flex-1 rounded-full py-2 text-xs font-bold"
                    style={{ background: isNight ? '#0D2D1A' : '#DCFCE7', color: '#16A34A' }}>🤝 Barter</button>
                )}
                {l.deal_types?.includes('pay') && (
                  <button onClick={() => setContacting(l)} className="flex-1 rounded-full py-2 text-xs font-bold"
                    style={{ background: isNight ? '#0D1A2D' : '#DBEAFE', color: '#1877F2' }}>💳 Hire</button>
                )}
                <button onClick={() => setContacting(l)} className="flex-1 rounded-full py-2 text-xs font-bold"
                  style={{ background: isNight ? '#1A0D2D' : '#F3E8FF', color: '#7C3AED' }}>💬 Network</button>
              </div>
            )}
          </motion.div>
        ))}

        {listings.length === 0 && (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">🏪</p>
            <p className="mb-4" style={{ color: textMute }}>No listings yet. Be the first villager to offer a skill!</p>
            <button onClick={() => setShowCreate(true)}
              className="rounded-full px-6 py-3 font-bold text-white"
              style={{ background: accent }}>
              + List My Skill
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
