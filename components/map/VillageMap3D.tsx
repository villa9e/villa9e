'use client';
import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, OrthographicCamera } from '@react-three/drei';
import { useRouter } from 'next/navigation';
import * as THREE from 'three';

const LOCATIONS = [
  { id: 'workshop',     label: 'Workshop',     emoji: '🔨', href: '/village/workshop',     pos: [-4, 0, -2],  color: '#FF6B2B', height: 2.2 },
  { id: 'dreamline',   label: 'Dream Line',   emoji: '✨', href: '/village/dreamline',    pos: [4, 0, -2],   color: '#8B5CF6', height: 1.8 },
  { id: 'trading-post',label: 'Trading Post', emoji: '🏪', href: '/village/trading-post', pos: [-4, 0, 2],   color: '#22C55E', height: 1.6 },
  { id: 'bank',         label: 'Bank',         emoji: '🏦', href: '/village/bank',         pos: [4, 0, 2],    color: '#FFD700', height: 2.0 },
  { id: 'zen',          label: 'Zen Space',    emoji: '🧘', href: '/village/zen',           pos: [-6, 0, 0],   color: '#06B6D4', height: 1.4 },
  { id: 'tribes',       label: 'Tribes',       emoji: '👥', href: '/village/tribes',        pos: [6, 0, 0],    color: '#EC4899', height: 1.7 },
  { id: 'hospital',     label: 'Hospital',     emoji: '🏥', href: '/village/hospital',      pos: [0, 0, -4],   color: '#22C55E', height: 1.9 },
  { id: 'hut',          label: 'Your Hut',     emoji: '🏠', href: '/village/hut',           pos: [0, 0, 3.5],  color: '#F59E0B', height: 1.5 },
];

function Building({ location, onHover, onLeave, onClick }: any) {
  const meshRef = useRef<THREE.Mesh>(null);
  const roofRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [x, , z] = location.pos;
  const h = location.height;

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    // Idle float
    meshRef.current.position.y = hovered ? 0.3 : Math.sin(t * 0.8 + x) * 0.04;
    // Workshop gear rotation
    if (location.id === 'workshop' && roofRef.current) {
      roofRef.current.rotation.y = t * 0.5;
    }
  });

  return (
    <group position={[x, 0, z]}>
      {/* Shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.8, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.15} />
      </mesh>

      {/* Main building body */}
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerOver={() => { setHovered(true); onHover(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); onLeave(); document.body.style.cursor = 'default'; }}
        castShadow
      >
        <boxGeometry args={[1.2, h, 1.2]} />
        <meshLambertMaterial color={hovered ? '#ffffff' : '#f8f9ff'} />
      </mesh>

      {/* Colored accent stripe */}
      <mesh position={[0, h * 0.5 - 0.15, 0]}>
        <boxGeometry args={[1.22, 0.25, 1.22]} />
        <meshLambertMaterial color={location.color} />
      </mesh>

      {/* Roof */}
      <mesh ref={roofRef} position={[0, h * 0.5 + 0.25, 0]}>
        {location.id === 'workshop' ? (
          <cylinderGeometry args={[0.5, 0.5, 0.15, 8]} />
        ) : (
          <coneGeometry args={[0.85, 0.5, 4]} />
        )}
        <meshLambertMaterial color={location.color} />
      </mesh>

      {/* Active glow ring when hovered */}
      {hovered && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[0.9, 1.1, 32]} />
          <meshBasicMaterial color={location.color} transparent opacity={0.4} />
        </mesh>
      )}

      {/* Label */}
      <Text
        position={[0, h * 0.5 + 0.85, 0]}
        fontSize={0.28}
        color={hovered ? location.color : '#1a1a2e'}
        anchorX="center"
        anchorY="middle"
        font="/fonts/inter.woff"
      >
        {location.label}
      </Text>
    </group>
  );
}

function Ground() {
  return (
    <>
      {/* Grass */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshLambertMaterial color="#E8F5E9" />
      </mesh>
      {/* Paths */}
      {LOCATIONS.map(loc => (
        <mesh key={loc.id} rotation={[-Math.PI / 2, 0, 0]} position={[loc.pos[0] / 2, 0.01, loc.pos[2] / 2]}>
          <planeGeometry args={[0.3, Math.sqrt(loc.pos[0] ** 2 + loc.pos[2] ** 2)]} />
          <meshBasicMaterial color="#DDD8C4" transparent opacity={0.6} />
        </mesh>
      ))}
      {/* Central plaza */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[1.5, 32]} />
        <meshLambertMaterial color="#DDD8C4" />
      </mesh>
      {/* Village tree */}
      <mesh position={[0, 0.8, 0]}>
        <sphereGeometry args={[0.8, 8, 8]} />
        <meshLambertMaterial color="#4CAF50" />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.1, 0.15, 0.6, 8]} />
        <meshLambertMaterial color="#795548" />
      </mesh>
    </>
  );
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[-5, 10, 5]} intensity={0.8} castShadow color="#fff9f0" />
      <pointLight position={[0, 5, 0]} intensity={0.3} color="#1877F2" />
    </>
  );
}

function Scene({ onNavigate }: { onNavigate: (href: string) => void }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <>
      <Lights />
      <Ground />
      {LOCATIONS.map(loc => (
        <Building
          key={loc.id}
          location={loc}
          onHover={() => setHoveredId(loc.id)}
          onLeave={() => setHoveredId(null)}
          onClick={() => onNavigate(loc.href)}
        />
      ))}
      {/* Sky background */}
      <mesh position={[0, 0, -15]}>
        <planeGeometry args={[40, 20]} />
        <meshBasicMaterial color="#E3F2FD" />
      </mesh>
    </>
  );
}

export default function VillageMap3D() {
  const router = useRouter();

  function handleNavigate(href: string) {
    router.push(href);
  }

  return (
    <div className="w-full h-full" style={{ cursor: 'default' }}>
      <Canvas
        shadows
        style={{ background: 'linear-gradient(180deg, #BBDEFB 0%, #E3F2FD 60%, #E8F5E9 100%)' }}
      >
        <OrthographicCamera
          makeDefault
          position={[8, 10, 8]}
          zoom={55}
          near={0.1}
          far={100}
        />
        <Scene onNavigate={handleNavigate} />
      </Canvas>
    </div>
  );
}
