import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/garden/history/[year]?gardenId=xxx
// Get a specific year's planting data including plot history
export async function GET(
  request: Request,
  { params }: { params: Promise<{ year: string }> }
) {
  try {
    const { year: yearStr } = await params;
    const year = parseInt(yearStr, 10);

    if (isNaN(year)) {
      return NextResponse.json({ error: 'Invalid year' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const gardenId = searchParams.get('gardenId');

    if (!gardenId) {
      return NextResponse.json({ error: 'gardenId is required' }, { status: 400 });
    }

    const season = await prisma.gardenSeason.findFirst({
      where: { gardenId, year },
      include: {
        plants: true,
        plotHistory: true,
      },
    });

    if (!season) {
      return NextResponse.json(
        { error: `No season found for year ${year}` },
        { status: 404 }
      );
    }

    return NextResponse.json({ season });
  } catch (error) {
    console.error('Error fetching season:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
