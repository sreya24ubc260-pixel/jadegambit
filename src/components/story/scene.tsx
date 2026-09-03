import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, useGLTF, Sparkles, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

import chessAsset from "@/assets/chinese_chess.glb.asset.json";
import statueAsset from "@/assets/chinese_statue_vr.glb.asset.json";
import coinsAsset from "@/assets/pile_of_coins.glb.asset.json";
import bladeAsset from "@/assets/ghostblade.glb.asset.json";
import shrineAsset from "@/assets/mystery_model.glb.asset.json";
import streetAsset from "@/assets/china_street.glb.asset.json";
import hotelAsset from "@/assets/china_hotel.glb.asset.json";
import truckAsset from "@/assets/food_truck.glb.asset.json";
import paintingAsset from "@/assets/chinese_painting.glb.asset.json";
import dragonAsset from "@/assets/chinese_red_dragon.glb.asset.json";
import festivalLanternAsset from "@/assets/chinese_new_year_lantern.glb.asset.json";
import cemeteryAsset from "@/assets/a_peaceful_cemetery_graveyard.glb.asset.json";

function damp(current: number, target: number, lambda: number, dt: number) {
  return THREE.MathUtils.damp(current, target, lambda, dt);
}

/** Clone a GLTF scene, drop unwanted nodes, then center it on the floor at a target height. */
function usePreparedModel(
  scene: THREE.Object3D,
  {
    targetSize,
    dropNames = [],
    autoFlat = false,
    dropBackdrops = false,
  }: { targetSize: number; dropNames?: RegExp[]; autoFlat?: boolean; dropBackdrops?: boolean },
) {
  return useMemo(() => {
    const c = scene.clone(true);

    const doomed: THREE.Object3D[] = [];
    c.traverse((o) => {
      if (dropNames.some((r) => r.test(o.name))) doomed.push(o);
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    doomed.forEach((o) => o.parent?.remove(o));

    // Sketchfab scenes often ship a giant low-poly painted skybox plane; drop it.
    if (dropBackdrops) {
      c.updateMatrixWorld(true);
      const whole = new THREE.Box3().setFromObject(c);
      const wholeMax = Math.max(...whole.getSize(new THREE.Vector3()).toArray());
      const big: THREE.Object3D[] = [];
      c.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh || !mesh.geometry) return;
        const tris = (mesh.geometry.index?.count ?? mesh.geometry.attributes['position']?.count ?? 0) / 3;
        const dim = Math.max(
          ...new THREE.Box3().setFromObject(mesh).getSize(new THREE.Vector3()).toArray(),
        );
        if (tris < 600 && dim > wholeMax * 0.6) big.push(mesh);
      });
      big.forEach((o) => o.parent?.remove(o));
    }

    /** Box over the "core" meshes, ignoring any oversized painted backdrop shell. */
    const measure = () => {
      const whole = new THREE.Box3().setFromObject(c);
      if (!dropBackdrops) return whole;
      const wholeMax = Math.max(...whole.getSize(new THREE.Vector3()).toArray());
      const core = new THREE.Box3();
      c.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        const b = new THREE.Box3().setFromObject(mesh);
        if (Math.max(...b.getSize(new THREE.Vector3()).toArray()) > wholeMax * 0.6) return;
        core.union(b);
      });
      return core.isEmpty() ? whole : core;
    };

    c.updateMatrixWorld(true);
    let box = measure();
    let size = box.getSize(new THREE.Vector3());

    // Some source models are Z-up; lay them flat when the thinnest axis isn't Y.
    if (autoFlat && size.y > Math.min(size.x, size.z)) {
      c.rotation.x = -Math.PI / 2;
      c.updateMatrixWorld(true);
      box = measure();
      size = box.getSize(new THREE.Vector3());
    }

    const center = box.getCenter(new THREE.Vector3());
    const span = autoFlat ? Math.max(size.x, size.z) : Math.max(size.x, size.y, size.z);
    const s = targetSize / Math.max(span, 0.0001);

    const inner = new THREE.Group();
    inner.add(c);
    c.position.set(-center.x, -box.min.y, -center.z);

    const wrapper = new THREE.Group();
    wrapper.add(inner);
    wrapper.scale.setScalar(s);
    return wrapper;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, targetSize]);
}

