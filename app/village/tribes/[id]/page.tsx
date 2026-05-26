'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function TribeDetailPage({ params }: { params: { id: string } }) {
  const [tribe, setTribe] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'members' | 'tasks'>('chat');
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [addingTask, setAddingTask] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    load();
    // Realtime chat
    const channel = supabase.channel(`tribe_${params.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'tribe_messages',
        filter: `tribe_id=eq.${params.id}`,
      }, p => setMessages(prev => [...prev, p.new as any]))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [params.id]);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id ?? null);

    const [{ data: t }, { data: m }, { data: msgs }, { data: tk }] = await Promise.all([
      supabase.from('tribes').select('*').eq('id', params.id).single(),
      supabase.from('tribe_members').select('*, profiles(username, village_score, score_tier)').eq('tribe_id', params.id),
      supabase.from('tribe_messages').select('*, profiles(username)').eq('tribe_id', params.id).order('created_at').limit(50),
      supabase.from('tribe_tasks').select('*').eq('tribe_id', params.id).order('created_at', { ascending: false }).limit(20),
    ]);

    setTribe(t); setMembers(m ?? []); setMessages(msgs ?? []); setTasks(tk ?? []);
  }

  async function sendMessage() {
    if (!newMsg.trim() || sending || !userId) return;
    setSending(true);
    await supabase.from('tribe_messages').insert({
      tribe_id: params.id, user_id: userId, content: newMsg.trim(),
    });
    setNewMsg('');
    setSending(false);
  }

  async function addTask() {
    if (!newTask.trim() || !userId) return;
    setAddingTask(true);
    const { data } = await supabase.from('tribe_tasks').insert({
      tribe_id: params.id, created_by: userId, title: newTask.trim(), status: 'pending',
    }).select().single();
    if (data) setTasks(prev => [data, ...prev]);
    setNewTask('');
    setAddingTask(false);
  }

  async function toggleTask(task: any) {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    await supabase.from('tribe_tasks').update({ status: newStatus }).eq('id', task.id);
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
  }

  if (!tribe) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-4xl animate-float">👥</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-village-bg flex flex-col">
      <div className="bg-pink-600 text-white px-6 py-4 flex items-center gap-3">
        <Link href="/village/tribes" className="text-xl">←</Link>
        <div className="flex-1">
          <h1 className="text-lg font-bold truncate">{tribe.name}</h1>
          <p className="text-pink-200 text-xs">{members.length} members</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 bg-white">
        {([['chat', '💬 Chat'], ['tasks', '✅ Tasks'], ['members', '👥 Members']] as const).map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === tab ? 'border-b-2 border-pink-600 text-pink-600' : 'text-gray-500'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Chat tab */}
      {activeTab === 'chat' && (
        <div className="flex flex-col flex-1 max-w-2xl mx-auto w-full">
          <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
            {messages.map(msg => {
              const isMe = msg.user_id === userId;
              return (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className="w-8 h-8 rounded-xl bg-pink-100 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">
                    {(msg.profiles?.username?.[0] ?? '?').toUpperCase()}
                  </div>
                  <div className={`max-w-xs ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                    {!isMe && <p className="text-xs text-gray-400 mb-0.5">@{msg.profiles?.username}</p>}
                    <div className={`rounded-2xl px-4 py-2.5 text-sm ${isMe ? 'bg-pink-600 text-white rounded-tr-sm' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'}`}>
                      {msg.content}
                    </div>
                    <p className="text-xs text-gray-300 mt-0.5">
                      {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              );
            })}
            {messages.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <p className="text-3xl mb-2">💬</p>
                <p className="text-sm">No messages yet. Say something!</p>
              </div>
            )}
          </div>
          <div className="fixed bottom-20 left-0 right-0 bg-white border-t border-gray-100 p-3">
            <div className="max-w-2xl mx-auto flex gap-2">
              <input value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Message the tribe…"
                className="flex-1 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400" />
              <button onClick={sendMessage} disabled={!newMsg.trim() || sending}
                className="bg-pink-600 text-white rounded-2xl px-4 py-2.5 text-sm font-bold disabled:opacity-50 hover:bg-pink-700">
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tasks tab */}
      {activeTab === 'tasks' && (
        <div className="max-w-2xl mx-auto w-full p-4 space-y-3">
          <div className="flex gap-2">
            <input value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTask()}
              placeholder="Add a tribe task…"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400" />
            <button onClick={addTask} disabled={!newTask.trim() || addingTask}
              className="bg-pink-600 text-white rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-50">
              Add
            </button>
          </div>
          {tasks.map(task => (
            <div key={task.id} className="village-card flex items-center gap-3">
              <button onClick={() => toggleTask(task)}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${task.status === 'completed' ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                {task.status === 'completed' && <span className="text-white text-xs">✓</span>}
              </button>
              <span className={`text-sm flex-1 ${task.status === 'completed' ? 'line-through text-gray-400' : ''}`}>{task.title}</span>
            </div>
          ))}
          {tasks.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-3xl mb-2">✅</p>
              <p className="text-sm">No tasks yet. Add one above.</p>
            </div>
          )}
        </div>
      )}

      {/* Members tab */}
      {activeTab === 'members' && (
        <div className="max-w-2xl mx-auto w-full p-4 space-y-3">
          {members.map(m => (
            <Link key={m.user_id} href={`/villager/${m.profiles?.username}`}
              className="village-card flex items-center gap-3 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center text-lg font-bold">
                {(m.profiles?.username?.[0] ?? '?').toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">@{m.profiles?.username}</p>
                <p className="text-xs text-gray-400">{m.role ?? 'Member'} · {m.profiles?.score_tier ?? 'Seedling'}</p>
              </div>
              <span className="text-sm font-bold text-village-blue">{m.profiles?.village_score ?? 0}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
