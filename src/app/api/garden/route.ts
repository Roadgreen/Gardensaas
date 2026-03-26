import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { GardenConfig, PlantedItem, RaisedBed, GardenZone } from '@/types';

// GET /api/garden — Load garden for authenticated user
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Find existing garden or return null
    let garden = await prisma.garden.findFirst({
      where: { userId },
      include: {
        gardenPlants: true,
        raisedBeds: true,
        gardenZones: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (!garden) {
      return NextResponse.json({ garden: null });
    }

    // Transform DB records to GardenConfig format
    const config: GardenConfig = {
      length: garden.length,
      width: garden.width,
      soilType: garden.soilType as GardenConfig['soilType'],
      climateZone: garden.climateZone as GardenConfig['climateZone'],
      sunExposure: garden.sunExposure as GardenConfig['sunExposure'],
      latitude: garden.latitude ?? undefined,
      longitude: garden.longitude ?? undefined,
      city: garden.city ?? undefined,
      hasGreenhouse: garden.hasGreenhouse,
      hasRaisedBeds: garden.hasRaisedBeds,
      gardenType: garden.gardenType as GardenConfig['gardenType'],
      setupCompleted: garden.setupCompleted,
      onboardingStep: (garden.onboardingStep as GardenConfig['onboardingStep']) ?? undefined,
      plantedItems: garden.gardenPlants.map((gp): PlantedItem => ({
        plantId: gp.plantId,
        x: gp.x,
        z: gp.z,
        plantedDate: gp.plantedDate.toISOString(),
        ...(gp.raisedBedId ? { raisedBedId: gp.raisedBedId } : {}),
        ...(gp.varietyId ? { varietyId: gp.varietyId } : {}),
        ...(gp.zoneId ? { zoneId: gp.zoneId } : {}),
      })),
      raisedBeds: garden.raisedBeds.map((rb): RaisedBed => ({
        id: rb.id,
        name: rb.name,
        x: rb.x,
        z: rb.z,
        widthM: rb.widthM,
        lengthM: rb.lengthM,
        heightM: rb.heightM,
        soilType: rb.soilType as RaisedBed['soilType'],
      })),
      zones: garden.gardenZones.map((gz): GardenZone => ({
        id: gz.id,
        name: gz.name,
        x: gz.x,
        z: gz.z,
        widthM: gz.widthM,
        lengthM: gz.lengthM,
        soilType: gz.soilType as GardenZone['soilType'],
        sunExposure: gz.sunExposure as GardenZone['sunExposure'],
        zoneType: gz.zoneType as GardenZone['zoneType'],
        color: gz.color,
      })),
    };

    return NextResponse.json({ garden: config });
  } catch (error) {
    console.error('GET /api/garden error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/garden — Save full garden state
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = (await request.json()) as GardenConfig;

    if (!body.length || !body.width || !body.soilType || !body.climateZone || !body.sunExposure) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find existing garden
    const existing = await prisma.garden.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    const gardenData = {
      length: body.length,
      width: body.width,
      soilType: body.soilType,
      climateZone: body.climateZone,
      sunExposure: body.sunExposure,
      latitude: body.latitude ?? null,
      longitude: body.longitude ?? null,
      city: body.city ?? null,
      hasGreenhouse: body.hasGreenhouse ?? false,
      hasRaisedBeds: body.hasRaisedBeds ?? false,
      gardenType: body.gardenType ?? 'outdoor',
      setupCompleted: body.setupCompleted ?? false,
      onboardingStep: body.onboardingStep ?? null,
    };

    let gardenId: string;

    if (existing) {
      await prisma.garden.update({
        where: { id: existing.id },
        data: gardenData,
      });
      gardenId = existing.id;
    } else {
      const created = await prisma.garden.create({
        data: {
          ...gardenData,
          userId,
        },
      });
      gardenId = created.id;
    }

    // Sync planted items: delete all, then re-create
    await prisma.gardenPlant.deleteMany({ where: { gardenId } });
    if (body.plantedItems?.length) {
      await prisma.gardenPlant.createMany({
        data: body.plantedItems.map((item) => ({
          gardenId,
          plantId: item.plantId,
          x: item.x,
          z: item.z,
          plantedDate: new Date(item.plantedDate),
          raisedBedId: item.raisedBedId ?? null,
          varietyId: item.varietyId ?? null,
          zoneId: item.zoneId ?? null,
        })),
      });
    }

    // Sync raised beds: delete all, then re-create
    await prisma.gardenRaisedBed.deleteMany({ where: { gardenId } });
    if (body.raisedBeds?.length) {
      await prisma.gardenRaisedBed.createMany({
        data: body.raisedBeds.map((bed) => ({
          gardenId,
          name: bed.name,
          x: bed.x,
          z: bed.z,
          widthM: bed.widthM,
          lengthM: bed.lengthM,
          heightM: bed.heightM,
          soilType: bed.soilType,
        })),
      });
    }

    // Sync zones: delete all, then re-create
    await prisma.gardenZone.deleteMany({ where: { gardenId } });
    if (body.zones?.length) {
      await prisma.gardenZone.createMany({
        data: body.zones.map((zone) => ({
          gardenId,
          name: zone.name,
          x: zone.x,
          z: zone.z,
          widthM: zone.widthM,
          lengthM: zone.lengthM,
          soilType: zone.soilType,
          sunExposure: zone.sunExposure,
          zoneType: zone.zoneType,
          color: zone.color,
        })),
      });
    }

    return NextResponse.json({ success: true, gardenId });
  } catch (error) {
    console.error('POST /api/garden error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/garden — Partial update (e.g., just plantedItems)
export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();

    const existing = await prisma.garden.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    if (!existing) {
      return NextResponse.json({ error: 'No garden found. Use POST to create.' }, { status: 404 });
    }

    const gardenId = existing.id;

    // Update garden fields if provided
    const gardenUpdate: Record<string, unknown> = {};
    if (body.length !== undefined) gardenUpdate.length = body.length;
    if (body.width !== undefined) gardenUpdate.width = body.width;
    if (body.soilType !== undefined) gardenUpdate.soilType = body.soilType;
    if (body.climateZone !== undefined) gardenUpdate.climateZone = body.climateZone;
    if (body.sunExposure !== undefined) gardenUpdate.sunExposure = body.sunExposure;
    if (body.latitude !== undefined) gardenUpdate.latitude = body.latitude;
    if (body.longitude !== undefined) gardenUpdate.longitude = body.longitude;
    if (body.city !== undefined) gardenUpdate.city = body.city;
    if (body.hasGreenhouse !== undefined) gardenUpdate.hasGreenhouse = body.hasGreenhouse;
    if (body.hasRaisedBeds !== undefined) gardenUpdate.hasRaisedBeds = body.hasRaisedBeds;
    if (body.gardenType !== undefined) gardenUpdate.gardenType = body.gardenType;
    if (body.setupCompleted !== undefined) gardenUpdate.setupCompleted = body.setupCompleted;
    if (body.onboardingStep !== undefined) gardenUpdate.onboardingStep = body.onboardingStep;

    if (Object.keys(gardenUpdate).length > 0) {
      await prisma.garden.update({
        where: { id: gardenId },
        data: gardenUpdate,
      });
    }

    // Sync planted items if provided
    if (body.plantedItems !== undefined) {
      await prisma.gardenPlant.deleteMany({ where: { gardenId } });
      if (body.plantedItems.length) {
        await prisma.gardenPlant.createMany({
          data: body.plantedItems.map((item: PlantedItem) => ({
            gardenId,
            plantId: item.plantId,
            x: item.x,
            z: item.z,
            plantedDate: new Date(item.plantedDate),
            raisedBedId: item.raisedBedId ?? null,
            varietyId: item.varietyId ?? null,
            zoneId: item.zoneId ?? null,
          })),
        });
      }
    }

    // Sync raised beds if provided
    if (body.raisedBeds !== undefined) {
      await prisma.gardenRaisedBed.deleteMany({ where: { gardenId } });
      if (body.raisedBeds.length) {
        await prisma.gardenRaisedBed.createMany({
          data: body.raisedBeds.map((bed: RaisedBed) => ({
            gardenId,
            name: bed.name,
            x: bed.x,
            z: bed.z,
            widthM: bed.widthM,
            lengthM: bed.lengthM,
            heightM: bed.heightM,
            soilType: bed.soilType,
          })),
        });
      }
    }

    // Sync zones if provided
    if (body.zones !== undefined) {
      await prisma.gardenZone.deleteMany({ where: { gardenId } });
      if (body.zones.length) {
        await prisma.gardenZone.createMany({
          data: body.zones.map((zone: GardenZone) => ({
            gardenId,
            name: zone.name,
            x: zone.x,
            z: zone.z,
            widthM: zone.widthM,
            lengthM: zone.lengthM,
            soilType: zone.soilType,
            sunExposure: zone.sunExposure,
            zoneType: zone.zoneType,
            color: zone.color,
          })),
        });
      }
    }

    return NextResponse.json({ success: true, gardenId });
  } catch (error) {
    console.error('PUT /api/garden error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
