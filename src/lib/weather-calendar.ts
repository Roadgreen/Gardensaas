import { getPlantById } from '@/lib/garden-utils';
import type { Plant } from '@/types';

// Open-Meteo API (free, no API key needed)
const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1';

export interface WeatherData {
  temperature: number;        // current temp in C
  temperatureMax: number;
  temperatureMin: number;
  humidity: number;
  precipitation: number;      // mm in last 24h
  windSpeed: number;          // km/h
  weatherCode: number;
  daily: DailyForecast[];
}

export interface DailyForecast {
  date: string;
  temperatureMax: number;
  temperatureMin: number;
  precipitation: number;
  weatherCode: number;
}

export interface ClimateInfo {
  zone: string;
  lastFrostDate: { month: number; day: number };
  firstFrostDate: { month: number; day: number };
  growingSeasonLength: number; // days
}

export interface SowingInfo {
  plantId: string;
  plantName: string;
  sowIndoorsStart: Date | null;
  sowIndoorsEnd: Date | null;
  sowOutdoorsStart: Date | null;
  sowOutdoorsEnd: Date | null;
  transplantDate: Date | null;
  harvestDate: Date | null;
}

export interface WateringRecommendation {
  shouldWater: boolean;
  reason: string;
  nextWateringDate?: string;
  amountMm?: number;
}

export interface FrostAlert {
  alert: boolean;
  date?: string;
  minTemp?: number;
  message: string;
}

/**
 * Fetch current weather and 7-day forecast from Open-Meteo.
 */
export async function getWeatherData(
  latitude: number,
  longitude: number
): Promise<WeatherData> {
  const url = new URL(`${OPEN_METEO_BASE}/forecast`);
  url.searchParams.set('latitude', latitude.toString());
  url.searchParams.set('longitude', longitude.toString());
  url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code');
  url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code');
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('forecast_days', '7');

  const res = await fetch(url.toString(), { next: { revalidate: 1800 } }); // cache 30 min
  if (!res.ok) {
    throw new Error(`Weather API error: ${res.status}`);
  }

  const data = await res.json();

  const daily: DailyForecast[] = data.daily.time.map((date: string, i: number) => ({
    date,
    temperatureMax: data.daily.temperature_2m_max[i],
    temperatureMin: data.daily.temperature_2m_min[i],
    precipitation: data.daily.precipitation_sum[i],
    weatherCode: data.daily.weather_code[i],
  }));

  return {
    temperature: data.current.temperature_2m,
    temperatureMax: daily[0]?.temperatureMax ?? data.current.temperature_2m,
    temperatureMin: daily[0]?.temperatureMin ?? data.current.temperature_2m,
    humidity: data.current.relative_humidity_2m,
    precipitation: data.current.precipitation,
    windSpeed: data.current.wind_speed_10m,
    weatherCode: data.current.weather_code,
    daily,
  };
}

/**
 * Fetch recent rainfall (last 7 days) from Open-Meteo.
 */
export async function getRecentRainfall(
  latitude: number,
  longitude: number
): Promise<{ totalMm: number; dailyMm: number[] }> {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 7);

  const url = new URL(`${OPEN_METEO_BASE}/forecast`);
  url.searchParams.set('latitude', latitude.toString());
  url.searchParams.set('longitude', longitude.toString());
  url.searchParams.set('daily', 'precipitation_sum');
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('start_date', formatDate(start));
  url.searchParams.set('end_date', formatDate(end));

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(`Weather API error: ${res.status}`);
  }

  const data = await res.json();
  const dailyMm: number[] = data.daily.precipitation_sum || [];
  const totalMm = dailyMm.reduce((sum: number, v: number) => sum + (v || 0), 0);

  return { totalMm, dailyMm };
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

/**
 * Determine climate zone from latitude/longitude using simple latitude bands.
 * For a production app you would use a more detailed classification.
 */
export function determineClimateZone(latitude: number): ClimateInfo {
  const absLat = Math.abs(latitude);

  if (absLat < 10) {
    return {
      zone: 'tropical',
      lastFrostDate: { month: 1, day: 1 }, // no frost
      firstFrostDate: { month: 12, day: 31 },
      growingSeasonLength: 365,
    };
  } else if (absLat < 23.5) {
    return {
      zone: 'subtropical',
      lastFrostDate: { month: 2, day: 1 },
      firstFrostDate: { month: 12, day: 15 },
      growingSeasonLength: 320,
    };
  } else if (absLat < 35) {
    return {
      zone: 'mediterranean',
      lastFrostDate: { month: 3, day: 1 },
      firstFrostDate: { month: 11, day: 30 },
      growingSeasonLength: 270,
    };
  } else if (absLat < 50) {
    return {
      zone: 'temperate',
      lastFrostDate: { month: 4, day: 15 },
      firstFrostDate: { month: 10, day: 15 },
      growingSeasonLength: 180,
    };
  } else if (absLat < 60) {
    return {
      zone: 'continental',
      lastFrostDate: { month: 5, day: 15 },
      firstFrostDate: { month: 9, day: 30 },
      growingSeasonLength: 140,
    };
  } else {
    return {
      zone: 'subarctic',
      lastFrostDate: { month: 6, day: 1 },
      firstFrostDate: { month: 9, day: 1 },
      growingSeasonLength: 90,
    };
  }
}

