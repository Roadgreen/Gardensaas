'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createWaterTexture, createWoodTexture, createStoneTexture, createAOGroundTexture, getCachedTexture } from './procedural-textures';

interface GardenDecorationsProps {
  gardenLength: number;
  gardenWidth: number;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
}

// Watering can
function WateringCan({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} rotation={[0, 0.4, 0]}>
      <mesh position={[0, 0.06, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 0.12, 8]} />
        <meshStandardMaterial color="#5B8C5A" metalness={0.3} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.14, -0.02]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.04, 0.008, 4, 8, Math.PI]} />
        <meshStandardMaterial color="#4A7A49" metalness={0.4} />
      </mesh>
      <mesh position={[0.08, 0.1, 0]} rotation={[0, 0, -0.6]} castShadow>
        <cylinderGeometry args={[0.015, 0.01, 0.1, 6]} />
        <meshStandardMaterial color="#5B8C5A" metalness={0.3} />
      </mesh>
      <mesh position={[0.12, 0.14, 0]} rotation={[0, 0, -0.6]}>
        <sphereGeometry args={[0.02, 6, 4]} />
        <meshStandardMaterial color="#4A7A49" metalness={0.4} />
      </mesh>
    </group>
  );
}

// Wheelbarrow
function Wheelbarrow({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} rotation={[0, -0.8, 0]}>
      <mesh position={[0, 0.1, 0]} castShadow>
        <boxGeometry args={[0.2, 0.1, 0.12]} />
        <meshStandardMaterial color="#8B7355" />
      </mesh>
      <mesh position={[0.12, 0.04, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.02, 8]} />
        <meshStandardMaterial color="#5D4037" />
      </mesh>
      <mesh position={[-0.12, 0.1, 0.05]} rotation={[0, 0, 0.2]} castShadow>
        <boxGeometry args={[0.15, 0.02, 0.02]} />
        <meshStandardMaterial color="#A0845C" />
      </mesh>
      <mesh position={[-0.12, 0.1, -0.05]} rotation={[0, 0, 0.2]} castShadow>
        <boxGeometry args={[0.15, 0.02, 0.02]} />
        <meshStandardMaterial color="#A0845C" />
      </mesh>
      <mesh position={[-0.04, 0.04, 0.06]}>
        <boxGeometry args={[0.015, 0.08, 0.015]} />
        <meshStandardMaterial color="#777" metalness={0.3} />
      </mesh>
      <mesh position={[-0.04, 0.04, -0.06]}>
        <boxGeometry args={[0.015, 0.08, 0.015]} />
        <meshStandardMaterial color="#777" metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.14, 0]}>
        <boxGeometry args={[0.16, 0.04, 0.08]} />
        <meshStandardMaterial color="#5C3D1E" />
      </mesh>
    </group>
  );
}

