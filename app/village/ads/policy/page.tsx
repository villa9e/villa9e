'use client';
import Link from 'next/link';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

const A = {
  day:   { bg: '#F2F7FA', card: '#FFFFFF', border: '#D0E4EF', text: '#0A1F2E', textSec: '#3A5A6E', textTer: '#7A9AAE', surface: '#EAF3F8' },
  night: { bg: '#060F18', card: '#0E1E2E', border: '#1A3040', text: '#EEF4F8', textSec: '#8EB4CC', textTer: '#4A7A96', surface: '#091525' },
};

const PROHIBITED = [
  { label: 'Illegal products and services', desc: 'Ads that promote illegal goods, services, or activities in the viewer\'s jurisdiction.' },
  { label: 'Discriminatory content', desc: 'Ads that discriminate based on race, ethnicity, religion, sex, age, disability, or national origin.' },
  { label: 'Tobacco and smoking products', desc: 'Cigarettes, e-cigarettes, vaping devices, or related paraphernalia.' },
  { label: 'Weapons and ammunition', desc: 'Firearms, explosives, military-grade equipment, or components for illegal weapons.' },
  { label: 'Adult content', desc: 'Nudity, sexual content, or services of a sexual nature.' },
  { label: 'Misleading claims', desc: 'Deceptive, false, or unsubstantiated claims about products or services.' },
  { label: 'MLM and pyramid schemes', desc: 'Multi-level marketing programs, pyramid schemes, or "get rich quick" schemes.' },
  { label: 'Political advertising', desc: 'All political ads — no exceptions, no appeals.' },
];

const RESTRICTED = [
  { label: 'Financial services', req: 'Must be licensed, include required disclosures, and verify credentials.' },
  { label: 'Healthcare and wellness', req: 'No medical claims without substantiation. Prescription drug ads require pre-approval.' },
  { label: 'Alcohol', req: 'Must target users 21+, comply with local laws, include responsibility messaging.' },
  { label: 'Subscription services', req: 'Must clearly disclose billing terms, cancellation policy, and trial terms.' },
];

const TECH_REQUIREMENTS: Record<string, { specs: string[] }> = {
  Video: { specs: ['Max 4GB, MP4 or MOV', 'Aspect ratio: 9:16 (Stories/DreamLine), 4:5 or 1:1 (Feed)', 'Max 60 minutes, min 1 second', 'Captions recommended'] },
  Image: { specs: ['Max 30MB, JPEG or PNG', 'Min 600×600px', 'Text overlay under 20% of image area', 'No excessive stock-photo feel'] },
  Carousel: { specs: ['2–10 cards per carousel', 'Each card: same image specs as Image', 'Unique URL per card recommended', 'Consistent visual theme'] },
  Text: { specs: ['Primary text: max 2200 characters', 'Headline: max 40 characters', 'Description: max 30 characters', 'No ALL-CAPS abuse'] },
};

export default function PolicyPage() {
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';
  const c = isNight ? A.night : A.day;

  return (
    <div style={{ background: c.bg, minHeight: '100vh', color: c.text, fontFamily: 'system-ui,sans-serif' }}>
      {/* Header */}
      <div style={{ background: c.card, borderBottom: `1px solid ${c.border}`, padding: '0 20px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12, height: 56 }}>
          <Link href="/village/ads" style={{ display: 'flex', alignItems: 'center', color: c.textSec, textDecoration: 'none' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </Link>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Ad Policy Center</span>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Prohibited content */}
        <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
              </svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Prohibited content</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {PROHIBITED.map((item, i) => (
              <div key={item.label} style={{ padding: '14px 20px', borderBottom: i < PROHIBITED.length - 1 ? `1px solid ${c.border}` : undefined,
                display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" style={{ flexShrink: 0, marginTop: 2 }}>
                  <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{item.label}</div>
                  <div style={{ fontSize: 13, color: c.textSec }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Restricted categories */}
        <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/>
              </svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Restricted categories</span>
            <span style={{ fontSize: 12, color: c.textSec }}>Allowed with disclosure</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {RESTRICTED.map((item, i) => (
              <div key={item.label} style={{ padding: '14px 20px', borderBottom: i < RESTRICTED.length - 1 ? `1px solid ${c.border}` : undefined,
                display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" style={{ flexShrink: 0, marginTop: 2 }}>
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/>
                </svg>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{item.label}</div>
                  <div style={{ fontSize: 13, color: c.textSec }}>{item.req}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Technical requirements */}
        <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${c.border}`, fontWeight: 700, fontSize: 15 }}>Technical requirements by format</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
            {Object.entries(TECH_REQUIREMENTS).map(([fmt, { specs }], i) => (
              <div key={fmt} style={{ padding: '16px 20px',
                borderRight: i % 2 === 0 ? `1px solid ${c.border}` : undefined,
                borderBottom: i < Object.keys(TECH_REQUIREMENTS).length - 2 ? `1px solid ${c.border}` : undefined }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: '#2952E8' }}>{fmt}</div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {specs.map(s => (
                    <li key={s} style={{ display: 'flex', gap: 7, alignItems: 'flex-start', fontSize: 13, color: c.textSec }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={c.textTer} strokeWidth="2" style={{ flexShrink: 0, marginTop: 2 }}>
                        <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                      </svg>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Appeal process */}
        <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 14, padding: '20px 24px' }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2952E8" strokeWidth="2">
              <path d="M3 10h10a8 8 0 018 8v2M3 10l6 6M3 10l6-6"/>
            </svg>
            Appeal process
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { step: '1', title: 'Review the rejection reason', desc: 'Check your notification for the specific policy violation cited.' },
              { step: '2', title: 'Edit and resubmit', desc: 'If the issue is correctable, fix your creative and resubmit for automatic re-review.' },
              { step: '3', title: 'Request human review', desc: 'If you believe the rejection was an error, submit one appeal per rejected ad. Human review takes up to 48 hours.' },
              { step: '4', title: 'Final decision', desc: 'Human review decisions are final. Repeated policy violations may result in account restrictions.' },
            ].map(item => (
              <div key={item.step} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(41,82,232,0.1)', border: '2px solid #2952E8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#2952E8', flexShrink: 0 }}>
                  {item.step}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{item.title}</div>
                  <div style={{ fontSize: 13, color: c.textSec, marginTop: 3 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
