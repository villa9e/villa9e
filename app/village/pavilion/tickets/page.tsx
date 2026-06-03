'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { PavilionNav } from '@/components/pavilion/PavilionNav';

const UPCOMING_TICKETS = [
  { id: 't1', event: 'Village Jazz Night', host: 'jazzvillage', date: new Date(Date.now() + 172800000).toISOString(), price: 25, ticket_no: 'VLG-0421' },
  { id: 't2', event: 'Crypto for Builders', host: 'web3village', date: new Date(Date.now() + 432000000).toISOString(), price: 0, ticket_no: 'VLG-0589' },
];

const PAST_TICKETS = [
  { id: 't3', event: 'Goal GPS Workshop #12', host: 'spiritai', date: new Date(Date.now() - 604800000).toISOString(), price: 0, ticket_no: 'VLG-0314', has_recording: true },
  { id: 't4', event: 'Brand Identity Masterclass', host: 'niajames', date: new Date(Date.now() - 1209600000).toISOString(), price: 0, ticket_no: 'VLG-0210', has_recording: true },
];

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

type TicketsTab = 'upcoming' | 'past';

export default function TicketsPage() {
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';
  const [activeTab, setActiveTab] = useState<TicketsTab>('upcoming');

  const bg     = isNight ? '#080E24' : '#F0EFF8';
  const cardBg = isNight ? '#1A1830' : '#FFFFFF';
  const border = isNight ? '#2A2845' : '#DDD9F5';
  const text   = isNight ? '#E8E3F8' : '#1E1B4B';
  const muted  = isNight ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';

  const tickets = activeTab === 'upcoming' ? UPCOMING_TICKETS : PAST_TICKETS;

  return (
    <div style={{ minHeight: '100vh', background: bg, paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 30, background: isNight ? 'rgba(8,14,36,0.96)' : 'rgba(240,239,248,0.96)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${border}`, padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Link href="/village/pavilion" style={{ display: 'flex', alignItems: 'center', color: text, textDecoration: 'none' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
          </Link>
          <h1 style={{ flex: 1, fontSize: 18, fontWeight: 900, color: text, margin: 0 }}>My Tickets</h1>
        </div>
        {/* Tab toggles */}
        <div style={{ display: 'flex', gap: 0, background: isNight ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderRadius: 12, padding: 3 }}>
          {(['upcoming', 'past'] as TicketsTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ flex: 1, padding: '8px 0', borderRadius: 10, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', background: activeTab === tab ? (isNight ? '#1A1830' : '#FFFFFF') : 'transparent', color: activeTab === tab ? text : muted, textTransform: 'capitalize' }}
            >
              {tab === 'upcoming' ? 'Upcoming' : 'Past events'}
            </button>
          ))}
        </div>
      </div>

      {/* Tickets list */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {tickets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: muted }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" style={{ margin: '0 auto 12px', display: 'block' }}><path d="M2 9a3 3 0 010 6v2a2 2 0 002 2h16a2 2 0 002-2v-2a3 3 0 010-6V7a2 2 0 00-2-2H4a2 2 0 00-2 2v2z"/></svg>
            <p style={{ fontSize: 14 }}>No tickets here yet</p>
            <Link href="/village/pavilion/live" style={{ display: 'inline-block', marginTop: 12, padding: '8px 20px', borderRadius: 20, background: '#2952E8', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
              Browse Events
            </Link>
          </div>
        ) : (
          tickets.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{ borderRadius: 18, overflow: 'hidden', background: cardBg, border: `1px solid ${border}` }}
            >
              {/* Ticket top stripe */}
              <div style={{ height: 6, background: 'linear-gradient(90deg, #2952E8, #7C3AED)' }} />

              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <p style={{ fontWeight: 900, fontSize: 15, color: text, marginBottom: 4, lineHeight: 1.3 }}>{t.event}</p>
                    <p style={{ fontSize: 12, color: muted, marginBottom: 3 }}>@{t.host}</p>
                    <p style={{ fontSize: 12, color: muted }}>{formatDate(t.date)}</p>
                  </div>
                  <div style={{ background: isNight ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderRadius: 10, padding: '6px 12px', textAlign: 'center' }}>
                    <p style={{ fontSize: 10, color: muted, marginBottom: 2 }}>Ticket</p>
                    <p style={{ fontSize: 11, fontWeight: 800, color: text }}>{t.ticket_no}</p>
                  </div>
                </div>

                {/* Action button */}
                {'has_recording' in t && t.has_recording ? (
                  <Link
                    href={`/village/pavilion/watch/${t.id}`}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 0', borderRadius: 20, background: isNight ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)', color: text, fontWeight: 800, fontSize: 13, textDecoration: 'none' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polygon points="10,8 16,12 10,16"/></svg>
                    Watch Recording
                  </Link>
                ) : (
                  <Link
                    href={`/village/pavilion/live/${t.id}`}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 0', borderRadius: 20, background: '#2952E8', color: '#fff', fontWeight: 800, fontSize: 13, textDecoration: 'none' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                    Join Event
                  </Link>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      <PavilionNav active="home" />
    </div>
  );
}
