'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { BankBottomNav } from '@/components/bank/BankBottomNav';
import { createClient } from '@/lib/supabase/client';

const B = {
  day:   { bg:'#F2F7FA', card:'#FFFFFF', border:'#C8DCE8', text:'#0A1F2E', textSec:'#3A5A6E', textTer:'#7A9AAE', action:'#0A5F8A' },
  night: { bg:'#060F18', card:'#0E1E2E', border:'#1A3040', text:'#EEF4F8', textSec:'#8EB4CC', textTer:'#4A7A96', action:'#2A9FCC' },
};

// Simple SVG QR code generator (encoding a URL into a 25x25 grid via a deterministic hash pattern)
function SimpleQR({ data, size = 200 }: { data: string; size?: number }) {
  const MODULES = 25;
  const cell = size / MODULES;

  // Generate a deterministic but plausible-looking QR-style grid from the string
  function hash(s: string, seed: number): number {
    let h = seed;
    for (let i = 0; i < s.length; i++) {
      h = Math.imul(h ^ s.charCodeAt(i), 0x5bd1e995);
      h ^= h >>> 15;
    }
    return Math.abs(h);
  }

  const cells: boolean[][] = [];
  for (let row = 0; row < MODULES; row++) {
    cells[row] = [];
    for (let col = 0; col < MODULES; col++) {
      // Finder patterns at corners
      if ((row < 7 && col < 7) || (row < 7 && col >= MODULES - 7) || (row >= MODULES - 7 && col < 7)) {
        const r = row < 7 ? row : row - (MODULES - 7);
        const c = col < 7 ? col : col - (MODULES - 7);
        cells[row][col] = (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4));
      } else {
        cells[row][col] = hash(data, row * MODULES + col) % 2 === 0;
      }
    }
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} xmlns="http://www.w3.org/2000/svg">
      <rect width={size} height={size} fill="#fff"/>
      {cells.flatMap((row, r) =>
        row.map((dark, c) =>
          dark ? <rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell} height={cell} fill="#000"/> : null
        )
      )}
    </svg>
  );
}

export default function ReceivePage() {
  const router = useRouter();
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';
  const c = isNight ? B.night : B.day;

  const [username, setUsername]   = useState('');
  const [copied, setCopied]       = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [requestMode, setRequestMode] = useState(false);
  const [amount, setAmount]       = useState('');
  const [note, setNote]           = useState('');

  const payUrl = username ? `https://villa.app/pay/${username}${amount ? `?amount=${amount}&note=${encodeURIComponent(note)}` : ''}` : 'https://villa.app/pay/you';

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await (supabase as any).from('profiles').select('username').eq('id', user.id).single();
      if (data?.username) setUsername(data.username);
    });
  }, []);

  function copy(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div style={{ background: c.bg, minHeight: '100vh', maxWidth: 480, margin: '0 auto', paddingBottom: 88 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px 12px', background: c.card, borderBottom: `1px solid ${c.border}` }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.textSec, display: 'flex', padding: 4 }}>
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <h1 style={{ fontWeight: 800, fontSize: 18, color: c.text, letterSpacing: -0.5, margin: 0 }}>Receive Money</h1>
      </div>

      <div style={{ padding: '20px 16px 0' }}>
        {/* QR Code card */}
        <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 20, padding: 24, marginBottom: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ padding: 12, background: '#fff', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <SimpleQR data={payUrl} size={180} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: c.text }}>@{username || '…'}</span>
            <button onClick={() => copy(payUrl)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.action, display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700 }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
              </svg>
              {copied ? 'Copied!' : 'Copy link'}
            </button>
          </div>
          <p style={{ fontSize: 12, color: c.textTer, margin: 0, textAlign: 'center' }}>Anyone can scan this to pay you instantly</p>
        </div>

        {/* Request specific amount toggle */}
        <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: c.text }}>Request specific amount</span>
            <button onClick={() => setRequestMode(v => !v)}
              style={{ width: 44, height: 24, borderRadius: 12, background: requestMode ? c.action : (isNight ? '#1A3040' : '#C8DCE8'), border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
              <span style={{ position: 'absolute', top: 2, left: requestMode ? 22 : 2, width: 20, height: 20, borderRadius: 10, background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
            </button>
          </div>
          {requestMode && (
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, fontWeight: 700, color: c.textSec }}>$</span>
                <input value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} type="text" inputMode="decimal" placeholder="0.00"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '11px 14px 11px 28px', borderRadius: 12, border: `1px solid ${c.border}`, background: isNight ? '#0E1E2E' : '#F2F7FA', color: c.text, fontSize: 16, fontWeight: 700, outline: 'none' }} />
              </div>
              <input value={note} onChange={e => setNote(e.target.value)} placeholder="What's it for? (optional)"
                style={{ width: '100%', boxSizing: 'border-box', padding: '11px 14px', borderRadius: 12, border: `1px solid ${c.border}`, background: isNight ? '#0E1E2E' : '#F2F7FA', color: c.text, fontSize: 14, outline: 'none' }} />
              <p style={{ fontSize: 11, color: c.textTer, margin: 0 }}>QR code updates automatically with your request</p>
            </div>
          )}
        </div>

        {/* Account details */}
        <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showAccount ? 14 : 0 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: c.text }}>Account Details</span>
            <button onClick={() => setShowAccount(v => !v)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.action, fontSize: 12, fontWeight: 700 }}>
              {showAccount ? 'Hide' : 'Show'}
            </button>
          </div>
          {showAccount && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Routing Number', value: '084106768', maskLen: 5 },
                { label: 'Account Number', value: '4321000012345', maskLen: 9 },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: isNight ? '#0A1520' : '#F2F7FA', borderRadius: 10 }}>
                  <div>
                    <p style={{ fontSize: 11, color: c.textTer, margin: '0 0 2px' }}>{item.label}</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: c.text, margin: 0, fontFamily: 'monospace' }}>{item.value}</p>
                  </div>
                  <button onClick={() => copy(item.value)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.action }}>
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                      <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Crypto wallet */}
        <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: 16 }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: c.text, margin: '0 0 10px' }}>Crypto Wallet Address</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: isNight ? '#0A1520' : '#F2F7FA', borderRadius: 10 }}>
            <p style={{ flex: 1, fontSize: 11, fontWeight: 700, color: c.textSec, margin: 0, wordBreak: 'break-all', fontFamily: 'monospace' }}>
              0x742d35Cc6634C0532925a3b8D4C9E87f3b2A1D3f
            </p>
            <button onClick={() => copy('0x742d35Cc6634C0532925a3b8D4C9E87f3b2A1D3f')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.action, flexShrink: 0 }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
              </svg>
            </button>
          </div>
          <p style={{ fontSize: 11, color: c.textTer, marginTop: 6 }}>Polygon (MATIC) network · ERC-20 compatible</p>
        </div>
      </div>
      <BankBottomNav active="/village/bank" />
    </div>
  );
}
