'use client';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

export default function MessagesPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [active, setActive] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';

  const bg     = isNight ? '#060810' : '#F8F9FF';
  const sidebar = isNight ? '#0D1020' : '#FFFFFF';
  const border = isNight ? '#1A1F3A' : '#E0E7FF';
  const text   = isNight ? '#F0EBE0' : '#1E1B4B';
  const muted  = isNight ? '#4A4F72' : '#6D28D9';
  const inputBg = isNight ? '#12152A' : '#F0F4FF';

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
      if (user) loadConversations(user.id);
    });
  }, []);

  useEffect(() => {
    if (!active) return;
    loadMessages(active.id);
    const sub = supabase.channel(`msgs_${active.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${active.id}`,
      }, p => {
        setMessages(prev => [...prev, p.new as any]);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [active?.id]);

  async function loadConversations(uid: string) {
    const { data } = await (supabase as any)
      .from('conversations')
      .select('*')
      .contains('participant_ids', [uid])
      .order('last_message_at', { ascending: false })
      .limit(30);
    setConversations(data ?? []);
  }

  async function loadMessages(convId: string) {
    const { data } = await (supabase as any)
      .from('messages')
      .select('*, profiles(username, avatar_url)')
      .eq('conversation_id', convId)
      .order('created_at')
      .limit(100);
    setMessages(data ?? []);
    setTimeout(() => bottomRef.current?.scrollIntoView(), 100);
  }

  async function sendMessage() {
    if (!newMsg.trim() || !active || !userId || sending) return;
    setSending(true);
    await supabase.from('messages').insert({
      conversation_id: active.id, sender_id: userId,
      content: newMsg, status: 'sent',
    });
    await supabase.from('conversations').update({
      last_message_at: new Date().toISOString(),
      last_message_preview: newMsg.slice(0, 80),
    }).eq('id', active.id);
    setNewMsg('');
    setSending(false);
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: bg }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-3 flex items-center gap-3"
        style={{ background: isNight ? 'rgba(6,8,16,0.92)' : 'rgba(248,249,255,0.92)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${border}` }}>
        <Link href="/village/hut" className="text-xl" style={{ color: muted }}>←</Link>
        <span className="text-2xl">💬</span>
        <h1 className="text-xl font-black" style={{ color: text }}>Messages</h1>
      </div>

      <div className="flex flex-1 overflow-hidden max-w-4xl mx-auto w-full">
        {/* Conversation list */}
        <div
          className={`w-full sm:w-72 flex-shrink-0 flex-col border-r ${active ? 'hidden sm:flex' : 'flex'}`}
          style={{ background: sidebar, borderColor: border }}
        >
          <div className="px-4 py-3 border-b" style={{ borderColor: border }}>
            <p className="font-bold text-sm" style={{ color: text }}>Conversations</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="text-center py-12 px-4">
                <p className="text-3xl mb-3">💬</p>
                <p className="text-sm" style={{ color: muted }}>No messages yet.</p>
                <p className="text-xs mt-1" style={{ color: muted }}>Connect with a villager to chat!</p>
              </div>
            ) : (
              conversations.map(conv => (
                <button key={conv.id} onClick={() => setActive(conv)}
                  className="w-full text-left px-4 py-3 border-b transition-all"
                  style={{
                    borderColor: border,
                    background: active?.id === conv.id
                      ? isNight ? 'rgba(24,119,242,0.12)' : 'rgba(24,119,242,0.06)'
                      : 'transparent',
                  }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg,#1877F2,#7C3AED)' }}>
                      💬
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: text }}>
                        {conv.conversation_type === 'tribe' ? '👥 Tribe Chat' :
                          conv.last_message_preview ? conv.last_message_preview.slice(0, 30) + '…' :
                          'New conversation'}
                      </p>
                      {conv.last_message_at && (
                        <p className="text-xs" style={{ color: muted }}>
                          {new Date(conv.last_message_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    {conv.unread_counts?.[userId ?? ''] > 0 && (
                      <span className="w-5 h-5 bg-[#1877F2] rounded-full text-white text-xs flex items-center justify-center font-bold">
                        {conv.unread_counts[userId ?? '']}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Message thread */}
        {active ? (
          <div className="flex-1 flex flex-col" style={{ background: isNight ? '#0A0B12' : '#FAFBFF' }}>
            <div className="px-4 py-3 border-b flex items-center gap-3"
              style={{ borderColor: border, background: sidebar }}>
              <button onClick={() => setActive(null)} className="sm:hidden text-xl" style={{ color: muted }}>←</button>
              <p className="font-bold" style={{ color: text }}>Conversation</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(msg => {
                const isMe = msg.sender_id === userId;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-xs px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                      style={isMe
                        ? { background: '#1877F2', color: '#fff', borderBottomRightRadius: '6px' }
                        : { background: isNight ? '#12152A' : '#E8EDFF', color: text, border: `1px solid ${border}`, borderBottomLeftRadius: '6px' }
                      }>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              {messages.length === 0 && (
                <div className="text-center py-16" style={{ color: muted }}>
                  <p className="text-4xl mb-2">💬</p>
                  <p className="text-sm">Start the conversation.</p>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="px-4 py-3 border-t flex gap-2"
              style={{ borderColor: border, background: sidebar }}>
              <input
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Message…"
                className="flex-1 rounded-2xl px-4 py-2.5 text-sm focus:outline-none"
                style={{ background: inputBg, border: `1px solid ${border}`, color: text }}
              />
              <button onClick={sendMessage} disabled={sending || !newMsg.trim()}
                className="px-4 py-2.5 rounded-2xl font-bold text-sm text-white disabled:opacity-40 transition-all"
                style={{ background: '#1877F2' }}>
                {sending ? '…' : '↑'}
              </button>
            </div>
          </div>
        ) : (
          <div className="hidden sm:flex flex-1 items-center justify-center text-center"
            style={{ color: muted }}>
            <div>
              <p className="text-5xl mb-3">💬</p>
              <p className="text-sm">Select a conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
