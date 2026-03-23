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
  spring: '#7ED856',
  summer: '#5CB838',
  autumn: '#C4A840',
  winter: '#CDD8C0',
};

const SEASON_GRASS_DARK: Record<string, string> = {
  spring: '#58B838',
  summer: '#489828',
  autumn: '#A09030',
  winter: '#B0B8A0',
};

// Additional accent colors for grass variation
const SEASON_GRASS_ACCENT: Record<string, string> = {
  spring: '#A0E878',
  summer: '#78D050',
  autumn: '#D8C060',
  winter: '#E0E4D8',
};

export function GardenTerrain({ length, width, soilType, plantPositions, season, onGroundClick, showGrid, gridSpacingCm }: GardenTerrainProps) {
  const grassColor = SEASON_GRASS[season];
  const grassDark = SEASON_GRASS_DARK[season];
  const grassAccent = SEASON_GRASS_ACCENT[season];
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
  // Extended generously to accommodate raised beds placed outside the garden
  const hillGeometry = useMemo(() => {
    const extent = Math.max(length, width);
    const padding = Math.max(extent * 1.5, 8); // Ensure enough room for outside beds
    const geo = new THREE.PlaneGeometry(length + padding + 12, width + padding + 12, 32, 32);
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

  // Fence configuration with gate opening on the front (positive Z) side
  const gateWidth = 0.6; // gate opening width in meters
  const fencePosts = useMemo(() => {
    const posts: Array<{ x: number; z: number; isCorner: boolean; isGatePost: boolean }> = [];
    const fL = halfL + 0.4;
    const fW = halfW + 0.4;
    const spacing = 0.7;

    // Front and back edges (along X)
    for (let x = -fL; x <= fL + 0.01; x += spacing) {
      const px = Math.min(x, fL);
      // Skip posts in the gate opening on the front (positive Z) side
      const inGate = Math.abs(px) < gateWidth / 2 + 0.05;
      if (!inGate) {
        posts.push({ x: px, z: fW, isCorner: false, isGatePost: false });
      }
      posts.push({ x: px, z: -fW, isCorner: false, isGatePost: false });
    }
    // Left and right edges (along Z)
    for (let z = -fW + spacing; z < fW; z += spacing) {
      posts.push({ x: -fL, z, isCorner: false, isGatePost: false });
      posts.push({ x: fL, z, isCorner: false, isGatePost: false });
    }
    // Corners
    [
      { x: -fL, z: -fW },
      { x: fL, z: -fW },
      { x: -fL, z: fW },
      { x: fL, z: fW },
    ].forEach((c) => posts.push({ ...c, isCorner: true, isGatePost: false }));

    // Gate posts (taller, flanking the opening)
    posts.push({ x: -gateWidth / 2 - 0.03, z: fW, isCorner: false, isGatePost: true });
    posts.push({ x: gateWidth / 2 + 0.03, z: fW, isCorner: false, isGatePost: true });

    return posts;
  }, [halfL, halfW, gateWidth]);

  const fenceRails = useMemo(() => {
    const fL = halfL + 0.4;
    const fW = halfW + 0.4;
    // Split front rail into two segments around the gate
    const halfFrontLen = (length + 0.8 - gateWidth) / 2;
    const gateOffset = (gateWidth + halfFrontLen) / 2;
    return [
      // Back rail (full width)
      { x: 0, z: -fW, rotY: 0, len: length + 0.8 },
      // Front rail - left segment
      { x: -gateOffset / 2 - gateWidth / 4, z: fW, rotY: 0, len: halfFrontLen },
      // Front rail - right segment
      { x: gateOffset / 2 + gateWidth / 4, z: fW, rotY: 0, len: halfFrontLen },
      // Side rails
      { x: -fL, z: 0, rotY: Math.PI / 2, len: width + 0.8 },
      { x: fL, z: 0, rotY: Math.PI / 2, len: width + 0.8 },
    ];
  }, [halfL, halfW, length, width, gateWidth]);

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

  // Permanent 30cm base grid (carre potager / square foot gardening)
  const BASE_CELL_M = 0.3; // 30cm
  const baseGridCells = useMemo(() => {
    const cells: Array<{ x: number; z: number; cx: number; cz: number }> = [];
    const colCount = Math.floor(length / BASE_CELL_M);
    const rowCount = Math.floor(width / BASE_CELL_M);
    for (let ix = 0; ix < colCount; ix++) {
      for (let iz = 0; iz < rowCount; iz++) {
        const x = -halfL + BASE_CELL_M / 2 + ix * BASE_CELL_M;
        const z = -halfW + BASE_CELL_M / 2 + iz * BASE_CELL_M;
        const cx = ((x + halfL) / length) * 100;
        const cz = ((z + halfW) / width) * 100;
        cells.push({ x, z, cx, cz });
      }
    }
    return cells;
  }, [length, width, halfL, halfW]);

  // How many 30cm cells a plant occupies (N x N)
  const plantCellSpan = useMemo(() => {
    if (!gridSpacingCm) return 1;
    return Math.max(1, Math.ceil(gridSpacingCm / 30));
  }, [gridSpacingCm]);

  // Base grid line geometry (horizontal + vertical lines for subtle dividers)
  const baseGridLines = useMemo(() => {
    const lines: Array<{ x: number; z: number; isHorizontal: boolean; len: number }> = [];
    const colCount = Math.floor(length / BASE_CELL_M);
    const rowCount = Math.floor(width / BASE_CELL_M);
    // Vertical lines
    for (let ix = 0; ix <= colCount; ix++) {
      const x = -halfL + ix * BASE_CELL_M;
      lines.push({ x, z: 0, isHorizontal: false, len: rowCount * BASE_CELL_M });
    }
    // Horizontal lines
    for (let iz = 0; iz <= rowCount; iz++) {
      const z = -halfW + iz * BASE_CELL_M;
      lines.push({ x: 0, z, isHorizontal: true, len: colCount * BASE_CELL_M });
    }
    return lines;
  }, [length, width, halfL, halfW]);

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

      {/* Flat grass layer right under garden (to ensure flat) -- extended for outside beds */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[length + Math.max(length, 4) + 4, width + Math.max(width, 4) + 4]} />
        <meshStandardMaterial
          color={grassColor}
          map={texReady ? grassTexRef.current : null}
          roughness={0.85}
        />
      </mesh>

      {/* Grass texture variation patches for natural look -- more layers */}
      {Array.from({ length: 16 }).map((_, i) => {
        const rng = (seed: number) => {
          const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
          return x - Math.floor(x);
        };
        const px = (rng(i * 3.7) - 0.5) * (length + 5);
        const pz = (rng(i * 5.1 + 10) - 0.5) * (width + 5);
        const isInside = Math.abs(px) < halfL - 0.2 && Math.abs(pz) < halfW - 0.2;
        if (isInside) return null;
        const colorPick = rng(i * 9.3);
        const patchColor = colorPick > 0.66 ? grassAccent : colorPick > 0.33 ? grassDark : grassColor;
        return (
          <mesh key={`gpatch-${i}`} rotation={[-Math.PI / 2, 0, rng(i * 8) * Math.PI]} position={[px, -0.004, pz]} receiveShadow>
            <circleGeometry args={[0.25 + rng(i * 2) * 0.6, 10]} />
            <meshStandardMaterial color={patchColor} transparent opacity={0.35 + rng(i * 4) * 0.2} />
          </mesh>
        );
      })}

      {/* Cobblestone-style path leading to garden */}
      {Array.from({ length: 10 }).map((_, i) => {
        const rng = (seed: number) => {
          const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
          return x - Math.floor(x);
        };
        const wobbleX = Math.sin(i * 0.5) * 0.08 + (rng(i * 13.7) - 0.5) * 0.06;
        const stoneSize = 0.12 + rng(i * 7.3) * 0.06;
        return (
          <group key={`path-${i}`}>
            {/* Main path stone */}
            <mesh rotation={[-Math.PI / 2, rng(i * 3.1) * 0.5, 0]} position={[wobbleX, -0.003, halfW + 0.25 + i * 0.32]} receiveShadow castShadow>
              <circleGeometry args={[stoneSize, 7]} />
              <meshStandardMaterial color={rng(i * 2) > 0.5 ? '#C4B8A0' : '#B0A890'} map={texReady ? stoneTexRef.current : null} roughness={0.85} />
            </mesh>
            {/* Small gap stones beside */}
            {rng(i * 5.9) > 0.4 && (
              <mesh rotation={[-Math.PI / 2, rng(i * 9) * 1.0, 0]} position={[wobbleX + (rng(i * 4) > 0.5 ? 0.14 : -0.14), -0.004, halfW + 0.28 + i * 0.32]} receiveShadow>
                <circleGeometry args={[0.04 + rng(i * 6) * 0.03, 6]} />
                <meshStandardMaterial color="#A8A090" map={texReady ? stoneTexRef.current : null} roughness={0.9} />
              </mesh>
            )}
          </group>
        );
      })}

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

      {/* Permanent 30cm base grid lines (carre potager style) */}
      {baseGridLines.map((line, i) => (
        <mesh
          key={`gridline-${i}`}
          position={[line.isHorizontal ? 0 : line.x, 0.049, line.isHorizontal ? line.z : 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={line.isHorizontal ? [line.len, 0.005] : [0.005, line.len]} />
          <meshStandardMaterial color="#8B7355" transparent opacity={0.25} />
        </mesh>
      ))}

      {/* Plant placement overlay grid - clickable cells with highlight for plant size */}
      {showGrid && baseGridCells.map((cell, i) => (
          <mesh
            key={`grid-${i}`}
            position={[cell.x, 0.062, cell.z]}
            rotation={[-Math.PI / 2, 0, 0]}
            onClick={(e) => {
              e.stopPropagation();
              onGroundClick?.(cell.cx, cell.cz);
            }}
            onPointerOver={() => { document.body.style.cursor = 'crosshair'; }}
            onPointerOut={() => { document.body.style.cursor = 'auto'; }}
          >
            <planeGeometry args={[BASE_CELL_M * plantCellSpan - 0.01, BASE_CELL_M * plantCellSpan - 0.01]} />
            <meshStandardMaterial
              color="#4ADE80"
              transparent
              opacity={0.18}
              wireframe={false}
            />
          </mesh>
      ))}

      {/* Fence posts -- rounded for cozy cartoon look */}
      {fencePosts.map((post, i) => {
        const postHeight = post.isGatePost ? 0.48 : 0.34;
        const postRadius = post.isGatePost ? 0.032 : 0.025;
        const capRadius = post.isGatePost ? 0.042 : 0.035;
        // Deterministic color variation per post
        const colorSeed = Math.sin(post.x * 127.1 + post.z * 311.7 + i * 7.3) * 43758.5453;
        const variation = (colorSeed - Math.floor(colorSeed));
        const postColor = variation > 0.6 ? '#C49060' : variation > 0.3 ? '#B88550' : '#D0A070';
        return (
          <group key={`fp-${i}`}>
            {/* Post body -- slightly tapered cylinder for softer look */}
            <mesh position={[post.x, postHeight / 2, post.z]} castShadow>
              <cylinderGeometry args={[postRadius, postRadius + 0.007, postHeight, 6]} />
              <meshStandardMaterial color={postColor} map={texReady ? woodTexRef.current : null} roughness={0.82} />
            </mesh>
            {/* Post cap - rounded dome for cute look */}
            <mesh position={[post.x, postHeight + 0.005, post.z]} castShadow>
              <sphereGeometry args={[capRadius, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color="#D8B080" map={texReady ? woodTexRef.current : null} roughness={0.75} />
            </mesh>
            {/* Gate post finial - decorative ball on top */}
            {post.isGatePost && (
              <mesh position={[post.x, postHeight + capRadius + 0.01, post.z]} castShadow>
                <sphereGeometry args={[0.022, 6, 5]} />
                <meshStandardMaterial color="#A07848" roughness={0.7} />
              </mesh>
            )}
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
        );
      })}

      {/* Gate arch - decorative wooden arch over the gate opening */}
      {(() => {
        const fW = halfW + 0.4;
        const archY = 0.48;
        return (
          <group>
            {/* Arch crossbar */}
            <mesh position={[0, archY + 0.01, fW]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <capsuleGeometry args={[0.016, gateWidth + 0.04, 4, 6]} />
              <meshStandardMaterial color="#B89060" map={texReady ? woodTexRef.current : null} roughness={0.78} />
            </mesh>
            {/* Arch top trim */}
            <mesh position={[0, archY + 0.035, fW]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <boxGeometry args={[0.02, gateWidth + 0.08, 0.04]} />
              <meshStandardMaterial color="#C8A070" map={texReady ? woodTexRef.current : null} roughness={0.72} />
            </mesh>
          </group>
        );
      })()}

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
