import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAllPlants, getPlantById } from '@/lib/garden-utils';
import {
  getWeatherData,
  getRecentRainfall,
  determineClimateZone,
  getWateringRecommendation,
  checkFrostAlerts,
  getThisWeekActions,
  buildAnnualCalendar,
  getWeatherDescription,
} from '@/lib/weather-calendar';

// GET /api/garden/weather?gardenId=xxx
// Or with direct coords: /api/garden/weather?lat=48.8&lng=2.3
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gardenId = searchParams.get('gardenId');
    let lat = parseFloat(searchParams.get('lat') || '');
    let lng = parseFloat(searchParams.get('lng') || '');

    // If gardenId provided, look up coordinates from garden
    let gardenPlantIds: string[] = [];
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

      gardenPlantIds = garden.gardenPlants.map((gp) => gp.plantId);
    }

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: 'Location required. Set garden coordinates or pass lat/lng parameters.' },
        { status: 400 }
      );
    }

    // Fetch weather data and rainfall in parallel
    const [weather, rainfall] = await Promise.all([
      getWeatherData(lat, lng),
      getRecentRainfall(lat, lng),
    ]);

    // Determine climate zone
    const climate = determineClimateZone(lat);

    // Get plants for recommendations
    const plants = gardenPlantIds.length > 0
      ? gardenPlantIds.map((id) => getPlantById(id)).filter((p): p is NonNullable<typeof p> => p !== undefined)
      : getAllPlants().slice(0, 10); // fallback: top 10 common plants

    // Watering recommendation
    const watering = getWateringRecommendation(rainfall.totalMm, weather.temperature, plants);

    // Frost alerts
    const frostAlert = checkFrostAlerts(weather.daily);

    // This week's actions
    const weekActions = getThisWeekActions(plants, climate, weather.daily);

    // Annual calendar
    const year = new Date().getFullYear();
    const annualCalendar = buildAnnualCalendar(plants, climate, year);

    return NextResponse.json({
      current: {
        temperature: weather.temperature,
        temperatureMax: weather.temperatureMax,
        temperatureMin: weather.temperatureMin,
        humidity: weather.humidity,
        precipitation: weather.precipitation,
        windSpeed: weather.windSpeed,
        description: getWeatherDescription(weather.weatherCode),
      },
      forecast: weather.daily.map((d) => ({
        ...d,
        description: getWeatherDescription(d.weatherCode),
      })),
      climate: {
        zone: climate.zone,
        lastFrostDate: climate.lastFrostDate,
        firstFrostDate: climate.firstFrostDate,
        growingSeasonLength: climate.growingSeasonLength,
      },
      rainfall: {
        last7DaysMm: rainfall.totalMm,
        dailyMm: rainfall.dailyMm,
      },
      watering,
      frostAlert,
      weekActions,
      annualCalendar,
    });
  } catch (error) {
    console.error('Error getting weather data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
