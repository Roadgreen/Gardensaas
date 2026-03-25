'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardTitle, CardContent } from '@/components/ui/card';
import { useGarden, usePlants } from '@/lib/hooks';
import { getPlantById } from '@/lib/garden-utils';
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
  Leaf,
  Sparkles,
  Minus,
  ShoppingBasket,
  Zap,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { Plant } from '@/types';

const CELL_SIZE = 40;

const CATEGORY_EMOJI: Record<string, string> = {
  vegetable: '🥦',
  herb: '🌿',
  fruit: '🍓',
  root: '🥕',
  ancient: '🌾',
  exotic: '🌴',
};

const CATEGORIES = ['all', 'vegetable', 'herb', 'fruit', 'root', 'ancient', 'exotic'] as const;

// ─── Smart placement algorithm ───────────────────────────────────────────────

interface PlantRequest {
  plant: Plant;
  quantity: number;
}

interface PlacedResult {
  plantId: string;
  x: number; // percentage 0-100
  z: number; // percentage 0-100
}

/**
 * Smart auto-placement algorithm.
 * - Respects per-plant spacing (spacingCm)
 * - Places companion plants near each other
 * - Keeps enemy plants far apart
 * - Considers already-planted items
 * - Sorts by largest spacing first (hardest to fit)
 */
