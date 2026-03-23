'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { GardenConfig, Plant } from '@/types';
import { GardenerCharacter, getSeason, getTimeOfDay, getSeasonalDialogue, getRandomAdvice } from './gardener-character';
import { GardenTerrain } from './garden-terrain';
import { Plant3D } from './plant-3d';
import { GardenDecorations } from './garden-decorations';
import { GardenUIOverlay } from './garden-ui-overlay';
import { WeatherSystem } from './weather-effects';
import { RaisedBed3D } from './raised-bed-3d';
import { Zone3D } from './zone-3d';
import { PlantSpacingRings } from './plant-spacing-rings';

interface GardenSceneProps {
  config: GardenConfig;
  selectedPlantType?: string | null;
  onPlantAdded?: () => void;
  showSpacing?: boolean;
  selectedBedId?: string | null;
  onSelectBed?: (bedId: string | null) => void;
  selectedZoneId?: string | null;
  onSelectZone?: (zoneId: string | null) => void;
}

// ===== Sound Effects Placeholder System =====
// Call these to trigger sounds when audio is implemented.
// Each returns a no-op for now; replace with Howler/Web Audio later.
const SoundEffects = {
  play: (sound: 'plant' | 'water' | 'harvest' | 'click' | 'ambient' | 'footstep') => {
    // Placeholder: will be wired to actual audio files later.
    // Example future implementation:
    // const audio = new Audio(`/sounds/${sound}.mp3`);
    // audio.volume = 0.3; audio.play();
    if (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).__gardenSoundDebug) {
      console.log(`[SFX] ${sound}`);
    }
  },
};

// Sky dome with day/night cycle - smooth color transitions
function SkyDome({ season, timeOfDay }: { season: string; timeOfDay: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const colors = useMemo(() => {
    const palettes: Record<string, Record<string, [string, string]>> = {
      morning: {
        spring: ['#9DD6F5', '#FFECD2'],
        summer: ['#7EC8F2', '#FFE0A0'],
        autumn: ['#A8C8E8', '#FFD8A0'],
        winter: ['#C0CCD8', '#E0E4E8'],
      },
      afternoon: {
        spring: ['#6BB8E8', '#E8F4FC'],
        summer: ['#5AACE0', '#D0EAFF'],
        autumn: ['#8090C0', '#F0E8F0'],
        winter: ['#90A0B0', '#F0F2F4'],
      },
      evening: {
        spring: ['#7878C0', '#FF9878'],
        summer: ['#5060B0', '#FF8860'],
        autumn: ['#583CA0', '#FF7850'],
        winter: ['#303848', '#607080'],
      },
    };
    return palettes[timeOfDay]?.[season] || ['#9DD6F5', '#FFECD2'];
  }, [season, timeOfDay]);

  const topColor = useMemo(() => new THREE.Color(colors[0]), [colors]);
  const bottomColor = useMemo(() => new THREE.Color(colors[1]), [colors]);

  // Smooth color lerp over time for subtle day/night feel
  useFrame(() => {
    if (!meshRef.current) return;
    const t = performance.now() * 0.0001;
    const shift = Math.sin(t) * 0.03;
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    const c = topColor.clone();
    c.r = Math.max(0, Math.min(1, c.r + shift));
    c.g = Math.max(0, Math.min(1, c.g + shift * 0.5));
    c.b = Math.max(0, Math.min(1, c.b - shift * 0.3));
    mat.color.copy(c);
  });

  return (
    <mesh ref={meshRef} scale={[-1, 1, 1]}>
      <sphereGeometry args={[50, 16, 12]} />
      <meshBasicMaterial
        color={colors[0]}
        side={THREE.BackSide}
      />
    </mesh>
  );
}

// Firefly particles - glow at evening
function Fireflies({ count, gardenLength, gardenWidth }: { count: number; gardenLength: number; gardenWidth: number }) {
  const ref = useRef<THREE.Group>(null);
  const particles = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      x: (Math.random() - 0.5) * (gardenLength + 6),
      z: (Math.random() - 0.5) * (gardenWidth + 6),
      y: 0.2 + Math.random() * 1.5,
      speed: 0.15 + Math.random() * 0.35,
      offset: Math.random() * Math.PI * 2,
      pulseSpeed: 1.5 + Math.random() * 2,
    })),
  [count, gardenLength, gardenWidth]);

  useFrame(() => {
    if (!ref.current) return;
    const t = performance.now() * 0.001;
    ref.current.children.forEach((child, i) => {
      const p = particles[i];
      if (!p) return;
      const mesh = child as THREE.Mesh;
      mesh.position.x = p.x + Math.sin(t * p.speed + p.offset) * 0.8;
      mesh.position.y = p.y + Math.sin(t * p.speed * 1.3 + p.offset) * 0.3;
      mesh.position.z = p.z + Math.cos(t * p.speed * 0.7 + p.offset) * 0.6;
      const glow = (Math.sin(t * p.pulseSpeed + p.offset) + 1) / 2;
      (mesh.material as THREE.MeshBasicMaterial).opacity = 0.15 + glow * 0.85;
      mesh.scale.setScalar(0.5 + glow * 0.8);
    });
  });

  return (
    <group ref={ref}>
      {particles.map((p, i) => (
        <mesh key={`firefly-${i}`} position={[p.x, p.y, p.z]}>
          <sphereGeometry args={[0.015, 4, 3]} />
          <meshBasicMaterial color="#CCFF66" transparent opacity={0.6} />
        </mesh>
      ))}
    </group>
  );
}

