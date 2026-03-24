import type { Metadata } from 'next';
import { Garden3DView } from '@/components/garden3d/garden-3d-view';

export const metadata: Metadata = {
  title: '3D Garden View',
  description:
    'Explore your garden in an interactive 3D view with a cute gardener character who gives you daily tips.',
  robots: { index: false, follow: false },
};

export default function Garden3DPage() {
  return <Garden3DView />;
}
