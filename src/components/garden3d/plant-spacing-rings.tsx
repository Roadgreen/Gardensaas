'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Plant, PlantedItem, GardenConfig } from '@/types';

interface PlantSpacingRingsProps {
  config: GardenConfig;
  plants: Plant[];
  showSpacing: boolean;
  selectedPlantType?: string | null;
}

interface SpacingConflict {
  indexA: number;
  indexB: number;
  distance: number;
  requiredDistance: number;
}

export function PlantSpacingRings({ config, plants, showSpacing, selectedPlantType }: PlantSpacingRingsProps) {
  const halfL = config.length / 2;
  const halfW = config.width / 2;

  // Compute conflicts
  const { rings, conflicts } = useMemo(() => {
    const ringData: Array<{
      x: number; z: number; radius: number; color: string; hasConflict: boolean;
    }> = [];
    const conflictData: SpacingConflict[] = [];

    config.plantedItems.forEach((item, i) => {
      const plantData = plants.find((p) => p.id === item.plantId);
      if (!plantData) return;

      const worldX = -halfL + (item.x / 100) * config.length;
      const worldZ = -halfW + (item.z / 100) * config.width;
      const radiusM = plantData.spacingCm / 100 / 2; // half-spacing as radius

      let hasConflict = false;

      // Check against other plants
      config.plantedItems.forEach((other, j) => {
        if (i >= j) return;
        const otherPlant = plants.find((p) => p.id === other.plantId);
        if (!otherPlant) return;

        const otherX = -halfL + (other.x / 100) * config.length;
        const otherZ = -halfW + (other.z / 100) * config.width;
        const dist = Math.sqrt((worldX - otherX) ** 2 + (worldZ - otherZ) ** 2);
        const requiredDist = (plantData.spacingCm + otherPlant.spacingCm) / 100 / 2;

        if (dist < requiredDist) {
          hasConflict = true;
          conflictData.push({ indexA: i, indexB: j, distance: dist, requiredDistance: requiredDist });
        }
      });

      ringData.push({
        x: worldX, z: worldZ,
        radius: radiusM,
        color: hasConflict ? '#EF4444' : plantData.color,
        hasConflict,
      });
    });

    return { rings: ringData, conflicts: conflictData };
  }, [config.plantedItems, plants, halfL, halfW, config.length, config.width]);

  // Also show preview ring for the selected plant type
  const previewRadius = useMemo(() => {
    if (!selectedPlantType) return 0;
    const p = plants.find((pl) => pl.id === selectedPlantType);
    return p ? p.spacingCm / 100 / 2 : 0;
  }, [selectedPlantType, plants]);

  if (!showSpacing) return null;

  return (
    <group>
      {/* Spacing circles for each planted item */}
      {rings.map((ring, i) => (
        <SpacingRing
          key={`spacing-${i}`}
          x={ring.x}
          z={ring.z}
          radius={ring.radius}
          color={ring.color}
          hasConflict={ring.hasConflict}
        />
      ))}

      {/* Conflict warning lines */}
      {conflicts.map((conflict, i) => {
        const itemA = config.plantedItems[conflict.indexA];
        const itemB = config.plantedItems[conflict.indexB];
        if (!itemA || !itemB) return null;

        const ax = -halfL + (itemA.x / 100) * config.length;
        const az = -halfW + (itemA.z / 100) * config.width;
        const bx = -halfL + (itemB.x / 100) * config.length;
        const bz = -halfW + (itemB.z / 100) * config.width;
        const midX = (ax + bx) / 2;
        const midZ = (az + bz) / 2;

        return (
          <group key={`conflict-${i}`}>
            {/* Red warning line between conflicting plants */}
            <ConflictLine ax={ax} az={az} bx={bx} bz={bz} />
            {/* Warning icon at midpoint */}
            <Html position={[midX, 0.3, midZ]} center distanceFactor={6} style={{ pointerEvents: 'none' }}>
              <div style={{
                background: 'rgba(239, 68, 68, 0.9)',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                border: '1px solid #FCA5A5',
                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
              }}>
                {'\u26A0'}
              </div>
            </Html>
          </group>
        );
      })}

      {/* Conflict count */}
      {conflicts.length > 0 && (
        <Html position={[halfL + 0.3, 0.5, -halfW - 0.3]} center distanceFactor={5} style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(239, 68, 68, 0.85)',
            borderRadius: '10px',
            padding: '4px 10px',
            fontSize: '11px',
            fontFamily: '"Nunito", sans-serif',
            color: 'white',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            border: '1px solid #FCA5A5',
          }}>
            {'\u26A0\uFE0F'} {conflicts.length} spacing conflict{conflicts.length !== 1 ? 's' : ''}
          </div>
        </Html>
      )}
    </group>
  );
}

function SpacingRing({ x, z, radius, color, hasConflict }: {
  x: number; z: number; radius: number; color: string; hasConflict: boolean;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!ref.current) return;
    const t = performance.now() * 0.001;
    if (hasConflict) {
      (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.15 + Math.sin(t * 4) * 0.1;
    }
  });

  return (
    <group>
      {/* Filled circle on ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.052, z]}>
        <circleGeometry args={[radius, 24]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={hasConflict ? 0.12 : 0.06}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Ring outline */}
      <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.053, z]}>
        <ringGeometry args={[radius - 0.01, radius, 24]} />
        <meshBasicMaterial
          color={hasConflict ? '#EF4444' : color}
          transparent
          opacity={hasConflict ? 0.4 : 0.25}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

function ConflictLine({ ax, az, bx, bz }: { ax: number; az: number; bx: number; bz: number }) {
  const ref = useRef<THREE.Line>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array([ax, 0.06, az, bx, 0.06, bz]);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [ax, az, bx, bz]);

  const material = useMemo(() => new THREE.LineBasicMaterial({
    color: '#EF4444',
    transparent: true,
    opacity: 0.6,
    linewidth: 2,
  }), []);

  useFrame(() => {
    if (ref.current) {
      const t = performance.now() * 0.001;
      material.opacity = 0.3 + Math.sin(t * 5) * 0.3;
    }
  });

  return <primitive ref={ref} object={new THREE.Line(geometry, material)} />;
}
