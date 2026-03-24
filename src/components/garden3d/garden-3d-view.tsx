'use client';

import { Suspense, useState, useCallback, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Grid3x3 } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { useGarden, usePlants } from '@/lib/hooks';
import { PlantCatalogSidebar } from './plant-catalog-sidebar';
import { DragDropOverlay } from './drag-drop-overlay';
import { PlantInfoPanel } from './plant-info-panel';
import { RaisedBedPanel } from './raised-bed-panel';
import { ZonePanel } from './zone-panel';
import { VarietyPicker } from './variety-picker';
import { PlantingSuggestions } from './planting-suggestions';
import { GardenSizeSelector } from './garden-size-selector';
import { SpacingInfoOverlay } from './spacing-info-overlay';
import type { RaisedBed } from '@/types';

const GardenScene = dynamic(() => import('./garden-scene').then(m => ({ default: m.GardenScene })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#0D1F17]">
      <div className="animate-pulse text-green-400" suppressHydrationWarning>...</div>
    </div>
  ),
});

export function Garden3DView() {
  const { config, isLoaded, addPlant, removePlant, addRaisedBed, removeRaisedBed, updateRaisedBed, addZone, removeZone, updateZone, updateConfig } = useGarden();
  const { plants } = usePlants();
  const t = useTranslations('garden3d');
  const locale = useLocale();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draggingPlantId, setDraggingPlantId] = useState<string | null>(null);
  const [selectedPlantType, setSelectedPlantType] = useState<string | null>(null);
  const [showSpacing, setShowSpacing] = useState(true);
  const [showRaisedBedPanel, setShowRaisedBedPanel] = useState(false);
  const [showZonePanel, setShowZonePanel] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedBedId, setSelectedBedId] = useState<string | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [infoPanelPlantIndex, setInfoPanelPlantIndex] = useState<number | null>(null);
  const [showSizeSelector, setShowSizeSelector] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  // Variety picker state
  const [varietyPickerPlant, setVarietyPickerPlant] = useState<{ plantId: string; x: number; z: number; raisedBedId?: string; zoneId?: string } | null>(null);

  // Get the selected plant data for spacing info
  const selectedPlantData = useMemo(() => {
    if (!selectedPlantType) return null;
    return plants.find(p => p.id === selectedPlantType) || null;
  }, [selectedPlantType, plants]);

  // Detect mobile for label clip logic
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Handler for garden resize
  const handleGardenResize = useCallback((length: number, width: number) => {
    updateConfig({ length, width });
  }, [updateConfig]);

  // Listen for plant/remove/info events from the 3D scene
  useEffect(() => {
    const handlePlant = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.plantId && detail?.x !== undefined && detail?.z !== undefined) {
        const plantData = plants.find(p => p.id === detail.plantId);
        // If plant has varieties or there are zones/beds, show the picker
        if (plantData && (plantData.varieties?.length || (config.zones || []).length > 0 || (config.raisedBeds || []).length > 0)) {
          setVarietyPickerPlant({
            plantId: detail.plantId,
            x: detail.x,
            z: detail.z,
            raisedBedId: detail.raisedBedId,
            zoneId: detail.zoneId,
          });
        } else {
          addPlant(detail.plantId, detail.x, detail.z, detail.raisedBedId, undefined, detail.zoneId);
        }
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
        // Close bottom-positioned panels to prevent overlap on mobile
        setShowRaisedBedPanel(false);
        setShowZonePanel(false);
        setShowSizeSelector(false);
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
  }, [addPlant, removePlant, plants, config.zones, config.raisedBeds]);

  // Handle variety picker confirm
  const handleVarietyConfirm = useCallback((varietyId: string | undefined, targetZoneId: string | undefined, targetBedId: string | undefined) => {
    if (!varietyPickerPlant) return;
    const finalBedId = targetBedId || varietyPickerPlant.raisedBedId;
    const finalZoneId = targetZoneId || varietyPickerPlant.zoneId;
    addPlant(varietyPickerPlant.plantId, varietyPickerPlant.x, varietyPickerPlant.z, finalBedId, varietyId, finalZoneId);
    setVarietyPickerPlant(null);
  }, [varietyPickerPlant, addPlant]);

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

  // Variety picker plant data
  const varietyPickerPlantData = varietyPickerPlant ? plants.find(p => p.id === varietyPickerPlant.plantId) : null;

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#0D1F17] flex items-center justify-center">
        <div className="animate-pulse text-green-400">{t('loadingGarden')}</div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100dvh-64px-68px)] md:h-[calc(100dvh-64px)] bg-[#0D1F17] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-2 sm:px-4 py-2 sm:py-3 border-b border-green-900/30 bg-[#0D1F17]/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/garden/dashboard">
            <Button variant="ghost" size="sm" className="gap-1 sm:gap-2 px-2 sm:px-3">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{t('dashboard')}</span>
            </Button>
          </Link>
          <span className="text-xs sm:text-sm text-green-300/60 hidden sm:inline">
            {config.length}m x {config.width}m | {config.plantedItems.length} {t('plants')}
            {(config.raisedBeds || []).length > 0 && ` | ${(config.raisedBeds || []).length} ${t('beds')}`}
            {(config.zones || []).length > 0 && ` | ${(config.zones || []).length} ${t('zones')}`}
          </span>
          <span className="text-xs text-green-300/60 sm:hidden">
            {config.plantedItems.length} {t('plants')}
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
            {'\uD83E\uDDF2'} <span className="hidden sm:inline">{t('spacing')}</span>
          </button>
          {/* Zones */}
          <button
            onClick={() => setShowZonePanel(v => {
              if (!v) { setShowRaisedBedPanel(false); setShowSuggestions(false); setInfoPanelPlantIndex(null); }
              return !v;
            })}
            className="px-2 sm:px-3 py-1.5 text-xs rounded-lg border transition-all"
            style={{
              background: showZonePanel ? 'rgba(74, 222, 128, 0.15)' : 'transparent',
              borderColor: showZonePanel ? 'rgba(74, 222, 128, 0.5)' : 'rgba(74, 222, 128, 0.2)',
              color: showZonePanel ? '#4ADE80' : '#9CA3AF',
            }}
          >
            {'\uD83D\uDFE9'} <span className="hidden sm:inline">{t('zones_label')}</span>
          </button>
          {/* Raised beds */}
          <button
            onClick={() => setShowRaisedBedPanel(v => {
              if (!v) { setShowZonePanel(false); setShowSuggestions(false); setInfoPanelPlantIndex(null); }
              return !v;
            })}
            className="px-2 sm:px-3 py-1.5 text-xs rounded-lg border transition-all"
            style={{
              background: showRaisedBedPanel ? 'rgba(210, 160, 108, 0.15)' : 'transparent',
              borderColor: showRaisedBedPanel ? 'rgba(210, 160, 108, 0.5)' : 'rgba(74, 222, 128, 0.2)',
              color: showRaisedBedPanel ? '#D4A06C' : '#9CA3AF',
            }}
          >
            {'\uD83E\uDDF1'} <span className="hidden sm:inline">{t('beds')}</span>
          </button>
          {/* Suggestions */}
          <button
            onClick={() => setShowSuggestions(v => {
              if (!v) { setShowRaisedBedPanel(false); setShowZonePanel(false); }
              return !v;
            })}
            className="px-2 sm:px-3 py-1.5 text-xs rounded-lg border transition-all"
            style={{
              background: showSuggestions ? 'rgba(251, 191, 36, 0.15)' : 'transparent',
              borderColor: showSuggestions ? 'rgba(251, 191, 36, 0.5)' : 'rgba(74, 222, 128, 0.2)',
              color: showSuggestions ? '#FBBF24' : '#9CA3AF',
            }}
          >
            {'\uD83D\uDCA1'} <span className="hidden sm:inline">{t('suggestions_label')}</span>
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
            {'\uD83C\uDF3B'} <span className="hidden sm:inline">{t('catalog')}</span>
          </button>
          <Link href="/garden/planner">
            <Button variant="secondary" size="sm" className="gap-1 sm:gap-2 px-2 sm:px-3">
              <Grid3x3 className="w-4 h-4" />
              <span className="hidden sm:inline">{t('planner2d')}</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 3D Canvas + Sidebar */}
      {/* On mobile with info panel open, clip the Three.js Html labels so they don't bleed over the bottom sheet */}
      <div
        className="flex-1 relative overflow-hidden"
        style={
          isMobile && infoPanelPlant && infoPanelItem && !showSuggestions
            ? { clipPath: 'inset(0 0 var(--plant-panel-height) 0)' }
            : undefined
        }
      >
        {/* Plant catalog sidebar — hidden on mobile when info panel is open */}
        <div className={infoPanelPlant && infoPanelItem && !showSuggestions ? 'sidebar-hidden-mobile' : ''}>
          <PlantCatalogSidebar
            plants={plants}
            isOpen={isSidebarOpen}
            onToggle={() => setIsSidebarOpen((v) => !v)}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            selectedPlantType={selectedPlantType}
            onSelectPlant={setSelectedPlantType}
          />
        </div>

        {/* Drag-and-drop overlay */}
        <DragDropOverlay isDragging={isDragging} onDrop={handleDrop} />

        {/* Spacing info overlay when placing a plant — hide when info panel is open */}
        <SpacingInfoOverlay
          plant={selectedPlantData}
          isVisible={!!selectedPlantType && !showSizeSelector && !(infoPanelPlant && infoPanelItem && !showSuggestions)}
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

        {/* Plant info panel — rendered as a sibling below the clipped canvas container
            so the clipPath on the canvas wrapper does not clip the fixed bottom sheet */}

        {/* Planting suggestions panel */}
        {showSuggestions && (
          <PlantingSuggestions
            config={config}
            plants={plants}
            onClose={() => setShowSuggestions(false)}
            onSelectPlant={(plantId) => {
              setSelectedPlantType(plantId);
              setShowSuggestions(false);
              setIsSidebarOpen(true);
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

        {/* Zone panel */}
        {showZonePanel && (
          <ZonePanel
            zones={config.zones || []}
            selectedZoneId={selectedZoneId}
            onAddZone={addZone}
            onRemoveZone={removeZone}
            onUpdateZone={updateZone}
            onSelectZone={setSelectedZoneId}
            onClose={() => setShowZonePanel(false)}
            plantedItems={config.plantedItems}
          />
        )}

        {/* Variety picker modal */}
        {varietyPickerPlantData && varietyPickerPlant && (
          <VarietyPicker
            plant={varietyPickerPlantData}
            zones={config.zones || []}
            raisedBeds={config.raisedBeds || []}
            onConfirm={handleVarietyConfirm}
            onCancel={() => setVarietyPickerPlant(null)}
          />
        )}

        <Suspense fallback={
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-pulse text-green-400">{t('loading3d')}</div>
          </div>
        }>
          <GardenScene
            config={config}
            selectedPlantType={selectedPlantType}
            showSpacing={showSpacing}
            selectedBedId={selectedBedId}
            onSelectBed={setSelectedBedId}
            selectedZoneId={selectedZoneId}
            onSelectZone={setSelectedZoneId}
            locale={locale}
            onPlantAdded={() => {
              // Plant was placed via click, handled through events
            }}
          />
        </Suspense>
      </div>

      {/* Plant info panel — outside the clipped canvas container so the clipPath
          applied to that wrapper on mobile never hides the fixed bottom sheet */}
      {infoPanelPlant && infoPanelItem && !showSuggestions && (
        <PlantInfoPanel
          plant={infoPanelPlant}
          plantedDate={infoPanelItem.plantedDate}
          allPlants={plants}
          plantedItems={config.plantedItems}
          gardenLength={config.length}
          gardenWidth={config.width}
          raisedBedId={infoPanelItem.raisedBedId}
          raisedBeds={config.raisedBeds}
          varietyId={infoPanelItem.varietyId}
          zoneId={infoPanelItem.zoneId}
          zones={config.zones || []}
          onClose={() => setInfoPanelPlantIndex(null)}
          onRemove={() => {
            if (infoPanelPlantIndex !== null) {
              removePlant(infoPanelPlantIndex);
              setInfoPanelPlantIndex(null);
            }
          }}
        />
      )}
    </div>
  );
}
