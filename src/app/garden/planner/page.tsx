import type { Metadata } from 'next';
import { GardenPlanner } from '@/components/garden/garden-planner';

export const metadata: Metadata = {
  title: 'Garden Planner - Interactive Layout Designer',
  description:
    'Plan your garden layout with an interactive 2D grid. Place plants, check spacing, and validate companion planting automatically.',
  keywords: [
    'garden layout planner',
    'interactive garden grid',
    'plant spacing tool',
    'companion planting checker',
    'vegetable garden layout',
  ],
  openGraph: {
    title: 'Garden Planner - Interactive Layout Designer | GardenSaas',
    description:
      'Drag-and-drop garden planner with spacing validation, companion planting checks, and smart plant recommendations.',
    url: 'https://gardensaas.vercel.app/garden/planner',
    type: 'website',
    siteName: 'GardenSaas',
  },
  twitter: {
    card: 'summary',
    title: 'Garden Planner | GardenSaas',
    description:
      'Drag-and-drop garden planner with spacing validation and companion planting checks.',
  },
  alternates: {
    canonical: 'https://gardensaas.vercel.app/garden/planner',
  },
};

export default function PlannerPage() {
  return <GardenPlanner />;
}