// Bird
function Bird({ startPosition, speed }: { startPosition: [number, number, number]; speed: number }) {
  const birdRef = useRef<THREE.Group>(null);
  const wingLeftRef = useRef<THREE.Mesh>(null);
  const wingRightRef = useRef<THREE.Mesh>(null);
  const isGrounded = useRef(Math.random() > 0.5);
  const groundTimer = useRef(Math.random() * 5);

  const bodyColor = useMemo(() => {
    const colors = ['#8B4513', '#D2691E', '#A0522D', '#555555', '#4169E1'];
    return colors[Math.floor(Math.random() * colors.length)];
  }, []);

  useFrame((_, delta) => {
    if (!birdRef.current) return;
    const t = performance.now() * 0.001;

    groundTimer.current -= delta;

    if (isGrounded.current) {
      birdRef.current.position.y = startPosition[1];
      birdRef.current.rotation.x = Math.sin(t * 3) * 0.2;
      if (Math.sin(t * 2) > 0.9) {
        birdRef.current.position.y = startPosition[1] + 0.03;
      }
      if (groundTimer.current < 0) {
        isGrounded.current = false;
        groundTimer.current = 3 + Math.random() * 5;
      }
    } else {
      birdRef.current.position.x = startPosition[0] + Math.sin(t * speed * 0.3) * 2;
      birdRef.current.position.z = startPosition[2] + Math.cos(t * speed * 0.2) * 1.5;
      birdRef.current.position.y = startPosition[1] + 1 + Math.sin(t * 0.5) * 0.3;
      birdRef.current.rotation.y = t * speed * 0.3;

      if (wingLeftRef.current) wingLeftRef.current.rotation.z = Math.sin(t * 12) * 0.5 - 0.3;
      if (wingRightRef.current) wingRightRef.current.rotation.z = -Math.sin(t * 12) * 0.5 + 0.3;

      if (groundTimer.current < 0) {
        isGrounded.current = true;
        groundTimer.current = 2 + Math.random() * 4;
      }
    }
  });

  return (
    <group ref={birdRef} position={startPosition}>
      <mesh castShadow>
        <sphereGeometry args={[0.025, 6, 4]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>
      <mesh position={[0, 0.015, 0.02]}>
        <sphereGeometry args={[0.015, 6, 4]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>
      <mesh position={[0, 0.012, 0.035]} rotation={[-0.3, 0, 0]}>
        <coneGeometry args={[0.005, 0.015, 4]} />
        <meshStandardMaterial color="#FFA000" />
      </mesh>
      <mesh position={[0.008, 0.02, 0.03]}>
        <sphereGeometry args={[0.003, 4, 3]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh ref={wingLeftRef} position={[-0.025, 0.005, 0]}>
        <boxGeometry args={[0.03, 0.004, 0.02]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>
      <mesh ref={wingRightRef} position={[0.025, 0.005, 0]}>
        <boxGeometry args={[0.03, 0.004, 0.02]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>
      <mesh position={[0, 0.005, -0.03]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.01, 0.004, 0.02]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>
    </group>
  );
}

// Butterfly with flapping wings
function Butterfly({ startPosition, speed }: { startPosition: [number, number, number]; speed: number }) {
  const butterflyRef = useRef<THREE.Group>(null);
  const wingColor = useMemo(() => {
    const colors = ['#FF69B4', '#DDA0DD', '#FFD700', '#87CEEB', '#FFA07A', '#FF6347'];
    return colors[Math.floor(Math.random() * colors.length)];
  }, []);

  useFrame(() => {
    if (!butterflyRef.current) return;
    const t = performance.now() * 0.001;
    butterflyRef.current.position.x = startPosition[0] + Math.sin(t * speed * 0.5) * 1.5;
    butterflyRef.current.position.z = startPosition[2] + Math.cos(t * speed * 0.3) * 1;
    butterflyRef.current.position.y = startPosition[1] + 0.3 + Math.sin(t * 2) * 0.15;
    butterflyRef.current.rotation.y = t * speed * 0.5 + Math.PI / 2;
  });

  return (
    <group ref={butterflyRef} position={startPosition}>
      <mesh>
        <capsuleGeometry args={[0.004, 0.02, 3, 4]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <ButterflyWing position={[-0.015, 0.003, 0]} color={wingColor} side="left" />
      <ButterflyWing position={[0.015, 0.003, 0]} color={wingColor} side="right" />
      <mesh position={[-0.005, 0.012, 0.005]} rotation={[0.5, 0, -0.3]}>
        <cylinderGeometry args={[0.001, 0.001, 0.015, 3]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[0.005, 0.012, 0.005]} rotation={[0.5, 0, 0.3]}>
        <cylinderGeometry args={[0.001, 0.001, 0.015, 3]} />
        <meshStandardMaterial color="#333" />
      </mesh>
    </group>
  );
}

function ButterflyWing({ position, color, side }: { position: [number, number, number]; color: string; side: 'left' | 'right' }) {
  const wingRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!wingRef.current) return;
    const t = performance.now() * 0.001;
    const flutter = Math.sin(t * 15) * 0.8;
    wingRef.current.rotation.z = side === 'left' ? -flutter - 0.2 : flutter + 0.2;
  });

  return (
    <mesh ref={wingRef} position={position}>
      <boxGeometry args={[0.02, 0.001, 0.015]} />
      <meshStandardMaterial color={color} transparent opacity={0.8} side={THREE.DoubleSide} />
    </mesh>
  );
}

// Bee
function Bee({ startPosition, speed }: { startPosition: [number, number, number]; speed: number }) {
  const beeRef = useRef<THREE.Group>(null);
  const wingRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!beeRef.current) return;
    const t = performance.now() * 0.001;
    // Erratic bee-like path
    beeRef.current.position.x = startPosition[0] + Math.sin(t * speed * 0.7) * 0.8 + Math.sin(t * speed * 1.5) * 0.3;
    beeRef.current.position.z = startPosition[2] + Math.cos(t * speed * 0.5) * 0.6;
    beeRef.current.position.y = startPosition[1] + 0.25 + Math.sin(t * 3) * 0.08;
    beeRef.current.rotation.y = t * speed * 0.7;

    if (wingRef.current) {
      wingRef.current.children.forEach((w, i) => {
        (w as THREE.Mesh).rotation.z = Math.sin(t * 30) * 0.4 * (i === 0 ? -1 : 1);
      });
    }
  });

  return (
    <group ref={beeRef} position={startPosition}>
      {/* Body */}
      <mesh>
        <capsuleGeometry args={[0.008, 0.015, 3, 4]} />
        <meshStandardMaterial color="#F5C518" />
      </mesh>
      {/* Stripes */}
      <mesh position={[0, 0, 0.003]}>
        <boxGeometry args={[0.018, 0.005, 0.005]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0, 0, -0.005]}>
        <boxGeometry args={[0.018, 0.005, 0.005]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Wings */}
      <group ref={wingRef}>
        <mesh position={[-0.01, 0.008, 0]}>
          <boxGeometry args={[0.012, 0.001, 0.01]} />
          <meshStandardMaterial color="#FFFFFF" transparent opacity={0.5} />
        </mesh>
        <mesh position={[0.01, 0.008, 0]}>
          <boxGeometry args={[0.012, 0.001, 0.01]} />
          <meshStandardMaterial color="#FFFFFF" transparent opacity={0.5} />
        </mesh>
      </group>
    </group>
  );
}

