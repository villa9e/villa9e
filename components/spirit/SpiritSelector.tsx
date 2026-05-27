'use client';
import { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { motion, AnimatePresence } from 'framer-motion';
import { SpiritFigure, SPIRIT_VARIANTS, type SpiritVariantId } from './SpiritFigure';
import * as THREE from 'three';

interface SpiritSelectorProps {
  selected: SpiritVariantId;
  onSelect: (id: SpiritVariantId) => void;
  compact?: boolean;   // true = smaller, inline layout
}

function SpiritScene({
  selected, hovered, onSelect, onHover,
}: {
  selected: SpiritVariantId;
  hovered: SpiritVariantId | null;
  onSelect: (id: SpiritVariantId) => void;
  onHover: (id: SpiritVariantId | null) => void;
}) {
  return (
    <>
      {/* Lighting setup for toon shading */}
      <ambientLight intensity={0.85} color="#C8D8FF" />
      <directionalLight position={[2, 4, 3]} intensity={1.4} color="#FFFFFF" castShadow />
      <directionalLight position={[-2, 2, -1]} intensity={0.35} color="#B0C4FF" />
      <pointLight position={[0, -1, 2]} intensity={0.4} color="#FFFFFF" />

      {/* White Spirit */}
      <group
        position={[-1.65, 0, 0]}
        onClick={() => onSelect('white')}
        onPointerOver={() => { onHover('white'); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { onHover(null); document.body.style.cursor = 'default'; }}
      >
        <SpiritFigure
          variant="white"
          selected={selected === 'white'}
          hovered={hovered === 'white'}
          index={2}
          scale={0.88}
        />
      </group>

      {/* Blue Spirit (center / default) */}
      <group
        position={[0, 0, 0]}
        onClick={() => onSelect('blue')}
        onPointerOver={() => { onHover('blue'); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { onHover(null); document.body.style.cursor = 'default'; }}
      >
        <SpiritFigure
          variant="blue"
          selected={selected === 'blue'}
          hovered={hovered === 'blue'}
          index={0}
          scale={selected === 'blue' ? 1.0 : 0.92}
        />
      </group>

      {/* Dark Spirit */}
      <group
        position={[1.65, 0, 0]}
        onClick={() => onSelect('dark')}
        onPointerOver={() => { onHover('dark'); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { onHover(null); document.body.style.cursor = 'default'; }}
      >
        <SpiritFigure
          variant="dark"
          selected={selected === 'dark'}
          hovered={hovered === 'dark'}
          index={1}
          scale={0.88}
        />
      </group>
    </>
  );
}

export function SpiritSelector({ selected, onSelect, compact = false }: SpiritSelectorProps) {
  const [hovered, setHovered] = useState<SpiritVariantId | null>(null);
  const currentVariant = SPIRIT_VARIANTS.find(v => v.id === selected) ?? SPIRIT_VARIANTS[0];

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      {/* 3D Canvas */}
      <div
        className="relative rounded-3xl overflow-hidden"
        style={{
          height: compact ? '180px' : '240px',
          background: 'linear-gradient(160deg, #08101A 0%, #0D1630 50%, #080C18 100%)',
          boxShadow: 'inset 0 0 60px rgba(24,119,242,0.08)',
        }}
      >
        {/* Ambient glow behind spirits */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full opacity-30"
            style={{ background: 'radial-gradient(circle, #E8ECFF, transparent)', filter: 'blur(20px)' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full opacity-35"
            style={{ background: 'radial-gradient(circle, #3B82F6, transparent)', filter: 'blur(24px)' }} />
          <div className="absolute top-1/2 left-3/4 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full opacity-25"
            style={{ background: 'radial-gradient(circle, #4C1D95, transparent)', filter: 'blur(20px)' }} />
        </div>

        <Canvas
          camera={{ position: [0, 0.1, 4.2], fov: 42 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'default' }}
          style={{ background: 'transparent' }}
          shadows
        >
          <Suspense fallback={null}>
            <SpiritScene
              selected={selected}
              hovered={hovered}
              onSelect={onSelect}
              onHover={setHovered}
            />
          </Suspense>
        </Canvas>

        {/* Default badge on blue */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold"
            style={{ background: 'rgba(24,119,242,0.2)', border: '1px solid rgba(24,119,242,0.35)', color: '#93C5FD' }}>
            <span className="w-1 h-1 rounded-full bg-[#60a5fa] animate-pulse" />
            Blue is the default Spirit
          </div>
        </div>
      </div>

      {/* Selection pills */}
      <div className="flex gap-2">
        {SPIRIT_VARIANTS.map(v => (
          <button
            key={v.id}
            onClick={() => onSelect(v.id)}
            className="flex-1 py-2.5 rounded-2xl text-xs font-bold transition-all"
            style={{
              background: selected === v.id ? 'rgba(24,119,242,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${selected === v.id ? 'rgba(24,119,242,0.5)' : 'rgba(255,255,255,0.08)'}`,
              color: selected === v.id ? '#93C5FD' : 'rgba(255,255,255,0.4)',
            }}
          >
            <span className="block w-4 h-4 rounded-full mx-auto mb-1"
              style={{ background: v.color, boxShadow: selected === v.id ? `0 0 8px ${v.glowColor}` : 'none' }} />
            {v.label.split(' ')[1]}
          </button>
        ))}
      </div>

      {/* Description of selected variant */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selected}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="rounded-2xl px-4 py-3 text-center"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <p className="text-xs font-bold mb-0.5" style={{ color: currentVariant.glowColor }}>
            {currentVariant.label}
          </p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {currentVariant.desc}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
