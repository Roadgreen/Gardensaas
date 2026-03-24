import type { Metadata } from 'next';
import { PricingSection } from '@/components/landing/pricing-section';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Simple and transparent pricing for GardenSaas. Start free with 1 garden and 5 plants, or go Pro for unlimited access.',
  keywords: ['garden planner pricing', 'gardening app free', 'garden planner subscription', 'GardenSaas pricing'],
  openGraph: {
    title: 'Pricing | GardenSaas',
    description: 'Simple and transparent pricing for GardenSaas. Start free with 1 garden and 5 plants, or go Pro for unlimited access.',
    type: 'website',
    siteName: 'GardenSaas',
  },
  twitter: {
    card: 'summary',
    title: 'Pricing | GardenSaas',
    description: 'Simple and transparent pricing. Start free with 1 garden and 5 plants, or go Pro for unlimited access.',
  },
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#0D1F17]">
      <PricingSection />
    </div>
  );
}
