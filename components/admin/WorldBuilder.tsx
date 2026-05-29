'use client';
import React, {
  useRef, useState, useCallback, useEffect, useMemo, Suspense,
} from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Grid, GizmoHelper, GizmoViewport, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import {
  MODEL_CATALOG, VILLAGE_PAGES, APP_FEATURES, CATEGORY_META,
  type CatalogModel, type ModelCategory, searchModels,
} from '@/lib/admin/modelCatalog';
import { terrainH } from '@/components/map/VillageEnvironment';
import { createClient } from '@/lib/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface WorldObject {
  id:                  string;
  model_url:           string;
  label:               string;
  world_name?:         string;
  pos_x:               number;
  pos_y:               number;
  pos_z:               number;
  rot_y:               number;
  scale:               number;
  elevation:           number;
  tint_color?:         string;
  opacity:             number;
  is_live:             boolean;
  is_building:         boolean;
  linked_page?:        string;
  linked_feature?:     string;
  behavior:            'none' | 'page' | 'iframe' | 'transport' | 'dialog' | 'sound_zone';
  dialog_title?:       string;
  dialog_content?:     string;
  iframe_url?:         string;
  transport_target?:   string;
  sound_url?:          string;
  sound_volume:        number;
  sound_trigger_dist:  number;
  sound_max_dist:      number;
  sound_loop:          boolean;
  trail_enabled:       boolean;
  trail_passable:      boolean;
  trail_points:        [number, number][];
  sort_order:          number;
  placed_by?:          string;
  mode?:               'sandbox' | 'production';
  // Trigger
  trigger_type:        'click' | 'approach' | 'both';
  trigger_distance:    number;
  item_info_enabled:   boolean;   // show "learn about this" info button
}

function makeDefault(modelUrl: string, label: string, isBuilding = false): WorldObject {
  return {
    id:                crypto.randomUUID(),
    model_url:         modelUrl,
    label,
    world_name:        label,
    pos_x:             0,
    pos_y:             0,
    pos_z:             0,
    rot_y:             0,
    scale:             1,
    elevation:         0,
    opacity:           1,
    tint_color:        undefined,
    is_live:           false,
    is_building:       isBuilding,
    linked_page:       undefined,
    linked_feature:    undefined,
    behavior:          'none',
    sound_volume:      0.7,
    sound_trigger_dist:15,
    sound_max_dist:    4,
    sound_loop:        true,
    trail_enabled:     isBuilding,
    trail_passable:    !isBuilding,
    trail_points:      [],
    sort_order:        0,
    trigger_type:      'click',
    trigger_distance:  5,
    item_info_enabled: false,
  };
}

// ─── 3D: single object mesh ──────────────────────────────────────────────────
function SceneObject({
  obj, selected, onSelect, dragging, onDragEnd,
}: {
  obj:       WorldObject;
  selected:  boolean;
  onSelect:  (id: string) => void;
  dragging:  string | null;
  onDragEnd: (id: string, x: number, z: number) => void;
}) {
  const { scene } = useGLTF(obj.model_url);
  const groupRef  = useRef<THREE.Group>(null);

  const clone = useMemo(() => {
    const c = scene.clone(true);
    c.traverse(ch => {
      if ((ch as THREE.Mesh).isMesh) {
        const m = ch as THREE.Mesh;
        m.castShadow    = true;
        m.receiveShadow = true;
        // Apply tint color if set
        if (obj.tint_color) {
          const tint = new THREE.Color(obj.tint_color);
          const applyTint = (mat: THREE.Material) => {
            const m2 = mat as THREE.MeshStandardMaterial;
            if (m2.color) m2.color.multiply(tint);
          };
          if (Array.isArray(m.material)) m.material.forEach(applyTint);
          else applyTint(m.material);
        }
        // Opacity
        if (obj.opacity < 1) {
          const setOpacity = (mat: THREE.Material) => {
            mat.transparent = true;
            (mat as any).opacity = obj.opacity;
          };
          if (Array.isArray(m.material)) m.material.forEach(setOpacity);
          else setOpacity(m.material);
        }
      }
    });
    return c;
  }, [scene, obj.tint_color, obj.opacity]);

  // Ground Y = terrain height + elevation offset
  const baseY = terrainH(obj.pos_x, obj.pos_z) + obj.elevation;

  // Selection ring
  const ringRadius = obj.scale * 1.2;

  return (
    <group
      ref={groupRef}
      position={[obj.pos_x, baseY, obj.pos_z]}
      rotation={[0, obj.rot_y, 0]}
      scale={obj.scale}
      onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onSelect(obj.id); }}
    >
      <primitive object={clone} />

      {selected && (
        <>
          {/* Selection ring */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05 / obj.scale, 0]}>
            <ringGeometry args={[1.1, 1.35, 48]} />
            <meshBasicMaterial color="#4ADE80" transparent opacity={0.8} side={THREE.DoubleSide} />
          </mesh>
          {/* Vertical highlight line */}
          <mesh position={[0, 1.5 / obj.scale, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 3 / obj.scale, 8]} />
            <meshBasicMaterial color="#4ADE80" transparent opacity={0.35} />
          </mesh>
        </>
      )}

      {/* Sound radius ring */}
      {obj.sound_url && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02 / obj.scale, 0]}>
          <ringGeometry args={[
            obj.sound_max_dist / obj.scale,
            obj.sound_max_dist / obj.scale + 0.15,
            64,
          ]} />
          <meshBasicMaterial color="#FBBF24" transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Trail marker */}
      {obj.trail_enabled && (
        <mesh position={[0, 0.01 / obj.scale, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.5 / obj.scale, 16]} />
          <meshBasicMaterial color="#60A5FA" transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}

// ─── 3D: placement ghost ─────────────────────────────────────────────────────
function PlacementGhost({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const clone = useMemo(() => scene.clone(true), [scene]);
  const ref   = useRef<THREE.Group>(null);
  const { camera, raycaster, pointer } = useThree();
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const hit   = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    if (!ref.current) return;
    raycaster.setFromCamera(pointer, camera);
    if (raycaster.ray.intersectPlane(plane, hit)) {
      const y = terrainH(hit.x, hit.z);
      ref.current.position.set(hit.x, y, hit.z);
    }
  });

  return (
    <group ref={ref}>
      <primitive object={clone} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <ringGeometry args={[0.9, 1.1, 40]} />
        <meshBasicMaterial color="#60A5FA" transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ─── 3D: trail lines ─────────────────────────────────────────────────────────
function TrailLine({ from, to }: { from: [number,number]; to: [number,number] }) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const steps = 30;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = from[0] + (to[0] - from[0]) * t;
      const z = from[1] + (to[1] - from[1]) * t;
      pts.push(new THREE.Vector3(x, terrainH(x, z) + 0.08, z));
    }
    return pts;
  }, [from, to]);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints(points);
    return g;
  }, [points]);

  // Use a mesh-based dashed path instead of <line> for TypeScript compatibility
  const segments = points.length - 1;
  return (
    <group>
      {Array.from({ length: segments }, (_, i) => {
        const a = points[i], b = points[i + 1];
        const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
        const len = a.distanceTo(b);
        const dir = new THREE.Vector3().subVectors(b, a).normalize();
        const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        return (
          <mesh key={i} position={mid} quaternion={quat}>
            <cylinderGeometry args={[0.04, 0.04, len, 4]} />
            <meshBasicMaterial color="#60A5FA" transparent opacity={0.5} />
          </mesh>
        );
      })}
    </group>
  );
}

