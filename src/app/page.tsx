import type { Metadata } from 'next';
import { HeroSection } from '@/components/landing/hero-section';
import { StatsSection } from '@/components/landing/stats-section';
import { FeaturesSection } from '@/components/landing/features-section';
import { HowItWorksSection } from '@/components/landing/how-it-works-section';
import { TestimonialsSection } from '@/components/landing/testimonials-section';
import { PricingSection } from '@/components/landing/pricing-section';
import { FAQSection } from '@/components/landing/faq-section';
import { CTASection } from '@/components/landing/cta-section';

export const metadata: Metadata = {
  title: 'GardenSaas - Smart Garden Planner with 3D Visualization',
  description:
    'Plan your perfect vegetable garden with AI-powered plant recommendations, 3D visualization, companion planting, and expert growing advice. Free to start.',
  keywords: [
    'garden planner app',
    'vegetable garden planner',
    '3D garden design',
    'companion planting guide',
    'AI garden advisor',
    'plant spacing calculator',
    'kitchen garden planner',
    'garden layout tool',
  ],
  openGraph: {
    title: 'GardenSaas - Smart Garden Planner with 3D Visualization',
    description:
      'Plan your perfect vegetable garden with AI-powered recommendations and 3D visualization. Free to start.',
    url: 'https://gardensaas.vercel.app',
    type: 'website',
  },
  alternates: {
    canonical: 'https://gardensaas.vercel.app',
  },
};

export default function Home() {
  return (
    <>
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <PricingSection />
      <FAQSection />
      <CTASection />
    </>
  );
}