// Garden sign
function GardenSign({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} rotation={[0, 0.3, 0]}>
      <mesh position={[0, 0.15, 0]} castShadow>
        <boxGeometry args={[0.04, 0.3, 0.03]} />
        <meshStandardMaterial color="#8B6914" />
      </mesh>
      <mesh position={[0, 0.28, 0.02]} castShadow>
        <boxGeometry args={[0.22, 0.12, 0.015]} />
        <meshStandardMaterial color="#D4A050" />
      </mesh>
      {/* Little heart carved in sign */}
      <mesh position={[0, 0.28, 0.03]}>
        <sphereGeometry args={[0.015, 6, 4]} />
        <meshStandardMaterial color="#E11D48" />
      </mesh>
    </group>
  );
}

// Decorative tree
function SmallTree({ position, season }: { position: [number, number, number]; season: string }) {
  const leafColor = useMemo(() => {
    switch (season) {
      case 'spring': return '#78D068';
      case 'summer': return '#38A038';
      case 'autumn': return '#E07020';
      case 'winter': return '#98B0B8';
      default: return '#58C050';
    }
  }, [season]);

  // Darker leaf color for depth and shading
  const leafDark = useMemo(() => {
    switch (season) {
      case 'spring': return '#58B848';
      case 'summer': return '#207020';
      case 'autumn': return '#C85010';
      case 'winter': return '#808EA0';
      default: return '#409838';
    }
  }, [season]);

  const [aoTex, setAoTex] = useState<THREE.CanvasTexture | null>(null);
  const [woodTex, setWoodTex] = useState<THREE.CanvasTexture | null>(null);
  useEffect(() => {
    setAoTex(getCachedTexture('ao-ground', () => createAOGroundTexture()));
    setWoodTex(getCachedTexture('wood', () => createWoodTexture()));
  }, []);

  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    const t = performance.now() * 0.001;
    ref.current.rotation.z = Math.sin(t * 0.5 + position[0] * 3) * 0.015;
  });

  return (
    <group ref={ref} position={position}>
      {/* Trunk with wood texture -- slightly tapered */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.055, 0.3, 6]} />
        <meshStandardMaterial color="#806050" map={woodTex} roughness={0.88} />
      </mesh>
      {/* Tree crown -- rounded sphere clusters for Animal Crossing / cartoon style */}
      <mesh position={[0, 0.42, 0]} castShadow>
        <sphereGeometry args={[0.2, 8, 6]} />
        <meshStandardMaterial color={leafColor} roughness={0.82} />
      </mesh>
      <mesh position={[0.1, 0.38, 0.08]} castShadow>
        <sphereGeometry args={[0.15, 7, 5]} />
        <meshStandardMaterial color={leafDark} roughness={0.82} />
      </mesh>
      <mesh position={[-0.08, 0.4, -0.06]} castShadow>
        <sphereGeometry args={[0.14, 7, 5]} />
        <meshStandardMaterial color={leafDark} roughness={0.82} />
      </mesh>
      <mesh position={[0, 0.55, 0]} castShadow>
        <sphereGeometry args={[0.14, 7, 5]} />
        <meshStandardMaterial color={leafColor} roughness={0.82} />
      </mesh>
      <mesh position={[0.06, 0.5, 0.05]} castShadow>
        <sphereGeometry args={[0.1, 6, 5]} />
        <meshStandardMaterial color={leafDark} roughness={0.82} />
      </mesh>
      {season === 'winter' && (
        <>
          {/* Snow caps on top of rounded crown */}
          <mesh position={[0, 0.58, 0]}>
            <sphereGeometry args={[0.12, 7, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#F5F5F5" transparent opacity={0.65} />
          </mesh>
          <mesh position={[0.08, 0.48, 0.06]}>
            <sphereGeometry args={[0.08, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#F0F0F0" transparent opacity={0.55} />
          </mesh>
        </>
      )}
      {season === 'spring' && (
        <>
          {/* Cherry blossom spots scattered on crown */}
          {[
            [0.18, 0.42, 0.06],
            [-0.12, 0.5, 0.1],
            [0.05, 0.58, -0.1],
            [-0.08, 0.38, -0.12],
          ].map((pos, i) => (
            <mesh key={`blossom-${i}`} position={pos as [number, number, number]}>
              <sphereGeometry args={[0.018 + i * 0.002, 5, 4]} />
              <meshStandardMaterial color={i % 2 === 0 ? '#FFB8D8' : '#FFC8E0'} />
            </mesh>
          ))}
        </>
      )}
      {/* Shadow blob with AO texture */}
      <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.5, 0.5]} />
        <meshBasicMaterial
          map={aoTex}
          transparent
          opacity={0.35}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// Mushroom
function Mushroom({ position }: { position: [number, number, number] }) {
  const capColor = useMemo(() => {
    const colors = ['#E53935', '#F4511E', '#8D6E63', '#FFB300'];
    return colors[Math.floor(Math.random() * colors.length)];
  }, []);

  return (
    <group position={position}>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.01, 0.012, 0.04, 6]} />
        <meshStandardMaterial color="#FFF8E1" />
      </mesh>
      <mesh position={[0, 0.04, 0]}>
        <sphereGeometry args={[0.02, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={capColor} />
      </mesh>
      <mesh position={[0.01, 0.048, 0.005]}>
        <sphereGeometry args={[0.004, 4, 3]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[-0.005, 0.05, -0.01]}>
        <sphereGeometry args={[0.003, 4, 3]} />
        <meshStandardMaterial color="white" />
      </mesh>
    </group>
  );
}

// Flower pot
function FlowerPot({ position, season }: { position: [number, number, number]; season: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.04, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.04, 0.08, 8]} />
        <meshStandardMaterial color="#C0664F" />
      </mesh>
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.055, 0.05, 0.015, 8]} />
        <meshStandardMaterial color="#B05A45" />
      </mesh>
      <mesh position={[0, 0.075, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.01, 8]} />
        <meshStandardMaterial color="#5C3D1E" />
      </mesh>
      <mesh position={[0, 0.12, 0]}>
        <sphereGeometry args={[0.022, 6, 4]} />
        <meshStandardMaterial color={season === 'winter' ? '#E8E8E8' : '#FF69B4'} />
      </mesh>
      <mesh position={[0, 0.095, 0]}>
        <cylinderGeometry args={[0.004, 0.004, 0.04, 4]} />
        <meshStandardMaterial color="#4CAF50" />
      </mesh>
    </group>
  );
}

