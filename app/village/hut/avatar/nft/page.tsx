'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const STEPS = ['Preview', 'Metadata', 'Mint Cost', 'Confirm'] as const;
type NftStep = 0 | 1 | 2 | 3;

const BACKGROUND_SCENES = [
  { id: 'village_square', label: 'Village Square', color: '#2952E8' },
  { id: 'office',         label: 'Office',         color: '#059669' },
  { id: 'galaxy',         label: 'Galaxy',         color: '#7C3AED' },
  { id: 'mountain',       label: 'Mountain',       color: '#0EA5E9' },
  { id: 'city',           label: 'City',           color: '#E8770A' },
  { id: 'gradient',       label: 'Gradient',       color: '#BE185D' },
];

type SceneId = typeof BACKGROUND_SCENES[number]['id'];

function AvatarPreview({ scene }: { scene: SceneId }) {
  const bg = BACKGROUND_SCENES.find(s => s.id === scene)?.color ?? '#2952E8';
  return (
    <div style={{
      width: '100%',
      aspectRatio: '1/1',
      borderRadius: 24,
      overflow: 'hidden',
      position: 'relative',
      background: `linear-gradient(160deg, ${bg}60, ${bg}20)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '3px solid rgba(255,255,255,0.5)',
      boxShadow: `0 0 40px ${bg}40`,
    }}>
      <svg width="180" height="220" viewBox="0 0 180 220" fill="none">
        <ellipse cx="90" cy="75" rx="42" ry="48" fill="#D4A574" />
        <rect x="77" y="118" width="26" height="22" rx="5" fill="#D4A574" />
        <ellipse cx="90" cy="175" rx="54" ry="58" fill={bg} />
      </svg>
      {/* Scene label watermark */}
      <div style={{ position: 'absolute', bottom: 14, left: 0, right: 0, textAlign: 'center' }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 700, background: 'rgba(0,0,0,0.25)', padding: '3px 10px', borderRadius: 20, backdropFilter: 'blur(4px)' }}>
          {BACKGROUND_SCENES.find(s => s.id === scene)?.label}
        </span>
      </div>
    </div>
  );
}

export default function NftMintPage() {
  const [step, setStep] = useState<NftStep>(0);
  const [scene, setScene] = useState<SceneId>('village_square');
  const [nftName, setNftName] = useState('');
  const [nftDesc, setNftDesc] = useState('');
  const [minting, setMinting] = useState(false);
  const [minted, setMinted] = useState(false);

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 12,
    border: '1.5px solid rgba(24,119,242,0.2)',
    background: 'rgba(255,255,255,0.7)',
    color: '#1A1A2E',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

  function handleMint() {
    setMinting(true);
    setTimeout(() => { setMinting(false); setMinted(true); }, 2200);
  }

  if (minted) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #E8EEFF 0%, #F5F0FF 50%, #EFF8FF 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: '#1A1A2E', marginBottom: 8 }}>Avatar Minted!</h2>
          <p style={{ fontSize: 14, color: 'rgba(30,27,75,0.5)', marginBottom: 6 }}>NFT Token ID: #00001 (mock)</p>
          <p style={{ fontSize: 12, color: 'rgba(30,27,75,0.4)', marginBottom: 28 }}>Blockchain minting will be live in Phase 3.</p>
          <Link href="/village/hut/avatar/gallery" style={{ padding: '12px 32px', borderRadius: 24, background: '#7C3AED', color: '#fff', fontWeight: 800, fontSize: 15, textDecoration: 'none', display: 'inline-block' }}>
            Back to Gallery
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #E8EEFF 0%, #F5F0FF 50%, #EFF8FF 100%)' }}>
      {/* Top bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', height: 56, background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(14px)', borderBottom: '1.5px solid rgba(124,58,237,0.15)' }}>
        <Link href="/village/hut/avatar/gallery" style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'rgba(124,58,237,0.08)', color: '#7C3AED', textDecoration: 'none' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </Link>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 900, fontSize: 16, color: '#1A1A2E' }}>Mint as NFT</p>
        </div>
      </div>

      {/* Step indicator */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          {STEPS.map((s, i) => (
            <div
              key={s}
              style={{ flex: 1, height: 4, borderRadius: 2, background: i <= step ? '#7C3AED' : 'rgba(30,27,75,0.1)', transition: 'background 0.2s' }}
            />
          ))}
        </div>
        <p style={{ fontSize: 12, color: 'rgba(30,27,75,0.4)' }}>
          Step {step + 1} of {STEPS.length}: <strong style={{ color: '#1A1A2E' }}>{STEPS[step]}</strong>
        </p>
      </div>

      <div style={{ padding: '20px 16px 120px' }}>
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }}>

            {/* Step 0: Preview */}
            {step === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <AvatarPreview scene={scene} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E', marginBottom: 10 }}>Background Scene</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {BACKGROUND_SCENES.map(s => (
                      <button
                        key={s.id}
                        onClick={() => setScene(s.id as SceneId)}
                        style={{ padding: '10px 6px', borderRadius: 14, border: `2px solid ${scene === s.id ? s.color : 'transparent'}`, background: scene === s.id ? `${s.color}15` : 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}
                      >
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: s.color }} />
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#1A1A2E', textAlign: 'center' }}>{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Metadata */}
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ width: 120, height: 120, margin: '0 auto', borderRadius: 20, overflow: 'hidden', position: 'relative', background: `linear-gradient(135deg, #7C3AED30, #2952E815)`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(124,58,237,0.2)' }}>
                  <svg width="70" height="80" viewBox="0 0 70 80" fill="none">
                    <ellipse cx="35" cy="28" rx="18" ry="20" fill="#D4A574"/>
                    <ellipse cx="35" cy="65" rx="24" ry="22" fill="#2952E8"/>
                  </svg>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E', display: 'block', marginBottom: 6 }}>NFT Name *</label>
                  <input value={nftName} onChange={e => setNftName(e.target.value)} placeholder="My Village Avatar #001" style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E', display: 'block', marginBottom: 6 }}>Description</label>
                  <textarea value={nftDesc} onChange={e => setNftDesc(e.target.value)} placeholder="A unique avatar representing my journey in The Village…" rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
              </div>
            )}

            {/* Step 2: Mint Cost */}
            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Cost card */}
                <div style={{ padding: '20px', borderRadius: 20, background: 'rgba(255,255,255,0.8)', border: '1.5px solid rgba(124,58,237,0.2)', textAlign: 'center' }}>
                  <p style={{ fontSize: 13, color: 'rgba(30,27,75,0.5)', marginBottom: 8, fontWeight: 600 }}>Minting cost</p>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 36, fontWeight: 900, color: '#7C3AED' }}>5</span>
                    <span style={{ fontSize: 20, fontWeight: 800, color: '#7C3AED' }}>$VICO</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'rgba(30,27,75,0.5)' }}>≈ $0.50 – $5.00 USD</p>
                </div>

                {/* Plain-language explanation */}
                <div style={{ padding: '16px', borderRadius: 16, background: 'rgba(255,255,255,0.6)', border: '1.5px solid rgba(30,27,75,0.08)' }}>
                  <p style={{ fontWeight: 800, fontSize: 14, color: '#1A1A2E', marginBottom: 8 }}>What does this mean?</p>
                  <ul style={{ paddingLeft: 18, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[
                      'Your avatar will be registered on the Village Chain as a unique digital asset.',
                      'No one can copy or duplicate it. Your configuration is secured with a unique hash.',
                      '$VICO is the Village currency. 5 $VICO is a small amount — roughly a cup of coffee.',
                      'You can sell or transfer your NFT avatar in the Trading Post after minting.',
                    ].map((point, i) => (
                      <li key={i} style={{ fontSize: 13, color: 'rgba(30,27,75,0.65)', lineHeight: 1.5 }}>{point}</li>
                    ))}
                  </ul>
                </div>

                {/* Wallet balance */}
                <div style={{ padding: '14px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.6)', border: '1.5px solid rgba(30,27,75,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#1A1A2E' }}>Your $VICO balance</span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: '#7C3AED' }}>42 $VICO</span>
                </div>
              </div>
            )}

            {/* Step 3: Confirm */}
            {step === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Summary card */}
                <div style={{ padding: '18px', borderRadius: 20, background: 'rgba(255,255,255,0.8)', border: '1.5px solid rgba(124,58,237,0.2)' }}>
                  <p style={{ fontWeight: 900, fontSize: 15, color: '#1A1A2E', marginBottom: 12 }}>Mint Summary</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { label: 'Name', value: nftName || 'My Village Avatar' },
                      { label: 'Scene', value: BACKGROUND_SCENES.find(s => s.id === scene)?.label ?? '' },
                      { label: 'Cost', value: '5 $VICO' },
                      { label: 'Standard', value: 'ERC-721 · Village Chain' },
                    ].map(row => (
                      <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: 'rgba(30,27,75,0.5)' }}>{row.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E' }}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Phase 3 note */}
                <div style={{ padding: '14px 16px', borderRadius: 16, background: 'rgba(239,159,39,0.1)', border: '1.5px solid rgba(239,159,39,0.25)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF9F27" strokeWidth={2} strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <p style={{ fontSize: 13, color: 'rgba(30,27,75,0.65)', lineHeight: 1.5 }}>
                    <strong style={{ color: '#1A1A2E' }}>Blockchain minting is coming in Phase 3.</strong> This will record your avatar and transaction hash on-chain. For now, your NFT will be reserved and minted when the chain launches.
                  </p>
                </div>

                {/* Mock transaction hash */}
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E', marginBottom: 6 }}>Transaction Hash (mock)</p>
                  <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.7)', border: '1.5px solid rgba(30,27,75,0.1)', fontFamily: 'monospace', fontSize: 11, color: 'rgba(30,27,75,0.4)', wordBreak: 'break-all' }}>
                    0x0000000000000000000000000000000000000000000000000000000000000000
                  </div>
                </div>

                {/* Sign and mint */}
                <button
                  onClick={handleMint}
                  disabled={minting}
                  style={{ padding: '15px 0', borderRadius: 18, background: minting ? 'rgba(124,58,237,0.4)' : '#7C3AED', color: '#fff', fontWeight: 900, fontSize: 16, border: 'none', cursor: minting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
                >
                  {minting ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                      </motion.div>
                      Signing…
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                      Sign and Mint
                    </>
                  )}
                </button>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: 480, margin: '0 auto', padding: '12px 16px 28px', background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', borderTop: '1.5px solid rgba(124,58,237,0.12)', display: 'flex', gap: 10, zIndex: 30 }}>
        {step > 0 && (
          <button
            onClick={() => setStep(s => (s - 1) as NftStep)}
            style={{ flex: 1, padding: '13px 0', borderRadius: 14, background: 'rgba(0,0,0,0.05)', color: '#1A1A2E', fontWeight: 800, fontSize: 15, border: 'none', cursor: 'pointer' }}
          >
            Back
          </button>
        )}
        {step < 3 && (
          <button
            onClick={() => setStep(s => (s + 1) as NftStep)}
            disabled={step === 1 && !nftName.trim()}
            style={{ flex: 2, padding: '13px 0', borderRadius: 14, background: (step === 1 && !nftName.trim()) ? 'rgba(0,0,0,0.08)' : '#7C3AED', color: (step === 1 && !nftName.trim()) ? 'rgba(30,27,75,0.3)' : '#fff', fontWeight: 900, fontSize: 15, border: 'none', cursor: (step === 1 && !nftName.trim()) ? 'not-allowed' : 'pointer' }}
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
