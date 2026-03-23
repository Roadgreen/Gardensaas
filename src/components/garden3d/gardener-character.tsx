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
  locale?: string;
}

type GardenerAction = 'idle' | 'walking' | 'watering' | 'digging' | 'harvesting' | 'pointing' | 'celebrating';

// Seasonal + time-based dialogue sets (EN / FR)
type Season = 'spring' | 'summer' | 'autumn' | 'winter';
type TimeOfDayKey = 'morning' | 'afternoon' | 'evening';
type DialogueSets = Record<TimeOfDayKey, Record<Season, string[]>>;

const DIALOGUE_SETS: Record<string, DialogueSets> = {
  en: {
    morning: {
      spring: ["Good morning! The spring air is perfect for planting!", "Early bird gets the worm! Let's check on our seedlings!", "What a beautiful spring morning! Time to tend the garden!"],
      summer: ["Rise and shine! Water the plants before it gets too hot!", "Good morning! The tomatoes are looking great today!", "Let's get an early start before the summer heat kicks in!"],
      autumn: ["Good morning! Time to harvest those pumpkins!", "The autumn leaves are so pretty! Let's gather the harvest!", "Morning! Don't forget to prepare beds for winter."],
      winter: ["Brr! Good morning! Let's plan for spring planting!", "A quiet winter morning. Perfect for garden planning!", "Morning! Time to check the compost and dream of spring."],
    },
    afternoon: {
      spring: ["The bees are busy! Great sign for pollination!", "Spring showers help everything grow! Keep planting!", "Lovely afternoon! The garden is coming alive!"],
      summer: ["Hot afternoon! Make sure everything is well-watered!", "The garden is thriving in this summer sun!", "Check for pests - they love warm afternoons!"],
      autumn: ["Beautiful autumn afternoon! The colors are amazing!", "Perfect weather for composting fallen leaves!", "Afternoon harvest time! Everything smells wonderful!"],
      winter: ["A crisp winter afternoon. Cozy up with seed catalogs!", "The garden is sleeping. Planning time!", "Winter mulch keeps the soil happy and warm!"],
    },
    evening: {
      spring: ["What a productive day! The garden looks great!", "Evening watering is perfect on dry spring days!", "The sunset over the garden is so peaceful."],
      summer: ["The evening breeze feels so nice! Great gardening today!", "Summer evenings are the best in the garden!", "Time to relax and enjoy the garden view!"],
      autumn: ["Golden hour in the autumn garden. Simply magical!", "What a harvest day! Time to rest, gardener!", "The evening air smells like fallen leaves. So cozy!"],
      winter: ["Early sunset. Time to head inside and stay warm!", "A quiet winter evening. Spring will be here before we know it!", "Good night, garden! See you tomorrow!"],
    },
  },
  fr: {
    morning: {
      spring: ["Bonjour ! L'air printanier est parfait pour planter !", "Le monde appartient à ceux qui se lèvent tôt ! Vérifions nos semis !", "Quelle belle matinée de printemps ! Au jardin !"],
      summer: ["Debout ! Arrosons les plantes avant qu'il fasse trop chaud !", "Bonjour ! Les tomates ont fière allure aujourd'hui !", "Commençons tôt avant la chaleur estivale !"],
      autumn: ["Bonjour ! C'est l'heure de récolter les citrouilles !", "Les feuilles d'automne sont si jolies ! Récoltons !", "Matin ! N'oubliez pas de préparer les plates-bandes pour l'hiver."],
      winter: ["Brr ! Bonjour ! Planifions les plantations de printemps !", "Un matin d'hiver tranquille. Parfait pour planifier le jardin !", "Matin ! L'heure de vérifier le compost et rêver du printemps."],
    },
    afternoon: {
      spring: ["Les abeilles sont occupées ! Bon signe pour la pollinisation !", "Les averses printanières font tout pousser ! Continuons à planter !", "Bel après-midi ! Le jardin prend vie !"],
      summer: ["Après-midi chaud ! Assurez-vous que tout est bien arrosé !", "Le jardin s'épanouit sous le soleil d'été !", "Surveillez les nuisibles - ils adorent les après-midi chauds !"],
      autumn: ["Magnifique après-midi d'automne ! Les couleurs sont incroyables !", "Temps idéal pour composter les feuilles mortes !", "L'heure de la récolte ! Tout sent bon !"],
      winter: ["Un après-midi d'hiver frais. Feuilletons les catalogues de graines !", "Le jardin dort. C'est l'heure de planifier !", "Le paillage d'hiver garde le sol heureux et chaud !"],
    },
    evening: {
      spring: ["Quelle journée productive ! Le jardin est superbe !", "L'arrosage du soir est parfait par temps sec au printemps !", "Le coucher de soleil sur le jardin est si paisible."],
      summer: ["La brise du soir est si agréable ! Belle journée de jardinage !", "Les soirées d'été au jardin sont les meilleures !", "L'heure de se détendre et profiter du jardin !"],
      autumn: ["L'heure dorée dans le jardin d'automne. Tout simplement magique !", "Quelle journée de récolte ! Reposez-vous, jardinier !", "L'air du soir sent les feuilles mortes. Si agréable !"],
      winter: ["Coucher de soleil précoce. Rentrons au chaud !", "Une soirée d'hiver tranquille. Le printemps sera vite là !", "Bonne nuit, jardin ! À demain !"],
    },
  },
};

