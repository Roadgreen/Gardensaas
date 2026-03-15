import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/garden/history?gardenId=xxx
// Lists all seasons for a garden, with plant counts
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gardenId = searchParams.get('gardenId');

    if (!gardenId) {
      return NextResponse.json({ error: 'gardenId is required' }, { status: 400 });
    }

    const seasons = await prisma.gardenSeason.findMany({
      where: { gardenId },
      include: {
        plants: true,
        plotHistory: true,
      },
      orderBy: { year: 'desc' },
    });

    return NextResponse.json({ seasons });
  } catch (error) {
    console.error('Error fetching garden history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/garden/history
// Create a new season, optionally snapshotting current garden plants as history
// Body: { gardenId, year, notes?, snapshotCurrentGarden?: boolean }
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { gardenId, year, notes, snapshotCurrentGarden } = body;

    if (!gardenId || !year) {
      return NextResponse.json(
        { error: 'gardenId and year are required' },
        { status: 400 }
      );
    }

    // Check if season already exists
    const existing = await prisma.gardenSeason.findFirst({
      where: { gardenId, year },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Season ${year} already exists for this garden` },
        { status: 409 }
      );
    }

    // If snapshotting, get current garden plants
    let plotHistoryData: {
      plotName: string;
      plantId: string;
      plantName: string;
      x: number;
      z: number;
      plantedDate: Date | null;
    }[] = [];

    if (snapshotCurrentGarden) {
      const gardenPlants = await prisma.gardenPlant.findMany({
        where: { gardenId },
      });

      plotHistoryData = gardenPlants.map((gp, index) => ({
        plotName: `Plot ${index + 1}`,
        plantId: gp.plantId,
        plantName: gp.plantId, // will be resolved on the client side
        x: gp.x,
        z: gp.z,
        plantedDate: gp.plantedDate,
      }));
    }

    const season = await prisma.gardenSeason.create({
      data: {
        gardenId,
        year,
        notes,
        plotHistory: plotHistoryData.length > 0
          ? { create: plotHistoryData }
          : undefined,
      },
      include: {
        plants: true,
        plotHistory: true,
      },
    });

    return NextResponse.json({ season }, { status: 201 });
  } catch (error) {
    console.error('Error creating season:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
