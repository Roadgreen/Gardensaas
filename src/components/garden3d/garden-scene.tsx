'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { GardenConfig, Plant } from '@/types';
import { GardenerCharacter, getSeason, getTimeOfDay, getSeasonalDialogue, getRandomAdvice } from './gardener-character';
import { GardenTerrain } from './garden-terrain';
import { Plant3D } from './plant-3d';
import { GardenDecorations } from './garden-decorations';
import { GardenUIOverlay } from './garden-ui-overlay';
import { useGarden } from '@/lib/hooks';

interface GardenSceneProps {
  config: GardenConfig;
}

// Sky dome with day/night cycle
function SkyDome({ season, timeOfDay }: { season: string; timeOfDay: string }) {
  const meshRef = useRef<THREE.Mesh>(null);

  const colors = useMemo(() => {
    const palettes: Record<string, Record<string, [string, string]>> = {
      morning: {
        spring: ['#87CEEB', '#FFE4B5'],
        summer: ['#64B5F6', '#FFD54F'],
        autumn: ['#90CAF9', '#FFCC80'],
        winter: ['#B0BEC5', '#CFD8DC'],
      },
      afternoon: {
        spring: ['#42A5F5', '#E3F2FD'],
        summer: ['#1E88E5', '#BBDEFB'],
        autumn: ['#5C6BC0', '#E8EAF6'],
        winter: ['#78909C', '#ECEFF1'],
      },
      evening: {
        spring: ['#5C6BC0', '#FF8A65'],
        summer: ['#3949AB', '#FF7043'],
        autumn: ['#4527A0', '#FF6E40'],
        winter: ['#263238', '#546E7A'],
      },
    };
    return palettes[timeOfDay]?.[season] || ['#87CEEB', '#FFE4B5'];
  }, [season, timeOfDay]);

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

// Sun/Moon
function CelestialBody({ timeOfDay, season }: { timeOfDay: string; season: string }) {
  const bodyRef = useRef<THREE.Mesh>(null);

  const sunAngle = useMemo(() => {
    const hour = new Date().getHours();
    // Map 6-18 to 0-PI
    const normalizedHour = Math.max(0, Math.min(1, (hour - 6) / 12));
    return normalizedHour * Math.PI;
  }, []);

  const isNight = timeOfDay === 'evening' && new Date().getHours() > 20;

  const position = useMemo((): [number, number, number] => {
    const x = Math.cos(sunAngle) * 20;
    const y = Math.sin(sunAngle) * 15 + 5;
    return [x, Math.max(y, 3), -10];
  }, [sunAngle]);

  return (
    <group>
      {/* Sun or Moon */}
      <mesh ref={bodyRef} position={position}>
        <sphereGeometry args={[isNight ? 1.5 : 2, 12, 8]} />
        <meshBasicMaterial color={isNight ? '#FFF9C4' : '#FFF176'} />
      </mesh>

      {/* Sun glow */}
      {!isNight && (
        <mesh position={position}>
          <sphereGeometry args={[3, 12, 8]} />
          <meshBasicMaterial color="#FFF176" transparent opacity={0.15} />
        </mesh>
      )}

      {/* Stars at evening */}
      {timeOfDay === 'evening' && (
        <group>
          {Array.from({ length: 30 }).map((_, i) => {
            const theta = (i / 30) * Math.PI * 2;
            const phi = Math.random() * Math.PI * 0.4 + 0.2;
            return (
              <mesh
                key={`star-${i}`}
                position={[
                  Math.sin(phi) * Math.cos(theta) * 40,
                  Math.cos(phi) * 30 + 10,
                  Math.sin(phi) * Math.sin(theta) * 40,
                ]}
              >
                <sphereGeometry args={[0.1, 4, 3]} />
                <meshBasicMaterial color="#FFFFFF" />
              </mesh>
            );
          })}
        </group>
      )}

      {/* Clouds */}
      {timeOfDay !== 'evening' && (
        <group>
          <Cloud position={[8, 12, -5]} scale={1} />
          <Cloud position={[-6, 14, -8]} scale={0.7} />
          <Cloud position={[3, 11, 5]} scale={0.85} />
          {season === 'winter' && <Cloud position={[-3, 10, -3]} scale={1.2} />}
        </group>
      )}
    </group>
  );
}

function Cloud({ position, scale }: { position: [number, number, number]; scale: number }) {
  const cloudRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!cloudRef.current) return;
    const time = performance.now() * 0.0001;
    cloudRef.current.position.x = position[0] + Math.sin(time + position[2]) * 2;
  });

  return (
    <group ref={cloudRef} position={position} scale={scale}>
      <mesh>
        <sphereGeometry args={[1, 6, 4]} />
        <meshStandardMaterial color="white" transparent opacity={0.85} />
      </mesh>
      <mesh position={[0.8, -0.1, 0]}>
        <sphereGeometry args={[0.7, 6, 4]} />
        <meshStandardMaterial color="white" transparent opacity={0.85} />
      </mesh>
      <mesh position={[-0.6, -0.15, 0.2]}>
        <sphereGeometry args={[0.6, 6, 4]} />
        <meshStandardMaterial color="white" transparent opacity={0.85} />
      </mesh>
      <mesh position={[0.3, 0.3, -0.1]}>
        <sphereGeometry args={[0.5, 6, 4]} />
        <meshStandardMaterial color="white" transparent opacity={0.85} />
      </mesh>
    </group>
  );
}

