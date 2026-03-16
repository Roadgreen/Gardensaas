'use client';

import { useMemo } from 'react';
import type { Plant, PlantedItem, RaisedBed } from '@/types';
import { RAISED_BED_SOIL_LABELS } from '@/types';

interface PlantInfoPanelProps {
  plant: Plant;
  plantedDate: string;
  allPlants: Plant[];
  plantedItems?: PlantedItem[];
  gardenLength?: number;
  gardenWidth?: number;
  raisedBedId?: string;
  raisedBeds?: RaisedBed[];
  onClose: () => void;
  onRemove?: () => void;
}

const SUN_ICONS: Record<string, string> = {
  'full-sun': '\u2600\uFE0F',
  'partial-shade': '\u26C5',
  'full-shade': '\uD83C\uDF27\uFE0F',
};

const SUN_LABELS: Record<string, string> = {
  'full-sun': 'Full Sun (6+ hrs)',
  'partial-shade': 'Partial Shade (3-6 hrs)',
  'full-shade': 'Full Shade (<3 hrs)',
};

const WATER_LABELS: Record<string, string> = {
  'daily': 'Daily',
  'every-2-days': 'Every 2 days',
  'twice-weekly': 'Twice weekly',
  'weekly': 'Weekly',
};

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function PlantInfoPanel({ plant, plantedDate, allPlants, plantedItems, gardenLength, gardenWidth, raisedBedId, raisedBeds, onClose, onRemove }: PlantInfoPanelProps) {
  const daysPlanted = useMemo(() => {
    const now = new Date();
    const planted = new Date(plantedDate);
    return Math.floor((now.getTime() - planted.getTime()) / (1000 * 60 * 60 * 24));
  }, [plantedDate]);

  const progress = Math.min(daysPlanted / plant.harvestDays, 1);
  const isHarvest = progress >= 1;

  const rowSpacing = plant.rowSpacingCm || Math.round(plant.spacingCm * 1.5);

  const companionNames = useMemo(() =>
    plant.companionPlants.map((id) => {
      const p = allPlants.find((ap) => ap.id === id);
      return p ? p.name.en : id;
    }),
  [plant.companionPlants, allPlants]);

  const enemyNames = useMemo(() =>
    plant.enemyPlants.map((id) => {
      const p = allPlants.find((ap) => ap.id === id);
      return p ? p.name.en : id;
    }),
  [plant.enemyPlants, allPlants]);

  const plantingMonthsStr = useMemo(() =>
    plant.plantingMonths.map((m) => MONTH_SHORT[m - 1]).join(', '),
  [plant.plantingMonths]);

  // Compute nearby plants and warnings
  const nearbyAnalysis = useMemo(() => {
    if (!plantedItems || !gardenLength || !gardenWidth) return null;

    // Find this plant's position
    const thisItem = plantedItems.find(
      (item) => item.plantId === plant.id && item.plantedDate === plantedDate
    );
    if (!thisItem) return null;

    const halfL = gardenLength / 2;
    const halfW = gardenWidth / 2;
    const thisX = -halfL + (thisItem.x / 100) * gardenLength;
    const thisZ = -halfW + (thisItem.z / 100) * gardenWidth;

    const nearby: Array<{ name: string; distance: number; isCompanion: boolean; isEnemy: boolean; tooClose: boolean }> = [];

    plantedItems.forEach((item) => {
      if (item === thisItem) return;
      const otherPlant = allPlants.find((p) => p.id === item.plantId);
      if (!otherPlant) return;

      const otherX = -halfL + (item.x / 100) * gardenLength;
      const otherZ = -halfW + (item.z / 100) * gardenWidth;
      const distance = Math.sqrt((thisX - otherX) ** 2 + (thisZ - otherZ) ** 2);

      if (distance < 2) {
        const requiredDist = (plant.spacingCm + otherPlant.spacingCm) / 100 / 2;
        nearby.push({
          name: otherPlant.name.en,
          distance: Math.round(distance * 100),
          isCompanion: plant.companionPlants.includes(otherPlant.id),
          isEnemy: plant.enemyPlants.includes(otherPlant.id),
          tooClose: distance < requiredDist,
        });
      }
    });

    return nearby;
  }, [plantedItems, gardenLength, gardenWidth, plant, plantedDate, allPlants]);

  return (
    <div
      style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        zIndex: 50,
        width: '340px',
        maxHeight: 'calc(100vh - 120px)',
        overflowY: 'auto',
        background: 'linear-gradient(145deg, rgba(10, 30, 18, 0.97), rgba(15, 45, 25, 0.97))',
        backdropFilter: 'blur(16px)',
        borderRadius: '16px',
        border: '2px solid rgba(74, 222, 128, 0.4)',
        padding: '20px',
        fontFamily: '"Nunito", system-ui, sans-serif',
        color: 'white',
        boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(74, 222, 128, 0.3) transparent',
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: 'rgba(255,255,255,0.1)',
          border: 'none',
          borderRadius: '8px',
          color: '#9CA3AF',
          cursor: 'pointer',
          padding: '4px 8px',
          fontSize: '14px',
          fontFamily: '"Nunito", system-ui, sans-serif',
        }}
      >
        {'\u2715'}
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '12px',
          background: `linear-gradient(135deg, ${plant.color}, ${plant.color}88)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid rgba(255,255,255,0.2)',
          fontSize: '24px',
        }}>
          {plant.category === 'vegetable' ? '\uD83E\uDD66' :
           plant.category === 'herb' ? '\uD83C\uDF3F' :
           plant.category === 'fruit' ? '\uD83C\uDF53' :
           plant.category === 'root' ? '\uD83E\uDD55' : '\uD83C\uDF31'}
        </div>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#86EFAC' }}>
            {plant.name.en}
          </div>
          <div style={{ fontSize: '13px', color: '#6EE7B7', opacity: 0.7 }}>
            {plant.name.fr}
          </div>
          <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px', textTransform: 'capitalize' }}>
            {plant.category} - {plant.difficulty}
          </div>
        </div>
      </div>

      {/* Description */}
      <div style={{
        fontSize: '12px', color: '#D1D5DB', lineHeight: '1.5',
        padding: '10px', borderRadius: '10px',
        background: 'rgba(0,0,0,0.2)',
        marginBottom: '14px',
      }}>
        {plant.description.en}
      </div>

      {/* Raised bed indicator */}
      {raisedBedId && raisedBeds && (() => {
        const bed = raisedBeds.find(b => b.id === raisedBedId);
        if (!bed) return null;
        return (
          <div style={{
            marginBottom: '14px', padding: '10px', borderRadius: '10px',
            background: 'rgba(210, 160, 108, 0.1)',
            border: '1px solid rgba(210, 160, 108, 0.25)',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <span style={{ fontSize: '16px' }}>{'\uD83E\uDDF1'}</span>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#D4A06C' }}>
                Planted in: {bed.name}
              </div>
              <div style={{ fontSize: '9px', color: '#9CA3AF' }}>
                {bed.lengthM}x{bed.widthM}m - {RAISED_BED_SOIL_LABELS[bed.soilType]}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Progress bar */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '11px', color: '#9CA3AF' }}>Growth Progress</span>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: isHarvest ? '#FFD700' : '#4ADE80' }}>
            {Math.round(progress * 100)}% - Day {daysPlanted}/{plant.harvestDays}
          </span>
        </div>
        <div style={{
          background: '#1F2937', borderRadius: '6px', height: '8px', overflow: 'hidden',
        }}>
          <div style={{
            background: isHarvest
              ? 'linear-gradient(90deg, #FFD700, #FFA500)'
              : 'linear-gradient(90deg, #4ADE80, #22C55E)',
            height: '100%',
            width: `${Math.min(progress * 100, 100)}%`,
            borderRadius: '6px',
            transition: 'width 0.3s',
          }} />
        </div>
      </div>

      {/* Spacing info - prominent section */}
      <div style={{
        marginBottom: '14px', padding: '12px', borderRadius: '12px',
        background: 'rgba(168, 85, 247, 0.08)',
        border: '1px solid rgba(168, 85, 247, 0.25)',
      }}>
        <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#C084FC', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {'\uD83D\uDCCF'} Spacing Requirements
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div style={{
            padding: '8px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.1)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#C084FC' }}>{plant.spacingCm} cm</div>
            <div style={{ fontSize: '9px', color: '#9CA3AF' }}>Between plants</div>
          </div>
          <div style={{
            padding: '8px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.1)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#A78BFA' }}>{rowSpacing} cm</div>
            <div style={{ fontSize: '9px', color: '#9CA3AF' }}>Between rows</div>
          </div>
        </div>
        <div style={{ marginTop: '6px', fontSize: '10px', color: '#9CA3AF', textAlign: 'center' }}>
          Plant depth: {plant.depthCm} cm | Max height: {plant.heightCm} cm
        </div>
      </div>

      {/* Sun & Water needs */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px',
        marginBottom: '14px',
      }}>
        <div style={{
          padding: '10px', borderRadius: '10px',
          background: 'rgba(251, 191, 36, 0.08)',
          border: '1px solid rgba(251, 191, 36, 0.15)',
        }}>
          <div style={{ fontSize: '18px', marginBottom: '4px' }}>
            {SUN_ICONS[plant.sunExposure[0]] || '\u2600\uFE0F'}
          </div>
          <div style={{ fontSize: '9px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sun needs</div>
          <div style={{ fontSize: '11px', color: '#FBBF24', fontWeight: 'bold' }}>
            {plant.sunExposure.map(s => SUN_LABELS[s] || s.replace(/-/g, ' ')).join(', ')}
          </div>
        </div>
        <div style={{
          padding: '10px', borderRadius: '10px',
          background: 'rgba(96, 165, 250, 0.08)',
          border: '1px solid rgba(96, 165, 250, 0.15)',
        }}>
          <div style={{ fontSize: '18px', marginBottom: '4px' }}>{'\uD83D\uDCA7'}</div>
          <div style={{ fontSize: '9px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Watering</div>
          <div style={{ fontSize: '11px', color: '#60A5FA', fontWeight: 'bold' }}>
            {WATER_LABELS[plant.wateringFrequency] || plant.wateringFrequency.replace(/-/g, ' ')}
          </div>
        </div>
      </div>

      {/* Nearby plant analysis */}
      {nearbyAnalysis && nearbyAnalysis.length > 0 && (
        <div style={{
          marginBottom: '14px', padding: '10px', borderRadius: '10px',
          background: 'rgba(0,0,0,0.15)',
          border: '1px solid rgba(255,255,255,0.05)',
        }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#9CA3AF', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {'\uD83D\uDC40'} Nearby Plants
          </div>
          {nearbyAnalysis.map((n, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '4px 8px', borderRadius: '6px', marginBottom: '3px',
              background: n.isEnemy ? 'rgba(239, 68, 68, 0.1)' : n.isCompanion ? 'rgba(74, 222, 128, 0.1)' : 'transparent',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px' }}>
                  {n.isEnemy ? '\u26A0\uFE0F' : n.isCompanion ? '\uD83E\uDD1D' : '\uD83C\uDF31'}
                </span>
                <span style={{
                  fontSize: '11px',
                  color: n.isEnemy ? '#FCA5A5' : n.isCompanion ? '#86EFAC' : '#D1D5DB',
                }}>
                  {n.name}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {n.tooClose && (
                  <span style={{ fontSize: '9px', color: '#F87171', fontWeight: 'bold' }}>TOO CLOSE</span>
                )}
                <span style={{ fontSize: '10px', color: '#6B7280' }}>{n.distance}cm</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Planting months */}
      <div style={{
        marginBottom: '14px', padding: '10px', borderRadius: '10px',
        background: 'rgba(74, 222, 128, 0.08)',
        border: '1px solid rgba(74, 222, 128, 0.15)',
      }}>
        <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#9CA3AF', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {'\uD83D\uDCC5'} Best Planting Months
        </div>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {MONTH_SHORT.map((m, i) => {
            const isActive = plant.plantingMonths.includes(i + 1);
            const isCurrentMonth = new Date().getMonth() === i;
            return (
              <span key={m} style={{
                padding: '2px 6px', borderRadius: '4px', fontSize: '10px',
                background: isActive ? 'rgba(74, 222, 128, 0.3)' : 'rgba(0,0,0,0.2)',
                color: isActive ? '#86EFAC' : '#6B7280',
                fontWeight: isActive ? 'bold' : 'normal',
                border: isCurrentMonth ? '1px solid rgba(251, 191, 36, 0.5)' : '1px solid transparent',
              }}>
                {m}
              </span>
            );
          })}
        </div>
      </div>

      {/* Soil types */}
      <div style={{
        marginBottom: '14px', padding: '10px', borderRadius: '10px',
        background: 'rgba(139, 105, 20, 0.1)',
        border: '1px solid rgba(139, 105, 20, 0.2)',
      }}>
        <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#9CA3AF', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {'\uD83E\uDEA8'} Preferred Soils
        </div>
        <div style={{ fontSize: '12px', color: '#D4A06C' }}>
          {plant.soilTypes.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')}
        </div>
      </div>

      {/* Companion plants */}
      {companionNames.length > 0 && (
        <div style={{
          marginBottom: '10px', padding: '10px', borderRadius: '10px',
          background: 'rgba(34, 197, 94, 0.08)',
          border: '1px solid rgba(34, 197, 94, 0.15)',
        }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#9CA3AF', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {'\uD83E\uDD1D'} Companion Plants
          </div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {companionNames.map((name) => (
              <span key={name} style={{
                padding: '2px 8px', borderRadius: '6px', fontSize: '11px',
                background: 'rgba(74, 222, 128, 0.2)',
                color: '#86EFAC',
              }}>
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Enemy plants */}
      {enemyNames.length > 0 && (
        <div style={{
          marginBottom: '10px', padding: '10px', borderRadius: '10px',
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.15)',
        }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#9CA3AF', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {'\u26A0\uFE0F'} Keep Away From
          </div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {enemyNames.map((name) => (
              <span key={name} style={{
                padding: '2px 8px', borderRadius: '6px', fontSize: '11px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#FCA5A5',
              }}>
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      {plant.tips.length > 0 && (
        <div style={{
          padding: '10px', borderRadius: '10px',
          background: 'rgba(251, 191, 36, 0.06)',
          border: '1px solid rgba(251, 191, 36, 0.15)',
          marginBottom: onRemove ? '14px' : '0',
        }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#9CA3AF', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {'\uD83D\uDCA1'} Growing Tips
          </div>
          <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: '#FBBF24', lineHeight: '1.6' }}>
            {plant.tips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Remove button */}
      {onRemove && (
        <button
          onClick={onRemove}
          style={{
            width: '100%', padding: '8px', borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#FCA5A5', cursor: 'pointer', fontSize: '12px',
            fontFamily: '"Nunito", system-ui, sans-serif',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            transition: 'all 0.15s',
          }}
        >
          {'\uD83D\uDDD1\uFE0F'} Remove Plant
        </button>
      )}
    </div>
  );
}
