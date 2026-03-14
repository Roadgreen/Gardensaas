export type SoilType = 'clay' | 'sandy' | 'loamy' | 'silty' | 'peaty' | 'chalky';

export type ClimateZone =
  | 'tropical'
  | 'subtropical'
  | 'mediterranean'
  | 'temperate'
  | 'continental'
  | 'subarctic';

export type SunExposure = 'full-sun' | 'partial-shade' | 'full-shade';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type Shape3D = 'cone' | 'sphere' | 'cylinder' | 'box' | 'capsule' | 'bush' | 'vine' | 'leafy' | 'root' | 'tall-stem';

export interface Plant {
  id: string;
  name: {
    en: string;
    fr: string;
  };
  description: {
    en: string;
    fr: string;
  };
  category: 'vegetable' | 'herb' | 'fruit' | 'root' | 'ancient' | 'exotic';
  soilTypes: SoilType[];
  sunExposure: SunExposure[];
  plantingMonths: number[];
  harvestDays: number;
  wateringFrequency: 'daily' | 'every-2-days' | 'twice-weekly' | 'weekly';
  companionPlants: string[];
  enemyPlants: string[];
  difficulty: Difficulty;
  shape3d: Shape3D;
  color: string;
  spacingCm: number;
  depthCm: number;
  heightCm: number;
  tips: string[];
}

export interface GardenConfig {
  length: number;
  width: number;
  soilType: SoilType;
  climateZone: ClimateZone;
  sunExposure: SunExposure;
  plantedItems: PlantedItem[];
}

export interface PlantedItem {
  plantId: string;
  x: number;
  z: number;
  plantedDate: string;
}

export interface GardenTip {
  text: string;
  plantId?: string;
}

export const SOIL_LABELS: Record<SoilType, string> = {
  clay: 'Clay',
  sandy: 'Sandy',
  loamy: 'Loamy',
  silty: 'Silty',
  peaty: 'Peaty',
  chalky: 'Chalky',
};

export const CLIMATE_LABELS: Record<ClimateZone, string> = {
  tropical: 'Tropical',
  subtropical: 'Subtropical',
  mediterranean: 'Mediterranean',
  temperate: 'Temperate',
  continental: 'Continental',
  subarctic: 'Subarctic',
};

export const SUN_LABELS: Record<SunExposure, string> = {
  'full-sun': 'Full Sun (6+ hours)',
  'partial-shade': 'Partial Shade (3-6 hours)',
  'full-shade': 'Full Shade (<3 hours)',
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