const ADVICE_LINES: Record<string, string[]> = {
  en: [
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
  ],
  fr: [
    "Arrosez tôt le matin pour de meilleurs résultats !",
    "Le compagnonnage peut augmenter votre récolte de 20 % !",
    "N'oubliez pas de vérifier les nuisibles régulièrement !",
    "Le paillage retient l'humidité et supprime les mauvaises herbes !",
    "Faites une rotation des cultures chaque saison pour garder le sol sain !",
    "Ajoutez du compost pour enrichir votre sol naturellement !",
    "Taillez les feuilles mortes pour encourager la repousse !",
    "Récoltez le matin quand les légumes sont les plus croquants !",
    "Les fleurs locales attirent les pollinisateurs !",
    "Un arrosage profond et peu fréquent favorise des racines fortes !",
    "Placez une plante en la sélectionnant dans la barre d'outils !",
    "Cliquez sur une plante pour voir sa progression !",
    "Vos tomates ont besoin de plein soleil - 6h+ par jour !",
    "Essayez de planter du basilic près des tomates - ce sont les meilleurs amis !",
    "Faites un clic droit sur une plante pour des actions rapides !",
    "Utilisez la mini-carte pour voir tout votre jardin d'un coup !",
  ],
};

// Daily tips that rotate
const DAILY_TIPS: Record<string, string[]> = {
  en: [
    "Tip of the day: Eggshells add calcium to your soil!",
    "Tip of the day: Coffee grounds repel slugs naturally!",
    "Tip of the day: Marigolds keep aphids away from veggies!",
    "Tip of the day: Water at the base, not the leaves!",
    "Tip of the day: Deadhead flowers to encourage more blooms!",
    "Tip of the day: Raised beds warm up faster in spring!",
    "Tip of the day: Plant garlic near roses to deter pests!",
  ],
  fr: [
    "Conseil du jour : Les coquilles d'œuf apportent du calcium au sol !",
    "Conseil du jour : Le marc de café repousse les limaces naturellement !",
    "Conseil du jour : Les soucis éloignent les pucerons des légumes !",
    "Conseil du jour : Arrosez à la base, pas sur les feuilles !",
    "Conseil du jour : Supprimez les fleurs fanées pour favoriser de nouvelles !",
    "Conseil du jour : Les bacs surélevés se réchauffent plus vite au printemps !",
    "Conseil du jour : Plantez de l'ail près des rosiers pour éloigner les nuisibles !",
  ],
};

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

export function getSeasonalDialogue(locale: string = 'en'): string {
  const season = getSeason();
  const time = getTimeOfDay();
  const lang = DIALOGUE_SETS[locale] ? locale : 'en';
  const lines = DIALOGUE_SETS[lang][time][season];
  return lines[Math.floor(Math.random() * lines.length)];
}

export function getRandomAdvice(locale: string = 'en'): string {
  const lang = ADVICE_LINES[locale] ? locale : 'en';
  const lines = ADVICE_LINES[lang];
  return lines[Math.floor(Math.random() * lines.length)];
}

// ===== TOTAL CHARACTER HEIGHT: ~1.5 units =====
// Head center ~1.10, radius 0.30 => top of head ~1.40
// Hat adds ~0.12 => top ~1.52
// Feet bottom ~0.0
// Head is ~0.60 of 1.5 = 40% of total height (chibi ratio)

// Pastel color palette
const PALETTE = {
  skin: '#FFE4CC',
  skinDark: '#FFCFAA',
  overalls: '#88D498',       // Soft pastel green
  overallsDark: '#5EBB6E',   // Darker green accents
  shirt: '#FFFDF5',          // Warm cream
  hat: '#E8C872',            // Warm straw gold
  hatBand: '#F27A7A',        // Soft coral red
  boots: '#9B7653',          // Warm brown
  bootSole: '#7A5C3D',
  hair: '#8B5E3C',
  cheek: '#FFB0B0',
  mouth: '#E06070',
  eyeBlack: '#221511',
  button: '#FFD700',
  flower: '#FFB7D5',
  flowerCenter: '#FFEB3B',
};

// Seasonal palette overrides for outfit changes
const SEASONAL_PALETTE: Record<string, Partial<typeof PALETTE>> = {
  spring: {
    overalls: '#88D498',
    overallsDark: '#5EBB6E',
    hat: '#E8C872',
    hatBand: '#F27A7A',
    flower: '#FFB7D5',
  },
  summer: {
    overalls: '#7EC8D8',       // Light blue overalls
    overallsDark: '#58A8C0',
    hat: '#F5E8A0',            // Lighter straw hat
    hatBand: '#FF9944',        // Orange band
    flower: '#FFD700',         // Sunflower yellow
  },
  autumn: {
    overalls: '#D4956A',       // Warm amber overalls
    overallsDark: '#B87848',
    hat: '#C49060',            // Darker straw
    hatBand: '#8B4513',        // Brown band
    flower: '#E87030',         // Orange flower
  },
  winter: {
    overalls: '#A0B8D0',       // Soft blue-grey
    overallsDark: '#7898B0',
    hat: '#D0D8E0',            // Pale grey
    hatBand: '#E06070',        // Red scarf color
    flower: '#E0E8F0',         // Frost white
  },
};

function getSeasonalPalette(): typeof PALETTE {
  const season = getSeason();
  const overrides = SEASONAL_PALETTE[season] || {};
  return { ...PALETTE, ...overrides };
}