// Water droplets effect
function WaterDroplets({ position, active }: { position: [number, number, number]; active: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const drops = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      x: (Math.random() - 0.5) * 0.3,
      z: (Math.random() - 0.5) * 0.3,
      speed: 1 + Math.random() * 2,
      offset: Math.random() * Math.PI * 2,
    })),
  []);

  useFrame(() => {
    if (!ref.current || !active) return;
    const t = performance.now() * 0.001;
    ref.current.children.forEach((child, i) => {
      const d = drops[i];
      const mesh = child as THREE.Mesh;
      const phase = (t * d.speed + d.offset) % 1;
      mesh.position.y = 0.6 - phase * 0.6;
      mesh.visible = active;
      const fade = phase < 0.8 ? 1 : (1 - phase) / 0.2;
      (mesh.material as THREE.MeshBasicMaterial).opacity = fade * 0.6;
    });
  });

  if (!active) return null;

  return (
    <group ref={ref} position={position}>
      {drops.map((d, i) => (
        <mesh key={`drop-${i}`} position={[d.x, 0.5, d.z]}>
          <sphereGeometry args={[0.008, 4, 3]} />
          <meshBasicMaterial color="#93C5FD" transparent opacity={0.6} />
        </mesh>
      ))}
    </group>
  );
}

