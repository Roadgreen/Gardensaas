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
 * calculates watering needs, sends email notifications via the
 * /api/notifications/email endpoint, and prepares push notifications.
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
            emailNotifications: true,
            notificationFrequency: true,
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
      emailSent: boolean;
      emailSkipReason?: string;
    }> = [];

    // Determine if today should trigger weekly notifications (Monday)
    const today = new Date();
    const isMonday = today.getDay() === 1;

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
          console.log(
            `[Push] Would notify ${garden.user.name} (${garden.user.email}): ${summary.summaryMessage}`
          );
          notificationSent = true;
        }

        // Send email notification
        let emailSent = false;
        let emailSkipReason: string | undefined;

        const userFrequency = garden.user.notificationFrequency || 'daily';
        const userEmailEnabled = garden.user.emailNotifications !== false;

        if (!userEmailEnabled) {
          emailSkipReason = 'Email notifications disabled by user';
        } else if (userFrequency === 'never') {
          emailSkipReason = 'Notification frequency set to never';
        } else if (userFrequency === 'weekly' && !isMonday) {
          emailSkipReason = 'Weekly notifications: not Monday';
        } else {
          // Send email notification via internal API
          try {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
              ? `https://${process.env.VERCEL_URL}`
              : 'http://localhost:3000';

            const emailRes = await fetch(`${baseUrl}/api/notifications/email`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: garden.user.id }),
            });

            const emailResult = await emailRes.json();

            if (emailRes.ok && emailResult.sent) {
              emailSent = true;
              console.log(
                `[Email] Sent daily update to ${garden.user.name} (${garden.user.email})`
              );
            } else if (emailResult.skipped) {
              emailSkipReason = emailResult.reason;
            } else {
              emailSkipReason = `Email API error: ${emailResult.error || 'unknown'}`;
              console.error(
                `[Email] Failed for ${garden.user.email}:`,
                emailResult.error
              );
            }
          } catch (emailErr) {
            emailSkipReason = `Email send error: ${emailErr instanceof Error ? emailErr.message : 'unknown'}`;
            console.error(
              `[Email] Exception for ${garden.user.email}:`,
              emailErr
            );
          }
        }

        results.push({
          gardenId: garden.id,
          gardenName: garden.name,
          userId: garden.user.id,
          userName: garden.user.name,
          hasPushToken: !!garden.user.pushToken,
          summary,
          notificationSent,
          emailSent,
          emailSkipReason,
        });
      } catch (err) {
        console.error(
          `Error processing garden ${garden.id}:`,
          err
        );
        // Continue with other gardens
      }
    }

    const emailsSent = results.filter((r) => r.emailSent).length;
    const emailsSkipped = results.filter((r) => !r.emailSent).length;

    return NextResponse.json({
      processed: results.length,
      totalGardens: gardens.length,
      emailsSent,
      emailsSkipped,
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
