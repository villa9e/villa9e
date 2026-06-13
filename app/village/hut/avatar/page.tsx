'use client';
import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import * as THREE from 'three';
import { createClient } from '@/lib/supabase/client';
import {
  SKIN_TONE_MAP, HAIR_COLOR_MAP, SHIRT_COLOR_MAP,
  type AvatarConfig, type CharacterType, type BodyType,
  DEFAULT_AVATAR_CONFIG, resolveCharacterURL,
} from '@/lib/avatar/config';

// ─── Data constants ────────────────────────────────────────────────────────────

const CHARACTER_TYPES: { id: CharacterType; label: string; suggested?: boolean }[] = [
  { id: 'casual',  label: 'Casual',    suggested: true },
  { id: 'casual2', label: 'Casual 2' },
  { id: 'casual3', label: 'Casual 3',  suggested: true },
  { id: 'suit',    label: 'Business',  suggested: true },
  { id: 'worker',  label: 'Worker' },
  { id: 'doctor',  label: 'Healer' },
  { id: 'chef',    label: 'Chef' },
  { id: 'kimono',  label: 'Kimono' },
  { id: 'ninja',   label: 'Ninja' },
  { id: 'pirate',  label: 'Pirate' },
  { id: 'cowboy',  label: 'Cowboy' },
  { id: 'knight',  label: 'Knight' },
  { id: 'elf',     label: 'Elf' },
  { id: 'wizard',  label: 'Wizard' },
  { id: 'witch',   label: 'Witch' },
  { id: 'warrior', label: 'Warrior' },
  { id: 'rogue',   label: 'Rogue' },
  { id: 'soldier', label: 'Soldier' },
];

const SKIN_TONES = Object.keys(SKIN_TONE_MAP).map(id => ({ id, color: SKIN_TONE_MAP[id] }));
const HAIR_COLORS = Object.keys(HAIR_COLOR_MAP).map(id => ({ id, color: HAIR_COLOR_MAP[id] }));
const OUTFIT_COLORS = Object.keys(SHIRT_COLOR_MAP).map(id => ({ id, color: SHIRT_COLOR_MAP[id] }));

const HAIR_STYLES = [
  { id: 'buzz',      label: 'Buzz',      group: 'Short' },
  { id: 'crop',      label: 'Crop',      group: 'Short' },
  { id: 'fade',      label: 'Fade',      group: 'Short' },
  { id: 'tapered',   label: 'Tapered',   group: 'Short' },
  { id: 'textured',  label: 'Textured',  group: 'Medium' },
  { id: 'wavy',      label: 'Wavy',      group: 'Medium' },
  { id: 'side-part', label: 'Side Part', group: 'Medium' },
  { id: 'layered',   label: 'Layered',   group: 'Medium' },
  { id: 'straight',  label: 'Straight',  group: 'Long' },
  { id: 'curly',     label: 'Curly',     group: 'Long' },
  { id: 'braids',    label: 'Braids',    group: 'Long' },
  { id: 'locs',      label: 'Locs',      group: 'Long' },
  { id: 'mohawk',    label: 'Mohawk',    group: 'Special' },
  { id: 'afro',      label: 'Afro',      group: 'Special' },
  { id: 'updo',      label: 'Updo',      group: 'Special' },
  { id: 'bun',       label: 'Bun',       group: 'Special' },
];

const HAIR_STYLE_GROUPS = ['Short', 'Medium', 'Long', 'Special'];

const FACIAL_HAIR_OPTIONS = [
  { id: 'none',        label: 'None' },
  { id: 'stubble',     label: 'Stubble' },
  { id: 'short-beard', label: 'Short Beard' },
  { id: 'full-beard',  label: 'Full Beard' },
  { id: 'mustache',    label: 'Mustache' },
  { id: 'goatee',      label: 'Goatee' },
];

