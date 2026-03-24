import type { Metadata } from 'next';
import { PricingSection } from '@/components/landing/pricing-section';

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Simple and transparent pricing for GardenSaas. Start free with 1 garden and 5 plants, or go Pro for unlimited access.',
  keywords: [
    'garden planner pricing',
    'gardening app free',
    'garden planner subscription',
    'GardenSaas pricing',
  ],
  openGraph: {
    title: 'Pricing | GardenSaas',
    description:
      'Simple and transparent pricing for GardenSaas. Start free with 1 garden and 5 plants, or go Pro for unlimited access.',
    url: 'https://gardensaas.vercel.app/pricing',
    type: 'website',
    siteName: 'GardenSaas',
  },
  twitter: {
    card: 'summary',
    title: 'Pricing | GardenSaas',
    description:
      'Simple and transparent pricing. Start free with 1 garden and 5 plants, or go Pro for unlimited access.',
  },
  alternates: {
    canonical: 'https://gardensaas.vercel.app/pricing',
  },
};

const pricingJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  '@id': 'https://gardensaas.vercel.app/pricing#page',
  name: 'GardenSaas Pricing',
  description:
    'Simple and transparent pricing for GardenSaas garden planner.',
  url: 'https://gardensaas.vercel.app/pricing',
  mainEntity: {
    '@type': 'Product',
    name: 'GardenSaas Pro',
    description:
      'Unlimited gardens, unlimited plants, AI advisor, 3D visualization, and priority support.',
    offers: [
      {
        '@type': 'Offer',
        name: 'Free Plan',
        price: '0',
        priceCurrency: 'EUR',
        description: '1 garden, 5 plants, basic planner',
      },
      {
        '@type': 'Offer',
        name: 'Pro Plan',
        price: '4.99',
        priceCurrency: 'EUR',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '4.99',
          priceCurrency: 'EUR',
          billingDuration: 'P1M',
        },
        description:
          'Unlimited gardens, unlimited plants, AI advisor, 3D view, priority support',
      },
    ],
  },
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#0D1F17]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingJsonLd) }}
      />
      <PricingSection />
    </div>
  );
}