// Camera controller for isometric toggle
function CameraController({ isIsometric }: { isIsometric: boolean }) {
  const { camera } = useThree();
  const targetRef = useRef({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    if (isIsometric) {
      targetRef.current = { x: 5, y: 5, z: 5 };
    } else {
      targetRef.current = { x: 3, y: 4, z: 5 };
    }
  }, [isIsometric]);

  useFrame(() => {
    if (isIsometric) {
      // Smoothly move to isometric position
      camera.position.x += (targetRef.current.x - camera.position.x) * 0.05;
      camera.position.y += (targetRef.current.y - camera.position.y) * 0.05;
      camera.position.z += (targetRef.current.z - camera.position.z) * 0.05;
    }
  });

  return null;
}

// Lighting setup
function SceneLighting({ timeOfDay, season }: { timeOfDay: string; season: string }) {
  const ambientIntensity = useMemo(() => {
    if (timeOfDay === 'evening') return 0.3;
    if (timeOfDay === 'morning') return 0.5;
    return 0.6;
  }, [timeOfDay]);

  const directionalIntensity = useMemo(() => {
    if (timeOfDay === 'evening') return 0.4;
    if (season === 'winter') return 0.6;
    return 1.0;
  }, [timeOfDay, season]);

  const lightColor = useMemo(() => {
    if (timeOfDay === 'evening') return '#FF8C69';
    if (timeOfDay === 'morning') return '#FFE4B5';
    if (season === 'winter') return '#E0E0E0';
    return '#FFFFFF';
  }, [timeOfDay, season]);

  const hour = new Date().getHours();
  const sunAngle = Math.max(0, Math.min(1, (hour - 6) / 12)) * Math.PI;

  return (
    <>
      <ambientLight intensity={ambientIntensity} color={lightColor} />
      <directionalLight
        position={[Math.cos(sunAngle) * 8, Math.sin(sunAngle) * 6 + 3, -5]}
        intensity={directionalIntensity}
        color={lightColor}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={30}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      {/* Fill light */}
      <directionalLight
        position={[-3, 2, 3]}
        intensity={0.2}
        color="#B3E5FC"
      />
      {/* Hemisphere for ground bounce */}
      <hemisphereLight
        args={[
          season === 'winter' ? '#B0BEC5' : '#87CEEB',
          season === 'winter' ? '#E0E0E0' : '#4CAF50',
          0.3,
        ]}
      />
    </>
  );
}

