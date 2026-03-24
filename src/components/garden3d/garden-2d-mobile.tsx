'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import type { GardenConfig, Plant } from '@/types';

interface Garden2DMobileProps {
  config: GardenConfig;
  plants: Plant[];
  selectedPlantType: string | null;
  showSpacing: boolean;
  onPlantSelect: (index: number) => void;
}

// Placement pulse: tracks recently-placed plants for animation
interface PlacementPulse {
  x: number; // SVG coords
  y: number;
  color: string;
  id: number;
}

// Map plant categories to emoji icons for the 2D view
const CATEGORY_EMOJI: Record<string, string> = {
  vegetable: '\uD83E\uDD66',
  herb: '\uD83C\uDF3F',
  fruit: '\uD83C\uDF53',
  root: '\uD83E\uDD55',
  ancient: '\uD83C\uDF3E',
  exotic: '\uD83C\uDF34',
};

// Get growth stage based on planted date and harvest days
function getGrowthStage(plantedDate: string, harvestDays: number): { stage: string; progress: number } {
  const now = new Date();
  const planted = new Date(plantedDate);
  const daysPassed = Math.floor((now.getTime() - planted.getTime()) / (1000 * 60 * 60 * 24));
  const progress = Math.min(daysPassed / harvestDays, 1);

  if (progress >= 1) return { stage: 'harvest', progress: 1 };
  if (progress >= 0.6) return { stage: 'mature', progress };
  if (progress >= 0.3) return { stage: 'growing', progress };
  if (progress >= 0.1) return { stage: 'sprout', progress };
  return { stage: 'seed', progress };
}

