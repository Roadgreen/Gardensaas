'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

function MiniTerrain() {
  return (
    <group>
      {/* Grass with slight variation */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color="#7EC850" />
      </mesh>
      {/* Darker grass patches */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2, -0.005, -2]} receiveShadow>
        <circleGeometry args={[0.8, 8]} />
        <meshStandardMaterial color="#6AB840" transparent opacity={0.6} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2.5, -0.005, 1.5]} receiveShadow>
        <circleGeometry args={[0.6, 8]} />
        <meshStandardMaterial color="#6AB840" transparent opacity={0.5} />
      </mesh>
      {/* Soil bed */}
      <mesh position={[0, 0.02, 0]} receiveShadow castShadow>
        <boxGeometry args={[3, 0.06, 2.5]} />
        <meshStandardMaterial color="#5C3D1E" />
      </mesh>
      {/* Soil row lines */}
      {[-0.8, -0.4, 0, 0.4, 0.8].map((z, i) => (
        <mesh key={`row-${i}`} position={[0, 0.052, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.8, 0.02]} />
          <meshStandardMaterial color="#4A3518" transparent opacity={0.3} />
        </mesh>
      ))}
      {/* Fence posts */}
      {[
        [-1.7, 0, -1.5], [1.7, 0, -1.5], [-1.7, 0, 1.5], [1.7, 0, 1.5],
        [0, 0, -1.5], [0, 0, 1.5], [-1.7, 0, 0], [1.7, 0, 0],
      ].map((pos, i) => (
        <group key={`fp-${i}`}>
          <mesh position={[pos[0], 0.14, pos[2]]} castShadow>
            <boxGeometry args={[0.06, 0.28, 0.06]} />
            <meshStandardMaterial color="#B8845C" />
          </mesh>
          <mesh position={[pos[0], 0.3, pos[2]]}>
            <coneGeometry args={[0.04, 0.05, 4]} />
            <meshStandardMaterial color="#D4A06C" />
          </mesh>
        </group>
      ))}
      {/* Fence rails */}
      {[
        { pos: [0, 0.22, -1.5] as [number, number, number], len: 3.4, rot: 0 },
        { pos: [0, 0.22, 1.5] as [number, number, number], len: 3.4, rot: 0 },
        { pos: [-1.7, 0.22, 0] as [number, number, number], len: 3, rot: Math.PI / 2 },
        { pos: [1.7, 0.22, 0] as [number, number, number], len: 3, rot: Math.PI / 2 },
        { pos: [0, 0.1, -1.5] as [number, number, number], len: 3.4, rot: 0 },
        { pos: [0, 0.1, 1.5] as [number, number, number], len: 3.4, rot: 0 },
        { pos: [-1.7, 0.1, 0] as [number, number, number], len: 3, rot: Math.PI / 2 },
        { pos: [1.7, 0.1, 0] as [number, number, number], len: 3, rot: Math.PI / 2 },
      ].map((r, i) => (
        <mesh key={`fr-${i}`} position={r.pos} rotation={[0, r.rot, 0]} castShadow>
          <boxGeometry args={[r.len, 0.03, 0.02]} />
          <meshStandardMaterial color="#D4A870" />
        </mesh>
      ))}
      {/* Stepping stones */}
      {[
        [0.1, 0.005, 1.8],
        [-0.05, 0.005, 2.3],
        [0.15, 0.005, 2.8],
      ].map((pos, i) => (
        <mesh key={`stone-${i}`} position={[pos[0], pos[1], pos[2]]} rotation={[-Math.PI / 2, i * 0.5, 0]} receiveShadow>
          <circleGeometry args={[0.1 + i * 0.01, 7]} />
          <meshStandardMaterial color="#B0AFA0" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function MiniPlant({ position, color, height, hasFlower }: { position: [number, number, number]; color: string; height: number; hasFlower?: boolean }) {
  const ref = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!ref.current) return;
    const t = performance.now() * 0.001;
    ref.current.rotation.z = Math.sin(t * 1.5 + position[0] * 5) * 0.05;
  });

  return (
    <group ref={ref} position={position}>
      {/* Stem */}
      <mesh position={[0, height * 0.4, 0]}>
        <cylinderGeometry args={[0.02, 0.025, height * 0.8, 4]} />
        <meshStandardMaterial color="#4CAF50" />
      </mesh>
      {/* Leaves on stem */}
      <mesh position={[-0.04, height * 0.3, 0]} rotation={[0, 0, -0.5]}>
        <boxGeometry args={[0.06, 0.006, 0.03]} />
        <meshStandardMaterial color="#43A047" />
      </mesh>
      <mesh position={[0.04, height * 0.5, 0.01]} rotation={[0.2, 0.3, 0.5]}>
        <boxGeometry args={[0.05, 0.006, 0.025]} />
        <meshStandardMaterial color="#388E3C" />
      </mesh>
      {/* Top - fruit/veggie */}
      <mesh position={[0, height * 0.75, 0]} castShadow>
        <sphereGeometry args={[height * 0.35, 8, 6]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Little stem nub on top */}
      <mesh position={[0, height * 0.95, 0]}>
        <cylinderGeometry args={[0.005, 0.008, 0.02, 4]} />
        <meshStandardMaterial color="#4CAF50" />
      </mesh>
      {/* Optional flower */}
      {hasFlower && (
        <group position={[0.05, height * 0.65, 0.03]}>
          <mesh>
            <sphereGeometry args={[0.02, 6, 4]} />
            <meshStandardMaterial color="#FFB7D5" />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.01, 4, 3]} />
            <meshStandardMaterial color="#FFEB3B" />
          </mesh>
        </group>
      )}
    </group>
  );
}

