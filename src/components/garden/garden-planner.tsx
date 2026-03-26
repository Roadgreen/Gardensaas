'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useGarden, usePlants } from '@/lib/hooks';
import type { Plant, PlantedItem, GardenZone, ZoneType, SoilType, SunExposure } from '@/types';
import { ZONE_TYPE_LABELS } from '@/types';

/* ═══════════════════════════════════════════════════════════════════════════
   Color Palette
   ═══════════════════════════════════════════════════════════════════════════ */
const C = {
  ink: '#1B2B1A', inkMid: '#3B5438', inkSoft: '#5E7B58',
  leaf: '#4A7C59', leafDeep: '#2E5C3A', leafGlow: '#5D9970',
  dew: '#C8DFC1',
  paper: '#F5F1E8', paperMid: '#EDE8DC', paperTan: '#E2DACE', parchment: '#F9F6EE',
  terra: '#B85C38', terraDk: '#8C4428', terraLt: '#D4876A', terraPal: '#F9EDE7',
  gold: '#C09B4A', cream: '#FDFAF4',
};

/* ═══════════════════════════════════════════════════════════════════════════
   Plant helpers
   ═══════════════════════════════════════════════════════════════════════════ */
const CAT_EMOJI: Record<string, string> = {
  vegetable: '\u{1F966}', herb: '\u{1F33F}', fruit: '\u{1F353}',
  root: '\u{1F955}', ancient: '\u{1F33E}', exotic: '\u{1F334}',
};

function monthsToSeason(months: number[]): string {
  if (!months || months.length === 0) return 'any';
  const avg = months.reduce((a, b) => a + b, 0) / months.length;
  if (avg <= 3) return 'winter';
  if (avg <= 6) return 'spring';
  if (avg <= 9) return 'summer';
  return 'autumn';
}

interface PlannerPlant {
  id: string;
  name: string;
  nameFr: string;
  cat: string;
  sp: number;
  rowSp: number;
  dtm: number;
  comp: string[];
  enm: string[];
  emoji: string;
  color: string;
  season: string;
  difficulty: string;
  heightCm: number;
  wateringFrequency: string;
}

