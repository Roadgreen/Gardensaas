'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ===== Rain Particle System =====
export function RainEffect({
  intensity = 1,
  gardenLength,
  gardenWidth,
}: {
  intensity?: number;
  gardenLength: number;
  gardenWidth: number;
}) {
  const ref = useRef<THREE.Group>(null);
  const count = Math.floor(120 * intensity);

  const drops = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: (Math.random() - 0.5) * (gardenLength + 8),
        z: (Math.random() - 0.5) * (gardenWidth + 8),
        speed: 4 + Math.random() * 3,
        offset: Math.random() * 6,
        windDrift: (Math.random() - 0.5) * 0.3,
      })),
    [count, gardenLength, gardenWidth]
  );

  useFrame(() => {
    if (!ref.current) return;
    const t = performance.now() * 0.001;
    ref.current.children.forEach((child, i) => {
      const d = drops[i];
      if (!d) return;
      const mesh = child as THREE.Mesh;
      const phase = ((t * d.speed + d.offset) % 5) / 5;
      mesh.position.x = d.x + t * d.windDrift;
      mesh.position.y = 6 - phase * 7;
      mesh.position.z = d.z;
      const fade = mesh.position.y > 0 ? 0.5 : Math.max(0, 0.5 + mesh.position.y * 0.2);
      (mesh.material as THREE.MeshBasicMaterial).opacity = fade;
    });
  });

  return (
    <group ref={ref}>
      {drops.map((d, i) => (
        <mesh key={`rain-${i}`} position={[d.x, 5, d.z]} rotation={[0, 0, 0.1]}>
          <cylinderGeometry args={[0.003, 0.003, 0.15, 3]} />
          <meshBasicMaterial color="#93C5FD" transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

// ===== Rain Splash Effect (puddle ripples on ground) =====
export function RainSplashes({
  gardenLength,
  gardenWidth,
}: {
  gardenLength: number;
  gardenWidth: number;
}) {
  const ref = useRef<THREE.Group>(null);
  const count = 20;

  const splashes = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: (Math.random() - 0.5) * gardenLength,
        z: (Math.random() - 0.5) * gardenWidth,
        speed: 1.5 + Math.random() * 2,
        offset: Math.random() * Math.PI * 2,
      })),
    [gardenLength, gardenWidth]
  );

  useFrame(() => {
    if (!ref.current) return;
    const t = performance.now() * 0.001;
    ref.current.children.forEach((child, i) => {
      const s = splashes[i];
      if (!s) return;
      const mesh = child as THREE.Mesh;
      const phase = ((t * s.speed + s.offset) % 1);
      mesh.scale.setScalar(0.02 + phase * 0.08);
      (mesh.material as THREE.MeshBasicMaterial).opacity = (1 - phase) * 0.4;
    });
  });

  return (
    <group ref={ref}>
      {splashes.map((s, i) => (
        <mesh
          key={`splash-${i}`}
          position={[s.x, 0.06, s.z]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.8, 1, 8]} />
          <meshBasicMaterial color="#93C5FD" transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

// ===== Sun Rays (Volumetric light shafts) =====
export function SunRays({ season }: { season: string }) {
  const ref = useRef<THREE.Group>(null);
  const rayCount = 5;

  const rays = useMemo(
    () =>
      Array.from({ length: rayCount }, (_, i) => ({
        x: (i - 2) * 2.5 + (Math.random() - 0.5) * 1.5,
        z: (Math.random() - 0.5) * 3,
        width: 0.3 + Math.random() * 0.5,
        offset: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.2,
      })),
    []
  );

  const rayColor = season === 'autumn' ? '#FFE0B2' : season === 'winter' ? '#E3F2FD' : '#FFF9C4';

  useFrame(() => {
    if (!ref.current) return;
    const t = performance.now() * 0.001;
    ref.current.children.forEach((child, i) => {
      const r = rays[i];
      if (!r) return;
      const mesh = child as THREE.Mesh;
      const pulse = (Math.sin(t * r.speed + r.offset) + 1) / 2;
      (mesh.material as THREE.MeshBasicMaterial).opacity = 0.03 + pulse * 0.06;
      mesh.position.x = r.x + Math.sin(t * 0.1 + r.offset) * 0.5;
    });
  });

  return (
    <group ref={ref}>
      {rays.map((r, i) => (
        <mesh
          key={`ray-${i}`}
          position={[r.x, 4, r.z]}
          rotation={[0, 0, 0.15 + i * 0.05]}
        >
          <planeGeometry args={[r.width, 10]} />
          <meshBasicMaterial
            color={rayColor}
            transparent
            opacity={0.05}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

// ===== Snow Particles =====
export function SnowEffect({
  gardenLength,
  gardenWidth,
}: {
  gardenLength: number;
  gardenWidth: number;
}) {
  const ref = useRef<THREE.Group>(null);
  const count = 80;

  const flakes = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: (Math.random() - 0.5) * (gardenLength + 10),
        z: (Math.random() - 0.5) * (gardenWidth + 10),
        speed: 0.3 + Math.random() * 0.5,
        swaySpeed: 0.5 + Math.random() * 1,
        swayAmount: 0.2 + Math.random() * 0.4,
        offset: Math.random() * Math.PI * 2,
        size: 0.01 + Math.random() * 0.02,
      })),
    [gardenLength, gardenWidth]
  );

  useFrame(() => {
    if (!ref.current) return;
    const t = performance.now() * 0.001;
    ref.current.children.forEach((child, i) => {
      const f = flakes[i];
      if (!f) return;
      const mesh = child as THREE.Mesh;
      const fallPhase = ((t * f.speed + f.offset) % 4) / 4;
      mesh.position.x = f.x + Math.sin(t * f.swaySpeed + f.offset) * f.swayAmount;
      mesh.position.y = 5 - fallPhase * 6;
      mesh.position.z = f.z + Math.cos(t * f.swaySpeed * 0.7 + f.offset) * f.swayAmount * 0.5;
      mesh.rotation.x = t * f.swaySpeed;
      mesh.rotation.z = t * f.swaySpeed * 0.7;
      const fade = mesh.position.y > 0 ? 0.8 : Math.max(0, 0.8 + mesh.position.y * 0.3);
      (mesh.material as THREE.MeshBasicMaterial).opacity = fade;
    });
  });

  return (
    <group ref={ref}>
      {flakes.map((f, i) => (
        <mesh key={`snow-${i}`} position={[f.x, 4, f.z]}>
          <sphereGeometry args={[f.size, 4, 3]} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={0.8} />
        </mesh>
      ))}
    </group>
  );
}

// ===== Moving Clouds (enhanced) =====
export function WeatherClouds({
  season,
  isDark,
}: {
  season: string;
  isDark: boolean;
}) {
  const ref = useRef<THREE.Group>(null);

  const clouds = useMemo(() => {
    const isRainy = season === 'spring' || season === 'winter';
    const count = isRainy ? 6 : 3;
    return Array.from({ length: count }, (_, i) => ({
      x: (i - count / 2) * 5 + (Math.random() - 0.5) * 3,
      y: 10 + Math.random() * 4,
      z: -5 + (Math.random() - 0.5) * 6,
      scale: 0.6 + Math.random() * 0.8,
      speed: 0.15 + Math.random() * 0.2,
      offset: Math.random() * 100,
    }));
  }, [season]);

  const cloudColor = isDark ? '#4A5568' : season === 'winter' ? '#B0BEC5' : '#ECEFF1';

  useFrame(() => {
    if (!ref.current) return;
    const t = performance.now() * 0.001;
    ref.current.children.forEach((child, i) => {
      const c = clouds[i];
      if (!c) return;
      const group = child as THREE.Group;
      group.position.x = c.x + Math.sin(t * c.speed + c.offset) * 3;
      group.position.z = c.z + Math.cos(t * c.speed * 0.5 + c.offset) * 1;
    });
  });

  return (
    <group ref={ref}>
      {clouds.map((c, i) => (
        <group key={`wcloud-${i}`} position={[c.x, c.y, c.z]} scale={c.scale}>
          <mesh>
            <sphereGeometry args={[1.2, 6, 4]} />
            <meshStandardMaterial color={cloudColor} transparent opacity={0.75} />
          </mesh>
          <mesh position={[1, -0.1, 0]}>
            <sphereGeometry args={[0.9, 6, 4]} />
            <meshStandardMaterial color={cloudColor} transparent opacity={0.75} />
          </mesh>
          <mesh position={[-0.8, -0.15, 0.2]}>
            <sphereGeometry args={[0.8, 6, 4]} />
            <meshStandardMaterial color={cloudColor} transparent opacity={0.75} />
          </mesh>
          <mesh position={[0.4, 0.35, -0.15]}>
            <sphereGeometry args={[0.65, 6, 4]} />
            <meshStandardMaterial color={cloudColor} transparent opacity={0.75} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ===== Wind Effect (grass/particle movement indicator) =====
export function WindParticles({
  gardenLength,
  gardenWidth,
  strength = 0.5,
}: {
  gardenLength: number;
  gardenWidth: number;
  strength?: number;
}) {
  const ref = useRef<THREE.Group>(null);
  const count = Math.floor(15 * strength);

  const particles = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: (Math.random() - 0.5) * (gardenLength + 4),
        z: (Math.random() - 0.5) * (gardenWidth + 4),
        y: 0.1 + Math.random() * 0.8,
        speed: 2 + Math.random() * 2,
        offset: Math.random() * Math.PI * 2,
        length: 0.05 + Math.random() * 0.1,
      })),
    [count, gardenLength, gardenWidth]
  );

  useFrame(() => {
    if (!ref.current) return;
    const t = performance.now() * 0.001;
    ref.current.children.forEach((child, i) => {
      const p = particles[i];
      if (!p) return;
      const mesh = child as THREE.Mesh;
      const phase = ((t * p.speed + p.offset) % 3) / 3;
      mesh.position.x = p.x + phase * (gardenLength + 4) - (gardenLength + 4) / 2;
      mesh.position.y = p.y + Math.sin(t * 2 + p.offset) * 0.1;
      mesh.position.z = p.z + Math.sin(t * 0.5 + p.offset) * 0.3;
      const fade = phase < 0.1 ? phase / 0.1 : phase > 0.9 ? (1 - phase) / 0.1 : 1;
      (mesh.material as THREE.MeshBasicMaterial).opacity = fade * 0.25;
    });
  });

  return (
    <group ref={ref}>
      {particles.map((p, i) => (
        <mesh key={`wind-${i}`} position={[p.x, p.y, p.z]} rotation={[0, 0, Math.PI / 2]}>
          <planeGeometry args={[p.length, 0.003]} />
          <meshBasicMaterial
            color="#FFFFFF"
            transparent
            opacity={0.2}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

// ===== Weather System Controller =====
export function WeatherSystem({
  season,
  timeOfDay,
  gardenLength,
  gardenWidth,
  weather,
}: {
  season: string;
  timeOfDay: string;
  gardenLength: number;
  gardenWidth: number;
  weather: string;
}) {
  const isRaining = weather === 'Light Rain' || weather === 'Rainy';
  const isSnowing = weather === 'Snowy';
  const isSunny = weather === 'Sunny' || weather === 'Clear';
  const isCloudy = weather === 'Cloudy' || weather === 'Overcast' || weather === 'Partly Cloudy';
  const isWindy = weather === 'Breezy' || season === 'autumn';
  const isDark = timeOfDay === 'evening';

  return (
    <group>
      {/* Rain */}
      {isRaining && (
        <>
          <RainEffect
            intensity={1}
            gardenLength={gardenLength}
            gardenWidth={gardenWidth}
          />
          <RainSplashes gardenLength={gardenLength} gardenWidth={gardenWidth} />
        </>
      )}

      {/* Snow */}
      {isSnowing && (
        <SnowEffect gardenLength={gardenLength} gardenWidth={gardenWidth} />
      )}

      {/* Sun rays */}
      {isSunny && !isDark && <SunRays season={season} />}

      {/* Clouds */}
      {(isCloudy || isRaining || isSnowing) && (
        <WeatherClouds season={season} isDark={isDark} />
      )}

      {/* Wind particles */}
      {isWindy && (
        <WindParticles
          gardenLength={gardenLength}
          gardenWidth={gardenWidth}
          strength={season === 'autumn' ? 0.8 : 0.5}
        />
      )}
    </group>
  );
}