// Seasonal gardening tips for speech bubbles (bilingual)
const SEASONAL_TIPS: Record<string, Record<string, string[]>> = {
  en: {
    spring: [
      "Spring is here! Time to start seeds indoors for transplanting.",
      "Add compost to your beds now -- your plants will thank you!",
      "Prune fruit trees before buds open for a better harvest.",
      "Watch for late frosts! Keep row covers ready.",
      "Plant peas and lettuce early -- they love cool weather!",
    ],
    summer: [
      "Water deeply in the morning to beat the afternoon heat!",
      "Mulch around your plants to keep roots cool and moist.",
      "Harvest herbs regularly to encourage bushier growth.",
      "Check under leaves for pest eggs -- early detection saves plants!",
      "Tomatoes love consistent watering -- avoid drought stress.",
    ],
    autumn: [
      "Time to plant garlic and shallots for next year!",
      "Collect fallen leaves for composting -- free garden gold!",
      "Plant cover crops to protect soil over winter.",
      "Harvest root vegetables before the first hard freeze.",
      "Clean and oil your tools for winter storage.",
    ],
    winter: [
      "Plan your spring garden layout while things are quiet.",
      "Order seeds now for the best selection!",
      "Build raised beds during winter downtime.",
      "Check stored vegetables for signs of spoilage.",
      "Dream big! Sketch out new garden ideas for spring.",
    ],
  },
  fr: {
    spring: [
      "Le printemps est là ! Démarrez les semis en intérieur pour le repiquage.",
      "Ajoutez du compost dans vos bacs maintenant – vos plantes vous remercieront !",
      "Taillez les arbres fruitiers avant le débourrement pour une meilleure récolte.",
      "Attention aux gelées tardives ! Gardez des voiles d'hivernage prêts.",
      "Plantez pois et laitues tôt – ils adorent le temps frais !",
    ],
    summer: [
      "Arrosez en profondeur le matin pour devancer la chaleur !",
      "Paillez autour de vos plantes pour garder les racines fraîches et humides.",
      "Récoltez les herbes régulièrement pour stimuler une croissance touffue.",
      "Vérifiez sous les feuilles les œufs de nuisibles – la détection précoce sauve les plantes !",
      "Les tomates aiment un arrosage régulier – évitez le stress hydrique.",
    ],
    autumn: [
      "C'est le moment de planter ail et échalotes pour l'année prochaine !",
      "Ramassez les feuilles mortes pour le compost – de l'or gratuit pour le jardin !",
      "Semez des engrais verts pour protéger le sol en hiver.",
      "Récoltez les légumes-racines avant le premier gel dur.",
      "Nettoyez et huilez vos outils pour le rangement hivernal.",
    ],
    winter: [
      "Planifiez l'aménagement de votre jardin printanier au calme.",
      "Commandez les graines maintenant pour le meilleur choix !",
      "Construisez des bacs surélevés pendant le repos hivernal.",
      "Vérifiez les légumes stockés pour détecter les signes de détérioration.",
      "Voyez grand ! Dessinez de nouvelles idées de jardin pour le printemps.",
    ],
  },
};

export function getSeasonalTip(locale: string = 'en'): string {
  const season = getSeason();
  const lang = SEASONAL_TIPS[locale] ? locale : 'en';
  const tips = SEASONAL_TIPS[lang][season] || SEASONAL_TIPS.en.spring;
  return tips[Math.floor(Math.random() * tips.length)];
}

// Heart / sparkle emote particles (kawaii style)
function EmoteParticles({ active }: { active: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const particles = useMemo(() =>
    Array.from({ length: 8 }, (_, i) => ({
      angle: (i / 8) * Math.PI * 2 + Math.random() * 0.4,
      speed: 0.5 + Math.random() * 0.5,
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
      mesh.position.x = Math.cos(p.angle + elapsed * 2.5) * p.dist * (1 + elapsed * 1.2);
      mesh.position.y = elapsed * p.speed * 0.6;
      mesh.position.z = Math.sin(p.angle + elapsed * 2.5) * p.dist * (1 + elapsed * 1.2);
      const fade = Math.max(0, 1 - elapsed / 1.5);
      mesh.scale.setScalar(fade * 0.9);
      (mesh.material as THREE.MeshBasicMaterial).opacity = fade;
    });
  });

  if (!active) return null;

  const colors = ['#FF69B4', '#FFD700', '#FF91AF', '#FFB6C1', '#FFA07A', '#FFDAB9', '#87CEEB', '#DDA0DD'];

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

// Chibi tool held in stubby hand -- always holds a cute watering can by default
function HeldTool({ action }: { action: string }) {
  if (action === 'watering') {
    return (
      <group position={[0, -0.06, 0.04]} rotation={[0.3, 0, 0]}>
        {/* Watering can body */}
        <mesh>
          <cylinderGeometry args={[0.028, 0.035, 0.07, 8]} />
          <meshStandardMaterial color="#7BC67E" metalness={0.3} roughness={0.6} />
        </mesh>
        {/* Spout */}
        <mesh position={[0.035, 0.02, 0]} rotation={[0, 0, -0.4]}>
          <cylinderGeometry args={[0.008, 0.005, 0.05, 6]} />
          <meshStandardMaterial color="#7BC67E" metalness={0.3} />
        </mesh>
        {/* Spout head */}
        <mesh position={[0.055, 0.035, 0]}>
          <sphereGeometry args={[0.012, 6, 4]} />
          <meshStandardMaterial color="#5EBB6E" metalness={0.4} />
        </mesh>
        {/* Handle */}
        <mesh position={[0, 0.04, -0.015]} rotation={[0.3, 0, 0]}>
          <torusGeometry args={[0.022, 0.004, 4, 8, Math.PI]} />
          <meshStandardMaterial color="#5EBB6E" metalness={0.4} />
        </mesh>
      </group>
    );
  }
  if (action === 'digging') {
    return (
      <group position={[0, -0.1, 0.02]} rotation={[-0.3, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.008, 0.008, 0.12, 6]} />
          <meshStandardMaterial color="#C4956A" />
        </mesh>
        <mesh position={[0, -0.065, 0]}>
          <boxGeometry args={[0.025, 0.03, 0.005]} />
          <meshStandardMaterial color="#999" metalness={0.5} />
        </mesh>
      </group>
    );
  }
  if (action === 'harvesting') {
    return (
      <group position={[0, -0.08, 0.03]} rotation={[0, 0, 0.2]}>
        <mesh>
          <cylinderGeometry args={[0.035, 0.028, 0.035, 8]} />
          <meshStandardMaterial color="#C4956A" />
        </mesh>
        <mesh position={[0.01, 0.022, 0]}>
          <sphereGeometry args={[0.014, 6, 6]} />
          <meshStandardMaterial color="#E53935" />
        </mesh>
        <mesh position={[-0.01, 0.02, 0.01]}>
          <sphereGeometry args={[0.012, 6, 6]} />
          <meshStandardMaterial color="#FF8A65" />
        </mesh>
      </group>
    );
  }
  // Default: always hold a small watering can when idle/walking
  return (
    <group position={[0, -0.06, 0.04]} rotation={[0.15, 0, 0.1]}>
      {/* Cute small watering can */}
      <mesh>
        <cylinderGeometry args={[0.02, 0.025, 0.05, 8]} />
        <meshStandardMaterial color="#7BC67E" metalness={0.2} roughness={0.65} />
      </mesh>
      <mesh position={[0.025, 0.015, 0]} rotation={[0, 0, -0.3]}>
        <cylinderGeometry args={[0.006, 0.004, 0.03, 6]} />
        <meshStandardMaterial color="#7BC67E" metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.03, -0.01]} rotation={[0.3, 0, 0]}>
        <torusGeometry args={[0.016, 0.003, 4, 8, Math.PI]} />
        <meshStandardMaterial color="#5EBB6E" metalness={0.3} />
      </mesh>
    </group>
  );
}

