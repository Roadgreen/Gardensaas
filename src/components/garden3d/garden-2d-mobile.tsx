'use client';

import { useState, useCallback, useMemo, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import type { GardenConfig, Plant } from '@/types';

interface Garden2DMobileProps {
  config: GardenConfig;
  plants: Plant[];
  selectedPlantType: string | null;
  showSpacing: boolean;
  onPlantSelect: (index: number) => void;
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

export function Garden2DMobile({ config, plants, selectedPlantType, showSpacing, onPlantSelect }: Garden2DMobileProps) {
  const t = useTranslations('garden3d');
  const locale = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Garden dimensions for the SVG viewBox
  const gardenL = config.length;
  const gardenW = config.width;
  // Add padding around the garden (in meters)
  const pad = 0.3;
  const viewW = gardenL + pad * 2;
  const viewH = gardenW + pad * 2;

  const handlePlantTap = useCallback((index: number) => {
    setSelectedIndex(prev => prev === index ? null : index);
    onPlantSelect(index);
  }, [onPlantSelect]);

  // Handle tap on empty ground to place a plant
  const handleGroundTap = useCallback((e: React.MouseEvent<SVGRectElement> | React.TouchEvent<SVGRectElement>) => {
    if (!selectedPlantType) return;
    const svg = (e.target as SVGElement).closest('svg');
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Convert screen coords to SVG coords
    const svgX = ((clientX - rect.left) / rect.width) * viewW - pad;
    const svgY = ((clientY - rect.top) / rect.height) * viewH - pad;

    // Convert to percentage coordinates
    const pctX = (svgX / gardenL) * 100;
    const pctZ = (svgY / gardenW) * 100;

    if (pctX < 0 || pctX > 100 || pctZ < 0 || pctZ > 100) return;

    const clampedX = Math.max(2, Math.min(98, pctX));
    const clampedZ = Math.max(2, Math.min(98, pctZ));

    // Dispatch the same event the 3D scene uses
    const event = new CustomEvent('garden:plant', {
      detail: { plantId: selectedPlantType, x: clampedX, z: clampedZ },
    });
    window.dispatchEvent(event);
  }, [selectedPlantType, gardenL, gardenW, viewW, viewH, pad]);

  // Grid lines for spacing visualization
  const gridLines = useMemo(() => {
    if (!showSpacing || !selectedPlantType) return null;
    const plant = plants.find(p => p.id === selectedPlantType);
    if (!plant) return null;
    const spacingM = plant.spacingCm / 100;
    const lines: React.ReactNode[] = [];
    // Vertical lines
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
    // Horizontal lines
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

  return (
    <div ref={containerRef} className="w-full h-full relative bg-[#0D1F17] overflow-hidden">
      {/* Mobile 2D label */}
      <div className="absolute top-2 left-2 z-10 px-2 py-1 rounded-md bg-green-900/50 text-green-300/80 text-[10px] font-medium backdrop-blur-sm">
        2D {locale === 'fr' ? 'Vue du dessus' : 'Top View'}
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

      <svg
        viewBox={`0 0 ${viewW} ${viewH}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        style={{ touchAction: 'manipulation' }}
      >
        {/* Background */}
        <rect x={0} y={0} width={viewW} height={viewH} fill="#1a3a2a" />

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

          // Plant size scales with growth
          const baseR = Math.max(0.08, (plantData.spacingCm / 100) * 0.35);
          const r = baseR * (0.4 + progress * 0.6);

          // Spacing ring
          const spacingR = plantData.spacingCm / 100 / 2;

          return (
            <g
              key={`plant-${index}`}
              onClick={() => handlePlantTap(index)}
              style={{ cursor: 'pointer' }}
            >
              {/* Spacing ring when showSpacing is on */}
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

              {/* Selection ring */}
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

              {/* Harvest glow */}
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

              {/* Plant circle */}
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill={plantData.color}
                stroke={isSelected ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.2)'}
                strokeWidth={isSelected ? 0.03 : 0.015}
                opacity={stage === 'seed' ? 0.5 : 0.85}
              />

              {/* Plant emoji/label */}
              <text
                x={cx}
                y={cy + 0.055}
                textAnchor="middle"
                fontSize={r * 1.4}
                pointerEvents="none"
              >
                {CATEGORY_EMOJI[plantData.category] || '\uD83C\uDF31'}
              </text>

              {/* Plant name label (only when selected) */}
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
