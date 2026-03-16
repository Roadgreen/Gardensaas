import type { Plant, WateringTask } from '@/types';
import type { WeatherData, DailyForecast } from '@/lib/weather-calendar';

/**
 * Watering frequency in days between waterings.
 */
function frequencyToDays(freq: Plant['wateringFrequency']): number {
  switch (freq) {
    case 'daily':
      return 1;
    case 'every-2-days':
      return 2;
    case 'twice-weekly':
      return 3.5;
    case 'weekly':
      return 7;
    default:
      return 3;
  }
}

/**
 * Base water amount in mL per plant based on watering frequency.
 */
function baseWaterMl(freq: Plant['wateringFrequency']): number {
  switch (freq) {
    case 'daily':
      return 500;
    case 'every-2-days':
      return 750;
    case 'twice-weekly':
      return 1000;
    case 'weekly':
      return 2000;
    default:
      return 750;
  }
}

export interface WeatherContext {
  temperature: number;
  humidity: number;
  recentRainfallMm: number; // last 7 days
  todayPrecipitation: number; // mm
  forecastPrecipitation: number; // next 24h expected mm
  weatherCode: number;
  uvIndex?: number;
}

// Locale-aware messages for watering reasons
const messages = {
  en: {
    rainingSkip: (mm: string) => `Rain in progress (${mm}mm). No watering needed.`,
    rainForecastSkip: (mm: string) => `Rain expected (${mm}mm). Watering postponed.`,
    recentRainSkip: (mm: string) => `Sufficient rainfall this week (${mm}mm).`,
    notScheduled: 'Not scheduled for today.',
    urgentHeat: (temp: string) => `Heat (${temp}C) and dry air. Urgent watering needed.`,
    youngPlant: (days: number) => `Young plant (${days} days). Regular watering important.`,
    scheduled: (freq: string) => `Scheduled watering (${freq}).`,
    noWatering: 'No watering needed today! Weather is taking care of it.',
    urgentSummary: (count: number, liters: string) =>
      `${count} plant${count > 1 ? 's' : ''} need urgent watering (~${liters}L total).`,
    normalSummary: (count: number, liters: string) =>
      `${count} plant${count > 1 ? 's' : ''} to water today (~${liters}L total).`,
  },
  fr: {
    rainingSkip: (mm: string) => `Pluie en cours (${mm}mm). Pas besoin d'arroser.`,
    rainForecastSkip: (mm: string) => `Pluie pr\u00e9vue (${mm}mm). Arrosage report\u00e9.`,
    recentRainSkip: (mm: string) => `Pr\u00e9cipitation suffisante cette semaine (${mm}mm).`,
    notScheduled: "Pas pr\u00e9vu au planning aujourd'hui.",
    urgentHeat: (temp: string) => `Chaleur (${temp}\u00b0C) et air sec. Arrosage urgent.`,
    youngPlant: (days: number) => `Jeune plant (${days}j). Arrosage r\u00e9gulier important.`,
    scheduled: (freq: string) => `Arrosage planifi\u00e9 (${freq}).`,
    noWatering: "Pas besoin d'arroser aujourd'hui ! La m\u00e9t\u00e9o s'en charge.",
    urgentSummary: (count: number, liters: string) =>
      `${count} plante${count > 1 ? 's' : ''} \u00e0 arroser en urgence (~${liters}L total).`,
    normalSummary: (count: number, liters: string) =>
      `${count} plante${count > 1 ? 's' : ''} \u00e0 arroser aujourd'hui (~${liters}L total).`,
  },
};

/**
 * Calculate per-plant watering recommendations based on weather conditions.
 */