const win = (p: number, a: number, b: number) => THREE.MathUtils.clamp((p - a) / (b - a), 0, 1);

function Statue({ progress }: { progress: React.RefObject<number> }) {
  const { scene } = useGLTF(statueAsset.url);
  const model = usePreparedModel(scene, {
    targetSize: 5.4,
    dropNames: [/^Plane/i, /^Circle/i],
  });
  const group = useRef<THREE.Group>(null);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    const p = progress.current ?? 0;
    const local = win(p, 0, 0.1);
    const out = win(p, 0.11, 0.17);
    g.rotation.y = damp(g.rotation.y, -0.5 + local * 2.6, 2.5, dt);
    g.position.y = damp(g.position.y, -1.7 - out * 9, 2.5, dt);
    g.position.x = damp(g.position.x, local * 0.5, 2.5, dt);
    g.visible = out < 0.995;
  });

  return (
    <group ref={group} position={[0, -1.7, 0]}>
      <primitive object={model} />
    </group>
  );
}

/** Large environment set-piece that rises for one act and sinks away afterwards. */
function StageModel({
  progress,
  url,
  from,
  to,
  targetSize,
  autoFlat = false,
  y = -1.7,
  x = 0,
  z = 0,
  spin = 0.5,
  dropNames,
  keepBackdrop = false,
}: {
  progress: React.RefObject<number>;
  url: string;
  from: number;
  to: number;
  targetSize: number;
  autoFlat?: boolean;
  y?: number;
  x?: number;
  z?: number;
  spin?: number;
  dropNames?: RegExp[];
  keepBackdrop?: boolean;
}) {
  const { scene } = useGLTF(url);
  const model = usePreparedModel(scene, {
    targetSize,
    autoFlat,
    dropNames: dropNames ?? [],
    dropBackdrops: !keepBackdrop,
  });
  const group = useRef<THREE.Group>(null);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    const p = progress.current ?? 0;
    const enter = win(p, from - 0.06, from + 0.02);
    const exit = win(p, to, to + 0.06);
    const on = enter - exit;
    g.visible = on > 0.01;
    g.position.y = damp(g.position.y, y - (1 - on) * 11, 2.2, dt);
    g.rotation.y = damp(g.rotation.y, -0.4 + win(p, from, to) * spin, 1.6, dt);
  });

  return (
    <group ref={group} position={[x, y - 11, z]}>
      <primitive object={model} />
    </group>
  );
}

function ChessSet({ progress }: { progress: React.RefObject<number> }) {
  const { scene } = useGLTF(chessAsset.url);
  const model = usePreparedModel(scene, { targetSize: 6.4, autoFlat: true });
  const group = useRef<THREE.Group>(null);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    const p = progress.current ?? 0;
    const enter = win(p, 0.32, 0.38);
    const exit = win(p, 0.66, 0.72);
    const on = enter - exit;
    g.visible = on > 0.002;
    g.position.y = damp(g.position.y, -8 + on * 7.2, 2.5, dt);
    g.rotation.y = damp(g.rotation.y, -0.5 + win(p, 0.36, 0.68) * 2, 2.5, dt);
  });

  return (
    <group ref={group} position={[0, -8, 0]}>
      <primitive object={model} />
    </group>
  );
}

