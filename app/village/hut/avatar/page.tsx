'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { VillageSound } from '@/lib/sounds/village';

// ─── Avatar configuration options ────────────────────────────────────────────

const SKIN_TONES = [
  { id: 's1', color: '#FDDBB4', label: 'Fair' },
  { id: 's2', color: '#F0C27F', label: 'Light' },
  { id: 's3', color: '#C68642', label: 'Medium' },
  { id: 's4', color: '#8D5524', label: 'Brown' },
  { id: 's5', color: '#5C2A0E', label: 'Deep' },
  { id: 's6', color: '#3B1506', label: 'Ebony' },
];

const HAIR_STYLES = [
  { id: 'h1', label: 'Natural', icon: '🌿' },
  { id: 'h2', label: 'Locs',    icon: '🌀' },
  { id: 'h3', label: 'Fade',    icon: '✂️' },
  { id: 'h4', label: 'Braids',  icon: '🌸' },
  { id: 'h5', label: 'Afro',    icon: '☁️' },
  { id: 'h6', label: 'Short',   icon: '💈' },
];

const HAIR_COLORS = [
  { id: 'c1', color: '#1A0A00' },
  { id: 'c2', color: '#4A2800' },
  { id: 'c3', color: '#8B4513' },
  { id: 'c4', color: '#FFD700' },
  { id: 'c5', color: '#7C3AED' },
  { id: 'c6', color: '#1877F2' },
];

const OUTFITS = [
  { id: 'o1', label: 'Kente',    color: '#D97706', pattern: 'kente',   icon: '🟨' },
  { id: 'o2', label: 'Spirit',   color: '#1877F2', pattern: 'solid',   icon: '🔵' },
  { id: 'o3', label: 'Nature',   color: '#16A34A', pattern: 'solid',   icon: '🟢' },
  { id: 'o4', label: 'Tribal',   color: '#DC2626', pattern: 'tribal',  icon: '🔴' },
  { id: 'o5', label: 'Galaxy',   color: '#7C3AED', pattern: 'cosmic',  icon: '🟣' },
  { id: 'o6', label: 'Sand',     color: '#92400E', pattern: 'solid',   icon: '🟤' },
];

const ACCESSORIES = [
  { id: 'a0', label: 'None',    icon: '◯' },
  { id: 'a1', label: 'Crown',   icon: '👑' },
  { id: 'a2', label: 'Beads',   icon: '📿' },
  { id: 'a3', label: 'Shades',  icon: '🕶️' },
  { id: 'a4', label: 'Ankh',    icon: '☥' },
  { id: 'a5', label: 'Wrap',    icon: '🎀' },
];

interface AvatarConfig {
  skin_id:        string;
  hair_id:        string;
  hair_color_id:  string;
  outfit_id:      string;
  accessory_id:   string;
}

const DEFAULT_CONFIG: AvatarConfig = {
  skin_id:       's4',
  hair_id:       'h1',
  hair_color_id: 'c1',
  outfit_id:     'o1',
  accessory_id:  'a0',
};

