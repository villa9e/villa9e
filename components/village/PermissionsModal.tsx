'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  open:          boolean;
  onClose:       () => void;
  onGranted:     (mic: boolean, camera: boolean) => void;
  requestCamera?: boolean;  // false = mic only (voice)
}

export function PermissionsModal({ open, onClose, onGranted, requestCamera = false }: Props) {
  const [step, setStep]       = useState<'intro' | 'requesting' | 'done' | 'denied'>('intro');
  const [micOk, setMicOk]     = useState(false);
  const [camOk, setCamOk]     = useState(false);

  async function requestAll() {
    setStep('requesting');
    let mic = false, cam = false;

    // Mic — required for voice input to Spirit
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      stream.getTracks().forEach(t => t.stop());
      mic = true;
    } catch { mic = false; }

    // Camera — only if requestCamera=true (Hospital video calls)
    if (requestCamera) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
        stream.getTracks().forEach(t => t.stop());
        cam = true;
      } catch { cam = false; }
    }

    setMicOk(mic); setCamOk(cam);
    setStep(!mic && !cam && requestCamera ? 'denied' : 'done');
    localStorage.setItem('villa9e_mic_granted', String(mic));
    if (requestCamera) localStorage.setItem('villa9e_cam_granted', String(cam));
    onGranted(mic, cam);
  }

  function skip() {
    localStorage.setItem('villa9e_mic_granted', 'skipped');
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
        >
          <motion.div
            initial={{ y: 60, scale: 0.95 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            className="w-full max-w-sm rounded-3xl overflow-hidden"
            style={{ background: '#FFFFFF', border: '1px solid rgba(24,119,242,0.25)' }}
          >
            {step === 'intro' && (
              <div className="p-6 space-y-5">
                <div className="text-center space-y-3">
                  <div className="text-5xl">🎙️</div>
                  <h2 className="text-xl font-black text-white">
                    {requestCamera ? 'Voice & Camera Access' : 'Voice Access'}
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', lineHeight: 1.6 }}>
                    Spirit needs these to talk with you. You can always change this in your phone settings.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 rounded-2xl p-3"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <span className="text-2xl flex-shrink-0">🎙️</span>
                    <div>
                      <p className="text-sm font-bold text-white">Microphone</p>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
                        Lets you speak to Spirit and get voice responses
                      </p>
                    </div>
                  </div>

                  {requestCamera && (
                    <div className="flex items-start gap-3 rounded-2xl p-3"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <span className="text-2xl flex-shrink-0">📷</span>
                      <div>
                        <p className="text-sm font-bold text-white">Camera</p>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
                          Required for Hospital video consultations
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <button onClick={requestAll}
                    className="w-full py-3.5 rounded-2xl font-black text-white text-sm"
                    style={{ background: 'linear-gradient(135deg,#1877F2,#7C3AED)' }}>
                    Allow Access →
                  </button>
                  <button onClick={skip}
                    className="w-full py-3 text-sm"
                    style={{ color: 'rgba(255,255,255,0.3)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                    Not now — text only
                  </button>
                </div>
              </div>
            )}

            {step === 'requesting' && (
              <div className="p-10 text-center space-y-4">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
                <p className="text-white font-bold">Waiting for your approval…</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
                  A system popup will appear — tap "Allow"
                </p>
              </div>
            )}

            {step === 'done' && (
              <div className="p-8 text-center space-y-4">
                <div className="text-5xl">✓</div>
                <h3 className="text-xl font-black text-white">All set!</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-xl px-4 py-2.5"
                    style={{ background: 'rgba(34,197,94,0.1)' }}>
                    <span className="text-sm text-white">Microphone</span>
                    <span style={{ color: micOk ? '#4ADE80' : '#F87171' }}>{micOk ? '✓ Granted' : '✗ Denied'}</span>
                  </div>
                  {requestCamera && (
                    <div className="flex items-center justify-between rounded-xl px-4 py-2.5"
                      style={{ background: 'rgba(34,197,94,0.1)' }}>
                      <span className="text-sm text-white">Camera</span>
                      <span style={{ color: camOk ? '#4ADE80' : '#F87171' }}>{camOk ? '✓ Granted' : '✗ Denied'}</span>
                    </div>
                  )}
                </div>
                <button onClick={onClose}
                  className="w-full py-3 rounded-2xl font-bold text-white text-sm"
                  style={{ background: '#1877F2' }}>
                  Start Talking to Spirit
                </button>
              </div>
            )}

            {step === 'denied' && (
              <div className="p-8 text-center space-y-4">
                <div className="text-4xl">🔒</div>
                <h3 className="text-lg font-black text-white">Permission denied</h3>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', lineHeight: 1.6 }}>
                  To enable voice, go to your browser settings and allow microphone access for villa9e.app
                </p>
                <button onClick={onClose}
                  className="w-full py-3 rounded-2xl font-bold text-sm"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', border: 'none', cursor: 'pointer' }}>
                  Use Text Only
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
