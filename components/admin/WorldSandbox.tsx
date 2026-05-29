'use client';
import { useRef, useState, useCallback, useEffect, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, useGLTF, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { MODEL_CATALOG, type CatalogModel } from '@/lib/admin/modelCatalog';
import { terrainH } from '@/components/map/VillageEnvironment';
import { createClient } from '@/lib/supabase/client';

// ─── Placed object state ──────────────────────────────────────────────────────
export interface PlacedObject {
  id:       string;
  modelUrl: string;
  label:    string;
  pos:      [number, number, number];
  rotY:     number;
  scale:    number;
  isLive:   boolean;
}

// ─── Single draggable GLTF model in the scene ─────────────────────────────────
function SandboxModel({
  obj, selected, onSelect, onMove,
}: {
  obj:      PlacedObject;
  selected: boolean;
  onSelect: (id: string) => void;
  onMove:   (id: string, pos: [number,number,number]) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(obj.modelUrl);
  const clone = useMemo(() => {
    const c = scene.clone(true);
    c.traverse(child => {
      if ((child as THREE.Mesh).isMesh) {
        const m = child as THREE.Mesh;
        m.castShadow    = true;
        m.receiveShadow = true;
      }
    });
    return c;
  }, [scene]);

  const isDragging = useRef(false);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);

  return (
    <group
      ref={groupRef}
      position={obj.pos}
      rotation={[0, obj.rotY, 0]}
      scale={obj.scale}
      onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onSelect(obj.id); }}
    >
      <primitive object={clone} />

      {/* Selection ring */}
      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
          <ringGeometry args={[1.2, 1.55, 32]} />
          <meshBasicMaterial color="#4ADE80" transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

// ─── Grid ground plane ─────────────────────────────────────────────────────────
function SandboxGround({ onPlace }: { onPlace: (x: number, z: number) => void }) {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        const p = e.point;
        onPlace(p.x, p.z);
      }}
    >
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color="#2A5C14" transparent opacity={0.6} />
    </mesh>
  );
}

