'use client';

import { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Plant, Shape3D } from '@/types';

interface Plant3DProps {
  plant: Plant;
  position: [number, number, number];
  plantedDate: string;
  onSelect?: () => void;
  isSelected?: boolean;
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
      {/* Soil mound */}
      <mesh position={[0, 0.01, 0]}>
        <sphereGeometry args={[0.06, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#6B4423" />
      </mesh>
      {/* Seed */}
      <mesh position={[0, 0.03, 0]}>
        <sphereGeometry args={[0.018, 6, 4]} />
        <meshStandardMaterial color="#8B7355" />
      </mesh>
    </group>
  );
}

// Sprout stage rendering - with gentle emergence animation
function SproutModel({ color }: { color: string }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    const t = performance.now() * 0.001;
    // More lively sway for sprouts
    ref.current.rotation.z = Math.sin(t * 2.5) * 0.08;
    ref.current.rotation.x = Math.sin(t * 1.5 + 1) * 0.04;
  });
  return (
    <group ref={ref}>
      {/* Tiny stem */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.008, 0.012, 0.1, 5]} />
        <meshStandardMaterial color="#4CAF50" />
      </mesh>
      {/* Two tiny cotyledon leaves */}
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

  const baseHeight = Math.min((heightCm / 100) * 0.6, 0.8);
  const s = stageScale;

  useFrame(() => {
    if (!meshRef.current) return;
    const t = performance.now() * 0.001;
    const px = meshRef.current.position.x || 0;

    // Thirsty droop
    if (isThirsty && stage !== 'seed') {
      meshRef.current.rotation.z = Math.sin(t * 0.5) * 0.08 + 0.12;
      meshRef.current.rotation.x = 0.08;
    } else {
      // Wind sway - multi-layered for organic feel
      const windBase = Math.sin(t * 1.2 + px * 8) * 0.04;
      const windGust = Math.sin(t * 0.3 + px * 3) * Math.sin(t * 2.5) * 0.02;
      meshRef.current.rotation.z = windBase + windGust;
      meshRef.current.rotation.x = Math.sin(t * 0.8 + px * 5 + 1) * 0.025 + Math.sin(t * 0.2) * 0.01;
    }

    // Harvest glow pulsing
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
  return (
    <>
      <mesh position={[-0.04 * scale, y, 0]} rotation={[offset, 0, -0.6]}>
        <boxGeometry args={[0.06 * scale, 0.006, 0.03 * scale]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0.04 * scale, y, 0.01]} rotation={[offset + 0.3, 0.5, 0.6]}>
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
          {/* Little stem nub on top */}
          <mesh position={[0, 0.06 * s, 0]}>
            <cylinderGeometry args={[0.005, 0.008, 0.02 * s, 4]} />
            <meshStandardMaterial color={stemColor} />
          </mesh>
        </group>
      );
    case 'cone':
      return (
        <group>
          {/* Carrot/root sticking up from ground */}
          <mesh castShadow rotation={[Math.PI, 0, 0]} position={[0, -0.03 * s, 0]}>
            <coneGeometry args={[0.04 * s, 0.14 * s, 7]} />
            <meshStandardMaterial color={color} />
          </mesh>
          {/* Leafy carrot top */}
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
          {/* Top leaves for corn/leek look */}
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
          {/* Small bump on top */}
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
          {/* Calyx at top */}
          <mesh position={[0, 0.055 * s, 0]}>
            <coneGeometry args={[0.02 * s, 0.02 * s, 5]} />
            <meshStandardMaterial color={stemColor} />
          </mesh>
        </group>
      );
    case 'bush':
      return (
        <group>
          {/* Multi-sphere bushy shape */}
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
        </group>
      );
    case 'vine':
      return (
        <group>
          {/* Vine support stick */}
          <mesh position={[0, 0.02 * s, 0]}>
            <cylinderGeometry args={[0.005, 0.005, 0.2 * s, 4]} />
            <meshStandardMaterial color="#8B6914" />
          </mesh>
          {/* Winding vine */}
          <mesh castShadow position={[0.01 * s, 0, 0]}>
            <cylinderGeometry args={[0.008 * s, 0.012 * s, 0.16 * s, 6]} />
            <meshStandardMaterial color={stemColor} />
          </mesh>
          {/* Pods/fruits */}
          <mesh castShadow position={[0.03 * s, 0.04 * s, 0]}>
            <sphereGeometry args={[0.025 * s, 6, 5]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh castShadow position={[-0.02 * s, -0.02 * s, 0.01 * s]}>
            <sphereGeometry args={[0.02 * s, 6, 5]} />
            <meshStandardMaterial color={color} />
          </mesh>
          {/* Vine leaves */}
          <mesh position={[0.02 * s, 0.06 * s, 0.01]} rotation={[0.2, 0.5, 0.3]}>
            <boxGeometry args={[0.04 * s, 0.005, 0.03 * s]} />
            <meshStandardMaterial color={leafColor} />
          </mesh>
        </group>
      );
    case 'leafy':
      return (
        <group>
          {/* Central rosette */}
          <mesh castShadow>
            <sphereGeometry args={[0.05 * s, 8, 6]} />
            <meshStandardMaterial color={color} />
          </mesh>
          {/* Radiating leaves */}
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
          {/* Soil mound */}
          <mesh position={[0, -0.03, 0]}>
            <sphereGeometry args={[0.06 * s, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#6B4A2A" />
          </mesh>
          {/* Root peeking out */}
          <mesh castShadow position={[0, -0.01, 0]}>
            <sphereGeometry args={[0.04 * s, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={color} />
          </mesh>
          {/* Leafy top */}
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
          {/* Tall thick stem */}
          <mesh castShadow>
            <cylinderGeometry args={[0.018 * s, 0.025 * s, 0.18 * s, 7]} />
            <meshStandardMaterial color={color} />
          </mesh>
          {/* Big leaf/head at top */}
          <mesh castShadow position={[0, 0.1 * s, 0]}>
            <sphereGeometry args={[0.04 * s, 8, 6]} />
            <meshStandardMaterial color={isThirsty ? '#8A9040' : '#FFD700'} />
          </mesh>
          {/* Surrounding petals for sunflower look */}
          {[0, 0.8, 1.6, 2.4, 3.2, 4.0, 4.8, 5.6].map((a, i) => (
            <mesh key={`petal-${i}`} position={[Math.cos(a) * 0.04 * s, 0.1 * s, Math.sin(a) * 0.04 * s]} rotation={[0.3, a, 0]}>
              <boxGeometry args={[0.025 * s, 0.004, 0.012 * s]} />
              <meshStandardMaterial color={isThirsty ? '#9E8E60' : '#FFA000'} />
            </mesh>
          ))}
          {/* Large leaves on stem */}
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
    // Gentle bounce
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

export function Plant3D({ plant, position, plantedDate, onSelect, isSelected }: Plant3DProps) {
  const [hovered, setHovered] = useState(false);
  const stage = getGrowthStage(plantedDate, plant.harvestDays);
  const progress = getGrowthProgress(plantedDate, plant.harvestDays);
  const isHarvest = stage === 'harvest';
  const isThirsty = needsWater(plant.wateringFrequency);

  const stageLabel = useMemo(() => {
    switch (stage) {
      case 'seed': return 'Seed';
      case 'sprout': return 'Sprout';
      case 'growing': return 'Growing';
      case 'mature': return 'Mature';
      case 'harvest': return 'Ready!';
    }
  }, [stage]);

  // Stage emoji for visual flair
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
    return (now.getTime() - planted.getTime()) < 60000; // planted within last minute
  });

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (popRef.current < 1) {
      // Bouncy spring-like pop-in
      popRef.current = Math.min(popRef.current + delta * (justPlaced ? 1.5 : 3), 1);
      const t = popRef.current;
      const eased = t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const overshoot = justPlaced ? 1 + Math.sin(t * Math.PI) * 0.15 : eased;
      groupRef.current.scale.setScalar(Math.min(overshoot, 1.15));
    } else {
      // Settle to 1
      const currentScale = groupRef.current.scale.x;
      if (currentScale > 1.001) {
        groupRef.current.scale.setScalar(currentScale * 0.95 + 1 * 0.05);
      }
    }
  });

  return (
    <group ref={groupRef} position={position} scale={0}>
      <group
        onClick={(e) => { e.stopPropagation(); onSelect?.(); }}
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

        {/* Name tag on hover (not selected) */}
        {hovered && !isSelected && (
          <Html position={[0, 0.3, 0]} center distanceFactor={4} style={{ pointerEvents: 'none' }}>
            <div style={{
              background: 'rgba(0,0,0,0.75)',
              borderRadius: '8px',
              padding: '4px 10px',
              fontSize: '11px',
              fontFamily: '"Nunito", sans-serif',
              color: 'white',
              whiteSpace: 'nowrap',
              border: '1px solid rgba(74, 222, 128, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: plant.color,
                display: 'inline-block',
                border: '1px solid rgba(255,255,255,0.3)',
              }} />
              {plant.name.en}
              <span style={{ fontSize: '9px', color: '#9CA3AF' }}>{stageEmoji}</span>
            </div>
          </Html>
        )}
      </group>

      {/* Detailed info card */}
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
          </div>
        </Html>
      )}
    </group>
  );
}
