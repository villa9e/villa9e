'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { DEFAULT_AVATAR_CONFIG, type AvatarConfig, type CharacterType } from '@/lib/avatar/config';

type AvatarStatus = 'Active Profile' | 'Office' | 'Workshop' | 'Saved';

interface AvatarCard {
  id: string;
  nickname: string;
  status: AvatarStatus;
  character_type: CharacterType;
  config: Partial<AvatarConfig>;
}

const USE_AS_OPTIONS = [
  'Profile Picture',
  'DreamLine',
  'Workshop',
  'Office',
  'Trading Post',
];

const STATUS_COLORS: Record<AvatarStatus, { bg: string; text: string }> = {
  'Active Profile': { bg: 'rgba(16,163,74,0.12)', text: '#16A34A' },
  'Office':         { bg: 'rgba(24,119,242,0.12)', text: '#1877F2' },
  'Workshop':       { bg: 'rgba(124,58,237,0.12)', text: '#7C3AED' },
  'Saved':          { bg: 'rgba(30,27,75,0.08)',   text: 'rgba(30,27,75,0.5)' },
};

function AvatarInitialsCircle({ type, color }: { type: CharacterType; color: string }) {
  const initials = type.slice(0, 2).toUpperCase();
  return (
    <div className="w-full aspect-square rounded-2xl flex items-center justify-center font-black text-2xl"
      style={{ background: color, color: '#fff', letterSpacing: 1 }}>
      {initials}
    </div>
  );
}

const CARD_COLORS: string[] = ['#1877F2', '#7C3AED', '#0D9488', '#D97706', '#DC2626'];

