'use client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { VillageLogo } from '@/components/brand/VillageLogo';
import { createClient } from '@/lib/supabase/client';

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

// ── Lock icons ───────────────────────────────────────────────────────────────
function LockClosedIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="11" width="18" height="12" rx="3" stroke="#1D9E75" strokeWidth="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="16" r="1.5" fill="#1D9E75" />
    </svg>
  );
}

function LockOpenIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="11" width="18" height="12" rx="3" stroke="#EF9F27" strokeWidth="2" />
      <path d="M7 11V7a5 5 0 0110 0" stroke="#EF9F27" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="16" r="1.5" fill="#EF9F27" />
    </svg>
  );
}

function ArrowLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M12.5 5L7.5 10L12.5 15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Privacy meter bar ────────────────────────────────────────────────────────
function PrivacyMeter({ value }: { value: number }) {
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(240,244,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Data sharing
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#1D9E75' }}>{value}% shared</span>
      </div>
      <div
        style={{
          width: '100%',
          height: 6,
          background: 'rgba(255,255,255,0.08)',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ height: '100%', background: '#1D9E75', borderRadius: 3 }}
        />
      </div>
    </div>
  );
}

export default function OnboardingDataPage() {
  const router = useRouter();
  const supabase = createClient();

  async function proceed(shareData: boolean) {
    // Optionally store data sharing preference — non-blocking
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await (supabase as any)
        .from('profiles')
        .update({ data_sharing_enabled: shareData })
        .eq('id', user.id);
    }
    router.push('/village/onboarding/goal');
  }

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 480,
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 24px 40px',
      }}
    >
      {/* Back arrow */}
      <button
        onClick={() => router.back()}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          width: 36,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 8,
        }}
        aria-label="Back"
      >
        <ArrowLeft />
      </button>

      <ProgressDots step={1} total={4} />

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}
      >
        <VillageLogo size={48} variant="circle" />
      </motion.div>

      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        style={{ textAlign: 'center', marginBottom: 28 }}
      >
        <h1
          style={{
            fontSize: 22,
            fontWeight: 900,
            color: '#F0F4FF',
            letterSpacing: '-0.02em',
            marginBottom: 8,
          }}
        >
          Your data belongs to you.
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(240,244,255,0.45)', lineHeight: 1.5 }}>
          You decide what you share and when.
        </p>
      </motion.div>

      {/* Two cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginBottom: 20,
        }}
      >
        {/* Keep private */}
        <div
          style={{
            background: 'rgba(29,158,117,0.08)',
            border: '1.5px solid rgba(29,158,117,0.3)',
            borderRadius: 16,
            padding: '18px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <LockClosedIcon />
          <div>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#F0F4FF', marginBottom: 4 }}>
              Keep it private
            </p>
            <p style={{ fontSize: 12, color: 'rgba(240,244,255,0.5)', lineHeight: 1.5 }}>
              Your data stays locked. The app works the same.
            </p>
          </div>
        </div>

        {/* Share and earn */}
        <div
          style={{
            background: 'rgba(239,159,39,0.08)',
            border: '1.5px solid rgba(239,159,39,0.3)',
            borderRadius: 16,
            padding: '18px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <LockOpenIcon />
          <div>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#F0F4FF', marginBottom: 4 }}>
              Share and earn
            </p>
            <p style={{ fontSize: 12, color: 'rgba(240,244,255,0.5)', lineHeight: 1.5 }}>
              Share anonymized behavior data and earn monthly income from it.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Privacy meter */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14,
          padding: '14px 16px',
          marginBottom: 16,
        }}
      >
        <PrivacyMeter value={0} />
      </motion.div>

      {/* Ownership note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        style={{
          fontSize: 12,
          color: 'rgba(240,244,255,0.4)',
          textAlign: 'center',
          lineHeight: 1.6,
          marginBottom: 28,
          padding: '0 8px',
        }}
      >
        You own this. You can change it anytime in your Data Locker.
      </motion.p>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
      >
        <motion.button
          onClick={() => proceed(false)}
          whileTap={{ scale: 0.97 }}
          style={{
            width: '100%',
            padding: '15px',
            borderRadius: 14,
            border: 'none',
            background: 'linear-gradient(135deg, #1D9E75 0%, #15795A 100%)',
            color: '#fff',
            fontSize: 15,
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(29,158,117,0.35)',
          }}
        >
          Start private
        </motion.button>

        <motion.button
          onClick={() => proceed(true)}
          whileTap={{ scale: 0.97 }}
          style={{
            width: '100%',
            padding: '15px',
            borderRadius: 14,
            border: '1.5px solid rgba(239,159,39,0.4)',
            background: 'rgba(239,159,39,0.08)',
            color: '#EF9F27',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Review sharing options
        </motion.button>
      </motion.div>
    </div>
  );
}
