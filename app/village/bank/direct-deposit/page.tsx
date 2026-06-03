'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { BankBottomNav } from '@/components/bank/BankBottomNav';

const B = {
  day:   { bg:'#F2F7FA', card:'#FFFFFF', border:'#C8DCE8', text:'#0A1F2E', textSec:'#3A5A6E', textTer:'#7A9AAE', action:'#0A5F8A' },
  night: { bg:'#060F18', card:'#0E1E2E', border:'#1A3040', text:'#EEF4F8', textSec:'#8EB4CC', textTer:'#4A7A96', action:'#2A9FCC' },
};

const DEPOSIT_HISTORY = [
  { id: 1, from: 'Acme Corp', amount: 2850.00, date: 'Jun 1, 2026' },
  { id: 2, from: 'Acme Corp', amount: 2850.00, date: 'May 15, 2026' },
  { id: 3, from: 'Acme Corp', amount: 2850.00, date: 'May 1, 2026' },
  { id: 4, from: 'Acme Corp', amount: 3200.00, date: 'Apr 15, 2026' },
];

export default function DirectDepositPage() {
  const router = useRouter();
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';
  const c = isNight ? B.night : B.day;
  const [showRouting, setShowRouting] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [copied, setCopied]           = useState<string | null>(null);

  function copy(label: string, val: string) {
    navigator.clipboard.writeText(val).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 1800);
    });
  }

  function downloadForm() {
    const content = `VILLAGE BANK — DIRECT DEPOSIT AUTHORIZATION\n\nRouting Number: 084106768\nAccount Number: 4321000012345\nAccount Holder: Village Bank Member\nAccount Type: Checking\n\nAuthorize this financial institution to initiate direct deposit entries to your account.\n\nSigned: _________________ Date: _________________`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'village-bank-direct-deposit.txt';
    a.click();
  }

  return (
    <div style={{ background: c.bg, minHeight: '100vh', maxWidth: 480, margin: '0 auto', paddingBottom: 88 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px 12px', background: c.card, borderBottom: `1px solid ${c.border}` }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.textSec, display: 'flex', padding: 4 }}>
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <h1 style={{ fontWeight: 800, fontSize: 18, color: c.text, letterSpacing: -0.5, margin: 0 }}>Direct Deposit</h1>
      </div>

      <div style={{ padding: '20px 16px 0' }}>
        {/* Account card — deep teal */}
        <div style={{ background: '#0A5F8A', borderRadius: 20, padding: 22, marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }}/>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 700, margin: 0, letterSpacing: 0.5 }}>VILLAGE BANK — CHECKING</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '3px 10px' }}>
              <svg width={12} height={12} viewBox="0 0 24 24" fill="#4CAF50"><path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"/></svg>
              <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>FDIC via Unit</span>
            </div>
          </div>

          {/* Routing */}
          <div style={{ marginBottom: 12 }}>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, margin: '0 0 3px', letterSpacing: 0.6 }}>ROUTING NUMBER</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 17, fontFamily: 'monospace', letterSpacing: 2 }}>
                {showRouting ? '084106768' : '•••••••••'}
              </span>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowRouting(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', padding: 4 }}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                    {showRouting ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
                  </svg>
                </button>
                <button onClick={() => copy('routing', '084106768')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', padding: 4 }}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                </button>
              </div>
            </div>
            {copied === 'routing' && <p style={{ color: '#4CAF50', fontSize: 11, margin: '4px 0 0' }}>Copied!</p>}
          </div>

          {/* Account */}
          <div>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, margin: '0 0 3px', letterSpacing: 0.6 }}>ACCOUNT NUMBER</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 17, fontFamily: 'monospace', letterSpacing: 2 }}>
                {showAccount ? '4321000012345' : '•••••••••••••'}
              </span>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowAccount(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', padding: 4 }}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                    {showAccount ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
                  </svg>
                </button>
                <button onClick={() => copy('account', '4321000012345')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', padding: 4 }}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                </button>
              </div>
            </div>
            {copied === 'account' && <p style={{ color: '#4CAF50', fontSize: 11, margin: '4px 0 0' }}>Copied!</p>}
          </div>
        </div>

        {/* Employer setup instructions */}
        <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: c.text, margin: '0 0 12px' }}>Employer Setup Instructions</p>
          {[
            { n: '1', t: 'Log into your employer\'s payroll portal or contact HR' },
            { n: '2', t: 'Select "Update Direct Deposit" or "Add Bank Account"' },
            { n: '3', t: 'Enter the routing and account numbers above' },
            { n: '4', t: 'Choose "Checking Account" as the account type' },
            { n: '5', t: 'Set amount or percentage — first deposit may take 1-2 pay cycles' },
          ].map(step => (
            <div key={step.n} style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
              <div style={{ width: 22, height: 22, borderRadius: 11, background: c.action, color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{step.n}</div>
              <p style={{ fontSize: 13, color: c.textSec, margin: 0, paddingTop: 2, lineHeight: 1.5 }}>{step.t}</p>
            </div>
          ))}
          <button onClick={downloadForm}
            style={{ width: '100%', marginTop: 8, padding: '12px 0', borderRadius: 12, border: `1px solid ${c.action}`, background: 'transparent', color: c.action, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
            </svg>
            Download Authorization Form
          </button>
        </div>

        {/* Mobile check deposit */}
        <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: isNight ? '#1A3040' : '#E8F3FA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={c.action} strokeWidth={2} strokeLinecap="round">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2zM12 10a4 4 0 100 8 4 4 0 000-8z"/>
              </svg>
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: c.text, margin: 0 }}>Mobile Check Deposit</p>
              <p style={{ fontSize: 12, color: c.textTer, margin: 0 }}>Deposit checks with your camera</p>
            </div>
          </div>
          <div style={{ marginTop: 12, padding: '10px 12px', background: isNight ? '#0A1520' : '#F2F7FA', borderRadius: 10 }}>
            <p style={{ fontSize: 12, color: c.textSec, margin: 0, lineHeight: 1.6 }}>
              Write &ldquo;For Mobile Deposit Only&rdquo; on the back. Take photos of front and back in good lighting. Funds available within 1–2 business days.
            </p>
          </div>
          <button style={{ width: '100%', marginTop: 10, padding: '12px 0', borderRadius: 12, background: c.action, border: 'none', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2zM12 10a4 4 0 100 8 4 4 0 000-8z"/>
            </svg>
            Deposit a Check
          </button>
        </div>

        {/* Deposit history */}
        <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${c.border}` }}>
            <p style={{ fontWeight: 700, fontSize: 14, color: c.text, margin: 0 }}>Deposit History</p>
          </div>
          {DEPOSIT_HISTORY.map((dep, i) => (
            <div key={dep.id} style={{ padding: '12px 16px', borderBottom: i < DEPOSIT_HISTORY.length - 1 ? `1px solid ${c.border}` : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: c.text, margin: 0 }}>{dep.from}</p>
                <p style={{ fontSize: 11, color: c.textTer, margin: 0 }}>{dep.date} · Direct Deposit</p>
              </div>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#0F6E56' }}>+${dep.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          ))}
        </div>
      </div>
      <BankBottomNav active="/village/bank" />
    </div>
  );
}
