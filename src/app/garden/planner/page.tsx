import type { Metadata } from 'next';
import { GardenPlanner } from '@/components/garden/garden-planner';

export const metadata: Metadata = {
  title: 'Garden Planner',
  description: 'Plan your garden layout with an interactive 2D grid. Place plants, check spacing, and validate companion planting.',
};

export default function PlannerPage() {
  return <GardenPlanner />;
}
