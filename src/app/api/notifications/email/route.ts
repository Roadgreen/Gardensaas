import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';
import { getWeatherData, getRecentRainfall, checkFrostAlerts, getWeatherDescription } from '@/lib/weather-calendar';
import { calculateWateringTasks, getWateringSummary } from '@/lib/watering-service';
import type { WeatherContext } from '@/lib/watering-service';
import { getPlantById } from '@/lib/garden-utils';

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not set');
  return new Resend(key);
}

/**
 * POST /api/notifications/email
 *
 * Sends a daily gardening email notification to a specific user.
 * Body: { userId: string }
 *
 * The email includes:
 * - Weather summary for the day
 * - Watering recommendations
 * - Harvest readiness
 * - Frost/heat warnings
 * - Seasonal tips
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Fetch user with gardens and plants
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        gardens: {
          include: {
            gardenPlants: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.email) {
      return NextResponse.json({ error: 'User has no email' }, { status: 400 });
    }

    // Check notification preferences
    if (user.emailNotifications === false) {
      return NextResponse.json({ skipped: true, reason: 'Email notifications disabled' });
    }

    // Find the first garden with coordinates
    const garden = user.gardens.find((g) => g.latitude && g.longitude);
    if (!garden || !garden.latitude || !garden.longitude) {
      return NextResponse.json({ skipped: true, reason: 'No garden with coordinates' });
    }

    if (garden.gardenPlants.length === 0) {
      return NextResponse.json({ skipped: true, reason: 'No plants in garden' });
    }

    // Fetch weather data
    const [weather, rainfall] = await Promise.all([
      getWeatherData(garden.latitude, garden.longitude),
      getRecentRainfall(garden.latitude, garden.longitude),
    ]);

    // Build plants list
    const plantsWithDates = garden.gardenPlants
      .map((gp) => {
        const plant = getPlantById(gp.plantId);
        return plant ? { plant, plantedDate: gp.plantedDate.toISOString() } : null;
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);

    if (plantsWithDates.length === 0) {
      return NextResponse.json({ skipped: true, reason: 'No recognized plants' });
    }

    // Calculate watering needs
    const forecastPrecipitation = weather.daily.length > 1 ? weather.daily[1].precipitation : 0;
    const weatherContext: WeatherContext = {
      temperature: weather.temperature,
      humidity: weather.humidity,
      recentRainfallMm: rainfall.totalMm,
      todayPrecipitation: weather.precipitation,
      forecastPrecipitation,
      weatherCode: weather.weatherCode,
    };

    const tasks = calculateWateringTasks(plantsWithDates, weatherContext, 'fr');
    const summary = getWateringSummary(tasks);

    // Check frost alerts
    const frostAlert = checkFrostAlerts(weather.daily);

    // Calculate harvest readiness
    const now = new Date();
    const harvestReady = plantsWithDates.filter(({ plant, plantedDate }) => {
      if (!plant.harvestDays) return false;
      const planted = new Date(plantedDate);
      const daysSincePlanting = Math.floor((now.getTime() - planted.getTime()) / (1000 * 60 * 60 * 24));
      return daysSincePlanting >= plant.harvestDays;
    });

    const harvestSoon = plantsWithDates.filter(({ plant, plantedDate }) => {
      if (!plant.harvestDays) return false;
      const planted = new Date(plantedDate);
      const daysSincePlanting = Math.floor((now.getTime() - planted.getTime()) / (1000 * 60 * 60 * 24));
      const daysLeft = plant.harvestDays - daysSincePlanting;
      return daysLeft > 0 && daysLeft <= 7;
    });

    // Determine season
    const month = now.getMonth(); // 0-indexed
    let season: string;
    if (month >= 2 && month <= 4) season = 'printemps';
    else if (month >= 5 && month <= 7) season = 'ete';
    else if (month >= 8 && month <= 10) season = 'automne';
    else season = 'hiver';

    // Seasonal tips
    const seasonalTips: Record<string, string[]> = {
      printemps: [
        'Preparez vos semis en interieur pour les tomates et les poivrons.',
        'Pensez a pailler vos parterres pour conserver l\'humidite.',
        'C\'est le moment ideal pour planter les salades et les radis.',
      ],
      ete: [
        'Arrosez de preference le matin ou le soir pour eviter l\'evaporation.',
        'Pincez les gourmands de vos tomates pour favoriser la fructification.',
        'Recoltez regulierement pour stimuler la production.',
      ],
      automne: [
        'Plantez l\'ail et les oignons pour l\'annee prochaine.',
        'Ramassez les feuilles mortes pour enrichir votre compost.',
        'Protegez vos plantes fragiles avant les premieres gelees.',
      ],
      hiver: [
        'Planifiez votre potager pour la prochaine saison.',
        'Entretenez vos outils de jardinage.',
        'Commandez vos graines pour le printemps.',
      ],
    };

    const tip = seasonalTips[season][Math.floor(Math.random() * seasonalTips[season].length)];

    // Build weather description
    const weatherDesc = getWeatherDescription(weather.weatherCode);

    // Determine heat warning
    const isHeatWave = weather.temperatureMax >= 35;
    const isVeryHot = weather.temperatureMax >= 30;

    // Build email HTML
    const userName = user.name || 'Jardinier';
    const gardenCity = garden.city || 'votre region';

    const emailHtml = buildEmailHtml({
      userName,
      gardenCity,
      weather: {
        temp: Math.round(weather.temperature),
        tempMax: Math.round(weather.temperatureMax),
        tempMin: Math.round(weather.temperatureMin),
        description: weatherDesc,
        humidity: Math.round(weather.humidity),
        precipitation: weather.precipitation,
      },
      wateringSummary: summary.summaryMessage,
      totalPlantsToWater: summary.totalPlantsToWater,
      wateringTasks: tasks
        .filter((t) => t.needsWatering)
        .map((t) => ({
          plantName: t.plantName,
          waterMl: t.amountMl || 0,
          reason: t.reason,
        })),
      harvestReady: harvestReady.map(({ plant }) => plant.name?.fr || plant.name?.en || plant.id),
      harvestSoon: harvestSoon.map(({ plant, plantedDate }) => {
        const planted = new Date(plantedDate);
        const daysLeft = (plant.harvestDays || 0) - Math.floor((now.getTime() - planted.getTime()) / (1000 * 60 * 60 * 24));
        return { name: plant.name?.fr || plant.name?.en || plant.id, daysLeft };
      }),
      frostAlert: frostAlert.alert
        ? { date: frostAlert.date || '', tempMin: frostAlert.minTemp || 0 }
        : null,
      isHeatWave,
      isVeryHot,
      seasonalTip: tip,
      season,
      hasGreenhouse: garden.hasGreenhouse || false,
    });

    // Send email via Resend
    const { data, error } = await getResend().emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'GardenSaas <notifications@gardensaas.com>',
      to: user.email,
      subject: `🌱 ${gardenCity} - Votre jardin aujourd'hui (${Math.round(weather.temperature)}°C, ${weatherDesc})`,
      html: emailHtml,
    });

    if (error) {
      console.error(`[Email] Error sending to ${user.email}:`, error);
      return NextResponse.json({ error: 'Failed to send email', details: error }, { status: 500 });
    }

    return NextResponse.json({
      sent: true,
      emailId: data?.id,
      userId: user.id,
      gardenId: garden.id,
      summary: {
        plantsToWater: summary.totalPlantsToWater,
        harvestReady: harvestReady.length,
        frostAlert: frostAlert.alert,
      },
    });
  } catch (error) {
    console.error('Error in email notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ===== Email HTML Builder =====

interface EmailData {
  userName: string;
  gardenCity: string;
  weather: {
    temp: number;
    tempMax: number;
    tempMin: number;
    description: string;
    humidity: number;
    precipitation: number;
  };
  wateringSummary: string;
  totalPlantsToWater: number;
  wateringTasks: Array<{ plantName: string; waterMl: number; reason: string }>;
  harvestReady: string[];
  harvestSoon: Array<{ name: string; daysLeft: number }>;
  frostAlert: { date: string; tempMin: number } | null;
  isHeatWave: boolean;
  isVeryHot: boolean;
  seasonalTip: string;
  season: string;
  hasGreenhouse: boolean;
}

function buildEmailHtml(data: EmailData): string {
  const {
    userName, gardenCity, weather, wateringSummary,
    totalPlantsToWater, wateringTasks, harvestReady, harvestSoon,
    frostAlert, isHeatWave, isVeryHot, seasonalTip, season, hasGreenhouse,
  } = data;

  const seasonEmoji: Record<string, string> = {
    printemps: '🌸', ete: '☀️', automne: '🍂', hiver: '❄️',
  };

  const seasonLabel: Record<string, string> = {
    printemps: 'Printemps', ete: 'Ete', automne: 'Automne', hiver: 'Hiver',
  };

  // Frost alert section
  let alertSection = '';
  if (frostAlert) {
    alertSection = `
      <div style="background: #FEF2F2; border: 2px solid #EF4444; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <h3 style="color: #DC2626; margin: 0 0 8px 0; font-size: 16px;">❄️ Alerte gel !</h3>
        <p style="color: #7F1D1D; margin: 0; font-size: 14px;">
          Gel prevu le <strong>${frostAlert.date}</strong> avec une temperature minimale de <strong>${frostAlert.tempMin}°C</strong>.
        </p>
        <p style="color: #991B1B; margin: 8px 0 0 0; font-size: 13px;">
          ${hasGreenhouse
            ? 'Rentrez vos plantes sensibles dans la serre ou protegez-les avec un voile d\'hivernage.'
            : 'Protegez vos plantes sensibles avec un voile d\'hivernage ou rentrez les pots a l\'interieur.'}
        </p>
      </div>
    `;
  }

  if (isHeatWave) {
    alertSection += `
      <div style="background: #FFF7ED; border: 2px solid #F97316; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <h3 style="color: #C2410C; margin: 0 0 8px 0; font-size: 16px;">🔥 Canicule !</h3>
        <p style="color: #7C2D12; margin: 0; font-size: 14px;">
          Temperature maximale prevue : <strong>${weather.tempMax}°C</strong>. Arrosez abondamment matin et soir.
        </p>
        <p style="color: #9A3412; margin: 8px 0 0 0; font-size: 13px;">
          Paillez genereusement et ombrager les jeunes plants si possible.
        </p>
      </div>
    `;
  } else if (isVeryHot) {
    alertSection += `
      <div style="background: #FFFBEB; border: 2px solid #F59E0B; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <h3 style="color: #B45309; margin: 0 0 8px 0; font-size: 16px;">☀️ Forte chaleur</h3>
        <p style="color: #78350F; margin: 0; font-size: 14px;">
          Il fera jusqu'a <strong>${weather.tempMax}°C</strong> aujourd'hui. Pensez a bien arroser vos plantes.
        </p>
      </div>
    `;
  }

  // Watering section
  let wateringSection = '';
  if (totalPlantsToWater > 0) {
    const taskRows = wateringTasks.slice(0, 10).map((t) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #E5E7EB; font-size: 14px; color: #374151;">${t.plantName}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #E5E7EB; font-size: 14px; color: #374151; text-align: center;">${Math.round(t.waterMl)} mL</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #E5E7EB; font-size: 13px; color: #6B7280;">${t.reason}</td>
      </tr>
    `).join('');

    wateringSection = `
      <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <h3 style="color: #166534; margin: 0 0 12px 0; font-size: 16px;">💧 Arrosage du jour</h3>
        <p style="color: #15803D; margin: 0 0 12px 0; font-size: 14px;">${wateringSummary}</p>
        <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background: #DCFCE7;">
              <th style="padding: 8px 12px; text-align: left; font-size: 12px; color: #166534; font-weight: 600;">Plante</th>
              <th style="padding: 8px 12px; text-align: center; font-size: 12px; color: #166534; font-weight: 600;">Quantite</th>
              <th style="padding: 8px 12px; text-align: left; font-size: 12px; color: #166534; font-weight: 600;">Raison</th>
            </tr>
          </thead>
          <tbody>
            ${taskRows}
          </tbody>
        </table>
      </div>
    `;
  } else {
    wateringSection = `
      <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <h3 style="color: #166534; margin: 0 0 8px 0; font-size: 16px;">💧 Arrosage</h3>
        <p style="color: #15803D; margin: 0; font-size: 14px;">
          Pas besoin d'arroser aujourd'hui ! La meteo s'en charge. 🌧️
        </p>
      </div>
    `;
  }

  // Harvest section
  let harvestSection = '';
  if (harvestReady.length > 0 || harvestSoon.length > 0) {
    let harvestContent = '';
    if (harvestReady.length > 0) {
      harvestContent += `
        <p style="color: #166534; margin: 0 0 8px 0; font-size: 14px;">
          <strong>🎉 Pret a recolter :</strong> ${harvestReady.join(', ')}
        </p>
      `;
    }
    if (harvestSoon.length > 0) {
      const soonList = harvestSoon.map((h) => `${h.name} (${h.daysLeft}j)`).join(', ');
      harvestContent += `
        <p style="color: #15803D; margin: 0; font-size: 14px;">
          <strong>⏳ Bientot pret :</strong> ${soonList}
        </p>
      `;
    }
    harvestSection = `
      <div style="background: #FEFCE8; border: 1px solid #FDE68A; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <h3 style="color: #854D0E; margin: 0 0 12px 0; font-size: 16px;">🌾 Recoltes</h3>
        ${harvestContent}
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background: #F9FAFB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #166534, #15803D); border-radius: 16px; padding: 24px; margin-bottom: 20px; text-align: center;">
          <h1 style="color: white; margin: 0 0 4px 0; font-size: 24px;">🌱 GardenSaas</h1>
          <p style="color: #BBF7D0; margin: 0; font-size: 14px;">
            ${seasonEmoji[season] || '🌿'} ${seasonLabel[season] || ''} - ${gardenCity}
          </p>
        </div>

        <!-- Greeting -->
        <div style="background: white; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #E5E7EB;">
          <p style="color: #374151; margin: 0; font-size: 16px;">
            Bonjour <strong>${userName}</strong> ! 👋
          </p>
          <p style="color: #6B7280; margin: 8px 0 0 0; font-size: 14px;">
            Voici votre resume jardinage du jour pour <strong>${gardenCity}</strong>.
          </p>
        </div>

        <!-- Weather card -->
        <div style="background: linear-gradient(135deg, #1E3A5F, #1E40AF); border-radius: 12px; padding: 20px; margin-bottom: 20px; color: white;">
          <h3 style="margin: 0 0 12px 0; font-size: 16px;">🌤️ Meteo du jour</h3>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 32px; font-weight: bold;">${weather.temp}°C</div>
              <div style="font-size: 14px; opacity: 0.8;">${weather.description}</div>
            </div>
            <div style="text-align: right; font-size: 13px; opacity: 0.8;">
              <div>Max: ${weather.tempMax}°C / Min: ${weather.tempMin}°C</div>
              <div>Humidite: ${weather.humidity}%</div>
              ${weather.precipitation > 0 ? `<div>Pluie: ${weather.precipitation}mm</div>` : ''}
            </div>
          </div>
        </div>

        <!-- Alerts -->
        ${alertSection}

        <!-- Watering -->
        ${wateringSection}

        <!-- Harvest -->
        ${harvestSection}

        <!-- Seasonal tip -->
        <div style="background: #FFF7ED; border: 1px solid #FED7AA; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
          <h3 style="color: #9A3412; margin: 0 0 8px 0; font-size: 16px;">💡 Conseil du jour</h3>
          <p style="color: #7C2D12; margin: 0; font-size: 14px;">${seasonalTip}</p>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #E5E7EB;">
          <p style="color: #9CA3AF; font-size: 12px; margin: 0 0 8px 0;">
            Bon jardinage ! 🌻
          </p>
          <p style="color: #D1D5DB; font-size: 11px; margin: 0;">
            GardenSaas - Votre assistant jardin intelligent
          </p>
          <p style="color: #D1D5DB; font-size: 11px; margin: 8px 0 0 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://gardensaas.com'}/settings" style="color: #9CA3AF;">
              Gerer mes notifications
            </a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
