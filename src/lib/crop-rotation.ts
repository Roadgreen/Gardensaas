import { getPlantById } from '@/lib/garden-utils';
import type { Plant } from '@/types';

// Plant family classifications
export const PLANT_FAMILIES: Record<string, string[]> = {
  Solanaceae: ['tomato', 'pepper', 'eggplant', 'potato'],
  Cucurbitaceae: ['zucchini', 'cucumber', 'pumpkin', 'watermelon'],
  Brassicaceae: ['cabbage', 'broccoli', 'kale', 'turnip', 'radish'],
  Fabaceae: ['pea', 'bean'],
  Allium: ['onion', 'garlic', 'leek', 'chives'],
  Apiaceae: ['carrot', 'celery', 'dill', 'cilantro', 'parsley'],
  Asteraceae: ['lettuce', 'sunflower'],
  Chenopodiaceae: ['spinach', 'beet', 'swiss-chard'],
  Lamiaceae: ['basil', 'rosemary', 'thyme', 'mint', 'sage', 'oregano', 'lavender'],
  Poaceae: ['corn'],
  Rosaceae: ['strawberry', 'raspberry'],
};

// Reverse lookup: plantId -> family
const PLANT_TO_FAMILY: Record<string, string> = {};
for (const [family, plants] of Object.entries(PLANT_FAMILIES)) {
  for (const plantId of plants) {
    PLANT_TO_FAMILY[plantId] = family;
  }
}

export function getPlantFamily(plantId: string): string | undefined {
  return PLANT_TO_FAMILY[plantId];
}

// Feeding categories for bio-intensive rotation
export type FeedingCategory = 'heavy-feeder' | 'light-feeder' | 'nitrogen-fixer' | 'soil-builder';

const FEEDING_CATEGORIES: Record<string, FeedingCategory> = {
  // Heavy feeders - need lots of nutrients
  tomato: 'heavy-feeder',
  pepper: 'heavy-feeder',
  eggplant: 'heavy-feeder',
  corn: 'heavy-feeder',
  cabbage: 'heavy-feeder',
  broccoli: 'heavy-feeder',
  kale: 'heavy-feeder',
  zucchini: 'heavy-feeder',
  cucumber: 'heavy-feeder',
  pumpkin: 'heavy-feeder',
  watermelon: 'heavy-feeder',
  potato: 'heavy-feeder',
  celery: 'heavy-feeder',
  // Light feeders
  carrot: 'light-feeder',
  onion: 'light-feeder',
  garlic: 'light-feeder',
  leek: 'light-feeder',
  radish: 'light-feeder',
  turnip: 'light-feeder',
  beet: 'light-feeder',
  lettuce: 'light-feeder',
  spinach: 'light-feeder',
  'swiss-chard': 'light-feeder',
  // Nitrogen fixers
  pea: 'nitrogen-fixer',
  bean: 'nitrogen-fixer',
  // Herbs are generally soil builders / light feeders
  basil: 'soil-builder',
  rosemary: 'soil-builder',
  thyme: 'soil-builder',
  mint: 'soil-builder',
  sage: 'soil-builder',
  oregano: 'soil-builder',
  lavender: 'soil-builder',
  parsley: 'soil-builder',
  chives: 'soil-builder',
  dill: 'soil-builder',
  cilantro: 'soil-builder',
  sunflower: 'soil-builder',
  strawberry: 'light-feeder',
  raspberry: 'light-feeder',
};

export function getFeedingCategory(plantId: string): FeedingCategory {
  return FEEDING_CATEGORIES[plantId] || 'light-feeder';
}

// Bio-intensive rotation order: heavy feeder -> nitrogen fixer -> light feeder -> soil builder
const ROTATION_ORDER: FeedingCategory[] = [
  'heavy-feeder',
  'nitrogen-fixer',
  'light-feeder',
  'soil-builder',
];

