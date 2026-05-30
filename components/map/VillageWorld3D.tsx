'use client';
import React, { useRef, useState, useEffect, useMemo, useCallback, Component, Suspense } from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { useGLTF, OrbitControls } from '@react-three/drei';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

// ─── Canvas error boundary — catches R3F render errors gracefully ─────────────
class CanvasErrorBoundary extends Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(e: Error) { console.error('[Canvas] 3D render error:', e); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex items-center justify-center bg-[#06080E] text-white/40 text-sm">
          <div className="text-center p-8">
            <div className="text-4xl mb-3">🌍</div>
            <p>Village loading issue. Try refreshing.</p>
            <button onClick={() => this.setState({ hasError: false })}
              className="mt-4 px-4 py-2 bg-[#1877F2]/20 border border-[#1877F2]/30 rounded-full text-[#60a5fa] text-xs">
              Retry
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// 2D SVG map — avoids second WebGL context conflict with the 3D world canvas
import { VillageMap2D } from './VillageMap2D';
import { createClient } from '@/lib/supabase/client';
import { useWeather } from '@/lib/theme/useWeather';
import { useSpiritVoice } from '@/components/village/SpiritVoiceProvider';
import { VillageSound } from '@/lib/sounds/village';
import { useSkySystem } from '@/lib/world/useSkySystem';
import { SpiritFigure } from '@/components/spirit/SpiritFigure';
import type { SpiritVariantId } from '@/components/spirit/SpiritFigure';
import * as THREE from 'three';
import { HutBuilding } from './VillageBuildings';
import {
  VillageTerrain, DenseGrass, CoastalOcean,
  terrainH, SeasonalWeatherSystem,
} from './VillageEnvironment';
import { useSeason } from '@/lib/world/useSeason';
import { PlayerCharacter } from './VillagePlayerCharacter';
import { SKIN_TONE_MAP, HAIR_COLOR_MAP, SHIRT_COLOR_MAP, type AvatarConfig, DEFAULT_AVATAR_CONFIG, resolveAvatarColors } from '@/lib/avatar/config';
import { useVillageMusic, VILLAGE_SONGS } from '@/lib/music/useVillageMusic';
import { useWebRTC } from '@/lib/webrtc/useWebRTC';
import { TribeCallPanel, IncomingCallOverlay } from '@/components/village/TribeCall';
import { TribeMemberMenu, type TribeMember } from '@/components/village/TribeMemberMenu';
import { VLGShop } from '@/components/village/VLGShop';
import { useVLGBalance } from '@/lib/tokens/useVLGBalance';
import { VillageTour } from '@/components/village/VillageTour';

// ─── Building scale factor — buildings are 2.8× bigger than their geometry ───
const BUILDING_SCALE = 2.8;

// ─── Location data — positions spread for larger scaled buildings ─────────────
// Collision sizes are geometry × BUILDING_SCALE
// ─── Village biome layout ─────────────────────────────────────────────────────
// West:  Mountain/icy zone — Zen Garden on mountain plateau
// NE:    Forest pockets — Hut in forest, Tribes in forest edge
// Farm:  Southeast fields — Workshop surrounded by farmland
// Coast: North shore — Wellness Center near water
// Market:South/center — Trading Post, Bank flanking the square
// Stage: East — Pavilion screening/concert venue
// ─── Admin object type (shared between LiveAdminObjects and movement system) ──
interface AdminObj {
  id: string; model_url: string; label: string; world_name?: string;
  pos_x: number; pos_y: number; pos_z: number;
  rot_y: number; scale: number; elevation: number;
  behavior: string; linked_page: string | null; dialog_title: string | null;
  dialog_content: string | null; iframe_url: string | null; transport_target?: string | null;
  trigger_type: string; trigger_distance: number;
  sound_url: string | null; sound_volume: number;
  sound_trigger_dist: number; sound_max_dist: number; sound_loop: boolean;
  item_info_enabled: boolean; trail_passable?: boolean;
  trail_points?: [number, number][];
}

// ─── Shared ref: live admin objects list (populated by LiveAdminObjects,
// read by movement system for collision and approach detection)
const liveAdminObjectsRef: { current: AdminObj[] } = { current: [] };

// ─── Clean slate — no permanent buildings. Everything placed via World Builder.
// The Mugsum Hut is placed by the admin in the sandbox and published live.
const LOCATIONS: {
  id: string; label: string; href: string;
  pos: [number,number,number]; color: string;
  size: [number,number,number]; doorColor: string; doorType: string;
}[] = [];

// ─── Radial crescent menu — monotone SVG icons ───────────────────────────────
// Using simple Unicode symbols that read as flat/monotone
const MENU_ITEMS = [
  { id: 'messages', icon: '◉', label: 'Messages', href: '/messages',               svg: 'M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z' },
  { id: 'goal',     icon: '🎯', label: 'New Goal',  href: '/village/workshop/chat',  svg: 'M12 2a10 10 0 100 20 10 10 0 000-20zm0 14l-4-4 1.4-1.4 2.6 2.6 5.6-5.6L19 9l-7 7z' },
  { id: 'studio',  icon: '📷', label: 'Create',    href: '/village/studio',        svg: 'M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2zM12 17a5 5 0 100-10 5 5 0 000 10z' },
  { id: 'map',     icon: '◈', label: 'Map',       href: null,                     svg: 'M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z' },
  { id: 'settings',icon: '◇', label: 'Settings',  href: '/village/hut/settings',  svg: 'M12 15.5A3.5 3.5 0 018.5 12 3.5 3.5 0 0112 8.5a3.5 3.5 0 013.5 3.5 3.5 3.5 0 01-3.5 3.5m7.43-2.92c.04-.36.07-.73.07-1.08s-.03-.73-.07-1.08l2.32-1.82c.21-.16.27-.46.13-.7l-2.2-3.82c-.13-.25-.42-.33-.67-.25l-2.74 1.1c-.57-.44-1.18-.8-1.85-1.08l-.4-2.91C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.4 2.91c-.67.28-1.28.64-1.85 1.08L4.52 5.3c-.25-.09-.54 0-.67.25L1.65 9.36c-.14.25-.08.54.13.7l2.32 1.82c-.04.35-.07.72-.07 1.08s.03.73.07 1.08L1.78 16.08c-.21.16-.27.46-.13.7l2.2 3.82c.13.25.42.33.67.25l2.74-1.1c.57.44 1.18.8 1.85 1.08l.4 2.91c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.4-2.91c.67-.28 1.28-.64 1.85-1.08l2.74 1.1c.25.09.54 0 .67-.25l2.2-3.82c.14-.25.08-.54-.13-.7l-2.32-1.82z' },
] as const;
type MenuId = typeof MENU_ITEMS[number]['id'];

// Crescent arc above the avatar head (angles in degrees, 0=right, CCW positive)
// Positions relative to avatar head center, radius 78px
// R=130 → chord between adjacent icons at 25° spacing = 2*130*sin(12.5°) ≈ 56px
// Button size = 44px → 12px gap between icons, no overlap
const CRESCENT_R = 130;
const CRESCENT_ANGLES_DEG = [140, 115, 90, 65, 40];
const CRESCENT_POSITIONS = CRESCENT_ANGLES_DEG.map(deg => {
  const rad = (deg * Math.PI) / 180;
  return { x: Math.cos(rad) * CRESCENT_R, y: -Math.sin(rad) * CRESCENT_R };
});

const SPIRIT_POS: [number,number,number] = [0, 0, 0];

// ─── Carousel bottom nav — monotone SVG icons ────────────────────────────────
const NAV_ITEMS = [
  { id: 'messages', label: 'Messages', href: '/messages',              svg: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z' },
  { id: 'hut',      label: 'My Hut',   href: '/village/hut',           svg: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10' },
  { id: 'discover', label: 'Discover', href: '/village/discover',      svg: 'M11 18a7 7 0 100-14 7 7 0 000 14zM21 21l-4.35-4.35' },
  { id: 'tribes',   label: 'Tribes',   href: '/village/tribes',        svg: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75' },
  { id: 'goal',     label: 'New Goal', href: '/village/workshop/chat', svg: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm0-6l-4-4 1.41-1.41L12 13.17l6.59-6.58L20 8l-8 8z' },
  { id: 'studio',   label: 'Create',   href: '/village/studio',        svg: 'M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2zM12 17a5 5 0 100-10 5 5 0 000 10z' },
  { id: 'pavilion', label: 'Pavilion', href: '/village/pavilion',      svg: 'M2 3h20M4 3v16a1 1 0 001 1h14a1 1 0 001-1V3M8 21v-4a4 4 0 018 0v4' },
  { id: 'hospital', label: 'Wellness', href: '/village/hospital',      svg: 'M22 12h-4l-3 9L9 3l-3 9H2' },
  { id: 'trading',  label: 'Market',   href: '/village/trading-post',  svg: 'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0' },
  { id: 'zen',      label: 'Zen',      href: '/village/zen',           svg: 'M12 2a5 5 0 015 5c0 5-5 13-5 13S7 12 7 7a5 5 0 015-5zM12 9a2 2 0 100-4 2 2 0 000 4z' },
  { id: 'map',      label: 'Map',      href: null,                     svg: 'M3 11l19-9-9 19-2-8-8-2zM3 11l8 2M14 22l-3-8' },
] as const;
const NAV_CENTER_IDX = 4; // Goal is center

function CarouselNav({
  isAdmin,
  onMapOpen,
  onNavigate,
}: {
  isAdmin?: boolean;
  onMapOpen: () => void;
  onNavigate: (href: string, label: string) => void;
}) {
  const router  = useRouter();
  const items   = useMemo(() => {
    const base = NAV_ITEMS as unknown as { id: string; label: string; href: string | null; svg: string }[];
    if (!isAdmin) return base;
    return [...base, { id: 'sandbox', label: 'Sandbox', href: '/admin/sandbox',
      svg: 'M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z' }];
  }, [isAdmin]);

  const [center, setCenter]   = useState(NAV_CENTER_IDX);
  const touchStart = useRef<number | null>(null);
  const touchLock  = useRef(false);

  function go(item: { id: string; href: string | null }) {
    if (!item.href)             { onMapOpen(); return; }
    if (item.id === 'sandbox')  { router.push('/admin/sandbox'); return; }
    onNavigate(item.href, '');
  }

  // Icon sizes/opacities per distance from center
  const ICON_SZ = [26, 21, 17, 13, 10];
  const OPAC    = [1, 0.65, 0.4, 0.22, 0.12];

  // Show center ± 4 (9 icons visible max at one time — clips at edges naturally)
  const visible = items
    .map((item, i) => ({ item, i, dist: i - center }))
    .filter(({ dist }) => Math.abs(dist) <= 4);

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-20"
      style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
      onTouchStart={e => { touchStart.current = e.touches[0].clientX; touchLock.current = false; }}
      onTouchMove={e => {
        if (touchStart.current === null || touchLock.current) return;
        const dx = e.touches[0].clientX - touchStart.current;
        if (Math.abs(dx) > 28) {
          touchLock.current = true;
          if (dx < 0) setCenter(c => Math.min(items.length - 1, c + 1));
          else        setCenter(c => Math.max(0, c - 1));
          touchStart.current = null;
        }
      }}
      onTouchEnd={() => { touchStart.current = null; touchLock.current = false; }}
    >
      {/* Gold gradient indicator line */}
      <div style={{
        height: 2,
        background: 'linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.15) 5%, rgba(184,134,11,0.6) 30%, rgba(212,175,55,1) 50%, rgba(184,134,11,0.6) 70%, rgba(212,175,55,0.15) 95%, transparent 100%)',
        boxShadow: '0 -1px 8px rgba(212,175,55,0.3)',
      }} />

      {/* White nav bar */}
      <div
        className="flex items-center justify-center gap-1 px-3 pt-2 pb-2"
        style={{ background: '#FFFFFF', boxShadow: '0 -4px 24px rgba(0,0,0,0.08)' }}
      >
        {visible.map(({ item, i, dist }) => {
          const abs = Math.abs(dist);
          const iconSz = ICON_SZ[abs] ?? 10;
          const opacity = OPAC[abs] ?? 0.08;
          const isC = dist === 0;
          const strokeW = isC ? 1.8 : 1.5;
          const color = isC ? '#B8860B' : 'rgba(30,27,75,0.55)';

          return (
            <motion.button
              key={item.id}
              layoutId={`cnav-${item.id}`}
              onClick={() => { isC ? go(item) : setCenter(i); }}
              animate={{ opacity }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="flex flex-col items-center gap-1 rounded-xl transition-all"
              style={{
                padding: isC ? '6px 14px' : '4px 8px',
                background: isC ? 'rgba(212,175,55,0.10)' : 'transparent',
                border: `1.5px solid ${isC ? 'rgba(212,175,55,0.45)' : 'transparent'}`,
                minWidth: isC ? 64 : 'auto',
              }}
            >
              <svg width={iconSz} height={iconSz} viewBox="0 0 24 24"
                fill="none" stroke={color} strokeWidth={strokeW} strokeLinecap="round" strokeLinejoin="round">
                <path d={item.svg} />
              </svg>
              {isC && (
                <span className="text-[9px] font-black tracking-tight whitespace-nowrap" style={{ color: '#B8860B' }}>
                  {item.label}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Pagination dots */}
      <div className="flex justify-center gap-1 pb-1" style={{ background: '#FFFFFF' }}>
        {items.map((_, i) => (
          <button key={i} onClick={() => setCenter(i)}
            className="rounded-full transition-all"
            style={{
              width: i === center ? 16 : 5, height: 3,
              background: i === center
                ? 'linear-gradient(90deg, #D4AF37, #F5C842)'
                : 'rgba(212,175,55,0.2)',
            }} />
        ))}
      </div>
    </div>
  );
}

// ─── Village top bar ─────────────────────────────────────────────────────────
function VillageTopBar({
  username,
  avatarConfig,
  vlgBalance,
  onHutOpen,
  onSearch,
  onMessages,
  onNotifications,
}: {
  username: string;
  avatarConfig?: { skin_id?: string };
  vlgBalance: number;
  onHutOpen: () => void;
  onSearch: () => void;        // opens discover drawer (fallback)
  onNavigateTo: (href: string) => void; // navigate to specific page
  onMessages: () => void;
  onNotifications: () => void;
}) {
  const skinColor = SKIN_TONE_MAP[avatarConfig?.skin_id ?? 's5'] ?? '#A86030';
  const { state, play, pause, toggleMusic, selectSong, setMusicVol, set } = useVillageMusic();
  const [showMusic, setShowMusic] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (showSearch) setTimeout(() => searchRef.current?.focus(), 80); }, [showSearch]);

  const SEARCH_SHORTCUTS = [
    { label: 'Discover villagers', href: '/village/discover', icon: '🔍' },
    { label: 'Set a new goal',     href: '/village/workshop/chat', icon: '🎯' },
    { label: 'Tribes',             href: '/village/tribes', icon: '👥' },
    { label: 'Dream Line',         href: '/village/dreamline', icon: '✨' },
    { label: 'Marketplace',        href: '/village/trading-post', icon: '🛒' },
    { label: 'Pavilion',           href: '/village/pavilion', icon: '🎪' },
    { label: 'Wellness',           href: '/village/hospital', icon: '🩺' },
    { label: 'Zen Garden',         href: '/village/zen', icon: '🧘' },
  ].filter(s => !searchQ.trim() || s.label.toLowerCase().includes(searchQ.toLowerCase()));

  function onSpeakerDown() {
    holdTimer.current = setTimeout(() => { setShowMusic(true); }, 500);
  }
  function onSpeakerUp() {
    if (holdTimer.current) clearTimeout(holdTimer.current);
  }
  function onSpeakerClick() {
    if (showMusic) { setShowMusic(false); return; }
    if (state.isPlaying) { pause(); } else { play(); }
  }

  const iconColor = 'rgba(30,27,75,0.65)';
  const STROKE = 2.0;

  return (
    <>
      <div
        className="absolute top-0 left-0 right-0 z-30 flex items-center px-3 gap-2"
        style={{
          height: 56,
          background: '#FFFFFF',
          borderBottom: '2px solid transparent',
          backgroundImage: 'linear-gradient(#fff, #fff), linear-gradient(90deg, rgba(212,175,55,0.2) 0%, rgba(212,175,55,0.7) 40%, rgba(184,134,11,0.9) 60%, rgba(212,175,55,0.7) 80%, rgba(212,175,55,0.2) 100%)',
          backgroundOrigin: 'border-box',
          backgroundClip: 'padding-box, border-box',
          boxShadow: '0 3px 16px rgba(0,0,0,0.10)',
        }}
      >
        {/* Logo */}
        <div className="font-black text-lg tracking-tight mr-1" style={{
          background: 'linear-gradient(135deg, #D4AF37 0%, #F5C842 50%, #B8860B 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          flexShrink: 0,
        }}>
          villa9e
        </div>

        <div className="flex-1" />

        {/* Speaker — tap=toggle, hold=panel */}
        <button
          onPointerDown={onSpeakerDown}
          onPointerUp={onSpeakerUp}
          onPointerLeave={onSpeakerUp}
          onClick={onSpeakerClick}
          className="w-9 h-9 flex items-center justify-center rounded-full transition-all hover:bg-black/5 relative"
          style={{ color: iconColor }}
        >
          {state.musicOn && state.isPlaying ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
            </svg>
          )}
          {/* Playing indicator dot */}
          {state.isPlaying && (
            <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-green-500" />
          )}
        </button>

        {/* Search */}
        <button onClick={() => setShowSearch(v => !v)}
          className="w-9 h-9 flex items-center justify-center rounded-full transition-all hover:bg-black/5"
          style={{ color: showSearch ? '#B8860B' : iconColor, background: showSearch ? 'rgba(212,175,55,0.1)' : 'transparent' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round">
            <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/>
          </svg>
        </button>

        {/* Notifications */}
        <button onClick={onNotifications}
          className="w-9 h-9 flex items-center justify-center rounded-full relative transition-all hover:bg-black/5"
          style={{ color: iconColor }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: '#EF4444' }} />
        </button>

        {/* Messages */}
        <button onClick={onMessages}
          className="w-9 h-9 flex items-center justify-center rounded-full transition-all hover:bg-black/5"
          style={{ color: iconColor }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
        </button>

        {/* VLG balance */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-full"
          style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.4)' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#B8860B" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          <span className="text-xs font-black" style={{ color: '#B8860B' }}>
            {vlgBalance >= 1000 ? `${(vlgBalance/1000).toFixed(1)}k` : vlgBalance}
          </span>
        </div>

        {/* Profile avatar → opens hut */}
        <button onClick={onHutOpen}
          className="w-9 h-9 rounded-full flex items-center justify-center font-black text-white text-sm flex-shrink-0 transition-all hover:scale-105"
          style={{
            background: `linear-gradient(135deg, ${skinColor}, ${skinColor}CC)`,
            border: '2px solid rgba(212,175,55,0.6)',
            boxShadow: '0 2px 8px rgba(212,175,55,0.2)',
          }}>
          {username[0]?.toUpperCase() ?? '?'}
        </button>
      </div>

      {/* ── Music panel (hold speaker to open) ── */}
      <AnimatePresence>
        {showMusic && (
          <motion.div
            key="music-panel"
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            className="absolute top-14 right-3 z-40 rounded-2xl shadow-2xl overflow-hidden"
            style={{
              width: 300,
              background: '#FFFFFF',
              border: '1px solid rgba(212,175,55,0.35)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            }}
          >
            {/* Panel header */}
            <div className="px-4 py-3 flex items-center justify-between"
              style={{ borderBottom: '1px solid rgba(212,175,55,0.2)' }}>
              <div>
                <p className="font-black text-sm" style={{ color: '#1E1B4B' }}>Village Music</p>
                <p className="text-xs" style={{ color: 'rgba(30,27,75,0.5)' }}>
                  {VILLAGE_SONGS[state.currentIdx]?.title ?? 'Villa9e'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => set('shuffle', !state.shuffle)}
                  className="text-xs px-2 py-1 rounded-lg font-bold transition-all"
                  style={{
                    background: state.shuffle ? 'rgba(212,175,55,0.2)' : 'transparent',
                    border: `1px solid ${state.shuffle ? 'rgba(212,175,55,0.5)' : 'rgba(30,27,75,0.15)'}`,
                    color: state.shuffle ? '#B8860B' : 'rgba(30,27,75,0.5)',
                  }}
                >
                  ⇄ Shuffle
                </button>
                <button onClick={() => setShowMusic(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-full text-sm"
                  style={{ background: 'rgba(30,27,75,0.06)', color: 'rgba(30,27,75,0.5)' }}>×</button>
              </div>
            </div>

            {/* Volume controls */}
            <div className="px-4 py-3 space-y-3" style={{ borderBottom: '1px solid rgba(212,175,55,0.15)' }}>
              {[
                { label: 'Music', key: 'musicOn' as const, volKey: 'musicVol' as const, vol: state.musicVol, on: state.musicOn },
                { label: 'Sound FX', key: 'sfxOn' as const, volKey: 'sfxVol' as const, vol: state.sfxVol, on: state.sfxOn },
                { label: 'Spirit Voice', key: 'spiritOn' as const, volKey: 'spiritVol' as const, vol: state.spiritVol, on: state.spiritOn },
              ].map(row => (
                <div key={row.label} className="flex items-center gap-3">
                  <button onClick={() => set(row.key, !row.on)}
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: row.on ? '#B8860B' : 'rgba(30,27,75,0.1)' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                      stroke={row.on ? '#fff' : 'rgba(30,27,75,0.4)'} strokeWidth="2.2" strokeLinecap="round">
                      {row.on
                        ? <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 010 7.07"/></>
                        : <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></>
                      }
                    </svg>
                  </button>
                  <span className="text-xs font-semibold w-16 flex-shrink-0" style={{ color: 'rgba(30,27,75,0.6)' }}>{row.label}</span>
                  <input type="range" min="0" max="1" step="0.05"
                    value={row.vol}
                    onChange={e => {
                      const v = parseFloat(e.target.value);
                      if (row.volKey === 'musicVol') setMusicVol(v);
                      else set(row.volKey, v);
                    }}
                    disabled={!row.on}
                    className="flex-1 h-1.5 rounded-full appearance-none"
                    style={{ accentColor: '#B8860B', opacity: row.on ? 1 : 0.4 }}
                  />
                </div>
              ))}
            </div>

            {/* Play controls */}
            <div className="flex items-center justify-center gap-4 py-3"
              style={{ borderBottom: '1px solid rgba(212,175,55,0.15)' }}>
              <button
                onClick={() => selectSong((state.currentIdx - 1 + VILLAGE_SONGS.length) % VILLAGE_SONGS.length)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(30,27,75,0.06)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(30,27,75,0.6)" strokeWidth="2.2" strokeLinecap="round">
                  <polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/>
                </svg>
              </button>
              <button
                onClick={() => state.isPlaying ? pause() : play()}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                style={{ background: '#B8860B' }}>
                {state.isPlaying
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                }
              </button>
              <button
                onClick={() => selectSong((state.currentIdx + 1) % VILLAGE_SONGS.length)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(30,27,75,0.06)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(30,27,75,0.6)" strokeWidth="2.2" strokeLinecap="round">
                  <polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/>
                </svg>
              </button>
            </div>

            {/* Song list */}
            <div className="overflow-y-auto" style={{ maxHeight: 220 }}>
              {VILLAGE_SONGS.map((song, i) => (
                <button key={song.id} onClick={() => selectSong(i)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all hover:bg-amber-50"
                  style={{
                    background: state.currentIdx === i ? 'rgba(212,175,55,0.1)' : 'transparent',
                  }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: state.currentIdx === i ? '#B8860B' : 'rgba(30,27,75,0.08)' }}>
                    {state.currentIdx === i && state.isPlaying
                      ? <svg width="8" height="8" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                      : <svg width="8" height="8" viewBox="0 0 24 24" fill={state.currentIdx === i ? 'white' : 'rgba(30,27,75,0.4)'}><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    }
                  </div>
                  <span className="text-sm font-medium truncate"
                    style={{ color: state.currentIdx === i ? '#B8860B' : 'rgba(30,27,75,0.8)' }}>
                    {song.title}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Search overlay ── */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            key="search"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            className="absolute top-14 left-3 right-3 z-40 rounded-2xl shadow-2xl overflow-hidden"
            style={{ background: '#FFFFFF', border: '1px solid rgba(212,175,55,0.3)', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid rgba(212,175,55,0.15)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(30,27,75,0.4)" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                ref={searchRef}
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Escape') { setShowSearch(false); setSearchQ(''); }
                  if (e.key === 'Enter' && SEARCH_SHORTCUTS.length > 0) {
                    onSearch(); setShowSearch(false); setSearchQ('');
                  }
                }}
                placeholder="Search the village…"
                className="flex-1 text-sm outline-none"
                style={{ color: '#1E1B4B', background: 'transparent' }}
              />
              <button onClick={() => { setShowSearch(false); setSearchQ(''); }}
                className="text-xs font-bold px-2 py-1 rounded-lg"
                style={{ color: 'rgba(30,27,75,0.4)', background: 'rgba(30,27,75,0.06)' }}>
                esc
              </button>
            </div>

            {/* Quick links */}
            <div className="py-1">
              {SEARCH_SHORTCUTS.slice(0, 6).map(s => (
                <button
                  key={s.href}
                  onClick={() => { onNavigateTo(s.href); setShowSearch(false); setSearchQ(''); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-all hover:bg-amber-50"
                  style={{ color: '#1E1B4B' }}
                >
                  <span className="text-base w-6 text-center">{s.icon}</span>
                  <span className="font-medium">{s.label}</span>
                  <svg className="ml-auto" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(30,27,75,0.3)" strokeWidth="2" strokeLinecap="round">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </button>
              ))}
            </div>

            {SEARCH_SHORTCUTS.length === 0 && (
              <div className="px-4 py-6 text-center text-sm" style={{ color: 'rgba(30,27,75,0.4)' }}>
                No results for "{searchQ}"
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Hut interior 3D modal ────────────────────────────────────────────────────
function HutInteriorFurniture() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    // Candle flicker - very subtle
    if (groupRef.current) {
      groupRef.current.children.forEach((c, i) => {
        if (c.userData.flicker) {
          (c as THREE.PointLight).intensity = 0.8 + Math.sin(clock.elapsedTime * 8 + i) * 0.15;
        }
      });
    }
  });
  return (
    <group ref={groupRef}>
      {/* Floor — warm wood planks */}
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#8B6332" roughness={0.9} metalness={0.0} />
      </mesh>
      {/* Wood plank lines */}
      {[-4,-2,0,2,4].map((x,i) => (
        <mesh key={i} rotation={[-Math.PI/2, 0, 0]} position={[x, 0.001, 0]}>
          <planeGeometry args={[0.04, 10]} />
          <meshBasicMaterial color="#6A4A22" />
        </mesh>
      ))}

      {/* Walls */}
      {/* Back wall */}
      <mesh position={[0, 2.5, -5]} receiveShadow castShadow>
        <planeGeometry args={[10, 5]} />
        <meshStandardMaterial color="#C4A26A" roughness={1} />
      </mesh>
      {/* Left wall */}
      <mesh position={[-5, 2.5, 0]} rotation={[0, Math.PI/2, 0]} receiveShadow>
        <planeGeometry args={[10, 5]} />
        <meshStandardMaterial color="#B89458" roughness={1} />
      </mesh>
      {/* Right wall */}
      <mesh position={[5, 2.5, 0]} rotation={[0, -Math.PI/2, 0]} receiveShadow>
        <planeGeometry args={[10, 5]} />
        <meshStandardMaterial color="#B89458" roughness={1} />
      </mesh>

      {/* Ceiling beams */}
      {[-3, 0, 3].map((x,i) => (
        <mesh key={i} position={[x, 4.8, 0]} castShadow>
          <boxGeometry args={[0.25, 0.25, 10]} />
          <meshStandardMaterial color="#5A3A18" roughness={0.95} />
        </mesh>
      ))}

      {/* Central fire pit */}
      <mesh position={[0, 0.05, 0.5]} rotation={[-Math.PI/2, 0, 0]}>
        <circleGeometry args={[0.6, 20]} />
        <meshStandardMaterial color="#3A2A1A" roughness={1} />
      </mesh>
      {/* Fire glow */}
      <pointLight position={[0, 0.5, 0.5]} intensity={1.6} color="#FF8C00" distance={6} userData={{ flicker: true }} />
      {/* Flame visual */}
      <mesh position={[0, 0.35, 0.5]}>
        <coneGeometry args={[0.15, 0.6, 8]} />
        <meshBasicMaterial color="#FF6B00" transparent opacity={0.85} />
      </mesh>
      <mesh position={[0, 0.55, 0.5]}>
        <coneGeometry args={[0.08, 0.4, 8]} />
        <meshBasicMaterial color="#FFD700" transparent opacity={0.75} />
      </mesh>

      {/* Desk / table against back wall */}
      <mesh position={[0, 0.75, -4]} castShadow receiveShadow>
        <boxGeometry args={[2.5, 0.1, 0.8]} />
        <meshStandardMaterial color="#7A5028" roughness={0.8} />
      </mesh>
      {/* Table legs */}
      {[[-1.1, -0.3], [1.1, -0.3], [-1.1, 0.3], [1.1, 0.3]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.35, -4 + (z as number)]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.7, 8]} />
          <meshStandardMaterial color="#5A3A18" roughness={0.9} />
        </mesh>
      ))}

      {/* Goal scroll / paper on desk */}
      <mesh position={[0, 0.82, -4.1]} rotation={[-0.1, 0, 0]}>
        <planeGeometry args={[0.9, 0.65]} />
        <meshStandardMaterial color="#F5E6C8" roughness={0.5} />
      </mesh>

      {/* Chair */}
      <mesh position={[0, 0.4, -3.2]} castShadow>
        <boxGeometry args={[0.65, 0.08, 0.65]} />
        <meshStandardMaterial color="#8B5E2E" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.78, -3.52]} castShadow>
        <boxGeometry args={[0.65, 0.7, 0.08]} />
        <meshStandardMaterial color="#8B5E2E" roughness={0.85} />
      </mesh>

      {/* Bookshelf left wall */}
      <mesh position={[-4.2, 1.5, -2]} castShadow>
        <boxGeometry args={[0.3, 3, 1.8]} />
        <meshStandardMaterial color="#6A4018" roughness={0.9} />
      </mesh>
      {/* Books */}
      {[0, 0.28, 0.56, 0.84, 1.12].map((y,i) => (
        <mesh key={i} position={[-4.12, 0.6 + y, -2 + (i%3)*0.2 - 0.2]} castShadow>
          <boxGeometry args={[0.08, 0.22, 0.16]} />
          <meshStandardMaterial color={['#C0392B','#2980B9','#27AE60','#8E44AD','#F39C12'][i]} roughness={0.7} />
        </mesh>
      ))}

      {/* Woven rug */}
      <mesh position={[0, 0.003, 1]} rotation={[-Math.PI/2, 0, 0]}>
        <planeGeometry args={[3.5, 2.5, 6, 6]} />
        <meshStandardMaterial color="#A0522D" roughness={1} />
      </mesh>

      {/* Window on right wall — lets in light */}
      <mesh position={[4.98, 2.8, -1.5]} rotation={[0, -Math.PI/2, 0]}>
        <planeGeometry args={[1.2, 1.0]} />
        <meshBasicMaterial color="#C8E4FF" transparent opacity={0.6} />
      </mesh>
      <directionalLight position={[8, 6, -2]} intensity={0.8} color="#FFF5D0" />

      {/* Candle on desk */}
      <mesh position={[0.8, 0.85, -4.1]} castShadow>
        <cylinderGeometry args={[0.05, 0.06, 0.2, 10]} />
        <meshStandardMaterial color="#F5F0E0" />
      </mesh>
      <pointLight position={[0.8, 1.1, -4.1]} intensity={0.6} color="#FFA040" distance={3} userData={{ flicker: true }} />

      {/* Trophy / award on shelf */}
      <mesh position={[-4.1, 2.6, -2.4]} castShadow>
        <cylinderGeometry args={[0.12, 0.08, 0.3, 8]} />
        <meshStandardMaterial color="#FFD700" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

function HutInterior({ onClose, username }: { onClose: () => void; username: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: '#1A0E06' }}
    >
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ background: 'rgba(0,0,0,0.6)', borderBottom: '1px solid rgba(212,175,55,0.2)' }}>
        <button onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37' }}>
          ←
        </button>
        <div className="flex-1">
          <p className="font-black text-sm" style={{ color: '#F5E6C8' }}>{username}'s Hut</p>
          <p className="text-xs" style={{ color: '#8B6A3A' }}>Your personal space</p>
        </div>
        <Link href="/village/hut"
          className="text-xs font-bold px-3 py-1.5 rounded-xl"
          style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37' }}>
          Settings →
        </Link>
      </div>

      {/* 3D hut interior */}
      <div className="flex-1 relative">
        <Canvas
          camera={{ position: [0, 2.2, 4.8], fov: 62 }}
          shadows={{ type: THREE.PCFSoftShadowMap }}
          gl={{ antialias: true }}
        >
          <ambientLight intensity={0.4} color="#FFA060" />
          <HutInteriorFurniture />
          <OrbitControls
            target={[0, 1.2, 0]}
            enablePan={false}
            minPolarAngle={Math.PI * 0.15}
            maxPolarAngle={Math.PI * 0.72}
            minDistance={2.5}
            maxDistance={7}
          />
        </Canvas>
      </div>

      {/* Quick links at bottom */}
      <div className="flex gap-3 px-4 py-3 flex-shrink-0"
        style={{ background: 'rgba(0,0,0,0.7)', borderTop: '1px solid rgba(212,175,55,0.2)' }}>
        {[
          { href: '/village/hut/avatar',   icon: '🎭', label: 'Avatar'   },
          { href: '/village/hut/vlg-wallet', icon: '🪙', label: 'Wallet'  },
          { href: '/village/hut/achievements', icon: '🏆', label: 'Badges' },
          { href: '/village/workshop/chat', icon: '🎯', label: 'Goals'   },
        ].map(item => (
          <Link key={item.href} href={item.href}
            className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl text-center transition-all"
            style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)' }}>
            <span className="text-xl">{item.icon}</span>
            <span className="text-xs font-bold" style={{ color: '#D4AF37' }}>{item.label}</span>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Sun position from altitude/azimuth ──────────────────────────────────────
// ─── HUDBridge — projects 3D avatar head to 2D screen coords every frame ─────
// Updates DOM element directly (no setState) to avoid 60fps re-renders
function HUDBridge({
  playerPos,
  avatarDivRef,
  spiritDivRef,
}: {
  playerPos: React.MutableRefObject<THREE.Vector3>;
  avatarDivRef: React.MutableRefObject<HTMLDivElement | null>;
  spiritDivRef: React.MutableRefObject<HTMLDivElement | null>;
}) {
  const { camera, size } = useThree();
  useFrame(() => {
    // Avatar head position
    const headWorld = playerPos.current.clone();
    headWorld.y += 2.3;
    headWorld.project(camera);
    const ax = Math.round((headWorld.x * 0.5 + 0.5) * size.width);
    const ay = Math.round((headWorld.y * -0.5 + 0.5) * size.height);
    if (avatarDivRef.current) {
      avatarDivRef.current.style.left = `${ax}px`;
      avatarDivRef.current.style.top  = `${ay}px`;
    }
    // Spirit position (floats behind player)
    const spiritWorld = playerPos.current.clone();
    spiritWorld.x -= Math.sin(playerPos.current.x * 0.1) * 0.8;
    spiritWorld.y += 2.8;
    spiritWorld.z += 1.2;
    spiritWorld.project(camera);
    const sx = Math.round((spiritWorld.x * 0.5 + 0.5) * size.width);
    const sy = Math.round((spiritWorld.y * -0.5 + 0.5) * size.height);
    if (spiritDivRef.current) {
      spiritDivRef.current.style.left = `${sx}px`;
      spiritDivRef.current.style.top  = `${sy}px`;
    }
  });
  return null;
}

function sunPosFromAngles(altitude: number, azimuth: number, dist = 60): [number,number,number] {
  const altR = (altitude * Math.PI) / 180;
  const azR  = (azimuth  * Math.PI) / 180;
  const x =  Math.sin(azR) * Math.cos(altR) * dist;
  const y =  Math.sin(altR) * dist;
  const z = -Math.cos(azR) * Math.cos(altR) * dist;
  return [x, Math.max(y, -10), z];
}

// Memoized flat-shaded toon material — avoids TypeScript JSX prop error
function FlatToonMat({ color }: { color: string }) {
  const mat = useMemo(() => {
    const m = new THREE.MeshToonMaterial({ color });
    (m as any).flatShading = true;
    return m;
  }, [color]);
  return <primitive object={mat} attach="material" />;
}

// ─── Adinkra canvas texture generator ────────────────────────────────────────
function createAdinkraTexture(color: string, bgColor = '#F5ECD0'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 256, 256);

  const stripeColors = [color, '#FFD700', color, bgColor];
  stripeColors.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.globalAlpha = i === 3 ? 0 : 0.6;
    ctx.fillRect(0, i * 64, 256, 64);
  });
  ctx.globalAlpha = 1;

  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.7;
  for (let x = 32; x <= 224; x += 64) {
    for (let y = 32; y <= 224; y += 64) {
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - 8, y); ctx.lineTo(x + 8, y);
      ctx.moveTo(x, y - 8); ctx.lineTo(x, y + 8);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  return new THREE.CanvasTexture(canvas);
}

function hexToColor(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

// ─── Sky dome with gradient colors ───────────────────────────────────────────
function SkyDome({ skyTop, skyMid, skyHor }: { skyTop: string; skyMid: string; skyHor: string }) {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(80, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const positions = geo.attributes.position;
    const colors: number[] = [];
    const colTop = hexToColor(skyTop);
    const colMid = hexToColor(skyMid);
    const colHor = hexToColor(skyHor);

    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i);
      const t = Math.max(0, Math.min(1, y / 30));
      // above equator: interpolate horizon→mid→top
      let r: number, g: number, b: number;
      if (t < 0.35) {
        const f = t / 0.35;
        r = colHor.r + (colMid.r - colHor.r) * f;
        g = colHor.g + (colMid.g - colHor.g) * f;
        b = colHor.b + (colMid.b - colHor.b) * f;
      } else {
        const f = (t - 0.35) / 0.65;
        r = colMid.r + (colTop.r - colMid.r) * f;
        g = colMid.g + (colTop.g - colMid.g) * f;
        b = colMid.b + (colTop.b - colMid.b) * f;
      }
      colors.push(r, g, b);
    }

    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    return geo;
  }, [skyTop, skyMid, skyHor]);

  return (
    <mesh ref={meshRef} geometry={geometry} renderOrder={-1}>
      <meshBasicMaterial vertexColors side={THREE.BackSide} depthWrite={false} />
    </mesh>
  );
}

// ─── Sun / Moon disc ──────────────────────────────────────────────────────────
function CelestialBody({ phase, altitude, azimuth, sunColor }: {
  phase: string; altitude: number; azimuth: number; sunColor: string;
}) {
  const isNight = phase === 'night' || phase === 'dusk' || phase === 'dawn';
  const pos = sunPosFromAngles(altitude, azimuth, 55);
  const bodyRef = useRef<THREE.Mesh>(null);

  useFrame(state => {
    if (!bodyRef.current) return;
    // Subtle pulse for sun glow
    const t = state.clock.elapsedTime;
    bodyRef.current.scale.setScalar(1 + Math.sin(t * 0.8) * 0.015);
  });

  if (altitude < -8) return null;

  return (
    <group position={pos}>
      {/* Glow halo — high-poly for smooth gradient */}
      <mesh>
        <sphereGeometry args={[isNight ? 1.35 : 3.2, 32, 24]} />
        <meshBasicMaterial color={sunColor} transparent opacity={0.10} />
      </mesh>
      {/* Inner halo — tighter, brighter */}
      <mesh>
        <sphereGeometry args={[isNight ? 0.95 : 2.2, 28, 20]} />
        <meshBasicMaterial color={sunColor} transparent opacity={0.18} />
      </mesh>
      {/* Body disc */}
      <mesh ref={bodyRef}>
        <sphereGeometry args={[isNight ? 0.82 : 1.85, 32, 24]} />
        <meshBasicMaterial color={isNight ? '#F4F8FF' : sunColor} />
      </mesh>
      {/* God rays at golden hour */}
      {!isNight && (phase === 'sunrise' || phase === 'golden' || phase === 'sunset') && (
        Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 2.5, Math.sin(a) * 2.5, 0]}>
              <planeGeometry args={[0.15, 4 + Math.sin(i * 1.3) * 1.5]} />
              <meshBasicMaterial color={sunColor} transparent opacity={0.08 + Math.sin(i) * 0.04} />
            </mesh>
          );
        })
      )}
    </group>
  );
}

// ─── Stars (instanced) ────────────────────────────────────────────────────────
function Stars({ visible }: { visible: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);

  const starData = useMemo(() => Array.from({ length: 200 }, () => {
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.random() * Math.PI * 0.5;
    const r     = 70;
    return {
      x: r * Math.sin(phi) * Math.cos(theta),
      y: r * Math.cos(phi) * 0.8 + 5,
      z: r * Math.sin(phi) * Math.sin(theta),
      brightness: 0.4 + Math.random() * 0.6,
      twinkleSpeed: 0.5 + Math.random() * 2.5,
      twinklePhase: Math.random() * Math.PI * 2,
    };
  }), []);

  useFrame(state => {
    if (!ref.current) return;
    const dummy = new THREE.Object3D();
    const t = state.clock.elapsedTime;
    starData.forEach((star, i) => {
      dummy.position.set(star.x, star.y, star.z);
      const twinkle = 0.85 + Math.sin(t * star.twinkleSpeed + star.twinklePhase) * 0.15;
      const scale = visible ? star.brightness * twinkle * 0.35 : 0;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, 200]}>
      <sphereGeometry args={[1, 8, 6]} />
      <meshBasicMaterial color="#E8E8FF" />
    </instancedMesh>
  );
}

// ─── River water texture (canvas-based, animated UV) ─────────────────────────
function createRiverTexture(waterColor: string, shimColor: string): THREE.CanvasTexture {
  const W = 512, H = 256;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Base water fill
  ctx.fillStyle = waterColor;
  ctx.fillRect(0, 0, W, H);

  // Flowing current lines — horizontal sinusoidal waves
  for (let row = 0; row < 24; row++) {
    const y0 = (row / 24) * H;
    const amp = 3 + Math.sin(row * 1.3) * 2;
    const freq = 0.025 + Math.sin(row) * 0.008;
    ctx.beginPath();
    ctx.strokeStyle = `rgba(255,255,255,${0.06 + Math.random() * 0.08})`;
    ctx.lineWidth = 1.2;
    for (let x = 0; x <= W; x += 2) {
      const y = y0 + Math.sin(x * freq + row) * amp;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Foam patches near banks
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    ctx.fillStyle = `rgba(255,255,255,${0.04 + Math.random() * 0.06})`;
    ctx.beginPath();
    ctx.ellipse(x, y, 18 + Math.random() * 30, 3 + Math.random() * 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Sky reflection shimmer
  ctx.fillStyle = shimColor;
  ctx.globalAlpha = 0.15;
  ctx.fillRect(W * 0.3, 0, W * 0.4, H);
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1.5, 3);
  return tex;
}

// ─── Procedural river audio (Web Audio API pink noise + filters) ──────────────
function createRiverAudio(): { gain: GainNode; ctx: AudioContext } | null {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const master = audioCtx.createGain();
    master.gain.value = 0;
    master.connect(audioCtx.destination);

    // Pink noise generator
    function pinkNoise() {
      const len = audioCtx.sampleRate * 3;
      const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
      const d = buf.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + w * 0.0555179;
        b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.96900 * b2 + w * 0.1538520;
        b3 = 0.86650 * b3 + w * 0.3104856;
        b4 = 0.55000 * b4 + w * 0.5329522;
        b5 = -0.7616 * b5 - w * 0.0168980;
        d[i] = (b0+b1+b2+b3+b4+b5+b6+w*0.5362) / 6.5;
        b6 = w * 0.115926;
      }
      const src = audioCtx.createBufferSource();
      src.buffer = buf; src.loop = true; return src;
    }

    // Layer 1 — deep river rumble
    const base = pinkNoise();
    const lp = audioCtx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 700; lp.Q.value = 0.5;
    const g1 = audioCtx.createGain(); g1.gain.value = 0.55;
    base.connect(lp); lp.connect(g1); g1.connect(master); base.start();

    // Layer 2 — water surface chatter
    const mid = pinkNoise();
    const bp = audioCtx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 0.8;
    const g2 = audioCtx.createGain(); g2.gain.value = 0.22;
    mid.connect(bp); bp.connect(g2); g2.connect(master); mid.start();

    // Layer 3 — high splash detail
    const hi = pinkNoise();
    const hp = audioCtx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 3500;
    const g3 = audioCtx.createGain(); g3.gain.value = 0.08;
    hi.connect(hp); hp.connect(g3); g3.connect(master); hi.start();

    // LFO — gentle current variation
    const lfo = audioCtx.createOscillator();
    lfo.frequency.value = 0.12;
    const lfog = audioCtx.createGain(); lfog.gain.value = 0.12;
    lfo.connect(lfog); lfog.connect(master.gain); lfo.start();

    return { gain: master, ctx: audioCtx };
  } catch { return null; }
}

// ─── River with animated flow + positional audio ──────────────────────────────
function River({ skyState, playerPos }: {
  skyState: any;
  playerPos: React.MutableRefObject<THREE.Vector3>;
}) {
  const shimmerRef = useRef<THREE.Mesh>(null);
  const flowTex    = useRef<THREE.CanvasTexture | null>(null);
  const flowTex2   = useRef<THREE.CanvasTexture | null>(null);
  const matRef     = useRef<THREE.MeshBasicMaterial>(null);
  const mat2Ref    = useRef<THREE.MeshBasicMaterial>(null);
  const audioRef   = useRef<{ gain: GainNode; ctx: AudioContext } | null>(null);
  const audioReady = useRef(false);

  const isNight  = skyState?.phase === 'night' || skyState?.phase === 'dusk' || skyState?.phase === 'dawn';
  const isGolden = skyState?.phase === 'golden' || skyState?.phase === 'sunrise' || skyState?.phase === 'sunset';

  const waterColor  = isNight ? '#1A2E4A' : isGolden ? '#A06820' : '#2A88BA';
  const shimColor   = isNight ? '#3A5A8A' : isGolden ? '#FFB347' : '#87CEEB';

  // Build / rebuild texture when phase changes
  useEffect(() => {
    if (typeof document === 'undefined') return;
    flowTex.current  = createRiverTexture(waterColor, shimColor);
    flowTex2.current = createRiverTexture(waterColor, shimColor);
    if (matRef.current) { matRef.current.map = flowTex.current; matRef.current.needsUpdate = true; }
    if (mat2Ref.current){ mat2Ref.current.map = flowTex2.current; mat2Ref.current.needsUpdate = true; }
  }, [waterColor, shimColor]);

  // River audio disabled per product decision
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _audioDisabled = audioReady;

  useFrame(state => {
    const t = state.clock.elapsedTime;

    // Animate UV offset — two layers at different speeds for parallax
    if (flowTex.current) {
      flowTex.current.offset.set(0, -(t * 0.18) % 1);
      flowTex.current.needsUpdate = true;
    }
    if (flowTex2.current) {
      flowTex2.current.offset.set(0.5, -(t * 0.28) % 1);
      flowTex2.current.needsUpdate = true;
    }

    // Shimmer band scrolls upstream
    if (shimmerRef.current) {
      shimmerRef.current.position.z = -16 + ((t * 2.5) % 36);
      (shimmerRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.08 + Math.sin(t * 3.5) * 0.06;
    }

    // River audio disabled
  });

  return (
    <group>
      {/* ── Main channel — layer 1 (slower flow) ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0.15]} position={[-17, 0.06, 0]}>
        <planeGeometry args={[3.5, 38, 10, 1]} />
        <meshBasicMaterial ref={matRef} color={waterColor} map={flowTex.current ?? undefined}
          transparent opacity={0.82} />
      </mesh>

      {/* ── Layer 2 — faster surface detail ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0.15]} position={[-17, 0.08, 0]}>
        <planeGeometry args={[2.6, 36, 8, 1]} />
        <meshBasicMaterial ref={mat2Ref} color={shimColor} map={flowTex2.current ?? undefined}
          transparent opacity={0.28} />
      </mesh>

      {/* ── Foam edge along banks ── */}
      {[-0.9, 0.9].map((side, i) => (
        <mesh key={i} rotation={[-Math.PI/2, 0, 0.15]} position={[-17 + side * 1.1, 0.09, 0]}>
          <planeGeometry args={[0.35, 36, 4, 1]} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={0.18} />
        </mesh>
      ))}

      {/* ── Moving shimmer band (light reflection) ── */}
      <mesh ref={shimmerRef} rotation={[-Math.PI / 2, 0, 0.15]} position={[-17, 0.1, -18]}>
        <planeGeometry args={[2.4, 5, 4, 1]} />
        <meshBasicMaterial color="#FFFFFF" transparent opacity={0.09} />
      </mesh>

      {/* ── River banks — sandy mud ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0.15]} position={[-19.2, 0.03, 0]}>
        <planeGeometry args={[1.8, 38, 4, 1]} />
        <meshToonMaterial color={isNight ? '#3A2E1A' : '#9A7850'} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0.15]} position={[-14.8, 0.03, 0]}>
        <planeGeometry args={[1.8, 38, 4, 1]} />
        <meshToonMaterial color={isNight ? '#3A2E1A' : '#9A7850'} />
      </mesh>

      {/* ── Riverside reeds / tall grass ── */}
      {[
        [-15.4, 0.08, -10], [-15.2, 0.08, -4], [-15.6, 0.08, 3], [-15.3, 0.08, 9],
        [-18.6, 0.08, -7], [-18.4, 0.08, 1], [-18.8, 0.08, 7],
      ].map((pos, i) => (
        <group key={i} position={pos as [number,number,number]}>
          {[0, 0.3, -0.3].map((dx, j) => (
            <mesh key={j} position={[dx * 0.4, 0, 0]}>
              <coneGeometry args={[0.04, 0.55 + Math.random() * 0.3, 7]} />
              <meshToonMaterial color={isNight ? '#2A4A2A' : '#4A7A2A'} />
            </mesh>
          ))}
        </group>
      ))}

      {/* ── River stones with water ripple rings ── */}
      {[
        [-16.5, 0.1, -9], [-17.4, 0.1, -3], [-16.8, 0.1, 4],
        [-17.2, 0.1, 11], [-16.3, 0.1, -1], [-17.6, 0.1, 7],
      ].map((pos, i) => (
        <group key={i} position={pos as [number,number,number]}>
          <mesh castShadow>
            <sphereGeometry args={[0.18 + Math.sin(i * 1.7) * 0.08, 16, 12]} />
            <meshToonMaterial color={isNight ? '#5A5040' : '#8A8070'} />
          </mesh>
          {/* Ripple ring around stone */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <ringGeometry args={[0.28, 0.38, 32]} />
            <meshBasicMaterial color="#FFFFFF" transparent opacity={0.15} />
          </mesh>
        </group>
      ))}

      {/* ── Small waterfall cascade at one end ── */}
      <group position={[-17, 0.25, -16]}>
        <mesh rotation={[0.4, 0.15, 0]}>
          <planeGeometry args={[1.8, 0.9, 4, 6]} />
          <meshBasicMaterial color={shimColor} transparent opacity={0.55} />
        </mesh>
        {/* Splash pool */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0.6]}>
          <circleGeometry args={[0.9, 16]} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={0.25} />
        </mesh>
      </group>
    </group>
  );
}

// ─── Building map — hut is the only permanent building ───────────────────────
const BUILDING_MAP: Record<string, React.FC<{ hover: boolean }>> = {
  hut: HutBuilding,
};

function Building({
  loc, onEnter, isNear,
}: {
  loc: typeof LOCATIONS[0];
  onEnter: (href: string, label: string) => void;
  isNear: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const [x,, z]  = loc.pos;
  const ArchComp = BUILDING_MAP[loc.id];
  // Door hinge pivot — swings open when player is near
  const doorRef  = useRef<THREE.Group>(null);
  const glowRef  = useRef<THREE.Mesh>(null);

  useFrame(state => {
    // Door swings inward (−Y axis rotation = opens toward player at +Z)
    if (doorRef.current) {
      const target = isNear ? -Math.PI * 0.75 : 0;
      doorRef.current.rotation.y = THREE.MathUtils.lerp(doorRef.current.rotation.y, target, 0.055);
    }
    // Entrance glow pulses when near
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = isNear
        ? 0.22 + Math.sin(state.clock.elapsedTime * 3) * 0.1
        : 0;
    }
  });

  // Scale the shadow circle to match building scale
  const shadowR = 6.5;

  // Snap building base to terrain height so buildings sit flush on the ground
  const groundY = terrainH(x, z);

  return (
    <group position={[x, groundY, z]}>
      {/* Large ground shadow */}
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[shadowR, 48]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.07} />
      </mesh>

      {/* Entrance glow ring — pulses when player nearby */}
      <mesh ref={glowRef} rotation={[-Math.PI/2, 0, 0]} position={[0, 0.04, shadowR * 0.45]}>
        <ringGeometry args={[2.5, 3.8, 40]} />
        <meshBasicMaterial color={loc.color} transparent opacity={0} />
      </mesh>

      {/* Building geometry at 2.8× scale */}
      <group
        scale={BUILDING_SCALE}
        onPointerUp={e => { e.stopPropagation(); onEnter(loc.href, loc.label); }}
        onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
      >
        {ArchComp && <ArchComp hover={hovered} />}

        {/* ── Animated door — bottom at y=0 (world ground), taller than avatar ── */}
        {/* Door frame — 1.25w × 1.22h local = 3.5w × 3.41h world (1.6× avatar) */}
        <mesh position={[0, 0.61, 1.76]} castShadow>
          <boxGeometry args={[1.28, 1.22, 0.13, 2, 4, 1]} />
          <meshToonMaterial color={loc.doorColor} />
        </mesh>
        {/* Arch top of doorway */}
        <mesh position={[0, 1.28, 1.76]}>
          <cylinderGeometry args={[0.64, 0.64, 0.15, 28, 1, false, 0, Math.PI]} />
          <meshToonMaterial color={loc.doorColor} />
        </mesh>
        {/* Dark doorway opening */}
        <mesh position={[0, 0.61, 1.78]}>
          <boxGeometry args={[1.1, 1.18, 0.05, 1, 1, 1]} />
          <meshBasicMaterial color="#050810" />
        </mesh>
        {/* Hinge pivot at bottom-left of door — y=0 = ground level */}
        <group position={[-0.64, 0.0, 1.83]}>
          <group ref={doorRef}>
            {loc.doorType === 'glass' ? (
              /* Glass sliding door — frosted panes */
              <>
                <mesh position={[0.64, 0.59, 0.04]} castShadow>
                  <boxGeometry args={[1.28, 1.18, 0.04, 1, 1, 1]} />
                  <meshPhongMaterial color={loc.doorColor} transparent opacity={0.38} shininess={120} />
                </mesh>
                {/* Frame rails */}
                {[-0.6, 0.6].map((ox, i) => (
                  <mesh key={i} position={[0.64 + ox * 0.0, 0.59, 0.06]}>
                    <boxGeometry args={[0.06, 1.18, 0.04]} />
                    <meshToonMaterial color="#AABBCC" />
                  </mesh>
                ))}
              </>
            ) : loc.doorType === 'bamboo' ? (
              /* Bamboo shoji — vertical poles */
              <>
                <mesh position={[0.64, 0.59, 0.04]} castShadow>
                  <boxGeometry args={[1.28, 1.18, 0.04, 1, 1, 1]} />
                  <meshPhongMaterial color="#F5F0DC" transparent opacity={0.55} />
                </mesh>
                {[-0.44, -0.14, 0.14, 0.44].map((ox, i) => (
                  <mesh key={i} position={[0.64 + ox, 0.59, 0.07]}>
                    <cylinderGeometry args={[0.03, 0.03, 1.18, 10]} />
                    <meshToonMaterial color={loc.doorColor} />
                  </mesh>
                ))}
              </>
            ) : (
              /* Default solid door — cedar / marble / carved / brass / ebony / plank */
              <mesh position={[0.64, 0.59, 0.04]} castShadow>
                <boxGeometry args={[1.28, 1.18, 0.07, 2, 4, 1]} />
                <meshToonMaterial color={loc.doorColor} />
              </mesh>
            )}
            {/* Door handle */}
            <mesh position={[1.18, 0.59, 0.1]}>
              <sphereGeometry args={[0.07, 12, 10]} />
              <meshToonMaterial color="#D4A820" />
            </mesh>
            {/* Handle bar */}
            <mesh position={[1.18, 0.59, 0.12]} rotation={[0, 0, Math.PI/2]}>
              <cylinderGeometry args={[0.025, 0.025, 0.18, 18]} />
              <meshToonMaterial color="#D4A820" />
            </mesh>
          </group>
        </group>
        {/* Threshold / welcome mat */}
        <mesh position={[0, 0.01, 2.05]}>
          <boxGeometry args={[1.35, 0.04, 0.55, 2, 1, 1]} />
          <meshToonMaterial color="#8B6914" />
        </mesh>
      </group>

      {/* Hover ring at ground level */}
      {(hovered || isNear) && (
        <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.06, 0]}>
          <ringGeometry args={[shadowR - 0.6, shadowR + 0.4, 48]} />
          <meshBasicMaterial color={loc.color} transparent opacity={isNear ? 0.55 : 0.35} />
        </mesh>
      )}
    </group>
  );
}

// ─── Rain system ──────────────────────────────────────────────────────────────
function RainSystem({ intensity = 0, windAngle = 0 }: { intensity?: number; windAngle?: number }) {
  const ref    = useRef<THREE.InstancedMesh>(null);
  const COUNT  = 600;
  const drops  = useMemo(() => Array.from({ length: COUNT }, () => ({
    x: (Math.random() - 0.5) * 50, y: Math.random() * 20 + 2,
    z: (Math.random() - 0.5) * 50, speed: 8 + Math.random() * 6, phase: Math.random() * 20,
  })), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(state => {
    if (!ref.current || intensity < 0.1) return;
    const t = state.clock.elapsedTime;
    const wx = Math.sin(windAngle) * intensity * 0.4;
    const wz = Math.cos(windAngle) * intensity * 0.2;
    const active = Math.floor(intensity * COUNT);
    drops.forEach((d, i) => {
      if (i >= active) { dummy.scale.setScalar(0); dummy.updateMatrix(); ref.current!.setMatrixAt(i, dummy.matrix); return; }
      const elapsed = (t * d.speed + d.phase) % 22;
      dummy.position.set(d.x + wx * elapsed, d.y - elapsed, d.z + wz * elapsed);
      dummy.scale.set(1, 1, 1);
      dummy.rotation.set(intensity * 0.3, 0, -windAngle * 0.25);
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
    (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.25 + intensity * 0.35;
  });

  if (intensity < 0.1) return null;
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, COUNT]}>
      <capsuleGeometry args={[0.015, 0.28, 3, 8]} />
      <meshBasicMaterial color="#C8E8FF" transparent opacity={0.4} />
    </instancedMesh>
  );
}

// ─── Wind-blown leaf/debris particles ─────────────────────────────────────────
function WindParticles({ windStrength = 0, windAngle = 0 }: { windStrength?: number; windAngle?: number }) {
  const ref    = useRef<THREE.InstancedMesh>(null);
  const COUNT  = 80;
  const parts  = useMemo(() => Array.from({ length: COUNT }, () => ({
    x: (Math.random() - 0.5) * 40, y: 0.3 + Math.random() * 4,
    z: (Math.random() - 0.5) * 40, speed: 0.5 + Math.random() * 2,
    phase: Math.random() * 20, tumble: Math.random() * Math.PI * 2,
  })), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(state => {
    if (!ref.current) return;
    const t  = state.clock.elapsedTime;
    const wx = Math.sin(windAngle) * windStrength * 3;
    const wz = Math.cos(windAngle) * windStrength * 1.5;
    const active = Math.floor(windStrength * COUNT);
    parts.forEach((p, i) => {
      if (i >= active) { dummy.scale.setScalar(0); dummy.updateMatrix(); ref.current!.setMatrixAt(i, dummy.matrix); return; }
      const elapsed = (t * p.speed + p.phase) % 30;
      dummy.position.set(((p.x + wx * elapsed) % 40) - 20, p.y + Math.sin(elapsed + p.tumble) * 0.5, ((p.z + wz * elapsed) % 40) - 20);
      dummy.rotation.set(elapsed * 2, elapsed * 3, elapsed);
      dummy.scale.setScalar(0.06 + Math.random() * 0.06);
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, COUNT]}>
      <planeGeometry args={[1, 1]} />
      <meshToonMaterial color="#6B8C2A" transparent opacity={0.7} />
    </instancedMesh>
  );
}

// ─── Ground pointer — invisible plane captures pointer drag for move-to-click ─
function GroundPointer({ pointerTarget }: { pointerTarget: React.MutableRefObject<{ x: number; z: number } | null> }) {
  const dragging = useRef(false);
  const downPos  = useRef({ x: 0, y: 0 });

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.05, 0]}
      visible={false}
      onPointerDown={e => {
        dragging.current = true;
        downPos.current = { x: e.clientX, y: e.clientY };
        e.stopPropagation();
      }}
      onPointerMove={e => {
        if (!dragging.current) return;
        // Only move if dragged more than 8px (distinguish from click-on-building)
        const dx = e.clientX - downPos.current.x;
        const dy = e.clientY - downPos.current.y;
        if (Math.sqrt(dx * dx + dy * dy) > 8) {
          pointerTarget.current = { x: e.point.x, z: e.point.z };
        }
      }}
      onPointerUp={e => {
        dragging.current = false;
        const dx = e.clientX - downPos.current.x;
        const dy = e.clientY - downPos.current.y;
        // Short tap (< 8px) = single click — set target once for click-to-walk
        if (Math.sqrt(dx * dx + dy * dy) < 8) {
          pointerTarget.current = { x: e.point.x, z: e.point.z };
        }
      }}
      onPointerLeave={() => { dragging.current = false; }}
    >
      <planeGeometry args={[200, 200]} />
      <meshBasicMaterial />
    </mesh>
  );
}

function CameraFollow({
  targetPos, cameraZoom, cameraAzimuth,
}: {
  targetPos: React.MutableRefObject<THREE.Vector3>;
  cameraZoom: React.MutableRefObject<number>;
  cameraAzimuth: React.MutableRefObject<number>;
}) {
  const { camera, gl } = useThree();
  const lerpedLook   = useRef(new THREE.Vector3());
  const smoothedZoom = useRef(cameraZoom.current);

  // Mouse wheel zoom (desktop)
  useEffect(() => {
    const canvas = gl.domElement;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Scrolling down (deltaY > 0) = zoom out (increase distance)
      cameraZoom.current = Math.max(6, Math.min(36, cameraZoom.current + e.deltaY * 0.02));
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [gl.domElement, cameraZoom]);

  useFrame(() => {
    // Smooth the zoom so it eases rather than snapping
    smoothedZoom.current = THREE.MathUtils.lerp(smoothedZoom.current, cameraZoom.current, 0.1);

    const dist = smoothedZoom.current;
    const az   = cameraAzimuth.current;
    const offset = new THREE.Vector3(
      Math.sin(az) * dist,
      dist * 0.58,
      Math.cos(az) * dist,
    );
    const target = targetPos.current.clone().add(offset);
    camera.position.lerp(target, 0.08);
    lerpedLook.current.lerp(targetPos.current.clone().add(new THREE.Vector3(0, 1, 0)), 0.1);
    camera.lookAt(lerpedLook.current);
  });
  return null;
}

// ─── Scene lighting that responds to sky state ────────────────────────────────
function SceneLighting({ skyState }: { skyState: any }) {
  const sunRef  = useRef<THREE.DirectionalLight>(null);
  const fillRef = useRef<THREE.DirectionalLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);

  const isNight  = skyState?.phase === 'night' || skyState?.phase === 'dusk' || skyState?.phase === 'dawn';
  const isGolden = skyState?.phase === 'golden' || skyState?.phase === 'sunset';

  // Night minimum: enough light to see the whole village clearly
  const NIGHT_AMBIENT_MIN = 0.55;

  useFrame(() => {
    if (!skyState) return;
    const [sx, sy, sz] = sunPosFromAngles(skyState.sunAltitude, skyState.sunAzimuth, 60);
    const amb = skyState.ambientIntensity ?? 0.65;

    if (sunRef.current) {
      sunRef.current.position.set(sx, Math.max(sy, 2), sz);
      // Night: moonlight keeps a visible minimum
      sunRef.current.intensity = isNight
        ? Math.max(NIGHT_AMBIENT_MIN * 0.8, amb * 1.4)
        : Math.max(0.1, amb * 2.2);
      sunRef.current.color.set(isNight ? '#B0C8FF' : (skyState.sunColor ?? '#FFF5D0'));
    }
    if (fillRef.current) {
      fillRef.current.position.set(-sx * 0.6, Math.max(sy * 0.7, 6), -sz * 0.6);
      fillRef.current.intensity = isNight
        ? Math.max(NIGHT_AMBIENT_MIN * 0.6, amb * 0.5)
        : Math.max(0.02, amb * 0.5);
      fillRef.current.color.set(isNight ? '#5070C8' : isGolden ? '#FF9944' : '#BDE0FF');
    }
    if (hemiRef.current) {
      // Night: bright enough to see terrain, buildings, avatars
      hemiRef.current.intensity = isNight
        ? Math.max(NIGHT_AMBIENT_MIN, amb * 0.75)
        : Math.max(0.25, amb * 0.75);
      (hemiRef.current as any).color.set(isNight ? '#3A4E80' : isGolden ? '#FF8833' : '#7BBFDC');
      (hemiRef.current as any).groundColor.set(isNight ? '#1E2A40' : '#3D5A25');
    }
  });

  const initPos = sunPosFromAngles(skyState?.sunAltitude ?? 45, skyState?.sunAzimuth ?? 180, 60);
  const amb0    = skyState?.ambientIntensity ?? 0.65;

  return (
    <>
      {/* Hemisphere — main ambient fill, brighter at night for visibility */}
      <hemisphereLight
        ref={hemiRef}
        args={[
          isNight ? '#3A4E80' : '#7BBFDC',
          isNight ? '#1E2A40' : '#3D5A25',
          isNight ? NIGHT_AMBIENT_MIN : amb0 * 0.75,
        ]}
      />

      {/* Primary directional — sun by day, moon by night */}
      <directionalLight
        ref={sunRef}
        position={initPos}
        intensity={isNight ? NIGHT_AMBIENT_MIN * 0.8 : Math.max(0.1, amb0 * 2.2)}
        color={isNight ? '#B0C8FF' : (skyState?.sunColor ?? '#FFF5D0')}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={90}
        shadow-camera-left={-55}
        shadow-camera-right={55}
        shadow-camera-top={55}
        shadow-camera-bottom={-55}
        shadow-bias={-0.0003}
        shadow-normalBias={0.02}
      />

      {/* Fill — opposite side, cool tone */}
      <directionalLight
        ref={fillRef}
        position={[-15, 18, 10]}
        intensity={isNight ? NIGHT_AMBIENT_MIN * 0.55 : amb0 * 0.45}
        color={isNight ? '#5070C8' : '#BDE0FF'}
      />

      {/* Ground bounce — keeps undersides visible */}
      <directionalLight
        position={[0, -10, 0]}
        intensity={isNight ? 0.22 : 0.1}
        color={isNight ? '#2A3A60' : '#D0C898'}
      />

      {/* Sacred fire — warm central glow */}
      <pointLight
        position={[0, 1.8, 0]}
        intensity={isNight ? 4.0 : 1.2}
        color="#FF7020"
        distance={18}
        decay={2}
        castShadow={false}
      />

      {/* Village accent lights — give depth/warmth to each quadrant */}
      <pointLight position={[-9, 1.5, -5]}  intensity={isNight ? 2.2 : 0.18} color="#4488FF" distance={18} decay={2} />
      <pointLight position={[ 9, 1.5, -5]}  intensity={isNight ? 1.8 : 0.14} color="#8855FF" distance={18} decay={2} />
      <pointLight position={[-9, 1.5,  5]}  intensity={isNight ? 1.6 : 0.12} color="#44FFBB" distance={18} decay={2} />
      <pointLight position={[ 9, 1.5,  5]}  intensity={isNight ? 2.0 : 0.15} color="#FFB040" distance={18} decay={2} />

      {/* Moonlight — strong cool backlight illuminates the whole scene */}
      {isNight && (
        <>
          <directionalLight position={[-22, 28, -22]} intensity={0.85} color="#C0D4FF" />
          <directionalLight position={[22, 20, 22]}   intensity={0.45} color="#A0B8E8" />
        </>
      )}

      {/* General ambient floor — always-on fill so nothing is pitch black */}
      <ambientLight intensity={isNight ? 0.45 : 0.12} color={isNight ? '#2A3A58' : '#F0F0FF'} />
    </>
  );
}

// ─── Helpers to classify model behavior ─────────────────────────────────────
const ANIMAL_KEYWORDS = /wolf|deer|bear|chicken|cat|dog|horse|rabbit|fox|sheep|pig|monkey|crocodile|bird|butterfly|alligator|bee|crab|duck|eagle|frog|peacock|snake|spider|stork|turkey|fish|cow|boar|rat|elk|bison/i;
const CHARACTER_KEYWORDS = /casual|worker|doctor|kimono|witch|wizard|zombie|mage|knight|rogue|paladin|archer|berserker|cleric|warrior|warden|musketeer|druid|jester|bard|assassin|ranger/i;

function isTile(url: string)      { return url.endsWith('.tile'); }
function isAnimal(url: string)    { return ANIMAL_KEYWORDS.test(url); }
function isCharacter(url: string) { return CHARACTER_KEYWORDS.test(url); }

const TILE_COLORS: Record<string, { color: string; emissive?: string; opacity?: number }> = {
  'grass.tile':  { color: '#5A9A2A' },
  'dirt.tile':   { color: '#8B6332' },
  'sand.tile':   { color: '#D4A96A' },
  'stone.tile':  { color: '#9B9B9B' },
  'water.tile':  { color: '#1E90FF', emissive: '#0050A0', opacity: 0.78 },
  'mud.tile':    { color: '#5C4033' },
  'snow.tile':   { color: '#E8F4FF', emissive: '#A0C8FF' },
};

// ─── Ground tile — flat colored plane, no GLTF ───────────────────────────────
function GroundTileModel({ obj }: { obj: AdminObj }) {
  const tileKey = obj.model_url.split('/').pop() ?? '';
  const { color, emissive, opacity = 1 } = TILE_COLORS[tileKey] ?? { color: '#888' };
  const waveRef = useRef<THREE.Mesh>(null);
  const isWater = tileKey === 'water.tile';
  useFrame(({ clock }) => {
    if (isWater && waveRef.current) {
      const mat = waveRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.4 + Math.sin(clock.elapsedTime * 1.8) * 0.15;
    }
  });
  const baseY = terrainH(obj.pos_x, obj.pos_z) + (obj.elevation ?? 0) - 0.02;
  const sz = obj.scale * 4;
  return (
    <mesh ref={waveRef} position={[obj.pos_x, baseY, obj.pos_z]} rotation={[-Math.PI/2, 0, 0]} receiveShadow>
      <planeGeometry args={[sz, sz, 1, 1]} />
      <meshStandardMaterial
        color={color}
        emissive={emissive ?? color}
        emissiveIntensity={isWater ? 0.4 : 0}
        roughness={isWater ? 0.05 : 0.95}
        metalness={isWater ? 0.3 : 0}
        transparent={opacity < 1}
        opacity={opacity}
      />
    </mesh>
  );
}

// ─── Static GLTF model ────────────────────────────────────────────────────────
function StaticModel({ obj }: { obj: AdminObj }) {
  const { scene } = useGLTF(obj.model_url);
  const clone = useMemo(() => {
    const c = scene.clone(true);
    c.traverse(ch => {
      if ((ch as THREE.Mesh).isMesh) {
        (ch as THREE.Mesh).castShadow = true;
        (ch as THREE.Mesh).receiveShadow = true;
      }
    });
    return c;
  }, [scene]);
  const baseY = terrainH(obj.pos_x, obj.pos_z) + (obj.elevation ?? 0);
  return <primitive object={clone} position={[obj.pos_x, baseY, obj.pos_z]} rotation={[0, obj.rot_y, 0]} scale={obj.scale} />;
}

// ─── Animal model — roams within a radius of placed position ─────────────────
// Uses deterministic seed from obj.id so roaming is stable across renders
function seededRand(seed: string, n: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  return Math.abs(((h ^ (h >>> 15)) * 0x85ebca6b ^ ((h ^ (h >>> 15)) >>> 13)) % 10000) / 10000 * n;
}

function AnimalModel({ obj }: { obj: AdminObj }) {
  const { scene, animations } = useGLTF(obj.model_url);
  const groupRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const targetRef = useRef<THREE.Vector3>(new THREE.Vector3(obj.pos_x, 0, obj.pos_z));
  const timerRef  = useRef(seededRand(obj.id + 't', 5));
  const ROAM_R    = 8;
  const SPEED     = 0.015 + seededRand(obj.id + 's', 0.01);

  const clone = useMemo(() => {
    const c = scene.clone(true);
    c.traverse(ch => { if ((ch as THREE.Mesh).isMesh) { (ch as THREE.Mesh).castShadow = true; } });
    return c;
  }, [scene]);

  useEffect(() => {
    if (!animations?.length) return;
    const mixer = new THREE.AnimationMixer(clone);
    mixerRef.current = mixer;
    const walk = animations.find(a => /walk|run|move/i.test(a.name)) ?? animations[0];
    if (walk) mixer.clipAction(walk).play();
    return () => mixer.stopAllAction();
  }, [animations, clone]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    timerRef.current -= delta;
    if (timerRef.current <= 0) {
      const seed = obj.id + timerRef.current.toString();
      const angle = seededRand(seed + 'a', Math.PI * 2);
      const r     = seededRand(seed + 'r', ROAM_R);
      targetRef.current.set(
        obj.pos_x + Math.cos(angle) * r,
        0,
        obj.pos_z + Math.sin(angle) * r
      );
      timerRef.current = 3 + seededRand(seed + 'd', 6);
    }
    const pos = groupRef.current.position;
    const tx = targetRef.current.x, tz = targetRef.current.z;
    const dx = tx - pos.x, dz = tz - pos.z;
    const dist = Math.sqrt(dx*dx + dz*dz);
    if (dist > 0.3) {
      const nx = pos.x + (dx/dist)*SPEED;
      const nz = pos.z + (dz/dist)*SPEED;
      groupRef.current.position.set(nx, terrainH(nx, nz) + (obj.elevation ?? 0), nz);
      groupRef.current.rotation.y = Math.atan2(dx, dz);
    }
    mixerRef.current?.update(delta);
  });

  return <group ref={groupRef} position={[obj.pos_x, terrainH(obj.pos_x, obj.pos_z), obj.pos_z]} scale={obj.scale}><primitive object={clone} /></group>;
}

// ─── NPC/Character model — stands, breathes, slowly looks around ─────────────
function NPCModel({ obj }: { obj: AdminObj }) {
  const { scene, animations } = useGLTF(obj.model_url);
  const groupRef   = useRef<THREE.Group>(null);
  const headRef    = useRef<THREE.Object3D | null>(null);
  const mixerRef   = useRef<THREE.AnimationMixer | null>(null);
  const phaseRef   = useRef(seededRand(obj.id, Math.PI * 2));

  const clone = useMemo(() => {
    const c = scene.clone(true);
    c.traverse(ch => {
      if ((ch as THREE.Mesh).isMesh) { (ch as THREE.Mesh).castShadow = true; }
      if (ch.name && /head|neck/i.test(ch.name)) headRef.current = ch;
    });
    return c;
  }, [scene]);

  useEffect(() => {
    if (!animations?.length) return;
    const mixer = new THREE.AnimationMixer(clone);
    mixerRef.current = mixer;
    const idle = animations.find(a => /idle|stand|breath/i.test(a.name)) ?? animations[0];
    if (idle) mixer.clipAction(idle).play();
    return () => mixer.stopAllAction();
  }, [animations, clone]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + phaseRef.current;
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 0.4) * 0.35;
      headRef.current.rotation.x = Math.sin(t * 0.25) * 0.08;
    }
    if (groupRef.current) {
      groupRef.current.position.y = terrainH(obj.pos_x, obj.pos_z) + (obj.elevation ?? 0) + Math.sin(t * 0.9) * 0.008;
    }
    mixerRef.current?.update(0.016);
  });

  const baseY = terrainH(obj.pos_x, obj.pos_z) + (obj.elevation ?? 0);
  return <group ref={groupRef} position={[obj.pos_x, baseY, obj.pos_z]} rotation={[0, obj.rot_y, 0]} scale={obj.scale}><primitive object={clone} /></group>;
}

// ─── Path-following model — loops along admin-defined trail_points ────────────
function PathModel({ obj }: { obj: AdminObj }) {
  const { scene, animations } = useGLTF(obj.model_url);
  const groupRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const tRef     = useRef(0);
  const SPEED    = 0.008;

  const clone = useMemo(() => {
    const c = scene.clone(true);
    c.traverse(ch => { if ((ch as THREE.Mesh).isMesh) (ch as THREE.Mesh).castShadow = true; });
    return c;
  }, [scene]);

  const points = useMemo(() =>
    (obj.trail_points ?? []).map(([x, z]) => new THREE.Vector3(x, terrainH(x, z), z)),
  [obj.trail_points]);

  useEffect(() => {
    if (!animations?.length) return;
    const mixer = new THREE.AnimationMixer(clone);
    mixerRef.current = mixer;
    const walk = animations.find(a => /walk|run/i.test(a.name)) ?? animations[0];
    if (walk) mixer.clipAction(walk).play();
    return () => mixer.stopAllAction();
  }, [animations, clone]);

  useFrame((_, delta) => {
    if (!groupRef.current || points.length < 2) return;
    tRef.current = (tRef.current + SPEED) % 1;
    const totalSegs = points.length - 1;
    const fullT = tRef.current * totalSegs;
    const segIdx = Math.floor(fullT);
    const segT   = fullT - segIdx;
    const a = points[Math.min(segIdx, totalSegs - 1)];
    const b = points[Math.min(segIdx + 1, totalSegs)];
    const pos = a.clone().lerp(b, segT);
    groupRef.current.position.copy(pos);
    groupRef.current.rotation.y = Math.atan2(b.x - a.x, b.z - a.z);
    mixerRef.current?.update(delta);
  });

  const baseY = terrainH(obj.pos_x, obj.pos_z) + (obj.elevation ?? 0);
  return <group ref={groupRef} position={[obj.pos_x, baseY, obj.pos_z]} scale={obj.scale}><primitive object={clone} /></group>;
}

// ─── Dispatcher — picks the right renderer per object ────────────────────────
function AdminModelDispatcher({ obj }: { obj: AdminObj }) {
  if (isTile(obj.model_url)) return <GroundTileModel obj={obj} />;
  const hasPath = Array.isArray(obj.trail_points) && (obj.trail_points?.length ?? 0) >= 2;
  if (hasPath)              return <PathModel obj={obj} />;
  if (isAnimal(obj.model_url))    return <AnimalModel obj={obj} />;
  if (isCharacter(obj.model_url)) return <NPCModel obj={obj} />;
  return <StaticModel obj={obj} />;
}

function LiveAdminObjects({
  playerPos,
  onInteract,
}: {
  playerPos:  React.MutableRefObject<THREE.Vector3>;
  onInteract: (obj: AdminObj) => void;
}) {
  const [objects, setObjects] = useState<AdminObj[]>([]);
  // Track which sounds are currently playing: id → HTMLAudioElement
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('admin_world_objects')
      .select('id,model_url,label,world_name,pos_x,pos_y,pos_z,rot_y,scale,elevation,behavior,linked_page,dialog_title,dialog_content,iframe_url,transport_target,trigger_type,trigger_distance,sound_url,sound_volume,sound_trigger_dist,sound_max_dist,sound_loop,item_info_enabled,trail_passable,trail_points')
      .eq('is_live', true)
      .then(({ data, error }) => {
        if (!error && data) {
          setObjects(data as AdminObj[]);
          liveAdminObjectsRef.current = data as AdminObj[];
        }
      });
  }, []);

  // Track which objects the player has already triggered (approach) this proximity visit
  const triggeredApproach = useRef<Set<string>>(new Set());

  useFrame(() => {
    const px = playerPos.current.x;
    const pz = playerPos.current.z;

    objects.forEach(obj => {
      const dx = px - obj.pos_x;
      const dz = pz - obj.pos_z;
      const dist = Math.sqrt(dx*dx + dz*dz);

      // ── Spatial audio ──────────────────────────────────────────────────────
      if (obj.sound_url) {
        const audio = audioRefs.current.get(obj.id);
        const inRange = dist <= obj.sound_trigger_dist;

        if (inRange) {
          if (!audio) {
            const el = new Audio(obj.sound_url);
            el.loop = obj.sound_loop;
            el.volume = 0;
            el.play().catch(() => {});
            audioRefs.current.set(obj.id, el);
          } else {
            // Linear fade: max volume at sound_max_dist, 0 at trigger_dist
            const t = Math.max(0, Math.min(1, 1 - (dist - obj.sound_max_dist) / (obj.sound_trigger_dist - obj.sound_max_dist)));
            audio.volume = Math.min(1, obj.sound_volume * t);
          }
        } else if (audio) {
          audio.volume = 0;
          audio.pause();
          audioRefs.current.delete(obj.id);
        }
      }

      // ── Approach trigger ──────────────────────────────────────────────────
      if ((obj.trigger_type === 'approach' || obj.trigger_type === 'both') &&
          obj.behavior !== 'none' && obj.behavior !== 'sound_zone') {
        const trigDist = obj.trigger_distance ?? 5;
        if (dist < trigDist && !triggeredApproach.current.has(obj.id)) {
          triggeredApproach.current.add(obj.id);
          onInteract(obj);
        } else if (dist >= trigDist + 2) {
          triggeredApproach.current.delete(obj.id); // reset when they walk away
        }
      }
    });
  });

  // Stop all audio on unmount
  useEffect(() => () => {
    audioRefs.current.forEach(a => { a.pause(); a.src = ''; });
  }, []);

  return (
    <Suspense fallback={null}>
      {objects.map(obj => (
        <group
          key={obj.id}
          onClick={(e: ThreeEvent<MouseEvent>) => {
            if (obj.trigger_type === 'click' || obj.trigger_type === 'both') {
              if (obj.behavior !== 'none' && obj.behavior !== 'sound_zone') {
                e.stopPropagation();
                onInteract(obj);
              }
            }
          }}
        >
          <AdminModelDispatcher obj={obj} />
        </group>
      ))}
    </Suspense>
  );
}

// ─── Main scene ───────────────────────────────────────────────────────────────
interface RemotePlayer {
  userId: string;
  username: string;
  x: number;
  y: number;
  z: number;
  rotation: number;
  skinColor: string;
}

function WorldScene({
  playerPos, playerRot, isMoving, remotePlayers, onEnterBuilding, skyState, spiritVariant,
  cameraZoom, cameraAzimuth, weather, nearBuildingId,
  avatarDivRef, spiritDivRef, onAvatarTap, onSpiritTap, pointerTarget,
  tribeMembers, onTribeMemberClick, onAdminObjectInteract,
  playerAvatarCfg, playerSkinColor, playerHairColor, playerShirtColor,
}: {
  playerPos: React.MutableRefObject<THREE.Vector3>;
  playerRot: React.MutableRefObject<number>;
  isMoving: React.MutableRefObject<boolean>;
  remotePlayers: RemotePlayer[];
  onEnterBuilding: (href: string, label: string) => void;
  onAdminObjectInteract: (obj: AdminObj) => void;
  skyState: any;
  spiritVariant: SpiritVariantId;
  cameraZoom: React.MutableRefObject<number>;
  cameraAzimuth: React.MutableRefObject<number>;
  weather?: { rain?: number; wind?: number; windAngle?: number };
  nearBuildingId: string | null;
  avatarDivRef: React.MutableRefObject<HTMLDivElement | null>;
  spiritDivRef: React.MutableRefObject<HTMLDivElement | null>;
  onAvatarTap: () => void;
  onSpiritTap: () => void;
  pointerTarget: React.MutableRefObject<{ x: number; z: number } | null>;
  tribeMembers?: TribeMember[];
  onTribeMemberClick?: (member: TribeMember, screenX: number, screenY: number) => void;
  playerAvatarCfg?: AvatarConfig;
  playerSkinColor?: string;
  playerHairColor?: string;
  playerShirtColor?: string;
}) {
  const isNight = skyState?.phase === 'night' || skyState?.phase === 'dusk' || skyState?.phase === 'dawn';
  const starsVisible = skyState?.phase === 'night' || skyState?.phase === 'dawn';
  const rainIntensity  = weather?.rain  ?? 0;
  const windStrength   = weather?.wind  ?? 0;
  const windAngle      = weather?.windAngle ?? 0;
  const season = useSeason();

  return (
    <>
      {/* Lighting */}
      <SceneLighting skyState={skyState} />

      {/* Sky dome */}
      <SkyDome
        skyTop={skyState?.skyTop ?? '#1E6FC8'}
        skyMid={skyState?.skyMid ?? '#4A90D9'}
        skyHor={skyState?.skyHor ?? '#87CEEB'}
      />

      {/* Stars */}
      <Stars visible={starsVisible} />

      {/* Sun / Moon */}
      <CelestialBody
        phase={skyState?.phase ?? 'morning'}
        altitude={skyState?.sunAltitude ?? 45}
        azimuth={skyState?.sunAzimuth ?? 180}
        sunColor={skyState?.sunColor ?? '#FFF5D0'}
      />

      {/* Atmospheric fog — forest mist + rain visibility */}
      <fog attach="fog" args={[
        isNight ? '#0A1218' : (rainIntensity > 0.3 ? '#A8B8C8' : '#C8E4D0'),
        rainIntensity > 0.5 ? 14 : isNight ? 28 : 38,
        rainIntensity > 0.5 ? 40 : isNight ? 80 : 100,
      ]} />

      {/* ── Terrain: grass island + ocean ring ────────────────────────── */}
      <VillageTerrain isNight={isNight} season={season.season} />
      <CoastalOcean isNight={isNight} skyState={skyState} />

      {/* ── Subtle grass ground cover ────────────────────────────────── */}
      <DenseGrass windStr={windStrength} />

      {/* ── Live weather particles ────────────────────────────────────── */}
      <RainSystem intensity={rainIntensity} windAngle={windAngle} />
      {windStrength > 0.2 && <WindParticles windStrength={windStrength} windAngle={windAngle} />}
      <SeasonalWeatherSystem season={season} />

      {/* ── Everything else comes from the World Builder ─────────────── */}
      <LiveAdminObjects playerPos={playerPos} onInteract={onAdminObjectInteract} />

      {/* Remote players (realtime presence) */}
      {remotePlayers.map(p => (
        <PlayerCharacter key={p.userId}
          position={new THREE.Vector3(p.x, terrainH(p.x, p.z), p.z)}
          rotation={p.rotation}
          skinColor={p.skinColor}
          isLocal={false}
          username={p.username}
        />
      ))}

      {/* Tribe member persistent avatars — click to interact */}
      {tribeMembers?.map((m, i) => {
        // Scatter tribe members in a ring around the village center
        const angle = (i / Math.max(tribeMembers.length, 1)) * Math.PI * 2;
        const r     = 8 + (i % 3) * 3;
        const tx    = Math.cos(angle) * r;
        const tz    = Math.sin(angle) * r;
        const ty    = terrainH(tx, tz);
        return (
          <group
            key={m.userId}
            onPointerUp={e => {
              e.stopPropagation();
              // Project 3D position to screen coords is handled by the click event
              // Use clientX/clientY from the pointer event
              onTribeMemberClick?.(m, (e as any).clientX ?? 200, (e as any).clientY ?? 200);
            }}
          >
            <PlayerCharacter
              position={new THREE.Vector3(tx, ty, tz)}
              skinColor={m.skinColor ?? '#8D5524'}
              isLocal={false}
              username={m.username}
            />
            {/* Name label indicator — small glowing ring above head */}
            <mesh position={[tx, ty + 2.4, tz]}>
              <torusGeometry args={[0.22, 0.035, 8, 24]} />
              <meshBasicMaterial color="#7C3AED" transparent opacity={0.7} />
            </mesh>
          </group>
        );
      })}

      {/* Ground hit plane — drag/tap to walk there */}
      <GroundPointer pointerTarget={pointerTarget} />

      {/* Local player — tap to open crescent menu */}
      <group onPointerUp={e => { e.stopPropagation(); onAvatarTap(); }}>
        <PlayerCharacter
          position={playerPos.current}
          rotation={playerRot.current}
          posRef={playerPos}
          rotRef={playerRot}
          avatarConfig={playerAvatarCfg}
          skinColor={playerSkinColor ?? '#A86030'}
          hairColor={playerHairColor ?? '#0C0700'}
          shirtColor={playerShirtColor ?? '#2563EB'}
          isLocal={true}
          isMovingRef={isMoving}
        />
      </group>

      {/* Spirit companion */}
      <SpiritCompanion playerPos={playerPos} spiritVariant={spiritVariant} onTap={onSpiritTap} />

      {/* Camera follow */}
      <CameraFollow targetPos={playerPos} cameraZoom={cameraZoom} cameraAzimuth={cameraAzimuth} />

      {/* HUDBridge — projects screen positions for DOM overlays */}
      <HUDBridge playerPos={playerPos} avatarDivRef={avatarDivRef} spiritDivRef={spiritDivRef} />
    </>
  );
}

// ─── Virtual joystick (mobile) ────────────────────────────────────────────────
// ─── Spirit companion — small, follows player, luminescent glow ───────────────
function SpiritCompanion({
  playerPos, spiritVariant, onTap,
}: {
  playerPos: React.MutableRefObject<THREE.Vector3>;
  spiritVariant: SpiritVariantId;
  onTap: () => void;
}) {
  const groupRef   = useRef<THREE.Group>(null);
  const glowRef    = useRef<THREE.Mesh>(null);
  const floatPhase = useRef(Math.random() * Math.PI * 2);
  const glowColorRef = useRef('#60A5FA');

  useEffect(() => {
    const saved = localStorage.getItem('spirit_glow_color');
    if (saved) {
      glowColorRef.current = saved;
      if (glowRef.current) {
        (glowRef.current.material as THREE.MeshBasicMaterial).color.set(saved);
      }
    }
  }, []);

  useFrame(state => {
    if (!groupRef.current) return;
    const t   = state.clock.elapsedTime;
    const ph  = floatPhase.current;

    const targetX = playerPos.current.x - Math.sin(playerPos.current.x * 0.05 + t * 0.3) * 1.5;
    const targetZ = playerPos.current.z + 2.2;
    const targetY = 1.8 + Math.sin(t * 0.9 + ph) * 0.18;

    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 0.04);
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.06);
    groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ, 0.04);
    groupRef.current.rotation.y = t * 0.4;

    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.15 + Math.sin(t * 1.6 + ph) * 0.08;
      glowRef.current.scale.setScalar(1 + Math.sin(t * 1.2) * 0.06);
    }
  });

