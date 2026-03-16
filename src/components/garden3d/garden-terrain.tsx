'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  createGrassTexture,
  createSoilTexture,
  createWoodTexture,
  createStoneTexture,
  createAOGroundTexture,
  getCachedTexture,
} from './procedural-textures';

interface GardenTerrainProps {
  length: number;
  width: number;
  soilType: string;
  plantPositions: Array<{ x: number; z: number }>;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  onGroundClick?: (x: number, z: number) => void;
  showGrid?: boolean;
  gridSpacingCm?: number; // plant-specific grid spacing
}

const SOIL_COLORS: Record<string, string> = {
  clay: '#9A7020',
  sandy: '#D0B878',
  loamy: '#6B4828',
  silty: '#887050',
  peaty: '#483828',
  chalky: '#B8AE98',
};

// Warmer, more inviting greens -- Animal Crossing / Stardew Valley palette
const SEASON_GRASS: Record<string, string> = {
  spring: '#88D860',
  summer: '#68C040',
  autumn: '#C8B048',
  winter: '#D8DCC8',
};

const SEASON_GRASS_DARK: Record<string, string> = {
  spring: '#60C038',
  summer: '#50A030',
  autumn: '#A89838',
  winter: '#C0C4B0',
};

export function GardenTerrain({ length, width, soilType, plantPositions, season, onGroundClick, showGrid, gridSpacingCm }: GardenTerrainProps) {
  const grassColor = SEASON_GRASS[season];
  const grassDark = SEASON_GRASS_DARK[season];
  const soilColor = SOIL_COLORS[soilType] || SOIL_COLORS.loamy;

  const halfL = length / 2;
  const halfW = width / 2;

  // Procedural textures (created once, cached)
  const [texReady, setTexReady] = useState(false);
  const grassTexRef = useRef<THREE.CanvasTexture | null>(null);
  const soilTexRef = useRef<THREE.CanvasTexture | null>(null);
  const woodTexRef = useRef<THREE.CanvasTexture | null>(null);
  const stoneTexRef = useRef<THREE.CanvasTexture | null>(null);
  const aoTexRef = useRef<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    // Generate textures on the client only
    grassTexRef.current = getCachedTexture(`grass-${season}`, () => createGrassTexture(grassColor, grassDark, season));
    grassTexRef.current.repeat.set(Math.max(1, length / 2), Math.max(1, width / 2));
    soilTexRef.current = getCachedTexture(`soil-${soilType}`, () => createSoilTexture(soilColor, '#3A2510'));
    soilTexRef.current.repeat.set(Math.max(1, length), Math.max(1, width));
    woodTexRef.current = getCachedTexture('wood', () => createWoodTexture());
    stoneTexRef.current = getCachedTexture('stone', () => createStoneTexture());
    aoTexRef.current = getCachedTexture('ao-ground', () => createAOGroundTexture());
    setTexReady(true);
  }, [season, soilType, grassColor, grassDark, soilColor, length, width]);

  // Create terrain geometry with subtle hills for the surrounding area
  const hillGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(length + 12, width + 12, 32, 32);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      // Only add hills outside the garden area
      const insideGarden = Math.abs(x) < halfL + 0.5 && Math.abs(y) < halfW + 0.5;
      if (!insideGarden) {
        const dist = Math.max(0, Math.max(Math.abs(x) - halfL, Math.abs(y) - halfW));
        const hillHeight = Math.sin(x * 0.8) * Math.cos(y * 0.6) * 0.15 +
          Math.sin(x * 1.5 + 1) * Math.sin(y * 1.2 + 2) * 0.08;
        pos.setZ(i, hillHeight * Math.min(dist * 0.5, 1));
      }
    }
    geo.computeVertexNormals();
    return geo;
  }, [length, width, halfL, halfW]);

  // Grass tufts
  const grassTufts = useMemo(() => {
    const tufts: Array<{ x: number; z: number; scale: number; rotation: number; shade: number }> = [];
    const count = Math.min(Math.floor(length * width * 12), 400);
    const rng = (seed: number) => {
      const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
      return x - Math.floor(x);
    };
    for (let i = 0; i < count; i++) {
      const x = (rng(i * 2.1) - 0.5) * (length + 6);
      const z = (rng(i * 3.7 + 5) - 0.5) * (width + 6);
      const insideGarden = Math.abs(x) < halfL - 0.1 && Math.abs(z) < halfW - 0.1;
      if (!insideGarden) {
        tufts.push({
          x,
          z,
          scale: 0.03 + rng(i * 5.3) * 0.06,
          rotation: rng(i * 7.1) * Math.PI * 2,
          shade: rng(i * 11.3),
        });
      }
    }
    return tufts;
  }, [length, width, halfL, halfW]);

  // Dirt patch circles where plants go
  const dirtPatches = useMemo(() => {
    return plantPositions.map((pos) => {
      const worldX = -halfL + (pos.x / 100) * length;
      const worldZ = -halfW + (pos.z / 100) * width;
      return { x: worldX, z: worldZ };
    });
  }, [plantPositions, halfL, halfW, length, width]);

  // Fence configuration
  const fencePosts = useMemo(() => {
    const posts: Array<{ x: number; z: number; isCorner: boolean }> = [];
    const fL = halfL + 0.4;
    const fW = halfW + 0.4;
    const spacing = 0.7;

    // All 4 edges
    for (let x = -fL; x <= fL + 0.01; x += spacing) {
      posts.push({ x: Math.min(x, fL), z: -fW, isCorner: false });
      posts.push({ x: Math.min(x, fL), z: fW, isCorner: false });
    }
    for (let z = -fW + spacing; z < fW; z += spacing) {
      posts.push({ x: -fL, z, isCorner: false });
      posts.push({ x: fL, z, isCorner: false });
    }
    // Corners
    [
      { x: -fL, z: -fW },
      { x: fL, z: -fW },
      { x: -fL, z: fW },
      { x: fL, z: fW },
    ].forEach((c) => posts.push({ ...c, isCorner: true }));

    return posts;
  }, [halfL, halfW]);

  const fenceRails = useMemo(() => {
    const fL = halfL + 0.4;
    const fW = halfW + 0.4;
    return [
      { x: 0, z: -fW, rotY: 0, len: length + 0.8 },
      { x: 0, z: fW, rotY: 0, len: length + 0.8 },
      { x: -fL, z: 0, rotY: Math.PI / 2, len: width + 0.8 },
      { x: fL, z: 0, rotY: Math.PI / 2, len: width + 0.8 },
    ];
  }, [halfL, halfW, length, width]);

  // Seasonal decorations
  const seasonalDecor = useMemo(() => {
    const items: Array<{ x: number; z: number; y: number; scale: number; variant: number }> = [];
    const count = season === 'winter' ? 25 : season === 'spring' ? 20 : season === 'autumn' ? 18 : 10;
    const rng = (seed: number) => {
      const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
      return x - Math.floor(x);
    };
    for (let i = 0; i < count; i++) {
      const x = (rng(i * 2.3 + 100) - 0.5) * (length + 5);
      const z = (rng(i * 3.1 + 200) - 0.5) * (width + 5);
      const inside = Math.abs(x) < halfL + 0.2 && Math.abs(z) < halfW + 0.2;
      if (!inside) {
        items.push({
          x,
          z,
          y: season === 'winter' ? 0.015 : season === 'autumn' ? 0.01 + rng(i * 5) * 0.3 : 0.01,
          scale: 0.025 + rng(i * 7) * 0.04,
          variant: Math.floor(rng(i * 11) * 3),
        });
      }
    }
    return items;
  }, [length, width, season, halfL, halfW]);

  // Garden grid for placement - snaps to plant spacing when available
  const gridCells = useMemo(() => {
    if (!showGrid) return [];
    const cellSize = gridSpacingCm ? gridSpacingCm / 100 : 0.5; // Use plant spacing or default 50cm
    const clampedSize = Math.max(0.1, Math.min(cellSize, 2)); // Clamp to reasonable values
    const cells: Array<{ x: number; z: number; cx: number; cz: number }> = [];
    for (let ix = 0; ix < Math.floor(length / clampedSize); ix++) {
      for (let iz = 0; iz < Math.floor(width / clampedSize); iz++) {
        const x = -halfL + clampedSize / 2 + ix * clampedSize;
        const z = -halfW + clampedSize / 2 + iz * clampedSize;
        // Convert to percent coords for storage
        const cx = ((x + halfL) / length) * 100;
        const cz = ((z + halfW) / width) * 100;
        cells.push({ x, z, cx, cz });
      }
    }
    return cells;
  }, [showGrid, length, width, halfL, halfW, gridSpacingCm]);

  // Stepping stones path leading to the garden
  const steppingStones = useMemo(() => {
    const stones: Array<{ x: number; z: number; scale: number; rot: number }> = [];
    const rng = (seed: number) => {
      const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
      return x - Math.floor(x);
    };
    for (let i = 0; i < 5; i++) {
      stones.push({
        x: (rng(i * 4.3) - 0.5) * 0.25,
        z: halfW + 0.7 + i * 0.55,
        scale: 0.1 + rng(i * 6.7) * 0.05,
        rot: rng(i * 8.1) * Math.PI,
      });
    }
    return stones;
  }, [halfW]);

  return (
    <group>
      {/* Surrounding grass terrain with hills */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow geometry={hillGeometry}>
        <meshStandardMaterial
          color={grassColor}
          map={texReady ? grassTexRef.current : null}
          flatShading
          roughness={0.9}
        />
      </mesh>

      {/* Flat grass layer right under garden (to ensure flat) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[length + 1.5, width + 1.5]} />
        <meshStandardMaterial
          color={grassColor}
          map={texReady ? grassTexRef.current : null}
          roughness={0.85}
        />
      </mesh>

      {/* Grass texture variation patches for natural look */}
      {Array.from({ length: 8 }).map((_, i) => {
        const rng = (seed: number) => {
          const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
          return x - Math.floor(x);
        };
        const px = (rng(i * 3.7) - 0.5) * (length + 3);
        const pz = (rng(i * 5.1 + 10) - 0.5) * (width + 3);
        const isInside = Math.abs(px) < halfL - 0.2 && Math.abs(pz) < halfW - 0.2;
        if (isInside) return null;
        return (
          <mesh key={`gpatch-${i}`} rotation={[-Math.PI / 2, 0, rng(i * 8) * Math.PI]} position={[px, -0.005, pz]} receiveShadow>
            <circleGeometry args={[0.3 + rng(i * 2) * 0.5, 8]} />
            <meshStandardMaterial color={rng(i) > 0.5 ? grassDark : grassColor} transparent opacity={0.5} />
          </mesh>
        );
      })}

      {/* Dirt path leading to garden */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={`path-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[(Math.sin(i * 0.3) * 0.1), -0.008, halfW + 0.3 + i * 0.4]} receiveShadow>
          <planeGeometry args={[0.35, 0.35]} />
          <meshStandardMaterial color="#B8A88A" transparent opacity={0.6} />
        </mesh>
      ))}

      {/* Garden soil bed - slightly raised with richer texture */}
      <mesh position={[0, 0.015, 0]} receiveShadow castShadow>
        <boxGeometry args={[length, 0.06, width]} />
        <meshStandardMaterial
          color={soilColor}
          map={texReady ? soilTexRef.current : null}
          roughness={0.95}
          bumpScale={0.02}
        />
      </mesh>

      {/* Soil moisture variation patches */}
      {Array.from({ length: 5 }).map((_, i) => {
        const rng = (seed: number) => {
          const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
          return x - Math.floor(x);
        };
        return (
          <mesh key={`moist-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[(rng(i * 4.3) - 0.5) * (length - 0.3), 0.047, (rng(i * 7.1) - 0.5) * (width - 0.3)]} receiveShadow>
            <circleGeometry args={[0.15 + rng(i * 2.7) * 0.1, 6]} />
            <meshStandardMaterial color="#4A3215" transparent opacity={0.25} />
          </mesh>
        );
      })}

      {/* Soil bed border trim (warm wooden frame with slight rounded look) */}
      <mesh position={[0, 0.035, -halfW - 0.03]} castShadow>
        <boxGeometry args={[length + 0.12, 0.07, 0.055]} />
        <meshStandardMaterial color="#8B6838" map={texReady ? woodTexRef.current : null} roughness={0.78} />
      </mesh>
      <mesh position={[0, 0.035, halfW + 0.03]} castShadow>
        <boxGeometry args={[length + 0.12, 0.07, 0.055]} />
        <meshStandardMaterial color="#8B6838" map={texReady ? woodTexRef.current : null} roughness={0.78} />
      </mesh>
      <mesh position={[-halfL - 0.03, 0.035, 0]} castShadow>
        <boxGeometry args={[0.055, 0.07, width + 0.12]} />
        <meshStandardMaterial color="#8B6838" map={texReady ? woodTexRef.current : null} roughness={0.78} />
      </mesh>
      <mesh position={[halfL + 0.03, 0.035, 0]} castShadow>
        <boxGeometry args={[0.055, 0.07, width + 0.12]} />
        <meshStandardMaterial color="#8B6838" map={texReady ? woodTexRef.current : null} roughness={0.78} />
      </mesh>
      {/* Top trim rail for polished border look */}
      <mesh position={[0, 0.072, -halfW - 0.03]} castShadow>
        <boxGeometry args={[length + 0.14, 0.015, 0.065]} />
        <meshStandardMaterial color="#A08050" map={texReady ? woodTexRef.current : null} roughness={0.72} />
      </mesh>
      <mesh position={[0, 0.072, halfW + 0.03]} castShadow>
        <boxGeometry args={[length + 0.14, 0.015, 0.065]} />
        <meshStandardMaterial color="#A08050" map={texReady ? woodTexRef.current : null} roughness={0.72} />
      </mesh>
      <mesh position={[-halfL - 0.03, 0.072, 0]} castShadow>
        <boxGeometry args={[0.065, 0.015, width + 0.14]} />
        <meshStandardMaterial color="#A08050" map={texReady ? woodTexRef.current : null} roughness={0.72} />
      </mesh>
      <mesh position={[halfL + 0.03, 0.072, 0]} castShadow>
        <boxGeometry args={[0.065, 0.015, width + 0.14]} />
        <meshStandardMaterial color="#A08050" map={texReady ? woodTexRef.current : null} roughness={0.72} />
      </mesh>

      {/* Row lines on soil for visual structure */}
      {Array.from({ length: Math.floor(width / 0.5) + 1 }).map((_, i) => {
        const z = -halfW + i * 0.5;
        if (z > halfW) return null;
        return (
          <mesh key={`row-${i}`} position={[0, 0.048, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[length - 0.1, 0.02]} />
            <meshStandardMaterial color="#4A3518" transparent opacity={0.3} />
          </mesh>
        );
      })}

      {/* Dirt patches under planted items */}
      {dirtPatches.map((patch, i) => (
        <mesh key={`dirt-${i}`} position={[patch.x, 0.049, patch.z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[0.12, 8]} />
          <meshStandardMaterial color="#6B4A2A" />
        </mesh>
      ))}

      {/* Placement grid overlay when in placement mode */}
      {showGrid && gridCells.map((cell, i) => (
        <mesh
          key={`grid-${i}`}
          position={[cell.x, 0.051, cell.z]}
          rotation={[-Math.PI / 2, 0, 0]}
          onClick={(e) => {
            e.stopPropagation();
            onGroundClick?.(cell.cx, cell.cz);
          }}
          onPointerOver={() => { document.body.style.cursor = 'crosshair'; }}
          onPointerOut={() => { document.body.style.cursor = 'auto'; }}
        >
          <planeGeometry args={[0.45, 0.45]} />
          <meshStandardMaterial
            color="#4ADE80"
            transparent
            opacity={0.15}
            wireframe={false}
          />
        </mesh>
      ))}

      {/* Fence posts -- rounded for cozy cartoon look */}
      {fencePosts.map((post, i) => (
        <group key={`fp-${i}`}>
          {/* Post body -- slightly tapered cylinder for softer look */}
          <mesh position={[post.x, 0.15, post.z]} castShadow>
            <cylinderGeometry args={[0.025, 0.032, 0.34, 6]} />
            <meshStandardMaterial color="#C49060" map={texReady ? woodTexRef.current : null} roughness={0.82} />
          </mesh>
          {/* Post cap - rounded dome for cute look */}
          <mesh position={[post.x, 0.33, post.z]} castShadow>
            <sphereGeometry args={[0.035, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#D8B080" map={texReady ? woodTexRef.current : null} roughness={0.75} />
          </mesh>
          {/* AO shadow at base of post */}
          <mesh position={[post.x, 0.002, post.z]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.12, 0.12]} />
            <meshBasicMaterial
              map={texReady ? aoTexRef.current : null}
              transparent
              opacity={0.35}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}

      {/* Fence rails - rounded cylinders for cozy cartoon look */}
      {fenceRails.map((rail, i) => (
        <group key={`fr-${i}`}>
          <mesh position={[rail.x, 0.24, rail.z]} rotation={[0, rail.rotY, Math.PI / 2]} castShadow>
            <capsuleGeometry args={[0.014, rail.len - 0.04, 4, 6]} />
            <meshStandardMaterial color="#D8B078" map={texReady ? woodTexRef.current : null} roughness={0.78} />
          </mesh>
          <mesh position={[rail.x, 0.12, rail.z]} rotation={[0, rail.rotY, Math.PI / 2]} castShadow>
            <capsuleGeometry args={[0.014, rail.len - 0.04, 4, 6]} />
            <meshStandardMaterial color="#D8B078" map={texReady ? woodTexRef.current : null} roughness={0.78} />
          </mesh>
        </group>
      ))}

      {/* Stepping stones path */}
      {steppingStones.map((stone, i) => (
        <mesh key={`stone-${i}`} position={[stone.x, 0.005, stone.z]} rotation={[-Math.PI / 2, stone.rot, 0]} receiveShadow castShadow>
          <circleGeometry args={[stone.scale, 7]} />
          <meshStandardMaterial
            color="#B0AFA0"
            map={texReady ? stoneTexRef.current : null}
            roughness={0.9}
          />
        </mesh>
      ))}

      {/* Grass tufts around garden */}
      {grassTufts.map((tuft, i) => (
        <GrassTuft key={`gt-${i}`} x={tuft.x} z={tuft.z} scale={tuft.scale} rotation={tuft.rotation} color={tuft.shade > 0.5 ? grassColor : grassDark} />
      ))}

      {/* Seasonal decorations */}
      {seasonalDecor.map((dec, i) => (
        <SeasonalItem key={`sd-${i}`} x={dec.x} z={dec.z} y={dec.y} scale={dec.scale} variant={dec.variant} season={season} />
      ))}
    </group>
  );
}

function GrassTuft({ x, z, scale, rotation, color }: { x: number; z: number; scale: number; rotation: number; color: string }) {
  const ref = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!ref.current) return;
    const t = performance.now() * 0.001;
    ref.current.rotation.z = Math.sin(t * 1.5 + x * 5) * 0.1;
  });

  // Rounder, more cartoon-like grass blades in a cluster
  return (
    <group ref={ref} position={[x, 0, z]} rotation={[0, rotation, 0]}>
      <mesh position={[0, scale * 0.6, 0]}>
        <capsuleGeometry args={[scale * 0.15, scale * 1.2, 3, 5]} />
        <meshStandardMaterial color={color} transparent opacity={0.9} />
      </mesh>
      <mesh position={[scale * 0.15, scale * 0.45, scale * 0.08]} rotation={[0, 0.4, 0.15]}>
        <capsuleGeometry args={[scale * 0.12, scale * 0.9, 3, 5]} />
        <meshStandardMaterial color={color} transparent opacity={0.85} />
      </mesh>
      <mesh position={[-scale * 0.12, scale * 0.4, -scale * 0.06]} rotation={[0, -0.3, -0.12]}>
        <capsuleGeometry args={[scale * 0.1, scale * 0.8, 3, 5]} />
        <meshStandardMaterial color={color} transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

function SeasonalItem({ x, z, y, scale, variant, season }: { x: number; z: number; y: number; scale: number; variant: number; season: string }) {
  if (season === 'spring') {
    // Cute little wildflowers with rounded petals
    const colors = ['#FFB8D8', '#E0A8E0', '#FFEE60'];
    const petalColor = colors[variant];
    return (
      <group position={[x, y, z]}>
        {/* Petals -- small sphere cluster for round flower look */}
        {[0, 1.26, 2.52, 3.78, 5.04].map((angle, i) => (
          <mesh key={`petal-${i}`} position={[Math.cos(angle) * scale * 0.4, scale * 0.1, Math.sin(angle) * scale * 0.4]}>
            <sphereGeometry args={[scale * 0.35, 5, 4]} />
            <meshStandardMaterial color={petalColor} />
          </mesh>
        ))}
        {/* Center */}
        <mesh position={[0, scale * 0.15, 0]}>
          <sphereGeometry args={[scale * 0.2, 5, 4]} />
          <meshStandardMaterial color="#FFE040" />
        </mesh>
        <mesh position={[0, -scale * 0.5, 0]}>
          <cylinderGeometry args={[0.004, 0.004, scale * 1.2, 4]} />
          <meshStandardMaterial color="#60B060" />
        </mesh>
      </group>
    );
  }
  if (season === 'autumn') {
    // Rounded leaf shapes instead of flat boxes
    const colors = ['#E87030', '#D05028', '#D8A828'];
    return (
      <group position={[x, y, z]} rotation={[0.2, variant * 1.2, 0.1]}>
        <mesh>
          <sphereGeometry args={[scale * 0.8, 5, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={colors[variant]} side={THREE.DoubleSide} />
        </mesh>
      </group>
    );
  }
  if (season === 'winter') {
    return (
      <mesh position={[x, y, z]} rotation={[-Math.PI / 2, 0, variant * 0.5]}>
        <circleGeometry args={[scale * 3, 8]} />
        <meshStandardMaterial color="#F0F4FF" transparent opacity={0.55} />
      </mesh>
    );
  }
  // Summer - cute little wildflowers
  return (
    <group position={[x, 0, z]}>
      {/* Daisy-like flower */}
      {[0, 1.05, 2.1, 3.15, 4.2, 5.25].map((angle, i) => (
        <mesh key={`dp-${i}`} position={[Math.cos(angle) * 0.015, 0.065, Math.sin(angle) * 0.015]}>
          <sphereGeometry args={[0.008, 4, 3]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>
      ))}
      <mesh position={[0, 0.068, 0]}>
        <sphereGeometry args={[0.01, 5, 4]} />
        <meshStandardMaterial color="#FFD700" />
      </mesh>
      <mesh position={[0, 0.035, 0]}>
        <cylinderGeometry args={[0.004, 0.004, 0.06, 4]} />
        <meshStandardMaterial color="#58B858" />
      </mesh>
    </group>
  );
}
