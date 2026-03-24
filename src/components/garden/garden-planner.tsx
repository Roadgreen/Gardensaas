'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardTitle, CardContent } from '@/components/ui/card';
import { useGarden, usePlants } from '@/lib/hooks';
import { getPlantById } from '@/lib/garden-utils';
import { VarietyPicker } from '@/components/garden3d/variety-picker';
import {
  Grid3x3,
  Plus,
  Trash2,
  AlertTriangle,
  Check,
  Eye,
  ArrowLeft,
  Info,
  Search,
} from 'lucide-react';
import type { Plant } from '@/types';

const CELL_SIZE = 40; // px per 10cm

const CATEGORY_EMOJI: Record<string, string> = {
  vegetable: '\uD83E\uDD66',
  herb: '\uD83C\uDF3F',
  fruit: '\uD83C\uDF53',
  root: '\uD83E\uDD55',
  ancient: '\uD83C\uDF3E',
  exotic: '\uD83C\uDF34',
};

const CATEGORIES = ['all', 'vegetable', 'herb', 'fruit', 'root', 'ancient', 'exotic'] as const;

export function GardenPlanner() {
  const { config, isLoaded, addPlant, removePlant, clearGarden } = useGarden();
  const { plants } = usePlants();
  const t = useTranslations('planner2d');
  const locale = useLocale();
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [showPlantPicker, setShowPlantPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [hoveredCell, setHoveredCell] = useState<{ col: number; row: number } | null>(null);
  const [pulseCell, setPulseCell] = useState<{ col: number; row: number } | null>(null);
  // Variety picker state
  const [varietyPickerState, setVarietyPickerState] = useState<{
    plantId: string; x: number; z: number;
  } | null>(null);

  const gridCols = Math.floor(config.width * 10); // 10cm cells
  const gridRows = Math.floor(config.length * 10);
  const displayCols = Math.min(gridCols, 30);
  const displayRows = Math.min(gridRows, 40);
  const cellW = Math.max(20, Math.min(CELL_SIZE, 600 / displayCols));
  const cellH = cellW;

  const plantedWithInfo = useMemo(() => {
    return config.plantedItems.map((item, idx) => ({
      ...item,
      idx,
      plant: getPlantById(item.plantId),
    }));
  }, [config.plantedItems]);

  // Build a map of cell -> planted item for fast lookup
  const cellPlantMap = useMemo(() => {
    const map = new Map<string, typeof plantedWithInfo[number]>();
    plantedWithInfo.forEach((p) => {
      const pCol = Math.round((p.x / config.width) * displayCols);
      const pRow = Math.round((p.z / config.length) * displayRows);
      map.set(`${pCol}-${pRow}`, p);
    });
    return map;
  }, [plantedWithInfo, config.width, config.length, displayCols, displayRows]);

  // Build a set of cells that have enemy neighbors (for warning icons)
  const cellsWithEnemies = useMemo(() => {
    const enemyCells = new Map<string, string[]>(); // cell key -> enemy plant names
    for (let i = 0; i < plantedWithInfo.length; i++) {
      for (let j = i + 1; j < plantedWithInfo.length; j++) {
        const a = plantedWithInfo[i];
        const b = plantedWithInfo[j];
        if (!a.plant || !b.plant) continue;
        if (a.plant.enemyPlants.includes(b.plantId) || b.plant.enemyPlants.includes(a.plantId)) {
          const dist = Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.z - b.z, 2));
          if (dist < 1) {
            const keyA = `${Math.round((a.x / config.width) * displayCols)}-${Math.round((a.z / config.length) * displayRows)}`;
            const keyB = `${Math.round((b.x / config.width) * displayCols)}-${Math.round((b.z / config.length) * displayRows)}`;
            const nameB = locale === 'fr' ? b.plant.name.fr : b.plant.name.en;
            const nameA = locale === 'fr' ? a.plant.name.fr : a.plant.name.en;
            if (!enemyCells.has(keyA)) enemyCells.set(keyA, []);
            if (!enemyCells.has(keyB)) enemyCells.set(keyB, []);
            enemyCells.get(keyA)!.push(nameB);
            enemyCells.get(keyB)!.push(nameA);
          }
        }
      }
    }
    return enemyCells;
  }, [plantedWithInfo, config.width, config.length, displayCols, displayRows, locale]);

  // Check companion/enemy warnings for sidebar
  const warnings = useMemo(() => {
    const w: string[] = [];
    for (let i = 0; i < plantedWithInfo.length; i++) {
      for (let j = i + 1; j < plantedWithInfo.length; j++) {
        const a = plantedWithInfo[i];
        const b = plantedWithInfo[j];
        if (!a.plant || !b.plant) continue;
        if (a.plant.enemyPlants.includes(b.plantId) || b.plant.enemyPlants.includes(a.plantId)) {
          const dist = Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.z - b.z, 2));
          if (dist < 1) {
            const nameA = locale === 'fr' ? a.plant.name.fr : a.plant.name.en;
            const nameB = locale === 'fr' ? b.plant.name.fr : b.plant.name.en;
            w.push(t('enemyWarning', { a: nameA, b: nameB }));
          }
        }
      }
    }
    return w;
  }, [plantedWithInfo, locale, t]);

  // Determine if the hovered cell would conflict with an enemy
  const hoverEnemyWarning = useMemo(() => {
    if (!hoveredCell || !selectedPlant) return false;
    const cellX = (hoveredCell.col / displayCols) * config.width;
    const cellZ = (hoveredCell.row / displayRows) * config.length;
    return plantedWithInfo.some((p) => {
      if (!p.plant) return false;
      const dist = Math.sqrt(Math.pow(p.x - cellX, 2) + Math.pow(p.z - cellZ, 2));
      if (dist >= 1) return false;
      return selectedPlant.enemyPlants.includes(p.plantId) || p.plant.enemyPlants.includes(selectedPlant.id);
    });
  }, [hoveredCell, selectedPlant, plantedWithInfo, config.width, config.length, displayCols, displayRows]);

  // Find which raised bed / zone a cell belongs to
  const getCellOverlay = useCallback((col: number, row: number) => {
    const cellX = (col / displayCols) * config.width;
    const cellZ = (row / displayRows) * config.length;
    const cellXPct = (col / displayCols) * 100;
    const cellZPct = (row / displayRows) * 100;

    // Check raised beds
    for (const bed of config.raisedBeds || []) {
      const bedL = (bed.x / 100) * config.width;
      const bedT = (bed.z / 100) * config.length;
      const halfW = bed.lengthM / 2;
      const halfH = bed.widthM / 2;
      if (cellX >= bedL - halfW && cellX <= bedL + halfW && cellZ >= bedT - halfH && cellZ <= bedT + halfH) {
        return { type: 'bed' as const, name: bed.name, color: 'rgba(210, 160, 108, 0.15)' };
      }
    }

    // Check zones
    for (const zone of config.zones || []) {
      const zoneL = (zone.x / 100) * config.width;
      const zoneT = (zone.z / 100) * config.length;
      const halfW = zone.lengthM / 2;
      const halfH = zone.widthM / 2;
      if (cellX >= zoneL - halfW && cellX <= zoneL + halfW && cellZ >= zoneT - halfH && cellZ <= zoneT + halfH) {
        return { type: 'zone' as const, name: zone.name, color: `${zone.color}15` };
      }
    }
    return null;
  }, [config.width, config.length, config.raisedBeds, config.zones, displayCols, displayRows]);

  const handleCellClick = (col: number, row: number) => {
    if (!selectedPlant) return;
    const x = (col / displayCols) * config.width;
    const z = (row / displayRows) * config.length;
    const pctX = (col / displayCols) * 100;
    const pctZ = (row / displayRows) * 100;

    // If plant has varieties or there are zones/beds, show variety picker
    if (selectedPlant.varieties?.length || (config.zones || []).length > 0 || (config.raisedBeds || []).length > 0) {
      setVarietyPickerState({ plantId: selectedPlant.id, x: pctX, z: pctZ });
    } else {
      addPlant(selectedPlant.id, pctX, pctZ);
      // Trigger pulse animation
      setPulseCell({ col, row });
      setTimeout(() => setPulseCell(null), 600);
    }
  };

  const handleVarietyConfirm = useCallback((varietyId: string | undefined, targetZoneId: string | undefined, targetBedId: string | undefined) => {
    if (!varietyPickerState) return;
    addPlant(varietyPickerState.plantId, varietyPickerState.x, varietyPickerState.z, targetBedId, varietyId, targetZoneId);
    setVarietyPickerState(null);
  }, [varietyPickerState, addPlant]);

  const usedArea = plantedWithInfo.reduce((acc, p) => {
    if (!p.plant) return acc;
    return acc + Math.pow(p.plant.spacingCm / 100, 2);
  }, 0);

  // Filtered plants for the picker
  const filteredPlants = useMemo(() => {
    return plants.filter((plant) => {
      if (categoryFilter !== 'all' && plant.category !== categoryFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const nameEn = plant.name.en.toLowerCase();
        const nameFr = plant.name.fr.toLowerCase();
        return nameEn.includes(q) || nameFr.includes(q);
      }
      return true;
    });
  }, [plants, categoryFilter, searchQuery]);

  const varietyPickerPlantData = varietyPickerState ? plants.find(p => p.id === varietyPickerState.plantId) : null;

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#0D1F17] flex items-center justify-center">
        <div className="animate-pulse text-green-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D1F17] py-8 px-4 sm:px-6 relative">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <Link href="/garden/dashboard">
              <Button variant="ghost" size="sm" className="mb-2 gap-2">
                <ArrowLeft className="w-4 h-4" />
                {t('dashboard')}
              </Button>
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-green-50">{t('title')}</h1>
            <p className="text-green-300/60 text-sm">
              {t('subtitle', { length: config.length, width: config.width })}
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/garden/3d">
              <Button variant="secondary" size="sm" className="gap-2">
                <Eye className="w-4 h-4" />
                {t('view3d')}
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={clearGarden} className="gap-2 text-red-400 hover:text-red-300">
              <Trash2 className="w-4 h-4" />
              {t('clear')}
            </Button>
          </div>
        </div>

        {/* Placement mode indicator */}
        {selectedPlant && (
          <div className="mb-4 px-4 py-2 rounded-xl bg-green-900/30 border border-green-700/40 flex items-center gap-3">
            <span className="text-lg">{CATEGORY_EMOJI[selectedPlant.category] || '\uD83C\uDF31'}</span>
            <span className="text-green-200 text-sm font-medium">
              {t('placementMode', { name: locale === 'fr' ? selectedPlant.name.fr : selectedPlant.name.en })}
            </span>
            <span className="text-green-400/60 text-xs ml-auto">
              {t('spacing', { cm: selectedPlant.spacingCm })}
            </span>
          </div>
        )}

        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          {/* Grid area */}
          <Card className="overflow-auto">
            <CardTitle className="flex items-center gap-2 mb-4">
              <Grid3x3 className="w-5 h-5 text-green-400" />
              {t('title')}
            </CardTitle>
            <CardContent>
              <div className="overflow-auto pb-4">
                <div
                  className="inline-grid border border-green-800/30 rounded-lg overflow-hidden"
                  style={{
                    gridTemplateColumns: `repeat(${displayCols}, ${cellW}px)`,
                    gridTemplateRows: `repeat(${displayRows}, ${cellH}px)`,
                  }}
                >
                  {Array.from({ length: displayRows * displayCols }, (_, idx) => {
                    const col = idx % displayCols;
                    const row = Math.floor(idx / displayCols);
                    const cellKey = `${col}-${row}`;
                    const planted = cellPlantMap.get(cellKey);
                    const overlay = getCellOverlay(col, row);
                    const enemyNames = cellsWithEnemies.get(cellKey);
                    const isHovered = hoveredCell?.col === col && hoveredCell?.row === row;
                    const isPulsing = pulseCell?.col === col && pulseCell?.row === row;

                    return (
                      <div
                        key={idx}
                        onClick={() => handleCellClick(col, row)}
                        onMouseEnter={() => setHoveredCell({ col, row })}
                        onMouseLeave={() => setHoveredCell(null)}
                        className={`relative border transition-all duration-150 ${
                          selectedPlant ? 'cursor-crosshair' : 'cursor-default'
                        } ${planted ? 'border-green-800/30' : 'border-green-900/20 border-dashed'}`}
                        style={{
                          backgroundColor: planted?.plant
                            ? planted.plant.color + '30'
                            : overlay
                              ? overlay.color
                              : isHovered && selectedPlant
                                ? hoverEnemyWarning
                                  ? 'rgba(239, 68, 68, 0.15)'
                                  : 'rgba(74, 222, 128, 0.15)'
                                : '#0D1F17',
                          ...(isPulsing ? {
                            animation: 'plantPulse 0.6s ease-out',
                          } : {}),
                        }}
                        title={
                          planted?.plant
                            ? (locale === 'fr' ? planted.plant.name.fr : planted.plant.name.en) +
                              (enemyNames?.length ? ` \u26A0 ${enemyNames.join(', ')}` : '')
                            : overlay
                              ? `${overlay.type === 'bed' ? t('bed') : t('zone')}: ${overlay.name}`
                              : t('coordinates', {
                                  x: ((col / displayCols) * config.width).toFixed(1),
                                  z: ((row / displayRows) * config.length).toFixed(1),
                                })
                        }
                      >
                        {planted?.plant && (
                          <div className="w-full h-full flex flex-col items-center justify-center overflow-hidden">
                            <span className="text-xs leading-none" style={{ fontSize: Math.min(cellW * 0.5, 16) }}>
                              {CATEGORY_EMOJI[planted.plant.category] || '\uD83C\uDF31'}
                            </span>
                            {cellW >= 28 && (
                              <span
                                className="text-green-100 leading-none truncate w-full text-center px-0.5"
                                style={{ fontSize: Math.min(cellW * 0.22, 9) }}
                              >
                                {(() => {
                                  const name = locale === 'fr' ? planted.plant.name.fr : planted.plant.name.en;
                                  if (planted.varietyId) {
                                    const variety = planted.plant.varieties?.find(v => v.id === planted.varietyId);
                                    if (variety) return locale === 'fr' ? variety.name.fr : variety.name.en;
                                  }
                                  return name.length > 8 ? name.slice(0, 7) + '\u2026' : name;
                                })()}
                              </span>
                            )}
                          </div>
                        )}
                        {/* Enemy warning icon on cell */}
                        {enemyNames && enemyNames.length > 0 && (
                          <div
                            className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-500/90 flex items-center justify-center text-white z-10"
                            style={{ fontSize: 8, lineHeight: 1 }}
                            title={`\u26A0 ${enemyNames.join(', ')}`}
                          >
                            !
                          </div>
                        )}
                        {/* Hover preview when placing */}
                        {isHovered && selectedPlant && !planted && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="opacity-40 text-xs">
                              {CATEGORY_EMOJI[selectedPlant.category] || '\uD83C\uDF31'}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tip text */}
              {!selectedPlant && config.plantedItems.length === 0 && (
                <p className="text-green-400/40 text-xs mt-3 text-center">{t('tapToPlace')}</p>
              )}
            </CardContent>
          </Card>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Plant picker */}
            <Card>
              <CardTitle className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-green-400" />
                  {t('selectPlant')}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPlantPicker(!showPlantPicker)}
                >
                  {showPlantPicker ? t('hide') : t('show')}
                </Button>
              </CardTitle>
              {selectedPlant && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-green-900/30 border border-green-700/40 mb-3">
                  <span className="text-xl">{CATEGORY_EMOJI[selectedPlant.category] || '\uD83C\uDF31'}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-green-50 font-medium text-sm block truncate">
                      {locale === 'fr' ? selectedPlant.name.fr : selectedPlant.name.en}
                    </span>
                    <span className="text-xs text-green-400/60 block">
                      {t('spacing', { cm: selectedPlant.spacingCm })}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedPlant(null)}
                    className="text-green-700 hover:text-red-400 transition-colors cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              {showPlantPicker && (
                <CardContent>
                  {/* Search */}
                  <div className="relative mb-3">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-green-500/50" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('searchPlants')}
                      className="w-full pl-8 pr-3 py-2 text-sm rounded-lg bg-[#0D1F17] border border-green-800/30 text-green-100 placeholder:text-green-600/40 focus:outline-none focus:border-green-600/50"
                    />
                  </div>

                  {/* Category filter */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={`px-2 py-1 rounded-md text-xs transition-colors cursor-pointer ${
                          categoryFilter === cat
                            ? 'bg-green-900/50 text-green-200 border border-green-700/50'
                            : 'text-green-400/60 hover:text-green-300 border border-transparent'
                        }`}
                      >
                        {cat === 'all' ? t('allCategories') : `${CATEGORY_EMOJI[cat] || ''} ${t(cat)}`}
                      </button>
                    ))}
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-1">
                    {filteredPlants.map((plant) => (
                      <button
                        key={plant.id}
                        onClick={() => {
                          setSelectedPlant(plant);
                          setShowPlantPicker(false);
                        }}
                        className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors cursor-pointer ${
                          selectedPlant?.id === plant.id
                            ? 'bg-green-900/40 border border-green-700/50'
                            : 'hover:bg-[#0D1F17]'
                        }`}
                      >
                        <span className="text-base shrink-0">{CATEGORY_EMOJI[plant.category] || '\uD83C\uDF31'}</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-green-100 truncate block">
                            {locale === 'fr' ? plant.name.fr : plant.name.en}
                          </span>
                          {plant.varieties && plant.varieties.length > 0 && (
                            <span className="text-[10px] text-green-400/50">
                              {plant.varieties.length} {locale === 'fr' ? 'variétés' : 'varieties'}
                            </span>
                          )}
                        </div>
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: plant.color }}
                        />
                      </button>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Summary */}
            <Card>
              <CardTitle className="flex items-center gap-2 mb-3">
                <Info className="w-5 h-5 text-green-400" />
                {t('summary')}
              </CardTitle>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-300/60">{t('totalPlants')}</span>
                    <span className="text-green-100 font-medium">{config.plantedItems.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-300/60">{t('gardenArea')}</span>
                    <span className="text-green-100 font-medium">{(config.length * config.width).toFixed(1)} m²</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-300/60">{t('usedArea')}</span>
                    <span className="text-green-100 font-medium">{usedArea.toFixed(1)} m²</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Planted items list */}
            {plantedWithInfo.length > 0 && (
              <Card>
                <CardTitle className="mb-3">{t('planted')} ({plantedWithInfo.length})</CardTitle>
                <CardContent>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {plantedWithInfo.map((p) => {
                      const name = p.plant
                        ? (locale === 'fr' ? p.plant.name.fr : p.plant.name.en)
                        : p.plantId;
                      const varietyName = p.varietyId && p.plant
                        ? p.plant.varieties?.find(v => v.id === p.varietyId)
                        : null;
                      const displayName = varietyName
                        ? `${name} — ${locale === 'fr' ? varietyName.name.fr : varietyName.name.en}`
                        : name;

                      return (
                        <div key={p.idx} className="flex items-center justify-between p-2 rounded-lg bg-[#0D1F17]">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm shrink-0">
                              {p.plant ? (CATEGORY_EMOJI[p.plant.category] || '\uD83C\uDF31') : '\uD83C\uDF31'}
                            </span>
                            <span className="text-xs text-green-200 truncate">{displayName}</span>
                          </div>
                          <button
                            onClick={() => removePlant(p.idx)}
                            className="text-green-700 hover:text-red-400 transition-colors cursor-pointer shrink-0 ml-2"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Warnings */}
            {warnings.length > 0 && (
              <Card className="border-yellow-800/40">
                <CardTitle className="flex items-center gap-2 mb-3 text-yellow-400">
                  <AlertTriangle className="w-5 h-5" />
                  {t('warnings')}
                </CardTitle>
                <CardContent>
                  <ul className="space-y-2">
                    {warnings.map((w, i) => (
                      <li key={i} className="text-xs text-yellow-300/80">{w}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {warnings.length === 0 && plantedWithInfo.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-green-400/60 p-3">
                <Check className="w-4 h-4" />
                {t('noWarnings')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Variety picker modal */}
      {varietyPickerPlantData && varietyPickerState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setVarietyPickerState(null)} />
          <div className="relative">
            <VarietyPicker
              plant={varietyPickerPlantData}
              zones={config.zones || []}
              raisedBeds={config.raisedBeds || []}
              onConfirm={handleVarietyConfirm}
              onCancel={() => setVarietyPickerState(null)}
            />
          </div>
        </div>
      )}

      {/* Pulse animation keyframes */}
      <style jsx global>{`
        @keyframes plantPulse {
          0% { box-shadow: inset 0 0 0 0 rgba(74, 222, 128, 0.6); }
          50% { box-shadow: inset 0 0 8px 2px rgba(74, 222, 128, 0.4); }
          100% { box-shadow: inset 0 0 0 0 rgba(74, 222, 128, 0); }
        }
      `}</style>
    </div>
  );
}
