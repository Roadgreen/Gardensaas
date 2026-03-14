import type { Metadata } from 'next';
import { AdvisorPageClient } from '@/components/garden/advisor-page-client';

export const metadata: Metadata = {
  title: 'AI Garden Advisor',
  description: 'Get personalized gardening advice from your AI garden advisor. Ask about planting, soil, pests, and more.',
};

export default function AdvisorPage() {
  return <AdvisorPageClient />;
}
