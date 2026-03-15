import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAllPlants } from '@/lib/garden-utils';
import {
  checkRotation,
  suggestNextPlants,
  getSpotHistory,
  getGreenManureSuggestions,
  validateCompanionPlanting,
  type SeasonHistory,
} from '@/lib/crop-rotation';

// GET /api/garden/rotation?gardenId=xxx&x=1.5&z=2.0
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gardenId = searchParams.get('gardenId');
    const x = parseFloat(searchParams.get('x') || '0');
    const z = parseFloat(searchParams.get('z') || '0');
    const plantId = searchParams.get('plantId'); // optional: check specific plant

    if (!gardenId) {
      return NextResponse.json({ error: 'gardenId is required' }, { status: 400 });
    }

    // Fetch all seasons for this garden
    const seasons = await prisma.gardenSeason.findMany({
      where: { gardenId },
      include: { plants: true },
    });

    // Build history from season data
    const history: SeasonHistory[] = [];
    for (const season of seasons) {
      for (const plant of season.plants) {
        history.push({
          year: season.year,
          plantId: plant.plantId,
          x: plant.x,
          z: plant.z,
        });
      }
    }

    const currentYear = new Date().getFullYear();
    const allPlants = getAllPlants();

    // Get spot history
    const spotHistory = getSpotHistory(x, z, history);

    // If a specific plantId is provided, check rotation for it
    let rotationCheck = null;
    if (plantId) {
      rotationCheck = checkRotation(plantId, x, z, history, currentYear);
    }

    // Get suggestions for this spot
    const suggestions = suggestNextPlants(x, z, history, currentYear, allPlants);

    // Get green manure suggestions if there's recent history
    let greenManure: string[] = [];
    if (spotHistory.length > 0) {
      greenManure = getGreenManureSuggestions(spotHistory[0].plantId);
    }

    // Validate companion planting for current season plants
    const currentSeasonPlants = seasons
      .filter((s) => s.year === currentYear)
      .flatMap((s) => s.plants.map((p) => ({ plantId: p.plantId, x: p.x, z: p.z })));
    const companionValidation = validateCompanionPlanting(currentSeasonPlants);

    return NextResponse.json({
      spotHistory,
      rotationCheck,
      suggestions: {
        best: suggestions.best.map((p) => ({ id: p.id, name: p.name.en })),
        acceptable: suggestions.acceptable.map((p) => ({ id: p.id, name: p.name.en })),
        avoid: suggestions.avoid.map((p) => ({ id: p.id, name: p.name.en })),
      },
      greenManure,
      companionPlanting: companionValidation,
    });
  } catch (error) {
    console.error('Error getting rotation data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