// ─── 3D: ground plane ────────────────────────────────────────────────────────
function GroundPlane({ onPlace, pendingModel }: {
  onPlace: (x: number, z: number) => void;
  pendingModel: CatalogModel | null;
}) {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        if (pendingModel) onPlace(e.point.x, e.point.z);
      }}
    >
      <planeGeometry args={[200, 200]} />
      <meshStandardMaterial color="#2A5C14" transparent opacity={0.55} />
    </mesh>
  );
}

// ─── 3D: full scene ──────────────────────────────────────────────────────────
function BuilderScene({
  objects, selectedId, pendingModel, onSelectObj, onPlace, hutPos,
}: {
  objects:      WorldObject[];
  selectedId:   string | null;
  pendingModel: CatalogModel | null;
  onSelectObj:  (id: string | null) => void;
  onPlace:      (x: number, z: number) => void;
  hutPos:       [number, number];
}) {
  return (
    <>
      <ambientLight intensity={1.4} />
      <directionalLight position={[30, 60, 30]} intensity={1.6} castShadow />
      <directionalLight position={[-20, 30, -20]} intensity={0.6} />

      <Grid
        args={[200, 200]}
        cellSize={1} cellThickness={0.4} cellColor="#2A5A1A"
        sectionSize={5} sectionThickness={0.8} sectionColor="#3A7A2A"
        fadeDistance={100} fadeStrength={1}
        followCamera={false} infiniteGrid
      />

      <GroundPlane onPlace={onPlace} pendingModel={pendingModel} />

      {/* Trail lines from hut to buildings */}
      {objects
        .filter(o => o.trail_enabled && o.is_building && o.is_live)
        .map(o => (
          <TrailLine key={o.id} from={hutPos} to={[o.pos_x, o.pos_z]} />
        ))
      }

      <Suspense fallback={null}>
        {objects.map(obj => (
          <SceneObject
            key={obj.id}
            obj={obj}
            selected={selectedId === obj.id}
            onSelect={onSelectObj}
            dragging={selectedId}
            onDragEnd={() => {}}
          />
        ))}

        {pendingModel && <PlacementGhost url={pendingModel.url} />}
      </Suspense>

      <OrbitControls
        makeDefault
        maxPolarAngle={Math.PI / 2.1}
        minDistance={2}
        maxDistance={120}
        mouseButtons={{
          LEFT:   THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT:  THREE.MOUSE.PAN,
        }}
      />

      <GizmoHelper alignment="bottom-right" margin={[72, 72]}>
        <GizmoViewport axisColors={['#EF4444','#22C55E','#3B82F6']} labelColor="white" />
      </GizmoHelper>
    </>
  );
}