// Falling leaves particle system (autumn)
function FallingLeaves({ count, gardenLength, gardenWidth }: { count: number; gardenLength: number; gardenWidth: number }) {
  const ref = useRef<THREE.Group>(null);
  const leaves = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      x: (Math.random() - 0.5) * (gardenLength + 8),
      z: (Math.random() - 0.5) * (gardenWidth + 8),
      fallSpeed: 0.15 + Math.random() * 0.25,
      swaySpeed: 0.8 + Math.random() * 1.2,
      swayAmount: 0.3 + Math.random() * 0.5,
      rotSpeed: 1 + Math.random() * 2,
      offset: Math.random() * Math.PI * 2,
      color: ['#E06010', '#C04020', '#D4A020', '#B8601A'][Math.floor(Math.random() * 4)],
    })),
  [count, gardenLength, gardenWidth]);

  useFrame(() => {
    if (!ref.current) return;
    const t = performance.now() * 0.001;
    ref.current.children.forEach((child, i) => {
      const l = leaves[i];
      if (!l) return;
      const mesh = child as THREE.Mesh;
      const fallPhase = ((t * l.fallSpeed + l.offset) % 3) / 3;
      mesh.position.x = l.x + Math.sin(t * l.swaySpeed + l.offset) * l.swayAmount;
      mesh.position.y = 4 - fallPhase * 5;
      mesh.position.z = l.z + Math.cos(t * l.swaySpeed * 0.7 + l.offset) * l.swayAmount * 0.5;
      mesh.rotation.x = t * l.rotSpeed;
      mesh.rotation.z = t * l.rotSpeed * 0.7;
      (mesh.material as THREE.MeshBasicMaterial).opacity = mesh.position.y > 0 ? 0.85 : Math.max(0, 0.85 + mesh.position.y * 0.4);
    });
  });

  return (
    <group ref={ref}>
      {leaves.map((l, i) => (
        <mesh key={`leaf-${i}`} position={[l.x, 3, l.z]}>
          <boxGeometry args={[0.04, 0.002, 0.03]} />
          <meshBasicMaterial color={l.color} transparent opacity={0.85} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

// Season-aware particle effects container
function SeasonalParticles({ season, timeOfDay, gardenLength, gardenWidth }: {
  season: string; timeOfDay: string; gardenLength: number; gardenWidth: number;
}) {
  const isEvening = timeOfDay === 'evening';
  return (
    <group>
      {/* Fireflies at night */}
      {isEvening && <Fireflies count={20} gardenLength={gardenLength} gardenWidth={gardenWidth} />}
      {/* Falling leaves in autumn */}
      {season === 'autumn' && <FallingLeaves count={15} gardenLength={gardenLength} gardenWidth={gardenWidth} />}
    </group>
  );
}

// Sun/Moon
function CelestialBody({ timeOfDay, season }: { timeOfDay: string; season: string }) {
  const bodyRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  const sunAngle = useMemo(() => {
    const hour = new Date().getHours();
    const normalizedHour = Math.max(0, Math.min(1, (hour - 6) / 12));
    return normalizedHour * Math.PI;
  }, []);

  const isNight = timeOfDay === 'evening' && new Date().getHours() > 20;

  const position = useMemo((): [number, number, number] => {
    const x = Math.cos(sunAngle) * 20;
    const y = Math.sin(sunAngle) * 15 + 5;
    return [x, Math.max(y, 3), -10];
  }, [sunAngle]);

  useFrame(() => {
    if (glowRef.current && !isNight) {
      const t = performance.now() * 0.001;
      const pulse = 0.12 + Math.sin(t * 0.5) * 0.05;
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = pulse;
    }
  });

  return (
    <group>
      <mesh ref={bodyRef} position={position}>
        <sphereGeometry args={[isNight ? 1.5 : 2, 12, 8]} />
        <meshBasicMaterial color={isNight ? '#FFF9C4' : '#FFF176'} />
      </mesh>

      {!isNight && (
        <mesh ref={glowRef} position={position}>
          <sphereGeometry args={[3, 12, 8]} />
          <meshBasicMaterial color="#FFF176" transparent opacity={0.15} />
        </mesh>
      )}

      {timeOfDay === 'evening' && (
        <group>
          {Array.from({ length: 40 }).map((_, i) => {
            const theta = (i / 40) * Math.PI * 2;
            const phi = Math.random() * Math.PI * 0.4 + 0.2;
            return (
              <TwinkleStar
                key={`star-${i}`}
                position={[
                  Math.sin(phi) * Math.cos(theta) * 40,
                  Math.cos(phi) * 30 + 10,
                  Math.sin(phi) * Math.sin(theta) * 40,
                ]}
                speed={0.5 + Math.random() * 2}
                offset={Math.random() * Math.PI * 2}
              />
            );
          })}
        </group>
      )}

      {timeOfDay !== 'evening' && (
        <group>
          <Cloud position={[8, 12, -5]} scale={1} />
          <Cloud position={[-6, 14, -8]} scale={0.7} />
          <Cloud position={[3, 11, 5]} scale={0.85} />
          <Cloud position={[-12, 13, -3]} scale={0.6} />
          <Cloud position={[15, 11, 2]} scale={0.9} />
          <Cloud position={[-8, 15, 6]} scale={0.5} />
          {season === 'winter' && <Cloud position={[-3, 10, -3]} scale={1.2} />}
          {season === 'winter' && <Cloud position={[5, 9, 4]} scale={1.1} />}
        </group>
      )}
    </group>
  );
}

function TwinkleStar({ position, speed, offset }: { position: [number, number, number]; speed: number; offset: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!ref.current) return;
    const t = performance.now() * 0.001;
    const twinkle = (Math.sin(t * speed + offset) + 1) / 2;
    ref.current.scale.setScalar(0.5 + twinkle * 0.8);
    (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.4 + twinkle * 0.6;
  });

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.1, 4, 3]} />
      <meshBasicMaterial color="#FFFFFF" transparent opacity={0.8} />
    </mesh>
  );
}

function Cloud({ position, scale }: { position: [number, number, number]; scale: number }) {
  const cloudRef = useRef<THREE.Group>(null);
  const driftSpeed = useRef(0.15 + Math.random() * 0.25);
  const startX = useRef(position[0]);

  useFrame(() => {
    if (!cloudRef.current) return;
    const time = performance.now() * 0.001;
    // Clouds drift continuously across the sky
    const drift = (time * driftSpeed.current) % 50;
    cloudRef.current.position.x = startX.current + drift - 25;
    cloudRef.current.position.y = position[1] + Math.sin(time * 0.2 + position[2]) * 0.3;
    // Wrap around when too far
    if (cloudRef.current.position.x > 25) {
      startX.current -= 50;
    }
  });

  return (
    <group ref={cloudRef} position={position} scale={scale}>
      {/* Fluffier, rounder cloud blobs */}
      <mesh>
        <sphereGeometry args={[1, 10, 8]} />
        <meshStandardMaterial color="#FFFFFF" transparent opacity={0.88} roughness={1} />
      </mesh>
      <mesh position={[0.85, -0.05, 0.1]}>
        <sphereGeometry args={[0.8, 9, 7]} />
        <meshStandardMaterial color="#FAFAFA" transparent opacity={0.85} roughness={1} />
      </mesh>
      <mesh position={[-0.65, -0.1, 0.15]}>
        <sphereGeometry args={[0.7, 9, 7]} />
        <meshStandardMaterial color="#FAFAFA" transparent opacity={0.85} roughness={1} />
      </mesh>
      <mesh position={[0.25, 0.4, -0.05]}>
        <sphereGeometry args={[0.6, 8, 6]} />
        <meshStandardMaterial color="#FFFFFF" transparent opacity={0.82} roughness={1} />
      </mesh>
      <mesh position={[1.45, 0, 0.1]}>
        <sphereGeometry args={[0.55, 8, 6]} />
        <meshStandardMaterial color="#FAFAFA" transparent opacity={0.8} roughness={1} />
      </mesh>
      <mesh position={[-0.3, 0.2, -0.2]}>
        <sphereGeometry args={[0.5, 7, 5]} />
        <meshStandardMaterial color="#FFFFFF" transparent opacity={0.78} roughness={1} />
      </mesh>
    </group>
  );
}