// Floating pollen / dust motes -- more abundant and dreamy
function AmbientParticles({ gardenLength, gardenWidth, season }: { gardenLength: number; gardenWidth: number; season: string }) {
  const ref = useRef<THREE.Group>(null);
  const isEvening = new Date().getHours() >= 18;
  const count = season === 'winter' ? 12 : season === 'spring' ? 28 : 22;

  const particles = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      x: (Math.random() - 0.5) * (gardenLength + 6),
      z: (Math.random() - 0.5) * (gardenWidth + 6),
      y: 0.15 + Math.random() * 1.8,
      speed: 0.12 + Math.random() * 0.3,
      driftX: 0.08 + Math.random() * 0.2,
      driftZ: 0.06 + Math.random() * 0.15,
      offset: Math.random() * Math.PI * 2,
      size: 0.006 + Math.random() * 0.01,
    })),
  [gardenLength, gardenWidth, count]);

  useFrame(() => {
    if (!ref.current) return;
    const t = performance.now() * 0.001;
    ref.current.children.forEach((child, i) => {
      const p = particles[i];
      if (!p) return;
      const mesh = child as THREE.Mesh;
      // Gentle floating with lazy drift
      mesh.position.y = p.y + Math.sin(t * p.speed + p.offset) * 0.2;
      mesh.position.x = p.x + Math.sin(t * p.driftX + p.offset) * 0.8;
      mesh.position.z = p.z + Math.cos(t * p.driftZ + p.offset * 1.3) * 0.5;
      const pulse = (Math.sin(t * 1.5 + p.offset) + 1) / 2;
      (mesh.material as THREE.MeshBasicMaterial).opacity = 0.25 + pulse * 0.55;
      mesh.scale.setScalar(0.8 + pulse * 0.4);
    });
  });

  const color = isEvening ? '#FFFF90' : season === 'winter' ? '#E0E8FF' : season === 'spring' ? '#FFE8A0' : '#FFE088';

  return (
    <group ref={ref}>
      {particles.map((p, i) => (
        <mesh key={`ambient-${i}`} position={[p.x, p.y, p.z]}>
          <sphereGeometry args={[p.size, 5, 4]} />
          <meshBasicMaterial color={color} transparent opacity={0.45} />
        </mesh>
      ))}
    </group>
  );
}

