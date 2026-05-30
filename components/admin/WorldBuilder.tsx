'use client';
import React, {
  useRef, useState, useCallback, useEffect, useMemo, Suspense,
} from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Grid, GizmoHelper, GizmoViewport, useGLTF, TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import {
  MODEL_CATALOG, VILLAGE_PAGES, APP_FEATURES, CATEGORY_META,
  type CatalogModel, type ModelCategory, searchModels,
} from '@/lib/admin/modelCatalog';
import { terrainH } from '@/components/map/VillageEnvironment';
import { AnimatedWaterPlane, buildTileGeometry, parseTileUrl, buildTileUrl, type WaterShape } from '@/components/map/AnimatedWater';
import { useSkySystem } from '@/lib/world/useSkySystem';
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

// ─── Tile colors for WorldBuilder preview ────────────────────────────────────
const WB_TILE_COLORS: Record<string, string> = {
  'grass.tile': '#5A9A2A', 'dirt.tile': '#8B6332', 'sand.tile': '#D4A96A',
  'stone.tile': '#9B9B9B', 'water.tile': '#1E90FF', 'mud.tile': '#5C4033',
  'snow.tile': '#E8F4FF',
};

// ─── 3D: water tile (animated) ───────────────────────────────────────────────
function WaterTileObject({ obj, onSelect }: {
  obj: WorldObject;
  onSelect: (id: string, shiftKey: boolean) => void;
}) {
  const sz    = obj.scale * 4;
  const baseY = terrainH(obj.pos_x, obj.pos_z) + obj.elevation;
  const { shape } = parseTileUrl(obj.model_url);
  return (
    <group position={[obj.pos_x, baseY - 0.05, obj.pos_z]}
      onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onSelect(obj.id, e.shiftKey ?? false); }}>
      <AnimatedWaterPlane position={[0, 0, 0]} size={[sz, sz]} type="tile" shape={shape} />
    </group>
  );
}

// ─── 3D: tile mesh (non-water, no GLTF loading) ───────────────────────────────
function SceneObjectTile({ obj, selected, onSelect }: {
  obj: WorldObject; selected: boolean;
  onSelect: (id: string, shiftKey: boolean) => void;
}) {
  const { base, shape } = parseTileUrl(obj.model_url);
  const sz    = obj.scale * 4;
  const baseY = terrainH(obj.pos_x, obj.pos_z) + obj.elevation;
  // Always build (hooks must not be conditional)
  const geo   = useMemo(() => buildTileGeometry(shape, sz, sz), [shape, sz]);

  if (base === 'water') return <WaterTileObject obj={obj} onSelect={onSelect} />;

  const color = WB_TILE_COLORS[`${base}.tile`] ?? '#888';
  return (
    <mesh position={[obj.pos_x, baseY - 0.02, obj.pos_z]} rotation={[-Math.PI/2, 0, 0]}
      onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onSelect(obj.id, e.shiftKey ?? false); }}>
      <primitive object={geo} attach="geometry" />
      <meshStandardMaterial color={color} transparent opacity={selected ? 0.9 : 0.65} />
    </mesh>
  );
}

// ─── 3D: GLTF/GLB mesh ───────────────────────────────────────────────────────
function SceneObjectGltf({
  obj, selected, multiSelected, onSelect, dragging, onDragEnd,
}: {
  obj:          WorldObject;
  selected:     boolean;
  multiSelected: boolean;
  onSelect:     (id: string, shiftKey: boolean) => void;
  dragging:     string | null;
  onDragEnd:    (id: string, x: number, z: number) => void;
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

  const baseY = terrainH(obj.pos_x, obj.pos_z) + obj.elevation;

  return (
    <group
      ref={groupRef}
      position={[obj.pos_x, baseY, obj.pos_z]}
      rotation={[0, obj.rot_y, 0]}
      scale={obj.scale}
      onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onSelect(obj.id, e.shiftKey ?? false); }}
    >
      <primitive object={clone} />

      {(selected || multiSelected) && (
        <>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05 / obj.scale, 0]}>
            <ringGeometry args={[1.1, 1.35, 48]} />
            <meshBasicMaterial color={selected ? '#4ADE80' : '#60A5FA'} transparent opacity={selected ? 0.9 : 0.6} side={THREE.DoubleSide} />
          </mesh>
          {selected && (
            <mesh position={[0, 1.5 / obj.scale, 0]}>
              <cylinderGeometry args={[0.03, 0.03, 3 / obj.scale, 8]} />
              <meshBasicMaterial color="#4ADE80" transparent opacity={0.35} />
            </mesh>
          )}
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

// ─── SceneObject dispatcher ──────────────────────────────────────────────────
function SceneObject(props: {
  obj: WorldObject; selected: boolean; multiSelected: boolean;
  onSelect: (id: string, shiftKey: boolean) => void;
  dragging: string | null; onDragEnd: (id: string, x: number, z: number) => void;
}) {
  if (props.obj.model_url.endsWith('.tile'))
    return <SceneObjectTile obj={props.obj} selected={props.selected} onSelect={props.onSelect} />;
  return <SceneObjectGltf {...props} />;
}

// ─── 3D: placement ghost (tile) ──────────────────────────────────────────────
function GhostTile({ url }: { url: string }) {
  const { base, shape } = parseTileUrl(url);
  const isWater = base === 'water';
  const color   = WB_TILE_COLORS[`${base}.tile`] ?? '#888';
  const ref     = useRef<THREE.Group>(null);
  const { camera, raycaster, pointer } = useThree();
  const plane   = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const hit     = useMemo(() => new THREE.Vector3(), []);
  const geo     = useMemo(() => buildTileGeometry(shape, 4, 4), [shape]);
  useFrame(() => {
    if (!ref.current) return;
    raycaster.setFromCamera(pointer, camera);
    if (raycaster.ray.intersectPlane(plane, hit)) ref.current.position.set(hit.x, isWater ? -0.05 : 0, hit.z);
  });
  return (
    <group ref={ref}>
      {isWater ? (
        <AnimatedWaterPlane position={[0, 0, 0]} size={[4, 4]} type="tile" shape={shape} />
      ) : (
        <mesh rotation={[-Math.PI/2, 0, 0]}>
          <primitive object={geo} attach="geometry" />
          <meshBasicMaterial color={color} transparent opacity={0.55} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

// ─── 3D: placement ghost (GLTF/GLB) ─────────────────────────────────────────
function GhostGltf({ url }: { url: string }) {
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

// ─── PlacementGhost dispatcher ───────────────────────────────────────────────
function PlacementGhost({ url }: { url: string }) {
  if (url.endsWith('.tile')) return <GhostTile url={url} />;
  return <GhostGltf url={url} />;
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

// ─── 3D: ground plane (grass) ────────────────────────────────────────────────
function GroundPlane({ onPlace, onPathClick, pendingModel, pathDrawing }: {
  onPlace:     (x: number, z: number) => void;
  onPathClick: (x: number, z: number) => void;
  pendingModel: CatalogModel | null;
  pathDrawing:  boolean;
}) {
  return (
    <>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.02, 0]}
        receiveShadow
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          if (pathDrawing)   onPathClick(e.point.x, e.point.z);
          else if (pendingModel) onPlace(e.point.x, e.point.z);
        }}
      >
        <planeGeometry args={[400, 400, 1, 1]} />
        <meshStandardMaterial color={pathDrawing ? '#8B7A2A' : '#5A9A2A'} roughness={1} metalness={0} />
      </mesh>
      {!pathDrawing && [[-30,20],[40,-15],[10,50],[-50,-30],[60,40]].map(([x,z],i) => (
        <mesh key={i} rotation={[-Math.PI/2, 0, 0]} position={[x as number, -0.015, z as number]} receiveShadow>
          <circleGeometry args={[12 + i * 3, 12]} />
          <meshStandardMaterial color="#4A8A1A" roughness={1} />
        </mesh>
      ))}
    </>
  );
}

// ─── 3D: sky dome with day/night ─────────────────────────────────────────────
function SkyDome({ skyState }: { skyState: any }) {
  const isNight = skyState?.phase === 'night' || skyState?.phase === 'dusk' || skyState?.phase === 'dawn';
  const skyColor = skyState?.skyTop ?? '#87CEEB';
  const fogColor = isNight ? '#0D1A28' : '#C8E8FF';

  // Star field for night
  const starData = useMemo(() => Array.from({ length: 400 }, () => ({
    x: (Math.random() - 0.5) * 150,
    y: 20 + Math.random() * 60,
    z: (Math.random() - 0.5) * 150,
    s: 0.08 + Math.random() * 0.3,
    t: Math.random() * Math.PI * 2,
    sp: 0.4 + Math.random() * 1.8,
  })), []);
  const starRef = useRef<THREE.InstancedMesh>(null);
  const dum = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }) => {
    if (!starRef.current) return;
    const t = clock.elapsedTime;
    starData.forEach((s, i) => {
      dum.position.set(s.x, s.y, s.z);
      const tw = 0.8 + Math.sin(t * s.sp + s.t) * 0.2;
      dum.scale.setScalar(isNight ? s.s * tw : 0);
      dum.updateMatrix();
      starRef.current!.setMatrixAt(i, dum.matrix);
    });
    starRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <color attach="background" args={[skyColor]} />
      <fog attach="fog" args={[fogColor, isNight ? 55 : 80, isNight ? 200 : 220]} />

      {/* Ambient / hemisphere lighting that matches time of day */}
      <hemisphereLight
        args={[isNight ? '#3A4E80' : '#87CEEB', isNight ? '#1A2A40' : '#4A7A25', isNight ? 1.2 : 1.0]}
      />
      <ambientLight intensity={isNight ? 1.0 : 0.4} color={isNight ? '#3A5080' : '#FFF8F0'} />
      <directionalLight
        position={isNight ? [-30, 40, -20] : [40, 80, 40]}
        intensity={isNight ? 0.8 : 2.0}
        color={isNight ? '#6080C8' : '#FFF5D0'}
      />

      {/* Sun or Moon */}
      {isNight ? (
        <mesh position={[-45, 55, -60]}>
          <sphereGeometry args={[3.5, 24, 20]} />
          <meshBasicMaterial color="#E8F0FF" />
        </mesh>
      ) : (
        <mesh position={[60, 80, -100]}>
          <sphereGeometry args={[6, 16, 16]} />
          <meshBasicMaterial color={skyState?.sunColor ?? '#FFF5D0'} />
        </mesh>
      )}

      {/* Stars at night */}
      <instancedMesh ref={starRef} args={[undefined, undefined, 400]}>
        <sphereGeometry args={[1, 5, 4]} />
        <meshBasicMaterial color="#DDEEFF" />
      </instancedMesh>

      {/* Aurora borealis at night */}
      {isNight && (
        <>
          <mesh position={[0, 28, -55]} rotation={[0, 0, 0]}>
            <planeGeometry args={[100, 22, 24, 8]} />
            <meshBasicMaterial color="#00FF88" transparent opacity={0.12} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[20, 26, -50]} rotation={[0, -0.4, 0]}>
            <planeGeometry args={[70, 18, 20, 6]} />
            <meshBasicMaterial color="#4400FF" transparent opacity={0.08} side={THREE.DoubleSide} />
          </mesh>
        </>
      )}

      {/* Daytime clouds */}
      {!isNight && [[20,45,-60],[-40,55,-80],[60,50,-50]].map(([x,y,z],i) => (
        <mesh key={i} position={[x as number, y as number, z as number]}>
          <sphereGeometry args={[8 + i * 3, 8, 8]} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={0.85} />
        </mesh>
      ))}
    </>
  );
}

