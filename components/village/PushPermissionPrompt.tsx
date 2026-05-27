'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID ?? '';
const STORAGE_KEY = 'villa9e_push_asked';

export function PushPermissionPrompt() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    // Only show if: logged in, not asked before, browser supports notifications
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') return;
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    // Wait 8 seconds before prompting (let the user settle in first)
    const timer = setTimeout(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setShow(true);
    }, 8000);

    return () => clearTimeout(timer);
  }, []);

  async function enable() {
    setLoading(true);
    sessionStorage.setItem(STORAGE_KEY, '1');

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted' && ONESIGNAL_APP_ID) {
        // Initialize OneSignal
        const OneSignal = (window as any).OneSignal;
        if (OneSignal) {
          await OneSignal.init({ appId: ONESIGNAL_APP_ID, allowLocalhostAsSecureOrigin: true });
          await OneSignal.Slidedown.promptPush();
        }
      }
    } catch { /* user denied or blocked */ }

    setShow(false);
    setLoading(false);
  }

  function dismiss() {
    sessionStorage.setItem(STORAGE_KEY, '1');
    setShow(false);
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 80, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          className="fixed bottom-20 left-4 right-4 z-50 max-w-sm mx-auto"
        >
          <div
            className="rounded-3xl p-5 shadow-2xl"
            style={{
              background: 'rgba(8,12,24,0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(24,119,242,0.2) inset',
            }}
          >
            <div className="flex items-start gap-4">
              {/* Spirit avatar placeholder */}
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl"
                style={{ background: 'linear-gradient(135deg, rgba(24,119,242,0.3), rgba(124,58,237,0.2))', border: '1px solid rgba(24,119,242,0.3)' }}>
                🌀
              </div>
              <div className="flex-1">
                <p className="font-black text-white text-sm">Spirit wants to reach you</p>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Allow notifications so Spirit can send you check-ins, OoWop alerts, and goal reminders — even when the app is closed.
                </p>
              </div>
              <button
                onClick={dismiss}
                className="text-white/30 hover:text-white/60 transition-colors text-lg leading-none flex-shrink-0"
              >
                ×
              </button>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={dismiss}
                className="flex-1 py-2.5 rounded-2xl text-xs font-semibold transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}
              >
                Not now
              </button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={enable}
                disabled={loading}
                className="flex-1 py-2.5 rounded-2xl text-xs font-black text-white disabled:opacity-60 transition-all"
                style={{
                  background: 'linear-gradient(135deg, #1877F2, #1565c0)',
                  boxShadow: '0 4px 16px rgba(24,119,242,0.4)',
                }}
              >
                {loading ? '…' : '🔔 Enable Notifications'}
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
