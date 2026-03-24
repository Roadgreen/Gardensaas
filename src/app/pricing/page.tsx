import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { PricingSection } from '@/components/landing/pricing-section';

const SITE_URL = 'https://gardensaas.vercel.app';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const isFr = locale === 'fr';

  const title = isFr ? 'Tarifs' : 'Pricing';
  const description = isFr
    ? 'Tarifs simples et transparents pour GardenSaas. Commencez gratuitement avec 1 jardin et 5 plantes, ou passez Pro pour un accès illimité.'
    : 'Simple and transparent pricing for GardenSaas. Start free with 1 garden and 5 plants, or go Pro for unlimited access.';

  return {
    title,
    description,
    keywords: isFr
      ? [
          'planificateur jardin prix',
          'application jardinage gratuite',
          'GardenSaas tarifs',
          'potager application pro',
        ]
      : [
          'garden planner pricing',
          'gardening app free',
          'garden planner subscription',
          'GardenSaas pricing',
        ],
    openGraph: {
      title: isFr ? 'Tarifs | GardenSaas' : 'Pricing | GardenSaas',
      description,
      url: `${SITE_URL}/pricing`,
      type: 'website',
      siteName: 'GardenSaas',
    },
    twitter: {
      card: 'summary',
      title: isFr ? 'Tarifs | GardenSaas' : 'Pricing | GardenSaas',
      description,
    },
    alternates: {
      canonical: `${SITE_URL}/pricing`,
    },
  };
}

function buildJsonLd(locale: string) {
  const isFr = locale === 'fr';
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${SITE_URL}/pricing#page`,
        name: isFr ? 'Tarifs GardenSaas' : 'GardenSaas Pricing',
        description: isFr
          ? 'Tarifs simples et transparents pour le planificateur de jardin GardenSaas.'
          : 'Simple and transparent pricing for GardenSaas garden planner.',
        url: `${SITE_URL}/pricing`,
        inLanguage: isFr ? 'fr' : 'en',
        mainEntity: {
          '@type': 'Product',
          name: 'GardenSaas Pro',
          description: isFr
            ? 'Jardins illimités, plantes illimitées, conseiller IA, visualisation 3D et support prioritaire.'
            : 'Unlimited gardens, unlimited plants, AI advisor, 3D visualization, and priority support.',
          offers: [
            {
              '@type': 'Offer',
              name: isFr ? 'Plan Gratuit' : 'Free Plan',
              price: '0',
              priceCurrency: 'EUR',
              description: isFr
                ? '1 jardin, 5 plantes, planificateur de base'
                : '1 garden, 5 plants, basic planner',
            },
            {
              '@type': 'Offer',
              name: isFr ? 'Plan Pro' : 'Pro Plan',
              price: '4.99',
              priceCurrency: 'EUR',
              priceSpecification: {
                '@type': 'UnitPriceSpecification',
                price: '4.99',
                priceCurrency: 'EUR',
                billingDuration: 'P1M',
              },
              description: isFr
                ? 'Jardins illimités, plantes illimitées, conseiller IA, vue 3D, support prioritaire'
                : 'Unlimited gardens, unlimited plants, AI advisor, 3D view, priority support',
            },
          ],
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${SITE_URL}/pricing#breadcrumb`,
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
            name: isFr ? 'Tarifs' : 'Pricing',
          },
        ],
      },
    ],
  };
}

export default async function PricingPage() {
  const locale = await getLocale();
  const jsonLd = buildJsonLd(locale);

  return (
    <div className="min-h-screen bg-[#0D1F17]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PricingSection />
    </div>
  );
}
