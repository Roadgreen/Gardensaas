'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { useGarden, usePlants } from '@/lib/hooks';
import { getPlantById } from '@/lib/garden-utils';
import { computePlacements, validatePlacement } from '@/lib/auto-place';
import type { PlantOrder } from '@/lib/auto-place';
import {
  Plus, Trash2, AlertTriangle, Check, Eye, ArrowLeft, Search, X,
  Heart, ShieldAlert, Leaf, Sparkles, Minus, Zap, ChevronRight, RotateCcw,
} from 'lucide-react';
import type { Plant } from '@/types';

// ─── Constants ───────────────────────────────────────────────────────────────

const EMOJI: Record<string, string> = {
  vegetable: '🥦', herb: '🌿', fruit: '🍓', root: '🥕', ancient: '🌾', exotic: '🌴',
};

const CATS = [
  { key: 'all', label: { fr: 'Tous', en: 'All' } },
  { key: 'vegetable', label: { fr: 'Légumes', en: 'Vegetables' }, emoji: '🥦' },
  { key: 'herb', label: { fr: 'Herbes', en: 'Herbs' }, emoji: '🌿' },
  { key: 'fruit', label: { fr: 'Fruits', en: 'Fruits' }, emoji: '🍓' },
  { key: 'root', label: { fr: 'Racines', en: 'Roots' }, emoji: '🥕' },
  { key: 'ancient', label: { fr: 'Anciennes', en: 'Ancient' }, emoji: '🌾' },
  { key: 'exotic', label: { fr: 'Exotiques', en: 'Exotic' }, emoji: '🌴' },
];

// ─── Steps ───────────────────────────────────────────────────────────────────

type Step = 'select' | 'review' | 'done';

// ─── Component ───────────────────────────────────────────────────────────────

