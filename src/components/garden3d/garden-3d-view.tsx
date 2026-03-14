'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Grid3x3 } from 'lucide-react';
import { useGarden } from '@/lib/hooks';

const GardenScene = dynamic(() => import('./garden-scene').then(m => ({ default: m.GardenScene })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#0D1F17]">
      <div className="animate-pulse text-green-400">Loading 3D scene...</div>
    </div>
  ),
});

export function Garden3DView() {
  const { config, isLoaded } = useGarden();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#0D1F17] flex items-center justify-center">
        <div className="animate-pulse text-green-400">Loading garden...</div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] bg-[#0D1F17] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-green-900/30 bg-[#0D1F17]/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <Link href="/garden/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Button>
          </Link>
          <span className="text-sm text-green-300/60">
            {config.length}m x {config.width}m | {config.plantedItems.length} plants
          </span>
        </div>
        <Link href="/garden/planner">
          <Button variant="secondary" size="sm" className="gap-2">
            <Grid3x3 className="w-4 h-4" />
            2D Planner
          </Button>
        </Link>
      </div>

      {/* 3D Canvas */}
      <div className="flex-1 relative">
        <Suspense fallback={
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-pulse text-green-400">Loading 3D scene...</div>
          </div>
        }>
          <GardenScene config={config} />
        </Suspense>
      </div>
    </div>
  );
}
