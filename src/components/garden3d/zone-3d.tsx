'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import type { GardenZone } from '@/types';
import { SOIL_LABELS } from '@/types';

interface Zone3DProps {
  zone: GardenZone;
  gardenLength: number;
  gardenWidth: number;
  isSelected?: boolean;
  onSelect?: () => void;
  plantCount: number;
}

export function Zone3D({ zone, gardenLength, gardenWidth, isSelected, onSelect, plantCount }: Zone3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const halfGL = gardenLength / 2;
  const halfGW = gardenWidth / 2;

  // Convert percent position to world coords
  const worldX = -halfGL + (zone.x / 100) * gardenLength;
  const worldZ = -halfGW + (zone.z / 100) * gardenWidth;

  const borderColor = useMemo(() => new THREE.Color(zone.color), [zone.color]);

  // Selection highlight pulse
  const lineRef = useRef<THREE.Group>(null);
  useFrame(() => {
    if (lineRef.current && isSelected) {
      const t = performance.now() * 0.001;
      lineRef.current.children.forEach((child) => {
        if ((child as THREE.Mesh).material) {
          const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
          if (mat.opacity !== undefined) mat.opacity = 0.6 + Math.sin(t * 3) * 0.3;
        }
      });
    }
  });

  // Corner markers
  const corners = useMemo(() => {
    const hw = zone.widthM / 2;
    const hl = zone.lengthM / 2;
    const markerLen = Math.min(0.15, hw * 0.3, hl * 0.3);
    return [
      // top-left
      { points: [[-hl, 0.005, -hw], [-hl + markerLen, 0.005, -hw], [-hl, 0.005, -hw], [-hl, 0.005, -hw + markerLen]] },
      // top-right
      { points: [[hl, 0.005, -hw], [hl - markerLen, 0.005, -hw], [hl, 0.005, -hw], [hl, 0.005, -hw + markerLen]] },
      // bottom-left
      { points: [[-hl, 0.005, hw], [-hl + markerLen, 0.005, hw], [-hl, 0.005, hw], [-hl, 0.005, hw - markerLen]] },
      // bottom-right
      { points: [[hl, 0.005, hw], [hl - markerLen, 0.005, hw], [hl, 0.005, hw], [hl, 0.005, hw - markerLen]] },
    ];
  }, [zone.widthM, zone.lengthM]);

  // Border outline as dashed rect on the ground
  const borderPoints = useMemo(() => {
    const hw = zone.widthM / 2;
    const hl = zone.lengthM / 2;
    return [
      new THREE.Vector3(-hl, 0.003, -hw),
      new THREE.Vector3(hl, 0.003, -hw),
      new THREE.Vector3(hl, 0.003, hw),
      new THREE.Vector3(-hl, 0.003, hw),
      new THREE.Vector3(-hl, 0.003, -hw),
    ];
  }, [zone.widthM, zone.lengthM]);

  // borderGeom no longer needed - using Line from drei

  return (
    <group
      ref={groupRef}
      position={[worldX, 0, worldZ]}
      onClick={(e) => { e.stopPropagation(); onSelect?.(); }}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; }}
    >
      {/* Semi-transparent ground zone fill */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} receiveShadow>
        <planeGeometry args={[zone.lengthM, zone.widthM]} />
        <meshBasicMaterial
          color={zone.color}
          transparent
          opacity={isSelected ? 0.18 : 0.08}
          depthWrite={false}
        />
      </mesh>

      {/* Border line */}
      <group ref={lineRef}>
        <Line
          points={borderPoints.map(v => [v.x, v.y, v.z] as [number, number, number])}
          color={zone.color}
          lineWidth={1.5}
          dashed
          dashSize={0.1}
          gapSize={0.05}
          transparent
          opacity={isSelected ? 0.9 : 0.5}
        />
      </group>

      {/* Corner markers */}
      {corners.map((corner, i) => (
        <group key={`corner-${i}`}>
          {[0, 1].map((seg) => {
            const start = corner.points[seg * 2] as [number, number, number];
            const end = corner.points[seg * 2 + 1] as [number, number, number];
            return (
              <Line
                key={`seg-${seg}`}
                points={[start, end]}
                color={zone.color}
                lineWidth={2}
                transparent
                opacity={0.8}
              />
            );
          })}
        </group>
      ))}

      {/* Zone label */}
      <Html position={[0, 0.12, 0]} center distanceFactor={6} style={{ pointerEvents: 'none' }}>
        <div style={{
          background: isSelected ? `${zone.color}E6` : 'rgba(0,0,0,0.6)',
          borderRadius: '8px',
          padding: isSelected ? '4px 12px' : '2px 8px',
          fontSize: isSelected ? '11px' : '9px',
          fontFamily: '"Nunito", sans-serif',
          color: isSelected ? '#FFF' : zone.color,
          whiteSpace: 'nowrap',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          border: isSelected ? `1px solid ${zone.color}` : 'none',
          boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.3)' : 'none',
        }}>
          <span style={{
            width: '8px', height: '8px', borderRadius: '2px',
            background: isSelected ? '#FFF' : zone.color,
            display: 'inline-block',
          }} />
          <span style={{ fontWeight: isSelected ? 'bold' : 'normal' }}>{zone.name}</span>
          <span style={{ color: isSelected ? '#FFF' : '#9CA3AF', fontSize: '9px' }}>
            {zone.lengthM}x{zone.widthM}m
          </span>
          {isSelected && (
            <span style={{ fontSize: '9px', opacity: 0.8 }}>
              | {SOIL_LABELS[zone.soilType]} | {plantCount} plants
            </span>
          )}
        </div>
      </Html>

      {/* Dimension markers when selected */}
      {isSelected && (
        <>
          <Html position={[0, 0.04, -zone.widthM / 2 - 0.12]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
            <div style={{
              background: `${zone.color}B3`,
              borderRadius: '4px',
              padding: '1px 6px',
              fontSize: '8px',
              fontFamily: '"Nunito", sans-serif',
              color: 'white',
              whiteSpace: 'nowrap',
            }}>
              {zone.lengthM}m
            </div>
          </Html>
          <Html position={[zone.lengthM / 2 + 0.12, 0.04, 0]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
            <div style={{
              background: `${zone.color}B3`,
              borderRadius: '4px',
              padding: '1px 6px',
              fontSize: '8px',
              fontFamily: '"Nunito", sans-serif',
              color: 'white',
              whiteSpace: 'nowrap',
            }}>
              {zone.widthM}m
            </div>
          </Html>
        </>
      )}
    </group>
  );
}