// ─── Inspector panel ─────────────────────────────────────────────────────────
function Inspector({
  obj, onChange, onDelete, onDuplicate,
}: {
  obj:         WorldObject;
  onChange:    (patch: Partial<WorldObject>) => void;
  onDelete:    () => void;
  onDuplicate: () => void;
}) {
  const [soundSearch, setSoundSearch] = useState('');
  const [soundResults, setSoundResults] = useState<any[]>([]);
  const [searching, setSearching]   = useState(false);

  async function searchSound() {
    if (!soundSearch.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/admin/sound-search?q=${encodeURIComponent(soundSearch)}`);
      const data = await res.json();
      setSoundResults(data.results ?? []);
    } catch {
      setSoundResults([]);
    }
    setSearching(false);
  }

  const section = (title: string, children: React.ReactNode) => (
    <div className="mb-4">
      <p className="text-[#4ADE80] text-[10px] font-black uppercase tracking-widest mb-2">{title}</p>
      {children}
    </div>
  );

  const slider = (label: string, key: keyof WorldObject, min: number, max: number, step: number, suffix = '') => (
    <label className="block mb-1.5">
      <div className="flex justify-between text-[11px]">
        <span className="text-[#8AAA8A]">{label}</span>
        <span className="text-[#C8E8C8]">{((obj[key] as number) ?? 0).toFixed(step < 1 ? 1 : 0)}{suffix}</span>
      </div>
      <input type="range" min={min} max={max} step={step}
        value={(obj[key] as number) ?? 0}
        onChange={e => onChange({ [key]: Number(e.target.value) } as any)}
        className="w-full accent-green-400 h-1.5 mt-0.5"
      />
    </label>
  );

  return (
    <div className="space-y-1 text-sm">
      {/* Name */}
      <div className="mb-3">
        <input
          value={obj.world_name ?? obj.label}
          onChange={e => onChange({ world_name: e.target.value })}
          className="w-full bg-[#0A1A0A] border border-[#2A4A2A] rounded-lg px-2.5 py-1.5 text-[#C8E8C8] text-sm font-bold"
          placeholder="Object name…"
        />
      </div>

      {/* Transform */}
      {section('Transform', <>
        {slider('X Position', 'pos_x', -80, 80, 0.5, 'u')}
        {slider('Z Position', 'pos_z', -80, 80, 0.5, 'u')}
        {slider('Elevation', 'elevation', -5, 30, 0.25, 'u')}
        {slider('Rotation', 'rot_y', 0, 360, 5, '°')}
        {slider('Scale', 'scale', 0.1, 6, 0.1, '×')}
        {slider('Opacity', 'opacity', 0.1, 1, 0.05)}
      </>)}

      {/* Appearance */}
      {section('Appearance', <>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[#8AAA8A] text-[11px]">Tint color</span>
          <input type="color"
            value={obj.tint_color ?? '#ffffff'}
            onChange={e => onChange({ tint_color: e.target.value === '#ffffff' ? undefined : e.target.value })}
            className="w-8 h-7 rounded border border-[#2A4A2A] bg-transparent cursor-pointer"
          />
          {obj.tint_color && (
            <button onClick={() => onChange({ tint_color: undefined })}
              className="text-[#4A7A4A] text-[10px] hover:text-red-400">clear</button>
          )}
        </div>
      </>)}

      {/* Behavior */}
      {section('Behavior', <>
        <select
          value={obj.behavior}
          onChange={e => onChange({ behavior: e.target.value as WorldObject['behavior'] })}
          className="w-full bg-[#0A1A0A] border border-[#2A4A2A] rounded-lg px-2 py-1.5 text-[#C8E8C8] text-xs mb-2"
        >
          <option value="none">No action</option>
          <option value="page">Open a page</option>
          <option value="iframe">Open in iframe</option>
          <option value="dialog">Show dialog / info</option>
          <option value="transport">Transport avatar</option>
          <option value="sound_zone">Sound zone only</option>
        </select>

        {obj.behavior === 'page' && (
          <>
            <p className="text-[#4A7A4A] text-[10px] mb-1">Link to page:</p>
            <select
              value={obj.linked_page ?? ''}
              onChange={e => onChange({ linked_page: e.target.value || undefined })}
              className="w-full bg-[#0A1A0A] border border-[#2A4A2A] rounded-lg px-2 py-1.5 text-[#C8E8C8] text-xs mb-1"
            >
              <option value="">Select a page…</option>
              {VILLAGE_PAGES.map(p => (
                <option key={p.id} value={p.id}>{p.emoji} {p.label}</option>
              ))}
            </select>
            <p className="text-[#4A7A4A] text-[10px] mb-1 mt-2">Or link to a feature:</p>
            <select
              value={obj.linked_feature ?? ''}
              onChange={e => onChange({ linked_feature: e.target.value || undefined })}
              className="w-full bg-[#0A1A0A] border border-[#2A4A2A] rounded-lg px-2 py-1.5 text-[#C8E8C8] text-xs"
            >
              <option value="">Select a feature…</option>
              {APP_FEATURES.map(f => (
                <option key={f.id} value={f.id}>{f.emoji} {f.label}</option>
              ))}
            </select>
          </>
        )}

        {obj.behavior === 'iframe' && (
          <input
            value={obj.iframe_url ?? ''}
            onChange={e => onChange({ iframe_url: e.target.value })}
            placeholder="https://… iframe URL"
            className="w-full bg-[#0A1A0A] border border-[#2A4A2A] rounded-lg px-2 py-1.5 text-[#C8E8C8] text-[11px]"
          />
        )}

        {obj.behavior === 'dialog' && (
          <>
            <input
              value={obj.dialog_title ?? ''}
              onChange={e => onChange({ dialog_title: e.target.value })}
              placeholder="Dialog title…"
              className="w-full bg-[#0A1A0A] border border-[#2A4A2A] rounded-lg px-2 py-1.5 text-[#C8E8C8] text-xs mb-1.5"
            />
            <textarea
              value={obj.dialog_content ?? ''}
              onChange={e => onChange({ dialog_content: e.target.value })}
              placeholder="Describe what happens when someone approaches or clicks this. What page or feature do you want built? Spirit will hear you."
              rows={4}
              className="w-full bg-[#0A1A0A] border border-[#2A4A2A] rounded-lg px-2 py-1.5 text-[#C8E8C8] text-[11px] resize-none"
            />
          </>
        )}

        {obj.behavior === 'transport' && (
          <input
            value={obj.transport_target ?? ''}
            onChange={e => onChange({ transport_target: e.target.value })}
            placeholder="Target: interior, island-2, hut…"
            className="w-full bg-[#0A1A0A] border border-[#2A4A2A] rounded-lg px-2 py-1.5 text-[#C8E8C8] text-[11px]"
          />
        )}
      </>)}

      {/* Sound */}
      {section('Spatial Sound', <>
        <div className="flex gap-1.5 mb-1.5">
          <input
            value={soundSearch}
            onChange={e => setSoundSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && searchSound()}
            placeholder="Search sound effect…"
            className="flex-1 bg-[#0A1A0A] border border-[#2A4A2A] rounded-lg px-2 py-1.5 text-[#C8E8C8] text-[11px]"
          />
          <button onClick={searchSound} disabled={searching}
            className="px-2 py-1.5 bg-[#0D2A14] border border-[#2A5C14] rounded-lg text-[#4ADE80] text-[10px] disabled:opacity-50">
            {searching ? '…' : '🔍'}
          </button>
        </div>

        {soundResults.length > 0 && (
          <div className="max-h-28 overflow-y-auto space-y-0.5 mb-2 border border-[#1A3A1A] rounded-lg">
            {soundResults.map((r: any) => (
              <button key={r.id}
                onClick={() => { onChange({ sound_url: r.preview_url, sound_loop: true }); setSoundResults([]); }}
                className="w-full text-left px-2 py-1.5 hover:bg-[#0D1A0F] text-[11px] text-[#C8E8C8] truncate">
                🎵 {r.name}
              </button>
            ))}
          </div>
        )}

        {obj.sound_url ? (
          <div className="mb-2">
            <div className="flex items-center gap-2 text-[11px] text-[#4ADE80] mb-1.5 bg-[#0D2A14] px-2 py-1 rounded-lg border border-[#2A5C14]">
              <span>🎵</span>
              <span className="truncate flex-1">{obj.sound_url.split('/').pop()}</span>
              <button onClick={() => onChange({ sound_url: undefined })} className="text-[#4A7A4A] hover:text-red-400 flex-shrink-0">×</button>
            </div>
            {slider('Volume', 'sound_volume', 0, 1, 0.05)}
            {slider('Trigger distance', 'sound_trigger_dist', 2, 50, 1, 'u')}
            {slider('Full volume at', 'sound_max_dist', 1, 20, 0.5, 'u')}
            <label className="flex items-center gap-2 mt-1">
              <input type="checkbox" checked={obj.sound_loop}
                onChange={e => onChange({ sound_loop: e.target.checked })}
                className="accent-green-400" />
              <span className="text-[#8AAA8A] text-[11px]">Loop</span>
            </label>
          </div>
        ) : (
          <p className="text-[#3A5A3A] text-[10px] italic">Search for a sound above, or paste a URL</p>
        )}

        {!obj.sound_url && (
          <input
            placeholder="Or paste sound URL (.mp3, .ogg)…"
            onBlur={e => { if (e.target.value) onChange({ sound_url: e.target.value }); }}
            className="w-full bg-[#0A1A0A] border border-[#2A4A2A] rounded-lg px-2 py-1.5 text-[#C8E8C8] text-[10px] mt-1"
          />
        )}
      </>)}

      {/* Trigger */}
      {section('Trigger', <>
        <div className="mb-2">
          <p className="text-[#4A7A4A] text-[10px] mb-1">How is this item activated?</p>
          <div className="flex gap-1">
            {(['click','approach','both'] as const).map(t => (
              <button key={t}
                onClick={() => onChange({ trigger_type: t })}
                className={`flex-1 py-1.5 rounded text-[10px] font-bold capitalize transition-colors border ${
                  obj.trigger_type === t
                    ? 'bg-[#0D2A14] text-[#4ADE80] border-[#2A5C14]'
                    : 'text-[#3A5A3A] border-[#1A3A1A] hover:text-[#8AAA8A]'
                }`}>
                {t === 'click' ? '👆 Click' : t === 'approach' ? '🚶 Approach' : '🔀 Both'}
              </button>
            ))}
          </div>
        </div>
        {(obj.trigger_type === 'approach' || obj.trigger_type === 'both') &&
          slider('Approach distance', 'trigger_distance', 1, 20, 0.5, 'u')
        }
        <label className="flex items-center gap-2 mt-1.5 cursor-pointer">
          <input type="checkbox" checked={obj.item_info_enabled}
            onChange={e => onChange({ item_info_enabled: e.target.checked })}
            className="accent-green-400" />
          <span className="text-[#C8E8C8] text-[11px]">🔍 Show "Learn about this" info button</span>
        </label>
        {obj.item_info_enabled && (
          <p className="text-[#3A5A3A] text-[9px] mt-1 italic">
            Spirit will describe the real-world item (what a maple tree is, etc.)
          </p>
        )}
      </>)}

      {/* Trail */}
      {section('Trail', <>
        <label className="flex items-center gap-2 mb-2 cursor-pointer">
          <input type="checkbox" checked={obj.trail_enabled}
            onChange={e => onChange({ trail_enabled: e.target.checked })}
            className="accent-green-400" />
          <span className="text-[#C8E8C8] text-[11px]">Auto-trail from Mugsum Hut</span>
        </label>
        {obj.trail_enabled && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={obj.trail_passable}
              onChange={e => onChange({ trail_passable: e.target.checked })}
              className="accent-green-400" />
            <span className="text-[#8AAA8A] text-[11px]">Trail passes through this item</span>
          </label>
        )}
      </>)}

      {/* Map visibility */}
      {section('Map', <>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={obj.is_building}
            onChange={e => onChange({ is_building: e.target.checked })}
            className="accent-green-400" />
          <span className="text-[#C8E8C8] text-[11px]">Show on village map</span>
        </label>
      </>)}

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-[#1A3A1A]">
        <button onClick={onDuplicate}
          className="flex-1 py-1.5 text-[11px] bg-[#0D2A14] border border-[#2A5C14] text-[#4ADE80] rounded-lg hover:bg-[#162814] transition-colors">
          Duplicate
        </button>
        <button onClick={onDelete}
          className="flex-1 py-1.5 text-[11px] bg-[#2A0A0A] border border-[#5C1414] text-red-400 rounded-lg hover:bg-[#3A1414] transition-colors">
          Delete
        </button>
      </div>
    </div>
  );
}

// ─── Model palette item ───────────────────────────────────────────────────────
function PaletteItem({
  model, active, onSelect,
}: {
  model: CatalogModel;
  active: boolean;
  onSelect: (m: CatalogModel | null) => void;
}) {
  return (
    <button
      onClick={() => onSelect(active ? null : model)}
      className={`w-full text-left px-2.5 py-2 rounded-lg text-[11px] flex items-center gap-2 transition-colors border ${
        active
          ? 'bg-[#0D2A14] text-[#4ADE80] border-[#4ADE80]/40'
          : 'text-[#C8E8C8] hover:bg-[#0A1A0A] border-transparent'
      }`}
    >
      <span className="text-base leading-none shrink-0">{model.emoji}</span>
      <span className="truncate">{model.label}</span>
      {model.isBuilding && <span className="ml-auto text-[9px] text-[#4A7A4A] shrink-0">🏠</span>}
    </button>
  );
}

// ─── Main WorldBuilder export ─────────────────────────────────────────────────
export function WorldBuilder() {
  const supabase = createClient();

  // ── State
  const [objects,       setObjects]      = useState<WorldObject[]>([]);
  const [selectedId,    setSelectedId]   = useState<string | null>(null);
  const [pending,       setPending]      = useState<CatalogModel | null>(null);
  const [mode,          setMode]         = useState<'sandbox' | 'production'>('sandbox');
  const [saving,        setSaving]       = useState(false);
  const [saved,         setSaved]        = useState(false);
  const [searchQ,       setSearchQ]      = useState('');
  const [activeCategory,setCategory]     = useState<string>('buildings_residential');
  const [activeTab,     setActiveTab]    = useState<'models' | 'pages' | 'features' | 'objects'>('models');

  // Hut position (always the origin reference point for trails)
  const HUT_POS: [number, number] = [0, 24];

  // Load objects from DB on mount
  useEffect(() => {
    supabase
      .from('admin_world_objects')
      .select('*')
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        if (data) setObjects(data.map(row => ({
          id:                row.id,
          model_url:         row.model_url,
          label:             row.label ?? '',
          world_name:        row.world_name ?? row.label ?? '',
          pos_x:             row.pos_x ?? 0,
          pos_y:             row.pos_y ?? 0,
          pos_z:             row.pos_z ?? 0,
          rot_y:             row.rot_y ?? 0,
          scale:             row.scale ?? 1,
          elevation:         row.elevation ?? 0,
          tint_color:        row.tint_color,
          opacity:           row.opacity ?? 1,
          is_live:           row.is_live ?? false,
          is_building:       row.is_building ?? false,
          linked_page:       row.linked_page,
          linked_feature:    row.linked_feature,
          behavior:          row.behavior ?? 'none',
          dialog_title:      row.dialog_title,
          dialog_content:    row.dialog_content,
          iframe_url:        row.iframe_url,
          transport_target:  row.transport_target,
          sound_url:         row.sound_url,
          sound_volume:      row.sound_volume ?? 0.7,
          sound_trigger_dist:row.sound_trigger_dist ?? 15,
          sound_max_dist:    row.sound_max_dist ?? 4,
          sound_loop:        row.sound_loop ?? true,
          trail_enabled:     row.trail_enabled ?? false,
          trail_passable:    row.trail_passable ?? true,
          trail_points:      row.trail_points ?? [],
          sort_order:        row.sort_order ?? 0,
          trigger_type:      row.trigger_type ?? 'click',
          trigger_distance:  row.trigger_distance ?? 5,
          item_info_enabled: row.item_info_enabled ?? false,
        })));
      });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;
      if (e.key === 'Escape') { setPending(null); setSelectedId(null); }
      if (!selectedId) return;
      const obj = objects.find(o => o.id === selectedId);
      if (!obj) return;
      const STEP = e.shiftKey ? 5 : 1;
      const ROT  = e.shiftKey ? Math.PI / 4 : Math.PI / 16;
      if (e.key === 'ArrowLeft')  patchObj(selectedId, { pos_x: obj.pos_x - STEP });
      if (e.key === 'ArrowRight') patchObj(selectedId, { pos_x: obj.pos_x + STEP });
      if (e.key === 'ArrowUp')    patchObj(selectedId, { pos_z: obj.pos_z - STEP });
      if (e.key === 'ArrowDown')  patchObj(selectedId, { pos_z: obj.pos_z + STEP });
      if (e.key === '[')          patchObj(selectedId, { rot_y: obj.rot_y - ROT });
      if (e.key === ']')          patchObj(selectedId, { rot_y: obj.rot_y + ROT });
      if (e.key === '=')          patchObj(selectedId, { scale: Math.min(6, obj.scale + 0.1) });
      if (e.key === '-')          patchObj(selectedId, { scale: Math.max(0.1, obj.scale - 0.1) });
      if (e.key === 'Delete' || e.key === 'Backspace') deleteObj(selectedId);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedId, objects]);

  const patchObj = useCallback((id: string, patch: Partial<WorldObject>) => {
    setObjects(prev => prev.map(o => o.id === id ? { ...o, ...patch } : o));
  }, []);

  const deleteObj = useCallback((id: string) => {
    setObjects(prev => prev.filter(o => o.id !== id));
    setSelectedId(null);
  }, []);

  const duplicateObj = useCallback((id: string) => {
    const obj = objects.find(o => o.id === id);
    if (!obj) return;
    const copy: WorldObject = { ...obj, id: crypto.randomUUID(), pos_x: obj.pos_x + 3, is_live: false };
    setObjects(prev => [...prev, copy]);
    setSelectedId(copy.id);
  }, [objects]);

  const handlePlace = useCallback((x: number, z: number) => {
    if (!pending) return;
    const obj = makeDefault(pending.url, pending.label, pending.isBuilding ?? false);
    obj.pos_x = x;
    obj.pos_z = z;
    obj.pos_y = terrainH(x, z);
    obj.scale = pending.defaultScale;
    // Auto-enable trail for buildings + compute straight-line trail points from hut
    if (pending.isBuilding) {
      obj.trail_enabled  = true;
      obj.trail_passable = false;
      // 5 intermediate points from hut [0,24] → placed position
      const [hx, hz] = HUT_POS;
      obj.trail_points = Array.from({ length: 6 }, (_, i) => {
        const t = i / 5;
        return [hx + (x - hx) * t, hz + (z - hz) * t] as [number, number];
      });
    }
    setObjects(prev => [...prev, obj]);
    setSelectedId(obj.id);
    // Keep pending for repeated placement — Escape cancels
  }, [pending]);

  const handleSave = useCallback(async (publishAll = false) => {
    setSaving(true);
    const rows = objects.map((o, i) => ({
      id:                o.id,
      model_url:         o.model_url,
      label:             o.world_name ?? o.label,
      world_name:        o.world_name,
      pos_x:             o.pos_x,
      pos_y:             o.pos_y,
      pos_z:             o.pos_z,
      rot_y:             o.rot_y,
      scale:             o.scale,
      elevation:         o.elevation,
      tint_color:        o.tint_color ?? null,
      opacity:           o.opacity,
      is_live:           publishAll ? true : o.is_live,
      is_building:       o.is_building,
      linked_page:       o.linked_page ?? null,
      linked_feature:    o.linked_feature ?? null,
      behavior:          o.behavior,
      dialog_title:      o.dialog_title ?? null,
      dialog_content:    o.dialog_content ?? null,
      iframe_url:        o.iframe_url ?? null,
      transport_target:  o.transport_target ?? null,
      sound_url:         o.sound_url ?? null,
      sound_volume:      o.sound_volume,
      sound_trigger_dist:o.sound_trigger_dist,
      sound_max_dist:    o.sound_max_dist,
      sound_loop:        o.sound_loop,
      trail_enabled:     o.trail_enabled,
      trail_passable:    o.trail_passable,
      trail_points:      o.trail_points,
      sort_order:        i,
      trigger_type:      o.trigger_type,
      trigger_distance:  o.trigger_distance,
      item_info_enabled: o.item_info_enabled,
    }));
    const { error } = await supabase.from('admin_world_objects').upsert(rows, { onConflict: 'id' });
    if (error) {
      console.error('[WorldBuilder] save error:', error.message);
      // If columns are missing (migration not run), try minimal save
      if (error.message.includes('column') || error.message.includes('does not exist')) {
        const minRows = rows.map(r => ({
          id: r.id, model_url: r.model_url, label: r.label,
          pos_x: r.pos_x, pos_y: r.pos_y, pos_z: r.pos_z,
          rot_y: r.rot_y, scale: r.scale, is_live: r.is_live,
          is_building: r.is_building, sort_order: r.sort_order,
        }));
        await supabase.from('admin_world_objects').upsert(minRows, { onConflict: 'id' });
      }
    }
    if (publishAll) setObjects(prev => prev.map(o => ({ ...o, is_live: true })));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }, [objects, supabase]);

  const selectedObj = objects.find(o => o.id === selectedId) ?? null;

  // Filtered models for palette
  const paletteModels = useMemo(() => {
    if (searchQ.trim()) return searchModels(searchQ);
    return MODEL_CATALOG.filter(m => m.category === activeCategory);
  }, [searchQ, activeCategory]);

  const liveCount = objects.filter(o => o.is_live).length;

  const CATEGORIES = Object.entries(CATEGORY_META) as [ModelCategory, typeof CATEGORY_META[ModelCategory]][];

  return (
    <div className="flex h-full bg-[#040A06] overflow-hidden" style={{ fontFamily: 'monospace' }}>

      {/* ── Left: Palette ─────────────────────────────────────────────── */}
      <div className="w-60 flex flex-col border-r border-[#1A3A1A]/60 shrink-0 bg-[#060E08]">

        {/* Tabs */}
        <div className="flex border-b border-[#1A3A1A]/60">
          {(['models', 'pages', 'features', 'objects'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`flex-1 py-2 text-[9px] uppercase tracking-wider font-bold transition-colors ${
                activeTab === t ? 'text-[#4ADE80] border-b-2 border-[#4ADE80]' : 'text-[#3A5A3A]'
              }`}>
              {t === 'models' ? '🧱' : t === 'pages' ? '📄' : t === 'features' ? '⚡' : '📋'}
            </button>
          ))}
        </div>

        {activeTab === 'models' && (
          <>
            {/* Search */}
            <div className="p-2 border-b border-[#1A3A1A]/60">
              <input
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder="Search 304 models…"
                className="w-full bg-[#0A1A0A] border border-[#1A3A1A]/60 rounded-lg px-2.5 py-1.5 text-[#C8E8C8] text-[11px] placeholder-[#2A4A2A]"
              />
            </div>

            {/* Category pills */}
            {!searchQ && (
              <div className="flex flex-wrap gap-0.5 p-1.5 border-b border-[#1A3A1A]/60">
                {CATEGORIES.map(([id, meta]) => (
                  <button key={id} onClick={() => setCategory(id)}
                    className={`px-1.5 py-0.5 rounded text-[9px] transition-colors ${
                      activeCategory === id
                        ? 'bg-[#0D2A14] text-[#4ADE80]'
                        : 'text-[#3A5A3A] hover:text-[#8AAA8A]'
                    }`}>
                    {meta.emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Model list */}
            <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
              {paletteModels.map(m => (
                <PaletteItem key={m.id} model={m} active={pending?.id === m.id}
                  onSelect={sel => setPending(sel)} />
              ))}
            </div>
          </>
        )}

        {activeTab === 'pages' && (
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            <p className="text-[#3A5A3A] text-[10px] px-1 py-1">Click a page to assign to selected object</p>
            {VILLAGE_PAGES.map(p => (
              <button key={p.id}
                onClick={() => selectedObj && patchObj(selectedObj.id, { linked_page: p.id, behavior: 'page' })}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-[11px] flex items-center gap-2 transition-colors ${
                  selectedObj?.linked_page === p.id
                    ? 'bg-[#0D2A14] text-[#4ADE80] border border-[#2A5C14]'
                    : 'text-[#C8E8C8] hover:bg-[#0A1A0A]'
                }`}>
                <span>{p.emoji}</span>
                <div>
                  <p className="font-bold">{p.label}</p>
                  <p className="text-[9px] text-[#4A7A4A]">{p.id}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {activeTab === 'features' && (
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            <p className="text-[#3A5A3A] text-[10px] px-1 py-1">Click a feature to assign to selected object</p>
            {APP_FEATURES.map(f => (
              <button key={f.id}
                onClick={() => selectedObj && patchObj(selectedObj.id, { linked_feature: f.id, behavior: 'page' })}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-[11px] flex items-center gap-2 transition-colors ${
                  selectedObj?.linked_feature === f.id
                    ? 'bg-[#0D2A14] text-[#4ADE80] border border-[#2A5C14]'
                    : 'text-[#C8E8C8] hover:bg-[#0A1A0A]'
                }`}>
                <span className="text-sm">{f.emoji}</span>
                <div>
                  <p className="font-bold">{f.label}</p>
                  <p className="text-[9px] text-[#4A7A4A]">{f.description}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {activeTab === 'objects' && (
          <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
            {objects.length === 0 && (
              <p className="text-[#2A4A2A] text-[10px] text-center py-6">No objects placed yet</p>
            )}
            {objects.map(o => (
              <button key={o.id} onClick={() => setSelectedId(o.id)}
                className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center gap-2 text-[11px] transition-colors ${
                  selectedId === o.id ? 'bg-[#0D2A14] text-[#4ADE80]' : 'text-[#C8E8C8] hover:bg-[#0A1A0A]'
                }`}>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${o.is_live ? 'bg-green-400' : 'bg-[#2A4A2A]'}`} />
                <span className="truncate flex-1">{o.world_name ?? o.label}</span>
                {o.is_building && <span className="text-[#4A7A4A] text-[9px]">🏠</span>}
              </button>
            ))}
          </div>
        )}

        {/* Placement hint */}
        {pending && (
          <div className="p-2.5 border-t border-[#1A3A1A]/60 bg-[#040A06]">
            <p className="text-[#4ADE80] text-[10px] font-bold">{pending.emoji} {pending.label}</p>
            <p className="text-[#2A5A2A] text-[9px] mt-0.5">Click world to place · Esc cancel</p>
          </div>
        )}
      </div>

      {/* ── Center: 3D Canvas ──────────────────────────────────────────── */}
      <div className="flex-1 relative flex flex-col" style={{ cursor: pending ? 'crosshair' : 'default' }}>

        {/* Mode toggle bar */}
        <div className="flex items-center gap-3 px-4 py-2 bg-[#040A06] border-b border-[#1A3A1A]/60 shrink-0">
          {/* Sandbox / Production toggle */}
          <div className="flex items-center gap-0.5 bg-[#0A1A0A] rounded-lg border border-[#1A3A1A]/60 p-0.5">
            <button
              onClick={() => setMode('sandbox')}
              className={`px-3 py-1 rounded text-[11px] font-bold transition-colors ${
                mode === 'sandbox'
                  ? 'bg-amber-900/50 text-amber-400 border border-amber-700/40'
                  : 'text-[#3A5A3A] hover:text-[#8AAA8A]'
              }`}
            >
              🏗️ Sandbox
            </button>
            <button
              onClick={() => setMode('production')}
              className={`px-3 py-1 rounded text-[11px] font-bold transition-colors ${
                mode === 'production'
                  ? 'bg-[#0D2A14] text-[#4ADE80] border border-[#2A5C14]'
                  : 'text-[#3A5A3A] hover:text-[#8AAA8A]'
              }`}
            >
              🌍 Live Village
            </button>
          </div>

          <div className="text-[10px] text-[#3A5A3A]">
            {objects.length} objects · {liveCount} live
          </div>

          <div className="flex-1" />

          {/* Keyboard hint */}
          <div className="hidden lg:flex gap-3 text-[9px] text-[#2A4A2A]">
            <span>← → ↑ ↓ move</span>
            <span>[ ] rotate</span>
            <span>+/- scale</span>
            <span>Del remove</span>
            <span>Esc cancel</span>
          </div>

          {/* Selected object quick indicator */}
          {selectedObj && (
            <div className="text-[10px] text-[#4ADE80] bg-[#0D2A14] px-2 py-1 rounded border border-[#2A5C14]">
              ✏️ {selectedObj.world_name ?? selectedObj.label}
            </div>
          )}
        </div>

        {/* Canvas */}
        <div className="flex-1 relative">
          <Canvas shadows camera={{ position: [0, 28, 48], fov: 52 }} gl={{ antialias: true }}>
            <BuilderScene
              objects={objects.filter(o => mode === 'production' ? o.is_live : true)}
              selectedId={selectedId}
              pendingModel={pending}
              onSelectObj={id => { setSelectedId(id); setPending(null); }}
              onPlace={handlePlace}
              hutPos={HUT_POS}
            />
          </Canvas>

          {/* Info overlay when nothing selected */}
          {!selectedObj && !pending && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-[#4A7A4A] text-[10px] px-4 py-2 rounded-full pointer-events-none">
              Left-drag: orbit · Right-drag: pan · Scroll: zoom · Click model to select
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Inspector + Save ────────────────────────────────────── */}
      <div className="w-72 flex flex-col border-l border-[#1A3A1A]/60 shrink-0 bg-[#060E08]">

        {/* Inspector header */}
        <div className="px-4 py-3 border-b border-[#1A3A1A]/60 shrink-0">
          <p className="text-[#4ADE80] text-[10px] font-black uppercase tracking-widest">
            {selectedObj ? `Edit: ${selectedObj.world_name ?? selectedObj.label}` : 'Inspector'}
          </p>
        </div>

        {/* Inspector body */}
        <div className="flex-1 overflow-y-auto p-3">
          {selectedObj ? (
            <Inspector
              obj={selectedObj}
              onChange={patch => patchObj(selectedObj.id, patch)}
              onDelete={() => deleteObj(selectedObj.id)}
              onDuplicate={() => duplicateObj(selectedObj.id)}
            />
          ) : (
            <div className="text-center py-10">
              <p className="text-3xl mb-3">🌍</p>
              <p className="text-[#2A4A2A] text-[11px]">Select an object in the world to edit its properties.</p>
              <p className="text-[#1A3A1A] text-[10px] mt-2">Pick a model from the palette and click to place.</p>
            </div>
          )}
        </div>

        {/* Live toggle for selected */}
        {selectedObj && (
          <div className="px-3 py-2 border-t border-[#1A3A1A]/60">
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => patchObj(selectedObj.id, { is_live: !selectedObj.is_live })}
                className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                  selectedObj.is_live ? 'bg-[#4ADE80]' : 'bg-[#1A3A1A]'
                }`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  selectedObj.is_live ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </div>
              <span className={`text-[11px] font-bold ${selectedObj.is_live ? 'text-[#4ADE80]' : 'text-[#3A5A3A]'}`}>
                {selectedObj.is_live ? 'Live in village' : 'Sandbox only'}
              </span>
            </label>
          </div>
        )}

        {/* Save actions */}
        <div className="p-3 border-t border-[#1A3A1A]/60 space-y-2 shrink-0">
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="w-full py-2.5 bg-[#0D2A14] hover:bg-[#122A14] text-[#4ADE80] text-[11px] font-black rounded-xl transition-colors border border-[#2A5C14] disabled:opacity-50"
          >
            {saving ? 'Saving…' : saved ? '✓ Saved!' : '💾 Save Draft'}
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="w-full py-2.5 bg-[#4ADE80] hover:bg-[#22C55E] text-[#040A06] text-[11px] font-black rounded-xl transition-colors disabled:opacity-50"
          >
            🚀 Publish All Live
          </button>
          <button
            onClick={() => {
              if (confirm('Clear all objects? This cannot be undone.')) {
                setObjects([]);
                setSelectedId(null);
              }
            }}
            className="w-full py-1.5 text-[#2A4A2A] hover:text-red-400 text-[10px] transition-colors"
          >
            Clear all objects
          </button>
        </div>
      </div>
    </div>
  );
}
