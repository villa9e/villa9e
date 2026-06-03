'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
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

function ArrowLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M12.5 5L7.5 10L12.5 15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Goal categories ──────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    id: 'business',
    label: 'Business',
    color: '#4D72FF',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="7" width="20" height="14" rx="2" stroke="#4D72FF" strokeWidth="2" />
        <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="#4D72FF" strokeWidth="2" />
        <path d="M12 12v4M10 14h4" stroke="#4D72FF" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'health',
    label: 'Health',
    color: '#1D9E75',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 21C12 21 4 15.5 4 9a5 5 0 0110 0 5 5 0 0110 0c0 6.5-8 12-8 12z" stroke="#1D9E75" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'finance',
    label: 'Finance',
    color: '#EF9F27',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="#EF9F27" strokeWidth="2" />
        <path d="M12 7v10M9.5 9.5C9.5 8.67 10.67 8 12 8s2.5.67 2.5 1.5-1.67 1.5-2.5 1.5-2.5.67-2.5 1.5S10.67 14 12 14s2.5-.67 2.5-1.5" stroke="#EF9F27" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'education',
    label: 'Education',
    color: '#7B68EE',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 3L2 8l10 5 10-5-10-5z" stroke="#7B68EE" strokeWidth="2" strokeLinejoin="round" />
        <path d="M6 10.5v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5" stroke="#7B68EE" strokeWidth="2" strokeLinecap="round" />
        <path d="M22 8v6" stroke="#7B68EE" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'creative',
    label: 'Creative',
    color: '#E24B4A',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="4" stroke="#E24B4A" strokeWidth="2" />
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M17.66 6.34l-1.41 1.41M4.93 19.07l1.41-1.41" stroke="#E24B4A" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'personal',
    label: 'Personal',
    color: '#4D72FF',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" stroke="#4D72FF" strokeWidth="2" />
        <path d="M4 20c0-3.31 3.58-6 8-6s8 2.69 8 6" stroke="#4D72FF" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'fitness',
    label: 'Fitness',
    color: '#1D9E75',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M6 8h2v8H6zM16 8h2v8h-2zM2 10h4M18 10h4M8 12h8" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'other',
    label: 'Other',
    color: 'rgba(240,244,255,0.5)',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="1.5" fill="rgba(240,244,255,0.5)" />
        <circle cx="6" cy="12" r="1.5" fill="rgba(240,244,255,0.5)" />
        <circle cx="18" cy="12" r="1.5" fill="rgba(240,244,255,0.5)" />
      </svg>
    ),
  },
];

// ── Spirit sparkle icon ──────────────────────────────────────────────────────
function SpiritSparkle() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2l1.8 5.5L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.5z"
        fill="#7B68EE"
        stroke="#7B68EE"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
      <path d="M19 2l.9 2.8L22 6l-2.1.9L19 9l-.9-2.1L16 6l2.1-.9z" fill="#7B68EE" opacity="0.7" />
      <path d="M5 16l.7 2.1L7.7 19l-2 .7L5 21.7l-.7-2L2.3 19l2-.7z" fill="#7B68EE" opacity="0.5" />
    </svg>
  );
}

export default function OnboardingGoalPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [goalText, setGoalText] = useState('');

  function handleStart() {
    if (!selected) return;
    const params = new URLSearchParams();
    if (goalText.trim()) params.set('goal', goalText.trim());
    params.set('category', selected);
    router.push(`/village/workshop/chat?${params.toString()}`);
  }

  function handleSkip() {
    router.push('/village/onboarding/intro');
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

      <ProgressDots step={2} total={4} />

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}
      >
        <VillageLogo size={40} variant="circle" />
      </motion.div>

      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        style={{ textAlign: 'center', marginBottom: 8 }}
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
          What do you want to achieve?
        </h1>
      </motion.div>

      {/* Spirit prompt */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          marginBottom: 20,
        }}
      >
        <SpiritSparkle />
        <p style={{ fontSize: 13, color: 'rgba(123,104,238,0.9)', fontWeight: 600 }}>
          Spirit is ready to build your GPS plan.
        </p>
      </motion.div>

      {/* Category grid */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          marginBottom: 16,
        }}
      >
        {CATEGORIES.map((cat, i) => {
          const isSelected = selected === cat.id;
          return (
            <motion.button
              key={cat.id}
              onClick={() => setSelected(cat.id)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 + i * 0.04 }}
              whileTap={{ scale: 0.96 }}
              style={{
                background: isSelected ? 'rgba(41,82,232,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1.5px solid ${isSelected ? '#2952E8' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 14,
                padding: '14px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'border-color 0.2s, background 0.2s',
              }}
            >
              <span style={{ flexShrink: 0 }}>{cat.icon}</span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: isSelected ? '#F0F4FF' : 'rgba(240,244,255,0.7)',
                }}
              >
                {cat.label}
              </span>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Goal text field */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        style={{ marginBottom: 20 }}
      >
        <textarea
          value={goalText}
          onChange={e => setGoalText(e.target.value)}
          placeholder="e.g. Launch my consulting business in 6 months"
          rows={3}
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.05)',
            border: '1.5px solid rgba(255,255,255,0.1)',
            borderRadius: 14,
            padding: '12px 14px',
            fontSize: 14,
            color: '#F0F4FF',
            resize: 'none',
            outline: 'none',
            fontFamily: 'inherit',
            lineHeight: 1.5,
            boxSizing: 'border-box',
          }}
          onFocus={e => (e.target.style.borderColor = 'rgba(41,82,232,0.6)')}
          onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
        />
        <p style={{ fontSize: 11, color: 'rgba(240,244,255,0.3)', marginTop: 4, paddingLeft: 2 }}>
          Describe your goal briefly
        </p>
      </motion.div>

      {/* CTA buttons */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.45 }}
        style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
      >
        <motion.button
          onClick={handleStart}
          disabled={!selected}
          whileTap={selected ? { scale: 0.97 } : {}}
          style={{
            width: '100%',
            padding: '15px',
            borderRadius: 14,
            border: 'none',
            background: selected
              ? 'linear-gradient(135deg, #7B68EE 0%, #5B4BE8 100%)'
              : 'rgba(255,255,255,0.06)',
            color: selected ? '#fff' : 'rgba(255,255,255,0.2)',
            fontSize: 15,
            fontWeight: 800,
            cursor: selected ? 'pointer' : 'not-allowed',
            boxShadow: selected ? '0 4px 20px rgba(123,104,238,0.4)' : 'none',
            transition: 'all 0.2s',
            letterSpacing: '-0.01em',
          }}
        >
          Start with Spirit
        </motion.button>

        <button
          onClick={handleSkip}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 13,
            color: 'rgba(240,244,255,0.35)',
            fontWeight: 600,
            padding: '8px',
            textAlign: 'center',
          }}
        >
          Skip for now
        </button>
      </motion.div>
    </div>
  );
}
