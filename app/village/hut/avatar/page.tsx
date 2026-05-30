'use client';
import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import * as THREE from 'three';
import { createClient } from '@/lib/supabase/client';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { VillageSound } from '@/lib/sounds/village';
import {
  SKIN_TONE_MAP, HAIR_COLOR_MAP, SHIRT_COLOR_MAP,
  type AvatarConfig, type CharacterType, type BodyType,
  DEFAULT_AVATAR_CONFIG, resolveCharacterURL,
} from '@/lib/avatar/config';

// ─── Config options ────────────────────────────────────────────────────────────
const CHARACTER_TYPES: { id: CharacterType; label: string; icon: string; description: string }[] = [
  { id: 'casual',  label: 'Casual',   icon: '👕', description: 'Everyday streetwear' },
  { id: 'casual2', label: 'Casual 2', icon: '🧢', description: 'Hoodie + sneakers' },
  { id: 'casual3', label: 'Casual 3', icon: '🧣', description: 'Layered look' },
  { id: 'suit',    label: 'Business', icon: '🕴️', description: 'Sharp suit' },
  { id: 'worker',  label: 'Worker',   icon: '👷', description: 'Builder gear' },
  { id: 'doctor',  label: 'Healer',   icon: '🩺', description: 'Medical coat' },
  { id: 'chef',    label: 'Chef',     icon: '👨‍🍳', description: 'Culinary master' },
  { id: 'kimono',  label: 'Kimono',   icon: '👘', description: 'Traditional zen' },
  { id: 'ninja',   label: 'Ninja',    icon: '🥷', description: 'Shadow warrior' },
  { id: 'pirate',  label: 'Pirate',   icon: '🏴‍☠️', description: 'Sea adventurer' },
  { id: 'cowboy',  label: 'Cowboy',   icon: '🤠', description: 'Wild West rider' },
  { id: 'knight',  label: 'Knight',   icon: '⚔️', description: 'Armored warrior' },
  { id: 'elf',     label: 'Elf',      icon: '🧝', description: 'Forest mystic' },
  { id: 'wizard',  label: 'Wizard',   icon: '🧙', description: 'Magic wielder' },
  { id: 'witch',   label: 'Witch',    icon: '🧙‍♀️', description: 'Spellcaster' },
  { id: 'warrior', label: 'Warrior',  icon: '🗡️', description: 'Battle-hardened' },
  { id: 'rogue',   label: 'Rogue',    icon: '🗡️', description: 'Stealthy trickster' },
  { id: 'soldier', label: 'Soldier',  icon: '🪖', description: 'Combat ready' },
];

const BODY_TYPES: { id: BodyType; label: string; icon: string }[] = [
  { id: 'male',   label: 'Male',   icon: '♂' },
  { id: 'female', label: 'Female', icon: '♀' },
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
  { id: 'o1', label: 'Kente',  }, { id: 'o2', label: 'Spirit' },
  { id: 'o3', label: 'Nature', }, { id: 'o4', label: 'Tribal' },
  { id: 'o5', label: 'Galaxy', }, { id: 'o6', label: 'Earth'  },
  { id: 'o7', label: 'Teal',   }, { id: 'o8', label: 'Rose'   },
];

const ACCESSORIES = [
  { id: 'a0', label: 'None',   icon: '◯'  },
  { id: 'a1', label: 'Crown',  icon: '👑' },
  { id: 'a2', label: 'Beads',  icon: '📿' },
  { id: 'a3', label: 'Shades', icon: '🕶️' },
  { id: 'a4', label: 'Ankh',   icon: '☥'  },
  { id: 'a5', label: 'Wrap',   icon: '🎀' },
];

// ─── 3D character inside the preview canvas ───────────────────────────────────
function CharacterModel({ url, skinColor, hairColor, shirtColor }: {
  url: string; skinColor: string; hairColor: string; shirtColor: string;
}) {
  const { scene } = useGLTF(url);
  const groupRef = useRef<THREE.Group>(null);

  const cloned = useMemo(() => {
    const clone = scene.clone(true);
    const gradData = new Uint8Array([80, 255]);
    const gradMap = new THREE.DataTexture(gradData, 2, 1, THREE.RedFormat);
    gradMap.magFilter = THREE.NearestFilter;
    gradMap.minFilter = THREE.NearestFilter;
    gradMap.needsUpdate = true;

    const skinC  = new THREE.Color(skinColor);
    const hairC  = new THREE.Color(hairColor);
    const shirtC = new THREE.Color(shirtColor);

    clone.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      const applyToon = (mat: THREE.Material) => {
        const src = mat as any;
        const baseMap: THREE.Texture | null = src.map ?? null;
        const name = mat.name.toLowerCase();
        let color = (src.color ?? new THREE.Color('#FFFFFF')).clone();

        if (name.includes('skin') || name.includes('body') || name.includes('face') || name.includes('head'))
          color = skinC.clone();
        else if (name.includes('hair') || name.includes('eyebrow') || name.includes('lash'))
          color = hairC.clone();
        else if (name.includes('shirt') || name.includes('cloth') || name.includes('top') || name.includes('jacket') || name.includes('outfit'))
          color = shirtC.clone();

        return new THREE.MeshToonMaterial({ color, map: baseMap, gradientMap: gradMap });
      };
      if (Array.isArray(mesh.material)) mesh.material = mesh.material.map(applyToon);
      else mesh.material = applyToon(mesh.material);
    });
    return clone;
  }, [scene, skinColor, hairColor, shirtColor]);

  // Slow auto-rotate
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.4;
  });

  return (
    <group ref={groupRef} position={[0, -0.9, 0]}>
      <primitive object={cloned} />
    </group>
  );
}

