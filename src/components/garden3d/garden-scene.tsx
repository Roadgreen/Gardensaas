'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { GardenConfig, Plant } from '@/types';
import { GardenTerrain } from './garden-terrain';

// Utility functions (moved from gardener-character.tsx which is now removed)
function getSeason(): 'spring' | 'summer' | 'autumn' | 'winter' {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
}

function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'evening';
}
import { Plant3D } from './plant-3d';
import { WeatherSystem } from './weather-effects';
import { RaisedBed3D } from './raised-bed-3d';
import { Zone3D } from './zone-3d';
import { PlantSpacingRings } from './plant-spacing-rings';

interface GardenSceneProps {
  config: GardenConfig;
  selectedPlantType?: string | null;
  onPlantAdded?: () => void;
  showSpacing?: boolean;
  selectedBedId?: string | null;
  onSelectBed?: (bedId: string | null) => void;
  selectedZoneId?: string | null;
  onSelectZone?: (zoneId: string | null) => void;
  locale?: string;
}

// ===== Sound Effects Placeholder System =====
// Call these to trigger sounds when audio is implemented.
// Each returns a no-op for now; replace with Howler/Web Audio later.
const SoundEffects = {
  play: (sound: 'plant' | 'water' | 'harvest' | 'click' | 'ambient' | 'footstep') => {
    // Placeholder: will be wired to actual audio files later.
    // Example future implementation:
    // const audio = new Audio(`/sounds/${sound}.mp3`);
    // audio.volume = 0.3; audio.play();
    if (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).__gardenSoundDebug) {
      console.log(`[SFX] ${sound}`);
    }
  },
};

// ===== Mobile Detection Hook =====
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

// ===== Canvas Resizer — handles orientation changes inside R3F context =====
function CanvasResizer() {
  const { gl, camera } = useThree();
  useEffect(() => {
    const handleResize = () => {
      const canvas = gl.domElement;
      const parent = canvas.parentElement;
      if (!parent) return;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      gl.setSize(w, h);
      if ('aspect' in camera) {
        (camera as THREE.PerspectiveCamera).aspect = w / h;
        (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
      }
    };
    // orientationchange: stagger resize calls so the browser settles
    const handleOrientationChange = () => {
      setTimeout(handleResize, 100);
      setTimeout(handleResize, 300);
      setTimeout(handleResize, 600);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [gl, camera]);
  return null;
}

// Sky dome with day/night cycle - smooth color transitions
function SkyDome({ season, timeOfDay }: { season: string; timeOfDay: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const colors = useMemo(() => {
    const palettes: Record<string, Record<string, [string, string]>> = {
      morning: {
        spring: ['#7EC8F0', '#FFF3D0'],
        summer: ['#60B8E8', '#FFE0A0'],
        autumn: ['#D0A878', '#FFE0C0'],
        winter: ['#C0D0E0', '#F0ECE8'],
      },
      afternoon: {
        spring: ['#4AADE0', '#FFF8E0'],
        summer: ['#38A0D8', '#FFF0D0'],
        autumn: ['#C09060', '#FFF0D0'],
        winter: ['#A0B8D0', '#F5F0EC'],
      },
      evening: {
        spring: ['#7050B0', '#FF9060'],
        summer: ['#5048B0', '#FF8050'],
        autumn: ['#604080', '#FF7848'],
        winter: ['#303848', '#506070'],
      },
    };
    return palettes[timeOfDay]?.[season] || ['#4AADE0', '#FFF3E0'];
  }, [season, timeOfDay]);

  const topColor = useMemo(() => new THREE.Color(colors[0]), [colors]);
  const bottomColor = useMemo(() => new THREE.Color(colors[1]), [colors]);

  // Smooth color lerp over time for subtle day/night feel
  useFrame(() => {
    if (!meshRef.current) return;
    const t = performance.now() * 0.0001;
    const shift = Math.sin(t) * 0.03;
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    const c = topColor.clone();
    c.r = Math.max(0, Math.min(1, c.r + shift));
    c.g = Math.max(0, Math.min(1, c.g + shift * 0.5));
    c.b = Math.max(0, Math.min(1, c.b - shift * 0.3));
    mat.color.copy(c);
  });

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
  const glowRef = useRef<THREE.Mesh>(null);

  const sunAngle = useMemo(() => {
    const hour = new Date().getHours();
    const normalizedHour = Math.max(0, Math.min(1, (hour - 6) / 12));
    return normalizedHour * Math.PI;
  }, []);

  const isNight = timeOfDay === 'evening' && new Date().getHours() > 20;

  const position = useMemo((): [number, number, number] => {
    const x = Math.cos(sunAngle) * 20;
    const y = Math.sin(sunAngle) * 15 + 5;
    return [x, Math.max(y, 3), -10];
  }, [sunAngle]);

  useFrame(() => {
    if (glowRef.current && !isNight) {
      const t = performance.now() * 0.001;
      const pulse = 0.12 + Math.sin(t * 0.5) * 0.05;
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = pulse;
    }
  });

  return (
    <group>
      <mesh ref={bodyRef} position={position}>
        <sphereGeometry args={[isNight ? 1.5 : 2, 12, 8]} />
        <meshBasicMaterial color={isNight ? '#FFF9C4' : '#FFF176'} />
      </mesh>

      {!isNight && (
        <mesh ref={glowRef} position={position}>
          <sphereGeometry args={[3, 12, 8]} />
          <meshBasicMaterial color="#FFF176" transparent opacity={0.15} />
        </mesh>
      )}

      {timeOfDay === 'evening' && (
        <group>
          {Array.from({ length: 40 }).map((_, i) => {
            const theta = (i / 40) * Math.PI * 2;
            const phi = Math.random() * Math.PI * 0.4 + 0.2;
            return (
              <TwinkleStar
                key={`star-${i}`}
                position={[
                  Math.sin(phi) * Math.cos(theta) * 40,
                  Math.cos(phi) * 30 + 10,
                  Math.sin(phi) * Math.sin(theta) * 40,
                ]}
                speed={0.5 + Math.random() * 2}
                offset={Math.random() * Math.PI * 2}
              />
            );
          })}
        </group>
      )}

      {timeOfDay !== 'evening' && (
        <group>
          <Cloud position={[8, 12, -5]} scale={1} />
          <Cloud position={[-6, 14, -8]} scale={0.7} />
          <Cloud position={[3, 11, 5]} scale={0.85} />
          <Cloud position={[-12, 13, -3]} scale={0.6} />
          <Cloud position={[15, 11, 2]} scale={0.9} />
          <Cloud position={[-8, 15, 6]} scale={0.5} />
          {season === 'winter' && <Cloud position={[-3, 10, -3]} scale={1.2} />}
          {season === 'winter' && <Cloud position={[5, 9, 4]} scale={1.1} />}
        </group>
      )}
    </group>
  );
}

function TwinkleStar({ position, speed, offset }: { position: [number, number, number]; speed: number; offset: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!ref.current) return;
    const t = performance.now() * 0.001;
    const twinkle = (Math.sin(t * speed + offset) + 1) / 2;
    ref.current.scale.setScalar(0.5 + twinkle * 0.8);
    (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.4 + twinkle * 0.6;
  });

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.1, 4, 3]} />
      <meshBasicMaterial color="#FFFFFF" transparent opacity={0.8} />
    </mesh>
  );
}

