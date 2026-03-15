'use client';

import { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface GardenerCharacterProps {
  position: [number, number, number];
  gardenBounds?: { halfL: number; halfW: number };
  onAdviceRequest?: () => void;
  dialogue: string;
  showDialogue: boolean;
  onDialogueClose?: () => void;
  walkToTarget?: THREE.Vector3 | null;
  currentAction?: 'idle' | 'walking' | 'watering' | 'digging' | 'harvesting';
}

// Seasonal + time-based dialogue sets
const DIALOGUE_SETS = {
  morning: {
    spring: [
      "Good morning! The spring air is perfect for planting!",
      "Early bird gets the worm! Let's check on our seedlings!",
      "What a beautiful spring morning! Time to tend the garden!",
    ],
    summer: [
      "Rise and shine! Water the plants before it gets too hot!",
      "Good morning! The tomatoes are looking great today!",
      "Let's get an early start before the summer heat kicks in!",
    ],
    autumn: [
      "Good morning! Time to harvest those pumpkins!",
      "The autumn leaves are so pretty! Let's gather the harvest!",
      "Morning! Don't forget to prepare beds for winter.",
    ],
    winter: [
      "Brr! Good morning! Let's plan for spring planting!",
      "A quiet winter morning. Perfect for garden planning!",
      "Morning! Time to check the compost and dream of spring.",
    ],
  },
  afternoon: {
    spring: [
      "The bees are busy! Great sign for pollination!",
      "Spring showers help everything grow! Keep planting!",
      "Lovely afternoon! The garden is coming alive!",
    ],
    summer: [
      "Hot afternoon! Make sure everything is well-watered!",
      "The garden is thriving in this summer sun!",
      "Check for pests - they love warm afternoons!",
    ],
    autumn: [
      "Beautiful autumn afternoon! The colors are amazing!",
      "Perfect weather for composting fallen leaves!",
      "Afternoon harvest time! Everything smells wonderful!",
    ],
    winter: [
      "A crisp winter afternoon. Cozy up with seed catalogs!",
      "The garden is sleeping. Planning time!",
      "Winter mulch keeps the soil happy and warm!",
    ],
  },
  evening: {
    spring: [
      "What a productive day! The garden looks great!",
      "Evening watering is perfect on dry spring days!",
      "The sunset over the garden is so peaceful.",
    ],
    summer: [
      "The evening breeze feels so nice! Great gardening today!",
      "Summer evenings are the best in the garden!",
      "Time to relax and enjoy the garden view!",
    ],
    autumn: [
      "Golden hour in the autumn garden. Simply magical!",
      "What a harvest day! Time to rest, gardener!",
      "The evening air smells like fallen leaves. So cozy!",
    ],
    winter: [
      "Early sunset. Time to head inside and stay warm!",
      "A quiet winter evening. Spring will be here before we know it!",
      "Good night, garden! See you tomorrow!",
    ],
  },
};

const ADVICE_LINES = [
  "Water early in the morning for best results!",
  "Companion planting can boost your harvest by 20%!",
  "Don't forget to check for pests regularly!",
  "Mulch helps retain moisture and suppress weeds!",
  "Rotate your crops each season to keep soil healthy!",
  "Add compost to enrich your soil naturally!",
  "Prune dead leaves to encourage new growth!",
  "Harvest in the morning when veggies are crispest!",
  "Native flowers attract helpful pollinators!",
  "Deep, infrequent watering encourages strong roots!",
  "Place a plant by selecting one from the toolbar below!",
  "Click on any plant to see how it's growing!",
  "Your tomatoes need full sun - 6+ hours a day!",
  "Try planting basil near tomatoes - they're best friends!",
  "Right-click a plant for quick actions!",
  "Use the mini-map to see your whole garden at a glance!",
];

// Daily tips that rotate
const DAILY_TIPS = [
  "Tip of the day: Eggshells add calcium to your soil!",
  "Tip of the day: Coffee grounds repel slugs naturally!",
  "Tip of the day: Marigolds keep aphids away from veggies!",
  "Tip of the day: Water at the base, not the leaves!",
  "Tip of the day: Deadhead flowers to encourage more blooms!",
  "Tip of the day: Raised beds warm up faster in spring!",
  "Tip of the day: Plant garlic near roses to deter pests!",
];

export function getSeason(): 'spring' | 'summer' | 'autumn' | 'winter' {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
}

export function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'evening';
}

