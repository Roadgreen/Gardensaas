'use client';

import { Suspense, useState, useCallback, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Grid3x3 } from 'lucide-react';
import { useGarden, usePlants } from '@/lib/hooks';
import { PlantCatalogSidebar } from './plant-catalog-sidebar';
import { DragDropOverlay } from './drag-drop-overlay';
import { PlantInfoPanel } from './plant-info-panel';
import { RaisedBedPanel } from './raised-bed-panel';
import { GardenSizeSelector } from './garden-size-selector';
import { SpacingInfoOverlay } from './spacing-info-overlay';
import type { RaisedBed } from '@/types';

const GardenScene = dynamic(() => import('./garden-scene').then(m => ({ default: m.GardenScene })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#0D1F17]">
      <div className="animate-pulse text-green-400">Loading 3D scene...</div>
    </div>
  ),
});

export function Garden3DView() {
  const { config, isLoaded, addPlant, removePlant, addRaisedBed, removeRaisedBed, updateRaisedBed, updateConfig } = useGarden();
  const { plants } = usePlants();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draggingPlantId, setDraggingPlantId] = useState<string | null>(null);
  const [selectedPlantType, setSelectedPlantType] = useState<string | null>(null);
  const [showSpacing, setShowSpacing] = useState(true);
  const [showRaisedBedPanel, setShowRaisedBedPanel] = useState(false);
  const [selectedBedId, setSelectedBedId] = useState<string | null>(null);
  const [infoPanelPlantIndex, setInfoPanelPlantIndex] = useState<number | null>(null);
  const [showSizeSelector, setShowSizeSelector] = useState(false);

  // Get the selected plant data for spacing info
  const selectedPlantData = useMemo(() => {
    if (!selectedPlantType) return null;
    return plants.find(p => p.id === selectedPlantType) || null;
  }, [selectedPlantType, plants]);

  // Handler for garden resize
  const handleGardenResize = useCallback((length: number, width: number) => {
    updateConfig({ length, width });
  }, [updateConfig]);

  // Listen for plant/remove/info events from the 3D scene
  useEffect(() => {
    const handlePlant = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.plantId && detail?.x !== undefined && detail?.z !== undefined) {
        addPlant(detail.plantId, detail.x, detail.z, detail.raisedBedId);
      }
    };
    const handleRemove = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.index !== undefined) {
        removePlant(detail.index);
        setInfoPanelPlantIndex(null);
      }
    };
    const handleInfo = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.index !== undefined) {
        setInfoPanelPlantIndex(detail.index);
      }
    };
    window.addEventListener('garden:plant', handlePlant);
    window.addEventListener('garden:remove', handleRemove);
    window.addEventListener('garden:info', handleInfo);
    return () => {
      window.removeEventListener('garden:plant', handlePlant);
      window.removeEventListener('garden:remove', handleRemove);
      window.removeEventListener('garden:info', handleInfo);
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
      const pctX = relX * 100;
      const pctZ = relY * 100;
      const clampedX = Math.max(5, Math.min(95, pctX));
      const clampedZ = Math.max(5, Math.min(95, pctZ));
      addPlant(plantId, clampedX, clampedZ);
      setIsDragging(false);
      setDraggingPlantId(null);
    },
    [draggingPlantId, selectedPlantType, addPlant]
  );

  // Determine info panel plant
  const infoPanelItem = infoPanelPlantIndex !== null ? config.plantedItems[infoPanelPlantIndex] : null;
  const infoPanelPlant = infoPanelItem ? plants.find(p => p.id === infoPanelItem.plantId) : null;

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
            {(config.raisedBeds || []).length > 0 && ` | ${(config.raisedBeds || []).length} beds`}
          </span>
          <span className="text-xs text-green-300/60 sm:hidden">
            {config.plantedItems.length} plants
          </span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Garden size */}
          <button
            onClick={() => setShowSizeSelector(v => !v)}
            className="px-2 sm:px-3 py-1.5 text-xs rounded-lg border transition-all"
            style={{
              background: showSizeSelector ? 'rgba(74, 222, 128, 0.15)' : 'transparent',
              borderColor: showSizeSelector ? 'rgba(74, 222, 128, 0.5)' : 'rgba(74, 222, 128, 0.2)',
              color: showSizeSelector ? '#86EFAC' : '#9CA3AF',
            }}
          >
            {'\uD83D\uDCCF'} <span className="hidden sm:inline">{config.length}x{config.width}m</span>
          </button>
          {/* Spacing toggle */}
          <button
            onClick={() => setShowSpacing(v => !v)}
            className="px-2 sm:px-3 py-1.5 text-xs rounded-lg border transition-all"
            style={{
              background: showSpacing ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
              borderColor: showSpacing ? 'rgba(168, 85, 247, 0.5)' : 'rgba(74, 222, 128, 0.2)',
              color: showSpacing ? '#C084FC' : '#9CA3AF',
            }}
          >
            {'\uD83E\uDDF2'} <span className="hidden sm:inline">Spacing</span>
          </button>
          {/* Raised beds */}
          <button
            onClick={() => setShowRaisedBedPanel(v => !v)}
            className="px-2 sm:px-3 py-1.5 text-xs rounded-lg border transition-all"
            style={{
              background: showRaisedBedPanel ? 'rgba(210, 160, 108, 0.15)' : 'transparent',
              borderColor: showRaisedBedPanel ? 'rgba(210, 160, 108, 0.5)' : 'rgba(74, 222, 128, 0.2)',
              color: showRaisedBedPanel ? '#D4A06C' : '#9CA3AF',
            }}
          >
            {'\uD83E\uDDF1'} <span className="hidden sm:inline">Beds</span>
          </button>
          {/* Catalog */}
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

        {/* Spacing info overlay when placing a plant */}
        <SpacingInfoOverlay
          plant={selectedPlantData}
          isVisible={!!selectedPlantType && !showSizeSelector}
        />

        {/* Garden size selector */}
        {showSizeSelector && (
          <GardenSizeSelector
            currentLength={config.length}
            currentWidth={config.width}
            onResize={handleGardenResize}
            onClose={() => setShowSizeSelector(false)}
          />
        )}

        {/* Plant info panel */}
        {infoPanelPlant && infoPanelItem && (
          <PlantInfoPanel
            plant={infoPanelPlant}
            plantedDate={infoPanelItem.plantedDate}
            allPlants={plants}
            plantedItems={config.plantedItems}
            gardenLength={config.length}
            gardenWidth={config.width}
            raisedBedId={infoPanelItem.raisedBedId}
            raisedBeds={config.raisedBeds}
            onClose={() => setInfoPanelPlantIndex(null)}
            onRemove={() => {
              if (infoPanelPlantIndex !== null) {
                removePlant(infoPanelPlantIndex);
                setInfoPanelPlantIndex(null);
              }
            }}
          />
        )}

        {/* Raised bed panel */}
        {showRaisedBedPanel && (
          <RaisedBedPanel
            beds={config.raisedBeds || []}
            selectedBedId={selectedBedId}
            onAddBed={addRaisedBed}
            onRemoveBed={removeRaisedBed}
            onUpdateBed={updateRaisedBed}
            onSelectBed={setSelectedBedId}
            onClose={() => setShowRaisedBedPanel(false)}
          />
        )}

        <Suspense fallback={
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-pulse text-green-400">Loading 3D scene...</div>
          </div>
        }>
          <GardenScene
            config={config}
            selectedPlantType={selectedPlantType}
            showSpacing={showSpacing}
            selectedBedId={selectedBedId}
            onSelectBed={setSelectedBedId}
            onPlantAdded={() => {
              // Plant was placed via click, handled through events
            }}
          />
        </Suspense>
      </div>
    </div>
  );
}