// ─── Ghost preview — follows cursor when placing ───────────────────────────────
function PlacementGhost({ url, position }: { url: string; position: THREE.Vector3 }) {
  const { scene } = useGLTF(url);
  const clone = useMemo(() => scene.clone(true), [scene]);
  const ref = useRef<THREE.Group>(null);
  const { camera, raycaster, pointer } = useThree();
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const hit = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    if (!ref.current) return;
    raycaster.setFromCamera(pointer, camera);
    if (raycaster.ray.intersectPlane(plane, hit)) {
      ref.current.position.set(hit.x, terrainH(hit.x, hit.z), hit.z);
    }
  });

  return (
    <group ref={ref} position={[position.x, position.y, position.z]}>
      <primitive object={clone} />
      {/* Ghost ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
        <ringGeometry args={[0.8, 1.05, 32]} />
        <meshBasicMaterial color="#60A5FA" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ─── Inner 3D canvas scene ─────────────────────────────────────────────────────
function SandboxScene({
  objects, selectedId, pendingModel, onSelect, onMove, onPlace,
}: {
  objects:      PlacedObject[];
  selectedId:   string | null;
  pendingModel: CatalogModel | null;
  onSelect:     (id: string | null) => void;
  onMove:       (id: string, pos: [number,number,number]) => void;
  onPlace:      (x: number, z: number) => void;
}) {
  return (
    <>
      <ambientLight intensity={1.2} />
      <directionalLight position={[20, 40, 20]} intensity={1.4} castShadow />

      <Grid
        args={[100, 100]}
        cellSize={1}
        cellThickness={0.4}
        cellColor="#3A6A2A"
        sectionSize={5}
        sectionThickness={0.8}
        sectionColor="#4A8A3A"
        fadeDistance={80}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid
      />

      <SandboxGround onPlace={(x, z) => {
        if (pendingModel) onPlace(x, z);
        else onSelect(null);
      }} />

      <Suspense fallback={null}>
        {objects.map(obj => (
          <SandboxModel
            key={obj.id}
            obj={obj}
            selected={selectedId === obj.id}
            onSelect={onSelect}
            onMove={onMove}
          />
        ))}

        {pendingModel && (
          <PlacementGhost
            url={pendingModel.url}
            position={new THREE.Vector3(0, 0, 0)}
          />
        )}
      </Suspense>

      <OrbitControls
        makeDefault
        maxPolarAngle={Math.PI / 2.1}
        minDistance={4}
        maxDistance={80}
        mouseButtons={{
          LEFT:   THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT:  THREE.MOUSE.PAN,
        }}
      />
    </>
  );
}

// ─── Inspector panel — position/rotation/scale sliders ────────────────────────
function Inspector({
  obj, onChange, onDelete,
}: {
  obj:      PlacedObject;
  onChange: (id: string, patch: Partial<PlacedObject>) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="bg-[#0D1A0F] border border-[#2A5C14]/40 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[#C8E8C8] font-medium text-sm">{obj.label}</span>
        <button
          onClick={() => onDelete(obj.id)}
          className="text-red-400 hover:text-red-300 text-xs px-2 py-0.5 border border-red-900 rounded"
        >
          Delete
        </button>
      </div>

      {/* Position X */}
      <label className="block">
        <span className="text-[#7A9A7A] text-xs">X Position</span>
        <input type="range" min={-50} max={50} step={0.5}
          value={obj.pos[0]}
          onChange={e => onChange(obj.id, { pos: [+e.target.value, obj.pos[1], obj.pos[2]] })}
          className="w-full accent-green-500"
        />
        <span className="text-[#7A9A7A] text-xs">{obj.pos[0].toFixed(1)}</span>
      </label>

      {/* Position Z */}
      <label className="block">
        <span className="text-[#7A9A7A] text-xs">Z Position</span>
        <input type="range" min={-50} max={50} step={0.5}
          value={obj.pos[2]}
          onChange={e => onChange(obj.id, { pos: [obj.pos[0], obj.pos[1], +e.target.value] })}
          className="w-full accent-green-500"
        />
        <span className="text-[#7A9A7A] text-xs">{obj.pos[2].toFixed(1)}</span>
      </label>

      {/* Rotation */}
      <label className="block">
        <span className="text-[#7A9A7A] text-xs">Rotation Y</span>
        <input type="range" min={0} max={360} step={5}
          value={Math.round(obj.rotY * 180 / Math.PI)}
          onChange={e => onChange(obj.id, { rotY: +e.target.value * Math.PI / 180 })}
          className="w-full accent-green-500"
        />
        <span className="text-[#7A9A7A] text-xs">{Math.round(obj.rotY * 180 / Math.PI)}°</span>
      </label>

      {/* Scale */}
      <label className="block">
        <span className="text-[#7A9A7A] text-xs">Scale</span>
        <input type="range" min={0.2} max={4} step={0.1}
          value={obj.scale}
          onChange={e => onChange(obj.id, { scale: +e.target.value })}
          className="w-full accent-green-500"
        />
        <span className="text-[#7A9A7A] text-xs">{obj.scale.toFixed(1)}×</span>
      </label>

      {/* Live toggle */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox"
          checked={obj.isLive}
          onChange={e => onChange(obj.id, { isLive: e.target.checked })}
          className="accent-green-500"
        />
        <span className="text-[#C8E8C8] text-sm">Publish to live world</span>
      </label>
    </div>
  );
}