const FACE_ACCESSORY_OPTIONS = [
  { id: 'none',       label: 'None' },
  { id: 'glasses-1',  label: 'Glasses 1' },
  { id: 'glasses-2',  label: 'Glasses 2' },
  { id: 'glasses-3',  label: 'Glasses 3' },
  { id: 'earrings-1', label: 'Earrings 1' },
  { id: 'earrings-2', label: 'Earrings 2' },
  { id: 'freckles',   label: 'Freckles' },
];

const HAT_OPTIONS = [
  { id: 'none',        label: 'None' },
  { id: 'cap-forward', label: 'Cap (Forward)' },
  { id: 'cap-back',    label: 'Cap (Back)' },
  { id: 'beanie',      label: 'Beanie' },
  { id: 'hood',        label: 'Hood' },
];

const JEWELRY_OPTIONS = [
  { id: 'none',        label: 'None' },
  { id: 'necklace-1',  label: 'Necklace 1' },
  { id: 'necklace-2',  label: 'Necklace 2' },
  { id: 'bracelet',    label: 'Bracelet' },
  { id: 'watch',       label: 'Watch' },
];

const BACKGROUND_SCENES = [
  { id: 'village-square', label: 'Village Square' },
  { id: 'office',         label: 'Office' },
  { id: 'galaxy',         label: 'Galaxy' },
  { id: 'mountain',       label: 'Mountain' },
  { id: 'city',           label: 'City' },
  { id: 'gradient',       label: 'Plain Gradient' },
];

const ACHIEVEMENT_BADGES = [
  {
    id: 'first-goal',
    name: 'First Goal',
    icon: 'shield',
    iconColor: '#0D9488',
    locked: true,
    unlock: 'Complete your first GPS goal',
  },
  {
    id: 'village-elder',
    name: 'Village Elder',
    icon: 'crown',
    iconColor: '#D97706',
    locked: true,
    unlock: 'Stake 2,000 $VICO',
  },
  {
    id: 'oowop-legend',
    name: 'OoWop Legend',
    icon: 'fist',
    iconColor: '#D97706',
    locked: true,
    unlock: 'Receive 10,000 OoWops',
  },
  {
    id: 'sprint-master',
    name: 'Sprint Master',
    icon: 'lightning',
    iconColor: '#7C3AED',
    locked: true,
    unlock: 'Complete 50 sprints',
  },
];

const IDLE_ANIMATIONS = [
  { id: 'standard_idle',   label: 'Standard Idle' },
  { id: 'confident_stand', label: 'Confident Stand' },
  { id: 'casual_lean',     label: 'Casual Lean' },
  { id: 'thinking',        label: 'Thinking' },
  { id: 'ready_stance',    label: 'Ready Stance' },
  { id: 'celebration',     label: 'Celebration' },
];

const REACTION_ANIMATIONS = [
  { id: 'wave',      label: 'Wave' },
  { id: 'thumbs-up', label: 'Thumbs Up' },
  { id: 'clap',      label: 'Clap' },
  { id: 'point',     label: 'Point' },
  { id: 'shrug',     label: 'Shrug' },
  { id: 'fist-pump', label: 'Fist Pump' },
];

const LIP_COLORS = [
  { id: 'none',  color: 'transparent', label: 'None',  border: '#ccc' },
  { id: 'nude',  color: '#E8B8A0',     label: 'Nude' },
  { id: 'pink',  color: '#F4A0B5',     label: 'Pink' },
  { id: 'red',   color: '#C41E3A',     label: 'Red' },
  { id: 'deep',  color: '#4A1428',     label: 'Deep' },
];

const EYE_SHADOWS = [
  { id: 'none',     color: 'transparent', label: 'None',     border: '#ccc' },
  { id: 'subtle',   color: '#D4C5B0',     label: 'Subtle' },
  { id: 'dramatic', color: '#8B6F5A',     label: 'Dramatic' },
  { id: 'colorful', color: '#9B59B6',     label: 'Colorful' },
];

type TabId = 'style' | 'skin' | 'hair' | 'face' | 'outfit' | 'accessories' | 'animations';