// Speech bubble with daily tip
function DailyTipBubble({ show, tip }: { show: boolean; tip: string }) {
  if (!show) return null;

  return (
    <Html
      position={[0.4, 1.55, 0]}
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
          {'\u{1F4A1}'}
        </div>
        {tip}
      </div>
    </Html>
  );
}

// Cute Z particles when idle for a while
function IdleZzzParticles({ active }: { active: boolean }) {
  const ref = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!ref.current || !active) return;
    const t = performance.now() * 0.001;
    ref.current.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh;
      const phase = ((t * 0.3 + i * 0.5) % 2) / 2;
      mesh.position.x = 0.25 + phase * 0.15;
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

// ===== SEASONAL ACCESSORIES =====
// Winter scarf, summer sunglasses, etc.
function SeasonalAccessories() {
  const season = getSeason();

  if (season === 'winter') {
    // Cozy red scarf wrapped around neck
    return (
      <group position={[0, 0.72, 0]}>
        {/* Scarf wrap around neck */}
        <mesh position={[0, 0, 0.05]}>
          <cylinderGeometry args={[0.16, 0.16, 0.08, 12]} />
          <meshStandardMaterial color="#E06070" roughness={0.85} />
        </mesh>
        {/* Scarf draping end (left) */}
        <mesh position={[-0.12, -0.06, 0.12]} rotation={[0.2, 0, 0.3]}>
          <boxGeometry args={[0.06, 0.14, 0.025]} />
          <meshStandardMaterial color="#E06070" roughness={0.85} />
        </mesh>
        {/* Scarf end fringe */}
        {[0, 1, 2].map((i) => (
          <mesh key={`fringe-${i}`} position={[-0.12 + i * 0.02, -0.14, 0.12]} rotation={[0.2, 0, 0.3]}>
            <boxGeometry args={[0.012, 0.03, 0.015]} />
            <meshStandardMaterial color="#D05060" roughness={0.85} />
          </mesh>
        ))}
        {/* Scarf knot bump */}
        <mesh position={[-0.05, 0, 0.16]}>
          <sphereGeometry args={[0.03, 6, 6]} />
          <meshStandardMaterial color="#D05060" roughness={0.85} />
        </mesh>
      </group>
    );
  }

  if (season === 'summer') {
    // Cute sunglasses pushed up on forehead
    return (
      <group position={[0, 1.20, 0.28]}>
        {/* Left lens */}
        <mesh position={[-0.1, 0, 0]}>
          <sphereGeometry args={[0.045, 8, 6]} />
          <meshStandardMaterial color="#2D1B69" metalness={0.5} roughness={0.2} />
        </mesh>
        {/* Right lens */}
        <mesh position={[0.1, 0, 0]}>
          <sphereGeometry args={[0.045, 8, 6]} />
          <meshStandardMaterial color="#2D1B69" metalness={0.5} roughness={0.2} />
        </mesh>
        {/* Bridge */}
        <mesh position={[0, 0, 0.01]}>
          <boxGeometry args={[0.06, 0.012, 0.01]} />
          <meshStandardMaterial color="#FFD700" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Left arm */}
        <mesh position={[-0.15, -0.01, -0.02]} rotation={[0, 0.2, 0]}>
          <boxGeometry args={[0.05, 0.008, 0.01]} />
          <meshStandardMaterial color="#FFD700" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Right arm */}
        <mesh position={[0.15, -0.01, -0.02]} rotation={[0, -0.2, 0]}>
          <boxGeometry args={[0.05, 0.008, 0.01]} />
          <meshStandardMaterial color="#FFD700" metalness={0.6} roughness={0.3} />
        </mesh>
      </group>
    );
  }

  if (season === 'autumn') {
    // Leaf pin on hat
    return (
      <group position={[0.25, 1.42, 0.1]}>
        <mesh rotation={[0, 0.5, 0.3]} scale={[1, 0.5, 0.3]}>
          <sphereGeometry args={[0.025, 6, 5]} />
          <meshStandardMaterial color="#E87030" />
        </mesh>
        <mesh position={[0.02, -0.005, 0]} rotation={[0, 0.5, 0.1]} scale={[1, 0.5, 0.3]}>
          <sphereGeometry args={[0.02, 5, 4]} />
          <meshStandardMaterial color="#D05028" />
        </mesh>
      </group>
    );
  }

  // Spring: extra flowers (already has one, add a ladybug)
  return (
    <group position={[0.30, 1.38, -0.05]}>
      {/* Cute ladybug on hat brim */}
      <mesh>
        <sphereGeometry args={[0.015, 6, 4]} />
        <meshStandardMaterial color="#E53935" />
      </mesh>
      <mesh position={[0, 0.005, 0.01]}>
        <sphereGeometry args={[0.008, 5, 4]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Spots */}
      <mesh position={[-0.006, 0.012, 0]}>
        <sphereGeometry args={[0.003, 4, 3]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.006, 0.01, 0.003]}>
        <sphereGeometry args={[0.003, 4, 3]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
    </group>
  );
}

