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
    const { length, width, soilType, climateZone, sunExposure } = body;

    if (!length || !width || !soilType || !climateZone || !sunExposure) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    return NextResponse.json({
      message: 'Garden created successfully',
      garden: {
        id: crypto.randomUUID(),
        ...body,
        createdAt: new Date().toISOString(),
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
