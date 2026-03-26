import type { Metadata } from 'next';
import { SemisView } from '@/components/garden/semis-view';

export const metadata: Metadata = {
  title: 'Semis - Suivi de vos semis | GardenSaas',
  description:
    'Suivez la croissance de vos semis en 3D. Visualisez chaque etape de germination et recevez des conseils personnalises.',
  robots: { index: false, follow: false },
};

export default function SemisPage() {
  return <SemisView />;
}
