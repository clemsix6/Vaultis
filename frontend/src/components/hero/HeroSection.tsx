"use client";

import { Suspense, useRef, useEffect, useState, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  useGLTF,
  Environment,
  ContactShadows,
  OrbitControls,
  useProgress,
  Html,
} from "@react-three/drei";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@heroui/react";
import { ArrowRight } from "lucide-react";
import type * as THREE from "three";
import { COLORS, THREE_CONFIG } from "@/constants";

// Preload du modèle
useGLTF.preload("/models/golden_watch.glb");

// Loader personnalisé
function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
        <p className="text-gold/60 text-xs font-medium tracking-wider">
          {progress.toFixed(0)}%
        </p>
      </div>
    </Html>
  );
}

// Placeholder 3D
function WatchPlaceholder() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();
  const scale = Math.min(viewport.width, viewport.height) * 0.25;

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.15;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
    }
  });

  return (
    <mesh ref={meshRef} scale={scale}>
      <torusGeometry args={[1, 0.4, 32, 64]} />
      <meshStandardMaterial color={COLORS.gold} metalness={1} roughness={0.2} />
    </mesh>
  );
}

// Modèle de montre
function WatchModel() {
  const { scene } = useGLTF("/models/golden_watch.glb");
  const modelRef = useRef<THREE.Group>(null);
  const { viewport } = useThree();

  const clonedScene = useMemo(() => scene.clone(), [scene]);
  const baseScale = Math.min(viewport.width, viewport.height) * 0.065;

  useFrame((state) => {
    if (modelRef.current) {
      modelRef.current.rotation.y = state.clock.elapsedTime * 0.12;
    }
  });

  return (
    <group
      ref={modelRef}
      scale={baseScale}
      position={[0, -0.2, 0]}
      rotation={[Math.PI / 2, 0, 0]}
    >
      <primitive object={clonedScene} />
    </group>
  );
}

// Scène 3D complète
function WatchScene() {
  const [modelExists, setModelExists] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/models/golden_watch.glb", { method: "HEAD" })
      .then((res) => setModelExists(res.ok))
      .catch(() => setModelExists(false));
  }, []);

  return (
    <>
      <ambientLight intensity={THREE_CONFIG.ambientIntensity} />
      <spotLight
        position={[8, 8, 8]}
        angle={0.35}
        penumbra={1}
        intensity={THREE_CONFIG.spotIntensity}
        castShadow
      />
      <pointLight position={[-8, -8, -8]} color={THREE_CONFIG.goldColor} intensity={THREE_CONFIG.pointIntensity} />
      <Environment preset="city" />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 1.8}
        autoRotate={false}
      />
      {modelExists === null ? null : modelExists ? (
        <WatchModel />
      ) : (
        <WatchPlaceholder />
      )}
      <ContactShadows
        position={[0, -1.2, 0]}
        opacity={0.5}
        scale={8}
        blur={2}
        far={3}
        color="#000000"
      />
    </>
  );
}

// Stats data
const stats = [
  { value: "210K€", label: "Valeur totale" },
  { value: "125", label: "Parts vendues" },
  { value: "47", label: "Investisseurs" },
];

export function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#030303]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(201,162,39,0.08),transparent)]" />

      {/* Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pt-24 lg:pt-32">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-4 items-center min-h-[calc(100vh-8rem)]">
          {/* Left - Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-20 lg:pr-8"
          >
            {/* Overline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-gold text-sm font-medium tracking-widest uppercase mb-6"
            >
              Investissement Premium
            </motion.p>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1] mb-6"
            >
              Investissez dans
              <br />
              <span className="text-gradient-gold">le luxe tokenisé</span>
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-lg text-neutral-400 max-w-lg mb-10 leading-relaxed"
            >
              Accédez à la propriété fractionnée de montres de prestige.
              Sécurisé par la blockchain, liquidité instantanée.
            </motion.p>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
            >
              <Link href="/showroom">
                <Button
                  size="lg"
                  className="bg-gold hover:bg-gold-light text-[#030303] font-semibold px-8 h-12 text-base transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  endContent={<ArrowRight className="w-4 h-4 ml-1" />}
                >
                  Explorer le Showroom
                </Button>
              </Link>
            </motion.div>

            {/* Stats - Inline */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="flex gap-10 mt-16 pt-8 border-t border-white/[0.06]"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1 + index * 0.1, duration: 0.5 }}
                >
                  <p className="text-2xl font-semibold text-white tracking-tight">
                    {stat.value}
                  </p>
                  <p className="text-sm text-neutral-500 mt-1">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right - 3D Watch */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="relative h-[50vh] lg:h-[70vh] lg:min-h-[500px]"
          >
            <Canvas
              shadows
              dpr={[1, 2]}
              camera={{ position: [0, 0, 4.5], fov: 45 }}
              gl={{ antialias: true, alpha: true }}
              className="touch-none"
            >
              <Suspense fallback={<Loader />}>
                <WatchScene />
              </Suspense>
            </Canvas>

            {/* Subtle glow behind watch */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-gold/5 rounded-full blur-[100px]" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          className="w-5 h-8 border border-white/20 rounded-full flex items-start justify-center p-1.5"
        >
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5], y: [0, 6, 0] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            className="w-1 h-1 bg-gold rounded-full"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
