'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { VillageSound } from '@/lib/sounds/village';
import {
  SKIN_TONE_MAP, HAIR_COLOR_MAP, SHIRT_COLOR_MAP,
  type AvatarConfig, type CharacterType, type BodyType,
  DEFAULT_AVATAR_CONFIG,
} from '@/lib/avatar/config';

// ─── Avatar config options ────────────────────────────────────────────────────

const CHARACTER_TYPES: { id: CharacterType; label: string; icon: string; description: string }[] = [
  { id:'casual',  label:'Casual',  icon:'👕', description:'Everyday streetwear — classic look' },
  { id:'casual2', label:'Casual 2', icon:'🧢', description:'Hoodie + sneakers — relaxed vibe' },
  { id:'casual3', label:'Casual 3', icon:'🧣', description:'Layered look — trendy style' },
  { id:'worker',  label:'Worker',   icon:'👷', description:'Builder gear — hard at work' },
  { id:'doctor',  label:'Healer',   icon:'🩺', description:'Medical coat — wellness focused' },
  { id:'kimono',  label:'Kimono',   icon:'👘', description:'Traditional Japanese robe — zen mastery' },
];

const BODY_TYPES: { id: BodyType; label: string; icon: string }[] = [
  { id:'male',   label:'Male',   icon:'♂️' },
  { id:'female', label:'Female', icon:'♀️' },
];

const SKIN_TONES = [
  { id: 's1', label: 'Porcelain' }, { id: 's2', label: 'Beige' },
  { id: 's3', label: 'Golden' },   { id: 's4', label: 'Tan' },
  { id: 's5', label: 'Medium' },   { id: 's6', label: 'Warm' },
  { id: 's7', label: 'Deep' },     { id: 's8', label: 'Ebony' },
];

const HAIR_STYLES = [
  { id: 'h1', label: 'Afro',    icon: '☁️' },
  { id: 'h2', label: 'Natural', icon: '🌿' },
  { id: 'h3', label: 'Locs',    icon: '🌀' },
  { id: 'h4', label: 'Braids',  icon: '〰️' },
  { id: 'h5', label: 'Fade',    icon: '✂️' },
  { id: 'h6', label: 'Short',   icon: '💈' },
];

const HAIR_COLORS = Object.keys(HAIR_COLOR_MAP).map(id => ({ id }));

const OUTFITS = [
  { id: 'o1', label: 'Kente',   icon: '🟨' },
  { id: 'o2', label: 'Spirit',  icon: '🔵' },
  { id: 'o3', label: 'Nature',  icon: '🟢' },
  { id: 'o4', label: 'Tribal',  icon: '🔴' },
  { id: 'o5', label: 'Galaxy',  icon: '🟣' },
  { id: 'o6', label: 'Earth',   icon: '🟤' },
  { id: 'o7', label: 'Teal',    icon: '🩵' },
  { id: 'o8', label: 'Rose',    icon: '🩷' },
];

const ACCESSORIES = [
  { id: 'a0', label: 'None',   icon: '◯'  },
  { id: 'a1', label: 'Crown',  icon: '👑' },
  { id: 'a2', label: 'Beads',  icon: '📿' },
  { id: 'a3', label: 'Shades', icon: '🕶️' },
  { id: 'a4', label: 'Ankh',   icon: '☥'  },
  { id: 'a5', label: 'Wrap',   icon: '🎀' },
];

// AvatarConfig and DEFAULT_AVATAR_CONFIG imported from @/lib/avatar/config