function MiniGardener() {
  const groupRef = useRef<THREE.Group>(null);
  const armRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    const t = performance.now() * 0.001;
    groupRef.current.position.y = Math.sin(t * 2) * 0.01;
    if (armRef.current) {
      armRef.current.rotation.z = Math.sin(t * 4) * 0.3 - 1.2;
    }
  });

  return (
    <group ref={groupRef} position={[2, 0, 0.5]}>
      {/* Body */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[0.2, 0.25, 0.14]} />
        <meshStandardMaterial color="#4ADE80" />
      </mesh>
      {/* Overalls detail */}
      <mesh position={[0, 0.3, 0.071]}>
        <boxGeometry args={[0.1, 0.08, 0.01]} />
        <meshStandardMaterial color="#2D9B52" />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <sphereGeometry args={[0.12, 8, 6]} />
        <meshStandardMaterial color="#FFD5B8" />
      </mesh>
      {/* Rosy cheeks */}
      <mesh position={[-0.08, 0.57, 0.08]}>
        <sphereGeometry args={[0.02, 4, 3]} />
        <meshStandardMaterial color="#FCA5A5" transparent opacity={0.5} />
      </mesh>
      <mesh position={[0.08, 0.57, 0.08]}>
        <sphereGeometry args={[0.02, 4, 3]} />
        <meshStandardMaterial color="#FCA5A5" transparent opacity={0.5} />
      </mesh>
      {/* Hat brim */}
      <mesh position={[0, 0.72, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.2, 0.03, 8]} />
        <meshStandardMaterial color="#A0724A" />
      </mesh>
      {/* Hat top */}
      <mesh position={[0, 0.77, 0]}>
        <cylinderGeometry args={[0.09, 0.12, 0.08, 8]} />
        <meshStandardMaterial color="#A0724A" />
      </mesh>
      {/* Hat band */}
      <mesh position={[0, 0.735, 0]}>
        <cylinderGeometry args={[0.121, 0.121, 0.02, 8]} />
        <meshStandardMaterial color="#DC2626" />
      </mesh>
      {/* Flower on hat */}
      <mesh position={[0.12, 0.74, 0.05]}>
        <sphereGeometry args={[0.02, 4, 3]} />
        <meshStandardMaterial color="#FFB7D5" />
      </mesh>
      <mesh position={[0.12, 0.74, 0.05]}>
        <sphereGeometry args={[0.01, 4, 3]} />
        <meshStandardMaterial color="#FFEB3B" />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.035, 0.62, 0.1]}>
        <sphereGeometry args={[0.018, 6, 4]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.035, 0.62, 0.1]}>
        <sphereGeometry args={[0.018, 6, 4]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Eye highlights */}
      <mesh position={[-0.03, 0.625, 0.115]}>
        <sphereGeometry args={[0.006, 3, 3]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
      <mesh position={[0.04, 0.625, 0.115]}>
        <sphereGeometry args={[0.006, 3, 3]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
      {/* Waving arm */}
      <mesh ref={armRef} position={[0.15, 0.42, 0]} castShadow>
        <boxGeometry args={[0.07, 0.18, 0.07]} />
        <meshStandardMaterial color="#4ADE80" />
      </mesh>
      {/* Waving hand */}
      <mesh position={[0.15, 0.32, 0]}>
        <sphereGeometry args={[0.03, 4, 3]} />
        <meshStandardMaterial color="#FFD5B8" />
      </mesh>
      {/* Other arm */}
      <mesh position={[-0.15, 0.35, 0]} castShadow>
        <boxGeometry args={[0.07, 0.18, 0.07]} />
        <meshStandardMaterial color="#4ADE80" />
      </mesh>
      {/* Legs */}
      <mesh position={[-0.05, 0.15, 0]}>
        <boxGeometry args={[0.08, 0.15, 0.08]} />
        <meshStandardMaterial color="#5B8C5A" />
      </mesh>
      <mesh position={[0.05, 0.15, 0]}>
        <boxGeometry args={[0.08, 0.15, 0.08]} />
        <meshStandardMaterial color="#5B8C5A" />
      </mesh>
      {/* Boots */}
      <mesh position={[-0.05, 0.05, 0.01]}>
        <boxGeometry args={[0.09, 0.06, 0.12]} />
        <meshStandardMaterial color="#5C3D1E" />
      </mesh>
      <mesh position={[0.05, 0.05, 0.01]}>
        <boxGeometry args={[0.09, 0.06, 0.12]} />
        <meshStandardMaterial color="#5C3D1E" />
      </mesh>
      {/* Shadow */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.15, 8]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.1} />
      </mesh>
    </group>
  );
}

