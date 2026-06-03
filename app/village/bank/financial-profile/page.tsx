'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { BankBottomNav } from '@/components/bank/BankBottomNav';
import { createClient } from '@/lib/supabase/client';

const B = {
  day:   { bg:'#F2F7FA', card:'#FFFFFF', border:'#C8DCE8', text:'#0A1F2E', textSec:'#3A5A6E', textTer:'#7A9AAE', action:'#0A5F8A' },
  night: { bg:'#060F18', card:'#0E1E2E', border:'#1A3040', text:'#EEF4F8', textSec:'#8EB4CC', textTer:'#4A7A96', action:'#2A9FCC' },
};

type CredStatus = 'verified' | 'pending' | 'none';

interface Credential {
  id: string;
  label: string;
  description: string;
  status: CredStatus;
  finraLink?: string;
}

const CREDENTIALS: Credential[] = [
  { id: 'cfa',      label: 'CFA',       description: 'Chartered Financial Analyst',          status: 'none' },
  { id: 'cfp',      label: 'CFP',       description: 'Certified Financial Planner',           status: 'pending' },
  { id: 'cpa',      label: 'CPA',       description: 'Certified Public Accountant',           status: 'none' },
  { id: 'series7',  label: 'Series 7',  description: 'General Securities Representative',     status: 'verified', finraLink: 'https://brokercheck.finra.org/' },
  { id: 'series63', label: 'Series 63', description: 'Uniform Securities Agent State Law',    status: 'none' },
  { id: 'series65', label: 'Series 65', description: 'Uniform Investment Adviser Law Exam',   status: 'none' },
];

const FUND_PERFORMANCE = [
  { name: 'Village Growth Fund',   ytd: '+18.4%', since: '+42.1%', aum: '$2.1M',  status: 'Active' },
  { name: 'Village Income Fund',   ytd: '+6.2%',  since: '+14.8%', aum: '$840K',  status: 'Active' },
  { name: 'Village Seed Syndicate',ytd: '+28.3%', since: '+28.3%', aum: '$420K',  status: 'Active' },
];

const DEAL_HISTORY = [
  { name: 'Acme Tech Pre-Seed',   role: 'Lead',        amount: '$25K',  return: '+340%', date: '2024' },
  { name: 'GreenPath Series A',   role: 'Co-investor', amount: '$10K',  return: '+85%',  date: '2025' },
  { name: 'NovaMed Seed',         role: 'Advisor',     amount: '$5K',   return: 'Pending',date: '2025' },
];

function StatusBadge({ status }: { status: CredStatus }) {
  const styles: Record<CredStatus, { bg: string; color: string; label: string }> = {
    verified: { bg: 'rgba(13,148,136,0.1)', color: '#0D9488', label: 'Verified' },
    pending:  { bg: 'rgba(217,119,6,0.1)',  color: '#D97706', label: 'Pending AI review' },
    none:     { bg: 'rgba(107,114,128,0.1)',color: '#6B7280', label: 'Not added' },
  };
  const s = styles[status];
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
      {status === 'verified' && '✓ '}{s.label}
    </span>
  );
}