// Decorative pond with animated water surface and lily pads
function GardenPond({ position, season }: { position: [number, number, number]; season: string }) {
  const waterRef = useRef<THREE.Mesh>(null);
  const rippleRef = useRef<THREE.Group>(null);
  const [waterTex, setWaterTex] = useState<THREE.CanvasTexture | null>(null);
  const [stoneTex, setStoneTex] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    setWaterTex(getCachedTexture('water', () => createWaterTexture()));
    setStoneTex(getCachedTexture('stone', () => createStoneTexture()));
  }, []);

  useFrame(() => {
    if (!waterRef.current) return;
    const t = performance.now() * 0.001;
    // Subtle water surface undulation
    (waterRef.current.material as THREE.MeshStandardMaterial).opacity = 0.65 + Math.sin(t * 1.5) * 0.05;
    waterRef.current.position.y = position[1] + 0.005 + Math.sin(t * 0.8) * 0.003;

    // Animate UV offset for water movement
    if (waterTex) {
      waterTex.offset.x = Math.sin(t * 0.15) * 0.05;
      waterTex.offset.y = Math.cos(t * 0.12) * 0.05;
    }

    // Animate ripples
    if (rippleRef.current) {
      rippleRef.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        const phase = ((t * 0.5 + i * 1.2) % 3) / 3;
        mesh.scale.setScalar(0.3 + phase * 1.2);
        (mesh.material as THREE.MeshBasicMaterial).opacity = (1 - phase) * 0.25;
      });
    }
  });

  const waterColor = season === 'winter' ? '#A8C0D8' : season === 'autumn' ? '#58A0A0' : '#50B8D0';
  const waterDeep = season === 'winter' ? '#8098B0' : season === 'autumn' ? '#406868' : '#3890A0';

  return (
    <group position={position}>
      {/* Pond basin / deeper layer for depth illusion */}
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[0.46, 16]} />
        <meshStandardMaterial color="#3A4858" roughness={0.95} />
      </mesh>
      {/* Dark underwater depth layer */}
      <mesh position={[0, -0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.4, 16]} />
        <meshStandardMaterial color={waterDeep} transparent opacity={0.85} roughness={0.3} />
      </mesh>
      {/* Stone border -- more varied and rounded */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const size = 0.035 + (i % 3) * 0.012;
        return (
          <mesh key={`ps-${i}`} position={[Math.cos(angle) * 0.43, 0.015, Math.sin(angle) * 0.43]} castShadow>
            <sphereGeometry args={[size, 6, 5]} />
            <meshStandardMaterial color={i % 3 === 0 ? '#A0A098' : i % 3 === 1 ? '#C0BDB0' : '#908880'} map={stoneTex} roughness={0.88} />
          </mesh>
        );
      })}
      {/* Water surface -- more translucent and reflective */}
      <mesh ref={waterRef} position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.39, 16]} />
        <meshStandardMaterial
          color={waterColor}
          map={waterTex}
          transparent
          opacity={0.75}
          metalness={0.4}
          roughness={0.05}
        />
      </mesh>
      {/* Multiple highlight shimmers for sparkle effect */}
      <mesh position={[0.1, 0.016, -0.06]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.06, 6]} />
        <meshBasicMaterial color="#FFFFFF" transparent opacity={0.18} />
      </mesh>
      <mesh position={[-0.08, 0.016, 0.04]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.04, 5]} />
        <meshBasicMaterial color="#FFFFFF" transparent opacity={0.12} />
      </mesh>
      {/* Ripple rings */}
      <group ref={rippleRef} position={[0, 0.017, 0]}>
        {[0, 1, 2].map((i) => (
          <mesh key={`ripple-${i}`} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.1, 0.12, 16]} />
            <meshBasicMaterial color={waterColor} transparent opacity={0.18} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>
      {/* Lily pads (not in winter) */}
      {season !== 'winter' && (
        <>
          <LilyPad position={[-0.15, 0.018, 0.1]} scale={0.06} rotation={0.3} />
          <LilyPad position={[0.12, 0.018, -0.08]} scale={0.05} rotation={1.2} />
          <LilyPad position={[0.0, 0.018, -0.18]} scale={0.04} rotation={2.5} />
        </>
      )}
      {/* Tiny fish splash (occasional) */}
      {season !== 'winter' && <FishSplash position={[0, 0.02, 0]} />}
    </group>
  );
}

