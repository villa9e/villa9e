'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { AuthBackground, GoogleIcon } from '@/components/auth/AuthBackground';

const FIELD = "w-full rounded-2xl px-4 py-3.5 text-sm focus:outline-none transition-all text-white placeholder:text-white/25 font-medium";
const FIELD_STYLE: React.CSSProperties = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' };
const FIELD_FOCUS: React.CSSProperties = { background: 'rgba(24,119,242,0.06)', border: '1px solid rgba(24,119,242,0.7)' };

function SignupPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref');
  const supabase = createClient();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [dob, setDob]           = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [step, setStep]         = useState<'account' | 'sent' | 'too_young'>('account');
  const [spotsLeft, setSpotsLeft] = useState<number | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    if (ref) localStorage.setItem('villa9e_referrer', ref);
    // Fetch founding counter
    supabase.from('founding_villager_counter').select('count,max_count').eq('id', 1).single()
      .then(({ data }) => {
        if (data) setSpotsLeft(Math.max(0, data.max_count - data.count));
      });
  }, [ref]);

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (username.length < 3) { setError('Username must be at least 3 characters.'); setLoading(false); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); setLoading(false); return; }

    if (dob) {
      const age = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
      if (age < 13) { setStep('too_young'); setLoading(false); return; }
    }

    const { data: existing } = await (supabase as any).from('profiles').select('id').eq('username', username.toLowerCase()).single();
    if (existing) { setError('That username is taken. Try another.'); setLoading(false); return; }

    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: username.toLowerCase() },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (signupError) {
      // Common errors with cleaner messages
      const msg = signupError.message.toLowerCase();
      if (msg.includes('already registered') || msg.includes('user already exists')) {
        setError('An account with that email already exists. Try logging in.');
      } else {
        setError(signupError.message);
      }
      setLoading(false);
      return;
    }

    // If Supabase auto-confirms (no email verification required), session is returned immediately
    if (signupData?.session) {
      router.push('/village/map?welcome=1');
      return;
    }

    // Email confirmation required — tell user to check inbox
    setStep('sent');
    setLoading(false);
  }

  const fieldProps = (name: string): React.InputHTMLAttributes<HTMLInputElement> => ({
    onFocus: () => setFocusedField(name),
    onBlur: () => setFocusedField(null),
    className: FIELD,
    style: focusedField === name ? FIELD_FOCUS : FIELD_STYLE,
  });

  // ── Too young ──────────────────────────────────────────────────────────────
  if (step === 'too_young') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative">
        <AuthBackground />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-sm text-center">
          <div className="rounded-[28px] p-10" style={{
            background: 'rgba(8,12,24,0.85)', backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <div className="text-6xl mb-4">🏕️</div>
            <h2 className="text-xl font-black text-white mb-2">Come back soon</h2>
            <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
              villa9e is for ages 13 and up. The village will be waiting.
            </p>
            <Link href="/" className="text-[#60a5fa] text-sm font-semibold hover:text-white transition-colors">
              ← Back to home
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Email sent ─────────────────────────────────────────────────────────────
  if (step === 'sent') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative">
        <AuthBackground />
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-sm text-center">
          <div className="rounded-[28px] p-10" style={{
            background: 'rgba(8,12,24,0.85)', backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2.5, repeat: Infinity }}
              className="text-6xl mb-5">📬</motion.div>
            <h2 className="text-xl font-black text-white mb-2">Check your email</h2>
            <p className="text-sm mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
              We sent a confirmation link to
            </p>
            <p className="text-[#60a5fa] font-bold text-sm mb-6 truncate">{email}</p>
            <div className="rounded-2xl p-4 mb-6" style={{ background: 'rgba(24,119,242,0.08)', border: '1px solid rgba(24,119,242,0.2)' }}>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Click the link to activate your account and enter the village. Check your spam if you don't see it within 2 minutes.
              </p>
            </div>
            <Link href="/login" className="text-[#60a5fa] text-sm font-semibold hover:text-white transition-colors">
              Already confirmed? Sign in →
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Main signup form ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <AuthBackground />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="rounded-[28px] p-8" style={{
          background: 'rgba(8,12,24,0.82)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset',
        }}>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="relative inline-flex mb-4">
              <motion.div
                animate={{ scale: [1, 1.12, 1] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-full"
                style={{ background: 'rgba(24,119,242,0.25)', filter: 'blur(16px)' }}
              />
              <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, rgba(24,119,242,0.3), rgba(124,58,237,0.2))', border: '1px solid rgba(24,119,242,0.3)' }}>
                <span style={{ fontSize: 28, fontWeight: 900, color: '#1877F2', fontFamily: 'monospace', letterSpacing: '-0.05em' }}>v9</span>
              </div>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Join villa9e</h1>
            <p className="text-white/40 text-sm mt-1">It takes a village. Start yours.</p>

            {/* Founding badge + referral */}
            <div className="flex flex-col gap-2 mt-4">
              {spotsLeft !== null && spotsLeft > 0 && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-1.5 self-center px-3 py-1.5 rounded-full text-xs font-bold"
                  style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  {spotsLeft.toLocaleString()} Founding spots left · +500 $VLG
                </motion.div>
              )}
              {ref && (
                <div className="inline-flex items-center gap-1.5 self-center px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{ background: 'rgba(24,119,242,0.1)', border: '1px solid rgba(24,119,242,0.25)', color: '#60a5fa' }}>
                  🤝 Invited by @{ref} · +100 $VLG for both
                </div>
              )}
            </div>
          </div>

          {/* Google — Primary */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl mb-5 font-semibold text-sm text-white/90 transition-all"
            style={{ background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.12)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.13)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.09)')}
          >
            <GoogleIcon />
            Continue with Google
          </motion.button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
            <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.25)' }}>or</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSignup} className="space-y-3">
            <input
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="Username (letters, numbers, _)"
              required minLength={3} maxLength={30}
              {...fieldProps('username')}
            />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email address"
              required
              {...fieldProps('email')}
            />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password (8+ characters)"
              required minLength={8}
              {...fieldProps('password')}
            />
            <div>
              <label className="text-xs font-semibold block mb-1.5 px-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Date of birth (must be 13+)
              </label>
              <input
                type="date"
                value={dob}
                onChange={e => setDob(e.target.value)}
                required
                max={new Date(Date.now() - 13 * 365.25 * 24 * 3600 * 1000).toISOString().split('T')[0]}
                {...fieldProps('dob')}
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-red-400 text-xs font-medium px-1">
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 rounded-2xl font-bold text-sm text-white disabled:opacity-50 transition-all"
              style={{ background: 'linear-gradient(135deg, #1877F2 0%, #1565c0 100%)', boxShadow: '0 4px 24px rgba(24,119,242,0.35)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Creating your village…
                </span>
              ) : '🏡 Enter the Village'}
            </motion.button>
          </form>

          <p className="text-center text-sm mt-5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Already a villager?{' '}
            <Link href="/login" className="text-[#60a5fa] font-semibold hover:text-white transition-colors">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-xs mt-5" style={{ color: 'rgba(255,255,255,0.18)' }}>
          By joining, you agree to villa9e&apos;s{' '}
          <Link href="/terms" className="underline hover:text-white/40">Terms</Link> &amp;{' '}
          <Link href="/privacy" className="underline hover:text-white/40">Privacy</Link>
        </p>
      </motion.div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#060810] flex items-center justify-center">
        <div style={{ fontSize: 36, fontWeight: 900, color: '#1877F2', fontFamily: 'monospace', animation: 'pulse 2s infinite' }}>villa9e</div>
      </div>
    }>
      <SignupPageInner />
    </Suspense>
  );
}