// ===== ANIMAL CROSSING CHIBI HEAD =====
// Extra-large round head with big sparkly eyes, prominent rosy cheeks, tiny nose and mouth
function ChibiHead() {
  const pal = getSeasonalPalette();
  return (
    <group>
      {/* Main head - extra large sphere for AC proportions (radius 0.38, center at y=1.05) */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <sphereGeometry args={[0.38, 24, 20]} />
        <meshStandardMaterial color={PALETTE.skin} roughness={0.55} />
      </mesh>

      {/* Slight chin bump for roundness */}
      <mesh position={[0, 0.82, 0.12]} scale={[0.8, 0.5, 0.6]}>
        <sphereGeometry args={[0.18, 12, 10]} />
        <meshStandardMaterial color={PALETTE.skin} roughness={0.55} />
      </mesh>

      {/* Hair back - bowl-cut hemisphere */}
      <mesh position={[0, 1.15, -0.08]} scale={[1.02, 1, 0.95]}>
        <sphereGeometry args={[0.35, 16, 14, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
        <meshStandardMaterial color={PALETTE.hair} roughness={0.8} />
      </mesh>

      {/* Hair bangs - soft fringe across forehead */}
      <mesh position={[0, 1.30, 0.18]} scale={[1.3, 0.35, 0.55]}>
        <sphereGeometry args={[0.17, 12, 8]} />
        <meshStandardMaterial color={PALETTE.hair} roughness={0.8} />
      </mesh>

      {/* Side hair tufts */}
      <mesh position={[-0.32, 1.08, 0.02]} scale={[0.55, 0.75, 0.55]}>
        <sphereGeometry args={[0.12, 8, 6]} />
        <meshStandardMaterial color={PALETTE.hair} roughness={0.8} />
      </mesh>
      <mesh position={[0.32, 1.08, 0.02]} scale={[0.55, 0.75, 0.55]}>
        <sphereGeometry args={[0.12, 8, 6]} />
        <meshStandardMaterial color={PALETTE.hair} roughness={0.8} />
      </mesh>

      {/* ===== EYES (Animal Crossing: bigger oval whites, larger pupils, triple highlights) ===== */}

      {/* Left eye white */}
      <mesh position={[-0.13, 1.08, 0.30]} scale={[1.1, 1.3, 0.5]}>
        <sphereGeometry args={[0.08, 16, 14]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
      {/* Right eye white */}
      <mesh position={[0.13, 1.08, 0.30]} scale={[1.1, 1.3, 0.5]}>
        <sphereGeometry args={[0.08, 16, 14]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>

      {/* Left pupil - larger for AC look */}
      <mesh position={[-0.13, 1.08, 0.35]}>
        <sphereGeometry args={[0.058, 14, 12]} />
        <meshStandardMaterial color={PALETTE.eyeBlack} />
      </mesh>
      {/* Right pupil */}
      <mesh position={[0.13, 1.08, 0.35]}>
        <sphereGeometry args={[0.058, 14, 12]} />
        <meshStandardMaterial color={PALETTE.eyeBlack} />
      </mesh>

      {/* Left eye large highlight (top-right) */}
      <mesh position={[-0.105, 1.11, 0.39]}>
        <sphereGeometry args={[0.022, 8, 8]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
      {/* Right eye large highlight */}
      <mesh position={[0.155, 1.11, 0.39]}>
        <sphereGeometry args={[0.022, 8, 8]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
      {/* Left eye small highlight (bottom-left) */}
      <mesh position={[-0.148, 1.06, 0.39]}>
        <sphereGeometry args={[0.011, 6, 6]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
      {/* Right eye small highlight */}
      <mesh position={[0.112, 1.06, 0.39]}>
        <sphereGeometry args={[0.011, 6, 6]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
      {/* Left eye tiny sparkle (middle) */}
      <mesh position={[-0.12, 1.095, 0.395]}>
        <sphereGeometry args={[0.006, 4, 4]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
      {/* Right eye tiny sparkle */}
      <mesh position={[0.14, 1.095, 0.395]}>
        <sphereGeometry args={[0.006, 4, 4]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>

      {/* Soft eyebrows - slightly arched for friendly look */}
      <mesh position={[-0.13, 1.18, 0.30]} rotation={[0, 0, 0.15]} scale={[1, 0.28, 0.28]}>
        <boxGeometry args={[0.08, 0.016, 0.01]} />
        <meshStandardMaterial color={PALETTE.hair} />
      </mesh>
      <mesh position={[0.13, 1.18, 0.30]} rotation={[0, 0, -0.15]} scale={[1, 0.28, 0.28]}>
        <boxGeometry args={[0.08, 0.016, 0.01]} />
        <meshStandardMaterial color={PALETTE.hair} />
      </mesh>

      {/* Rosy cheeks - bigger and more prominent, AC signature blush */}
      <mesh position={[-0.23, 0.98, 0.22]}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshStandardMaterial color={PALETTE.cheek} transparent opacity={0.5} roughness={0.9} />
      </mesh>
      <mesh position={[0.23, 0.98, 0.22]}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshStandardMaterial color={PALETTE.cheek} transparent opacity={0.5} roughness={0.9} />
      </mesh>
      {/* Inner cheek glow for extra cuteness */}
      <mesh position={[-0.22, 0.98, 0.25]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#FF9999" transparent opacity={0.3} roughness={0.9} />
      </mesh>
      <mesh position={[0.22, 0.98, 0.25]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#FF9999" transparent opacity={0.3} roughness={0.9} />
      </mesh>

      {/* Tiny button nose */}
      <mesh position={[0, 1.01, 0.36]}>
        <sphereGeometry args={[0.02, 8, 6]} />
        <meshStandardMaterial color={PALETTE.skinDark} roughness={0.7} />
      </mesh>

      {/* Small happy mouth (curved torus arc) - wider smile */}
      <mesh position={[0, 0.94, 0.33]} rotation={[0.15, 0, 0]}>
        <torusGeometry args={[0.04, 0.007, 6, 14, Math.PI]} />
        <meshStandardMaterial color={PALETTE.mouth} />
      </mesh>

      {/* ===== STRAW HAT (wider brim, taller dome, ribbon + flower) ===== */}

      {/* Brim - extra wide disc for AC look */}
      <mesh position={[0, 1.34, 0]} rotation={[0.04, 0, 0]} castShadow>
        <cylinderGeometry args={[0.50, 0.53, 0.035, 22]} />
        <meshStandardMaterial color={pal.hat} roughness={0.85} />
      </mesh>
      {/* Brim underside shadow ring */}
      <mesh position={[0, 1.33, 0]} rotation={[0.04, 0, 0]}>
        <cylinderGeometry args={[0.49, 0.52, 0.01, 22]} />
        <meshStandardMaterial color="#D4B460" roughness={0.9} />
      </mesh>
      {/* Crown dome - taller */}
      <mesh position={[0, 1.48, 0]} castShadow>
        <sphereGeometry args={[0.22, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={pal.hat} roughness={0.85} />
      </mesh>
      {/* Crown cylinder - taller */}
      <mesh position={[0, 1.42, 0]} castShadow>
        <cylinderGeometry args={[0.21, 0.24, 0.12, 16]} />
        <meshStandardMaterial color={pal.hat} roughness={0.85} />
      </mesh>
      {/* Ribbon band - wider */}
      <mesh position={[0, 1.395, 0]}>
        <cylinderGeometry args={[0.245, 0.245, 0.045, 16]} />
        <meshStandardMaterial color={pal.hatBand} roughness={0.5} />
      </mesh>
      {/* Ribbon bow (side) - bigger */}
      <mesh position={[0.24, 1.395, 0.07]} rotation={[0, 0.3, 0]}>
        <sphereGeometry args={[0.038, 8, 8]} />
        <meshStandardMaterial color={pal.hatBand} roughness={0.5} />
      </mesh>
      <mesh position={[0.28, 1.395, 0.08]} rotation={[0, 0.3, 0]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color={pal.hatBand} roughness={0.5} />
      </mesh>
      {/* Ribbon bow knot center */}
      <mesh position={[0.225, 1.395, 0.065]}>
        <sphereGeometry args={[0.015, 6, 6]} />
        <meshStandardMaterial color="#D45858" roughness={0.5} />
      </mesh>

      {/* Flower on hat - bigger */}
      <mesh position={[-0.22, 1.43, 0.14]}>
        <sphereGeometry args={[0.038, 10, 8]} />
        <meshStandardMaterial color={pal.flower} roughness={0.7} />
      </mesh>
      <mesh position={[-0.22, 1.43, 0.165]}>
        <sphereGeometry args={[0.015, 6, 4]} />
        <meshStandardMaterial color={PALETTE.flowerCenter} />
      </mesh>
      {/* Petals ring */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh
          key={`petal-${i}`}
          position={[
            -0.22 + Math.cos((i / 6) * Math.PI * 2) * 0.028,
            1.43 + Math.sin((i / 6) * Math.PI * 2) * 0.028,
            0.155,
          ]}
        >
          <sphereGeometry args={[0.014, 6, 5]} />
          <meshStandardMaterial color="#FFD0E8" />
        </mesh>
      ))}

      {/* Tiny leaf on flower */}
      <mesh position={[-0.245, 1.41, 0.15]} rotation={[0, 0, -0.4]} scale={[1, 0.5, 0.3]}>
        <sphereGeometry args={[0.022, 6, 5]} />
        <meshStandardMaterial color="#88D498" />
      </mesh>
      {/* Second tiny leaf */}
      <mesh position={[-0.20, 1.41, 0.15]} rotation={[0, 0, 0.3]} scale={[1, 0.5, 0.3]}>
        <sphereGeometry args={[0.018, 5, 4]} />
        <meshStandardMaterial color="#7BC67E" />
      </mesh>

      {/* Seasonal accessories */}
      <SeasonalAccessories />
    </group>
  );
}

// ===== CHIBI BODY (extra round, chubby, Animal Crossing proportions) =====
function ChibiBody() {
  const pal = getSeasonalPalette();
  return (
    <group>
      {/* Main torso - big round sphere (very chubby belly, wider) */}
      <mesh position={[0, 0.48, 0]} castShadow scale={[1.3, 0.9, 1.1]}>
        <sphereGeometry args={[0.28, 18, 16]} />
        <meshStandardMaterial color={pal.overalls} roughness={0.7} />
      </mesh>

      {/* Extra belly roundness - front bulge */}
      <mesh position={[0, 0.44, 0.1]} castShadow scale={[1.1, 0.85, 0.7]}>
        <sphereGeometry args={[0.22, 14, 12]} />
        <meshStandardMaterial color={pal.overalls} roughness={0.7} />
      </mesh>

      {/* Belly pocket patch (darker) */}
      <mesh position={[0, 0.44, 0.24]} scale={[0.75, 0.55, 0.3]}>
        <sphereGeometry args={[0.18, 12, 10]} />
        <meshStandardMaterial color={pal.overallsDark} roughness={0.7} />
      </mesh>

      {/* Front pocket detail */}
      <mesh position={[0, 0.40, 0.27]}>
        <boxGeometry args={[0.14, 0.07, 0.01]} />
        <meshStandardMaterial color={pal.overallsDark} />
      </mesh>
      {/* Pocket stitching line */}
      <mesh position={[0, 0.375, 0.275]}>
        <boxGeometry args={[0.12, 0.004, 0.005]} />
        <meshStandardMaterial color="#4DA85D" />
      </mesh>

      {/* Overall straps (left) */}
      <mesh position={[-0.09, 0.62, 0.13]} scale={[1, 1, 0.3]}>
        <boxGeometry args={[0.05, 0.16, 0.04]} />
        <meshStandardMaterial color={pal.overallsDark} />
      </mesh>
      {/* Overall straps (right) */}
      <mesh position={[0.09, 0.62, 0.13]} scale={[1, 1, 0.3]}>
        <boxGeometry args={[0.05, 0.16, 0.04]} />
        <meshStandardMaterial color={pal.overallsDark} />
      </mesh>

      {/* Gold buttons on straps - bigger */}
      <mesh position={[-0.09, 0.56, 0.19]}>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshStandardMaterial color={PALETTE.button} metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0.09, 0.56, 0.19]}>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshStandardMaterial color={PALETTE.button} metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Undershirt visible at collar - wider */}
      <mesh position={[0, 0.65, 0.07]} scale={[1.3, 0.6, 0.85]}>
        <sphereGeometry args={[0.14, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={PALETTE.shirt} roughness={0.8} />
      </mesh>

      {/* Small back collar detail */}
      <mesh position={[0, 0.65, -0.10]} scale={[1.0, 0.5, 0.6]}>
        <sphereGeometry args={[0.12, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={PALETTE.shirt} roughness={0.8} />
      </mesh>

      {/* Back of overalls - rounder */}
      <mesh position={[0, 0.48, -0.08]} castShadow scale={[1.15, 0.85, 0.6]}>
        <sphereGeometry args={[0.22, 12, 10]} />
        <meshStandardMaterial color={PALETTE.overalls} roughness={0.7} />
      </mesh>
    </group>
  );
}

// ===== STUBBY ARM (reusable) =====
function ChibiArm({ side }: { side: 'left' | 'right' }) {
  const xSign = side === 'left' ? -1 : 1;
  return (
    <group>
      {/* Arm shoulder (sphere cap) */}
      <mesh position={[0, -0.02, 0]} castShadow>
        <sphereGeometry args={[0.065, 10, 8]} />
        <meshStandardMaterial color={PALETTE.overalls} roughness={0.7} />
      </mesh>
      {/* Arm cylinder */}
      <mesh position={[0, -0.08, 0]} castShadow>
        <cylinderGeometry args={[0.052, 0.058, 0.09, 8]} />
        <meshStandardMaterial color={PALETTE.overalls} roughness={0.7} />
      </mesh>
      {/* Round mitt hand */}
      <mesh position={[0, -0.14, 0]}>
        <sphereGeometry args={[0.048, 10, 8]} />
        <meshStandardMaterial color={PALETTE.skin} roughness={0.55} />
      </mesh>
    </group>
  );
}

// ===== STUBBY LEG (reusable) =====
function ChibiLeg() {
  return (
    <group>
      {/* Leg cylinder */}
      <mesh position={[0, -0.04, 0]} castShadow>
        <cylinderGeometry args={[0.065, 0.07, 0.10, 10]} />
        <meshStandardMaterial color={PALETTE.overalls} roughness={0.7} />
      </mesh>
      {/* Round boot */}
      <mesh position={[0, -0.11, 0.012]} castShadow>
        <sphereGeometry args={[0.068, 10, 8]} />
        <meshStandardMaterial color={PALETTE.boots} roughness={0.7} />
      </mesh>
      {/* Boot sole */}
      <mesh position={[0, -0.155, 0.012]}>
        <cylinderGeometry args={[0.062, 0.068, 0.022, 10]} />
        <meshStandardMaterial color={PALETTE.bootSole} roughness={0.9} />
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
  locale = 'en',
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
  const [showDailyTip, setShowDailyTip] = useState(false);
  const [dailyTip, setDailyTip] = useState('');
  const [actionAnim, setActionAnim] = useState<string>(currentAction);

  const walkTarget = useRef<THREE.Vector3>(new THREE.Vector3(...position));
  const walkTimer = useRef(0);
  const walkPause = useRef(4);
  const startPos = useMemo(() => new THREE.Vector3(...position), [position]);
  const idleTimerRef = useRef(0);
  const actionTimerRef = useRef(0);

  // Walk to a specific target
  useEffect(() => {
    if (walkToTarget) {
      walkTarget.current.copy(walkToTarget);
      setIsWalking(true);
    }
  }, [walkToTarget]);

  // Auto-patrol
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

  // Wave greeting on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsWaving(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Daily tip timer
  useEffect(() => {
    const interval = setInterval(() => {
      if (!showDialogue) {
        const lang = DAILY_TIPS[locale] ? locale : 'en';
        const tips = DAILY_TIPS[lang];
        const tip = tips[Math.floor(Math.random() * tips.length)];
        setDailyTip(tip);
        setShowDailyTip(true);
        setTimeout(() => setShowDailyTip(false), 6000);
      }
    }, 45000);
    return () => clearInterval(interval);
  }, [showDialogue]);

  // ===== MAIN ANIMATION LOOP =====
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

    // ===== BODY BOUNCE / SWAY (chibi idle) =====
    if (bodyGroupRef.current) {
      const bounce = isWalking
        ? Math.abs(Math.sin(t * 10)) * 0.07  // Bouncy waddle when walking
        : Math.sin(t * 2.5) * 0.03 + Math.sin(t * 0.8) * 0.012;  // Gentle breathing
      bodyGroupRef.current.position.y = bounce;

      if (!isWalking && !isWaving) {
        // Gentle side-to-side sway
        bodyGroupRef.current.rotation.z = Math.sin(t * 1.0) * 0.03;
        // Idle stretch after 10s
        if (idleTimerRef.current > 10 && idleTimerRef.current < 12) {
          const stretchPhase = (idleTimerRef.current - 10) / 2;
          bodyGroupRef.current.position.y += Math.sin(stretchPhase * Math.PI) * 0.06;
        }
      } else {
        bodyGroupRef.current.rotation.z *= 0.9;
      }
    }

    // ===== HEAD ANIMATION (expressive looking around) =====
    if (headRef.current) {
      if (!isWalking) {
        headRef.current.rotation.z = Math.sin(t * 1.0) * 0.07 + Math.sin(t * 0.35) * 0.035;
        headRef.current.rotation.x = Math.sin(t * 0.7 + 1) * 0.045;

        // Look around after 5s idle
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

        // Curious head nod
        const nodCycle = t % 7;
        if (nodCycle > 5.5 && nodCycle < 6) {
          headRef.current.rotation.x += Math.sin((nodCycle - 5.5) * Math.PI * 4) * 0.09;
        }

        // Confused tilt when idle long
        if (idleTimerRef.current > 12) {
          const scratchCycle = (t % 15);
          if (scratchCycle > 13 && scratchCycle < 14.5) {
            headRef.current.rotation.z += Math.sin((scratchCycle - 13) * Math.PI * 2) * 0.07;
          }
        }
      } else {
        headRef.current.rotation.y *= 0.9;
      }
    }

    // ===== ARM ANIMATIONS =====
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
      if (armRightRef.current) {
        armRightRef.current.rotation.z = -2.2 + Math.sin(t * 6) * 0.35;
        armRightRef.current.rotation.x = Math.sin(t * 4) * 0.25;
      }
      if (armLeftRef.current) {
        armLeftRef.current.rotation.z = 2.2 - Math.sin(t * 6 + 0.5) * 0.35;
        armLeftRef.current.rotation.x = Math.sin(t * 4 + 0.5) * 0.25;
      }
      if (bodyGroupRef.current) {
        bodyGroupRef.current.position.y = Math.abs(Math.sin(t * 5)) * 0.16;
      }
    } else if (!isWalking && actionAnim === 'idle' && idleTimerRef.current > 12 && armRightRef.current) {
      // Scratch head when bored
      const scratchCycle = (t % 15);
      if (scratchCycle > 13 && scratchCycle < 14.5) {
        const scratchPhase = scratchCycle - 13;
        armRightRef.current.rotation.z = -1.1 + Math.sin(scratchPhase * Math.PI * 6) * 0.15;
        armRightRef.current.rotation.x = -0.4;
      }
    } else if (isWaving && armRightRef.current) {
      // Enthusiastic wave greeting
      armRightRef.current.rotation.z = Math.sin(t * 10) * 0.55 - 1.4;
      armRightRef.current.rotation.x = Math.sin(t * 5) * 0.18;
    } else if (armRightRef.current && !isWalking) {
      // Gentle idle sway
      armRightRef.current.rotation.z = Math.sin(t * 1.5) * 0.09;
      armRightRef.current.rotation.x = Math.sin(t * 1) * 0.06;
    }

    if (armLeftRef.current && !isWalking && actionAnim !== 'harvesting') {
      armLeftRef.current.rotation.z = -Math.sin(t * 1.5 + 0.5) * 0.09;
      armLeftRef.current.rotation.x = -Math.sin(t * 1 + 0.5) * 0.06;
    }

    // ===== WALKING LOGIC =====
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
        const speed = 0.35 * delta;
        pos.x += dir.x * speed;
        pos.z += dir.z * speed;

        const angle = Math.atan2(dir.x, dir.z);
        groupRef.current.rotation.y += (angle - groupRef.current.rotation.y) * 0.1;

        // Walking arm/leg swing (chibi waddle)
        if (armLeftRef.current) {
          armLeftRef.current.rotation.x = Math.sin(t * 8) * 0.45;
          armLeftRef.current.rotation.z = 0;
        }
        if (armRightRef.current && actionAnim === 'idle') {
          armRightRef.current.rotation.x = -Math.sin(t * 8) * 0.45;
          armRightRef.current.rotation.z = 0;
        }
        if (legLeftRef.current) {
          legLeftRef.current.rotation.x = Math.sin(t * 8) * 0.35;
        }
        if (legRightRef.current) {
          legRightRef.current.rotation.x = -Math.sin(t * 8) * 0.35;
        }
        // Extra body waddle
        if (bodyGroupRef.current) {
          bodyGroupRef.current.rotation.z = Math.sin(t * 8) * 0.045;
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

  return (
    <group ref={groupRef} position={position}>
      <group
        ref={bodyGroupRef}
        onClick={(e) => { e.stopPropagation(); handleClick(); }}
        onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
      >
        {/* ===== BODY ===== */}
        <ChibiBody />

        {/* ===== HEAD ===== */}
        <group ref={headRef}>
          <ChibiHead />
        </group>

        {/* ===== LEFT ARM ===== */}
        <group ref={armLeftRef} position={[-0.26, 0.56, 0]}>
          <ChibiArm side="left" />
        </group>

        {/* ===== RIGHT ARM ===== */}
        <group ref={armRightRef} position={[0.26, 0.56, 0]}>
          <ChibiArm side="right" />
          <HeldTool action={actionAnim} />
        </group>

        {/* ===== LEFT LEG ===== */}
        <group ref={legLeftRef} position={[-0.10, 0.32, 0]}>
          <ChibiLeg />
        </group>

        {/* ===== RIGHT LEG ===== */}
        <group ref={legRightRef} position={[0.10, 0.32, 0]}>
          <ChibiLeg />
        </group>

        {/* Hover glow ring */}
        {hovered && (
          <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.36, 0.42, 22]} />
            <meshBasicMaterial color="#FDE047" transparent opacity={0.5} />
          </mesh>
        )}

        {/* Ground shadow */}
        <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.24, 14]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.12} />
        </mesh>

        {/* Exclamation mark on hover */}
        {hovered && !showDialogue && (
          <group position={[0, 1.72, 0]}>
            <mesh>
              <boxGeometry args={[0.04, 0.11, 0.04]} />
              <meshBasicMaterial color="#FDE047" />
            </mesh>
            <mesh position={[0, -0.08, 0]}>
              <sphereGeometry args={[0.022, 8, 6]} />
              <meshBasicMaterial color="#FDE047" />
            </mesh>
          </group>
        )}

        {/* Action indicator icon */}
        {actionAnim !== 'idle' && actionAnim !== 'walking' && (
          <Html position={[0, 1.75, 0]} center distanceFactor={5} style={{ pointerEvents: 'none' }}>
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

      {/* Speech bubble (Animal Crossing style) */}
      {showDialogue && (
        <Html
          position={[0, 1.85, 0]}
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
            {/* Character name plate */}
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