// ─── Main exported component ──────────────────────────────────────────────────
export function WorldSandbox() {
  const [objects, setObjects]         = useState<PlacedObject[]>([]);
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [pendingModel, setPending]    = useState<CatalogModel | null>(null);
  const [activeCategory, setCategory] = useState<string>('trees');
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [search, setSearch]           = useState('');

  const supabase = createClient();

  // Load saved objects from Supabase on mount
  useEffect(() => {
    supabase.from('admin_world_objects').select('*').then(({ data }) => {
      if (!data) return;
      setObjects(data.map((row: any) => ({
        id:       row.id,
        modelUrl: row.model_url,
        label:    row.label ?? row.model_url.split('/').pop()?.replace('.gltf','') ?? '',
        pos:      [row.pos_x, row.pos_y, row.pos_z] as [number,number,number],
        rotY:     row.rot_y,
        scale:    row.scale,
        isLive:   row.is_live,
      })));
    });
  }, []);

  const handlePlace = useCallback((x: number, z: number) => {
    if (!pendingModel) return;
    const y = terrainH(x, z) + pendingModel.yOffset;
    const newObj: PlacedObject = {
      id:       crypto.randomUUID(),
      modelUrl: pendingModel.url,
      label:    pendingModel.label,
      pos:      [x, y, z],
      rotY:     0,
      scale:    pendingModel.defaultScale,
      isLive:   false,
    };
    setObjects(prev => [...prev, newObj]);
    setSelectedId(newObj.id);
    // Keep pending for repeated placement — Escape to cancel
  }, [pendingModel]);

  const handleChange = useCallback((id: string, patch: Partial<PlacedObject>) => {
    setObjects(prev => prev.map(o => {
      if (o.id !== id) return o;
      const updated = { ...o, ...patch };
      // Snap Y to terrain when X/Z changes
      if (patch.pos) {
        updated.pos = [patch.pos[0], terrainH(patch.pos[0], patch.pos[2]), patch.pos[2]];
      }
      return updated;
    }));
  }, []);

  const handleDelete = useCallback((id: string) => {
    setObjects(prev => prev.filter(o => o.id !== id));
    setSelectedId(null);
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    const rows = objects.map(o => ({
      id:        o.id,
      model_url: o.modelUrl,
      label:     o.label,
      pos_x:     o.pos[0],
      pos_y:     o.pos[1],
      pos_z:     o.pos[2],
      rot_y:     o.rotY,
      scale:     o.scale,
      is_live:   o.isLive,
    }));
    await supabase.from('admin_world_objects').upsert(rows, { onConflict: 'id' });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }, [objects, supabase]);

  const handlePublishAll = useCallback(async () => {
    setSaving(true);
    const rows = objects.map(o => ({
      id:        o.id,
      model_url: o.modelUrl,
      label:     o.label,
      pos_x:     o.pos[0],
      pos_y:     o.pos[1],
      pos_z:     o.pos[2],
      rot_y:     o.rotY,
      scale:     o.scale,
      is_live:   true,
    }));
    await supabase.from('admin_world_objects').upsert(rows, { onConflict: 'id' });
    setObjects(prev => prev.map(o => ({ ...o, isLive: true })));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }, [objects, supabase]);

  const selectedObj = objects.find(o => o.id === selectedId) ?? null;

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setPending(null); setSelectedId(null); }
      if (e.key === 'Delete' && selectedId) handleDelete(selectedId);
      if (selectedId) {
        const STEP = e.shiftKey ? 5 : 1;
        const obj = objects.find(o => o.id === selectedId);
        if (!obj) return;
        if (e.key === 'ArrowLeft')  handleChange(selectedId, { pos: [obj.pos[0] - STEP, obj.pos[1], obj.pos[2]] });
        if (e.key === 'ArrowRight') handleChange(selectedId, { pos: [obj.pos[0] + STEP, obj.pos[1], obj.pos[2]] });
        if (e.key === 'ArrowUp')    handleChange(selectedId, { pos: [obj.pos[0], obj.pos[1], obj.pos[2] - STEP] });
        if (e.key === 'ArrowDown')  handleChange(selectedId, { pos: [obj.pos[0], obj.pos[1], obj.pos[2] + STEP] });
        if (e.key === '[')          handleChange(selectedId, { rotY: obj.rotY - Math.PI / 12 });
        if (e.key === ']')          handleChange(selectedId, { rotY: obj.rotY + Math.PI / 12 });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedId, objects, handleChange, handleDelete]);

  const filteredModels = MODEL_CATALOG.filter(m =>
    m.category === activeCategory &&
    (search === '' || m.label.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex h-full bg-[#060E08] text-white overflow-hidden">

      {/* ── Left palette ───────────────────────────────────────────────── */}
      <div className="w-64 flex flex-col border-r border-[#1A3A1A]/60 shrink-0">
        {/* Category tabs */}
        <div className="p-3 border-b border-[#1A3A1A]/60">
          <p className="text-[#4ADE80] text-xs font-bold mb-2 tracking-widest uppercase">Model Palette</p>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#0D1A0F] border border-[#1A3A1A]/60 rounded-lg px-3 py-1.5 text-[#C8E8C8] text-sm placeholder-[#3A5A3A] focus:outline-none focus:border-[#4ADE80]/50"
          />
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-1 p-2 border-b border-[#1A3A1A]/60">
          {['trees','rocks','terrain','vegetation','animals','buildings','props'].map(cat => (
            <button
              key={cat}
              onClick={() => { setCategory(cat); setSearch(''); }}
              className={`px-2 py-0.5 rounded text-xs capitalize transition-colors ${
                activeCategory === cat
                  ? 'bg-[#16532A] text-[#4ADE80]'
                  : 'text-[#4A7A4A] hover:text-[#C8E8C8]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Model list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {filteredModels.map(model => (
            <button
              key={model.id}
              onClick={() => setPending(pendingModel?.id === model.id ? null : model)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                pendingModel?.id === model.id
                  ? 'bg-[#16532A] text-[#4ADE80] border border-[#4ADE80]/30'
                  : 'text-[#C8E8C8] hover:bg-[#0D1A0F]'
              }`}
            >
              <span>{model.emoji}</span>
              <span className="truncate">{model.label}</span>
            </button>
          ))}
        </div>

        {/* Placement hint */}
        {pendingModel && (
          <div className="p-3 border-t border-[#1A3A1A]/60 bg-[#0A1A0A]">
            <p className="text-[#4ADE80] text-xs font-bold">Placing: {pendingModel.emoji} {pendingModel.label}</p>
            <p className="text-[#4A7A4A] text-xs mt-1">Click in the world to place. Esc to cancel.</p>
          </div>
        )}
      </div>

      {/* ── 3D Canvas ──────────────────────────────────────────────────── */}
      <div className="flex-1 relative" style={{ cursor: pendingModel ? 'crosshair' : 'default' }}>
        <Canvas
          shadows
          camera={{ position: [0, 22, 40], fov: 55 }}
          gl={{ antialias: true }}
        >
          <SandboxScene
            objects={objects}
            selectedId={selectedId}
            pendingModel={pendingModel}
            onSelect={setSelectedId}
            onMove={(id, pos) => handleChange(id, { pos })}
            onPlace={handlePlace}
          />
        </Canvas>

        {/* Keyboard hint overlay */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-[#7A9A7A] text-xs px-3 py-1.5 rounded-full flex gap-3">
          <span>← → ↑ ↓ move</span>
          <span>[ ] rotate</span>
          <span>Del remove</span>
          <span>Esc cancel</span>
        </div>
      </div>

      {/* ── Right inspector + actions ───────────────────────────────────── */}
      <div className="w-72 flex flex-col border-l border-[#1A3A1A]/60 shrink-0">

        {/* Stats header */}
        <div className="p-4 border-b border-[#1A3A1A]/60">
          <p className="text-[#4ADE80] text-xs font-bold tracking-widest uppercase mb-1">World Editor</p>
          <p className="text-[#7A9A7A] text-xs">{objects.length} objects placed • {objects.filter(o => o.isLive).length} live</p>
        </div>

        {/* Inspector */}
        <div className="flex-1 overflow-y-auto p-3">
          {selectedObj ? (
            <Inspector obj={selectedObj} onChange={handleChange} onDelete={handleDelete} />
          ) : (
            <div className="text-[#3A5A3A] text-sm text-center mt-8">
              <p className="text-2xl mb-2">🌍</p>
              <p>Select a model in the world to edit its properties.</p>
              <p className="mt-3 text-xs">Or pick a model from the palette and click to place it.</p>
            </div>
          )}
        </div>

        {/* Object list */}
        <div className="border-t border-[#1A3A1A]/60 max-h-48 overflow-y-auto">
          {objects.length > 0 && (
            <div className="p-2 space-y-0.5">
              <p className="text-[#4A7A4A] text-xs px-2 py-1">All Objects</p>
              {objects.map(obj => (
                <button
                  key={obj.id}
                  onClick={() => setSelectedId(obj.id)}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center gap-2 transition-colors ${
                    selectedId === obj.id
                      ? 'bg-[#16532A] text-[#4ADE80]'
                      : 'text-[#C8E8C8] hover:bg-[#0D1A0F]'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${obj.isLive ? 'bg-green-400' : 'bg-gray-600'}`} />
                  <span className="truncate">{obj.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="p-4 border-t border-[#1A3A1A]/60 space-y-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2.5 bg-[#16532A] hover:bg-[#1A6A35] text-[#4ADE80] text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Draft'}
          </button>
          <button
            onClick={handlePublishAll}
            disabled={saving}
            className="w-full py-2.5 bg-[#4ADE80] hover:bg-[#22C55E] text-[#060E08] text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            {saving ? 'Publishing...' : '🚀 Publish All Live'}
          </button>
          <button
            onClick={() => {
              setObjects([]);
              setSelectedId(null);
            }}
            className="w-full py-2 text-[#4A7A4A] hover:text-red-400 text-xs transition-colors"
          >
            Clear all objects
          </button>
        </div>
      </div>
    </div>
  );
}
