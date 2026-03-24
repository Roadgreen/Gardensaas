import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your GardenSaas account to manage your garden, get personalized planting tips, and track your growing season.',
  keywords: ['garden planner login', 'GardenSaas sign in', 'gardening app login'],
  openGraph: {
    title: 'Sign In | GardenSaas',
    description: 'Sign in to your GardenSaas account to manage your garden and get personalized planting tips.',
    type: 'website',
    siteName: 'GardenSaas',
  },
  twitter: {
    card: 'summary',
    title: 'Sign In | GardenSaas',
    description: 'Sign in to your GardenSaas account to manage your garden and get personalized planting tips.',
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
