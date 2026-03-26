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

export interface PlantVariety {
  id: string;
  name: { en: string; fr: string };
  color?: string; // override plant color if different
  harvestDays?: number; // override if different from base plant
  description?: { en: string; fr: string };
}

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
  rowSpacingCm?: number; // spacing between rows, defaults to spacingCm * 1.5
  depthCm: number;
  heightCm: number;
  tips: string[];
  varieties?: PlantVariety[];
}

export type ZoneType = 'in-ground' | 'raised-bed' | 'pot' | 'greenhouse';

export const ZONE_TYPE_LABELS: Record<ZoneType, { en: string; fr: string }> = {
  'in-ground': { en: 'In-Ground Plot', fr: 'Pleine terre' },
  'raised-bed': { en: 'Raised Bed', fr: 'Bac sureleve' },
  'pot': { en: 'Pot / Container', fr: 'Pot / Conteneur' },
  'greenhouse': { en: 'Greenhouse', fr: 'Serre' },
};

export interface GardenZone {
  id: string;
  name: string;
  x: number; // percent position in garden (0-100)
  z: number;
  widthM: number;
  lengthM: number;
  soilType: SoilType;
  sunExposure: SunExposure;
  zoneType: ZoneType;
  color: string; // display color for the zone outline
}

export interface Seedling {
  id: string;
  plantId: string;
  varietyId?: string;
  seededAt: string; // ISO date
  pots: number;
  notes?: string;
}

export interface GardenConfig {
  length: number;
  width: number;
  soilType: SoilType;
  climateZone: ClimateZone;
  sunExposure: SunExposure;
  plantedItems: PlantedItem[];
  raisedBeds: RaisedBed[];
  zones?: GardenZone[];
  seedlings?: Seedling[];
  latitude?: number;
  longitude?: number;
  city?: string;
  hasGreenhouse?: boolean;
  hasRaisedBeds?: boolean;
  gardenType?: 'outdoor' | 'indoor' | 'balcony' | 'terrace';
  emailNotifications?: boolean;
  notificationFrequency?: 'daily' | 'weekly' | 'never';
  setupCompleted?: boolean; // true after user finishes the setup wizard
  onboardingStep?: 'setup' | 'inspect' | 'plant' | 'done'; // guided flow progress
}

export interface WateringTask {
  plantId: string;
  plantName: string;
  wateringFrequency: string;
  needsWatering: boolean;
  reason: string;
  urgency: 'high' | 'medium' | 'low' | 'skip';
  amountMl?: number;
}

export interface PlantedItem {
  plantId: string;
  varietyId?: string; // specific variety chosen
  x: number;
  z: number;
  plantedDate: string;
  raisedBedId?: string; // optional: placed inside a raised bed
  zoneId?: string; // optional: placed inside a planting zone
}

export type RaisedBedSoilType = 'potting-mix' | 'compost' | 'loamy' | 'sandy' | 'peat-mix' | 'clay-mix';

export const RAISED_BED_SOIL_LABELS: Record<RaisedBedSoilType, string> = {
  'potting-mix': 'Potting Mix',
  'compost': 'Compost Blend',
  'loamy': 'Loamy Soil',
  'sandy': 'Sandy Mix',
  'peat-mix': 'Peat Mix',
  'clay-mix': 'Clay Mix',
};

export interface RaisedBed {
  id: string;
  name: string;
  x: number; // percent position relative to garden (can exceed 0-100 for outside placement)
  z: number;
  widthM: number;  // meters
  lengthM: number; // meters
  heightM: number; // meters (typical: 0.2 - 0.8)
  soilType: RaisedBedSoilType;
  outsideGarden?: boolean; // true if placed outside the main garden plot
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

export const ZONE_COLORS = [
  '#4ADE80', '#60A5FA', '#F97316', '#A78BFA',
  '#FB923C', '#34D399', '#F472B6', '#FBBF24',
];

export interface PlantingSuggestion {
  plantId: string;
  plantName: string;
  quantity: number;
  reason: string;
  score: number; // 0-100, how well it fits
  companions: string[];
  spacingNote: string;
}
