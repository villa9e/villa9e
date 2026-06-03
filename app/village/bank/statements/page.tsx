'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { BankBottomNav } from '@/components/bank/BankBottomNav';

const B = {
  day:   { bg:'#F2F7FA', card:'#FFFFFF', border:'#C8DCE8', text:'#0A1F2E', textSec:'#3A5A6E', textTer:'#7A9AAE', action:'#0A5F8A' },
  night: { bg:'#060F18', card:'#0E1E2E', border:'#1A3040', text:'#EEF4F8', textSec:'#8EB4CC', textTer:'#4A7A96', action:'#2A9FCC' },
};

const MONTHS = [
  { id: 'may-26',  label: 'May 2026',       income: 5700.00, spending: 3241.49, balance: 12487.32 },
  { id: 'apr-26',  label: 'April 2026',     income: 5700.00, spending: 3580.12, balance: 10028.81 },
  { id: 'mar-26',  label: 'March 2026',     income: 5700.00, spending: 3124.77, balance: 7908.93 },
  { id: 'feb-26',  label: 'February 2026',  income: 5700.00, spending: 2980.34, balance: 5333.70 },
  { id: 'jan-26',  label: 'January 2026',   income: 5700.00, spending: 3410.55, balance: 2614.04 },
  { id: 'dec-25',  label: 'December 2025',  income: 6100.00, spending: 4210.88, balance: 324.59 },
  { id: 'nov-25',  label: 'November 2025',  income: 5700.00, spending: 3890.00, balance: -1564.53 },
  { id: 'oct-25',  label: 'October 2025',   income: 5700.00, spending: 3200.12, balance: -2374.53 },
  { id: 'sep-25',  label: 'September 2025', income: 5700.00, spending: 3540.00, balance: -4074.65 },
  { id: 'aug-25',  label: 'August 2025',    income: 5700.00, spending: 2990.45, balance: -5314.65 },
  { id: 'jul-25',  label: 'July 2025',      income: 5700.00, spending: 3750.20, balance: -8025.10 },
  { id: 'jun-25',  label: 'June 2025',      income: 5700.00, spending: 3100.00, balance: -9974.90 },
];

const ANNUAL = [
  { year: '2025', income: 68400, spending: 41187, net: 27213 },
  { year: '2024', income: 62000, spending: 38450, net: 23550 },
];

const TAX_DOCS = [
  { id: '1099-int-25',  type: '1099-INT',  label: '1099-INT 2025',  desc: 'Interest income — Village Bank Savings' },
  { id: '1099-misc-25', type: '1099-MISC', label: '1099-MISC 2025', desc: 'Miscellaneous income — referral bonuses' },
  { id: '1099-b-25',    type: '1099-B',    label: '1099-B 2025',    desc: 'Proceeds from broker transactions — Alpaca' },
];