export default function AvatarGalleryPage() {
  const [cards, setCards]             = useState<AvatarCard[]>([]);
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [editValue, setEditValue]     = useState('');
  const [menuId, setMenuId]           = useState<string | null>(null);
  const [loading, setLoading]         = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setCards(getMockCards());
        setLoading(false);
        return;
      }
      (supabase as any).from('profiles').select('avatar_config').eq('id', user.id).single()
        .then(({ data: p }: any) => {
          const liveConfig = p?.avatar_config ? { ...DEFAULT_AVATAR_CONFIG, ...p.avatar_config } : DEFAULT_AVATAR_CONFIG;
          setCards([
            {
              id: 'main',
              nickname: 'My Main Avatar',
              status: 'Active Profile',
              character_type: (liveConfig.character_type as CharacterType) ?? 'casual',
              config: liveConfig,
            },
            {
              id: 'business',
              nickname: 'Business Avatar',
              status: 'Saved',
              character_type: 'suit',
              config: { ...DEFAULT_AVATAR_CONFIG, character_type: 'suit' },
            },
          ]);
          setLoading(false);
        });
    });
  }, []);

  function getMockCards(): AvatarCard[] {
    return [
      {
        id: 'main',
        nickname: 'My Main Avatar',
        status: 'Active Profile',
        character_type: 'casual',
        config: DEFAULT_AVATAR_CONFIG,
      },
      {
        id: 'business',
        nickname: 'Business Avatar',
        status: 'Saved',
        character_type: 'suit',
        config: { ...DEFAULT_AVATAR_CONFIG, character_type: 'suit' },
      },
    ];
  }

  function startEdit(card: AvatarCard) {
    setEditingId(card.id);
    setEditValue(card.nickname);
  }

  function commitEdit(id: string) {
    setCards(prev => prev.map(c => c.id === id ? { ...c, nickname: editValue.trim() || c.nickname } : c));
    setEditingId(null);
  }

  function handleUseAs(cardId: string, option: string) {
    setMenuId(null);
    // In a real implementation this would update the profile assignment
    console.log(`Set avatar ${cardId} as: ${option}`);
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #E8EEFF 0%, #F5F0FF 50%, #EFF8FF 100%)' }}>

      {/* Top bar */}
      <div className="sticky top-0 z-20 flex items-center gap-3 px-4"
        style={{ height: 56, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1.5px solid rgba(24,119,242,0.2)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <Link href="/village/hut/avatar"
          className="w-9 h-9 flex items-center justify-center rounded-full"
          style={{ color: '#1877F2', background: 'rgba(24,119,242,0.08)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </Link>
        <div className="flex-1">
          <p className="font-black text-sm" style={{ color: '#1A1A2E' }}>My Avatars</p>
          <p className="text-xs" style={{ color: 'rgba(30,27,75,0.45)' }}>
            {cards.length} avatar{cards.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/village/hut/avatar"
          className="px-3 py-1.5 rounded-xl text-xs font-black transition-colors"
          style={{ background: 'rgba(24,119,242,0.08)', color: '#1877F2' }}>
          Avatar Studio
        </Link>
      </div>

      {/* Grid */}
      <div className="p-4 pb-28">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[0, 1].map(i => (
              <div key={i} className="rounded-3xl aspect-square animate-pulse" style={{ background: 'rgba(30,27,75,0.06)' }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {cards.map((card, idx) => {
              const color = CARD_COLORS[idx % CARD_COLORS.length];
              const statusStyle = STATUS_COLORS[card.status];
              return (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="rounded-3xl overflow-hidden"
                  style={{ background: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1.5px solid rgba(24,119,242,0.1)' }}>

                  {/* Avatar visual */}
                  <div className="p-4 pb-2">
                    <AvatarInitialsCircle type={card.character_type} color={color} />
                  </div>

                  {/* Card info */}
                  <div className="px-3 pb-3">
                    {/* Editable nickname */}
                    {editingId === card.id ? (
                      <input
                        autoFocus
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={() => commitEdit(card.id)}
                        onKeyDown={e => e.key === 'Enter' && commitEdit(card.id)}
                        className="w-full text-xs font-black rounded-lg px-2 py-1 mb-1"
                        style={{ background: '#F0F4FF', color: '#1A1A2E', border: '1.5px solid #1877F2', outline: 'none' }}
                      />
                    ) : (
                      <button
                        onClick={() => startEdit(card)}
                        className="flex items-center gap-1 group mb-1">
                        <span className="text-xs font-black" style={{ color: '#1A1A2E' }}>{card.nickname}</span>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(30,27,75,0.3)" strokeWidth="2" strokeLinecap="round" className="group-hover:stroke-blue-500 transition-colors">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                    )}

                    {/* Status badge */}
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full"
                        style={{ background: statusStyle.bg, color: statusStyle.text }}>
                        {card.status}
                      </span>

                      {/* Use as menu trigger */}
                      <div className="relative">
                        <button
                          onClick={() => setMenuId(menuId === card.id ? null : card.id)}
                          className="text-[10px] font-black px-2 py-1 rounded-lg transition-colors"
                          style={{ background: 'rgba(24,119,242,0.08)', color: '#1877F2' }}>
                          Use as
                        </button>

                        <AnimatePresence>
                          {menuId === card.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9, y: -4 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9, y: -4 }}
                              className="absolute bottom-full right-0 mb-1 rounded-2xl overflow-hidden z-30"
                              style={{ background: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', minWidth: 140, border: '1.5px solid rgba(24,119,242,0.15)' }}>
                              {USE_AS_OPTIONS.map((opt, oi) => (
                                <button
                                  key={opt}
                                  onClick={() => handleUseAs(card.id, opt)}
                                  className="w-full px-3 py-2.5 text-left text-xs font-bold transition-colors hover:bg-blue-50"
                                  style={{
                                    color: '#1A1A2E',
                                    borderBottom: oi < USE_AS_OPTIONS.length - 1 ? '1px solid rgba(30,27,75,0.06)' : 'none',
                                  }}>
                                  {opt}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* FAB — Create new */}
      <Link href="/village/hut/avatar"
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center z-30 transition-transform active:scale-95"
        style={{ background: '#1877F2', boxShadow: '0 6px 24px rgba(24,119,242,0.45)' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </Link>

      {/* Backdrop for closing menus */}
      {menuId && (
        <div className="fixed inset-0 z-20" onClick={() => setMenuId(null)} />
      )}
    </div>
  );
}
