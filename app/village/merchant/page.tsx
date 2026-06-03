'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

// Mock: check if user has merchant account
function useMerchantAccount() {
  const [hasMerchant, setHasMerchant] = useState<boolean | null>(null);
  useEffect(() => {
    // Mock: no merchant account by default
    setHasMerchant(false);
  }, []);
  return hasMerchant;
}

function TeepeeIcon({ size = 48, color = '#EF9F27' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M24 4L6 40h12l2-6h8l2 6h12L24 4z" fill={color} opacity="0.9" />
      <path d="M24 4L18 22h12L24 4z" fill={color} />
      <rect x="21" y="26" width="6" height="10" rx="2" fill="rgba(0,0,0,0.25)" />
    </svg>
  );
}

function StoreIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l1-4h16l1 4" /><path d="M21 9v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9" />
      <path d="M9 21V9" /><path d="M15 21V9" />
    </svg>
  );
}

function QRIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" /><path d="M14 14h.01M14 18h.01M18 14h.01M18 18h.01M21 14v.01M14 21v.01M21 21v.01" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
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

const FEATURES = [
  { icon: <QRIcon />, title: 'Accept $VICO instantly', desc: 'QR codes, payment links, and web buttons' },
  { icon: <ChartIcon />, title: 'Track your earnings', desc: 'Real-time dashboard with AI insights' },
  { icon: <StoreIcon />, title: 'Link your eStore', desc: 'Unified commerce with Trading Post' },
  { icon: <MapPinIcon />, title: 'Get discovered', desc: 'Listed on the Village merchant map' },
];

export default function MerchantHomePage() {
  const router = useRouter();
  const isNight = useVillageTheme(s => s.theme) === 'night';
  const hasMerchant = useMerchantAccount();

  const pageBg     = isNight ? '#1A1400' : '#FFFBF2';
  const heroBg     = '#412402';
  const cardBg     = isNight ? '#221A00' : '#FFFFFF';
  const cardBorder = isNight ? '1px solid #3A2800' : '1px solid #F0D9B0';
  const textPrimary   = isNight ? '#F5E6C8' : '#2D1A00';
  const textMuted     = isNight ? '#9B7A3A' : '#8B6230';
  const btnBg         = '#BA7517';
  const accent        = '#EF9F27';

  // Redirect if merchant account exists
  useEffect(() => {
    if (hasMerchant === true) {
      router.replace('/village/merchant/dashboard');
    }
  }, [hasMerchant, router]);

  if (hasMerchant === null) {
    return <div style={{ minHeight: '100vh', background: pageBg }} />;
  }

  return (
    <div style={{ minHeight: '100vh', background: pageBg, paddingBottom: 80 }}>
      {/* Hero */}
      <div style={{ background: heroBg, padding: '52px 20px 32px', position: 'relative', overflow: 'hidden' }}>
        {/* Back arrow */}
        <Link href="/village" style={{
          position: 'absolute', top: 16, left: 16,
          display: 'flex', alignItems: 'center', gap: 6,
          color: 'rgba(255,255,255,0.75)', textDecoration: 'none', fontSize: 14,
        }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Village
        </Link>

        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(239,159,39,0.08)' }} />
        <div style={{ position: 'absolute', bottom: -20, left: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(239,159,39,0.06)' }} />

        <div style={{ position: 'relative', textAlign: 'center' }}>
          <TeepeeIcon size={56} color={accent} />
          <div style={{ marginTop: 12 }}>
            <span style={{ display: 'inline-block', padding: '4px 12px', background: `${accent}22`, borderRadius: 20, color: accent, fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>
              VICO MERCHANT NETWORK
            </span>
          </div>
          <div style={{ color: 'white', fontSize: 26, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.2 }}>
            Start accepting $VICO
          </div>
          <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, marginTop: 8, lineHeight: 1.5 }}>
            Join the Village economy. Accept crypto payments, get discovered, and grow your business.
          </div>
          <Link href="/village/merchant/onboarding" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            marginTop: 20, padding: '14px 28px',
            background: btnBg, borderRadius: 12,
            color: 'white', fontWeight: 700, fontSize: 15, textDecoration: 'none',
            boxShadow: '0 4px 16px rgba(186,117,23,0.4)',
          }}>
            Set up merchant account
            <ArrowRight />
          </Link>
        </div>
      </div>

      {/* Features */}
      <div style={{ padding: '24px 16px 0' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: textMuted, letterSpacing: 0.5, marginBottom: 14, textTransform: 'uppercase' }}>
          What you get
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{ background: cardBg, border: cardBorder, borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: btnBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {f.icon}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: textPrimary }}>{f.title}</div>
                <div style={{ fontSize: 12, color: textMuted, marginTop: 2 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats bar */}
        <div style={{ background: cardBg, border: cardBorder, borderRadius: 12, padding: '16px', marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', textAlign: 'center' }}>
          {[
            { value: '1,240', label: 'Active merchants' },
            { value: '$48K', label: 'Volume last week' },
            { value: '0%', label: 'Transaction fee' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 18, fontWeight: 800, color: accent }}>{s.value}</div>
              <div style={{ fontSize: 11, color: textMuted, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Already a merchant? */}
        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: textMuted }}>
          Already have an account?{' '}
          <Link href="/village/merchant/dashboard" style={{ color: accent, fontWeight: 600, textDecoration: 'none' }}>
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
