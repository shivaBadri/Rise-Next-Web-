"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, useGLTF, ContactShadows, Sky } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { STATUS_COLORS } from "@/lib/format";
import type { ViewerAsset, ViewerObject, ViewerUnit, CameraView } from "./types";
import type { Geom } from "@/lib/demo-layout";

interface SceneProps {
  asset: ViewerAsset;
  unitsById: Record<string, ViewerUnit>;
  selectedKey: string | null;
  hoveredKey: string | null;
  onSelect: (key: string | null) => void;
  onHover: (key: string | null) => void;
  view: CameraView | null;
  lowPower: boolean;
}

const AMENITY_DEFAULT = "#d4a373";
const NEUTRAL = "#cbd5e1";

function colorFor(obj: ViewerObject, unitsById: Record<string, ViewerUnit>, geomColor?: string) {
  if (obj.kind === "UNIT" && obj.unitId) {
    const u = unitsById[obj.unitId];
    return u ? STATUS_COLORS[u.status] ?? NEUTRAL : NEUTRAL;
  }
  if (obj.kind === "AMENITY") return geomColor ?? AMENITY_DEFAULT;
  return geomColor ?? NEUTRAL;
}

/* ---------------- Procedural (no GLB) ---------------- */

function ProceduralObject({
  obj, color, interactive, selected, hovered, onSelect, onHover, label,
}: {
  obj: ViewerObject; color: string; interactive: boolean; selected: boolean; hovered: boolean;
  onSelect: (k: string) => void; onHover: (k: string | null) => void; label?: string;
}) {
  const g = obj.geomJson as Geom;
  const ref = useRef<THREE.Mesh>(null);
  const targetY = selected ? 1.2 : hovered ? 0.5 : 0;
  useFrame((_, dt) => {
    if (!ref.current || !interactive) return;
    const base = g.position[1];
    ref.current.position.y += (base + targetY - ref.current.position.y) * Math.min(1, dt * 10);
  });
  const emissive = selected ? 0.35 : hovered ? 0.15 : 0;
  const props = interactive
    ? {
        onClick: (e: { stopPropagation: () => void }) => { e.stopPropagation(); onSelect(obj.objectKey); },
        onPointerOver: (e: { stopPropagation: () => void }) => { e.stopPropagation(); onHover(obj.objectKey); document.body.style.cursor = "pointer"; },
        onPointerOut: () => { onHover(null); document.body.style.cursor = "auto"; },
      }
    : {};
  return (
    <group>
      <mesh ref={ref} position={g.position} rotation={[0, ("rotationY" in g && g.rotationY) || 0, 0]} castShadow receiveShadow {...props}>
        {g.shape === "box" ? <boxGeometry args={g.size} /> : <cylinderGeometry args={[g.radius, g.radius, g.height, 24]} />}
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissive} roughness={0.7} metalness={0.05} />
      </mesh>
      {label && (selected || hovered) && (
        <Html position={[g.position[0], g.position[1] + 4, g.position[2]]} center distanceFactor={120} zIndexRange={[1, 0]}>
          <div className="pointer-events-none rounded-md bg-ink px-2 py-1 text-xs font-semibold text-white shadow">{label}</div>
        </Html>
      )}
    </group>
  );
}

function ProceduralLayout(p: SceneProps) {
  const { asset, unitsById, selectedKey, hoveredKey, onSelect, onHover } = p;
  return (
    <group>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[320, 320]} />
        <meshStandardMaterial color="#9bc48d" roughness={1} />
      </mesh>
      {asset.objects.filter((o) => o.geomJson).map((o) => {
        const g = o.geomJson as Geom;
        const interactive = o.kind === "UNIT" || o.kind === "AMENITY";
        const unit = o.unitId ? unitsById[o.unitId] : undefined;
        const label = unit ? `${unit.type === "PLOT" ? "Plot" : unit.type === "VILLA" ? "Villa" : "Unit"} ${unit.number}` : o.kind === "AMENITY" ? o.objectKey.replace(/_/g, " ") : undefined;
        return (
          <ProceduralObject
            key={o.objectKey}
            obj={o}
            color={colorFor(o, unitsById, g.color)}
            interactive={interactive}
            selected={selectedKey === o.objectKey}
            hovered={hoveredKey === o.objectKey}
            onSelect={onSelect}
            onHover={onHover}
            label={label}
          />
        );
      })}
    </group>
  );
}

/* ---------------- GLB path ---------------- */

