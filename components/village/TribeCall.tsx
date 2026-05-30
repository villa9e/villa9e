'use client';
import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { UseWebRTCReturn, CallMessage } from '@/lib/webrtc/useWebRTC';

// ─── Utilities ────────────────────────────────────────────────────────────────
function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

// ─── Local video preview (picture-in-picture) ─────────────────────────────────
function LocalPreview({ stream, isCameraOff }: { stream: MediaStream | null; isCameraOff: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);

  return (
    <motion.div
      drag dragMomentum={false}
      className="absolute bottom-20 right-3 z-20 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20"
      style={{ width: 120, height: 88, cursor: 'grab' }}
      whileDrag={{ cursor: 'grabbing', scale: 1.04 }}
    >
      {isCameraOff || !stream ? (
        <div className="w-full h-full flex items-center justify-center" style={{ background: '#1A1C2E' }}>
          <span style={{ fontSize: 28 }}>😶</span>
        </div>
      ) : (
        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
      )}
      <div className="absolute bottom-1 left-1 text-[9px] text-white/60 font-bold px-1">You</div>
    </motion.div>
  );
}

// ─── Remote video ─────────────────────────────────────────────────────────────
function RemoteVideo({ stream, userName, avatar }: { stream: MediaStream | null; userName: string; avatar?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);

  if (!stream) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center" style={{ background: '#F8F9FF' }}>
        <motion.div
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mb-4"
          style={{ background: 'rgba(124,58,237,0.2)', border: '3px solid rgba(124,58,237,0.5)' }}
        >
          {avatar ?? '👤'}
        </motion.div>
        <p className="text-white font-black text-lg">{userName}</p>
        <p className="text-white/40 text-sm mt-1">Connecting…</p>
        <div className="flex gap-1.5 mt-4">
          {[0, 1, 2].map(i => (
            <motion.div key={i} className="w-2 h-2 rounded-full bg-purple-400"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative overflow-hidden" style={{ background: '#000' }}>
      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
      <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm rounded-xl px-3 py-1">
        <p className="text-white text-sm font-bold">{userName}</p>
      </div>
    </div>
  );
}

// ─── Chat panel ───────────────────────────────────────────────────────────────
function ChatPanel({
  messages, currentUserId, onSend, isNight,
}: {
  messages: CallMessage[];
  currentUserId: string | null;
  onSend: (msg: string) => void;
  isNight: boolean;
}) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  function send() {
    const msg = input.trim();
    if (!msg) return;
    onSend(msg);
    setInput('');
  }

  return (
    <div className="flex flex-col h-full" style={{ borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="px-3 py-2.5 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-white/70 text-xs font-bold uppercase tracking-widest">Chat</p>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2" style={{ scrollbarWidth: 'none' }}>
        {messages.length === 0 && (
          <p className="text-white/25 text-xs text-center mt-8">Send a message during the call</p>
        )}
        {messages.map(m => (
          <div key={m.id} className={`flex flex-col ${m.sender_id === currentUserId ? 'items-end' : 'items-start'}`}>
            {m.sender_id !== currentUserId && (
              <p className="text-white/40 text-[10px] mb-0.5 px-1">{m.sender_name}</p>
            )}
            <div
              className="rounded-2xl px-3 py-2 max-w-[88%] text-sm"
              style={{
                background: m.sender_id === currentUserId
                  ? 'linear-gradient(135deg, #7C3AED, #1877F2)'
                  : 'rgba(255,255,255,0.1)',
                color: '#fff',
                wordBreak: 'break-word',
              }}
            >
              {m.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="px-3 pb-3 flex gap-2 flex-shrink-0">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') send(); }}
          placeholder="Message…"
          className="flex-1 rounded-2xl px-3 py-2 text-sm outline-none text-white placeholder:text-white/25"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
        />
        <button onClick={send} disabled={!input.trim()}
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-30 transition-all"
          style={{ background: '#7C3AED' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Control button ───────────────────────────────────────────────────────────
function CtrlBtn({
  onClick, active = false, danger = false, label, children,
}: {
  onClick: () => void; active?: boolean; danger?: boolean; label: string;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.88 }}
      whileHover={{ scale: 1.08 }}
      onClick={onClick}
      title={label}
      className="flex flex-col items-center gap-1.5 cursor-pointer"
    >
      <div className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
        style={{
          background: danger ? '#DC2626' : active ? 'rgba(220,38,38,0.85)' : 'rgba(255,255,255,0.12)',
          border: danger ? 'none' : `1.5px solid ${active ? 'transparent' : 'rgba(255,255,255,0.15)'}`,
        }}>
        {children}
      </div>
      <span className="text-[9px] text-white/50 font-medium">{label}</span>
    </motion.button>
  );
}

// ─── Incoming call overlay ────────────────────────────────────────────────────
export function IncomingCallOverlay({
  callerName, callerAvatar, onAccept, onDecline,
}: {
  callerName: string; callerAvatar?: string;
  onAccept: () => void; onDecline: () => void;
}) {
  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -120, opacity: 0 }}
      className="fixed top-4 left-1/2 z-[200]"
      style={{ transform: 'translateX(-50%)', width: 'min(92vw, 380px)' }}
    >
      <div className="rounded-3xl p-5 flex items-center gap-4"
        style={{ background: 'rgba(8,10,22,0.96)', backdropFilter: 'blur(24px)', border: '1px solid rgba(124,58,237,0.4)', boxShadow: '0 20px 60px rgba(0,0,0,0.7)' }}>
        {/* Avatar pulse */}
        <div className="relative flex-shrink-0">
          <motion.div className="absolute inset-0 rounded-full"
            style={{ background: 'rgba(124,58,237,0.3)' }}
            animate={{ scale: [1, 1.6, 1], opacity: [0.7, 0, 0.7] }}
            transition={{ duration: 1.8, repeat: Infinity }} />
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-3xl relative z-10"
            style={{ background: 'rgba(124,58,237,0.2)', border: '2px solid rgba(124,58,237,0.5)' }}>
            {callerAvatar ?? '👤'}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white/50 text-xs font-medium">Incoming call</p>
          <p className="text-white font-black text-base truncate">{callerName}</p>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          {/* Decline */}
          <motion.button whileTap={{ scale: 0.9 }} onClick={onDecline}
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: '#DC2626' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
            </svg>
          </motion.button>
          {/* Accept */}
          <motion.button whileTap={{ scale: 0.9 }} onClick={onAccept}
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: '#16A34A' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
            </svg>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main call panel — slides in from right ───────────────────────────────────
export function TribeCallPanel({
  webrtc, isNight, currentUserId,
}: {
  webrtc: UseWebRTCReturn;
  isNight: boolean;
  currentUserId: string | null;
}) {
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const unreadRef = useRef(0);
  const [unread, setUnread] = useState(0);

  const { callState, localStream, remoteStream, isMuted, isCameraOff,
    isScreenSharing, callMessages, callDuration, remoteUser,
    endCall, toggleMute, toggleCamera, toggleScreenShare, sendMessage } = webrtc;

  useEffect(() => {
    if (!showChat) {
      setUnread(prev => prev + (callMessages.length > unreadRef.current ? 1 : 0));
    } else {
      setUnread(0);
    }
    unreadRef.current = callMessages.length;
  }, [callMessages.length, showChat]);

  const panelW = isFullscreen ? '100vw' : 'min(92vw, 480px)';

  return (
    <motion.div
      key="call-panel"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 260 }}
      className="fixed top-0 right-0 bottom-0 z-[120] flex"
      style={{ width: panelW }}
    >
      <div className="flex flex-col w-full h-full" style={{ background: '#FAFBFF', borderLeft: '1px solid rgba(124,58,237,0.25)' }}>

        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
          style={{ background: 'rgba(0,0,0,0.5)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {/* Remote user info */}
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: 'rgba(124,58,237,0.2)', border: '1.5px solid rgba(124,58,237,0.4)' }}>
            {remoteUser?.avatar ?? '👤'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-black text-sm truncate">{remoteUser?.name ?? 'Tribe Member'}</p>
            <p className="text-white/45 text-xs">
              {callState === 'active' ? formatDuration(callDuration) : callState === 'connecting' ? 'Connecting…' : 'Calling…'}
            </p>
          </div>
          {/* Connection quality dot */}
          <div className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: callState === 'active' ? '#4ADE80' : '#F59E0B' }} />
          {/* Fullscreen toggle */}
          <button onClick={() => setIsFullscreen(f => !f)}
            className="w-8 h-8 rounded-full flex items-center justify-center ml-1"
            style={{ background: 'rgba(255,255,255,0.07)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(255,255,255,0.6)">
              {isFullscreen
                ? <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
                : <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>}
            </svg>
          </button>
        </div>

        {/* ── Content area: video + optional chat ── */}
        <div className="flex flex-1 overflow-hidden">
          {/* Video area */}
          <div className="flex flex-col flex-1 relative overflow-hidden">
            {/* Remote video */}
            <RemoteVideo stream={remoteStream} userName={remoteUser?.name ?? ''} avatar={remoteUser?.avatar} />

            {/* Local PIP */}
            <LocalPreview stream={localStream} isCameraOff={isCameraOff} />
          </div>

          {/* Chat sidebar */}
          <AnimatePresence>
            {showChat && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 200, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="flex-shrink-0 h-full overflow-hidden"
                style={{ background: 'rgba(0,0,0,0.4)' }}
              >
                <ChatPanel
                  messages={callMessages}
                  currentUserId={currentUserId}
                  onSend={sendMessage}
                  isNight={isNight}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Screen-share indicator ── */}
        {isScreenSharing && (
          <div className="flex items-center gap-2 px-4 py-2 flex-shrink-0"
            style={{ background: 'rgba(16,185,129,0.15)', borderTop: '1px solid rgba(16,185,129,0.3)' }}>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <p className="text-green-400 text-xs font-bold">Sharing your screen</p>
          </div>
        )}

        {/* ── Control bar ── */}
        <div className="px-4 py-4 flex-shrink-0"
          style={{ background: 'rgba(0,0,0,0.7)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between">

            {/* Left controls */}
            <div className="flex gap-4">
              <CtrlBtn onClick={toggleMute} active={isMuted} label={isMuted ? 'Unmute' : 'Mute'}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
                  {isMuted
                    ? <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/>
                    : <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.49 6-3.31 6-6.72h-1.7z"/>}
                </svg>
              </CtrlBtn>

              <CtrlBtn onClick={toggleCamera} active={isCameraOff} label={isCameraOff ? 'Camera on' : 'Camera off'}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
                  {isCameraOff
                    ? <path d="M21 6.5l-4-4-9.97 9.97-3.54 3.54.71.71L7.73 19H4c-1.1 0-2-.9-2-2V7c0-1.1.9-2 2-2h.73L3 3.27 1.27 5 0 3.73 1.27 2.45 21 22.18l1.27-1.27L21 19.45V6.5zm-11 0h4.5L10 10.5V6.5zM20 7v10l-4-4V9l-2 2-1.41-1.41L20 7z"/>
                    : <path d="M15 8v8H5V8h10m1-2H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4V7c0-.55-.45-1-1-1z"/>}
                </svg>
              </CtrlBtn>
            </div>

            {/* Center: End call */}
            <CtrlBtn onClick={endCall} danger label="End">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
              </svg>
            </CtrlBtn>

            {/* Right controls */}
            <div className="flex gap-4">
              <CtrlBtn onClick={() => toggleScreenShare()} active={isScreenSharing} label="Share">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
                  <path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/>
                </svg>
              </CtrlBtn>

              <CtrlBtn onClick={() => { setShowChat(c => !c); setUnread(0); }} active={showChat} label={`Chat${unread > 0 ? ` (${unread})` : ''}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                </svg>
                {unread > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-[9px] font-bold text-white">
                    {unread}
                  </div>
                )}
              </CtrlBtn>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
