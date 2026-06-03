'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { BankBottomNav } from '@/components/bank/BankBottomNav';

const B = {
  day:   { bg:'#F2F7FA', card:'#FFFFFF', border:'#C8DCE8', text:'#0A1F2E', textSec:'#3A5A6E', textTer:'#7A9AAE', action:'#0A5F8A' },
  night: { bg:'#060F18', card:'#0E1E2E', border:'#1A3040', text:'#EEF4F8', textSec:'#8EB4CC', textTer:'#4A7A96', action:'#2A9FCC' },
};

const PAGES = [
  {
    group: 'Money Movement',
    items: [
      { href: '/village/bank/receive',        label: 'Receive Money',    desc: 'QR code, account details, crypto wallet', d: 'M12 2v20M2 12l10-10 10 10' },
      { href: '/village/bank/direct-deposit', label: 'Direct Deposit',   desc: 'Set up payroll direct deposit',           d: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3' },
      { href: '/village/bank/move',           label: 'Send & Move',      desc: 'Transfer money, pay people',              d: 'M5 12h14M12 5l7 7-7 7' },
    ],
  },
  {
    group: 'Documents',
    items: [
      { href: '/village/bank/statements',      label: 'Statements',         desc: 'Monthly statements, tax docs, CSV export', d: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8' },
      { href: '/village/bank/financial-profile',label: 'Financial Profile',  desc: 'Credentials, fund performance, deal history', d: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z' },
    ],
  },
  {
    group: 'Advisory',
    items: [
      { href: '/village/bank/advisor',         label: 'AI Advisor',          desc: 'Chat with your AI financial advisor', d: 'M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z' },
    ],
  },
  {
    group: 'Investing',
    items: [
      { href: '/village/bank/invest',       label: 'Invest',         desc: 'Stocks, ETFs via Alpaca',          d: 'M23 6l-9.5 9.5-5-5L1 18' },
      { href: '/village/bank/village-fund', label: 'Village Fund',   desc: 'Community investment fund',        d: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z' },
      { href: '/village/bank/crowdfunding', label: 'Crowdfunding',   desc: 'Back projects in the village',     d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14v-4m0-4h.01' },
      { href: '/village/bank/blockchain',   label: 'Blockchain',     desc: '$VLG token, NFTs, smart contracts', d: 'M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01' },
    ],
  },
];

export default function BankMorePage() {
  const router = useRouter();
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';
  const c = isNight ? B.night : B.day;

  return (
    <div style={{ background: c.bg, minHeight: '100vh', maxWidth: 480, margin: '0 auto', paddingBottom: 88 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px 12px', background: c.card, borderBottom: `1px solid ${c.border}` }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.textSec, display: 'flex', padding: 4 }}>
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <h1 style={{ fontWeight: 800, fontSize: 18, color: c.text, letterSpacing: -0.5, margin: 0 }}>Village Bank — All Pages</h1>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        {PAGES.map(group => (
          <div key={group.group} style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: c.textTer, letterSpacing: 0.8, textTransform: 'uppercase', margin: '0 0 8px 4px' }}>{group.group}</p>
            <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, overflow: 'hidden' }}>
              {group.items.map((item, i) => (
                <Link key={item.href} href={item.href} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderBottom: i < group.items.length - 1 ? `1px solid ${c.border}` : 'none' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: isNight ? '#1A3040' : '#E8F3FA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={c.action} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d={item.d}/>
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: c.text, margin: 0 }}>{item.label}</p>
                    <p style={{ fontSize: 12, color: c.textTer, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.desc}</p>
                  </div>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={c.textTer} strokeWidth={2} strokeLinecap="round">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <BankBottomNav active="/village/bank/more" />
    </div>
  );
}
