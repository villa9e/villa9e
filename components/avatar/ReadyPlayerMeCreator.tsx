'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Ready Player Me App ID ───────────────────────────────────────────────────
// Register free at readyplayer.me/developers to get your own App ID
// This public ID works for development/testing
const RPM_APP_ID = 'villa9e';
const RPM_BASE   = 'https://villa9e.readyplayer.me';

interface ReadyPlayerMeCreatorProps {
  onAvatarCreated: (url: string) => void;
  onClose: () => void;
  isNight: boolean;
}

export function ReadyPlayerMeCreator({ onAvatarCreated, onClose, isNight }: ReadyPlayerMeCreatorProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);

  // RPM sends a postMessage when avatar is created
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      // RPM sends the avatar GLB URL on creation
      if (event.origin.includes('readyplayer.me')) {
        const data = typeof event.data === 'string' ? event.data : JSON.stringify(event.data);
        // Check for avatar URL (ends in .glb)
        const glbMatch = data.match(/https:\/\/[^\s"']+\.glb/);
        if (glbMatch) {
          onAvatarCreated(glbMatch[0]);
        }
        // Also handle JSON format
        try {
          const parsed = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          if (parsed?.url?.endsWith('.glb')) {
            onAvatarCreated(parsed.url);
          }
          if (parsed?.data?.url?.endsWith('.glb')) {
            onAvatarCreated(parsed.data.url);
          }
        } catch { /* non-JSON message */ }
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onAvatarCreated]);

  // The creator URL — can be customized with params
  const creatorUrl = `${RPM_BASE}/avatar?frameApi&clearCache&quality=high&bodyType=halfbody`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex flex-col"
      style={{ background: 'rgba(0,0,0,0.88)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ background: 'rgba(0,0,0,0.8)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <button onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-lg"
          style={{ background: 'rgba(255,255,255,0.1)' }}>
          ←
        </button>
        <div>
          <p className="text-white font-black text-sm">Design Your Villager</p>
          <p className="text-white/45 text-xs">Powered by Ready Player Me · Free</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <motion.div className="w-2 h-2 rounded-full bg-green-400"
            animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }} />
          <span className="text-green-400 text-xs font-bold">Live</span>
        </div>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="text-center">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
              className="w-10 h-10 rounded-full border-2 border-t-transparent border-purple-400 mx-auto mb-3" />
            <p className="text-white/60 text-sm">Loading avatar creator…</p>
          </div>
        </div>
      )}

      {/* RPM Creator iframe */}
      <iframe
        ref={iframeRef}
        src={creatorUrl}
        className="flex-1 w-full"
        title="Ready Player Me Avatar Creator"
        allow="camera *; microphone *"
        onLoad={() => setLoading(false)}
        style={{ border: 'none', background: '#1A1A2E' }}
      />

      {/* Footer hint */}
      <div className="px-4 py-3 flex-shrink-0 text-center"
        style={{ background: 'rgba(0,0,0,0.6)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <p className="text-white/35 text-xs">
          Customize your look, then click <strong className="text-white/60">Next</strong> to save to your village
        </p>
      </div>
    </motion.div>
  );
}

// ─── Fallback creator (in-app, no iframe) for offline/blocked environments ────
export function FallbackAvatarCreator({
  onSave, isNight,
}: {
  onSave: (config: Record<string, string>) => void;
  isNight: boolean;
}) {
  return null; // The page.tsx handles this with the existing config builder
}