  return (
    <group
      ref={groupRef}
      position={[playerPos.current.x, 1.8, playerPos.current.z + 2.2]}
      onPointerUp={e => { e.stopPropagation(); onTap(); }}
    >
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.55, 24, 18]} />
        <meshBasicMaterial color={glowColorRef.current} transparent opacity={0.15} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.45, 0.06, 10, 32]} />
        <meshBasicMaterial color="#7C3AED" transparent opacity={0.35} />
      </mesh>
      <group scale={0.55}>
        <SpiritFigure variant={spiritVariant} scale={1} index={0} />
      </group>
    </group>
  );
}

// ─── Mountain with waterfall — northwest of village, Zen Garden on plateau ────
// Mountain center at [-48, 0, -30]. Peak at y≈22.
// Waterfall flows down east face into the moat (moat at r=31 from origin).
// The Zen Garden LOCATION is at [-34, 0, -8] — it sits on the mountain's
// eastern foothills plateau, which are raised in the terrain.
function MountainWithWaterfall({ isNight }: { isNight: boolean }) {
  const dropRef = useRef<THREE.InstancedMesh>(null);
  const mistRef = useRef<THREE.InstancedMesh>(null);

  // Waterfall drops: 120 particles falling from peak down east face into moat
  const dropData = useMemo(() => Array.from({ length: 120 }, (_, i) => ({
    ox:    (Math.random() - 0.5) * 1.4,
    speed: 5 + Math.random() * 4,
    phase: Math.random() * 20,
    s:     0.04 + Math.random() * 0.1,
  })), []);

  const FALL_H = 22; // waterfall drop height (peak y to moat level)

  useFrame(({ clock }) => {
    if (!dropRef.current) return;
    const t     = clock.elapsedTime;
    const dummy = new THREE.Object3D();

    dropData.forEach((d, i) => {
      const frac = ((t * d.speed + d.phase) % FALL_H);
      const y    = FALL_H - frac;
      // Waterfall curves slightly east as it falls
      const zOff = frac * 0.28;
      dummy.position.set(-48 + d.ox + frac * 0.12, y, -30 + 6 + zOff);
      dummy.scale.setScalar(d.s * (0.5 + 0.5 * (1 - y / FALL_H)));
      dummy.updateMatrix();
      dropRef.current!.setMatrixAt(i, dummy.matrix);
    });
    dropRef.current.instanceMatrix.needsUpdate = true;

    if (!mistRef.current) return;
    const md = new THREE.Object3D();
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      const r = 1.2 + Math.sin(t * 0.7 + i) * 0.5;
      md.position.set(-48 + Math.cos(a) * r * 0.6, 0.5 + Math.sin(t * 0.5 + i) * 0.3, -24 + Math.sin(a) * r);
      md.scale.setScalar(0.6 + Math.sin(t * 0.4 + i) * 0.2);
      md.updateMatrix();
      mistRef.current.setMatrixAt(i, md.matrix);
    }
    mistRef.current.instanceMatrix.needsUpdate = true;
  });

  const rock1 = isNight ? '#1E1C24' : '#5A5560';
  const rock2 = isNight ? '#282430' : '#6B6572';
  const rock3 = isNight ? '#2E2838' : '#7A7080';
  const snow  = isNight ? '#C0C8F8' : '#F5F8FF';
  const wCol  = isNight ? '#2A4A78' : '#50A0D8';
  const grass = isNight ? '#1C2C1A' : '#3A6828';

  return (
    <group>
      {/* ── MOUNTAIN — centered at [-48, 0, -30] ── */}
      <group position={[-48, 0, -30]}>

        {/* Sprawling base — wide foothills */}
        <mesh position={[0, 0, 0]} castShadow>
          <coneGeometry args={[22, 8, 32, 3]} />
          <meshToonMaterial color={grass} />
        </mesh>
        {/* Rock base layer */}
        <mesh position={[0, 4, 0]} castShadow>
          <coneGeometry args={[16, 10, 30, 3]} />
          <meshToonMaterial color={rock1} />
        </mesh>
        {/* Mid body */}
        <mesh position={[0, 10, 0]} castShadow>
          <coneGeometry args={[11, 11, 28, 3]} />
          <meshToonMaterial color={rock2} />
        </mesh>
        {/* Upper peak */}
        <mesh position={[0, 17, 0]} castShadow>
          <coneGeometry args={[7, 10, 26, 3]} />
          <meshToonMaterial color={rock3} />
        </mesh>
        {/* Near-peak */}
        <mesh position={[0, 22, 0]} castShadow>
          <coneGeometry args={[4, 6, 24, 2]} />
          <meshToonMaterial color={rock3} />
        </mesh>
        {/* Snow cap — dramatic */}
        <mesh position={[0, 26, 0]} castShadow>
          <coneGeometry args={[2.8, 5, 22, 2]} />
          <meshToonMaterial color={snow} />
        </mesh>
        <mesh position={[0, 29, 0]}>
          <sphereGeometry args={[1.6, 18, 14]} />
          <meshToonMaterial color={snow} />
        </mesh>

        {/* Rock face details — protruding ledges */}
        {[[-5, 8, 8], [6, 12, 7], [-8, 14, 5], [4, 18, 4]].map(([x, y, z], i) => (
          <mesh key={i} position={[x, y, z]} rotation={[0.3, i * 0.8, 0.2]} castShadow>
            <boxGeometry args={[3 - i * 0.4, 1.5, 2.5 - i * 0.3, 2, 1, 2]} />
            <meshToonMaterial color={rock2} />
          </mesh>
        ))}

        {/* Eastern plateau — where Zen Garden sits */}
        <mesh position={[10, 1.5, 8]} castShadow>
          <cylinderGeometry args={[6, 8, 3, 20, 2]} />
          <meshToonMaterial color={grass} />
        </mesh>
        {/* Plateau top surface */}
        <mesh position={[10, 3.1, 8]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[6, 24]} />
          <meshToonMaterial color={isNight ? '#1A2A18' : '#4A7830'} />
        </mesh>

        {/* Waterfall channel groove on east face */}
        {[0, 1, 2, 3].map(i => (
          <mesh key={i} position={[1, 22 - i * 5, 5 + i * 1.5]} rotation={[0.25, 0, 0]}>
            <planeGeometry args={[1.8, 4.5, 2, 6]} />
            <meshBasicMaterial color={wCol} transparent opacity={0.7} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>

      {/* ── WATERFALL PARTICLES ── */}
      <instancedMesh ref={dropRef} args={[undefined, undefined, 120]}>
        <sphereGeometry args={[1, 6, 4]} />
        <meshBasicMaterial color={wCol} transparent opacity={0.72} />
      </instancedMesh>

      {/* ── SPLASH MIST at moat entry point ── */}
      <instancedMesh ref={mistRef} args={[undefined, undefined, 18]}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshBasicMaterial color="#FFFFFF" transparent opacity={0.14} />
      </instancedMesh>

      {/* Splash pool where waterfall meets moat */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-40, 0.12, -24]}>
        <circleGeometry args={[3.2, 28]} />
        <meshBasicMaterial color={wCol} transparent opacity={0.6} />
      </mesh>

      {/* Stream from splash pool → moat (short connecting channel) */}
      <mesh rotation={[-Math.PI / 2, 0.4, 0]} position={[-37, 0.08, -28]}>
        <planeGeometry args={[2, 5, 2, 4]} />
        <meshBasicMaterial color={wCol} transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

// ─── Stone bridge over the river ──────────────────────────────────────────────
function StoneBridge({ isNight }: { isNight: boolean }) {
  const stoneColor = isNight ? '#2A2530' : '#7A7080';
  const mortarColor = isNight ? '#1E1A24' : '#5A5060';

  return (
    <group position={[-17, 0, 0]}>
      {/* Bridge deck */}
      <mesh position={[0, 1.4, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[6, 0.35, 5.5, 4, 1, 3]} />
        <meshToonMaterial color={stoneColor} />
      </mesh>
      {/* Stone arch left */}
      <mesh position={[0, 0.7, -2]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[1.15, 0.28, 10, 20, Math.PI]} />
        <meshToonMaterial color={mortarColor} />
      </mesh>
      {/* Stone arch right */}
      <mesh position={[0, 0.7, 2]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[1.15, 0.28, 10, 20, Math.PI]} />
        <meshToonMaterial color={mortarColor} />
      </mesh>
      {/* Left pier */}
      <mesh position={[0, 0.6, -2.5]}>
        <cylinderGeometry args={[0.45, 0.55, 1.2, 10]} />
        <meshToonMaterial color={stoneColor} />
      </mesh>
      {/* Right pier */}
      <mesh position={[0, 0.6, 2.5]}>
        <cylinderGeometry args={[0.45, 0.55, 1.2, 10]} />
        <meshToonMaterial color={stoneColor} />
      </mesh>
      {/* Parapet left */}
      {[-2, -1, 0, 1, 2].map(z => (
        <mesh key={`l${z}`} position={[-2.5, 1.9, z]}>
          <boxGeometry args={[0.2, 0.55, 0.7]} />
          <meshToonMaterial color={stoneColor} />
        </mesh>
      ))}
      {/* Parapet right */}
      {[-2, -1, 0, 1, 2].map(z => (
        <mesh key={`r${z}`} position={[2.5, 1.9, z]}>
          <boxGeometry args={[0.2, 0.55, 0.7]} />
          <meshToonMaterial color={stoneColor} />
        </mesh>
      ))}
      {/* Railing top */}
      <mesh position={[-2.5, 2.25, 0]}>
        <boxGeometry args={[0.12, 0.12, 5.5]} />
        <meshToonMaterial color={mortarColor} />
      </mesh>
      <mesh position={[2.5, 2.25, 0]}>
        <boxGeometry args={[0.12, 0.12, 5.5]} />
        <meshToonMaterial color={mortarColor} />
      </mesh>
    </group>
  );
}

// ─── Circular moat — ring of water surrounding the village ────────────────────
// Inner radius: 31  Outer radius: 39  Bridge gaps at N/S/E/W (±3.2 units wide)
function CircularMoat({ isNight, skyState }: { isNight: boolean; skyState: any }) {
  const waterRef  = useRef<THREE.Mesh>(null);
  const waterRef2 = useRef<THREE.Mesh>(null);
  const isGolden  = skyState?.phase === 'golden' || skyState?.phase === 'sunset';

  const waterColor = isNight ? '#1A2E4A' : isGolden ? '#A06820' : '#2A88BA';
  const glintColor = isNight ? '#3A5A8A' : isGolden ? '#FFB347' : '#87CEEB';

  // Animated UV flow on water surface
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (waterRef.current)  (waterRef.current.material  as THREE.MeshBasicMaterial).color.set(waterColor);
    if (waterRef2.current) (waterRef2.current.material as THREE.MeshBasicMaterial).color.set(glintColor);
  });

  const INNER = 31;
  const OUTER = 39;
  const BRIDGE_ARC = 0.098; // radians — arc gap per bridge (≈5.6°)

  // 4 water arcs, each ~80° (leaving 10° gap at each bridge)
  const arcs = [
    { start: BRIDGE_ARC,              length: Math.PI / 2 - BRIDGE_ARC * 2 },  // NE
    { start: Math.PI / 2 + BRIDGE_ARC, length: Math.PI / 2 - BRIDGE_ARC * 2 }, // SE
    { start: Math.PI + BRIDGE_ARC,     length: Math.PI / 2 - BRIDGE_ARC * 2 }, // SW
    { start: Math.PI * 1.5 + BRIDGE_ARC, length: Math.PI / 2 - BRIDGE_ARC * 2 }, // NW
  ];

  const stoneC = isNight ? '#2A2428' : '#7A6858';
  const bankC  = isNight ? '#1A1E14' : '#4A5838';

  return (
    <group>
      {/* Water surface arcs */}
      {arcs.map((arc, i) => (
        <group key={i}>
          {/* Main water */}
          <mesh ref={i === 0 ? waterRef : undefined} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
            <ringGeometry args={[INNER, OUTER, 64, 1, arc.start, arc.length]} />
            <meshBasicMaterial color={waterColor} transparent opacity={0.88} />
          </mesh>
          {/* Shimmer layer */}
          <mesh ref={i === 0 ? waterRef2 : undefined} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
            <ringGeometry args={[INNER + 1.5, OUTER - 1.5, 48, 1, arc.start, arc.length]} />
            <meshBasicMaterial color={glintColor} transparent opacity={0.18} />
          </mesh>
        </group>
      ))}

      {/* Inner bank — grass/stone ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[INNER - 1.5, INNER, 60, 1]} />
        <meshToonMaterial color={bankC} />
      </mesh>
      {/* Outer bank */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[OUTER, OUTER + 1.5, 60, 1]} />
        <meshToonMaterial color={bankC} />
      </mesh>

      {/* Inner stone edge */}
      {Array.from({ length: 40 }, (_, i) => {
        const a = (i / 40) * Math.PI * 2;
        const x = Math.cos(a) * INNER;
        const z = Math.sin(a) * INNER;
        // Skip bridge gaps
        const ang = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const nearBridge = [0, Math.PI/2, Math.PI, Math.PI*1.5].some(ba =>
          Math.abs(ang - ba) < BRIDGE_ARC * 1.5
        );
        if (nearBridge) return null;
        return (
          <mesh key={i} position={[x, 0.18, z]} rotation={[0, a, 0]}>
            <boxGeometry args={[0.55, 0.32, 0.38, 2, 1, 1]} />
            <meshToonMaterial color={stoneC} />
          </mesh>
        );
      })}

      {/* Water ripple rings */}
      {[33, 35, 37].map((r, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06 + i * 0.01, 0]}>
          <ringGeometry args={[r, r + 0.06, 60, 1]} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={0.06 - i * 0.015} />
        </mesh>
      ))}

      {/* 4 Stone bridges — N/S/E/W — each spans inner→outer radius */}
      {/* North bridge — crosses z-axis at top */}
      <MoatBridge cx={0} cz={-(INNER + OUTER) / 2} rot={0}   isNight={isNight} />
      {/* South bridge */}
      <MoatBridge cx={0} cz={ (INNER + OUTER) / 2} rot={0}   isNight={isNight} />
      {/* East bridge */}
      <MoatBridge cx={ (INNER + OUTER) / 2} cz={0} rot={Math.PI / 2} isNight={isNight} />
      {/* West bridge */}
      <MoatBridge cx={-(INNER + OUTER) / 2} cz={0} rot={Math.PI / 2} isNight={isNight} />
    </group>
  );
}

