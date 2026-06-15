'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { PavilionNav } from '@/components/pavilion/PavilionNav';

const TABS = ['Videos', 'Live events', 'About'] as const;
type ChannelTab = typeof TABS[number];

type Video = { id: string; title: string; duration: string; views: number; color: string };
type LiveEvent = { id: string; title: string; type: string; status: string; starts_at: string | null; attendee_count: number };
type Profile = { name: string; handle: string; bio: string; avatar_url: string | null; created_at: string; color: string };

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

function formatJoined(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default function CreatorChannelPage({ params }: { params: { handle: string } }) {
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';
  const [activeTab, setActiveTab] = useState<ChannelTab>('Videos');
  const [subscribed, setSubscribed] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const bg     = isNight ? '#080E24' : '#F0EFF8';
  const cardBg = isNight ? '#1A1830' : '#FFFFFF';
  const border = isNight ? '#2A2845' : '#DDD9F5';
  const text   = isNight ? '#E8E3F8' : '#1E1B4B';
  const muted  = isNight ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';

  const handle = params.handle;

  useEffect(() => {
    fetch(`/api/pavilion/creators/${encodeURIComponent(handle)}`).then(r => r.json()).then(d => {
      setProfile(d.profile ?? null);
      setVideos(d.videos ?? []);
      setLiveEvents(d.liveEvents ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [handle]);

  const displayName = profile?.name || (handle.charAt(0).toUpperCase() + handle.slice(1).replace('_', ' '));
  const avatarColor = profile?.color || '#2952E8';

  return (
    <div style={{ minHeight: '100vh', background: bg, paddingBottom: 80 }}>
      {/* Back */}
      <div style={{ position: 'sticky', top: 0, zIndex: 30, background: isNight ? 'rgba(8,14,36,0.96)' : 'rgba(240,239,248,0.96)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${border}`, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/village/pavilion/creators" style={{ display: 'flex', alignItems: 'center', color: text, textDecoration: 'none' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </Link>
        <span style={{ flex: 1, fontSize: 16, fontWeight: 900, color: text }}>@{handle}</span>
      </div>

      {/* Banner */}
      <div style={{ height: 140, background: `linear-gradient(135deg, ${avatarColor}35, #7C3AED18)`, position: 'relative' }}>
        {/* Avatar */}
        <div style={{ position: 'absolute', bottom: -36, left: 20, width: 72, height: 72, borderRadius: '50%', background: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `4px solid ${bg}`, color: '#fff', fontWeight: 900, fontSize: 22 }}>
          {displayName.charAt(0).toUpperCase()}
        </div>
      </div>

      {/* Profile info */}
      <div style={{ padding: '44px 16px 16px', borderBottom: `1px solid ${border}` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontWeight: 900, fontSize: 18, color: text, marginBottom: 2 }}>{displayName}</p>
            <p style={{ fontSize: 13, color: muted, marginBottom: 6 }}>@{handle}</p>
            <div style={{ display: 'flex', gap: 16 }}>
              <span style={{ fontSize: 13, color: text }}><strong>{videos.length}</strong> <span style={{ color: muted }}>{videos.length === 1 ? 'video' : 'videos'}</span></span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setSubscribed(v => !v)}
              style={{ padding: '10px 18px', borderRadius: 20, background: subscribed ? (isNight ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)') : '#2952E8', color: subscribed ? text : '#fff', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 13 }}
            >
              {subscribed ? 'Subscribed' : 'Subscribe'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${border}`, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{ flexShrink: 0, padding: '12px 18px', fontSize: 13, fontWeight: 700, color: activeTab === tab ? '#2952E8' : muted, background: 'transparent', border: 'none', borderBottom: activeTab === tab ? '2px solid #2952E8' : '2px solid transparent', cursor: 'pointer' }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ padding: '16px' }}>
        {activeTab === 'Videos' && (
          videos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: muted }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" style={{ margin: '0 auto 12px', display: 'block' }}><circle cx="12" cy="12" r="10"/><polygon points="10,8 16,12 10,16"/></svg>
              <p style={{ fontSize: 14 }}>{loading ? 'Loading…' : 'No videos yet'}</p>
            </div>
          ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {videos.map((v, i) => (
              <motion.div key={v.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link href={`/village/pavilion/watch/${v.id}`} style={{ display: 'flex', gap: 12, textDecoration: 'none' }}>
                  <div style={{ width: 120, height: 72, borderRadius: 12, background: `linear-gradient(135deg, ${v.color}35, ${v.color}15)`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={v.color} strokeWidth={1.5} strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polygon points="10,8 16,12 10,16"/></svg>
                    {v.duration && (
                      <div style={{ position: 'absolute', bottom: 5, right: 7, background: 'rgba(0,0,0,0.6)', borderRadius: 6, padding: '1px 6px' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{v.duration}</span>
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, paddingTop: 2 }}>
                    <p style={{ fontSize: 14, fontWeight: 800, color: text, lineHeight: 1.3, marginBottom: 4 }}>{v.title}</p>
                    <p style={{ fontSize: 12, color: muted }}>{fmt(v.views)} views</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
          )
        )}

        {activeTab === 'Live events' && (
          liveEvents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: muted }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" style={{ margin: '0 auto 12px', display: 'block' }}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              <p style={{ fontSize: 14 }}>No upcoming live events</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {liveEvents.map(e => (
                <div key={e.id} style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 14, padding: '12px 14px' }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: text, margin: '0 0 4px' }}>{e.title}</p>
                  <p style={{ fontSize: 11, color: muted, margin: 0 }}>
                    {e.status === 'live' ? `Live now · ${e.attendee_count} watching` : e.starts_at ? new Date(e.starts_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Upcoming'}
                  </p>
                </div>
              ))}
            </div>
          )
        )}

        {activeTab === 'About' && (
          <div style={{ background: cardBg, borderRadius: 16, border: `1px solid ${border}`, padding: '16px' }}>
            <p style={{ fontSize: 14, color: text, lineHeight: 1.6, marginBottom: 16 }}>
              {profile?.bio || 'This creator hasn\'t added a bio yet.'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: muted, fontSize: 13 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
                villa9e.app/@{handle}
              </div>
              {profile?.created_at && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: muted, fontSize: 13 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                  Joined {formatJoined(profile.created_at)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <PavilionNav active="home" />
    </div>
  );
}