// ─── 3D: full scene ──────────────────────────────────────────────────────────
function BuilderScene({
  objects, selectedId, multiSelected, pendingModel, onSelectObj, onMultiSelect, onPlace, onDragObj, onPathClick, pathDrawing, hutPos,
  gridSnap, snapSize, skyState,
}: {
  objects:       WorldObject[];
  selectedId:    string | null;
  multiSelected: Set<string>;
  pendingModel:  CatalogModel | null;
  onSelectObj:   (id: string | null, shiftKey: boolean) => void;
  onMultiSelect: (id: string) => void;
  onPlace:       (x: number, z: number) => void;
  onDragObj:     (id: string, x: number, z: number) => void;
  onPathClick:   (x: number, z: number) => void;
  pathDrawing:   boolean;
  hutPos:        [number, number];
  gridSnap:      boolean;
  snapSize:      number;
  skyState:      any;
}) {
  const orbitRef = useRef<any>(null);
  const selectedObj = objects.find(o => o.id === selectedId) ?? null;
  const selectedGroupRef = useRef<THREE.Group>(null);
  const isNight = skyState?.phase === 'night' || skyState?.phase === 'dusk' || skyState?.phase === 'dawn';

  return (
    <>
      <SkyDome skyState={skyState} />

      {/* Extra directional for shadow casting — SkyDome handles ambient */}
      <directionalLight position={[40, 80, 40]} intensity={isNight ? 0.5 : 2.0} castShadow
        color={isNight ? '#6080C8' : '#FFF5D0'}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.1}
        shadow-camera-far={200}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
      />
      <directionalLight position={[-30, 40, -30]} intensity={isNight ? 0.3 : 0.5} color={isNight ? '#4060A8' : '#C8E8FF'} />

      <Grid
        args={[200, 200]}
        cellSize={1} cellThickness={0.3} cellColor="rgba(0,80,0,0.25)"
        sectionSize={5} sectionThickness={0.6} sectionColor="rgba(0,100,0,0.4)"
        fadeDistance={80} fadeStrength={1.5}
        followCamera={false} infiniteGrid
      />

      <GroundPlane onPlace={onPlace} onPathClick={onPathClick} pendingModel={pendingModel} pathDrawing={pathDrawing} />

      {/* Path drawing waypoints — dots + lines for selected obj */}
      {pathDrawing && objects
        .filter(o => o.id === selectedId && o.trail_points?.length)
        .map(o => (
          <group key={o.id + '_path'}>
            {o.trail_points!.map((pt, i) => (
              <mesh key={i} position={[pt[0], terrainH(pt[0], pt[1]) + 0.15, pt[1]]}>
                <sphereGeometry args={[0.25, 8, 8]} />
                <meshBasicMaterial color={i === 0 ? '#22C55E' : '#F59E0B'} />
              </mesh>
            ))}
            {o.trail_points!.slice(1).map((pt, i) => {
              const prev = o.trail_points![i];
              const mid  = [(prev[0]+pt[0])/2, (prev[1]+pt[1])/2] as [number,number];
              const len  = Math.sqrt((pt[0]-prev[0])**2+(pt[1]-prev[1])**2);
              const ang  = Math.atan2(pt[0]-prev[0], pt[1]-prev[1]);
              return (
                <mesh key={`l${i}`} position={[mid[0], terrainH(mid[0],mid[1])+0.15, mid[1]]}
                  rotation={[0, ang, Math.PI/2]}>
                  <cylinderGeometry args={[0.06, 0.06, len, 6]} />
                  <meshBasicMaterial color="#F59E0B" transparent opacity={0.7} />
                </mesh>
              );
            })}
          </group>
        ))
      }

      {/* Trail lines from hut to buildings */}
      {objects
        .filter(o => o.trail_enabled && o.is_building && o.is_live)
        .map(o => (
          <TrailLine key={o.id} from={hutPos} to={[o.pos_x, o.pos_z]} />
        ))
      }

      <Suspense fallback={null}>
        {objects.map(obj => {
          const isSel = selectedId === obj.id;
          return (
            <group
              key={obj.id}
              ref={isSel ? selectedGroupRef : undefined}
            >
              <SceneObject
                obj={obj}
                selected={isSel}
                multiSelected={multiSelected.has(obj.id)}
                onSelect={onSelectObj}
                dragging={selectedId}
                onDragEnd={onDragObj}
              />
            </group>
          );
        })}

        {/* TransformControls — axis handles on selected object with grid snap */}
        {selectedObj && !pathDrawing && !pendingModel && (
          <TransformControls
            object={selectedGroupRef.current ?? undefined}
            mode="translate"
            translationSnap={gridSnap ? snapSize : null}
            showX showZ
            showY={false}
            onMouseDown={() => { if (orbitRef.current) orbitRef.current.enabled = false; }}
            onMouseUp={() => {
              if (orbitRef.current) orbitRef.current.enabled = true;
              if (selectedGroupRef.current) {
                const p = selectedGroupRef.current.position;
                onDragObj(selectedObj.id, p.x, p.z);
              }
            }}
          />
        )}

        {pendingModel && <PlacementGhost url={pendingModel.url} />}
      </Suspense>

      <OrbitControls
        ref={orbitRef}
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
      <p className="text-green-600 text-[10px] font-black uppercase tracking-widest mb-2">{title}</p>
      {children}
    </div>
  );

  const slider = (label: string, key: keyof WorldObject, min: number, max: number, step: number, suffix = '') => (
    <label className="block mb-1.5">
      <div className="flex justify-between text-[11px]">
        <span className="text-gray-600">{label}</span>
        <span className="text-gray-800">{((obj[key] as number) ?? 0).toFixed(step < 1 ? 1 : 0)}{suffix}</span>
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
          className="w-full bg-gray-50 border border-[#2A4A2A] rounded-lg px-2.5 py-1.5 text-gray-800 text-sm font-bold"
          placeholder="Object name…"
        />
      </div>

      {/* Shape picker — tiles only */}
      {obj.model_url.endsWith('.tile') && (() => {
        const { base, shape } = parseTileUrl(obj.model_url);
        const SHAPES: { id: WaterShape; label: string; icon: string }[] = [
          { id: 'rect',    label: 'Square',  icon: '⬜' },
          { id: 'circle',  label: 'Round',   icon: '🔵' },
          { id: 'oval',    label: 'Oval',    icon: '🫧' },
          { id: 'natural', label: 'Natural', icon: '🏝️' },
        ];
        return section('Shape', (
          <div className="grid grid-cols-4 gap-1">
            {SHAPES.map(s => (
              <button key={s.id}
                onClick={() => onChange({ model_url: buildTileUrl(base, s.id) })}
                className="flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                style={{
                  background: shape === s.id ? '#DBEAFE' : '#F3F4F6',
                  border: `1.5px solid ${shape === s.id ? '#2563EB' : '#E5E7EB'}`,
                  color: shape === s.id ? '#1D4ED8' : '#4B5563',
                }}>
                <span className="text-base leading-none">{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>
        ));
      })()}

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
          <span className="text-gray-600 text-[11px]">Tint color</span>
          <input type="color"
            value={obj.tint_color ?? '#ffffff'}
            onChange={e => onChange({ tint_color: e.target.value === '#ffffff' ? undefined : e.target.value })}
            className="w-8 h-7 rounded border border-[#2A4A2A] bg-transparent cursor-pointer"
          />
          {obj.tint_color && (
            <button onClick={() => onChange({ tint_color: undefined })}
              className="text-gray-500 text-[10px] hover:text-red-500">clear</button>
          )}
        </div>
      </>)}

      {/* Behavior */}
      {section('Behavior', <>
        <select
          value={obj.behavior}
          onChange={e => onChange({ behavior: e.target.value as WorldObject['behavior'] })}
          className="w-full bg-gray-50 border border-[#2A4A2A] rounded-lg px-2 py-1.5 text-gray-800 text-xs mb-2"
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
            <p className="text-gray-500 text-[10px] mb-1">Link to page:</p>
            <select
              value={obj.linked_page ?? ''}
              onChange={e => onChange({ linked_page: e.target.value || undefined })}
              className="w-full bg-gray-50 border border-[#2A4A2A] rounded-lg px-2 py-1.5 text-gray-800 text-xs mb-1"
            >
              <option value="">Select a page…</option>
              {VILLAGE_PAGES.map(p => (
                <option key={p.id} value={p.id}>{p.emoji} {p.label}</option>
              ))}
            </select>
            <p className="text-gray-500 text-[10px] mb-1 mt-2">Or link to a feature:</p>
            <select
              value={obj.linked_feature ?? ''}
              onChange={e => onChange({ linked_feature: e.target.value || undefined })}
              className="w-full bg-gray-50 border border-[#2A4A2A] rounded-lg px-2 py-1.5 text-gray-800 text-xs"
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
            className="w-full bg-gray-50 border border-[#2A4A2A] rounded-lg px-2 py-1.5 text-gray-800 text-[11px]"
          />
        )}

        {obj.behavior === 'dialog' && (
          <>
            <input
              value={obj.dialog_title ?? ''}
              onChange={e => onChange({ dialog_title: e.target.value })}
              placeholder="Dialog title…"
              className="w-full bg-gray-50 border border-[#2A4A2A] rounded-lg px-2 py-1.5 text-gray-800 text-xs mb-1.5"
            />
            <textarea
              value={obj.dialog_content ?? ''}
              onChange={e => onChange({ dialog_content: e.target.value })}
              placeholder="Describe what happens when someone approaches or clicks this. What page or feature do you want built? Spirit will hear you."
              rows={4}
              className="w-full bg-gray-50 border border-[#2A4A2A] rounded-lg px-2 py-1.5 text-gray-800 text-[11px] resize-none"
            />
          </>
        )}

        {obj.behavior === 'transport' && (
          <input
            value={obj.transport_target ?? ''}
            onChange={e => onChange({ transport_target: e.target.value })}
            placeholder="Target: interior, island-2, hut…"
            className="w-full bg-gray-50 border border-[#2A4A2A] rounded-lg px-2 py-1.5 text-gray-800 text-[11px]"
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
            className="flex-1 bg-gray-50 border border-[#2A4A2A] rounded-lg px-2 py-1.5 text-gray-800 text-[11px]"
          />
          <button onClick={searchSound} disabled={searching}
            className="px-2 py-1.5 bg-blue-50 border border-green-300 rounded-lg text-green-600 text-[10px] disabled:opacity-50">
            {searching ? '…' : '🔍'}
          </button>
        </div>

        {soundResults.length > 0 && (
          <div className="max-h-28 overflow-y-auto space-y-0.5 mb-2 border border-gray-200 rounded-lg">
            {soundResults.map((r: any) => (
              <button key={r.id}
                onClick={() => { onChange({ sound_url: r.preview_url, sound_loop: true }); setSoundResults([]); }}
                className="w-full text-left px-2 py-1.5 hover:bg-gray-50 text-[11px] text-gray-800 truncate">
                🎵 {r.name}
              </button>
            ))}
          </div>
        )}

        {obj.sound_url ? (
          <div className="mb-2">
            <div className="flex items-center gap-2 text-[11px] text-green-600 mb-1.5 bg-blue-50 px-2 py-1 rounded-lg border border-green-300">
              <span>🎵</span>
              <span className="truncate flex-1">{obj.sound_url.split('/').pop()}</span>
              <button onClick={() => onChange({ sound_url: undefined })} className="text-gray-500 hover:text-red-500 flex-shrink-0">×</button>
            </div>
            {slider('Volume', 'sound_volume', 0, 1, 0.05)}
            {slider('Trigger distance', 'sound_trigger_dist', 2, 50, 1, 'u')}
            {slider('Full volume at', 'sound_max_dist', 1, 20, 0.5, 'u')}
            <label className="flex items-center gap-2 mt-1">
              <input type="checkbox" checked={obj.sound_loop}
                onChange={e => onChange({ sound_loop: e.target.checked })}
                className="accent-green-400" />
              <span className="text-gray-600 text-[11px]">Loop</span>
            </label>
          </div>
        ) : (
          <p className="text-gray-500 text-[10px] italic">Search for a sound above, or paste a URL</p>
        )}

        {!obj.sound_url && (
          <input
            placeholder="Or paste sound URL (.mp3, .ogg)…"
            onBlur={e => { if (e.target.value) onChange({ sound_url: e.target.value }); }}
            className="w-full bg-gray-50 border border-[#2A4A2A] rounded-lg px-2 py-1.5 text-gray-800 text-[10px] mt-1"
          />
        )}
      </>)}

      {/* Trigger */}
      {section('Trigger', <>
        <div className="mb-2">
          <p className="text-gray-500 text-[10px] mb-1">How is this item activated?</p>
          <div className="flex gap-1">
            {(['click','approach','both'] as const).map(t => (
              <button key={t}
                onClick={() => onChange({ trigger_type: t })}
                className={`flex-1 py-1.5 rounded text-[10px] font-bold capitalize transition-colors border ${
                  obj.trigger_type === t
                    ? 'bg-blue-50 text-green-600 border-green-400'
                    : 'text-gray-500 border-gray-200 hover:text-gray-600'
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
          <span className="text-gray-800 text-[11px]">🔍 Show "Learn about this" info button</span>
        </label>
        {obj.item_info_enabled && (
          <p className="text-gray-500 text-[9px] mt-1 italic">
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
          <span className="text-gray-800 text-[11px]">Auto-trail from Mugsum Hut</span>
        </label>
        {obj.trail_enabled && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={obj.trail_passable}
              onChange={e => onChange({ trail_passable: e.target.checked })}
              className="accent-green-400" />
            <span className="text-gray-600 text-[11px]">Trail passes through this item</span>
          </label>
        )}
      </>)}

      {/* Map visibility */}
      {section('Map', <>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={obj.is_building}
            onChange={e => onChange({ is_building: e.target.checked })}
            className="accent-green-400" />
          <span className="text-gray-800 text-[11px]">Show on village map</span>
        </label>
      </>)}

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-gray-200">
        <button onClick={onDuplicate}
          className="flex-1 py-1.5 text-[11px] bg-blue-50 border border-green-300 text-green-600 rounded-lg hover:bg-blue-100 transition-colors">
          Duplicate
        </button>
        <button onClick={onDelete}
          className="flex-1 py-1.5 text-[11px] bg-red-50 border border-red-300 text-red-500 rounded-lg hover:bg-[#3A1414] transition-colors">
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
          ? 'bg-blue-50 text-green-600 border-[#4ADE80]/40'
          : 'text-gray-800 hover:bg-gray-50 border-transparent'
      }`}
    >
      <span className="text-base leading-none shrink-0">{model.emoji}</span>
      <span className="truncate">{model.label}</span>
      {model.isBuilding && <span className="ml-auto text-[9px] text-gray-500 shrink-0">🏠</span>}
    </button>
  );
}

// ─── Main WorldBuilder export ─────────────────────────────────────────────────
export function WorldBuilder() {
  const supabase = createClient();
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const skyState = useSkySystem(); // live day/night cycle matching the village

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setAdminUserId(user?.id ?? null));
  }, []);

  // ── State
  const [objects,       setObjects]      = useState<WorldObject[]>([]);
  const [selectedId,    setSelectedId]   = useState<string | null>(null);
  const [multiSelect,   setMultiSelect]  = useState<Set<string>>(new Set());
  const [scatterMode,   setScatterMode]  = useState(false);
  const [pending,       setPending]      = useState<CatalogModel | null>(null);
  // mode state removed — always sandbox
  const [saving,        setSaving]       = useState(false);
  const [saved,         setSaved]        = useState(false);
  const [searchQ,       setSearchQ]      = useState('');
  // Track IDs deleted locally so save can remove them from Supabase
  const deletedIds = useRef<Set<string>>(new Set());
  const [activeCategory,setCategory]     = useState<string>('buildings_residential');
  const [activeTab,     setActiveTab]    = useState<'models' | 'ai' | 'pages' | 'features' | 'objects'>('models');
  // Meshy AI state
  const [meshyPrompt,   setMeshyPrompt]  = useState('');
  const [meshyTask,     setMeshyTask]    = useState<string | null>(null);
  const [meshyStatus,   setMeshyStatus]  = useState<'idle' | 'generating' | 'refining' | 'done' | 'error'>('idle');
  const [meshyModel,    setMeshyModel]   = useState<{ glb?: string; gltf?: string } | null>(null);
  const [meshyHistory,  setMeshyHistory] = useState<{ label: string; url: string }[]>([]);
  const [gridSnap,      setGridSnap]     = useState(true);
  const [snapSize,      setSnapSize]     = useState(1);
  const [objSnap,       setObjSnap]      = useState(true);  // snap to other objects' edges
  const [showHelp,      setShowHelp]     = useState(false);
  // Inspector is now embedded — no drag state needed
  // Path drawing mode
  const [pathDrawing, setPathDrawing] = useState(false);
  // Stats
  const [fps, setFps] = useState(60);
  const fpsRef = useRef({ last: performance.now(), frames: 0 });

  // ── Clipboard (copy/paste bundle)
  const clipboard = useRef<WorldObject[]>([]);
  const [hasCopied, setHasCopied] = useState(false);

  // ── Undo/Redo history
  const history    = useRef<WorldObject[][]>([]);
  const historyIdx = useRef(-1);

  function pushHistory(objs: WorldObject[]) {
    // Truncate forward history on new action
    history.current = history.current.slice(0, historyIdx.current + 1);
    history.current.push(objs.map(o => ({ ...o })));
    historyIdx.current = history.current.length - 1;
  }

  function undo() {
    if (historyIdx.current <= 0) return;
    historyIdx.current--;
    setObjects(history.current[historyIdx.current].map(o => ({ ...o })));
  }

  function redo() {
    if (historyIdx.current >= history.current.length - 1) return;
    historyIdx.current++;
    setObjects(history.current[historyIdx.current].map(o => ({ ...o })));
  }

  function snap(v: number): number {
    if (!gridSnap || snapSize === 0) return v;
    return Math.round(v / snapSize) * snapSize;
  }

  // Snap position to nearby object edges (for modular alignment)
  function snapToObjects(x: number, z: number, excludeId?: string): [number, number] {
    if (!objSnap) return [x, z];
    const SNAP_DIST = 1.2;
    let bestX = x, bestZ = z;
    let bestDX = SNAP_DIST, bestDZ = SNAP_DIST;
    for (const o of objects) {
      if (o.id === excludeId) continue;
      const halfW = (o.scale ?? 1) * 1.0; // half-extent approximation
      // Object edges on X axis
      const edgesX = [o.pos_x - halfW, o.pos_x + halfW, o.pos_x];
      for (const ex of edgesX) {
        const dx = Math.abs(x - ex);
        if (dx < bestDX) { bestDX = dx; bestX = ex; }
      }
      // Object edges on Z axis
      const edgesZ = [o.pos_z - halfW, o.pos_z + halfW, o.pos_z];
      for (const ez of edgesZ) {
        const dz = Math.abs(z - ez);
        if (dz < bestDZ) { bestDZ = dz; bestZ = ez; }
      }
    }
    return [bestX, bestZ];
  }

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

      // Global shortcuts
      if (e.key === 'Escape') { setPending(null); setSelectedId(null); setMultiSelect(new Set()); setPathDrawing(false); }
      if (e.key === 'g' || e.key === 'G') setGridSnap(v => !v);
      if (e.key === 'a' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setMultiSelect(new Set(objects.map(o => o.id))); return; }
      if (e.key === 'z' && (e.metaKey || e.ctrlKey) && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if ((e.key === 'z' && (e.metaKey || e.ctrlKey) && e.shiftKey) || (e.key === 'y' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault(); redo(); return;
      }
      // Copy selection (Ctrl+C)
      if (e.key === 'c' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        const ids = multiSelect.size > 0 ? [...multiSelect] : (selectedId ? [selectedId] : []);
        if (ids.length > 0) {
          clipboard.current = objects.filter(o => ids.includes(o.id)).map(o => ({ ...o }));
          setHasCopied(true);
          setTimeout(() => setHasCopied(false), 1500);
        }
        return;
      }
      // Paste bundle (Ctrl+V) — offset by +4 on X and Z to avoid overlap
      if (e.key === 'v' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (clipboard.current.length === 0) return;
        pasteCopied();
        return;
      }
      // Multi-select: Delete all selected
      if ((e.key === 'Delete' || e.key === 'Backspace') && multiSelect.size > 0) {
        multiSelect.forEach(id => deletedIds.current.add(id));
        setObjects(prev => prev.filter(o => !multiSelect.has(o.id)));
        setMultiSelect(new Set()); setSelectedId(null); return;
      }
      // Multi-select: Toggle live on all selected
      if ((e.key === 'l' || e.key === 'L') && multiSelect.size > 0) {
        const ids = [...multiSelect];
        const anyLive = objects.some(o => ids.includes(o.id) && o.is_live);
        setObjects(prev => prev.map(o => ids.includes(o.id) ? { ...o, is_live: !anyLive } : o));
        return;
      }

      if (!selectedId) return;
      const obj = objects.find(o => o.id === selectedId);
      if (!obj) return;
      const STEP = e.shiftKey ? 5 : (gridSnap ? snapSize : 1);
      const ROT  = e.shiftKey ? Math.PI / 4 : Math.PI / 16;
      if (e.key === 'ArrowLeft')  { e.preventDefault(); patchObj(selectedId, { pos_x: snap(obj.pos_x - STEP) }); }
      if (e.key === 'ArrowRight') { e.preventDefault(); patchObj(selectedId, { pos_x: snap(obj.pos_x + STEP) }); }
      if (e.key === 'ArrowUp')    { e.preventDefault(); patchObj(selectedId, { pos_z: snap(obj.pos_z - STEP) }); }
      if (e.key === 'ArrowDown')  { e.preventDefault(); patchObj(selectedId, { pos_z: snap(obj.pos_z + STEP) }); }
      if (e.key === '[')          patchObj(selectedId, { rot_y: obj.rot_y - ROT });
      if (e.key === ']')          patchObj(selectedId, { rot_y: obj.rot_y + ROT });
      if (e.key === '=')          patchObj(selectedId, { scale: Math.min(6, obj.scale + 0.1) });
      if (e.key === '-')          patchObj(selectedId, { scale: Math.max(0.1, obj.scale - 0.1) });
      if (e.key === 'l' || e.key === 'L') patchObj(selectedId, { is_live: !obj.is_live });
      if (e.key === 'd' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); duplicateObj(selectedId); }
      if (e.key === 'Delete' || e.key === 'Backspace') deleteObj(selectedId);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedId, objects]);

  const patchObj = useCallback((id: string, patch: Partial<WorldObject>) => {
    setObjects(prev => prev.map(o => o.id === id ? { ...o, ...patch } : o));
  }, []);

  const handleDragObj = useCallback((id: string, x: number, z: number) => {
    const [sx, sz] = snapToObjects(snap(x), snap(z), id);
    setObjects(prev => prev.map(o => o.id === id ? { ...o, pos_x: sx, pos_z: sz } : o));
  }, [gridSnap, snapSize, objSnap, objects]);

  const handlePathClick = useCallback((x: number, z: number) => {
    if (!selectedId) return;
    const pt: [number, number] = [snap(x), snap(z)];
    setObjects(prev => prev.map(o =>
      o.id === selectedId
        ? { ...o, trail_points: [...(o.trail_points ?? []), pt] }
        : o
    ));
  }, [selectedId, gridSnap, snapSize]);

  const deleteObj = useCallback((id: string) => {
    deletedIds.current.add(id);
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

  const pasteCopied = useCallback(() => {
    if (clipboard.current.length === 0) return;
    const OFFSET = 4;
    const newObjs = clipboard.current.map(o => ({
      ...o,
      id:     crypto.randomUUID(),
      pos_x:  o.pos_x + OFFSET,
      pos_z:  o.pos_z + OFFSET,
      is_live: false,
    }));
    const newIds = new Set(newObjs.map(o => o.id));
    setObjects(prev => {
      const next = [...prev, ...newObjs];
      pushHistory(next);
      return next;
    });
    setMultiSelect(newIds);
    setSelectedId(newObjs[0]?.id ?? null);
  }, []);

  const handlePlace = useCallback((x: number, z: number) => {
    if (!pending) return;

    const makeObj = (px: number, pz: number, rotOffset = 0, scaleVar = 0) => {
      const o = makeDefault(pending.url, pending.label, pending.isBuilding ?? false);
      const [spx, spz] = snapToObjects(snap(px), snap(pz));
      o.pos_x = spx; o.pos_z = spz;
      o.pos_y = terrainH(spx, spz);
      o.scale = Math.max(0.1, (pending.defaultScale ?? 1) + scaleVar);
      o.rot_y = rotOffset;
      if (pending.isBuilding) {
        o.trail_enabled = true; o.trail_passable = false;
        const [hx, hz] = HUT_POS;
        o.trail_points = Array.from({ length: 6 }, (_, i) => {
          const t = i / 5;
          return [hx + (px - hx) * t, hz + (pz - hz) * t] as [number, number];
        });
      }
      return o;
    };

    const newObjs: WorldObject[] = [makeObj(x, z)];

    // Scatter mode: add 4 more copies with random offsets
    if (scatterMode && !pending.isBuilding) {
      const SCATTER_R = 4;
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2 + Math.random() * 0.8;
        const r     = (0.5 + Math.random() * 0.5) * SCATTER_R;
        const sv    = (Math.random() - 0.5) * 0.3;
        newObjs.push(makeObj(x + Math.cos(angle) * r, z + Math.sin(angle) * r, Math.random() * Math.PI * 2, sv));
      }
    }

    setObjects(prev => {
      const next = [...prev, ...newObjs];
      pushHistory(next);
      return next;
    });
    setSelectedId(newObjs[0].id);
  }, [pending, gridSnap, snapSize, scatterMode]);

  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = useCallback(async (publishAll = false) => {
    setSaving(true);
    setSaveError(null);

    const rows = objects.map((o, i) => ({
      id:                 o.id,
      model_url:          o.model_url,
      label:              o.world_name ?? o.label,
      world_name:         o.world_name ?? null,
      pos_x:              o.pos_x,   pos_y: o.pos_y,   pos_z: o.pos_z,
      rot_y:              o.rot_y,   scale: o.scale,   elevation: o.elevation,
      is_live:            publishAll ? true : o.is_live,
      is_building:        o.is_building,
      sort_order:         i,
      tint_color:         o.tint_color ?? null,
      opacity:            o.opacity,
      linked_page:        o.linked_page ?? null,
      linked_feature:     o.linked_feature ?? null,
      behavior:           o.behavior,
      dialog_title:       o.dialog_title ?? null,
      dialog_content:     o.dialog_content ?? null,
      iframe_url:         o.iframe_url ?? null,
      transport_target:   o.transport_target ?? null,
      sound_url:          o.sound_url ?? null,
      sound_volume:       o.sound_volume,
      sound_trigger_dist: o.sound_trigger_dist,
      sound_max_dist:     o.sound_max_dist,
      sound_loop:         o.sound_loop,
      trail_enabled:      o.trail_enabled,
      trail_passable:     o.trail_passable,
      trail_points:       o.trail_points ?? [],
      trigger_type:       o.trigger_type,
      trigger_distance:   o.trigger_distance,
      item_info_enabled:  o.item_info_enabled,
      ...(adminUserId ? { placed_by: adminUserId } : {}),
    }));

    // Get auth token for the API route (service role bypasses RLS)
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token ?? '';

    const res = await fetch('/api/admin/world-objects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        rows,
        deletedIds: [...deletedIds.current],
        publishAll,
      }),
    });

    const json = await res.json();

    if (!res.ok || json.error) {
      setSaveError(json.error ?? `HTTP ${res.status}`);
    } else {
      deletedIds.current.clear();
      if (publishAll) setObjects(prev => prev.map(o => ({ ...o, is_live: true })));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }

    setSaving(false);
  }, [objects, supabase, adminUserId]);

  const selectedObj = objects.find(o => o.id === selectedId) ?? null;

  // Filtered models for palette
  const paletteModels = useMemo(() => {
    if (searchQ.trim()) return searchModels(searchQ);
    return MODEL_CATALOG.filter(m => m.category === activeCategory);
  }, [searchQ, activeCategory]);

  const liveCount = objects.filter(o => o.is_live).length;

  const CATEGORIES = Object.entries(CATEGORY_META) as [ModelCategory, typeof CATEGORY_META[ModelCategory]][];

  // Toolbar draggable state
  const [toolbarPos, setToolbarPos] = useState({ x: 8, y: 8 });
  const [toolbarMin, setToolbarMin] = useState(false);
  const toolbarDrag = useRef<{ active: boolean; ox: number; oy: number }>({ active: false, ox: 0, oy: 0 });
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Color palette — light grey theme
  const WB = {
    bg:       '#F2F4F7',
    panel:    '#FFFFFF',
    border:   '#DDE1E7',
    text:     '#1A1A2E',
    muted:    '#6B7280',
    accent:   '#2563EB',
    green:    '#16A34A',
    greenBg:  '#DCFCE7',
    blueBg:   '#DBEAFE',
    toolbar:  'rgba(255,255,255,0.95)',
  };

  return (
    <div className="flex h-full overflow-hidden" style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif', background: WB.bg }}>

      {/* ── Left: Palette ─────────────────────────────────────────────── */}
      <div className="w-60 flex flex-col shrink-0" style={{ background: WB.panel, borderRight: `1px solid ${WB.border}` }}>

        {/* Tabs */}
        <div className="flex overflow-x-auto" style={{ borderBottom: `1px solid ${WB.border}` }}>
          {(['models', 'ai', 'pages', 'features', 'objects'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className="flex-1 py-2.5 text-[10px] font-bold transition-colors whitespace-nowrap"
              style={{
                color: activeTab === t ? WB.accent : WB.muted,
                borderBottom: activeTab === t ? `2px solid ${WB.accent}` : '2px solid transparent',
                background: 'transparent',
              }}>
              {t === 'models' ? '🧱 Models' : t === 'ai' ? '🤖 AI' : t === 'pages' ? '📄' : t === 'features' ? '⚡' : '📋'}
            </button>
          ))}
        </div>

        {activeTab === 'models' && (
          <>
            {/* Search */}
            <div className="p-2 border-b border-gray-200">
              <input
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder="Search 850+ models…"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-800 text-[11px] placeholder-gray-400"
              />
            </div>

            {/* Category list — scrollable, shows emoji + label */}
            {!searchQ && (
              <div className="overflow-y-auto border-b border-gray-200" style={{ maxHeight: 200 }}>
                {CATEGORIES.map(([id, meta]) => {
                  const count = MODEL_CATALOG.filter(m => m.category === id).length;
                  if (count === 0) return null;
                  const active = activeCategory === id;
                  return (
                    <button key={id} onClick={() => setCategory(id)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left transition-colors"
                      style={{
                        background: active ? '#EFF6FF' : 'transparent',
                        borderLeft: `3px solid ${active ? '#2563EB' : 'transparent'}`,
                      }}>
                      <span className="text-sm flex-shrink-0">{meta.emoji}</span>
                      <span className="flex-1 text-[11px] font-semibold truncate"
                        style={{ color: active ? '#1D4ED8' : '#374151' }}>
                        {meta.label}
                      </span>
                      <span className="text-[9px] flex-shrink-0"
                        style={{ color: active ? '#60A5FA' : '#9CA3AF' }}>
                        {count}
                      </span>
                    </button>
                  );
                })}
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
            <p className="text-gray-500 text-[10px] px-1 py-1">Click a page to assign to selected object</p>
            {VILLAGE_PAGES.map(p => (
              <button key={p.id}
                onClick={() => selectedObj && patchObj(selectedObj.id, { linked_page: p.id, behavior: 'page' })}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-[11px] flex items-center gap-2 transition-colors ${
                  selectedObj?.linked_page === p.id
                    ? 'bg-blue-50 text-green-600 border border-green-300'
                    : 'text-gray-800 hover:bg-gray-50'
                }`}>
                <span>{p.emoji}</span>
                <div>
                  <p className="font-bold">{p.label}</p>
                  <p className="text-[9px] text-gray-500">{p.id}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── AI MODEL GENERATOR (Meshy.ai) ── */}
        {activeTab === 'ai' && (
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            <div className="text-center">
              <p className="text-green-600 text-[11px] font-black">🤖 Generate 3D with AI</p>
              <p className="text-[#2A5A2A] text-[9px] mt-0.5">Powered by Meshy.ai · Type anything, place it in the world</p>
            </div>

            <textarea
              value={meshyPrompt}
              onChange={e => setMeshyPrompt(e.target.value)}
              placeholder="Describe a 3D object… e.g. 'ancient stone fountain with mossy carvings'"
              rows={3}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 text-gray-800 text-[11px] placeholder-gray-400 resize-none"
            />

            <button
              disabled={meshyStatus === 'generating' || meshyStatus === 'refining' || !meshyPrompt.trim()}
              onClick={async () => {
                setMeshyStatus('generating');
                setMeshyModel(null);
                setMeshyTask(null);
                try {
                  const res = await fetch('/api/admin/meshy', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: meshyPrompt }),
                  });
                  const data = await res.json();
                  const taskId = data.result ?? data.id;
                  const apiVer = data.version ?? 'v2';
                  if (taskId) {
                    setMeshyTask(taskId);
                    const poll = setInterval(async () => {
                      const r = await fetch(`/api/admin/meshy?task_id=${taskId}&ver=${apiVer}`);
                      const d = await r.json();
                      const status = (d.status ?? '').toUpperCase();
                      if (status === 'SUCCEEDED') {
                        clearInterval(poll);
                        setMeshyStatus('done');
                        const urls = d.model_urls ?? {};
                        setMeshyModel(urls);
                        const url = urls.glb ?? urls.gltf;
                        if (url) setMeshyHistory(h => [{ label: meshyPrompt.slice(0, 30), url }, ...h.slice(0, 19)]);
                      } else if (status === 'FAILED' || status === 'EXPIRED') {
                        clearInterval(poll);
                        setMeshyStatus('error');
                      } else {
                        setMeshyStatus(status === 'REFINING' ? 'refining' : 'generating');
                      }
                    }, 5000);
                  } else {
                    console.error('[Meshy]', data);
                    setMeshyStatus('error');
                  }
                } catch {
                  setMeshyStatus('error');
                }
              }}
              className="w-full py-2 rounded-xl text-[11px] font-black transition-colors disabled:opacity-50"
              style={{ background: meshyStatus === 'done' ? '#0D2A14' : '#4ADE80', color: meshyStatus === 'done' ? '#4ADE80' : '#040A06' }}
            >
              {meshyStatus === 'generating' ? '⟳ Generating preview…' :
               meshyStatus === 'refining'   ? '✨ Refining mesh…' :
               meshyStatus === 'done'       ? '✓ Model ready!' :
               meshyStatus === 'error'      ? '✕ Failed — retry' :
                                              '🤖 Generate 3D Model'}
            </button>

            {/* Generated model — place button */}
            {meshyStatus === 'done' && meshyModel && (
              <div className="bg-gray-50 border border-green-300 rounded-xl p-3 space-y-2">
                <p className="text-green-600 text-[10px] font-black">Generated model ready</p>
                <button
                  onClick={() => {
                    const url = meshyModel.glb ?? meshyModel.gltf;
                    if (url) {
                      const model: CatalogModel = {
                        id: `meshy_${Date.now()}`,
                        label: meshyPrompt.slice(0, 24),
                        url,
                        category: 'props_items',
                        defaultScale: 1,
                        yOffset: 0,
                        emoji: '🤖',
                        tags: ['ai', 'meshy', 'generated'],
                      };
                      setPending(model);
                      setActiveTab('models');
                    }
                  }}
                  className="w-full py-2 bg-[#4ADE80] text-gray-900 text-[11px] font-black rounded-lg"
                >
                  📍 Place in World
                </button>
              </div>
            )}

            {/* Generated history */}
            {meshyHistory.length > 0 && (
              <div>
                <p className="text-[#2A5A2A] text-[9px] font-black uppercase mb-1">Recent AI Models</p>
                {meshyHistory.map((m, i) => (
                  <button key={i}
                    onClick={() => {
                      const model: CatalogModel = {
                        id: `meshy_hist_${i}`,
                        label: m.label,
                        url: m.url,
                        category: 'props_items',
                        defaultScale: 1,
                        yOffset: 0,
                        emoji: '🤖',
                        tags: ['ai', 'meshy', 'generated'],
                      };
                      setPending(model);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-[10px] flex items-center gap-2 hover:bg-gray-50 transition-colors">
                    <span>🤖</span>
                    <span className="text-gray-800 truncate">{m.label}</span>
                  </button>
                ))}
              </div>
            )}

            {meshyStatus === 'error' && (
              <div className="bg-red-900/20 border border-red-700/30 rounded-xl p-3">
                <p className="text-red-500 text-[10px] font-bold">Generation failed</p>
                <p className="text-red-700 text-[9px] mt-1">Try a different prompt, or check the Vercel logs. API key is configured.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'features' && (
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            <p className="text-gray-500 text-[10px] px-1 py-1">Click a feature to assign to selected object</p>
            {APP_FEATURES.map(f => (
              <button key={f.id}
                onClick={() => selectedObj && patchObj(selectedObj.id, { linked_feature: f.id, behavior: 'page' })}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-[11px] flex items-center gap-2 transition-colors ${
                  selectedObj?.linked_feature === f.id
                    ? 'bg-blue-50 text-green-600 border border-green-300'
                    : 'text-gray-800 hover:bg-gray-50'
                }`}>
                <span className="text-sm">{f.emoji}</span>
                <div>
                  <p className="font-bold">{f.label}</p>
                  <p className="text-[9px] text-gray-500">{f.description}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {activeTab === 'objects' && (
          <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
            {objects.length === 0 && (
              <p className="text-gray-400 text-[10px] text-center py-6">No objects placed yet</p>
            )}
            {objects.map(o => (
              <button key={o.id} onClick={() => setSelectedId(o.id)}
                className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center gap-2 text-[11px] transition-colors ${
                  selectedId === o.id ? 'bg-blue-50 text-green-600' : 'text-gray-800 hover:bg-gray-50'
                }`}>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${o.is_live ? 'bg-green-400' : 'bg-[#2A4A2A]'}`} />
                <span className="truncate flex-1">{o.world_name ?? o.label}</span>
                {o.is_building && <span className="text-gray-500 text-[9px]">🏠</span>}
              </button>
            ))}
          </div>
        )}

        {/* Placement hint */}
        {pending && (
          <div className="p-2.5 border-t border-gray-200 bg-gray-100">
            <p className="text-green-600 text-[10px] font-bold">{pending.emoji} {pending.label}</p>
            <p className="text-[#2A5A2A] text-[9px] mt-0.5">Click world to place · Esc cancel</p>
          </div>
        )}
      </div>

      {/* ── Center: 3D Canvas ──────────────────────────────────────────── */}
      <div className="flex-1 relative flex flex-col" style={{ cursor: pending ? 'crosshair' : 'default' }}>

        {/* ── Floating draggable toolbar ── */}
        <div
          ref={toolbarRef}
          style={{
            position: 'absolute',
            left: toolbarPos.x,
            top: toolbarPos.y,
            zIndex: 30,
            background: 'rgba(255,255,255,0.97)',
            border: '1px solid #DDE1E7',
            borderRadius: 12,
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
            minWidth: toolbarMin ? 120 : 560,
            maxWidth: '90%',
            userSelect: 'none',
          }}
        >
          {/* Drag handle + minimize */}
          <div
            className="flex items-center gap-2 px-3 py-2 cursor-move rounded-t-xl"
            style={{ borderBottom: toolbarMin ? 'none' : '1px solid #EEF0F4', background: '#F8F9FB' }}
            onPointerDown={e => {
              const rect = toolbarRef.current?.getBoundingClientRect();
              if (!rect) return;
              toolbarDrag.current = { active: true, ox: e.clientX - rect.left, oy: e.clientY - rect.top };
              const move = (ev: PointerEvent) => {
                if (!toolbarDrag.current.active) return;
                setToolbarPos({ x: ev.clientX - toolbarDrag.current.ox, y: ev.clientY - toolbarDrag.current.oy });
              };
              const up = () => { toolbarDrag.current.active = false; window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
              window.addEventListener('pointermove', move);
              window.addEventListener('pointerup', up);
            }}
          >
            <span className="text-gray-400 text-xs select-none">⠿</span>
            <span className="text-[10px] font-bold text-gray-600">
              🏗️ Sandbox · {objects.length} objs · {liveCount} live
            </span>
            {selectedObj && (
              <span className="text-[10px] text-blue-600 bg-blue-50 px-2 rounded font-bold truncate max-w-[100px]">
                ✏️ {selectedObj.world_name ?? selectedObj.label}
              </span>
            )}
            <div className="flex-1" />
            <button onClick={() => setToolbarMin(m => !m)}
              className="w-5 h-5 rounded text-gray-400 hover:text-gray-700 text-xs flex items-center justify-center">
              {toolbarMin ? '▼' : '▲'}
            </button>
          </div>

          {!toolbarMin && (
            <div className="flex flex-wrap items-center gap-2 px-3 py-2">
              {/* Live View */}
              <button onClick={() => window.open('/village/map', '_blank')}
                className="px-2.5 py-1 font-bold transition-colors text-[10px] rounded-lg border"
                style={{ background: '#DCFCE7', color: '#166634', borderColor: '#86EFAC' }}>
                🌍 Live View ↗
              </button>

              {/* Undo/Redo */}
              <div className="flex gap-1">
                <button onClick={undo} title="Ctrl+Z"
                  className="px-2 py-1 text-[10px] bg-gray-50 border border-gray-200 text-gray-500 hover:text-blue-600 rounded transition-colors">↩</button>
                <button onClick={redo} title="Ctrl+Shift+Z"
                  className="px-2 py-1 text-[10px] bg-gray-50 border border-gray-200 text-gray-500 hover:text-blue-600 rounded transition-colors">↪</button>
              </div>

              {/* Grid snap */}
              <button onClick={() => setGridSnap(v => !v)} title="G key — toggle grid snap"
                className="px-2 py-1 text-[10px] rounded border transition-colors"
                style={{ background: gridSnap ? '#DBEAFE' : '#F9FAFB', color: gridSnap ? '#1D4ED8' : '#6B7280', borderColor: gridSnap ? '#93C5FD' : '#E5E7EB' }}>
                ⊞ {gridSnap ? `${snapSize}u` : 'Free'}
              </button>
              {gridSnap && (
                <select value={snapSize} onChange={e => setSnapSize(Number(e.target.value))}
                  className="text-[10px] rounded border border-gray-200 text-gray-600 px-1 bg-white">
                  {[0.25, 0.5, 1, 2, 5].map(s => <option key={s} value={s}>{s}u</option>)}
                </select>
              )}

              {/* Object-to-object snap */}
              <button onClick={() => setObjSnap(v => !v)} title="Snap placed/dragged objects to edges of nearby objects"
                className="px-2 py-1 text-[10px] rounded border transition-colors"
                style={{ background: objSnap ? '#F0FDF4' : '#F9FAFB', color: objSnap ? '#16A34A' : '#6B7280', borderColor: objSnap ? '#86EFAC' : '#E5E7EB' }}>
                🧲 {objSnap ? 'Snap' : 'No Snap'}
              </button>

              {/* Path drawing mode */}
              <button
                onClick={() => setPathDrawing(d => !d)}
                title={selectedId ? 'Click ground to add waypoints to selected object' : 'Select an object first'}
                disabled={!selectedId}
                className="px-2 py-1 text-[10px] rounded border transition-colors disabled:opacity-40"
                style={{ background: pathDrawing ? '#FEF3C7' : '#F9FAFB', color: pathDrawing ? '#92400E' : '#6B7280', borderColor: pathDrawing ? '#FCD34D' : '#E5E7EB' }}>
                🛤️ {pathDrawing ? 'Drawing… (click ground)' : 'Draw Path'}
              </button>
              {pathDrawing && selectedObj && (
                <>
                  <span className="text-[9px] text-amber-600">{selectedObj.trail_points?.length ?? 0} pts</span>
                  <button
                    onClick={() => {
                      if (selectedId) setObjects(prev => prev.map(o => o.id === selectedId ? { ...o, trail_points: [] } : o));
                    }}
                    className="px-2 py-1 text-[10px] rounded border border-red-200 text-red-500 bg-red-50">
                    ✕ Clear
                  </button>
                </>
              )}

              {/* Scatter mode */}
              <button
                onClick={() => setScatterMode(s => !s)}
                title="Scatter mode — place 5 copies at once (good for trees/rocks)"
                className="px-2 py-1 text-[10px] rounded border transition-colors"
                style={{ background: scatterMode ? '#FEF3C7' : '#F9FAFB', color: scatterMode ? '#92400E' : '#6B7280', borderColor: scatterMode ? '#FCD34D' : '#E5E7EB' }}>
                🌿 {scatterMode ? 'Scatter ON' : 'Scatter'}
              </button>

              <div className="text-[9px] text-gray-400 hidden lg:block">Arrows=move []=rot +/-=scale L=live Shift+click=multi Del=delete</div>
            </div>
          )}
        </div>

        {/* Canvas */}
        <div className="flex-1 relative">
          <Canvas shadows camera={{ position: [0, 28, 48], fov: 52 }} gl={{ antialias: true }}>
            <BuilderScene
              objects={objects}
              selectedId={selectedId}
              multiSelected={multiSelect}
              pendingModel={pending}
              onSelectObj={(rawId, shiftKey) => {
                if (!rawId) return;
                const id: string = rawId;
                if (shiftKey) {
                  setMultiSelect(prev => {
                    const next = new Set(prev);
                    next.has(id) ? next.delete(id) : next.add(id);
                    return next;
                  });
                } else {
                  setSelectedId(id); setPending(null);
                  setMultiSelect(new Set());
                }
              }}
              onMultiSelect={id => setMultiSelect(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; })}
              onPlace={handlePlace}
              onDragObj={handleDragObj}
              onPathClick={handlePathClick}
              pathDrawing={pathDrawing}
              hutPos={HUT_POS}
              gridSnap={gridSnap}
              snapSize={snapSize}
              skyState={skyState}
            />
          </Canvas>

          {/* Info overlay */}
          {!selectedObj && !pending && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/80 text-[#4A6A4A] text-[10px] px-4 py-2 rounded-full pointer-events-none border border-green-200">
              Left-drag: orbit · Right-drag: pan · Scroll: zoom · Click to select · Drag handle moves object
            </div>
          )}
        </div>
      </div>

      {/* ── Right panel: embedded Inspector ───────────────────────────── */}
      <div className="w-72 flex flex-col shrink-0 overflow-hidden"
        style={{ borderLeft: `1px solid ${WB.border}`, background: WB.panel }}>

        {/* Header */}
        <div className="px-4 py-2.5 flex items-center gap-2 select-none"
          style={{ background: '#F8F9FB', borderBottom: `1px solid ${WB.border}` }}>
          <p className="text-[10px] font-black uppercase tracking-widest flex-1" style={{ color: WB.text }}>
            {multiSelect.size > 1 ? `☰ ${multiSelect.size} selected` : selectedObj ? `✏️ ${selectedObj.world_name ?? selectedObj.label}` : 'Inspector'}
          </p>
        </div>

        {/* Body - scrollable */}
        <div className="flex-1 overflow-y-auto p-3" style={{ background: '#FAFAFA' }}>
          {/* Multi-select batch panel */}
          {multiSelect.size > 1 ? (
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-600">{multiSelect.size} objects selected</p>
              <p className="text-[10px] text-gray-400">Shift+click to add/remove · Ctrl+A = select all</p>
              <div className="flex gap-2 flex-wrap mt-2">
                {/* Copy / Paste bundle */}
                <button
                  onClick={() => {
                    clipboard.current = objects.filter(o => multiSelect.has(o.id)).map(o => ({ ...o }));
                    setHasCopied(true);
                    setTimeout(() => setHasCopied(false), 1500);
                  }}
                  className="px-2 py-1.5 text-[10px] font-bold rounded-lg border transition-colors"
                  style={{ background: hasCopied ? '#EFF6FF' : '#F9FAFB', color: hasCopied ? '#1D4ED8' : '#374151', borderColor: hasCopied ? '#93C5FD' : '#E5E7EB' }}>
                  {hasCopied ? '✓ Copied!' : '⎘ Copy Group'}
                </button>
                {clipboard.current.length > 0 && (
                  <button onClick={pasteCopied}
                    className="px-2 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold rounded-lg">
                    ⎘ Paste ({clipboard.current.length})
                  </button>
                )}
                <button onClick={() => { setObjects(prev => prev.map(o => multiSelect.has(o.id) ? { ...o, is_live: true } : o)); }}
                  className="px-2 py-1.5 bg-green-50 border border-green-300 text-green-700 text-[10px] font-bold rounded-lg">
                  ✓ Publish All
                </button>
                <button onClick={() => { setObjects(prev => prev.map(o => multiSelect.has(o.id) ? { ...o, is_live: false } : o)); }}
                  className="px-2 py-1.5 bg-amber-50 border border-amber-300 text-amber-700 text-[10px] font-bold rounded-lg">
                  ◌ Unpublish
                </button>
                <button onClick={() => {
                  multiSelect.forEach(id => deletedIds.current.add(id));
                  setObjects(prev => prev.filter(o => !multiSelect.has(o.id)));
                  setMultiSelect(new Set()); setSelectedId(null);
                }}
                  className="px-2 py-1.5 bg-red-50 border border-red-300 text-red-600 text-[10px] font-bold rounded-lg">
                  🗑 Delete All
                </button>
                <button onClick={() => setMultiSelect(new Set())}
                  className="px-2 py-1.5 bg-gray-50 border border-gray-200 text-gray-500 text-[10px] rounded-lg">
                  Clear
                </button>
              </div>
              <div className="mt-3 space-y-0.5">
                {objects.filter(o => multiSelect.has(o.id)).map(o => (
                  <div key={o.id} className="flex items-center gap-2 text-[10px] text-gray-600 py-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${o.is_live ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="truncate">{o.world_name ?? o.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : selectedObj ? (
            <Inspector
              obj={selectedObj}
              onChange={patch => patchObj(selectedObj.id, patch)}
              onDelete={() => deleteObj(selectedObj.id)}
              onDuplicate={() => duplicateObj(selectedObj.id)}
            />
          ) : (
            <div className="text-center py-8 space-y-3">
              <p className="text-3xl mb-1">🌍</p>
              <p className="text-gray-400 text-[11px]">Select an object to edit.</p>
              <p className="text-gray-300 text-[10px]">Shift+click for multi-select</p>
              {clipboard.current.length > 0 && (
                <button onClick={pasteCopied}
                  className="mx-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold border transition-colors"
                  style={{ background: '#EFF6FF', color: '#1D4ED8', borderColor: '#93C5FD' }}>
                  ⎘ Paste {clipboard.current.length} object{clipboard.current.length > 1 ? 's' : ''}
                  <span className="text-[9px] text-blue-300 font-normal">Ctrl+V</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Live toggle for selected */}
        {selectedObj && (
          <div className="px-3 py-2" style={{ borderTop: `1px solid ${WB.border}`, background: WB.panel }}>
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
              <span className={`text-[11px] font-bold ${selectedObj.is_live ? 'text-green-600' : 'text-gray-500'}`}>
                {selectedObj.is_live ? 'Live in village' : 'Sandbox only'}
              </span>
            </label>
          </div>
        )}

        {/* Save actions */}
        <div className="p-3 space-y-2" style={{ borderTop: `1px solid ${WB.border}`, background: WB.panel }}>
          {saveError && (
            <div className="rounded-lg p-2 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 leading-snug">
              ✕ Save failed: {saveError}
            </div>
          )}
          <button onClick={() => handleSave(false)} disabled={saving}
            className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-black rounded-xl transition-colors border border-blue-200 disabled:opacity-50">
            {saving ? 'Saving…' : saved ? '✓ Saved!' : '💾 Save Draft'}
          </button>
          <button onClick={() => handleSave(true)} disabled={saving}
            className="w-full py-2 text-[11px] font-black rounded-xl transition-colors disabled:opacity-50"
            style={{ background: '#16A34A', color: '#fff' }}>
            {saving ? 'Publishing…' : saved ? '✓ Published!' : '🚀 Publish All Live'}
          </button>
          {saved && (
            <p className="text-center text-[10px] font-bold text-green-600">
              ✓ Live village updated — check the map!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