export default function FinancialProfilePage() {
  const router = useRouter();
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';
  const c = isNight ? B.night : B.day;
  const [profile, setProfile] = useState<any>(null);
  const [creds, setCreds]     = useState<Credential[]>(CREDENTIALS);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await (supabase as any).from('profiles').select('id, username, display_name, avatar_url, bio').eq('id', user.id).single();
      setProfile(data);
    });
  }, []);

  function addCredential(id: string) {
    setCreds(prev => prev.map(cr => cr.id === id ? { ...cr, status: 'pending' } : cr));
  }

  const displayName = profile?.display_name || profile?.username || 'Villager';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div style={{ background: c.bg, minHeight: '100vh', maxWidth: 480, margin: '0 auto', paddingBottom: 88 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px 12px', background: c.card, borderBottom: `1px solid ${c.border}` }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.textSec, display: 'flex', padding: 4 }}>
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <h1 style={{ fontWeight: 800, fontSize: 18, color: c.text, letterSpacing: -0.5, margin: 0 }}>Financial Profile</h1>
      </div>

      {/* Banner + Avatar */}
      <div style={{ position: 'relative', marginBottom: 48 }}>
        <div style={{ height: 100, background: 'linear-gradient(135deg, #0A5F8A 0%, #1D9E75 100%)' }} />
        <div style={{ position: 'absolute', bottom: -40, left: 20, width: 80, height: 80, borderRadius: 40, border: `4px solid ${c.card}`, overflow: 'hidden', background: c.action }}>
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 24 }}>{initials}</div>
          )}
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        <p style={{ fontSize: 20, fontWeight: 800, color: c.text, margin: '0 0 2px' }}>{displayName}</p>
        {profile?.username && <p style={{ fontSize: 13, color: c.textTer, margin: '0 0 16px' }}>@{profile.username}</p>}
        {profile?.bio && <p style={{ fontSize: 13, color: c.textSec, margin: '0 0 20px', lineHeight: 1.6 }}>{profile.bio}</p>}

        {/* Credentials */}
        <p style={{ fontWeight: 800, fontSize: 15, color: c.text, margin: '0 0 12px' }}>Professional Credentials</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {creds.map(cr => (
            <div key={cr.id} style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: cr.status === 'verified' ? 'rgba(13,148,136,0.12)' : cr.status === 'pending' ? 'rgba(217,119,6,0.1)' : (isNight ? '#1A3040' : '#E8F3FA'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontWeight: 800, fontSize: 11, color: cr.status === 'verified' ? '#0D9488' : cr.status === 'pending' ? '#D97706' : c.action }}>{cr.label}</span>
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: c.text, margin: 0 }}>{cr.label}</p>
                  <p style={{ fontSize: 11, color: c.textTer, margin: 0 }}>{cr.description}</p>
                  {cr.finraLink && cr.status === 'verified' && (
                    <Link href={cr.finraLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: c.action, fontWeight: 600 }}>FINRA BrokerCheck →</Link>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <StatusBadge status={cr.status} />
                {cr.status === 'none' && (
                  <button onClick={() => addCredential(cr.id)}
                    style={{ background: 'none', border: `1px solid ${c.action}`, color: c.action, borderRadius: 20, padding: '3px 8px', fontSize: 10, fontWeight: 700, cursor: 'pointer', marginTop: 4 }}>
                    Add
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Fund performance */}
        <p style={{ fontWeight: 800, fontSize: 15, color: c.text, margin: '0 0 12px' }}>Village Fund Performance</p>
        <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, overflow: 'hidden', marginBottom: 24 }}>
          {FUND_PERFORMANCE.map((fund, i) => (
            <div key={fund.name} style={{ padding: '14px 16px', borderBottom: i < FUND_PERFORMANCE.length - 1 ? `1px solid ${c.border}` : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: c.text, margin: 0 }}>{fund.name}</p>
                  <p style={{ fontSize: 11, color: c.textTer, margin: 0 }}>AUM {fund.aum} · {fund.status}</p>
                </div>
                <span style={{ background: 'rgba(13,148,136,0.1)', color: '#0D9488', borderRadius: 20, padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>{fund.status}</span>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div>
                  <p style={{ fontSize: 10, color: c.textTer, margin: '0 0 1px' }}>YTD Return</p>
                  <p style={{ fontSize: 14, fontWeight: 800, color: '#0F6E56', margin: 0 }}>{fund.ytd}</p>
                </div>
                <div>
                  <p style={{ fontSize: 10, color: c.textTer, margin: '0 0 1px' }}>Since Inception</p>
                  <p style={{ fontSize: 14, fontWeight: 800, color: '#0F6E56', margin: 0 }}>{fund.since}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Deal history */}
        <p style={{ fontWeight: 800, fontSize: 15, color: c.text, margin: '0 0 12px' }}>Deal History</p>
        <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, overflow: 'hidden', marginBottom: 20 }}>
          {DEAL_HISTORY.map((deal, i) => (
            <div key={deal.name} style={{ padding: '12px 16px', borderBottom: i < DEAL_HISTORY.length - 1 ? `1px solid ${c.border}` : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: c.text, margin: 0 }}>{deal.name}</p>
                <p style={{ fontSize: 11, color: c.textTer, margin: 0 }}>{deal.date} · {deal.role} · {deal.amount}</p>
              </div>
              <span style={{ fontWeight: 800, fontSize: 13, color: deal.return === 'Pending' ? c.textTer : '#0F6E56' }}>{deal.return}</span>
            </div>
          ))}
        </div>

        {/* Market store shortcut */}
        <Link href="/village/trading-post/market" style={{ textDecoration: 'none' }}>
          <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: 16, display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: isNight ? '#1A3040' : '#E8F3FA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={c.action} strokeWidth={2} strokeLinecap="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/>
              </svg>
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: c.text, margin: 0 }}>Market eStore</p>
              <p style={{ fontSize: 12, color: c.textTer, margin: 0 }}>Manage your Village Market storefront</p>
            </div>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={c.textTer} strokeWidth={2} strokeLinecap="round" style={{ marginLeft: 'auto' }}><path d="M9 18l6-6-6-6"/></svg>
          </div>
        </Link>
      </div>

      <BankBottomNav active="/village/bank" />
    </div>
  );
}