function toPlannerPlant(p: Plant): PlannerPlant {
  return {
    id: p.id,
    name: p.name.en,
    nameFr: p.name.fr,
    cat: p.category,
    sp: p.spacingCm,
    rowSp: p.rowSpacingCm ?? Math.round(p.spacingCm * 1.5),
    dtm: p.harvestDays,
    comp: p.companionPlants ?? [],
    enm: p.enemyPlants ?? [],
    emoji: CAT_EMOJI[p.category] ?? '\u{1F331}',
    color: p.color,
    season: monthsToSeason(p.plantingMonths),
    difficulty: p.difficulty,
    heightCm: p.heightCm,
    wateringFrequency: p.wateringFrequency,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════════════════════ */
type Tool = 'plant' | 'remove' | 'inspect';

const CATEGORIES = [
  { key: 'all', label: 'Tous', emoji: '\u{1F30D}' },
  { key: 'vegetable', label: 'L\u00e9gumes', emoji: '\u{1F966}' },
  { key: 'herb', label: 'Herbes', emoji: '\u{1F33F}' },
  { key: 'fruit', label: 'Fruits', emoji: '\u{1F353}' },
  { key: 'root', label: 'Racines', emoji: '\u{1F955}' },
  { key: 'ancient', label: 'Anciens', emoji: '\u{1F33E}' },
  { key: 'exotic', label: 'Exotiques', emoji: '\u{1F334}' },
];

const SEASON_LABELS: Record<string, string> = {
  spring: '\u{1F331} Printemps', summer: '\u2600\uFE0F \u00c9t\u00e9',
  autumn: '\u{1F342} Automne', winter: '\u2744\uFE0F Hiver',
};
const SEASON_COLORS: Record<string, string> = {
  spring: '#5D9970', summer: '#C09B4A', autumn: '#B85C38', winter: '#5E7B58',
};

const GROWTH_STAGES = ['seed', 'seedling', 'growing', 'mature', 'harvest'] as const;
type GrowthStage = (typeof GROWTH_STAGES)[number];

function getGrowthStage(daysSincePlant: number, dtm: number): GrowthStage {
  const pct = dtm > 0 ? daysSincePlant / dtm : 0;
  if (pct < 0.1) return 'seed';
  if (pct < 0.3) return 'seedling';
  if (pct < 0.7) return 'growing';
  if (pct < 1.0) return 'mature';
  return 'harvest';
}

const STAGE_EMOJI_SIZE: Record<GrowthStage, number> = {
  seed: 10, seedling: 14, growing: 18, mature: 22, harvest: 26,
};

const STAGE_LABEL: Record<GrowthStage, string> = {
  seed: '\u{1FAD8} Graine', seedling: '\u{1F331} Pousse',
  growing: '\u{1F33F} Croissance', mature: '\u{1FAB4} Mature',
  harvest: '\u2728 R\u00e9colte!',
};

function cellKey(r: number, c: number): string { return `${r},${c}`; }

/* ═══════════════════════════════════════════════════════════════════════════
   Coordinate conversion helpers (grid <-> percentage)
   ═══════════════════════════════════════════════════════════════════════════ */
function gridToPercent(row: number, col: number, totalRows: number, totalCols: number) {
  return {
    x: ((col + 0.5) / totalCols) * 100,
    z: ((row + 0.5) / totalRows) * 100,
  };
}

function percentToGrid(x: number, z: number, totalRows: number, totalCols: number) {
  return {
    col: Math.floor((x / 100) * totalCols),
    row: Math.floor((z / 100) * totalRows),
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   Compute days elapsed from a planted date to simulated day offset
   ═══════════════════════════════════════════════════════════════════════════ */
function daysFromPlantedDate(plantedDate: string, simDayOffset: number): number {
  const planted = new Date(plantedDate);
  const now = new Date();
  const realDays = Math.floor((now.getTime() - planted.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, realDays + simDayOffset);
}

function getSeason(day: number): string {
  const d = ((day % 365) + 365) % 365;
  if (d < 80 || d >= 355) return 'winter';
  if (d < 172) return 'spring';
  if (d < 264) return 'summer';
  return 'autumn';
}

/* ═══════════════════════════════════════════════════════════════════════════
   Zone colors for grid overlay
   ═══════════════════════════════════════════════════════════════════════════ */
const ZONE_GRID_COLORS: Record<string, { bg: string; border: string; badge: string; label: string }> = {
  greenhouse: { bg: 'rgba(147, 197, 253, 0.18)', border: 'rgba(96, 165, 250, 0.5)', badge: '#3B82F6', label: 'Serre' },
  'in-ground': { bg: 'rgba(134, 239, 172, 0.18)', border: 'rgba(74, 222, 128, 0.5)', badge: '#22C55E', label: 'Exterieur' },
  'raised-bed': { bg: 'rgba(253, 186, 116, 0.18)', border: 'rgba(251, 146, 60, 0.5)', badge: '#F97316', label: 'Bac' },
  pot: { bg: 'rgba(196, 181, 253, 0.18)', border: 'rgba(167, 139, 250, 0.5)', badge: '#8B5CF6', label: 'Pot' },
};

function getZoneStyle(zoneType: ZoneType) {
  return ZONE_GRID_COLORS[zoneType] || ZONE_GRID_COLORS['in-ground'];
}

/* ═══════════════════════════════════════════════════════════════════════════
   Add Zone Modal
   ═══════════════════════════════════════════════════════════════════════════ */
function AddZoneModal({
  onAdd,
  onClose,
  gardenCols,
  gardenRows,
}: {
  onAdd: (zone: GardenZone) => void;
  onClose: () => void;
  gardenCols: number;
  gardenRows: number;
}) {
  const [name, setName] = useState('');
  const [zoneType, setZoneType] = useState<ZoneType>('greenhouse');
  const [widthM, setWidthM] = useState(2);
  const [lengthM, setLengthM] = useState(2);

  const handleSubmit = () => {
    if (!name.trim()) return;
    const zone: GardenZone = {
      id: `zone-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      x: 10,
      z: 10,
      widthM: Math.min(widthM, gardenCols),
      lengthM: Math.min(lengthM, gardenRows),
      soilType: 'loamy' as SoilType,
      sunExposure: 'full-sun' as SunExposure,
      zoneType,
      color: getZoneStyle(zoneType).badge,
    };
    onAdd(zone);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(27,43,26,0.6)', backdropFilter: 'blur(8px)' }}
    >
      <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden" style={{ background: C.parchment }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${C.dew}` }}>
          <h3 className="text-lg font-semibold" style={{ color: C.ink }}>
            {'\u{1F33F}'} Ajouter une zone
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-black/5 transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center">
            {'\u2715'}
          </button>
        </div>
        <div className="px-5 py-5 space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: C.inkMid }}>Nom de la zone</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Serre principale"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: C.paper, border: `1px solid ${C.dew}`, color: C.ink }}
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: C.inkMid }}>Type</label>
            <div className="grid grid-cols-2 gap-2">
              {(['greenhouse', 'in-ground', 'raised-bed', 'pot'] as ZoneType[]).map((t) => {
                const style = getZoneStyle(t);
                const selected = zoneType === t;
                return (
                  <button
                    key={t}
                    onClick={() => setZoneType(t)}
                    className="flex items-center gap-2 px-3 py-3 rounded-xl text-sm font-medium transition-all min-h-[48px]"
                    style={{
                      background: selected ? style.badge + '20' : C.paper,
                      border: `2px solid ${selected ? style.badge : C.dew}`,
                      color: selected ? style.badge : C.inkMid,
                    }}
                  >
                    <span className="w-3 h-3 rounded-full" style={{ background: style.badge }} />
                    {ZONE_TYPE_LABELS[t].fr}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: C.inkMid }}>Largeur (m)</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setWidthM(Math.max(1, widthM - 1))}
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold"
                  style={{ background: C.paper, border: `1px solid ${C.dew}`, color: C.ink }}
                >-</button>
                <span className="text-xl font-bold flex-1 text-center" style={{ color: C.leaf }}>{widthM}</span>
                <button
                  onClick={() => setWidthM(Math.min(gardenCols, widthM + 1))}
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold"
                  style={{ background: C.paper, border: `1px solid ${C.dew}`, color: C.ink }}
                >+</button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: C.inkMid }}>Longueur (m)</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLengthM(Math.max(1, lengthM - 1))}
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold"
                  style={{ background: C.paper, border: `1px solid ${C.dew}`, color: C.ink }}
                >-</button>
                <span className="text-xl font-bold flex-1 text-center" style={{ color: C.leaf }}>{lengthM}</span>
                <button
                  onClick={() => setLengthM(Math.min(gardenRows, lengthM + 1))}
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold"
                  style={{ background: C.paper, border: `1px solid ${C.dew}`, color: C.ink }}
                >+</button>
              </div>
            </div>
          </div>
          <div className="text-xs text-center py-1" style={{ color: C.inkSoft }}>
            Zone de {widthM}m x {lengthM}m = {widthM * lengthM} m²
          </div>
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-medium transition-colors min-h-[48px]"
              style={{ background: C.paper, color: C.inkMid }}
            >Annuler</button>
            <button
              onClick={handleSubmit}
              disabled={!name.trim()}
              className="flex-1 py-3 rounded-xl text-sm font-medium text-white transition-all hover:brightness-110 min-h-[48px] disabled:opacity-40"
              style={{ background: C.leaf }}
            >{'\u{1F33F}'} Ajouter</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   GardenPlanner Component
   ═══════════════════════════════════════════════════════════════════════════ */