function LilyPad({ position, scale, rotation }: { position: [number, number, number]; scale: number; rotation: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    const t = performance.now() * 0.001;
    ref.current.position.y = position[1] + Math.sin(t * 0.6 + rotation * 2) * 0.002;
    ref.current.rotation.z = Math.sin(t * 0.3 + rotation) * 0.03;
  });

  return (
    <group ref={ref} position={position} rotation={[0, rotation, 0]}>
      {/* Pad */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[scale, 8, 0, Math.PI * 1.7]} />
        <meshStandardMaterial color="#2E7D32" side={THREE.DoubleSide} />
      </mesh>
      {/* Flower on one pad */}
      {scale > 0.05 && (
        <group position={[0, 0.01, 0]}>
          {[0, 1.2, 2.4, 3.6, 4.8].map((a, i) => (
            <mesh key={`petal-${i}`} position={[Math.cos(a) * scale * 0.4, 0, Math.sin(a) * scale * 0.4]} rotation={[-Math.PI / 2 + 0.3, 0, a]}>
              <boxGeometry args={[scale * 0.4, 0.003, scale * 0.25]} />
              <meshStandardMaterial color="#FFB7D5" side={THREE.DoubleSide} />
            </mesh>
          ))}
          <mesh position={[0, 0.005, 0]}>
            <sphereGeometry args={[scale * 0.15, 5, 4]} />
            <meshStandardMaterial color="#FFEB3B" />
          </mesh>
        </group>
      )}
    </group>
  );
}

function FishSplash({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    const t = performance.now() * 0.001;
    // Fish jumps every ~8 seconds for a brief moment
    const cycle = t % 8;
    const isJumping = cycle > 7.2 && cycle < 7.8;
    ref.current.visible = isJumping;
    if (isJumping) {
      const jumpPhase = (cycle - 7.2) / 0.6;
      const arc = Math.sin(jumpPhase * Math.PI);
      ref.current.position.x = position[0] + (Math.sin(t * 0.3) * 0.15);
      ref.current.position.y = position[1] + arc * 0.08;
      ref.current.position.z = position[2] + (Math.cos(t * 0.3) * 0.1);
      ref.current.rotation.z = jumpPhase * Math.PI * 0.5 - Math.PI * 0.25;
    }
  });

  return (
    <group ref={ref} visible={false}>
      {/* Tiny fish body */}
      <mesh>
        <capsuleGeometry args={[0.006, 0.015, 3, 4]} />
        <meshStandardMaterial color="#FF8C00" metalness={0.3} />
      </mesh>
      {/* Tail */}
      <mesh position={[-0.015, 0, 0]} rotation={[0, 0, 0.3]}>
        <boxGeometry args={[0.01, 0.002, 0.008]} />
        <meshStandardMaterial color="#FF6600" />
      </mesh>
      {/* Splash droplets around */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={`splash-${i}`} position={[Math.cos(i * 1.5) * 0.02, -0.01, Math.sin(i * 1.5) * 0.02]}>
          <sphereGeometry args={[0.004, 3, 2]} />
          <meshBasicMaterial color="#87CEEB" transparent opacity={0.6} />
        </mesh>
      ))}
    </group>
  );
}

