'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

// ── Icons ────────────────────────────────────────────────────────────────────
function CheckIcon({ size = 16, color = 'white' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
function UploadIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}
function StoreIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l1-4h16l1 4" /><path d="M21 9v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9" />
      <path d="M9 21V9" /><path d="M15 21V9" />
    </svg>
  );
}
function QRIcon() {
  return (
    <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" /><path d="M14 14h.01M14 18h.01M18 14h.01M18 18h.01M21 14v.01M14 21v.01M21 21v.01" />
    </svg>
  );
}
function ShareIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}
function GridIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}
function ArrowRight() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

// ── Business type cards ──────────────────────────────────────────────────────
const BUSINESS_TYPES = [
  { key: 'creator',  label: 'Creator',   icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
  { key: 'retail',   label: 'Retail',    icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
  { key: 'service',  label: 'Service',   icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { key: 'events',   label: 'Events',    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { key: 'food',     label: 'Food',      icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
  { key: 'other',    label: 'Other',     icon: 'M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z' },
];

const CATEGORIES = ['Art & Design','Beauty & Wellness','Books & Education','Clothing & Fashion','Digital Products','Events & Experiences','Food & Beverage','Handmade & Crafts','Health & Fitness','Music & Audio','Photography & Video','Professional Services','Technology','Other'];

const DOC_TYPES = [
  { key: 'registration', label: 'Business Registration', desc: 'LLC, Inc, or DBA docs' },
  { key: 'license',      label: 'Business License',      desc: 'City or state license' },
  { key: 'tax',          label: 'Tax ID (EIN)',           desc: 'IRS EIN confirmation letter' },
  { key: 'social',       label: 'Social Proof',           desc: 'Website, social media, or reviews' },
];

// ── Mock QR SVG ───────────────────────────────────────────────────────────────
function QRPlaceholder({ name }: { name: string }) {
  const cells: JSX.Element[] = [];
  const seed = name.split('').reduce((a, c) => a + c.charCodeAt(0), 42);
  for (let r = 0; r < 21; r++) {
    for (let c = 0; c < 21; c++) {
      const corner = (r < 7 && c < 7) || (r < 7 && c > 13) || (r > 13 && c < 7);
      const inner = (r >= 2 && r <= 4 && c >= 2 && c <= 4) || (r >= 2 && r <= 4 && c >= 16 && c <= 18) || (r >= 16 && r <= 18 && c >= 2 && c <= 4);
      const filled = corner ? (r === 0 || r === 6 || c === 0 || c === 6 || inner) :
        (((r * 13 + c * 7 + seed) % 3) === 0);
      if (filled) {
        cells.push(<rect key={`${r}-${c}`} x={c * 8} y={r * 8} width={7} height={7} rx={1} fill="#412402" />);
      }
    }
  }
  return (
    <svg width={168} height={168} viewBox="0 0 168 168" style={{ display: 'block' }}>
      <rect width={168} height={168} fill="white" rx={4} />
      {cells}
      {/* Teepee center */}
      <rect x={68} y={68} width={32} height={32} rx={4} fill="white" />
      <path d="M84 72l-8 18h5l1-3h4l1 3h5L84 72z" fill="#EF9F27" />
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function MerchantOnboardingPage() {
  const router = useRouter();
  const isNight = useVillageTheme(s => s.theme) === 'night';

  const [step, setStep] = useState(1);
  // Step 1
  const [bizName, setBizName] = useState('');
  const [bizType, setBizType] = useState('');
  const [category, setCategory] = useState('');
  const [locationType, setLocationType] = useState<'physical' | 'online'>('physical');
  // Step 2
  const [linkedEstore] = useState<string | null>(null); // mock: no existing eStore
  // Step 3
  const [payoutPref, setPayoutPref] = useState<'hold' | 'convert'>('hold');
  const [minThreshold, setMinThreshold] = useState('50');
  // Step 4
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([]);
  // Step 5
  const [launched, setLaunched] = useState(false);

  const pageBg      = isNight ? '#1A1400' : '#FFFBF2';
  const heroBg      = '#412402';
  const cardBg      = isNight ? '#221A00' : '#FFFFFF';
  const cardBorder  = isNight ? '1px solid #3A2800' : '1px solid #F0D9B0';
  const textPrimary = isNight ? '#F5E6C8' : '#2D1A00';
  const textMuted   = isNight ? '#9B7A3A' : '#8B6230';
  const btnBg       = '#BA7517';
  const accent      = '#EF9F27';
  const inputStyle  = {
    width: '100%', padding: '12px 14px', borderRadius: 10,
    border: isNight ? '1px solid #3A2800' : '1px solid #F0D9B0',
    background: isNight ? '#2C1E00' : '#FFFDF5',
    color: textPrimary, fontSize: 14, outline: 'none',
    boxSizing: 'border-box' as const,
  };

  const TOTAL_STEPS = 5;

  function nextStep() { setStep(s => Math.min(s + 1, TOTAL_STEPS)); }
  function prevStep() { setStep(s => Math.max(s - 1, 1)); }

  const canProceed1 = bizName.trim().length > 0 && bizType !== '' && category !== '';

  return (
    <div style={{ minHeight: '100vh', background: pageBg, paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: heroBg, padding: '52px 20px 20px', position: 'relative' }}>
        {step > 1 ? (
          <button onClick={prevStep} style={{
            position: 'absolute', top: 16, left: 16,
            display: 'flex', alignItems: 'center', gap: 6,
            color: 'rgba(255,255,255,0.75)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14,
          }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Back
          </button>
        ) : (
          <Link href="/village/merchant" style={{
            position: 'absolute', top: 16, left: 16,
            display: 'flex', alignItems: 'center', gap: 6,
            color: 'rgba(255,255,255,0.75)', textDecoration: 'none', fontSize: 14,
          }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Back
          </Link>
        )}

        <div style={{ textAlign: 'center' }}>
          <div style={{ color: accent, fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>
            STEP {step} OF {TOTAL_STEPS}
          </div>
          <div style={{ color: 'white', fontSize: 20, fontWeight: 800 }}>
            {step === 1 && 'Business Identity'}
            {step === 2 && 'Link Your eStore'}
            {step === 3 && 'Payout Preference'}
            {step === 4 && 'Verification'}
            {step === 5 && 'Ready to Launch'}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: 16, background: 'rgba(255,255,255,0.15)', borderRadius: 4, height: 4 }}>
          <div style={{ width: `${(step / TOTAL_STEPS) * 100}%`, background: accent, height: 4, borderRadius: 4, transition: 'width 0.3s ease' }} />
        </div>
      </div>

      <div style={{ padding: '24px 16px 0' }}>

        {/* ── Step 1: Business Identity ── */}
        {step === 1 && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: textPrimary, marginBottom: 6 }}>Business Name</label>
              <input
                style={inputStyle}
                placeholder="e.g. Jade's Handmade Ceramics"
                value={bizName}
                onChange={e => setBizName(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: textPrimary, marginBottom: 10 }}>Business Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {BUSINESS_TYPES.map(t => (
                  <button key={t.key} onClick={() => setBizType(t.key)} style={{
                    padding: '12px 8px', borderRadius: 10, cursor: 'pointer',
                    border: bizType === t.key ? `2px solid ${accent}` : cardBorder,
                    background: bizType === t.key ? (isNight ? '#3A2000' : '#FFF8ED') : cardBg,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  }}>
                    <svg width={20} height={20} viewBox="0 0 24 24" fill="none"
                      stroke={bizType === t.key ? accent : textMuted} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                      <path d={t.icon} />
                    </svg>
                    <span style={{ fontSize: 11, fontWeight: 600, color: bizType === t.key ? accent : textPrimary }}>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: textPrimary, marginBottom: 6 }}>Category</label>
              <select style={{ ...inputStyle, appearance: 'none' }} value={category} onChange={e => setCategory(e.target.value)}>
                <option value="">Select a category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: textPrimary, marginBottom: 10 }}>Location</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {(['physical', 'online'] as const).map(loc => (
                  <button key={loc} onClick={() => setLocationType(loc)} style={{
                    padding: '14px', borderRadius: 10, cursor: 'pointer',
                    border: locationType === loc ? `2px solid ${accent}` : cardBorder,
                    background: locationType === loc ? (isNight ? '#3A2000' : '#FFF8ED') : cardBg,
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: locationType === loc ? accent : textPrimary }}>
                      {loc === 'physical' ? 'Physical Location' : 'Online Only'}
                    </div>
                    <div style={{ fontSize: 11, color: textMuted, marginTop: 2 }}>
                      {loc === 'physical' ? 'Storefront, market stall, etc.' : 'eStore, digital products, remote services'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={nextStep} disabled={!canProceed1} style={{
              width: '100%', padding: '15px', borderRadius: 12, border: 'none', cursor: canProceed1 ? 'pointer' : 'not-allowed',
              background: canProceed1 ? btnBg : (isNight ? '#3A2800' : '#F0D9B0'),
              color: canProceed1 ? 'white' : textMuted,
              fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              Continue <ArrowRight />
            </button>
          </div>
        )}

        {/* ── Step 2: Link eStore ── */}
        {step === 2 && (
          <div>
            <p style={{ fontSize: 14, color: textMuted, marginBottom: 20, lineHeight: 1.6 }}>
              Link your Trading Post eStore to unify your commerce. Your eStore will receive a verified $VICO badge and sales will appear in your merchant dashboard.
            </p>

            {linkedEstore ? (
              <div style={{ background: cardBg, border: `2px solid ${accent}`, borderRadius: 12, padding: '16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: btnBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <StoreIcon />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: textPrimary }}>{linkedEstore}</div>
                  <div style={{ fontSize: 12, color: accent, marginTop: 2, fontWeight: 600 }}>eStore linked</div>
                </div>
                <CheckIcon color={accent} />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                <div style={{ background: cardBg, border: cardBorder, borderRadius: 12, padding: '16px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: textPrimary, marginBottom: 8 }}>No eStore found</div>
                  <div style={{ fontSize: 12, color: textMuted, marginBottom: 14, lineHeight: 1.5 }}>
                    Create a Trading Post eStore to sell products and link it here for unified commerce.
                  </div>
                  <Link href="/village/trading-post/market" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '10px 16px', background: btnBg, borderRadius: 8,
                    color: 'white', fontWeight: 600, fontSize: 13, textDecoration: 'none',
                  }}>
                    <StoreIcon /> Create eStore first
                  </Link>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={nextStep} style={{
                flex: 1, padding: '13px', borderRadius: 10, border: cardBorder, cursor: 'pointer',
                background: 'transparent', color: textMuted, fontSize: 14, fontWeight: 600,
              }}>
                Skip for now
              </button>
              <button onClick={nextStep} style={{
                flex: 2, padding: '13px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: btnBg, color: 'white', fontSize: 14, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                Continue <ArrowRight />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Payout Preference ── */}
        {step === 3 && (
          <div>
            <p style={{ fontSize: 14, color: textMuted, marginBottom: 20, lineHeight: 1.6 }}>
              Choose how you receive $VICO payments. You can change this anytime in settings.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              {/* Hold VICO */}
              <button onClick={() => setPayoutPref('hold')} style={{
                padding: '18px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                border: payoutPref === 'hold' ? `2px solid ${accent}` : cardBorder,
                background: payoutPref === 'hold' ? (isNight ? '#3A2000' : '#FFF8ED') : cardBg,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: payoutPref === 'hold' ? accent : textPrimary }}>Hold $VICO</span>
                  {payoutPref === 'hold' && (
                    <div style={{ width: 22, height: 22, borderRadius: 11, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckIcon size={12} />
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 12, color: textMuted, lineHeight: 1.5 }}>
                  Keep $VICO in your Village wallet. Benefit from price appreciation and use for Village economy.
                </div>
                <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
                  {['Earn from price appreciation', 'Village economy', 'Instant'].map(tag => (
                    <span key={tag} style={{ padding: '3px 8px', borderRadius: 20, background: `${accent}22`, color: accent, fontSize: 10, fontWeight: 600 }}>{tag}</span>
                  ))}
                </div>
              </button>

              {/* Auto-convert */}
              <button onClick={() => setPayoutPref('convert')} style={{
                padding: '18px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                border: payoutPref === 'convert' ? '2px solid #1D9E75' : cardBorder,
                background: payoutPref === 'convert' ? (isNight ? '#001F18' : '#F0FFF9') : cardBg,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: payoutPref === 'convert' ? '#1D9E75' : textPrimary }}>Auto-convert to USD</span>
                  {payoutPref === 'convert' && (
                    <div style={{ width: 22, height: 22, borderRadius: 11, background: '#1D9E75', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckIcon size={12} />
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 12, color: textMuted, lineHeight: 1.5 }}>
                  Automatically convert $VICO to USD and deposit to your bank account when threshold is reached.
                </div>
                <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
                  {['Stable USD', 'Bank deposit', 'Auto'].map(tag => (
                    <span key={tag} style={{ padding: '3px 8px', borderRadius: 20, background: '#1D9E7522', color: '#1D9E75', fontSize: 10, fontWeight: 600 }}>{tag}</span>
                  ))}
                </div>
              </button>
            </div>

            {payoutPref === 'convert' && (
              <div style={{ background: cardBg, border: cardBorder, borderRadius: 12, padding: '16px', marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: textPrimary, marginBottom: 10 }}>Minimum Threshold</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, color: textMuted }}>Convert when balance reaches</span>
                  <input
                    type="number"
                    value={minThreshold}
                    onChange={e => setMinThreshold(e.target.value)}
                    style={{ ...inputStyle, width: 80, textAlign: 'center' }}
                    placeholder="50"
                  />
                  <span style={{ fontSize: 13, color: textMuted }}>$VICO</span>
                </div>
              </div>
            )}

            <button onClick={nextStep} style={{
              width: '100%', padding: '15px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: btnBg, color: 'white', fontSize: 15, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              Continue <ArrowRight />
            </button>
          </div>
        )}

        {/* ── Step 4: Verification ── */}
        {step === 4 && (
          <div>
            <p style={{ fontSize: 14, color: textMuted, marginBottom: 20, lineHeight: 1.6 }}>
              Verification earns you the Verified Merchant badge, which appears on your profile, map pin, and receipts. You can skip and verify later.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {DOC_TYPES.map(doc => (
                <button key={doc.key} onClick={() => {
                  setUploadedDocs(prev =>
                    prev.includes(doc.key) ? prev.filter(d => d !== doc.key) : [...prev, doc.key]
                  );
                }} style={{
                  padding: '14px 16px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                  border: uploadedDocs.includes(doc.key) ? `2px solid ${accent}` : cardBorder,
                  background: uploadedDocs.includes(doc.key) ? (isNight ? '#3A2000' : '#FFF8ED') : cardBg,
                  display: 'flex', alignItems: 'center', gap: 14,
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: uploadedDocs.includes(doc.key) ? accent : (isNight ? '#3A2800' : '#FFF3DC'),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: uploadedDocs.includes(doc.key) ? 'white' : textMuted,
                  }}>
                    {uploadedDocs.includes(doc.key) ? <CheckIcon size={18} /> : <UploadIcon />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: uploadedDocs.includes(doc.key) ? accent : textPrimary }}>{doc.label}</div>
                    <div style={{ fontSize: 12, color: textMuted, marginTop: 2 }}>{doc.desc}</div>
                  </div>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={nextStep} style={{
                flex: 1, padding: '13px', borderRadius: 10, border: cardBorder, cursor: 'pointer',
                background: 'transparent', color: textMuted, fontSize: 14, fontWeight: 600,
              }}>
                Skip for now
              </button>
              <button onClick={nextStep} style={{
                flex: 2, padding: '13px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: btnBg, color: 'white', fontSize: 14, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                {uploadedDocs.length > 0 ? `Submit ${uploadedDocs.length} doc${uploadedDocs.length > 1 ? 's' : ''}` : 'Continue'}
                <ArrowRight />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 5: Launch ── */}
        {step === 5 && (
          <div style={{ textAlign: 'center' }}>
            {!launched ? (
              <>
                <div style={{ display: 'inline-block', padding: '4px 12px', background: `${accent}22`, borderRadius: 20, color: accent, fontSize: 11, fontWeight: 700, marginBottom: 16 }}>
                  MERCHANT ACCOUNT READY
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: textPrimary, marginBottom: 8 }}>
                  {bizName || 'Your Business'}
                </div>
                <div style={{ fontSize: 13, color: textMuted, marginBottom: 24 }}>
                  {bizType} · {category}
                </div>

                {/* QR Preview */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                  <div style={{ background: cardBg, border: cardBorder, borderRadius: 16, padding: '20px', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <QRPlaceholder name={bizName || 'merchant'} />
                    <div style={{ fontSize: 14, fontWeight: 700, color: textPrimary }}>{bizName || 'Your Business'}</div>
                    <div style={{ fontSize: 12, color: accent, fontWeight: 600 }}>$VICO accepted here</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button onClick={() => setLaunched(true)} style={{
                    width: '100%', padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer',
                    background: btnBg, color: 'white', fontSize: 15, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}>
                    <div style={{ transform: 'scale(0.75)' }}><QRIcon /></div>
                    Generate QR Code
                  </button>
                  <button style={{
                    width: '100%', padding: '14px', borderRadius: 12, cursor: 'pointer',
                    border: cardBorder, background: cardBg, color: textPrimary, fontSize: 14, fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}>
                    <div style={{ transform: 'scale(0.75)' }}><ShareIcon /></div>
                    Get payment button
                  </button>
                  <button onClick={() => router.push('/village/merchant/dashboard')} style={{
                    width: '100%', padding: '14px', borderRadius: 12, cursor: 'pointer',
                    border: cardBorder, background: cardBg, color: textPrimary, fontSize: 14, fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}>
                    <div style={{ transform: 'scale(0.75)' }}><GridIcon /></div>
                    View dashboard
                  </button>
                </div>
              </>
            ) : (
              <div>
                <div style={{ width: 64, height: 64, borderRadius: 32, background: '#1D9E75', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <CheckIcon size={28} />
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: textPrimary, marginBottom: 8 }}>QR Code generated!</div>
                <div style={{ fontSize: 14, color: textMuted, marginBottom: 24 }}>Your merchant account is live.</div>
                <button onClick={() => router.push('/village/merchant/dashboard')} style={{
                  padding: '14px 32px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: btnBg, color: 'white', fontSize: 15, fontWeight: 700,
                }}>
                  Go to Dashboard
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