// ─── Full 3D preview canvas ───────────────────────────────────────────────────
function AvatarCanvas({ config }: { config: AvatarConfig }) {
  const url       = resolveCharacterURL(config);
  const skinColor  = SKIN_TONE_MAP[config.skin_id]        ?? '#A86030';
  const hairColor  = HAIR_COLOR_MAP[config.hair_color_id] ?? '#0C0700';
  const shirtColor = SHIRT_COLOR_MAP[config.outfit_id]    ?? '#2563EB';

  return (
    <Canvas
      camera={{ position: [0, 1.2, 3.2], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={1.2} />
      <directionalLight position={[3, 6, 4]} intensity={2.2} castShadow />
      <directionalLight position={[-3, 2, -2]} intensity={0.6} />

      <Suspense fallback={null}>
        <CharacterModel
          url={url}
          skinColor={skinColor}
          hairColor={hairColor}
          shirtColor={shirtColor}
        />
      </Suspense>

      <OrbitControls
        enablePan={false}
        minPolarAngle={Math.PI * 0.2}
        maxPolarAngle={Math.PI * 0.78}
        minDistance={2}
        maxDistance={5}
      />
    </Canvas>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AvatarBuilderPage() {
  const [config, setConfig]       = useState<AvatarConfig>(DEFAULT_AVATAR_CONFIG);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [activeTab, setActiveTab] = useState<'character' | 'skin' | 'hair' | 'outfit' | 'accessory'>('character');
  const supabase = createClient();
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';

  const bg       = isNight ? '#07080F' : '#FFF5EE';
  const cardBg   = isNight ? '#0F1124' : '#FFFFFF';
  const border   = isNight ? '#1E2240' : '#FED7AA';
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
    <div className="min-h-screen flex flex-col" style={{ background: bg }}>
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3"
        style={{ background: isNight ? 'rgba(7,8,15,0.95)' : 'rgba(255,245,238,0.95)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${border}` }}>
        <Link href="/village/hut" className="w-9 h-9 rounded-full flex items-center justify-center text-lg"
          style={{ background: 'rgba(255,255,255,0.1)', color: isNight ? '#fff' : '#2D1F0E' }}>←</Link>
        <div className="flex-1">
          <h1 className="font-black text-sm" style={{ color: textMain }}>Build Your Avatar</h1>
          <p className="text-xs" style={{ color: textMute }}>3D character · Drag to rotate</p>
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

      {/* ── 3D avatar preview ── */}
      <div className="relative flex-shrink-0" style={{
        height: 320,
        background: isNight
          ? 'radial-gradient(ellipse at center top, #1A1F3A 0%, #070810 100%)'
          : 'radial-gradient(ellipse at center top, #E0ECFF 0%, #F0F4FF 100%)',
      }}>
        {/* Ground reflection disc */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-32 h-4 rounded-full"
          style={{ background: 'rgba(0,0,0,0.15)', filter: 'blur(8px)' }} />

        <AvatarCanvas config={config} />

        {/* Drag hint */}
        <div className="absolute bottom-3 left-0 right-0 text-center">
          <span className="text-xs px-3 py-1 rounded-full" style={{ color: textMute, background: isNight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.6)' }}>
            ↺ Drag to rotate · Pinch to zoom
          </span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b flex-shrink-0" style={{ borderColor: border, background: cardBg }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className="flex-1 py-3 text-sm font-bold transition-all"
            style={{
              color: activeTab === t.id ? accent : textMute,
              borderBottom: activeTab === t.id ? `2.5px solid ${accent}` : '2.5px solid transparent',
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div className="flex-1 overflow-y-auto max-w-lg mx-auto w-full px-4 pb-24">
        <AnimatePresence mode="wait">

          {/* CHARACTER TYPE */}
          {activeTab === 'character' && (
            <motion.div key="character" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="pt-5 space-y-5">

              {/* Body type */}
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
                        <div className="mt-2 text-xs font-bold" style={{ color: accent }}>✓ Active</div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-center" style={{ color: textMute }}>
                Your 3D character uses Quaternius CC0 models — see the live preview above.
              </p>
            </motion.div>
          )}

          {/* SKIN */}
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
                      boxShadow: config.skin_id === s.id ? `0 0 0 2px ${accent}55` : '0 2px 8px rgba(0,0,0,0.15)',
                    }}>
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
              <p className="text-xs text-center" style={{ color: textMute }}>
                Skin color applies to skin/face/body materials on the 3D model
              </p>
            </motion.div>
          )}

          {/* HAIR */}
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

          {/* OUTFIT */}
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
                      background: config.outfit_id === o.id ? (SHIRT_COLOR_MAP[o.id] ?? '#2563EB') + '25' : cardBg,
                      border: `2px solid ${config.outfit_id === o.id ? (SHIRT_COLOR_MAP[o.id] ?? accent) : border}`,
                    }}>
                    <div className="w-7 h-7 rounded-full"
                      style={{ background: SHIRT_COLOR_MAP[o.id] ?? '#2563EB', boxShadow: `0 2px 8px ${(SHIRT_COLOR_MAP[o.id] ?? '#2563EB')}60` }} />
                    <span className="text-xs font-bold" style={{ color: config.outfit_id === o.id ? (SHIRT_COLOR_MAP[o.id] ?? accent) : textMute }}>
                      {o.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ACCESSORY */}
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
              <p className="text-xs mt-4 text-center" style={{ color: textMute }}>
                Accessories render as visual overlays on your character.
              </p>
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