/** The wager: a pile of coins that rises with the bet and sinks once the game begins. */
function Coins({ progress }: { progress: React.RefObject<number> }) {
  const { scene } = useGLTF(coinsAsset.url);
  const model = usePreparedModel(scene, { targetSize: 1.6, autoFlat: true });
  const group = useRef<THREE.Group>(null);

  useFrame(({ clock }, dt) => {
    const g = group.current;
    if (!g) return;
    const p = progress.current ?? 0;
    const on = win(p, 0.25, 0.31) - win(p, 0.38, 0.44);
    g.visible = on > 0.01;
    g.position.y = damp(g.position.y, -1.7 + on * 0.1 - (1 - on) * 3, 2.5, dt);
    g.rotation.y = clock.elapsedTime * 0.25;
  });

  return (
    <group ref={group} position={[3.1, -4.7, 0.6]}>
      <primitive object={model} />
    </group>
  );
}

/** The traveller's blade, planted beside the board through the late acts. */
function Blade({ progress }: { progress: React.RefObject<number> }) {
  const { scene } = useGLTF(bladeAsset.url);
  const model = usePreparedModel(scene, { targetSize: 3.4 });
  const group = useRef<THREE.Group>(null);

  useFrame(({ clock }, dt) => {
    const g = group.current;
    if (!g) return;
    const p = progress.current ?? 0;
    const on = win(p, 0.4, 0.46) - win(p, 0.62, 0.68);
    g.visible = on > 0.01;
    g.position.y = damp(
      g.position.y,
      -1.7 + (1 - on) * -4 + Math.sin(clock.elapsedTime * 0.6) * 0.06,
      2.5,
      dt,
    );
    g.rotation.y = damp(g.rotation.y, -0.8 + on * 1.4, 2, dt);
  });

  return (
    <group ref={group} position={[-3.8, -5.7, 0.2]} rotation={[0, -0.8, 0.12]}>
      <primitive object={model} />
    </group>
  );
}

/** Distant shrine silhouette anchoring the valley behind everything. */
function Shrine({ progress }: { progress: React.RefObject<number> }) {
  const { scene } = useGLTF(shrineAsset.url);
  const model = usePreparedModel(scene, { targetSize: 9 });
  const group = useRef<THREE.Group>(null);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    const p = progress.current ?? 0;
    g.rotation.y = damp(g.rotation.y, 0.4 + p * 0.5, 1.5, dt);
  });

  return (
    <group ref={group} position={[0, -2.4, -13]}>
      <primitive object={model} />
    </group>
  );
}

function Lantern({ x, y, z, delay }: { x: number; y: number; z: number; delay: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + delay;
    if (ref.current) {
      ref.current.position.y = y + Math.sin(t * 0.5) * 0.4;
      ref.current.rotation.z = Math.sin(t * 0.35) * 0.1;
    }
  });
  return (
    <group ref={ref} position={[x, y, z]}>
      <mesh scale={[1, 0.8, 1]}>
        <sphereGeometry args={[0.16, 20, 14]} />
        <meshStandardMaterial
          color="#ff7a4d"
          emissive="#ff3b1f"
          emissiveIntensity={2.6}
          roughness={0.6}
        />
      </mesh>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.06, 12]} />
        <meshStandardMaterial color="#3a2418" />
      </mesh>
      <pointLight color="#ff7a3d" intensity={4} distance={8} decay={2} />
    </group>
  );
}

function Ripples() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.children.forEach((c, i) => {
      const t = (clock.elapsedTime * 0.22 + i / 5) % 1;
      c.scale.setScalar(1 + t * 8);
      const m = (c as THREE.Mesh).material as THREE.MeshBasicMaterial;
      m.opacity = 0.3 * (1 - t);
    });
  });
  return (
    <group ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.68, 0]}>
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i}>
          <ringGeometry args={[0.8, 0.83, 96]} />
          <meshBasicMaterial color="#7fe0c2" transparent opacity={0.2} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

function Rig({ progress }: { progress: React.RefObject<number> }) {
  useFrame((state, dt) => {
    const p = progress.current ?? 0;
    const targetZ = 10 - Math.sin(p * Math.PI) * 1.8;
    const targetY = 0.4 + p * 1.9;
    state.camera.position.x = damp(state.camera.position.x, state.pointer.x * 1.3, 2, dt);
    state.camera.position.y = damp(state.camera.position.y, targetY + state.pointer.y * 0.5, 2, dt);
    state.camera.position.z = damp(state.camera.position.z, targetZ, 2, dt);
    state.camera.lookAt(0, -0.1 + p * 0.4, 0);
  });
  return null;
}

