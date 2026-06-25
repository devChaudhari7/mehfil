"use client";

/*
 * GrooveSceneWebGL — Tier A (React Three Fiber). Code-split + lazy (ssr:false),
 * loaded by GrooveStage only for capable devices. A real 3D scene: the central
 * medium artifact (disc / cassette / CD) crossfades by era, spins off the
 * interpolated clock (so it pauses exactly when playback pauses), and an
 * era-tinted light + a groove ring carry the palette. Colors are read LIVE from
 * the morphing CSS tokens (eraColors), so the 3D palette stays in lockstep with
 * the DOM without duplicating any hex.
 *
 * THREE.Clock note (Phase 8): this scene constructs no Clock — spin is driven by
 * useFrame's delta + the interpolated clock. three r0.184 deprecates THREE.Clock
 * (in favour of THREE.Timer); the deprecation warning seen in the Tier-A console
 * originates in @react-three/fiber's internal render loop, not our code. We are
 * already on the latest @react-three/fiber (9.6.1) + three (0.184) — there is no
 * newer release to adopt, so it clears upstream when R3F migrates to Timer.
 */
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { getEra } from "@/lib/eras";
import { useEraStore } from "@/lib/useEraStore";
import { readEraColors } from "@/lib/eraColors";
import type { InterpolatedClock } from "@/lib/useInterpolatedTime";

function fadeGroup(group: THREE.Group | null, visible: boolean, dt: number) {
  if (!group) return;
  const target = visible ? 1 : 0;
  let maxOp = 0;
  group.traverse((o) => {
    const mat = (o as THREE.Mesh).material;
    if (mat && !Array.isArray(mat) && "opacity" in mat) {
      const m = mat as THREE.Material & { opacity: number };
      m.transparent = true;
      m.opacity += (target - m.opacity) * Math.min(1, dt * 6);
      maxOp = Math.max(maxOp, m.opacity);
    }
  });
  group.visible = maxOp > 0.02;
}

function Scene({ clock }: { clock: InterpolatedClock }) {
  const era = useEraStore((s) => s.era);
  const medium = getEra(era).medium;

  const disc = useRef<THREE.Group>(null);
  const cd = useRef<THREE.Group>(null);
  const cass = useRef<THREE.Group>(null);
  const reelL = useRef<THREE.Group>(null);
  const reelR = useRef<THREE.Group>(null);
  const light = useRef<THREE.PointLight>(null);

  const discLabel = useRef<THREE.MeshStandardMaterial>(null);
  const cdMat = useRef<THREE.MeshStandardMaterial>(null);
  const cassBody = useRef<THREE.MeshStandardMaterial>(null);
  const ringMat = useRef<THREE.MeshBasicMaterial>(null);

  // One shared material for both reels (so both take the era color + crossfade).
  const reelMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ transparent: true, opacity: 0 }),
    [],
  );
  useEffect(() => () => reelMaterial.dispose(), [reelMaterial]);

  useFrame((_, dt) => {
    const t = clock.getTime();
    const c = readEraColors();
    light.current?.color.set(c.glow);
    discLabel.current?.color.set(c.accent);
    cdMat.current?.color.set(c.ink);
    cassBody.current?.color.set(c.accent2);
    ringMat.current?.color.set(c.accent);
    reelMaterial.color.set(c.accent);

    // Spin straight off interpolated time: advances while playing, frozen on pause.
    if (disc.current) disc.current.rotation.y = -t * 1.9;
    if (cd.current) cd.current.rotation.y = -t * 2.2;
    if (reelL.current) reelL.current.rotation.z = -t * 3;
    if (reelR.current) reelR.current.rotation.z = -t * 3;

    fadeGroup(disc.current, medium === "shellac" || medium === "vinyl", dt);
    fadeGroup(cd.current, medium === "cd", dt);
    fadeGroup(cass.current, medium === "cassette", dt);
  });

  return (
    <>
      <ambientLight intensity={0.55} />
      <pointLight ref={light} position={[2.5, 3, 4]} intensity={120} distance={20} decay={1.6} />

      <mesh rotation={[-Math.PI / 2.2, 0, 0]} position={[0, -0.2, 0]}>
        <ringGeometry args={[1.7, 2.6, 96]} />
        <meshBasicMaterial ref={ringMat} transparent opacity={0.14} side={THREE.DoubleSide} />
      </mesh>

      <group rotation={[-0.5, 0, 0]}>
        {/* Disc (shellac / vinyl) */}
        <group ref={disc}>
          <mesh>
            <cylinderGeometry args={[1.5, 1.5, 0.06, 64]} />
            <meshStandardMaterial color="#0c0c10" roughness={0.55} metalness={0.2} transparent opacity={1} />
          </mesh>
          <mesh position={[0, 0.035, 0]}>
            <cylinderGeometry args={[0.5, 0.5, 0.02, 48]} />
            <meshStandardMaterial ref={discLabel} roughness={0.6} transparent opacity={1} />
          </mesh>
        </group>

        {/* Compact disc */}
        <group ref={cd} visible={false}>
          <mesh>
            <cylinderGeometry args={[1.5, 1.5, 0.04, 80]} />
            <meshStandardMaterial ref={cdMat} metalness={0.6} roughness={0.22} transparent opacity={0} />
          </mesh>
          <mesh position={[0, 0.03, 0]}>
            <cylinderGeometry args={[0.32, 0.32, 0.02, 40]} />
            <meshStandardMaterial color="#0a0a0c" transparent opacity={0} />
          </mesh>
        </group>

        {/* Cassette */}
        <group ref={cass} visible={false}>
          <mesh>
            <boxGeometry args={[2.8, 1.8, 0.28]} />
            <meshStandardMaterial ref={cassBody} roughness={0.7} metalness={0.1} transparent opacity={0} />
          </mesh>
          <group ref={reelL} position={[-0.6, 0, 0.16]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} material={reelMaterial}>
              <cylinderGeometry args={[0.36, 0.36, 0.06, 24]} />
            </mesh>
          </group>
          <group ref={reelR} position={[0.6, 0, 0.16]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} material={reelMaterial}>
              <cylinderGeometry args={[0.36, 0.36, 0.06, 24]} />
            </mesh>
          </group>
        </group>
      </group>
    </>
  );
}

export function GrooveSceneWebGL({ clock }: { clock: InterpolatedClock }) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0.4, 5], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      style={{ position: "absolute", inset: 0 }}
    >
      <Scene clock={clock} />
    </Canvas>
  );
}
