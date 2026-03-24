import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Create your free GardenSaas account. Plan your garden, get AI-powered planting advice, and visualize your space in 3D.',
  keywords: ['garden planner sign up', 'GardenSaas register', 'free gardening app', 'create garden account'],
  openGraph: {
    title: 'Create Account | GardenSaas',
    description: 'Create your free GardenSaas account. Plan your garden, get AI-powered planting advice, and visualize your space in 3D.',
    type: 'website',
    siteName: 'GardenSaas',
  },
  twitter: {
    card: 'summary',
    title: 'Create Account | GardenSaas',
    description: 'Create your free GardenSaas account. Plan your garden and get AI-powered planting advice.',
  },
  alternates: {
    canonical: 'https://gardensaas.vercel.app/auth/register',
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