export interface SeasonHistory {
  year: number;
  plantId: string;
  x: number;
  z: number;
}

const MINIMUM_ROTATION_YEARS = 4;
const PROXIMITY_RADIUS = 0.5; // meters - consider plants within this radius as "same spot"

/**
 * Check if a plant can be planted in a specific spot based on rotation history.
 * Returns { allowed: boolean, reason?: string, warnings: string[] }
 */
export function checkRotation(
  plantId: string,
  x: number,
  z: number,
  history: SeasonHistory[],
  currentYear: number
): { allowed: boolean; reason?: string; warnings: string[] } {
  const family = getPlantFamily(plantId);
  const warnings: string[] = [];

  // Find plants that were in this spot (within proximity radius) in recent years
  const nearbyHistory = history.filter((h) => {
    const dist = Math.sqrt(Math.pow(h.x - x, 2) + Math.pow(h.z - z, 2));
    return dist <= PROXIMITY_RADIUS && h.year < currentYear;
  });

  if (nearbyHistory.length === 0) {
    return { allowed: true, warnings: [] };
  }

  // Sort by year descending (most recent first)
  nearbyHistory.sort((a, b) => b.year - a.year);

  // Check same family violation (4-year minimum)
  for (const prev of nearbyHistory) {
    const prevFamily = getPlantFamily(prev.plantId);
    const yearsSince = currentYear - prev.year;

    if (family && prevFamily && family === prevFamily && yearsSince < MINIMUM_ROTATION_YEARS) {
      return {
        allowed: false,
        reason: `${family} family was planted here ${yearsSince} year${yearsSince === 1 ? '' : 's'} ago (${prev.plantId}). Wait ${MINIMUM_ROTATION_YEARS - yearsSince} more year${MINIMUM_ROTATION_YEARS - yearsSince === 1 ? '' : 's'} before planting the same family.`,
        warnings,
      };
    }

    // Same exact plant is worse
    if (prev.plantId === plantId && yearsSince < MINIMUM_ROTATION_YEARS) {
      warnings.push(
        `Same plant (${plantId}) was here ${yearsSince} year${yearsSince === 1 ? '' : 's'} ago. Ideally rotate for ${MINIMUM_ROTATION_YEARS} years.`
      );
    }
  }

  // Check bio-intensive feeding order
  const lastPlant = nearbyHistory[0];
  const lastFeeding = getFeedingCategory(lastPlant.plantId);
  const currentFeeding = getFeedingCategory(plantId);

  const lastIdx = ROTATION_ORDER.indexOf(lastFeeding);
  const currentIdx = ROTATION_ORDER.indexOf(currentFeeding);
  const expectedIdx = (lastIdx + 1) % ROTATION_ORDER.length;

  if (currentIdx !== expectedIdx) {
    const expectedCategory = ROTATION_ORDER[expectedIdx];
    warnings.push(
      `Bio-intensive tip: After a ${lastFeeding} (${lastPlant.plantId}), consider planting a ${expectedCategory} next.`
    );
  }

  return { allowed: true, warnings };
}

/**
 * Suggest what to plant next in a specific spot based on rotation history.
 * Returns a list of plant suggestions grouped by priority.
 */
