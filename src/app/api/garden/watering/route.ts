import { NextResponse } from 'next/server';
import { getWeatherData, getRecentRainfall } from '@/lib/weather-calendar';
import { calculateWateringTasks, getWateringSummary } from '@/lib/watering-service';
import type { WeatherContext } from '@/lib/watering-service';
import { getPlantById, getAllPlants } from '@/lib/garden-utils';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/garden/watering
 * Returns today's watering recommendations for a garden.
 *
 * Query params:
 *   gardenId - fetch garden from DB with its plants and location
 *   OR
 *   lat, lng - direct coordinates
 *   plants - comma-separated plant IDs (used with lat/lng)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gardenId = searchParams.get('gardenId');
    const plantIdsParam = searchParams.get('plants');
    const locale = (searchParams.get('locale') === 'fr' ? 'fr' : 'en') as 'en' | 'fr';
    let lat = parseFloat(searchParams.get('lat') || '');
    let lng = parseFloat(searchParams.get('lng') || '');

    let plantsWithDates: Array<{
      plant: NonNullable<ReturnType<typeof getPlantById>>;
      plantedDate: string;
    }> = [];

    if (gardenId) {
      const garden = await prisma.garden.findUnique({
        where: { id: gardenId },
        include: { gardenPlants: true },
      });

      if (!garden) {
        return NextResponse.json({ error: 'Garden not found' }, { status: 404 });
      }

      if (garden.latitude && garden.longitude) {
        lat = garden.latitude;
        lng = garden.longitude;
      }

      plantsWithDates = garden.gardenPlants
        .map((gp) => {
          const plant = getPlantById(gp.plantId);
          return plant
            ? { plant, plantedDate: gp.plantedDate.toISOString() }
            : null;
        })
        .filter((p): p is NonNullable<typeof p> => p !== null);
    } else if (plantIdsParam) {
      const plantIds = plantIdsParam.split(',').map((s) => s.trim());
      plantsWithDates = plantIds
        .map((id) => {
          const plant = getPlantById(id);
          return plant
            ? { plant, plantedDate: new Date().toISOString() }
            : null;
        })
        .filter((p): p is NonNullable<typeof p> => p !== null);
    }

    if (isNaN(lat) || isNaN(lng)) {
      // Default to Paris if no coordinates
      lat = 48.8566;
      lng = 2.3522;
    }

    if (plantsWithDates.length === 0) {
      // Use some common plants as fallback
      const commonIds = ['tomato', 'lettuce', 'carrot', 'basil', 'cucumber'];
      plantsWithDates = commonIds
        .map((id) => {
          const plant = getPlantById(id);
          return plant
            ? { plant, plantedDate: new Date().toISOString() }
            : null;
        })
        .filter((p): p is NonNullable<typeof p> => p !== null);
    }

    // Fetch weather data
    const [weather, rainfall] = await Promise.all([
      getWeatherData(lat, lng),
      getRecentRainfall(lat, lng),
    ]);

    // Build weather context
    const forecastPrecipitation =
      weather.daily.length > 1 ? weather.daily[1].precipitation : 0;

    const weatherContext: WeatherContext = {
      temperature: weather.temperature,
      humidity: weather.humidity,
      recentRainfallMm: rainfall.totalMm,
      todayPrecipitation: weather.precipitation,
      forecastPrecipitation,
      weatherCode: weather.weatherCode,
    };

    // Calculate watering tasks
    const tasks = calculateWateringTasks(plantsWithDates, weatherContext, locale);
    const summary = getWateringSummary(tasks, locale);

    // Cache weather data if gardenId provided
    if (gardenId) {
      try {
        await prisma.weatherCache.create({
          data: {
            gardenId,
            latitude: lat,
            longitude: lng,
            temperature: weather.temperature,
            temperatureMax: weather.temperatureMax,
            temperatureMin: weather.temperatureMin,
            humidity: weather.humidity,
            precipitation: weather.precipitation,
            windSpeed: weather.windSpeed,
            weatherCode: weather.weatherCode,
            forecast: JSON.parse(JSON.stringify(weather.daily)),
            rainfallLast7Days: rainfall.totalMm,
          },
        });
      } catch {
        // Non-critical: caching failure should not break the response
      }
    }

    return NextResponse.json({
      location: { latitude: lat, longitude: lng },
      weather: {
        temperature: weather.temperature,
        temperatureMax: weather.temperatureMax,
        temperatureMin: weather.temperatureMin,
        humidity: weather.humidity,
        precipitation: weather.precipitation,
        windSpeed: weather.windSpeed,
        weatherCode: weather.weatherCode,
      },
      rainfall: {
        last7DaysMm: rainfall.totalMm,
      },
      tasks,
      summary,
    });
  } catch (error) {
    console.error('Error calculating watering tasks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
