import { NextResponse } from 'next/server';
import { getAllPlants } from '@/lib/garden-utils';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const difficulty = searchParams.get('difficulty');
  const season = searchParams.get('season');

  let plants = getAllPlants();

  if (category && category !== 'all') {
    plants = plants.filter((p) => p.category === category);
  }
  if (difficulty && difficulty !== 'all') {
    plants = plants.filter((p) => p.difficulty === difficulty);
  }
  if (season) {
    const seasonMonths: Record<string, number[]> = {
      spring: [3, 4, 5],
      summer: [6, 7, 8],
      autumn: [9, 10, 11],
      winter: [12, 1, 2],
    };
    const months = seasonMonths[season];
    if (months) {
      plants = plants.filter((p) => p.plantingMonths.some((m) => months.includes(m)));
    }
  }

  return NextResponse.json({ plants, total: plants.length });
}
