import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { TipsPageClient } from '@/components/garden/tips-page-client';

const SITE_URL = 'https://gardensaas.vercel.app';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const isFr = locale === 'fr';

  const title = isFr
    ? 'Conseils jardin et guide bio-intensif'
    : 'Garden Tips & Bio-Intensive Guide';
  const description = isFr
    ? 'Conseils de jardinage mensuels, guide des associations de plantes, plans de rotation des cultures, recettes anti-parasites naturelles et techniques bio-intensives.'
    : 'Monthly gardening tips, companion planting guide, crop rotation plans, natural pest control recipes, and bio-intensive techniques for organic growers.';

  return {
    title,
    description,
    keywords: isFr
      ? [
          'conseils jardinage mois par mois',
          'association plantes compagnes',
          'rotation cultures potager',
          'lutte biologique ravageurs',
          'jardinage bio-intensif',
          'permaculture potager',
        ]
      : [
          'gardening tips monthly',
          'companion planting guide',
          'crop rotation plan',
          'natural pest control',
          'bio-intensive gardening',
          'organic garden tips',
        ],
    openGraph: {
      title: isFr
        ? 'Conseils jardin et guide bio-intensif | GardenSaas'
        : 'Garden Tips & Bio-Intensive Guide | GardenSaas',
      description: isFr
        ? 'Conseils mensuels, associations de plantes, rotation des cultures et lutte naturelle contre les ravageurs.'
        : 'Monthly gardening tips, companion planting, crop rotation, and natural pest control for organic growers.',
      url: `${SITE_URL}/garden/tips`,
      type: 'article',
      siteName: 'GardenSaas',
    },
    twitter: {
      card: 'summary',
      title: isFr
        ? 'Conseils jardin et guide bio-intensif | GardenSaas'
        : 'Garden Tips & Bio-Intensive Guide | GardenSaas',
      description: isFr
        ? 'Conseils mensuels, associations de plantes, rotation des cultures et recettes anti-parasites naturelles.'
        : 'Monthly gardening tips, companion planting, crop rotation, and natural pest control recipes.',
    },
    alternates: {
      canonical: `${SITE_URL}/garden/tips`,
    },
  };
}

function buildJsonLd(locale: string) {
  const isFr = locale === 'fr';
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${SITE_URL}/garden/tips#article`,
        headline: isFr
          ? 'Conseils jardin et guide de culture bio-intensif'
          : 'Garden Tips & Bio-Intensive Growing Guide',
        description: isFr
          ? 'Conseils de jardinage mensuels, guide des associations de plantes, plans de rotation des cultures, recettes anti-parasites naturelles et techniques bio-intensives.'
          : 'Monthly gardening tips, companion planting guide, crop rotation plans, natural pest control recipes, and bio-intensive techniques.',
        url: `${SITE_URL}/garden/tips`,
        inLanguage: isFr ? 'fr' : 'en',
        publisher: {
          '@type': 'Organization',
          name: 'GardenSaas',
          url: SITE_URL,
        },
        about: isFr
          ? [
              { '@type': 'Thing', name: 'Associations de plantes' },
              { '@type': 'Thing', name: 'Rotation des cultures' },
              { '@type': 'Thing', name: 'Lutte biologique' },
              { '@type': 'Thing', name: 'Jardinage bio-intensif' },
            ]
          : [
              { '@type': 'Thing', name: 'Companion Planting' },
              { '@type': 'Thing', name: 'Crop Rotation' },
              { '@type': 'Thing', name: 'Organic Pest Control' },
              { '@type': 'Thing', name: 'Bio-Intensive Gardening' },
            ],
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${SITE_URL}/garden/tips#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'GardenSaas',
            item: SITE_URL,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: isFr ? 'Conseils jardin' : 'Garden Tips',
          },
        ],
      },
    ],
  };
}

export default async function TipsPage() {
  const locale = await getLocale();
  const jsonLd = buildJsonLd(locale);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TipsPageClient />
    </>
  );
}
