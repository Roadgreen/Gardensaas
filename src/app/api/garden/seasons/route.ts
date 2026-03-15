import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/garden/seasons?gardenId=xxx
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gardenId = searchParams.get('gardenId');

    if (!gardenId) {
      return NextResponse.json({ error: 'gardenId is required' }, { status: 400 });
    }

    const seasons = await prisma.gardenSeason.findMany({
      where: { gardenId },
      include: { plants: true },
      orderBy: { year: 'desc' },
    });

    return NextResponse.json({ seasons });
  } catch (error) {
    console.error('Error fetching seasons:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/garden/seasons
// Body: { gardenId, year, notes?, plants?: [{ plantId, x, z, plantedDate?, notes?, health? }] }
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { gardenId, year, notes, plants } = body;

    if (!gardenId || !year) {
      return NextResponse.json(
        { error: 'gardenId and year are required' },
        { status: 400 }
      );
    }

    // Check if season already exists for this garden/year
    const existing = await prisma.gardenSeason.findFirst({
      where: { gardenId, year },
    });

    if (existing) {
      // Update existing season
      const updated = await prisma.gardenSeason.update({
        where: { id: existing.id },
        data: {
          notes,
          plants: plants
            ? {
                deleteMany: {},
                create: plants.map((p: {
                  plantId: string;
                  x: number;
                  z: number;
                  plantedDate?: string;
                  harvestedDate?: string;
                  yield?: number;
                  notes?: string;
                  health?: string;
                }) => ({
                  plantId: p.plantId,
                  x: p.x,
                  z: p.z,
                  plantedDate: p.plantedDate ? new Date(p.plantedDate) : null,
                  harvestedDate: p.harvestedDate ? new Date(p.harvestedDate) : null,
                  yield: p.yield,
                  notes: p.notes,
                  health: p.health,
                })),
              }
            : undefined,
        },
        include: { plants: true },
      });

      return NextResponse.json({ season: updated });
    }

    // Create new season
    const season = await prisma.gardenSeason.create({
      data: {
        gardenId,
        year,
        notes,
        plants: plants
          ? {
              create: plants.map((p: {
                plantId: string;
                x: number;
                z: number;
                plantedDate?: string;
                harvestedDate?: string;
                yield?: number;
                notes?: string;
                health?: string;
              }) => ({
                plantId: p.plantId,
                x: p.x,
                z: p.z,
                plantedDate: p.plantedDate ? new Date(p.plantedDate) : null,
                harvestedDate: p.harvestedDate ? new Date(p.harvestedDate) : null,
                yield: p.yield,
                notes: p.notes,
                health: p.health,
              })),
            }
          : undefined,
      },
      include: { plants: true },
    });

    return NextResponse.json({ season }, { status: 201 });
  } catch (error) {
    console.error('Error creating season:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
