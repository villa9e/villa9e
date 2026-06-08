'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ---------------------------------------------------------------------------
// SVG icons — no emojis
// ---------------------------------------------------------------------------

// Sprint-specific badge config
interface BadgeConfig {
  id:          string;
  name:        string;
  icon:        (size: number) => React.ReactNode;
  ringStart:   string;
  ringEnd:     string;
}

function getBadgeConfig(sprintNumber: number, totalSprints: number): BadgeConfig {
  if (sprintNumber === totalSprints && totalSprints > 0) {
    return {
      id: 'goal_complete',
      name: 'Goal Complete',
      ringStart: '#F59E0B',
      ringEnd: '#EF4444',
      icon: (size) => (
        // Gold teepee
        <svg width={size} height={size} viewBox="0 0 44 44" fill="none" aria-hidden="true">
          <polygon points="22,6 38,38 6,38" fill="url(#teepeeGrad)" opacity="0.95" />
          <rect x="20" y="28" width="4" height="12" fill="white" opacity="0.8" rx="1" />
          <circle cx="22" cy="14" r="3" fill="white" opacity="0.7" />
          <defs>
            <linearGradient id="teepeeGrad" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#EF4444" />
            </linearGradient>
          </defs>
        </svg>
      ),
    };
  }
  if (sprintNumber === 25) {
    return {
      id: 'sprint_master',
      name: 'Sprint Master',
      ringStart: '#8B5CF6',
      ringEnd: '#EC4899',
      icon: (size) => (
        // Purple crown
        <svg width={size} height={size} viewBox="0 0 44 44" fill="none" aria-hidden="true">
          <path d="M6 34h32v5H6z" fill="url(#crownBase)" opacity="0.9" rx="2" />
          <path d="M6 34L10 18l12 10 12-10 4 16H6z" fill="url(#crownBody)" opacity="0.95" />
          <circle cx="22" cy="18" r="3" fill="white" opacity="0.8" />
          <defs>
            <linearGradient id="crownBase" x1="0" y1="0" x2="44" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>
            <linearGradient id="crownBody" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>
          </defs>
        </svg>
      ),
    };
  }
  if (sprintNumber === 10) {
    return {
      id: 'dedicated',
      name: 'Dedicated',
      ringStart: '#1877F2',
      ringEnd: '#0EA5E9',
      icon: (size) => (
        // Blue star
        <svg width={size} height={size} viewBox="0 0 44 44" fill="none" aria-hidden="true">
          <path d="M22 6l4 10h11L28 23l4 12-10-7-10 7 4-12L7 16h11z"
            fill="url(#starGrad)" opacity="0.95" />
          <defs>
            <linearGradient id="starGrad" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1877F2" />
              <stop offset="100%" stopColor="#0EA5E9" />
            </linearGradient>
          </defs>
        </svg>
      ),
    };
  }
  if (sprintNumber === 5) {
    return {
      id: 'momentum',
      name: 'Momentum',
      ringStart: '#F59E0B',
      ringEnd: '#EF4444',
      icon: (size) => (
        // Amber lightning bolt
        <svg width={size} height={size} viewBox="0 0 44 44" fill="none" aria-hidden="true">
          <path d="M26 6L12 26h11l-5 14 19-22H26z" fill="url(#lightningGrad)" opacity="0.95" />
          <defs>
            <linearGradient id="lightningGrad" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#EF4444" />
            </linearGradient>
          </defs>
        </svg>
      ),
    };
  }
  if (sprintNumber === 1) {
    return {
      id: 'first_steps',
      name: 'First Steps',
      ringStart: '#1D9E75',
      ringEnd: '#0EA5E9',
      icon: (size) => (
        // Teal shield
        <svg width={size} height={size} viewBox="0 0 44 44" fill="none" aria-hidden="true">
          <path d="M22 6l16 6v14c0 8-7 14-16 17C6 40 0 34 0 26V12l16-6z"
            transform="translate(3,2)"
            fill="url(#shieldGrad)" opacity="0.95" />
          <path d="M15 22l5 5 9-9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <defs>
            <linearGradient id="shieldGrad" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1D9E75" />
              <stop offset="100%" stopColor="#0EA5E9" />
            </linearGradient>
          </defs>
        </svg>
      ),
    };
  }
  // Default — sprint number badge
  return {
    id: `sprint_${sprintNumber}`,
    name: `Sprint ${sprintNumber}`,
    ringStart: '#F59E0B',
    ringEnd: '#0EA5E9',
    icon: (size) => (
      <svg width={size} height={size} viewBox="0 0 44 44" fill="none" aria-hidden="true">
        <circle cx="22" cy="22" r="20" fill="url(#defaultGrad)" />
        <text x="22" y="28" textAnchor="middle" fill="white" fontSize="16" fontWeight="800"
          fontFamily="system-ui,sans-serif">{sprintNumber}</text>
        <defs>
          <linearGradient id="defaultGrad" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#0EA5E9" />
          </linearGradient>
        </defs>
      </svg>
    ),
  };
}

function ArrowRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="12" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="4" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="13" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10.5 3.75L5.5 7.25M5.5 8.75l5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function GalleryIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21,15 16,10 5,21" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14,2 14,8 20,8" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  );
}

function TeepeeIcon({ pulsing }: { pulsing?: boolean }) {
  return (
    <motion.svg
      width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true"
      animate={pulsing ? { scale: [1, 1.12, 1] } : {}}
      transition={pulsing ? { repeat: Infinity, duration: 1.2, ease: 'easeInOut' } : {}}
    >
      <polygon points="24,4 44,44 4,44" fill="none" stroke="#0EA5E9" strokeWidth="2.5" strokeLinejoin="round" />
      <line x1="24" y1="4" x2="24" y2="44" stroke="#0EA5E9" strokeWidth="1.5" />
      <line x1="19" y1="4" x2="12" y2="0" stroke="#0EA5E9" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="24" y1="4" x2="24" y2="0" stroke="#0EA5E9" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="29" y1="4" x2="36" y2="0" stroke="#0EA5E9" strokeWidth="1.5" strokeLinecap="round" />
    </motion.svg>
  );
}

// ---------------------------------------------------------------------------
// VLG toast
// ---------------------------------------------------------------------------
function VlgToast({ amount, onDone }: { amount: number; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      transition={{ type: 'spring', damping: 18, stiffness: 350 }}
      style={{
        position: 'fixed',
        bottom: 100,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 80,
        background: 'rgba(239,159,39,0.95)',
        borderRadius: 999,
        padding: '10px 22px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        boxShadow: '0 8px 32px rgba(239,159,39,0.4)',
      }}
    >
      <span style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>+{amount} $VLG earned</span>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Sprint celebration overlay (spec §11.4)
// ---------------------------------------------------------------------------

interface SprintCelebrationProps {
  sprint: any;
  done: number;
  total: number;
  onClose: () => void;
}

function SprintCelebration({ sprint, done, total, onClose }: SprintCelebrationProps) {
  const router = useRouter();
  const [sharing, setSharing] = useState(false);

  const weekStart = sprint?.week_start ? new Date(sprint.week_start) : null;
  const weekEnd   = sprint?.week_end   ? new Date(sprint.week_end)   : null;
  const weekRange = weekStart && weekEnd
    ? `${weekStart.toLocaleDateString('en', { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString('en', { month: 'short', day: 'numeric' })}`
    : '';

  const sprintNumber = sprint?.sprint_number ?? 0;
  const badge = getBadgeConfig(sprintNumber, total);

  // Badge awarding happens server-side in PATCH /api/sprints via checkAndAwardAchievements —
  // no separate unlock call needed here.

  async function startNextSprint() {
    try {
      const supabase = createClient();
      const { data: nextSprint } = await supabase
        .from('sprints')
        .select('id')
        .eq('goal_id', sprint.goal_id)
        .eq('sprint_number', (sprint.sprint_number ?? 0) + 1)
        .maybeSingle();

      if (nextSprint?.id) {
        router.push(`/village/workshop/sprint/${nextSprint.id}`);
      } else {
        router.push(sprint.goal_id ? `/village/workshop/goal/${sprint.goal_id}` : '/village/workshop');
      }
    } catch {
      router.push('/village/workshop');
    }
    onClose();
  }

  async function shareToDreamLine() {
    setSharing(true);
    try {
      const goalTitle = sprint.goal_title ?? sprint.title ?? 'my goal';
      const sprintNum = sprint.sprint_number ?? '';
      const content   = `I just completed Sprint ${sprintNum} of ${goalTitle}!`;
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await (supabase as any).from('dream_line_posts').insert({
          user_id:         user.id,
          content,
          visibility:      'public',
          post_label:      'sprint_complete',
          dreamline_label: 'sprint_complete',
        });
      }
    } finally {
      setSharing(false);
    }
    onClose();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-6"
      style={{ background: '#0a0a0f' }}
    >
      <motion.div
        initial={{ scale: 0.75, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 18, stiffness: 300 }}
        className="w-full max-w-sm flex flex-col items-center text-center"
      >
        {/* Badge icon — 90px circle with badge-specific gradient border */}
        <motion.div
          initial={{ scale: 0.5, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 14, stiffness: 280, delay: 0.1 }}
          className="flex items-center justify-center rounded-full mb-4"
          style={{ width: 90, height: 90, position: 'relative', filter: `drop-shadow(0 0 20px ${badge.ringStart}60)` }}
        >
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: `linear-gradient(135deg, ${badge.ringStart}, ${badge.ringEnd})`, zIndex: 0 }} />
          <div style={{ position: 'absolute', inset: 3, borderRadius: '50%', background: '#0a0a0f', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {badge.icon(48)}
          </div>
        </motion.div>

        {/* Badge name */}
        <p style={{ fontSize: 11, fontWeight: 700, color: badge.ringStart, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
          {badge.name}
        </p>

        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#ffffff', lineHeight: 1.2, marginBottom: 6 }}>
          Sprint complete!
        </h2>
        <p style={{ fontSize: 15, color: '#6B7280', marginBottom: 20 }}>
          {sprint?.title ?? 'Weekly Sprint'}
        </p>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, width: '100%', marginBottom: 20 }}>
          {[
            { label: 'Sprint', value: sprint?.sprint_number ? `#${sprint.sprint_number}` : '—' },
            { label: 'Week',   value: weekRange || '—' },
            { label: 'Done',   value: `${done}/${total}` },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: '#111118', borderRadius: 12, padding: '10px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
              <span style={{ fontSize: 13, color: '#F0EBE0', fontWeight: 800 }}>{value}</span>
            </div>
          ))}
        </div>

        {/* $VLG earned pill */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 999, padding: '6px 16px', marginBottom: 28 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#F59E0B' }}>+50 $VLG</span>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
          <button onClick={startNextSprint} style={{ width: '100%', padding: '14px 20px', borderRadius: 16, background: '#0EA5E9', color: '#ffffff', fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            Start next sprint
            <ArrowRightIcon />
          </button>
          <button onClick={shareToDreamLine} disabled={sharing} style={{ width: '100%', padding: '14px 20px', borderRadius: 16, background: '#1877F2', color: '#ffffff', fontSize: 15, fontWeight: 700, border: 'none', cursor: sharing ? 'not-allowed' : 'pointer', opacity: sharing ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            Share to DreamLine
            <ShareIcon />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Verification bottom sheet
// ---------------------------------------------------------------------------

type VerifMethod = 'photo' | 'video' | 'screenshot' | 'document' | 'social_url' | 'text';

const SOCIAL_PLATFORMS = ['Instagram', 'Twitter', 'LinkedIn', 'TikTok', 'YouTube', 'Other'];

interface VerifySheetProps {
  action: any;
  actionLevel: number;
  onClose: () => void;
  onVerified: (result: { sprintCompleted: boolean; vlgEarned: number }) => void;
}

function VerifySheet({ action, actionLevel, onClose, onVerified }: VerifySheetProps) {
  const method: VerifMethod = action.verification_method ?? 'text';

  const [preview, setPreview]           = useState<string | null>(null);
  const [previewFile, setPreviewFile]   = useState<File | null>(null);
  const [socialUrl, setSocialUrl]       = useState('');
  const [platform, setPlatform]         = useState('');
  const [text, setText]                 = useState('');
  const [submitting, setSubmitting]     = useState(false);
  const [reviewing, setReviewing]       = useState(false);
  const [error, setError]               = useState('');
  const cameraRef  = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const docRef     = useRef<HTMLInputElement>(null);

  function handleFileSelect(file: File) {
    setPreviewFile(file);
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function submit() {
    setError('');
    if (method === 'text' && text.length < 50) {
      setError('Please write at least 50 characters.');
      return;
    }
    if ((method === 'social_url') && !socialUrl.startsWith('http')) {
      setError('Please enter a valid URL starting with http.');
      return;
    }
    if (['photo', 'video', 'screenshot', 'document'].includes(method) && !preview) {
      setError('Please select a file first.');
      return;
    }

    setSubmitting(true);
    setReviewing(true);

    // Wait 1.5s for animation
    await new Promise(r => setTimeout(r, 1500));

    let proof_data: string = '';
    if (method === 'social_url') {
      proof_data = socialUrl;
    } else if (method === 'text') {
      proof_data = text;
    } else {
      proof_data = preview ?? '';
    }

    try {
      const res = await fetch(`/api/actions/${action.id}/verify`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          verification_method: method,
          proof_data,
          action_level: actionLevel,
        }),
      });
      const data = await res.json();

      if (!data.verified) {
        setReviewing(false);
        setSubmitting(false);
        setError(data.message ?? 'Verification failed. Please try again.');
        return;
      }

      setReviewing(false);
      onVerified({ sprintCompleted: data.sprintCompleted, vlgEarned: data.vlgEarned ?? 10 });
    } catch {
      setReviewing(false);
      setSubmitting(false);
      setError('Something went wrong. Please try again.');
    }
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={submitting ? undefined : onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40 }}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        style={{
          position:     'fixed',
          bottom:       0,
          left:         0,
          right:        0,
          height:       '70vh',
          background:   '#0E1630',
          borderRadius: '24px 24px 0 0',
          zIndex:       50,
          display:      'flex',
          flexDirection:'column',
          overflow:     'hidden',
        }}
      >
        {/* Handle bar */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 8, flexShrink: 0 }}>
          <div style={{ width: 40, height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.18)' }} />
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 32px' }}>
          {/* Title */}
          <h3 style={{ fontSize: 17, fontWeight: 900, color: '#F0EBE0', marginBottom: 4 }}>
            Verify Action
          </h3>
          <p style={{ fontSize: 14, color: '#93C5FD', marginBottom: 16, fontWeight: 600 }}>
            {action.title}
          </p>

          {/* Verification method label */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(14,165,233,0.12)', border: '1px solid rgba(14,165,233,0.25)', borderRadius: 999, padding: '4px 12px', marginBottom: 20 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {method.replace('_', ' ')}
            </span>
          </div>

          {/* --- Spirit reviewing overlay --- */}
          {reviewing && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '32px 0' }}>
              <TeepeeIcon pulsing />
              <p style={{ fontSize: 15, fontWeight: 700, color: '#93C5FD' }}>Spirit is reviewing...</p>
            </div>
          )}

          {/* --- PHOTO / VIDEO --- */}
          {!reviewing && (method === 'photo' || method === 'video') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Hidden inputs */}
              <input
                ref={cameraRef}
                type="file"
                accept={method === 'video' ? 'image/*,video/*' : 'image/*,video/*'}
                capture="environment"
                style={{ display: 'none' }}
                onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />
              <input
                ref={galleryRef}
                type="file"
                accept="image/*,video/*"
                style={{ display: 'none' }}
                onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />

              {preview ? (
                <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', marginBottom: 8 }}>
                  <img src={preview} alt="Preview" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', display: 'block' }} />
                  <button
                    onClick={() => { setPreview(null); setPreviewFile(null); }}
                    style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: 999, color: '#fff', width: 28, height: 28, cursor: 'pointer', fontSize: 14 }}
                  >
                    x
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    onClick={() => cameraRef.current?.click()}
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '20px 12px', background: 'rgba(255,255,255,0.06)', border: '1.5px dashed rgba(255,255,255,0.2)', borderRadius: 16, color: '#F0EBE0', cursor: 'pointer' }}
                  >
                    <CameraIcon />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Take a photo/video</span>
                  </button>
                  <button
                    onClick={() => galleryRef.current?.click()}
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '20px 12px', background: 'rgba(255,255,255,0.06)', border: '1.5px dashed rgba(255,255,255,0.2)', borderRadius: 16, color: '#F0EBE0', cursor: 'pointer' }}
                  >
                    <GalleryIcon />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Choose from library</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* --- SCREENSHOT --- */}
          {!reviewing && method === 'screenshot' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />
              <input
                ref={galleryRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />

              {preview ? (
                <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', marginBottom: 8 }}>
                  <img src={preview} alt="Screenshot preview" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', display: 'block' }} />
                  <button onClick={() => { setPreview(null); setPreviewFile(null); }} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: 999, color: '#fff', width: 28, height: 28, cursor: 'pointer', fontSize: 14 }}>x</button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={() => cameraRef.current?.click()} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '20px 12px', background: 'rgba(255,255,255,0.06)', border: '1.5px dashed rgba(255,255,255,0.2)', borderRadius: 16, color: '#F0EBE0', cursor: 'pointer' }}>
                    <CameraIcon />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Take screenshot</span>
                  </button>
                  <button onClick={() => galleryRef.current?.click()} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '20px 12px', background: 'rgba(255,255,255,0.06)', border: '1.5px dashed rgba(255,255,255,0.2)', borderRadius: 16, color: '#F0EBE0', cursor: 'pointer' }}>
                    <GalleryIcon />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Choose screenshot</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* --- DOCUMENT --- */}
          {!reviewing && method === 'document' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                ref={docRef}
                type="file"
                accept=".pdf,.doc,.docx,.xlsx,image/*"
                style={{ display: 'none' }}
                onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />
              {preview ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.06)', padding: '14px 16px', borderRadius: 14 }}>
                  <FileIcon />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#F0EBE0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{previewFile?.name ?? 'Document selected'}</p>
                    <p style={{ fontSize: 11, color: '#6B7280' }}>{previewFile ? `${(previewFile.size / 1024).toFixed(0)} KB` : ''}</p>
                  </div>
                  <button onClick={() => { setPreview(null); setPreviewFile(null); }} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: 18 }}>x</button>
                </div>
              ) : (
                <button onClick={() => docRef.current?.click()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '28px 20px', background: 'rgba(255,255,255,0.06)', border: '1.5px dashed rgba(255,255,255,0.2)', borderRadius: 16, color: '#F0EBE0', cursor: 'pointer', width: '100%' }}>
                  <FileIcon />
                  <span style={{ fontSize: 14, fontWeight: 600 }}>Choose document</span>
                  <span style={{ fontSize: 12, color: '#6B7280' }}>PDF, Word, Excel, or image</span>
                </button>
              )}
            </div>
          )}

          {/* --- SOCIAL URL --- */}
          {!reviewing && method === 'social_url' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', borderRadius: 14, padding: '0 14px' }}>
                <LinkIcon />
                <input
                  type="url"
                  value={socialUrl}
                  onChange={e => setSocialUrl(e.target.value)}
                  placeholder="Paste the URL of your post"
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#F0EBE0', fontSize: 14, padding: '14px 0' }}
                />
              </div>

              {/* Platform pills */}
              <div>
                <p style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, marginBottom: 8 }}>Platform</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {SOCIAL_PLATFORMS.map(p => (
                    <button
                      key={p}
                      onClick={() => setPlatform(p)}
                      style={{
                        padding:      '6px 14px',
                        borderRadius: 999,
                        border:       `1.5px solid ${platform === p ? '#0EA5E9' : 'rgba(255,255,255,0.15)'}`,
                        background:   platform === p ? 'rgba(14,165,233,0.15)' : 'transparent',
                        color:        platform === p ? '#38BDF8' : '#9CA3AF',
                        fontSize:     13,
                        fontWeight:   600,
                        cursor:       'pointer',
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* --- TEXT --- */}
          {!reviewing && method === 'text' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Describe what you completed..."
                rows={5}
                style={{ background: 'rgba(255,255,255,0.06)', border: `1.5px solid ${text.length >= 50 ? 'rgba(14,165,233,0.4)' : 'rgba(255,255,255,0.12)'}`, borderRadius: 14, color: '#F0EBE0', fontSize: 14, padding: '14px', outline: 'none', resize: 'none', width: '100%', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: text.length >= 50 ? '#22C55E' : '#6B7280' }}>{text.length < 50 ? `${50 - text.length} more characters needed` : 'Minimum met'}</span>
                <span style={{ fontSize: 12, color: '#6B7280' }}>{text.length}</span>
              </div>
            </div>
          )}

          {/* Error */}
          {error && !reviewing && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12 }}>
              <p style={{ fontSize: 13, color: '#FCA5A5', margin: 0 }}>{error}</p>
            </div>
          )}

          {/* Instructions */}
          {action.verification_instructions && !reviewing && (
            <div style={{ marginTop: 16, padding: '12px 14px', background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 12 }}>
              <p style={{ fontSize: 12, color: '#7DD3FC', margin: 0, lineHeight: 1.5 }}>{action.verification_instructions}</p>
            </div>
          )}
        </div>

        {/* Submit button — pinned at bottom */}
        {!reviewing && (
          <div style={{ padding: '12px 20px 24px', borderTop: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
            <button
              onClick={submit}
              disabled={submitting}
              style={{
                width:        '100%',
                padding:      '15px 20px',
                borderRadius: 16,
                background:   submitting ? 'rgba(14,165,233,0.4)' : '#0EA5E9',
                color:        '#ffffff',
                fontSize:     15,
                fontWeight:   800,
                border:       'none',
                cursor:       submitting ? 'not-allowed' : 'pointer',
                transition:   'background 0.2s',
              }}
            >
              {submitting ? 'Submitting...' : 'Submit verification'}
            </button>
          </div>
        )}
      </motion.div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Main Sprint page
// ---------------------------------------------------------------------------

export default function SprintPage({ params }: { params: { id: string } }) {
  const [sprint, setSprint]         = useState<any>(null);
  const [actions, setActions]       = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);
  const [celebrate, setCelebrate]   = useState(false);
  const [vlgFired, setVlgFired]     = useState(false);
  const [newBadges, setNewBadges]   = useState<string[]>([]);
  const [verifyAction, setVerifyAction] = useState<any | null>(null);
  const [showVlgToast, setShowVlgToast] = useState(false);
  const [vlgToastAmount, setVlgToastAmount] = useState(10);
  const confettiFired               = useRef(false);
  const router                      = useRouter();
  const { theme }                   = useVillageTheme();
  const isNight                     = theme === 'night';

  const bg     = isNight ? 'var(--v-bg)' : 'var(--v-bg)';
  const cardBg = isNight ? 'var(--v-card-bg)' : '#FFFFFF';
  const border = isNight ? 'var(--v-card-border)' : '#FED7AA';
  const text   = isNight ? '#F0EBE0' : '#1E1B4B';
  const muted  = isNight ? '#4A4F72' : '#6B7280';
  const accent = '#1877F2';

  useEffect(() => { load(); }, [params.id]);

  // Fire confetti when celebrate becomes true
  useEffect(() => {
    if (!celebrate || confettiFired.current) return;
    confettiFired.current = true;

    import('canvas-confetti').then(({ default: confetti }) => {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.4 } });
    }).catch(() => {});
  }, [celebrate]);

  useEffect(() => {
    if (!celebrate) confettiFired.current = false;
  }, [celebrate]);

  async function load() {
    const found = await fetch(`/api/sprints?sprint_id=${params.id}`)
      .then(r => r.json())
      .catch(() => null);
    if (found) {
      setSprint(found);
      setActions(found.sprint_actions?.sort((a: any, b: any) => a.order_index - b.order_index) ?? []);
    }
    setLoading(false);
  }

  // Called when a verification comes back successful
  const handleVerified = useCallback(
    ({ sprintCompleted, vlgEarned }: { sprintCompleted: boolean; vlgEarned: number }) => {
      // Close sheet
      const action = verifyAction;
      setVerifyAction(null);

      if (!action) return;

      // Optimistically mark action complete with spring animation trigger
      setActions(prev =>
        prev.map(a =>
          a.id === action.id
            ? { ...a, status: 'complete', completed: true, completed_at: new Date().toISOString() }
            : a
        )
      );

      // Show VLG toast
      setVlgToastAmount(vlgEarned);
      setShowVlgToast(true);

      if (sprintCompleted) {
        setSprint((s: any) => s ? { ...s, status: 'complete' } : s);
        triggerCelebration();
      }
    },
    [verifyAction]
  );

  async function completeAction(actionId: string) {
    setCompleting(actionId);
    const updatedActions = actions.map(a =>
      a.id === actionId ? { ...a, completed: true, completed_at: new Date() } : a
    );
    setActions(updatedActions);

    const res = await fetch('/api/sprints', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action_id: actionId }),
    }).then(r => r.json()).catch(() => ({ ok: true }));

    setCompleting(null);

    if (res.sprint_completed) {
      setSprint((s: any) => s ? { ...s, status: 'completed' } : s);
      setNewBadges(res.new_badges ?? []);
      triggerCelebration();
    }
  }

  async function triggerCelebration() {
    if (celebrate) return;
    setCelebrate(true);
    if (!vlgFired) {
      setVlgFired(true);
      await fetch('/api/vlg/earn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason:    'sprint_complete',
          amount:    50,
          source_id: sprint?.id,
        }),
      }).catch(() => {});
    }
  }

  const done  = actions.filter(a => a.completed || a.status === 'complete').length;
  const total = actions.length;
  const pct   = total ? Math.round((done / total) * 100) : 0;
  const circumference = 2 * Math.PI * 36;

  // Next incomplete action
  const nextIncomplete = actions.find(a => !a.completed && a.status !== 'complete');
  // Action level from sprint → goal (default 1)
  const actionLevel = sprint?.action_level ?? sprint?.goals?.action_level ?? 1;

  useEffect(() => {
    if (done === total && total > 0 && !celebrate) {
      triggerCelebration();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, total]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: bg }}>
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!sprint) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: bg }}>
      <div className="text-center">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="mx-auto mb-3" aria-hidden="true">
          <circle cx="20" cy="20" r="18" stroke="#1877F2" strokeWidth="2" opacity="0.5" />
          <path d="M20 12v8M20 24v2" stroke="#1877F2" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        <p className="font-bold" style={{ color: text }}>Sprint not found</p>
        <Link href="/village/workshop" className="text-sm mt-2 block" style={{ color: accent }}>
          Back to Workshop
        </Link>
      </div>
    </div>
  );

  const weekStart = new Date(sprint.week_start);
  const weekEnd   = new Date(sprint.week_end);

  return (
    <div className="min-h-screen pb-24" style={{ background: bg }}>
      {/* Header */}
      <div
        className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 border-b"
        style={{ background: isNight ? 'var(--v-bg)' : '#fff', borderColor: border }}
      >
        <Link
          href={sprint.goal_id ? `/village/workshop/goal/${sprint.goal_id}` : '/village/workshop'}
          className="text-xl"
          style={{ color: muted }}
        >
          &larr;
        </Link>
        <div className="flex-1">
          <p className="font-black text-sm" style={{ color: text }}>Weekly Sprint</p>
          <p className="text-xs" style={{ color: muted }}>
            {weekStart.toLocaleDateString('en', { month: 'short', day: 'numeric' })} –{' '}
            {weekEnd.toLocaleDateString('en', { month: 'short', day: 'numeric' })}
          </p>
        </div>
        <span
          className={`text-xs font-bold px-3 py-1 rounded-full ${
            sprint.status === 'complete' || sprint.status === 'completed'
              ? 'bg-green-500/20 text-green-400'
              : 'bg-blue-500/20 text-blue-400'
          }`}
        >
          {sprint.status === 'complete' || sprint.status === 'completed' ? 'Done' : 'Active'}
        </span>
      </div>

      {/* Full-screen celebration overlay */}
      <AnimatePresence>
        {celebrate && (
          <SprintCelebration
            sprint={sprint}
            done={done}
            total={total}
            onClose={() => setCelebrate(false)}
          />
        )}
      </AnimatePresence>

      {/* Verification bottom sheet */}
      <AnimatePresence>
        {verifyAction && (
          <VerifySheet
            action={verifyAction}
            actionLevel={actionLevel}
            onClose={() => setVerifyAction(null)}
            onVerified={handleVerified}
          />
        )}
      </AnimatePresence>

      {/* VLG toast */}
      <AnimatePresence>
        {showVlgToast && (
          <VlgToast
            amount={vlgToastAmount}
            onDone={() => setShowVlgToast(false)}
          />
        )}
      </AnimatePresence>

      <div className="max-w-md mx-auto px-4 py-5 space-y-5">
        {/* Progress ring */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-6 flex items-center gap-5"
          style={{ background: cardBg, border: `1px solid ${border}` }}
        >
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg className="w-20 h-20 -rotate-90">
              <circle
                cx="40" cy="40" r="36"
                fill="none"
                stroke={isNight ? 'var(--v-card-border)' : '#E5E7EB'}
                strokeWidth="7"
              />
              <motion.circle
                cx="40" cy="40" r="36"
                fill="none"
                stroke={accent}
                strokeWidth="7"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - pct / 100)}
                strokeLinecap="round"
                animate={{ strokeDashoffset: circumference * (1 - pct / 100) }}
                transition={{ type: 'spring', damping: 20, stiffness: 200 }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-black" style={{ color: text }}>{pct}%</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-black text-base leading-tight" style={{ color: text }}>
              {sprint.title}
            </h1>
            {sprint.focus_intention && (
              <p className="text-xs mt-1 leading-relaxed italic" style={{ color: muted }}>
                &ldquo;{sprint.focus_intention}&rdquo;
              </p>
            )}
            <p className="text-xs mt-2 font-semibold" style={{ color: accent }}>
              {done}/{total} actions complete
            </p>
          </div>
        </motion.div>

        {/* Spirit's opening note */}
        {sprint.spirit_note && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl px-4 py-3 flex gap-3"
            style={{
              background: isNight ? 'rgba(24,119,242,0.08)' : '#EEF2FF',
              border: `1px solid ${isNight ? 'rgba(24,119,242,0.2)' : '#C7D2FE'}`,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 mt-0.5" aria-hidden="true">
              <circle cx="12" cy="12" r="10" fill={isNight ? 'rgba(24,119,242,0.2)' : '#C7D2FE'} />
              <path d="M12 7v5l3 3" stroke={isNight ? '#93C5FD' : '#4338CA'} strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <p className="text-sm leading-relaxed italic" style={{ color: isNight ? '#93C5FD' : '#4338CA' }}>
              {sprint.spirit_note}
            </p>
          </motion.div>
        )}

        {/* "Verify next action" button */}
        {nextIncomplete && (sprint.status === 'active' || !sprint.status) && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setVerifyAction(nextIncomplete)}
            style={{
              width:        '100%',
              padding:      '14px 20px',
              borderRadius: 18,
              background:   'linear-gradient(135deg, #0EA5E9, #1877F2)',
              color:        '#ffffff',
              fontSize:     15,
              fontWeight:   800,
              border:       'none',
              cursor:       'pointer',
              display:      'flex',
              alignItems:   'center',
              justifyContent: 'center',
              gap:          10,
              boxShadow:    '0 6px 24px rgba(14,165,233,0.35)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Verify next action
          </motion.button>
        )}

        {/* Actions list */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: muted }}>
            This Week&apos;s Actions
          </p>
          <div className="space-y-2">
            {actions.map((action, i) => {
              const isComplete = action.completed || action.status === 'complete';
              return (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3.5"
                  style={{
                    background: isComplete
                      ? (isNight ? 'rgba(34,197,94,0.08)' : '#F0FDF4')
                      : cardBg,
                    border: `1px solid ${isComplete
                      ? (isNight ? 'rgba(34,197,94,0.2)' : '#BBF7D0')
                      : border}`,
                    opacity: isComplete ? 0.8 : 1,
                  }}
                >
                  {/* Checkbox with spring animation on complete */}
                  <motion.div
                    animate={isComplete ? { scale: [1.3, 0.9, 1.05, 1] } : { scale: 1 }}
                    transition={isComplete ? { type: 'spring', damping: 10, stiffness: 300 } : {}}
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: isComplete ? '#14B8A6' : 'transparent',
                      border: `2px solid ${isComplete ? '#14B8A6' : muted}`,
                    }}
                  >
                    {completing === action.id ? (
                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                    ) : isComplete ? (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                        <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : null}
                  </motion.div>

                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium leading-tight"
                      style={{
                        color: text,
                        textDecoration: isComplete ? 'line-through' : 'none',
                        opacity: isComplete ? 0.6 : 1,
                      }}
                    >
                      {action.title}
                    </p>
                    {action.verification_method && !isComplete && (
                      <p className="text-xs mt-0.5 font-semibold" style={{ color: '#60A5FA' }}>
                        {action.verification_method.replace('_', ' ')}
                      </p>
                    )}
                    {action.day_of_week && (
                      <p className="text-xs mt-0.5" style={{ color: muted }}>
                        {DAYS[action.day_of_week - 1]}
                      </p>
                    )}
                  </div>

                  {/* Verify button per-action */}
                  {!isComplete && (sprint.status === 'active' || !sprint.status) && (
                    <button
                      onClick={() => setVerifyAction(action)}
                      style={{ background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.3)', borderRadius: 999, padding: '4px 10px', color: '#38BDF8', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      Verify
                    </button>
                  )}

                  {isComplete && action.completed_at && (
                    <span className="text-xs" style={{ color: '#14B8A6' }}>
                      {new Date(action.completed_at).toLocaleDateString('en', { weekday: 'short' })}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Day-by-day view */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: muted }}>
            Week at a Glance
          </p>
          <div className="grid grid-cols-7 gap-1.5">
            {DAYS.map((day, i) => {
              const dayActions    = actions.filter(a => a.day_of_week === i + 1);
              const dayCompleted  = dayActions.every(a => a.completed || a.status === 'complete');
              const hasActions    = dayActions.length > 0;
              const today         = new Date().getDay();
              const adjustedToday = today === 0 ? 7 : today;
              const isToday       = adjustedToday === i + 1;

              return (
                <div key={day} className="flex flex-col items-center gap-1">
                  <p className="text-xs font-semibold" style={{ color: isToday ? accent : muted }}>
                    {day}
                  </p>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      background: !hasActions
                        ? (isNight ? 'var(--v-card-border)' : '#F3F4F6')
                        : dayCompleted
                          ? 'rgba(20,184,166,0.2)'
                          : (isNight ? '#1A1F3A' : '#EEF2FF'),
                      border: isToday ? `2px solid ${accent}` : '2px solid transparent',
                      color: dayCompleted ? '#14B8A6' : hasActions ? accent : muted,
                    }}
                  >
                    {!hasActions ? '·' : dayCompleted ? (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                        <path d="M1 4l3 3 5-6" stroke="#14B8A6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : dayActions.length}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Complete sprint button */}
        {sprint.status === 'active' && done > 0 && done === total && !celebrate && (
          <button
            onClick={async () => {
              const res = await fetch('/api/sprints', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sprint_id: sprint.id }),
              }).then(r => r.json()).catch(() => ({}));
              setSprint((s: any) => ({ ...s, status: 'completed' }));
              setNewBadges(res.new_badges ?? []);
              triggerCelebration();
            }}
            className="w-full py-4 rounded-2xl font-black text-white text-base"
            style={{ background: 'linear-gradient(135deg,#22C55E,#16A34A)' }}
          >
            Complete Sprint
          </button>
        )}
      </div>
    </div>
  );
}