function downloadCSV(months: typeof MONTHS) {
  const header = 'Month,Income,Spending,Ending Balance\n';
  const rows = months.map(m => `${m.label},${m.income},${m.spending},${m.balance}`).join('\n');
  const blob = new Blob([header + rows], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'village-bank-statements.csv';
  a.click();
}

export default function StatementsPage() {
  const router = useRouter();
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';
  const c = isNight ? B.night : B.day;
  const [activeTab, setActiveTab] = useState<'monthly' | 'annual' | 'tax'>('monthly');

  function downloadPDF(month: string) {
    const content = `VILLAGE BANK — Monthly Statement\n${month}\n\nThis is a statement summary for your Village Bank account.\nFor full transaction history, please log into your Village Bank account.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `village-bank-${month.replace(/\s/g, '-').toLowerCase()}.txt`;
    a.click();
  }

  return (
    <div style={{ background: c.bg, minHeight: '100vh', maxWidth: 480, margin: '0 auto', paddingBottom: 88 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px 12px', background: c.card, borderBottom: `1px solid ${c.border}` }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.textSec, display: 'flex', padding: 4 }}>
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <h1 style={{ fontWeight: 800, fontSize: 18, color: c.text, letterSpacing: -0.5, margin: 0 }}>Statements & Tax Docs</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${c.border}`, background: c.card }}>
        {(['monthly', 'annual', 'tax'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ flex: 1, padding: '12px 0', background: 'none', border: 'none', borderBottom: activeTab === tab ? `2px solid ${c.action}` : '2px solid transparent', color: activeTab === tab ? c.action : c.textTer, fontWeight: 700, fontSize: 13, cursor: 'pointer', textTransform: 'capitalize' }}>
            {tab === 'tax' ? 'Tax Docs' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        {activeTab === 'monthly' && (
          <>
            {/* Export CSV */}
            <button onClick={() => downloadCSV(MONTHS)}
              style={{ width: '100%', padding: '12px 0', borderRadius: 12, border: `1px solid ${c.action}`, background: 'transparent', color: c.action, fontWeight: 700, fontSize: 14, cursor: 'pointer', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
              </svg>
              Export All (CSV) — TurboTax compatible
            </button>

            <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, overflow: 'hidden' }}>
              {MONTHS.map((m, i) => (
                <div key={m.id} style={{ padding: '14px 16px', borderBottom: i < MONTHS.length - 1 ? `1px solid ${c.border}` : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: c.text, margin: 0 }}>{m.label}</p>
                    <button onClick={() => downloadPDF(m.label)}
                      style={{ background: 'none', border: `1px solid ${c.action}`, color: c.action, borderRadius: 20, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                      </svg>
                      PDF
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div>
                      <p style={{ fontSize: 10, color: c.textTer, margin: '0 0 1px' }}>Income</p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#0F6E56', margin: 0 }}>+${m.income.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 10, color: c.textTer, margin: '0 0 1px' }}>Spending</p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#A32D2D', margin: 0 }}>-${m.spending.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 10, color: c.textTer, margin: '0 0 1px' }}>Ending Balance</p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: m.balance >= 0 ? c.text : '#A32D2D', margin: 0 }}>${m.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'annual' && (
          <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, overflow: 'hidden' }}>
            {ANNUAL.map((yr, i) => (
              <div key={yr.year} style={{ padding: '16px', borderBottom: i < ANNUAL.length - 1 ? `1px solid ${c.border}` : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <p style={{ fontSize: 16, fontWeight: 800, color: c.text, margin: 0 }}>{yr.year} Summary</p>
                  <button onClick={() => downloadPDF(`Annual ${yr.year}`)}
                    style={{ background: 'none', border: `1px solid ${c.action}`, color: c.action, borderRadius: 20, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>PDF</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {[
                    { label: 'Total Income', value: `$${yr.income.toLocaleString()}`, color: '#0F6E56' },
                    { label: 'Total Spending', value: `$${yr.spending.toLocaleString()}`, color: '#A32D2D' },
                    { label: 'Net Savings', value: `$${yr.net.toLocaleString()}`, color: c.action },
                  ].map(stat => (
                    <div key={stat.label} style={{ padding: '10px', background: isNight ? '#0A1520' : '#F2F7FA', borderRadius: 10, textAlign: 'center' }}>
                      <p style={{ fontSize: 10, color: c.textTer, margin: '0 0 3px' }}>{stat.label}</p>
                      <p style={{ fontSize: 14, fontWeight: 800, color: stat.color, margin: 0 }}>{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'tax' && (
          <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${c.border}`, background: isNight ? '#0A1520' : '#EDF4F8' }}>
              <p style={{ fontSize: 12, color: c.textSec, margin: 0, lineHeight: 1.5 }}>
                Tax documents are available by Jan 31 each year. Export as CSV for TurboTax, H&amp;R Block, or your accountant.
              </p>
            </div>
            {TAX_DOCS.map((doc, i) => (
              <div key={doc.id} style={{ padding: '14px 16px', borderBottom: i < TAX_DOCS.length - 1 ? `1px solid ${c.border}` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: c.action, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#fff', fontSize: 9, fontWeight: 800 }}>{doc.type}</span>
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: c.text, margin: 0 }}>{doc.label}</p>
                    <p style={{ fontSize: 11, color: c.textTer, margin: 0 }}>{doc.desc}</p>
                  </div>
                </div>
                <button onClick={() => downloadPDF(doc.label)}
                  style={{ background: 'none', border: `1px solid ${c.action}`, color: c.action, borderRadius: 20, padding: '5px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                  Download
                </button>
              </div>
            ))}
            <div style={{ padding: '12px 16px' }}>
              <button onClick={() => downloadCSV(MONTHS)}
                style={{ width: '100%', padding: '12px 0', borderRadius: 12, background: c.action, border: 'none', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                </svg>
                Export All (CSV) — TurboTax Ready
              </button>
            </div>
          </div>
        )}
      </div>
      <BankBottomNav active="/village/bank" />
    </div>
  );
}
