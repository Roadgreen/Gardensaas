'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { RaisedBed } from '@/types';
import { RAISED_BED_SOIL_LABELS } from '@/types';

interface RaisedBed3DProps {
  bed: RaisedBed;
  gardenLength: number;
  gardenWidth: number;
  isSelected?: boolean;
  onSelect?: () => void;
}

const SOIL_COLORS: Record<string, string> = {
  'potting-mix': '#3B2710',
  'compost': '#2E1E0A',
  'loamy': '#5C3D1E',
  'sandy': '#A08050',
  'peat-mix': '#2A1F10',
  'clay-mix': '#7A5530',
};

const WOOD_COLORS = ['#8B6914', '#A0784A', '#7A5A2E', '#6B4A22'];

export function RaisedBed3D({ bed, gardenLength, gardenWidth, isSelected, onSelect }: RaisedBed3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const halfGL = gardenLength / 2;
  const halfGW = gardenWidth / 2;

  // Convert percent position to world coords
  const worldX = -halfGL + (bed.x / 100) * gardenLength;
  const worldZ = -halfGW + (bed.z / 100) * gardenWidth;

  const h = bed.heightM;
  const w = bed.widthM;
  const l = bed.lengthM;
  const wallThickness = 0.04;

  const soilColor = SOIL_COLORS[bed.soilType] || SOIL_COLORS.loamy;

  // Wood plank texture via multiple strips
  const planks = useMemo(() => {
    const items: Array<{
      side: 'front' | 'back' | 'left' | 'right';
      x: number; y: number; z: number;
      width: number; height: number; depth: number;
      color: string;
    }> = [];

    const plankHeight = 0.06;
    const numPlanks = Math.max(2, Math.ceil(h / plankHeight));
    const actualPlankH = h / numPlanks;

    for (let i = 0; i < numPlanks; i++) {
      const y = actualPlankH / 2 + i * actualPlankH;
      const color = WOOD_COLORS[i % WOOD_COLORS.length];

      // Front & back
      items.push({ side: 'front', x: 0, y, z: -w / 2, width: l, height: actualPlankH, depth: wallThickness, color });
      items.push({ side: 'back', x: 0, y, z: w / 2, width: l, height: actualPlankH, depth: wallThickness, color });
      // Left & right
      items.push({ side: 'left', x: -l / 2, y, z: 0, width: wallThickness, height: actualPlankH, depth: w, color });
      items.push({ side: 'right', x: l / 2, y, z: 0, width: wallThickness, height: actualPlankH, depth: w, color });
    }

    return items;
  }, [h, w, l]);

  // Corner posts
  const corners = useMemo(() => [
    { x: -l / 2, z: -w / 2 },
    { x: l / 2, z: -w / 2 },
    { x: -l / 2, z: w / 2 },
    { x: l / 2, z: w / 2 },
  ], [l, w]);

  // Selection highlight pulse
  const ringRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (ringRef.current && isSelected) {
      const t = performance.now() * 0.001;
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = 0.3 + Math.sin(t * 3) * 0.15;
    }
  });

  return (
    <group ref={groupRef} position={[worldX, 0, worldZ]} onClick={(e) => { e.stopPropagation(); onSelect?.(); }}>
      {/* Wooden walls - planks */}
      {planks.map((p, i) => (
        <mesh key={`plank-${i}`} position={[p.x, p.y, p.z]} castShadow>
          <boxGeometry args={[p.width, p.height * 0.95, p.depth]} />
          <meshStandardMaterial color={p.color} roughness={0.85} />
        </mesh>
      ))}

      {/* Corner posts */}
      {corners.map((c, i) => (
        <mesh key={`corner-${i}`} position={[c.x, h / 2, c.z]} castShadow>
          <boxGeometry args={[0.06, h + 0.04, 0.06]} />
          <meshStandardMaterial color="#5A3A18" roughness={0.9} />
        </mesh>
      ))}

      {/* Soil fill */}
      <mesh position={[0, h - 0.02, 0]} receiveShadow>
        <boxGeometry args={[l - wallThickness * 2, 0.03, w - wallThickness * 2]} />
        <meshStandardMaterial color={soilColor} roughness={0.95} />
      </mesh>

      {/* Soil moisture variation patches */}
      {[0, 1, 2].map((i) => {
        const rng = (seed: number) => {
          const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
          return x - Math.floor(x);
        };
        return (
          <mesh key={`moist-bed-${i}`} rotation={[-Math.PI / 2, 0, 0]}
            position={[(rng(i * 4.3 + bed.x) - 0.5) * (l * 0.6), h - 0.005, (rng(i * 7.1 + bed.z) - 0.5) * (w * 0.6)]}
            receiveShadow>
            <circleGeometry args={[0.06 + rng(i * 2.7) * 0.04, 6]} />
            <meshStandardMaterial color="#1A0D05" transparent opacity={0.2} />
          </mesh>
        );
      })}

      {/* Selection ring */}
      {isSelected && (
        <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, h + 0.01, 0]}>
          <ringGeometry args={[Math.max(l, w) * 0.55, Math.max(l, w) * 0.6, 24]} />
          <meshBasicMaterial color="#FDE047" transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Hover label */}
      <Html position={[0, h + 0.15, 0]} center distanceFactor={6} style={{ pointerEvents: 'none' }}>
        <div style={{
          background: 'rgba(0,0,0,0.6)',
          borderRadius: '6px',
          padding: '2px 8px',
          fontSize: '9px',
          fontFamily: '"Nunito", sans-serif',
          color: '#D4A06C',
          whiteSpace: 'nowrap',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}>
          <span style={{ fontSize: '10px' }}>{'\uD83E\uDDF1'}</span>
          {bed.name} ({bed.lengthM}x{bed.widthM}m)
        </div>
      </Html>
    </group>
  );
}