// Inner scene content (used inside Canvas)
function SceneContent({
  config,
  selectedPlantIndex,
  onSelectPlant,
  season,
  timeOfDay,
  gardenerDialogue,
  showGardenerDialogue,
  onGardenerClick,
  onDialogueClose,
  isIsometric,
  plants,
}: {
  config: GardenConfig;
  selectedPlantIndex: number | null;
  onSelectPlant: (index: number | null) => void;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  gardenerDialogue: string;
  showGardenerDialogue: boolean;
  onGardenerClick: () => void;
  onDialogueClose: () => void;
  isIsometric: boolean;
  plants: Plant[];
}) {
  const halfL = config.length / 2;
  const halfW = config.width / 2;

  return (
    <>
      <SceneLighting timeOfDay={timeOfDay} season={season} />
      <SkyDome season={season} timeOfDay={timeOfDay} />
      <CelestialBody timeOfDay={timeOfDay} season={season} />
      <CameraController isIsometric={isIsometric} />

      {/* Orbit controls */}
      <OrbitControls
        makeDefault
        enablePan
        enableZoom
        enableRotate
        minDistance={2}
        maxDistance={15}
        maxPolarAngle={Math.PI / 2.1}
        minPolarAngle={0.2}
        target={[0, 0, 0]}
      />

      {/* Fog for depth */}
      <fog attach="fog" args={[
        timeOfDay === 'evening' ? '#1a1a3e' : season === 'winter' ? '#D0D8E0' : '#C8E6C9',
        10,
        40,
      ]} />

      {/* Terrain */}
      <GardenTerrain
        length={config.length}
        width={config.width}
        soilType={config.soilType}
        plantPositions={config.plantedItems.map((item) => ({ x: item.x, z: item.z }))}
        season={season}
      />

      {/* Plants */}
      {config.plantedItems.map((item, index) => {
        const plantData = plants.find((p) => p.id === item.plantId);
        if (!plantData) return null;

        // Convert grid coords to world coords
        const worldX = -halfL + (item.x / 100) * config.length;
        const worldZ = -halfW + (item.z / 100) * config.width;

        return (
          <Plant3D
            key={`plant-${index}`}
            plant={plantData}
            position={[worldX, 0, worldZ]}
            plantedDate={item.plantedDate}
            isSelected={selectedPlantIndex === index}
            onSelect={() =>
              onSelectPlant(selectedPlantIndex === index ? null : index)
            }
          />
        );
      })}

      {/* Gardener character */}
      <GardenerCharacter
        position={[halfL + 0.5, 0, 0]}
        dialogue={gardenerDialogue}
        showDialogue={showGardenerDialogue}
        onAdviceRequest={onGardenerClick}
        onDialogueClose={onDialogueClose}
      />

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
        onClick={() => onSelectPlant(null)}
        visible={false}
      >
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </>
  );
}

export function GardenScene({ config }: GardenSceneProps) {
  const [selectedPlantIndex, setSelectedPlantIndex] = useState<number | null>(null);
  const [isIsometric, setIsIsometric] = useState(false);
  const [gardenerDialogue, setGardenerDialogue] = useState('');
  const [showGardenerDialogue, setShowGardenerDialogue] = useState(false);
  const [plants, setPlants] = useState<Plant[]>([]);

  const season = useMemo(() => getSeason(), []);
  const timeOfDay = useMemo(() => getTimeOfDay(), []);

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

  // Task count: plants needing water + harvest-ready
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

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        shadows
        camera={{
          position: [3, 4, 5],
          fov: 45,
          near: 0.1,
          far: 100,
        }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
        style={{ background: 'transparent' }}
      >
        <SceneContent
          config={config}
          selectedPlantIndex={selectedPlantIndex}
          onSelectPlant={setSelectedPlantIndex}
          season={season}
          timeOfDay={timeOfDay}
          gardenerDialogue={gardenerDialogue}
          showGardenerDialogue={showGardenerDialogue}
          onGardenerClick={handleGardenerClick}
          onDialogueClose={handleDialogueClose}
          isIsometric={isIsometric}
          plants={plants}
        />
      </Canvas>

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
      />
    </div>
  );
}
