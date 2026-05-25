'use client';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function MessagesPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [active, setActive] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

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
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${active.id}` }, p => {
        setMessages(prev => [...prev, p.new as any]);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [active?.id]);

  async function loadConversations(uid: string) {
    const { data } = await supabase.from('conversations').select('*').contains('participant_ids', [uid]).order('last_message_at', { ascending: false }).limit(30);
    setConversations(data ?? []);
  }

  async function loadMessages(convId: string) {
    const { data } = await supabase.from('messages').select('*, profiles(username, avatar_url)').eq('conversation_id', convId).order('created_at').limit(100);
    setMessages(data ?? []);
    setTimeout(() => bottomRef.current?.scrollIntoView(), 100);
  }

  async function sendMessage() {
    if (!newMsg.trim() || !active || !userId || sending) return;
    setSending(true);
    await supabase.from('messages').insert({ conversation_id: active.id, sender_id: userId, content: newMsg, status: 'sent' });
    await supabase.from('conversations').update({ last_message_at: new Date().toISOString(), last_message_preview: newMsg.slice(0, 80) }).eq('id', active.id);
    setNewMsg('');
    setSending(false);
  }

  return (
    <div className="min-h-screen bg-village-bg flex flex-col">
      <div className="bg-village-blue text-white px-6 py-4 flex items-center gap-3">
        <Link href="/village/hut" className="text-xl">←</Link>
        <span className="text-2xl">💬</span>
        <h1 className="text-xl font-bold">Messages</h1>
      </div>

      <div className="flex flex-1 overflow-hidden max-w-4xl mx-auto w-full">
        {/* Conversation list */}
        <div className={`w-full sm:w-80 border-r border-gray-200 bg-white flex-shrink-0 ${active ? 'hidden sm:flex' : 'flex'} flex-col`}>
          <div className="p-4 border-b border-gray-100">
            <p className="font-bold text-gray-700">Conversations</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 && (
              <div className="text-center py-10 px-4 text-gray-400">
                <p className="text-3xl mb-2">💬</p>
                <p className="text-sm">No messages yet. Connect with a villager to start chatting!</p>
              </div>
            )}
            {conversations.map(conv => (
              <button key={conv.id} onClick={() => setActive(conv)}
                className={`w-full text-left p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${active?.id === conv.id ? 'bg-blue-50' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-village-blue/10 flex items-center justify-center font-bold text-village-blue">
                    💬
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{conv.conversation_type === 'tribe' ? '👥 Tribe Chat' : conv.last_message_preview ? conv.last_message_preview.slice(0, 30) + '…' : 'New conversation'}</p>
                    {conv.last_message_at && <p className="text-xs text-gray-400">{new Date(conv.last_message_at).toLocaleDateString()}</p>}
                  </div>
                  {conv.unread_counts?.[userId ?? ''] > 0 && (
                    <span className="w-5 h-5 bg-village-blue rounded-full text-white text-xs flex items-center justify-center">{conv.unread_counts[userId ?? '']}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Message thread */}
        {active ? (
          <div className="flex-1 flex flex-col bg-white">
            <div className="p-4 border-b border-gray-100 flex items-center gap-3">
              <button onClick={() => setActive(null)} className="sm:hidden text-gray-400 text-xl">←</button>
              <p className="font-bold">Conversation</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(msg => {
                const isMe = msg.sender_id === userId;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'bg-village-blue text-white' : 'bg-gray-100 text-gray-800'}`}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
            <div className="p-4 border-t border-gray-100 flex gap-2">
              <input
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Message…"
                className="flex-1 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-village-blue"
              />
              <button onClick={sendMessage} disabled={sending || !newMsg.trim()} className="village-btn-primary px-4 py-2.5 disabled:opacity-50 text-sm">
                Send
              </button>
            </div>
          </div>
        ) : (
          <div className="hidden sm:flex flex-1 items-center justify-center text-center text-gray-400">
            <div>
              <p className="text-5xl mb-3">💬</p>
              <p>Select a conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