// ─── SVG badge icons ───────────────────────────────────────────────────────────
function BadgeIcon({ icon, color }: { icon: string; color: string }) {
  if (icon === 'shield') return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill={color}>
      <path d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z"/>
    </svg>
  );
  if (icon === 'crown') return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill={color}>
      <path d="M2 19h20v2H2v-2zm18-9l-4 4-4-6-4 6-4-4-2 9h20l-2-9z"/>
    </svg>
  );
  if (icon === 'fist') return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill={color}>
      <path d="M7 9V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2h1a2 2 0 0 1 2 2v5a6 6 0 0 1-6 6H8a6 6 0 0 1-6-6v-5a2 2 0 0 1 2-2h3z"/>
    </svg>
  );
  if (icon === 'lightning') return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill={color}>
      <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/>
    </svg>
  );
  return null;
}

// ─── 3D character preview ────────────────────────────────────────────────────
function CharacterModel({ url, skinColor, hairColor, shirtColor, autoRotate }: {
  url: string; skinColor: string; hairColor: string; shirtColor: string; autoRotate: boolean;
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

    clone.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const applyToon = (mat: THREE.Material) => {
        const src = mat as any;
        const name = mat.name.toLowerCase();
        let color = (src.color ?? new THREE.Color('#FFFFFF')).clone();
        if (name.includes('skin') || name.includes('body') || name.includes('face') || name.includes('head'))
          color = new THREE.Color(skinColor);
        else if (name.includes('hair') || name.includes('eyebrow') || name.includes('lash'))
          color = new THREE.Color(hairColor);
        else if (name.includes('shirt') || name.includes('cloth') || name.includes('top') || name.includes('jacket') || name.includes('outfit'))
          color = new THREE.Color(shirtColor);
        return new THREE.MeshToonMaterial({ color, map: src.map ?? null, gradientMap: gradMap });
      };
      if (Array.isArray(mesh.material)) mesh.material = mesh.material.map(applyToon);
      else mesh.material = applyToon(mesh.material);
    });
    return clone;
  }, [scene, skinColor, hairColor, shirtColor]);

  useFrame((_, delta) => {
    if (groupRef.current && autoRotate) groupRef.current.rotation.y += delta * 0.5;
  });

  return (
    <group ref={groupRef} position={[0, -1.1, 0]}>
      <primitive object={cloned} />
    </group>
  );
}

// ─── Pill button ───────────────────────────────────────────────────────────────
function Pill({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap"
      style={{
        background: selected ? '#EBF3FF' : '#F0F4FF',
        color: selected ? '#1877F2' : 'rgba(30,27,75,0.55)',
        border: `1.5px solid ${selected ? '#1877F2' : 'transparent'}`,
      }}
    >
      {label}
    </button>
  );
}

// ─── Section header ────────────────────────────────────────────────────────────
function SectionLabel({ label }: { label: string }) {
  return (
    <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: 'rgba(30,27,75,0.4)' }}>
      {label}
    </p>
  );
}

