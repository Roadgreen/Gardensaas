import { NextResponse } from 'next/server';

// Placeholder garden API - would use Prisma + auth session in production

export async function GET() {
  return NextResponse.json({
    gardens: [],
    message: 'Garden data would be fetched from database with user authentication.',
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { length, width, soilType, climateZone, sunExposure, latitude, longitude, city } = body;

    if (!length || !width || !soilType || !climateZone || !sunExposure) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate GPS coordinates if provided
    if (latitude !== undefined && (latitude < -90 || latitude > 90)) {
      return NextResponse.json({ error: 'Invalid latitude' }, { status: 400 });
    }
    if (longitude !== undefined && (longitude < -180 || longitude > 180)) {
      return NextResponse.json({ error: 'Invalid longitude' }, { status: 400 });
    }

    return NextResponse.json({
      message: 'Garden created successfully',
      garden: {
        id: crypto.randomUUID(),
        length,
        width,
        soilType,
        climateZone,
        sunExposure,
        latitude: latitude || null,
        longitude: longitude || null,
        city: city || null,
        createdAt: new Date().toISOString(),
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
