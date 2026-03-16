import { NextResponse } from 'next/server';
import { getGardenPlantingPlan, getSeasonalQuickPicks } from '@/lib/smart-planting';
import type { SoilType, ClimateZone, SunExposure } from '@/types';

// GET /api/garden/suggestions?soilType=loamy&climateZone=temperate&sunExposure=full-sun
// Optional: zones (JSON), beds (JSON), existingPlants (comma-separated IDs)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const soilType = (searchParams.get('soilType') || 'loamy') as SoilType;
    const climateZone = (searchParams.get('climateZone') || 'temperate') as ClimateZone;
    const sunExposure = (searchParams.get('sunExposure') || 'full-sun') as SunExposure;
    const existingPlants = searchParams.get('existingPlants')?.split(',').filter(Boolean) || [];
    const zonesJson = searchParams.get('zones');
    const bedsJson = searchParams.get('beds');

    const zones = zonesJson ? JSON.parse(zonesJson) : [];
    const beds = bedsJson ? JSON.parse(bedsJson) : [];

    if (zones.length > 0 || beds.length > 0) {
      const plans = getGardenPlantingPlan(
        zones,
        beds,
        climateZone,
        sunExposure,
        existingPlants
      );
      return NextResponse.json({ plans });
    }

    // Fallback: seasonal quick picks
    const picks = getSeasonalQuickPicks(climateZone, soilType, sunExposure, 12);
    return NextResponse.json({ picks });
  } catch (error) {
    console.error('Error generating planting suggestions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
