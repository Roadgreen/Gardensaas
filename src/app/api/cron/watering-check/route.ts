import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getWeatherData, getRecentRainfall } from '@/lib/weather-calendar';
import { calculateWateringTasks, getWateringSummary } from '@/lib/watering-service';
import type { WeatherContext } from '@/lib/watering-service';
import { getPlantById } from '@/lib/garden-utils';

/**
 * GET /api/cron/watering-check
 *
 * Daily cron endpoint that checks all gardens with GPS coordinates,
 * calculates watering needs, and prepares push notifications.
 *
 * This endpoint should be called once daily (e.g., at 7:00 AM)
 * by a cron service (Vercel Cron, Railway, etc.).
 *
 * Security: In production, protect this with a CRON_SECRET header.
 *
 * Query params:
 *   secret - optional cron secret for authentication
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    // Optional: verify cron secret
    if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find all gardens with GPS coordinates and their plants
    const gardens = await prisma.garden.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
      },
      include: {
        gardenPlants: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            pushToken: true,
          },
        },
      },
    });

    const results: Array<{
      gardenId: string;
      gardenName: string;
      userId: string;
      userName: string;
      hasPushToken: boolean;
      summary: ReturnType<typeof getWateringSummary>;
      notificationSent: boolean;
    }> = [];

    for (const garden of gardens) {
      if (!garden.latitude || !garden.longitude) continue;

      try {
        // Fetch weather for this garden's location
        const [weather, rainfall] = await Promise.all([
          getWeatherData(garden.latitude, garden.longitude),
          getRecentRainfall(garden.latitude, garden.longitude),
        ]);

        // Build plants list
        const plantsWithDates = garden.gardenPlants
          .map((gp) => {
            const plant = getPlantById(gp.plantId);
            return plant
              ? { plant, plantedDate: gp.plantedDate.toISOString() }
              : null;
          })
          .filter((p): p is NonNullable<typeof p> => p !== null);

        if (plantsWithDates.length === 0) continue;

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

        const tasks = calculateWateringTasks(plantsWithDates, weatherContext);
        const summary = getWateringSummary(tasks);

        // Cache weather data
        try {
          await prisma.weatherCache.create({
            data: {
              gardenId: garden.id,
              latitude: garden.latitude,
              longitude: garden.longitude,
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
          // Non-critical
        }

        // Send push notification if user has a token and there are watering needs
        let notificationSent = false;
        if (garden.user.pushToken && summary.totalPlantsToWater > 0) {
          // In production, this would call Firebase Cloud Messaging,
          // Apple Push Notification Service, or a unified service like
          // Capacitor Push Notifications via a server SDK.
          //
          // Example payload that would be sent:
          // {
          //   to: garden.user.pushToken,
          //   title: "Arrosage - GardenSaas",
          //   body: summary.summaryMessage,
          //   data: { gardenId: garden.id, type: 'watering' }
          // }
          //
          // For now, we log it and mark as "would send"
          console.log(
            `[Push] Would notify ${garden.user.name} (${garden.user.email}): ${summary.summaryMessage}`
          );
          notificationSent = true;
        }

        results.push({
          gardenId: garden.id,
          gardenName: garden.name,
          userId: garden.user.id,
          userName: garden.user.name,
          hasPushToken: !!garden.user.pushToken,
          summary,
          notificationSent,
        });
      } catch (err) {
        console.error(
          `Error processing garden ${garden.id}:`,
          err
        );
        // Continue with other gardens
      }
    }

    return NextResponse.json({
      processed: results.length,
      totalGardens: gardens.length,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in watering cron check:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