export function suggestNextPlants(
  x: number,
  z: number,
  history: SeasonHistory[],
  currentYear: number,
  availablePlants: Plant[]
): { best: Plant[]; acceptable: Plant[]; avoid: Plant[] } {
  const best: Plant[] = [];
  const acceptable: Plant[] = [];
  const avoid: Plant[] = [];

  for (const plant of availablePlants) {
    const result = checkRotation(plant.id, x, z, history, currentYear);
    if (!result.allowed) {
      avoid.push(plant);
    } else if (result.warnings.length === 0) {
      best.push(plant);
    } else {
      acceptable.push(plant);
    }
  }

  // Sort best by bio-intensive preference
  const nearbyHistory = history
    .filter((h) => {
      const dist = Math.sqrt(Math.pow(h.x - x, 2) + Math.pow(h.z - z, 2));
      return dist <= PROXIMITY_RADIUS && h.year < currentYear;
    })
    .sort((a, b) => b.year - a.year);

  if (nearbyHistory.length > 0) {
    const lastFeeding = getFeedingCategory(nearbyHistory[0].plantId);
    const lastIdx = ROTATION_ORDER.indexOf(lastFeeding);
    const idealCategory = ROTATION_ORDER[(lastIdx + 1) % ROTATION_ORDER.length];

    best.sort((a, b) => {
      const aMatch = getFeedingCategory(a.id) === idealCategory ? 1 : 0;
      const bMatch = getFeedingCategory(b.id) === idealCategory ? 1 : 0;
      return bMatch - aMatch;
    });
  }

  return { best, acceptable, avoid };
}

/**
 * Get green manure / cover crop suggestions based on what was grown.
 */
export function getGreenManureSuggestions(lastPlantId: string): string[] {
  const feeding = getFeedingCategory(lastPlantId);
  const suggestions: string[] = [];

  if (feeding === 'heavy-feeder') {
    suggestions.push('Plant crimson clover or field peas as green manure to restore nitrogen.');
    suggestions.push('Consider a winter rye cover crop to improve soil structure.');
  } else if (feeding === 'light-feeder') {
    suggestions.push('A light compost top-dressing will maintain soil fertility.');
    suggestions.push('Buckwheat makes an excellent quick cover crop between seasons.');
  } else if (feeding === 'nitrogen-fixer') {
    suggestions.push('Great choice! The nitrogen fixed by this crop will benefit next season\'s heavy feeders.');
    suggestions.push('Leave roots in the ground after harvest to release nitrogen slowly.');
  }

  suggestions.push('Add a layer of mulch or compost to protect soil biology over winter.');
  return suggestions;
}

/**
 * Validate companion planting for a set of plants at their positions.
 * Returns warnings for any enemy plants placed too close together.
 */
export function validateCompanionPlanting(
  plants: { plantId: string; x: number; z: number }[]
): { warnings: string[]; benefits: string[] } {
  const warnings: string[] = [];
  const benefits: string[] = [];
  const COMPANION_RADIUS = 1.0; // meters

  for (let i = 0; i < plants.length; i++) {
    for (let j = i + 1; j < plants.length; j++) {
      const a = plants[i];
      const b = plants[j];
      const dist = Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.z - b.z, 2));

      if (dist > COMPANION_RADIUS) continue;

      const plantA = getPlantById(a.plantId);
      const plantB = getPlantById(b.plantId);
      if (!plantA || !plantB) continue;

      // Check enemies
      if (plantA.enemyPlants.includes(b.plantId) || plantB.enemyPlants.includes(a.plantId)) {
        warnings.push(
          `${plantA.name.en} and ${plantB.name.en} are poor companions and should not be planted near each other.`
        );
      }

      // Check companions
      if (plantA.companionPlants.includes(b.plantId) || plantB.companionPlants.includes(a.plantId)) {
        benefits.push(
          `${plantA.name.en} and ${plantB.name.en} are great companions!`
        );
      }
    }
  }

  return { warnings, benefits };
}

/**
 * Get the rotation history summary for a specific spot.
 */
export function getSpotHistory(
  x: number,
  z: number,
  history: SeasonHistory[]
): { year: number; plantId: string; family?: string; feeding: FeedingCategory }[] {
  return history
    .filter((h) => {
      const dist = Math.sqrt(Math.pow(h.x - x, 2) + Math.pow(h.z - z, 2));
      return dist <= PROXIMITY_RADIUS;
    })
    .sort((a, b) => b.year - a.year)
    .map((h) => ({
      year: h.year,
      plantId: h.plantId,
      family: getPlantFamily(h.plantId),
      feeding: getFeedingCategory(h.plantId),
    }));
}