function GlbLayout(p: SceneProps & { url: string }) {
  const { scene } = useGLTF(p.url);
  const objMap = useMemo(() => new Map(p.asset.objects.map((o) => [o.objectKey, o])), [p.asset.objects]);

  useEffect(() => {
    scene.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      const obj = objMap.get(mesh.name);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      if (!obj) return;
      const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
      const c = colorFor(obj, p.unitsById);
      mat.color = new THREE.Color(c);
      mat.emissive = new THREE.Color(c);
      mat.emissiveIntensity = p.selectedKey === mesh.name ? 0.4 : p.hoveredKey === mesh.name ? 0.15 : 0;
      mesh.material = mat;
    });
  }, [scene, objMap, p.unitsById, p.selectedKey, p.hoveredKey]);

  return (
    <primitive
      object={scene}
      onClick={(e: { stopPropagation: () => void; object: THREE.Object3D }) => {
        e.stopPropagation();
        const obj = objMap.get(e.object.name);
        if (obj && (obj.kind === "UNIT" || obj.kind === "AMENITY")) p.onSelect(e.object.name);
      }}
      onPointerOver={(e: { stopPropagation: () => void; object: THREE.Object3D }) => {
        e.stopPropagation();
        if (objMap.has(e.object.name)) { p.onHover(e.object.name); document.body.style.cursor = "pointer"; }
      }}
      onPointerOut={() => { p.onHover(null); document.body.style.cursor = "auto"; }}
    />
  );
}

/* ---------------- Camera ---------------- */

function CameraRig({ view, controls }: { view: CameraView | null; controls: React.MutableRefObject<OrbitControlsImpl | null> }) {
  const { camera } = useThree();
  const target = useRef<{ pos: THREE.Vector3; tgt: THREE.Vector3 } | null>(null);
  useEffect(() => {
    if (!view) return;
    target.current = { pos: new THREE.Vector3(...view.position), tgt: new THREE.Vector3(...view.target) };
  }, [view]);
  useFrame((_, dt) => {
    if (!target.current || !controls.current) return;
    const k = Math.min(1, dt * 3);
    camera.position.lerp(target.current.pos, k);
    controls.current.target.lerp(target.current.tgt, k);
    controls.current.update();
    if (camera.position.distanceTo(target.current.pos) < 0.2) target.current = null;
  });
  return null;
}

/** Pull the camera back on narrow (portrait) screens so the whole layout fits. */
function AspectFraming({ target }: { target: [number, number, number] }) {
  const { camera, size } = useThree();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const aspect = size.width / size.height;
    if (aspect >= 1) return;
    const t = new THREE.Vector3(...target);
    const dir = camera.position.clone().sub(t);
    camera.position.copy(t.add(dir.multiplyScalar(1 / aspect)));
    camera.updateProjectionMatrix();
  }, [camera, size, target]);
  return null;
}

export default function Scene(props: SceneProps) {
  const controls = useRef<OrbitControlsImpl | null>(null);
  const cam = props.asset.cameraJson;
  const initial = (cam?.position as [number, number, number]) ?? [0, 150, 130];
  const [dpr, setDpr] = useState<[number, number]>([1, props.lowPower ? 1 : 1.75]);

  useEffect(() => { setDpr([1, props.lowPower ? 1 : Math.min(2, window.devicePixelRatio)]); }, [props.lowPower]);

  return (
    <Canvas
      shadows={!props.lowPower}
      dpr={dpr}
      camera={{ position: initial, fov: 45, near: 0.5, far: 2000 }}
      gl={{ antialias: !props.lowPower, powerPreference: "high-performance" }}
      onPointerMissed={() => props.onSelect(null)}
    >
      <Sky sunPosition={[100, 60, 50]} turbidity={6} />
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[80, 120, 60]}
        intensity={1.4}
        castShadow={!props.lowPower}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-150}
        shadow-camera-right={150}
        shadow-camera-top={150}
        shadow-camera-bottom={-150}
      />
      {props.asset.fileUrl ? <GlbLayout {...props} url={props.asset.fileUrl} /> : <ProceduralLayout {...props} />}
      {!props.lowPower && <ContactShadows position={[0, 0.02, 0]} opacity={0.35} scale={300} blur={2} far={40} />}
      <OrbitControls
        ref={controls}
        makeDefault
        enableDamping
        dampingFactor={0.08}
        maxPolarAngle={Math.PI / 2.15}
        minDistance={20}
        maxDistance={400}
        target={(cam?.target as [number, number, number]) ?? [0, 0, 0]}
      />
      <CameraRig view={props.view} controls={controls} />
      <AspectFraming target={(cam?.target as [number, number, number]) ?? [0, 0, 0]} />
    </Canvas>
  );
}
