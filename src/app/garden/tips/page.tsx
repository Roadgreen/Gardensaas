import type { Metadata } from 'next';
import { TipsPageClient } from '@/components/garden/tips-page-client';

export const metadata: Metadata = {
  title: 'Garden Tips & Bio-Intensive Guide',
  description:
    'Monthly gardening tips, companion planting guide, crop rotation plans, natural pest control recipes, and bio-intensive techniques for organic growers.',
  keywords: [
    'gardening tips monthly',
    'companion planting guide',
    'crop rotation plan',
    'natural pest control',
    'bio-intensive gardening',
    'organic garden tips',
  ],
  openGraph: {
    title: 'Garden Tips & Bio-Intensive Guide | GardenSaas',
    description:
      'Monthly gardening tips, companion planting, crop rotation, and natural pest control for organic growers.',
    url: 'https://gardensaas.vercel.app/garden/tips',
    type: 'article',
    siteName: 'GardenSaas',
  },
  twitter: {
    card: 'summary',
    title: 'Garden Tips & Bio-Intensive Guide | GardenSaas',
    description:
      'Monthly gardening tips, companion planting, crop rotation, and natural pest control recipes.',
  },
  alternates: {
    canonical: 'https://gardensaas.vercel.app/garden/tips',
  },
};

const tipsJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  '@id': 'https://gardensaas.vercel.app/garden/tips#article',
  headline: 'Garden Tips & Bio-Intensive Growing Guide',
  description:
    'Monthly gardening tips, companion planting guide, crop rotation plans, natural pest control recipes, and bio-intensive techniques.',
  url: 'https://gardensaas.vercel.app/garden/tips',
  publisher: {
    '@type': 'Organization',
    name: 'GardenSaas',
    url: 'https://gardensaas.vercel.app',
  },
  about: [
    { '@type': 'Thing', name: 'Companion Planting' },
    { '@type': 'Thing', name: 'Crop Rotation' },
    { '@type': 'Thing', name: 'Organic Pest Control' },
    { '@type': 'Thing', name: 'Bio-Intensive Gardening' },
  ],
};

export default function TipsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(tipsJsonLd) }}
      />
      <TipsPageClient />
    </>
  );
}
