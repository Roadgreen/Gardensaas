import { getAllPlants, getPlantById } from '@/lib/garden-utils';
import { getPlantFamily, getFeedingCategory, PLANT_FAMILIES } from '@/lib/crop-rotation';
import type { Plant, SoilType, SunExposure, ClimateZone, GardenZone, RaisedBed } from '@/types';

export interface PlantingSuggestionResult {
  plantId: string;
  plantName: { en: string; fr: string };
  quantity: number;
  spacingCm: number;
  rowSpacingCm: number;
  reason: { en: string; fr: string };
  score: number; // 0-100
  companions: string[]; // plant IDs
  enemies: string[]; // plant IDs
  difficulty: string;
  category: string;
  harvestDays: number;
  canSowNow: boolean;
  canSowIndoors: boolean;
  plantingMonths: number[];
  areaNeededM2: number; // per plant
  companionBenefits?: { en: string; fr: string }[];
  rotationTip?: { en: string; fr: string };
}

export interface ZonePlantingPlan {
  zoneId: string;
  zoneName: string;
  zoneAreaM2: number;
  soilType: string;
  sunExposure: string;
  suggestions: PlantingSuggestionResult[];
  warnings: PlantingWarning[];
}

export interface PlantingWarning {
  type: 'bad-companion' | 'spacing' | 'season' | 'soil' | 'sun' | 'frost';
  message: { en: string; fr: string };
  plantIds: string[];
}

/**
 * Get the current month (1-12).
 */
function currentMonth(): number {
  return new Date().getMonth() + 1;
}

/**
 * Determine the current season string.
 */
function currentSeason(): 'spring' | 'summer' | 'autumn' | 'winter' {
  const m = currentMonth();
  if ([3, 4, 5].includes(m)) return 'spring';
  if ([6, 7, 8].includes(m)) return 'summer';
  if ([9, 10, 11].includes(m)) return 'autumn';
  return 'winter';
}

/**
 * Check if a plant can be sown/planted in the current month.
 */
function canPlantNow(plant: Plant): boolean {
  return plant.plantingMonths.includes(currentMonth());
}

/**
 * Check if a plant can be started indoors (warm season crops started ~2 months before outdoor planting).
 */
function canStartIndoors(plant: Plant): boolean {
  const month = currentMonth();
  const warmSeasonPlants = ['tomato', 'pepper', 'eggplant', 'zucchini', 'cucumber', 'pumpkin', 'watermelon', 'corn', 'basil', 'melon'];
  if (!warmSeasonPlants.some(w => plant.id.includes(w))) return false;

  // Can start indoors 2 months before the first planting month
  const firstPlantingMonth = Math.min(...plant.plantingMonths);
  const indoorStartMonth = firstPlantingMonth - 2;
  const adjustedMonth = indoorStartMonth <= 0 ? indoorStartMonth + 12 : indoorStartMonth;
  return month === adjustedMonth || month === adjustedMonth + 1;
}

/**
 * Calculate how many plants fit in a given area based on spacing.
 */
function calculateQuantity(areaM2: number, spacingCm: number, rowSpacingCm?: number): number {
  const spacingM = spacingCm / 100;
  const rowSpaceM = (rowSpacingCm || spacingCm * 1.5) / 100;
  // Rows along one dimension, plants along the other
  const plantsPerRow = Math.floor(Math.sqrt(areaM2) / spacingM);
  const rows = Math.floor(Math.sqrt(areaM2) / rowSpaceM);
  return Math.max(1, plantsPerRow * rows);
}

/**
 * Score a plant for a given zone. Higher = better fit.
 */
