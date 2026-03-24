import type { Metadata } from 'next';
import { DashboardPageClient } from '@/components/garden/dashboard-page-client';

export const metadata: Metadata = {
  title: 'My Garden Dashboard',
  description: 'View your garden status, daily tips, recommended plants, and planting calendar.',
  openGraph: {
    title: 'My Garden Dashboard | GardenSaas',
    description: 'View your garden status, daily tips, recommended plants, and planting calendar.',
    type: 'website',
    siteName: 'GardenSaas',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardPage() {
  return <DashboardPageClient />;
}