// Cute butterfly that flaps around
function MiniButterfly({ offset }: { offset: number }) {
  const ref = useRef<THREE.Group>(null);
  const wingColor = useMemo(() => {
    const colors = ['#FF69B4', '#DDA0DD', '#FFD700', '#87CEEB'];
    return colors[Math.floor(offset * colors.length) % colors.length];
  }, [offset]);

  useFrame(() => {
    if (!ref.current) return;
    const t = performance.now() * 0.001 + offset * 10;
    ref.current.position.x = Math.sin(t * 0.5) * 2.5;
    ref.current.position.z = Math.cos(t * 0.3) * 1.5;
    ref.current.position.y = 0.5 + Math.sin(t * 2) * 0.15;
    ref.current.rotation.y = t * 0.5 + Math.PI / 2;
  });

  return (
    <group ref={ref}>
      {/* Body */}
      <mesh>
        <capsuleGeometry args={[0.005, 0.02, 3, 4]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      {/* Wings */}
      <MiniWing position={[-0.015, 0.003, 0]} color={wingColor} side="left" />
      <MiniWing position={[0.015, 0.003, 0]} color={wingColor} side="right" />
    </group>
  );
}

function MiniWing({ position, color, side }: { position: [number, number, number]; color: string; side: 'left' | 'right' }) {
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

// Floating pollen/sparkle particles
function PollenParticles() {
  const ref = useRef<THREE.Group>(null);
  const particles = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      x: (Math.random() - 0.5) * 6,
      z: (Math.random() - 0.5) * 6,
      y: 0.2 + Math.random() * 0.6,
      speed: 0.3 + Math.random() * 0.5,
      offset: Math.random() * Math.PI * 2,
    })),
  []);

  useFrame(() => {
    if (!ref.current) return;
    const t = performance.now() * 0.001;
    ref.current.children.forEach((child, i) => {
      const p = particles[i];
      const mesh = child as THREE.Mesh;
      mesh.position.y = p.y + Math.sin(t * p.speed + p.offset) * 0.1;
      mesh.position.x = p.x + Math.sin(t * 0.2 + p.offset) * 0.3;
      const pulse = (Math.sin(t * 2 + p.offset) + 1) / 2;
      (mesh.material as THREE.MeshBasicMaterial).opacity = 0.3 + pulse * 0.5;
    });
  });

  return (
    <group ref={ref}>
      {particles.map((p, i) => (
        <mesh key={`pollen-${i}`} position={[p.x, p.y, p.z]}>
          <sphereGeometry args={[0.01, 4, 3]} />
          <meshBasicMaterial color="#FFE082" transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

// Small decorative tree
function MiniTree({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    const t = performance.now() * 0.001;
    ref.current.rotation.z = Math.sin(t * 0.5 + position[0] * 3) * 0.015;
  });

  return (
    <group ref={ref} position={position}>
      <mesh position={[0, 0.12, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.045, 0.24, 6]} />
        <meshStandardMaterial color="#795548" />
      </mesh>
      <mesh position={[0, 0.28, 0]} castShadow>
        <coneGeometry args={[0.18, 0.2, 7]} />
        <meshStandardMaterial color="#66BB6A" />
      </mesh>
      <mesh position={[0, 0.42, 0]} castShadow>
        <coneGeometry args={[0.13, 0.18, 7]} />
        <meshStandardMaterial color="#66BB6A" />
      </mesh>
      <mesh position={[0, 0.53, 0]} castShadow>
        <coneGeometry args={[0.08, 0.13, 7]} />
        <meshStandardMaterial color="#81C784" />
      </mesh>
      {/* Cherry blossoms */}
      <mesh position={[0.12, 0.32, 0.05]}>
        <sphereGeometry args={[0.015, 4, 3]} />
        <meshStandardMaterial color="#FFB7D5" />
      </mesh>
      <mesh position={[-0.08, 0.4, 0.06]}>
        <sphereGeometry args={[0.012, 4, 3]} />
        <meshStandardMaterial color="#FFB7D5" />
      </mesh>
    </group>
  );
}

function SpinningScene() {
  const sceneRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (sceneRef.current) {
      sceneRef.current.rotation.y += 0.002;
    }
  });

  const plants = useMemo(() => [
    { position: [-0.8, 0.05, -0.5] as [number, number, number], color: '#FF6347', height: 0.35, hasFlower: true },
    { position: [-0.3, 0.05, 0.4] as [number, number, number], color: '#90EE90', height: 0.25, hasFlower: false },
    { position: [0.5, 0.05, -0.3] as [number, number, number], color: '#9370DB', height: 0.3, hasFlower: true },
    { position: [0.8, 0.05, 0.5] as [number, number, number], color: '#FFD700', height: 0.28, hasFlower: false },
    { position: [-0.5, 0.05, -0.8] as [number, number, number], color: '#FF69B4', height: 0.22, hasFlower: true },
    { position: [0.2, 0.05, 0.8] as [number, number, number], color: '#FFA500', height: 0.32, hasFlower: false },
  ], []);

  return (
    <group ref={sceneRef}>
      <MiniTerrain />
      {plants.map((p, i) => (
        <MiniPlant key={i} position={p.position} color={p.color} height={p.height} hasFlower={p.hasFlower} />
      ))}
      <MiniGardener />
      {/* Trees around */}
      <MiniTree position={[-2.8, 0, -2.2]} />
      <MiniTree position={[2.5, 0, -2.5]} />
      <MiniTree position={[-2.5, 0, 2.3]} />
      {/* Butterflies */}
      <MiniButterfly offset={0} />
      <MiniButterfly offset={0.5} />
      {/* Pollen particles */}
      <PollenParticles />
      {/* Small flowers around the garden */}
      {[
        [-2, 0, 0.5], [2.3, 0, 1], [-1.5, 0, -2], [2, 0, -1.5],
      ].map((pos, i) => (
        <group key={`flower-${i}`} position={[pos[0], pos[1], pos[2]]}>
          <mesh position={[0, 0.06, 0]}>
            <sphereGeometry args={[0.025, 6, 4]} />
            <meshStandardMaterial color={['#FFD700', '#FF69B4', '#87CEEB', '#DDA0DD'][i]} />
          </mesh>
          <mesh position={[0, 0.03, 0]}>
            <cylinderGeometry args={[0.004, 0.004, 0.06, 4]} />
            <meshStandardMaterial color="#4CAF50" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function MiniGardenPreview() {
  return (
    <div className="w-full h-[220px] sm:h-[300px] md:h-[350px] rounded-2xl overflow-hidden border-2 border-green-800/40 bg-gradient-to-b from-sky-400/20 to-green-900/20 shadow-lg shadow-green-900/20">
      <Canvas
        shadows
        camera={{ position: [3.5, 3, 3.5], fov: 40, near: 0.1, far: 50 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.3 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.6} color="#FFE4B5" />
        <directionalLight
          position={[4, 6, 3]}
          intensity={1}
          color="#FFF8E1"
          castShadow
          shadow-mapSize={[512, 512]}
        />
        <hemisphereLight args={['#87CEEB', '#4CAF50', 0.3]} />
        <fog attach="fog" args={['#C8E6C9', 10, 30]} />

        <SpinningScene />

        <OrbitControls
          enablePan={false}
          enableZoom={false}
          enableRotate={false}
          autoRotate={false}
        />
      </Canvas>
    </div>
  );
}
