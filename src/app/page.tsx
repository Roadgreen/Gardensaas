import { HeroSection } from '@/components/landing/hero-section';
import { StatsSection } from '@/components/landing/stats-section';
import { FeaturesSection } from '@/components/landing/features-section';
import { HowItWorksSection } from '@/components/landing/how-it-works-section';
import { TestimonialsSection } from '@/components/landing/testimonials-section';
import { PricingSection } from '@/components/landing/pricing-section';
import { CTASection } from '@/components/landing/cta-section';

export default function Home() {
  return (
    <>
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <PricingSection />
      <CTASection />
    </>
  );
}
