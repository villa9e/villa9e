'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { UseWebRTCReturn } from '@/lib/webrtc/useWebRTC';

export interface TribeMember {
  userId:      string;
  username:    string;
  displayName: string;
  avatar?:     string;
  skinColor?:  string;
  isOnline:    boolean;
  tribeId?:    string;
  screenX:     number;
  screenY:     number;
}

interface TribeMemberMenuProps {
  member:       TribeMember;
  currentUserId: string;
  isNight:      boolean;
  webrtc:       UseWebRTCReturn;
  onClose:      () => void;
}

const MENU_R  = 80;  // crescent radius
const ANGLES  = [150, 110, 70, 30]; // degrees CCW from right

function degToPos(deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: Math.cos(rad) * MENU_R, y: -Math.sin(rad) * MENU_R };
}

export function TribeMemberMenu({ member, currentUserId, isNight, webrtc, onClose }: TribeMemberMenuProps) {
  const router   = useRouter();
  const supabase = createClient();
  const [showSettings, setShowSettings] = useState(false);
  const [showAgreements, setShowAgreements] = useState(false);
  const [agreements, setAgreements] = useState<any[]>([]);
  const [blocking, setBlocking] = useState(false);

  const bg     = isNight ? 'rgba(8,10,22,0.96)' : 'rgba(240,244,255,0.96)';
  const border = isNight ? 'rgba(255,255,255,0.15)' : 'rgba(30,27,75,0.15)';
  const fill   = isNight ? 'rgba(255,255,255,0.9)' : 'rgba(30,27,75,0.88)';

  const ACTIONS = [
    {
      id:    'message',
      label: 'Message',
      icon:  'M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z',
      color: '#1877F2',
    },
    {
      id:    'call',
      label: 'Call',
      icon:  'M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z',
      color: '#16A34A',
    },
    {
      id:    'agreements',
      label: 'Projects',
      icon:  'M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z',
      color: '#D97706',
    },
    {
      id:    'settings',
      label: 'Settings',
      icon:  'M12 15.5A3.5 3.5 0 018.5 12 3.5 3.5 0 0112 8.5a3.5 3.5 0 013.5 3.5 3.5 3.5 0 01-3.5 3.5m7.43-2.92c.04-.36.07-.73.07-1.08s-.03-.73-.07-1.08l2.32-1.82c.21-.16.27-.46.13-.7l-2.2-3.82c-.13-.25-.42-.33-.67-.25l-2.74 1.1c-.57-.44-1.18-.8-1.85-1.08l-.4-2.91C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.4 2.91c-.67.28-1.28.64-1.85 1.08L4.52 5.3c-.25-.09-.54 0-.67.25L1.65 9.36c-.14.25-.08.54.13.7l2.32 1.82c-.04.35-.07.72-.07 1.08s.03.73.07 1.08L1.78 16.08c-.21.16-.27.46-.13.7l2.2 3.82c.13.25.42.33.67.25l2.74-1.1c.57.44 1.18.8 1.85 1.08l.4 2.91c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.4-2.91c.67-.28 1.28-.64 1.85-1.08l2.74 1.1c.25.09.54 0 .67-.25l2.2-3.82c.14-.25.08-.54-.13-.7l-2.32-1.82z',
      color: '#7C3AED',
    },
  ];

  async function handleAction(id: string) {
    if (navigator.vibrate) navigator.vibrate(8);
    switch (id) {
      case 'message':
        onClose();
        router.push(`/messages?to=${member.userId}`);
        break;
      case 'call':
        onClose();
        await webrtc.initiateCall(member.userId, member.displayName || member.username, member.avatar);
        break;
      case 'agreements':
        // Load agreements for this member pair
        const { data } = await (supabase as any)
          .from('collaborative_goals')
          .select('*, goal:goals(title, status)')
          .or(`creator_id.eq.${currentUserId},partner_id.eq.${currentUserId}`)
          .or(`creator_id.eq.${member.userId},partner_id.eq.${member.userId}`)
          .limit(20);
        setAgreements(data ?? []);
        setShowAgreements(true);
        break;
      case 'settings':
        setShowSettings(true);
        break;
    }
  }

  async function handleBlock() {
    setBlocking(true);
    await (supabase as any).from('user_blocks').upsert({
      blocker_id: currentUserId,
      blocked_id: member.userId,
    }).catch(() => {});
    setBlocking(false);
    onClose();
  }

  async function handleRemoveFromTribe() {
    if (!member.tribeId) return;
    await (supabase as any).from('tribe_members')
      .delete()
      .eq('tribe_id', member.tribeId)
      .eq('user_id', member.userId)
      .catch(() => {});
    onClose();
  }

  async function startCollaborativeGoal() {
    onClose();
    router.push(`/village/workshop/chat?partner=${member.userId}`);
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[90]" onClick={onClose} />

      {/* Crescent menu anchored to member's screen position */}
      <div
        className="fixed z-[91]"
        style={{
          left: member.screenX,
          top:  member.screenY,
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}
      >
        {/* Member name label */}
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: -78 }}
          className="absolute left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-black whitespace-nowrap"
          style={{ background: bg, border: `1px solid ${border}`, color: isNight ? '#fff' : '#1E1B4B', backdropFilter: 'blur(16px)' }}
        >
          <span className="mr-1.5" style={{ color: member.isOnline ? '#4ADE80' : 'rgba(255,255,255,0.3)' }}>●</span>
          {member.displayName || member.username}
        </motion.div>

        {/* Action buttons in crescent arc */}
        {ACTIONS.map((action, i) => {
          const pos = degToPos(ANGLES[i]);
          return (
            <motion.button
              key={action.id}
              initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
              animate={{ x: pos.x, y: pos.y, scale: 1, opacity: 1 }}
              exit={{ x: 0, y: 0, scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.22 }}
              whileTap={{ scale: 0.88 }}
              transition={{ type: 'spring', stiffness: 500, damping: 28, delay: i * 0.05 }}
              onClick={() => handleAction(action.id)}
              title={action.label}
              style={{
                position: 'absolute',
                pointerEvents: 'all',
                width: 48, height: 48,
                borderRadius: '50%',
                background: bg,
                border: `1.5px solid ${border}`,
                backdropFilter: 'blur(20px)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                transform: 'translate(-50%,-50%)',
                boxShadow: isNight ? '0 4px 20px rgba(0,0,0,0.7)' : '0 4px 16px rgba(0,0,0,0.2)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={action.color}>
                <path d={action.icon} />
              </svg>
              <span style={{ fontSize: 7, fontWeight: 800, color: fill, letterSpacing: '0.02em' }}>
                {action.label.toUpperCase()}
              </span>
            </motion.button>
          );
        })}

        {/* Collaborative goal button — below avatar */}
        <motion.button
          initial={{ y: 0, scale: 0, opacity: 0 }}
          animate={{ y: 75, scale: 1, opacity: 1 }}
          exit={{ y: 0, scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.18 }}
          whileTap={{ scale: 0.88 }}
          transition={{ type: 'spring', stiffness: 500, damping: 28, delay: 0.2 }}
          onClick={startCollaborativeGoal}
          title="Start a collaborative goal"
          style={{
            position: 'absolute',
            pointerEvents: 'all',
            left: '50%', top: '50%',
            width: 44, height: 44,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #7C3AED, #1877F2)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            transform: 'translate(-50%,-50%)',
            boxShadow: '0 0 20px rgba(124,58,237,0.5)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
            <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 14l-4-4 1.4-1.4 2.6 2.6 5.6-5.6L19 9l-7 7z"/>
          </svg>
          <span style={{ fontSize: 6, fontWeight: 900, color: '#fff', letterSpacing: '0.02em' }}>GOAL</span>
        </motion.button>
      </div>

      {/* ── Settings sheet ── */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="fixed bottom-0 left-0 right-0 z-[95] rounded-t-3xl p-6"
            style={{
              background: isNight ? 'rgba(8,10,22,0.98)' : 'rgba(240,244,255,0.98)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(124,58,237,0.25)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'rgba(255,255,255,0.2)' }} />
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                style={{ background: 'rgba(124,58,237,0.15)' }}>
                {member.avatar ?? '👤'}
              </div>
              <div>
                <p className="font-black text-sm" style={{ color: isNight ? '#fff' : '#1E1B4B' }}>
                  {member.displayName || member.username}
                </p>
                <p className="text-xs" style={{ color: isNight ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                  @{member.username}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Remove from tribe */}
              <button
                onClick={handleRemoveFromTribe}
                className="w-full flex items-center gap-3 p-4 rounded-2xl text-left transition-all active:scale-98"
                style={{ background: 'rgba(217,119,6,0.12)', border: '1px solid rgba(217,119,6,0.25)' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#D97706">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                </svg>
                <div>
                  <p className="font-bold text-sm" style={{ color: '#D97706' }}>Remove from Tribe</p>
                  <p className="text-xs" style={{ color: 'rgba(217,119,6,0.6)' }}>Cannot remove if you have active agreements</p>
                </div>
              </button>

              {/* Block */}
              <button
                onClick={handleBlock}
                disabled={blocking}
                className="w-full flex items-center gap-3 p-4 rounded-2xl text-left transition-all active:scale-98"
                style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.25)' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#DC2626">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.68L5.68 16.9C4.63 15.55 4 13.85 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.68L18.32 7.1C19.37 8.45 20 10.15 20 12c0 4.42-3.58 8-8 8z"/>
                </svg>
                <div>
                  <p className="font-bold text-sm text-red-500">{blocking ? 'Blocking…' : 'Block User'}</p>
                  <p className="text-xs text-red-500/60">They won't be able to contact you</p>
                </div>
              </button>

              <button
                onClick={() => setShowSettings(false)}
                className="w-full p-4 rounded-2xl font-bold text-sm"
                style={{ background: 'rgba(255,255,255,0.06)', color: isNight ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Agreements / Projects sheet ── */}
      <AnimatePresence>
        {showAgreements && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="fixed bottom-0 left-0 right-0 z-[95] rounded-t-3xl"
            style={{
              maxHeight: '70vh',
              background: isNight ? 'rgba(8,10,22,0.98)' : 'rgba(240,244,255,0.98)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(124,58,237,0.25)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'rgba(255,255,255,0.2)' }} />
              <h2 className="font-black text-base mb-4" style={{ color: isNight ? '#fff' : '#1E1B4B' }}>
                Agreements & Projects
              </h2>
            </div>

            <div className="overflow-y-auto px-6 pb-6 space-y-3" style={{ maxHeight: 'calc(70vh - 120px)' }}>
              {agreements.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-3xl mb-2">📋</p>
                  <p className="text-sm" style={{ color: isNight ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                    No active agreements yet.
                  </p>
                  <button
                    onClick={startCollaborativeGoal}
                    className="mt-4 px-5 py-2.5 rounded-2xl text-sm font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #7C3AED, #1877F2)' }}
                  >
                    Start a Collaborative Goal
                  </button>
                </div>
              ) : (
                agreements.map((ag: any) => (
                  <div key={ag.id} className="p-4 rounded-2xl"
                    style={{ background: isNight ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', border: '1px solid rgba(124,58,237,0.18)' }}>
                    <p className="font-bold text-sm" style={{ color: isNight ? '#fff' : '#1E1B4B' }}>
                      {ag.goal?.title ?? 'Collaborative Project'}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: ag.goal?.status === 'active' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.1)', color: ag.goal?.status === 'active' ? '#10B981' : 'rgba(255,255,255,0.5)' }}>
                        {ag.goal?.status ?? 'pending'}
                      </span>
                      {ag.can_cancel && (
                        <button className="text-xs text-red-400 font-bold">Cancel</button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="px-6 pb-6">
              <button onClick={() => setShowAgreements(false)}
                className="w-full p-3.5 rounded-2xl font-bold text-sm"
                style={{ background: 'rgba(255,255,255,0.06)', color: isNight ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
