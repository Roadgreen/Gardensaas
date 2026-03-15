'use client';

import { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { Plant, Shape3D } from '@/types';

interface Plant3DProps {
  plant: Plant;
  position: [number, number, number];
  plantedDate: string;
  onSelect?: () => void;
  onContextMenu?: (event: MouseEvent) => void;
  isSelected?: boolean;
  isWatering?: boolean;
}

type GrowthStage = 'seed' | 'sprout' | 'growing' | 'mature' | 'harvest';

function getGrowthStage(plantedDate: string, harvestDays: number): GrowthStage {
  const now = new Date();
  const planted = new Date(plantedDate);
  const daysPassed = Math.floor((now.getTime() - planted.getTime()) / (1000 * 60 * 60 * 24));
  const progress = daysPassed / harvestDays;

  if (progress < 0.05) return 'seed';
  if (progress < 0.25) return 'sprout';
  if (progress < 0.7) return 'growing';
  if (progress < 1.0) return 'mature';
  return 'harvest';
}

function getGrowthProgress(plantedDate: string, harvestDays: number): number {
  const now = new Date();
  const planted = new Date(plantedDate);
  const daysPassed = Math.floor((now.getTime() - planted.getTime()) / (1000 * 60 * 60 * 24));
  return Math.min(daysPassed / harvestDays, 1.2);
}

function needsWater(wateringFrequency: string): boolean {
  const hour = new Date().getHours();
  if (wateringFrequency === 'daily') return hour > 14;
  if (wateringFrequency === 'every-2-days') return hour > 16;
  return false;
}

// Seed stage rendering
function SeedModel() {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    const t = performance.now() * 0.001;
    ref.current.position.y = 0.01 + Math.sin(t * 3) * 0.003;
  });
  return (
    <group ref={ref}>
      <mesh position={[0, 0.01, 0]}>
        <sphereGeometry args={[0.06, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#6B4423" />
      </mesh>
      <mesh position={[0, 0.03, 0]}>
        <sphereGeometry args={[0.018, 6, 4]} />
        <meshStandardMaterial color="#8B7355" />
      </mesh>
    </group>
  );
}

// Sprout stage rendering
function SproutModel({ color }: { color: string }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    const t = performance.now() * 0.001;
    ref.current.rotation.z = Math.sin(t * 2.5) * 0.08;
    ref.current.rotation.x = Math.sin(t * 1.5 + 1) * 0.04;
  });
  return (
    <group ref={ref}>
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.008, 0.012, 0.1, 5]} />
        <meshStandardMaterial color="#4CAF50" />
      </mesh>
      <mesh position={[-0.025, 0.1, 0]} rotation={[0.2, 0, -0.6]}>
        <sphereGeometry args={[0.02, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#66BB6A" />
      </mesh>
      <mesh position={[0.025, 0.1, 0]} rotation={[0.2, 0, 0.6]}>
        <sphereGeometry args={[0.02, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#66BB6A" />
      </mesh>
    </group>
  );
}

// Pollen particle effect
function PollenParticles({ active, position }: { active: boolean; position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);
  const particles = useMemo(() =>
    Array.from({ length: 8 }, (_, i) => ({
      angle: (i / 8) * Math.PI * 2,
      speed: 0.3 + Math.random() * 0.5,
      dist: 0.05 + Math.random() * 0.1,
      ySpeed: 0.1 + Math.random() * 0.2,
    })),
  []);

  useFrame(() => {
    if (!ref.current || !active) return;
    const t = performance.now() * 0.001;
    ref.current.children.forEach((child, i) => {
      const p = particles[i];
      if (!p) return;
      const mesh = child as THREE.Mesh;
      mesh.position.x = Math.cos(t * p.speed + p.angle) * p.dist;
      mesh.position.z = Math.sin(t * p.speed + p.angle) * p.dist;
      mesh.position.y = (t * p.ySpeed) % 0.4;
      const fade = 1 - (mesh.position.y / 0.4);
      mesh.scale.setScalar(0.3 + fade * 0.7);
      (mesh.material as THREE.MeshBasicMaterial).opacity = fade * 0.5;
    });
  });

  if (!active) return null;

  return (
    <group ref={ref} position={[position[0], position[1] + 0.2, position[2]]}>
      {particles.map((_, i) => (
        <mesh key={`pollen-${i}`}>
          <sphereGeometry args={[0.005, 4, 3]} />
          <meshBasicMaterial color="#FFE082" transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

// Water droplet effect when watering
function WateringEffect({ active }: { active: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const drops = useMemo(() =>
    Array.from({ length: 10 }, (_, i) => ({
      x: (Math.random() - 0.5) * 0.2,
      z: (Math.random() - 0.5) * 0.2,
      speed: 1.5 + Math.random() * 1.5,
      offset: Math.random() * Math.PI * 2,
    })),
  []);

  useFrame(() => {
    if (!ref.current || !active) return;
    const t = performance.now() * 0.001;
    ref.current.children.forEach((child, i) => {
      const d = drops[i];
      if (!d) return;
      const mesh = child as THREE.Mesh;
      const phase = (t * d.speed + d.offset) % 1;
      mesh.position.x = d.x;
      mesh.position.z = d.z;
      mesh.position.y = 0.5 - phase * 0.5;
      const fade = phase < 0.8 ? 1 : (1 - phase) / 0.2;
      mesh.visible = true;
      (mesh.material as THREE.MeshBasicMaterial).opacity = fade * 0.7;
    });
  });

  if (!active) return null;

  return (
    <group ref={ref}>
      {drops.map((_, i) => (
        <mesh key={`wdrop-${i}`}>
          <sphereGeometry args={[0.006, 4, 3]} />
          <meshBasicMaterial color="#60A5FA" transparent opacity={0.7} />
        </mesh>
      ))}
    </group>
  );
}

// Hover glow effect
function HoverGlow({ active, color }: { active: boolean; color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!ref.current || !active) return;
    const t = performance.now() * 0.001;
    const pulse = 0.15 + Math.sin(t * 3) * 0.08;
    (ref.current.material as THREE.MeshBasicMaterial).opacity = pulse;
    ref.current.scale.setScalar(1 + Math.sin(t * 2) * 0.05);
  });

  if (!active) return null;

  return (
    <mesh ref={ref} position={[0, 0.15, 0]}>
      <sphereGeometry args={[0.18, 8, 6]} />
      <meshBasicMaterial color={color} transparent opacity={0.15} side={THREE.BackSide} />
    </mesh>
  );
}

// Full plant model based on shape type
function PlantModel({
  shape,
  color,
  heightCm,
  stage,
  isHarvest,
  isThirsty,
}: {
  shape: Shape3D;
  color: string;
  heightCm: number;
  stage: GrowthStage;
  isHarvest: boolean;
  isThirsty: boolean;
}) {
  const meshRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  const stageScale = useMemo(() => {
    switch (stage) {
      case 'seed': return 0.15;
      case 'sprout': return 0.35;
      case 'growing': return 0.65;
      case 'mature': return 0.9;
      case 'harvest': return 1.0;
    }
  }, [stage]);

  // Smooth growth scale interpolation (animate between stages)
  const targetScale = useRef(stageScale);
  const currentScale = useRef(stageScale);
  useEffect(() => {
    targetScale.current = stageScale;
  }, [stageScale]);

  const baseHeight = Math.min((heightCm / 100) * 0.6, 0.8);
  const s = stageScale;

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const t = performance.now() * 0.001;
    const px = meshRef.current.position.x || 0;

    // Smooth growth interpolation
    if (Math.abs(currentScale.current - targetScale.current) > 0.001) {
      currentScale.current += (targetScale.current - currentScale.current) * Math.min(delta * 2, 0.1);
      const growthScale = currentScale.current / stageScale;
      meshRef.current.scale.setScalar(growthScale);
    }

    if (isThirsty && stage !== 'seed') {
      meshRef.current.rotation.z = Math.sin(t * 0.5) * 0.08 + 0.12;
      meshRef.current.rotation.x = 0.08;
    } else {
      // Multi-layered wind sway for organic feel
      const windBase = Math.sin(t * 1.2 + px * 8) * 0.04;
      const windGust = Math.sin(t * 0.3 + px * 3) * Math.sin(t * 2.5) * 0.02;
      // Leaf flutter - subtle higher frequency
      const flutter = Math.sin(t * 4.5 + px * 12) * 0.008;
      meshRef.current.rotation.z = windBase + windGust + flutter;
      meshRef.current.rotation.x = Math.sin(t * 0.8 + px * 5 + 1) * 0.025 + Math.sin(t * 0.2) * 0.01;
    }

    if (glowRef.current && isHarvest) {
      const pulse = Math.sin(t * 3) * 0.3 + 0.7;
      glowRef.current.scale.setScalar(1.2 + pulse * 0.2);
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = pulse * 0.25;
    }
  });

  if (stage === 'seed') return <SeedModel />;
  if (stage === 'sprout') return <SproutModel color={color} />;

  const h = baseHeight * s;
  const mainColor = isThirsty ? '#9E8E60' : color;
  const stemColor = isThirsty ? '#7A8050' : '#4CAF50';
  const leafColor = isThirsty ? '#8A9040' : '#43A047';
  const leafDark = isThirsty ? '#7A8030' : '#2E7D32';

  return (
    <group ref={meshRef}>
      {/* Main stem */}
      <mesh position={[0, h * 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.012 * s, 0.018 * s, h * 0.8, 6]} />
        <meshStandardMaterial color={stemColor} />
      </mesh>

      {/* Leaves along stem */}
      <LeafPair y={h * 0.25} scale={s} color={leafColor} />
      {(stage === 'growing' || stage === 'mature' || stage === 'harvest') && (
        <LeafPair y={h * 0.45} scale={s * 0.9} color={leafDark} offset={Math.PI / 3} />
      )}
      {(stage === 'mature' || stage === 'harvest') && (
        <LeafPair y={h * 0.6} scale={s * 0.7} color={leafColor} offset={Math.PI / 6} />
      )}

      {/* Shape-specific fruit/vegetable body */}
      {(stage === 'growing' || stage === 'mature' || stage === 'harvest') && (
        <group position={[0, h * 0.7, 0]}>
          <ShapeBody shape={shape} color={mainColor} scale={s} stemColor={stemColor} leafColor={leafColor} isThirsty={isThirsty} />
        </group>
      )}

      {/* Harvest golden glow */}
      {isHarvest && (
        <mesh ref={glowRef} position={[0, h * 0.6, 0]}>
          <sphereGeometry args={[0.15, 8, 6]} />
          <meshBasicMaterial color="#FFD700" transparent opacity={0.2} />
        </mesh>
      )}

      {/* Harvest sparkle particles */}
      {isHarvest && <HarvestSparkles y={h * 0.7} />}

      {/* Water droplet indicator */}
      {isThirsty && <ThirstIndicator y={h * 0.9} />}
    </group>
  );
}

function LeafPair({ y, scale, color, offset = 0 }: { y: number; scale: number; color: string; offset?: number }) {
  const leftRef = useRef<THREE.Mesh>(null);
  const rightRef = useRef<THREE.Mesh>(null);

  // Individual leaf flutter animation
  useFrame(() => {
    const t = performance.now() * 0.001;
    if (leftRef.current) {
      leftRef.current.rotation.z = -0.6 + Math.sin(t * 3 + offset) * 0.06;
    }
    if (rightRef.current) {
      rightRef.current.rotation.z = 0.6 + Math.sin(t * 3.2 + offset + 1) * 0.06;
    }
  });

  return (
    <>
      <mesh ref={leftRef} position={[-0.04 * scale, y, 0]} rotation={[offset, 0, -0.6]}>
        <boxGeometry args={[0.06 * scale, 0.006, 0.03 * scale]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh ref={rightRef} position={[0.04 * scale, y, 0.01]} rotation={[offset + 0.3, 0.5, 0.6]}>
        <boxGeometry args={[0.06 * scale, 0.006, 0.03 * scale]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </>
  );
}

function ShapeBody({ shape, color, scale, stemColor, leafColor, isThirsty }: {
  shape: Shape3D; color: string; scale: number; stemColor: string; leafColor: string; isThirsty: boolean;
}) {
  const s = scale;
  switch (shape) {
    case 'sphere':
      return (
        <group>
          <mesh castShadow>
            <sphereGeometry args={[0.065 * s, 10, 8]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[0, 0.06 * s, 0]}>
            <cylinderGeometry args={[0.005, 0.008, 0.02 * s, 4]} />
            <meshStandardMaterial color={stemColor} />
          </mesh>
        </group>
      );
    case 'cone':
      return (
        <group>
          <mesh castShadow rotation={[Math.PI, 0, 0]} position={[0, -0.03 * s, 0]}>
            <coneGeometry args={[0.04 * s, 0.14 * s, 7]} />
            <meshStandardMaterial color={color} />
          </mesh>
          {[0, 1.2, 2.4, 3.6, 4.8].map((a, i) => (
            <mesh key={`ct-${i}`} position={[Math.cos(a) * 0.015, 0.04 * s, Math.sin(a) * 0.015]} rotation={[0.3 + Math.sin(a) * 0.2, a, 0]}>
              <boxGeometry args={[0.04 * s, 0.005, 0.015 * s]} />
              <meshStandardMaterial color={leafColor} />
            </mesh>
          ))}
        </group>
      );
    case 'cylinder':
      return (
        <group>
          <mesh castShadow>
            <cylinderGeometry args={[0.028 * s, 0.035 * s, 0.12 * s, 7]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[-0.02 * s, 0.07 * s, 0]} rotation={[0, 0, -0.5]}>
            <boxGeometry args={[0.05 * s, 0.006, 0.02 * s]} />
            <meshStandardMaterial color={leafColor} />
          </mesh>
          <mesh position={[0.02 * s, 0.06 * s, 0.01]} rotation={[0.2, 0.3, 0.5]}>
            <boxGeometry args={[0.05 * s, 0.006, 0.02 * s]} />
            <meshStandardMaterial color={leafColor} />
          </mesh>
        </group>
      );
    case 'box':
      return (
        <group>
          <mesh castShadow>
            <boxGeometry args={[0.065 * s, 0.08 * s, 0.065 * s]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[0, 0.04 * s, 0]}>
            <cylinderGeometry args={[0.005, 0.012, 0.015 * s, 4]} />
            <meshStandardMaterial color={stemColor} />
          </mesh>
        </group>
      );
    case 'capsule':
      return (
        <group>
          <mesh castShadow rotation={[0.15, 0, 0]}>
            <capsuleGeometry args={[0.03 * s, 0.07 * s, 5, 8]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[0, 0.055 * s, 0]}>
            <coneGeometry args={[0.02 * s, 0.02 * s, 5]} />
            <meshStandardMaterial color={stemColor} />
          </mesh>
        </group>
      );
    case 'bush':
      return (
        <group>
          <mesh castShadow position={[0, 0, 0]}>
            <sphereGeometry args={[0.07 * s, 8, 6]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh castShadow position={[-0.04 * s, -0.02, 0.02 * s]}>
            <sphereGeometry args={[0.05 * s, 7, 5]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh castShadow position={[0.04 * s, -0.01, -0.02 * s]}>
            <sphereGeometry args={[0.05 * s, 7, 5]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh castShadow position={[0, 0.03 * s, 0.03 * s]}>
            <sphereGeometry args={[0.04 * s, 6, 5]} />
            <meshStandardMaterial color={color} />
          </mesh>
          {/* Small berries/flowers on bush */}
          {!isThirsty && [0, 1.5, 3, 4.5].map((a, i) => (
            <mesh key={`berry-${i}`} position={[Math.cos(a) * 0.06 * s, 0.02 + (i % 2) * 0.03, Math.sin(a) * 0.06 * s]}>
              <sphereGeometry args={[0.012 * s, 5, 4]} />
              <meshStandardMaterial color={i % 2 === 0 ? '#E53935' : '#FFD700'} />
            </mesh>
          ))}
        </group>
      );
    case 'vine':
      return (
        <group>
          <mesh position={[0, 0.02 * s, 0]}>
            <cylinderGeometry args={[0.005, 0.005, 0.2 * s, 4]} />
            <meshStandardMaterial color="#8B6914" />
          </mesh>
          <mesh castShadow position={[0.01 * s, 0, 0]}>
            <cylinderGeometry args={[0.008 * s, 0.012 * s, 0.16 * s, 6]} />
            <meshStandardMaterial color={stemColor} />
          </mesh>
          {/* Curling tendrils */}
          <mesh position={[0.025 * s, 0.06 * s, 0.01]}>
            <torusGeometry args={[0.008 * s, 0.002, 4, 8, Math.PI * 1.5]} />
            <meshStandardMaterial color={stemColor} />
          </mesh>
          <mesh castShadow position={[0.03 * s, 0.04 * s, 0]}>
            <sphereGeometry args={[0.025 * s, 6, 5]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh castShadow position={[-0.02 * s, -0.02 * s, 0.01 * s]}>
            <sphereGeometry args={[0.02 * s, 6, 5]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[0.02 * s, 0.06 * s, 0.01]} rotation={[0.2, 0.5, 0.3]}>
            <boxGeometry args={[0.04 * s, 0.005, 0.03 * s]} />
            <meshStandardMaterial color={leafColor} />
          </mesh>
        </group>
      );
    case 'leafy':
      return (
        <group>
          <mesh castShadow>
            <sphereGeometry args={[0.05 * s, 8, 6]} />
            <meshStandardMaterial color={color} />
          </mesh>
          {[0, 1.05, 2.1, 3.15, 4.2, 5.25].map((angle, i) => (
            <mesh
              key={`lf-${i}`}
              castShadow
              position={[
                Math.cos(angle) * 0.06 * s,
                -0.01 * s + (i % 2) * 0.015,
                Math.sin(angle) * 0.06 * s,
              ]}
              rotation={[0.4, angle, 0.15]}
            >
              <boxGeometry args={[0.055 * s, 0.005, 0.03 * s]} />
              <meshStandardMaterial color={leafColor} />
            </mesh>
          ))}
        </group>
      );
    case 'root':
      return (
        <group>
          <mesh position={[0, -0.03, 0]}>
            <sphereGeometry args={[0.06 * s, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#6B4A2A" />
          </mesh>
          <mesh castShadow position={[0, -0.01, 0]}>
            <sphereGeometry args={[0.04 * s, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={color} />
          </mesh>
          {[0, 1.2, 2.4, 3.6].map((a, i) => (
            <mesh key={`rt-${i}`} position={[Math.cos(a) * 0.02, 0.03 * s, Math.sin(a) * 0.02]} rotation={[0.3, a, 0.2]}>
              <boxGeometry args={[0.04 * s, 0.005, 0.018 * s]} />
              <meshStandardMaterial color={leafColor} />
            </mesh>
          ))}
        </group>
      );
    case 'tall-stem':
      return (
        <group>
          <mesh castShadow>
            <cylinderGeometry args={[0.018 * s, 0.025 * s, 0.18 * s, 7]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh castShadow position={[0, 0.1 * s, 0]}>
            <sphereGeometry args={[0.04 * s, 8, 6]} />
            <meshStandardMaterial color={isThirsty ? '#8A9040' : '#FFD700'} />
          </mesh>
          {[0, 0.8, 1.6, 2.4, 3.2, 4.0, 4.8, 5.6].map((a, i) => (
            <mesh key={`petal-${i}`} position={[Math.cos(a) * 0.04 * s, 0.1 * s, Math.sin(a) * 0.04 * s]} rotation={[0.3, a, 0]}>
              <boxGeometry args={[0.025 * s, 0.004, 0.012 * s]} />
              <meshStandardMaterial color={isThirsty ? '#9E8E60' : '#FFA000'} />
            </mesh>
          ))}
          <mesh position={[-0.03 * s, 0.02, 0]} rotation={[0, 0, -0.5]}>
            <boxGeometry args={[0.07 * s, 0.006, 0.03 * s]} />
            <meshStandardMaterial color={leafColor} />
          </mesh>
          <mesh position={[0.03 * s, -0.02, 0.01]} rotation={[0.2, 0.3, 0.5]}>
            <boxGeometry args={[0.06 * s, 0.006, 0.025 * s]} />
            <meshStandardMaterial color={leafColor} />
          </mesh>
        </group>
      );
    default:
      return (
        <mesh castShadow>
          <sphereGeometry args={[0.05 * s, 8, 6]} />
          <meshStandardMaterial color={color} />
        </mesh>
      );
  }
}

function HarvestSparkles({ y }: { y: number }) {
  const ref = useRef<THREE.Group>(null);
  const sparkles = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => ({
      angle: (i / 6) * Math.PI * 2,
      speed: 1.5 + i * 0.3,
      dist: 0.06 + i * 0.015,
    })),
  []);

  useFrame(() => {
    if (!ref.current) return;
    const t = performance.now() * 0.001;
    ref.current.children.forEach((child, i) => {
      const sp = sparkles[i];
      if (!sp) return;
      const mesh = child as THREE.Mesh;
      mesh.position.x = Math.cos(t * sp.speed + sp.angle) * sp.dist;
      mesh.position.z = Math.sin(t * sp.speed + sp.angle) * sp.dist;
      mesh.position.y = y + Math.sin(t * 2 + i) * 0.04;
      const sc = 0.5 + Math.sin(t * 4 + i * 2) * 0.5;
      mesh.scale.setScalar(sc);
    });
  });

  return (
    <group ref={ref}>
      {sparkles.map((_, i) => (
        <mesh key={`spark-${i}`}>
          <boxGeometry args={[0.008, 0.008, 0.008]} />
          <meshBasicMaterial color={i % 2 === 0 ? '#FFD700' : '#FFF176'} />
        </mesh>
      ))}
    </group>
  );
}

function ThirstIndicator({ y }: { y: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    const t = performance.now() * 0.001;
    ref.current.position.y = y + Math.sin(t * 2) * 0.02;
    ref.current.scale.setScalar(0.9 + Math.sin(t * 3) * 0.1);
  });

  return (
    <group ref={ref} position={[0.08, y, 0]}>
      <mesh>
        <sphereGeometry args={[0.015, 6, 4]} />
        <meshStandardMaterial color="#60A5FA" transparent opacity={0.8} />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <coneGeometry args={[0.01, 0.018, 4]} />
        <meshStandardMaterial color="#60A5FA" transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

// Growth stage transition animation
function GrowthTransitionEffect({ stage }: { stage: GrowthStage }) {
  const ref = useRef<THREE.Group>(null);
  const [prevStage, setPrevStage] = useState(stage);
  const [showEffect, setShowEffect] = useState(false);
  const startTime = useRef(0);

  useEffect(() => {
    if (stage !== prevStage) {
      setShowEffect(true);
      startTime.current = performance.now() * 0.001;
      setPrevStage(stage);
      const timer = setTimeout(() => setShowEffect(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [stage, prevStage]);

  useFrame(() => {
    if (!ref.current || !showEffect) return;
    const t = performance.now() * 0.001;
    const elapsed = t - startTime.current;
    const fade = Math.max(0, 1 - elapsed / 1.5);
    ref.current.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh;
      const angle = (i / 8) * Math.PI * 2 + elapsed * 3;
      mesh.position.x = Math.cos(angle) * (0.05 + elapsed * 0.15);
      mesh.position.z = Math.sin(angle) * (0.05 + elapsed * 0.15);
      mesh.position.y = elapsed * 0.3;
      mesh.scale.setScalar(fade);
      (mesh.material as THREE.MeshBasicMaterial).opacity = fade * 0.8;
    });
  });

  if (!showEffect) return null;

  return (
    <group ref={ref} position={[0, 0.1, 0]}>
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={`growth-${i}`}>
          <boxGeometry args={[0.01, 0.01, 0.01]} />
          <meshBasicMaterial color={i % 2 === 0 ? '#86EFAC' : '#4ADE80'} transparent opacity={0.8} />
        </mesh>
      ))}
    </group>
  );
}

export function Plant3D({ plant, position, plantedDate, onSelect, onContextMenu, isSelected, isWatering }: Plant3DProps) {
  const [hovered, setHovered] = useState(false);
  const stage = getGrowthStage(plantedDate, plant.harvestDays);
  const progress = getGrowthProgress(plantedDate, plant.harvestDays);
  const isHarvest = stage === 'harvest';
  const isThirsty = needsWater(plant.wateringFrequency);
  const isMature = stage === 'mature' || stage === 'harvest';

  const stageLabel = useMemo(() => {
    switch (stage) {
      case 'seed': return 'Seed';
      case 'sprout': return 'Sprout';
      case 'growing': return 'Growing';
      case 'mature': return 'Mature';
      case 'harvest': return 'Ready!';
    }
  }, [stage]);

  const stageEmoji = useMemo(() => {
    switch (stage) {
      case 'seed': return '\u{1F330}';
      case 'sprout': return '\u{1F331}';
      case 'growing': return '\u{1F33F}';
      case 'mature': return '\u{1F33E}';
      case 'harvest': return '\u{2728}';
    }
  }, [stage]);

  const daysPlanted = useMemo(() => {
    const now = new Date();
    const planted = new Date(plantedDate);
    return Math.floor((now.getTime() - planted.getTime()) / (1000 * 60 * 60 * 24));
  }, [plantedDate]);

  // Pop-in + grow animation
  const groupRef = useRef<THREE.Group>(null);
  const popRef = useRef(0);
  const [justPlaced] = useState(() => {
    const planted = new Date(plantedDate);
    const now = new Date();
    return (now.getTime() - planted.getTime()) < 60000;
  });

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (popRef.current < 1) {
      popRef.current = Math.min(popRef.current + delta * (justPlaced ? 1.5 : 3), 1);
      const t = popRef.current;
      const eased = t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const overshoot = justPlaced ? 1 + Math.sin(t * Math.PI) * 0.15 : eased;
      groupRef.current.scale.setScalar(Math.min(overshoot, 1.15));
    } else {
      const currentScale = groupRef.current.scale.x;
      if (currentScale > 1.001) {
        groupRef.current.scale.setScalar(currentScale * 0.95 + 1 * 0.05);
      }
    }
  });

  const handleContextMenu = useCallback((e: any) => {
    e.stopPropagation();
    if (onContextMenu && e.nativeEvent) {
      onContextMenu(e.nativeEvent);
    }
  }, [onContextMenu]);

  return (
    <group ref={groupRef} position={position} scale={0}>
      <group
        onClick={(e) => { e.stopPropagation(); onSelect?.(); }}
        onContextMenu={handleContextMenu}
        onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
      >
        <PlantModel
          shape={plant.shape3d}
          color={plant.color}
          heightCm={plant.heightCm}
          stage={stage}
          isHarvest={isHarvest}
          isThirsty={isThirsty}
        />

        {/* Hover glow */}
        <HoverGlow active={hovered && !isSelected} color={plant.color} />

        {/* Selection/hover ring */}
        {(hovered || isSelected) && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
            <ringGeometry args={[0.09, 0.12, 16]} />
            <meshBasicMaterial
              color={isSelected ? '#FDE047' : '#86EFAC'}
              transparent
              opacity={0.7}
            />
          </mesh>
        )}

        {/* Growth transition particles */}
        <GrowthTransitionEffect stage={stage} />

        {/* Pollen for mature/harvest plants */}
        <PollenParticles active={isMature && !isThirsty} position={[0, 0, 0]} />

        {/* Watering effect */}
        <WateringEffect active={isWatering || false} />

        {/* Floating name label above plant (always visible, small) */}
        {stage !== 'seed' && (
          <Html
            position={[0, stage === 'sprout' ? 0.18 : 0.35, 0]}
            center
            distanceFactor={6}
            style={{ pointerEvents: 'none' }}
            zIndexRange={[0, 0]}
          >
            <div style={{
              background: 'rgba(0,0,0,0.55)',
              borderRadius: '6px',
              padding: '2px 7px',
              fontSize: '9px',
              fontFamily: '"Nunito", sans-serif',
              color: 'white',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              opacity: hovered || isSelected ? 1 : 0.7,
              transition: 'opacity 0.2s',
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: plant.color,
                display: 'inline-block',
              }} />
              {plant.name.en}
            </div>
          </Html>
        )}

        {/* Hover tooltip with stage info */}
        {hovered && !isSelected && (
          <Html position={[0, 0.45, 0]} center distanceFactor={4} style={{ pointerEvents: 'none' }}>
            <div style={{
              background: 'rgba(0,0,0,0.8)',
              borderRadius: '10px',
              padding: '6px 12px',
              fontSize: '11px',
              fontFamily: '"Nunito", sans-serif',
              color: 'white',
              whiteSpace: 'nowrap',
              border: '1px solid rgba(74, 222, 128, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: plant.color,
                  display: 'inline-block',
                  border: '1px solid rgba(255,255,255,0.3)',
                }} />
                {plant.name.en}
              </div>
              <div style={{ fontSize: '9px', color: '#9CA3AF' }}>
                {stageEmoji} {stageLabel} - Day {daysPlanted}/{plant.harvestDays}
              </div>
              {isThirsty && (
                <div style={{ fontSize: '9px', color: '#60A5FA' }}>
                  {'\u{1F4A7}'} Needs water
                </div>
              )}
            </div>
          </Html>
        )}
      </group>

      {/* Detailed info card when selected */}
      {isSelected && (
        <Html position={[0, 0.55, 0]} center distanceFactor={4} style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'linear-gradient(145deg, #0F2818, #1A3D28)',
            borderRadius: '14px',
            padding: '14px 18px',
            minWidth: '200px',
            fontSize: '12px',
            fontFamily: '"Nunito", sans-serif',
            color: 'white',
            boxShadow: '0 10px 35px rgba(0,0,0,0.45), 0 0 20px rgba(74, 222, 128, 0.1)',
            border: '2px solid #4ADE80',
            pointerEvents: 'none',
          }}>
            <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#86EFAC', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: plant.color, display: 'inline-block', border: '1px solid rgba(255,255,255,0.3)' }} />
              {plant.name.en}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ color: '#9CA3AF' }}>Stage:</span>
              <span style={{
                color: isHarvest ? '#FFD700' : '#E5E7EB',
                fontWeight: isHarvest ? 'bold' : 'normal',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}>
                {stageEmoji} {stageLabel} {isHarvest ? '!!!' : ''}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ color: '#9CA3AF' }}>Days:</span>
              <span>{daysPlanted} / {plant.harvestDays}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ color: '#9CA3AF' }}>Water:</span>
              <span style={{ color: isThirsty ? '#60A5FA' : '#9CA3AF' }}>
                {plant.wateringFrequency.replace('-', ' ')}
              </span>
            </div>
            {/* Progress bar */}
            <div style={{
              background: '#1F2937',
              borderRadius: '6px',
              height: '8px',
              marginTop: '8px',
              overflow: 'hidden',
            }}>
              <div style={{
                background: isHarvest
                  ? 'linear-gradient(90deg, #FFD700, #FFA500)'
                  : 'linear-gradient(90deg, #4ADE80, #22C55E)',
                height: '100%',
                width: `${Math.min(progress * 100, 100)}%`,
                borderRadius: '6px',
                transition: 'width 0.3s',
              }} />
            </div>
            {isThirsty && (
              <div style={{ color: '#60A5FA', fontSize: '11px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {'\u{1F4A7}'} Needs watering!
              </div>
            )}
            {isHarvest && (
              <div style={{ color: '#FFD700', fontSize: '12px', marginTop: '5px', fontWeight: 'bold', textAlign: 'center' }}>
                {'\u{1F389}'} Ready to harvest!
              </div>
            )}
            <div style={{
              fontSize: '9px',
              color: '#6B7280',
              marginTop: '8px',
              textAlign: 'center',
              borderTop: '1px solid rgba(74, 222, 128, 0.15)',
              paddingTop: '6px',
            }}>
              Right-click for actions
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
