import type { Metadata } from 'next';
import { SetupForm } from '@/components/garden/setup-form';

export const metadata: Metadata = {
  title: 'Garden Setup',
  description:
    'Configure your garden dimensions, soil type, climate zone, and sun exposure to get personalized plant recommendations.',
  robots: { index: false, follow: false },
};

export default function SetupPage() {
  return <SetupForm />;
}