function smartAutoPlace(
  requests: PlantRequest[],
  existingItems: { plantId: string; x: number; z: number }[],
  gardenWidthM: number,
  gardenLengthM: number,
): PlacedResult[] {
  const gardenWidthCm = gardenWidthM * 100;
  const gardenLengthCm = gardenLengthM * 100;

  // All placed plants (existing + newly placed)
  const allPlaced: { plantId: string; xCm: number; zCm: number; spacingCm: number }[] = [];

  // Convert existing items (stored as % of garden dimensions in the store)
  for (const item of existingItems) {
    const plant = getPlantById(item.plantId);
    allPlaced.push({
      plantId: item.plantId,
      xCm: (item.x / 100) * gardenWidthCm,
      zCm: (item.z / 100) * gardenLengthCm,
      spacingCm: plant?.spacingCm ?? 30,
    });
  }

  // Flatten requests sorted by largest spacing first (hardest to place)
  const sortedItems: { plant: Plant; idx: number }[] = [];
  const sorted = [...requests].sort((a, b) => b.plant.spacingCm - a.plant.spacingCm);
  for (const req of sorted) {
    for (let i = 0; i < req.quantity; i++) {
      sortedItems.push({ plant: req.plant, idx: i });
    }
  }

  const results: PlacedResult[] = [];
  const MARGIN_CM = 10; // margin from garden edges

  for (const { plant } of sortedItems) {
    const spacing = plant.spacingCm;
    const rowSpacing = plant.rowSpacingCm ?? Math.round(spacing * 1.5);

    let bestPos: { xCm: number; zCm: number } | null = null;
    let bestScore = -Infinity;

    // Scan candidate positions in a grid pattern
    const stepX = Math.max(spacing * 0.5, 10);
    const stepZ = Math.max(rowSpacing * 0.5, 10);

    for (let zCm = MARGIN_CM + spacing / 2; zCm <= gardenLengthCm - MARGIN_CM; zCm += stepZ) {
      for (let xCm = MARGIN_CM + spacing / 2; xCm <= gardenWidthCm - MARGIN_CM; xCm += stepX) {
        // Check minimum distance to all existing plants
        let tooClose = false;
        let companionScore = 0;
        let enemyScore = 0;

        for (const placed of allPlaced) {
          const dist = Math.sqrt(Math.pow(placed.xCm - xCm, 2) + Math.pow(placed.zCm - zCm, 2));
          const minDist = (spacing + placed.spacingCm) / 2;

          if (dist < minDist) {
            tooClose = true;
            break;
          }

          // Companion bonus: close is better (within 1.5x spacing)
          if (dist < minDist * 3) {
            const placedPlant = getPlantById(placed.plantId);
            if (placedPlant) {
              if (plant.companionPlants.includes(placed.plantId) || placedPlant.companionPlants.includes(plant.id)) {
                companionScore += 10 * (1 - dist / (minDist * 3));
              }
              if (plant.enemyPlants.includes(placed.plantId) || placedPlant.enemyPlants.includes(plant.id)) {
                enemyScore -= 20 * (1 - dist / (minDist * 3));
              }
            }
          }
        }

        if (tooClose) continue;

        // Base score: prefer compact layout (closer to top-left)
        const layoutScore = -(xCm + zCm) * 0.01;
        const totalScore = layoutScore + companionScore + enemyScore;

        if (totalScore > bestScore) {
          bestScore = totalScore;
          bestPos = { xCm, zCm };
        }
      }
    }

    if (bestPos) {
      allPlaced.push({ plantId: plant.id, xCm: bestPos.xCm, zCm: bestPos.zCm, spacingCm: spacing });
      results.push({
        plantId: plant.id,
        x: (bestPos.xCm / gardenWidthCm) * 100,
        z: (bestPos.zCm / gardenLengthCm) * 100,
      });
    }
    // If no valid position found, skip (garden is full)
  }

  return results;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function GardenPlanner() {
  const { config, isLoaded, addPlant, removePlant, clearGarden } = useGarden();
  const { plants } = usePlants();
  const t = useTranslations('planner2d');
  const locale = useLocale();

  // ── Cart state ──
  const [cart, setCart] = useState<Map<string, number>>(new Map());
  const [showCart, setShowCart] = useState(false);

  // ── Plant picker state ──
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [pickerOpen, setPickerOpen] = useState(false);

  // ── Manual placement state ──
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);

  // ── Grid interaction ──
  const [hoveredCell, setHoveredCell] = useState<{ col: number; row: number } | null>(null);
  const [pulseCell, setPulseCell] = useState<{ col: number; row: number } | null>(null);

  // ── Plant info popover ──
  const [selectedCellInfo, setSelectedCellInfo] = useState<{
    idx: number; col: number; row: number;
    rect: { top: number; left: number; width: number; height: number };
  } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // ── Placement result summary ──
  const [lastPlaceResult, setLastPlaceResult] = useState<{ placed: number; skipped: number } | null>(null);

  // Close popover on click outside
  useEffect(() => {
    if (!selectedCellInfo) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) setSelectedCellInfo(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [selectedCellInfo]);

  // Prevent body scroll when picker is open
  useEffect(() => {
    if (pickerOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [pickerOpen]);

  // ── Grid dimensions ──
  const gridCols = Math.floor(config.width * 10);
  const gridRows = Math.floor(config.length * 10);
  const displayCols = Math.min(gridCols, 30);
  const displayRows = Math.min(gridRows, 40);
  const cellW = Math.max(20, Math.min(CELL_SIZE, 600 / displayCols));
  const cellH = cellW;

  // ── Plant data enrichment ──
  const plantedWithInfo = useMemo(() => {
    return config.plantedItems.map((item, idx) => ({
      ...item, idx, plant: getPlantById(item.plantId),
    }));
  }, [config.plantedItems]);

  const cellPlantMap = useMemo(() => {
    const map = new Map<string, typeof plantedWithInfo[number]>();
    plantedWithInfo.forEach((p) => {
      const pCol = Math.round((p.x / config.width) * displayCols);
      const pRow = Math.round((p.z / config.length) * displayRows);
      map.set(`${pCol}-${pRow}`, p);
    });
    return map;
  }, [plantedWithInfo, config.width, config.length, displayCols, displayRows]);

  const cellsWithEnemies = useMemo(() => {
    const enemyCells = new Map<string, string[]>();
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

  const cellsWithCompanions = useMemo(() => {
    if (!selectedPlant) return new Set<string>();
    const set = new Set<string>();
    for (const p of plantedWithInfo) {
      if (!p.plant) continue;
      if (selectedPlant.companionPlants.includes(p.plantId) || p.plant.companionPlants.includes(selectedPlant.id)) {
        set.add(`${Math.round((p.x / config.width) * displayCols)}-${Math.round((p.z / config.length) * displayRows)}`);
      }
    }
    return set;
  }, [selectedPlant, plantedWithInfo, config.width, config.length, displayCols, displayRows]);

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

  const hoverEnemyWarning = useMemo(() => {
    if (!hoveredCell || !selectedPlant) return false;
    const cellX = (hoveredCell.col / displayCols) * config.width;
    const cellZ = (hoveredCell.row / displayRows) * config.length;
    return plantedWithInfo.some((p) => {
      if (!p.plant) return false;
      const dist = Math.sqrt(Math.pow(p.x - cellX, 2) + Math.pow(p.z - cellZ, 2));
      return dist < 1 && (selectedPlant.enemyPlants.includes(p.plantId) || p.plant.enemyPlants.includes(selectedPlant.id));
    });
  }, [hoveredCell, selectedPlant, plantedWithInfo, config.width, config.length, displayCols, displayRows]);

  const hoverCompanionHint = useMemo(() => {
    if (!hoveredCell || !selectedPlant) return false;
    const cellX = (hoveredCell.col / displayCols) * config.width;
    const cellZ = (hoveredCell.row / displayRows) * config.length;
    return plantedWithInfo.some((p) => {
      if (!p.plant) return false;
      const dist = Math.sqrt(Math.pow(p.x - cellX, 2) + Math.pow(p.z - cellZ, 2));
      return dist < 1 && (selectedPlant.companionPlants.includes(p.plantId) || p.plant.companionPlants.includes(selectedPlant.id));
    });
  }, [hoveredCell, selectedPlant, plantedWithInfo, config.width, config.length, displayCols, displayRows]);

  const usedArea = plantedWithInfo.reduce((acc, p) => {
    if (!p.plant) return acc;
    return acc + Math.pow(p.plant.spacingCm / 100, 2);
  }, 0);

  const filteredPlants = useMemo(() => {
    return plants.filter((plant) => {
      if (categoryFilter !== 'all' && plant.category !== categoryFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return plant.name.en.toLowerCase().includes(q) || plant.name.fr.toLowerCase().includes(q);
      }
      return true;
    });
  }, [plants, categoryFilter, searchQuery]);

  // ── Cart helpers ──
  const cartTotal = useMemo(() => {
    let total = 0;
    cart.forEach(v => total += v);
    return total;
  }, [cart]);

  const cartItems = useMemo(() => {
    const items: { plant: Plant; quantity: number }[] = [];
    cart.forEach((qty, plantId) => {
      const plant = getPlantById(plantId);
      if (plant && qty > 0) items.push({ plant, quantity: qty });
    });
    return items;
  }, [cart]);

  // Cart warnings (companion/enemy between cart items)
  const cartWarnings = useMemo(() => {
    const warns: string[] = [];
    const ids = cartItems.map(i => i.plant.id);
    for (let i = 0; i < cartItems.length; i++) {
      for (let j = i + 1; j < cartItems.length; j++) {
        const a = cartItems[i].plant;
        const b = cartItems[j].plant;
        if (a.enemyPlants.includes(b.id) || b.enemyPlants.includes(a.id)) {
          warns.push(locale === 'fr'
            ? `${a.name.fr} et ${b.name.fr} sont ennemis - l'algo les espacera au maximum`
            : `${a.name.en} and ${b.name.en} are enemies - algorithm will space them apart`
          );
        }
      }
    }
    return warns;
  }, [cartItems, locale]);

  const cartCompanions = useMemo(() => {
    const companions: string[] = [];
    for (let i = 0; i < cartItems.length; i++) {
      for (let j = i + 1; j < cartItems.length; j++) {
        const a = cartItems[i].plant;
        const b = cartItems[j].plant;
        if (a.companionPlants.includes(b.id) || b.companionPlants.includes(a.id)) {
          companions.push(locale === 'fr'
            ? `${a.name.fr} + ${b.name.fr}`
            : `${a.name.en} + ${b.name.en}`
          );
        }
      }
    }
    return companions;
  }, [cartItems, locale]);

  const addToCart = (plantId: string) => {
    setCart(prev => {
      const next = new Map(prev);
      next.set(plantId, (prev.get(plantId) || 0) + 1);
      return next;
    });
  };

  const removeFromCart = (plantId: string) => {
    setCart(prev => {
      const next = new Map(prev);
      const current = prev.get(plantId) || 0;
      if (current <= 1) next.delete(plantId);
      else next.set(plantId, current - 1);
      return next;
    });
  };

  const setCartQuantity = (plantId: string, qty: number) => {
    setCart(prev => {
      const next = new Map(prev);
      if (qty <= 0) next.delete(plantId);
      else next.set(plantId, qty);
      return next;
    });
  };

  // ── Execute smart placement ──
  const executeSmartPlace = useCallback(() => {
    if (cartItems.length === 0) return;

    const requests: PlantRequest[] = cartItems.map(item => ({
      plant: item.plant,
      quantity: item.quantity,
    }));

    // Convert existing plantedItems to the format expected by smartAutoPlace
    // plantedItems store x,z as percentage of garden size (0-100)
    const existingForAlgo = config.plantedItems.map(item => ({
      plantId: item.plantId,
      x: item.x, // already percentage
      z: item.z,
    }));

    const results = smartAutoPlace(requests, existingForAlgo, config.width, config.length);

    // Add all placed plants to the store
    for (const res of results) {
      addPlant(res.plantId, res.x, res.z);
    }

    const totalRequested = requests.reduce((acc, r) => acc + r.quantity, 0);
    setLastPlaceResult({ placed: results.length, skipped: totalRequested - results.length });

    // Clear cart
    setCart(new Map());
    setShowCart(false);

    // Clear result after 5s
    setTimeout(() => setLastPlaceResult(null), 5000);
  }, [cartItems, config.plantedItems, config.width, config.length, addPlant]);

  // ── Grid cell click ──
  const handleCellClick = (col: number, row: number, e: React.MouseEvent<HTMLDivElement>) => {
    const cellKey = `${col}-${row}`;
    const planted = cellPlantMap.get(cellKey);

    if (!selectedPlant && planted?.plant) {
      const cellEl = e.currentTarget;
      const rect = cellEl.getBoundingClientRect();
      setSelectedCellInfo({ idx: planted.idx, col, row, rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height } });
      return;
    }

    setSelectedCellInfo(null);
    if (!selectedPlant) return;

    const pctX = (col / displayCols) * 100;
    const pctZ = (row / displayRows) * 100;
    addPlant(selectedPlant.id, pctX, pctZ);
    setPulseCell({ col, row });
    setTimeout(() => setPulseCell(null), 600);
  };

  const getCellOverlay = useCallback((col: number, row: number) => {
    const cellX = (col / displayCols) * config.width;
    const cellZ = (row / displayRows) * config.length;
    for (const bed of config.raisedBeds || []) {
      const bedL = (bed.x / 100) * config.width;
      const bedT = (bed.z / 100) * config.length;
      if (cellX >= bedL - bed.lengthM / 2 && cellX <= bedL + bed.lengthM / 2 && cellZ >= bedT - bed.widthM / 2 && cellZ <= bedT + bed.widthM / 2) {
        return { type: 'bed' as const, name: bed.name, color: 'rgba(210, 160, 108, 0.15)' };
      }
    }
    for (const zone of config.zones || []) {
      const zoneL = (zone.x / 100) * config.width;
      const zoneT = (zone.z / 100) * config.length;
      if (cellX >= zoneL - zone.lengthM / 2 && cellX <= zoneL + zone.lengthM / 2 && cellZ >= zoneT - zone.widthM / 2 && cellZ <= zoneT + zone.widthM / 2) {
        return { type: 'zone' as const, name: zone.name, color: `${zone.color}15` };
      }
    }
    return null;
  }, [config.width, config.length, config.raisedBeds, config.zones, displayCols, displayRows]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#0D1F17] flex items-center justify-center">
        <div className="animate-pulse text-green-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D1F17] py-6 px-3 sm:px-6 pb-40 lg:pb-8 relative">
      <div className="max-w-7xl mx-auto">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
          <div>
            <Link href="/garden/dashboard">
              <Button variant="ghost" size="sm" className="mb-1 gap-2">
                <ArrowLeft className="w-4 h-4" />
                {t('dashboard')}
              </Button>
            </Link>
            <h1 className="text-xl md:text-2xl font-bold text-green-50">{t('title')}</h1>
            <p className="text-green-300/60 text-xs">
              {t('subtitle', { length: config.length, width: config.width })}
            </p>
          </div>
          <div className="flex gap-2">
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

        {/* ── Placement result toast ── */}
        {lastPlaceResult && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-green-900/40 border border-green-600/40 flex items-center gap-3 animate-slideUp">
            <Sparkles className="w-5 h-5 text-green-400" />
            <div className="flex-1">
              <p className="text-green-100 text-sm font-medium">
                {lastPlaceResult.placed} {locale === 'fr' ? 'plantes placées' : 'plants placed'}
              </p>
              {lastPlaceResult.skipped > 0 && (
                <p className="text-yellow-400/80 text-xs">
                  {lastPlaceResult.skipped} {locale === 'fr' ? 'non placées (pas assez de place)' : 'skipped (not enough space)'}
                </p>
              )}
            </div>
            <button onClick={() => setLastPlaceResult(null)} className="text-green-600 hover:text-green-300 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── Manual placement indicator ── */}
        {selectedPlant && (
          <div className="mb-4 px-4 py-2 rounded-xl bg-green-900/30 border border-green-700/40 flex items-center gap-3">
            <span className="text-lg">{CATEGORY_EMOJI[selectedPlant.category] || '🌱'}</span>
            <span className="text-green-200 text-sm font-medium flex-1">
              {locale === 'fr'
                ? `Tapez sur la grille pour placer : ${selectedPlant.name.fr}`
                : `Tap the grid to place: ${selectedPlant.name.en}`
              }
            </span>
            <span className="text-green-400/60 text-xs hidden sm:inline">
              {t('spacing', { cm: selectedPlant.spacingCm })}
            </span>
            <button onClick={() => setSelectedPlant(null)} className="text-green-600 hover:text-red-400 transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="grid lg:grid-cols-[1fr_320px] gap-5">
          {/* ── Grid area ── */}
          <Card className="overflow-auto">
            <CardTitle className="flex items-center gap-2 mb-4">
              <Grid3x3 className="w-5 h-5 text-green-400" />
              {t('title')}
            </CardTitle>
            <CardContent>
              <div className="overflow-auto pb-4 -mx-1" ref={gridRef}>
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

                    let bgColor = '#0D1F17';
                    if (planted?.plant) bgColor = planted.plant.color + '30';
                    else if (isHovered && selectedPlant) {
                      bgColor = hoverEnemyWarning ? 'rgba(239, 68, 68, 0.15)' : hoverCompanionHint ? 'rgba(74, 222, 128, 0.25)' : 'rgba(74, 222, 128, 0.15)';
                    } else if (overlay) bgColor = overlay.color;

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
                          ...(isPulsing ? { animation: 'plantPulse 0.6s ease-out' } : {}),
                          ...(companionGlow ? { boxShadow: 'inset 0 0 6px rgba(74, 222, 128, 0.3)' } : {}),
                        }}
                      >
                        {planted?.plant && (
                          <div className="w-full h-full flex flex-col items-center justify-center overflow-hidden">
                            <span className="text-xs leading-none" style={{ fontSize: Math.min(cellW * 0.5, 16) }}>
                              {CATEGORY_EMOJI[planted.plant.category] || '🌱'}
                            </span>
                            {cellW >= 28 && (
                              <span className="text-green-100 leading-none truncate w-full text-center px-0.5" style={{ fontSize: Math.min(cellW * 0.22, 9) }}>
                                {(() => { const name = locale === 'fr' ? planted.plant.name.fr : planted.plant.name.en; return name.length > 8 ? name.slice(0, 7) + '…' : name; })()}
                              </span>
                            )}
                          </div>
                        )}
                        {companionGlow && (
                          <div className="absolute -top-0.5 -left-0.5 w-3.5 h-3.5 rounded-full bg-green-500/80 flex items-center justify-center text-white z-10" style={{ fontSize: 8, lineHeight: 1 }}>♥</div>
                        )}
                        {enemyNames && enemyNames.length > 0 && (
                          <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-500/90 flex items-center justify-center text-white z-10" style={{ fontSize: 8, lineHeight: 1 }} title={`⚠ ${enemyNames.join(', ')}`}>!</div>
                        )}
                        {isHovered && selectedPlant && !planted && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="opacity-40 text-xs">{CATEGORY_EMOJI[selectedPlant.category] || '🌱'}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Empty state */}
              {config.plantedItems.length === 0 && !selectedPlant && (
                <div className="flex flex-col items-center justify-center py-8 gap-4">
                  <div className="w-16 h-16 rounded-full bg-green-900/40 border-2 border-dashed border-green-700/50 flex items-center justify-center">
                    <span className="text-3xl">🌱</span>
                  </div>
                  <div className="text-center">
                    <p className="text-green-100 font-semibold text-base mb-1">
                      {locale === 'fr' ? 'Votre jardin est vide' : 'Your garden is empty'}
                    </p>
                    <p className="text-green-400/60 text-sm">
                      {locale === 'fr' ? 'Ajoutez vos légumes pour commencer' : 'Add your vegetables to get started'}
                    </p>
                  </div>
                  <button
                    onClick={() => setPickerOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-green-700/40 hover:bg-green-700/60 border border-green-600/50 text-green-100 font-medium text-sm transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    {locale === 'fr' ? 'Ajouter des légumes' : 'Add vegetables'}
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Desktop sidebar ── */}
          <div className="hidden lg:block space-y-4">
            {/* Quick add button */}
            <button
              onClick={() => setPickerOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-700/40 hover:bg-green-700/60 border border-green-600/50 text-green-100 font-semibold text-sm transition-colors cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              {locale === 'fr' ? 'Ajouter des légumes' : 'Add vegetables'}
            </button>

            {/* Cart summary (desktop) */}
            {cartItems.length > 0 && (
              <Card className="border-green-600/40">
                <CardTitle className="flex items-center gap-2 mb-3">
                  <ShoppingBasket className="w-5 h-5 text-green-400" />
                  {locale === 'fr' ? 'Panier' : 'Cart'} ({cartTotal})
                </CardTitle>
                <CardContent>
                  <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                    {cartItems.map(({ plant, quantity }) => (
                      <div key={plant.id} className="flex items-center gap-2 p-2 rounded-lg bg-[#0D1F17]">
                        <span className="text-sm">{CATEGORY_EMOJI[plant.category] || '🌱'}</span>
                        <span className="text-xs text-green-100 flex-1 truncate">{locale === 'fr' ? plant.name.fr : plant.name.en}</span>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => removeFromCart(plant.id)} className="w-6 h-6 rounded-md bg-green-900/40 text-green-300 flex items-center justify-center hover:bg-green-800/50 cursor-pointer"><Minus className="w-3 h-3" /></button>
                          <span className="text-green-100 text-sm font-bold w-6 text-center">{quantity}</span>
                          <button onClick={() => addToCart(plant.id)} className="w-6 h-6 rounded-md bg-green-900/40 text-green-300 flex items-center justify-center hover:bg-green-800/50 cursor-pointer"><Plus className="w-3 h-3" /></button>
                        </div>
                        <button onClick={() => setCartQuantity(plant.id, 0)} className="text-green-700 hover:text-red-400 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                  </div>
                  {cartCompanions.length > 0 && (
                    <div className="flex items-start gap-2 px-2 py-1.5 mb-2 rounded-lg bg-green-900/20 border border-green-800/30">
                      <Heart className="w-3 h-3 text-green-400 mt-0.5 shrink-0" />
                      <p className="text-[10px] text-green-300/80">{locale === 'fr' ? 'Bons compagnons' : 'Good companions'}: {cartCompanions.join(', ')}</p>
                    </div>
                  )}
                  {cartWarnings.length > 0 && (
                    <div className="flex items-start gap-2 px-2 py-1.5 mb-2 rounded-lg bg-yellow-900/20 border border-yellow-800/30">
                      <AlertTriangle className="w-3 h-3 text-yellow-400 mt-0.5 shrink-0" />
                      <div className="text-[10px] text-yellow-300/80">{cartWarnings.map((w, i) => <p key={i}>{w}</p>)}</div>
                    </div>
                  )}
                  <button
                    onClick={executeSmartPlace}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-sm transition-all cursor-pointer shadow-lg shadow-green-900/40"
                  >
                    <Zap className="w-4 h-4" />
                    {locale === 'fr' ? `Planter ${cartTotal} légume${cartTotal > 1 ? 's' : ''}` : `Plant ${cartTotal} vegetable${cartTotal > 1 ? 's' : ''}`}
                  </button>
                </CardContent>
              </Card>
            )}

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

            {/* Planted list */}
            {plantedWithInfo.length > 0 && (
              <Card>
                <CardTitle className="mb-3">{t('planted')} ({plantedWithInfo.length})</CardTitle>
                <CardContent>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {plantedWithInfo.map((p) => {
                      const name = p.plant ? (locale === 'fr' ? p.plant.name.fr : p.plant.name.en) : p.plantId;
                      return (
                        <div key={p.idx} className="flex items-center justify-between p-2 rounded-lg bg-[#0D1F17]">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm shrink-0">{p.plant ? (CATEGORY_EMOJI[p.plant.category] || '🌱') : '🌱'}</span>
                            <span className="text-xs text-green-200 truncate">{name}</span>
                          </div>
                          <button onClick={() => removePlant(p.idx)} className="text-green-700 hover:text-red-400 transition-colors cursor-pointer shrink-0 ml-2">
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
                    {warnings.map((w, i) => (<li key={i} className="text-xs text-yellow-300/80">{w}</li>))}
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

          {/* Mobile summary */}
          <div className="lg:hidden space-y-3">
            <div className="flex gap-3 text-xs text-green-300/70">
              <span>{t('totalPlants')}: <strong className="text-green-100">{config.plantedItems.length}</strong></span>
              <span>{t('gardenArea')}: <strong className="text-green-100">{(config.length * config.width).toFixed(1)} m²</strong></span>
            </div>
            {warnings.length > 0 && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-yellow-900/20 border border-yellow-800/30">
                <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                <div className="space-y-1">{warnings.map((w, i) => (<p key={i} className="text-xs text-yellow-300/80">{w}</p>))}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MOBILE FIXED BOTTOM BAR                                           */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
        <div className="bg-[#0f2819]/95 backdrop-blur-md border-t border-green-800/40 safe-area-pb">
          {/* Cart preview bar */}
          {cartItems.length > 0 && (
            <div className="px-4 pt-2 pb-1">
              <button
                onClick={() => setShowCart(!showCart)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl bg-green-900/40 border border-green-700/40 cursor-pointer"
              >
                <ShoppingBasket className="w-4 h-4 text-green-400" />
                <span className="text-green-100 text-sm font-medium flex-1 text-left">
                  {cartTotal} {locale === 'fr' ? 'légume' : 'vegetable'}{cartTotal > 1 ? 's' : ''}
                </span>
                <span className="text-green-400/60 text-xs">
                  {cartItems.length} {locale === 'fr' ? 'type' : 'type'}{cartItems.length > 1 ? 's' : ''}
                </span>
                {showCart ? <ChevronDown className="w-4 h-4 text-green-500" /> : <ChevronUp className="w-4 h-4 text-green-500" />}
              </button>
            </div>
          )}

          {/* Main action buttons */}
          <div className="px-4 py-3 flex gap-2">
            {selectedPlant ? (
              <>
                <div className="flex items-center gap-2 flex-1 min-w-0 px-3 py-2 rounded-xl bg-green-900/30 border border-green-700/40">
                  <span className="text-lg">{CATEGORY_EMOJI[selectedPlant.category] || '🌱'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-green-50 font-medium text-sm truncate">{locale === 'fr' ? selectedPlant.name.fr : selectedPlant.name.en}</p>
                    <p className="text-green-400/60 text-[10px]">{t('readyToPlace')}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedPlant(null)} className="px-3 py-2 text-red-400 border border-red-800/30 rounded-xl hover:bg-red-900/20 transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </>
            ) : cartItems.length > 0 ? (
              <>
                <button
                  onClick={() => setPickerOpen(true)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-900/30 border border-green-700/40 text-green-200 font-medium text-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  {locale === 'fr' ? 'Ajouter' : 'Add more'}
                </button>
                <button
                  onClick={executeSmartPlace}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-sm transition-all cursor-pointer shadow-lg shadow-green-900/40"
                >
                  <Zap className="w-4 h-4" />
                  {locale === 'fr' ? `Planter (${cartTotal})` : `Plant (${cartTotal})`}
                </button>
              </>
            ) : (
              <button
                onClick={() => setPickerOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-green-700/40 border border-green-600/50 text-green-100 font-semibold text-sm active:bg-green-700/60 transition-colors cursor-pointer"
              >
                <Plus className="w-5 h-5" />
                {locale === 'fr' ? 'Ajouter des légumes' : 'Add vegetables'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MOBILE CART SHEET                                                 */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showCart && cartItems.length > 0 && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowCart(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-[#0f2819] border-t border-green-700/50 rounded-t-2xl shadow-2xl shadow-black/50 animate-slideUp safe-area-pb" style={{ maxHeight: '65vh' }}>
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-green-700/50" /></div>
            <div className="flex items-center justify-between px-4 pb-3 border-b border-green-800/30">
              <h3 className="text-green-50 font-semibold text-base flex items-center gap-2">
                <ShoppingBasket className="w-4 h-4 text-green-400" />
                {locale === 'fr' ? 'Mon panier' : 'My cart'} ({cartTotal})
              </h3>
              <button onClick={() => setShowCart(false)} className="text-green-600 hover:text-green-300 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-4 py-3 overflow-y-auto" style={{ maxHeight: 'calc(65vh - 140px)' }}>
              <div className="space-y-2">
                {cartItems.map(({ plant, quantity }) => (
                  <div key={plant.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#0D1F17] border border-green-900/30">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ backgroundColor: plant.color + '20' }}>
                      {CATEGORY_EMOJI[plant.category] || '🌱'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-green-100 text-sm font-medium truncate">{locale === 'fr' ? plant.name.fr : plant.name.en}</p>
                      <p className="text-green-500/60 text-[10px]">{plant.spacingCm}cm {locale === 'fr' ? 'espacement' : 'spacing'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => removeFromCart(plant.id)} className="w-8 h-8 rounded-lg bg-green-900/40 text-green-300 flex items-center justify-center active:bg-green-800/50 cursor-pointer"><Minus className="w-3.5 h-3.5" /></button>
                      <span className="text-green-100 text-base font-bold w-8 text-center">{quantity}</span>
                      <button onClick={() => addToCart(plant.id)} className="w-8 h-8 rounded-lg bg-green-900/40 text-green-300 flex items-center justify-center active:bg-green-800/50 cursor-pointer"><Plus className="w-3.5 h-3.5" /></button>
                    </div>
                    <button onClick={() => setCartQuantity(plant.id, 0)} className="text-green-700 hover:text-red-400 cursor-pointer"><X className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
              {cartCompanions.length > 0 && (
                <div className="flex items-start gap-2 px-3 py-2 mt-3 rounded-lg bg-green-900/20 border border-green-800/30">
                  <Heart className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-green-300/80">{locale === 'fr' ? 'Bons compagnons' : 'Good companions'}: {cartCompanions.join(', ')}</p>
                </div>
              )}
              {cartWarnings.length > 0 && (
                <div className="flex items-start gap-2 px-3 py-2 mt-2 rounded-lg bg-yellow-900/20 border border-yellow-800/30">
                  <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 mt-0.5 shrink-0" />
                  <div className="text-xs text-yellow-300/80">{cartWarnings.map((w, i) => <p key={i}>{w}</p>)}</div>
                </div>
              )}
            </div>
            <div className="px-4 py-3 border-t border-green-800/30">
              <button
                onClick={executeSmartPlace}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-base transition-all cursor-pointer shadow-lg shadow-green-900/40"
              >
                <Zap className="w-5 h-5" />
                {locale === 'fr' ? `Planter ${cartTotal} légume${cartTotal > 1 ? 's' : ''}` : `Plant ${cartTotal} vegetable${cartTotal > 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PLANT PICKER SHEET (works on both mobile & desktop)               */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setPickerOpen(false)} />
          <div className="relative w-full sm:max-w-lg bg-[#0f2819] border border-green-700/50 rounded-t-2xl sm:rounded-2xl shadow-2xl shadow-black/60 overflow-hidden animate-slideUp" style={{ maxHeight: '90vh' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-green-800/30">
              <div>
                <h2 className="text-green-50 font-bold text-lg">{locale === 'fr' ? 'Choisir mes légumes' : 'Choose my vegetables'}</h2>
                <p className="text-green-400/60 text-xs mt-0.5">{locale === 'fr' ? 'Sélectionnez et ajustez les quantités' : 'Select and adjust quantities'}</p>
              </div>
              <button onClick={() => setPickerOpen(false)} className="text-green-600 hover:text-green-300 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <div className="px-5 py-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 160px)' }}>
              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500/50" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={locale === 'fr' ? 'Rechercher un légume...' : 'Search vegetables...'}
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-[#0D1F17] border border-green-800/30 text-green-100 placeholder:text-green-600/40 focus:outline-none focus:border-green-600/50"
                  autoFocus
                />
              </div>

              {/* Category filter */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                      categoryFilter === cat
                        ? 'bg-green-900/50 text-green-200 border border-green-700/50'
                        : 'text-green-400/60 hover:text-green-300 border border-transparent'
                    }`}
                  >
                    {cat === 'all' ? (locale === 'fr' ? 'Tous' : 'All') : `${CATEGORY_EMOJI[cat] || ''} ${t(cat)}`}
                  </button>
                ))}
              </div>

              {/* Plant list with inline quantity controls */}
              <div className="space-y-1.5">
                {filteredPlants.map((plant) => {
                  const inCart = cart.get(plant.id) || 0;
                  const name = locale === 'fr' ? plant.name.fr : plant.name.en;

                  // Check companions with cart items
                  const cartIds = Array.from(cart.keys()).filter(id => id !== plant.id && (cart.get(id) || 0) > 0);
                  const isCompanionWithCart = cartIds.some(id => {
                    const p = getPlantById(id);
                    return p && (plant.companionPlants.includes(id) || p.companionPlants.includes(plant.id));
                  });
                  const isEnemyWithCart = cartIds.some(id => {
                    const p = getPlantById(id);
                    return p && (plant.enemyPlants.includes(id) || p.enemyPlants.includes(plant.id));
                  });

                  return (
                    <div
                      key={plant.id}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all border ${
                        inCart > 0
                          ? 'bg-green-900/30 border-green-700/50'
                          : 'bg-[#0D1F17] border-green-900/20 hover:border-green-800/40'
                      }`}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
                        style={{ backgroundColor: plant.color + '20' }}
                      >
                        {CATEGORY_EMOJI[plant.category] || '🌱'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm text-green-100 font-medium truncate">{name}</span>
                          {isCompanionWithCart && <Heart className="w-3 h-3 text-green-400 shrink-0" />}
                          {isEnemyWithCart && <ShieldAlert className="w-3 h-3 text-red-400 shrink-0" />}
                        </div>
                        <span className="text-[10px] text-green-500/60">{plant.spacingCm}cm &middot; {plant.harvestDays}j &middot; {plant.difficulty === 'easy' ? '⚡' : plant.difficulty === 'medium' ? '⚙️' : '🔥'}</span>
                      </div>
                      {inCart > 0 ? (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button onClick={() => removeFromCart(plant.id)} className="w-8 h-8 rounded-lg bg-green-900/50 text-green-300 flex items-center justify-center active:bg-green-800/60 cursor-pointer"><Minus className="w-3.5 h-3.5" /></button>
                          <span className="text-green-100 text-sm font-bold w-6 text-center">{inCart}</span>
                          <button onClick={() => addToCart(plant.id)} className="w-8 h-8 rounded-lg bg-green-900/50 text-green-300 flex items-center justify-center active:bg-green-800/60 cursor-pointer"><Plus className="w-3.5 h-3.5" /></button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(plant.id)}
                          className="px-3 py-2 rounded-lg bg-green-900/30 border border-green-800/30 text-green-300 text-xs font-medium hover:bg-green-800/40 active:bg-green-700/40 transition-colors cursor-pointer shrink-0"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom action bar */}
            <div className="px-5 py-4 border-t border-green-800/30 bg-[#0f2819]">
              {cartTotal > 0 ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => setPickerOpen(false)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-900/30 border border-green-700/40 text-green-200 font-medium text-sm cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    {locale === 'fr' ? 'Voir le panier' : 'View cart'}
                  </button>
                  <button
                    onClick={() => { setPickerOpen(false); executeSmartPlace(); }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-sm transition-all cursor-pointer shadow-lg shadow-green-900/40"
                  >
                    <Zap className="w-4 h-4" />
                    {locale === 'fr' ? `Planter (${cartTotal})` : `Plant (${cartTotal})`}
                  </button>
                </div>
              ) : (
                <p className="text-center text-green-500/50 text-sm py-2">
                  {locale === 'fr' ? 'Sélectionnez des légumes pour commencer' : 'Select vegetables to start'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PLANT INFO POPOVER (on cell click)                                */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {selectedCellInfo && (() => {
        const item = config.plantedItems[selectedCellInfo.idx];
        if (!item) return null;
        const plant = getPlantById(item.plantId);
        if (!plant) return null;
        const plantName = locale === 'fr' ? plant.name.fr : plant.name.en;
        const enemyNames = cellsWithEnemies.get(`${selectedCellInfo.col}-${selectedCellInfo.row}`);
        const companionNames = plant.companionPlants.slice(0, 5).map(id => { const cp = getPlantById(id); return cp ? (locale === 'fr' ? cp.name.fr : cp.name.en) : null; }).filter(Boolean);
        const enemyPlantNames = plant.enemyPlants.slice(0, 5).map(id => { const ep = getPlantById(id); return ep ? (locale === 'fr' ? ep.name.fr : ep.name.en) : null; }).filter(Boolean);
        const popTop = selectedCellInfo.rect.top + selectedCellInfo.rect.height + 8;
        const popLeft = selectedCellInfo.rect.left + selectedCellInfo.rect.width / 2;

        return (
          <div
            ref={popoverRef}
            className="fixed z-50 w-72 bg-[#0f2819] border border-green-700/50 rounded-xl shadow-2xl shadow-black/50 overflow-hidden"
            style={{ top: Math.min(popTop, window.innerHeight - 340), left: Math.min(Math.max(popLeft - 144, 8), window.innerWidth - 296) }}
          >
            <div className="flex items-center gap-3 px-4 py-3 bg-green-900/30 border-b border-green-800/30">
              <span className="text-2xl">{CATEGORY_EMOJI[plant.category] || '🌱'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-green-50 font-semibold text-sm truncate">{plantName}</p>
              </div>
              <button onClick={() => setSelectedCellInfo(null)} className="text-green-600 hover:text-green-300 transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-4 py-3 space-y-2.5">
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1 text-green-300/70"><Sun className="w-3 h-3" />{t('spacing', { cm: plant.spacingCm })}</span>
                <span className="flex items-center gap-1 text-green-300/70"><Droplets className="w-3 h-3" />{plant.harvestDays}j</span>
              </div>
              {companionNames.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-green-500/50 mb-1 flex items-center gap-1"><Heart className="w-2.5 h-2.5" />{t('companions')}</p>
                  <div className="flex flex-wrap gap-1">{companionNames.map((name, i) => (<span key={i} className="px-1.5 py-0.5 text-[10px] rounded bg-green-900/40 text-green-300/80 border border-green-800/30">{name}</span>))}</div>
                </div>
              )}
              {enemyPlantNames.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-red-500/50 mb-1 flex items-center gap-1"><ShieldAlert className="w-2.5 h-2.5" />{t('enemies')}</p>
                  <div className="flex flex-wrap gap-1">{enemyPlantNames.map((name, i) => (<span key={i} className="px-1.5 py-0.5 text-[10px] rounded bg-red-900/20 text-red-300/80 border border-red-800/30">{name}</span>))}</div>
                </div>
              )}
              {enemyNames && enemyNames.length > 0 && (
                <div className="flex items-start gap-2 px-2.5 py-2 rounded-lg bg-red-900/20 border border-red-800/30">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-red-300/80">{enemyNames.map(n => t('enemyWarning', { a: plantName, b: n })).join('. ')}</p>
                </div>
              )}
            </div>
            <div className="px-4 py-3 border-t border-green-800/30">
              <button
                onClick={() => { removePlant(selectedCellInfo.idx); setSelectedCellInfo(null); }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 bg-red-900/15 hover:bg-red-900/30 border border-red-800/30 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />{t('removePlant')}
              </button>
            </div>
          </div>
        );
      })()}

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
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
        .safe-area-pb { padding-bottom: max(0.75rem, env(safe-area-inset-bottom)); }
      `}</style>
    </div>
  );
}