// Single stone bridge spanning the moat at the given center point
function MoatBridge({ cx, cz, rot, isNight }: {
  cx: number; cz: number; rot: number; isNight: boolean;
}) {
  const stoneC  = isNight ? '#2A2430' : '#7A7068';
  const mortarC = isNight ? '#1C1820' : '#5A5048';
  const SPAN    = 8.5; // slightly wider than moat

  return (
    <group position={[cx, 0.14, cz]} rotation={[0, rot, 0]}>
      {/* Bridge deck — slightly above water */}
      <mesh position={[0, 1.28, 0]} castShadow>
        <boxGeometry args={[SPAN, 0.32, 5.8, 5, 1, 4]} />
        <meshToonMaterial color={stoneC} />
      </mesh>
      {/* Deck surface texture — darker planks */}
      <mesh position={[0, 1.46, 0]}>
        <boxGeometry args={[SPAN, 0.06, 5.4, 6, 1, 4]} />
        <meshToonMaterial color={mortarC} />
      </mesh>

      {/* Left arch */}
      <mesh position={[0, 0.72, -2.2]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[1.2, 0.28, 10, 22, Math.PI]} />
        <meshToonMaterial color={mortarC} />
      </mesh>
      {/* Right arch */}
      <mesh position={[0, 0.72, 2.2]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[1.2, 0.28, 10, 22, Math.PI]} />
        <meshToonMaterial color={mortarC} />
      </mesh>

      {/* Piers (2 per side) */}
      {[-2.2, 2.2].map((z, i) => (
        <mesh key={i} position={[0, 0.55, z]}>
          <cylinderGeometry args={[0.46, 0.56, 1.1, 12, 2]} />
          <meshToonMaterial color={stoneC} />
        </mesh>
      ))}

      {/* Parapet left */}
      {[-3, -1.5, 0, 1.5, 3].map((x, i) => (
        <mesh key={`l${i}`} position={[x, 1.75, -2.78]}>
          <boxGeometry args={[0.88, 0.55, 0.22, 2, 2, 1]} />
          <meshToonMaterial color={stoneC} />
        </mesh>
      ))}
      {/* Parapet right */}
      {[-3, -1.5, 0, 1.5, 3].map((x, i) => (
        <mesh key={`r${i}`} position={[x, 1.75, 2.78]}>
          <boxGeometry args={[0.88, 0.55, 0.22, 2, 2, 1]} />
          <meshToonMaterial color={stoneC} />
        </mesh>
      ))}
      {/* Railing bars */}
      <mesh position={[0, 2.1, -2.78]}>
        <boxGeometry args={[SPAN, 0.1, 0.12, 5, 1, 1]} />
        <meshToonMaterial color={mortarC} />
      </mesh>
      <mesh position={[0, 2.1, 2.78]}>
        <boxGeometry args={[SPAN, 0.1, 0.12, 5, 1, 1]} />
        <meshToonMaterial color={mortarC} />
      </mesh>

      {/* Lantern posts at bridge entrance */}
      {[-1, 1].map((side, i) => (
        <group key={i} position={[SPAN / 2 * side, 1.45, 0]}>
          <mesh>
            <cylinderGeometry args={[0.08, 0.1, 1.2, 10, 2]} />
            <meshToonMaterial color={stoneC} />
          </mesh>
          <mesh position={[0, 0.72, 0]}>
            <boxGeometry args={[0.28, 0.28, 0.28, 2, 2, 2]} />
            <meshToonMaterial color={isNight ? '#FFB840' : '#F0ECE0'} transparent opacity={isNight ? 0.85 : 0.5} />
          </mesh>
          <mesh position={[0, 0.88, 0]}>
            <coneGeometry args={[0.2, 0.18, 8, 1]} />
            <meshToonMaterial color={mortarC} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function VirtualJoystick({ onMove }: { onMove: (dx: number, dy: number) => void }) {
  const stickRef = useRef<HTMLDivElement>(null);
  const touching = useRef(false);
  const origin   = useRef({ x: 0, y: 0 });
  const maxDist  = 40;

  function onTouchStart(e: React.TouchEvent) {
    touching.current = true;
    const t = e.touches[0];
    origin.current = { x: t.clientX, y: t.clientY };
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!touching.current || !stickRef.current) return;
    const t = e.touches[0];
    let dx = t.clientX - origin.current.x;
    let dy = t.clientY - origin.current.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist > maxDist) { dx = (dx/dist)*maxDist; dy = (dy/dist)*maxDist; }
    stickRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
    onMove(dx / maxDist, dy / maxDist);
  }

  function onTouchEnd() {
    touching.current = false;
    if (stickRef.current) stickRef.current.style.transform = 'translate(0,0)';
    onMove(0, 0);
  }

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="absolute bottom-24 left-6 w-24 h-24 rounded-full"
      style={{ background: 'rgba(255,255,255,0.12)', border: '2px solid rgba(255,255,255,0.25)', touchAction: 'none' }}>
      <div ref={stickRef}
        className="absolute inset-4 rounded-full transition-transform duration-75"
        style={{ background: 'rgba(255,255,255,0.4)', boxShadow: '0 0 15px rgba(24,119,242,0.5)' }} />
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────
// ─── Side Drawer — slides in from right, swipe-right to close ────────────────
function SideDrawer({
  href, title, isNight, onClose, onFullPage,
}: {
  href: string;
  title: string;
  isNight: boolean;
  onClose: () => void;
  onFullPage: () => void;
}) {
  const touchStartX = useRef(0);
  const [dragX, setDragX] = useState(0);
  const dragging = useRef(false);

  // 80% transparent = 20% opaque background — village shows through
  const glassBg   = isNight ? 'rgba(4,6,14,0.20)' : 'rgba(255,255,255,0.20)';
  const glassEdge = isNight ? 'rgba(255,255,255,0.12)' : 'rgba(30,27,75,0.12)';
  const headerBg  = isNight ? 'rgba(0,0,0,0.30)' : 'rgba(255,255,255,0.30)';
  const textColor = isNight ? '#F0EBE0' : '#1E1B4B';
  const mutedCol  = isNight ? 'rgba(255,255,255,0.5)' : 'rgba(30,27,75,0.4)';

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    dragging.current = true;
  }
  function onTouchMove(e: React.TouchEvent) {
    if (!dragging.current) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    if (dx > 0) setDragX(Math.min(dx, 220));
  }
  function onTouchEnd(e: React.TouchEvent) {
    dragging.current = false;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx > 90) { onClose(); }
    else { setDragX(0); }
  }

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex justify-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onClose}
    >
      {/* Minimal backdrop — very transparent so 3D world shows through */}
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.08)' }} />

      {/* Drawer panel */}
      <motion.div
        className="relative flex flex-col h-full"
        style={{ width: 'min(88vw, 480px)', willChange: 'transform' }}
        initial={{ x: '100%' }}
        animate={{ x: dragX }}
        exit={{ x: '100%' }}
        transition={dragging.current
          ? { duration: 0 }
          : { type: 'spring', damping: 26, stiffness: 240 }}
        onClick={e => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Glass panel */}
        <div className="flex flex-col h-full" style={{ background: glassBg, backdropFilter: 'blur(28px) saturate(160%)', borderLeft: `1px solid ${glassEdge}` }}>
          {/* Swipe handle hint */}
          <div style={{ position: 'absolute', left: -5, top: '50%', transform: 'translateY(-50%)', width: 4, height: 48, borderRadius: 2, background: mutedCol }} />

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
            style={{ background: headerBg, borderBottom: `1px solid ${glassEdge}`, backdropFilter: 'blur(8px)' }}>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 transition-all active:scale-90"
              style={{ background: mutedCol, color: textColor, border: 'none', cursor: 'pointer' }}
            >
              ×
            </button>
            <span className="flex-1 font-black text-sm truncate" style={{ color: textColor }}>{title}</span>
            <button
              onClick={onFullPage}
              className="text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0 transition-all active:scale-95"
              style={{ background: 'rgba(24,119,242,0.14)', color: '#1877F2', border: '1px solid rgba(24,119,242,0.25)', cursor: 'pointer' }}
            >
              Full ↗
            </button>
          </div>

          {/* Content iframe — ?embedded=1 hides the global BottomNav */}
          <iframe
            src={`${href}${href.includes('?') ? '&' : '?'}embedded=1`}
            className="flex-1 border-none"
            style={{ width: '100%', background: 'transparent' }}
            title={title}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function VillageWorld3D({ onNavigate }: { onNavigate?: (href: string, label: string) => void }) {
  const router       = useRouter();
  const supabase     = createClient();
  const { toggleVoice, voiceEnabled } = useSpiritVoice();
  const { mood } = useWeather();
  const { skyState } = useSkySystem();
  const season = useSeason();

  // Day/night for UI styling — menus and drawer adapt to sky phase
  const isNightUI = skyState?.phase === 'night' || skyState?.phase === 'dusk' || skyState?.phase === 'dawn';

  // ── Side drawer ────────────────────────────────────────────────────────────
  const [drawer, setDrawer]       = useState<{ href: string; title: string } | null>(null);
  const [showVLGShop, setVLGShop]      = useState(false);
  const [showTour,    setShowTour]     = useState(false);
  const [showHutInterior, setShowHutInterior] = useState(false);
  const [activeAdminObj, setActiveAdminObj] = useState<AdminObj | null>(null);
  const [itemInfoLoading, setItemInfoLoading] = useState(false);
  const [itemInfoText, setItemInfoText]    = useState<string | null>(null);
  const { balance: vlgBalance, load: loadVLG } = useVLGBalance();

  // ── Current user identity ──────────────────────────────────────────────────
  const [currentUserId,   setCurrentUserId]   = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState('Villager');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setCurrentUserId(user.id);
      loadVLG(user.id);
      supabase.from('profiles').select('username, display_name, is_super_admin').eq('id', user.id).single()
        .then(({ data: p }: any) => {
          if (p) {
            setCurrentUserName(p.display_name || p.username || 'Villager');
            if (p.is_super_admin || user.email === 'elitehousemusic@gmail.com' || user.email === 'admin@villa9e.app') {
              setIsAdmin(true);
            }
          }
        });
      supabase.from('profiles').select('has_done_tour').eq('id', user.id).single()
        .then(({ data: p, error }: any) => {
          if (!error && p && !p.has_done_tour) setShowTour(true);
        });
    });
  }, []);

  // ── Tribe members & WebRTC ────────────────────────────────────────────────
  const [tribeMembers,   setTribeMembers]   = useState<TribeMember[]>([]);
  const [clickedMember,  setClickedMember]  = useState<TribeMember | null>(null);
  const webrtc = useWebRTC(currentUserId, currentUserName);

  useEffect(() => {
    if (!currentUserId) return;
    // Load tribe members from all tribes this user belongs to
    (supabase as any)
      .from('tribe_members')
      .select(`
        user_id, tribe_id,
        profiles!inner(username, display_name, avatar_url, avatar_config)
      `)
      .neq('user_id', currentUserId)
      .limit(20)
      .then(({ data }: any) => {
        if (!data) return;
        const members: TribeMember[] = data.map((m: any, i: number) => {
          const cfg: AvatarConfig = { ...DEFAULT_AVATAR_CONFIG, ...m.profiles.avatar_config };
          const { skinColor } = resolveAvatarColors(cfg);
          return {
            userId:      m.user_id,
            username:    m.profiles.username,
            displayName: m.profiles.display_name || m.profiles.username,
            avatar:      m.profiles.avatar_url ?? '👤',
            skinColor,
            tribeId:     m.tribe_id,
            isOnline:    false,
            screenX:     0,
            screenY:     0,
          };
        });
        setTribeMembers(members);
      });
  }, [currentUserId]);

  // Derive weather from mood palette
  const weatherData = useMemo(() => {
    const isRainy  = mood === 'stormy' || mood === 'rainy';
    const isWindy  = mood === 'stormy' || mood === 'windy';
    return {
      rain:      isRainy ? (mood === 'stormy' ? 0.9 : 0.55) : 0,
      wind:      isWindy ? (mood === 'stormy' ? 0.85 : 0.45) : (mood === 'breezy' ? 0.2 : 0.05),
      windAngle: Math.random() * Math.PI * 2,  // stable per session
    };
  }, [mood]);

  const [spiritVariant,  setSpiritVariant]  = useState<SpiritVariantId>('blue');
  const [playerAvatarCfg, setPlayerAvatarCfg] = useState<AvatarConfig>(DEFAULT_AVATAR_CONFIG);
  const [playerSkinColor, setPlayerSkinColor] = useState('#A86030');
  const [playerHairColor, setPlayerHairColor] = useState('#0C0700');
  const [playerShirtColor, setPlayerShirtColor] = useState('#2563EB');
  const skinColorRef = useRef('#A86030'); // ref for use inside presence interval
  const playerPos    = useRef(new THREE.Vector3(0, 0, 9));
  const playerRot    = useRef(0);
  const moveInput    = useRef({ dx: 0, dy: 0 });
  const isMoving     = useRef(false);
  const keys         = useRef<Set<string>>(new Set());
  // Drag-to-move: pointer pressed on ground → walk toward that world point
  const pointerTarget = useRef<{ x: number; z: number } | null>(null);
  const cameraZoom   = useRef(14);
  const cameraAzimuth = useRef(0);
  const gestureRef   = useRef({ lastDist: 0, lastMidX: 0, active: false });

  const [remotePlayers, setRemotePlayers]   = useState<RemotePlayer[]>([]);
  const [nearBuilding, setNearBuilding]     = useState<{ id: string; href: string; label: string } | null>(null);
  const [enterPrompt, setEnterPrompt]       = useState(false);
  const nearBuildingRef    = useRef<{ id: string; href: string; label: string } | null>(null);
  const lastAutoEntryRef   = useRef<string | null>(null); // building id of last auto-entered building
  const lastAutoEntryTimeRef = useRef(0);                 // timestamp of last auto-entry

  // ── Avatar crescent menu ──────────────────────────────────────────────────
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const avatarDivRef = useRef<HTMLDivElement | null>(null);

  // ── Spirit companion menu ─────────────────────────────────────────────────
  const [spiritMenuOpen, setSpiritMenuOpen] = useState(false);
  const spiritDivRef = useRef<HTMLDivElement | null>(null);

  // ── Map overlay (triggered from avatar menu) ──────────────────────────────
  const [showMapOverlay, setShowMapOverlay] = useState(false);

  const channelRef = useRef<any>(null);

  // ── Multiplayer presence ──────────────────────────────────────────────────
  useEffect(() => {
    let userId: string;
    let username: string;
    const presenceInterval = setInterval(async () => {
      if (!userId || !channelRef.current) return;
      await channelRef.current.track({
        user_id:   userId,
        username,
        x: playerPos.current.x,
        y: playerPos.current.y,
        z: playerPos.current.z,
        rotation:  playerRot.current,
        skinColor: skinColorRef.current,
      });
    }, 150);

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      userId = user.id;

      (supabase as any).from('profiles').select('username, avatar_config').eq('id', user.id).single()
        .then(({ data }: any) => {
          username = data?.username ?? 'villager';
          const cfg = data?.avatar_config ?? {};
          if (cfg.spirit_variant) setSpiritVariant(cfg.spirit_variant as SpiritVariantId);
          // Pass full avatar config to billboard character
          if (cfg.skin_id || cfg.hair_id) {
            setPlayerAvatarCfg({ ...DEFAULT_AVATAR_CONFIG, ...cfg });
          }
          if (cfg.skin_id)       { const sc = SKIN_TONE_MAP[cfg.skin_id] ?? '#A86030'; setPlayerSkinColor(sc); skinColorRef.current = sc; }
          if (cfg.hair_color_id) setPlayerHairColor(HAIR_COLOR_MAP[cfg.hair_color_id] ?? '#0C0700');
          if (cfg.outfit_id)     setPlayerShirtColor(SHIRT_COLOR_MAP[cfg.outfit_id] ?? '#2563EB');
        });

      const channel = supabase.channel('village_world', {
        config: { presence: { key: user.id } },
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const others: RemotePlayer[] = [];
          Object.entries(state).forEach(([key, presences]) => {
            if (key !== user.id) {
              const p = (presences as any[])[0];
              if (p) others.push(p as RemotePlayer);
            }
          });
          setRemotePlayers(others);
        })
        .subscribe();

      channelRef.current = channel;
    });

    return () => {
      clearInterval(presenceInterval);
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, []);

  // ── Keyboard controls ─────────────────────────────────────────────────────
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys.current.add(e.key);
      // Spacebar enters nearby building (desktop shortcut)
      if (e.key === ' ' && nearBuildingRef.current) {
        e.preventDefault();
        handleEnterBuilding(nearBuildingRef.current.href, nearBuildingRef.current.label);
      }
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  // ── Movement loop ─────────────────────────────────────────────────────────
  useEffect(() => {
    const SPEED = 0.13;

    const loop = setInterval(() => {
      let dx = moveInput.current.dx;
      let dz = moveInput.current.dy;

      if (keys.current.has('w') || keys.current.has('ArrowUp'))    dz = -1;
      if (keys.current.has('s') || keys.current.has('ArrowDown'))  dz =  1;
      if (keys.current.has('a') || keys.current.has('ArrowLeft'))  dx = -1;
      if (keys.current.has('d') || keys.current.has('ArrowRight')) dx =  1;

      // Drag/tap-to-walk: steer toward pointerTarget if no other input
      if (pointerTarget.current && dx === 0 && dz === 0) {
        const tdx = pointerTarget.current.x - playerPos.current.x;
        const tdz = pointerTarget.current.z - playerPos.current.z;
        const tDist = Math.sqrt(tdx * tdx + tdz * tdz);
        if (tDist < 0.4) {
          pointerTarget.current = null; // arrived
        } else {
          dx = tdx / tDist;
          dz = tdz / tDist;
        }
      }

      isMoving.current = dx !== 0 || dz !== 0;

      if (dx !== 0 || dz !== 0) {
        const mag = Math.sqrt(dx*dx + dz*dz);
        dx = (dx/mag) * SPEED;
        dz = (dz/mag) * SPEED;

        let nx = playerPos.current.x + dx;
        let nz = playerPos.current.z + dz;

        let blocked = false;
        for (const loc of LOCATIONS) {
          const [bx,,bz] = loc.pos;
          const [bw,,bd] = loc.size;
          const margin = 0.8;
          if (Math.abs(nx - bx) < bw/2 + margin && Math.abs(nz - bz) < bd/2 + margin) {
            blocked = true; break;
          }
        }
        // Admin-placed buildings that block movement (trail_passable = false)
        if (!blocked) {
          for (const obj of liveAdminObjectsRef.current) {
            if (obj.trail_passable !== false) continue;
            const halfSize = obj.scale * 2.5;
            if (Math.abs(nx - obj.pos_x) < halfSize && Math.abs(nz - obj.pos_z) < halfSize) {
              blocked = true; break;
            }
          }
        }
        // Circular moat — ring of water at radius 32–39 around village center
        // Players must use one of the 4 stone bridges to cross
        const pDist = Math.sqrt(nx * nx + nz * nz);
        if (pDist > 31.5 && pDist < 40) {
          // Check if player is on a bridge (4 bridges at N/S/E/W, 5 units wide)
          const BRIDGE_HALF = 3.2;
          const onNorth  = nz < -30 && Math.abs(nx) < BRIDGE_HALF;
          const onSouth  = nz >  30 && Math.abs(nx) < BRIDGE_HALF;
          const onEast   = nx >  30 && Math.abs(nz) < BRIDGE_HALF;
          const onWest   = nx < -30 && Math.abs(nz) < BRIDGE_HALF;
          if (!onNorth && !onSouth && !onEast && !onWest) blocked = true;
        }
        // Hard outer wall beyond moat
        if (pDist > 46) blocked = true;

        if (!blocked) {
          playerPos.current.set(nx, terrainH(nx, nz), nz);
          playerRot.current = Math.atan2(dx, dz);
        }

        let nearest: { id: string; href: string; label: string; dist: number } | null = null;
        for (const loc of LOCATIONS) {
          const [bx,,bz] = loc.pos;
          const dist = Math.sqrt((playerPos.current.x-bx)**2 + (playerPos.current.z-bz)**2);
          if (dist < 8.5 && (!nearest || dist < nearest.dist)) {
            nearest = { id: loc.id, href: loc.href, label: loc.label, dist };
          }
          // Auto-enter: door is open (dist < 8.5), player steps within doorway threshold
          if (dist < 5.0) {
            const now = Date.now();
            const cooldownOk = lastAutoEntryRef.current !== loc.id && (now - lastAutoEntryTimeRef.current) > 3000;
            if (cooldownOk) {
              lastAutoEntryRef.current     = loc.id;
              lastAutoEntryTimeRef.current = now;
              handleEnterBuilding(loc.href, loc.label);
              break;
            }
          }
        }
        // Also check admin-placed buildings with linked_page for the Enter prompt
        if (!nearest) {
          for (const obj of liveAdminObjectsRef.current) {
            if (!obj.linked_page || (obj.trigger_type !== 'click' && obj.trigger_type !== 'both')) continue;
            const dist = Math.sqrt((playerPos.current.x - obj.pos_x)**2 + (playerPos.current.z - obj.pos_z)**2);
            if (dist < 8.5 && (!nearest || dist < nearest.dist)) {
              nearest = { id: obj.id, href: obj.linked_page, label: obj.label ?? '', dist };
            }
          }
        }

        nearBuildingRef.current = nearest;
        setNearBuilding(nearest);
        setEnterPrompt(!!nearest);
        // Reset auto-entry cooldown if player has moved away from the last entered building
        if (lastAutoEntryRef.current && !nearest) lastAutoEntryRef.current = null;
      } else {
        nearBuildingRef.current = null;
        setNearBuilding(null);
        setEnterPrompt(false);
        lastAutoEntryRef.current = null;
      }
    }, 16);

    return () => clearInterval(loop);
  }, []);

  // Single-focus: close everything before opening anything new
  function openDrawer(href: string, title: string) {
    setShowMapOverlay(false);
    setAvatarMenuOpen(false);
    setSpiritMenuOpen(false);
    setDrawer({ href, title });
  }

  function handleEnterBuilding(href: string, label: string) {
    VillageSound.tap();
    openDrawer(href, label);
  }

  function handleAdminObjectInteract(obj: AdminObj) {
    VillageSound.tap();
    switch (obj.behavior) {
      case 'page':
        if (obj.linked_page) openDrawer(obj.linked_page, obj.label ?? '');
        break;
      case 'iframe':
        if (obj.iframe_url) setActiveAdminObj(obj);
        break;
      case 'dialog':
        setActiveAdminObj(obj);
        break;
      case 'transport':
        // Transport: navigate to a page representing another area
        if (obj.transport_target) router.push(obj.transport_target);
        break;
      default:
        break;
    }
  }

  async function loadItemInfo(obj: AdminObj) {
    setItemInfoLoading(true);
    setItemInfoText(null);
    try {
      const name = encodeURIComponent(obj.world_name ?? obj.label ?? 'this item');
      const res  = await fetch(`/api/admin/item-info?item=${name}`);
      const data = await res.json();
      setItemInfoText(data.info ?? 'No information available.');
    } catch {
      setItemInfoText('Could not load information. Try again later.');
    }
    setItemInfoLoading(false);
  }

  const handleAvatarMenuAction = useCallback((id: MenuId, href: string | null) => {
    setAvatarMenuOpen(false);
    VillageSound.tap();
    if (id === 'map') {
      setDrawer(null); // close any open drawer first
      setShowMapOverlay(true);
      return;
    }
    if (href) openDrawer(href, MENU_ITEMS.find(m => m.id === id)?.label ?? '');
  }, []);

  const SPIRIT_ITEMS = [
    { id: 'spirit-chat', label: 'Talk to Spirit',     href: '/village/spirit',           svg: 'M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z' },
    { id: 'spirit-mute', label: voiceEnabled ? 'Mute' : 'Unmute', href: null,            svg: voiceEnabled ? 'M16.5 12A4.5 4.5 0 0014 7.97v1.79l2.48 2.48c.01-.08.02-.16.02-.24zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06A8.99 8.99 0 0011.07 19H11v-4.73L6.27 9H3V7.97c0 .01 0 .01 0 0L4.27 3zM12 4L9.91 6.09 12 8.18V4z' : 'M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z' },
    { id: 'spirit-gear', label: 'Spirit Settings',   href: '/village/spirit/settings',   svg: 'M12 15.5A3.5 3.5 0 018.5 12 3.5 3.5 0 0112 8.5a3.5 3.5 0 013.5 3.5 3.5 3.5 0 01-3.5 3.5m7.43-2.92c.04-.36.07-.73.07-1.08s-.03-.73-.07-1.08l2.32-1.82c.21-.16.27-.46.13-.7l-2.2-3.82c-.13-.25-.42-.33-.67-.25l-2.74 1.1c-.57-.44-1.18-.8-1.85-1.08l-.4-2.91C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.4 2.91c-.67.28-1.28.64-1.85 1.08L4.52 5.3c-.25-.09-.54 0-.67.25L1.65 9.36c-.14.25-.08.54.13.7l2.32 1.82c-.04.35-.07.72-.07 1.08s.03.73.07 1.08L1.78 16.08c-.21.16-.27.46-.13.7l2.2 3.82c.13.25.42.33.67.25l2.74-1.1c.57.44 1.18.8 1.85 1.08l.4 2.91c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.4-2.91c.67-.28 1.28-.64 1.85-1.08l2.74 1.1c.25.09.54 0 .67-.25l2.2-3.82c.14-.25.08-.54-.13-.7l-2.32-1.82z' },
  ] as const;

  function handleTwoFingerStart(e: React.TouchEvent) {
    if (e.touches.length !== 2) return;
    const t0 = e.touches[0], t1 = e.touches[1];
    const dx = t0.clientX - t1.clientX;
    const dy = t0.clientY - t1.clientY;
    gestureRef.current.lastDist = Math.sqrt(dx * dx + dy * dy);
    gestureRef.current.lastMidX = (t0.clientX + t1.clientX) / 2;
    gestureRef.current.active   = true;
  }

  function handleTwoFingerMove(e: React.TouchEvent) {
    if (e.touches.length !== 2 || !gestureRef.current.active) return;
    const t0 = e.touches[0], t1 = e.touches[1];
    const dx   = t0.clientX - t1.clientX;
    const dy   = t0.clientY - t1.clientY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const midX = (t0.clientX + t1.clientX) / 2;

    // Pinch → zoom: fingers together = zoom in (smaller distance), spread = zoom out
    // distDelta > 0 means fingers got closer → camera should come closer (decrease zoom)
    const distDelta = gestureRef.current.lastDist - dist;
    cameraZoom.current = Math.max(6, Math.min(36, cameraZoom.current - distDelta * 0.07));

    // Horizontal two-finger drag → orbit camera around player
    const midDelta = midX - gestureRef.current.lastMidX;
    cameraAzimuth.current += midDelta * 0.006;

    gestureRef.current.lastDist = dist;
    gestureRef.current.lastMidX = midX;
  }

  function handleTwoFingerEnd() {
    gestureRef.current.active = false;
  }

  // Sky background color transitions with the sky state
  const isNight = skyState?.phase === 'night' || skyState?.phase === 'dusk' || skyState?.phase === 'dawn';
  const bgColor = skyState?.skyTop ?? (isNight ? '#080912' : '#6AAEDC');

  return (
    <div
      className="w-full h-full relative"
      style={{ touchAction: 'none' }}
      onTouchStart={handleTwoFingerStart}
      onTouchMove={handleTwoFingerMove}
      onTouchEnd={handleTwoFingerEnd}
    >
      {/* ── 3D Canvas — full screen background ─────────────────────── */}
      <CanvasErrorBoundary>
      <Canvas
        shadows={{ type: THREE.PCFSoftShadowMap }}
        gl={{
          antialias: false,
          powerPreference: 'high-performance',
          pixelRatio: Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 1.5),
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
        }}
        style={{ background: bgColor, transition: 'background 4s ease' }}
        performance={{ min: 0.5 }}
        camera={{ position: [0, 8, 12], fov: 58, near: 0.1, far: 200 }}
      >
        <WorldScene
          playerPos={playerPos}
          playerRot={playerRot}
          isMoving={isMoving}
          remotePlayers={remotePlayers}
          onEnterBuilding={handleEnterBuilding}
          skyState={skyState}
          spiritVariant={spiritVariant}
          cameraZoom={cameraZoom}
          cameraAzimuth={cameraAzimuth}
          weather={weatherData}
          nearBuildingId={nearBuilding?.id ?? null}
          avatarDivRef={avatarDivRef}
          spiritDivRef={spiritDivRef}
          onAvatarTap={() => { setAvatarMenuOpen(m => !m); setSpiritMenuOpen(false); }}
          onSpiritTap={() => { setSpiritMenuOpen(m => !m); setAvatarMenuOpen(false); }}
          pointerTarget={pointerTarget}
          tribeMembers={tribeMembers}
          onTribeMemberClick={(member, sx, sy) => setClickedMember({ ...member, screenX: sx, screenY: sy })}
          onAdminObjectInteract={handleAdminObjectInteract}
          playerAvatarCfg={playerAvatarCfg}
          playerSkinColor={playerSkinColor}
          playerHairColor={playerHairColor}
          playerShirtColor={playerShirtColor}
        />
      </Canvas>
      </CanvasErrorBoundary>

      {/* ── TOP BAR — overlays the 3D world from above ─────────────── */}
      <VillageTopBar
        username={currentUserName}
        avatarConfig={playerAvatarCfg}
        vlgBalance={vlgBalance}
        onHutOpen={() => setShowHutInterior(true)}
        onSearch={() => openDrawer('/village/discover', 'Discover')}
        onNavigateTo={href => openDrawer(href, href.split('/').pop() ?? 'Open')}
        onMessages={() => openDrawer('/messages', 'Messages')}
        onNotifications={() => openDrawer('/notifications', 'Notifications')}
      />

      {/* ── Avatar crescent menu — positioned over avatar head ─────── */}
      <div
        ref={avatarDivRef}
        style={{ position: 'absolute', pointerEvents: 'none', transform: 'translate(-50%, -50%)' }}
      >
        <AnimatePresence>
          {avatarMenuOpen && MENU_ITEMS.map((item, i) => {
            const cp = CRESCENT_POSITIONS[i];
            // Day/night responsive colors
            const btnBg  = isNightUI ? 'rgba(8,10,22,0.94)' : 'rgba(240,244,255,0.94)';
            const btnBdr = isNightUI ? 'rgba(255,255,255,0.18)' : 'rgba(30,27,75,0.18)';
            const iconFill = isNightUI ? 'rgba(255,255,255,0.92)' : 'rgba(30,27,75,0.88)';
            return (
              <motion.button
                key={item.id}
                initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                animate={{ x: cp.x, y: cp.y, scale: 1, opacity: 1 }}
                exit={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                whileHover={{ scale: 1.22 }}
                whileTap={{ scale: 0.90 }}
                transition={{ type: 'spring', stiffness: 480, damping: 28, delay: i * 0.045 }}
                style={{
                  position: 'absolute',
                  pointerEvents: 'all',
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: btnBg,
                  border: `1.5px solid ${btnBdr}`,
                  backdropFilter: 'blur(20px)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: 'translate(-50%,-50%)',
                  boxShadow: isNightUI ? '0 4px 24px rgba(0,0,0,0.7)' : '0 4px 20px rgba(0,0,0,0.25)',
                }}
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(8);
                  handleAvatarMenuAction(item.id as MenuId, item.href as string | null);
                }}
                onPointerEnter={() => { if (navigator.vibrate) navigator.vibrate(4); }}
                title={item.label}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill={iconFill} xmlns="http://www.w3.org/2000/svg">
                  <path d={item.svg} />
                </svg>
              </motion.button>
            );
          })}
        </AnimatePresence>
        {/* Tap-target ring on the avatar — invisible but clickable */}
        <button
          style={{
            position: 'absolute',
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'all',
          }}
          onClick={(e) => {
            // Only open avatar menu if click is closer to avatar than to spirit
            const al = parseFloat(avatarDivRef.current?.style.left ?? '0');
            const at = parseFloat(avatarDivRef.current?.style.top ?? '0');
            const sl = parseFloat(spiritDivRef.current?.style.left ?? '0');
            const st = parseFloat(spiritDivRef.current?.style.top ?? '0');
            const distToAvatar = Math.hypot(e.clientX - al, e.clientY - at);
            const distToSpirit = Math.hypot(e.clientX - sl, e.clientY - st);
            if (distToSpirit < distToAvatar) return;
            setAvatarMenuOpen(m => !m);
            setSpiritMenuOpen(false);
          }}
        />
      </div>

      {/* ── Spirit companion menu — 3 items above Spirit ───────────── */}
      <div
        ref={spiritDivRef}
        style={{ position: 'absolute', pointerEvents: 'none', transform: 'translate(-50%, -50%)' }}
      >
        <AnimatePresence>
          {spiritMenuOpen && SPIRIT_ITEMS.map((item, i) => {
            const angles = [135, 90, 45];
            const a = (angles[i] * Math.PI) / 180;
            const r = 60;
            const sx = Math.cos(a) * r;
            const sy = -Math.sin(a) * r;
            return (
              <motion.button
                key={item.id}
                initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                animate={{ x: sx, y: sy, scale: 1, opacity: 1 }}
                exit={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 500, damping: 28, delay: i * 0.06 }}
                style={{
                  position: 'absolute',
                  pointerEvents: 'all',
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  background: isNightUI ? 'rgba(8,10,22,0.94)' : 'rgba(240,244,255,0.94)',
                  border: `1.5px solid ${isNightUI ? 'rgba(167,139,250,0.4)' : 'rgba(124,58,237,0.3)'}`,
                  backdropFilter: 'blur(16px)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: 'translate(-50%,-50%)',
                  boxShadow: '0 0 20px rgba(124,58,237,0.5)',
                }}
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(8);
                  setSpiritMenuOpen(false);
                  VillageSound.tap();
                  if (item.id === 'spirit-mute') { toggleVoice(); return; }
                  if (item.href) setDrawer({ href: item.href, title: item.label });
                }}
                onPointerEnter={() => { if (navigator.vibrate) navigator.vibrate(4); }}
                title={item.label}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill={isNightUI ? 'rgba(167,139,250,0.95)' : 'rgba(124,58,237,0.9)'} xmlns="http://www.w3.org/2000/svg">
                  <path d={item.svg} />
                </svg>
              </motion.button>
            );
          })}
        </AnimatePresence>
        {/* Tap-target on Spirit */}
        <button
          style={{
            position: 'absolute',
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'all',
          }}
          onClick={(e) => {
            // Only open spirit menu if click is closer to spirit than to avatar
            const sl = parseFloat(spiritDivRef.current?.style.left ?? '0');
            const st = parseFloat(spiritDivRef.current?.style.top ?? '0');
            const al = parseFloat(avatarDivRef.current?.style.left ?? '0');
            const at = parseFloat(avatarDivRef.current?.style.top ?? '0');
            const distToSpirit = Math.hypot(e.clientX - sl, e.clientY - st);
            const distToAvatar = Math.hypot(e.clientX - al, e.clientY - at);
            if (distToAvatar < distToSpirit) return;
            setSpiritMenuOpen(m => !m);
            setAvatarMenuOpen(false);
          }}
        />
      </div>

      {/* ── Village Map overlay — triggered from avatar menu ─────────── */}
      <AnimatePresence>
        {showMapOverlay && (
          <motion.div
            key="map-overlay"
            initial={{ scale: 0.15, opacity: 0, y: '40%' }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.1, opacity: 0, y: '50%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="fixed inset-0 z-50 flex flex-col"
            style={{ background: '#0a0e1a', transformOrigin: 'center 80%' }}
          >
            <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
              style={{ background: 'rgba(0,0,0,0.6)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <button
                onClick={() => setShowMapOverlay(false)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-xl"
                style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}
              >
                ←
              </button>
              <span className="text-white font-black text-base flex-1">🗺️ Village Map</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <VillageMap2D onNavigate={href => { setShowMapOverlay(false); openDrawer(href, href.split('/').pop() ?? 'Enter'); }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Joystick removed — users swipe/tap to move on mobile */}

      {/* ── Enter building prompt ──────────────────────────────────── */}
      {enterPrompt && nearBuilding && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-10">
          <motion.button
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            onClick={() => handleEnterBuilding(nearBuilding.href, nearBuilding.label)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-white"
            style={{ background: 'linear-gradient(135deg,#1877F2,#7C3AED)', boxShadow: '0 0 30px rgba(24,119,242,0.5)' }}>
            <span>↑</span> Enter {nearBuilding.label}
            <span className="hidden sm:inline text-xs font-normal opacity-60 ml-1">[Space]</span>
          </motion.button>
        </div>
      )}

      {/* ── Sky phase + season indicator ──────────────────────────── */}
      {skyState && (
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-full text-xs font-semibold capitalize"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', color: skyState.sunColor, border: `1px solid ${skyState.sunColor}30` }}>
            {skyState.phase} · {skyState.sunAltitude > 0 ? `☀ ${skyState.sunAltitude.toFixed(0)}°` : '🌙'}
          </div>
          {season.season !== 'summer' && (
            <div className="px-2 py-1.5 rounded-full text-xs"
              style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', color: '#C8E8C8' }}>
              {season.season === 'spring'  ? '🌸 Spring' :
               season.season === 'autumn'  ? '🍂 Autumn' :
               season.season === 'winter'  ? '❄️ Winter' : ''}
            </div>
          )}
          {season.rainOn && <div className="px-2 py-1 rounded-full text-xs" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', color: '#93C5FD' }}>🌧️</div>}
          {season.snowOn && season.season !== 'winter' && <div className="px-2 py-1 rounded-full text-xs" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', color: '#BAE6FD' }}>❄️</div>}
        </div>
      )}

      {/* ── Online players count ───────────────────────────────────── */}
      {remotePlayers.length > 0 && (
        <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', color: '#4ADE80' }}>
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          {remotePlayers.length + 1} online
        </div>
      )}

      {/* ── VLG Token balance chip ─────────────────────────────────── */}
      <button
        onClick={() => setVLGShop(true)}
        className="absolute top-4 right-36 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors hover:scale-105"
        style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.2)' }}
      >
        <span>⬡</span>
        <span className="font-bold">{vlgBalance.toLocaleString()}</span>
        <span style={{ color: 'rgba(74,222,128,0.5)' }}>VLG</span>
      </button>

      {/* Controls hint removed per product decision */}

      {/* ── Slide-in Drawer ──────────────────────────────────────── */}
      <AnimatePresence>
        {drawer && (
          <SideDrawer
            key={drawer.href}
            href={drawer.href}
            title={drawer.title}
            isNight={isNightUI}
            onClose={() => setDrawer(null)}
            onFullPage={() => { router.push(drawer.href); setDrawer(null); }}
          />
        )}
      </AnimatePresence>

      {/* ── Incoming call notification ────────────────────────────── */}
      <AnimatePresence>
        {webrtc.callState === 'ringing' && webrtc.remoteUser && (
          <IncomingCallOverlay
            callerName={webrtc.remoteUser.name}
            callerAvatar={webrtc.remoteUser.avatar}
            onAccept={() => webrtc.acceptCall()}
            onDecline={() => webrtc.declineCall()}
          />
        )}
      </AnimatePresence>

      {/* ── Active call panel — right side ───────────────────────── */}
      <AnimatePresence>
        {(webrtc.callState === 'calling' || webrtc.callState === 'connecting' || webrtc.callState === 'active') && (
          <TribeCallPanel webrtc={webrtc} isNight={isNightUI} currentUserId={currentUserId} />
        )}
      </AnimatePresence>

      {/* ── Tribe member click menu ───────────────────────────────── */}
      <AnimatePresence>
        {clickedMember && (
          <TribeMemberMenu
            member={clickedMember}
            currentUserId={currentUserId ?? ''}
            isNight={isNightUI}
            webrtc={webrtc}
            onClose={() => setClickedMember(null)}
          />
        )}
      </AnimatePresence>

      {/* ── VLG Shop modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showVLGShop && <VLGShop onClose={() => setVLGShop(false)} />}
      </AnimatePresence>

      {/* ── First-time village tour ────────────────────────────────── */}
      <AnimatePresence>
        {showTour && <VillageTour onComplete={() => setShowTour(false)} />}
      </AnimatePresence>

      {/* ── Carousel bottom nav ────────────────────────────────────── */}
      <CarouselNav
        isAdmin={isAdmin}
        onMapOpen={() => setShowMapOverlay(true)}
        onNavigate={(href, label) => openDrawer(href, label)}
      />

      {/* ── Admin object interaction overlay ───────────────────────── */}
      <AnimatePresence>
        {activeAdminObj && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => { setActiveAdminObj(null); setItemInfoText(null); }}
          >
            <motion.div
              initial={{ scale: 0.94, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg bg-[#0D1A0F] border border-[#2A5C14]/40 rounded-2xl overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-[#1A3A1A]/60 flex items-center justify-between">
                <h3 className="text-[#C8E8C8] font-black text-base">
                  {activeAdminObj.dialog_title ?? activeAdminObj.label}
                </h3>
                <button onClick={() => { setActiveAdminObj(null); setItemInfoText(null); }}
                  className="text-[#4A7A4A] hover:text-[#C8E8C8] text-xl transition-colors">×</button>
              </div>

              {/* Body */}
              <div className="p-5">
                {activeAdminObj.behavior === 'dialog' && (
                  <p className="text-[#8AAA8A] text-sm leading-relaxed mb-4">
                    {activeAdminObj.dialog_content ?? 'No description set.'}
                  </p>
                )}

                {activeAdminObj.behavior === 'iframe' && activeAdminObj.iframe_url && (
                  <iframe
                    src={activeAdminObj.iframe_url}
                    className="w-full rounded-xl border border-[#1A3A1A]/60"
                    style={{ height: 340 }}
                    title={activeAdminObj.label ?? 'Content'}
                  />
                )}

                {/* Item info (real world description) */}
                {activeAdminObj.item_info_enabled && (
                  <div className="mt-3">
                    {!itemInfoText && !itemInfoLoading && (
                      <button
                        onClick={() => loadItemInfo(activeAdminObj)}
                        className="flex items-center gap-2 text-[#4ADE80] text-sm hover:opacity-80 transition-opacity"
                      >
                        <span>🔍</span>
                        <span>Learn about {activeAdminObj.label ?? 'this item'}</span>
                      </button>
                    )}
                    {itemInfoLoading && (
                      <p className="text-[#4A7A4A] text-sm animate-pulse">Spirit is looking it up…</p>
                    )}
                    {itemInfoText && (
                      <div className="bg-[#0A1A0A] border border-[#1A3A1A]/60 rounded-xl p-3">
                        <p className="text-[#4ADE80] text-[10px] font-bold uppercase tracking-widest mb-1">About this</p>
                        <p className="text-[#C8E8C8] text-sm leading-relaxed">{itemInfoText}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                {activeAdminObj.linked_page && (
                  <button
                    onClick={() => { openDrawer(activeAdminObj.linked_page!, activeAdminObj.label ?? ''); setActiveAdminObj(null); }}
                    className="w-full mt-4 py-3 bg-[#4ADE80] text-[#040A06] font-black text-sm rounded-xl hover:bg-[#22C55E] transition-colors"
                  >
                    Open {activeAdminObj.label} →
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hut Interior 3D modal ──────────────────────────────────── */}
      <AnimatePresence>
        {showHutInterior && (
          <HutInterior
            onClose={() => setShowHutInterior(false)}
            username={currentUserName}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