/**
 * Build a sowing/planting/harvest calendar for a plant based on climate zone.
 */
export function getSowingCalendar(
  plant: Plant,
  climate: ClimateInfo,
  year: number
): SowingInfo {
  const lastFrost = new Date(year, climate.lastFrostDate.month - 1, climate.lastFrostDate.day);
  const firstFrost = new Date(year, climate.firstFrostDate.month - 1, climate.firstFrostDate.day);

  // Determine if plant needs indoor start (warm-season crops)
  const warmSeasonPlants = ['tomato', 'pepper', 'eggplant', 'zucchini', 'cucumber', 'pumpkin', 'watermelon', 'corn', 'basil'];
  const isWarmSeason = warmSeasonPlants.includes(plant.id);

  let sowIndoorsStart: Date | null = null;
  let sowIndoorsEnd: Date | null = null;
  let sowOutdoorsStart: Date | null = null;
  let sowOutdoorsEnd: Date | null = null;
  let transplantDate: Date | null = null;

  if (isWarmSeason) {
    // Start indoors 6-8 weeks before last frost
    sowIndoorsStart = new Date(lastFrost);
    sowIndoorsStart.setDate(sowIndoorsStart.getDate() - 56); // 8 weeks before
    sowIndoorsEnd = new Date(lastFrost);
    sowIndoorsEnd.setDate(sowIndoorsEnd.getDate() - 42); // 6 weeks before

    // Transplant 1-2 weeks after last frost
    transplantDate = new Date(lastFrost);
    transplantDate.setDate(transplantDate.getDate() + 14);

    // Can also direct sow outdoors after last frost (2 weeks after)
    sowOutdoorsStart = new Date(lastFrost);
    sowOutdoorsStart.setDate(sowOutdoorsStart.getDate() + 14);
    sowOutdoorsEnd = new Date(firstFrost);
    sowOutdoorsEnd.setDate(sowOutdoorsEnd.getDate() - plant.harvestDays - 14);
  } else {
    // Cool-season or direct-sow crops
    // Can sow as soon as soil is workable (2-4 weeks before last frost for hardy types)
    const hardyCrops = ['pea', 'spinach', 'kale', 'lettuce', 'radish', 'onion', 'garlic', 'cabbage', 'broccoli', 'turnip', 'beet', 'carrot'];
    const isHardy = hardyCrops.includes(plant.id);

    sowOutdoorsStart = new Date(lastFrost);
    sowOutdoorsStart.setDate(sowOutdoorsStart.getDate() - (isHardy ? 28 : 0));
    sowOutdoorsEnd = new Date(firstFrost);
    sowOutdoorsEnd.setDate(sowOutdoorsEnd.getDate() - plant.harvestDays - 14);
  }

  // Calculate harvest date from earliest possible planting
  const plantingDate = transplantDate || sowOutdoorsStart;
  let harvestDate: Date | null = null;
  if (plantingDate) {
    harvestDate = new Date(plantingDate);
    harvestDate.setDate(harvestDate.getDate() + plant.harvestDays);
  }

  return {
    plantId: plant.id,
    plantName: plant.name.en,
    sowIndoorsStart,
    sowIndoorsEnd,
    sowOutdoorsStart,
    sowOutdoorsEnd,
    transplantDate,
    harvestDate,
  };
}

/**
 * Get expected harvest date given a planting date and plant.
 */
export function getExpectedHarvestDate(plantedDate: Date, harvestDays: number): Date {
  const harvest = new Date(plantedDate);
  harvest.setDate(harvest.getDate() + harvestDays);
  return harvest;
}

/**
 * Get watering recommendation based on recent rainfall, temperature, and plant needs.
 */
export function getWateringRecommendation(
  recentRainfallMm: number,
  currentTemp: number,
  plants: Plant[]
): WateringRecommendation {
  // Base water need: about 25mm per week for most gardens
  const weeklyNeedMm = 25;

  // Adjust for temperature
  let tempMultiplier = 1.0;
  if (currentTemp > 30) tempMultiplier = 1.5;
  else if (currentTemp > 25) tempMultiplier = 1.2;
  else if (currentTemp < 10) tempMultiplier = 0.6;
  else if (currentTemp < 15) tempMultiplier = 0.8;

  // Check if any plants need daily watering
  const hasDailyWaterers = plants.some((p) => p.wateringFrequency === 'daily');
  if (hasDailyWaterers) tempMultiplier *= 1.2;

  const adjustedNeed = weeklyNeedMm * tempMultiplier;
  const deficit = adjustedNeed - recentRainfallMm;

  if (deficit <= 0) {
    return {
      shouldWater: false,
      reason: `Sufficient rainfall this week (${recentRainfallMm.toFixed(1)}mm received, ${adjustedNeed.toFixed(0)}mm needed). Skip watering today.`,
    };
  }

  if (deficit < 5) {
    return {
      shouldWater: false,
      reason: `Almost enough rain this week (${recentRainfallMm.toFixed(1)}mm of ${adjustedNeed.toFixed(0)}mm needed). Light watering optional.`,
    };
  }

  return {
    shouldWater: true,
    reason: `Garden needs water. Only ${recentRainfallMm.toFixed(1)}mm rain this week, but ${adjustedNeed.toFixed(0)}mm needed.`,
    amountMm: Math.round(deficit),
  };
}