function Cloud({ position, scale }: { position: [number, number, number]; scale: number }) {
  const cloudRef = useRef<THREE.Group>(null);
  const driftSpeed = useRef(0.15 + Math.random() * 0.25);
  const startX = useRef(position[0]);

  useFrame(() => {
    if (!cloudRef.current) return;
    const time = performance.now() * 0.001;
    // Clouds drift continuously across the sky
    const drift = (time * driftSpeed.current) % 50;
    cloudRef.current.position.x = startX.current + drift - 25;
    cloudRef.current.position.y = position[1] + Math.sin(time * 0.2 + position[2]) * 0.3;
    // Wrap around when too far
    if (cloudRef.current.position.x > 25) {
      startX.current -= 50;
    }
  });

  return (
    <group ref={cloudRef} position={position} scale={scale}>
      {/* Fluffier, rounder cloud blobs */}
      <mesh>
        <sphereGeometry args={[1, 10, 8]} />
        <meshStandardMaterial color="#FFFFFF" transparent opacity={0.88} roughness={1} />
      </mesh>
      <mesh position={[0.85, -0.05, 0.1]}>
        <sphereGeometry args={[0.8, 9, 7]} />
        <meshStandardMaterial color="#FAFAFA" transparent opacity={0.85} roughness={1} />
      </mesh>
      <mesh position={[-0.65, -0.1, 0.15]}>
        <sphereGeometry args={[0.7, 9, 7]} />
        <meshStandardMaterial color="#FAFAFA" transparent opacity={0.85} roughness={1} />
      </mesh>
      <mesh position={[0.25, 0.4, -0.05]}>
        <sphereGeometry args={[0.6, 8, 6]} />
        <meshStandardMaterial color="#FFFFFF" transparent opacity={0.82} roughness={1} />
      </mesh>
      <mesh position={[1.45, 0, 0.1]}>
        <sphereGeometry args={[0.55, 8, 6]} />
        <meshStandardMaterial color="#FAFAFA" transparent opacity={0.8} roughness={1} />
      </mesh>
      <mesh position={[-0.3, 0.2, -0.2]}>
        <sphereGeometry args={[0.5, 7, 5]} />
        <meshStandardMaterial color="#FFFFFF" transparent opacity={0.78} roughness={1} />
      </mesh>
    </group>
  );
}

