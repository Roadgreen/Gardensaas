'use client';

import { useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import type { Plant, GardenConfig, PlantingSuggestion, GardenZone, RaisedBed } from '@/types';

interface PlantingSuggestionsProps {
  config: GardenConfig;
  plants: Plant[];
  onClose: () => void;
  onSelectPlant: (plantId: string) => void;
}

const panelStyle: React.CSSProperties = {
  position: 'absolute',
  top: '12px',
  right: '12px',
  zIndex: 50,
  width: '360px',
  maxHeight: 'calc(100vh - 120px)',
  overflowY: 'auto',
  background: 'linear-gradient(145deg, rgba(10, 30, 18, 0.97), rgba(15, 45, 25, 0.97))',
  backdropFilter: 'blur(16px)',
  borderRadius: '16px',
  border: '2px solid rgba(251, 191, 36, 0.4)',
  padding: '20px',
  fontFamily: '"Nunito", system-ui, sans-serif',
  color: 'white',
  boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
  scrollbarWidth: 'thin',
  scrollbarColor: 'rgba(251, 191, 36, 0.3) transparent',
};

interface SuggestionsLabels {
  canPlantThisMonth: string;
  plantingSoonLabel: string;
  matchesSoil: string;
  matchesSun: string;
  easyToGrow: string;
  goodCompanionWith: string;
  conflictsWithPlants: string;
  notYetInGarden: string;
  betweenPlants: string;
  betweenRows: string;
}

function computeSuggestions(config: GardenConfig, plants: Plant[], locale: string, labels: SuggestionsLabels): PlantingSuggestion[] {
  const currentMonth = new Date().getMonth() + 1;
  const totalAreaM2 = config.length * config.width;

  // Compute area used by zones and beds
  const zoneAreas = (config.zones || []).map((z: GardenZone) => ({ id: z.id, area: z.lengthM * z.widthM, soil: z.soilType, sun: z.sunExposure }));
  const bedAreas = (config.raisedBeds || []).map((b: RaisedBed) => ({ id: b.id, area: b.lengthM * b.widthM }));
  const usedZoneArea = zoneAreas.reduce((s: number, z: { area: number }) => s + z.area, 0);
  const usedBedArea = bedAreas.reduce((s: number, b: { area: number }) => s + b.area, 0);
  const availableArea = Math.max(totalAreaM2 - usedBedArea, 1);

  // Already planted plant IDs
  const plantedIds = new Set(config.plantedItems.map((p) => p.plantId));
  const plantedCounts = new Map<string, number>();
  config.plantedItems.forEach((p) => {
    plantedCounts.set(p.plantId, (plantedCounts.get(p.plantId) || 0) + 1);
  });

  const suggestions: PlantingSuggestion[] = [];

  for (const plant of plants) {
    let score = 0;
    const reasons: string[] = [];

    // Season match (can plant now)
    if (plant.plantingMonths.includes(currentMonth)) {
      score += 30;
      reasons.push(labels.canPlantThisMonth);
    } else if (plant.plantingMonths.includes(currentMonth + 1) || plant.plantingMonths.includes(currentMonth - 1)) {
      score += 15;
      reasons.push(labels.plantingSoonLabel);
    } else {
      score -= 10;
    }

    // Soil compatibility
    if (plant.soilTypes.includes(config.soilType)) {
      score += 20;
      reasons.push(labels.matchesSoil);
    } else {
      score -= 5;
    }

    // Sun compatibility
    if (plant.sunExposure.includes(config.sunExposure)) {
      score += 15;
      reasons.push(labels.matchesSun);
    }

    // Difficulty bonus for easy plants
    if (plant.difficulty === 'easy') {
      score += 10;
      reasons.push(labels.easyToGrow);
    }

    // Companion planting bonus
    const companionBonus = plant.companionPlants.filter((c) => plantedIds.has(c)).length;
    if (companionBonus > 0) {
      score += companionBonus * 10;
      const companionNames = plant.companionPlants
        .filter((c) => plantedIds.has(c))
        .map((c) => {
          const p = plants.find((p) => p.id === c);
          return p ? (locale === 'fr' ? p.name.fr : p.name.en) : c;
        });
      reasons.push(`${labels.goodCompanionWith}: ${companionNames.join(', ')}`);
    }

    // Enemy plant penalty
    const enemyCount = plant.enemyPlants.filter((e) => plantedIds.has(e)).length;
    if (enemyCount > 0) {
      score -= enemyCount * 15;
      reasons.push(labels.conflictsWithPlants);
    }

    // Not already planted bonus
    if (!plantedIds.has(plant.id)) {
      score += 5;
      reasons.push(labels.notYetInGarden);
    }

    // Already too many of this plant penalty
    const existing = plantedCounts.get(plant.id) || 0;
    if (existing > 3) {
      score -= 10;
    }

    // Calculate recommended quantity based on spacing and available area
    const spacingM = plant.spacingCm / 100;
    const rowSpacingM = (plant.rowSpacingCm || plant.spacingCm * 1.5) / 100;
    const plantAreaM2 = spacingM * rowSpacingM;
    // Use a fraction of total area (no single crop should take more than 20%)
    const maxArea = availableArea * 0.2;
    const quantity = Math.max(1, Math.min(20, Math.floor(maxArea / plantAreaM2)));

    if (score > 0) {
      suggestions.push({
        plantId: plant.id,
        plantName: locale === 'fr' ? plant.name.fr : plant.name.en,
        quantity: quantity - existing,
        reason: reasons.slice(0, 3).join('. '),
        score: Math.min(100, Math.max(0, score)),
        companions: plant.companionPlants
          .slice(0, 3)
          .map((c) => {
            const p = plants.find((p) => p.id === c);
            return p ? (locale === 'fr' ? p.name.fr : p.name.en) : c;
          }),
        spacingNote: `${plant.spacingCm}cm ${labels.betweenPlants}, ${plant.rowSpacingCm || Math.round(plant.spacingCm * 1.5)}cm ${labels.betweenRows}`,
      });
    }
  }

  // Sort by score descending
  suggestions.sort((a, b) => b.score - a.score);
  return suggestions.slice(0, 15);
}

export function PlantingSuggestions({ config, plants, onClose, onSelectPlant }: PlantingSuggestionsProps) {
  const t = useTranslations('garden3d.suggestions');
  const tInfo = useTranslations('garden3d.infoPanel');
  const locale = useLocale();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totalArea = config.length * config.width;
  const zoneArea = (config.zones || []).reduce((s: number, z: GardenZone) => s + z.lengthM * z.widthM, 0);
  const bedArea = (config.raisedBeds || []).reduce((s: number, b: RaisedBed) => s + b.lengthM * b.widthM, 0);

  const suggestionLabels: SuggestionsLabels = useMemo(() => ({
    canPlantThisMonth: t('canPlantThisMonth'),
    plantingSoonLabel: t('plantingSoon'),
    matchesSoil: t('matchesSoil'),
    matchesSun: t('matchesSun'),
    easyToGrow: t('easyToGrow'),
    goodCompanionWith: t('goodCompanionWith'),
    conflictsWithPlants: t('conflictsWithPlants'),
    notYetInGarden: t('notYetInGarden'),
    betweenPlants: tInfo('betweenPlants'),
    betweenRows: tInfo('betweenRows'),
  }), [t, tInfo]);

  const suggestions = useMemo(() => computeSuggestions(config, plants, locale, suggestionLabels), [config, plants, locale, suggestionLabels]);

  const scoreColor = (score: number) => {
    if (score >= 70) return '#4ADE80';
    if (score >= 40) return '#FBBF24';
    return '#FB923C';
  };

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>{'\uD83D\uDCA1'}</span>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#FBBF24' }}>{t('title')}</div>
            <div style={{ fontSize: '10px', color: '#9CA3AF' }}>{t('subtitle')}</div>
          </div>
        </div>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px',
          color: '#9CA3AF', cursor: 'pointer', padding: '4px 10px', fontSize: '14px',
          fontFamily: '"Nunito", system-ui, sans-serif',
        }}>{'\u2715'}</button>
      </div>

      {/* Garden area summary */}
      <div style={{
        padding: '10px', borderRadius: '10px', marginBottom: '14px',
        background: 'rgba(251, 191, 36, 0.08)',
        border: '1px solid rgba(251, 191, 36, 0.15)',
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px',
        textAlign: 'center',
      }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#FBBF24' }}>{totalArea.toFixed(1)}</div>
          <div style={{ fontSize: '9px', color: '#9CA3AF' }}>{t('totalAreaM2')}</div>
        </div>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#4ADE80' }}>{(zoneArea + bedArea).toFixed(1)}</div>
          <div style={{ fontSize: '9px', color: '#9CA3AF' }}>{t('zonesBedsArea')}</div>
        </div>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#86EFAC' }}>{config.plantedItems.length}</div>
          <div style={{ fontSize: '9px', color: '#9CA3AF' }}>{t('plantsPlaced')}</div>
        </div>
      </div>

      {/* Suggestion list */}
      {suggestions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#6B7280', fontSize: '12px' }}>
          {t('noSuggestions')}
        </div>
      ) : (
        <div>
          {suggestions.map((s) => {
            const plantData = plants.find((p) => p.id === s.plantId);
            const isExpanded = expandedId === s.plantId;
            return (
              <div key={s.plantId} style={{ marginBottom: '4px' }}>
                <div
                  onClick={() => setExpandedId(isExpanded ? null : s.plantId)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '8px 10px',
                    borderRadius: isExpanded ? '10px 10px 0 0' : '10px',
                    cursor: 'pointer',
                    background: isExpanded ? 'rgba(251, 191, 36, 0.08)' : 'rgba(0,0,0,0.1)',
                    border: isExpanded ? '1px solid rgba(251, 191, 36, 0.2)' : '1px solid transparent',
                    borderBottom: isExpanded ? 'none' : undefined,
                  }}
                >
                  {/* Plant color */}
                  <div style={{
                    width: '30px', height: '30px', borderRadius: '8px',
                    background: plantData?.color || '#4ADE80',
                    border: '2px solid rgba(255,255,255,0.15)',
                    flexShrink: 0,
                  }} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', color: '#E5E7EB', fontWeight: 'bold' }}>
                      {s.plantName}
                    </div>
                    <div style={{ fontSize: '9px', color: '#9CA3AF' }}>
                      {t('suggestedQty', { count: Math.max(1, s.quantity) })} | {s.spacingNote}
                    </div>
                  </div>

                  {/* Score badge */}
                  <div style={{
                    padding: '2px 8px', borderRadius: '6px',
                    background: `${scoreColor(s.score)}20`,
                    border: `1px solid ${scoreColor(s.score)}40`,
                    fontSize: '11px', fontWeight: 'bold',
                    color: scoreColor(s.score),
                    flexShrink: 0,
                  }}>
                    {s.score}%
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div style={{
                    padding: '10px',
                    borderRadius: '0 0 10px 10px',
                    background: 'rgba(251, 191, 36, 0.05)',
                    border: '1px solid rgba(251, 191, 36, 0.2)',
                    borderTop: 'none',
                  }}>
                    <div style={{ fontSize: '11px', color: '#D1D5DB', marginBottom: '8px' }}>
                      {s.reason}
                    </div>

                    {s.companions.length > 0 && (
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ fontSize: '9px', color: '#9CA3AF', marginBottom: '3px' }}>
                          {t('goodCompanions')}
                        </div>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {s.companions.map((c) => (
                            <span key={c} style={{
                              padding: '1px 6px', borderRadius: '4px',
                              fontSize: '10px', background: 'rgba(74, 222, 128, 0.15)',
                              color: '#86EFAC',
                            }}>
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Varieties preview */}
                    {plantData?.varieties && plantData.varieties.length > 0 && (
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ fontSize: '9px', color: '#9CA3AF', marginBottom: '3px' }}>
                          {t('varietiesAvailable', { count: plantData.varieties.length })}
                        </div>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {plantData.varieties.slice(0, 4).map((v) => (
                            <span key={v.id} style={{
                              padding: '1px 6px', borderRadius: '4px',
                              fontSize: '10px', background: 'rgba(168, 85, 247, 0.1)',
                              color: '#C084FC',
                            }}>
                              {locale === 'fr' ? v.name.fr : v.name.en}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => onSelectPlant(s.plantId)}
                      style={{
                        width: '100%', padding: '6px', borderRadius: '8px',
                        background: 'rgba(74, 222, 128, 0.2)',
                        border: '1px solid rgba(74, 222, 128, 0.4)',
                        color: '#86EFAC', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold',
                        fontFamily: '"Nunito", system-ui, sans-serif',
                      }}
                    >
                      {t('selectToPlant')}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