// ─── Slider row ────────────────────────────────────────────────────────────────
function SliderRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-bold w-24 shrink-0" style={{ color: 'rgba(30,27,75,0.65)' }}>{label}</span>
      <input
        type="range" min={0} max={100} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: '#1877F2' }}
      />
      <span className="text-xs font-black w-8 text-right" style={{ color: '#1877F2' }}>{value}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AvatarBuilderPage() {
  const [config, setConfig]           = useState<AvatarConfig>(DEFAULT_AVATAR_CONFIG);
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [activeTab, setActiveTab]     = useState<TabId>('style');
  const [autoRotate, setAutoRotate]   = useState(true);
  const [photoModal, setPhotoModal]   = useState(false);
  const [previewToast, setPreviewToast] = useState<string | null>(null);
  const supabase = createClient();

  const gltfUrl    = resolveCharacterURL(config);
  const skinColor  = SKIN_TONE_MAP[config.skin_id]        ?? '#A86030';
  const hairColor  = HAIR_COLOR_MAP[config.hair_color_id] ?? '#0C0700';
  const shirtColor = SHIRT_COLOR_MAP[config.outfit_id]    ?? '#2563EB';

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      (supabase as any).from('profiles').select('avatar_config').eq('id', user.id).single()
        .then(({ data: p }: any) => {
          if (p?.avatar_config && Object.keys(p.avatar_config).length > 0)
            setConfig({ ...DEFAULT_AVATAR_CONFIG, ...p.avatar_config });
        });
    });
  }, []);

  function update<K extends keyof AvatarConfig>(key: K, val: AvatarConfig[K]) {
    setConfig(prev => ({ ...prev, [key]: val }));
    setAutoRotate(false);
  }

  async function save() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Read current avatar_config first — it's shared with spirit_variant and
      // Google Calendar tokens (gcal_access_token/gcal_token_expiry), so a
      // blind overwrite would clobber those.
      const { data: profile } = await (supabase as any)
        .from('profiles').select('avatar_config').eq('id', user.id).single();
      const updated = { ...(profile?.avatar_config ?? {}), ...config };
      await (supabase as any).from('profiles').update({ avatar_config: updated }).eq('id', user.id);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    setSaving(false);
  }

  function showPreviewToast(label: string) {
    setPreviewToast(`Preview: ${label}`);
    setTimeout(() => setPreviewToast(null), 2000);
  }

  const TABS: { id: TabId; label: string }[] = [
    { id: 'style',       label: 'Style' },
    { id: 'skin',        label: 'Skin' },
    { id: 'hair',        label: 'Hair' },
    { id: 'face',        label: 'Face' },
    { id: 'outfit',      label: 'Outfit' },
    { id: 'accessories', label: 'Accessories' },
    { id: 'animations',  label: 'Animations' },
  ];

  return (
    <div className="fixed inset-0 flex" style={{ background: '#F0F4FF' }}>

      {/* ── 3D Canvas ── */}
      <div className="absolute inset-0">
        <Canvas
          camera={{ position: [0, 1.4, 3.5], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: 'linear-gradient(160deg, #E8EEFF 0%, #F5F0FF 50%, #EFF8FF 100%)' }}
          shadows
        >
          <ambientLight intensity={1.2} color="#FFFFFF" />
          <directionalLight position={[4, 8, 5]} intensity={2.0} castShadow color="#FFF8F0" />
          <directionalLight position={[-4, 3, -3]} intensity={0.8} color="#D0E4FF" />
          <pointLight position={[0, 5, 2]} intensity={0.6} color="#FFE4CC" />
          <hemisphereLight args={['#C8E4FF', '#E8F0FF', 0.5]} />

          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.11, 0]} receiveShadow>
            <circleGeometry args={[1.8, 40]} />
            <meshBasicMaterial color="#1877F2" transparent opacity={0.08} />
          </mesh>

          <Suspense fallback={null}>
            <CharacterModel
              url={gltfUrl}
              skinColor={skinColor}
              hairColor={hairColor}
              shirtColor={shirtColor}
              autoRotate={autoRotate}
            />
          </Suspense>

          <OrbitControls
            enablePan={false}
            target={[0, 0.4, 0]}
            minPolarAngle={Math.PI * 0.1}
            maxPolarAngle={Math.PI * 0.85}
            minDistance={1.5}
            maxDistance={6}
          />
        </Canvas>
      </div>

      {/* ── Top bar ── */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center gap-3 px-4"
        style={{ height: 56, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1.5px solid rgba(24,119,242,0.2)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <Link href="/village/hut"
          className="w-9 h-9 flex items-center justify-center rounded-full"
          style={{ color: '#1877F2', background: 'rgba(24,119,242,0.08)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </Link>
        <div className="flex-1">
          <p className="font-black text-sm" style={{ color: '#1A1A2E' }}>Avatar Studio</p>
          <p className="text-xs" style={{ color: 'rgba(30,27,75,0.45)' }}>
            {config.character_type} · {config.body_type}
          </p>
        </div>
        <Link href="/village/hut/avatar/gallery"
          className="w-9 h-9 flex items-center justify-center rounded-full text-xs font-black"
          style={{ color: '#1877F2', background: 'rgba(24,119,242,0.08)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
        </Link>
        <button onClick={() => setAutoRotate(r => !r)}
          className="w-9 h-9 flex items-center justify-center rounded-full text-sm font-bold transition-colors"
          style={{ background: autoRotate ? 'rgba(24,119,242,0.12)' : 'rgba(30,27,75,0.06)', color: autoRotate ? '#1877F2' : 'rgba(30,27,75,0.5)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
        </button>
        <button onClick={save} disabled={saving}
          className="px-4 py-2 rounded-xl text-xs font-black transition-colors disabled:opacity-50"
          style={{ background: saved ? '#16A34A' : '#1877F2', color: '#fff' }}>
          {saved ? 'Saved' : saving ? '...' : 'Save'}
        </button>
      </div>

      {/* ── Right slide-out panel ── */}
      <div className="absolute top-[56px] bottom-0 right-0 z-20 flex flex-col"
        style={{ width: 'min(320px, 88vw)', background: '#FFFFFF', borderLeft: '1.5px solid rgba(24,119,242,0.15)', boxShadow: '-8px 0 32px rgba(0,0,0,0.08)' }}>

        {/* Tab strip — scrollable horizontal */}
        <div className="border-b overflow-x-auto scrollbar-hide" style={{ borderColor: 'rgba(24,119,242,0.15)' }}>
          <div className="flex" style={{ minWidth: 'max-content' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className="px-3 py-2.5 text-[11px] font-bold transition-colors whitespace-nowrap"
                style={{
                  color: activeTab === t.id ? '#1877F2' : 'rgba(30,27,75,0.35)',
                  borderBottom: `2px solid ${activeTab === t.id ? '#1877F2' : 'transparent'}`,
                  background: 'transparent',
                }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">

          {/* ── STYLE TAB ── */}
          {activeTab === 'style' && (
            <>
              <div>
                <SectionLabel label="Body Type" />
                <div className="flex gap-2">
                  {(['male', 'female'] as BodyType[]).map(bt => (
                    <button key={bt} onClick={() => update('body_type', bt)}
                      className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all"
                      style={{
                        background: config.body_type === bt ? '#1877F2' : '#F0F4FF',
                        color: config.body_type === bt ? '#fff' : 'rgba(30,27,75,0.6)',
                        border: `1.5px solid ${config.body_type === bt ? '#1877F2' : 'transparent'}`,
                      }}>
                      {bt === 'male' ? 'Male' : 'Female'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Photo match */}
              <button
                onClick={() => setPhotoModal(true)}
                className="w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                style={{ background: '#F0F4FF', color: '#1877F2', border: '1.5px solid rgba(24,119,242,0.3)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                Match my photo
              </button>

              <div>
                <SectionLabel label="Character Style" />
                <div className="grid grid-cols-3 gap-2">
                  {CHARACTER_TYPES.map(ct => (
                    <button key={ct.id} onClick={() => update('character_type', ct.id)}
                      className="py-2.5 rounded-2xl flex flex-col items-center gap-1 relative transition-all"
                      style={{
                        background: config.character_type === ct.id ? '#EBF3FF' : '#F8F9FF',
                        border: `2px solid ${config.character_type === ct.id ? '#1877F2' : 'transparent'}`,
                      }}>
                      {ct.suggested && (
                        <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full text-[8px] font-black"
                          style={{ background: '#0D9488', color: '#fff' }}>
                          Suggested
                        </span>
                      )}
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-xs"
                        style={{ background: config.character_type === ct.id ? '#1877F2' : 'rgba(30,27,75,0.08)', color: config.character_type === ct.id ? '#fff' : 'rgba(30,27,75,0.4)' }}>
                        {ct.label.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-[10px] font-bold" style={{ color: config.character_type === ct.id ? '#1877F2' : 'rgba(30,27,75,0.5)' }}>
                        {ct.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── SKIN TAB ── */}
          {activeTab === 'skin' && (
            <>
              <div>
                <SectionLabel label="Skin Tone" />
                <div className="grid grid-cols-4 gap-3">
                  {SKIN_TONES.map(s => (
                    <button key={s.id} onClick={() => update('skin_id', s.id)}
                      className="aspect-square rounded-2xl transition-all"
                      style={{
                        background: s.color,
                        border: `3px solid ${config.skin_id === s.id ? '#1877F2' : 'transparent'}`,
                        boxShadow: config.skin_id === s.id ? '0 0 0 2px #fff, 0 0 0 4px #1877F2' : '0 2px 6px rgba(0,0,0,0.15)',
                      }} />
                  ))}
                </div>
              </div>

              <div>
                <SectionLabel label="Undertone" />
                <div className="flex gap-2">
                  {(['cool', 'neutral', 'warm'] as const).map(ut => (
                    <Pill key={ut} label={ut.charAt(0).toUpperCase() + ut.slice(1)}
                      selected={config.skin_undertone === ut}
                      onClick={() => update('skin_undertone', ut)} />
                  ))}
                </div>
              </div>

              <div>
                <SectionLabel label="Lip Color" />
                <div className="flex gap-3">
                  {LIP_COLORS.map(lc => (
                    <button key={lc.id} onClick={() => update('makeup_lip', lc.id)}
                      className="w-9 h-9 rounded-full transition-all flex items-center justify-center"
                      style={{
                        background: lc.color === 'transparent' ? '#F0F4FF' : lc.color,
                        border: `3px solid ${config.makeup_lip === lc.id ? '#1877F2' : (lc.border ?? 'transparent')}`,
                        boxShadow: config.makeup_lip === lc.id ? '0 0 0 2px #fff, 0 0 0 4px #1877F2' : '0 2px 6px rgba(0,0,0,0.12)',
                      }}>
                      {lc.id === 'none' && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(30,27,75,0.3)" strokeWidth="2">
                          <line x1="4" y1="4" x2="20" y2="20"/>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <SectionLabel label="Eye Shadow" />
                <div className="flex gap-3">
                  {EYE_SHADOWS.map(es => (
                    <button key={es.id} onClick={() => update('makeup_eye', es.id)}
                      className="w-9 h-9 rounded-full transition-all flex items-center justify-center"
                      style={{
                        background: es.color === 'transparent' ? '#F0F4FF' : es.color,
                        border: `3px solid ${config.makeup_eye === es.id ? '#1877F2' : (es.border ?? 'transparent')}`,
                        boxShadow: config.makeup_eye === es.id ? '0 0 0 2px #fff, 0 0 0 4px #1877F2' : '0 2px 6px rgba(0,0,0,0.12)',
                      }}>
                      {es.id === 'none' && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(30,27,75,0.3)" strokeWidth="2">
                          <line x1="4" y1="4" x2="20" y2="20"/>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── HAIR TAB ── */}
          {activeTab === 'hair' && (
            <>
              <div>
                <SectionLabel label="Hair Style" />
                {HAIR_STYLE_GROUPS.map(group => (
                  <div key={group} className="mb-3">
                    <p className="text-[9px] font-black uppercase tracking-wider mb-1.5" style={{ color: 'rgba(30,27,75,0.3)' }}>{group}</p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {HAIR_STYLES.filter(h => h.group === group).map(h => (
                        <Pill key={h.id} label={h.label}
                          selected={config.hair_id === h.id}
                          onClick={() => update('hair_id', h.id)} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <SectionLabel label="Hair Color" />
                <div className="grid grid-cols-4 gap-3">
                  {HAIR_COLORS.map(h => (
                    <button key={h.id} onClick={() => update('hair_color_id', h.id)}
                      className="aspect-square rounded-2xl transition-all"
                      style={{
                        background: h.color,
                        border: `3px solid ${config.hair_color_id === h.id ? '#1877F2' : 'transparent'}`,
                        boxShadow: config.hair_color_id === h.id ? '0 0 0 2px #fff, 0 0 0 4px #1877F2' : '0 2px 6px rgba(0,0,0,0.15)',
                      }} />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── FACE TAB ── */}
          {activeTab === 'face' && (
            <>
              <div>
                <SectionLabel label="Face Shape" />
                <div className="space-y-3">
                  <SliderRow label="Face Width"  value={config.face_width}  onChange={v => update('face_width', v)} />
                  <SliderRow label="Eye Size"    value={config.eye_size}    onChange={v => update('eye_size', v)} />
                  <SliderRow label="Nose Shape"  value={config.nose_shape}  onChange={v => update('nose_shape', v)} />
                  <SliderRow label="Jaw Shape"   value={config.jaw_shape}   onChange={v => update('jaw_shape', v)} />
                </div>
              </div>

              <div>
                <SectionLabel label="Facial Hair" />
                <div className="flex flex-wrap gap-2">
                  {FACIAL_HAIR_OPTIONS.map(opt => (
                    <Pill key={opt.id} label={opt.label}
                      selected={config.facial_hair_id === opt.id}
                      onClick={() => update('facial_hair_id', opt.id)} />
                  ))}
                </div>
              </div>

              <div>
                <SectionLabel label="Face Accessories" />
                <div className="flex flex-wrap gap-2">
                  {FACE_ACCESSORY_OPTIONS.map(opt => (
                    <Pill key={opt.id} label={opt.label}
                      selected={config.face_accessory_id === opt.id}
                      onClick={() => update('face_accessory_id', opt.id)} />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── OUTFIT TAB ── */}
          {activeTab === 'outfit' && (
            <div>
              <SectionLabel label="Outfit Color" />
              <div className="grid grid-cols-4 gap-3">
                {OUTFIT_COLORS.map(o => (
                  <button key={o.id} onClick={() => update('outfit_id', o.id)}
                    className="aspect-square rounded-2xl transition-all"
                    style={{
                      background: o.color,
                      border: `3px solid ${config.outfit_id === o.id ? '#1877F2' : 'transparent'}`,
                      boxShadow: config.outfit_id === o.id ? '0 0 0 2px #fff, 0 0 0 4px #1877F2' : '0 2px 6px rgba(0,0,0,0.15)',
                    }} />
                ))}
              </div>
            </div>
          )}

          {/* ── ACCESSORIES TAB ── */}
          {activeTab === 'accessories' && (
            <>
              <div>
                <SectionLabel label="Hat" />
                <div className="flex flex-wrap gap-2">
                  {HAT_OPTIONS.map(opt => (
                    <Pill key={opt.id} label={opt.label}
                      selected={config.hat_id === opt.id}
                      onClick={() => update('hat_id', opt.id)} />
                  ))}
                </div>
              </div>

              <div>
                <SectionLabel label="Jewelry" />
                <div className="flex flex-wrap gap-2">
                  {JEWELRY_OPTIONS.map(opt => (
                    <Pill key={opt.id} label={opt.label}
                      selected={config.jewelry_id === opt.id}
                      onClick={() => update('jewelry_id', opt.id)} />
                  ))}
                </div>
              </div>

              <div>
                <SectionLabel label="Achievement Badges" />
                <div className="grid grid-cols-2 gap-3">
                  {ACHIEVEMENT_BADGES.map(badge => (
                    <div key={badge.id}
                      className="rounded-2xl p-3 flex flex-col items-center gap-2 text-center"
                      style={{ background: '#F8F9FF', border: '1.5px solid rgba(30,27,75,0.08)' }}>
                      <div className="relative">
                        <div style={{ opacity: 0.3 }}>
                          <BadgeIcon icon={badge.icon} color={badge.iconColor} />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(30,27,75,0.4)">
                            <rect x="3" y="11" width="18" height="11" rx="2"/>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                          </svg>
                        </div>
                      </div>
                      <p className="text-[10px] font-black" style={{ color: 'rgba(30,27,75,0.5)' }}>{badge.name}</p>
                      <p className="text-[9px] leading-tight" style={{ color: 'rgba(30,27,75,0.35)' }}>{badge.unlock}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <SectionLabel label="Background Scene" />
                <div className="grid grid-cols-2 gap-2">
                  {BACKGROUND_SCENES.map(scene => (
                    <Pill key={scene.id} label={scene.label}
                      selected={config.background_scene_id === scene.id}
                      onClick={() => update('background_scene_id', scene.id)} />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── ANIMATIONS TAB ── */}
          {activeTab === 'animations' && (
            <>
              <div>
                <SectionLabel label="Default Idle" />
                <div className="flex flex-col gap-2">
                  {IDLE_ANIMATIONS.map(anim => (
                    <Pill key={anim.id} label={anim.label}
                      selected={config.default_idle_animation === anim.id}
                      onClick={() => update('default_idle_animation', anim.id)} />
                  ))}
                </div>
              </div>

              <div>
                <SectionLabel label="Reaction Animations" />
                <div className="grid grid-cols-2 gap-2">
                  {REACTION_ANIMATIONS.map(anim => (
                    <button key={anim.id}
                      onClick={() => showPreviewToast(anim.label)}
                      className="py-2 rounded-xl text-xs font-bold transition-all"
                      style={{ background: '#F0F4FF', color: 'rgba(30,27,75,0.65)', border: '1.5px solid transparent' }}>
                      {anim.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl p-3 text-center"
                style={{ background: 'rgba(124,58,237,0.06)', border: '1.5px solid rgba(124,58,237,0.2)' }}>
                <p className="text-xs font-black" style={{ color: '#7C3AED' }}>Mixamo animations coming soon</p>
                <p className="text-[10px] mt-1" style={{ color: 'rgba(30,27,75,0.45)' }}>
                  Full motion library including walk cycles, expressions, and sport animations will be available in the next update.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Save footer */}
        <div className="p-4 border-t" style={{ borderColor: 'rgba(24,119,242,0.15)' }}>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={save}
            disabled={saving}
            className="w-full py-3.5 rounded-2xl font-black text-sm text-white disabled:opacity-50"
            style={{ background: saved ? '#16A34A' : 'linear-gradient(135deg, #1877F2, #0D47A1)', boxShadow: '0 4px 16px rgba(24,119,242,0.35)' }}>
            {saved ? 'Avatar Saved to Village' : saving ? 'Saving...' : 'Save Avatar'}
          </motion.button>
          {saved && (
            <p className="text-center text-xs mt-2 font-bold" style={{ color: '#16A34A' }}>
              Your avatar will appear in the village on next load.
            </p>
          )}
        </div>
      </div>

      {/* ── Photo match modal ── */}
      <AnimatePresence>
        {photoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-6"
            style={{ background: 'rgba(10,10,20,0.6)', backdropFilter: 'blur(4px)' }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="rounded-3xl p-6 max-w-xs w-full"
              style={{ background: '#fff', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(24,119,242,0.1)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1877F2" strokeWidth="2" strokeLinecap="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </div>
              <p className="font-black text-base text-center mb-2" style={{ color: '#1A1A2E' }}>Photo Match</p>
              <p className="text-sm text-center leading-relaxed" style={{ color: 'rgba(30,27,75,0.55)' }}>
                Photo match coming soon — we will use your selfie to suggest the best styles for your face shape.
              </p>
              <button
                onClick={() => setPhotoModal(false)}
                className="w-full mt-5 py-3 rounded-2xl font-black text-sm text-white"
                style={{ background: '#1877F2' }}>
                OK
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Reaction preview toast ── */}
      <AnimatePresence>
        {previewToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl font-bold text-sm text-white"
            style={{ background: 'rgba(10,10,20,0.8)', backdropFilter: 'blur(8px)' }}>
            {previewToast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
