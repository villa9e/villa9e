'use client';
import { useEffect } from 'react';
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

function ArrowLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M12.5 5L7.5 10L12.5 15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 3l5 5-5 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Section data ─────────────────────────────────────────────────────────────
const SECTIONS = [
  {
    id: 'workshop',
    label: 'Workshop',
    description: 'AI-powered goal GPS with Spirit coaching',
    color: '#7B68EE',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke="#7B68EE" strokeWidth="2" strokeLinejoin="round" />
        <path d="M12 12l9-5M12 12v10M12 12L3 7" stroke="#7B68EE" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'dreamline',
    label: 'DreamLine',
    description: 'Your visual timeline of goals and milestones',
    color: '#4D72FF',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M3 12h18M3 6h18M3 18h18" stroke="#4D72FF" strokeWidth="2" strokeLinecap="round" />
        <circle cx="8" cy="12" r="2" fill="#4D72FF" />
        <circle cx="16" cy="6" r="2" fill="#4D72FF" />
        <circle cx="12" cy="18" r="2" fill="#4D72FF" />
      </svg>
    ),
  },
  {
    id: 'trading-post',
    label: 'Trading Post',
    description: 'Deals, community, and collaboration hub',
    color: '#EF9F27',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="#EF9F27" strokeWidth="2" strokeLinejoin="round" />
        <path d="M9 22V12h6v10" stroke="#EF9F27" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'bank',
    label: 'Bank',
    description: 'AI financial insights, budgets, and investments',
    color: '#1D9E75',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M3 10h18M3 10l9-7 9 7M5 10v8a1 1 0 001 1h12a1 1 0 001-1v-8" stroke="#1D9E75" strokeWidth="2" strokeLinejoin="round" />
        <path d="M10 14v3M14 14v3" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'wellness',
    label: 'Wellness',
    description: 'Physical, mental, and nutritional health in one place',
    color: '#E24B4A',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 21C12 21 4 15.5 4 9.5a5 5 0 0110 0 5 5 0 0110 0c0 6-8 11.5-8 11.5z" stroke="#E24B4A" strokeWidth="2" strokeLinejoin="round" />
        <path d="M8 11h8M12 7v8" stroke="#E24B4A" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

// ── Spirit sparkle ────────────────────────────────────────────────────────────
function SpiritSparkle() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 2l1.8 5.5L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.5z" fill="#7B68EE" stroke="#7B68EE" strokeWidth="0.5" strokeLinejoin="round" />
      <path d="M19 2l.9 2.8L22 6l-2.1.9L19 9l-.9-2.1L16 6l2.1-.9z" fill="#7B68EE" opacity="0.7" />
    </svg>
  );
}

export default function OnboardingIntroPage() {
  const router = useRouter();
  const supabase = createClient();

  // Mark onboarding complete when this page loads
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        await (supabase as any)
          .from('profiles')
          .update({ onboarding_completed: true })
          .eq('id', user.id);
      }
    });
  }, []);

  async function handleEnter() {
    router.push('/village/workshop');
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

      <ProgressDots step={3} total={4} />

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}
      >
        <VillageLogo size={48} variant="circle" animated />
      </motion.div>

      {/* Spirit intro line */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          marginBottom: 14,
        }}
      >
        <SpiritSparkle />
        <span style={{ fontSize: 12, color: 'rgba(123,104,238,0.9)', fontWeight: 600 }}>
          Spirit Guide
        </span>
      </motion.div>

      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        style={{ textAlign: 'center', marginBottom: 24 }}
      >
        <h1
          style={{
            fontSize: 22,
            fontWeight: 900,
            color: '#F0F4FF',
            letterSpacing: '-0.02em',
            marginBottom: 6,
          }}
        >
          Here&apos;s your Village.
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(240,244,255,0.45)', lineHeight: 1.5 }}>
          Five environments. One connected life.
        </p>
      </motion.div>

      {/* Section cards — vertical list */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          marginBottom: 20,
          flex: 1,
        }}
      >
        {SECTIONS.map((section, i) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 + i * 0.07 }}
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14,
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: `${section.color}18`,
                border: `1px solid ${section.color}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {section.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: '#F0F4FF',
                  marginBottom: 2,
                }}
              >
                {section.label}
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: 'rgba(240,244,255,0.45)',
                  lineHeight: 1.4,
                }}
              >
                {section.description}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Guided tour note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.6 }}
        style={{
          background: 'rgba(41,82,232,0.08)',
          border: '1px solid rgba(41,82,232,0.2)',
          borderRadius: 12,
          padding: '12px 14px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
        }}
      >
        <SpiritSparkle />
        <p style={{ fontSize: 12, color: 'rgba(240,244,255,0.55)', lineHeight: 1.55 }}>
          You&apos;ll get a guided tour when you visit each section for the first time.
        </p>
      </motion.div>

      {/* Enter button */}
      <motion.button
        onClick={handleEnter}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.65 }}
        whileTap={{ scale: 0.97 }}
        style={{
          width: '100%',
          padding: '16px',
          borderRadius: 16,
          border: 'none',
          background: 'linear-gradient(135deg, #2952E8 0%, #1A40D0 100%)',
          color: '#fff',
          fontSize: 16,
          fontWeight: 800,
          cursor: 'pointer',
          letterSpacing: '-0.01em',
          boxShadow: '0 4px 24px rgba(41,82,232,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        Enter The Village
        <ArrowRight />
      </motion.button>
    </div>
  );
}