// Distance between two touch points
function touchDistance(t1: { clientX: number; clientY: number }, t2: { clientX: number; clientY: number }): number {
  const dx = t1.clientX - t2.clientX;
  const dy = t1.clientY - t2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

// Midpoint of two touch points
function touchMidpoint(t1: { clientX: number; clientY: number }, t2: { clientX: number; clientY: number }): { x: number; y: number } {
  return { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;

export function Garden2DMobile({ config, plants, selectedPlantType, showSpacing, onPlantSelect }: Garden2DMobileProps) {
  const t = useTranslations('garden3d');
  const locale = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  // Cursor preview position (SVG coords) when a plant is selected for placement
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  // Placement pulse animations
  const [pulses, setPulses] = useState<PlacementPulse[]>([]);
  const pulseIdRef = useRef(0);

  // Garden dimensions for the SVG viewBox
  const gardenL = config.length;
  const gardenW = config.width;
  const pad = 0.3;
  const fullW = gardenL + pad * 2;
  const fullH = gardenW + pad * 2;

  // --- Zoom & pan state ---
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0); // in SVG units
  const [panY, setPanY] = useState(0);

  // Derived viewBox
  const vbW = fullW / zoom;
  const vbH = fullH / zoom;
  // Clamp pan so garden stays in view
  const maxPanX = Math.max(0, (fullW - vbW) / 2);
  const maxPanY = Math.max(0, (fullH - vbH) / 2);
  const clampedPanX = Math.max(-maxPanX, Math.min(maxPanX, panX));
  const clampedPanY = Math.max(-maxPanY, Math.min(maxPanY, panY));
  const vbX = (fullW - vbW) / 2 + clampedPanX;
  const vbY = (fullH - vbH) / 2 + clampedPanY;

  // --- Touch gesture tracking refs ---
  const gestureRef = useRef<{
    type: 'none' | 'pan' | 'pinch' | 'tap';
    startX: number;
    startY: number;
    startPanX: number;
    startPanY: number;
    startZoom: number;
    startDist: number;
    startMidX: number;
    startMidY: number;
    moved: boolean;
    lastTapTime: number;
  }>({
    type: 'none',
    startX: 0, startY: 0,
    startPanX: 0, startPanY: 0,
    startZoom: 1,
    startDist: 0,
    startMidX: 0, startMidY: 0,
    moved: false,
    lastTapTime: 0,
  });

  // Convert screen coordinates to SVG coordinates accounting for zoom/pan
  const screenToSvg = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const relX = (clientX - rect.left) / rect.width;
    const relY = (clientY - rect.top) / rect.height;
    return {
      x: vbX + relX * vbW,
      y: vbY + relY * vbH,
    };
  }, [vbX, vbY, vbW, vbH]);

  // Reset view
  const resetView = useCallback(() => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  }, []);

  // Zoom in/out with buttons
  const zoomIn = useCallback(() => {
    setZoom(z => Math.min(MAX_ZOOM, z * 1.4));
  }, []);
  const zoomOut = useCallback(() => {
    setZoom(z => {
      const newZ = Math.max(MIN_ZOOM, z / 1.4);
      if (newZ <= 1.05) { setPanX(0); setPanY(0); return 1; }
      return newZ;
    });
  }, []);

  // --- Touch event handlers ---
  const handleTouchStart = useCallback((e: React.TouchEvent<SVGSVGElement>) => {
    const g = gestureRef.current;
    const touches = e.touches;

    if (touches.length === 2) {
      // Pinch start
      e.preventDefault();
      const dist = touchDistance(touches[0], touches[1]);
      const mid = touchMidpoint(touches[0], touches[1]);
      g.type = 'pinch';
      g.startDist = dist;
      g.startZoom = zoom;
      g.startPanX = panX;
      g.startPanY = panY;
      g.startMidX = mid.x;
      g.startMidY = mid.y;
      g.moved = true;
    } else if (touches.length === 1) {
      // Could be tap or pan
      g.type = 'tap';
      g.startX = touches[0].clientX;
      g.startY = touches[0].clientY;
      g.startPanX = panX;
      g.startPanY = panY;
      g.startZoom = zoom;
      g.moved = false;
    }
  }, [zoom, panX, panY]);

  const handleTouchMove = useCallback((e: React.TouchEvent<SVGSVGElement>) => {
    const g = gestureRef.current;
    const touches = e.touches;

    if (touches.length === 2 && g.type === 'pinch') {
      e.preventDefault();
      const dist = touchDistance(touches[0], touches[1]);
      const scale = dist / g.startDist;
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, g.startZoom * scale));

      // Pan to keep the pinch midpoint stable
      const mid = touchMidpoint(touches[0], touches[1]);
      const svg = svgRef.current;
      if (svg) {
        const rect = svg.getBoundingClientRect();
        // How much the midpoint moved in screen pixels
        const dScreenX = mid.x - g.startMidX;
        const dScreenY = mid.y - g.startMidY;
        // Convert screen pixel delta to SVG unit delta at the NEW zoom level
        const svgPerPixelX = fullW / (newZoom * rect.width);
        const svgPerPixelY = fullH / (newZoom * rect.height);
        setZoom(newZoom);
        setPanX(g.startPanX - dScreenX * svgPerPixelX);
        setPanY(g.startPanY - dScreenY * svgPerPixelY);
      } else {
        setZoom(newZoom);
      }
      return;
    }

    if (touches.length === 1 && (g.type === 'tap' || g.type === 'pan')) {
      const dx = touches[0].clientX - g.startX;
      const dy = touches[0].clientY - g.startY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Once moved past threshold, switch to pan mode
      if (dist > 8) {
        g.moved = true;
        g.type = 'pan';

        // Only allow pan when zoomed in
        if (zoom > 1.05) {
          e.preventDefault();
          const svg = svgRef.current;
          if (svg) {
            const rect = svg.getBoundingClientRect();
            const svgPerPixelX = fullW / (zoom * rect.width);
            const svgPerPixelY = fullH / (zoom * rect.height);
            setPanX(g.startPanX - dx * svgPerPixelX);
            setPanY(g.startPanY - dy * svgPerPixelY);
          }
        }
      }
    }
  }, [zoom, fullW, fullH]);

  const handleTouchEnd = useCallback((e: React.TouchEvent<SVGSVGElement>) => {
    const g = gestureRef.current;

    // If it was a tap (no significant movement), check for double-tap or pass through
    if (g.type === 'tap' && !g.moved) {
      const now = Date.now();
      if (now - g.lastTapTime < 300) {
        // Double-tap: toggle zoom
        if (zoom > 1.2) {
          resetView();
        } else {
          // Zoom into the tap point
          const touch = e.changedTouches[0];
          const svgPt = screenToSvg(touch.clientX, touch.clientY);
          const targetZoom = 2.5;
          setZoom(targetZoom);
          // Center the view on the tapped point
          const newVbW = fullW / targetZoom;
          const newVbH = fullH / targetZoom;
          setPanX(svgPt.x - fullW / 2);
          setPanY(svgPt.y - fullH / 2);
        }
        g.lastTapTime = 0; // Reset to avoid triple-tap
      } else {
        g.lastTapTime = now;
      }
    }

    // If we go from 2 touches to 1, don't start a new pan
    if (e.touches.length === 0) {
      g.type = 'none';
    }
  }, [zoom, screenToSvg, resetView, fullW, fullH]);

  const handlePlantTap = useCallback((e: React.MouseEvent | React.TouchEvent, index: number) => {
    // Only handle if it was a real tap (not a pan gesture)
    const g = gestureRef.current;
    if (g.moved) return;
    e.stopPropagation();
    setSelectedIndex(prev => prev === index ? null : index);
    onPlantSelect(index);
  }, [onPlantSelect]);

  // Track cursor/touch position over garden for placement preview
  const handlePointerMove = useCallback((e: React.MouseEvent<SVGRectElement>) => {
    if (!selectedPlantType) { setCursorPos(null); return; }
    const svgPt = screenToSvg(e.clientX, e.clientY);
    const gx = svgPt.x - pad;
    const gy = svgPt.y - pad;
    if (gx >= 0 && gx <= gardenL && gy >= 0 && gy <= gardenW) {
      setCursorPos({ x: svgPt.x, y: svgPt.y });
    } else {
      setCursorPos(null);
    }
  }, [selectedPlantType, gardenL, gardenW, pad, screenToSvg]);

  const handlePointerLeave = useCallback(() => {
    setCursorPos(null);
  }, []);

  // Trigger a placement pulse animation at (svgX, svgY)
  const triggerPulse = useCallback((svgX: number, svgY: number, color: string) => {
    const id = ++pulseIdRef.current;
    setPulses(prev => [...prev, { x: svgX, y: svgY, color, id }]);
    setTimeout(() => {
      setPulses(prev => prev.filter(p => p.id !== id));
    }, 700);
  }, []);

  // Handle tap on empty ground to place a plant
  const handleGroundTap = useCallback((e: React.MouseEvent<SVGRectElement> | React.TouchEvent<SVGRectElement>) => {
    // Don't plant if we were panning/pinching
    const g = gestureRef.current;
    if (g.moved) return;

    if (!selectedPlantType) return;

    let clientX: number, clientY: number;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      return;
    }

    const svgPt = screenToSvg(clientX, clientY);

    // Convert SVG coords to garden percentage
    const gardenX = svgPt.x - pad;
    const gardenY = svgPt.y - pad;
    const pctX = (gardenX / gardenL) * 100;
    const pctZ = (gardenY / gardenW) * 100;

    if (pctX < 0 || pctX > 100 || pctZ < 0 || pctZ > 100) return;

    const clampedX = Math.max(2, Math.min(98, pctX));
    const clampedZ = Math.max(2, Math.min(98, pctZ));

    // Get plant color for pulse
    const plantData = plants.find(p => p.id === selectedPlantType);
    if (plantData) {
      triggerPulse(svgPt.x, svgPt.y, plantData.color);
    }

    const event = new CustomEvent('garden:plant', {
      detail: { plantId: selectedPlantType, x: clampedX, z: clampedZ },
    });
    window.dispatchEvent(event);
  }, [selectedPlantType, gardenL, gardenW, pad, screenToSvg, plants, triggerPulse]);

  // Companion / enemy plant relationship lines + spacing conflicts
  const { companionLines, enemyLines, conflictLines } = useMemo(() => {
    if (!showSpacing) return { companionLines: [] as React.ReactNode[], enemyLines: [] as React.ReactNode[], conflictLines: [] as React.ReactNode[] };
    const companions: React.ReactNode[] = [];
    const enemies: React.ReactNode[] = [];
    const conflicts: React.ReactNode[] = [];

    config.plantedItems.forEach((item, i) => {
      const plantA = plants.find(p => p.id === item.plantId);
      if (!plantA) return;
      const ax = (item.x / 100) * gardenL + pad;
      const ay = (item.z / 100) * gardenW + pad;
      const spacingA = plantA.spacingCm / 100 / 2;

      config.plantedItems.forEach((other, j) => {
        if (i >= j) return;
        const plantB = plants.find(p => p.id === other.plantId);
        if (!plantB) return;
        const bx = (other.x / 100) * gardenL + pad;
        const by = (other.z / 100) * gardenW + pad;
        const dist = Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);

        // Only show relationships for nearby plants (within 2m equivalent)
        if (dist > 2) return;

        // Spacing conflict
        const requiredDist = (plantA.spacingCm + plantB.spacingCm) / 100 / 2;
        if (dist < requiredDist) {
          conflicts.push(
            <line
              key={`conflict-${i}-${j}`}
              x1={ax} y1={ay} x2={bx} y2={by}
              stroke="rgba(239, 68, 68, 0.6)"
              strokeWidth={0.025}
              strokeDasharray="0.04 0.03"
            />
          );
        }

        // Companion plants — green line
        if (plantA.companionPlants.includes(plantB.id) || plantB.companionPlants.includes(plantA.id)) {
          companions.push(
            <line
              key={`companion-${i}-${j}`}
              x1={ax} y1={ay} x2={bx} y2={by}
              stroke="rgba(74, 222, 128, 0.4)"
              strokeWidth={0.02}
            />
          );
        }

        // Enemy plants — red dashed line
        if (plantA.enemyPlants.includes(plantB.id) || plantB.enemyPlants.includes(plantA.id)) {
          enemies.push(
            <g key={`enemy-${i}-${j}`}>
              <line
                x1={ax} y1={ay} x2={bx} y2={by}
                stroke="rgba(239, 68, 68, 0.5)"
                strokeWidth={0.025}
                strokeDasharray="0.06 0.03"
              />
              <text
                x={(ax + bx) / 2}
                y={(ay + by) / 2 - 0.06}
                textAnchor="middle"
                fill="rgba(239, 68, 68, 0.9)"
                fontSize={0.12}
                fontFamily="system-ui, sans-serif"
              >
                {'\u26A0'}
              </text>
            </g>
          );
        }
      });
    });
    return { companionLines: companions, enemyLines: enemies, conflictLines: conflicts };
  }, [showSpacing, config.plantedItems, plants, gardenL, gardenW, pad]);

  // Grid lines for spacing visualization
  const gridLines = useMemo(() => {
    if (!showSpacing || !selectedPlantType) return null;
    const plant = plants.find(p => p.id === selectedPlantType);
    if (!plant) return null;
    const spacingM = plant.spacingCm / 100;
    const lines: React.ReactNode[] = [];
    for (let x = 0; x <= gardenL; x += spacingM) {
      lines.push(
        <line
          key={`v-${x}`}
          x1={x + pad}
          y1={pad}
          x2={x + pad}
          y2={gardenW + pad}
          stroke="rgba(168, 85, 247, 0.2)"
          strokeWidth={0.02}
          strokeDasharray="0.05 0.05"
        />
      );
    }
    for (let y = 0; y <= gardenW; y += spacingM) {
      lines.push(
        <line
          key={`h-${y}`}
          x1={pad}
          y1={y + pad}
          x2={gardenL + pad}
          y2={y + pad}
          stroke="rgba(168, 85, 247, 0.2)"
          strokeWidth={0.02}
          strokeDasharray="0.05 0.05"
        />
      );
    }
    return lines;
  }, [showSpacing, selectedPlantType, plants, gardenL, gardenW, pad]);

  // Compute enemy warnings for placement preview cursor
  const cursorEnemyWarnings = useMemo(() => {
    if (!cursorPos || !selectedPlantType) return [];
    const placingPlant = plants.find(p => p.id === selectedPlantType);
    if (!placingPlant) return [];

    const warnings: { name: string }[] = [];
    const curGardenX = cursorPos.x - pad;
    const curGardenY = cursorPos.y - pad;

    config.plantedItems.forEach((item) => {
      const existingPlant = plants.find(p => p.id === item.plantId);
      if (!existingPlant) return;
      const ex = (item.x / 100) * gardenL;
      const ey = (item.z / 100) * gardenW;
      const dist = Math.sqrt((curGardenX - ex) ** 2 + (curGardenY - ey) ** 2);
      if (dist > 1.5) return; // Only warn for nearby plants
      if (placingPlant.enemyPlants.includes(existingPlant.id) || existingPlant.enemyPlants.includes(placingPlant.id)) {
        warnings.push({ name: locale === 'fr' ? existingPlant.name.fr : existingPlant.name.en });
      }
    });
    return warnings;
  }, [cursorPos, selectedPlantType, plants, config.plantedItems, gardenL, gardenW, pad, locale]);

  const isZoomed = zoom > 1.05;

  return (
    <div ref={containerRef} className="w-full h-full relative bg-[#0D1F17] overflow-hidden">
      {/* Mobile 2D label */}
      <div className="absolute top-2 left-2 z-10 px-2 py-1 rounded-md bg-green-900/50 text-green-300/80 text-[10px] font-medium backdrop-blur-sm">
        2D {locale === 'fr' ? 'Vue du dessus' : 'Top View'}
        {isZoomed && <span className="ml-1 text-green-400/60">{zoom.toFixed(1)}x</span>}
      </div>

      {/* Placement mode indicator */}
      {selectedPlantType && (() => {
        const plant = plants.find(p => p.id === selectedPlantType);
        return plant ? (
          <div className="absolute top-2 right-2 z-10 px-2 py-1 rounded-md bg-purple-900/50 text-purple-300/80 text-[10px] font-medium backdrop-blur-sm flex items-center gap-1">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: plant.color }} />
            {locale === 'fr' ? 'Tapez pour planter' : 'Tap to plant'}
          </div>
        ) : null;
      })()}

      {/* Companion/enemy legend */}
      {showSpacing && (companionLines.length > 0 || enemyLines.length > 0 || conflictLines.length > 0) && (
        <div className="absolute bottom-3 left-3 z-10 px-2 py-1.5 rounded-md bg-black/50 backdrop-blur-sm text-[9px] flex flex-col gap-0.5">
          {companionLines.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-[2px] bg-green-400 rounded-full inline-block" />
              <span className="text-green-300/80">{locale === 'fr' ? 'Compagnons' : 'Companions'}</span>
            </div>
          )}
          {enemyLines.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-[2px] bg-red-400 rounded-full inline-block" style={{ borderTop: '1px dashed rgba(239,68,68,0.8)' }} />
              <span className="text-red-300/80">{locale === 'fr' ? 'Ennemis' : 'Enemies'}</span>
            </div>
          )}
          {conflictLines.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-[2px] rounded-full inline-block" style={{ borderTop: '2px dashed rgba(239,68,68,0.6)' }} />
              <span className="text-orange-300/80">{locale === 'fr' ? 'Trop proches' : 'Too close'}</span>
            </div>
          )}
        </div>
      )}

      {/* Zoom controls */}
      <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-1.5">
        <button
          onClick={zoomIn}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-green-900/60 text-green-300/90 backdrop-blur-sm border border-green-700/30 active:bg-green-800/60 transition-colors"
          aria-label={locale === 'fr' ? 'Zoom avant' : 'Zoom in'}
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={zoomOut}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-green-900/60 text-green-300/90 backdrop-blur-sm border border-green-700/30 active:bg-green-800/60 transition-colors"
          aria-label={locale === 'fr' ? 'Zoom arrière' : 'Zoom out'}
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        {isZoomed && (
          <button
            onClick={resetView}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-green-900/60 text-green-300/90 backdrop-blur-sm border border-green-700/30 active:bg-green-800/60 transition-colors"
            aria-label={locale === 'fr' ? 'Réinitialiser la vue' : 'Reset view'}
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Gesture hint — shown briefly on first load */}
      <GestureHint locale={locale} />

      <svg
        ref={svgRef}
        viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        style={{ touchAction: 'none' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Background */}
        <rect x={0} y={0} width={fullW} height={fullH} fill="#1a3a2a" />

        {/* Garden area — grass */}
        <rect
          x={pad}
          y={pad}
          width={gardenL}
          height={gardenW}
          fill="#2d5a3a"
          stroke="rgba(74, 222, 128, 0.3)"
          strokeWidth={0.03}
          rx={0.05}
          onClick={handleGroundTap}
          onMouseMove={handlePointerMove}
          onMouseLeave={handlePointerLeave}
          style={{ cursor: selectedPlantType ? 'crosshair' : 'default' }}
        />

        {/* Garden grid pattern for visual texture */}
        <defs>
          <pattern id="grassPattern" x={pad} y={pad} width={0.5} height={0.5} patternUnits="userSpaceOnUse">
            <circle cx={0.15} cy={0.15} r={0.02} fill="rgba(74, 222, 128, 0.08)" />
            <circle cx={0.4} cy={0.35} r={0.015} fill="rgba(74, 222, 128, 0.06)" />
          </pattern>
        </defs>
        <rect x={pad} y={pad} width={gardenL} height={gardenW} fill="url(#grassPattern)" pointerEvents="none" />

        {/* Spacing grid lines */}
        {gridLines}

        {/* Companion / enemy / conflict relationship lines */}
        {companionLines}
        {enemyLines}
        {conflictLines}

        {/* Raised beds */}
        {(config.raisedBeds || []).map((bed) => {
          const cx = (bed.x / 100) * gardenL + pad;
          const cy = (bed.z / 100) * gardenW + pad;
          return (
            <g key={bed.id}>
              <rect
                x={cx - bed.lengthM / 2}
                y={cy - bed.widthM / 2}
                width={bed.lengthM}
                height={bed.widthM}
                fill="rgba(180, 120, 60, 0.3)"
                stroke="rgba(210, 160, 108, 0.6)"
                strokeWidth={0.04}
                rx={0.05}
              />
              <text
                x={cx}
                y={cy - bed.widthM / 2 - 0.08}
                textAnchor="middle"
                fill="rgba(210, 160, 108, 0.8)"
                fontSize={0.18}
                fontFamily="system-ui, sans-serif"
              >
                {bed.name || (locale === 'fr' ? 'Bac' : 'Bed')}
              </text>
            </g>
          );
        })}

        {/* Zones */}
        {(config.zones || []).map((zone) => {
          const cx = (zone.x / 100) * gardenL + pad;
          const cy = (zone.z / 100) * gardenW + pad;
          return (
            <g key={zone.id}>
              <rect
                x={cx - zone.lengthM / 2}
                y={cy - zone.widthM / 2}
                width={zone.lengthM}
                height={zone.widthM}
                fill={`${zone.color}15`}
                stroke={`${zone.color}80`}
                strokeWidth={0.03}
                strokeDasharray="0.1 0.05"
                rx={0.03}
              />
              <text
                x={cx}
                y={cy - zone.widthM / 2 - 0.08}
                textAnchor="middle"
                fill={`${zone.color}CC`}
                fontSize={0.16}
                fontFamily="system-ui, sans-serif"
              >
                {zone.name}
              </text>
            </g>
          );
        })}

        {/* Plants */}
        {config.plantedItems.map((item, index) => {
          const plantData = plants.find(p => p.id === item.plantId);
          if (!plantData) return null;

          const cx = (item.x / 100) * gardenL + pad;
          const cy = (item.z / 100) * gardenW + pad;
          const { stage, progress } = getGrowthStage(item.plantedDate, plantData.harvestDays);
          const isSelected = selectedIndex === index;
          const isHarvestReady = stage === 'harvest';

          const baseR = Math.max(0.08, (plantData.spacingCm / 100) * 0.35);
          const r = baseR * (0.4 + progress * 0.6);
          const spacingR = plantData.spacingCm / 100 / 2;

          return (
            <g
              key={`plant-${index}`}
              onClick={(e) => handlePlantTap(e, index)}
              style={{ cursor: 'pointer' }}
            >
              {showSpacing && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={spacingR}
                  fill="none"
                  stroke={`${plantData.color}30`}
                  strokeWidth={0.015}
                  strokeDasharray="0.04 0.03"
                />
              )}

              {isSelected && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={r + 0.06}
                  fill="none"
                  stroke="rgba(74, 222, 128, 0.8)"
                  strokeWidth={0.025}
                >
                  <animate attributeName="r" values={`${r + 0.05};${r + 0.09};${r + 0.05}`} dur="1.5s" repeatCount="indefinite" />
                </circle>
              )}

              {isHarvestReady && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={r + 0.04}
                  fill="none"
                  stroke="rgba(251, 191, 36, 0.6)"
                  strokeWidth={0.02}
                >
                  <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite" />
                </circle>
              )}

              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill={plantData.color}
                stroke={isSelected ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.2)'}
                strokeWidth={isSelected ? 0.03 : 0.015}
                opacity={stage === 'seed' ? 0.5 : 0.85}
              />

              {/* Growth progress arc — shows % to harvest */}
              {progress > 0 && progress < 1 && (
                <GrowthArc cx={cx} cy={cy} r={r + 0.035} progress={progress} />
              )}

              <text
                x={cx}
                y={cy + 0.055}
                textAnchor="middle"
                fontSize={r * 1.4}
                pointerEvents="none"
              >
                {CATEGORY_EMOJI[plantData.category] || '\uD83C\uDF31'}
              </text>

              {/* Always-visible compact plant label */}
              <text
                x={cx}
                y={cy + r + 0.14}
                textAnchor="middle"
                fill={isSelected ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.7)'}
                fontSize={isSelected ? 0.13 : 0.1}
                fontFamily="system-ui, sans-serif"
                fontWeight={isSelected ? 'bold' : 'normal'}
                pointerEvents="none"
              >
                {(() => {
                  const name = locale === 'fr' ? plantData.name.fr : plantData.name.en;
                  // Show variety name if available
                  if (item.varietyId) {
                    const variety = plantData.varieties?.find(v => v.id === item.varietyId);
                    if (variety) return locale === 'fr' ? variety.name.fr : variety.name.en;
                  }
                  return name.length > 10 ? name.slice(0, 9) + '…' : name;
                })()}
              </text>

              {isSelected && (
                <text
                  x={cx}
                  y={cy - r - 0.1}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.9)"
                  fontSize={0.16}
                  fontFamily="system-ui, sans-serif"
                  fontWeight="bold"
                >
                  {locale === 'fr' ? plantData.name.fr : plantData.name.en}
                </text>
              )}
            </g>
          );
        })}

        {/* Placement cursor preview — ghost plant following mouse/touch */}
        {cursorPos && selectedPlantType && (() => {
          const previewPlant = plants.find(p => p.id === selectedPlantType);
          if (!previewPlant) return null;
          const previewR = Math.max(0.08, (previewPlant.spacingCm / 100) * 0.35) * 0.6;
          const hasEnemyWarning = cursorEnemyWarnings.length > 0;
          return (
            <g pointerEvents="none">
              {/* Highlight circle — light green tint for valid, red for enemy */}
              <circle
                cx={cursorPos.x}
                cy={cursorPos.y}
                r={previewR + 0.08}
                fill={hasEnemyWarning ? 'rgba(239, 68, 68, 0.08)' : 'rgba(74, 222, 128, 0.08)'}
                stroke={hasEnemyWarning ? 'rgba(239, 68, 68, 0.4)' : 'rgba(74, 222, 128, 0.4)'}
                strokeWidth={0.015}
                strokeDasharray="0.04 0.03"
              />
              {/* Ghost plant circle */}
              <circle
                cx={cursorPos.x}
                cy={cursorPos.y}
                r={previewR}
                fill={previewPlant.color}
                opacity={0.5}
                stroke="rgba(255,255,255,0.3)"
                strokeWidth={0.015}
              />
              {/* Plant emoji */}
              <text
                x={cursorPos.x}
                y={cursorPos.y + 0.045}
                textAnchor="middle"
                fontSize={previewR * 1.4}
                opacity={0.6}
              >
                {CATEGORY_EMOJI[previewPlant.category] || '\uD83C\uDF31'}
              </text>
              {/* Plant name label */}
              <text
                x={cursorPos.x}
                y={cursorPos.y - previewR - 0.06}
                textAnchor="middle"
                fill="rgba(134, 239, 172, 0.8)"
                fontSize={0.11}
                fontFamily="system-ui, sans-serif"
              >
                {locale === 'fr' ? previewPlant.name.fr : previewPlant.name.en}
              </text>
              {/* Enemy warning icon */}
              {hasEnemyWarning && (
                <g>
                  <text
                    x={cursorPos.x + previewR + 0.06}
                    y={cursorPos.y + 0.04}
                    textAnchor="start"
                    fill="rgba(239, 68, 68, 0.9)"
                    fontSize={0.16}
                    fontFamily="system-ui, sans-serif"
                  >
                    {'\u26A0'}
                  </text>
                  <text
                    x={cursorPos.x}
                    y={cursorPos.y + previewR + 0.18}
                    textAnchor="middle"
                    fill="rgba(239, 68, 68, 0.8)"
                    fontSize={0.08}
                    fontFamily="system-ui, sans-serif"
                  >
                    {cursorEnemyWarnings.map(w => w.name).join(', ')}
                  </text>
                </g>
              )}
            </g>
          );
        })()}

        {/* Placement pulse animations */}
        {pulses.map((pulse) => (
          <g key={`pulse-${pulse.id}`} pointerEvents="none">
            <circle
              cx={pulse.x}
              cy={pulse.y}
              r={0.05}
              fill={pulse.color}
              opacity={0}
            >
              <animate attributeName="r" from="0.05" to="0.35" dur="0.6s" fill="freeze" />
              <animate attributeName="opacity" values="0.6;0.3;0" dur="0.6s" fill="freeze" />
            </circle>
            <circle
              cx={pulse.x}
              cy={pulse.y}
              r={0.05}
              fill="none"
              stroke={pulse.color}
              strokeWidth={0.02}
              opacity={0}
            >
              <animate attributeName="r" from="0.08" to="0.5" dur="0.7s" fill="freeze" />
              <animate attributeName="opacity" values="0.8;0.2;0" dur="0.7s" fill="freeze" />
            </circle>
          </g>
        ))}

        {/* Dimension labels */}
        <text
          x={pad + gardenL / 2}
          y={gardenW + pad + 0.22}
          textAnchor="middle"
          fill="rgba(134, 239, 172, 0.6)"
          fontSize={0.16}
          fontFamily="system-ui, sans-serif"
        >
          {'\u2194'} {gardenL}m
        </text>
        <text
          x={gardenL + pad + 0.22}
          y={pad + gardenW / 2}
          textAnchor="middle"
          fill="rgba(134, 239, 172, 0.6)"
          fontSize={0.16}
          fontFamily="system-ui, sans-serif"
          transform={`rotate(90 ${gardenL + pad + 0.22} ${pad + gardenW / 2})`}
        >
          {'\u2195'} {gardenW}m
        </text>
      </svg>
    </div>
  );
}

// SVG arc for growth progress around a plant
function GrowthArc({ cx, cy, r, progress }: { cx: number; cy: number; r: number; progress: number }) {
  // Draw arc from 12 o'clock position clockwise
  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + progress * 2 * Math.PI;
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const largeArc = progress > 0.5 ? 1 : 0;

  // Color transitions: green early, yellow mid, bright green near harvest
  const color = progress < 0.3
    ? 'rgba(74, 222, 128, 0.5)'
    : progress < 0.7
      ? 'rgba(250, 204, 21, 0.6)'
      : 'rgba(34, 197, 94, 0.8)';

  return (
    <path
      d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
      fill="none"
      stroke={color}
      strokeWidth={0.02}
      strokeLinecap="round"
      pointerEvents="none"
    />
  );
}

// Ephemeral hint that fades out after 3s — teaches pinch/pan gestures
function GestureHint({ locale }: { locale: string }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 rounded-full bg-black/60 text-white/80 text-[11px] backdrop-blur-sm pointer-events-none animate-pulse whitespace-nowrap">
      {locale === 'fr' ? 'Pincez pour zoomer \u2022 Glissez pour naviguer' : 'Pinch to zoom \u2022 Drag to pan'}
    </div>
  );
}