// Camera controller with smooth focus transitions
function CameraController({
  isIsometric,
  focusTarget,
  gardenLength,
  gardenWidth,
}: {
  isIsometric: boolean;
  focusTarget: THREE.Vector3 | null;
  gardenLength: number;
  gardenWidth: number;
}) {
  const { camera } = useThree();
  const targetRef = useRef({ x: 0, y: 0, z: 0 });
  const focusLerpRef = useRef(0);

  // Scale camera distance to garden size
  const maxDim = Math.max(gardenLength, gardenWidth);
  const camScale = Math.max(1, maxDim / 5); // 5m is the reference size

  useEffect(() => {
    if (isIsometric) {
      targetRef.current = { x: 4.5 * camScale, y: 5.5 * camScale, z: 4.5 * camScale };
    } else {
      targetRef.current = { x: 3.5 * camScale, y: 4.5 * camScale, z: 5.5 * camScale };
    }
  }, [isIsometric, camScale]);

  useEffect(() => {
    if (focusTarget) {
      focusLerpRef.current = 0;
    }
  }, [focusTarget]);

  useFrame((_, delta) => {
    if (isIsometric) {
      camera.position.x += (targetRef.current.x - camera.position.x) * 0.05;
      camera.position.y += (targetRef.current.y - camera.position.y) * 0.05;
      camera.position.z += (targetRef.current.z - camera.position.z) * 0.05;
    }

    // Smooth camera focus on selected plant
    if (focusTarget && focusLerpRef.current < 1) {
      focusLerpRef.current = Math.min(focusLerpRef.current + delta * 1.5, 1);
      const t = focusLerpRef.current;
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const targetPos = new THREE.Vector3(
        focusTarget.x + 1.5,
        focusTarget.y + 2,
        focusTarget.z + 2.5
      );
      camera.position.lerp(targetPos, eased * 0.03);
    }
  });

  return null;
}

// Lighting setup with warm Animal Crossing / Stardew Valley cozy tones
function SceneLighting({ timeOfDay, season }: { timeOfDay: string; season: string }) {
  const ambientIntensity = useMemo(() => {
    if (timeOfDay === 'evening') return 0.4;
    if (timeOfDay === 'morning') return 0.6;
    return 0.7;
  }, [timeOfDay]);

  const directionalIntensity = useMemo(() => {
    if (timeOfDay === 'evening') return 0.7;
    if (season === 'winter') return 0.9;
    return 1.4;
  }, [timeOfDay, season]);

  // Warmer, cozier light colors -- golden hour feel
  const lightColor = useMemo(() => {
    if (timeOfDay === 'evening') return '#FFB080';
    if (timeOfDay === 'morning') return '#FFEAC0';
    if (season === 'winter') return '#EAE6E2';
    if (season === 'autumn') return '#FFE0B8';
    return '#FFF5E0'; // Warm golden white
  }, [timeOfDay, season]);

  const hour = new Date().getHours();
  const sunAngle = Math.max(0, Math.min(1, (hour - 6) / 12)) * Math.PI;

  return (
    <>
      <ambientLight intensity={ambientIntensity} color={lightColor} />
      {/* Main directional light (sun) - soft cartoon shadows */}
      <directionalLight
        position={[Math.cos(sunAngle) * 8, Math.sin(sunAngle) * 6 + 4, -5]}
        intensity={directionalIntensity}
        color={lightColor}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={30}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-bias={-0.0005}
        shadow-radius={4}
      />
      {/* Warm fill light from opposite side -- reduces harsh shadows */}
      <directionalLight
        position={[-4, 3, 4]}
        intensity={0.3}
        color="#D8ECFF"
      />
      {/* Warm ground bounce light for cozy feel */}
      <directionalLight
        position={[0, -1, 0]}
        intensity={0.12}
        color="#A8E090"
      />
      {/* Hemisphere light: soft sky + warm ground tones */}
      <hemisphereLight
        args={[
          season === 'winter' ? '#C0D0E0' : season === 'autumn' ? '#E0C8A0' : '#B0E0F8',
          season === 'winter' ? '#E8E8E0' : '#80C868',
          0.4,
        ]}
      />
      {/* Evening cozy lantern glow */}
      {timeOfDay === 'evening' && (
        <>
          <pointLight position={[0, 0.8, 0]} intensity={0.5} color="#FFB868" distance={7} decay={2} />
          <pointLight position={[0, 1.5, 0]} intensity={0.2} color="#FFA050" distance={12} decay={2} />
        </>
      )}
      {/* Rim light for cartoon edge definition */}
      <directionalLight
        position={[-5, 4, -5]}
        intensity={0.15}
        color="#E8F0FF"
      />
      {/* Subtle top-down fill for even illumination */}
      <directionalLight
        position={[0, 8, 0]}
        intensity={0.1}
        color="#FFF8F0"
      />
    </>
  );
}

