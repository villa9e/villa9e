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

// ─── Character options ────────────────────────────────────────────────────────
const CHARACTER_TYPES: { id: CharacterType; label: string; icon: string }[] = [
  { id: 'casual',  label: 'Casual',    icon: '👕' },
  { id: 'casual2', label: 'Casual 2',  icon: '🧢' },
  { id: 'casual3', label: 'Casual 3',  icon: '🧣' },
  { id: 'suit',    label: 'Business',  icon: '🕴️' },
  { id: 'worker',  label: 'Worker',    icon: '👷' },
  { id: 'doctor',  label: 'Healer',    icon: '🩺' },
  { id: 'chef',    label: 'Chef',      icon: '👨‍🍳' },
  { id: 'kimono',  label: 'Kimono',    icon: '👘' },
  { id: 'ninja',   label: 'Ninja',     icon: '🥷' },
  { id: 'pirate',  label: 'Pirate',    icon: '🏴‍☠️' },
  { id: 'cowboy',  label: 'Cowboy',    icon: '🤠' },
  { id: 'knight',  label: 'Knight',    icon: '⚔️' },
  { id: 'elf',     label: 'Elf',       icon: '🧝' },
  { id: 'wizard',  label: 'Wizard',    icon: '🧙' },
  { id: 'witch',   label: 'Witch',     icon: '🧙‍♀️' },
  { id: 'warrior', label: 'Warrior',   icon: '🗡️' },
  { id: 'rogue',   label: 'Rogue',     icon: '🗡️' },
  { id: 'soldier', label: 'Soldier',   icon: '🪖' },
];

const BODY_TYPES: { id: BodyType; label: string }[] = [
  { id: 'male',   label: 'Male'   },
  { id: 'female', label: 'Female' },
];

const SKIN_TONES = [
  { id: 's1', label: 'Porcelain' }, { id: 's2', label: 'Beige' },
  { id: 's3', label: 'Golden' },   { id: 's4', label: 'Tan' },
  { id: 's5', label: 'Medium' },   { id: 's6', label: 'Warm' },
  { id: 's7', label: 'Deep' },     { id: 's8', label: 'Ebony' },
];

const HAIR_COLORS = Object.keys(HAIR_COLOR_MAP).map(id => ({ id }));

const OUTFITS = [
  { id: 'o1', label: 'Kente'  }, { id: 'o2', label: 'Spirit' },
  { id: 'o3', label: 'Nature' }, { id: 'o4', label: 'Tribal' },
  { id: 'o5', label: 'Galaxy' }, { id: 'o6', label: 'Earth'  },
  { id: 'o7', label: 'Teal'   }, { id: 'o8', label: 'Rose'   },
];

