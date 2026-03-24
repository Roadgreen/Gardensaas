import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';

const SITE_URL = 'https://gardensaas.vercel.app';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const isFr = locale === 'fr';

  const title = isFr
    ? 'Encyclopédie des plantes — Guides de culture légumes et aromates'
    : 'Plant Encyclopedia - Vegetable & Herb Growing Guides';
  const description = isFr
    ? 'Parcourez plus de 300 légumes, herbes aromatiques et fruits avec des guides de culture détaillés. Calendrier de plantation, espacement, associations de plantes et récolte.'
    : 'Browse 300+ vegetables, herbs, and fruits with detailed growing guides. Find planting dates, spacing requirements, companion plants, and harvest times.';

  return {
    title,
    description,
    keywords: isFr
      ? [
          'guide culture légumes',
          'encyclopédie plantes potager',
          'quand planter légumes',
          'association plantes potager',
          'espacement plantation',
          'calendrier semis',
          'herbes aromatiques culture',
        ]
      : [
          'vegetable growing guide',
          'plant encyclopedia',
          'herb growing tips',
          'companion planting chart',
          'when to plant vegetables',
          'vegetable spacing guide',
          'harvest time calculator',
        ],
    openGraph: {
      title: isFr
        ? 'Encyclopédie des plantes — Guides de culture | GardenSaas'
        : 'Plant Encyclopedia - Vegetable & Herb Growing Guides | GardenSaas',
      description: isFr
        ? 'Plus de 300 légumes, herbes et fruits avec guides de culture et calendriers de plantation.'
        : 'Browse 300+ vegetables, herbs, and fruits with detailed growing guides and planting calendars.',
      url: `${SITE_URL}/plants`,
      type: 'website',
      siteName: 'GardenSaas',
    },
    twitter: {
      card: 'summary',
      title: isFr
        ? 'Encyclopédie des plantes | GardenSaas'
        : 'Plant Encyclopedia | GardenSaas',
      description: isFr
        ? 'Plus de 300 légumes, herbes et fruits avec guides de culture et calendriers de plantation.'
        : 'Browse 300+ vegetables, herbs, and fruits with detailed growing guides and planting calendars.',
    },
    alternates: {
      canonical: `${SITE_URL}/plants`,
    },
  };
}

function buildJsonLd(locale: string) {
  const isFr = locale === 'fr';
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${SITE_URL}/plants#collection`,
        name: isFr
          ? 'Encyclopédie des plantes — Guides de culture légumes et aromates'
          : 'Plant Encyclopedia - Vegetable & Herb Growing Guides',
        description: isFr
          ? 'Parcourez plus de 300 légumes, herbes aromatiques et fruits avec des guides de culture détaillés, calendrier de plantation et associations de plantes.'
          : 'Browse 300+ vegetables, herbs, and fruits with detailed growing guides, planting dates, and companion planting information.',
        url: `${SITE_URL}/plants`,
        inLanguage: isFr ? 'fr' : 'en',
        isPartOf: {
          '@type': 'WebSite',
          '@id': `${SITE_URL}/#website`,
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${SITE_URL}/plants#breadcrumb`,
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
            name: isFr ? 'Encyclopédie des plantes' : 'Plant Encyclopedia',
          },
        ],
      },
    ],
  };
}

export default async function PlantsLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const jsonLd = buildJsonLd(locale);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
