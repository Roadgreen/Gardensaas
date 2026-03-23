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
  plantAName: string;
  plantBName: string;
}

export function PlantSpacingRings({ config, plants, showSpacing, selectedPlantType }: PlantSpacingRingsProps) {
  const halfL = config.length / 2;
  const halfW = config.width / 2;

  // Compute conflicts and rings
  const { rings, conflicts, companionPairs, enemyPairs } = useMemo(() => {
    const ringData: Array<{
      x: number; z: number; radius: number; color: string; hasConflict: boolean;
      spacingCm: number; plantName: string;
    }> = [];
    const conflictData: SpacingConflict[] = [];
    const companionData: Array<{ ax: number; az: number; bx: number; bz: number }> = [];
    const enemyData: Array<{ ax: number; az: number; bx: number; bz: number; nameA: string; nameB: string }> = [];

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
          conflictData.push({
            indexA: i, indexB: j, distance: dist, requiredDistance: requiredDist,
            plantAName: plantData.name.en, plantBName: otherPlant.name.en,
          });
        }

        // Check companion/enemy relationships for nearby plants
        if (dist < 2) {
          if (plantData.companionPlants.includes(otherPlant.id) || otherPlant.companionPlants.includes(plantData.id)) {
            companionData.push({ ax: worldX, az: worldZ, bx: otherX, bz: otherZ });
          }
          if (plantData.enemyPlants.includes(otherPlant.id) || otherPlant.enemyPlants.includes(plantData.id)) {
            enemyData.push({ ax: worldX, az: worldZ, bx: otherX, bz: otherZ, nameA: plantData.name.en, nameB: otherPlant.name.en });
          }
        }
      });

      ringData.push({
        x: worldX, z: worldZ,
        radius: radiusM,
        color: hasConflict ? '#EF4444' : plantData.color,
        hasConflict,
        spacingCm: plantData.spacingCm,
        plantName: plantData.name.en,
      });
    });

    return { rings: ringData, conflicts: conflictData, companionPairs: companionData, enemyPairs: enemyData };
  }, [config.plantedItems, plants, halfL, halfW, config.length, config.width]);

  // Compute snap grid for selected plant type
  const snapGrid = useMemo(() => {
    if (!selectedPlantType) return null;
    const p = plants.find((pl) => pl.id === selectedPlantType);
    if (!p) return null;
    const spacingM = p.spacingCm / 100;
    const rowSpacingM = (p.rowSpacingCm || Math.round(p.spacingCm * 1.5)) / 100;
    return { spacingM, rowSpacingM };
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
          spacingCm={ring.spacingCm}
        />
      ))}

      {/* Companion plant connections (green dashed) */}
      {companionPairs.map((pair, i) => (
        <CompanionLine key={`comp-${i}`} ax={pair.ax} az={pair.az} bx={pair.bx} bz={pair.bz} />
      ))}

      {/* Enemy plant warnings (red lines) */}
      {enemyPairs.map((pair, i) => (
        <group key={`enemy-${i}`}>
          <ConflictLine ax={pair.ax} az={pair.az} bx={pair.bx} bz={pair.bz} />
          <Html
            position={[(pair.ax + pair.bx) / 2, 0.35, (pair.az + pair.bz) / 2]}
            center distanceFactor={6} style={{ pointerEvents: 'none', zIndex: 10 }}
          >
            <div style={{
              background: 'rgba(239, 68, 68, 0.85)',
              borderRadius: '8px',
              padding: '2px 8px',
              fontSize: '9px',
              fontFamily: '"Nunito", sans-serif',
              color: 'white',
              whiteSpace: 'nowrap',
              border: '1px solid #FCA5A5',
            }}>
              {'\u26A0'} Bad neighbors!
            </div>
          </Html>
        </group>
      ))}

      {/* Spacing conflict warning lines */}
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
        const distCm = Math.round(conflict.distance * 100);
        const neededCm = Math.round(conflict.requiredDistance * 100);

        return (
          <group key={`conflict-${i}`}>
            {/* Red warning line between conflicting plants */}
            <ConflictLine ax={ax} az={az} bx={bx} bz={bz} />
            {/* Warning icon at midpoint */}
            <Html position={[midX, 0.3, midZ]} center distanceFactor={6} style={{ pointerEvents: 'none', zIndex: 10 }}>
              <div style={{
                background: 'rgba(239, 68, 68, 0.9)',
                borderRadius: '8px',
                padding: '3px 8px',
                fontSize: '9px',
                fontFamily: '"Nunito", sans-serif',
                color: 'white',
                whiteSpace: 'nowrap',
                border: '1px solid #FCA5A5',
                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
                textAlign: 'center',
              }}>
                <div>{'\u26A0'} Too close! {distCm}cm / {neededCm}cm needed</div>
              </div>
            </Html>
          </group>
        );
      })}

      {/* Snap grid visualization when placing a plant */}
      {snapGrid && (
        <SnapGridVisualization
          halfL={halfL}
          halfW={halfW}
          spacingM={snapGrid.spacingM}
          rowSpacingM={snapGrid.rowSpacingM}
        />
      )}

      {/* Conflict count */}
      {conflicts.length > 0 && (
        <Html position={[halfL + 0.3, 0.5, -halfW - 0.3]} center distanceFactor={5} style={{ pointerEvents: 'none', zIndex: 10 }}>
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

function SpacingRing({ x, z, radius, color, hasConflict, spacingCm }: {
  x: number; z: number; radius: number; color: string; hasConflict: boolean; spacingCm: number;
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
      {/* Spacing label on the ring edge */}
      <Html
        position={[x + radius * 0.7, 0.08, z - radius * 0.7]}
        center
        distanceFactor={8}
        style={{ pointerEvents: 'none', zIndex: 10 }}
      >
        <div style={{
          background: hasConflict ? 'rgba(239, 68, 68, 0.7)' : 'rgba(0,0,0,0.5)',
          borderRadius: '4px',
          padding: '1px 4px',
          fontSize: '8px',
          fontFamily: '"Nunito", sans-serif',
          color: hasConflict ? '#FEE2E2' : '#D1D5DB',
          whiteSpace: 'nowrap',
        }}>
          {spacingCm}cm
        </div>
      </Html>
    </group>
  );
}

function SnapGridVisualization({ halfL, halfW, spacingM, rowSpacingM }: {
  halfL: number; halfW: number; spacingM: number; rowSpacingM: number;
}) {
  const gridLines = useMemo(() => {
    const lines: Array<{ start: [number, number, number]; end: [number, number, number]; isRow: boolean }> = [];

    // Column lines (plant spacing)
    for (let x = -halfL; x <= halfL + 0.001; x += spacingM) {
      lines.push({
        start: [x, 0.054, -halfW],
        end: [x, 0.054, halfW],
        isRow: false,
      });
    }
    // Row lines (row spacing)
    for (let z = -halfW; z <= halfW + 0.001; z += rowSpacingM) {
      lines.push({
        start: [-halfL, 0.054, z],
        end: [halfL, 0.054, z],
        isRow: true,
      });
    }

    return lines;
  }, [halfL, halfW, spacingM, rowSpacingM]);

  return (
    <group>
      {gridLines.map((line, i) => (
        <SnapGridLine key={`snap-${i}`} start={line.start} end={line.end} isRow={line.isRow} />
      ))}
    </group>
  );
}

function SnapGridLine({ start, end, isRow }: { start: [number, number, number]; end: [number, number, number]; isRow: boolean }) {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array([...start, ...end]);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [start, end]);

  const material = useMemo(() => new THREE.LineBasicMaterial({
    color: isRow ? '#A78BFA' : '#C084FC',
    transparent: true,
    opacity: 0.2,
    linewidth: 1,
  }), [isRow]);

  return <primitive object={new THREE.Line(geometry, material)} />;
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

function CompanionLine({ ax, az, bx, bz }: { ax: number; az: number; bx: number; bz: number }) {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array([ax, 0.055, az, bx, 0.055, bz]);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [ax, az, bx, bz]);

  const material = useMemo(() => new THREE.LineBasicMaterial({
    color: '#4ADE80',
    transparent: true,
    opacity: 0.3,
    linewidth: 1,
  }), []);

  return <primitive object={new THREE.Line(geometry, material)} />;
}
