'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpiritVoice } from './SpiritVoiceProvider';
import { useSpeechRecognition } from '@/lib/hooks/useSpeechRecognition';
import { SPIRIT_VARIANTS, type SpiritVariantId } from '@/components/spirit/SpiritFigure';

type CallState = 'connecting' | 'listening' | 'thinking' | 'speaking' | 'paused';

interface SpiritVoiceCallProps {
  open:       boolean;
  variant:    SpiritVariantId;
  /** Latest Spirit (assistant) message text — spoken + shown as caption. */
  lastSpiritMessage: string;
  /** True while the chat is awaiting / building Spirit's reply. */
  thinking:   boolean;
  /** Send a transcribed phrase into the conversation. */
  onSend:     (text: string) => void;
  onClose:    () => void;
}

// ── Animated Spirit orb (2D, keyed to the chosen variant colour) ──────────────
function SpiritOrb({ color, glow, state }: { color: string; glow: string; state: CallState }) {
  const isSpeaking  = state === 'speaking';
  const isListening = state === 'listening';

  return (
    <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
      {/* Outer glow rings */}
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{ border: `2px solid ${glow}`, width: 200, height: 200 }}
          animate={
            isListening
              ? { scale: [1, 1.35 + i * 0.18, 1], opacity: [0.5, 0, 0.5] }
              : isSpeaking
              ? { scale: [1, 1.18 + i * 0.1, 1], opacity: [0.35, 0, 0.35] }
              : { scale: 1, opacity: 0.12 }
          }
          transition={{ duration: isListening ? 2.2 : 1.4, repeat: Infinity, delay: i * 0.35, ease: 'easeOut' }}
        />
      ))}

      {/* Body */}
      <motion.div
        className="relative rounded-full flex items-center justify-center"
        style={{
          width: 140, height: 140,
          background: `radial-gradient(circle at 38% 32%, ${color}, ${color}cc 60%, ${color}99)`,
          boxShadow: `0 0 60px ${glow}88, inset -8px -10px 24px rgba(0,0,0,0.25), inset 6px 8px 20px rgba(255,255,255,0.18)`,
        }}
        animate={
          isSpeaking
            ? { scale: [1, 1.06, 0.98, 1.04, 1], y: [0, -3, 0] }
            : isListening
            ? { scale: [1, 1.03, 1], y: [0, -4, 0] }
            : { scale: 1, y: [0, -3, 0] }
        }
        transition={{
          duration: isSpeaking ? 0.5 : 2.6,
          repeat: Infinity,
          ease: isSpeaking ? 'easeInOut' : 'easeInOut',
        }}
      >
        {/* Eyes */}
        <div className="flex gap-5" style={{ marginTop: -6 }}>
          {[0, 1].map(i => (
            <motion.div
              key={i}
              className="rounded-full bg-[#0A0A12] relative"
              style={{ width: 26, height: 30 }}
              animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
              transition={{ duration: 4, repeat: Infinity, delay: 1 + i * 0.05, times: [0, 0.46, 0.5, 0.54, 1] }}
            >
              <span className="absolute rounded-full bg-white" style={{ width: 8, height: 8, top: 5, left: 5 }} />
              <span className="absolute rounded-full bg-white/70" style={{ width: 4, height: 4, bottom: 6, right: 6 }} />
            </motion.div>
          ))}
        </div>
        {/* Smile */}
        <div
          className="absolute"
          style={{
            bottom: 42, width: 30, height: 15,
            borderBottom: '4px solid #0A0A12',
            borderRadius: '0 0 30px 30px',
          }}
        />
      </motion.div>
    </div>
  );
}

// ── Listening waveform ────────────────────────────────────────────────────────
function Waveform({ active, color }: { active: boolean; color: string }) {
  return (
    <div className="flex items-end justify-center gap-1.5" style={{ height: 36 }}>
      {[0, 1, 2, 3, 4, 5, 6].map(i => (
        <motion.span
          key={i}
          className="rounded-full"
          style={{ width: 4, background: color }}
          animate={active ? { height: [6, 22 + (i % 3) * 8, 6] } : { height: 6 }}
          transition={{ duration: 0.7 + (i % 4) * 0.12, repeat: Infinity, ease: 'easeInOut', delay: i * 0.06 }}
        />
      ))}
    </div>
  );
}