export function calculateWateringTasks(
  plants: Array<{ plant: Plant; plantedDate: string }>,
  weather: WeatherContext,
  locale: 'en' | 'fr' = 'en'
): WateringTask[] {
  const tasks: WateringTask[] = [];
  const t = messages[locale] || messages.en;

  // Is it currently raining or forecast to rain significantly?
  const isRaining = weather.weatherCode >= 51 && weather.weatherCode <= 67;
  const heavyRainForecast = weather.forecastPrecipitation > 5;
  const significantRecentRain = weather.recentRainfallMm > 20;

  // Temperature-based multiplier
  let tempMultiplier = 1.0;
  if (weather.temperature > 35) tempMultiplier = 1.8;
  else if (weather.temperature > 30) tempMultiplier = 1.5;
  else if (weather.temperature > 25) tempMultiplier = 1.2;
  else if (weather.temperature < 10) tempMultiplier = 0.5;
  else if (weather.temperature < 15) tempMultiplier = 0.7;

  // Humidity-based multiplier
  let humidityMultiplier = 1.0;
  if (weather.humidity < 30) humidityMultiplier = 1.3;
  else if (weather.humidity < 50) humidityMultiplier = 1.1;
  else if (weather.humidity > 80) humidityMultiplier = 0.7;

  // UV index multiplier
  let uvMultiplier = 1.0;
  if (weather.uvIndex !== undefined) {
    if (weather.uvIndex > 8) uvMultiplier = 1.3;
    else if (weather.uvIndex > 6) uvMultiplier = 1.15;
  }

  for (const { plant, plantedDate } of plants) {
    const freqDays = frequencyToDays(plant.wateringFrequency);
    const daysSincePlanting = Math.floor(
      (Date.now() - new Date(plantedDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    const plantName = locale === 'fr' ? (plant.name.fr || plant.name.en) : plant.name.en;

    // Young plants need more frequent watering
    const youngPlantMultiplier = daysSincePlanting < 14 ? 1.3 : 1.0;

    // Effective water need multiplier
    const effectiveMultiplier =
      tempMultiplier * humidityMultiplier * uvMultiplier * youngPlantMultiplier;

    // Adjusted frequency in days
    const adjustedFreqDays = freqDays / effectiveMultiplier;

    // Should water today? Check if today aligns with adjusted frequency
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const shouldWaterBySchedule = dayOfYear % Math.max(1, Math.round(adjustedFreqDays)) === 0
      || adjustedFreqDays <= 1;

    // Skip reasons
    if (isRaining && weather.todayPrecipitation > 3) {
      tasks.push({
        plantId: plant.id,
        plantName,
        wateringFrequency: plant.wateringFrequency,
        needsWatering: false,
        reason: t.rainingSkip(weather.todayPrecipitation.toFixed(1)),
        urgency: 'skip',
      });
      continue;
    }

    if (heavyRainForecast && plant.wateringFrequency !== 'daily') {
      tasks.push({
        plantId: plant.id,
        plantName,
        wateringFrequency: plant.wateringFrequency,
        needsWatering: false,
        reason: t.rainForecastSkip(weather.forecastPrecipitation.toFixed(1)),
        urgency: 'skip',
      });
      continue;
    }

    if (significantRecentRain && plant.wateringFrequency === 'weekly') {
      tasks.push({
        plantId: plant.id,
        plantName,
        wateringFrequency: plant.wateringFrequency,
        needsWatering: false,
        reason: t.recentRainSkip(weather.recentRainfallMm.toFixed(0)),
        urgency: 'skip',
      });
      continue;
    }

    if (!shouldWaterBySchedule && plant.wateringFrequency !== 'daily') {
      tasks.push({
        plantId: plant.id,
        plantName,
        wateringFrequency: plant.wateringFrequency,
        needsWatering: false,
        reason: t.notScheduled,
        urgency: 'skip',
      });
      continue;
    }

    // Calculate urgency
    let urgency: WateringTask['urgency'] = 'medium';
    if (weather.temperature > 30 && weather.humidity < 40) {
      urgency = 'high';
    } else if (weather.temperature > 35) {
      urgency = 'high';
    } else if (plant.wateringFrequency === 'daily' && weather.temperature > 25) {
      urgency = 'high';
    } else if (weather.temperature < 15 && weather.humidity > 60) {
      urgency = 'low';
    }

    // Calculate amount
    const amount = Math.round(baseWaterMl(plant.wateringFrequency) * effectiveMultiplier);

    // Build reason
    let reason = '';
    if (urgency === 'high') {
      reason = t.urgentHeat(weather.temperature.toFixed(0));
    } else if (daysSincePlanting < 14) {
      reason = t.youngPlant(daysSincePlanting);
    } else {
      reason = t.scheduled(plant.wateringFrequency.replace('-', ' '));
    }

    tasks.push({
      plantId: plant.id,
      plantName,
      wateringFrequency: plant.wateringFrequency,
      needsWatering: true,
      reason,
      urgency,
      amountMl: amount,
    });
  }

  // Sort: high urgency first, then medium, then low, then skip
  const urgencyOrder = { high: 0, medium: 1, low: 2, skip: 3 };
  tasks.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

  return tasks;
}

/**
 * Get a summary of today's watering needs.
 */
export function getWateringSummary(tasks: WateringTask[], locale: 'en' | 'fr' = 'en'): {
  totalPlantsToWater: number;
  totalPlantsToSkip: number;
  totalWaterMl: number;
  overallUrgency: 'high' | 'medium' | 'low' | 'none';
  summaryMessage: string;
} {
  const t = messages[locale] || messages.en;
  const toWater = tasks.filter((t) => t.needsWatering);
  const toSkip = tasks.filter((t) => !t.needsWatering);
  const totalMl = toWater.reduce((sum, t) => sum + (t.amountMl || 0), 0);

  let overallUrgency: 'high' | 'medium' | 'low' | 'none' = 'none';
  if (toWater.some((t) => t.urgency === 'high')) overallUrgency = 'high';
  else if (toWater.some((t) => t.urgency === 'medium')) overallUrgency = 'medium';
  else if (toWater.length > 0) overallUrgency = 'low';

  let summaryMessage = '';
  if (toWater.length === 0) {
    summaryMessage = t.noWatering;
  } else if (overallUrgency === 'high') {
    summaryMessage = t.urgentSummary(toWater.length, (totalMl / 1000).toFixed(1));
  } else {
    summaryMessage = t.normalSummary(toWater.length, (totalMl / 1000).toFixed(1));
  }

  return {
    totalPlantsToWater: toWater.length,
    totalPlantsToSkip: toSkip.length,
    totalWaterMl: totalMl,
    overallUrgency,
    summaryMessage,
  };
}