export function GardenPlanner() {
  const { config, addPlant, removePlant, clearGarden, updateConfig, addZone, removeZone, isLoaded } = useGarden();
  const { plants: rawPlants, isLoading: plantsLoading } = usePlants();

  /* ── Derived plant data ── */
  const PLANTS = useMemo(() => rawPlants.map(toPlannerPlant), [rawPlants]);
  const PLANT_MAP = useMemo(() => new Map(PLANTS.map((p) => [p.id, p])), [PLANTS]);

  /* ── Grid dimensions from config ── */
  const totalRows = config.length; // rows = length in meters
  const totalCols = config.width;  // cols = width in meters

  /* ── State ── */
  const [selectedPlant, setSelectedPlant] = useState<PlannerPlant | null>(null);
  const [tool, setTool] = useState<Tool>('plant');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [simDayOffset, setSimDayOffset] = useState(0); // offset from today (-180 to +180)
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [dragPlant, setDragPlant] = useState<PlannerPlant | null>(null);
  const [inspectedCell, setInspectedCell] = useState<{ r: number; c: number } | null>(null);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [showAddZoneModal, setShowAddZoneModal] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  /* ── Build cell map from plantedItems ── */
  const cellMap = useMemo(() => {
    const map = new Map<string, { item: PlantedItem; index: number }>();
    config.plantedItems.forEach((item, index) => {
      const { row, col } = percentToGrid(item.x, item.z, totalRows, totalCols);
      if (row >= 0 && row < totalRows && col >= 0 && col < totalCols) {
        const key = cellKey(row, col);
        // Last plant placed wins the cell
        map.set(key, { item, index });
      }
    });
    return map;
  }, [config.plantedItems, totalRows, totalCols]);

  /* ── Zone cell map: which cells belong to which zone ── */
  const zoneCellMap = useMemo(() => {
    const map = new Map<string, GardenZone>();
    const zones = config.zones || [];
    zones.forEach((zone) => {
      // Convert zone percent position to grid cells
      const startCol = Math.floor((zone.x / 100) * totalCols);
      const startRow = Math.floor((zone.z / 100) * totalRows);
      const zoneCols = Math.min(Math.round(zone.widthM), totalCols - startCol);
      const zoneRows = Math.min(Math.round(zone.lengthM), totalRows - startRow);
      for (let r = startRow; r < startRow + zoneRows && r < totalRows; r++) {
        for (let c = startCol; c < startCol + zoneCols && c < totalCols; c++) {
          map.set(cellKey(r, c), zone);
        }
      }
    });
    return map;
  }, [config.zones, totalCols, totalRows]);

  /* ── Zone top-left corners for badge rendering ── */
  const zoneCorners = useMemo(() => {
    const zones = config.zones || [];
    return zones.map((zone) => {
      const startCol = Math.floor((zone.x / 100) * totalCols);
      const startRow = Math.floor((zone.z / 100) * totalRows);
      return { zone, key: cellKey(startRow, startCol) };
    });
  }, [config.zones, totalCols, totalRows]);

  /* ── Filtered plant list ── */
  const filteredPlants = useMemo(() => {
    return PLANTS.filter((p) => {
      if (catFilter !== 'all' && p.cat !== catFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.nameFr.toLowerCase().includes(q) || p.id.includes(q);
      }
      return true;
    });
  }, [PLANTS, catFilter, search]);

  /* ── Stats ── */
  const totalCells = totalRows * totalCols;
  const plantedCells = cellMap.size;
  const fillPct = totalCells > 0 ? Math.round((plantedCells / totalCells) * 100) : 0;

  const totalDensity = useMemo(() => {
    let d = 0;
    cellMap.forEach(({ item }) => {
      const plant = PLANT_MAP.get(item.plantId);
      if (plant) {
        d += Math.max(1, Math.floor(10000 / (plant.sp * plant.rowSp)));
      }
    });
    return d;
  }, [cellMap, PLANT_MAP]);

  /* ── Companion logic ── */
  const getCompanionInfo = useCallback((r: number, c: number): { good: string[]; bad: string[] } => {
    const key = cellKey(r, c);
    const cellData = cellMap.get(key);
    const target = selectedPlant ?? (cellData ? PLANT_MAP.get(cellData.item.plantId) : null);
    if (!target) return { good: [], bad: [] };
    const good: string[] = [];
    const bad: string[] = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nk = cellKey(r + dr, c + dc);
        const neighbor = cellMap.get(nk);
        if (!neighbor) continue;
        const np = PLANT_MAP.get(neighbor.item.plantId);
        if (!np) continue;
        if (target.comp.includes(np.id)) good.push(np.nameFr);
        if (target.enm.includes(np.id)) bad.push(np.nameFr);
        if (np.comp.includes(target.id) && !good.includes(np.nameFr)) good.push(np.nameFr);
        if (np.enm.includes(target.id) && !bad.includes(np.nameFr)) bad.push(np.nameFr);
      }
    }
    return { good, bad };
  }, [selectedPlant, cellMap, PLANT_MAP]);

  /* ── Cell highlight for companion hints ── */
  const getCellHighlight = useCallback((r: number, c: number): string | null => {
    if (!selectedPlant) return null;
    const key = cellKey(r, c);
    const cellData = cellMap.get(key);
    if (cellData) {
      const existing = PLANT_MAP.get(cellData.item.plantId);
      if (!existing) return null;
      if (selectedPlant.comp.includes(existing.id) || existing.comp.includes(selectedPlant.id))
        return 'rgba(93, 153, 112, 0.35)';
      if (selectedPlant.enm.includes(existing.id) || existing.enm.includes(selectedPlant.id))
        return 'rgba(184, 92, 56, 0.35)';
    }
    return null;
  }, [selectedPlant, cellMap, PLANT_MAP]);

  /* ── Hover highlight ── */
  const getHoverHighlight = useCallback((r: number, c: number): string | null => {
    if (!hoveredCell) return null;
    const [hr, hc] = hoveredCell.split(',').map(Number);
    const hovData = cellMap.get(hoveredCell);
    if (!hovData) return null;
    const hovPlant = PLANT_MAP.get(hovData.item.plantId);
    if (!hovPlant) return null;
    const dist = Math.max(Math.abs(r - hr), Math.abs(c - hc));
    if (dist !== 1) return null;
    const cd = cellMap.get(cellKey(r, c));
    if (!cd) return null;
    const cp = PLANT_MAP.get(cd.item.plantId);
    if (!cp) return null;
    if (hovPlant.comp.includes(cp.id) || cp.comp.includes(hovPlant.id))
      return 'rgba(93, 153, 112, 0.4)';
    if (hovPlant.enm.includes(cp.id) || cp.enm.includes(hovPlant.id))
      return 'rgba(184, 92, 56, 0.4)';
    return null;
  }, [hoveredCell, cellMap, PLANT_MAP]);

  /* ── Place a plant ── */
  const placeCell = useCallback((r: number, c: number, plantToPlace?: PlannerPlant) => {
    const p = plantToPlace ?? selectedPlant;
    if (!p) return;
    const { x, z } = gridToPercent(r, c, totalRows, totalCols);
    addPlant(p.id, x, z);
  }, [selectedPlant, totalRows, totalCols, addPlant]);

  /* ── Remove a plant ── */
  const removeCell = useCallback((r: number, c: number) => {
    const key = cellKey(r, c);
    const cellData = cellMap.get(key);
    if (cellData) {
      removePlant(cellData.index);
    }
  }, [cellMap, removePlant]);

  /* ── Cell click handler ── */
  const handleCellClick = useCallback((r: number, c: number) => {
    const key = cellKey(r, c);
    if (tool === 'remove') {
      removeCell(r, c);
      setInspectedCell(null);
      return;
    }
    if (tool === 'inspect') {
      setInspectedCell(cellMap.has(key) ? { r, c } : null);
      return;
    }
    // plant mode
    if (cellMap.has(key)) {
      removeCell(r, c);
    } else if (selectedPlant) {
      placeCell(r, c);
    }
  }, [tool, selectedPlant, cellMap, placeCell, removeCell]);

  /* ── Drag & drop ── */
  const handleDrop = useCallback((r: number, c: number) => {
    if (dragPlant) {
      placeCell(r, c, dragPlant);
      setDragPlant(null);
    }
  }, [dragPlant, placeCell]);

  /* ── Auto-fill ── */
  const autoFill = useCallback(() => {
    if (!selectedPlant) return;
    for (let r = 0; r < totalRows; r++) {
      for (let c = 0; c < totalCols; c++) {
        const key = cellKey(r, c);
        if (!cellMap.has(key)) {
          const { x, z } = gridToPercent(r, c, totalRows, totalCols);
          addPlant(selectedPlant.id, x, z);
        }
      }
    }
  }, [selectedPlant, totalRows, totalCols, cellMap, addPlant]);

  /* ── Smart suggest ── */
  const smartSuggest = useCallback(() => {
    const existingIds = new Set<string>();
    cellMap.forEach(({ item }) => existingIds.add(item.plantId));
    const goodIds = new Set<string>();
    const badIds = new Set<string>();
    existingIds.forEach((id) => {
      const pl = PLANT_MAP.get(id);
      if (pl) {
        pl.comp.forEach((cid) => goodIds.add(cid));
        pl.enm.forEach((eid) => badIds.add(eid));
      }
    });
    const candidates = Array.from(goodIds)
      .filter((id) => !badIds.has(id) && !existingIds.has(id) && PLANT_MAP.has(id));
    if (candidates.length === 0) return;
    let ci = 0;
    for (let r = 0; r < totalRows; r++) {
      for (let c = 0; c < totalCols; c++) {
        const key = cellKey(r, c);
        if (!cellMap.has(key) && ci < candidates.length) {
          const { x, z } = gridToPercent(r, c, totalRows, totalCols);
          addPlant(candidates[ci], x, z);
          ci = (ci + 1) % candidates.length;
        }
      }
    }
  }, [cellMap, PLANT_MAP, totalRows, totalCols, addPlant]);

  /* ── Alerts ── */
  const alerts = useMemo(() => {
    const list: { type: 'warning' | 'info'; msg: string }[] = [];
    const entries = Array.from(cellMap.entries());
    for (const [key, { item }] of entries) {
      const [r, c] = key.split(',').map(Number);
      const p = PLANT_MAP.get(item.plantId);
      if (!p) continue;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nk = cellKey(r + dr, c + dc);
          const nd = cellMap.get(nk);
          if (!nd) continue;
          if (p.enm.includes(nd.item.plantId)) {
            const np = PLANT_MAP.get(nd.item.plantId);
            if (np) {
              const msg = `${p.nameFr} et ${np.nameFr} sont ennemis!`;
              if (!list.some((a) => a.msg === msg)) list.push({ type: 'warning', msg });
            }
          }
        }
      }
      // Harvest alerts
      const elapsed = daysFromPlantedDate(item.plantedDate, simDayOffset);
      if (elapsed >= p.dtm && p.dtm > 0) {
        const msg = `${p.nameFr} est pr\u00eat \u00e0 r\u00e9colter!`;
        if (!list.some((a) => a.msg === msg)) list.push({ type: 'info', msg });
      }
    }
    return list;
  }, [cellMap, PLANT_MAP, simDayOffset]);

  /* ── Inspected cell data ── */
  const inspectedData = useMemo(() => {
    if (!inspectedCell) return null;
    const key = cellKey(inspectedCell.r, inspectedCell.c);
    const cd = cellMap.get(key);
    if (!cd) return null;
    const plant = PLANT_MAP.get(cd.item.plantId);
    if (!plant) return null;
    const elapsed = daysFromPlantedDate(cd.item.plantedDate, simDayOffset);
    const stage = getGrowthStage(elapsed, plant.dtm);
    const comp = getCompanionInfo(inspectedCell.r, inspectedCell.c);
    const density = Math.max(1, Math.floor(10000 / (plant.sp * plant.rowSp)));
    return { item: cd.item, plant, elapsed, stage, comp, density };
  }, [inspectedCell, cellMap, PLANT_MAP, simDayOffset, getCompanionInfo]);

  /* ── Season info ── */
  const todayOfYear = Math.floor(
    (new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  const simDay = todayOfYear + simDayOffset;
  const currentSeason = getSeason(simDay);
  const seasonLabel = SEASON_LABELS[currentSeason] ?? '';

  /* ── Loading state ── */
  if (!isLoaded || plantsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.paper }}>
        <div className="text-center">
          <span className="text-4xl block mb-3 animate-pulse">{'\u{1F331}'}</span>
          <span className="text-sm font-medium" style={{ color: C.inkSoft }}>
            Chargement du jardin...
          </span>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     Render
     ═══════════════════════════════════════════════════════════════════════════ */
  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{ background: C.paper, color: C.ink, fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* ── Top Stats Toolbar ── */}
      <header
        className="sticky top-0 z-30 flex items-center gap-3 px-4 py-2 border-b backdrop-blur-md"
        style={{ background: C.cream + 'ee', borderColor: C.paperTan }}
      >
        <h1 className="text-lg font-bold mr-2 hidden sm:block" style={{ color: C.leafDeep }}>
          {'\u{1F331}'} Planificateur de Jardin
        </h1>
        <div className="flex items-center gap-4 flex-1 justify-end text-sm font-medium" style={{ color: C.inkMid }}>
          <span title="Dimensions du jardin (store partag\u00e9)" className="hidden sm:inline px-2 py-0.5 rounded text-xs gap-1 items-center"
            style={{ background: C.dew + '60', color: C.leafDeep, display: 'inline-flex' }}
          >
            <button
              className="hover:opacity-70 px-1"
              onClick={() => updateConfig({ width: Math.max(1, config.width - 1) })}
            >{'\u25C0'}</button>
            {totalCols}m
            <button
              className="hover:opacity-70 px-1"
              onClick={() => updateConfig({ width: config.width + 1 })}
            >{'\u25B6'}</button>
            {'\u00D7'}
            <button
              className="hover:opacity-70 px-1"
              onClick={() => updateConfig({ length: Math.max(1, config.length - 1) })}
            >{'\u25C0'}</button>
            {totalRows}m
            <button
              className="hover:opacity-70 px-1"
              onClick={() => updateConfig({ length: config.length + 1 })}
            >{'\u25B6'}</button>
          </span>
          <span title="Surface totale">{totalCells} m\u00b2</span>
          <span className="hidden sm:inline" style={{ color: C.inkSoft }}>|</span>
          <span title="Cellules plant\u00e9es" className="hidden sm:inline">{'\u{1F33F}'} {plantedCells} plant\u00e9s</span>
          <span className="hidden sm:inline" style={{ color: C.inkSoft }}>|</span>
          <span title="Densit\u00e9 totale" className="hidden sm:inline">{'\u{1FAD8}'} {totalDensity} plants</span>
          {(config.zones || []).length > 0 && (
            <>
              <span className="hidden sm:inline" style={{ color: C.inkSoft }}>|</span>
              <span title="Zones" className="hidden sm:inline">{'\u{1F33F}'} {(config.zones || []).length} zones</span>
            </>
          )}
          <span className="hidden sm:inline" style={{ color: C.inkSoft }}>|</span>
          {/* Fill bar */}
          <div className="flex items-center gap-1.5">
            <div className="w-20 h-2 rounded-full overflow-hidden" style={{ background: C.paperTan }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${fillPct}%`, background: fillPct > 80 ? C.leaf : fillPct > 40 ? C.gold : C.terraLt }}
              />
            </div>
            <span className="text-xs">{fillPct}%</span>
          </div>
          <span title={seasonLabel} className="text-base">{seasonLabel}</span>
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
        {/* ═══════════════════════════════════════════════════════════════════
           LEFT SIDEBAR - Plant Library
           ═══════════════════════════════════════════════════════════════════ */}
        <aside
          className="hidden lg:flex flex-col w-72 xl:w-80 border-r overflow-hidden"
          style={{ background: C.parchment, borderColor: C.paperTan }}
        >
          {/* Search */}
          <div className="p-3 border-b" style={{ borderColor: C.paperTan }}>
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{ background: C.paper, border: `1px solid ${C.dew}` }}
            >
              <span className="text-sm" style={{ color: C.inkSoft }}>{'\u{1F50D}'}</span>
              <input
                type="text"
                placeholder="Rechercher une plante..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: C.ink }}
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-xs opacity-50 hover:opacity-100 transition">{'\u2715'}</button>
              )}
            </div>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-1.5 px-3 py-2 border-b" style={{ borderColor: C.paperTan }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setCatFilter(cat.key)}
                className="px-2.5 py-1 text-xs rounded-full font-medium transition-all"
                style={{
                  background: catFilter === cat.key ? C.leaf : C.paperMid,
                  color: catFilter === cat.key ? C.cream : C.inkMid,
                  border: `1px solid ${catFilter === cat.key ? C.leafDeep : C.paperTan}`,
                }}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>

          {/* Plant list */}
          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
            {filteredPlants.slice(0, 80).map((p) => {
              const isSelected = selectedPlant?.id === p.id;
              return (
                <button
                  key={p.id}
                  draggable
                  onDragStart={(e) => {
                    setDragPlant(p);
                    e.dataTransfer.setData('text/plain', p.id);
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  onClick={() => {
                    setSelectedPlant(isSelected ? null : p);
                    setTool('plant');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all group"
                  style={{
                    background: isSelected ? C.leaf + '18' : 'transparent',
                    border: isSelected ? `2px solid ${C.leaf}` : '2px solid transparent',
                  }}
                >
                  <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                    style={{ background: p.color + '20', border: `1px solid ${p.color}40` }}
                  >
                    {p.emoji}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: C.ink }}>{p.nameFr}</div>
                    <div className="text-xs truncate" style={{ color: C.inkSoft }}>
                      {p.sp}cm &middot; {p.dtm}j &middot; {p.difficulty}
                    </div>
                  </div>
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: SEASON_COLORS[p.season] }}
                    title={SEASON_LABELS[p.season]}
                  />
                </button>
              );
            })}
            {filteredPlants.length === 0 && (
              <div className="text-center py-8 text-sm" style={{ color: C.inkSoft }}>
                Aucune plante trouv\u00e9e
              </div>
            )}
            {filteredPlants.length > 80 && (
              <div className="text-center py-2 text-xs" style={{ color: C.inkSoft }}>
                +{filteredPlants.length - 80} autres plantes... Affinez votre recherche
              </div>
            )}
          </div>
        </aside>

        {/* ═══════════════════════════════════════════════════════════════════
           CENTER - Garden Grid
           ═══════════════════════════════════════════════════════════════════ */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Dimension display & toolbar row */}
          <div
            className="flex items-center gap-2 px-3 py-2 border-b flex-wrap"
            style={{ background: C.cream, borderColor: C.paperTan }}
          >
            {/* Tool buttons */}
            {([
              { t: 'plant' as Tool, label: '\u{1F331} Planter' },
              { t: 'remove' as Tool, label: '\u{1F5D1}\uFE0F Retirer' },
              { t: 'inspect' as Tool, label: '\u{1F50D} Inspecter' },
            ]).map(({ t, label }) => (
              <button
                key={t}
                onClick={() => setTool(t)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
                style={{
                  background: tool === t ? C.leaf : C.paperMid,
                  color: tool === t ? C.cream : C.inkMid,
                  border: `1px solid ${tool === t ? C.leafDeep : C.paperTan}`,
                }}
              >
                {label}
              </button>
            ))}

            <div className="w-px h-5 mx-1" style={{ background: C.paperTan }} />

            {/* Auto-fill & suggest */}
            <button
              onClick={autoFill}
              disabled={!selectedPlant}
              className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all disabled:opacity-30"
              style={{ background: C.gold + '25', color: C.gold, border: `1px solid ${C.gold}40` }}
            >
              {'\u26A1'} Remplir
            </button>
            <button
              onClick={smartSuggest}
              disabled={plantedCells === 0}
              className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all disabled:opacity-30"
              style={{ background: C.leafGlow + '25', color: C.leafDeep, border: `1px solid ${C.leaf}40` }}
            >
              {'\u2728'} Suggestion
            </button>
            <button
              onClick={clearGarden}
              className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
              style={{ background: C.terraPal, color: C.terra, border: `1px solid ${C.terraLt}` }}
            >
              {'\u{1F504}'} Vider
            </button>
            <div className="w-px h-5 mx-1" style={{ background: C.paperTan }} />
            <button
              onClick={() => setShowAddZoneModal(true)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
              style={{ background: '#3B82F620', color: '#3B82F6', border: '1px solid #3B82F640' }}
            >
              {'\u{1F33F}'} + Zone
            </button>

            {/* Selected plant badge */}
            {selectedPlant && tool === 'plant' && (
              <div
                className="ml-auto flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
                style={{ background: selectedPlant.color + '18', border: `1px solid ${selectedPlant.color}50`, color: C.ink }}
              >
                <span>{selectedPlant.emoji}</span>
                <span>{selectedPlant.nameFr}</span>
                <button onClick={() => setSelectedPlant(null)} className="opacity-50 hover:opacity-100">{'\u2715'}</button>
              </div>
            )}
          </div>

          {/* Garden Grid */}
          <div className="flex-1 overflow-auto p-4 flex items-start justify-center" ref={gridRef}>
            {totalRows === 0 || totalCols === 0 ? (
              <div className="text-center py-16">
                <span className="text-4xl block mb-3">{'\u{1F3E1}'}</span>
                <p className="text-sm font-medium" style={{ color: C.inkMid }}>
                  Configurez les dimensions de votre jardin dans les param\u00e8tres.
                </p>
              </div>
            ) : (
              <div
                className="inline-grid gap-0.5"
                style={{
                  gridTemplateColumns: `repeat(${totalCols}, minmax(60px, 80px))`,
                  gridTemplateRows: `repeat(${totalRows}, minmax(60px, 80px))`,
                }}
              >
                {Array.from({ length: totalRows }, (_, r) =>
                  Array.from({ length: totalCols }, (_, c) => {
                    const key = cellKey(r, c);
                    const cd = cellMap.get(key);
                    const plant = cd ? PLANT_MAP.get(cd.item.plantId) : null;
                    const elapsed = cd ? daysFromPlantedDate(cd.item.plantedDate, simDayOffset) : 0;
                    const stage = cd && plant ? getGrowthStage(elapsed, plant.dtm) : null;
                    const isHarvest = stage === 'harvest';
                    const emojiSize = stage ? STAGE_EMOJI_SIZE[stage] : 0;
                    const highlight = getCellHighlight(r, c);
                    const hoverHL = getHoverHighlight(r, c);
                    const isHovered = hoveredCell === key;
                    const density = plant ? Math.max(1, Math.floor(10000 / (plant.sp * plant.rowSp))) : 0;
                    const cellZone = zoneCellMap.get(key);
                    const zoneStyle = cellZone ? getZoneStyle(cellZone.zoneType) : null;
                    const zoneCorner = zoneCorners.find((zc) => zc.key === key);

                    return (
                      <div
                        key={key}
                        className="relative flex flex-col items-center justify-center rounded-lg cursor-pointer transition-all group select-none"
                        style={{
                          background: cd && plant
                            ? (isHarvest
                              ? `linear-gradient(135deg, ${plant.color}18, ${C.gold}25)`
                              : `${plant.color}10`)
                            : zoneStyle ? zoneStyle.bg : C.cream,
                          border: `1.5px solid ${
                            isHovered ? C.leaf : cd && plant ? plant.color + '40' : zoneStyle ? zoneStyle.border : C.paperTan
                          }`,
                          boxShadow: highlight
                            ? `inset 0 0 0 2px ${highlight}`
                            : hoverHL
                              ? `inset 0 0 0 2px ${hoverHL}`
                              : isHarvest
                                ? `0 0 12px ${C.gold}40`
                                : 'none',
                          minHeight: 60,
                          minWidth: 60,
                          animation: isHarvest ? 'harvestGlow 2s ease-in-out infinite' : undefined,
                        }}
                        onMouseEnter={() => setHoveredCell(key)}
                        onMouseLeave={() => setHoveredCell(null)}
                        onClick={() => handleCellClick(r, c)}
                        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
                        onDrop={(e) => { e.preventDefault(); handleDrop(r, c); }}
                      >
                        {/* Coordinates */}
                        <span
                          className="absolute top-0.5 left-1 text-[9px] font-mono opacity-30"
                          style={{ color: C.inkSoft }}
                        >
                          {r},{c}
                        </span>

                        {/* Zone badge at top-left corner */}
                        {zoneCorner && (
                          <div
                            className="absolute -top-2.5 left-1 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold whitespace-nowrap"
                            style={{
                              background: getZoneStyle(zoneCorner.zone.zoneType).badge,
                              color: '#fff',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                            }}
                          >
                            {zoneCorner.zone.zoneType === 'greenhouse' ? '\u{1F3E1}' : '\u{1F33F}'}{' '}
                            {getZoneStyle(zoneCorner.zone.zoneType).label}
                            <button
                              onClick={(e) => { e.stopPropagation(); removeZone(zoneCorner.zone.id); }}
                              className="ml-1 opacity-70 hover:opacity-100"
                              title="Supprimer la zone"
                            >{'\u2715'}</button>
                          </div>
                        )}

                        {cd && plant ? (
                          <>
                            <span
                              className="transition-all duration-700"
                              style={{ fontSize: emojiSize, lineHeight: 1 }}
                            >
                              {plant.emoji}
                            </span>
                            <span
                              className="text-[9px] font-medium mt-0.5 text-center leading-tight max-w-full truncate px-1"
                              style={{ color: plant.color }}
                            >
                              {plant.nameFr.length > 10 ? plant.nameFr.slice(0, 9) + '\u2026' : plant.nameFr}
                            </span>
                            <span className="text-[8px] mt-0.5" style={{ color: C.inkSoft }}>
                              {stage === 'seed' && '\u{1FAD8}'}
                              {stage === 'seedling' && '\u{1F331}'}
                              {stage === 'growing' && '\u{1F33F}'}
                              {stage === 'mature' && '\u{1FAB4}'}
                              {stage === 'harvest' && '\u2728'}
                            </span>
                            {density > 1 && (
                              <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center max-w-[50px]">
                                {Array.from({ length: Math.min(density, 9) }, (_, i) => (
                                  <span
                                    key={i}
                                    className="w-1 h-1 rounded-full"
                                    style={{ background: plant.color + '80' }}
                                  />
                                ))}
                                {density > 9 && (
                                  <span className="text-[7px]" style={{ color: C.inkSoft }}>+{density - 9}</span>
                                )}
                              </div>
                            )}
                          </>
                        ) : (
                          <span
                            className="text-lg opacity-0 group-hover:opacity-20 transition-opacity"
                            style={{ color: C.leaf }}
                          >
                            {selectedPlant && tool === 'plant' ? selectedPlant.emoji : '+'}
                          </span>
                        )}

                        {isHarvest && (
                          <div
                            className="absolute inset-0 rounded-lg pointer-events-none"
                            style={{
                              background: `radial-gradient(circle, ${C.gold}15, transparent 70%)`,
                              animation: 'harvestPulse 2s ease-in-out infinite',
                            }}
                          />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Time Slider */}
          <div
            className="px-4 py-3 border-t"
            style={{ background: C.paperMid, borderColor: C.paperTan }}
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium" style={{ color: C.inkMid }}>{'\u{1F552}'} Simulation</span>
              <div className="flex-1 relative">
                <div className="absolute -top-4 left-0 right-0 flex text-[9px]" style={{ color: C.inkSoft }}>
                  <span className="flex-1 text-center">{'\u2744\uFE0F'} Hiver</span>
                  <span className="flex-1 text-center">{'\u{1F331}'} Print.</span>
                  <span className="flex-1 text-center">{'\u2600\uFE0F'} \u00c9t\u00e9</span>
                  <span className="flex-1 text-center">{'\u{1F342}'} Auto.</span>
                </div>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  value={simDayOffset}
                  onChange={(e) => setSimDayOffset(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right,
                      ${C.inkSoft} 0%,
                      ${C.leafGlow} 25%,
                      ${C.gold} 50%,
                      ${C.terra} 75%,
                      ${C.inkSoft} 100%)`,
                    accentColor: C.leaf,
                  }}
                />
              </div>
              <span
                className="text-xs font-bold min-w-[100px] text-right"
                style={{ color: SEASON_COLORS[currentSeason] }}
              >
                {simDayOffset === 0 ? "Aujourd'hui" : simDayOffset > 0 ? `+${simDayOffset}j` : `${simDayOffset}j`}
              </span>
            </div>
          </div>

          {/* Mobile bottom bar */}
          <div className="lg:hidden border-t" style={{ borderColor: C.paperTan }}>
            <button
              onClick={() => setMobileSheetOpen(!mobileSheetOpen)}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium"
              style={{ background: C.leaf, color: C.cream }}
            >
              {'\u{1F331}'} {mobileSheetOpen ? 'Fermer' : 'Choisir une plante'}
              {selectedPlant && <span className="opacity-75">({selectedPlant.nameFr})</span>}
            </button>

            {mobileSheetOpen && (
              <div
                className="max-h-[50vh] overflow-y-auto"
                style={{ background: C.parchment }}
              >
                <div className="p-3 sticky top-0 z-10" style={{ background: C.parchment }}>
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ background: C.paper, border: `1px solid ${C.dew}`, color: C.ink }}
                  />
                  <div className="flex gap-1.5 mt-2 overflow-x-auto">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.key}
                        onClick={() => setCatFilter(cat.key)}
                        className="px-2 py-1 text-xs rounded-full whitespace-nowrap"
                        style={{
                          background: catFilter === cat.key ? C.leaf : C.paperMid,
                          color: catFilter === cat.key ? C.cream : C.inkMid,
                        }}
                      >
                        {cat.emoji} {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1 p-2">
                  {filteredPlants.slice(0, 60).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => { setSelectedPlant(p); setTool('plant'); setMobileSheetOpen(false); }}
                      className="flex flex-col items-center gap-1 p-2 rounded-lg text-center"
                      style={{
                        background: selectedPlant?.id === p.id ? C.leaf + '18' : C.paper,
                        border: selectedPlant?.id === p.id ? `2px solid ${C.leaf}` : '2px solid transparent',
                      }}
                    >
                      <span className="text-lg">{p.emoji}</span>
                      <span className="text-[10px] font-medium leading-tight" style={{ color: C.ink }}>
                        {p.nameFr.length > 12 ? p.nameFr.slice(0, 11) + '\u2026' : p.nameFr}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* ═══════════════════════════════════════════════════════════════════
           RIGHT SIDEBAR - Info Panel
           ═══════════════════════════════════════════════════════════════════ */}
        <aside
          className="hidden lg:flex flex-col w-64 xl:w-72 border-l overflow-hidden"
          style={{ background: C.parchment, borderColor: C.paperTan }}
        >
          {/* Active tool info */}
          <div className="p-3 border-b" style={{ borderColor: C.paperTan }}>
            <h3 className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: C.inkSoft }}>
              Outil actif
            </h3>
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{ background: C.paper, border: `1px solid ${C.dew}` }}
            >
              <span className="text-base">
                {tool === 'plant' ? '\u{1F331}' : tool === 'remove' ? '\u{1F5D1}\uFE0F' : '\u{1F50D}'}
              </span>
              <div>
                <div className="text-sm font-medium" style={{ color: C.ink }}>
                  {tool === 'plant' ? 'Planter' : tool === 'remove' ? 'Retirer' : 'Inspecter'}
                </div>
                <div className="text-[10px]" style={{ color: C.inkSoft }}>
                  {tool === 'plant' && (selectedPlant ? `${selectedPlant.nameFr} s\u00e9lectionn\u00e9` : 'Choisissez une plante')}
                  {tool === 'remove' && 'Cliquez sur une cellule pour retirer'}
                  {tool === 'inspect' && 'Cliquez sur une cellule pour d\u00e9tails'}
                </div>
              </div>
            </div>
          </div>

          {/* Inspected cell */}
          {inspectedData && (
            <div className="p-3 border-b" style={{ borderColor: C.paperTan }}>
              <h3 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: C.inkSoft }}>
                Cellule inspect\u00e9e
              </h3>
              <div
                className="rounded-lg p-3"
                style={{ background: inspectedData.plant.color + '08', border: `1px solid ${inspectedData.plant.color}25` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{inspectedData.plant.emoji}</span>
                  <div>
                    <div className="text-sm font-bold" style={{ color: C.ink }}>
                      {inspectedData.plant.nameFr}
                    </div>
                    <div className="text-[10px]" style={{ color: C.inkSoft }}>
                      {inspectedData.plant.name}
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs" style={{ color: C.inkMid }}>
                  <div className="flex justify-between">
                    <span>Stade</span>
                    <span className="font-medium">{STAGE_LABEL[inspectedData.stage]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Plant\u00e9 le</span>
                    <span>{new Date(inspectedData.item.plantedDate).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>\u00c2ge</span>
                    <span>{inspectedData.elapsed}j / {inspectedData.plant.dtm}j</span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1.5 rounded-full overflow-hidden mt-1" style={{ background: C.paperTan }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (inspectedData.elapsed / Math.max(1, inspectedData.plant.dtm)) * 100)}%`,
                        background: inspectedData.stage === 'harvest' ? C.gold : C.leaf,
                      }}
                    />
                  </div>
                  <div className="flex justify-between">
                    <span>Densit\u00e9</span>
                    <span>{inspectedData.density} plants/m\u00b2</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Espacement</span>
                    <span>{inspectedData.plant.sp}cm</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Arrosage</span>
                    <span>{inspectedData.plant.wateringFrequency}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Companion info */}
          {(inspectedData || selectedPlant) && (
            <div className="p-3 border-b" style={{ borderColor: C.paperTan }}>
              <h3 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: C.inkSoft }}>
                Compagnonnage
              </h3>
              {(() => {
                const target = inspectedData?.plant ?? selectedPlant;
                if (!target) return null;
                return (
                  <div className="space-y-2">
                    <div>
                      <div className="text-[10px] font-medium mb-1" style={{ color: C.leaf }}>
                        {'\u{1F49A}'} Bons voisins
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {target.comp.length > 0 ? target.comp.slice(0, 8).map((id) => {
                          const cp = PLANT_MAP.get(id);
                          return cp ? (
                            <span
                              key={id}
                              className="px-1.5 py-0.5 rounded text-[10px]"
                              style={{ background: C.leaf + '15', color: C.leafDeep }}
                            >
                              {cp.emoji} {cp.nameFr}
                            </span>
                          ) : null;
                        }) : (
                          <span className="text-[10px]" style={{ color: C.inkSoft }}>Aucun</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-medium mb-1" style={{ color: C.terra }}>
                        {'\u{1F494}'} Mauvais voisins
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {target.enm.length > 0 ? target.enm.slice(0, 8).map((id) => {
                          const ep = PLANT_MAP.get(id);
                          return ep ? (
                            <span
                              key={id}
                              className="px-1.5 py-0.5 rounded text-[10px]"
                              style={{ background: C.terra + '15', color: C.terraDk }}
                            >
                              {ep.emoji} {ep.nameFr}
                            </span>
                          ) : null;
                        }) : (
                          <span className="text-[10px]" style={{ color: C.inkSoft }}>Aucun</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Alerts */}
          <div className="flex-1 overflow-y-auto p-3">
            <h3 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: C.inkSoft }}>
              Alertes {alerts.length > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px]" style={{ background: C.terraPal, color: C.terra }}>{alerts.length}</span>}
            </h3>
            {alerts.length === 0 ? (
              <div className="text-center py-6">
                <span className="text-2xl block mb-2">{'\u{1F33F}'}</span>
                <span className="text-xs" style={{ color: C.inkSoft }}>
                  Tout va bien dans votre jardin!
                </span>
              </div>
            ) : (
              <div className="space-y-1.5">
                {alerts.map((a, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 px-2.5 py-2 rounded-lg text-[11px]"
                    style={{
                      background: a.type === 'warning' ? C.terraPal : C.gold + '15',
                      color: a.type === 'warning' ? C.terraDk : C.gold,
                    }}
                  >
                    <span className="flex-shrink-0 mt-0.5">{a.type === 'warning' ? '\u26A0\uFE0F' : '\u{1F389}'}</span>
                    <span>{a.msg}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ── Add Zone Modal ── */}
      {showAddZoneModal && (
        <AddZoneModal
          onAdd={addZone}
          onClose={() => setShowAddZoneModal(false)}
          gardenCols={totalCols}
          gardenRows={totalRows}
        />
      )}

      {/* ── Global Styles (keyframes) ── */}
      <style>{`
        @keyframes harvestGlow {
          0%, 100% { box-shadow: 0 0 8px ${C.gold}30; }
          50% { box-shadow: 0 0 20px ${C.gold}60, 0 0 40px ${C.gold}20; }
        }
        @keyframes harvestPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: ${C.leaf};
          border: 2px solid ${C.cream};
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
          cursor: pointer;
        }
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: ${C.leaf};
          border: 2px solid ${C.cream};
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
          cursor: pointer;
        }
        aside::-webkit-scrollbar { width: 4px; }
        aside::-webkit-scrollbar-thumb { background: ${C.paperTan}; border-radius: 2px; }
        aside::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  );
}
