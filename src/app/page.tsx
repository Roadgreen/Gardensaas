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

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://gardensaas.vercel.app/#website',
      url: 'https://gardensaas.vercel.app',
      name: 'GardenSaas',
      description:
        'Smart garden planner with 3D visualization, AI plant recommendations, and companion planting guides.',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://gardensaas.vercel.app/plants?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://gardensaas.vercel.app/#app',
      name: 'GardenSaas',
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Web, iOS, Android',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR',
        description: 'Free plan available',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        reviewCount: '124',
      },
      description:
        'Plan your vegetable garden with AI-powered recommendations, 3D visualization, companion planting, and a smart growing calendar.',
      url: 'https://gardensaas.vercel.app',
    },
    {
      '@type': 'HowTo',
      '@id': 'https://gardensaas.vercel.app/#howto',
      name: 'How to plan your vegetable garden with GardenSaas',
      description: 'From seed to harvest in 3 simple steps using GardenSaas.',
      totalTime: 'PT2M',
      step: [
        {
          '@type': 'HowToStep',
          position: 1,
          name: 'Configure your garden',
          text: 'Enter the dimensions, soil type, climate zone and sun exposure. It takes less than 2 minutes!',
        },
        {
          '@type': 'HowToStep',
          position: 2,
          name: 'Choose your plants',
          text: 'Browse 300+ plants with smart recommendations based on your garden. We tell you what grows best in your space.',
        },
        {
          '@type': 'HowToStep',
          position: 3,
          name: 'Grow & visualize',
          text: 'View your garden in 3D, follow your care calendar and ask the AI gardener when you need help.',
        },
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://gardensaas.vercel.app/#faq',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'When should I start my vegetable garden?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'The best time to start depends on your climate zone. Generally, you can start seedlings indoors from February-March, and plant outdoors after the last frost (April-May in temperate climates). Our planting calendar automatically adapts the dates to your region.',
          },
        },
        {
          '@type': 'Question',
          name: 'How much time should I spend gardening each day?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'For a small garden (10-20 m²), expect about 15-30 minutes per day for watering, weeding and maintenance. GardenSaas optimizes your time by giving you priority tasks each day.',
          },
        },
        {
          '@type': 'Question',
          name: 'Does the app work for balconies and small spaces?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Absolutely! GardenSaas supports gardens of all sizes, including balconies and terraces. We recommend the most suitable plants for your available space, with dwarf varieties and aromatic herbs ideal for pot growing.',
          },
        },
        {
          '@type': 'Question',
          name: 'How does the 3D garden view work?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'The 3D view lets you visualize your garden like a video game. You can move your gardener character, see your plants in 3D, and plan the layout of your garden in a fun and intuitive way.',
          },
        },
        {
          '@type': 'Question',
          name: 'What plants are easiest for a beginner?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'We recommend starting with cherry tomatoes, basil, lettuce, radishes and zucchini. These plants are robust, grow quickly and forgive beginner mistakes. Our easy difficulty filter will help you find them.',
          },
        },
        {
          '@type': 'Question',
          name: 'Does the AI advisor replace a real gardener?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Our AI is a great complement, not a replacement! It analyzes your soil, climate and plants to give personalized advice 24/7. For complex cases, it will point you to specialized resources.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I use GardenSaas without internet?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'The plant encyclopedia and your garden plan are accessible offline once loaded. Features like real-time weather and the AI advisor require an internet connection.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is companion planting?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Companion planting is the art of placing certain species side by side so they help each other. For example, basil protects tomatoes from aphids, and carrots repel the onion fly. GardenSaas automatically shows you good and bad pairings.',
          },
        },
      ],
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