export function GardenPlanner() {
  const { config, isLoaded, addPlant, removePlant, clearGarden } = useGarden();
  const { plants } = usePlants();
  const t = useTranslations('planner2d');
  const locale = useLocale() as 'fr' | 'en';

  // ── Core state ──
  const [step, setStep] = useState<Step>('select');
  const [cart, setCart] = useState<Map<string, number>>(new Map());
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [placedCount, setPlacedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);

  // ── Derived ──
  const cartTotal = useMemo(() => {
    let n = 0;
    cart.forEach(v => (n += v));
    return n;
  }, [cart]);

  const cartItems = useMemo(() => {
    const items: { plant: Plant; qty: number }[] = [];
    cart.forEach((qty, id) => {
      const p = getPlantById(id);
      if (p && qty > 0) items.push({ plant: p, qty });
    });
    return items;
  }, [cart]);

  const filteredPlants = useMemo(() => {
    return plants.filter((p) => {
      if (catFilter !== 'all' && p.category !== catFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return p.name.en.toLowerCase().includes(q) || p.name.fr.toLowerCase().includes(q);
      }
      return true;
    });
  }, [plants, catFilter, search]);

  // Companion/enemy analysis for cart
  const cartAnalysis = useMemo(() => {
    const companions: string[] = [];
    const enemies: string[] = [];
    for (let i = 0; i < cartItems.length; i++) {
      for (let j = i + 1; j < cartItems.length; j++) {
        const a = cartItems[i].plant;
        const b = cartItems[j].plant;
        if (a.companionPlants.includes(b.id) || b.companionPlants.includes(a.id)) {
          companions.push(`${a.name[locale]} + ${b.name[locale]}`);
        }
        if (a.enemyPlants.includes(b.id) || b.enemyPlants.includes(a.id)) {
          enemies.push(`${a.name[locale]} ✕ ${b.name[locale]}`);
        }
      }
    }
    return { companions, enemies };
  }, [cartItems, locale]);

  // Validation of existing garden
  const gardenValidation = useMemo(() => {
    if (config.plantedItems.length < 2) return [];
    return validatePlacement(config.plantedItems, config.width, config.length, getPlantById);
  }, [config.plantedItems, config.width, config.length]);

  // Planted items grouped by type
  const plantedGroups = useMemo(() => {
    const map = new Map<string, number>();
    config.plantedItems.forEach(item => {
      map.set(item.plantId, (map.get(item.plantId) || 0) + 1);
    });
    const groups: { plant: Plant; count: number }[] = [];
    map.forEach((count, id) => {
      const p = getPlantById(id);
      if (p) groups.push({ plant: p, count });
    });
    groups.sort((a, b) => b.count - a.count);
    return groups;
  }, [config.plantedItems]);

  // ── Cart helpers ──
  const setQty = (id: string, qty: number) => {
    setCart(prev => {
      const next = new Map(prev);
      if (qty <= 0) next.delete(id);
      else next.set(id, qty);
      return next;
    });
  };

  // ── Execute placement ──
  const executePlacement = useCallback(() => {
    if (cartItems.length === 0) return;
    const orders: PlantOrder[] = cartItems.map(i => ({ plantId: i.plant.id, quantity: i.qty }));
    const results = computePlacements(orders, config.plantedItems, config.width, config.length, getPlantById);
    for (const r of results) {
      addPlant(r.plantId, r.x, r.z);
    }
    const totalRequested = orders.reduce((s, o) => s + o.quantity, 0);
    setPlacedCount(results.length);
    setSkippedCount(totalRequested - results.length);
    setCart(new Map());
    setStep('done');
  }, [cartItems, config.plantedItems, config.width, config.length, addPlant]);

  // ── Grid rendering ──
  const CELL_PX = 18;
  const gridCols = Math.round(config.width * 10); // 10cm per cell
  const gridRows = Math.round(config.length * 10);
  const maxCols = Math.min(gridCols, 40);
  const maxRows = Math.min(gridRows, 50);

  const cellPlants = useMemo(() => {
    const map = new Map<string, { plantId: string; idx: number }>();
    config.plantedItems.forEach((item, idx) => {
      const col = Math.round((item.x / 100) * maxCols);
      const row = Math.round((item.z / 100) * maxRows);
      map.set(`${col}-${row}`, { plantId: item.plantId, idx });
    });
    return map;
  }, [config.plantedItems, maxCols, maxRows]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#0a1a10] flex items-center justify-center">
        <div className="animate-pulse text-green-400 text-sm">Chargement...</div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP: SELECT — pick plants + quantities
  // ═══════════════════════════════════════════════════════════════════════════
  if (step === 'select') {
    return (
      <div className="min-h-screen bg-[#0a1a10] flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-[#0a1a10]/95 backdrop-blur-md border-b border-green-900/40">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
            <Link href="/garden/dashboard" className="text-green-500 hover:text-green-300">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex-1">
              <h1 className="text-green-50 font-bold text-base">
                {locale === 'fr' ? 'Mon Potager' : 'My Garden'}
              </h1>
              <p className="text-green-500/60 text-[11px]">
                {config.width}m × {config.length}m — {config.plantedItems.length} {locale === 'fr' ? 'plantes' : 'plants'}
              </p>
            </div>
            <Link href="/garden/3d">
              <Button variant="ghost" size="sm" className="gap-1 text-green-400 text-xs">
                <Eye className="w-4 h-4" />
                3D
              </Button>
            </Link>
          </div>
        </header>

        {/* Existing garden preview */}
        {config.plantedItems.length > 0 && (
          <div className="max-w-lg mx-auto w-full px-4 pt-4">
            <div className="rounded-xl bg-[#0d1f14] border border-green-900/30 p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-green-300/80 text-xs font-semibold">
                  {locale === 'fr' ? 'Jardin actuel' : 'Current garden'}
                </p>
                <button
                  onClick={() => { if (confirm(locale === 'fr' ? 'Vider le jardin ?' : 'Clear garden?')) clearGarden(); }}
                  className="text-red-400/60 hover:text-red-400 text-[10px] flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  {locale === 'fr' ? 'Vider' : 'Clear'}
                </button>
              </div>
              {/* Mini grid */}
              <div className="overflow-hidden rounded-lg border border-green-900/20 mb-2">
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: `repeat(${maxCols}, ${CELL_PX}px)`,
                    gridTemplateRows: `repeat(${maxRows}, ${CELL_PX}px)`,
                  }}
                >
                  {Array.from({ length: maxRows * maxCols }, (_, idx) => {
                    const col = idx % maxCols;
                    const row = Math.floor(idx / maxCols);
                    const cell = cellPlants.get(`${col}-${row}`);
                    const plant = cell ? getPlantById(cell.plantId) : null;
                    return (
                      <div
                        key={idx}
                        className={`border transition-colors ${
                          plant ? 'border-green-800/40' : 'border-green-950/30'
                        }`}
                        style={{
                          backgroundColor: plant ? plant.color + '35' : '#0a1a10',
                          width: CELL_PX,
                          height: CELL_PX,
                        }}
                        title={plant ? plant.name[locale] : undefined}
                      >
                        {plant && (
                          <span className="flex items-center justify-center w-full h-full text-[8px] leading-none">
                            {EMOJI[plant.category] || '🌱'}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Planted summary chips */}
              <div className="flex flex-wrap gap-1">
                {plantedGroups.map(({ plant, count }) => (
                  <span key={plant.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-green-900/30 text-green-300/80 border border-green-800/20">
                    {EMOJI[plant.category]} {plant.name[locale]} ×{count}
                  </span>
                ))}
              </div>
              {/* Validation warnings */}
              {gardenValidation.filter(v => v.type === 'error' || v.type === 'warning').length > 0 && (
                <div className="mt-2 space-y-1">
                  {gardenValidation.filter(v => v.type === 'error' || v.type === 'warning').slice(0, 3).map((v, i) => (
                    <div key={i} className={`flex items-start gap-1.5 text-[10px] ${v.type === 'error' ? 'text-red-400/80' : 'text-yellow-400/80'}`}>
                      <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                      <span>{v.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Search + Filter */}
        <div className="max-w-lg mx-auto w-full px-4 pt-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600/50" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={locale === 'fr' ? 'Rechercher un légume...' : 'Search vegetables...'}
              className="w-full pl-9 pr-9 py-3 text-sm rounded-xl bg-[#0d1f14] border border-green-900/30 text-green-100 placeholder:text-green-700/50 focus:outline-none focus:border-green-600/50"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
            {CATS.map(c => (
              <button
                key={c.key}
                onClick={() => setCatFilter(c.key)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                  catFilter === c.key
                    ? 'bg-green-700/50 text-green-100 border border-green-600/50'
                    : 'bg-[#0d1f14] text-green-400/60 border border-green-900/20 hover:text-green-300'
                }`}
              >
                {'emoji' in c ? `${c.emoji} ` : ''}{c.label[locale]}
              </button>
            ))}
          </div>
        </div>

        {/* Plant list */}
        <div className="flex-1 overflow-y-auto px-4 pb-40 max-w-lg mx-auto w-full">
          <div className="space-y-1.5 pt-3">
            {filteredPlants.length === 0 && (
              <p className="text-center text-green-600/50 text-sm py-8">
                {locale === 'fr' ? 'Aucun résultat' : 'No results'}
              </p>
            )}
            {filteredPlants.map((plant) => {
              const qty = cart.get(plant.id) || 0;
              const name = plant.name[locale];

              // Companion/enemy hints
              const cartIds = Array.from(cart.keys()).filter(id => id !== plant.id && (cart.get(id) || 0) > 0);
              const isCompanion = cartIds.some(id => plant.companionPlants.includes(id) || (getPlantById(id)?.companionPlants.includes(plant.id) ?? false));
              const isEnemy = cartIds.some(id => plant.enemyPlants.includes(id) || (getPlantById(id)?.enemyPlants.includes(plant.id) ?? false));

              return (
                <div
                  key={plant.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    qty > 0
                      ? 'bg-green-900/25 border-green-600/40'
                      : 'bg-[#0d1f14] border-green-900/15 active:bg-green-900/20'
                  }`}
                >
                  {/* Icon */}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ backgroundColor: plant.color + '18' }}
                  >
                    {EMOJI[plant.category] || '🌱'}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-green-100 font-medium truncate">{name}</span>
                      {isCompanion && <Heart className="w-3 h-3 text-green-400 shrink-0" />}
                      {isEnemy && <ShieldAlert className="w-3 h-3 text-red-400 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-green-500/60 mt-0.5">
                      <span>{plant.spacingCm}cm</span>
                      <span>·</span>
                      <span>{plant.harvestDays}{locale === 'fr' ? 'j' : 'd'}</span>
                      <span>·</span>
                      <span>{plant.difficulty === 'easy' ? (locale === 'fr' ? 'Facile' : 'Easy') : plant.difficulty === 'medium' ? (locale === 'fr' ? 'Moyen' : 'Medium') : (locale === 'fr' ? 'Difficile' : 'Hard')}</span>
                    </div>
                  </div>

                  {/* Quantity controls */}
                  {qty > 0 ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setQty(plant.id, qty - 1)}
                        className="w-9 h-9 rounded-xl bg-green-900/50 text-green-200 flex items-center justify-center active:bg-green-800/60 cursor-pointer"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-green-50 font-bold text-base w-8 text-center">{qty}</span>
                      <button
                        onClick={() => setQty(plant.id, qty + 1)}
                        className="w-9 h-9 rounded-xl bg-green-900/50 text-green-200 flex items-center justify-center active:bg-green-800/60 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setQty(plant.id, 1)}
                      className="w-9 h-9 rounded-xl bg-green-800/30 border border-green-700/30 text-green-400 flex items-center justify-center active:bg-green-700/40 cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        {cartTotal > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-40">
            <div className="max-w-lg mx-auto px-4 pb-safe">
              <div className="bg-[#0d1f14]/95 backdrop-blur-md border-t border-green-800/40 rounded-t-2xl px-4 pt-3 pb-4 shadow-2xl shadow-black/50">
                {/* Quick summary chips */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {cartItems.map(({ plant, qty }) => (
                    <span key={plant.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-green-900/40 text-green-200 border border-green-800/30">
                      {EMOJI[plant.category]} {plant.name[locale]} <strong>×{qty}</strong>
                      <button onClick={() => setQty(plant.id, 0)} className="text-green-600 hover:text-red-400 ml-0.5 cursor-pointer">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                {/* Companion/enemy hints */}
                {cartAnalysis.companions.length > 0 && (
                  <p className="text-[10px] text-green-400/70 mb-1 flex items-center gap-1">
                    <Heart className="w-3 h-3 shrink-0" /> {cartAnalysis.companions.join(', ')}
                  </p>
                )}
                {cartAnalysis.enemies.length > 0 && (
                  <p className="text-[10px] text-yellow-400/70 mb-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" /> {cartAnalysis.enemies.join(', ')}
                  </p>
                )}
                {/* CTA */}
                <button
                  onClick={() => setStep('review')}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-green-600 hover:bg-green-500 active:bg-green-700 text-white font-bold text-sm transition-all cursor-pointer shadow-lg shadow-green-900/50"
                >
                  <ChevronRight className="w-5 h-5" />
                  {locale === 'fr'
                    ? `Continuer avec ${cartTotal} plante${cartTotal > 1 ? 's' : ''}`
                    : `Continue with ${cartTotal} plant${cartTotal > 1 ? 's' : ''}`
                  }
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP: REVIEW — confirm before placement
  // ═══════════════════════════════════════════════════════════════════════════
  if (step === 'review') {
    const totalArea = config.width * config.length;
    const neededArea = cartItems.reduce((acc, { plant, qty }) => {
      const sp = plant.spacingCm / 100;
      const rs = (plant.rowSpacingCm ?? plant.spacingCm * 1.5) / 100;
      return acc + qty * sp * rs;
    }, 0);
    const existingArea = config.plantedItems.reduce((acc, item) => {
      const p = getPlantById(item.plantId);
      if (!p) return acc;
      const sp = p.spacingCm / 100;
      const rs = (p.rowSpacingCm ?? p.spacingCm * 1.5) / 100;
      return acc + sp * rs;
    }, 0);
    const freeArea = totalArea - existingArea;
    const fitsPercent = Math.min(100, Math.round((freeArea / neededArea) * 100));

    return (
      <div className="min-h-screen bg-[#0a1a10] flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-[#0a1a10]/95 backdrop-blur-md border-b border-green-900/40">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
            <button onClick={() => setStep('select')} className="text-green-500 hover:text-green-300 cursor-pointer">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-green-50 font-bold text-base flex-1">
              {locale === 'fr' ? 'Récapitulatif' : 'Review'}
            </h1>
          </div>
        </header>

        <div className="flex-1 px-4 py-4 max-w-lg mx-auto w-full space-y-4 pb-32">
          {/* Space check */}
          <div className={`rounded-xl p-4 border ${fitsPercent >= 80 ? 'bg-green-900/20 border-green-700/30' : fitsPercent >= 50 ? 'bg-yellow-900/15 border-yellow-700/30' : 'bg-red-900/15 border-red-700/30'}`}>
            <div className="flex items-center gap-3 mb-2">
              {fitsPercent >= 80 ? (
                <div className="w-10 h-10 rounded-full bg-green-600/20 flex items-center justify-center"><Check className="w-5 h-5 text-green-400" /></div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-yellow-600/20 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-yellow-400" /></div>
              )}
              <div>
                <p className={`text-sm font-semibold ${fitsPercent >= 80 ? 'text-green-200' : 'text-yellow-200'}`}>
                  {fitsPercent >= 80
                    ? (locale === 'fr' ? 'Tout devrait rentrer !' : 'Everything should fit!')
                    : (locale === 'fr' ? 'Espace limité' : 'Limited space')
                  }
                </p>
                <p className="text-[11px] text-green-400/60">
                  {locale === 'fr' ? `~${neededArea.toFixed(1)}m² nécessaire / ${freeArea.toFixed(1)}m² disponible` : `~${neededArea.toFixed(1)}m² needed / ${freeArea.toFixed(1)}m² available`}
                </p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-2 rounded-full bg-green-950/50 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${fitsPercent >= 80 ? 'bg-green-500' : fitsPercent >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(100, Math.round((neededArea / freeArea) * 100))}%` }}
              />
            </div>
          </div>

          {/* Plant list */}
          <div className="rounded-xl bg-[#0d1f14] border border-green-900/30 divide-y divide-green-900/20">
            {cartItems.map(({ plant, qty }) => (
              <div key={plant.id} className="flex items-center gap-3 p-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: plant.color + '18' }}>
                  {EMOJI[plant.category] || '🌱'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-green-100 text-sm font-medium">{plant.name[locale]}</p>
                  <p className="text-green-500/60 text-[10px]">{plant.spacingCm}cm {locale === 'fr' ? 'entre chaque' : 'between each'}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => setQty(plant.id, qty - 1)} className="w-8 h-8 rounded-lg bg-green-900/40 text-green-300 flex items-center justify-center cursor-pointer"><Minus className="w-3.5 h-3.5" /></button>
                  <span className="text-green-50 font-bold text-sm w-7 text-center">{qty}</span>
                  <button onClick={() => setQty(plant.id, qty + 1)} className="w-8 h-8 rounded-lg bg-green-900/40 text-green-300 flex items-center justify-center cursor-pointer"><Plus className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>

          {/* Companion/enemy info */}
          {cartAnalysis.companions.length > 0 && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-green-900/15 border border-green-800/25">
              <Heart className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-green-200 font-medium mb-0.5">{locale === 'fr' ? 'Bons compagnons' : 'Good companions'}</p>
                <p className="text-[11px] text-green-400/70">{cartAnalysis.companions.join(' · ')}</p>
                <p className="text-[10px] text-green-500/50 mt-1">{locale === 'fr' ? "L'algorithme les placera côte à côte" : 'Algorithm will place them nearby'}</p>
              </div>
            </div>
          )}
          {cartAnalysis.enemies.length > 0 && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-yellow-900/10 border border-yellow-800/20">
              <ShieldAlert className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-yellow-200 font-medium mb-0.5">{locale === 'fr' ? 'Plantes ennemies' : 'Enemy plants'}</p>
                <p className="text-[11px] text-yellow-400/70">{cartAnalysis.enemies.join(' · ')}</p>
                <p className="text-[10px] text-yellow-500/50 mt-1">{locale === 'fr' ? "L'algorithme les éloignera au maximum" : 'Algorithm will keep them apart'}</p>
              </div>
            </div>
          )}

          {/* How it works */}
          <div className="rounded-xl bg-[#0d1f14] border border-green-900/30 p-4">
            <p className="text-green-300/80 text-xs font-semibold mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-green-400" />
              {locale === 'fr' ? 'Comment ça marche' : 'How it works'}
            </p>
            <div className="space-y-1.5 text-[11px] text-green-400/60">
              <p>✓ {locale === 'fr' ? 'Espacement optimal entre chaque plante' : 'Optimal spacing between each plant'}</p>
              <p>✓ {locale === 'fr' ? 'Compagnons placés proches' : 'Companions placed nearby'}</p>
              <p>✓ {locale === 'fr' ? 'Ennemis éloignés' : 'Enemies kept apart'}</p>
              <p>✓ {locale === 'fr' ? 'Plantes existantes prises en compte' : 'Existing plants respected'}</p>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="fixed bottom-0 left-0 right-0 z-40">
          <div className="max-w-lg mx-auto px-4 pb-safe">
            <div className="bg-[#0d1f14]/95 backdrop-blur-md border-t border-green-800/40 rounded-t-2xl px-4 pt-3 pb-4 shadow-2xl shadow-black/50 space-y-2">
              <button
                onClick={executePlacement}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-green-600 hover:bg-green-500 active:bg-green-700 text-white font-bold text-base transition-all cursor-pointer shadow-lg shadow-green-900/50"
              >
                <Zap className="w-5 h-5" />
                {locale === 'fr'
                  ? `Planter ${cartTotal} légume${cartTotal > 1 ? 's' : ''} automatiquement`
                  : `Auto-plant ${cartTotal} vegetable${cartTotal > 1 ? 's' : ''}`
                }
              </button>
              <button
                onClick={() => setStep('select')}
                className="w-full py-2.5 text-green-400/70 text-sm font-medium cursor-pointer hover:text-green-300"
              >
                {locale === 'fr' ? '← Modifier ma sélection' : '← Edit selection'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP: DONE — result + garden view
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#0a1a10] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0a1a10]/95 backdrop-blur-md border-b border-green-900/40">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/garden/dashboard" className="text-green-500 hover:text-green-300">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-green-50 font-bold text-base flex-1">
            {locale === 'fr' ? 'Mon Potager' : 'My Garden'}
          </h1>
          <Link href="/garden/3d">
            <Button variant="ghost" size="sm" className="gap-1 text-green-400 text-xs">
              <Eye className="w-4 h-4" /> 3D
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex-1 px-4 py-4 max-w-lg mx-auto w-full space-y-4 pb-32">
        {/* Success banner */}
        <div className="rounded-xl bg-green-900/25 border border-green-600/40 p-4 flex items-start gap-3">
          <div className="w-12 h-12 rounded-full bg-green-600/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <p className="text-green-100 font-semibold text-sm">
              {placedCount > 0
                ? (locale === 'fr' ? `${placedCount} plante${placedCount > 1 ? 's' : ''} placée${placedCount > 1 ? 's' : ''} !` : `${placedCount} plant${placedCount > 1 ? 's' : ''} placed!`)
                : (locale === 'fr' ? 'Aucune plante placée' : 'No plants placed')
              }
            </p>
            {skippedCount > 0 && (
              <p className="text-yellow-400/80 text-xs mt-0.5">
                {locale === 'fr' ? `${skippedCount} non placée${skippedCount > 1 ? 's' : ''} (pas assez de place)` : `${skippedCount} skipped (not enough space)`}
              </p>
            )}
            <p className="text-green-500/60 text-[11px] mt-1">
              {locale === 'fr' ? 'Espacements, compagnons et ennemis pris en compte' : 'Spacing, companions and enemies optimized'}
            </p>
          </div>
        </div>

        {/* Garden grid */}
        <div className="rounded-xl bg-[#0d1f14] border border-green-900/30 p-3">
          <p className="text-green-300/80 text-xs font-semibold mb-2">
            {locale === 'fr' ? 'Vue du jardin' : 'Garden view'} — {config.plantedItems.length} {locale === 'fr' ? 'plantes' : 'plants'}
          </p>
          <div className="overflow-auto rounded-lg border border-green-900/20">
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${maxCols}, ${CELL_PX}px)`,
                gridTemplateRows: `repeat(${maxRows}, ${CELL_PX}px)`,
              }}
            >
              {Array.from({ length: maxRows * maxCols }, (_, idx) => {
                const col = idx % maxCols;
                const row = Math.floor(idx / maxCols);
                const cell = cellPlants.get(`${col}-${row}`);
                const plant = cell ? getPlantById(cell.plantId) : null;
                return (
                  <div
                    key={idx}
                    className={`border ${plant ? 'border-green-800/40' : 'border-green-950/30'}`}
                    style={{
                      backgroundColor: plant ? plant.color + '35' : '#0a1a10',
                      width: CELL_PX,
                      height: CELL_PX,
                    }}
                  >
                    {plant && (
                      <span className="flex items-center justify-center w-full h-full text-[8px] leading-none">
                        {EMOJI[plant.category] || '🌱'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {plantedGroups.map(({ plant, count }) => (
              <span key={plant.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-green-900/30 text-green-300/80 border border-green-800/20">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: plant.color }} />
                {plant.name[locale]} ×{count}
              </span>
            ))}
          </div>
        </div>

        {/* Validation */}
        {gardenValidation.length > 0 && (
          <div className="rounded-xl bg-[#0d1f14] border border-green-900/30 p-3 space-y-1.5">
            <p className="text-green-300/80 text-xs font-semibold mb-1">
              {locale === 'fr' ? 'Analyse du jardin' : 'Garden analysis'}
            </p>
            {gardenValidation.slice(0, 8).map((v, i) => (
              <div key={i} className={`flex items-start gap-2 text-[11px] ${
                v.type === 'error' ? 'text-red-400/80' : v.type === 'warning' ? 'text-yellow-400/80' : 'text-green-400/80'
              }`}>
                {v.type === 'good' ? <Heart className="w-3 h-3 mt-0.5 shrink-0" /> : <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />}
                <span>{v.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <div className="max-w-lg mx-auto px-4 pb-safe">
          <div className="bg-[#0d1f14]/95 backdrop-blur-md border-t border-green-800/40 rounded-t-2xl px-4 pt-3 pb-4 shadow-2xl shadow-black/50 space-y-2">
            <button
              onClick={() => { setStep('select'); setPlacedCount(0); setSkippedCount(0); }}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-green-600 hover:bg-green-500 active:bg-green-700 text-white font-bold text-sm transition-all cursor-pointer shadow-lg shadow-green-900/50"
            >
              <Plus className="w-5 h-5" />
              {locale === 'fr' ? 'Ajouter encore des plantes' : 'Add more plants'}
            </button>
            <div className="flex gap-2">
              <Link href="/garden/3d" className="flex-1">
                <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-900/30 border border-green-700/30 text-green-200 text-sm font-medium cursor-pointer">
                  <Eye className="w-4 h-4" /> {locale === 'fr' ? 'Voir en 3D' : 'View 3D'}
                </button>
              </Link>
              <button
                onClick={() => { if (confirm(locale === 'fr' ? 'Recommencer à zéro ?' : 'Start over?')) { clearGarden(); setStep('select'); } }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-900/15 border border-red-800/20 text-red-400 text-sm font-medium cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
