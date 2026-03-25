'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
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
  X,
  Droplets,
  Sun,
  Heart,
  ShieldAlert,
  ChevronUp,
  Leaf,
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
  // Mobile bottom sheet state
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  // Add plant modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalPlant, setAddModalPlant] = useState<Plant | null>(null);
  const [addModalQuantity, setAddModalQuantity] = useState(1);
  const [addModalSearch, setAddModalSearch] = useState('');
  const addModalRef = useRef<HTMLDivElement>(null);
  // Variety picker state
  const [varietyPickerState, setVarietyPickerState] = useState<{
    plantId: string; x: number; z: number;
  } | null>(null);
  // Plant info popover state
  const [selectedCellInfo, setSelectedCellInfo] = useState<{
    idx: number;
    col: number;
    row: number;
    rect: { top: number; left: number; width: number; height: number };
  } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Close popover on click outside
  useEffect(() => {
    if (!selectedCellInfo) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setSelectedCellInfo(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [selectedCellInfo]);

  // Close mobile sheet on click outside
  useEffect(() => {
    if (!mobileSheetOpen) return;
    const handler = (e: MouseEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
        setMobileSheetOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [mobileSheetOpen]);

  // Close add modal on click outside
  useEffect(() => {
    if (!showAddModal) return;
    const handler = (e: MouseEvent) => {
      if (addModalRef.current && !addModalRef.current.contains(e.target as Node)) {
        setShowAddModal(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showAddModal]);

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (mobileSheetOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [mobileSheetOpen]);

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

  // Build a set of cells that have companion neighbors (for green glow during placement)
  const cellsWithCompanions = useMemo(() => {
    if (!selectedPlant) return new Set<string>();
    const companionCells = new Set<string>();
    for (const p of plantedWithInfo) {
      if (!p.plant) continue;
      const isCompanion = selectedPlant.companionPlants.includes(p.plantId) ||
        p.plant.companionPlants.includes(selectedPlant.id);
      if (isCompanion) {
        const pCol = Math.round((p.x / config.width) * displayCols);
        const pRow = Math.round((p.z / config.length) * displayRows);
        // Highlight the companion cell and adjacent cells
        companionCells.add(`${pCol}-${pRow}`);
      }
    }
    return companionCells;
  }, [selectedPlant, plantedWithInfo, config.width, config.length, displayCols, displayRows]);

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

  // Determine if the hovered cell is near a companion
  const hoverCompanionHint = useMemo(() => {
    if (!hoveredCell || !selectedPlant) return false;
    const cellX = (hoveredCell.col / displayCols) * config.width;
    const cellZ = (hoveredCell.row / displayRows) * config.length;
    return plantedWithInfo.some((p) => {
      if (!p.plant) return false;
      const dist = Math.sqrt(Math.pow(p.x - cellX, 2) + Math.pow(p.z - cellZ, 2));
      if (dist >= 1) return false;
      return selectedPlant.companionPlants.includes(p.plantId) || p.plant.companionPlants.includes(selectedPlant.id);
    });
  }, [hoveredCell, selectedPlant, plantedWithInfo, config.width, config.length, displayCols, displayRows]);

  // Find which raised bed / zone a cell belongs to
  const getCellOverlay = useCallback((col: number, row: number) => {
    const cellX = (col / displayCols) * config.width;
    const cellZ = (row / displayRows) * config.length;

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

  const handleCellClick = (col: number, row: number, e: React.MouseEvent<HTMLDivElement>) => {
    const cellKey = `${col}-${row}`;
    const planted = cellPlantMap.get(cellKey);

    // If no plant selected and cell is occupied, show plant info popover
    if (!selectedPlant && planted?.plant) {
      const cellEl = e.currentTarget;
      const rect = cellEl.getBoundingClientRect();
      setSelectedCellInfo({
        idx: planted.idx,
        col,
        row,
        rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
      });
      return;
    }

    // Close popover if open
    setSelectedCellInfo(null);

    if (!selectedPlant) return;
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

  // Auto-place N plants with proper spacing across the grid
  const autoPlacePlants = useCallback((plant: Plant, quantity: number) => {
    const spacingCells = Math.max(1, Math.ceil(plant.spacingCm / 10));
    // Build set of occupied cells
    const occupied = new Set<string>();
    config.plantedItems.forEach((item) => {
      const col = Math.round((item.x / 100) * displayCols);
      const row = Math.round((item.z / 100) * displayRows);
      // Mark spacing radius as occupied
      for (let dc = -spacingCells; dc <= spacingCells; dc++) {
        for (let dr = -spacingCells; dr <= spacingCells; dr++) {
          occupied.add(`${col + dc}-${row + dr}`);
        }
      }
    });
    // Collect candidate cells in row-major order
    const candidates: { col: number; row: number }[] = [];
    for (let row = 0; row < displayRows; row += spacingCells) {
      for (let col = 0; col < displayCols; col += spacingCells) {
        const key = `${col}-${row}`;
        if (!occupied.has(key)) {
          candidates.push({ col, row });
        }
      }
    }
    const toPlace = candidates.slice(0, quantity);
    toPlace.forEach(({ col, row }) => {
      const pctX = (col / displayCols) * 100;
      const pctZ = (row / displayRows) * 100;
      addPlant(plant.id, pctX, pctZ);
      // Mark as occupied for subsequent placements
      for (let dc = -spacingCells; dc <= spacingCells; dc++) {
        for (let dr = -spacingCells; dr <= spacingCells; dr++) {
          occupied.add(`${col + dc}-${row + dr}`);
        }
      }
    });
    // Pulse first placed cell
    if (toPlace.length > 0) {
      setPulseCell(toPlace[0]);
      setTimeout(() => setPulseCell(null), 600);
    }
    return toPlace.length;
  }, [config.plantedItems, displayCols, displayRows, addPlant]);

  const openAddModal = () => {
    setAddModalPlant(null);
    setAddModalQuantity(1);
    setAddModalSearch('');
    setShowAddModal(true);
  };

  const handleAddModalConfirm = () => {
    if (!addModalPlant) return;
    autoPlacePlants(addModalPlant, addModalQuantity);
    setShowAddModal(false);
    // Also set selectedPlant so user can manually add more by clicking
    setSelectedPlant(addModalPlant);
  };

  const addModalFilteredPlants = useMemo(() => {
    if (!addModalSearch) return plants;
    const q = addModalSearch.toLowerCase();
    return plants.filter(p => p.name.fr.toLowerCase().includes(q) || p.name.en.toLowerCase().includes(q));
  }, [plants, addModalSearch]);

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

  const handleSelectPlantFromPicker = (plant: Plant) => {
    setSelectedPlant(plant);
    setShowPlantPicker(false);
    setMobileSheetOpen(false);
  };

  // Shared plant list renderer (used by both desktop sidebar and mobile sheet)
  const renderPlantList = (maxHeight: string) => (
    <>
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

      <div className={`${maxHeight} overflow-y-auto space-y-1`}>
        {filteredPlants.map((plant) => (
          <button
            key={plant.id}
            onClick={() => handleSelectPlantFromPicker(plant)}
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
    </>
  );

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#0D1F17] flex items-center justify-center">
        <div className="animate-pulse text-green-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D1F17] py-8 px-4 sm:px-6 pb-24 lg:pb-8 relative">
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
            <span className="text-green-400/60 text-xs ml-auto hidden sm:inline">
              {t('spacing', { cm: selectedPlant.spacingCm })}
            </span>
            <button
              onClick={() => setSelectedPlant(null)}
              className="text-green-600 hover:text-red-400 transition-colors cursor-pointer lg:hidden"
            >
              <X className="w-4 h-4" />
            </button>
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
              <div className="overflow-auto pb-4" ref={gridRef}>
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
                    const isCompanionCell = cellsWithCompanions.has(cellKey);
                    const isHovered = hoveredCell?.col === col && hoveredCell?.row === row;
                    const isPulsing = pulseCell?.col === col && pulseCell?.row === row;
                    const isSelected = selectedCellInfo?.col === col && selectedCellInfo?.row === row;

                    // Determine cell background
                    let bgColor = '#0D1F17';
                    if (planted?.plant) {
                      bgColor = planted.plant.color + '30';
                    } else if (isHovered && selectedPlant) {
                      if (hoverEnemyWarning) {
                        bgColor = 'rgba(239, 68, 68, 0.15)';
                      } else if (hoverCompanionHint) {
                        bgColor = 'rgba(74, 222, 128, 0.25)';
                      } else {
                        bgColor = 'rgba(74, 222, 128, 0.15)';
                      }
                    } else if (overlay) {
                      bgColor = overlay.color;
                    }

                    // Companion glow when in placement mode
                    const companionGlow = selectedPlant && isCompanionCell && planted?.plant;

                    return (
                      <div
                        key={idx}
                        onClick={(e) => handleCellClick(col, row, e)}
                        onMouseEnter={() => setHoveredCell({ col, row })}
                        onMouseLeave={() => setHoveredCell(null)}
                        className={`relative border transition-all duration-150 ${
                          selectedPlant ? 'cursor-crosshair' : planted ? 'cursor-pointer' : 'cursor-default'
                        } ${planted ? 'border-green-800/30' : 'border-green-900/20 border-dashed'} ${
                          isSelected ? 'ring-2 ring-green-400 z-10' : ''
                        } ${companionGlow ? 'ring-1 ring-green-400/50' : ''}`}
                        style={{
                          backgroundColor: bgColor,
                          ...(isPulsing ? {
                            animation: 'plantPulse 0.6s ease-out',
                          } : {}),
                          ...(companionGlow ? {
                            boxShadow: 'inset 0 0 6px rgba(74, 222, 128, 0.3)',
                          } : {}),
                        }}
                        title={
                          planted?.plant
                            ? (locale === 'fr' ? planted.plant.name.fr : planted.plant.name.en) +
                              (enemyNames?.length ? ` \u26A0 ${enemyNames.join(', ')}` : '') +
                              (companionGlow ? ` \u2764 ${t('companionNearby')}` : '')
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
                        {/* Companion indicator on cell */}
                        {companionGlow && (
                          <div
                            className="absolute -top-0.5 -left-0.5 w-3.5 h-3.5 rounded-full bg-green-500/80 flex items-center justify-center text-white z-10"
                            style={{ fontSize: 8, lineHeight: 1 }}
                          >
                            ♥
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

              {/* Empty state CTA overlay */}
              {config.plantedItems.length === 0 && !selectedPlant && (
                <div className="flex flex-col items-center justify-center py-10 gap-4">
                  <div className="w-16 h-16 rounded-full bg-green-900/40 border-2 border-dashed border-green-700/50 flex items-center justify-center">
                    <span className="text-3xl">🌱</span>
                  </div>
                  <div className="text-center">
                    <p className="text-green-100 font-semibold text-base mb-1">Votre jardin est vide</p>
                    <p className="text-green-400/60 text-sm">Ajoutez vos premiers légumes pour commencer</p>
                  </div>
                  <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-green-700/40 hover:bg-green-700/60 border border-green-600/50 text-green-100 font-medium text-sm transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter un légume
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Desktop Sidebar (hidden on mobile) */}
          <div className="hidden lg:block space-y-4">
            {/* Plant picker */}
            <Card>
              <CardTitle className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-green-400" />
                  {t('selectPlant')}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={openAddModal}
                    className="gap-1 text-green-400 border border-green-700/40 hover:bg-green-900/30"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Ajouter
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPlantPicker(!showPlantPicker)}
                  >
                    {showPlantPicker ? t('hide') : t('show')}
                  </Button>
                </div>
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
                  {renderPlantList('max-h-64')}
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

          {/* Mobile summary below grid (visible on mobile only, no plant picker here) */}
          <div className="lg:hidden space-y-4">
            {/* Compact summary */}
            <div className="flex gap-3 text-xs text-green-300/70">
              <span>{t('totalPlants')}: <strong className="text-green-100">{config.plantedItems.length}</strong></span>
              <span>{t('gardenArea')}: <strong className="text-green-100">{(config.length * config.width).toFixed(1)} m²</strong></span>
              <span>{t('usedArea')}: <strong className="text-green-100">{usedArea.toFixed(1)} m²</strong></span>
            </div>

            {/* Warnings on mobile */}
            {warnings.length > 0 && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-yellow-900/20 border border-yellow-800/30">
                <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  {warnings.map((w, i) => (
                    <p key={i} className="text-xs text-yellow-300/80">{w}</p>
                  ))}
                </div>
              </div>
            )}

            {warnings.length === 0 && plantedWithInfo.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-green-400/60">
                <Check className="w-3.5 h-3.5" />
                {t('noWarnings')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== MOBILE FIXED BOTTOM BAR ===== */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
        <div className="bg-[#0f2819]/95 backdrop-blur-md border-t border-green-800/40 px-4 py-3 safe-area-pb">
          {selectedPlant ? (
            <div className="flex items-center gap-3">
              <span className="text-xl">{CATEGORY_EMOJI[selectedPlant.category] || '\uD83C\uDF31'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-green-50 font-medium text-sm truncate">
                  {locale === 'fr' ? selectedPlant.name.fr : selectedPlant.name.en}
                </p>
                <p className="text-green-400/60 text-[11px]">{t('readyToPlace')}</p>
              </div>
              <button
                onClick={() => setSelectedPlant(null)}
                className="px-3 py-1.5 text-xs text-red-400 border border-red-800/30 rounded-lg hover:bg-red-900/20 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={() => setMobileSheetOpen(true)}
                className="px-3 py-1.5 text-xs text-green-200 border border-green-700/40 rounded-lg hover:bg-green-900/30 transition-colors cursor-pointer"
              >
                {t('selectPlant')}
              </button>
            </div>
          ) : (
            <button
              onClick={openAddModal}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-700/40 border border-green-600/50 text-green-100 font-semibold text-sm active:bg-green-700/60 transition-colors cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              Ajouter un légume
            </button>
          )}
        </div>
      </div>

      {/* ===== MOBILE BOTTOM SHEET ===== */}
      {mobileSheetOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 transition-opacity"
            onClick={() => setMobileSheetOpen(false)}
          />
          {/* Sheet */}
          <div
            ref={sheetRef}
            className="absolute bottom-0 left-0 right-0 bg-[#0f2819] border-t border-green-700/50 rounded-t-2xl shadow-2xl shadow-black/50 animate-slideUp safe-area-pb"
            style={{ maxHeight: '75vh' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-green-700/50" />
            </div>

            {/* Sheet header */}
            <div className="flex items-center justify-between px-4 pb-3 border-b border-green-800/30">
              <h3 className="text-green-50 font-semibold text-base flex items-center gap-2">
                <Leaf className="w-4 h-4 text-green-400" />
                {t('catalog')}
              </h3>
              <span className="text-green-400/50 text-xs">
                {t('plantsAvailable', { count: filteredPlants.length })}
              </span>
            </div>

            {/* Sheet content */}
            <div className="px-4 py-3 overflow-y-auto" style={{ maxHeight: 'calc(75vh - 80px)' }}>
              {renderPlantList('max-h-[50vh]')}
            </div>
          </div>
        </div>
      )}

      {/* Plant info popover */}
      {selectedCellInfo && (() => {
        const item = config.plantedItems[selectedCellInfo.idx];
        if (!item) return null;
        const plant = getPlantById(item.plantId);
        if (!plant) return null;
        const plantName = locale === 'fr' ? plant.name.fr : plant.name.en;
        const variety = item.varietyId ? plant.varieties?.find(v => v.id === item.varietyId) : null;
        const varietyName = variety ? (locale === 'fr' ? variety.name.fr : variety.name.en) : null;
        const enemyNames = cellsWithEnemies.get(`${selectedCellInfo.col}-${selectedCellInfo.row}`);
        const companionNames = plant.companionPlants
          .slice(0, 5)
          .map(id => {
            const cp = getPlantById(id);
            return cp ? (locale === 'fr' ? cp.name.fr : cp.name.en) : null;
          })
          .filter(Boolean);
        const enemyPlantNames = plant.enemyPlants
          .slice(0, 5)
          .map(id => {
            const ep = getPlantById(id);
            return ep ? (locale === 'fr' ? ep.name.fr : ep.name.en) : null;
          })
          .filter(Boolean);

        // Position popover near the cell
        const popTop = selectedCellInfo.rect.top + selectedCellInfo.rect.height + 8;
        const popLeft = selectedCellInfo.rect.left + selectedCellInfo.rect.width / 2;

        // Determine target location
        const bed = item.raisedBedId ? (config.raisedBeds || []).find(b => b.id === item.raisedBedId) : null;
        const zone = item.zoneId ? (config.zones || []).find(z => z.id === item.zoneId) : null;

        return (
          <div
            ref={popoverRef}
            className="fixed z-50 w-72 bg-[#0f2819] border border-green-700/50 rounded-xl shadow-2xl shadow-black/50 overflow-hidden"
            style={{
              top: Math.min(popTop, window.innerHeight - 380),
              left: Math.min(Math.max(popLeft - 144, 8), window.innerWidth - 296),
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-green-900/30 border-b border-green-800/30">
              <span className="text-2xl">{CATEGORY_EMOJI[plant.category] || '\uD83C\uDF31'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-green-50 font-semibold text-sm truncate">{plantName}</p>
                {varietyName && (
                  <p className="text-green-400/70 text-xs">{t('variety')}: {varietyName}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedCellInfo(null)}
                className="text-green-600 hover:text-green-300 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Details */}
            <div className="px-4 py-3 space-y-2.5">
              {/* Quick stats row */}
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1 text-green-300/70">
                  <Sun className="w-3 h-3" />
                  {t('spacing', { cm: plant.spacingCm })}
                </span>
                <span className="flex items-center gap-1 text-green-300/70">
                  <Droplets className="w-3 h-3" />
                  {t('harvestDays')}: {t('daysUnit', { days: variety?.harvestDays || plant.harvestDays })}
                </span>
              </div>

              {/* Planted in */}
              {(bed || zone) && (
                <div className="text-xs text-green-400/60">
                  {t('plantedIn')}: {bed ? `${t('bed')} — ${bed.name}` : zone ? `${t('zone')} — ${zone.name}` : t('ground')}
                </div>
              )}

              {/* Companions */}
              {companionNames.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-green-500/50 mb-1 flex items-center gap-1">
                    <Heart className="w-2.5 h-2.5" />
                    {t('companions')}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {companionNames.map((name, i) => (
                      <span key={i} className="px-1.5 py-0.5 text-[10px] rounded bg-green-900/40 text-green-300/80 border border-green-800/30">
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Enemies */}
              {enemyPlantNames.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-red-500/50 mb-1 flex items-center gap-1">
                    <ShieldAlert className="w-2.5 h-2.5" />
                    {t('enemies')}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {enemyPlantNames.map((name, i) => (
                      <span key={i} className="px-1.5 py-0.5 text-[10px] rounded bg-red-900/20 text-red-300/80 border border-red-800/30">
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Active enemy warning */}
              {enemyNames && enemyNames.length > 0 && (
                <div className="flex items-start gap-2 px-2.5 py-2 rounded-lg bg-red-900/20 border border-red-800/30">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-red-300/80">
                    {enemyNames.map(n => t('enemyWarning', { a: plantName, b: n })).join('. ')}
                  </p>
                </div>
              )}
            </div>

            {/* Remove button */}
            <div className="px-4 py-3 border-t border-green-800/30">
              <button
                onClick={() => {
                  removePlant(selectedCellInfo.idx);
                  setSelectedCellInfo(null);
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 bg-red-900/15 hover:bg-red-900/30 border border-red-800/30 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {t('removePlant')}
              </button>
            </div>
          </div>
        );
      })()}

      {/* ===== ADD PLANT MODAL ===== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowAddModal(false)} />
          <div
            ref={addModalRef}
            className="relative w-full sm:max-w-md bg-[#0f2819] border border-green-700/50 rounded-t-2xl sm:rounded-2xl shadow-2xl shadow-black/60 overflow-hidden animate-slideUp"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-green-800/30">
              <div>
                <h2 className="text-green-50 font-bold text-lg">Ajouter un légume</h2>
                <p className="text-green-400/60 text-xs mt-0.5">Choisissez et plantez en quelques taps</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-green-600 hover:text-green-300 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-5 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 80px)' }}>
              {/* Step 1: Which vegetable */}
              <div>
                <p className="text-green-300/80 text-xs font-semibold uppercase tracking-wider mb-3">
                  1. Quel légume ?
                </p>
                {/* Search */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500/50" />
                  <input
                    type="text"
                    value={addModalSearch}
                    onChange={(e) => setAddModalSearch(e.target.value)}
                    placeholder="Rechercher un légume..."
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-[#0D1F17] border border-green-800/30 text-green-100 placeholder:text-green-600/40 focus:outline-none focus:border-green-600/50"
                    autoFocus
                  />
                </div>
                {/* Plant grid */}
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {addModalFilteredPlants.map((plant) => (
                    <button
                      key={plant.id}
                      onClick={() => setAddModalPlant(plant)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl text-left transition-all cursor-pointer border ${
                        addModalPlant?.id === plant.id
                          ? 'bg-green-900/50 border-green-600/60 ring-1 ring-green-500/40'
                          : 'bg-[#0D1F17] border-green-900/20 hover:border-green-700/40 hover:bg-green-900/20'
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-lg shrink-0"
                        style={{ backgroundColor: plant.color + '20' }}
                      >
                        {CATEGORY_EMOJI[plant.category] || '🌱'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-sm text-green-100 font-medium block truncate leading-tight">
                          {locale === 'fr' ? plant.name.fr : plant.name.en}
                        </span>
                        <span className="text-[10px] text-green-500/60 block">
                          {plant.spacingCm}cm espacement
                        </span>
                      </div>
                      {addModalPlant?.id === plant.id && (
                        <Check className="w-4 h-4 text-green-400 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Quantity — only show after plant is selected */}
              {addModalPlant && (
                <div>
                  <p className="text-green-300/80 text-xs font-semibold uppercase tracking-wider mb-3">
                    2. Combien de pieds ?
                  </p>
                  {/* Preset buttons */}
                  <div className="flex gap-2 mb-3">
                    {[1, 2, 3, 5, 10].map((n) => (
                      <button
                        key={n}
                        onClick={() => setAddModalQuantity(n)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer border ${
                          addModalQuantity === n
                            ? 'bg-green-700/50 border-green-600/60 text-green-100 ring-1 ring-green-500/40'
                            : 'bg-[#0D1F17] border-green-900/20 text-green-400/70 hover:border-green-700/40 hover:text-green-200'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  {/* Custom input */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setAddModalQuantity(Math.max(1, addModalQuantity - 1))}
                      className="w-10 h-10 rounded-xl bg-[#0D1F17] border border-green-800/30 text-green-300 hover:bg-green-900/30 transition-colors cursor-pointer flex items-center justify-center text-lg font-bold"
                    >−</button>
                    <div className="flex-1 text-center">
                      <span className="text-3xl font-bold text-green-50">{addModalQuantity}</span>
                      <span className="text-green-400/60 text-sm ml-2">pied{addModalQuantity > 1 ? 's' : ''}</span>
                    </div>
                    <button
                      onClick={() => setAddModalQuantity(addModalQuantity + 1)}
                      className="w-10 h-10 rounded-xl bg-[#0D1F17] border border-green-800/30 text-green-300 hover:bg-green-900/30 transition-colors cursor-pointer flex items-center justify-center text-lg font-bold"
                    >+</button>
                  </div>
                  {/* Info hint */}
                  <p className="text-green-500/50 text-xs text-center mt-2">
                    Ils seront placés automatiquement avec le bon espacement
                  </p>
                </div>
              )}

              {/* CTA */}
              <button
                onClick={handleAddModalConfirm}
                disabled={!addModalPlant}
                className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-base transition-all ${
                  addModalPlant
                    ? 'bg-green-600 hover:bg-green-500 text-white cursor-pointer shadow-lg shadow-green-900/40'
                    : 'bg-green-900/20 text-green-700/50 cursor-not-allowed'
                }`}
              >
                <Leaf className="w-5 h-5" />
                {addModalPlant
                  ? `Planter ${addModalQuantity} ${addModalQuantity > 1 ? (locale === 'fr' ? addModalPlant.name.fr : addModalPlant.name.en) + 's' : (locale === 'fr' ? addModalPlant.name.fr : addModalPlant.name.en)}`
                  : 'Choisissez un légume'}
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Animations */}
      <style jsx global>{`
        @keyframes plantPulse {
          0% { box-shadow: inset 0 0 0 0 rgba(74, 222, 128, 0.6); }
          50% { box-shadow: inset 0 0 8px 2px rgba(74, 222, 128, 0.4); }
          100% { box-shadow: inset 0 0 0 0 rgba(74, 222, 128, 0); }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        .safe-area-pb {
          padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
        }
      `}</style>
    </div>
  );
}
