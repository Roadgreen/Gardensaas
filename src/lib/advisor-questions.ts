/**
 * Context-aware suggested questions for the AI Garden Advisor.
 * Generates personalized questions based on the user's garden state.
 */

import type { PlantedItem, Plant } from '@/types';

interface GardenContext {
  plantedItems: PlantedItem[];
  plants: Plant[];
  locale: string;
}

// ── Generic fallback questions (used when garden is empty) ──────────────

const GENERIC_EN = [
  'When should I plant tomatoes? 🍅',
  'My basil leaves are turning yellow 🌿',
  'Best companion plants for carrots? 🥕',
  'How do I make compost at home? ♻️',
  'How often should I water my garden? 💧',
  'Which plants grow well in the shade? 🌑',
  'How do I deal with aphids naturally? 🐛',
  'What are the best plants for spring? 🌸',
];

const GENERIC_FR = [
  'Quand planter des tomates ? 🍅',
  'Mes feuilles de basilic jaunissent 🌿',
  'Meilleures associations pour les carottes ? 🥕',
  'Comment faire du compost maison ? ♻️',
  'À quelle fréquence arroser mon potager ? 💧',
  'Quelles plantes poussent bien à l\'ombre ? 🌑',
  'Comment lutter contre les pucerons naturellement ? 🐛',
  'Quelles plantes pour le printemps ? 🌸',
];

// ── Per-plant question templates ────────────────────────────────────────

type TemplateFn = (name: string) => string;

const PLANT_TEMPLATES_EN: TemplateFn[] = [
  (name) => `How are my ${name} doing this month? 📅`,
  (name) => `When should I harvest my ${name}? 🧺`,
  (name) => `Best companion plants for ${name}? 🌿`,
  (name) => `How to protect my ${name} from pests? 🐛`,
  (name) => `How much water do my ${name} need? 💧`,
  (name) => `Should I fertilize my ${name} now? 🪴`,
  (name) => `Any tips for bigger ${name} yields? 📈`,
  (name) => `What diseases affect ${name}? 🔍`,
];

const PLANT_TEMPLATES_FR: TemplateFn[] = [
  (name) => `Comment vont mes ${name} ce mois-ci ? 📅`,
  (name) => `Quand récolter mes ${name} ? 🧺`,
  (name) => `Meilleures associations pour les ${name} ? 🌿`,
  (name) => `Comment protéger mes ${name} des ravageurs ? 🐛`,
  (name) => `Combien d'eau pour mes ${name} ? 💧`,
  (name) => `Dois-je fertiliser mes ${name} maintenant ? 🪴`,
  (name) => `Astuces pour de meilleurs rendements de ${name} ? 📈`,
  (name) => `Quelles maladies touchent les ${name} ? 🔍`,
];

// ── Season-aware questions ──────────────────────────────────────────────

function getCurrentSeason(): 'spring' | 'summer' | 'autumn' | 'winter' {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

const SEASONAL_EN: Record<string, string[]> = {
  spring: [
    'What should I sow this spring? 🌱',
    'Is it too early to transplant outdoors? ❄️',
    'How to prepare my beds for spring planting? 🛏️',
  ],
  summer: [
    'How to keep my garden watered in the heat? ☀️',
    'Which crops can I still plant in summer? 🌻',
    'How to deal with summer pests? 🐛',
  ],
  autumn: [
    'What can I plant for a fall harvest? 🍂',
    'How to prepare my garden for winter? 🧤',
    'Should I add compost before winter? ♻️',
  ],
  winter: [
    'What can I grow indoors this winter? 🏠',
    'How to plan my garden for next spring? 📋',
    'Which seeds should I order now? 🛒',
  ],
};

const SEASONAL_FR: Record<string, string[]> = {
  spring: [
    'Que semer ce printemps ? 🌱',
    'Est-ce trop tôt pour repiquer dehors ? ❄️',
    'Comment préparer mes planches pour le printemps ? 🛏️',
  ],
  summer: [
    'Comment arroser par forte chaleur ? ☀️',
    'Quels légumes planter encore en été ? 🌻',
    'Comment gérer les ravageurs d\'été ? 🐛',
  ],
  autumn: [
    'Que planter pour une récolte d\'automne ? 🍂',
    'Comment préparer le jardin pour l\'hiver ? 🧤',
    'Faut-il amender le sol avant l\'hiver ? ♻️',
  ],
  winter: [
    'Que cultiver en intérieur cet hiver ? 🏠',
    'Comment planifier mon jardin pour le printemps ? 📋',
    'Quelles graines commander maintenant ? 🛒',
  ],
};

// ── Main export ─────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Get context-aware suggested questions for the advisor welcome screen.
 * Returns 4 questions: mix of plant-specific, seasonal, and generic.
 */
export function getContextAwareSuggestions(ctx: GardenContext): string[] {
  const { plantedItems, plants, locale } = ctx;
  const isFr = locale === 'fr';
  const season = getCurrentSeason();

  // Build a map of plantId -> display name
  const plantMap = new Map<string, string>();
  for (const p of plants) {
    plantMap.set(p.id, isFr ? p.name.fr : p.name.en);
  }

  // Get unique planted plant names
  const uniquePlantIds = [...new Set(plantedItems.map((pi) => pi.plantId))];
  const plantedNames = uniquePlantIds
    .map((id) => plantMap.get(id))
    .filter(Boolean) as string[];

  const questions: string[] = [];

  // 1. Plant-specific questions (up to 2)
  if (plantedNames.length > 0) {
    const templates = isFr ? PLANT_TEMPLATES_FR : PLANT_TEMPLATES_EN;
    const shuffledNames = shuffle(plantedNames);
    const shuffledTemplates = shuffle(templates);

    for (let i = 0; i < Math.min(2, shuffledNames.length); i++) {
      questions.push(shuffledTemplates[i](shuffledNames[i]));
    }
  }

  // 2. Seasonal question (1)
  const seasonalPool = isFr ? SEASONAL_FR[season] : SEASONAL_EN[season];
  const shuffledSeasonal = shuffle(seasonalPool);
  questions.push(shuffledSeasonal[0]);

  // 3. Fill remaining with generic questions
  const genericPool = isFr ? GENERIC_FR : GENERIC_EN;
  const shuffledGeneric = shuffle(genericPool);
  for (const q of shuffledGeneric) {
    if (questions.length >= 4) break;
    if (!questions.includes(q)) {
      questions.push(q);
    }
  }

  return questions.slice(0, 4);
}

/**
 * Get a brief summary of the user's garden for display in the advisor.
 */
export function getGardenSummaryText(ctx: GardenContext): string | null {
  const { plantedItems, plants, locale } = ctx;
  if (plantedItems.length === 0) return null;

  const isFr = locale === 'fr';
  const plantMap = new Map<string, string>();
  for (const p of plants) {
    plantMap.set(p.id, isFr ? p.name.fr : p.name.en);
  }

  // Count plants by type
  const counts = new Map<string, number>();
  for (const item of plantedItems) {
    const name = plantMap.get(item.plantId) || item.plantId;
    counts.set(name, (counts.get(name) || 0) + 1);
  }

  const parts = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => (count > 1 ? `${count}× ${name}` : name));

  const total = plantedItems.length;
  const prefix = isFr
    ? `🌱 Votre jardin : ${total} plante${total > 1 ? 's' : ''}`
    : `🌱 Your garden: ${total} plant${total > 1 ? 's' : ''}`;

  return `${prefix} — ${parts.join(', ')}${counts.size > 5 ? '…' : ''}`;
}
