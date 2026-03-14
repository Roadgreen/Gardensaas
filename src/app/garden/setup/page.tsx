import type { Metadata } from 'next';
import { SetupForm } from '@/components/garden/setup-form';

export const metadata: Metadata = {
  title: 'Garden Setup',
  description: 'Configure your garden dimensions, soil type, climate zone, and sun exposure to get personalized plant recommendations.',
};

export default function SetupPage() {
  return <SetupForm />;
}
