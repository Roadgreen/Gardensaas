'use client';

import { Suspense, useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Grid3x3 } from 'lucide-react';
import { useGarden, usePlants } from '@/lib/hooks';
import { PlantCatalogSidebar } from './plant-catalog-sidebar';
import { DragDropOverlay } from './drag-drop-overlay';

const GardenScene = dynamic(() => import('./garden-scene').then(m => ({ default: m.GardenScene })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#0D1F17]">
      <div className="animate-pulse text-green-400">Loading 3D scene...</div>
    </div>
  ),
});

export function Garden3DView() {
  const { config, isLoaded, addPlant, removePlant } = useGarden();
  const { plants } = usePlants();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draggingPlantId, setDraggingPlantId] = useState<string | null>(null);
  const [selectedPlantType, setSelectedPlantType] = useState<string | null>(null);

  // Listen for plant/remove events from the 3D scene
  useEffect(() => {
    const handlePlant = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.plantId && detail?.x !== undefined && detail?.z !== undefined) {
        addPlant(detail.plantId, detail.x, detail.z);
      }
    };
    const handleRemove = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.index !== undefined) {
        removePlant(detail.index);
      }
    };
    window.addEventListener('garden:plant', handlePlant);
    window.addEventListener('garden:remove', handleRemove);
    return () => {
      window.removeEventListener('garden:plant', handlePlant);
      window.removeEventListener('garden:remove', handleRemove);
    };
  }, [addPlant, removePlant]);

  const handleDragStart = useCallback((plantId: string) => {
    setIsDragging(true);
    setDraggingPlantId(plantId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDraggingPlantId(null);
  }, []);

  const handleDrop = useCallback(
    (relX: number, relY: number) => {
      const plantId = draggingPlantId || selectedPlantType;
      if (!plantId) return;
      // Convert relative drop position to garden percentage coords
      // relX/relY are 0-1 within the canvas; map to garden percent coords
      const pctX = relX * 100;
      const pctZ = relY * 100;
      // Clamp to garden bounds
      const clampedX = Math.max(5, Math.min(95, pctX));
      const clampedZ = Math.max(5, Math.min(95, pctZ));
      addPlant(plantId, clampedX, clampedZ);
      setIsDragging(false);
      setDraggingPlantId(null);
    },
    [draggingPlantId, selectedPlantType, addPlant]
  );

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#0D1F17] flex items-center justify-center">
        <div className="animate-pulse text-green-400">Loading garden...</div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100svh-64px)] bg-[#0D1F17] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-2 sm:px-4 py-2 sm:py-3 border-b border-green-900/30 bg-[#0D1F17]/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/garden/dashboard">
            <Button variant="ghost" size="sm" className="gap-1 sm:gap-2 px-2 sm:px-3">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
          </Link>
          <span className="text-xs sm:text-sm text-green-300/60 hidden sm:inline">
            {config.length}m x {config.width}m | {config.plantedItems.length} plants
          </span>
          <span className="text-xs text-green-300/60 sm:hidden">
            {config.plantedItems.length} plants
          </span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setIsSidebarOpen((v) => !v)}
            className="px-2 sm:px-3 py-1.5 text-xs rounded-lg border transition-all"
            style={{
              background: isSidebarOpen ? 'rgba(74, 222, 128, 0.15)' : 'transparent',
              borderColor: isSidebarOpen ? 'rgba(74, 222, 128, 0.5)' : 'rgba(74, 222, 128, 0.2)',
              color: isSidebarOpen ? '#86EFAC' : '#9CA3AF',
            }}
          >
            {'\uD83C\uDF3B'} <span className="hidden sm:inline">Catalog</span>
          </button>
          <Link href="/garden/planner">
            <Button variant="secondary" size="sm" className="gap-1 sm:gap-2 px-2 sm:px-3">
              <Grid3x3 className="w-4 h-4" />
              <span className="hidden sm:inline">2D Planner</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 3D Canvas + Sidebar */}
      <div className="flex-1 relative overflow-hidden">
        {/* Plant catalog sidebar */}
        <PlantCatalogSidebar
          plants={plants}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen((v) => !v)}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          selectedPlantType={selectedPlantType}
          onSelectPlant={setSelectedPlantType}
        />

        {/* Drag-and-drop overlay */}
        <DragDropOverlay isDragging={isDragging} onDrop={handleDrop} />

        <Suspense fallback={
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-pulse text-green-400">Loading 3D scene...</div>
          </div>
        }>
          <GardenScene
            config={config}
            selectedPlantType={selectedPlantType}
            onPlantAdded={() => {
              // Plant was placed via click, handled through events
            }}
          />
        </Suspense>
      </div>
    </div>
  );
}