export function getSeasonalDialogue(): string {
  const season = getSeason();
  const time = getTimeOfDay();
  const lines = DIALOGUE_SETS[time][season];
  return lines[Math.floor(Math.random() * lines.length)];
}

export function getRandomAdvice(): string {
  return ADVICE_LINES[Math.floor(Math.random() * ADVICE_LINES.length)];
}

// Emote particles
function EmoteParticles({ active }: { active: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const particles = useMemo(() =>
    Array.from({ length: 5 }, (_, i) => ({
      angle: (i / 5) * Math.PI * 2 + Math.random() * 0.5,
      speed: 0.8 + Math.random() * 0.5,
      dist: 0.1 + Math.random() * 0.1,
    })),
  []);

  const startTime = useRef(0);

  useEffect(() => {
    if (active) startTime.current = performance.now() * 0.001;
  }, [active]);

  useFrame(() => {
    if (!ref.current || !active) return;
    const t = performance.now() * 0.001;
    const elapsed = t - startTime.current;
    ref.current.children.forEach((child, i) => {
      const p = particles[i];
      const mesh = child as THREE.Mesh;
      mesh.position.x = Math.cos(p.angle + elapsed * 2) * p.dist * (1 + elapsed);
      mesh.position.y = elapsed * p.speed * 0.5;
      mesh.position.z = Math.sin(p.angle + elapsed * 2) * p.dist * (1 + elapsed);
      const fade = Math.max(0, 1 - elapsed / 1.5);
      mesh.scale.setScalar(fade * 0.8);
      (mesh.material as THREE.MeshBasicMaterial).opacity = fade;
    });
  });

  if (!active) return null;

  return (
    <group ref={ref} position={[0, 1.1, 0]}>
      {particles.map((_, i) => (
        <mesh key={`emote-${i}`}>
          <boxGeometry args={[0.02, 0.02, 0.02]} />
          <meshBasicMaterial color={i % 2 === 0 ? '#FF69B4' : '#FFD700'} transparent opacity={1} />
        </mesh>
      ))}
    </group>
  );
}

// Tool held in hand - changes based on action
function HeldTool({ action }: { action: string }) {
  if (action === 'watering') {
    return (
      <group position={[0, -0.12, 0.05]} rotation={[0.3, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.015, 0.02, 0.06, 6]} />
          <meshStandardMaterial color="#5B8C5A" metalness={0.3} />
        </mesh>
        <mesh position={[0.02, 0.02, 0]}>
          <cylinderGeometry args={[0.005, 0.003, 0.04, 4]} />
          <meshStandardMaterial color="#5B8C5A" metalness={0.3} />
        </mesh>
      </group>
    );
  }
  if (action === 'digging') {
    return (
      <group position={[0, -0.15, 0.02]} rotation={[-0.3, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.005, 0.005, 0.12, 4]} />
          <meshStandardMaterial color="#8B6914" />
        </mesh>
        <mesh position={[0, -0.065, 0]}>
          <boxGeometry args={[0.025, 0.03, 0.003]} />
          <meshStandardMaterial color="#888" metalness={0.5} />
        </mesh>
      </group>
    );
  }
  if (action === 'harvesting') {
    return (
      <group position={[0, -0.12, 0.03]} rotation={[0, 0, 0.2]}>
        <mesh>
          <boxGeometry args={[0.06, 0.03, 0.04]} />
          <meshStandardMaterial color="#8B6914" />
        </mesh>
        {/* Items in basket */}
        <mesh position={[0.01, 0.025, 0]}>
          <sphereGeometry args={[0.012, 5, 4]} />
          <meshStandardMaterial color="#E53935" />
        </mesh>
        <mesh position={[-0.01, 0.02, 0.01]}>
          <sphereGeometry args={[0.01, 5, 4]} />
          <meshStandardMaterial color="#4CAF50" />
        </mesh>
      </group>
    );
  }
  return null;
}

// Speech bubble with daily tip (auto-shows periodically)
function DailyTipBubble({ show, tip }: { show: boolean; tip: string }) {
  if (!show) return null;

  return (
    <Html
      position={[0.3, 1.15, 0]}
      center
      distanceFactor={5}
      style={{ pointerEvents: 'none' }}
    >
      <div style={{
        background: 'rgba(255, 247, 205, 0.95)',
        borderRadius: '12px',
        padding: '8px 12px',
        maxWidth: '180px',
        fontSize: '10px',
        fontFamily: '"Nunito", sans-serif',
        color: '#92400E',
        border: '2px solid #FBBF24',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        animation: 'fadeInUp 0.3s ease-out',
      }}>
        <div style={{ fontWeight: 'bold', fontSize: '9px', color: '#D97706', marginBottom: '2px' }}>
          {'\u{1F4A1}'} Daily Tip
        </div>
        {tip}
      </div>
    </Html>
  );
}

// Z particles when idle for a while (sleeping/resting)
function IdleZzzParticles({ active }: { active: boolean }) {
  const ref = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!ref.current || !active) return;
    const t = performance.now() * 0.001;
    ref.current.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh;
      const phase = ((t * 0.3 + i * 0.5) % 2) / 2;
      mesh.position.x = 0.15 + phase * 0.15;
      mesh.position.y = 1.2 + phase * 0.3;
      mesh.position.z = 0;
      const fade = phase < 0.7 ? phase / 0.7 : (1 - phase) / 0.3;
      mesh.scale.setScalar(0.3 + phase * 0.5);
      (mesh.material as THREE.MeshBasicMaterial).opacity = fade * 0.6;
    });
  });

  if (!active) return null;

  return (
    <group ref={ref}>
      {[0, 1, 2].map((i) => (
        <mesh key={`zzz-${i}`}>
          <boxGeometry args={[0.03, 0.03, 0.003]} />
          <meshBasicMaterial color="#9CA3AF" transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

export function GardenerCharacter({
  position,
  gardenBounds,
  onAdviceRequest,
  dialogue,
  showDialogue,
  onDialogueClose,
  walkToTarget,
  currentAction = 'idle',
}: GardenerCharacterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const armLeftRef = useRef<THREE.Group>(null);
  const armRightRef = useRef<THREE.Group>(null);
  const legLeftRef = useRef<THREE.Group>(null);
  const legRightRef = useRef<THREE.Group>(null);
  const bodyGroupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);

  const [isWaving, setIsWaving] = useState(true);
  const [isWalking, setIsWalking] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [showEmotes, setShowEmotes] = useState(false);
  const [idleTimer, setIdleTimer] = useState(0);
  const [showDailyTip, setShowDailyTip] = useState(false);
  const [dailyTip, setDailyTip] = useState('');
  const [actionAnim, setActionAnim] = useState<string>(currentAction);

  const walkTarget = useRef<THREE.Vector3>(new THREE.Vector3(...position));
  const walkTimer = useRef(0);
  const walkPause = useRef(4);
  const startPos = useMemo(() => new THREE.Vector3(...position), [position]);
  const idleTimerRef = useRef(0);
  const actionTimerRef = useRef(0);

  // Walk to a specific target (sent by scene when plant is selected)
  useEffect(() => {
    if (walkToTarget) {
      walkTarget.current.copy(walkToTarget);
      setIsWalking(true);
    }
  }, [walkToTarget]);

  // Update action animation
  useEffect(() => {
    setActionAnim(currentAction);
    if (currentAction !== 'idle' && currentAction !== 'walking') {
      actionTimerRef.current = 0;
    }
  }, [currentAction]);

  // Wave on arrival for 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => setIsWaving(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Show daily tip periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (!showDialogue) {
        const tip = DAILY_TIPS[Math.floor(Math.random() * DAILY_TIPS.length)];
        setDailyTip(tip);
        setShowDailyTip(true);
        setTimeout(() => setShowDailyTip(false), 6000);
      }
    }, 45000);
    return () => clearInterval(interval);
  }, [showDialogue]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const t = performance.now() * 0.001;

    // Track idle time
    if (!isWalking && !isWaving && actionAnim === 'idle') {
      idleTimerRef.current += delta;
    } else {
      idleTimerRef.current = 0;
    }

    // Action animation timer
    if (actionAnim !== 'idle' && actionAnim !== 'walking') {
      actionTimerRef.current += delta;
      if (actionTimerRef.current > 3) {
        setActionAnim('idle');
      }
    }

    // Idle breathing / bounce
    if (bodyGroupRef.current) {
      const bounce = isWalking
        ? Math.abs(Math.sin(t * 8)) * 0.05
        : Math.sin(t * 2) * 0.02 + Math.sin(t * 0.7) * 0.008;
      bodyGroupRef.current.position.y = bounce;

      if (!isWalking && !isWaving) {
        bodyGroupRef.current.rotation.z = Math.sin(t * 0.8) * 0.015;

        // Idle stretching animation (after 10s idle)
        if (idleTimerRef.current > 10 && idleTimerRef.current < 12) {
          const stretchPhase = (idleTimerRef.current - 10) / 2;
          bodyGroupRef.current.position.y += Math.sin(stretchPhase * Math.PI) * 0.04;
        }
      } else {
        bodyGroupRef.current.rotation.z *= 0.9;
      }
    }

    // Head movement - looking around when idle
    if (headRef.current) {
      if (!isWalking) {
        // Normal idle
        headRef.current.rotation.z = Math.sin(t * 1.2) * 0.04 + Math.sin(t * 0.4) * 0.02;
        headRef.current.rotation.x = Math.sin(t * 0.8 + 1) * 0.03;

        // Looking around behavior (after 5s idle)
        if (idleTimerRef.current > 5) {
          const lookPhase = ((t * 0.3) % 4);
          if (lookPhase < 1) {
            headRef.current.rotation.y = Math.sin(lookPhase * Math.PI) * 0.4;
          } else if (lookPhase > 2 && lookPhase < 3) {
            headRef.current.rotation.y = -Math.sin((lookPhase - 2) * Math.PI) * 0.3;
          } else {
            headRef.current.rotation.y *= 0.95;
          }
        }

        // Occasional head nod
        const nodCycle = t % 8;
        if (nodCycle > 6 && nodCycle < 6.5) {
          headRef.current.rotation.x += Math.sin((nodCycle - 6) * Math.PI * 4) * 0.06;
        }

        // Head scratch animation (after 12s idle, every ~15s)
        if (idleTimerRef.current > 12) {
          const scratchCycle = (t % 15);
          if (scratchCycle > 13 && scratchCycle < 14.5) {
            headRef.current.rotation.z += Math.sin((scratchCycle - 13) * Math.PI * 2) * 0.04;
          }
        }
      } else {
        headRef.current.rotation.y *= 0.9;
      }
    }

    // Action-specific arm animations
    if (actionAnim === 'watering' && armRightRef.current) {
      // Watering can tilt motion
      armRightRef.current.rotation.z = -1.2 + Math.sin(t * 2) * 0.2;
      armRightRef.current.rotation.x = Math.sin(t * 3) * 0.15 - 0.3;
    } else if (actionAnim === 'digging' && armRightRef.current) {
      // Digging motion
      const digPhase = (t * 2) % Math.PI;
      armRightRef.current.rotation.x = -Math.abs(Math.sin(digPhase)) * 1.2;
      armRightRef.current.rotation.z = -0.3;
    } else if (actionAnim === 'harvesting') {
      // Reaching and picking
      if (armRightRef.current) {
        armRightRef.current.rotation.x = -0.5 + Math.sin(t * 2) * 0.4;
        armRightRef.current.rotation.z = Math.sin(t * 1.5) * 0.2;
      }
      if (armLeftRef.current) {
        armLeftRef.current.rotation.x = -0.3 + Math.sin(t * 2 + 1) * 0.3;
      }
    } else if (!isWalking && actionAnim === 'idle' && idleTimerRef.current > 12 && armRightRef.current) {
      // Scratching head idle animation
      const scratchCycle = (t % 15);
      if (scratchCycle > 13 && scratchCycle < 14.5) {
        const scratchPhase = scratchCycle - 13;
        armRightRef.current.rotation.z = -1.3 + Math.sin(scratchPhase * Math.PI * 6) * 0.15;
        armRightRef.current.rotation.x = -0.5;
      }
    } else if (isWaving && armRightRef.current) {
      armRightRef.current.rotation.z = Math.sin(t * 10) * 0.6 - 1.5;
      armRightRef.current.rotation.x = Math.sin(t * 5) * 0.15;
    } else if (armRightRef.current && !isWalking) {
      armRightRef.current.rotation.z = Math.sin(t * 1.5) * 0.06;
      armRightRef.current.rotation.x = Math.sin(t * 1) * 0.04;
    }

    if (armLeftRef.current && !isWalking && actionAnim !== 'harvesting') {
      armLeftRef.current.rotation.z = -Math.sin(t * 1.5 + 0.5) * 0.06;
      armLeftRef.current.rotation.x = -Math.sin(t * 1 + 0.5) * 0.04;
    }

    // Walk logic
    walkTimer.current += delta;
    if (!isWaving && walkTimer.current > walkPause.current && !walkToTarget) {
      if (!isWalking && actionAnim === 'idle') {
        const angle = Math.random() * Math.PI * 2;
        const dist = 0.3 + Math.random() * 1;
        const tx = startPos.x + Math.cos(angle) * dist;
        const tz = startPos.z + Math.sin(angle) * dist;
        const bL = gardenBounds?.halfL ?? 3;
        const bW = gardenBounds?.halfW ?? 3;
        walkTarget.current.set(
          Math.max(-bL - 1, Math.min(bL + 1, tx)),
          startPos.y,
          Math.max(-bW - 1, Math.min(bW + 1, tz))
        );
        setIsWalking(true);
        walkPause.current = 3 + Math.random() * 5;
      }
    }

    if (isWalking && groupRef.current) {
      const pos = groupRef.current.position;
      const dir = new THREE.Vector3().subVectors(walkTarget.current, pos);
      const dist = dir.length();

      if (dist < 0.05) {
        setIsWalking(false);
        walkTimer.current = 0;
      } else {
        dir.normalize();
        const speed = 0.4 * delta;
        pos.x += dir.x * speed;
        pos.z += dir.z * speed;

        const angle = Math.atan2(dir.x, dir.z);
        groupRef.current.rotation.y += (angle - groupRef.current.rotation.y) * 0.1;

        if (armLeftRef.current) {
          armLeftRef.current.rotation.x = Math.sin(t * 8) * 0.5;
          armLeftRef.current.rotation.z = 0;
        }
        if (armRightRef.current && actionAnim === 'idle') {
          armRightRef.current.rotation.x = -Math.sin(t * 8) * 0.5;
          armRightRef.current.rotation.z = 0;
        }
        if (legLeftRef.current) {
          legLeftRef.current.rotation.x = Math.sin(t * 8) * 0.4;
        }
        if (legRightRef.current) {
          legRightRef.current.rotation.x = -Math.sin(t * 8) * 0.4;
        }
      }
    } else {
      if (legLeftRef.current) {
        legLeftRef.current.rotation.x *= 0.9;
      }
      if (legRightRef.current) {
        legRightRef.current.rotation.x *= 0.9;
      }
    }
  });

  const handleClick = useCallback(() => {
    setIsWaving(true);
    setShowEmotes(true);
    setTimeout(() => setIsWaving(false), 2000);
    setTimeout(() => setShowEmotes(false), 1500);
    onAdviceRequest?.();
  }, [onAdviceRequest]);

  const skin = '#FFD5B8';
  const overalls = '#4ADE80';
  const overallsDark = '#2D9B52';
  const pants = '#5B8C5A';
  const hat = '#A0724A';
  const hatBand = '#DC2626';
  const boots = '#5C3D1E';
  const hair = '#8B5E3C';

  return (
    <group ref={groupRef} position={position}>
      <group
        ref={bodyGroupRef}
        onClick={(e) => { e.stopPropagation(); handleClick(); }}
        onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
      >
        {/* === BODY / TORSO === */}
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[0.28, 0.3, 0.18]} />
          <meshStandardMaterial color={overalls} />
        </mesh>
        <mesh position={[-0.07, 0.63, 0.091]}>
          <boxGeometry args={[0.04, 0.12, 0.01]} />
          <meshStandardMaterial color={overallsDark} />
        </mesh>
        <mesh position={[0.07, 0.63, 0.091]}>
          <boxGeometry args={[0.04, 0.12, 0.01]} />
          <meshStandardMaterial color={overallsDark} />
        </mesh>
        <mesh position={[0, 0.45, 0.091]}>
          <boxGeometry args={[0.12, 0.08, 0.01]} />
          <meshStandardMaterial color={overallsDark} />
        </mesh>
        <mesh position={[-0.07, 0.57, 0.095]}>
          <sphereGeometry args={[0.012, 6, 4]} />
          <meshStandardMaterial color="#FFD700" metalness={0.5} />
        </mesh>
        <mesh position={[0.07, 0.57, 0.095]}>
          <sphereGeometry args={[0.012, 6, 4]} />
          <meshStandardMaterial color="#FFD700" metalness={0.5} />
        </mesh>

        {/* === HEAD === */}
        <group ref={headRef}>
          <mesh position={[0, 0.82, 0]} castShadow>
            <sphereGeometry args={[0.16, 10, 8]} />
            <meshStandardMaterial color={skin} />
          </mesh>
          <mesh position={[0, 0.85, -0.08]}>
            <sphereGeometry args={[0.14, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={hair} />
          </mesh>
          <mesh position={[-0.05, 0.84, 0.14]}>
            <sphereGeometry args={[0.025, 8, 6]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
          <mesh position={[0.05, 0.84, 0.14]}>
            <sphereGeometry args={[0.025, 8, 6]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
          <mesh position={[-0.042, 0.848, 0.158]}>
            <sphereGeometry args={[0.008, 4, 3]} />
            <meshBasicMaterial color="#FFFFFF" />
          </mesh>
          <mesh position={[0.058, 0.848, 0.158]}>
            <sphereGeometry args={[0.008, 4, 3]} />
            <meshBasicMaterial color="#FFFFFF" />
          </mesh>
          <mesh position={[-0.1, 0.8, 0.1]}>
            <sphereGeometry args={[0.03, 6, 4]} />
            <meshStandardMaterial color="#FCA5A5" transparent opacity={0.5} />
          </mesh>
          <mesh position={[0.1, 0.8, 0.1]}>
            <sphereGeometry args={[0.03, 6, 4]} />
            <meshStandardMaterial color="#FCA5A5" transparent opacity={0.5} />
          </mesh>
          <mesh position={[0, 0.77, 0.145]}>
            <torusGeometry args={[0.03, 0.006, 4, 8, Math.PI]} />
            <meshStandardMaterial color="#E11D48" />
          </mesh>
          <mesh position={[0, 0.81, 0.155]}>
            <sphereGeometry args={[0.012, 5, 4]} />
            <meshStandardMaterial color="#F0C0A0" />
          </mesh>

          {/* === STRAW HAT === */}
          <mesh position={[0, 0.95, 0]} castShadow>
            <cylinderGeometry args={[0.24, 0.26, 0.04, 10]} />
            <meshStandardMaterial color={hat} />
          </mesh>
          <mesh position={[0, 1.01, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.16, 0.1, 10]} />
            <meshStandardMaterial color={hat} />
          </mesh>
          <mesh position={[0, 0.97, 0]}>
            <cylinderGeometry args={[0.161, 0.161, 0.03, 10]} />
            <meshStandardMaterial color={hatBand} />
          </mesh>
          <mesh position={[0.15, 0.98, 0.05]}>
            <sphereGeometry args={[0.025, 6, 4]} />
            <meshStandardMaterial color="#FFB7D5" />
          </mesh>
          <mesh position={[0.15, 0.98, 0.05]}>
            <sphereGeometry args={[0.012, 4, 3]} />
            <meshStandardMaterial color="#FFEB3B" />
          </mesh>
        </group>

        {/* === ARMS === */}
        <group ref={armLeftRef} position={[-0.2, 0.55, 0]}>
          <mesh position={[0, -0.06, 0]} castShadow>
            <boxGeometry args={[0.1, 0.22, 0.1]} />
            <meshStandardMaterial color={overalls} />
          </mesh>
          <mesh position={[0, -0.18, 0]}>
            <sphereGeometry args={[0.045, 6, 4]} />
            <meshStandardMaterial color={skin} />
          </mesh>
        </group>

        <group ref={armRightRef} position={[0.2, 0.55, 0]}>
          <mesh position={[0, -0.06, 0]} castShadow>
            <boxGeometry args={[0.1, 0.22, 0.1]} />
            <meshStandardMaterial color={overalls} />
          </mesh>
          <mesh position={[0, -0.18, 0]}>
            <sphereGeometry args={[0.045, 6, 4]} />
            <meshStandardMaterial color={skin} />
          </mesh>
          {/* Tool in right hand */}
          <HeldTool action={actionAnim} />
        </group>

        {/* === LEGS === */}
        <group ref={legLeftRef} position={[-0.08, 0.3, 0]}>
          <mesh position={[0, -0.07, 0]} castShadow>
            <boxGeometry args={[0.11, 0.2, 0.12]} />
            <meshStandardMaterial color={pants} />
          </mesh>
          <mesh position={[0, -0.18, 0.02]} castShadow>
            <boxGeometry args={[0.12, 0.07, 0.16]} />
            <meshStandardMaterial color={boots} />
          </mesh>
        </group>

        <group ref={legRightRef} position={[0.08, 0.3, 0]}>
          <mesh position={[0, -0.07, 0]} castShadow>
            <boxGeometry args={[0.11, 0.2, 0.12]} />
            <meshStandardMaterial color={pants} />
          </mesh>
          <mesh position={[0, -0.18, 0.02]} castShadow>
            <boxGeometry args={[0.12, 0.07, 0.16]} />
            <meshStandardMaterial color={boots} />
          </mesh>
        </group>

        {/* Hover glow ring */}
        {hovered && (
          <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.3, 0.36, 16]} />
            <meshBasicMaterial color="#FDE047" transparent opacity={0.6} />
          </mesh>
        )}

        {/* Shadow blob */}
        <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.18, 8]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.15} />
        </mesh>

        {/* Exclamation mark when hovered */}
        {hovered && !showDialogue && (
          <group position={[0, 1.25, 0]}>
            <mesh>
              <boxGeometry args={[0.03, 0.1, 0.03]} />
              <meshBasicMaterial color="#FDE047" />
            </mesh>
            <mesh position={[0, -0.07, 0]}>
              <sphereGeometry args={[0.018, 6, 4]} />
              <meshBasicMaterial color="#FDE047" />
            </mesh>
          </group>
        )}

        {/* Action indicator icon */}
        {actionAnim !== 'idle' && actionAnim !== 'walking' && (
          <Html position={[0, 1.3, 0]} center distanceFactor={5} style={{ pointerEvents: 'none' }}>
            <div style={{
              fontSize: '18px',
              animation: 'pulse 1s ease-in-out infinite',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            }}>
              {actionAnim === 'watering' ? '\u{1F4A7}' : actionAnim === 'digging' ? '\u{26CF}\u{FE0F}' : '\u{1F33E}'}
            </div>
          </Html>
        )}
      </group>

      {/* Emote particles on click */}
      <EmoteParticles active={showEmotes} />

      {/* Idle Zzz particles */}
      <IdleZzzParticles active={idleTimerRef.current > 15} />

      {/* Daily tip bubble */}
      <DailyTipBubble show={showDailyTip && !showDialogue} tip={dailyTip} />

      {/* Speech bubble */}
      {showDialogue && (
        <Html
          position={[0, 1.4, 0]}
          center
          distanceFactor={5}
          style={{ pointerEvents: 'auto' }}
        >
          <div
            onClick={(e) => { e.stopPropagation(); onDialogueClose?.(); }}
            style={{
              background: 'linear-gradient(145deg, #ffffff, #f0fdf4)',
              borderRadius: '18px',
              padding: '14px 18px',
              maxWidth: '240px',
              fontSize: '13px',
              fontFamily: '"Nunito", "Comic Sans MS", cursive, sans-serif',
              color: '#1a1a1a',
              boxShadow: '0 8px 30px rgba(0,0,0,0.15), 0 0 15px rgba(74, 222, 128, 0.15)',
              border: '3px solid #86EFAC',
              position: 'relative',
              cursor: 'pointer',
              userSelect: 'none',
              lineHeight: '1.5',
              animation: 'fadeInUp 0.3s ease-out',
            }}
          >
            {/* Game-style character name plate */}
            <div style={{
              fontWeight: 'bold',
              color: '#FFFFFF',
              marginBottom: '6px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, #16A34A, #22C55E)',
              margin: '-14px -18px 8px -18px',
              padding: '6px 14px',
              borderRadius: '15px 15px 0 0',
              borderBottom: '2px solid #86EFAC',
            }}>
              <span style={{ fontSize: '14px' }}>{'\u{1F331}'}</span>
              Sprout
              <span style={{
                display: 'inline-block',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#86EFAC',
                animation: 'pulse 1.5s ease-in-out infinite',
                marginLeft: 'auto',
              }} />
            </div>
            <div style={{ lineHeight: '1.6', fontSize: '13px' }}>
              {dialogue}
            </div>
            <div style={{
              textAlign: 'right',
              fontSize: '10px',
              color: '#86EFAC',
              marginTop: '8px',
              opacity: 0.7,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '4px',
            }}>
              tap to dismiss
              <span style={{ animation: 'pulse 1s ease-in-out infinite' }}>{'\u{25BC}'}</span>
            </div>
            <div style={{
              position: 'absolute',
              bottom: '-12px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '10px solid transparent',
              borderRight: '10px solid transparent',
              borderTop: '10px solid #86EFAC',
            }} />
          </div>
        </Html>
      )}
    </group>
  );
}
