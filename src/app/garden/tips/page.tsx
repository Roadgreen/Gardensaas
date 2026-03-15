import type { Metadata } from 'next';
import { TipsPageClient } from '@/components/garden/tips-page-client';

export const metadata: Metadata = {
  title: 'Garden Tips & Bio-Intensive Guide',
  description: 'Monthly gardening tips, companion planting guide, crop rotation plans, natural pest control recipes, and bio-intensive techniques.',
};

export default function TipsPage() {
  return <TipsPageClient />;
}
