import type { Metadata } from 'next';
import { PricingSection } from '@/components/landing/pricing-section';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Simple and transparent pricing for GardenSaas. Start free with 1 garden and 5 plants, or go Pro for unlimited access.',
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#0D1F17]">
      <PricingSection />
    </div>
  );
}
