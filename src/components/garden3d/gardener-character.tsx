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
  currentAction?: 'idle' | 'walking' | 'watering' | 'digging' | 'harvesting' | 'pointing' | 'celebrating';
}

type GardenerAction = 'idle' | 'walking' | 'watering' | 'digging' | 'harvesting' | 'pointing' | 'celebrating';

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

// Heart / sparkle emote particles (kawaii style)
function EmoteParticles({ active }: { active: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const particles = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => ({
      angle: (i / 6) * Math.PI * 2 + Math.random() * 0.5,
      speed: 0.6 + Math.random() * 0.4,
      dist: 0.12 + Math.random() * 0.08,
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

  const colors = ['#FF69B4', '#FFD700', '#FF91AF', '#FFB6C1', '#FFA07A', '#FFDAB9'];

  return (
    <group ref={ref} position={[0, 1.5, 0]}>
      {particles.map((_, i) => (
        <mesh key={`emote-${i}`}>
          <sphereGeometry args={[0.025, 6, 6]} />
          <meshBasicMaterial color={colors[i % colors.length]} transparent opacity={1} />
        </mesh>
      ))}
    </group>
  );
}

// Chibi tool held in stubby hand - scaled for small arms
function HeldTool({ action }: { action: string }) {
  if (action === 'watering') {
    return (
      <group position={[0, -0.08, 0.04]} rotation={[0.3, 0, 0]}>
        {/* Tiny watering can */}
        <mesh>
          <cylinderGeometry args={[0.02, 0.025, 0.05, 8]} />
          <meshStandardMaterial color="#7BC67E" metalness={0.3} roughness={0.6} />
        </mesh>
        <mesh position={[0.025, 0.015, 0]}>
          <cylinderGeometry args={[0.006, 0.004, 0.035, 6]} />
          <meshStandardMaterial color="#7BC67E" metalness={0.3} />
        </mesh>
      </group>
    );
  }
  if (action === 'digging') {
    return (
      <group position={[0, -0.1, 0.02]} rotation={[-0.3, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.006, 0.006, 0.1, 6]} />
          <meshStandardMaterial color="#C4956A" />
        </mesh>
        <mesh position={[0, -0.055, 0]}>
          <boxGeometry args={[0.022, 0.025, 0.004]} />
          <meshStandardMaterial color="#999" metalness={0.5} />
        </mesh>
      </group>
    );
  }
  if (action === 'pointing') {
    return null; // Chibi characters point with their whole stubby arm
  }
  if (action === 'harvesting') {
    return (
      <group position={[0, -0.08, 0.03]} rotation={[0, 0, 0.2]}>
        {/* Tiny basket */}
        <mesh>
          <cylinderGeometry args={[0.03, 0.025, 0.03, 8]} />
          <meshStandardMaterial color="#C4956A" />
        </mesh>
        <mesh position={[0.008, 0.02, 0]}>
          <sphereGeometry args={[0.012, 6, 6]} />
          <meshStandardMaterial color="#E53935" />
        </mesh>
        <mesh position={[-0.008, 0.018, 0.008]}>
          <sphereGeometry args={[0.01, 6, 6]} />
          <meshStandardMaterial color="#FF8A65" />
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
      position={[0.35, 1.6, 0]}
      center
      distanceFactor={5}
      style={{ pointerEvents: 'none' }}
    >
      <div style={{
        background: 'rgba(255, 247, 205, 0.95)',
        borderRadius: '16px',
        padding: '10px 14px',
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

// Cute Z particles when idle for a while (sleeping/resting)
function IdleZzzParticles({ active }: { active: boolean }) {
  const ref = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!ref.current || !active) return;
    const t = performance.now() * 0.001;
    ref.current.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh;
      const phase = ((t * 0.3 + i * 0.5) % 2) / 2;
      mesh.position.x = 0.2 + phase * 0.15;
      mesh.position.y = 1.55 + phase * 0.3;
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
          <sphereGeometry args={[0.02, 6, 6]} />
          <meshBasicMaterial color="#B0B8C8" transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

// Blinking eyes component for the chibi character
function ChibiEyes({ blinkRef }: { blinkRef: React.RefObject<{ scaleY: number } | null> }) {
  // Eye whites (big oval eyes - Animal Crossing style)
  return (
    <group>
      {/* Left eye white */}
      <mesh position={[-0.08, 1.16, 0.2]}>
        <sphereGeometry args={[0.055, 12, 10]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
      {/* Right eye white */}
      <mesh position={[0.08, 1.16, 0.2]}>
        <sphereGeometry args={[0.055, 12, 10]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
      {/* Left pupil (big, cute) */}
      <mesh position={[-0.08, 1.16, 0.245]}>
        <sphereGeometry args={[0.035, 10, 8]} />
        <meshStandardMaterial color="#2D1B0E" />
      </mesh>
      {/* Right pupil (big, cute) */}
      <mesh position={[0.08, 1.16, 0.245]}>
        <sphereGeometry args={[0.035, 10, 8]} />
        <meshStandardMaterial color="#2D1B0E" />
      </mesh>
      {/* Left eye shine (top-right sparkle) */}
      <mesh position={[-0.065, 1.175, 0.27]}>
        <sphereGeometry args={[0.013, 6, 6]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
      {/* Right eye shine (top-right sparkle) */}
      <mesh position={[0.095, 1.175, 0.27]}>
        <sphereGeometry args={[0.013, 6, 6]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
      {/* Left eye small shine */}
      <mesh position={[-0.092, 1.148, 0.27]}>
        <sphereGeometry args={[0.006, 4, 4]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
      {/* Right eye small shine */}
      <mesh position={[0.068, 1.148, 0.27]}>
        <sphereGeometry args={[0.006, 4, 4]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
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
  const blinkRef = useRef<{ scaleY: number }>({ scaleY: 1 });

  const [isWaving, setIsWaving] = useState(true);
  const [isWalking, setIsWalking] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [showEmotes, setShowEmotes] = useState(false);
  const [showDailyTip, setShowDailyTip] = useState(false);
  const [dailyTip, setDailyTip] = useState('');
  const [actionAnim, setActionAnim] = useState<string>(currentAction);

  const walkTarget = useRef<THREE.Vector3>(new THREE.Vector3(...position));
  const walkTimer = useRef(0);
  const walkPause = useRef(4);
  const startPos = useMemo(() => new THREE.Vector3(...position), [position]);
  const idleTimerRef = useRef(0);
  const actionTimerRef = useRef(0);
  const blinkTimer = useRef(0);

  // Walk to a specific target (sent by scene when plant is selected)
  useEffect(() => {
    if (walkToTarget) {
      walkTarget.current.copy(walkToTarget);
      setIsWalking(true);
    }
  }, [walkToTarget]);

  // Auto-patrol the garden when idle for a while (stroll behavior)
  useEffect(() => {
    const patrolInterval = setInterval(() => {
      if (!isWalking && !isWaving && actionAnim === 'idle' && idleTimerRef.current > 8 && !walkToTarget) {
        const bL = gardenBounds?.halfL ?? 3;
        const bW = gardenBounds?.halfW ?? 3;
        const angle = Math.random() * Math.PI * 2;
        const dist = 0.5 + Math.random() * Math.min(bL, bW) * 0.7;
        const tx = Math.cos(angle) * dist;
        const tz = Math.sin(angle) * dist;
        walkTarget.current.set(
          Math.max(-bL, Math.min(bL, tx)),
          startPos.y,
          Math.max(-bW, Math.min(bW, tz))
        );
        setIsWalking(true);
        idleTimerRef.current = 0;
      }
    }, 6000);
    return () => clearInterval(patrolInterval);
  }, [isWalking, isWaving, actionAnim, walkToTarget, gardenBounds, startPos]);

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

    // === CHIBI IDLE ANIMATIONS ===
    // Soft breathing / bouncing (more bouncy than before, kawaii style)
    if (bodyGroupRef.current) {
      const bounce = isWalking
        ? Math.abs(Math.sin(t * 10)) * 0.06
        : Math.sin(t * 2.5) * 0.025 + Math.sin(t * 0.8) * 0.01;
      bodyGroupRef.current.position.y = bounce;

      if (!isWalking && !isWaving) {
        // Gentle side-to-side sway (chibi waddle)
        bodyGroupRef.current.rotation.z = Math.sin(t * 1.0) * 0.025;

        // Idle stretching animation (after 10s idle)
        if (idleTimerRef.current > 10 && idleTimerRef.current < 12) {
          const stretchPhase = (idleTimerRef.current - 10) / 2;
          bodyGroupRef.current.position.y += Math.sin(stretchPhase * Math.PI) * 0.05;
        }
      } else {
        bodyGroupRef.current.rotation.z *= 0.9;
      }
    }

    // Head movement - bigger head = more expressive looking around
    if (headRef.current) {
      if (!isWalking) {
        // Normal idle - gentle tilt
        headRef.current.rotation.z = Math.sin(t * 1.0) * 0.06 + Math.sin(t * 0.35) * 0.03;
        headRef.current.rotation.x = Math.sin(t * 0.7 + 1) * 0.04;

        // Looking around behavior (after 5s idle) - cute curious look
        if (idleTimerRef.current > 5) {
          const lookPhase = ((t * 0.3) % 4);
          if (lookPhase < 1) {
            headRef.current.rotation.y = Math.sin(lookPhase * Math.PI) * 0.5;
          } else if (lookPhase > 2 && lookPhase < 3) {
            headRef.current.rotation.y = -Math.sin((lookPhase - 2) * Math.PI) * 0.4;
          } else {
            headRef.current.rotation.y *= 0.92;
          }
        }

        // Occasional head nod (curious bobbing)
        const nodCycle = t % 7;
        if (nodCycle > 5.5 && nodCycle < 6) {
          headRef.current.rotation.x += Math.sin((nodCycle - 5.5) * Math.PI * 4) * 0.08;
        }

        // Head tilt when idle for a while (confused/thinking pose)
        if (idleTimerRef.current > 12) {
          const scratchCycle = (t % 15);
          if (scratchCycle > 13 && scratchCycle < 14.5) {
            headRef.current.rotation.z += Math.sin((scratchCycle - 13) * Math.PI * 2) * 0.06;
          }
        }
      } else {
        headRef.current.rotation.y *= 0.9;
      }
    }

    // === ACTION-SPECIFIC ARM ANIMATIONS (adapted for stubby arms) ===
    if (actionAnim === 'watering' && armRightRef.current) {
      armRightRef.current.rotation.z = -1.0 + Math.sin(t * 2) * 0.25;
      armRightRef.current.rotation.x = Math.sin(t * 3) * 0.15 - 0.25;
    } else if (actionAnim === 'digging' && armRightRef.current) {
      const digPhase = (t * 2) % Math.PI;
      armRightRef.current.rotation.x = -Math.abs(Math.sin(digPhase)) * 1.0;
      armRightRef.current.rotation.z = -0.25;
    } else if (actionAnim === 'harvesting') {
      if (armRightRef.current) {
        armRightRef.current.rotation.x = -0.4 + Math.sin(t * 2) * 0.35;
        armRightRef.current.rotation.z = Math.sin(t * 1.5) * 0.2;
      }
      if (armLeftRef.current) {
        armLeftRef.current.rotation.x = -0.25 + Math.sin(t * 2 + 1) * 0.25;
      }
    } else if (actionAnim === 'pointing') {
      if (armRightRef.current) {
        armRightRef.current.rotation.x = -1.0 + Math.sin(t * 1.5) * 0.1;
        armRightRef.current.rotation.z = -0.1;
      }
      if (armLeftRef.current) {
        armLeftRef.current.rotation.z = Math.sin(t * 1) * 0.12;
      }
      if (bodyGroupRef.current) {
        bodyGroupRef.current.rotation.x = 0.1;
      }
    } else if (actionAnim === 'celebrating') {
      // Both stubby arms up, jumping with joy!
      if (armRightRef.current) {
        armRightRef.current.rotation.z = -2.2 + Math.sin(t * 6) * 0.35;
        armRightRef.current.rotation.x = Math.sin(t * 4) * 0.25;
      }
      if (armLeftRef.current) {
        armLeftRef.current.rotation.z = 2.2 - Math.sin(t * 6 + 0.5) * 0.35;
        armLeftRef.current.rotation.x = Math.sin(t * 4 + 0.5) * 0.25;
      }
      if (bodyGroupRef.current) {
        bodyGroupRef.current.position.y = Math.abs(Math.sin(t * 5)) * 0.14;
      }
    } else if (!isWalking && actionAnim === 'idle' && idleTimerRef.current > 12 && armRightRef.current) {
      // Scratching head idle animation (stubby arm reaches up)
      const scratchCycle = (t % 15);
      if (scratchCycle > 13 && scratchCycle < 14.5) {
        const scratchPhase = scratchCycle - 13;
        armRightRef.current.rotation.z = -1.1 + Math.sin(scratchPhase * Math.PI * 6) * 0.15;
        armRightRef.current.rotation.x = -0.4;
      }
    } else if (isWaving && armRightRef.current) {
      // Enthusiastic chibi wave
      armRightRef.current.rotation.z = Math.sin(t * 10) * 0.5 - 1.3;
      armRightRef.current.rotation.x = Math.sin(t * 5) * 0.15;
    } else if (armRightRef.current && !isWalking) {
      // Gentle idle arm sway
      armRightRef.current.rotation.z = Math.sin(t * 1.5) * 0.08;
      armRightRef.current.rotation.x = Math.sin(t * 1) * 0.05;
    }

    if (armLeftRef.current && !isWalking && actionAnim !== 'harvesting') {
      armLeftRef.current.rotation.z = -Math.sin(t * 1.5 + 0.5) * 0.08;
      armLeftRef.current.rotation.x = -Math.sin(t * 1 + 0.5) * 0.05;
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
        const speed = 0.35 * delta; // Slightly slower waddle
        pos.x += dir.x * speed;
        pos.z += dir.z * speed;

        const angle = Math.atan2(dir.x, dir.z);
        groupRef.current.rotation.y += (angle - groupRef.current.rotation.y) * 0.1;

        // Chibi waddle walk - stubby limbs swing less, body sways more
        if (armLeftRef.current) {
          armLeftRef.current.rotation.x = Math.sin(t * 8) * 0.4;
          armLeftRef.current.rotation.z = 0;
        }
        if (armRightRef.current && actionAnim === 'idle') {
          armRightRef.current.rotation.x = -Math.sin(t * 8) * 0.4;
          armRightRef.current.rotation.z = 0;
        }
        if (legLeftRef.current) {
          legLeftRef.current.rotation.x = Math.sin(t * 8) * 0.3;
        }
        if (legRightRef.current) {
          legRightRef.current.rotation.x = -Math.sin(t * 8) * 0.3;
        }
        // Extra body waddle while walking
        if (bodyGroupRef.current) {
          bodyGroupRef.current.rotation.z = Math.sin(t * 8) * 0.04;
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

    // Blinking animation
    blinkTimer.current += delta;
    if (blinkTimer.current > 3 + Math.random() * 2) {
      blinkTimer.current = 0;
    }
    // Quick blink at start of each cycle
    const blinkPhase = blinkTimer.current;
    if (blinkPhase < 0.12) {
      blinkRef.current.scaleY = Math.max(0.05, 1 - Math.sin((blinkPhase / 0.12) * Math.PI));
    } else {
      blinkRef.current.scaleY = 1;
    }
  });

  const handleClick = useCallback(() => {
    setIsWaving(true);
    setShowEmotes(true);
    setTimeout(() => setIsWaving(false), 2000);
    setTimeout(() => setShowEmotes(false), 1500);
    onAdviceRequest?.();
  }, [onAdviceRequest]);

  // === CHIBI / ANIMAL CROSSING COLOR PALETTE ===
  const skin = '#FFE0C2';        // Warm peachy skin
  const skinDark = '#FFD1A6';    // Slightly darker skin for ears
  const overalls = '#5EC269';    // Friendly green overalls
  const overallsDark = '#3D9E4A'; // Darker green for straps/pocket
  const shirt = '#FFFDF0';       // Creamy white undershirt
  const hat = '#D4A55A';         // Warm straw hat
  const hatBand = '#E85D5D';     // Soft red hat band
  const boots = '#8B6040';       // Warm brown boots
  const hair = '#7B4B2A';        // Rich brown hair
  const cheekColor = '#FF9B9B';  // Rosy pink cheeks

  return (
    <group ref={groupRef} position={position}>
      <group
        ref={bodyGroupRef}
        onClick={(e) => { e.stopPropagation(); handleClick(); }}
        onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
      >
        {/* ============================================ */}
        {/* === CHIBI BODY (round, chubby, squished) === */}
        {/* ============================================ */}

        {/* Main body - squished sphere (wider than tall) */}
        <mesh position={[0, 0.48, 0]} castShadow scale={[1, 0.85, 0.9]}>
          <sphereGeometry args={[0.2, 14, 12]} />
          <meshStandardMaterial color={overalls} roughness={0.7} />
        </mesh>

        {/* Belly highlight (slightly lighter green sphere on front) */}
        <mesh position={[0, 0.46, 0.12]} scale={[0.7, 0.6, 0.3]}>
          <sphereGeometry args={[0.15, 10, 8]} />
          <meshStandardMaterial color={overallsDark} roughness={0.7} />
        </mesh>

        {/* Overall straps (left) */}
        <mesh position={[-0.06, 0.6, 0.11]} scale={[1, 1, 0.3]}>
          <boxGeometry args={[0.035, 0.12, 0.04]} />
          <meshStandardMaterial color={overallsDark} />
        </mesh>
        {/* Overall straps (right) */}
        <mesh position={[0.06, 0.6, 0.11]} scale={[1, 1, 0.3]}>
          <boxGeometry args={[0.035, 0.12, 0.04]} />
          <meshStandardMaterial color={overallsDark} />
        </mesh>

        {/* Front pocket (cute little rectangle) */}
        <mesh position={[0, 0.42, 0.17]}>
          <boxGeometry args={[0.1, 0.06, 0.01]} />
          <meshStandardMaterial color={overallsDark} />
        </mesh>

        {/* Gold buttons on straps */}
        <mesh position={[-0.06, 0.56, 0.13]}>
          <sphereGeometry args={[0.012, 6, 6]} />
          <meshStandardMaterial color="#FFD700" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0.06, 0.56, 0.13]}>
          <sphereGeometry args={[0.012, 6, 6]} />
          <meshStandardMaterial color="#FFD700" metalness={0.6} roughness={0.3} />
        </mesh>

        {/* Undershirt visible at collar area */}
        <mesh position={[0, 0.62, 0.06]} scale={[1.1, 0.6, 0.8]}>
          <sphereGeometry args={[0.1, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={shirt} roughness={0.8} />
        </mesh>

        {/* ========================================== */}
        {/* === CHIBI HEAD (big, round, expressive) === */}
        {/* ========================================== */}
        <group ref={headRef}>
          {/* Main head sphere - BIG relative to body (Animal Crossing style) */}
          <mesh position={[0, 1.12, 0]} castShadow>
            <sphereGeometry args={[0.24, 16, 14]} />
            <meshStandardMaterial color={skin} roughness={0.6} />
          </mesh>

          {/* Hair (back hemisphere - like a cute bowl cut) */}
          <mesh position={[0, 1.18, -0.06]} scale={[1, 1, 0.9]}>
            <sphereGeometry args={[0.22, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
            <meshStandardMaterial color={hair} roughness={0.8} />
          </mesh>

          {/* Hair bangs (front fringe) */}
          <mesh position={[0, 1.28, 0.12]} scale={[1.1, 0.3, 0.5]}>
            <sphereGeometry args={[0.12, 10, 6]} />
            <meshStandardMaterial color={hair} roughness={0.8} />
          </mesh>

          {/* Side hair tufts */}
          <mesh position={[-0.2, 1.15, 0.02]} scale={[0.5, 0.7, 0.5]}>
            <sphereGeometry args={[0.08, 8, 6]} />
            <meshStandardMaterial color={hair} roughness={0.8} />
          </mesh>
          <mesh position={[0.2, 1.15, 0.02]} scale={[0.5, 0.7, 0.5]}>
            <sphereGeometry args={[0.08, 8, 6]} />
            <meshStandardMaterial color={hair} roughness={0.8} />
          </mesh>

          {/* === EYES (big, sparkly Animal Crossing eyes) === */}
          <ChibiEyes blinkRef={blinkRef} />

          {/* Cute little eyebrows */}
          <mesh position={[-0.08, 1.21, 0.22]} rotation={[0, 0, 0.15]} scale={[1, 0.3, 0.3]}>
            <boxGeometry args={[0.06, 0.015, 0.01]} />
            <meshStandardMaterial color={hair} />
          </mesh>
          <mesh position={[0.08, 1.21, 0.22]} rotation={[0, 0, -0.15]} scale={[1, 0.3, 0.3]}>
            <boxGeometry args={[0.06, 0.015, 0.01]} />
            <meshStandardMaterial color={hair} />
          </mesh>

          {/* Rosy cheeks (bigger, more prominent) */}
          <mesh position={[-0.15, 1.1, 0.15]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color={cheekColor} transparent opacity={0.45} roughness={0.9} />
          </mesh>
          <mesh position={[0.15, 1.1, 0.15]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color={cheekColor} transparent opacity={0.45} roughness={0.9} />
          </mesh>

          {/* Small cute mouth (simple curved line shape via torus) */}
          <mesh position={[0, 1.05, 0.22]} rotation={[0.2, 0, 0]}>
            <torusGeometry args={[0.025, 0.005, 6, 10, Math.PI]} />
            <meshStandardMaterial color="#D4636E" />
          </mesh>

          {/* Little round nose */}
          <mesh position={[0, 1.1, 0.235]}>
            <sphereGeometry args={[0.015, 8, 6]} />
            <meshStandardMaterial color={skinDark} roughness={0.7} />
          </mesh>

          {/* === STRAW HAT (bigger, floppy, cute) === */}
          {/* Hat brim - wide and floppy */}
          <mesh position={[0, 1.32, 0]} rotation={[0.05, 0, 0]} castShadow>
            <cylinderGeometry args={[0.34, 0.36, 0.035, 14]} />
            <meshStandardMaterial color={hat} roughness={0.8} />
          </mesh>
          {/* Hat crown - rounded dome */}
          <mesh position={[0, 1.38, 0]} castShadow>
            <sphereGeometry args={[0.16, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={hat} roughness={0.8} />
          </mesh>
          {/* Hat cylinder base */}
          <mesh position={[0, 1.35, 0]} castShadow>
            <cylinderGeometry args={[0.15, 0.17, 0.06, 12]} />
            <meshStandardMaterial color={hat} roughness={0.8} />
          </mesh>
          {/* Hat band (red ribbon) */}
          <mesh position={[0, 1.34, 0]}>
            <cylinderGeometry args={[0.172, 0.172, 0.03, 12]} />
            <meshStandardMaterial color={hatBand} roughness={0.6} />
          </mesh>
          {/* Ribbon bow on the side */}
          <mesh position={[0.17, 1.34, 0.05]} rotation={[0, 0.3, 0]}>
            <sphereGeometry args={[0.025, 6, 6]} />
            <meshStandardMaterial color={hatBand} roughness={0.6} />
          </mesh>
          <mesh position={[0.2, 1.34, 0.06]} rotation={[0, 0.3, 0]}>
            <sphereGeometry args={[0.02, 6, 6]} />
            <meshStandardMaterial color={hatBand} roughness={0.6} />
          </mesh>
          {/* Little flower on hat */}
          <mesh position={[-0.15, 1.37, 0.1]}>
            <sphereGeometry args={[0.025, 8, 6]} />
            <meshStandardMaterial color="#FFB7D5" roughness={0.7} />
          </mesh>
          <mesh position={[-0.15, 1.37, 0.115]}>
            <sphereGeometry args={[0.01, 6, 4]} />
            <meshStandardMaterial color="#FFEB3B" />
          </mesh>
          {/* Extra flower petals */}
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh
              key={`petal-${i}`}
              position={[
                -0.15 + Math.cos((i / 5) * Math.PI * 2) * 0.018,
                1.37 + Math.sin((i / 5) * Math.PI * 2) * 0.018,
                0.108,
              ]}
            >
              <sphereGeometry args={[0.01, 5, 4]} />
              <meshStandardMaterial color="#FFD0E8" />
            </mesh>
          ))}
        </group>

        {/* ============================================ */}
        {/* === STUBBY ARMS (short, round, cute) ======= */}
        {/* ============================================ */}

        {/* Left arm */}
        <group ref={armLeftRef} position={[-0.22, 0.52, 0]}>
          {/* Arm (capsule-like: sphere + cylinder + sphere) */}
          <mesh position={[0, -0.03, 0]} castShadow>
            <sphereGeometry args={[0.055, 8, 8]} />
            <meshStandardMaterial color={overalls} roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.08, 0]} castShadow>
            <cylinderGeometry args={[0.045, 0.05, 0.08, 8]} />
            <meshStandardMaterial color={overalls} roughness={0.7} />
          </mesh>
          {/* Stubby hand (round mitt) */}
          <mesh position={[0, -0.13, 0]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color={skin} roughness={0.6} />
          </mesh>
        </group>

        {/* Right arm */}
        <group ref={armRightRef} position={[0.22, 0.52, 0]}>
          <mesh position={[0, -0.03, 0]} castShadow>
            <sphereGeometry args={[0.055, 8, 8]} />
            <meshStandardMaterial color={overalls} roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.08, 0]} castShadow>
            <cylinderGeometry args={[0.045, 0.05, 0.08, 8]} />
            <meshStandardMaterial color={overalls} roughness={0.7} />
          </mesh>
          {/* Stubby hand */}
          <mesh position={[0, -0.13, 0]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color={skin} roughness={0.6} />
          </mesh>
          {/* Tool in right hand */}
          <HeldTool action={actionAnim} />
        </group>

        {/* ============================================ */}
        {/* === STUBBY LEGS (short, round) ============= */}
        {/* ============================================ */}

        {/* Left leg */}
        <group ref={legLeftRef} position={[-0.09, 0.3, 0]}>
          {/* Leg (short cylinder) */}
          <mesh position={[0, -0.04, 0]} castShadow>
            <cylinderGeometry args={[0.055, 0.06, 0.1, 8]} />
            <meshStandardMaterial color={overalls} roughness={0.7} />
          </mesh>
          {/* Round boot */}
          <mesh position={[0, -0.1, 0.01]} castShadow>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial color={boots} roughness={0.7} />
          </mesh>
          {/* Boot sole */}
          <mesh position={[0, -0.14, 0.01]}>
            <cylinderGeometry args={[0.055, 0.06, 0.02, 8]} />
            <meshStandardMaterial color="#6B4530" roughness={0.9} />
          </mesh>
        </group>

        {/* Right leg */}
        <group ref={legRightRef} position={[0.09, 0.3, 0]}>
          <mesh position={[0, -0.04, 0]} castShadow>
            <cylinderGeometry args={[0.055, 0.06, 0.1, 8]} />
            <meshStandardMaterial color={overalls} roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.1, 0.01]} castShadow>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial color={boots} roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.14, 0.01]}>
            <cylinderGeometry args={[0.055, 0.06, 0.02, 8]} />
            <meshStandardMaterial color="#6B4530" roughness={0.9} />
          </mesh>
        </group>

        {/* Hover glow ring (bigger for chibi) */}
        {hovered && (
          <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.32, 0.38, 20]} />
            <meshBasicMaterial color="#FDE047" transparent opacity={0.5} />
          </mesh>
        )}

        {/* Shadow blob (rounder) */}
        <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.2, 12]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.12} />
        </mesh>

        {/* Exclamation mark when hovered (positioned above bigger head) */}
        {hovered && !showDialogue && (
          <group position={[0, 1.65, 0]}>
            <mesh>
              <boxGeometry args={[0.035, 0.1, 0.035]} />
              <meshBasicMaterial color="#FDE047" />
            </mesh>
            <mesh position={[0, -0.075, 0]}>
              <sphereGeometry args={[0.02, 8, 6]} />
              <meshBasicMaterial color="#FDE047" />
            </mesh>
          </group>
        )}

        {/* Action indicator icon (higher for bigger head) */}
        {actionAnim !== 'idle' && actionAnim !== 'walking' && (
          <Html position={[0, 1.7, 0]} center distanceFactor={5} style={{ pointerEvents: 'none' }}>
            <div style={{
              fontSize: '18px',
              animation: 'pulse 1s ease-in-out infinite',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            }}>
              {actionAnim === 'watering' ? '\u{1F4A7}' : actionAnim === 'digging' ? '\u{26CF}\u{FE0F}' : actionAnim === 'pointing' ? '\u{1F449}' : actionAnim === 'celebrating' ? '\u{1F389}' : '\u{1F33E}'}
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

      {/* Speech bubble (Animal Crossing style dialogue box) */}
      {showDialogue && (
        <Html
          position={[0, 1.8, 0]}
          center
          distanceFactor={5}
          style={{ pointerEvents: 'auto' }}
        >
          <div
            onClick={(e) => { e.stopPropagation(); onDialogueClose?.(); }}
            style={{
              background: 'linear-gradient(145deg, #FFFEF5, #F0FDF4)',
              borderRadius: '20px',
              padding: '14px 18px',
              maxWidth: '250px',
              fontSize: '13px',
              fontFamily: '"Nunito", "Comic Sans MS", cursive, sans-serif',
              color: '#1a1a1a',
              boxShadow: '0 8px 30px rgba(0,0,0,0.12), 0 0 20px rgba(94, 194, 105, 0.15)',
              border: '3px solid #A8E6B0',
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
              background: 'linear-gradient(135deg, #5EC269, #7BC67E)',
              margin: '-14px -18px 8px -18px',
              padding: '8px 14px',
              borderRadius: '17px 17px 0 0',
              borderBottom: '2px solid #A8E6B0',
              letterSpacing: '0.5px',
            }}>
              <span style={{ fontSize: '14px' }}>{'\u{1F331}'}</span>
              Sprout
              <span style={{
                display: 'inline-block',
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#A8E6B0',
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
              color: '#A8E6B0',
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
            {/* Speech bubble tail */}
            <div style={{
              position: 'absolute',
              bottom: '-12px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '12px solid transparent',
              borderRight: '12px solid transparent',
              borderTop: '12px solid #A8E6B0',
            }} />
          </div>
        </Html>
      )}
    </group>
  );
}