export default function StoryScene({ progress }: { progress: React.RefObject<number> }) {
  return (
    <Canvas
      dpr={[1, 1.8]}
      shadows
      gl={{ antialias: true }}
      camera={{ position: [0, 1, 10], fov: 45 }}
    >
      <color attach="background" args={["#0a0a0c"]} />
      <fog attach="fog" args={["#0a0a0c", 10, 24]} />

      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 8, 5]} intensity={2} color="#ffd9a8" castShadow />
      <spotLight position={[-6, 6, 3]} angle={0.7} intensity={60} color="#5fd6b0" penumbra={1} />
      <spotLight
        position={[0, 6, 3]}
        angle={0.9}
        intensity={90}
        color="#ffcf9a"
        penumbra={0.9}
        castShadow
      />

      <Suspense fallback={null}>
        <Float speed={1} rotationIntensity={0.05} floatIntensity={0.2}>
          <Statue progress={progress} />
        </Float>
        <StageModel
          progress={progress}
          url={streetAsset.url}
          from={0.11}
          to={0.19}
          targetSize={11}
          autoFlat
          z={-3}
          spin={0.35}
        />
        <StageModel
          progress={progress}
          url={hotelAsset.url}
          from={0.19}
          to={0.27}
          targetSize={11}
          z={0}
          spin={0.8}
        />
        <ChessSet progress={progress} />
        <Coins progress={progress} />
        <Blade progress={progress} />
        <StageModel
          progress={progress}
          url={truckAsset.url}
          from={0.47}
          to={0.61}
          targetSize={8}
          z={-2}
          spin={0.9}
        />
        <StageModel
          progress={progress}
          url={dragonAsset.url}
          from={0.68}
          to={0.76}
          targetSize={10}
          y={0.6}
          z={-4}
          spin={1.1}
        />
        <StageModel
          progress={progress}
          url={festivalLanternAsset.url}
          from={0.75}
          to={0.83}
          targetSize={5.5}
          y={-1.2}
          z={-1}
          spin={0.6}
        />
        <StageModel
          progress={progress}
          url={cemeteryAsset.url}
          from={0.82}
          to={0.9}
          targetSize={12}
          autoFlat
          z={-3}
          spin={0.3}
        />
        <StageModel
          progress={progress}
          url={paintingAsset.url}
          from={0.9}
          to={1.15}
          targetSize={6}
          y={-1.4}
          z={-3}
          keepBackdrop
          spin={0.25}
        />
        <Shrine progress={progress} />
        <Environment preset="night" />
      </Suspense>

      <Lantern x={-3.4} y={1.6} z={-1.5} delay={0} />
      <Lantern x={3.6} y={2.3} z={-2.6} delay={2.1} />
      <Lantern x={2.2} y={1.1} z={1.8} delay={4.3} />
      <Lantern x={-2.4} y={2.8} z={-4} delay={6.2} />

      <Ripples />
      <Sparkles count={110} scale={[16, 9, 12]} size={2.2} speed={0.22} color="#ffd9a8" />
      <ContactShadows position={[0, -1.7, 0]} opacity={0.6} scale={22} blur={2.6} far={7} />

      <Rig progress={progress} />
    </Canvas>
  );
}

useGLTF.preload(statueAsset.url);
useGLTF.preload(chessAsset.url);
useGLTF.preload(coinsAsset.url);
useGLTF.preload(bladeAsset.url);
useGLTF.preload(shrineAsset.url);
useGLTF.preload(streetAsset.url);
useGLTF.preload(hotelAsset.url);
useGLTF.preload(truckAsset.url);
useGLTF.preload(paintingAsset.url);
useGLTF.preload(dragonAsset.url);
useGLTF.preload(festivalLanternAsset.url);
useGLTF.preload(cemeteryAsset.url);
