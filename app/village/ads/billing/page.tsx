'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

const A = {
  day:   { bg: '#F2F7FA', card: '#FFFFFF', border: '#D0E4EF', text: '#0A1F2E', textSec: '#3A5A6E', textTer: '#7A9AAE', surface: '#EAF3F8' },
  night: { bg: '#060F18', card: '#0E1E2E', border: '#1A3040', text: '#EEF4F8', textSec: '#8EB4CC', textTer: '#4A7A96', surface: '#091525' },
};

export default function BillingPage() {
  const isNight = useVillageTheme(s => s.theme) === 'night';
  const c = isNight ? A.night : A.day;
  const [threshold, setThreshold] = useState(25);
  const [spendLimit, setSpendLimit] = useState('');

  return (
    <div style={{ background: c.bg, minHeight: '100vh', color: c.text, fontFamily: 'system-ui,sans-serif' }}>
      {/* Header */}
      <div style={{ background: c.card, borderBottom: `1px solid ${c.border}`, padding: '0 20px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12, height: 56 }}>
          <Link href="/village/ads" style={{ display: 'flex', alignItems: 'center', color: c.textSec, textDecoration: 'none' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </Link>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Billing</span>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Payment methods */}
        <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${c.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Payment methods</span>
            <button style={{ background: '#2952E8', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              + Add payment method
            </button>
          </div>
          <div style={{ padding: '32px 20px', textAlign: 'center', color: c.textSec, fontSize: 14 }}>
            No payment methods added yet.
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Billing threshold */}
          <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 14, padding: '20px' }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Billing threshold</div>
            <div style={{ fontSize: 13, color: c.textSec, marginBottom: 16 }}>
              Your card is charged when spend reaches this amount. Auto-increases with account history.
            </div>
            <div style={{ fontSize: 36, fontWeight: 700, marginBottom: 4 }}>${threshold}</div>
            <input type="range" min="5" max="500" step="5" value={threshold} onChange={e => setThreshold(+e.target.value)}
              style={{ width: '100%', accentColor: '#2952E8', marginBottom: 6 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: c.textTer }}>
              <span>$5</span><span>$500</span>
            </div>
          </div>

          {/* Account spend limit */}
          <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 14, padding: '20px' }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Account spending limit</div>
            <div style={{ fontSize: 13, color: c.textSec, marginBottom: 16 }}>
              Set a maximum lifetime spend for this account. All campaigns pause when reached.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: c.textSec }}>$</span>
              <input type="number" value={spendLimit} onChange={e => setSpendLimit(e.target.value)}
                placeholder="No limit" min="1"
                style={{ flex: 1, background: c.surface, border: `1px solid ${c.border}`, color: c.text, borderRadius: 8, padding: '10px 12px', fontSize: 16, fontWeight: 700, outline: 'none' }} />
            </div>
            <button style={{ marginTop: 14, background: '#2952E8', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              Save limit
            </button>
          </div>
        </div>

        {/* Billing history */}
        <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${c.border}`, fontWeight: 700, fontSize: 15 }}>Billing history</div>
          <div style={{ padding: '32px 20px', textAlign: 'center', color: c.textSec, fontSize: 14 }}>
            No billing history yet. Charges appear here after your first campaign runs.
          </div>
        </div>
      </div>
    </div>
  );
}