// Flying birds that cross the sky occasionally
function FlyingBirds({ gardenLength, gardenWidth }: { gardenLength: number; gardenWidth: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const birds = useMemo(() =>
    Array.from({ length: 5 }, (_, i) => ({
      offset: i * 2.5,
      speed: 1.2 + Math.random() * 0.8,
      height: 6 + Math.random() * 4,
      z: (Math.random() - 0.5) * gardenWidth * 2,
      flapSpeed: 8 + Math.random() * 4,
      size: 0.06 + Math.random() * 0.04,
    })),
  [gardenLength, gardenWidth]);

  useFrame(() => {
    if (!groupRef.current) return;
    const t = performance.now() * 0.001;
    groupRef.current.children.forEach((child, i) => {
      const b = birds[i];
      if (!b) return;
      const birdGroup = child as THREE.Group;
      // Fly across the sky in a sine wave path
      const phase = ((t * b.speed * 0.15 + b.offset) % 1);
      birdGroup.position.x = -15 + phase * 30;
      birdGroup.position.y = b.height + Math.sin(t * 0.5 + b.offset) * 0.5;
      birdGroup.position.z = b.z + Math.sin(t * 0.3 + b.offset) * 1;
      birdGroup.rotation.y = Math.PI * 0.5 + Math.sin(t * 0.2 + b.offset) * 0.2;
      // Wing flapping
      const wingAngle = Math.sin(t * b.flapSpeed) * 0.6;
      if (birdGroup.children[1]) (birdGroup.children[1] as THREE.Mesh).rotation.z = -wingAngle - 0.2;
      if (birdGroup.children[2]) (birdGroup.children[2] as THREE.Mesh).rotation.z = wingAngle + 0.2;
    });
  });

  return (
    <group ref={groupRef}>
      {birds.map((b, i) => (
        <group key={`fbird-${i}`}>
          {/* Body */}
          <mesh>
            <capsuleGeometry args={[b.size * 0.3, b.size, 3, 4]} />
            <meshStandardMaterial color="#2D3748" />
          </mesh>
          {/* Left wing */}
          <mesh position={[-b.size * 0.8, 0, 0]}>
            <boxGeometry args={[b.size * 1.5, 0.003, b.size * 0.5]} />
            <meshStandardMaterial color="#4A5568" />
          </mesh>
          {/* Right wing */}
          <mesh position={[b.size * 0.8, 0, 0]}>
            <boxGeometry args={[b.size * 1.5, 0.003, b.size * 0.5]} />
            <meshStandardMaterial color="#4A5568" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// Camera controller with smooth focus transitions
function CameraController({
  isIsometric,
  focusTarget,
  gardenLength,
  gardenWidth,
}: {
  isIsometric: boolean;
  focusTarget: THREE.Vector3 | null;
  gardenLength: number;
  gardenWidth: number;
}) {
  const { camera } = useThree();
  const targetRef = useRef({ x: 0, y: 0, z: 0 });
  const focusLerpRef = useRef(0);

  // Scale camera distance to garden size
  const maxDim = Math.max(gardenLength, gardenWidth);
  const camScale = Math.max(1, maxDim / 5); // 5m is the reference size

  useEffect(() => {
    if (isIsometric) {
      targetRef.current = { x: 4.5 * camScale, y: 5.5 * camScale, z: 4.5 * camScale };
    } else {
      targetRef.current = { x: 3.5 * camScale, y: 4.5 * camScale, z: 5.5 * camScale };
    }
  }, [isIsometric, camScale]);

  useEffect(() => {
    if (focusTarget) {
      focusLerpRef.current = 0;
    }
  }, [focusTarget]);

  useFrame((_, delta) => {
    if (isIsometric) {
      camera.position.x += (targetRef.current.x - camera.position.x) * 0.05;
      camera.position.y += (targetRef.current.y - camera.position.y) * 0.05;
      camera.position.z += (targetRef.current.z - camera.position.z) * 0.05;
    }

    // Smooth camera focus on selected plant
    if (focusTarget && focusLerpRef.current < 1) {
      focusLerpRef.current = Math.min(focusLerpRef.current + delta * 1.5, 1);
      const t = focusLerpRef.current;
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const targetPos = new THREE.Vector3(
        focusTarget.x + 1.5,
        focusTarget.y + 2,
        focusTarget.z + 2.5
      );
      camera.position.lerp(targetPos, eased * 0.03);
    }
  });

  return null;
}

// Lighting setup with warm Animal Crossing / Stardew Valley cozy tones
function SceneLighting({ timeOfDay, season }: { timeOfDay: string; season: string }) {
  const ambientIntensity = useMemo(() => {
    if (timeOfDay === 'evening') return 0.4;
    if (timeOfDay === 'morning') return 0.6;
    return 0.7;
  }, [timeOfDay]);

  const directionalIntensity = useMemo(() => {
    if (timeOfDay === 'evening') return 0.6;
    if (season === 'winter') return 0.8;
    return 1.2;
  }, [timeOfDay, season]);

  // Warmer, cozier light colors -- golden hour feel
  const lightColor = useMemo(() => {
    if (timeOfDay === 'evening') return '#FFB080';
    if (timeOfDay === 'morning') return '#FFEAC0';
    if (season === 'winter') return '#EAE6E2';
    if (season === 'autumn') return '#FFE0B8';
    return '#FFF5E0'; // Warm golden white
  }, [timeOfDay, season]);

  const hour = new Date().getHours();
  const sunAngle = Math.max(0, Math.min(1, (hour - 6) / 12)) * Math.PI;

  return (
    <>
      <ambientLight intensity={ambientIntensity} color={lightColor} />
      {/* Main directional light (sun) - soft cartoon shadows */}
      <directionalLight
        position={[Math.cos(sunAngle) * 8, Math.sin(sunAngle) * 6 + 4, -5]}
        intensity={directionalIntensity}
        color={lightColor}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={30}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-bias={-0.0005}
        shadow-radius={4}
      />
      {/* Warm fill light from opposite side -- reduces harsh shadows */}
      <directionalLight
        position={[-4, 3, 4]}
        intensity={0.3}
        color="#D8ECFF"
      />
      {/* Warm ground bounce light for cozy feel */}
      <directionalLight
        position={[0, -1, 0]}
        intensity={0.12}
        color="#A8E090"
      />
      {/* Hemisphere light: soft sky + warm ground tones */}
      <hemisphereLight
        args={[
          season === 'winter' ? '#C0D0E0' : season === 'autumn' ? '#E0C8A0' : '#B0E0F8',
          season === 'winter' ? '#E8E8E0' : '#80C868',
          0.4,
        ]}
      />
      {/* Evening cozy lantern glow */}
      {timeOfDay === 'evening' && (
        <>
          <pointLight position={[0, 0.8, 0]} intensity={0.5} color="#FFB868" distance={7} decay={2} />
          <pointLight position={[0, 1.5, 0]} intensity={0.2} color="#FFA050" distance={12} decay={2} />
        </>
      )}
      {/* Rim light for cartoon edge definition */}
      <directionalLight
        position={[-5, 4, -5]}
        intensity={0.15}
        color="#E8F0FF"
      />
      {/* Subtle top-down fill for even illumination */}
      <directionalLight
        position={[0, 8, 0]}
        intensity={0.1}
        color="#FFF8F0"
      />
    </>
  );
}

// Raycaster ground click handler for click-to-plant
function GroundClickHandler({
  config,
  isPlacementMode,
  onGroundClick,
}: {
  config: GardenConfig;
  isPlacementMode: boolean;
  onGroundClick: (x: number, z: number) => void;
}) {
  const { camera, raycaster } = useThree();
  const planeRef = useRef<THREE.Mesh>(null);
  const halfL = config.length / 2;
  const halfW = config.width / 2;

  if (!isPlacementMode) return null;

  return (
    <mesh
      ref={planeRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.05, 0]}
      onClick={(e) => {
        e.stopPropagation();
        const point = e.point;
        // Convert to percentage coords and snap to 30cm grid
        const cellPctX = (0.3 / config.length) * 100;
        const cellPctZ = (0.3 / config.width) * 100;
        const rawPctX = ((point.x + halfL) / config.length) * 100;
        const rawPctZ = ((point.z + halfW) / config.width) * 100;
        const pctX = Math.round(rawPctX / cellPctX) * cellPctX;
        const pctZ = Math.round(rawPctZ / cellPctZ) * cellPctZ;
        onGroundClick(pctX, pctZ);
      }}
      onPointerOver={() => {
        if (isPlacementMode) document.body.style.cursor = 'crosshair';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
      visible={false}
    >
      <planeGeometry args={[config.length * 3, config.width * 3]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
}

// Context menu for right-click plant actions
function PlantContextMenu({
  position,
  plantName,
  onWater,
  onRemove,
  onInfo,
  onClose,
}: {
  position: { x: number; y: number };
  plantName: string;
  onWater: () => void;
  onRemove: () => void;
  onInfo: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const handler = () => onClose();
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 100,
        background: 'linear-gradient(145deg, rgba(15, 40, 24, 0.95), rgba(20, 50, 30, 0.95))',
        backdropFilter: 'blur(12px)',
        borderRadius: '12px',
        border: '2px solid rgba(74, 222, 128, 0.4)',
        padding: '6px',
        fontFamily: '"Nunito", system-ui, sans-serif',
        minWidth: '160px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{
          padding: '6px 12px',
          color: '#86EFAC',
          fontWeight: 'bold',
          fontSize: '13px',
          borderBottom: '1px solid rgba(74, 222, 128, 0.2)',
          marginBottom: '4px',
        }}
      >
        {plantName}
      </div>
      {[
        { label: 'Inspect', icon: '\u{1F50D}', action: onInfo },
        { label: 'Water', icon: '\u{1F4A7}', action: onWater },
        { label: 'Remove', icon: '\u{1F5D1}\u{FE0F}', action: onRemove, danger: true },
      ].map((item) => (
        <button
          key={item.label}
          onClick={(e) => {
            e.stopPropagation();
            item.action();
            onClose();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            width: '100%',
            padding: '8px 12px',
            background: 'transparent',
            border: 'none',
            color: (item as { danger?: boolean }).danger ? '#FCA5A5' : '#E5E7EB',
            fontSize: '12px',
            cursor: 'pointer',
            borderRadius: '8px',
            fontFamily: '"Nunito", system-ui, sans-serif',
            textAlign: 'left',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.08)';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.background = 'transparent';
          }}
        >
          <span>{item.icon}</span>
          {item.label}
        </button>
      ))}
    </div>
  );
}

// Garden dimension labels rendered in 3D
function GardenDimensionLabels({ length, width }: { length: number; width: number }) {
  const halfL = length / 2;
  const halfW = width / 2;

  return (
    <group>
      {/* Length label (along X axis, front) */}
      <Html
        position={[0, 0.08, halfW + 0.35]}
        center
        distanceFactor={7}
        style={{ pointerEvents: 'none' }}
      >
        <div style={{
          background: 'rgba(74, 222, 128, 0.2)',
          borderRadius: '6px',
          padding: '2px 10px',
          fontSize: '11px',
          fontFamily: '"Nunito", sans-serif',
          color: 'rgba(134, 239, 172, 0.9)',
          whiteSpace: 'nowrap',
          letterSpacing: '0.5px',
          fontWeight: 'bold',
          border: '1px solid rgba(74, 222, 128, 0.15)',
        }}>
          {'\u2194'} {length}m
        </div>
      </Html>
      {/* Width label (along Z axis, right) */}
      <Html
        position={[halfL + 0.35, 0.08, 0]}
        center
        distanceFactor={7}
        style={{ pointerEvents: 'none' }}
      >
        <div style={{
          background: 'rgba(74, 222, 128, 0.2)',
          borderRadius: '6px',
          padding: '2px 10px',
          fontSize: '11px',
          fontFamily: '"Nunito", sans-serif',
          color: 'rgba(134, 239, 172, 0.9)',
          whiteSpace: 'nowrap',
          letterSpacing: '0.5px',
          fontWeight: 'bold',
          border: '1px solid rgba(74, 222, 128, 0.15)',
        }}>
          {'\u2195'} {width}m
        </div>
      </Html>
      {/* Area label at corner */}
      <Html
        position={[halfL + 0.35, 0.08, halfW + 0.35]}
        center
        distanceFactor={9}
        style={{ pointerEvents: 'none' }}
      >
        <div style={{
          background: 'rgba(74, 222, 128, 0.1)',
          borderRadius: '4px',
          padding: '1px 6px',
          fontSize: '9px',
          fontFamily: '"Nunito", sans-serif',
          color: 'rgba(134, 239, 172, 0.6)',
          whiteSpace: 'nowrap',
        }}>
          {(length * width).toFixed(1)}m{'\u00B2'}
        </div>
      </Html>
    </group>
  );
}

// Inner scene content
function SceneContent({
  config,
  selectedPlantIndex,
  onSelectPlant,
  onRightClickPlant,
  season,
  timeOfDay,
  gardenerDialogue,
  showGardenerDialogue,
  onGardenerClick,
  onDialogueClose,
  isIsometric,
  plants,
  activeTool,
  isPlacementMode,
  onGroundClick,
  gardenerTarget,
  gardenerAction,
  focusTarget,
  weather,
  showSpacing,
  selectedBedId,
  onSelectBed,
  selectedZoneId,
  onSelectZone,
  selectedPlantType,
}: {
  config: GardenConfig;
  selectedPlantIndex: number | null;
  onSelectPlant: (index: number | null) => void;
  onRightClickPlant: (index: number, event: MouseEvent) => void;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  gardenerDialogue: string;
  showGardenerDialogue: boolean;
  onGardenerClick: () => void;
  onDialogueClose: () => void;
  isIsometric: boolean;
  plants: Plant[];
  activeTool: string | null;
  isPlacementMode: boolean;
  onGroundClick: (x: number, z: number) => void;
  gardenerTarget: THREE.Vector3 | null;
  gardenerAction: 'idle' | 'walking' | 'watering' | 'digging' | 'harvesting' | 'pointing' | 'celebrating';
  focusTarget: THREE.Vector3 | null;
  weather: string;
  showSpacing: boolean;
  selectedBedId: string | null;
  onSelectBed: (bedId: string | null) => void;
  selectedZoneId: string | null;
  onSelectZone: (zoneId: string | null) => void;
  selectedPlantType: string | null;
}) {
  const halfL = config.length / 2;
  const halfW = config.width / 2;
  const controlsRef = useRef<any>(null);

  // Get spacing for selected plant to use for grid snap
  const selectedPlantSpacingCm = useMemo(() => {
    if (!selectedPlantType || !isPlacementMode) return undefined;
    const p = plants.find((pl) => pl.id === selectedPlantType);
    return p?.spacingCm;
  }, [selectedPlantType, isPlacementMode, plants]);

  return (
    <>
      <SceneLighting timeOfDay={timeOfDay} season={season} />
      <SkyDome season={season} timeOfDay={timeOfDay} />
      <CelestialBody timeOfDay={timeOfDay} season={season} />
      <CameraController isIsometric={isIsometric} focusTarget={focusTarget} gardenLength={config.length} gardenWidth={config.width} />

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enablePan
        enableZoom
        enableRotate
        minDistance={1.5}
        maxDistance={Math.max(12, Math.max(config.length, config.width) * 2.5)}
        maxPolarAngle={Math.PI / 2.1}
        minPolarAngle={0.15}
        target={[0, 0, 0]}
        // Pan boundaries
        onChange={() => {
          if (controlsRef.current) {
            const target = controlsRef.current.target;
            // Allow panning further to see raised beds placed outside the garden
            const panMargin = Math.max(config.length, config.width) * 0.8;
            target.x = Math.max(-halfL - panMargin, Math.min(halfL + panMargin, target.x));
            target.z = Math.max(-halfW - panMargin, Math.min(halfW + panMargin, target.z));
            target.y = Math.max(-0.5, Math.min(3, target.y));
          }
        }}
        enableDamping
        dampingFactor={0.08}
        // Touch controls for mobile
        touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
        // Smooth zoom
        zoomSpeed={0.8}
        rotateSpeed={0.6}
        panSpeed={0.8}
      />

      {/* Soft fog for depth -- warm tones */}
      <fog attach="fog" args={[
        timeOfDay === 'evening' ? '#1E2040' : season === 'winter' ? '#D8E0E8' : season === 'autumn' ? '#E0D8C8' : '#D0ECD0',
        12,
        45,
      ]} />

      {/* Terrain */}
      <GardenTerrain
        length={config.length}
        width={config.width}
        soilType={config.soilType}
        plantPositions={config.plantedItems.map((item) => ({ x: item.x, z: item.z }))}
        season={season}
        showGrid={isPlacementMode}
        gridSpacingCm={selectedPlantSpacingCm}
        onGroundClick={(cx, cz) => onGroundClick(cx, cz)}
      />

      {/* Plants */}
      {config.plantedItems.map((item, index) => {
        const plantData = plants.find((p) => p.id === item.plantId);
        if (!plantData) return null;

        const worldX = -halfL + (item.x / 100) * config.length;
        const worldZ = -halfW + (item.z / 100) * config.width;

        // Elevate plant if inside a raised bed
        let yOffset = 0;
        if (item.raisedBedId) {
          const bed = (config.raisedBeds || []).find((b) => b.id === item.raisedBedId);
          if (bed) {
            yOffset = bed.heightM - 0.02; // Place plant on top of bed soil
          }
        }

        return (
          <Plant3D
            key={`plant-${index}`}
            plant={plantData}
            position={[worldX, yOffset, worldZ]}
            plantedDate={item.plantedDate}
            isSelected={selectedPlantIndex === index}
            isWatering={activeTool === 'water' && selectedPlantIndex === index}
            onSelect={() =>
              onSelectPlant(selectedPlantIndex === index ? null : index)
            }
            onContextMenu={(e) => onRightClickPlant(index, e)}
          />
        );
      })}

      {/* Plant spacing visualization */}
      <PlantSpacingRings
        config={config}
        plants={plants}
        showSpacing={showSpacing}
        selectedPlantType={isPlacementMode ? selectedPlantType : null}
      />

      {/* Garden dimension labels in 3D */}
      <GardenDimensionLabels length={config.length} width={config.width} />

      {/* Raised beds */}
      {(config.raisedBeds || []).map((bed) => (
        <RaisedBed3D
          key={bed.id}
          bed={bed}
          gardenLength={config.length}
          gardenWidth={config.width}
          isSelected={selectedBedId === bed.id}
          onSelect={() => onSelectBed(selectedBedId === bed.id ? null : bed.id)}
        />
      ))}

      {/* Planting zones (in-ground) */}
      {(config.zones || []).map((zone) => (
        <Zone3D
          key={zone.id}
          zone={zone}
          gardenLength={config.length}
          gardenWidth={config.width}
          isSelected={selectedZoneId === zone.id}
          onSelect={() => onSelectZone(selectedZoneId === zone.id ? null : zone.id)}
          plantCount={config.plantedItems.filter((p) => p.zoneId === zone.id).length}
        />
      ))}

      {/* Ground click handler for placement */}
      <GroundClickHandler
        config={config}
        isPlacementMode={isPlacementMode}
        onGroundClick={onGroundClick}
      />

      {/* Gardener character */}
      <GardenerCharacter
        position={[halfL + 0.5, 0, 0]}
        gardenBounds={{ halfL, halfW }}
        dialogue={gardenerDialogue}
        showDialogue={showGardenerDialogue}
        onAdviceRequest={onGardenerClick}
        onDialogueClose={onDialogueClose}
        walkToTarget={gardenerTarget}
        currentAction={gardenerAction}
      />

      {/* Weather effects (rain, snow, sun rays, wind) */}
      <WeatherSystem
        season={season}
        timeOfDay={timeOfDay}
        gardenLength={config.length}
        gardenWidth={config.width}
        weather={weather}
      />

      {/* Seasonal particle effects (fireflies, falling leaves) */}
      <SeasonalParticles
        season={season}
        timeOfDay={timeOfDay}
        gardenLength={config.length}
        gardenWidth={config.width}
      />

      {/* Flying birds in the sky */}
      <FlyingBirds gardenLength={config.length} gardenWidth={config.width} />

      {/* Decorations */}
      <GardenDecorations
        gardenLength={config.length}
        gardenWidth={config.width}
        season={season}
      />

      {/* Click-away deselect */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.02, 0]}
        onClick={() => {
          if (!isPlacementMode) onSelectPlant(null);
        }}
        visible={false}
      >
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </>
  );
}

// Get weather based on season (shared with overlay)
function getWeather(season: string): string {
  const hour = new Date().getHours();
  if (season === 'winter') return hour % 3 === 0 ? 'Snowy' : 'Overcast';
  if (season === 'spring') return hour % 4 === 0 ? 'Light Rain' : 'Partly Cloudy';
  if (season === 'autumn') return hour % 3 === 0 ? 'Cloudy' : 'Breezy';
  const states = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Clear'];
  return states[hour % states.length];
}

export function GardenScene({ config, selectedPlantType: externalSelectedPlantType, showSpacing: externalShowSpacing = true, selectedBedId: externalSelectedBedId = null, onSelectBed: externalOnSelectBed, selectedZoneId: externalSelectedZoneId = null, onSelectZone: externalOnSelectZone }: GardenSceneProps) {
  const [selectedPlantIndex, setSelectedPlantIndex] = useState<number | null>(null);
  const [isIsometric, setIsIsometric] = useState(false);
  const [gardenerDialogue, setGardenerDialogue] = useState('');
  const [showGardenerDialogue, setShowGardenerDialogue] = useState(false);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [isPlacementMode, setIsPlacementMode] = useState(false);
  const [selectedPlantType, setSelectedPlantType] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    index: number;
    x: number;
    y: number;
  } | null>(null);
  const [gardenerTarget, setGardenerTarget] = useState<THREE.Vector3 | null>(null);
  const [gardenerAction, setGardenerAction] = useState<'idle' | 'walking' | 'watering' | 'digging' | 'harvesting' | 'pointing' | 'celebrating'>('idle');
  const [focusTarget, setFocusTarget] = useState<THREE.Vector3 | null>(null);

  const season = useMemo(() => getSeason(), []);
  const timeOfDay = useMemo(() => getTimeOfDay(), []);
  const weather = useMemo(() => getWeather(season), [season]);

  // Sync external plant type selection from sidebar
  useEffect(() => {
    if (externalSelectedPlantType) {
      setSelectedPlantType(externalSelectedPlantType);
      setIsPlacementMode(true);
    }
  }, [externalSelectedPlantType]);

  // Load plants data
  useEffect(() => {
    import('@/data/plants.json').then((mod) => {
      setPlants(mod.default as Plant[]);
    });
  }, []);

  // Show greeting on mount
  useEffect(() => {
    const greeting = getSeasonalDialogue();
    setGardenerDialogue(greeting);
    setShowGardenerDialogue(true);

    const timer = setTimeout(() => {
      setShowGardenerDialogue(false);
    }, 8000);

    return () => clearTimeout(timer);
  }, []);

  // When a plant is selected, move camera focus, send gardener there, and open info panel
  useEffect(() => {
    if (selectedPlantIndex !== null) {
      const item = config.plantedItems[selectedPlantIndex];
      if (item) {
        const halfL = config.length / 2;
        const halfW = config.width / 2;
        const worldX = -halfL + (item.x / 100) * config.length;
        const worldZ = -halfW + (item.z / 100) * config.width;
        setFocusTarget(new THREE.Vector3(worldX, 0, worldZ));
        setGardenerTarget(new THREE.Vector3(worldX + 0.3, 0, worldZ + 0.3));
        setGardenerAction('walking');

        // Open the plant info panel automatically when a plant is clicked
        const infoEvent = new CustomEvent('garden:info', {
          detail: { index: selectedPlantIndex },
        });
        window.dispatchEvent(infoEvent);

        // After walking, switch to pointing at the plant
        const pointTimer = setTimeout(() => {
          setGardenerAction('pointing');
        }, 1500);

        // Check if this plant is harvest-ready for celebration
        const plantData = plants.find((p) => p.id === item.plantId);
        if (plantData) {
          const now = new Date();
          const planted = new Date(item.plantedDate);
          const daysPassed = Math.floor(
            (now.getTime() - planted.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysPassed >= plantData.harvestDays) {
            const celebrateTimer = setTimeout(() => {
              setGardenerAction('celebrating');
              setGardenerDialogue('This one is ready to harvest! Great work!');
              setShowGardenerDialogue(true);
            }, 2500);
            return () => {
              clearTimeout(pointTimer);
              clearTimeout(celebrateTimer);
            };
          }
        }

        return () => clearTimeout(pointTimer);
      }
    } else {
      setFocusTarget(null);
      setGardenerAction('idle');
    }
  }, [selectedPlantIndex, config, plants]);

  const handleGardenerClick = useCallback(() => {
    const advice = getRandomAdvice();
    setGardenerDialogue(advice);
    setShowGardenerDialogue(true);
  }, []);

  const handleDialogueClose = useCallback(() => {
    setShowGardenerDialogue(false);
  }, []);

  const handleIsometricToggle = useCallback(() => {
    setIsIsometric((prev) => !prev);
  }, []);

  const handleToolSelect = useCallback((tool: string | null) => {
    setActiveTool(tool);
    SoundEffects.play('click');
    if (tool === 'plant') {
      setIsPlacementMode(true);
    } else {
      setIsPlacementMode(false);
    }
    if (tool === 'water' && selectedPlantIndex !== null) {
      setGardenerAction('watering');
      SoundEffects.play('water');
      setGardenerDialogue('Watering time! Plants love a good drink.');
      setShowGardenerDialogue(true);
    } else if (tool === 'harvest' && selectedPlantIndex !== null) {
      setGardenerAction('harvesting');
      SoundEffects.play('harvest');
      // Celebrate after harvest animation
      setTimeout(() => {
        setGardenerAction('celebrating');
        setGardenerDialogue('Great harvest! Your garden is producing well!');
        setShowGardenerDialogue(true);
      }, 2000);
    } else if (tool === 'info' && selectedPlantIndex !== null) {
      setGardenerAction('pointing');
      // Dispatch info event for the plant info panel
      const event = new CustomEvent('garden:info', {
        detail: { index: selectedPlantIndex },
      });
      window.dispatchEvent(event);
    }
  }, [selectedPlantIndex]);

  const handleGroundClick = useCallback((pctX: number, pctZ: number) => {
    if (isPlacementMode && selectedPlantType) {
      const halfL = config.length / 2;
      const halfW = config.width / 2;

      // Snap to 30cm grid cell centers
      const cellPctX = (0.3 / config.length) * 100;
      const cellPctZ = (0.3 / config.width) * 100;
      const snappedPctX = Math.round(pctX / cellPctX) * cellPctX;
      const snappedPctZ = Math.round(pctZ / cellPctZ) * cellPctZ;

      // Use snapped coordinates
      const worldX = -halfL + (snappedPctX / 100) * config.length;
      const worldZ = -halfW + (snappedPctZ / 100) * config.width;
      // Override pctX/pctZ with snapped values for the rest of the function
      const pctXFinal = snappedPctX;
      const pctZFinal = snappedPctZ;

      // Enforce minimum spacing rules
      const newPlantData = plants.find((p) => p.id === selectedPlantType);
      if (newPlantData) {
        const newSpacingM = newPlantData.spacingCm / 100;
        let tooClose = false;
        for (const existing of config.plantedItems) {
          const existingPlant = plants.find((p) => p.id === existing.plantId);
          if (!existingPlant) continue;
          const existingX = -halfL + (existing.x / 100) * config.length;
          const existingZ = -halfW + (existing.z / 100) * config.width;
          const dist = Math.sqrt((worldX - existingX) ** 2 + (worldZ - existingZ) ** 2);
          const minDist = (newSpacingM + existingPlant.spacingCm / 100) / 2;
          if (dist < minDist) {
            tooClose = true;
            break;
          }
        }
        if (tooClose) {
          setGardenerDialogue(`Too close! ${newPlantData.name.en} needs ${newPlantData.spacingCm}cm spacing.`);
          setShowGardenerDialogue(true);
          SoundEffects.play('click');
          return;
        }
      }

      // Check if this click lands inside a raised bed (including outside-garden beds)
      let raisedBedId: string | undefined;
      (config.raisedBeds || []).forEach((bed) => {
        const bedWorldX = -halfL + (bed.x / 100) * config.length;
        const bedWorldZ = -halfW + (bed.z / 100) * config.width;
        if (
          worldX >= bedWorldX - bed.lengthM / 2 &&
          worldX <= bedWorldX + bed.lengthM / 2 &&
          worldZ >= bedWorldZ - bed.widthM / 2 &&
          worldZ <= bedWorldZ + bed.widthM / 2
        ) {
          raisedBedId = bed.id;
        }
      });

      // Check if this click lands inside a planting zone
      let zoneId: string | undefined;
      (config.zones || []).forEach((zone) => {
        const zoneWorldX = -halfL + (zone.x / 100) * config.length;
        const zoneWorldZ = -halfW + (zone.z / 100) * config.width;
        if (
          worldX >= zoneWorldX - zone.lengthM / 2 &&
          worldX <= zoneWorldX + zone.lengthM / 2 &&
          worldZ >= zoneWorldZ - zone.widthM / 2 &&
          worldZ <= zoneWorldZ + zone.widthM / 2
        ) {
          zoneId = zone.id;
        }
      });

      // Check if click is inside the garden bounds or inside a container (bed/zone)
      const isInsideGarden = pctXFinal >= 0 && pctXFinal <= 100 && pctZFinal >= 0 && pctZFinal <= 100;
      if (!isInsideGarden && !raisedBedId && !zoneId) {
        // Don't allow planting in empty ground outside the garden
        setGardenerDialogue('You can only plant in the garden or inside a raised bed!');
        setShowGardenerDialogue(true);
        SoundEffects.play('click');
        return;
      }

      // Dispatch custom event for plant placement (will be handled by parent)
      const event = new CustomEvent('garden:plant', {
        detail: { plantId: selectedPlantType, x: pctXFinal, z: pctZFinal, raisedBedId, zoneId },
      });
      window.dispatchEvent(event);
      SoundEffects.play('plant');
      setGardenerAction('digging');
      setGardenerTarget(new THREE.Vector3(worldX + 0.3, 0, worldZ + 0.3));
    }
  }, [isPlacementMode, selectedPlantType, config, plants]);

  const handleRightClickPlant = useCallback((index: number, event: MouseEvent) => {
    event.preventDefault();
    setContextMenu({ index, x: event.clientX, y: event.clientY });
    setSelectedPlantIndex(index);
  }, []);

  const handleRemoveSelectedPlant = useCallback(() => {
    if (selectedPlantIndex !== null) {
      const event = new CustomEvent('garden:remove', {
        detail: { index: selectedPlantIndex },
      });
      window.dispatchEvent(event);
      setSelectedPlantIndex(null);
    }
    setContextMenu(null);
  }, [selectedPlantIndex]);

  const handleTogglePlacement = useCallback(() => {
    setIsPlacementMode((prev) => !prev);
  }, []);

  // Count harvest-ready plants
  const harvestReadyCount = useMemo(() => {
    return config.plantedItems.filter((item) => {
      const plant = plants.find((p) => p.id === item.plantId);
      if (!plant) return false;
      const now = new Date();
      const planted = new Date(item.plantedDate);
      const daysPassed = Math.floor(
        (now.getTime() - planted.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysPassed >= plant.harvestDays;
    }).length;
  }, [config.plantedItems, plants]);

  // Garden health score (0-100)
  const gardenHealth = useMemo(() => {
    if (config.plantedItems.length === 0) return 100;
    let score = 0;
    config.plantedItems.forEach((item) => {
      const plant = plants.find((p) => p.id === item.plantId);
      if (!plant) return;
      const now = new Date();
      const planted = new Date(item.plantedDate);
      const daysPassed = Math.floor(
        (now.getTime() - planted.getTime()) / (1000 * 60 * 60 * 24)
      );
      const progress = Math.min(daysPassed / plant.harvestDays, 1);
      // Good progress + not overdue
      if (daysPassed <= plant.harvestDays * 1.3) {
        score += 80 + progress * 20;
      } else {
        score += 50;
      }
    });
    return Math.round(score / config.plantedItems.length);
  }, [config.plantedItems, plants]);

  // Task count
  const taskCount = useMemo(() => {
    const hour = new Date().getHours();
    const wateringTasks = config.plantedItems.filter((item) => {
      const plant = plants.find((p) => p.id === item.plantId);
      if (!plant) return false;
      if (plant.wateringFrequency === 'daily') return hour > 14;
      if (plant.wateringFrequency === 'every-2-days') return hour > 16;
      return false;
    }).length;
    return wateringTasks + harvestReadyCount;
  }, [config.plantedItems, plants, harvestReadyCount]);

  // Prevent browser context menu on the canvas
  const canvasRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const handler = (e: Event) => e.preventDefault();
    el.addEventListener('contextmenu', handler);
    return () => el.removeEventListener('contextmenu', handler);
  }, []);

  return (
    <div ref={canvasRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        shadows="soft"
        camera={{
          position: [
            Math.max(3, config.length * 0.7),
            Math.max(4, Math.max(config.length, config.width) * 0.9),
            Math.max(4, config.width * 0.9),
          ],
          fov: 38,
          near: 0.1,
          far: 100,
        }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.35,
        }}
        style={{ background: 'transparent' }}
      >
        <SceneContent
          config={config}
          selectedPlantIndex={selectedPlantIndex}
          onSelectPlant={setSelectedPlantIndex}
          onRightClickPlant={handleRightClickPlant}
          season={season}
          timeOfDay={timeOfDay}
          gardenerDialogue={gardenerDialogue}
          showGardenerDialogue={showGardenerDialogue}
          onGardenerClick={handleGardenerClick}
          onDialogueClose={handleDialogueClose}
          isIsometric={isIsometric}
          plants={plants}
          activeTool={activeTool}
          isPlacementMode={isPlacementMode}
          onGroundClick={handleGroundClick}
          gardenerTarget={gardenerTarget}
          gardenerAction={gardenerAction}
          focusTarget={focusTarget}
          weather={weather}
          showSpacing={externalShowSpacing}
          selectedBedId={externalSelectedBedId}
          onSelectBed={externalOnSelectBed || (() => {})}
          selectedZoneId={externalSelectedZoneId}
          onSelectZone={externalOnSelectZone || (() => {})}
          selectedPlantType={selectedPlantType}
        />
      </Canvas>

      {/* Context menu overlay */}
      {contextMenu && (
        <PlantContextMenu
          position={{ x: contextMenu.x, y: contextMenu.y }}
          plantName={
            plants.find(
              (p) =>
                p.id === config.plantedItems[contextMenu.index]?.plantId
            )?.name.en || 'Plant'
          }
          onWater={() => {
            setActiveTool('water');
            setGardenerAction('watering');
            setContextMenu(null);
          }}
          onRemove={handleRemoveSelectedPlant}
          onInfo={() => {
            setSelectedPlantIndex(contextMenu.index);
            // Dispatch info event for the plant info panel
            const event = new CustomEvent('garden:info', {
              detail: { index: contextMenu.index },
            });
            window.dispatchEvent(event);
            setContextMenu(null);
          }}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* UI Overlay */}
      <GardenUIOverlay
        season={season}
        timeOfDay={timeOfDay}
        taskCount={taskCount}
        dialogue={gardenerDialogue}
        showDialogue={showGardenerDialogue}
        onDialogueClose={handleDialogueClose}
        onIsometricToggle={handleIsometricToggle}
        isIsometric={isIsometric}
        plantCount={config.plantedItems.length}
        harvestReadyCount={harvestReadyCount}
        activeTool={activeTool}
        onToolSelect={handleToolSelect}
        plants={plants}
        selectedPlantType={selectedPlantType}
        onSelectPlantType={setSelectedPlantType}
        isPlacementMode={isPlacementMode}
        onTogglePlacement={handleTogglePlacement}
        onRemoveSelectedPlant={handleRemoveSelectedPlant}
        selectedPlantIndex={selectedPlantIndex}
        gardenHealth={gardenHealth}
      />
    </div>
  );
}
