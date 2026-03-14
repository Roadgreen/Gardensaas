'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface GardenTerrainProps {
  length: number;
  width: number;
  soilType: string;
  plantPositions: Array<{ x: number; z: number }>;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  onGroundClick?: (x: number, z: number) => void;
  showGrid?: boolean;
}

const SOIL_COLORS: Record<string, string> = {
  clay: '#8B6914',
  sandy: '#C2A66B',
  loamy: '#5C3D1E',
  silty: '#7A6548',
  peaty: '#3B2F1B',
  chalky: '#A89F8C',
};

const SEASON_GRASS: Record<string, string> = {
  spring: '#7EC850',
  summer: '#5DA832',
  autumn: '#B8A040',
  winter: '#D4D8C0',
};

const SEASON_GRASS_DARK: Record<string, string> = {
  spring: '#5AAE30',
  summer: '#488A28',
  autumn: '#9A8830',
  winter: '#B8BCA8',
};

export function GardenTerrain({ length, width, soilType, plantPositions, season, onGroundClick, showGrid }: GardenTerrainProps) {
  const grassColor = SEASON_GRASS[season];
  const grassDark = SEASON_GRASS_DARK[season];
  const soilColor = SOIL_COLORS[soilType] || SOIL_COLORS.loamy;

  const halfL = length / 2;
  const halfW = width / 2;

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

  // Garden grid for placement
  const gridCells = useMemo(() => {
    if (!showGrid) return [];
    const cellSize = 0.5; // 50cm cells
    const cells: Array<{ x: number; z: number; cx: number; cz: number }> = [];
    for (let ix = 0; ix < Math.floor(length / cellSize); ix++) {
      for (let iz = 0; iz < Math.floor(width / cellSize); iz++) {
        const x = -halfL + cellSize / 2 + ix * cellSize;
        const z = -halfW + cellSize / 2 + iz * cellSize;
        // Convert to percent coords for storage
        const cx = ((x + halfL) / length) * 100;
        const cz = ((z + halfW) / width) * 100;
        cells.push({ x, z, cx, cz });
      }
    }
    return cells;
  }, [showGrid, length, width, halfL, halfW]);

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
        <meshStandardMaterial color={grassColor} flatShading />
      </mesh>

      {/* Flat grass layer right under garden (to ensure flat) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[length + 1.5, width + 1.5]} />
        <meshStandardMaterial color={grassColor} />
      </mesh>

      {/* Garden soil bed - slightly raised */}
      <mesh position={[0, 0.015, 0]} receiveShadow castShadow>
        <boxGeometry args={[length, 0.06, width]} />
        <meshStandardMaterial color={soilColor} />
      </mesh>

      {/* Soil bed border trim (darker edge) */}
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[length + 0.08, 0.04, width + 0.08]} />
        <meshStandardMaterial color="#3E2A10" transparent opacity={0.4} />
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

      {/* Fence posts */}
      {fencePosts.map((post, i) => (
        <group key={`fp-${i}`}>
          {/* Post body */}
          <mesh position={[post.x, 0.14, post.z]} castShadow>
            <boxGeometry args={[0.06, 0.32, 0.06]} />
            <meshStandardMaterial color="#B8845C" />
          </mesh>
          {/* Post cap - pointed for cute look */}
          <mesh position={[post.x, 0.32, post.z]} castShadow>
            <coneGeometry args={[0.045, 0.06, 4]} />
            <meshStandardMaterial color="#D4A06C" />
          </mesh>
        </group>
      ))}

      {/* Fence rails - two horizontal rails */}
      {fenceRails.map((rail, i) => (
        <group key={`fr-${i}`}>
          <mesh position={[rail.x, 0.22, rail.z]} rotation={[0, rail.rotY, 0]} castShadow>
            <boxGeometry args={[rail.len, 0.035, 0.025]} />
            <meshStandardMaterial color="#D4A870" />
          </mesh>
          <mesh position={[rail.x, 0.1, rail.z]} rotation={[0, rail.rotY, 0]} castShadow>
            <boxGeometry args={[rail.len, 0.035, 0.025]} />
            <meshStandardMaterial color="#D4A870" />
          </mesh>
        </group>
      ))}

      {/* Stepping stones path */}
      {steppingStones.map((stone, i) => (
        <mesh key={`stone-${i}`} position={[stone.x, 0.005, stone.z]} rotation={[-Math.PI / 2, stone.rot, 0]} receiveShadow>
          <circleGeometry args={[stone.scale, 7]} />
          <meshStandardMaterial color="#B0AFA0" roughness={0.9} />
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
  const ref = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!ref.current) return;
    const t = performance.now() * 0.001;
    ref.current.rotation.z = Math.sin(t * 1.5 + x * 5) * 0.08;
  });

  return (
    <mesh ref={ref} position={[x, scale * 0.5, z]} rotation={[0, rotation, 0]}>
      <coneGeometry args={[scale * 0.35, scale * 2.2, 4]} />
      <meshStandardMaterial color={color} transparent opacity={0.85} />
    </mesh>
  );
}

function SeasonalItem({ x, z, y, scale, variant, season }: { x: number; z: number; y: number; scale: number; variant: number; season: string }) {
  if (season === 'spring') {
    const colors = ['#FFB7D5', '#DDA0DD', '#FFEB3B'];
    return (
      <group position={[x, y, z]}>
        <mesh>
          <sphereGeometry args={[scale, 6, 4]} />
          <meshStandardMaterial color={colors[variant]} />
        </mesh>
        <mesh position={[0, -scale * 0.8, 0]}>
          <cylinderGeometry args={[0.003, 0.003, scale * 1.5, 4]} />
          <meshStandardMaterial color="#4CAF50" />
        </mesh>
      </group>
    );
  }
  if (season === 'autumn') {
    const colors = ['#E06010', '#C04020', '#D4A020'];
    return (
      <mesh position={[x, y, z]} rotation={[0.2, variant * 1.2, 0.1]}>
        <boxGeometry args={[scale * 2, 0.005, scale * 1.5]} />
        <meshStandardMaterial color={colors[variant]} side={THREE.DoubleSide} />
      </mesh>
    );
  }
  if (season === 'winter') {
    return (
      <mesh position={[x, y, z]} rotation={[-Math.PI / 2, 0, variant * 0.5]}>
        <circleGeometry args={[scale * 3, 6]} />
        <meshStandardMaterial color="#F0F4FF" transparent opacity={0.6} />
      </mesh>
    );
  }
  // Summer - tiny flowers
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.06, 0]}>
        <sphereGeometry args={[0.025, 6, 4]} />
        <meshStandardMaterial color="#FFD700" />
      </mesh>
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.004, 0.004, 0.06, 4]} />
        <meshStandardMaterial color="#4CAF50" />
      </mesh>
    </group>
  );
}