function scorePlant(
  plant: Plant,
  soilType: SoilType,
  sunExposure: SunExposure,
  climateZone: ClimateZone,
  existingPlantIds: string[],
  weatherTemp?: number
): number {
  let score = 50; // base score

  // Season match (most important)
  if (canPlantNow(plant)) {
    score += 25;
  } else if (canStartIndoors(plant)) {
    score += 15;
  } else {
    score -= 20;
  }

  // Soil match
  if (plant.soilTypes.includes(soilType)) {
    score += 10;
  } else {
    score -= 15;
  }

  // Sun match
  if (plant.sunExposure.includes(sunExposure)) {
    score += 10;
  } else {
    score -= 15;
  }

  // Difficulty bonus (easy plants ranked higher)
  if (plant.difficulty === 'easy') score += 8;
  else if (plant.difficulty === 'medium') score += 4;

  // Companion planting bonus
  const companionBonus = existingPlantIds.filter(id =>
    plant.companionPlants.includes(id)
  ).length;
  score += companionBonus * 5;

  // Enemy penalty
  const enemyPenalty = existingPlantIds.filter(id =>
    plant.enemyPlants.includes(id)
  ).length;
  score -= enemyPenalty * 10;

  // Climate zone preference
  const heatLovers = ['tomato', 'pepper', 'eggplant', 'corn', 'zucchini', 'cucumber', 'basil', 'watermelon', 'melon'];
  const coldHardy = ['kale', 'cabbage', 'broccoli', 'spinach', 'pea', 'garlic', 'leek', 'turnip', 'brussels-sprouts'];

  if (climateZone === 'tropical' || climateZone === 'subtropical' || climateZone === 'mediterranean') {
    if (heatLovers.some(h => plant.id.includes(h))) score += 5;
  }
  if (climateZone === 'continental' || climateZone === 'subarctic') {
    if (coldHardy.some(h => plant.id.includes(h))) score += 5;
  }

  // Quick harvest bonus for current season
  if (plant.harvestDays < 60) score += 5;

  // Weather temperature compatibility
  if (weatherTemp !== undefined) {
    if (weatherTemp < 5 && heatLovers.some(h => plant.id.includes(h))) {
      score -= 15;
    }
    if (weatherTemp > 25 && coldHardy.some(h => plant.id.includes(h))) {
      score -= 10;
    }
  }

  // Category diversity bonus (prefer vegetables for main garden)
  if (plant.category === 'vegetable') score += 3;
  if (plant.category === 'herb') score += 2;

  return Math.max(0, Math.min(100, score));
}

/**
 * Generate smart planting suggestions for a single zone.
 */
