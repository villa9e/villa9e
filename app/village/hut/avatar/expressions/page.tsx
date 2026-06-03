'use client';
import { useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const EXPRESSIONS = [
  { id: 'neutral',     label: 'Neutral',     tint: 'rgba(255,255,255,0)' },
  { id: 'happy',       label: 'Happy',       tint: 'rgba(255,220,50,0.18)' },
  { id: 'excited',     label: 'Excited',     tint: 'rgba(255,100,50,0.18)' },
  { id: 'focused',     label: 'Focused',     tint: 'rgba(41,82,232,0.18)' },
  { id: 'thinking',    label: 'Thinking',    tint: 'rgba(124,58,237,0.18)' },
  { id: 'proud',       label: 'Proud',       tint: 'rgba(29,158,117,0.18)' },
  { id: 'grateful',    label: 'Grateful',    tint: 'rgba(255,182,193,0.22)' },
  { id: 'determined',  label: 'Determined',  tint: 'rgba(226,75,74,0.18)' },
] as const;

type ExpressionId = typeof EXPRESSIONS[number]['id'];

// Avatar canvas placeholder (would use RPMAvatar3D in production)
function AvatarCanvas({ tint }: { tint: string }) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: 'linear-gradient(160deg, #E8EEFF 0%, #F5F0FF 50%, #EFF8FF 100%)', borderRadius: 24, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Mock avatar silhouette */}
      <svg width="160" height="200" viewBox="0 0 160 200" fill="none">
        {/* Head */}
        <ellipse cx="80" cy="60" rx="38" ry="42" fill="#D4A574" />
        {/* Neck */}
        <rect x="68" y="98" width="24" height="20" rx="4" fill="#D4A574" />
        {/* Body */}
        <ellipse cx="80" cy="150" rx="48" ry="50" fill="#2952E8" />
      </svg>
      {/* Expression tint overlay */}
      <div style={{ position: 'absolute', inset: 0, background: tint, borderRadius: 24, transition: 'background 0.3s' }} />
      {/* Watermark */}
      <p style={{ position: 'absolute', bottom: 12, left: 0, right: 0, textAlign: 'center', fontSize: 11, color: 'rgba(30,27,75,0.3)', fontWeight: 600 }}>Expression preview</p>
    </div>
  );
}

export default function ExpressionsPage() {
  const [activeExpression, setActiveExpression] = useState<ExpressionId>('neutral');
  const [defaultExpression, setDefaultExpression] = useState<ExpressionId>('neutral');
  const [autoMapping, setAutoMapping] = useState(false);
  const [saved, setSaved] = useState(false);

  const currentExpression = EXPRESSIONS.find(e => e.id === activeExpression)!;

  function handleSetDefault() {
    setDefaultExpression(activeExpression);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #E8EEFF 0%, #F5F0FF 50%, #EFF8FF 100%)' }}>
      {/* Top bar */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 16px',
          height: 56,
          background: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(14px)',
          borderBottom: '1.5px solid rgba(24,119,242,0.15)',
        }}
      >
        <Link
          href="/village/hut/avatar"
          style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'rgba(24,119,242,0.08)', color: '#1877F2', textDecoration: 'none' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </Link>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 900, fontSize: 16, color: '#1A1A2E' }}>Expressions</p>
        </div>
        {saved && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            style={{ padding: '4px 12px', borderRadius: 20, background: '#059669', color: '#fff', fontSize: 12, fontWeight: 700 }}
          >
            Saved!
          </motion.div>
        )}
      </div>

      {/* Main content */}
      <div style={{ padding: '20px 16px 120px' }}>
        {/* Full-screen canvas area */}
        <div style={{ height: 320, marginBottom: 20 }}>
          <AvatarCanvas tint={currentExpression.tint} />
        </div>

        {/* Expression label */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <p style={{ fontSize: 18, fontWeight: 900, color: '#1A1A2E' }}>{currentExpression.label}</p>
          {activeExpression === defaultExpression && (
            <p style={{ fontSize: 12, color: '#1D9E75', fontWeight: 700, marginTop: 2 }}>Default expression</p>
          )}
        </div>

        {/* Expression grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
          {EXPRESSIONS.map((expr) => (
            <motion.button
              key={expr.id}
              whileTap={{ scale: 0.94 }}
              onClick={() => setActiveExpression(expr.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                padding: '10px 4px',
                borderRadius: 16,
                border: `2px solid ${activeExpression === expr.id ? '#1877F2' : 'transparent'}`,
                background: activeExpression === expr.id ? 'rgba(24,119,242,0.08)' : 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Mini avatar with tint */}
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#E8EEFF', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <ellipse cx="14" cy="11" rx="8" ry="9" fill="#D4A574"/>
                  <ellipse cx="14" cy="24" rx="10" ry="8" fill="#2952E8"/>
                </svg>
                <div style={{ position: 'absolute', inset: 0, background: expr.tint, borderRadius: 12 }} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: activeExpression === expr.id ? '#1877F2' : '#1A1A2E', textAlign: 'center', lineHeight: 1.2 }}>
                {expr.label}
              </span>
              {defaultExpression === expr.id && (
                <div style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: '50%', background: '#1D9E75' }} />
              )}
            </motion.button>
          ))}
        </div>

        {/* Set as default button */}
        <button
          onClick={handleSetDefault}
          disabled={activeExpression === defaultExpression}
          style={{
            width: '100%',
            padding: '13px 0',
            borderRadius: 16,
            background: activeExpression === defaultExpression ? 'rgba(0,0,0,0.05)' : '#1877F2',
            color: activeExpression === defaultExpression ? 'rgba(30,27,75,0.35)' : '#fff',
            fontWeight: 800,
            fontSize: 15,
            border: 'none',
            cursor: activeExpression === defaultExpression ? 'not-allowed' : 'pointer',
            marginBottom: 12,
          }}
        >
          {activeExpression === defaultExpression ? 'Already default' : 'Set as default'}
        </button>

        {/* DreamLine auto-mapping toggle */}
        <div style={{ padding: '16px', borderRadius: 18, background: 'rgba(255,255,255,0.75)', border: '1.5px solid rgba(24,119,242,0.15)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 800, fontSize: 14, color: '#1A1A2E', marginBottom: 3 }}>DreamLine expression mapping</p>
            <p style={{ fontSize: 12, color: 'rgba(30,27,75,0.5)', lineHeight: 1.4 }}>Auto-change expression based on your post type (motivational, grateful, focused…)</p>
          </div>
          <button
            onClick={() => setAutoMapping(v => !v)}
            style={{ width: 48, height: 28, borderRadius: 14, background: autoMapping ? '#1877F2' : 'rgba(30,27,75,0.15)', border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background 0.2s' }}
          >
            <div style={{ position: 'absolute', top: 3, left: autoMapping ? 23 : 3, width: 22, height: 22, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
          </button>
        </div>
      </div>
    </div>
  );
}