// Raycaster ground click handler for click-to-plant
function GroundClickHandler({
  config,
  isPlacementMode,
  onGroundClick,
}: {
  config: GardenConfig;
  isPlacementMode: boolean;
  onGroundClick: (x: number, z: number) => void;
}) {
  const { camera, raycaster } = useThree();
  const planeRef = useRef<THREE.Mesh>(null);
  const halfL = config.length / 2;
  const halfW = config.width / 2;

  if (!isPlacementMode) return null;

  return (
    <mesh
      ref={planeRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.05, 0]}
      onClick={(e) => {
        e.stopPropagation();
        const point = e.point;
        // Convert to raw percentage coords — snapping is handled by handleGroundClick
        // using the selected plant's spacing, so we must not pre-snap here
        const pctX = ((point.x + halfL) / config.length) * 100;
        const pctZ = ((point.z + halfW) / config.width) * 100;
        onGroundClick(pctX, pctZ);
      }}
      onPointerOver={() => {
        if (isPlacementMode) document.body.style.cursor = 'crosshair';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
      visible={false}
    >
      <planeGeometry args={[config.length * 3, config.width * 3]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
}

// Context menu for right-click plant actions
function PlantContextMenu({
  position,
  plantName,
  onWater,
  onRemove,
  onInfo,
  onClose,
  locale,
}: {
  position: { x: number; y: number };
  plantName: string;
  onWater: () => void;
  onRemove: () => void;
  onInfo: () => void;
  onClose: () => void;
  locale: string;
}) {
  useEffect(() => {
    const handler = () => onClose();
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 100,
        background: 'linear-gradient(145deg, rgba(15, 40, 24, 0.95), rgba(20, 50, 30, 0.95))',
        backdropFilter: 'blur(12px)',
        borderRadius: '12px',
        border: '2px solid rgba(74, 222, 128, 0.4)',
        padding: '6px',
        fontFamily: '"Nunito", system-ui, sans-serif',
        minWidth: '160px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{
          padding: '6px 12px',
          color: '#86EFAC',
          fontWeight: 'bold',
          fontSize: '13px',
          borderBottom: '1px solid rgba(74, 222, 128, 0.2)',
          marginBottom: '4px',
        }}
      >
        {plantName}
      </div>
      {[
        { label: locale === 'fr' ? 'Inspecter' : 'Inspect', icon: '\u{1F50D}', action: onInfo },
        { label: locale === 'fr' ? 'Arroser' : 'Water', icon: '\u{1F4A7}', action: onWater },
        { label: locale === 'fr' ? 'Supprimer' : 'Remove', icon: '\u{1F5D1}\u{FE0F}', action: onRemove, danger: true },
      ].map((item) => (
        <button
          key={item.label}
          onClick={(e) => {
            e.stopPropagation();
            item.action();
            onClose();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            width: '100%',
            padding: '8px 12px',
            background: 'transparent',
            border: 'none',
            color: (item as { danger?: boolean }).danger ? '#FCA5A5' : '#E5E7EB',
            fontSize: '12px',
            cursor: 'pointer',
            borderRadius: '8px',
            fontFamily: '"Nunito", system-ui, sans-serif',
            textAlign: 'left',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.08)';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.background = 'transparent';
          }}
        >
          <span>{item.icon}</span>
          {item.label}
        </button>
      ))}
    </div>
  );
}

// Garden dimension labels rendered in 3D
function GardenDimensionLabels({ length, width }: { length: number; width: number }) {
  const halfL = length / 2;
  const halfW = width / 2;

  return (
    <group>
      {/* Length label (along X axis, front) */}
      <Html
        position={[0, 0.08, halfW + 0.35]}
        center
        distanceFactor={7}
        style={{ pointerEvents: 'none' }}
      >
        <div style={{
          background: 'rgba(74, 222, 128, 0.2)',
          borderRadius: '6px',
          padding: '2px 10px',
          fontSize: '11px',
          fontFamily: '"Nunito", sans-serif',
          color: 'rgba(134, 239, 172, 0.9)',
          whiteSpace: 'nowrap',
          letterSpacing: '0.5px',
          fontWeight: 'bold',
          border: '1px solid rgba(74, 222, 128, 0.15)',
        }}>
          {'\u2194'} {length}m
        </div>
      </Html>
      {/* Width label (along Z axis, right) */}
      <Html
        position={[halfL + 0.35, 0.08, 0]}
        center
        distanceFactor={7}
        style={{ pointerEvents: 'none' }}
      >
        <div style={{
          background: 'rgba(74, 222, 128, 0.2)',
          borderRadius: '6px',
          padding: '2px 10px',
          fontSize: '11px',
          fontFamily: '"Nunito", sans-serif',
          color: 'rgba(134, 239, 172, 0.9)',
          whiteSpace: 'nowrap',
          letterSpacing: '0.5px',
          fontWeight: 'bold',
          border: '1px solid rgba(74, 222, 128, 0.15)',
        }}>
          {'\u2195'} {width}m
        </div>
      </Html>
      {/* Area label at corner */}
      <Html
        position={[halfL + 0.35, 0.08, halfW + 0.35]}
        center
        distanceFactor={9}
        style={{ pointerEvents: 'none' }}
      >
        <div style={{
          background: 'rgba(74, 222, 128, 0.1)',
          borderRadius: '4px',
          padding: '1px 6px',
          fontSize: '9px',
          fontFamily: '"Nunito", sans-serif',
          color: 'rgba(134, 239, 172, 0.6)',
          whiteSpace: 'nowrap',
        }}>
          {(length * width).toFixed(1)}m{'\u00B2'}
        </div>
      </Html>
    </group>
  );
}

// Inner scene content
function SceneContent({
  config,
  selectedPlantIndex,
  onSelectPlant,
  onRightClickPlant,
  season,
  timeOfDay,
  isIsometric,
  plants,
  activeTool,
  isPlacementMode,
  onGroundClick,
  focusTarget,
  weather,
  showSpacing,
  selectedBedId,
  onSelectBed,
  selectedZoneId,
  onSelectZone,
  selectedPlantType,
  isMobile = false,
}: {
  config: GardenConfig;
  selectedPlantIndex: number | null;
  onSelectPlant: (index: number | null) => void;
  onRightClickPlant: (index: number, event: MouseEvent) => void;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  isIsometric: boolean;
  plants: Plant[];
  activeTool: string | null;
  isPlacementMode: boolean;
  onGroundClick: (x: number, z: number) => void;
  focusTarget: THREE.Vector3 | null;
  weather: string;
  showSpacing: boolean;
  selectedBedId: string | null;
  onSelectBed: (bedId: string | null) => void;
  selectedZoneId: string | null;
  onSelectZone: (zoneId: string | null) => void;
  selectedPlantType: string | null;
  isMobile?: boolean;
}) {
  const locale = useLocale();
  const halfL = config.length / 2;
  const halfW = config.width / 2;
  const controlsRef = useRef<any>(null);

  // Get spacing for selected plant to use for grid snap
  const selectedPlantSpacingCm = useMemo(() => {
    if (!selectedPlantType || !isPlacementMode) return undefined;
    const p = plants.find((pl) => pl.id === selectedPlantType);
    return p?.spacingCm;
  }, [selectedPlantType, isPlacementMode, plants]);

  return (
    <>
      <SceneLighting timeOfDay={timeOfDay} season={season} />
      <SkyDome season={season} timeOfDay={timeOfDay} />
      <CelestialBody timeOfDay={timeOfDay} season={season} />
      <CameraController isIsometric={isIsometric} focusTarget={focusTarget} gardenLength={config.length} gardenWidth={config.width} />

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enablePan
        enableZoom
        enableRotate
        minDistance={1.5}
        maxDistance={Math.max(12, Math.max(config.length, config.width) * 2.5)}
        maxPolarAngle={Math.PI / 2.1}
        minPolarAngle={0.15}
        target={[0, 0, 0]}
        // Pan boundaries
        onChange={() => {
          if (controlsRef.current) {
            const target = controlsRef.current.target;
            // Allow panning further to see raised beds placed outside the garden
            const panMargin = Math.max(config.length, config.width) * 0.8;
            target.x = Math.max(-halfL - panMargin, Math.min(halfL + panMargin, target.x));
            target.z = Math.max(-halfW - panMargin, Math.min(halfW + panMargin, target.z));
            target.y = Math.max(-0.5, Math.min(3, target.y));
          }
        }}
        enableDamping
        dampingFactor={isMobile ? 0.12 : 0.08}
        // Touch controls for mobile — one finger rotates, two fingers pinch-zoom + pan
        touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
        // Smooth zoom
        zoomSpeed={isMobile ? 1.2 : 0.8}
        rotateSpeed={isMobile ? 0.8 : 0.6}
        panSpeed={isMobile ? 1.0 : 0.8}
      />

      {/* Soft fog for depth -- warm tones */}
      <fog attach="fog" args={[
        timeOfDay === 'evening' ? '#2A2030' : season === 'winter' ? '#E0E8F0' : season === 'autumn' ? '#F0DCC0' : '#D0F0C8',
        16,
        55,
      ]} />

      {/* Terrain */}
      <GardenTerrain
        length={config.length}
        width={config.width}
        soilType={config.soilType}
        plantPositions={config.plantedItems.map((item) => ({ x: item.x, z: item.z }))}
        season={season}
        showGrid={isPlacementMode}
        gridSpacingCm={selectedPlantSpacingCm}
        onGroundClick={(cx, cz) => onGroundClick(cx, cz)}
      />

      {/* Plants - with slight position jitter for natural look */}
      {config.plantedItems.map((item, index) => {
        const plantData = plants.find((p) => p.id === item.plantId);
        if (!plantData) return null;

        const worldX = -halfL + (item.x / 100) * config.length;
        const worldZ = -halfW + (item.z / 100) * config.width;

        // Deterministic jitter based on plant position for natural feel
        // Uses seeded hash so positions stay stable across renders
        const jitterSeed = item.x * 127.1 + item.z * 311.7 + index * 43.3;
        const jitterHash = (s: number) => {
          const x = Math.sin(s) * 43758.5453123;
          return x - Math.floor(x);
        };
        const jitterX = (jitterHash(jitterSeed) - 0.5) * 0.04; // +/- 2cm
        const jitterZ = (jitterHash(jitterSeed + 77.7) - 0.5) * 0.04;

        // Elevate plant if inside a raised bed
        let yOffset = 0;
        if (item.raisedBedId) {
          const bed = (config.raisedBeds || []).find((b) => b.id === item.raisedBedId);
          if (bed) {
            yOffset = bed.heightM - 0.02; // Place plant on top of bed soil
          }
        }

        return (
          <Plant3D
            key={`plant-${index}`}
            plant={plantData}
            position={[worldX + jitterX, yOffset, worldZ + jitterZ]}
            plantedDate={item.plantedDate}
            isSelected={selectedPlantIndex === index}
            isWatering={activeTool === 'water' && selectedPlantIndex === index}
            onSelect={() =>
              onSelectPlant(selectedPlantIndex === index ? null : index)
            }
            onContextMenu={(e) => onRightClickPlant(index, e)}
          />
        );
      })}

      {/* Plant spacing visualization */}
      <PlantSpacingRings
        config={config}
        plants={plants}
        showSpacing={showSpacing}
        selectedPlantType={isPlacementMode ? selectedPlantType : null}
      />

      {/* Garden dimension labels in 3D */}
      <GardenDimensionLabels length={config.length} width={config.width} />

      {/* Raised beds */}
      {(config.raisedBeds || []).map((bed) => (
        <RaisedBed3D
          key={bed.id}
          bed={bed}
          gardenLength={config.length}
          gardenWidth={config.width}
          isSelected={selectedBedId === bed.id}
          onSelect={() => onSelectBed(selectedBedId === bed.id ? null : bed.id)}
        />
      ))}

      {/* Planting zones (in-ground) */}
      {(config.zones || []).map((zone) => (
        <Zone3D
          key={zone.id}
          zone={zone}
          gardenLength={config.length}
          gardenWidth={config.width}
          isSelected={selectedZoneId === zone.id}
          onSelect={() => onSelectZone(selectedZoneId === zone.id ? null : zone.id)}
          plantCount={config.plantedItems.filter((p) => p.zoneId === zone.id).length}
        />
      ))}

      {/* Ground click handler for placement */}
      <GroundClickHandler
        config={config}
        isPlacementMode={isPlacementMode}
        onGroundClick={onGroundClick}
      />

      {/* Weather effects (rain, snow, sun rays, wind) — skip on mobile for perf */}
      {!isMobile && (
        <WeatherSystem
          season={season}
          timeOfDay={timeOfDay}
          gardenLength={config.length}
          gardenWidth={config.width}
          weather={weather}
        />
      )}

      {/* Click-away deselect */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.02, 0]}
        onClick={() => {
          if (!isPlacementMode) onSelectPlant(null);
        }}
        visible={false}
      >
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </>
  );
}

