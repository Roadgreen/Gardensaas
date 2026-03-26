'use client';

import { Suspense, useState, useCallback, useEffect, useMemo, useRef } from 'react';
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
import { Garden2DMobile } from './garden-2d-mobile';
import type { RaisedBed } from '@/types';

const GardenScene = dynamic(() => import('./garden-scene').then(m => ({ default: m.GardenScene })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#F5F1E8] animate-pulse flex items-center justify-center relative">
      {/* Fake grid for spatial context while loading */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 opacity-10" style={{
        backgroundImage: 'linear-gradient(rgba(74,124,89,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(74,124,89,0.2) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />
      <div className="flex flex-col items-center gap-3 z-10">
        <div className="w-10 h-10 rounded-full border-2 border-[#C8DFC1] border-t-[#4A7C59] animate-spin" />
        <div className="h-3 w-28 bg-[#C8DFC1]/40 rounded-md" />
      </div>
    </div>
  ),
});

// ===== Rotating Tips Bubble (40px green circle, bottom-right) =====
const ROTATING_TIPS = [
  { icon: '\uD83C\uDF31', text: 'Clique sur le catalogue pour ajouter des plantes a ton jardin' },
  { icon: '\uD83D\uDCA7', text: 'Pince pour zoomer, glisse pour tourner autour du jardin' },
  { icon: '\uD83E\uDD1D', text: 'Certaines plantes poussent mieux ensemble ! Verifie le compagnonnage' },
  { icon: '\u2728', text: 'Ajoute des zones (serre, exterieur) pour organiser ton jardin !' },
  { icon: '\uD83C\uDF31', text: 'Semis : suis la croissance de tes graines en 3D' },
];

function TipBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex(i => (i + 1) % ROTATING_TIPS.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const tip = ROTATING_TIPS[tipIndex];

  return (
    <div style={{
      position: 'fixed',
      bottom: '80px',
      right: '16px',
      zIndex: 50,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: '8px',
    }}>
      {isOpen && (
        <div style={{
          width: '260px',
          maxWidth: '85vw',
          background: 'linear-gradient(135deg, #22c55e, #16a34a)',
          borderRadius: '16px',
          padding: '14px 16px',
          boxShadow: '0 8px 30px rgba(22, 163, 74, 0.35)',
          animation: 'tipBubbleIn 0.25s ease-out',
        }}>
          <div style={{
            fontFamily: '"Nunito", system-ui, sans-serif',
            fontSize: '13px',
            color: '#fff',
            lineHeight: '1.5',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
          }}>
            <span style={{ fontSize: '18px', flexShrink: 0 }}>{tip.icon}</span>
            <span>{tip.text}</span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '4px',
            marginTop: '10px',
          }}>
            {ROTATING_TIPS.map((_, i) => (
              <span key={i} style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: i === tipIndex ? '#fff' : 'rgba(255,255,255,0.4)',
                transition: 'background 0.3s',
              }} />
            ))}
          </div>
        </div>
      )}
      <button
        onClick={() => setIsOpen(v => !v)}
        aria-label="Conseil jardin"
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          border: 'none',
          background: 'linear-gradient(135deg, #22c55e, #16a34a)',
          boxShadow: '0 4px 20px rgba(22, 163, 74, 0.4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '22px',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          transform: isOpen ? 'scale(0.92)' : 'scale(1)',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)';
          (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 24px rgba(22, 163, 74, 0.5)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.transform = isOpen ? 'scale(0.92)' : 'scale(1)';
          (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(22, 163, 74, 0.4)';
        }}
      >
        {'\uD83C\uDF31'}
      </button>
      <style>{`
        @keyframes tipBubbleIn {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export function Garden3DView() {
  const { config, isLoaded, addPlant, removePlant, addRaisedBed, removeRaisedBed, updateRaisedBed, addZone, removeZone, updateZone, updateConfig } = useGarden();
  const { plants } = usePlants();
  const t = useTranslations('garden3d');
  const locale = useLocale();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draggingPlantId, setDraggingPlantId] = useState<string | null>(null);
  const [selectedPlantType, setSelectedPlantType] = useState<string | null>(null);
  const showSpacing = true;
  const [showRaisedBedPanel, setShowRaisedBedPanel] = useState(false);
  const [showZonePanel, setShowZonePanel] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedBedId, setSelectedBedId] = useState<string | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [infoPanelPlantIndex, setInfoPanelPlantIndex] = useState<number | null>(null);
  const [showSizeSelector, setShowSizeSelector] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  // Touch drag state
  const [touchDragPlantId, setTouchDragPlantId] = useState<string | null>(null);
  const [touchPos, setTouchPos] = useState<{ clientX: number; clientY: number } | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  // Variety picker state
  const [varietyPickerPlant, setVarietyPickerPlant] = useState<{ plantId: string; x: number; z: number; raisedBedId?: string; zoneId?: string } | null>(null);

  // Get the selected plant data for spacing info
  const selectedPlantData = useMemo(() => {
    if (!selectedPlantType) return null;
    return plants.find(p => p.id === selectedPlantType) || null;
  }, [selectedPlantType, plants]);

  // Detect mobile — used for 2D fallback (<768px) and label clip logic
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
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

  // Helper: place a plant or open the variety picker if it has varieties/zones/beds
  const placeOrPickVariety = useCallback(
    (plantId: string, x: number, z: number) => {
      const plantData = plants.find(p => p.id === plantId);
      if (plantData && (plantData.varieties?.length || (config.zones || []).length > 0 || (config.raisedBeds || []).length > 0)) {
        setVarietyPickerPlant({ plantId, x, z });
      } else {
        addPlant(plantId, x, z);
      }
    },
    [plants, config.zones, config.raisedBeds, addPlant]
  );

  const handleDrop = useCallback(
    (relX: number, relY: number) => {
      const plantId = draggingPlantId || selectedPlantType;
      if (!plantId) return;
      const pctX = relX * 100;
      const pctZ = relY * 100;
      const clampedX = Math.max(5, Math.min(95, pctX));
      const clampedZ = Math.max(5, Math.min(95, pctZ));
      placeOrPickVariety(plantId, clampedX, clampedZ);
      setIsDragging(false);
      setDraggingPlantId(null);
    },
    [draggingPlantId, selectedPlantType, placeOrPickVariety]
  );

  // Touch drag handlers for mobile
  const handleTouchDragStart = useCallback((plantId: string, touch: { clientX: number; clientY: number }) => {
    setTouchDragPlantId(plantId);
    setTouchPos(touch);
    setIsDragging(true);
    setDraggingPlantId(plantId);
  }, []);

  // Global touchmove/touchend for touch drag
  useEffect(() => {
    if (!touchDragPlantId) return;

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // Prevent scrolling while dragging
      const touch = e.touches[0];
      setTouchPos({ clientX: touch.clientX, clientY: touch.clientY });
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      // Calculate drop position relative to the canvas container
      if (canvasContainerRef.current) {
        const rect = canvasContainerRef.current.getBoundingClientRect();
        const relX = (touch.clientX - rect.left) / rect.width;
        const relY = (touch.clientY - rect.top) / rect.height;
        // Only drop if within bounds
        if (relX >= 0 && relX <= 1 && relY >= 0 && relY <= 1) {
          const pctX = relX * 100;
          const pctZ = relY * 100;
          const clampedX = Math.max(5, Math.min(95, pctX));
          const clampedZ = Math.max(5, Math.min(95, pctZ));
          placeOrPickVariety(touchDragPlantId, clampedX, clampedZ);
        }
      }
      setTouchDragPlantId(null);
      setTouchPos(null);
      setIsDragging(false);
      setDraggingPlantId(null);
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [touchDragPlantId, placeOrPickVariety]);

  // Determine info panel plant
  const infoPanelItem = infoPanelPlantIndex !== null ? config.plantedItems[infoPanelPlantIndex] : null;
  const infoPanelPlant = infoPanelItem ? plants.find(p => p.id === infoPanelItem.plantId) : null;

  // Variety picker plant data
  const varietyPickerPlantData = varietyPickerPlant ? plants.find(p => p.id === varietyPickerPlant.plantId) : null;

  if (!isLoaded) {
    return (
      <div className="h-[calc(100dvh-64px-68px)] md:h-[calc(100dvh-64px)] bg-[#F5F1E8] flex flex-col animate-pulse">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#C8DFC1]">
          <div className="h-8 w-20 bg-[#C8DFC1]/40 rounded-lg" />
          <div className="h-4 w-32 bg-[#C8DFC1]/30 rounded-md hidden sm:block" />
          <div className="ml-auto flex gap-2">
            {[1, 2, 3].map(i => <div key={i} className="h-8 w-16 bg-[#C8DFC1]/40 rounded-lg" />)}
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-[#C8DFC1] border-t-[#4A7C59] animate-spin" />
            <span className="text-sm text-[#4A7C59]/70">{t('loadingGarden')}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100dvh-64px-68px)] md:h-[calc(100dvh-64px)] bg-[#F5F1E8] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-2 sm:px-4 py-2 sm:py-3 border-b border-[#C8DFC1] bg-[#FDFAF4]/90 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link href="/garden/dashboard">
            <Button variant="ghost" size="sm" className="gap-1 sm:gap-2 px-2 sm:px-3">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{t('dashboard')}</span>
            </Button>
          </Link>
          <span className="text-xs sm:text-sm text-[#1B2B1A]/60 hidden sm:inline">
            {config.length}m x {config.width}m | {config.plantedItems.length} {t('plants')}
            {(config.raisedBeds || []).length > 0 && ` | ${(config.raisedBeds || []).length} ${t('beds')}`}
            {(config.zones || []).length > 0 && ` | ${(config.zones || []).length} ${t('zones')}`}
          </span>
          <span className="text-xs text-[#1B2B1A]/60 sm:hidden">
            {config.plantedItems.length} {t('plants')}
          </span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide ml-auto">
          {/* Add plant (Catalog) */}
          <button
            onClick={() => setIsSidebarOpen((v) => !v)}
            className="shrink-0 px-3 sm:px-4 py-1.5 text-xs font-medium rounded-lg border transition-all"
            style={{
              background: isSidebarOpen ? '#22c55e' : 'transparent',
              borderColor: isSidebarOpen ? '#16a34a' : 'rgba(74, 124, 89, 0.3)',
              color: isSidebarOpen ? '#fff' : '#4A7C59',
            }}
          >
            {'\uD83C\uDF3B'} <span className="hidden sm:inline">{t('catalog')}</span>
          </button>
          {/* 2D planner link */}
          <Link href="/garden/planner" className="shrink-0">
            <Button variant="secondary" size="sm" className="gap-1 sm:gap-2 px-2 sm:px-3">
              <Grid3x3 className="w-4 h-4" />
              <span className="hidden sm:inline">{t('planner2d')}</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Touch drag ghost — floating element that follows the finger */}
      {touchDragPlantId && touchPos && (() => {
        const dragPlant = plants.find(p => p.id === touchDragPlantId);
        return (
          <div
            style={{
              position: 'fixed',
              left: touchPos.clientX - 24,
              top: touchPos.clientY - 24,
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: dragPlant ? `radial-gradient(circle, ${dragPlant.color}CC, ${dragPlant.color})` : 'rgba(74, 222, 128, 0.8)',
              border: '3px solid rgba(255,255,255,0.4)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              zIndex: 9999,
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              transition: 'none',
            }}
          >
            {'\uD83C\uDF31'}
          </div>
        );
      })()}

      {/* 3D Canvas + Sidebar */}
      {/* On mobile with info panel open, clip the Three.js Html labels so they don't bleed over the bottom sheet */}
      <div
        ref={canvasContainerRef}
        className="flex-1 relative overflow-hidden"
        style={{
          touchAction: 'none',
          ...(isMobile && infoPanelPlant && infoPanelItem && !showSuggestions
            ? { clipPath: 'inset(0 0 var(--plant-panel-height) 0)' }
            : {}),
        }}
      >
        {/* Plant catalog sidebar — hidden on mobile when info panel is open */}
        <div className={infoPanelPlant && infoPanelItem && !showSuggestions ? 'sidebar-hidden-mobile' : ''}>
          <PlantCatalogSidebar
            plants={plants}
            isOpen={isSidebarOpen}
            onToggle={() => setIsSidebarOpen((v) => !v)}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onTouchDragStart={handleTouchDragStart}
            selectedPlantType={selectedPlantType}
            onSelectPlant={setSelectedPlantType}
          />
        </div>

        {/* Drag-and-drop overlay */}
        <DragDropOverlay isDragging={isDragging} onDrop={handleDrop} touchPosition={touchPos} />

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

        {/* Mobile: lightweight 2D top-down view — no Three.js overhead */}
        {isMobile ? (
          <Garden2DMobile
            config={config}
            plants={plants}
            selectedPlantType={selectedPlantType}
            showSpacing={showSpacing}
            onPlantSelect={(index) => {
              setInfoPanelPlantIndex(index);
              setShowRaisedBedPanel(false);
              setShowZonePanel(false);
              setShowSizeSelector(false);
            }}
          />
        ) : (
          <Suspense fallback={
            <div className="w-full h-full flex items-center justify-center bg-[#F5F1E8]">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-[#C8DFC1] border-t-[#4A7C59] animate-spin" />
                <span className="text-sm text-[#4A7C59]/70">{t('loading3d')}</span>
              </div>
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
        )}
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

      {/* Rotating tips bubble */}
      <TipBubble />
    </div>
  );
}