export function getZoneSuggestions(
  zone: { id: string; name: string; widthM: number; lengthM: number; soilType: string; sunExposure: string },
  climateZone: ClimateZone,
  existingPlantIds: string[] = [],
  weatherTemp?: number,
  maxSuggestions: number = 12
): ZonePlantingPlan {
  const allPlants = getAllPlants();
  const areaM2 = zone.widthM * zone.lengthM;
  const soilType = zone.soilType as SoilType;
  const sunExposure = zone.sunExposure as SunExposure;

  // Score all plants
  const scored = allPlants
    .filter(p => !p.id.includes('-')) // Only use base plants for suggestions, not varieties
    .map(plant => {
      const score = scorePlant(plant, soilType, sunExposure, climateZone, existingPlantIds, weatherTemp);
      const rowSpacingCm = plant.rowSpacingCm || Math.round(plant.spacingCm * 1.5);
      const quantity = calculateQuantity(areaM2, plant.spacingCm, rowSpacingCm);
      const areaPerPlant = (plant.spacingCm / 100) * (rowSpacingCm / 100);

      const reasonEn = buildReason(plant, soilType, sunExposure, existingPlantIds, 'en');
      const reasonFr = buildReason(plant, soilType, sunExposure, existingPlantIds, 'fr');

      return {
        plantId: plant.id,
        plantName: plant.name,
        quantity,
        spacingCm: plant.spacingCm,
        rowSpacingCm,
        reason: { en: reasonEn, fr: reasonFr },
        score,
        companions: plant.companionPlants.filter(id => existingPlantIds.includes(id) || allPlants.some(p => p.id === id)),
        enemies: plant.enemyPlants,
        difficulty: plant.difficulty,
        category: plant.category,
        harvestDays: plant.harvestDays,
        canSowNow: canPlantNow(plant),
        canSowIndoors: canStartIndoors(plant),
        plantingMonths: plant.plantingMonths,
        areaNeededM2: areaPerPlant,
      } as PlantingSuggestionResult;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSuggestions);

  // Generate warnings
  const warnings = generateWarnings(scored, existingPlantIds, soilType, sunExposure);

  return {
    zoneId: zone.id,
    zoneName: zone.name,
    zoneAreaM2: areaM2,
    soilType: zone.soilType,
    sunExposure: zone.sunExposure,
    suggestions: scored,
    warnings,
  };
}

/**
 * Build a human-readable reason for why a plant is suggested.
 */
function buildReason(
  plant: Plant,
  soilType: SoilType,
  sunExposure: SunExposure,
  existingPlantIds: string[],
  lang: 'en' | 'fr'
): string {
  const reasons: string[] = [];

  if (canPlantNow(plant)) {
    reasons.push(lang === 'fr' ? 'A planter ce mois-ci' : 'Can be planted this month');
  } else if (canStartIndoors(plant)) {
    reasons.push(lang === 'fr' ? 'Semis interieur possible' : 'Can be started indoors');
  }

  if (plant.soilTypes.includes(soilType)) {
    reasons.push(lang === 'fr' ? 'Sol adapte' : 'Soil match');
  }

  if (plant.sunExposure.includes(sunExposure)) {
    reasons.push(lang === 'fr' ? 'Ensoleillement adapte' : 'Sun match');
  }

  const companions = existingPlantIds.filter(id => plant.companionPlants.includes(id));
  if (companions.length > 0) {
    const companionNames = companions.map(id => {
      const p = getPlantById(id);
      return p ? p.name[lang] : id;
    });
    reasons.push(lang === 'fr'
      ? `Bon compagnon de ${companionNames.join(', ')}`
      : `Good companion for ${companionNames.join(', ')}`
    );
  }

  if (plant.difficulty === 'easy') {
    reasons.push(lang === 'fr' ? 'Facile a cultiver' : 'Easy to grow');
  }

  if (plant.harvestDays < 45) {
    reasons.push(lang === 'fr' ? 'Recolte rapide' : 'Quick harvest');
  }

  return reasons.join(' - ') || (lang === 'fr' ? 'Bonne option pour votre jardin' : 'Good option for your garden');
}

/**
 * Generate warnings about companion planting conflicts and other issues.
 */
function generateWarnings(
  suggestions: PlantingSuggestionResult[],
  existingPlantIds: string[],
  soilType: SoilType,
  sunExposure: SunExposure
): PlantingWarning[] {
  const warnings: PlantingWarning[] = [];
  const allSelectedIds = [...existingPlantIds, ...suggestions.map(s => s.plantId)];

  // Check for bad companions among suggestions
  for (const suggestion of suggestions) {
    const plant = getPlantById(suggestion.plantId);
    if (!plant) continue;

    const enemiesInSelection = plant.enemyPlants.filter(id => allSelectedIds.includes(id));
    for (const enemyId of enemiesInSelection) {
      const enemy = getPlantById(enemyId);
      if (!enemy) continue;

      // Avoid duplicate warnings
      const alreadyWarned = warnings.some(w =>
        w.type === 'bad-companion' &&
        w.plantIds.includes(suggestion.plantId) &&
        w.plantIds.includes(enemyId)
      );
      if (alreadyWarned) continue;

      warnings.push({
        type: 'bad-companion',
        message: {
          en: `${plant.name.en} and ${enemy.name.en} are bad companions - avoid planting them together.`,
          fr: `${plant.name.fr} et ${enemy.name.fr} sont de mauvais compagnons - evitez de les planter ensemble.`,
        },
        plantIds: [suggestion.plantId, enemyId],
      });
    }
  }

  // Check season warnings
  const outOfSeason = suggestions.filter(s => !s.canSowNow && !s.canSowIndoors && s.score > 40);
  if (outOfSeason.length > 0) {
    warnings.push({
      type: 'season',
      message: {
        en: `Some suggested plants cannot be sown this month. Consider starting them at the right time.`,
        fr: `Certaines plantes suggerees ne peuvent pas etre semees ce mois-ci. Planifiez-les pour le bon moment.`,
      },
      plantIds: outOfSeason.map(s => s.plantId),
    });
  }

  return warnings;
}

/**
 * Generate planting plans for all zones in a garden.
 */
export function getGardenPlantingPlan(
  zones: Array<{ id: string; name: string; widthM: number; lengthM: number; soilType: string; sunExposure: string }>,
  raisedBeds: Array<{ id: string; name: string; widthM: number; lengthM: number; soilType: string }>,
  climateZone: ClimateZone,
  gardenSunExposure: SunExposure,
  existingPlantIds: string[] = [],
  weatherTemp?: number
): ZonePlantingPlan[] {
  const plans: ZonePlantingPlan[] = [];
  const allPlantIds = [...existingPlantIds];

  // Process zones
  for (const zone of zones) {
    const plan = getZoneSuggestions(zone, climateZone, allPlantIds, weatherTemp, 8);
    plans.push(plan);
    // Add suggested plants to existing to improve companion logic for next zone
    allPlantIds.push(...plan.suggestions.slice(0, 3).map(s => s.plantId));
  }

  // Process raised beds
  for (const bed of raisedBeds) {
    const bedAsZone = {
      id: bed.id,
      name: bed.name,
      widthM: bed.widthM,
      lengthM: bed.lengthM,
      soilType: bed.soilType === 'potting-mix' ? 'loamy' : bed.soilType === 'peat-mix' ? 'peaty' : bed.soilType === 'clay-mix' ? 'clay' : bed.soilType,
      sunExposure: gardenSunExposure,
    };
    const plan = getZoneSuggestions(bedAsZone, climateZone, allPlantIds, weatherTemp, 6);
    plans.push(plan);
    allPlantIds.push(...plan.suggestions.slice(0, 3).map(s => s.plantId));
  }

  return plans;
}

/**
 * Get a quick seasonal summary of what to plant NOW.
 */
export function getSeasonalQuickPicks(
  climateZone: ClimateZone,
  soilType: SoilType,
  sunExposure: SunExposure,
  count: number = 8
): PlantingSuggestionResult[] {
  const allPlants = getAllPlants();
  const month = currentMonth();

  return allPlants
    .filter(p => !p.id.includes('-')) // base plants only
    .filter(p => p.plantingMonths.includes(month))
    .map(plant => {
      const score = scorePlant(plant, soilType, sunExposure, climateZone, []);
      const rowSpacingCm = plant.rowSpacingCm || Math.round(plant.spacingCm * 1.5);
      return {
        plantId: plant.id,
        plantName: plant.name,
        quantity: 0,
        spacingCm: plant.spacingCm,
        rowSpacingCm,
        reason: {
          en: buildReason(plant, soilType, sunExposure, [], 'en'),
          fr: buildReason(plant, soilType, sunExposure, [], 'fr'),
        },
        score,
        companions: plant.companionPlants,
        enemies: plant.enemyPlants,
        difficulty: plant.difficulty,
        category: plant.category,
        harvestDays: plant.harvestDays,
        canSowNow: true,
        canSowIndoors: canStartIndoors(plant),
        plantingMonths: plant.plantingMonths,
        areaNeededM2: (plant.spacingCm / 100) * ((plant.rowSpacingCm || plant.spacingCm * 1.5) / 100),
      } as PlantingSuggestionResult;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}
