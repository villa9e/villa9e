'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { BankBottomNav } from '@/components/bank/BankBottomNav';

const B = {
  day:   { bg:'#F2F7FA', card:'#FFFFFF', border:'#C8DCE8', text:'#0A1F2E', textSec:'#3A5A6E', textTer:'#7A9AAE', action:'#0A5F8A' },
  night: { bg:'#060F18', card:'#0E1E2E', border:'#1A3040', text:'#EEF4F8', textSec:'#8EB4CC', textTer:'#4A7A96', action:'#2A9FCC' },
};

const CATEGORY_ICONS: Record<string,string> = {
  Income:        'M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
  Food:          'M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z',
  Transport:     'M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v9a2 2 0 01-2 2h-2',
  Shopping:      'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18',
  Transfer:      'M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4',
  Investment:    'M23 6l-9.5 9.5-5-5L1 18',
  Health:        'M22 12h-4l-3 9L9 3l-3 9H2',
  Other:         'M12 2a10 10 0 110 20A10 10 0 0112 2z',
};

const ACCOUNT_COLORS: Record<string,string> = {
  checking: '#0A5F8A', savings: '#1D9E75', investment: '#534AB7', credit: '#D63B3B',
};

export default function BankHome() {
  const { theme } = useVillageTheme();
  const c = theme === 'night' ? B.night : B.day;

  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [accountsRes, txnsRes, insightRes] = await Promise.allSettled([
        fetch('/api/bank/accounts').then(r => r.json()),
        fetch('/api/bank/transactions?limit=10').then(r => r.json()),
        fetch('/api/bank/advisor/opening').then(r => r.json()),
      ]);

      if (accountsRes.status === 'fulfilled') setAccounts(accountsRes.value.accounts ?? []);
      if (txnsRes.status === 'fulfilled') setTransactions(txnsRes.value.transactions ?? []);
      if (insightRes.status === 'fulfilled') setAiInsight(insightRes.value.message ?? null);
      setLoading(false);
    })();
  }, []);

  const totalBalance = accounts.reduce((s, a) => s + (a.balance ?? 0), 0);
  const available = accounts.filter(a => a.account_type !== 'credit').reduce((s, a) => s + (a.available_balance ?? 0), 0);
  const pending = totalBalance - available;

  function fmtCurrency(n: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  }

  function fmtDate(iso: string) {
    const d = new Date(iso);
    const today = new Date();
    const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  return (
    <div style={{ minHeight:'100vh', background:c.bg, paddingBottom:80 }}>
      {/* Header */}
      <div style={{ position:'sticky', top:0, zIndex:20, display:'flex', alignItems:'center', padding:'14px 16px', background:c.card, borderBottom:`1px solid ${c.border}` }}>
        <p style={{ flex:1, fontSize:18, fontWeight:900, color:c.text }}>Bank</p>
        <Link href="/village/bank/advisor" style={{ display:'flex', alignItems:'center', justifyContent:'center', width:36, height:36, borderRadius:18, background:`${c.action}15`, textDecoration:'none' }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={c.action} strokeWidth={2} strokeLinecap="round"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
        </Link>
      </div>

      <div style={{ padding:'16px' }}>
        {/* Total balance card */}
        <div style={{ background:'#0A5F8A', borderRadius:20, padding:20, marginBottom:16 }}>
          <p style={{ fontSize:11, color:'rgba(255,255,255,0.6)', letterSpacing:'0.06em', marginBottom:6 }}>TOTAL BALANCE</p>
          {loading ? (
            <div style={{ width:160, height:36, borderRadius:8, background:'rgba(255,255,255,0.1)', marginBottom:8 }} />
          ) : (
            <p style={{ fontSize:32, fontWeight:900, color:'#fff', marginBottom:6 }}>{fmtCurrency(totalBalance)}</p>
          )}
          <p style={{ fontSize:12, color:'rgba(255,255,255,0.65)' }}>Available {fmtCurrency(available)} · Pending {fmtCurrency(Math.abs(pending))}</p>

          {/* Account pills */}
          <div style={{ display:'flex', gap:6, marginTop:14, flexWrap:'wrap' }}>
            {accounts.map(a => (
              <span key={a.id} style={{ background:'rgba(255,255,255,0.15)', borderRadius:20, padding:'4px 10px', fontSize:11, color:'#fff', fontWeight:700, textTransform:'capitalize' }}>
                {a.account_name?.split(' ')[1] ?? a.account_type} {fmtCurrency(a.balance)}
              </span>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:8, marginBottom:16 }}>
          {[
            { label:'Send', icon:'M5 12h14M12 5l7 7-7 7', href:'/village/bank/move' },
            { label:'Receive', icon:'M19 12H5M12 19l-7-7 7-7', href:'/village/bank/receive' },
            { label:'Invest', icon:'M23 6l-9.5 9.5-5-5L1 18', href:'/village/bank/invest' },
            { label:'More', icon:'M5 12h.01M12 12h.01M19 12h.01', href:'/village/bank/more' },
          ].map(btn => (
            <Link key={btn.label} href={btn.href} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, background:c.card, border:`1px solid ${c.border}`, borderRadius:14, padding:'14px 0', textDecoration:'none' }}>
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={c.action} strokeWidth={2} strokeLinecap="round"><path d={btn.icon}/></svg>
              <span style={{ fontSize:11, fontWeight:700, color:c.text }}>{btn.label}</span>
            </Link>
          ))}
        </div>

        {/* AI Insight */}
        {aiInsight && (
          <Link href="/village/bank/advisor" style={{ display:'block', textDecoration:'none', background:'#EAF3DE', border:'1px solid #639922', borderRadius:14, padding:14, marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="#27500A"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
              <span style={{ fontSize:10, fontWeight:900, color:'#27500A', letterSpacing:'0.06em' }}>AI INSIGHT</span>
            </div>
            <p style={{ fontSize:13, color:'#27500A', lineHeight:1.5, margin:0 }}>{aiInsight}</p>
            <p style={{ fontSize:11, color:'#639922', fontWeight:700, marginTop:6 }}>Ask more →</p>
          </Link>
        )}

        {/* Accounts list */}
        <p style={{ fontSize:10, fontWeight:900, color:c.textTer, letterSpacing:'0.06em', marginBottom:10 }}>ACCOUNTS</p>
        <div style={{ background:c.card, border:`1px solid ${c.border}`, borderRadius:14, overflow:'hidden', marginBottom:16 }}>
          {loading ? (
            <div style={{ padding:16, color:c.textTer, fontSize:13 }}>Loading accounts…</div>
          ) : accounts.length === 0 ? (
            <div style={{ padding:16, color:c.textTer, fontSize:13 }}>No accounts yet.</div>
          ) : accounts.map((a, i) => (
            <div key={a.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', borderBottom: i < accounts.length-1 ? `1px solid ${c.border}` : 'none' }}>
              <div style={{ width:40, height:40, borderRadius:20, background:`${ACCOUNT_COLORS[a.account_type] ?? '#0A5F8A'}20`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={ACCOUNT_COLORS[a.account_type] ?? '#0A5F8A'} strokeWidth={2} strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              </div>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:13, fontWeight:700, color:c.text, margin:0 }}>{a.account_name}</p>
                <p style={{ fontSize:11, color:c.textTer, margin:0 }}>••••{a.account_number?.slice(-4) ?? '0000'} · FDIC insured via Unit</p>
              </div>
              <div style={{ textAlign:'right' }}>
                <p style={{ fontSize:14, fontWeight:700, color: a.balance < 0 ? '#A32D2D' : '#0F6E56', margin:0 }}>{fmtCurrency(a.balance)}</p>
                <p style={{ fontSize:10, color:c.textTer, margin:0 }}>Available {fmtCurrency(a.available_balance)}</p>
              </div>
            </div>
          ))}
          <Link href="/village/bank/move" style={{ display:'block', padding:'12px 16px', borderTop:`1px solid ${c.border}`, color:c.action, fontSize:12, fontWeight:700, textDecoration:'none', textAlign:'center' }}>
            + Connect a bank or card
          </Link>
        </div>

        {/* Recent transactions */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
          <p style={{ fontSize:10, fontWeight:900, color:c.textTer, letterSpacing:'0.06em', margin:0 }}>RECENT TRANSACTIONS</p>
          <Link href="/village/bank/statements" style={{ fontSize:11, color:c.action, fontWeight:700, textDecoration:'none' }}>View all</Link>
        </div>
        <div style={{ background:c.card, border:`1px solid ${c.border}`, borderRadius:14, overflow:'hidden', marginBottom:16 }}>
          {loading ? (
            <div style={{ padding:16, color:c.textTer, fontSize:13 }}>Loading transactions…</div>
          ) : transactions.length === 0 ? (
            <div style={{ padding:16, color:c.textTer, fontSize:13, textAlign:'center' }}>
              <p style={{ margin:'0 0 6px', fontSize:24 }}>💳</p>
              <p style={{ margin:0 }}>No transactions yet. Send or receive money to get started.</p>
            </div>
          ) : transactions.slice(0, 8).map((tx, i) => (
            <div key={tx.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderBottom: i < Math.min(7, transactions.length-1) ? `1px solid ${c.border}` : 'none' }}>
              <div style={{ width:36, height:36, borderRadius:18, background:`${c.action}15`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={c.action} strokeWidth={2} strokeLinecap="round">
                  <path d={CATEGORY_ICONS[tx.category] ?? CATEGORY_ICONS.Other}/>
                </svg>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:13, fontWeight:600, color:c.text, margin:0, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>{tx.merchant_name ?? tx.description ?? 'Transaction'}</p>
                <p style={{ fontSize:11, color:c.textTer, margin:0 }}>{tx.category} · {fmtDate(tx.created_at)}</p>
              </div>
              <p style={{ fontSize:13, fontWeight:700, color: tx.direction === 'credit' ? '#0F6E56' : '#A32D2D', margin:0, flexShrink:0 }}>
                {tx.direction === 'credit' ? '+' : '-'}{fmtCurrency(Math.abs(tx.amount))}
              </p>
            </div>
          ))}
        </div>
      </div>

      <BankBottomNav active="/village/bank" />
    </div>
  );
}
