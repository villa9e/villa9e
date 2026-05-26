'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref');
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'account' | 'sent' | 'too_young'>('account');
  const [dob, setDob] = useState('');

  useEffect(() => {
    if (ref) localStorage.setItem('villa9e_referrer', ref);
  }, [ref]);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (username.length < 3) { setError('Username must be at least 3 characters.'); setLoading(false); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); setLoading(false); return; }
    // COPPA: enforce minimum age 13
    if (dob) {
      const age = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
      if (age < 13) { setStep('too_young'); setLoading(false); return; }
    }

    // Check username availability
    const { data: existing } = await supabase.from('profiles').select('id').eq('username', username.toLowerCase()).single();
    if (existing) { setError('That username is taken. Try another.'); setLoading(false); return; }

    const { error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: username.toLowerCase() },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (signupError) {
      setError(signupError.message);
      setLoading(false);
      return;
    }

    setStep('sent');
    setLoading(false);
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  }

  if (step === 'too_young') {
    return (
      <div className="min-h-screen village-gradient flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 text-center">
          <div className="text-6xl mb-4">🏕️</div>
          <h2 className="text-2xl font-bold mb-2">Come back when you&apos;re older</h2>
          <p className="text-gray-500 text-sm mb-4">
            villa9e is for ages 13 and up. We&apos;ll be here when you&apos;re ready.
          </p>
          <Link href="/" className="text-village-blue text-sm hover:underline">← Back to home</Link>
        </motion.div>
      </div>
    );
  }

  if (step === 'sent') {
    return (
      <div className="min-h-screen village-gradient flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 text-center">
          <div className="text-6xl mb-4 animate-float">📬</div>
          <h2 className="text-2xl font-bold text-village-blue mb-2">Check your email</h2>
          <p className="text-gray-500 text-sm mb-6">
            We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account and enter the village.
          </p>
          <p className="text-xs text-gray-400">Didn't get it? Check your spam folder. It arrives within 1 minute.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen village-gradient flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full village-gradient flex items-center justify-center mx-auto mb-3 animate-float">
            <span className="text-3xl">⛺</span>
          </div>
          <h1 className="text-3xl font-bold text-village-blue">villa9e</h1>
          <p className="text-gray-500 text-sm mt-1">It takes a village.</p>
          {ref && (
            <div className="mt-3 bg-blue-50 rounded-xl px-4 py-2 text-xs text-blue-700">
              Joining via <span className="font-bold">@{ref}</span>'s invite · You both earn +100 $VLG
            </div>
          )}
        </div>

        <button onClick={handleGoogle}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors font-medium mb-4">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-gray-400 text-sm">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <form onSubmit={handleSignup} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500">Username</label>
            <input value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="yourname (letters, numbers, _)" required minLength={3} maxLength={30}
              className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-village-blue" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" required
              className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-village-blue" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Password (8+ characters)</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Choose a strong password" required minLength={8}
              className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-village-blue" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Date of Birth (must be 13+)</label>
            <input type="date" value={dob} onChange={e => setDob(e.target.value)} required
              max={new Date(Date.now() - 13 * 365.25 * 24 * 3600 * 1000).toISOString().split('T')[0]}
              className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-village-blue" />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full village-btn-primary disabled:opacity-50 py-3">
            {loading ? 'Joining…' : '🏡 Join the Village'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          Already a villager?{' '}
          <Link href="/login" className="text-village-blue font-medium hover:underline">Sign in</Link>
        </p>
        <p className="text-center text-xs text-gray-400 mt-3">
          By joining, you agree to our Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
}
