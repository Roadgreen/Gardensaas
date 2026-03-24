import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Plant Encyclopedia - Vegetable & Herb Growing Guides',
  description:
    'Browse 100+ vegetables, herbs, and fruits with detailed growing guides. Find planting dates, spacing requirements, companion plants, and harvest times.',
  keywords: [
    'vegetable growing guide',
    'plant encyclopedia',
    'herb growing tips',
    'companion planting chart',
    'when to plant vegetables',
    'vegetable spacing guide',
    'harvest time calculator',
  ],
  openGraph: {
    title: 'Plant Encyclopedia - Vegetable & Herb Growing Guides | GardenSaas',
    description:
      'Browse 100+ vegetables, herbs, and fruits with detailed growing guides and planting calendars.',
    url: 'https://gardensaas.vercel.app/plants',
    type: 'website',
    siteName: 'GardenSaas',
  },
  twitter: {
    card: 'summary',
    title: 'Plant Encyclopedia | GardenSaas',
    description:
      'Browse 100+ vegetables, herbs, and fruits with detailed growing guides and planting calendars.',
  },
  alternates: {
    canonical: 'https://gardensaas.vercel.app/plants',
  },
};

const plantsJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  '@id': 'https://gardensaas.vercel.app/plants#collection',
  name: 'Plant Encyclopedia - Vegetable & Herb Growing Guides',
  description:
    'Browse 100+ vegetables, herbs, and fruits with detailed growing guides, planting dates, and companion planting information.',
  url: 'https://gardensaas.vercel.app/plants',
  isPartOf: {
    '@type': 'WebSite',
    '@id': 'https://gardensaas.vercel.app/#website',
  },
};

export default function PlantsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(plantsJsonLd) }}
      />
      {children}
    </>
  );
}
