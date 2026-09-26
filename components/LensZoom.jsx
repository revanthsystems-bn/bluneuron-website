'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'framer-motion';

const RING_COUNT = 6;
const RING_SPACING = 6;
const TUNNEL_DEPTH = RING_COUNT * RING_SPACING;

function LensRings({ progressRef, reduceMotion }) {
  const group = useRef(null);

  const rings = useMemo(
    () =>
      Array.from({ length: RING_COUNT }).map((_, i) => ({
        z: -i * RING_SPACING,
        radius: 2.4 + i * 0.4,
        tube: 0.045 + i * 0.008,
      })),
    []
  );

  useFrame((state, delta) => {
    const p = progressRef.current;

    // Dolly the camera straight through the lens tunnel, with a subtle
    // focal-length pulse (a "dolly zoom") as it passes each ring. This is
    // scroll-driven (not ambient autoplay), so it runs regardless of
    // prefers-reduced-motion.
    state.camera.position.z = 10 - p * (TUNNEL_DEPTH + 14);
    state.camera.fov = 45 + Math.sin(p * Math.PI) * 16;
    state.camera.updateProjectionMatrix();

    // The rings' own idle spin is ambient autoplay — skip it under
    // prefers-reduced-motion.
    if (group.current && !reduceMotion) {
      group.current.rotation.z += delta * 0.04;
      group.current.children.forEach((mesh, i) => {
        mesh.rotation.z -= delta * (0.06 + i * 0.015);
      });
    }
  });

  return (
    <group ref={group}>
      {rings.map((r, i) => (
        <mesh key={i} position={[0, 0, r.z]}>
          <torusGeometry args={[r.radius, r.tube, 24, 96]} />
          <meshStandardMaterial
            color="#3B82F6"
            emissive="#1d4ed8"
            emissiveIntensity={0.7}
            metalness={0.9}
            roughness={0.18}
          />
        </mesh>
      ))}
    </group>
  );
}

function LensCore({ progressRef }) {
  const light = useRef(null);
  const mesh = useRef(null);

  useFrame((state) => {
    const p = progressRef.current;
    if (light.current) light.current.intensity = 2 + p * 34;
    if (mesh.current) {
      const s = 1 + p * 0.6;
      mesh.current.scale.set(s, s, s);
    }
  });

  return (
    <group position={[0, 0, -TUNNEL_DEPTH - 6]}>
      <pointLight ref={light} color="#eaf2ff" distance={70} decay={2} />
      <mesh ref={mesh}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color="#eaf2ff" />
      </mesh>
    </group>
  );
}

function Scene({ progressRef, reduceMotion }) {
  return (
    <>
      <color attach="background" args={['#000000']} />
      <fog attach="fog" args={['#000000', 4, 32]} />
      <ambientLight intensity={0.12} />
      <pointLight position={[0, 0, 6]} color="#60A5FA" intensity={3} distance={22} />
      <LensRings progressRef={progressRef} reduceMotion={reduceMotion} />
      <LensCore progressRef={progressRef} />
      <Sparkles
        count={130}
        scale={[9, 9, TUNNEL_DEPTH + 10]}
        size={1.8}
        speed={reduceMotion ? 0 : 0.25}
        color="#8fb8ff"
        opacity={0.55}
      />
    </>
  );
}

export default function LensZoom() {
  const sectionRef = useRef(null);
  const progressRef = useRef(0);
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    progressRef.current = v;
  });

  const labelOpacity = useTransform(scrollYProgress, [0, 0.1, 0.82, 0.92], [1, 1, 1, 0]);
  const labelY = useTransform(scrollYProgress, [0, 0.25], [0, -50]);
  const flashOpacity = useTransform(scrollYProgress, [0, 0.74, 0.94, 1], [0, 0, 1, 1]);
  const vignetteOpacity = useTransform(scrollYProgress, [0, 0.15], [0, 1]);

  return (
    <section ref={sectionRef} className="relative h-[320vh] bg-black">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <Canvas
          camera={{ position: [0, 0, 10], fov: 45, near: 0.1, far: 200 }}
          dpr={[1, 1.75]}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
        >
          <Scene progressRef={progressRef} reduceMotion={reduceMotion} />
        </Canvas>

        <motion.div
          style={{ opacity: vignetteOpacity }}
          className="pointer-events-none absolute inset-0 bg-radial-fade"
        />

        <motion.div
          style={{ opacity: labelOpacity, y: labelY }}
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
        >
          <p className="eyebrow mb-4">Through the lens</p>
          <h2 className="max-w-2xl text-3xl font-bold tracking-tighter text-white sm:text-5xl">
            Native 1080p, projected up to 200 inches.
          </h2>
        </motion.div>

        <motion.div
          style={{ opacity: flashOpacity }}
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,#ffffff_0%,#dbeafe_30%,#60a5fa_58%,#020617_100%)]"
        />
      </div>
    </section>
  );
}
