'use client';
import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import * as THREE from 'three';
import { createClient } from '@/lib/supabase/client';
import {
  SKIN_TONE_MAP, HAIR_COLOR_MAP, SHIRT_COLOR_MAP,
  type AvatarConfig, type CharacterType, type BodyType,
  DEFAULT_AVATAR_CONFIG, resolveCharacterURL,
} from '@/lib/avatar/config';

const CHARACTER_TYPES: { id: CharacterType; label: string; icon: string }[] = [
  { id: 'casual',  label: 'Casual',   icon: '👕' },
  { id: 'casual2', label: 'Casual 2', icon: '🧢' },
  { id: 'casual3', label: 'Casual 3', icon: '🧣' },
  { id: 'suit',    label: 'Business', icon: '🕴️' },
  { id: 'worker',  label: 'Worker',   icon: '👷' },
  { id: 'doctor',  label: 'Healer',   icon: '🩺' },
  { id: 'chef',    label: 'Chef',     icon: '👨‍🍳' },
  { id: 'kimono',  label: 'Kimono',   icon: '👘' },
  { id: 'ninja',   label: 'Ninja',    icon: '🥷' },
  { id: 'pirate',  label: 'Pirate',   icon: '🏴‍☠️' },
  { id: 'cowboy',  label: 'Cowboy',   icon: '🤠' },
  { id: 'knight',  label: 'Knight',   icon: '⚔️' },
  { id: 'elf',     label: 'Elf',      icon: '🧝' },
  { id: 'wizard',  label: 'Wizard',   icon: '🧙' },
  { id: 'witch',   label: 'Witch',    icon: '🧙‍♀️' },
  { id: 'warrior', label: 'Warrior',  icon: '🗡️' },
  { id: 'rogue',   label: 'Rogue',    icon: '🗡️' },
  { id: 'soldier', label: 'Soldier',  icon: '🪖' },
];