export function GardenDecorations({ gardenLength, gardenWidth, season }: GardenDecorationsProps) {
  const halfL = gardenLength / 2;
  const halfW = gardenWidth / 2;

  const birdPositions = useMemo(() => {
    return Array.from({ length: 3 }, (_, i) => ({
      pos: [
        Math.sin(i * 2.1) * 0.5 * gardenLength,
        0.03,
        Math.cos(i * 3.7) * 0.5 * gardenWidth,
      ] as [number, number, number],
      speed: 0.4 + i * 0.2,
    }));
  }, [gardenLength, gardenWidth]);

  const butterflyPositions = useMemo(() => {
    if (season === 'winter') return [];
    return Array.from({ length: season === 'spring' ? 5 : 3 }, (_, i) => ({
      pos: [
        Math.sin(i * 1.7 + 0.5) * 0.4 * gardenLength,
        0.2,
        Math.cos(i * 2.3 + 1) * 0.4 * gardenWidth,
      ] as [number, number, number],
      speed: 0.5 + i * 0.15,
    }));
  }, [gardenLength, gardenWidth, season]);

  const beePositions = useMemo(() => {
    if (season === 'winter') return [];
    return Array.from({ length: season === 'summer' ? 4 : 2 }, (_, i) => ({
      pos: [
        Math.sin(i * 2.5 + 3) * 0.3 * gardenLength,
        0.15,
        Math.cos(i * 1.8 + 2) * 0.3 * gardenWidth,
      ] as [number, number, number],
      speed: 0.6 + i * 0.2,
    }));
  }, [gardenLength, gardenWidth, season]);

  const mushroomPositions = useMemo(() => {
    if (season === 'winter') return [];
    return Array.from({ length: 4 }, (_, i) => [
      halfL + 0.5 + Math.sin(i * 3) * 0.5,
      0,
      -halfW + i * (gardenWidth / 3) - 0.3,
    ] as [number, number, number]);
  }, [halfL, halfW, gardenWidth, season]);

  return (
    <group>
      {/* Watering can */}
      <WateringCan position={[halfL + 0.5, 0, halfW - 0.3]} />

      {/* Wheelbarrow */}
      <Wheelbarrow position={[-halfL - 0.7, 0, -halfW + 0.5]} />

      {/* Garden sign */}
      <GardenSign position={[0, 0, halfW + 0.7]} />

      {/* Trees */}
      <SmallTree position={[halfL + 1.4, 0, halfW + 1]} season={season} />
      <SmallTree position={[-halfL - 1.2, 0, -halfW - 0.8]} season={season} />
      <SmallTree position={[halfL + 1, 0, -halfW - 1.2]} season={season} />
      <SmallTree position={[-halfL - 1.5, 0, halfW + 0.6]} season={season} />

      {/* Birds */}
      {birdPositions.map((bird, i) => (
        <Bird key={`bird-${i}`} startPosition={bird.pos} speed={bird.speed} />
      ))}

      {/* Butterflies */}
      {butterflyPositions.map((bf, i) => (
        <Butterfly key={`bf-${i}`} startPosition={bf.pos} speed={bf.speed} />
      ))}

      {/* Bees */}
      {beePositions.map((bee, i) => (
        <Bee key={`bee-${i}`} startPosition={bee.pos} speed={bee.speed} />
      ))}

      {/* Mushrooms */}
      {mushroomPositions.map((pos, i) => (
        <Mushroom key={`mush-${i}`} position={pos} />
      ))}

      {/* Flower pots */}
      <FlowerPot position={[halfL + 0.4, 0, 0]} season={season} />
      <FlowerPot position={[-halfL - 0.4, 0, halfW - 0.5]} season={season} />

      {/* Rock cluster */}
      <group position={[-halfL - 0.6, 0, halfW + 0.4]}>
        <mesh position={[0, 0.03, 0]} castShadow>
          <sphereGeometry args={[0.06, 6, 4]} />
          <meshStandardMaterial color="#9E9E9E" roughness={0.9} />
        </mesh>
        <mesh position={[0.06, 0.02, 0.02]} castShadow>
          <sphereGeometry args={[0.04, 5, 4]} />
          <meshStandardMaterial color="#BDBDBD" roughness={0.9} />
        </mesh>
        <mesh position={[-0.03, 0.02, 0.04]} castShadow>
          <sphereGeometry args={[0.035, 5, 3]} />
          <meshStandardMaterial color="#A0A0A0" roughness={0.9} />
        </mesh>
      </group>

      {/* Compost bin */}
      <group position={[-halfL - 0.8, 0, 0.3]} rotation={[0, 0.5, 0]}>
        <mesh position={[0, 0.08, 0]} castShadow>
          <boxGeometry args={[0.15, 0.16, 0.12]} />
          <meshStandardMaterial color="#6D4C2A" />
        </mesh>
        <mesh position={[0, 0.17, 0]}>
          <boxGeometry args={[0.17, 0.02, 0.14]} />
          <meshStandardMaterial color="#5C3D1E" />
        </mesh>
      </group>

      {/* Decorative pond */}
      <GardenPond position={[halfL + 1.2, 0, 0.5]} season={season} />

      {/* Ambient pollen/firefly particles */}
      <AmbientParticles gardenLength={gardenLength} gardenWidth={gardenWidth} season={season} />
    </group>
  );
}