// Get weather based on season (shared with overlay)
function getWeather(season: string): string {
  const hour = new Date().getHours();
  if (season === 'winter') return hour % 3 === 0 ? 'Snowy' : 'Overcast';
  if (season === 'spring') return hour % 4 === 0 ? 'Light Rain' : 'Partly Cloudy';
  if (season === 'autumn') return hour % 3 === 0 ? 'Cloudy' : 'Breezy';
  const states = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Clear'];
  return states[hour % states.length];
}

export function GardenScene({ config, selectedPlantType: externalSelectedPlantType, showSpacing: externalShowSpacing = true, selectedBedId: externalSelectedBedId = null, onSelectBed: externalOnSelectBed, selectedZoneId: externalSelectedZoneId = null, onSelectZone: externalOnSelectZone, locale = 'en' }: GardenSceneProps) {
  const [selectedPlantIndex, setSelectedPlantIndex] = useState<number | null>(null);
  const [isIsometric, setIsIsometric] = useState(false);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [isPlacementMode, setIsPlacementMode] = useState(false);
  const [selectedPlantType, setSelectedPlantType] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    index: number;
    x: number;
    y: number;
  } | null>(null);
  const [focusTarget, setFocusTarget] = useState<THREE.Vector3 | null>(null);

  const season = useMemo(() => getSeason(), []);
  const timeOfDay = useMemo(() => getTimeOfDay(), []);
  const weather = useMemo(() => getWeather(season), [season]);

  // Sync external plant type selection from sidebar
  useEffect(() => {
    if (externalSelectedPlantType) {
      setSelectedPlantType(externalSelectedPlantType);
      setIsPlacementMode(true);
    }
  }, [externalSelectedPlantType]);

  // Load plants data
  useEffect(() => {
    import('@/data/plants.json').then((mod) => {
      setPlants(mod.default as Plant[]);
    });
  }, []);

  // When a plant is selected, move camera focus and open info panel
  useEffect(() => {
    if (selectedPlantIndex !== null) {
      const item = config.plantedItems[selectedPlantIndex];
      if (item) {
        const halfL = config.length / 2;
        const halfW = config.width / 2;
        const worldX = -halfL + (item.x / 100) * config.length;
        const worldZ = -halfW + (item.z / 100) * config.width;
        setFocusTarget(new THREE.Vector3(worldX, 0, worldZ));

        // Open the plant info panel automatically when a plant is clicked
        const infoEvent = new CustomEvent('garden:info', {
          detail: { index: selectedPlantIndex },
        });
        window.dispatchEvent(infoEvent);
      }
    } else {
      setFocusTarget(null);
    }
  }, [selectedPlantIndex, config, plants]);

  const handleToolSelect = useCallback((tool: string | null) => {
    setActiveTool(tool);
    SoundEffects.play('click');
    if (tool === 'plant') {
      setIsPlacementMode(true);
    } else {
      setIsPlacementMode(false);
    }
    if (tool === 'water' && selectedPlantIndex !== null) {
      SoundEffects.play('water');
    } else if (tool === 'harvest' && selectedPlantIndex !== null) {
      SoundEffects.play('harvest');
    } else if (tool === 'info' && selectedPlantIndex !== null) {
      const event = new CustomEvent('garden:info', {
        detail: { index: selectedPlantIndex },
      });
      window.dispatchEvent(event);
    }
  }, [selectedPlantIndex]);

  const handleGroundClick = useCallback((pctX: number, pctZ: number) => {
    if (isPlacementMode && selectedPlantType) {
      const halfL = config.length / 2;
      const halfW = config.width / 2;

      // Snap to grid cell centers using selected plant spacing (fallback 30cm)
      const newPlant = plants.find((p) => p.id === selectedPlantType);
      const snapM = newPlant ? newPlant.spacingCm / 100 : 0.3;
      const cellPctX = (snapM / config.length) * 100;
      const cellPctZ = (snapM / config.width) * 100;
      const snappedPctX = (Math.floor(pctX / cellPctX) + 0.5) * cellPctX;
      const snappedPctZ = (Math.floor(pctZ / cellPctZ) + 0.5) * cellPctZ;

      // Use snapped coordinates
      const worldX = -halfL + (snappedPctX / 100) * config.length;
      const worldZ = -halfW + (snappedPctZ / 100) * config.width;
      // Override pctX/pctZ with snapped values for the rest of the function
      const pctXFinal = snappedPctX;
      const pctZFinal = snappedPctZ;

      // Enforce minimum spacing rules
      const newPlantData = plants.find((p) => p.id === selectedPlantType);
      if (newPlantData) {
        const newSpacingM = newPlantData.spacingCm / 100;
        let tooClose = false;
        for (const existing of config.plantedItems) {
          const existingPlant = plants.find((p) => p.id === existing.plantId);
          if (!existingPlant) continue;
          const existingX = -halfL + (existing.x / 100) * config.length;
          const existingZ = -halfW + (existing.z / 100) * config.width;
          const dist = Math.sqrt((worldX - existingX) ** 2 + (worldZ - existingZ) ** 2);
          const minDist = (newSpacingM + existingPlant.spacingCm / 100) / 2;
          if (dist < minDist) {
            tooClose = true;
            break;
          }
        }
        if (tooClose) {
          SoundEffects.play('click');
          return;
        }
      }

      // Check if this click lands inside a raised bed (including outside-garden beds)
      let raisedBedId: string | undefined;
      (config.raisedBeds || []).forEach((bed) => {
        const bedWorldX = -halfL + (bed.x / 100) * config.length;
        const bedWorldZ = -halfW + (bed.z / 100) * config.width;
        if (
          worldX >= bedWorldX - bed.lengthM / 2 &&
          worldX <= bedWorldX + bed.lengthM / 2 &&
          worldZ >= bedWorldZ - bed.widthM / 2 &&
          worldZ <= bedWorldZ + bed.widthM / 2
        ) {
          raisedBedId = bed.id;
        }
      });

      // Check if this click lands inside a planting zone
      let zoneId: string | undefined;
      (config.zones || []).forEach((zone) => {
        const zoneWorldX = -halfL + (zone.x / 100) * config.length;
        const zoneWorldZ = -halfW + (zone.z / 100) * config.width;
        if (
          worldX >= zoneWorldX - zone.lengthM / 2 &&
          worldX <= zoneWorldX + zone.lengthM / 2 &&
          worldZ >= zoneWorldZ - zone.widthM / 2 &&
          worldZ <= zoneWorldZ + zone.widthM / 2
        ) {
          zoneId = zone.id;
        }
      });

      // Check if click is inside the garden bounds or inside a container (bed/zone)
      const isInsideGarden = pctXFinal >= 0 && pctXFinal <= 100 && pctZFinal >= 0 && pctZFinal <= 100;
      if (!isInsideGarden && !raisedBedId && !zoneId) {
        SoundEffects.play('click');
        return;
      }

      // Dispatch custom event for plant placement (will be handled by parent)
      const event = new CustomEvent('garden:plant', {
        detail: { plantId: selectedPlantType, x: pctXFinal, z: pctZFinal, raisedBedId, zoneId },
      });
      window.dispatchEvent(event);
      SoundEffects.play('plant');
    }
  }, [isPlacementMode, selectedPlantType, config, plants]);

  const handleRightClickPlant = useCallback((index: number, event: MouseEvent) => {
    event.preventDefault();
    setContextMenu({ index, x: event.clientX, y: event.clientY });
    setSelectedPlantIndex(index);
  }, []);

  const handleRemoveSelectedPlant = useCallback(() => {
    if (selectedPlantIndex !== null) {
      const event = new CustomEvent('garden:remove', {
        detail: { index: selectedPlantIndex },
      });
      window.dispatchEvent(event);
      setSelectedPlantIndex(null);
    }
    setContextMenu(null);
  }, [selectedPlantIndex]);

  // Prevent browser context menu on the canvas
  const canvasRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const handler = (e: Event) => e.preventDefault();
    el.addEventListener('contextmenu', handler);
    return () => el.removeEventListener('contextmenu', handler);
  }, []);

  return (
    <div ref={canvasRef} style={{ width: '100%', height: '100%', position: 'relative', touchAction: 'none' }}>
      <Canvas
        shadows="soft"
        camera={{
          position: [
            Math.max(3, config.length * 0.7),
            Math.max(4, Math.max(config.length, config.width) * 0.9),
            Math.max(4, config.width * 0.9),
          ],
          fov: isMobile ? 45 : 38,
          near: 0.1,
          far: 100,
        }}
        dpr={isMobile ? [1, 1.5] : [1, 2]}
        gl={{
          antialias: !isMobile,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.35,
          powerPreference: isMobile ? 'low-power' : 'high-performance',
        }}
        style={{ background: 'transparent', touchAction: 'none' }}
      >
        <CanvasResizer />
        <SceneContent
          config={config}
          selectedPlantIndex={selectedPlantIndex}
          onSelectPlant={setSelectedPlantIndex}
          onRightClickPlant={handleRightClickPlant}
          season={season}
          timeOfDay={timeOfDay}
          isIsometric={isIsometric}
          plants={plants}
          activeTool={activeTool}
          isPlacementMode={isPlacementMode}
          onGroundClick={handleGroundClick}
          focusTarget={focusTarget}
          weather={weather}
          showSpacing={externalShowSpacing}
          selectedBedId={externalSelectedBedId}
          onSelectBed={externalOnSelectBed || (() => {})}
          selectedZoneId={externalSelectedZoneId}
          onSelectZone={externalOnSelectZone || (() => {})}
          selectedPlantType={selectedPlantType}
          isMobile={isMobile}
        />
      </Canvas>

      {/* Context menu overlay */}
      {contextMenu && (
        <PlantContextMenu
          position={{ x: contextMenu.x, y: contextMenu.y }}
          plantName={(() => {
            const p = plants.find((pl) => pl.id === config.plantedItems[contextMenu.index]?.plantId);
            return p ? (locale === 'fr' ? p.name.fr : p.name.en) : (locale === 'fr' ? 'Plante' : 'Plant');
          })()}
          locale={locale}
          onWater={() => {
            setActiveTool('water');
            setContextMenu(null);
          }}
          onRemove={handleRemoveSelectedPlant}
          onInfo={() => {
            setSelectedPlantIndex(contextMenu.index);
            // Dispatch info event for the plant info panel
            const event = new CustomEvent('garden:info', {
              detail: { index: contextMenu.index },
            });
            window.dispatchEvent(event);
            setContextMenu(null);
          }}
          onClose={() => setContextMenu(null)}
        />
      )}

    </div>
  );
}