const SKIN_TONES = Object.keys(SKIN_TONE_MAP).map(id => ({ id, color: SKIN_TONE_MAP[id] }));
const HAIR_COLORS = Object.keys(HAIR_COLOR_MAP).map(id => ({ id, color: HAIR_COLOR_MAP[id] }));
const OUTFIT_COLORS = Object.keys(SHIRT_COLOR_MAP).map(id => ({ id, color: SHIRT_COLOR_MAP[id] }));

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

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AvatarBuilderPage() {
  const [config, setConfig]         = useState<AvatarConfig>(DEFAULT_AVATAR_CONFIG);
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [panelOpen, setPanelOpen]   = useState(true);
  const [activeTab, setActiveTab]   = useState<'style' | 'skin' | 'hair' | 'outfit'>('style');
  const [autoRotate, setAutoRotate] = useState(true);
  const supabase = createClient();

  const gltfUrl    = resolveCharacterURL(config);
  const skinColor  = SKIN_TONE_MAP[config.skin_id]        ?? '#A86030';
  const hairColor  = HAIR_COLOR_MAP[config.hair_color_id] ?? '#0C0700';
  const shirtColor = SHIRT_COLOR_MAP[config.outfit_id]    ?? '#2563EB';

  // Load current saved avatar
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
    setAutoRotate(false); // stop auto-rotate when user is tweaking
  }

  async function save() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await (supabase as any).from('profiles').update({ avatar_config: config }).eq('id', user.id);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    setSaving(false);
  }

  const TABS = [
    { id: 'style'  as const, label: 'Style',  icon: '👤' },
    { id: 'skin'   as const, label: 'Skin',   icon: '🎨' },
    { id: 'hair'   as const, label: 'Hair',   icon: '✂️' },
    { id: 'outfit' as const, label: 'Outfit', icon: '👔' },
  ];

  return (
    <div className="fixed inset-0 flex" style={{ background: '#F0F4FF' }}>

      {/* ── 3D Canvas — full screen background ── */}
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

          {/* Shadow disk */}
          <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -1.11, 0]} receiveShadow>
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
          <p className="font-black text-sm" style={{ color: '#1A1A2E' }}>Avatar Builder</p>
          <p className="text-xs" style={{ color: 'rgba(30,27,75,0.45)' }}>
            {config.character_type} · {config.body_type}
          </p>
        </div>
        <button onClick={() => setAutoRotate(r => !r)}
          className="w-9 h-9 flex items-center justify-center rounded-full text-sm font-bold transition-colors"
          style={{ background: autoRotate ? 'rgba(24,119,242,0.12)' : 'rgba(30,27,75,0.06)', color: autoRotate ? '#1877F2' : 'rgba(30,27,75,0.5)' }}>
          ↺
        </button>
        <button onClick={save} disabled={saving}
          className="px-4 py-2 rounded-xl text-xs font-black transition-colors disabled:opacity-50"
          style={{ background: saved ? '#16A34A' : '#1877F2', color: '#fff' }}>
          {saved ? '✓ Saved!' : saving ? '…' : 'Save'}
        </button>
      </div>

      {/* ── Right slide-out panel ── */}
      <div className="absolute top-[56px] bottom-0 right-0 z-20 flex flex-col"
        style={{ width: 'min(320px, 88vw)', background: '#FFFFFF', borderLeft: '1.5px solid rgba(24,119,242,0.15)', boxShadow: '-8px 0 32px rgba(0,0,0,0.08)' }}>

        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: 'rgba(24,119,242,0.15)' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className="flex-1 py-2.5 flex flex-col items-center gap-0.5 text-[10px] font-bold transition-colors"
              style={{
                color: activeTab === t.id ? '#1877F2' : 'rgba(30,27,75,0.35)',
                borderBottom: `2px solid ${activeTab === t.id ? '#1877F2' : 'transparent'}`,
                background: 'transparent',
              }}>
              <span className="text-base leading-none">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* STYLE TAB */}
          {activeTab === 'style' && (
            <>
              {/* Body type */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: 'rgba(30,27,75,0.4)' }}>Body Type</p>
                <div className="flex gap-2">
                  {(['male', 'female'] as BodyType[]).map(bt => (
                    <button key={bt} onClick={() => update('body_type', bt)}
                      className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all"
                      style={{
                        background: config.body_type === bt ? '#1877F2' : '#F0F4FF',
                        color: config.body_type === bt ? '#fff' : 'rgba(30,27,75,0.6)',
                        border: `1.5px solid ${config.body_type === bt ? '#1877F2' : 'transparent'}`,
                      }}>
                      {bt === 'male' ? '♂ Male' : '♀ Female'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Character styles */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: 'rgba(30,27,75,0.4)' }}>Character Style</p>
                <div className="grid grid-cols-3 gap-2">
                  {CHARACTER_TYPES.map(ct => (
                    <button key={ct.id} onClick={() => update('character_type', ct.id)}
                      className="py-3 rounded-2xl flex flex-col items-center gap-1 transition-all"
                      style={{
                        background: config.character_type === ct.id ? '#EBF3FF' : '#F8F9FF',
                        border: `2px solid ${config.character_type === ct.id ? '#1877F2' : 'transparent'}`,
                      }}>
                      <span className="text-2xl">{ct.icon}</span>
                      <span className="text-[10px] font-bold" style={{ color: config.character_type === ct.id ? '#1877F2' : 'rgba(30,27,75,0.5)' }}>
                        {ct.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* SKIN TAB */}
          {activeTab === 'skin' && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: 'rgba(30,27,75,0.4)' }}>Skin Tone</p>
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
          )}

          {/* HAIR TAB */}
          {activeTab === 'hair' && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: 'rgba(30,27,75,0.4)' }}>Hair Color</p>
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
          )}

          {/* OUTFIT TAB */}
          {activeTab === 'outfit' && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: 'rgba(30,27,75,0.4)' }}>Outfit Color</p>
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
        </div>

        {/* Save footer */}
        <div className="p-4 border-t" style={{ borderColor: 'rgba(24,119,242,0.15)' }}>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={save}
            disabled={saving}
            className="w-full py-3.5 rounded-2xl font-black text-sm text-white disabled:opacity-50"
            style={{ background: saved ? '#16A34A' : 'linear-gradient(135deg, #1877F2, #0D47A1)', boxShadow: '0 4px 16px rgba(24,119,242,0.35)' }}>
            {saved ? '✓ Avatar Saved to Village!' : saving ? 'Saving…' : '✊ Save Avatar'}
          </motion.button>
          {saved && (
            <p className="text-center text-xs mt-2 font-bold" style={{ color: '#16A34A' }}>
              Your avatar will appear in the village on next load.
            </p>
          )}
        </div>
      </div>

      {/* ── Hint when panel is collapsed (mobile) ── */}
    </div>
  );
}