// ─── 3D character ────────────────────────────────────────────────────────────
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
      const applyToon = (mat: THREE.Material) => {
        const src = mat as any;
        const baseMap = src.map ?? null;
        const name = mat.name.toLowerCase();
        let color = (src.color ?? new THREE.Color('#FFFFFF')).clone();
        if (name.includes('skin') || name.includes('body') || name.includes('face') || name.includes('head'))
          color = new THREE.Color(skinColor);
        else if (name.includes('hair') || name.includes('eyebrow') || name.includes('lash'))
          color = new THREE.Color(hairColor);
        else if (name.includes('shirt') || name.includes('cloth') || name.includes('top') || name.includes('jacket') || name.includes('outfit'))
          color = new THREE.Color(shirtColor);
        return new THREE.MeshToonMaterial({ color, map: baseMap, gradientMap: gradMap });
      };
      if (Array.isArray(mesh.material)) mesh.material = mesh.material.map(applyToon);
      else mesh.material = applyToon(mesh.material);
    });
    return clone;
  }, [scene, skinColor, hairColor, shirtColor]);

  useFrame((_, delta) => {
    if (groupRef.current && autoRotate) groupRef.current.rotation.y += delta * 0.4;
  });

  return (
    <group ref={groupRef} position={[0, -1.1, 0]}>
      <primitive object={cloned} />
    </group>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AvatarBuilderPage() {
  const [config, setConfig]       = useState<AvatarConfig>(DEFAULT_AVATAR_CONFIG);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'character' | 'skin' | 'hair' | 'outfit'>('character');
  const [autoRotate, setAutoRotate] = useState(true);
  const supabase = createClient();

  const gltfUrl    = resolveCharacterURL(config);
  const skinColor  = SKIN_TONE_MAP[config.skin_id]        ?? '#A86030';
  const hairColor  = HAIR_COLOR_MAP[config.hair_color_id] ?? '#0C0700';
  const shirtColor = SHIRT_COLOR_MAP[config.outfit_id]    ?? '#2563EB';

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      (supabase as any).from('profiles').select('avatar_config').eq('id', user.id).single()
        .then(({ data: p }: any) => { if (p?.avatar_config) setConfig({ ...DEFAULT_AVATAR_CONFIG, ...p.avatar_config }); });
    });
  }, []);

  function update(key: keyof AvatarConfig, val: string) {
    setConfig(prev => ({ ...prev, [key]: val } as AvatarConfig));
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

  return (
    <div className="fixed inset-0 bg-[#1A1A2E]">
      {/* ── Full-screen 3D Canvas ── */}
      <Canvas
        camera={{ position: [0, 1.4, 3.5], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
        style={{ position: 'absolute', inset: 0 }}
      >
        {/* Gradient-like lighting */}
        <ambientLight intensity={0.6} color="#FFF0E8" />
        <directionalLight position={[4, 8, 5]} intensity={2.5} castShadow />
        <directionalLight position={[-4, 2, -3]} intensity={0.6} color="#C0D8FF" />
        <pointLight position={[0, 4, 0]} intensity={0.4} color="#FFD4A0" />

        {/* Shadow plane */}
        <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -1.11, 0]} receiveShadow>
          <circleGeometry args={[2, 40]} />
          <meshBasicMaterial color="#111122" transparent opacity={0.4} />
        </mesh>

        <Suspense fallback={null}>
          <CharacterModel
            url={gltfUrl}
            skinColor={skinColor}
            hairColor={hairColor}
            shirtColor={shirtColor}
            autoRotate={autoRotate && !panelOpen}
          />
        </Suspense>

        <OrbitControls
          enablePan={false}
          minPolarAngle={Math.PI * 0.15}
          maxPolarAngle={Math.PI * 0.78}
          minDistance={1.8}
          maxDistance={6}
          enabled={!autoRotate || panelOpen}
        />
      </Canvas>

      {/* ── Top bar ── */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center gap-3 px-4 py-3"
        style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%)' }}>
        <Link href="/village/hut"
          className="w-9 h-9 flex items-center justify-center rounded-full"
          style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </Link>
        <div className="flex-1">
          <p className="text-white font-black text-sm">Build Your Avatar</p>
          <p className="text-white/50 text-xs">Drag to rotate · Tap customize →</p>
        </div>
        <button
          onClick={() => setAutoRotate(r => !r)}
          className="w-9 h-9 flex items-center justify-center rounded-full text-white/70 text-xs"
          style={{ background: autoRotate ? 'rgba(24,119,242,0.4)' : 'rgba(255,255,255,0.15)' }}>
          ↺
        </button>
      </div>

      {/* ── Bottom actions ── */}
      <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center gap-3 px-4 py-4"
        style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))', background: 'linear-gradient(0deg, rgba(0,0,0,0.7) 0%, transparent 100%)' }}>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={save}
          disabled={saving}
          className="flex-1 py-3.5 rounded-2xl font-black text-sm text-white disabled:opacity-50"
          style={{ background: saved ? '#16A34A' : 'linear-gradient(135deg, #1877F2, #7C3AED)', boxShadow: '0 4px 24px rgba(24,119,242,0.4)' }}>
          {saved ? '✓ Saved to Village!' : saving ? 'Saving…' : '✊ Save Avatar'}
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setPanelOpen(v => !v)}
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{
            background: panelOpen ? 'rgba(124,58,237,0.9)' : 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff',
            fontSize: 22,
          }}>
          {panelOpen ? '✕' : '🎨'}
        </motion.button>
      </div>

      {/* ── Right slide-out customization panel ── */}
      <AnimatePresence>
        {panelOpen && (
          <motion.div
            key="panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 36 }}
            className="absolute top-0 right-0 bottom-0 z-30 flex flex-col"
            style={{
              width: 'min(340px, 90vw)',
              background: 'rgba(10,10,20,0.96)',
              backdropFilter: 'blur(24px)',
              borderLeft: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {/* Panel header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
              <p className="flex-1 font-black text-sm text-white">Customize</p>
              <button onClick={() => setPanelOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-white/50 hover:text-white text-lg">×</button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10">
              {([
                { id: 'character', label: '👤 Style' },
                { id: 'skin',      label: '🎨 Skin' },
                { id: 'hair',      label: '✂️ Hair' },
                { id: 'outfit',    label: '👔 Outfit' },
              ] as const).map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className="flex-1 py-2.5 text-[11px] font-bold transition-colors"
                  style={{
                    color: activeTab === t.id ? '#1877F2' : 'rgba(255,255,255,0.4)',
                    borderBottom: activeTab === t.id ? '2px solid #1877F2' : '2px solid transparent',
                  }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">

              {/* CHARACTER TYPE */}
              {activeTab === 'character' && (
                <div className="space-y-4">
                  {/* Body type */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-2 text-white/40">Body Type</p>
                    <div className="flex gap-2">
                      {BODY_TYPES.map(b => (
                        <button key={b.id} onClick={() => update('body_type', b.id)}
                          className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all"
                          style={{
                            background: config.body_type === b.id ? '#1877F2' : 'rgba(255,255,255,0.08)',
                            color: config.body_type === b.id ? '#fff' : 'rgba(255,255,255,0.6)',
                          }}>
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Character style grid */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-2 text-white/40">Character Style</p>
                    <div className="grid grid-cols-3 gap-2">
                      {CHARACTER_TYPES.map(ct => (
                        <button key={ct.id} onClick={() => update('character_type', ct.id)}
                          className="py-3 rounded-xl flex flex-col items-center gap-1 transition-all"
                          style={{
                            background: config.character_type === ct.id ? 'rgba(24,119,242,0.25)' : 'rgba(255,255,255,0.06)',
                            border: `1.5px solid ${config.character_type === ct.id ? '#1877F2' : 'transparent'}`,
                          }}>
                          <span className="text-2xl">{ct.icon}</span>
                          <span className="text-[10px] font-bold" style={{ color: config.character_type === ct.id ? '#60a5fa' : 'rgba(255,255,255,0.5)' }}>
                            {ct.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SKIN TONE */}
              {activeTab === 'skin' && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-3 text-white/40">Skin Tone</p>
                  <div className="grid grid-cols-8 gap-2">
                    {SKIN_TONES.map(s => (
                      <button key={s.id} onClick={() => update('skin_id', s.id)}
                        className="aspect-square rounded-xl relative"
                        title={s.label}
                        style={{
                          background: SKIN_TONE_MAP[s.id],
                          border: config.skin_id === s.id ? '3px solid #1877F2' : '3px solid transparent',
                          boxShadow: config.skin_id === s.id ? '0 0 0 2px rgba(24,119,242,0.5)' : 'none',
                        }}>
                        {config.skin_id === s.id && (
                          <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-black drop-shadow">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="text-center text-white/40 text-xs mt-3">
                    {SKIN_TONES.find(s => s.id === config.skin_id)?.label}
                  </p>
                </div>
              )}

              {/* HAIR */}
              {activeTab === 'hair' && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-3 text-white/40">Hair Color</p>
                  <div className="flex gap-2.5 flex-wrap">
                    {HAIR_COLORS.map(c => (
                      <button key={c.id} onClick={() => update('hair_color_id', c.id)}
                        className="w-11 h-11 rounded-full transition-all"
                        style={{
                          background: HAIR_COLOR_MAP[c.id],
                          border: config.hair_color_id === c.id ? '3px solid #1877F2' : '3px solid rgba(255,255,255,0.15)',
                          boxShadow: config.hair_color_id === c.id ? '0 0 0 2px rgba(24,119,242,0.5)' : 'none',
                        }} />
                    ))}
                  </div>
                </div>
              )}

              {/* OUTFIT COLOR */}
              {activeTab === 'outfit' && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-3 text-white/40">Outfit Color</p>
                  <div className="grid grid-cols-4 gap-2">
                    {OUTFITS.map(o => {
                      const c = SHIRT_COLOR_MAP[o.id] ?? '#2563EB';
                      return (
                        <button key={o.id} onClick={() => update('outfit_id', o.id)}
                          className="py-3 rounded-xl flex flex-col items-center gap-1.5 transition-all"
                          style={{
                            background: config.outfit_id === o.id ? c + '30' : 'rgba(255,255,255,0.06)',
                            border: `1.5px solid ${config.outfit_id === o.id ? c : 'transparent'}`,
                          }}>
                          <div className="w-6 h-6 rounded-full" style={{ background: c, boxShadow: `0 2px 8px ${c}80` }} />
                          <span className="text-[10px] font-bold" style={{ color: config.outfit_id === o.id ? c : 'rgba(255,255,255,0.4)' }}>
                            {o.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Spirit link */}
            <Link href="/village/spirit/choose"
              className="mx-4 mb-4 flex items-center gap-3 p-3 rounded-2xl transition-all"
              style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)' }}>
              <span className="text-xl">🌀</span>
              <div className="flex-1">
                <p className="font-bold text-sm text-purple-300">Choose Your Spirit</p>
                <p className="text-xs text-white/40">AI companion appearance</p>
              </div>
              <span className="text-white/30">›</span>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
