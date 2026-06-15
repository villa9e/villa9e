'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

function haversineMi(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

const CATEGORIES = ['All','Nearby','Online','Art & Design','Health & Fitness','Food & Beverage','Service','Events','Verified'];

// Dynamic import for Leaflet (must be client-only)
const MerchantMapLeaflet = dynamic(() => import('@/components/merchant/MerchantMapLeaflet'), {
  ssr: false,
  loading: () => (
    <div style={{ flex: 1, background: '#1A1F2E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
        Loading map...
      </div>
    </div>
  ),
});

export default function MerchantMapPage() {
  const isNight = useVillageTheme(s => s.theme) === 'night';
  const supabase = createClient();
  const [merchants, setMerchants] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data: rows } = await (supabase as any)
        .from('merchant_accounts')
        .select('id, business_name, category, location_type, lat, lng, business_hours, is_verified, business_type, city, state')
        .eq('status', 'active')
        .limit(100);

      let userLat: number | null = null;
      let userLng: number | null = null;
      try {
        await new Promise<void>(res => {
          navigator.geolocation.getCurrentPosition(pos => { userLat = pos.coords.latitude; userLng = pos.coords.longitude; res(); }, () => res(), { timeout: 3000 });
        });
      } catch {}

      setMerchants((rows ?? []).map((r: any) => {
        const dist = (userLat && userLng && r.lat && r.lng)
          ? `${haversineMi(userLat, userLng, r.lat, r.lng).toFixed(1)} mi`
          : r.city ? `${r.city}${r.state ? ', ' + r.state : ''}` : null;
        return {
          id: r.id,
          name: r.business_name,
          category: r.category ?? r.business_type ?? 'Other',
          lat: r.lat,
          lng: r.lng,
          distance: dist,
          hours: r.business_hours ?? null,
          verified: r.is_verified,
          type: r.location_type,
          rating: null,
        };
      }));
    })();
  }, []);

  const pageBg = isNight ? '#1A1400' : '#FFFBF2';
  const heroBg = '#412402';
  const cardBg = isNight ? '#221A00' : '#FFFFFF';
  const cardBorder = isNight ? '1px solid #3A2800' : '1px solid #F0D9B0';
  const textPrimary = isNight ? '#F5E6C8' : '#2D1A00';
  const textMuted = isNight ? '#9B7A3A' : '#8B6230';
  const accent = '#EF9F27';
  const btnBg = '#BA7517';

  const filtered = merchants.filter(m => {
    if (activeFilter === 'Verified' && !m.verified) return false;
    if (activeFilter === 'Online' && m.type !== 'online') return false;
    if (activeFilter === 'Nearby') { /* show all in mock */ }
    if (!['All','Nearby','Online','Verified'].includes(activeFilter) && m.category !== activeFilter) return false;
    if (search && !m.name.toLowerCase().includes(search.toLowerCase()) && !m.category.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ minHeight: '100vh', background: pageBg, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: heroBg, padding: '52px 16px 14px', position: 'relative', zIndex: 10 }}>
        <Link href="/village/merchant" style={{
          position: 'absolute', top: 16, left: 16,
          display: 'flex', alignItems: 'center', gap: 6,
          color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 14,
        }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Merchant
        </Link>

        {/* Search bar */}
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search merchants, categories..."
            style={{
              width: '100%', padding: '11px 12px 11px 36px', borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.12)',
              color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Filter strip */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveFilter(cat)} style={{
              padding: '6px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
              background: activeFilter === cat ? accent : 'rgba(255,255,255,0.15)',
              color: activeFilter === cat ? '#412402' : 'rgba(255,255,255,0.8)',
              fontWeight: 700, fontSize: 11, flexShrink: 0,
            }}>
              {cat}
            </button>
          ))}
          {/* View toggle */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 3, flexShrink: 0, background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: 3 }}>
            {(['map','list'] as const).map(m => (
              <button key={m} onClick={() => setViewMode(m)} style={{
                padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                background: viewMode === m ? accent : 'transparent',
                color: viewMode === m ? '#412402' : 'rgba(255,255,255,0.7)',
                fontWeight: 700, fontSize: 11, textTransform: 'capitalize',
              }}>
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Map / List view */}
      {viewMode === 'map' ? (
        <div style={{ flex: 1, position: 'relative', minHeight: 400 }}>
          <MerchantMapLeaflet
            merchants={filtered}
            isNight={isNight}
            onSelect={setSelected}
          />

          {/* Bottom sheet */}
          {selected && (
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 1000,
              background: cardBg, borderTop: cardBorder,
              borderRadius: '16px 16px 0 0',
              padding: '16px 16px 24px',
              boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
            }}>
              {/* Dismiss */}
              <button onClick={() => setSelected(null)} style={{
                position: 'absolute', top: 12, right: 12, width: 28, height: 28,
                borderRadius: 14, border: 'none', background: isNight ? '#3A2800' : '#F5EDD8',
                color: textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                {/* Merchant photo placeholder */}
                <div style={{
                  width: 56, height: 56, borderRadius: 12, background: btnBg, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ color: 'white', fontWeight: 900, fontSize: 20 }}>
                    {selected.name.slice(0, 1)}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: textPrimary }}>{selected.name}</span>
                    {selected.verified && (
                      <div style={{ width: 18, height: 18, borderRadius: 9, background: '#1D9E75', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: textMuted, marginTop: 2 }}>{selected.category}</div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 4, fontSize: 11, color: textMuted }}>
                    <span>{selected.distance}</span>
                    <span>·</span>
                    <span>{selected.hours}</span>
                    {selected.rating != null && <><span>·</span><span style={{ color: accent }}>★ {selected.rating}</span></>}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Pay now', primary: true },
                  { label: 'View profile', primary: false },
                  { label: 'Get directions', primary: false },
                ].map(a => (
                  <button key={a.label} style={{
                    padding: '11px 6px', borderRadius: 10, cursor: 'pointer',
                    border: a.primary ? 'none' : cardBorder,
                    background: a.primary ? btnBg : cardBg,
                    color: a.primary ? 'white' : textPrimary,
                    fontWeight: 700, fontSize: 12,
                  }}>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* List view */
        <div style={{ padding: '16px', paddingBottom: 80 }}>
          <div style={{ fontSize: 12, color: textMuted, marginBottom: 12 }}>{filtered.length} merchants</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(m => (
              <div key={m.id} style={{ background: cardBg, border: cardBorder, borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: btnBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: 'white', fontWeight: 900, fontSize: 18 }}>{m.name.slice(0, 1)}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: textPrimary }}>{m.name}</span>
                    {m.verified && (
                      <div style={{ width: 16, height: 16, borderRadius: 8, background: '#1D9E75', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </div>
                    )}
                    {m.type === 'online' && (
                      <span style={{ padding: '2px 6px', borderRadius: 4, background: '#2952E822', color: '#2952E8', fontSize: 9, fontWeight: 700 }}>Online</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: textMuted, marginTop: 2 }}>{m.category} · {m.hours}</div>
                  {m.type === 'physical' && (
                    <div style={{ fontSize: 11, color: accent, marginTop: 2 }}>{m.distance}</div>
                  )}
                </div>
                <button onClick={() => setSelected(m)} style={{
                  padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: btnBg, color: 'white', fontWeight: 700, fontSize: 12,
                }}>
                  Pay
                </button>
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: textMuted, fontSize: 14 }}>
                No merchants found
              </div>
            )}
          </div>
        </div>
      )}

      {/* Selected bottom sheet for list view */}
      {viewMode === 'list' && selected && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000,
          background: cardBg, borderTop: cardBorder,
          borderRadius: '16px 16px 0 0',
          padding: '16px 16px 40px',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.2)',
        }}>
          <button onClick={() => setSelected(null)} style={{
            position: 'absolute', top: 12, right: 12, width: 28, height: 28,
            borderRadius: 14, border: 'none', background: isNight ? '#3A2800' : '#F5EDD8',
            color: textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <div style={{ fontSize: 15, fontWeight: 800, color: textPrimary, marginBottom: 4 }}>{selected.name}</div>
          <div style={{ fontSize: 12, color: textMuted, marginBottom: 14 }}>{selected.category} · {selected.hours}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {['Pay now','View profile','Get directions'].map((label, i) => (
              <button key={label} style={{
                padding: '11px 6px', borderRadius: 10, cursor: 'pointer',
                border: i === 0 ? 'none' : cardBorder,
                background: i === 0 ? btnBg : cardBg,
                color: i === 0 ? 'white' : textPrimary,
                fontWeight: 700, fontSize: 12,
              }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
