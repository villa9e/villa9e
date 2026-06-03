'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

// ── Icons ────────────────────────────────────────────────────────────────────
function SaveIcon() { return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>; }
function AlertIcon() { return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>; }
function CheckIcon() { return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>; }
function DownloadIcon() { return <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>; }
function UploadIcon() { return <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>; }

interface Toggle { label: string; desc: string; key: string; }

const NOTIFICATION_TOGGLES: Toggle[] = [
  { label: 'Per-payment alert', desc: 'Notified on every new payment', key: 'per_payment' },
  { label: 'Daily summary', desc: 'Daily earnings digest at 8pm', key: 'daily' },
  { label: 'Weekly report', desc: 'Full analytics every Monday', key: 'weekly' },
  { label: 'Invoice due', desc: '48h before invoice due date', key: 'invoice_due' },
  { label: 'New customer', desc: 'When a new customer pays you', key: 'new_customer' },
];

export default function MerchantSettingsPage() {
  const isNight = useVillageTheme(s => s.theme) === 'night';

  // Business profile
  const [bizName, setBizName] = useState('Jade\'s Ceramics');
  const [bizType] = useState('creator');
  const [category, setCategory] = useState('Art & Design');
  const [website, setWebsite] = useState('https://jadeceramics.com');
  const [description, setDescription] = useState('Handmade ceramics crafted with intention in the Bay Area.');
  const [location, setLocation] = useState('San Francisco, CA');
  const [hours, setHours] = useState('Mon-Fri 10am-6pm');

  // Payout
  const [payoutMode, setPayoutMode] = useState<'hold' | 'convert' | 'split'>('hold');
  const [splitPct, setSplitPct] = useState(50);
  const [minThreshold, setMinThreshold] = useState('50');
  const [bankAccount, setBankAccount] = useState('Chase ···4291');

  // Tax
  const [ein, setEin] = useState('');
  const [taxRate, setTaxRate] = useState('8.5');

  // Notifications
  const [notifToggles, setNotifToggles] = useState<Record<string, boolean>>({
    per_payment: true, daily: true, weekly: false, invoice_due: true, new_customer: false,
  });

  // Danger zone
  const [showDeactivate, setShowDeactivate] = useState(false);

  const pageBg      = isNight ? '#1A1400' : '#FFFBF2';
  const heroBg      = '#412402';
  const cardBg      = isNight ? '#221A00' : '#FFFFFF';
  const cardBorder  = isNight ? '1px solid #3A2800' : '1px solid #F0D9B0';
  const textPrimary = isNight ? '#F5E6C8' : '#2D1A00';
  const textMuted   = isNight ? '#9B7A3A' : '#8B6230';
  const accent      = '#EF9F27';
  const btnBg       = '#BA7517';
  const inputStyle  = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: isNight ? '1px solid #3A2800' : '1px solid #F0D9B0',
    background: isNight ? '#2C1E00' : '#FFFDF5',
    color: textPrimary, fontSize: 13, outline: 'none', boxSizing: 'border-box' as const,
  };

  function SectionHeader({ title, sub }: { title: string; sub?: string }) {
    return (
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: textPrimary }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: textMuted, marginTop: 2 }}>{sub}</div>}
      </div>
    );
  }

  function SwitchToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
    return (
      <button onClick={() => onChange(!value)} style={{
        width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0,
        background: value ? accent : (isNight ? '#3A2800' : '#E0C898'),
        transition: 'background 0.2s',
      }}>
        <div style={{
          position: 'absolute', top: 3, left: value ? 23 : 3, width: 18, height: 18,
          borderRadius: 9, background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.3)', transition: 'left 0.2s',
        }} />
      </button>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: pageBg, paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: heroBg, padding: '52px 20px 20px', position: 'relative' }}>
        <Link href="/village/merchant" style={{
          position: 'absolute', top: 16, left: 16,
          display: 'flex', alignItems: 'center', gap: 6,
          color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 14,
        }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Merchant
        </Link>
        <div style={{ color: 'white', fontSize: 22, fontWeight: 800 }}>Settings</div>
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 4 }}>Manage your merchant account</div>
      </div>

      <div style={{ padding: '20px 16px 0' }}>
        {/* ── Business Profile ── */}
        <div style={{ background: cardBg, border: cardBorder, borderRadius: 14, padding: '18px', marginBottom: 16 }}>
          <SectionHeader title="Business Profile" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: textMuted, marginBottom: 4 }}>Business Name</label>
              <input style={inputStyle} value={bizName} onChange={e => setBizName(e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: textMuted, marginBottom: 4 }}>Type</label>
                <input style={{ ...inputStyle, background: isNight ? '#1A1400' : '#F5EDD8', color: textMuted }} value={bizType} readOnly />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: textMuted, marginBottom: 4 }}>Category</label>
                <input style={inputStyle} value={category} onChange={e => setCategory(e.target.value)} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: textMuted, marginBottom: 4 }}>Location</label>
              <input style={inputStyle} value={location} onChange={e => setLocation(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: textMuted, marginBottom: 4 }}>Business Hours</label>
              <input style={inputStyle} value={hours} onChange={e => setHours(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: textMuted, marginBottom: 4 }}>Website</label>
              <input style={inputStyle} value={website} onChange={e => setWebsite(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: textMuted, marginBottom: 4 }}>Description</label>
              <textarea style={{ ...inputStyle, height: 72, resize: 'none' as const }} value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <button style={{
              padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: btnBg, color: 'white', fontWeight: 700, fontSize: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <SaveIcon /> Save profile
            </button>
          </div>
        </div>

        {/* ── Verification ── */}
        <div style={{ background: cardBg, border: cardBorder, borderRadius: 14, padding: '18px', marginBottom: 16 }}>
          <SectionHeader title="Verification Status" sub="Verified merchants get a badge on their profile, map pin, and receipts" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 20, background: '#EF9F2722', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: textPrimary }}>Pending Review</div>
              <div style={{ fontSize: 12, color: textMuted }}>1 document submitted · 3-5 business days</div>
            </div>
            <span style={{ marginLeft: 'auto', padding: '3px 10px', borderRadius: 20, background: `${accent}22`, color: accent, fontSize: 11, fontWeight: 700 }}>Pending</span>
          </div>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px',
            borderRadius: 8, border: cardBorder, background: 'transparent', cursor: 'pointer',
            color: textMuted, fontSize: 12, fontWeight: 600,
          }}>
            <UploadIcon /> Add more documents
          </button>
        </div>

        {/* ── Payout ── */}
        <div style={{ background: cardBg, border: cardBorder, borderRadius: 14, padding: '18px', marginBottom: 16 }}>
          <SectionHeader title="Payout Preferences" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            {([['hold','Hold $VICO','Accumulate in your Village wallet'],['convert','Auto-convert to USD','Deposit to bank at threshold'],['split','Split','Choose % to hold vs convert']] as const).map(([key, label, desc]) => (
              <button key={key} onClick={() => setPayoutMode(key)} style={{
                padding: '12px 14px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                border: payoutMode === key ? `2px solid ${accent}` : cardBorder,
                background: payoutMode === key ? (isNight ? '#3A2000' : '#FFF8ED') : cardBg,
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{ width: 20, height: 20, borderRadius: 10, border: `2px solid ${payoutMode === key ? accent : textMuted}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {payoutMode === key && <div style={{ width: 10, height: 10, borderRadius: 5, background: accent }} />}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: payoutMode === key ? accent : textPrimary }}>{label}</div>
                  <div style={{ fontSize: 11, color: textMuted }}>{desc}</div>
                </div>
              </button>
            ))}
          </div>

          {payoutMode === 'split' && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: textMuted, marginBottom: 8 }}>
                <span>Hold $VICO: {splitPct}%</span>
                <span>Convert: {100 - splitPct}%</span>
              </div>
              <input
                type="range" min={0} max={100} value={splitPct}
                onChange={e => setSplitPct(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: accent }}
              />
            </div>
          )}

          {(payoutMode === 'convert' || payoutMode === 'split') && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: textMuted, marginBottom: 4 }}>Min Threshold (VICO)</label>
                <input type="number" style={inputStyle} value={minThreshold} onChange={e => setMinThreshold(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: textMuted, marginBottom: 4 }}>Bank Account</label>
                <input style={inputStyle} value={bankAccount} onChange={e => setBankAccount(e.target.value)} />
              </div>
            </div>
          )}

          <button style={{
            padding: '11px', borderRadius: 9, border: 'none', cursor: 'pointer',
            background: btnBg, color: 'white', fontWeight: 700, fontSize: 13,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%',
          }}>
            <SaveIcon /> Save payout settings
          </button>
        </div>

        {/* ── Tax ── */}
        <div style={{ background: cardBg, border: cardBorder, borderRadius: 14, padding: '18px', marginBottom: 16 }}>
          <SectionHeader title="Tax Settings" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: textMuted, marginBottom: 4 }}>EIN / Tax ID (encrypted)</label>
              <input style={inputStyle} type="password" placeholder="XX-XXXXXXX" value={ein} onChange={e => setEin(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: textMuted, marginBottom: 4 }}>Default Tax Rate (%)</label>
              <input style={inputStyle} type="number" placeholder="0" value={taxRate} onChange={e => setTaxRate(e.target.value)} />
            </div>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px',
              borderRadius: 8, border: cardBorder, background: 'transparent', cursor: 'pointer',
              color: textMuted, fontSize: 12, fontWeight: 600,
            }}>
              <DownloadIcon /> Download year-end summary (2025)
            </button>
          </div>
        </div>

        {/* ── Notifications ── */}
        <div style={{ background: cardBg, border: cardBorder, borderRadius: 14, padding: '18px', marginBottom: 16 }}>
          <SectionHeader title="Notifications" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {NOTIFICATION_TOGGLES.map(t => (
              <div key={t.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: textPrimary }}>{t.label}</div>
                  <div style={{ fontSize: 11, color: textMuted, marginTop: 2 }}>{t.desc}</div>
                </div>
                <SwitchToggle
                  value={notifToggles[t.key] ?? false}
                  onChange={v => setNotifToggles(prev => ({ ...prev, [t.key]: v }))}
                />
              </div>
            ))}
          </div>
        </div>

        {/* ── Danger Zone ── */}
        <div style={{ background: isNight ? '#1A0A0A' : '#FFF5F5', border: isNight ? '1px solid #3A1010' : '1px solid #F0C0C0', borderRadius: 14, padding: '18px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <AlertIcon />
            <span style={{ fontSize: 14, fontWeight: 800, color: '#E05050' }}>Danger Zone</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: textPrimary }}>Deactivate account</div>
                <div style={{ fontSize: 11, color: textMuted }}>Pause all payments. Reactivate anytime.</div>
              </div>
              <button onClick={() => setShowDeactivate(!showDeactivate)} style={{
                padding: '8px 14px', borderRadius: 8, border: '1px solid #E05050', background: 'transparent',
                color: '#E05050', cursor: 'pointer', fontSize: 12, fontWeight: 600,
              }}>
                Deactivate
              </button>
            </div>
            <div style={{ height: 1, background: isNight ? '#3A1010' : '#F0C0C0' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#E05050' }}>Close account</div>
                <div style={{ fontSize: 11, color: textMuted }}>Permanently delete. This cannot be undone.</div>
              </div>
              <button style={{
                padding: '8px 14px', borderRadius: 8, border: 'none', background: '#E05050',
                color: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 700,
              }}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
