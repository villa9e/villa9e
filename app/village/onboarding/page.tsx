'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { VillageLogo } from '@/components/brand/VillageLogo';

// ── Progress Dots ────────────────────────────────────────────────────────────
function ProgressDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          initial={false}
          animate={{
            width: i === step ? 20 : 6,
            background: i === step ? '#2952E8' : 'rgba(255,255,255,0.2)',
          }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{ height: 6, borderRadius: 3 }}
        />
      ))}
    </div>
  );
}

// ── Check icon ───────────────────────────────────────────────────────────────
function CheckIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M2.5 7L5.5 10L11.5 4" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function XIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M3 3L11 11M11 3L3 11" stroke="#E24B4A" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function OnboardingWelcomePage() {
  const router = useRouter();
  const supabase = createClient();

  const [username, setUsername] = useState('');
  const [available, setAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Guard: if already completed onboarding, redirect
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.replace('/signup');
        return;
      }
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('onboarding_completed, username')
        .eq('id', user.id)
        .single();
      if (profile?.onboarding_completed) {
        router.replace('/village/workshop');
      }
    });
  }, []);

  // Real-time username availability
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!username || username.length < 3) {
      setAvailable(null);
      return;
    }
    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      setAvailable(false);
      return;
    }
    setChecking(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/check-username?handle=${encodeURIComponent(username)}`);
        const data = await res.json();
        setAvailable(data.available ?? false);
      } catch {
        setAvailable(null);
      } finally {
        setChecking(false);
      }
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [username]);

  const isValid = /^[a-z0-9_]{3,20}$/.test(username) && available === true;

  async function handleContinue() {
    if (!isValid || saving) return;
    setSaving(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/signup'); return; }

      // Save username to profile
      const { error: updateErr } = await (supabase as any)
        .from('profiles')
        .update({ username: username.toLowerCase() })
        .eq('id', user.id);

      if (updateErr) {
        setError('Could not save username. Please try another.');
        setSaving(false);
        return;
      }

      router.push('/village/onboarding/data');
    } catch {
      setError('Something went wrong. Please try again.');
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 480,
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 24px 40px',
      }}
    >
      <ProgressDots step={0} total={4} />

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mb-8"
      >
        <VillageLogo size={72} variant="circle" animated />
      </motion.div>

      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mb-10"
      >
        <h1
          style={{
            fontSize: 24,
            fontWeight: 900,
            color: '#F0F4FF',
            letterSpacing: '-0.02em',
            marginBottom: 8,
          }}
        >
          Welcome to The Village
        </h1>
        <p style={{ fontSize: 16, color: 'rgba(240,244,255,0.45)', fontWeight: 500 }}>
          It takes a village.
        </p>
      </motion.div>

      {/* Username field */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: '100%', marginBottom: 8 }}
      >
        <label
          style={{
            display: 'block',
            fontSize: 12,
            fontWeight: 700,
            color: 'rgba(240,244,255,0.5)',
            marginBottom: 8,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          Choose your username
        </label>

        <div style={{ position: 'relative' }}>
          {/* @ prefix */}
          <span
            style={{
              position: 'absolute',
              left: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 16,
              fontWeight: 700,
              color: 'rgba(240,244,255,0.4)',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            @
          </span>

          <input
            value={username}
            onChange={e => {
              setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
              setAvailable(null);
            }}
            placeholder="yourname"
            maxLength={20}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.05)',
              border: `1.5px solid ${
                available === true
                  ? '#1D9E75'
                  : available === false
                  ? '#E24B4A'
                  : 'rgba(255,255,255,0.1)'
              }`,
              borderRadius: 16,
              padding: '14px 100px 14px 36px',
              fontSize: 16,
              fontWeight: 600,
              color: '#F0F4FF',
              outline: 'none',
              transition: 'border-color 0.2s',
              boxSizing: 'border-box',
            }}
          />

          {/* Availability indicator */}
          <div
            style={{
              position: 'absolute',
              right: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 12,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {username.length >= 3 && (
              checking ? (
                <span style={{ color: 'rgba(240,244,255,0.35)' }}>...</span>
              ) : available === true ? (
                <span style={{ color: '#1D9E75', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <CheckIcon size={13} /> available
                </span>
              ) : available === false ? (
                <span style={{ color: '#E24B4A', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <XIcon size={13} /> taken
                </span>
              ) : null
            )}
          </div>
        </div>

        {/* Rules hint */}
        <p
          style={{
            fontSize: 11,
            color: 'rgba(240,244,255,0.3)',
            marginTop: 6,
            paddingLeft: 4,
          }}
        >
          3–20 characters · letters, numbers, underscores only
        </p>
      </motion.div>

      {/* Village URL preview */}
      <AnimatePresence>
        {username.length >= 3 && available === true && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            style={{
              width: '100%',
              background: 'rgba(41,82,232,0.1)',
              border: '1px solid rgba(41,82,232,0.3)',
              borderRadius: 12,
              padding: '10px 14px',
              marginBottom: 8,
            }}
          >
            <p style={{ fontSize: 12, color: 'rgba(240,244,255,0.5)', marginBottom: 2 }}>
              Your Village URL
            </p>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#4D72FF' }}>
              villa9e.app/{username}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              width: '100%',
              fontSize: 12,
              color: '#E24B4A',
              fontWeight: 600,
              marginBottom: 8,
              paddingLeft: 4,
            }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Continue button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: '100%', marginTop: 16 }}
      >
        <motion.button
          onClick={handleContinue}
          disabled={!isValid || saving}
          whileTap={isValid ? { scale: 0.97 } : {}}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: 16,
            border: 'none',
            background: isValid
              ? 'linear-gradient(135deg, #2952E8 0%, #1A40D0 100%)'
              : 'rgba(255,255,255,0.06)',
            color: isValid ? '#fff' : 'rgba(255,255,255,0.25)',
            fontSize: 16,
            fontWeight: 800,
            cursor: isValid ? 'pointer' : 'not-allowed',
            letterSpacing: '-0.01em',
            transition: 'all 0.2s',
            boxShadow: isValid ? '0 4px 24px rgba(41,82,232,0.4)' : 'none',
          }}
        >
          {saving ? 'Saving...' : 'Continue'}
        </motion.button>
      </motion.div>

      {/* Already have account */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{
          marginTop: 20,
          fontSize: 13,
          color: 'rgba(240,244,255,0.35)',
          textAlign: 'center',
        }}
      >
        Already have an account?{' '}
        <Link
          href="/login"
          style={{ color: '#4D72FF', fontWeight: 700, textDecoration: 'none' }}
        >
          Log in
        </Link>
      </motion.p>
    </div>
  );
}
