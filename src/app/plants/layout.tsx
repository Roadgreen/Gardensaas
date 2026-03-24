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
    title: 'Plant Encyclopedia - Vegetable & Herb Growing Guides',
    description:
      'Browse 100+ vegetables, herbs, and fruits with detailed growing guides and planting calendars.',
    url: 'https://gardensaas.vercel.app/plants',
    type: 'website',
  },
  alternates: {
    canonical: 'https://gardensaas.vercel.app/plants',
  },
};

export default function PlantsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
