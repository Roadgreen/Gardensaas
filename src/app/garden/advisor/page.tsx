import type { Metadata } from 'next';
import { AdvisorPageClient } from '@/components/garden/advisor-page-client';

export const metadata: Metadata = {
  title: 'AI Garden Advisor - Personalized Growing Help',
  description:
    'Get personalized gardening advice from your AI garden advisor. Ask about planting schedules, soil preparation, pest control, companion planting, and more.',
  keywords: [
    'AI garden advisor',
    'gardening chatbot',
    'plant care advice',
    'pest control tips',
    'gardening help AI',
  ],
  openGraph: {
    title: 'AI Garden Advisor | GardenSaas',
    description:
      'Ask your AI garden advisor about planting, soil, pests, and get personalized growing recommendations.',
    url: 'https://gardensaas.vercel.app/garden/advisor',
    type: 'website',
    siteName: 'GardenSaas',
  },
  twitter: {
    card: 'summary',
    title: 'AI Garden Advisor | GardenSaas',
    description:
      'Personalized gardening advice powered by AI. Ask about planting, soil, pests, and more.',
  },
  alternates: {
    canonical: 'https://gardensaas.vercel.app/garden/advisor',
  },
};

export default function AdvisorPage() {
  return <AdvisorPageClient />;
}