export function SpiritVoiceCall({
  open, variant, lastSpiritMessage, thinking, onSend, onClose,
}: SpiritVoiceCallProps) {
  const v = SPIRIT_VARIANTS.find(s => s.id === variant) ?? SPIRIT_VARIANTS[0];
  const { speak, stop, speaking } = useSpiritVoice();

  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);
  mutedRef.current = muted;

  // Track the last message we spoke so we don't repeat it
  const spokenRef = useRef<string>('');

  const { supported, listening, transcript, error, start, stop: stopListening, reset } =
    useSpeechRecognition({
      silenceMs: 1500,
      onResult: (final) => {
        if (final.trim()) onSend(final.trim());
      },
    });

  // Derive the call state for visuals
  const state: CallState =
    speaking   ? 'speaking'
    : thinking ? 'thinking'
    : listening ? 'listening'
    : muted     ? 'paused'
    : open      ? 'listening'
    : 'connecting';

  // On open: greet by speaking the latest Spirit message, then the loop listens.
  useEffect(() => {
    if (!open) { spokenRef.current = ''; return; }
    if (lastSpiritMessage && lastSpiritMessage !== spokenRef.current) {
      spokenRef.current = lastSpiritMessage;
      if (!mutedRef.current) speak(lastSpiritMessage.split('\n')[0], 'casual');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Speak each NEW Spirit reply as it arrives during the call
  useEffect(() => {
    if (!open || muted) return;
    if (lastSpiritMessage && lastSpiritMessage !== spokenRef.current) {
      spokenRef.current = lastSpiritMessage;
      speak(lastSpiritMessage.split('\n').slice(0, 3).join(' '), 'casual');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastSpiritMessage]);

  // The conversational loop: when Spirit is done (not speaking/thinking) and
  // we're not already listening, start listening again.
  useEffect(() => {
    if (!open || muted || !supported) return;
    if (speaking || thinking || listening) return;
    const t = setTimeout(() => start(), 400);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, muted, supported, speaking, thinking, listening]);

  // Cleanup when the call closes
  useEffect(() => {
    if (open) return;
    stopListening();
    stop();
    reset();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleClose() {
    stopListening();
    stop();
    onClose();
  }

  function handleMicTap() {
    if (listening) { stopListening(); }
    else if (!speaking && !thinking) { reset(); start(); }
  }

  function toggleMute() {
    setMuted(m => {
      const next = !m;
      if (next) { stop(); stopListening(); }
      return next;
    });
  }

  const stateLabel =
    state === 'speaking'  ? 'Spirit is speaking…'
    : state === 'thinking' ? 'Spirit is thinking…'
    : state === 'paused'   ? 'Paused'
    : listening            ? 'Listening…'
    : 'Tap the mic to talk';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[120] flex flex-col items-center justify-between py-12 px-6"
          style={{ background: 'radial-gradient(ellipse at 50% 35%, #14163A 0%, #05060F 70%, #03040A 100%)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Header */}
          <div className="w-full max-w-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: v.glowColor }}>
                Spirit Voice
              </p>
              <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{v.label}</p>
            </div>
            <button
              onClick={toggleMute}
              className="px-3 py-1.5 rounded-full text-[11px] font-bold"
              style={{
                background: muted ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.07)',
                color: muted ? '#F87171' : 'rgba(255,255,255,0.7)',
                border: `1px solid ${muted ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.1)'}`,
              }}
            >
              {muted ? '🔇 Muted' : '🔊 Sound on'}
            </button>
          </div>

          {/* Orb + state */}
          <div className="flex flex-col items-center gap-6">
            <SpiritOrb color={v.color} glow={v.glowColor} state={state} />

            <motion.p
              key={stateLabel}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm font-bold"
              style={{ color: 'rgba(255,255,255,0.85)' }}
            >
              {stateLabel}
            </motion.p>

            {state === 'thinking' && (
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <motion.span key={i} className="w-2 h-2 rounded-full" style={{ background: v.glowColor }}
                    animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} />
                ))}
              </div>
            )}
            {(listening || state === 'listening') && state !== 'thinking' && state !== 'speaking' && (
              <Waveform active={listening} color={v.glowColor} />
            )}
          </div>

          {/* Live transcript / caption */}
          <div className="w-full max-w-sm min-h-[88px] flex flex-col items-center justify-end gap-2">
            {transcript && (
              <div className="px-4 py-2.5 rounded-2xl max-w-full"
                style={{ background: 'linear-gradient(135deg,#7C3AED,#1877F2)' }}>
                <p className="text-sm text-white text-center leading-snug">{transcript}</p>
              </div>
            )}
            {!transcript && lastSpiritMessage && (
              <p className="text-xs text-center leading-relaxed px-4"
                style={{ color: 'rgba(255,255,255,0.55)' }}>
                {lastSpiritMessage.split('\n')[0]}
              </p>
            )}
            {error && (
              <p className="text-[11px] text-center px-4" style={{ color: '#F87171' }}>{error}</p>
            )}
            {!supported && (
              <p className="text-[11px] text-center px-4" style={{ color: '#FBBF24' }}>
                Voice input isn&apos;t supported in this browser. Try Chrome, Edge, or Safari.
              </p>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-8">
            {/* Mic toggle */}
            <button
              onClick={handleMicTap}
              disabled={!supported || speaking || thinking}
              className="w-16 h-16 rounded-full flex items-center justify-center transition-all disabled:opacity-40"
              style={{
                background: listening
                  ? `linear-gradient(135deg, ${v.glowColor}, ${v.color})`
                  : 'rgba(255,255,255,0.08)',
                border: `1.5px solid ${listening ? v.glowColor : 'rgba(255,255,255,0.15)'}`,
                boxShadow: listening ? `0 0 28px ${v.glowColor}77` : 'none',
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <rect x="9" y="3" width="6" height="11" rx="3" fill="#fff" />
                <path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            {/* End call */}
            <button
              onClick={handleClose}
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: '#EF4444', boxShadow: '0 8px 28px rgba(239,68,68,0.45)' }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path d="M21 15.46l-5.27-.61-2.52 2.52a15.05 15.05 0 0 1-6.59-6.59l2.53-2.53L8.04 3H3.03C2.45 12.32 9.68 19.55 19 18.97v-3.51z"
                  fill="#fff" transform="rotate(135 12 12)" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
