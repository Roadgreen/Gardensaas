import plantsData from '@/data/plants.json';
import type { Plant, GardenConfig, SoilType, ClimateZone, SunExposure } from '@/types';

const plants: Plant[] = plantsData as Plant[];

export function getAllPlants(): Plant[] {
  return plants;
}

export function getPlantById(id: string): Plant | undefined {
  return plants.find((p) => p.id === id);
}

export function getRecommendedPlants(config: GardenConfig): Plant[] {
  const currentMonth = new Date().getMonth() + 1;

  return plants
    .filter((plant) => {
      const soilMatch = plant.soilTypes.includes(config.soilType);
      const sunMatch = plant.sunExposure.includes(config.sunExposure);
      return soilMatch && sunMatch;
    })
    .sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      if (a.plantingMonths.includes(currentMonth)) scoreA += 3;
      if (b.plantingMonths.includes(currentMonth)) scoreB += 3;

      if (a.difficulty === 'easy') scoreA += 2;
      else if (a.difficulty === 'medium') scoreA += 1;
      if (b.difficulty === 'easy') scoreB += 2;
      else if (b.difficulty === 'medium') scoreB += 1;

      scoreA += getClimateScore(a, config.climateZone);
      scoreB += getClimateScore(b, config.climateZone);

      return scoreB - scoreA;
    });
}

function getClimateScore(plant: Plant, climate: ClimateZone): number {
  const heatLovers = ['tomato', 'pepper', 'eggplant', 'corn', 'zucchini', 'cucumber', 'basil'];
  const coldHardy = ['kale', 'cabbage', 'broccoli', 'spinach', 'pea', 'garlic', 'leek', 'turnip'];
  const versatile = ['carrot', 'lettuce', 'onion', 'radish', 'beet', 'potato', 'bean'];

  if (climate === 'tropical' || climate === 'subtropical' || climate === 'mediterranean') {
    if (heatLovers.includes(plant.id)) return 2;
    if (coldHardy.includes(plant.id)) return 0;
  }

  if (climate === 'continental' || climate === 'subarctic') {
    if (coldHardy.includes(plant.id)) return 2;
    if (heatLovers.includes(plant.id)) return 0;
  }

  if (versatile.includes(plant.id)) return 1;
  return 1;
}

export function getCompanionPlants(plantId: string): Plant[] {
  const plant = getPlantById(plantId);
  if (!plant) return [];
  return plant.companionPlants
    .map((id) => getPlantById(id))
    .filter((p): p is Plant => p !== undefined);
}

export function getEnemyPlants(plantId: string): Plant[] {
  const plant = getPlantById(plantId);
  if (!plant) return [];
  return plant.enemyPlants
    .map((id) => getPlantById(id))
    .filter((p): p is Plant => p !== undefined);
}

export function isPlantableNow(plant: Plant): boolean {
  const currentMonth = new Date().getMonth() + 1;
  return plant.plantingMonths.includes(currentMonth);
}

export function getPlantingCalendar(plantIds: string[]): Record<number, Plant[]> {
  const calendar: Record<number, Plant[]> = {};
  for (let m = 1; m <= 12; m++) {
    calendar[m] = [];
  }

  for (const id of plantIds) {
    const plant = getPlantById(id);
    if (!plant) continue;
    for (const month of plant.plantingMonths) {
      calendar[month].push(plant);
    }
  }

  return calendar;
}

export function calculateGardenCapacity(
  lengthM: number,
  widthM: number,
  spacingCm: number
): number {
  const lengthCm = lengthM * 100;
  const widthCm = widthM * 100;
  const rows = Math.floor(lengthCm / spacingCm);
  const cols = Math.floor(widthCm / spacingCm);
  return rows * cols;
}

export function getDailyTip(plantedItems: { plantId: string }[]): string {
  const generalTips = [
    "Water your garden early in the morning for best absorption.",
    "Mulch around your plants to retain moisture and suppress weeds.",
    "Check for pests regularly - early detection is the best prevention.",
    "Rotate your crops each year to prevent soil depletion.",
    "Compost your kitchen scraps to create rich, free fertilizer.",
    "Deadhead flowers to encourage more blooms.",
    "Leave some weeds - they can attract beneficial insects.",
    "Test your soil pH annually for optimal growing conditions.",
    "Plant flowers nearby to attract pollinators to your vegetables.",
    "Keep a garden journal to track what works year after year.",
    "Water deeply but less often to encourage deep root growth.",
    "Harvest vegetables in the morning when they are crispest.",
    "Use companion planting to naturally deter pests.",
    "Add organic matter to your soil every season.",
    "Prune tomato suckers for larger, healthier fruits.",
    "Save seeds from your best plants for next year.",
    "Install rain barrels to collect water for your garden.",
    "Plant herbs near your kitchen door for easy access while cooking.",
    "Avoid overhead watering to prevent fungal diseases.",
    "Let ladybugs thrive in your garden - they eat aphids.",
  ];

  if (plantedItems.length > 0) {
    const randomPlanted = plantedItems[Math.floor(Math.random() * plantedItems.length)];
    const plant = getPlantById(randomPlanted.plantId);
    if (plant && plant.tips.length > 0) {
      const tipIndex = Math.floor(Math.random() * plant.tips.length);
      return `${plant.name.en}: ${plant.tips[tipIndex]}`;
    }
  }

  return generalTips[Math.floor(Math.random() * generalTips.length)];
}

export function getWateringLabel(freq: Plant['wateringFrequency']): string {
  const labels: Record<string, string> = {
    daily: 'Every day',
    'every-2-days': 'Every 2 days',
    'twice-weekly': 'Twice a week',
    weekly: 'Once a week',
  };
  return labels[freq] || freq;
}

export function getDifficultyColor(difficulty: Plant['difficulty']): string {
  switch (difficulty) {
    case 'easy':
      return '#22C55E';
    case 'medium':
      return '#EAB308';
    case 'hard':
      return '#EF4444';
  }
}