// ─── High-quality cartoon SVG preview ────────────────────────────────────────
// Proportions match the 3D character: big head (~38% of height), large eyes
function AvatarSVG({ config, isNight, size = 200 }: { config: AvatarConfig; isNight: boolean; size?: number }) {
  const sk  = SKIN_TONE_MAP[config.skin_id] ?? '#A86030';
  const hc  = HAIR_COLOR_MAP[config.hair_color_id] ?? '#0C0700';
  const sh  = SHIRT_COLOR_MAP[config.outfit_id] ?? '#2563EB';

  // Derived colors
  function hex2rgb(hex: string) {
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    return { r, g, b };
  }
  function darker(hex: string, amt = 30) {
    const { r, g, b } = hex2rgb(hex);
    return `rgb(${Math.max(0,r-amt)},${Math.max(0,g-amt)},${Math.max(0,b-amt)})`;
  }
  function lighter(hex: string, amt = 20) {
    const { r, g, b } = hex2rgb(hex);
    return `rgb(${Math.min(255,r+amt)},${Math.min(255,g+amt)},${Math.min(255,b+amt)})`;
  }

  const skD = darker(sk, 22);
  const skL = lighter(sk, 18);
  const shD = darker(sh, 30);
  const pnt = '#1A2A3A';
  const sho = '#1A1A1A';
  const lip = `rgb(${Math.max(0,hex2rgb(sk).r-50)},${Math.max(0,hex2rgb(sk).g-90)},${Math.max(0,hex2rgb(sk).b-80)})`;

  // Viewbox: 0 0 140 220
  return (
    <svg viewBox="0 0 140 220" width={size} height={size * 220/140}
      style={{ filter: 'drop-shadow(0 12px 32px rgba(0,0,0,0.35))', overflow: 'visible' }}>
      <defs>
        <radialGradient id="headGrad" cx="45%" cy="38%" r="60%">
          <stop offset="0%" stopColor={skL} />
          <stop offset="100%" stopColor={skD} />
        </radialGradient>
        <radialGradient id="eyeGrad" cx="35%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#FFFCF5" />
          <stop offset="100%" stopColor="#F0ECE8" />
        </radialGradient>
        <radialGradient id="shirtGrad" cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor={lighter(sh,25)} />
          <stop offset="100%" stopColor={shD} />
        </radialGradient>
        <filter id="softShadow">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.2" />
        </filter>
      </defs>

      {/* ── LEGS ── */}
      <rect x="50" y="152" width="16" height="50" rx="8" fill={pnt} />
      <rect x="74" y="152" width="16" height="50" rx="8" fill={pnt} />
      {/* Shoes */}
      <ellipse cx="58" cy="202" rx="13" ry="8" fill={sho} />
      <ellipse cx="82" cy="202" rx="13" ry="8" fill={sho} />
      <ellipse cx="56" cy="200" rx="11" ry="5" fill="#444" />
      <ellipse cx="80" cy="200" rx="11" ry="5" fill="#444" />

      {/* ── ARMS ── */}
      {/* Left arm */}
      <path d="M 44 95 Q 28 110 26 138" stroke={sh} strokeWidth="16" fill="none" strokeLinecap="round" />
      <circle cx="26" cy="140" r="9" fill={sk} stroke={skD} strokeWidth="1" />
      {/* Right arm */}
      <path d="M 96 95 Q 112 110 114 138" stroke={sh} strokeWidth="16" fill="none" strokeLinecap="round" />
      <circle cx="114" cy="140" r="9" fill={sk} stroke={skD} strokeWidth="1" />

      {/* ── TORSO ── */}
      <rect x="40" y="88" width="60" height="68" rx="12" fill="url(#shirtGrad)" />
      {/* Shirt outline */}
      <rect x="40" y="88" width="60" height="68" rx="12" fill="none" stroke={shD} strokeWidth="1.5" />
      {/* Collar V-neck */}
      <path d="M58,90 L70,106 L82,90" fill="none" stroke={lighter(sh,40)} strokeWidth="2.5" strokeLinecap="round" />
      {/* Kente stripes */}
      {config.outfit_id === 'o1' && (
        <>
          <rect x="40" y="112" width="60" height="5" rx="2" fill="#FFD700" opacity="0.55" />
          <rect x="40" y="122" width="60" height="3" rx="1" fill="#DC2626" opacity="0.5" />
          <rect x="40" y="130" width="60" height="5" rx="2" fill="#16A34A" opacity="0.45" />
        </>
      )}
      {/* Belt */}
      <rect x="40" y="148" width="60" height="8" rx="3" fill="#111" />
      <rect x="64" y="149" width="12" height="6" rx="2" fill="#C9A020" />

      {/* ── NECK ── */}
      <rect x="57" y="78" width="26" height="18" rx="9" fill={sk} stroke={skD} strokeWidth="1" />

      {/* ── HEAD (big cartoon head) ── */}
      {/* Head shadow */}
      <ellipse cx="71" cy="52" rx="35" ry="39" fill="rgba(0,0,0,0.12)" transform="translate(2,3)" />
      {/* Head */}
      <ellipse cx="70" cy="50" rx="36" ry="40" fill="url(#headGrad)" stroke={skD} strokeWidth="1.5" />
      {/* Cheek highlight left */}
      <ellipse cx="44" cy="55" rx="10" ry="8" fill={skL} opacity="0.4" />
      {/* Cheek highlight right */}
      <ellipse cx="96" cy="55" rx="10" ry="8" fill={skL} opacity="0.4" />
      {/* Cheek blush left */}
      <ellipse cx="46" cy="56" rx="9" ry="6" fill="#E87868" opacity="0.18" />
      <ellipse cx="94" cy="56" rx="9" ry="6" fill="#E87868" opacity="0.18" />

      {/* ── EYES (large, expressive — cartoon style) ── */}
      {/* Left eye socket shadow */}
      <ellipse cx="55" cy="46" rx="11" ry="12" fill={skD} opacity="0.3" transform="translate(0.5,1)" />
      {/* Left eye white */}
      <ellipse cx="54" cy="45" rx="10" ry="11" fill="url(#eyeGrad)" stroke="#ccc" strokeWidth="0.5" />
      {/* Left iris */}
      <circle cx="54" cy="46" r="7.5" fill="#1A0E06" />
      {/* Iris color ring */}
      <circle cx="54" cy="46" r="6.5" fill="#3E1E0A" />
      {/* Pupil */}
      <circle cx="54" cy="46" r="4.2" fill="#050200" />
      {/* Main catchlight */}
      <circle cx="50.5" cy="42.5" r="2.2" fill="#FFFFFF" />
      {/* Secondary catchlight */}
      <circle cx="56.5" cy="48.5" r="1.1" fill="rgba(255,255,255,0.7)" />
      {/* Top lash */}
      <path d="M44,37 Q54,34 64,37" fill={hc} opacity="0.9" stroke={hc} strokeWidth="2.2" strokeLinecap="round" />
      {/* Lower lash hint */}
      <path d="M46,55 Q54,58 62,55" fill="none" stroke={skD} strokeWidth="0.8" opacity="0.6" />

      {/* Right eye socket shadow */}
      <ellipse cx="86" cy="46" rx="11" ry="12" fill={skD} opacity="0.3" transform="translate(0.5,1)" />
      {/* Right eye white */}
      <ellipse cx="86" cy="45" rx="10" ry="11" fill="url(#eyeGrad)" stroke="#ccc" strokeWidth="0.5" />
      <circle cx="86" cy="46" r="7.5" fill="#1A0E06" />
      <circle cx="86" cy="46" r="6.5" fill="#3E1E0A" />
      <circle cx="86" cy="46" r="4.2" fill="#050200" />
      <circle cx="82.5" cy="42.5" r="2.2" fill="#FFFFFF" />
      <circle cx="88.5" cy="48.5" r="1.1" fill="rgba(255,255,255,0.7)" />
      <path d="M76,37 Q86,34 96,37" fill={hc} opacity="0.9" stroke={hc} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M78,55 Q86,58 94,55" fill="none" stroke={skD} strokeWidth="0.8" opacity="0.6" />

      {/* ── EYEBROWS ── */}
      <path d="M44,30 Q54,26 64,30" fill="none" stroke={hc} strokeWidth="3" strokeLinecap="round" />
      <path d="M76,30 Q86,26 96,30" fill="none" stroke={hc} strokeWidth="3" strokeLinecap="round" />

      {/* ── NOSE ── */}
      <ellipse cx="70" cy="60" rx="4.5" ry="3.5" fill="none" stroke={darker(sk, 35)} strokeWidth="1.8" strokeLinecap="round" />

      {/* ── MOUTH — wide cartoon smile ── */}
      {/* Smile arc */}
      <path d="M55,70 Q70,82 85,70" fill={lip} stroke={darker(sk,55)} strokeWidth="1" />
      <path d="M55,70 Q70,82 85,70" fill="none" stroke={darker(sk,55)} strokeWidth="2.5" strokeLinecap="round" />
      {/* Teeth hint */}
      <path d="M58,70 Q70,78 82,70" fill="white" opacity="0.7" />
      {/* Mouth corners */}
      <circle cx="55" cy="70" r="2.5" fill={lip} />
      <circle cx="85" cy="70" r="2.5" fill={lip} />

      {/* ── HAIR ── */}
      {/* Afro */}
      {config.hair_id === 'h1' && (
        <>
          <ellipse cx="70" cy="22" rx="40" ry="36" fill={hc} />
          <ellipse cx="34" cy="35" rx="14" ry="20" fill={hc} />
          <ellipse cx="106" cy="35" rx="14" ry="20" fill={hc} />
          {/* Hairline */}
          <path d="M34,52 Q70,62 106,52" fill={hc} />
          {/* Shine */}
          <ellipse cx="58" cy="14" rx="12" ry="7" fill="rgba(255,255,255,0.08)" />
        </>
      )}
      {/* Natural */}
      {config.hair_id === 'h2' && (
        <>
          <ellipse cx="70" cy="20" rx="36" ry="28" fill={hc} />
          <path d="M34,42 Q70,55 106,42" fill={hc} />
          {/* Natural texture bumps */}
          {[-15,-5,5,15].map((ox,i) => (
            <ellipse key={i} cx={70+ox} cy={14+Math.abs(ox)*0.3} rx="8" ry="7" fill={lighter(hc,10)} opacity="0.4" />
          ))}
        </>
      )}
      {/* Locs */}
      {config.hair_id === 'h3' && (
        <>
          <ellipse cx="70" cy="14" rx="33" ry="22" fill={hc} />
          {[-18,-9,0,9,18].map((x,i) => (
            <path key={i} d={`M${70+x},28 Q${70+x+5},45 ${70+x+2},62`}
              stroke={hc} strokeWidth="7" fill="none" strokeLinecap="round" />
          ))}
          {[-12,0,12].map((x,i) => (
            <path key={i} d={`M${70+x+3},42 Q${70+x+8},55 ${70+x+5},68`}
              stroke={lighter(hc,15)} strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.7" />
          ))}
        </>
      )}
      {/* Braids */}
      {config.hair_id === 'h4' && (
        <>
          <ellipse cx="70" cy="14" rx="33" ry="20" fill={hc} />
          {[-16,-6,4,14].map((x,i) => (
            <g key={i}>
              <path d={`M${58+x*1.5},28 Q${60+x*1.5},50 ${58+x*1.5},72`}
                stroke={hc} strokeWidth="6" fill="none" strokeLinecap="round" />
              <path d={`M${58+x*1.5},28 Q${62+x*1.5},50 ${62+x*1.5},72`}
                stroke={darker(hc,20)} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.6" />
            </g>
          ))}
        </>
      )}
      {/* Fade */}
      {config.hair_id === 'h5' && (
        <>
          <ellipse cx="70" cy="18" rx="33" ry="18" fill={hc} />
          <rect x="37" y="22" width="66" height="16" rx="4" fill={hc} opacity="0.4" />
          <rect x="37" y="34" width="66" height="8" rx="4" fill={hc} opacity="0.2" />
        </>
      )}
      {/* Short */}
      {config.hair_id === 'h6' && (
        <>
          <rect x="37" y="10" width="66" height="22" rx="10" fill={hc} />
          <ellipse cx="70" cy="18" rx="33" ry="15" fill={hc} />
        </>
      )}

      {/* ── ACCESSORIES ── */}
      {/* Crown */}
      {config.accessory_id === 'a1' && (
        <>
          {[-14,-7,0,7,14].map((x,i) => (
            <polygon key={i} points={`${64+x},4 ${67+x},16 ${61+x},16`} fill="#FFD700" stroke="#B8860B" strokeWidth="1" />
          ))}
          <rect x="36" y="15" width="68" height="10" rx="4" fill="#FFD700" stroke="#B8860B" strokeWidth="1.5" />
          {[0,1,2,3].map(i => <circle key={i} cx={50+i*14} cy={20} r="3" fill="#DC2626" />)}
        </>
      )}
      {/* Shades */}
      {config.accessory_id === 'a3' && (
        <>
          <rect x="40" y="39" width="22" height="14" rx="7" fill="#111" opacity="0.88" />
          <rect x="78" y="39" width="22" height="14" rx="7" fill="#111" opacity="0.88" />
          <line x1="62" y1="46" x2="78" y2="46" stroke="#555" strokeWidth="2" />
          <line x1="37" y1="46" x2="40" y2="46" stroke="#555" strokeWidth="2" />
          <line x1="100" y1="46" x2="103" y2="46" stroke="#555" strokeWidth="2" />
          {/* Tinted lens shimmer */}
          <ellipse cx="51" cy="44" rx="8" ry="5" fill="rgba(255,255,255,0.08)" />
          <ellipse cx="89" cy="44" rx="8" ry="5" fill="rgba(255,255,255,0.08)" />
        </>
      )}
      {/* Beads (neck) */}
      {config.accessory_id === 'a2' && (
        <>
          {Array.from({length:18}, (_,i) => {
            const a = (i/18)*Math.PI*2;
            return <circle key={i} cx={70+Math.cos(a)*26} cy={90+Math.sin(a)*8} r="3.5"
              fill={['#FFD700','#DC2626','#16A34A'][i%3]} stroke="#111" strokeWidth="0.5" />;
          })}
        </>
      )}
      {/* Ankh */}
      {config.accessory_id === 'a4' && (
        <>
          <rect x="67" y="100" width="7" height="24" rx="3" fill="#FFD700" stroke="#B8860B" strokeWidth="1" />
          <rect x="58" y="102" width="25" height="7" rx="3" fill="#FFD700" stroke="#B8860B" strokeWidth="1" />
          <ellipse cx="70.5" cy="101" rx="8" ry="10" fill="none" stroke="#FFD700" strokeWidth="4.5" />
        </>
      )}
      {/* Wrap */}
      {config.accessory_id === 'a5' && (
        <path d="M34,42 Q44,30 70,28 Q96,30 106,42 Q96,50 70,52 Q44,50 34,42 Z"
          fill={sh} opacity="0.75" stroke={shD} strokeWidth="1" />
      )}
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AvatarBuilderPage() {
  const [config, setConfig]         = useState<AvatarConfig>(DEFAULT_AVATAR_CONFIG);
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [activeTab, setActiveTab]   = useState<'character'|'skin'|'hair'|'outfit'|'accessory'>('character');
  const supabase                    = createClient();
  const { theme }                   = useVillageTheme();
  const isNight                     = theme === 'night';

  const bg      = isNight ? '#07080F' : '#FFF5EE';
  const cardBg  = isNight ? '#0F1124' : '#FFFFFF';
  const border  = isNight ? '#1E2240' : '#FED7AA';
  const textMain = isNight ? '#F0EBE0' : '#2D1F0E';
  const textMute = isNight ? '#4A4F72' : '#8B6F47';
  const accent   = '#1877F2';

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      (supabase as any).from('profiles').select('avatar_config').eq('id', user.id).single()
        .then(({ data: p }: any) => { if (p?.avatar_config) setConfig({ ...DEFAULT_AVATAR_CONFIG, ...p.avatar_config }); });
    });
  }, []);

  function update(key: keyof AvatarConfig, val: string) {
    setConfig(prev => ({ ...prev, [key]: val } as AvatarConfig));
    VillageSound.tap();
  }

  async function save() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await (supabase as any).from('profiles').update({ avatar_config: config }).eq('id', user.id);
    }
    VillageSound.stepComplete();
    setSaved(true);
    setTimeout(() => setSaved(false), 2800);
    setSaving(false);
  }

  const TABS = [
    { id: 'character' as const, label: 'Type',   icon: '🧬' },
    { id: 'skin' as const,      label: 'Skin',   icon: '🎨' },
    { id: 'hair' as const,      label: 'Hair',   icon: '✂️'  },
    { id: 'outfit' as const,    label: 'Outfit', icon: '👔' },
    { id: 'accessory' as const, label: 'Extras', icon: '💎' },
  ];

  return (
    <div className="min-h-screen" style={{ background: bg }}>
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3"
        style={{ background: isNight ? 'rgba(7,8,15,0.95)' : 'rgba(255,245,238,0.95)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${border}` }}>
        <Link href="/village/hut" className="w-9 h-9 rounded-full flex items-center justify-center text-lg"
          style={{ background: 'rgba(255,255,255,0.1)', color: isNight ? '#fff' : '#2D1F0E' }}>←</Link>
        <div className="flex-1">
          <h1 className="font-black text-sm" style={{ color: textMain }}>Build Your Avatar</h1>
          <p className="text-xs" style={{ color: textMute }}>Cartoon 3D · Shows in the village</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={save}
          disabled={saving}
          className="px-4 py-2 rounded-2xl text-sm font-black text-white disabled:opacity-50"
          style={{ background: saved ? '#16A34A' : `linear-gradient(135deg, ${accent}, #4F46E5)` }}
        >
          {saved ? '✓ Saved!' : saving ? '…' : 'Save'}
        </motion.button>
      </div>

      {/* ── Avatar preview ── */}
      <div className="flex justify-center items-center py-10 relative"
        style={{ background: isNight ? 'linear-gradient(180deg,#0D0F20,#070810)' : 'linear-gradient(180deg,#FFF0E8,#FDE8D8)' }}>
        {/* Glow behind avatar */}
        <div className="absolute w-48 h-48 rounded-full"
          style={{ background: `radial-gradient(circle, ${SHIRT_COLOR_MAP[config.outfit_id] ?? '#2563EB'}40, transparent)`, filter: 'blur(32px)' }} />
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          className="relative z-10"
        >
          <AvatarSVG config={config} isNight={isNight} size={200} />
        </motion.div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b" style={{ borderColor: border }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className="flex-1 py-3 text-sm font-bold transition-all"
            style={{
              color: activeTab === t.id ? accent : textMute,
              borderBottom: activeTab === t.id ? `2.5px solid ${accent}` : '2.5px solid transparent',
              background: 'transparent',
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="max-w-lg mx-auto px-4 pb-10">

        {/* ── CHARACTER TYPE ── */}
        <AnimatePresence mode="wait">
          {activeTab === 'character' && (
            <motion.div key="character" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="pt-5 space-y-5">

              {/* Body type toggle */}
              <div>
                <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: textMute }}>Body Type</p>
                <div className="flex gap-3">
                  {BODY_TYPES.map(b => (
                    <motion.button key={b.id} whileTap={{ scale: 0.94 }}
                      onClick={() => update('body_type', b.id)}
                      className="flex-1 py-3 rounded-2xl font-bold text-sm transition-all"
                      style={{
                        background: config.body_type === b.id ? accent : (isNight ? '#1A1D2E' : '#FFF5EE'),
                        color: config.body_type === b.id ? '#fff' : textMain,
                        border: `2px solid ${config.body_type === b.id ? accent : border}`,
                      }}>
                      {b.icon} {b.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Character type cards */}
              <div>
                <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: textMute }}>Character Style</p>
                <div className="grid grid-cols-2 gap-3">
                  {CHARACTER_TYPES.map(ct => (
                    <motion.button key={ct.id} whileTap={{ scale: 0.96 }}
                      onClick={() => update('character_type', ct.id)}
                      className="p-4 rounded-2xl text-left transition-all"
                      style={{
                        background: config.character_type === ct.id ? (isNight ? '#1A2240' : '#EEF4FF') : (isNight ? '#0F1124' : '#FFFFFF'),
                        border: `2px solid ${config.character_type === ct.id ? accent : border}`,
                        boxShadow: config.character_type === ct.id ? `0 0 0 3px ${accent}20` : 'none',
                      }}>
                      <div className="text-2xl mb-2">{ct.icon}</div>
                      <div className="font-bold text-sm" style={{ color: textMain }}>{ct.label}</div>
                      <div className="text-xs mt-0.5" style={{ color: textMute }}>{ct.description}</div>
                      {config.character_type === ct.id && (
                        <div className="mt-2 text-xs font-bold" style={{ color: accent }}>✓ Selected</div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>

              <p className="text-xs text-center pt-2" style={{ color: textMute }}>
                Your character style appears in the 3D village as a real Quaternius character model.
              </p>
            </motion.div>
          )}

        {/* ── SKIN ── */}
          {activeTab === 'skin' && (
            <motion.div key="skin" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="pt-5 space-y-4">
              <p className="text-xs font-black uppercase tracking-widest" style={{ color: textMute }}>Skin Tone</p>
              <div className="grid grid-cols-8 gap-2">
                {SKIN_TONES.map(s => (
                  <motion.button key={s.id} whileTap={{ scale: 0.88 }}
                    onClick={() => update('skin_id', s.id)}
                    className="aspect-square rounded-2xl relative overflow-hidden"
                    title={s.label}
                    style={{
                      background: SKIN_TONE_MAP[s.id],
                      border: config.skin_id === s.id ? `3px solid ${accent}` : `3px solid transparent`,
                      boxShadow: config.skin_id === s.id ? `0 0 0 2px ${accent}55, 0 4px 16px rgba(0,0,0,0.2)` : '0 2px 8px rgba(0,0,0,0.15)',
                    }}
                  >
                    {config.skin_id === s.id && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white text-sm font-black drop-shadow-lg">✓</span>
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
              <p className="text-xs font-medium text-center" style={{ color: textMute }}>
                {SKIN_TONES.find(s => s.id === config.skin_id)?.label}
              </p>
            </motion.div>
          )}

          {/* ── HAIR ── */}
          {activeTab === 'hair' && (
            <motion.div key="hair" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="pt-5 space-y-5">
              <div>
                <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: textMute }}>Style</p>
                <div className="grid grid-cols-3 gap-2.5">
                  {HAIR_STYLES.map(h => (
                    <motion.button key={h.id} whileTap={{ scale: 0.94 }}
                      onClick={() => update('hair_id', h.id)}
                      className="rounded-2xl py-3.5 flex flex-col items-center gap-1.5 text-sm font-bold transition-all"
                      style={{
                        background: config.hair_id === h.id ? `${accent}18` : cardBg,
                        border: `2px solid ${config.hair_id === h.id ? accent : border}`,
                        color: config.hair_id === h.id ? accent : textMute,
                      }}>
                      <span className="text-2xl">{h.icon}</span>
                      <span className="text-xs font-bold">{h.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: textMute }}>Color</p>
                <div className="flex gap-2.5 flex-wrap">
                  {HAIR_COLORS.map(c => (
                    <motion.button key={c.id} whileTap={{ scale: 0.88 }}
                      onClick={() => update('hair_color_id', c.id)}
                      className="w-11 h-11 rounded-full transition-all"
                      style={{
                        background: HAIR_COLOR_MAP[c.id],
                        border: config.hair_color_id === c.id ? `3px solid ${accent}` : `3px solid ${border}`,
                        boxShadow: config.hair_color_id === c.id ? `0 0 0 2px ${accent}55` : '0 2px 6px rgba(0,0,0,0.2)',
                      }} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── OUTFIT ── */}
          {activeTab === 'outfit' && (
            <motion.div key="outfit" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="pt-5">
              <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: textMute }}>Outfit Color</p>
              <div className="grid grid-cols-4 gap-2.5">
                {OUTFITS.map(o => (
                  <motion.button key={o.id} whileTap={{ scale: 0.94 }}
                    onClick={() => update('outfit_id', o.id)}
                    className="rounded-2xl py-3.5 flex flex-col items-center gap-1.5 transition-all"
                    style={{
                      background: config.outfit_id === o.id ? SHIRT_COLOR_MAP[o.id] + '25' : cardBg,
                      border: `2px solid ${config.outfit_id === o.id ? SHIRT_COLOR_MAP[o.id] : border}`,
                    }}>
                    <div className="w-7 h-7 rounded-full"
                      style={{ background: SHIRT_COLOR_MAP[o.id], boxShadow: `0 2px 8px ${SHIRT_COLOR_MAP[o.id]}60` }} />
                    <span className="text-xs font-bold" style={{ color: config.outfit_id === o.id ? SHIRT_COLOR_MAP[o.id] : textMute }}>
                      {o.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── ACCESSORY ── */}
          {activeTab === 'accessory' && (
            <motion.div key="accessory" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="pt-5">
              <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: textMute }}>Accessory</p>
              <div className="grid grid-cols-3 gap-2.5">
                {ACCESSORIES.map(a => (
                  <motion.button key={a.id} whileTap={{ scale: 0.94 }}
                    onClick={() => update('accessory_id', a.id)}
                    className="rounded-2xl py-3.5 flex flex-col items-center gap-1.5 text-sm font-bold transition-all"
                    style={{
                      background: config.accessory_id === a.id ? `${accent}18` : cardBg,
                      border: `2px solid ${config.accessory_id === a.id ? accent : border}`,
                      color: config.accessory_id === a.id ? accent : textMute,
                    }}>
                    <span className="text-2xl">{a.icon}</span>
                    <span className="text-xs">{a.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Save */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={save}
          disabled={saving}
          className="w-full rounded-2xl py-4 font-black text-white text-base mt-6 disabled:opacity-50 transition-all"
          style={{ background: saved ? '#16A34A' : `linear-gradient(135deg, ${accent}, #4F46E5)`, boxShadow: '0 8px 32px rgba(24,119,242,0.35)' }}
        >
          {saved ? '✓ Avatar Saved to Village!' : saving ? 'Saving to the village…' : '✊ Save My Avatar'}
        </motion.button>

        {/* Spirit chooser link */}
        <Link href="/village/spirit/choose"
          className="flex items-center gap-3 mt-3 p-4 rounded-2xl transition-all"
          style={{ background: isNight ? 'rgba(124,58,237,0.1)' : 'rgba(124,58,237,0.06)', border: `1px solid rgba(124,58,237,0.25)` }}>
          <span className="text-2xl">🌀</span>
          <div className="flex-1">
            <p className="font-bold text-sm" style={{ color: '#7C3AED' }}>Choose Your Spirit</p>
            <p className="text-xs" style={{ color: textMute }}>Your AI companion's appearance</p>
          </div>
          <span style={{ color: textMute }}>›</span>
        </Link>
      </div>
    </div>
  );
}
