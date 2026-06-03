'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

const A = {
  day:   { bg: '#F2F7FA', card: '#FFFFFF', border: '#D0E4EF', text: '#0A1F2E', textSec: '#3A5A6E', textTer: '#7A9AAE', surface: '#EAF3F8' },
  night: { bg: '#060F18', card: '#0E1E2E', border: '#1A3040', text: '#EEF4F8', textSec: '#8EB4CC', textTer: '#4A7A96', surface: '#091525' },
};

const PAYMENT_METHODS = [
  { id: 'pm1', type: 'card', brand: 'Visa', last4: '4242', expiry: '12/28', isDefault: true },
  { id: 'pm2', type: 'card', brand: 'Mastercard', last4: '8831', expiry: '07/27', isDefault: false },
  { id: 'pm3', type: 'bank', brand: 'Village Bank', last4: null, expiry: null, isDefault: false },
];

const BILLING_HISTORY = [
  { id: 'inv1', date: 'Jun 1, 2026',  amount: 420.00, status: 'paid',    desc: 'May 26–Jun 1 spend' },
  { id: 'inv2', date: 'May 25, 2026', amount: 380.50, status: 'paid',    desc: 'May 18–25 spend' },
  { id: 'inv3', date: 'May 18, 2026', amount: 295.80, status: 'paid',    desc: 'May 11–18 spend' },
  { id: 'inv4', date: 'May 11, 2026', amount: 210.40, status: 'paid',    desc: 'May 4–11 spend' },
  { id: 'inv5', date: 'May 4, 2026',  amount: 185.60, status: 'paid',    desc: 'Apr 27–May 4 spend' },
];

const CARD_ICONS: Record<string, string> = {
  Visa:       '#1A1F71',
  Mastercard: '#EB001B',
  'Village Bank': '#2952E8',
};

export default function BillingPage() {
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';
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
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {PAYMENT_METHODS.map(pm => (
              <div key={pm.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: c.surface, border: `1px solid ${c.border}`, borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 28, background: CARD_ICONS[pm.brand] ?? '#6B7280', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#fff', fontSize: 9, fontWeight: 700 }}>{pm.brand.slice(0, 4).toUpperCase()}</span>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      {pm.brand} {pm.last4 ? `•••• ${pm.last4}` : 'Balance'}
                    </div>
                    {pm.expiry && <div style={{ fontSize: 12, color: c.textSec }}>Expires {pm.expiry}</div>}
                  </div>
                  {pm.isDefault && (
                    <span style={{ fontSize: 11, background: 'rgba(41,82,232,0.12)', color: '#2952E8', borderRadius: 100, padding: '2px 8px', fontWeight: 600 }}>
                      Default
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {!pm.isDefault && (
                    <button style={{ fontSize: 12, color: '#2952E8', background: 'transparent', border: `1px solid ${c.border}`, borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontWeight: 600 }}>
                      Set default
                    </button>
                  )}
                  <button style={{ fontSize: 12, color: '#EF4444', background: 'transparent', border: `1px solid ${c.border}`, borderRadius: 6, padding: '5px 10px', cursor: 'pointer' }}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
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
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${c.border}` }}>
                {['Date', 'Description', 'Amount', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: c.textTer }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BILLING_HISTORY.map(inv => (
                <tr key={inv.id} style={{ borderBottom: `1px solid ${c.border}` }}
                  onMouseEnter={e => (e.currentTarget.style.background = c.surface)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '12px 20px', fontSize: 13 }}>{inv.date}</td>
                  <td style={{ padding: '12px 20px', fontSize: 13, color: c.textSec }}>{inv.desc}</td>
                  <td style={{ padding: '12px 20px', fontSize: 14, fontWeight: 700 }}>${inv.amount.toFixed(2)}</td>
                  <td style={{ padding: '12px 20px' }}>
                    <span style={{ fontSize: 12, background: 'rgba(34,197,94,0.12)', color: '#16A34A', borderRadius: 100, padding: '3px 9px', fontWeight: 600, textTransform: 'capitalize' }}>
                      {inv.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    <button style={{ fontSize: 12, color: '#2952E8', background: 'transparent', border: `1px solid ${c.border}`, borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Receipt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
