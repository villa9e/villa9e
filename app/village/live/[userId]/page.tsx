'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

interface Comment {
  id: string;
  username: string;
  text: string;
  at: number;
}

// Mock comments that scroll in
const MOCK_COMMENTS: Omit<Comment, 'at'>[] = [
  { id: '1', username: 'nia_j',    text: 'This is 🔥' },
  { id: '2', username: 'marcus_t', text: 'Let\'s go!' },
  { id: '3', username: 'aisha_b',  text: 'Tapped in from Dallas' },
  { id: '4', username: 'dev_jay',  text: 'OoWop!' },
  { id: '5', username: 'king_sol', text: 'Say less 👏' },
  { id: '6', username: 'brand_k',  text: 'This resonates fr' },
  { id: '7', username: 'n8_moves', text: 'Dropping gems' },
];

export default function LiveViewerPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;

  const [profile, setProfile]         = useState<any>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [comments, setComments]       = useState<Comment[]>([]);
  const [inputVal, setInputVal]       = useState('');
  const commentsRef                   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    (supabase as any).from('profiles').select('id, username, display_name, avatar_url, is_live').eq('id', userId).single()
      .then(({ data }: any) => setProfile(data));

    // Simulate viewer count ticking up
    const iv = setInterval(() => {
      setViewerCount(v => v + Math.floor(Math.random() * 3));
    }, 4000);

    // Simulate comment stream
    let ci = 0;
    const ci2 = setInterval(() => {
      const mock = MOCK_COMMENTS[ci % MOCK_COMMENTS.length];
      setComments(prev => [...prev.slice(-19), { ...mock, id: mock.id + Date.now(), at: Date.now() }]);
      ci++;
    }, 2500);

    return () => { clearInterval(iv); clearInterval(ci2); };
  }, [userId]);

  useEffect(() => {
    if (commentsRef.current) {
      commentsRef.current.scrollTop = commentsRef.current.scrollHeight;
    }
  }, [comments]);

  function sendComment() {
    if (!inputVal.trim()) return;
    setComments(prev => [...prev.slice(-19), { id: 'u' + Date.now(), username: 'you', text: inputVal.trim(), at: Date.now() }]);
    setInputVal('');
  }

  async function sendOoWop() {
    // Optimistic OoWop animation
    setComments(prev => [...prev.slice(-19), { id: 'ow' + Date.now(), username: 'you', text: '🤜 OoWop!', at: Date.now() }]);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 200, display: 'flex', flexDirection: 'column' }}>
      {/* Background gradient */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #080E24 0%, #0A1F2E 100%)', pointerEvents: 'none' }} />

      {/* Top bar */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'calc(16px + env(safe-area-inset-top, 0px)) 16px 12px' }}>
        {/* LIVE badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#E8170A', borderRadius: 20, padding: '5px 12px' }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: '#fff', animation: 'livePulse 1s ease-in-out infinite' }} />
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 900, letterSpacing: 1 }}>LIVE</span>
          </div>
          {profile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 16, border: '2px solid #E8170A', overflow: 'hidden' }}>
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: '#2952E8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13 }}>
                    {(profile.display_name || profile.username || '?').slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>@{profile.username}</span>
            </div>
          )}
        </div>

        {/* Viewer count + close */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.12)', borderRadius: 20, padding: '5px 10px' }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
            <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{viewerCount.toLocaleString()}</span>
          </div>
          <button onClick={() => router.back()} style={{ width: 32, height: 32, borderRadius: 16, background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>

      {/* Comment stream — right side */}
      <div
        ref={commentsRef}
        style={{ position: 'absolute', bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))', left: 16, right: 16, height: 280, overflowY: 'auto', zIndex: 2, display: 'flex', flexDirection: 'column', gap: 6, maskImage: 'linear-gradient(to bottom, transparent 0%, black 30%)' }}
      >
        <AnimatePresence initial={false}>
          {comments.map(c => (
            <motion.div key={c.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6, background: 'rgba(0,0,0,0.45)', borderRadius: 16, padding: '6px 12px', alignSelf: 'flex-start', maxWidth: '80%' }}>
              <span style={{ color: '#4D72FF', fontWeight: 700, fontSize: 12 }}>@{c.username}</span>
              <span style={{ color: '#fff', fontSize: 13 }}>{c.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Bottom: input + OoWop */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 16px calc(10px + env(safe-area-inset-bottom, 0px))', background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)', display: 'flex', gap: 10, alignItems: 'center', zIndex: 2 }}>
        <input
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendComment()}
          placeholder="Say something..."
          style={{ flex: 1, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 24, padding: '10px 16px', color: '#fff', fontSize: 14, outline: 'none' }}
        />
        <button onClick={sendOoWop}
          style={{ background: '#2952E8', border: 'none', borderRadius: 24, padding: '10px 16px', color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          OoWop
        </button>
      </div>

      <style>{`
        @keyframes livePulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
      `}</style>
    </div>
  );
}
