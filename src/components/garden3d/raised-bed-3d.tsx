'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { RaisedBed } from '@/types';
import { RAISED_BED_SOIL_LABELS } from '@/types';
import { createWoodTexture, createSoilTexture, createAOGroundTexture, getCachedTexture } from './procedural-textures';

interface RaisedBed3DProps {
  bed: RaisedBed;
  gardenLength: number;
  gardenWidth: number;
  isSelected?: boolean;
  onSelect?: () => void;
}

const SOIL_COLORS: Record<string, string> = {
  'potting-mix': '#483018',
  'compost': '#382810',
  'loamy': '#6B4828',
  'sandy': '#B09060',
  'peat-mix': '#352818',
  'clay-mix': '#886038',
};

// Warmer, more cartoon-like wood tones with more grain variation
const WOOD_COLORS = ['#A07028', '#B88848', '#946830', '#8A5E28', '#C09858'];
const WOOD_DARK = '#503818';
const WOOD_HIGHLIGHT = '#C8A868';

export function RaisedBed3D({ bed, gardenLength, gardenWidth, isSelected, onSelect }: RaisedBed3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const halfGL = gardenLength / 2;
  const halfGW = gardenWidth / 2;

  // Procedural textures
  const [woodTex, setWoodTex] = useState<THREE.CanvasTexture | null>(null);
  const [soilTex, setSoilTex] = useState<THREE.CanvasTexture | null>(null);
  const [aoTex, setAoTex] = useState<THREE.CanvasTexture | null>(null);
  useEffect(() => {
    setWoodTex(getCachedTexture('wood', () => createWoodTexture()));
    setSoilTex(getCachedTexture(`soil-${bed.soilType}`, () => createSoilTexture(SOIL_COLORS[bed.soilType] || SOIL_COLORS.loamy)));
    setAoTex(getCachedTexture('ao-ground', () => createAOGroundTexture()));
  }, [bed.soilType]);

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

  // Top trim rails for a polished look
  const topRails = useMemo(() => [
    { x: 0, z: -w / 2, len: l + 0.08, rotY: 0 },
    { x: 0, z: w / 2, len: l + 0.08, rotY: 0 },
    { x: -l / 2, z: 0, len: w + 0.08, rotY: Math.PI / 2 },
    { x: l / 2, z: 0, len: w + 0.08, rotY: Math.PI / 2 },
  ], [l, w]);

  // Soil texture rows
  const soilRows = useMemo(() => {
    const rows: Array<{ x: number; z: number }> = [];
    const innerW = w - wallThickness * 4;
    const spacing = 0.12;
    for (let z = -innerW / 2 + spacing; z < innerW / 2; z += spacing) {
      rows.push({ x: 0, z });
    }
    return rows;
  }, [w]);

  // Selection highlight pulse
  const ringRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (ringRef.current && isSelected) {
      const t = performance.now() * 0.001;
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = 0.3 + Math.sin(t * 3) * 0.15;
    }
  });

  return (
    <group
      ref={groupRef}
      position={[worldX, 0, worldZ]}
      onClick={(e) => { e.stopPropagation(); onSelect?.(); }}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; }}
    >
      {/* Ground shadow/base with AO */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]} receiveShadow>
        <planeGeometry args={[l + 0.2, w + 0.2]} />
        <meshBasicMaterial
          map={aoTex}
          transparent
          opacity={0.4}
          depthWrite={false}
        />
      </mesh>

      {/* Wooden walls - planks */}
      {planks.map((p, i) => (
        <mesh key={`plank-${i}`} position={[p.x, p.y, p.z]} castShadow>
          <boxGeometry args={[p.width, p.height * 0.93, p.depth]} />
          <meshStandardMaterial color={p.color} map={woodTex} roughness={0.85} />
        </mesh>
      ))}

      {/* Plank gap lines for wood texture effect */}
      {planks.filter((_, i) => i % 4 < 2).map((p, i) => (
        <mesh key={`gap-${i}`} position={[p.x, p.y + p.height * 0.47, p.z + (p.side === 'front' ? 0.001 : p.side === 'back' ? -0.001 : 0)]} castShadow={false}>
          <boxGeometry args={[p.side === 'left' || p.side === 'right' ? p.depth + 0.001 : p.width, 0.003, p.side === 'left' || p.side === 'right' ? p.depth : p.depth + 0.001]} />
          <meshStandardMaterial color={WOOD_DARK} transparent opacity={0.4} />
        </mesh>
      ))}

      {/* Corner posts - rounded cylinders for cozy cartoon look */}
      {corners.map((c, i) => (
        <group key={`corner-${i}`}>
          <mesh position={[c.x, h / 2, c.z]} castShadow>
            <cylinderGeometry args={[0.03, 0.035, h + 0.05, 6]} />
            <meshStandardMaterial color="#6A4820" roughness={0.85} />
          </mesh>
          {/* Corner post dome cap */}
          <mesh position={[c.x, h + 0.03, c.z]} castShadow>
            <sphereGeometry args={[0.038, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#907040" roughness={0.75} />
          </mesh>
        </group>
      ))}

      {/* Top trim rails - wider decorative cap for finished look */}
      {topRails.map((rail, i) => (
        <mesh key={`trim-${i}`} position={[rail.x, h + 0.012, rail.z]} rotation={[0, rail.rotY, 0]} castShadow>
          <boxGeometry args={[rail.len, 0.025, wallThickness + 0.025]} />
          <meshStandardMaterial color="#B09058" roughness={0.7} />
        </mesh>
      ))}

      {/* Soil fill */}
      <mesh position={[0, h - 0.02, 0]} receiveShadow>
        <boxGeometry args={[l - wallThickness * 2, 0.04, w - wallThickness * 2]} />
        <meshStandardMaterial color={soilColor} map={soilTex} roughness={0.95} />
      </mesh>

      {/* Soil row lines */}
      {soilRows.map((row, i) => (
        <mesh key={`soil-row-${i}`} rotation={[-Math.PI / 2, 0, 0]}
          position={[0, h - 0.005, row.z]} receiveShadow>
          <planeGeometry args={[l - wallThickness * 4, 0.01]} />
          <meshStandardMaterial color="#1A0D05" transparent opacity={0.25} />
        </mesh>
      ))}

      {/* Soil moisture variation patches */}
      {[0, 1, 2].map((i) => {
        const rng = (seed: number) => {
          const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
          return x - Math.floor(x);
        };
        return (
          <mesh key={`moist-bed-${i}`} rotation={[-Math.PI / 2, 0, 0]}
            position={[(rng(i * 4.3 + bed.x) - 0.5) * (l * 0.6), h - 0.003, (rng(i * 7.1 + bed.z) - 0.5) * (w * 0.6)]}
            receiveShadow>
            <circleGeometry args={[0.06 + rng(i * 2.7) * 0.04, 6]} />
            <meshStandardMaterial color="#1A0D05" transparent opacity={0.2} />
          </mesh>
        );
      })}

      {/* Inner bottom - darker soil layer visible through the top */}
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[l - wallThickness * 2, 0.03, w - wallThickness * 2]} />
        <meshStandardMaterial color="#1A0D05" roughness={1} />
      </mesh>

      {/* Selection ring */}
      {isSelected && (
        <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, h + 0.02, 0]}>
          <ringGeometry args={[Math.max(l, w) * 0.55, Math.max(l, w) * 0.6, 24]} />
          <meshBasicMaterial color="#FDE047" transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Hover / info label */}
      <Html position={[0, h + 0.18, 0]} center distanceFactor={6} style={{ pointerEvents: 'none' }}>
        <div style={{
          background: isSelected ? 'rgba(210, 160, 108, 0.9)' : 'rgba(0,0,0,0.6)',
          borderRadius: '8px',
          padding: isSelected ? '4px 12px' : '2px 8px',
          fontSize: isSelected ? '11px' : '9px',
          fontFamily: '"Nunito", sans-serif',
          color: isSelected ? '#FFF8F0' : '#D4A06C',
          whiteSpace: 'nowrap',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          border: isSelected ? '1px solid #D4A06C' : 'none',
          boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.3)' : 'none',
        }}>
          <span style={{ fontSize: isSelected ? '12px' : '10px' }}>{'\uD83E\uDDF1'}</span>
          <span style={{ fontWeight: isSelected ? 'bold' : 'normal' }}>{bed.name}</span>
          <span style={{ color: isSelected ? '#FFF8F0' : '#9CA3AF', fontSize: '9px' }}>
            {bed.lengthM}x{bed.widthM}m
          </span>
          {isSelected && (
            <span style={{ fontSize: '9px', opacity: 0.7 }}>
              | {RAISED_BED_SOIL_LABELS[bed.soilType]}
            </span>
          )}
        </div>
      </Html>

      {/* Dimension markers when selected */}
      {isSelected && (
        <>
          {/* Length marker */}
          <Html position={[0, h + 0.06, -w / 2 - 0.15]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
            <div style={{
              background: 'rgba(168, 85, 247, 0.7)',
              borderRadius: '4px',
              padding: '1px 6px',
              fontSize: '8px',
              fontFamily: '"Nunito", sans-serif',
              color: 'white',
              whiteSpace: 'nowrap',
            }}>
              {bed.lengthM}m
            </div>
          </Html>
          {/* Width marker */}
          <Html position={[l / 2 + 0.15, h + 0.06, 0]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
            <div style={{
              background: 'rgba(168, 85, 247, 0.7)',
              borderRadius: '4px',
              padding: '1px 6px',
              fontSize: '8px',
              fontFamily: '"Nunito", sans-serif',
              color: 'white',
              whiteSpace: 'nowrap',
            }}>
              {bed.widthM}m
            </div>
          </Html>
        </>
      )}
    </group>
  );
}
