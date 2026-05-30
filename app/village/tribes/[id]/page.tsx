'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { OoWopButton } from '@/components/village/OoWopButton';
import { VillageSound } from '@/lib/sounds/village';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

type Tab = 'chat' | 'goals' | 'tasks' | 'members' | 'deals' | 'docs' | 'whiteboard' | 'calendar' | 'video';

// ─── Tribe Deal Creator ────────────────────────────────────────────────────────
function TribeDealCreator({ tribeId, userId, isNight, cardBg, border, textMain, textMute, accent, onCreated }: {
  tribeId: string; userId: string | null; isNight: boolean;
  cardBg: string; border: string; textMain: string; textMute: string; accent: string;
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', skill_offered: '', description: '', hourly_rate: '', deal_types: 'trade' });
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  async function create() {
    if (!form.title.trim() || !form.skill_offered.trim() || !userId) return;
    setSaving(true);
    await (supabase as any).from('trading_post_listings').insert({
      user_id:       userId,
      title:         form.title,
      description:   form.description,
      skill_offered: form.skill_offered,
      category:      'Tribe',
      hourly_rate:   form.hourly_rate ? parseFloat(form.hourly_rate) : null,
      deal_types:    [form.deal_types],
      is_active:     true,
      tribe_id:      tribeId,
    });
    setSaving(false);
    setOpen(false);
    setForm({ title: '', skill_offered: '', description: '', hourly_rate: '', deal_types: 'trade' });
    onCreated();
    VillageSound.tap();
  }

  const inputStyle: React.CSSProperties = {
    background: isNight ? '#0A0B12' : '#FFF0F8',
    border: `1px solid ${border}`,
    color: textMain,
    width: '100%',
    borderRadius: '12px',
    padding: '10px 14px',
    fontSize: '13px',
    outline: 'none',
  };

  return (
    <div>
      {!open ? (
        <button onClick={() => setOpen(true)}
          className="w-full py-3.5 rounded-2xl text-sm font-black text-white transition-all"
          style={{ background: `linear-gradient(135deg, ${accent}, #9D174D)` }}>
          + Offer a Skill or Service to Your Tribe
        </button>
      ) : (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-4 space-y-3"
          style={{ background: cardBg, border: `1px solid ${accent}50` }}>
          <div className="flex items-center justify-between mb-1">
            <p className="font-black text-sm" style={{ color: textMain }}>Create a Tribe Offer</p>
            <button onClick={() => setOpen(false)} style={{ color: textMute }}>×</button>
          </div>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Offer title (e.g. 'Logo Design for tribe members')" style={inputStyle} />
          <input value={form.skill_offered} onChange={e => setForm(f => ({ ...f, skill_offered: e.target.value }))}
            placeholder="Skill offered (e.g. Graphic Design)" style={inputStyle} />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Details about what you're offering…" rows={2}
            style={{ ...inputStyle, resize: 'none' }} />
          <div className="flex gap-2">
            <input value={form.hourly_rate} onChange={e => setForm(f => ({ ...f, hourly_rate: e.target.value }))}
              placeholder="$/h (optional)" type="number" style={{ ...inputStyle, width: '40%' }} />
            <select value={form.deal_types} onChange={e => setForm(f => ({ ...f, deal_types: e.target.value }))}
              style={{ ...inputStyle, width: '60%' }}>
              <option value="trade">🤝 Skill Trade</option>
              <option value="pay">💳 Paid Service</option>
              <option value="collab">💬 Collaboration</option>
            </select>
          </div>
          <button onClick={create} disabled={saving || !form.title.trim()}
            className="w-full py-3 rounded-2xl text-sm font-black text-white disabled:opacity-50"
            style={{ background: accent }}>
            {saving ? 'Posting…' : '🤝 Post to Tribe'}
          </button>
        </motion.div>
      )}
    </div>
  );
}

export default function TribeDetailPage({ params }: { params: { id: string } }) {
  const [tribe, setTribe]       = useState<any>(null);
  const [members, setMembers]   = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [tasks, setTasks]       = useState<any[]>([]);
  const [sharedGoals, setSharedGoals] = useState<any[]>([]);
  const [deals, setDeals]       = useState<any[]>([]);
  const [posts, setPosts]       = useState<any[]>([]);
  const [userId, setUserId]     = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('contributor');
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [newMsg, setNewMsg]     = useState('');
  const [sending, setSending]   = useState(false);
  const [newTask, setNewTask]   = useState('');
  const [inviteUser, setInviteUser] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState('');
  const [givenOoWops, setGivenOoWops] = useState<Set<string>>(new Set());
  const [showInvite, setShowInvite] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';

  const bg       = isNight ? '#0A0B12' : '#FFF0F8';
  const cardBg   = isNight ? '#12152A' : '#FFFFFF';
  const border   = isNight ? '#1E2240' : '#FBCFE8';
  const textMain = isNight ? '#F0EBE0' : '#2D0D1F';
  const textMute = isNight ? '#4A4F72' : '#9D174D';
  const accent   = isNight ? '#F472B6' : '#DB2777';

  useEffect(() => {
    load();
    const channel = supabase.channel(`tribe_${params.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tribe_messages', filter: `tribe_id=eq.${params.id}` },
        p => {
          setMessages(prev => [...prev, p.new as any]);
          VillageSound.notification();
          setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [params.id]);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id ?? null);

    const [{ data: t }, { data: m }, { data: msgs }, { data: tk }, { data: po }] = await Promise.all([
      (supabase as any).from('tribes').select('*').eq('id', params.id).single(),
      (supabase as any).from('tribe_members').select('*, profiles(username, village_score, score_tier, personality_type)').eq('tribe_id', params.id),
      (supabase as any).from('tribe_messages').select('*, profiles(username, avatar_url)').eq('tribe_id', params.id).order('created_at').limit(60),
      (supabase as any).from('tribe_tasks').select('*').eq('tribe_id', params.id).order('created_at', { ascending: false }).limit(30),
      (supabase as any).from('dream_line_posts').select('*').eq('tribe_id', params.id).order('created_at', { ascending: false }).limit(10),
    ]);

    setTribe(t);
    setMembers(m ?? []);
    setMessages(msgs ?? []);
    setTasks(tk ?? []);
    setPosts(po ?? []);

    if (user && m) {
      const myMembership = m.find((mem: any) => mem.user_id === user.id);
      setUserRole(myMembership?.role ?? 'contributor');
    }

    // Load shared goals (goals where this tribe is listed)
    const memberIds = (m ?? []).map((mem: any) => mem.user_id);
    if (memberIds.length > 0) {
      const { data: g } = await (supabase as any).from('goals')
        .select('*, goal_steps(status), profiles(username)')
        .in('user_id', memberIds).eq('status', 'active')
        .order('created_at', { ascending: false }).limit(10);
      setSharedGoals(g ?? []);
    }

    // Load tribe deals from Trading Post (members' listings)
    if (memberIds.length > 0) {
      const { data: d } = await (supabase as any).from('trading_post_listings')
        .select('*, profiles(username, village_score)')
        .in('user_id', memberIds).eq('is_active', true).limit(8);
      setDeals(d ?? []);
    }

    // Which posts has current user OoWop'd?
    if (user && po) {
      const postIds = po.map((p: any) => p.id);
      if (postIds.length > 0) {
        const { data: ow } = await (supabase as any).from('oowops').select('post_id').eq('giver_id', user.id).in('post_id', postIds);
        if (ow) setGivenOoWops(new Set(ow.map((o: any) => o.post_id)));
      }
    }

    setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'auto' }), 200);
  }

  async function sendMessage() {
    if (!newMsg.trim() || sending || !userId) return;
    setSending(true);
    VillageSound.tap();
    await (supabase as any).from('tribe_messages').insert({
      tribe_id: params.id, user_id: userId, content: newMsg.trim(),
    });
    setNewMsg('');
    setSending(false);
  }

  async function addTask() {
    if (!newTask.trim() || !userId) return;
    const { data } = await (supabase as any).from('tribe_tasks').insert({
      tribe_id: params.id, created_by: userId, title: newTask.trim(), status: 'pending',
    }).select().single();
    if (data) setTasks(prev => [data, ...prev]);
    setNewTask('');
  }

  async function toggleTask(task: any) {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    await (supabase as any).from('tribe_tasks').update({ status: newStatus }).eq('id', task.id);
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    if (newStatus === 'completed') VillageSound.stepComplete();
  }

  async function inviteMember() {
    if (!inviteUser.trim() || inviting) return;
    setInviting(true);
    const { data: target } = await (supabase as any).from('profiles').select('id').eq('username', inviteUser.trim()).single();
    if (!target) { setInviteMsg('Villager not found.'); setInviting(false); return; }
    await (supabase as any).from('tribe_members').upsert(
      { tribe_id: params.id, user_id: target.id, role: 'contributor' },
      { onConflict: 'tribe_id,user_id' }
    );
    await (supabase as any).from('notifications').insert({
      user_id: target.id, type: 'goal_step',
      title: `You've been invited to the "${tribe?.name}" tribe`,
      body: 'Tap to join and connect with your tribe.',
      reference_id: params.id, reference_type: 'tribe',
    });
    setInviteMsg(`@${inviteUser} invited!`);
    setInviteUser('');
    setInviting(false);
    load();
    setTimeout(() => setInviteMsg(''), 3000);
  }

  async function oowopPost(post: any) {
    if (!userId || givenOoWops.has(post.id)) return;
    await (supabase as any).from('oowops').insert({ post_id: post.id, giver_id: userId, receiver_id: post.user_id });
    setGivenOoWops(prev => new Set([...prev, post.id]));
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, oowop_count: (p.oowop_count || 0) + 1 } : p));
  }

  if (!tribe) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: bg }}>
      <div className="text-4xl animate-float">👥</div>
    </div>
  );

  const isFounder = userRole === 'founder' || userRole === 'admin';
  const TABS: [Tab, string][] = [
    ['chat','💬'], ['goals','🎯'], ['tasks','✅'], ['members','👥'], ['deals','🤝'],
    ['docs','📄'], ['whiteboard','🖊️'], ['calendar','📅'], ['video','📹'],
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: bg }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-3 flex items-center gap-2 border-b"
        style={{ background: isNight ? '#0E1020' : accent, borderColor: isNight ? '#1E2240' : 'transparent' }}>
        <Link href="/village/tribes" className="text-xl text-white">←</Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-black text-white text-base truncate">{tribe.name}</h1>
          <p className="text-white/60 text-xs">{members.length} members</p>
        </div>
        {isFounder && (
          <button onClick={() => setShowInvite(s => !s)}
            className="rounded-full px-3 py-1 text-xs font-bold"
            style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
            + Invite
          </button>
        )}
      </div>

      {/* Invite bar */}
      <AnimatePresence>
        {showInvite && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden" style={{ background: isNight ? '#12152A' : '#FDF2F8', borderBottom: `1px solid ${border}` }}>
            <div className="flex gap-2 px-4 py-3 max-w-2xl mx-auto">
              <input value={inviteUser} onChange={e => setInviteUser(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && inviteMember()}
                placeholder="Enter @username to invite…"
                className="flex-1 rounded-xl px-3 py-2 text-sm focus:outline-none"
                style={{ background: isNight ? '#0A0B12' : '#fff', border: `1px solid ${border}`, color: textMain }} />
              <button onClick={inviteMember} disabled={inviting || !inviteUser.trim()}
                className="rounded-xl px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                style={{ background: accent }}>
                {inviting ? '…' : 'Invite'}
              </button>
            </div>
            {inviteMsg && <p className="text-xs text-center pb-2" style={{ color: inviteMsg.includes('not') ? '#DC2626' : '#16A34A' }}>{inviteMsg}</p>}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab bar */}
      <div className="flex border-b" style={{ background: cardBg, borderColor: border }}>
        {TABS.map(([tab, icon]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="flex-1 py-3 text-sm font-bold transition-all"
            style={{
              color: activeTab === tab ? accent : textMute,
              borderBottom: activeTab === tab ? `2px solid ${accent}` : '2px solid transparent',
            }}>
            {icon}
          </button>
        ))}
      </div>

      {/* CHAT */}
      {activeTab === 'chat' && (
        <div className="flex flex-col flex-1 max-w-2xl mx-auto w-full">
          <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-20">
            {messages.map(msg => {
              const isMe = msg.user_id === userId;
              return (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 mt-1"
                    style={{ background: isNight ? '#1E2240' : '#FCE7F3', color: accent }}>
                    {(msg.profiles?.username?.[0] ?? '?').toUpperCase()}
                  </div>
                  <div className={`max-w-[72%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    {!isMe && <p className="text-xs mb-0.5" style={{ color: textMute }}>@{msg.profiles?.username}</p>}
                    <div className="rounded-2xl px-4 py-2.5 text-sm"
                      style={isMe
                        ? { background: accent, color: '#fff', borderBottomRightRadius: '4px' }
                        : { background: cardBg, border: `1px solid ${border}`, color: textMain, borderBottomLeftRadius: '4px' }
                      }>
                      {msg.content}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: isNight ? '#2A2F4A' : '#E9D5FF' }}>
                      {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              );
            })}
            {messages.length === 0 && (
              <div className="text-center py-12" style={{ color: textMute }}>
                <p className="text-3xl mb-2">💬</p>
                <p className="text-sm">The tribe is quiet. Say something!</p>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>
          <div className="fixed bottom-0 left-0 right-0 border-t px-4 py-3"
            style={{ background: cardBg, borderColor: border }}>
            <div className="max-w-2xl mx-auto flex gap-2">
              <input value={newMsg} onChange={e => setNewMsg(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Message the tribe…"
                className="flex-1 rounded-2xl px-4 py-2.5 text-sm focus:outline-none"
                style={{ background: isNight ? '#0A0B12' : '#FDF2F8', border: `1px solid ${border}`, color: textMain }} />
              <button onClick={sendMessage} disabled={!newMsg.trim() || sending}
                className="rounded-2xl px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                style={{ background: accent }}>
                ↑
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GOALS */}
      {activeTab === 'goals' && (
        <div className="max-w-2xl mx-auto w-full p-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: textMute }}>Active Goals in This Tribe</p>
          {sharedGoals.length === 0 && (
            <div className="text-center py-10" style={{ color: textMute }}>
              <p className="text-3xl mb-2">🎯</p>
              <p className="text-sm">No active goals yet.</p>
              <Link href="/village/workshop" className="text-sm font-bold mt-2 inline-block" style={{ color: accent }}>
                Set a goal →
              </Link>
            </div>
          )}
          {sharedGoals.map(goal => {
            const done  = goal.goal_steps?.filter((s: any) => s.status === 'completed').length ?? 0;
            const total = goal.goal_steps?.length ?? 0;
            const pct   = total ? Math.round((done / total) * 100) : goal.progress_percentage ?? 0;
            return (
              <Link key={goal.id} href={`/village/workshop/goal/${goal.id}`}>
                <div className="rounded-2xl p-4" style={{ background: cardBg, border: `1px solid ${border}` }}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-bold text-sm" style={{ color: textMain }}>{goal.title}</p>
                      <p className="text-xs" style={{ color: textMute }}>by @{goal.profiles?.username}</p>
                    </div>
                    <span className="font-black text-sm" style={{ color: '#1877F2' }}>{goal.probability_score ?? 0}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full" style={{ background: isNight ? '#1E2240' : '#FCE7F3' }}>
                      <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: accent }} />
                    </div>
                    <span className="text-xs" style={{ color: textMute }}>{done}/{total} steps</span>
                  </div>
                </div>
              </Link>
            );
          })}

          {/* Tribe Dream Line posts */}
          {posts.length > 0 && (
            <>
              <p className="text-xs font-bold uppercase tracking-wider pt-2" style={{ color: textMute }}>Tribe Dream Line</p>
              {posts.map(post => (
                <div key={post.id} className="rounded-2xl p-4" style={{ background: cardBg, border: `1px solid ${border}` }}>
                  <p className="text-sm leading-relaxed mb-2" style={{ color: textMain }}>{post.content}</p>
                  <div className="flex items-center justify-between">
                    <OoWopButton count={post.oowop_count || 0} hasGiven={givenOoWops.has(post.id)} onGive={() => oowopPost(post)} size="sm" />
                    <span className="text-xs" style={{ color: textMute }}>{new Date(post.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* TASKS — Kanban board */}
      {activeTab === 'tasks' && (
        <div className="max-w-2xl mx-auto w-full p-4 space-y-4">
          {/* Quick-add */}
          <div className="flex gap-2">
            <input value={newTask} onChange={e => setNewTask(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTask()}
              placeholder="Add a tribe task and press Enter…"
              className="flex-1 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
              style={{ background: isNight ? '#0A0B12' : '#FDF2F8', border: `1px solid ${border}`, color: textMain }} />
            <button onClick={addTask} disabled={!newTask.trim()}
              className="rounded-xl px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              style={{ background: accent }}>Add</button>
          </div>

          {/* Sprint progress */}
          {tasks.length > 0 && (
            <div className="flex items-center gap-3 text-xs" style={{ color: textMute }}>
              <span className="font-bold">{tasks.filter(t => t.status === 'completed').length}/{tasks.length} done</span>
              <div className="flex-1 h-1.5 rounded-full" style={{ background: isNight ? '#1E2240' : '#FCE7F3' }}>
                <div className="h-1.5 rounded-full transition-all" style={{ width: `${tasks.length ? (tasks.filter(t => t.status === 'completed').length / tasks.length) * 100 : 0}%`, background: accent }} />
              </div>
              <span>{Math.round(tasks.filter(t => t.status === 'completed').length / Math.max(1, tasks.length) * 100)}%</span>
            </div>
          )}

          {/* Kanban columns */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Todo', status: 'pending',     color: isNight ? '#1E2240' : '#EEF2FF', badge: '#6366F1' },
              { label: 'Doing', status: 'in_progress', color: isNight ? '#1A1505' : '#FFFBEB', badge: '#F59E0B' },
              { label: 'Done',  status: 'completed',  color: isNight ? '#0D2D1A' : '#F0FDF4', badge: '#22C55E' },
            ].map(col => {
              const colTasks = tasks.filter(t =>
                col.status === 'in_progress'
                  ? t.status !== 'pending' && t.status !== 'completed'
                  : t.status === col.status
              );
              return (
                <div key={col.status}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: col.badge }} />
                    <p className="text-xs font-bold" style={{ color: textMute }}>{col.label}</p>
                    <span className="ml-auto text-xs font-black rounded-full px-1.5 py-0.5"
                      style={{ background: col.color, color: col.badge }}>{colTasks.length}</span>
                  </div>
                  <div className="space-y-2 min-h-[80px] rounded-2xl p-2" style={{ background: col.color }}>
                    {colTasks.map(task => (
                      <div key={task.id} className="rounded-xl p-2.5 text-xs space-y-2"
                        style={{ background: cardBg, border: `1px solid ${border}` }}>
                        <p style={{ color: textMain, fontWeight: 600, lineHeight: 1.4 }}
                          className={task.status === 'completed' ? 'line-through opacity-50' : ''}>
                          {task.title}
                        </p>
                        {/* Status cycle buttons */}
                        <div className="flex gap-1">
                          {col.status !== 'pending' && (
                            <button onClick={() => {
                              (supabase as any).from('tribe_tasks').update({ status: 'pending' }).eq('id', task.id);
                              setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'pending' } : t));
                            }} className="text-xs px-1.5 py-0.5 rounded-lg" style={{ background: isNight ? '#1E2240' : '#EEF2FF', color: '#6366F1' }}>
                              ← Todo
                            </button>
                          )}
                          {col.status !== 'in_progress' && (
                            <button onClick={() => {
                              const next = col.status === 'pending' ? 'in_progress' : 'completed';
                              (supabase as any).from('tribe_tasks').update({ status: next }).eq('id', task.id);
                              setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: next } : t));
                            }} className="text-xs px-1.5 py-0.5 rounded-lg" style={{
                              background: col.status === 'pending' ? (isNight ? '#1A1505' : '#FFFBEB') : (isNight ? '#0D2D1A' : '#F0FDF4'),
                              color: col.status === 'pending' ? '#F59E0B' : '#22C55E',
                            }}>
                              {col.status === 'pending' ? 'Start →' : 'Done ✓'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {colTasks.length === 0 && (
                      <p className="text-center py-3 text-xs" style={{ color: textMute }}>Empty</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MEMBERS */}
      {activeTab === 'members' && (
        <div className="max-w-2xl mx-auto w-full p-4 space-y-2">
          {members.map(m => (
            <Link key={m.user_id} href={`/villager/${m.profiles?.username}`}>
              <div className="flex items-center gap-3 rounded-2xl p-4 transition-all"
                style={{ background: cardBg, border: `1px solid ${border}` }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0"
                  style={{ background: isNight ? '#1E2240' : '#FCE7F3', color: accent }}>
                  {(m.profiles?.username?.[0] ?? '?').toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm" style={{ color: textMain }}>@{m.profiles?.username}</p>
                  <p className="text-xs capitalize" style={{ color: textMute }}>
                    {m.role ?? 'Member'} · {m.profiles?.score_tier ?? 'Seedling'}
                  </p>
                </div>
                <span className="font-black text-sm" style={{ color: '#1877F2' }}>{m.profiles?.village_score ?? 0}</span>
                <span className="text-gray-300 text-lg">›</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* DEALS */}
      {activeTab === 'deals' && (
        <div className="max-w-2xl mx-auto w-full p-4 space-y-3">
          {/* Offer creation CTA */}
          <TribeDealCreator
            tribeId={params.id}
            userId={userId}
            isNight={isNight}
            cardBg={cardBg}
            border={border}
            textMain={textMain}
            textMute={textMute}
            accent={accent}
            onCreated={() => load()}
          />

          {deals.length === 0 ? (
            <div className="text-center py-10" style={{ color: textMute }}>
              <p className="text-3xl mb-2">🤝</p>
              <p className="text-sm mb-1">No deals in this tribe yet.</p>
              <p className="text-xs">Offer a skill or service above — your tribe is waiting.</p>
            </div>
          ) : (
            <>
              <p className="text-xs font-bold uppercase tracking-widest pt-2" style={{ color: textMute }}>
                Tribe Offers ({deals.length})
              </p>
              {deals.map(deal => (
                <motion.div key={deal.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl p-4"
                  style={{ background: cardBg, border: `1px solid ${border}` }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{ background: 'linear-gradient(135deg,#1877F2,#7C3AED)' }}>
                          {deal.profiles?.username?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <div>
                          <p className="font-black text-sm" style={{ color: textMain }}>{deal.title}</p>
                          <p className="text-xs" style={{ color: textMute }}>@{deal.profiles?.username} · {deal.skill_offered}</p>
                        </div>
                      </div>
                    </div>
                    {deal.hourly_rate && (
                      <span className="font-black text-sm flex-shrink-0 px-2.5 py-1 rounded-full"
                        style={{ background: 'rgba(24,119,242,0.1)', color: '#60a5fa' }}>
                        ${deal.hourly_rate}/h
                      </span>
                    )}
                  </div>
                  {deal.description && (
                    <p className="text-xs mt-2 leading-relaxed line-clamp-2" style={{ color: textMute }}>{deal.description}</p>
                  )}
                  <div className="flex gap-2 mt-3">
                    {(deal.deal_types ?? []).map((dt: string) => (
                      <span key={dt} className="px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{
                          background: dt === 'trade' ? (isNight ? '#0D2D1A' : '#DCFCE7') : dt === 'pay' ? (isNight ? '#0D1A2D' : '#DBEAFE') : (isNight ? '#1A0D2D' : '#F3E8FF'),
                          color: dt === 'trade' ? '#16A34A' : dt === 'pay' ? '#1877F2' : '#7C3AED',
                        }}>
                        {dt === 'trade' ? '🤝 Trade' : dt === 'pay' ? '💳 Hire' : '💬 Network'}
                      </span>
                    ))}
                    <div className="flex-1" />
                    {deal.user_id !== userId && (
                      <button
                        onClick={async () => {
                          await fetch('/api/trading-post/contact', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              listing_id: deal.id,
                              message: `Hey! I saw your offer in our tribe "${tribe?.name}" and I'm interested in collaborating.`,
                            }),
                          });
                          alert('Message sent! Check your messages.');
                        }}
                        className="px-3 py-1 rounded-full text-xs font-bold text-white transition-all"
                        style={{ background: accent }}>
                        Contact
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </>
          )}
        </div>
      )}

      {/* ── DOCS: Collaborative document editor ── */}
      {activeTab === 'docs' && (
        <div className="flex-1 flex flex-col" style={{ minHeight: 0 }}>
          {/* Doc toolbar */}
          <div className="flex items-center gap-1 px-3 py-2 border-b" style={{ background: cardBg, borderColor: border }}>
            {[
              { cmd: 'bold',        icon: '𝐁', label: 'Bold' },
              { cmd: 'italic',      icon: '𝐼', label: 'Italic' },
              { cmd: 'underline',   icon: 'U', label: 'Underline' },
              { cmd: 'strikeThrough', icon: 'S̶', label: 'Strike' },
            ].map(({ cmd, icon, label }) => (
              <button key={cmd}
                onMouseDown={e => { e.preventDefault(); document.execCommand(cmd, false); }}
                title={label}
                className="w-7 h-7 flex items-center justify-center rounded text-xs font-black hover:opacity-70 transition-opacity"
                style={{ color: textMain, background: 'rgba(255,255,255,0.06)' }}>
                {icon}
              </button>
            ))}
            <div className="w-px h-5 mx-1" style={{ background: border }} />
            {(['h1','h2','h3'] as const).map(tag => (
              <button key={tag}
                onMouseDown={e => { e.preventDefault(); document.execCommand('formatBlock', false, tag); }}
                className="px-2 h-7 rounded text-[10px] font-black hover:opacity-70 transition-opacity"
                style={{ color: textMain, background: 'rgba(255,255,255,0.06)' }}>
                {tag.toUpperCase()}
              </button>
            ))}
            <div className="w-px h-5 mx-1" style={{ background: border }} />
            <button
              onMouseDown={e => { e.preventDefault(); document.execCommand('insertUnorderedList', false); }}
              className="w-7 h-7 flex items-center justify-center rounded text-xs hover:opacity-70"
              style={{ color: textMain, background: 'rgba(255,255,255,0.06)' }}>
              •≡
            </button>
            <button
              onMouseDown={e => { e.preventDefault(); document.execCommand('insertOrderedList', false); }}
              className="w-7 h-7 flex items-center justify-center rounded text-xs hover:opacity-70"
              style={{ color: textMain, background: 'rgba(255,255,255,0.06)' }}>
              1≡
            </button>
            <div className="flex-1" />
            <span className="text-xs" style={{ color: textMute }}>📄 Tribe Document</span>
          </div>

          {/* Editor canvas */}
          <div
            contentEditable
            suppressContentEditableWarning
            className="flex-1 overflow-y-auto p-6 outline-none focus:outline-none"
            style={{
              background: isNight ? '#0D0F1A' : '#FAFAF8',
              color: textMain,
              fontSize: 15, lineHeight: 1.7,
              maxWidth: 860, margin: '0 auto', width: '100%',
            }}
            data-placeholder="Start writing your tribe document here…"
            onInput={() => {/* auto-save hook point */}}
          />
        </div>
      )}

      {/* ── WHITEBOARD: Excalidraw (open source) ── */}
      {activeTab === 'whiteboard' && (
        <div className="flex-1 flex flex-col" style={{ minHeight: 0 }}>
          <div className="flex items-center justify-between px-4 py-2 border-b" style={{ background: cardBg, borderColor: border }}>
            <span className="text-sm font-black" style={{ color: textMain }}>🖊️ Tribe Whiteboard</span>
            <span className="text-xs" style={{ color: textMute }}>Powered by Excalidraw (open source)</span>
          </div>
          <iframe
            src={`https://excalidraw.com/#room=${params.id},${btoa(params.id).slice(0,22)}`}
            className="flex-1 border-0"
            allow="clipboard-read; clipboard-write"
            title="Tribe Whiteboard"
          />
        </div>
      )}

      {/* ── CALENDAR: Tribe events calendar ── */}
      {activeTab === 'calendar' && (
        <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full">
          <TribeCalendar tribeId={params.id} isNight={isNight} accent={accent} textMain={textMain} textMute={textMute} cardBg={cardBg} border={border} />
        </div>
      )}

      {/* ── VIDEO: Tribe video conference ── */}
      {activeTab === 'video' && (
        <div className="flex-1 flex flex-col" style={{ background: isNight ? '#07080F' : '#F0F4FF' }}>
          {/* Video header */}
          <div className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
            style={{ background: cardBg, borderBottom: `1px solid ${border}` }}>
            <div>
              <p className="font-black text-sm" style={{ color: textMain }}>📹 Tribe Video Room</p>
              <p className="text-xs" style={{ color: textMute }}>Powered by Jitsi · End-to-end encrypted</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-bold" style={{ color: textMute }}>Live</span>
            </div>
          </div>
          {/* Jitsi Meet embedded conference */}
          <div className="flex-1 relative">
            <iframe
              src={`https://meet.jit.si/villa9e-tribe-${params.id.slice(0,8)}#config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false&userInfo.displayName=Villager&config.toolbarButtons=["microphone","camera","hangup","chat","tileview","fullscreen"]`}
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              className="w-full h-full border-none"
              title="Tribe Video Conference"
              style={{ minHeight: 400 }}
            />
          </div>
          <div className="px-4 py-2 flex-shrink-0" style={{ background: cardBg, borderTop: `1px solid ${border}` }}>
            <p className="text-[10px] text-center" style={{ color: textMute }}>
              This is your tribe's private video room. Share the link or just have members join this tab.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Simple tribe calendar ────────────────────────────────────────────────────
function TribeCalendar({ tribeId, isNight, accent, textMain, textMute, cardBg, border }: {
  tribeId: string; isNight: boolean; accent: string;
  textMain: string; textMute: string; cardBg: string; border: string;
}) {
  const [events, setEvents]   = useState<any[]>([]);
  const [view, setView]       = useState<'month'|'week'>('month');
  const [current, setCurrent] = useState(new Date());
  const [form, setForm]       = useState({ title: '', date: '', time: '', notes: '' });
  const [adding, setAdding]   = useState(false);
  const supabase = createClient();

  useEffect(() => {
    (supabase as any).from('tribe_events')
      .select('*')
      .eq('tribe_id', tribeId)
      .order('event_at', { ascending: true })
      .then(({ data }: any) => setEvents(data ?? []));
  }, [tribeId]);

  const year  = current.getFullYear();
  const month = current.getMonth();
  const monthName = current.toLocaleString('default', { month: 'long' });
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) => i < firstDay ? null : i - firstDay + 1);
  const eventsByDay: Record<number, any[]> = {};
  events.forEach(ev => {
    const d = new Date(ev.event_at).getDate();
    if (!eventsByDay[d]) eventsByDay[d] = [];
    eventsByDay[d].push(ev);
  });

  async function addEvent() {
    if (!form.title || !form.date) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await (supabase as any).from('tribe_events').insert({
      tribe_id:   tribeId,
      creator_id: user.id,
      title:      form.title,
      notes:      form.notes,
      event_at:   `${form.date}T${form.time || '09:00'}:00`,
    });
    setForm({ title:'', date:'', time:'', notes:'' });
    setAdding(false);
    const { data } = await (supabase as any).from('tribe_events').select('*').eq('tribe_id', tribeId).order('event_at', { ascending: true });
    setEvents(data ?? []);
  }

  return (
    <div className="space-y-4">
      {/* Calendar header */}
      <div className="flex items-center justify-between">
        <button onClick={() => setCurrent(new Date(year, month - 1, 1))} style={{ color: textMute }}>‹</button>
        <span className="font-black text-base" style={{ color: textMain }}>{monthName} {year}</span>
        <button onClick={() => setCurrent(new Date(year, month + 1, 1))} style={{ color: textMute }}>›</button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 text-center">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
          <div key={d} className="py-1 text-[10px] font-bold" style={{ color: textMute }}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => (
          <div key={i} className="aspect-square flex flex-col items-center justify-start p-0.5 rounded"
            style={{
              background: day ? (eventsByDay[day] ? `${accent}20` : 'transparent') : 'transparent',
              border: day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear()
                ? `1px solid ${accent}` : '1px solid transparent',
            }}>
            {day && (
              <>
                <span className="text-[11px] font-bold" style={{ color: textMain }}>{day}</span>
                {(eventsByDay[day] ?? []).slice(0, 2).map((ev, ei) => (
                  <span key={ei} className="w-full truncate text-[8px] font-bold rounded px-0.5 mt-0.5"
                    style={{ background: accent, color: '#fff' }}>
                    {ev.title}
                  </span>
                ))}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Add event */}
      <button onClick={() => setAdding(!adding)}
        className="w-full py-2 rounded-xl text-sm font-black transition-colors"
        style={{ background: `${accent}20`, color: accent, border: `1px solid ${accent}40` }}>
        + Add Event
      </button>

      {adding && (
        <div className="p-4 rounded-xl space-y-2" style={{ background: cardBg, border: `1px solid ${border}` }}>
          <input value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))}
            placeholder="Event title…"
            className="w-full rounded-lg px-3 py-2 text-sm"
            style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${border}`, color: textMain }} />
          <div className="flex gap-2">
            <input type="date" value={form.date} onChange={e => setForm(p => ({...p, date: e.target.value}))}
              className="flex-1 rounded-lg px-3 py-2 text-sm"
              style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${border}`, color: textMain }} />
            <input type="time" value={form.time} onChange={e => setForm(p => ({...p, time: e.target.value}))}
              className="flex-1 rounded-lg px-3 py-2 text-sm"
              style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${border}`, color: textMain }} />
          </div>
          <textarea value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))}
            placeholder="Notes…" rows={2}
            className="w-full rounded-lg px-3 py-2 text-sm resize-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${border}`, color: textMain }} />
          <div className="flex gap-2">
            <button onClick={addEvent} className="flex-1 py-2 rounded-lg text-sm font-black text-white" style={{ background: accent }}>Save</button>
            <button onClick={() => setAdding(false)} className="px-4 py-2 rounded-lg text-sm" style={{ color: textMute }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Upcoming events */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase tracking-widest" style={{ color: textMute }}>Upcoming</p>
        {events.slice(0, 5).map(ev => (
          <div key={ev.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: cardBg, border: `1px solid ${border}` }}>
            <div className="text-center min-w-[36px]">
              <p className="text-[10px] font-bold uppercase" style={{ color: textMute }}>
                {new Date(ev.event_at).toLocaleString('default', { month: 'short' })}
              </p>
              <p className="text-lg font-black" style={{ color: accent }}>{new Date(ev.event_at).getDate()}</p>
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: textMain }}>{ev.title}</p>
              <p className="text-xs" style={{ color: textMute }}>
                {new Date(ev.event_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {events.length === 0 && (
          <p className="text-sm text-center py-4" style={{ color: textMute }}>No events yet. Add your first tribe event!</p>
        )}
      </div>
    </div>
  );
}
