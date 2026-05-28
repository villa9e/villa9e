'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { AuthBackground, GoogleIcon } from '@/components/auth/AuthBackground';

const FIELD = "w-full rounded-2xl px-4 py-3.5 text-sm focus:outline-none transition-all text-white placeholder:text-white/25 font-medium";
const FIELD_STYLE = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' };
const FIELD_FOCUS = { border: '1px solid rgba(24,119,242,0.7)', background: 'rgba(24,119,242,0.06)' };

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push('/village/map');
    router.refresh();
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <AuthBackground />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Card */}
        <div className="rounded-[28px] p-8" style={{
          background: 'rgba(8,12,24,0.82)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset',
        }}>
          {/* Logo */}
          <div className="text-center mb-7">
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
            <h1 className="text-2xl font-black text-white tracking-tight">villa9e</h1>
            <p className="text-white/40 text-sm mt-1">Welcome back, Villager.</p>
          </div>

          {/* Google — Primary CTA */}
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

          {/* Email/Password form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              placeholder="Email address"
              required
              className={FIELD}
              style={focusedField === 'email' ? FIELD_FOCUS : FIELD_STYLE}
            />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              placeholder="Password"
              required
              className={FIELD}
              style={focusedField === 'password' ? FIELD_FOCUS : FIELD_STYLE}
            />

            {error && (
              <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-xs font-medium px-1">
                {error}
              </motion.p>
            )}

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
                  Signing in…
                </span>
              ) : 'Enter the Village →'}
            </motion.button>
          </form>

          {/* Footer links */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
              New to villa9e?{' '}
              <Link href="/signup" className="text-[#60a5fa] font-semibold hover:text-white transition-colors">
                Join the village
              </Link>
            </p>
          </div>
        </div>

        {/* Legal */}
        <p className="text-center text-xs mt-5" style={{ color: 'rgba(255,255,255,0.18)' }}>
          By continuing, you agree to villa9e&apos;s{' '}
          <Link href="/terms" className="underline hover:text-white/40">Terms</Link> &amp;{' '}
          <Link href="/privacy" className="underline hover:text-white/40">Privacy</Link>
        </p>
      </motion.div>
    </div>
  );
}