// ─── SVG Avatar Preview (Spider-Verse low-poly style) ─────────────────────────
function AvatarPreview({ config, isNight }: { config: AvatarConfig; isNight: boolean }) {
  const skin   = SKIN_TONES.find(s => s.id === config.skin_id)?.color ?? '#C68642';
  const hairC  = HAIR_COLORS.find(c => c.id === config.hair_color_id)?.color ?? '#1A0A00';
  const outfit = OUTFITS.find(o => o.id === config.outfit_id);
  const acc    = ACCESSORIES.find(a => a.id === config.accessory_id);
  const tunic  = outfit?.color ?? '#D97706';
  const hair   = HAIR_STYLES.find(h => h.id === config.hair_id);

  return (
    <svg viewBox="0 0 120 200" width="120" height="200" style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.3))' }}>
      {/* ── LEGS ── */}
      <rect x="45" y="135" width="14" height="45" rx="7" fill="#1A0A00" stroke="#111" strokeWidth="2" />
      <rect x="61" y="135" width="14" height="45" rx="7" fill="#1A0A00" stroke="#111" strokeWidth="2" />
      {/* Shoes */}
      <ellipse cx="52" cy="180" rx="11" ry="7" fill="#111" />
      <ellipse cx="68" cy="180" rx="11" ry="7" fill="#111" />

      {/* ── ARMS ── */}
      <rect x="22" y="82" width="13" height="44" rx="6" fill={tunic} stroke="#111" strokeWidth="2" />
      <rect x="85" y="82" width="13" height="44" rx="6" fill={tunic} stroke="#111" strokeWidth="2" />
      {/* Hands */}
      <circle cx="28" cy="130" r="7" fill={skin} stroke="#111" strokeWidth="1.5" />
      <circle cx="92" cy="130" r="7" fill={skin} stroke="#111" strokeWidth="1.5" />

      {/* ── TORSO ── */}
      <rect x="34" y="78" width="52" height="62" rx="10" fill="#111" />
      <rect x="36" y="80" width="48" height="58" rx="8" fill={tunic} />
      {/* Kente stripes on outfit */}
      {outfit?.pattern === 'kente' && (
        <>
          <rect x="36" y="98" width="48" height="5" fill={isNight ? '#1877F2' : '#DC2626'} opacity="0.6" />
          <rect x="36" y="108" width="48" height="3" fill="#FFD700" opacity="0.5" />
          <rect x="36" y="116" width="48" height="5" fill={isNight ? '#1877F2' : '#DC2626'} opacity="0.6" />
        </>
      )}
      {outfit?.pattern === 'tribal' && (
        <>
          {[90,102,114].map(y => (
            <path key={y} d={`M36,${y} L84,${y} M36,${y+4} L84,${y+4}`} stroke="#000" strokeWidth="1.5" opacity="0.3" />
          ))}
        </>
      )}
      {/* Collar */}
      <path d="M52,80 L60,92 L68,80" fill="none" stroke={isNight ? '#93C5FD' : '#92400E'} strokeWidth="2" />

      {/* ── NECK ── */}
      <rect x="52" y="70" width="16" height="14" rx="5" fill={skin} stroke="#111" strokeWidth="1.5" />

      {/* ── HEAD ── */}
      {/* Head outline */}
      <ellipse cx="60" cy="50" rx="30" ry="34" fill="#111" />
      {/* Face */}
      <ellipse cx="60" cy="50" rx="27" ry="31" fill={skin} />
      {/* Eyes */}
      <ellipse cx="50" cy="48" rx="6" ry="7" fill="#fff" stroke="#111" strokeWidth="1" />
      <ellipse cx="70" cy="48" rx="6" ry="7" fill="#fff" stroke="#111" strokeWidth="1" />
      <circle cx="51" cy="49" r="3.5" fill="#111" />
      <circle cx="71" cy="49" r="3.5" fill="#111" />
      <circle cx="52" cy="47" r="1" fill="#fff" />
      <circle cx="72" cy="47" r="1" fill="#fff" />
      {/* Nose */}
      <ellipse cx="60" cy="57" rx="3" ry="2" fill="none" stroke={skin === '#FDDBB4' ? '#E0A882' : '#111'} strokeWidth="1.5" />
      {/* Smile */}
      <path d="M50,63 Q60,70 70,63" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" />

      {/* ── HAIR ── */}
      {config.hair_id === 'h5' && ( // Afro
        <>
          <ellipse cx="60" cy="26" rx="32" ry="28" fill={hairC} stroke="#111" strokeWidth="2" />
          <ellipse cx="34" cy="38" rx="12" ry="16" fill={hairC} stroke="#111" strokeWidth="1.5" />
          <ellipse cx="86" cy="38" rx="12" ry="16" fill={hairC} stroke="#111" strokeWidth="1.5" />
        </>
      )}
      {config.hair_id === 'h2' && ( // Locs
        <>
          <ellipse cx="60" cy="22" rx="27" ry="20" fill={hairC} stroke="#111" strokeWidth="2" />
          {[-14,-7,0,7,14].map(x => (
            <rect key={x} x={60 + x - 3} y="32" width="6" height="30" rx="3" fill={hairC} stroke="#111" strokeWidth="1" />
          ))}
        </>
      )}
      {config.hair_id === 'h4' && ( // Braids
        <>
          <ellipse cx="60" cy="22" rx="27" ry="20" fill={hairC} stroke="#111" strokeWidth="2" />
          {[-10,0,10].map(x => (
            <path key={x} d={`M${60+x},35 Q${60+x+4},50 ${60+x},65`} fill="none" stroke={hairC} strokeWidth="5" strokeLinecap="round" />
          ))}
        </>
      )}
      {config.hair_id === 'h1' && ( // Natural
        <ellipse cx="60" cy="22" rx="27" ry="22" fill={hairC} stroke="#111" strokeWidth="2" />
      )}
      {config.hair_id === 'h3' && ( // Fade
        <>
          <ellipse cx="60" cy="22" rx="27" ry="16" fill={hairC} stroke="#111" strokeWidth="1.5" />
          <ellipse cx="60" cy="28" rx="27" ry="8" fill={hairC} opacity="0.4" />
        </>
      )}
      {config.hair_id === 'h6' && ( // Short
        <ellipse cx="60" cy="24" rx="26" ry="14" fill={hairC} stroke="#111" strokeWidth="1.5" />
      )}

      {/* ── ACCESSORIES ── */}
      {acc?.id === 'a1' && ( // Crown
        <>
          {[-12,-6,0,6,12].map(x => (
            <rect key={x} x={48+x} y={1} width={4} height={10} rx={2} fill="#FFD700" stroke="#111" strokeWidth="1" />
          ))}
          <rect x="36" y="10" width="48" height="8" rx="3" fill="#FFD700" stroke="#111" strokeWidth="1.5" />
        </>
      )}
      {acc?.id === 'a3' && ( // Shades
        <>
          <rect x="38" y="44" width="18" height="11" rx="5" fill="#111" opacity="0.85" />
          <rect x="64" y="44" width="18" height="11" rx="5" fill="#111" opacity="0.85" />
          <line x1="56" y1="49" x2="64" y2="49" stroke="#111" strokeWidth="2" />
          <line x1="36" y1="49" x2="38" y2="49" stroke="#111" strokeWidth="2" />
          <line x1="82" y1="49" x2="84" y2="49" stroke="#111" strokeWidth="2" />
        </>
      )}
      {acc?.id === 'a2' && ( // Beads
        <>
          {[0,10,20,30,40,50,60,70,80,90,100,110,120,130,140,150,160,170].map((deg, i) => {
            const rad = (deg * Math.PI) / 180;
            return <circle key={i} cx={60 + Math.cos(rad) * 22} cy={68 + Math.sin(rad) * 12} r="2.5"
              fill={['#FFD700','#DC2626','#16A34A'][i % 3]} stroke="#111" strokeWidth="0.5" />;
          })}
        </>
      )}
      {acc?.id === 'a4' && ( // Ankh on chest
        <>
          <rect x="57" y="88" width="6" height="20" rx="2" fill="#FFD700" stroke="#111" strokeWidth="1" />
          <rect x="50" y="90" width="20" height="5" rx="2" fill="#FFD700" stroke="#111" strokeWidth="1" />
          <ellipse cx="60" cy="89" rx="6" ry="8" fill="none" stroke="#FFD700" strokeWidth="3" />
        </>
      )}
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AvatarBuilderPage() {
  const [config, setConfig]   = useState<AvatarConfig>(DEFAULT_CONFIG);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [activeSection, setActiveSection] = useState<'skin'|'hair'|'outfit'|'accessory'>('skin');
  const supabase = createClient();
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';

  const bg     = isNight ? '#0A0B12' : '#FFF8EE';
  const cardBg = isNight ? '#12152A' : '#FFFFFF';
  const border = isNight ? '#1E2240' : '#FED7AA';
  const textMain = isNight ? '#F0EBE0' : '#2D1F0E';
  const textMute = isNight ? '#4A4F72' : '#8B6F47';
  const accent   = '#1877F2';

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: p } = await (supabase as any).from('profiles').select('avatar_config').eq('id', user.id).single();
      if (p?.avatar_config) setConfig(p.avatar_config);
    }
    load();
  }, []);

  function update(key: keyof AvatarConfig, value: string) {
    setConfig(prev => ({ ...prev, [key]: value }));
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
    setTimeout(() => setSaved(false), 2500);
    setSaving(false);
  }

  const SECTIONS = [
    { id: 'skin' as const,      label: 'Skin',      icon: '🎨' },
    { id: 'hair' as const,      label: 'Hair',      icon: '✂️' },
    { id: 'outfit' as const,    label: 'Outfit',    icon: '👘' },
    { id: 'accessory' as const, label: 'Accessory', icon: '💎' },
  ];

  return (
    <div className="min-h-screen" style={{ background: bg }}>
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 border-b"
        style={{ background: isNight ? '#0E1020' : accent, borderColor: isNight ? '#1E2240' : 'transparent' }}>
        <Link href="/village/hut" className="text-xl text-white">←</Link>
        <div className="flex-1">
          <h1 className="font-black text-white text-base">Build Your Avatar</h1>
          <p className="text-white/60 text-xs">Spider-Verse style · Shows in the village</p>
        </div>
      </div>

      {/* Avatar preview */}
      <div className="flex justify-center py-8" style={{ background: isNight ? 'linear-gradient(180deg, #0A0B12, #0E1020)' : 'linear-gradient(180deg, #FFF8EE, #FFF0E0)' }}>
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <AvatarPreview config={config} isNight={isNight} />
        </motion.div>
      </div>

      {/* Section tabs */}
      <div className="flex border-b mx-4 mb-4" style={{ borderColor: border }}>
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            className="flex-1 py-3 text-sm font-bold transition-all"
            style={{
              color: activeSection === s.id ? accent : textMute,
              borderBottom: activeSection === s.id ? `2px solid ${accent}` : '2px solid transparent',
            }}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      <div className="max-w-lg mx-auto px-4 pb-8 space-y-4">

        {/* SKIN */}
        {activeSection === 'skin' && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: textMute }}>Skin Tone</p>
            <div className="grid grid-cols-6 gap-2">
              {SKIN_TONES.map(s => (
                <motion.button key={s.id} whileTap={{ scale: 0.9 }} onClick={() => update('skin_id', s.id)}
                  className="aspect-square rounded-2xl flex items-center justify-center transition-all"
                  style={{
                    background: s.color,
                    border: config.skin_id === s.id ? `3px solid ${accent}` : '3px solid transparent',
                    boxShadow: config.skin_id === s.id ? `0 0 0 2px ${accent}40` : 'none',
                  }}>
                  {config.skin_id === s.id && <span className="text-white text-xs font-black drop-shadow">✓</span>}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* HAIR */}
        {activeSection === 'hair' && (
          <>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: textMute }}>Hair Style</p>
              <div className="grid grid-cols-3 gap-2">
                {HAIR_STYLES.map(h => (
                  <motion.button key={h.id} whileTap={{ scale: 0.95 }} onClick={() => update('hair_id', h.id)}
                    className="rounded-2xl py-3 text-sm font-bold transition-all flex flex-col items-center gap-1"
                    style={{
                      background: config.hair_id === h.id ? (isNight ? '#12152A' : '#EEF2FF') : cardBg,
                      border: `2px solid ${config.hair_id === h.id ? accent : border}`,
                      color: config.hair_id === h.id ? accent : textMute,
                    }}>
                    <span className="text-2xl">{h.icon}</span>
                    <span className="text-xs">{h.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: textMute }}>Hair Color</p>
              <div className="flex gap-2">
                {HAIR_COLORS.map(c => (
                  <motion.button key={c.id} whileTap={{ scale: 0.9 }} onClick={() => update('hair_color_id', c.id)}
                    className="w-10 h-10 rounded-full transition-all"
                    style={{
                      background: c.color,
                      border: config.hair_color_id === c.id ? `3px solid ${accent}` : `3px solid ${border}`,
                      boxShadow: config.hair_color_id === c.id ? `0 0 0 2px ${accent}40` : 'none',
                    }} />
                ))}
              </div>
            </div>
          </>
        )}

        {/* OUTFIT */}
        {activeSection === 'outfit' && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: textMute }}>Outfit Style</p>
            <div className="grid grid-cols-3 gap-2">
              {OUTFITS.map(o => (
                <motion.button key={o.id} whileTap={{ scale: 0.95 }} onClick={() => update('outfit_id', o.id)}
                  className="rounded-2xl py-3 text-sm font-bold transition-all flex flex-col items-center gap-1"
                  style={{
                    background: config.outfit_id === o.id ? o.color + '20' : cardBg,
                    border: `2px solid ${config.outfit_id === o.id ? o.color : border}`,
                    color: config.outfit_id === o.id ? o.color : textMute,
                  }}>
                  <span className="text-2xl">{o.icon}</span>
                  <span className="text-xs">{o.label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* ACCESSORY */}
        {activeSection === 'accessory' && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: textMute }}>Accessory</p>
            <div className="grid grid-cols-3 gap-2">
              {ACCESSORIES.map(a => (
                <motion.button key={a.id} whileTap={{ scale: 0.95 }} onClick={() => update('accessory_id', a.id)}
                  className="rounded-2xl py-3 text-sm font-bold transition-all flex flex-col items-center gap-1"
                  style={{
                    background: config.accessory_id === a.id ? (isNight ? '#12152A' : '#EEF2FF') : cardBg,
                    border: `2px solid ${config.accessory_id === a.id ? accent : border}`,
                    color: config.accessory_id === a.id ? accent : textMute,
                  }}>
                  <span className="text-2xl">{a.icon}</span>
                  <span className="text-xs">{a.label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Save avatar */}
        <button onClick={save} disabled={saving}
          className="w-full rounded-2xl py-4 font-black text-white text-base transition-all disabled:opacity-50"
          style={{ background: `linear-gradient(135deg, ${accent}, #4F46E5)` }}>
          {saved ? '✓ Avatar Saved to Village!' : saving ? 'Saving…' : '✊ Save My Avatar'}
        </button>

        {/* Choose Spirit */}
        <Link href="/village/spirit/choose"
          className="flex items-center justify-between w-full rounded-2xl px-5 py-4 transition-all"
          style={{ background: isNight ? 'rgba(24,119,242,0.08)' : 'rgba(24,119,242,0.06)', border: `1px solid ${isNight ? 'rgba(24,119,242,0.25)' : 'rgba(24,119,242,0.2)'}` }}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌀</span>
            <div>
              <p className="font-bold text-sm" style={{ color: isNight ? '#93C5FD' : '#1D4ED8' }}>Choose Your Spirit</p>
              <p className="text-xs" style={{ color: isNight ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)' }}>
                Blue, White, or Dark — your Spirit companion
              </p>
            </div>
          </div>
          <span style={{ color: isNight ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }}>›</span>
        </Link>
      </div>
    </div>
  );
}