/**
 * Check for frost alerts in the forecast.
 */
export function checkFrostAlerts(forecast: DailyForecast[]): FrostAlert {
  for (const day of forecast) {
    if (day.temperatureMin <= 0) {
      return {
        alert: true,
        date: day.date,
        minTemp: day.temperatureMin,
        message: `Frost warning! Temperature expected to drop to ${day.temperatureMin.toFixed(1)}°C on ${day.date}. Protect sensitive plants.`,
      };
    }
    if (day.temperatureMin <= 3) {
      return {
        alert: true,
        date: day.date,
        minTemp: day.temperatureMin,
        message: `Near-frost conditions (${day.temperatureMin.toFixed(1)}°C) expected on ${day.date}. Consider covering tender plants.`,
      };
    }
  }

  return {
    alert: false,
    message: 'No frost risk in the next 7 days.',
  };
}

/**
 * Get weather description from WMO weather code.
 */
export function getWeatherDescription(code: number): string {
  const descriptions: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  };
  return descriptions[code] || 'Unknown';
}

/**
 * Get the best planting/sowing actions for this week based on weather and calendar.
 */
export function getThisWeekActions(
  plants: Plant[],
  climate: ClimateInfo,
  forecast: DailyForecast[]
): { action: string; plantName: string; reason: string }[] {
  const actions: { action: string; plantName: string; reason: string }[] = [];
  const now = new Date();
  const year = now.getFullYear();

  // Check if conditions are good for planting (no frost, not too wet)
  const hasFrost = forecast.some((d) => d.temperatureMin <= 0);
  const totalRain = forecast.reduce((sum, d) => sum + d.precipitation, 0);
  const tooWet = totalRain > 50; // mm

  for (const plant of plants) {
    const calendar = getSowingCalendar(plant, climate, year);

    if (calendar.sowIndoorsStart && calendar.sowIndoorsEnd) {
      if (now >= calendar.sowIndoorsStart && now <= calendar.sowIndoorsEnd) {
        actions.push({
          action: 'sow-indoors',
          plantName: plant.name.en,
          reason: 'Start seeds indoors now for transplanting after last frost.',
        });
      }
    }

    if (calendar.sowOutdoorsStart && calendar.sowOutdoorsEnd && !hasFrost && !tooWet) {
      if (now >= calendar.sowOutdoorsStart && now <= calendar.sowOutdoorsEnd) {
        actions.push({
          action: 'sow-outdoors',
          plantName: plant.name.en,
          reason: 'Weather conditions are good for direct sowing this week.',
        });
      }
    }

    if (calendar.transplantDate && !hasFrost) {
      const transplantWindow = new Date(calendar.transplantDate);
      transplantWindow.setDate(transplantWindow.getDate() + 14);
      if (now >= calendar.transplantDate && now <= transplantWindow) {
        actions.push({
          action: 'transplant',
          plantName: plant.name.en,
          reason: 'Good time to transplant seedlings outdoors.',
        });
      }
    }
  }

  return actions;
}

/**
 * Build a monthly calendar of actions for the whole year.
 */
export function buildAnnualCalendar(
  plants: Plant[],
  climate: ClimateInfo,
  year: number
): Record<number, { action: string; plantName: string }[]> {
  const calendar: Record<number, { action: string; plantName: string }[]> = {};
  for (let m = 1; m <= 12; m++) {
    calendar[m] = [];
  }

  for (const plant of plants) {
    const info = getSowingCalendar(plant, climate, year);

    if (info.sowIndoorsStart) {
      const month = info.sowIndoorsStart.getMonth() + 1;
      calendar[month].push({ action: 'sow-indoors', plantName: plant.name.en });
    }

    if (info.sowOutdoorsStart) {
      const month = info.sowOutdoorsStart.getMonth() + 1;
      calendar[month].push({ action: 'sow-outdoors', plantName: plant.name.en });
    }

    if (info.transplantDate) {
      const month = info.transplantDate.getMonth() + 1;
      calendar[month].push({ action: 'transplant', plantName: plant.name.en });
    }

    if (info.harvestDate) {
      const month = info.harvestDate.getMonth() + 1;
      if (month >= 1 && month <= 12) {
        calendar[month].push({ action: 'harvest', plantName: plant.name.en });
      }
    }
  }

  return calendar;
}
