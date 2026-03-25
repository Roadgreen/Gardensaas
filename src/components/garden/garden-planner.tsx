'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardTitle, CardContent } from '@/components/ui/card';
import { useGarden, usePlants } from '@/lib/hooks';
import { getPlantById } from '@/lib/garden-utils';
import { computePlacements, validatePlacement } from '@/lib/auto-place';
import type { PlantOrder } from '@/lib/auto-place';
import {
  Plus, Trash2, AlertTriangle, Check, Eye, ArrowLeft, Search, X,
  Heart, ShieldAlert, Leaf, Sparkles, Minus, Zap, ChevronRight, RotateCcw,
} from 'lucide-react';
import type { Plant } from '@/types';

/* ── Emoji map ─────────────────────────────────────────────────────────────── */
const E: Record<string, string> = {
  vegetable: '🥦', herb: '🌿', fruit: '🍓', root: '🥕', ancient: '🌾', exotic: '🌴',
};

const CATS = [
  { key: 'all', fr: 'Tous', en: 'All' },
  { key: 'vegetable', fr: 'Légumes', en: 'Vegetables', e: '🥦' },
  { key: 'herb', fr: 'Herbes', en: 'Herbs', e: '🌿' },
  { key: 'fruit', fr: 'Fruits', en: 'Fruits', e: '🍓' },
  { key: 'root', fr: 'Racines', en: 'Roots', e: '🥕' },
];

/* ── SVG Garden View ───────────────────────────────────────────────────────── */

function GardenSVG({ items, widthM, lengthM, compact }: {
  items: { plantId: string; x: number; z: number }[];
  widthM: number;
  lengthM: number;
  compact?: boolean;
}) {
  const locale = useLocale() as 'fr' | 'en';
  const wCm = widthM * 100;
  const lCm = lengthM * 100;
  const PAD = 8;

  // Group plants by position to avoid overlaps in label
  const plantCircles = items.map((item, idx) => {
    const plant = getPlantById(item.plantId);
    if (!plant) return null;
    const cx = (item.x / 100) * wCm;
    const cy = (item.z / 100) * lCm;
    const r = plant.spacingCm / 2;
    return { plant, cx, cy, r, idx };
  }).filter(Boolean) as { plant: Plant; cx: number; cy: number; r: number; idx: number }[];

  return (
    <svg
      viewBox={`${-PAD} ${-PAD} ${wCm + PAD * 2} ${lCm + PAD * 2}`}
      className="w-full rounded-xl border"
      style={{
        maxHeight: compact ? 200 : 400,
        background: 'var(--surface-container-lowest)',
        borderColor: 'var(--outline-variant)',
      }}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Grid lines every 50cm */}
      {Array.from({ length: Math.floor(wCm / 50) + 1 }, (_, i) => (
        <line key={`v${i}`} x1={i * 50} y1={0} x2={i * 50} y2={lCm} stroke="var(--outline-variant)" strokeWidth={0.5} strokeDasharray="4 4" opacity={0.4} />
      ))}
      {Array.from({ length: Math.floor(lCm / 50) + 1 }, (_, i) => (
        <line key={`h${i}`} x1={0} y1={i * 50} x2={wCm} y2={i * 50} stroke="var(--outline-variant)" strokeWidth={0.5} strokeDasharray="4 4" opacity={0.4} />
      ))}

      {/* Garden border */}
      <rect x={0} y={0} width={wCm} height={lCm} fill="none" stroke="var(--primary)" strokeWidth={2} rx={4} />

      {/* Dimension labels */}
      <text x={wCm / 2} y={-3} textAnchor="middle" fontSize={compact ? 8 : 10} fill="var(--on-surface)" opacity={0.5}>{widthM}m</text>
      <text x={-3} y={lCm / 2} textAnchor="middle" fontSize={compact ? 8 : 10} fill="var(--on-surface)" opacity={0.5} transform={`rotate(-90, -3, ${lCm / 2})`}>{lengthM}m</text>

      {/* Plants */}
      {plantCircles.map(({ plant, cx, cy, r, idx }) => {
        const displayR = Math.max(r, compact ? 8 : 12);
        return (
          <g key={idx}>
            {/* Spacing circle (faded) */}
            <circle cx={cx} cy={cy} r={r} fill={plant.color + '15'} stroke={plant.color + '40'} strokeWidth={1} />
            {/* Plant dot */}
            <circle cx={cx} cy={cy} r={Math.max(displayR * 0.4, compact ? 5 : 7)} fill={plant.color} opacity={0.85} />
            {/* Emoji */}
            <text x={cx} y={cy + (compact ? 3 : 4)} textAnchor="middle" fontSize={compact ? 7 : 10}>
              {E[plant.category] || '🌱'}
            </text>
            {/* Name (only in full view) */}
            {!compact && (
              <text x={cx} y={cy + r + 10} textAnchor="middle" fontSize={7} fill="var(--on-surface)" opacity={0.7}>
                {plant.name[locale].length > 10 ? plant.name[locale].slice(0, 9) + '…' : plant.name[locale]}
              </text>
            )}
          </g>
        );
      })}

      {/* Empty state */}
      {items.length === 0 && (
        <text x={wCm / 2} y={lCm / 2} textAnchor="middle" fontSize={14} fill="var(--on-surface)" opacity={0.3}>
          {locale === 'fr' ? 'Jardin vide' : 'Empty garden'}
        </text>
      )}
    </svg>
  );
}

/* ── Main component ────────────────────────────────────────────────────────── */

type Step = 'select' | 'review' | 'done';

export function GardenPlanner() {
  const { config, isLoaded, addPlant, removePlant, clearGarden } = useGarden();
  const { plants } = usePlants();
  const locale = useLocale() as 'fr' | 'en';
  const L = locale === 'fr'; // shorthand

  const [step, setStep] = useState<Step>('select');
  const [cart, setCart] = useState<Map<string, number>>(new Map());
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [placedCount, setPlacedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);

  /* ── Derived ── */
  const cartTotal = useMemo(() => { let n = 0; cart.forEach(v => n += v); return n; }, [cart]);

  const cartItems = useMemo(() => {
    const r: { plant: Plant; qty: number }[] = [];
    cart.forEach((qty, id) => { const p = getPlantById(id); if (p && qty > 0) r.push({ plant: p, qty }); });
    return r;
  }, [cart]);

  const filtered = useMemo(() => {
    return plants.filter(p => {
      if (catFilter !== 'all' && p.category !== catFilter) return false;
      if (search) { const q = search.toLowerCase(); return p.name.en.toLowerCase().includes(q) || p.name.fr.toLowerCase().includes(q); }
      return true;
    });
  }, [plants, catFilter, search]);

  const analysis = useMemo(() => {
    const companions: string[] = [];
    const enemies: string[] = [];
    for (let i = 0; i < cartItems.length; i++) {
      for (let j = i + 1; j < cartItems.length; j++) {
        const a = cartItems[i].plant, b = cartItems[j].plant;
        if (a.companionPlants.includes(b.id) || b.companionPlants.includes(a.id))
          companions.push(`${a.name[locale]} + ${b.name[locale]}`);
        if (a.enemyPlants.includes(b.id) || b.enemyPlants.includes(a.id))
          enemies.push(`${a.name[locale]} ✕ ${b.name[locale]}`);
      }
    }
    return { companions, enemies };
  }, [cartItems, locale]);

  const plantedGroups = useMemo(() => {
    const m = new Map<string, number>();
    config.plantedItems.forEach(i => m.set(i.plantId, (m.get(i.plantId) || 0) + 1));
    const g: { plant: Plant; count: number }[] = [];
    m.forEach((c, id) => { const p = getPlantById(id); if (p) g.push({ plant: p, count: c }); });
    g.sort((a, b) => b.count - a.count);
    return g;
  }, [config.plantedItems]);

  const validation = useMemo(() => {
    if (config.plantedItems.length < 2) return [];
    return validatePlacement(config.plantedItems, config.width, config.length, getPlantById);
  }, [config.plantedItems, config.width, config.length]);

  /* ── Cart helpers ── */
  const setQty = (id: string, qty: number) => setCart(prev => {
    const n = new Map(prev);
    if (qty <= 0) n.delete(id); else n.set(id, qty);
    return n;
  });

  /* ── Execute placement ── */
  const executePlacement = useCallback(() => {
    if (cartItems.length === 0) return;
    const orders: PlantOrder[] = cartItems.map(i => ({ plantId: i.plant.id, quantity: i.qty }));
    const results = computePlacements(orders, config.plantedItems, config.width, config.length, getPlantById);
    for (const r of results) addPlant(r.plantId, r.x, r.z);
    const total = orders.reduce((s, o) => s + o.quantity, 0);
    setPlacedCount(results.length);
    setSkippedCount(total - results.length);
    setCart(new Map());
    setStep('done');
  }, [cartItems, config.plantedItems, config.width, config.length, addPlant]);

  if (!isLoaded) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
      <div className="animate-pulse" style={{ color: 'var(--primary)' }}>Loading...</div>
    </div>;
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     STEP 1: SELECT
     ═══════════════════════════════════════════════════════════════════════════ */
  if (step === 'select') return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-md border-b" style={{ background: 'var(--nav-bg)', borderColor: 'var(--outline-variant)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/garden/dashboard" style={{ color: 'var(--primary)' }}><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-base" style={{ color: 'var(--heading)' }}>{L ? 'Planifier mon potager' : 'Plan my garden'}</h1>
            <p className="text-[11px] opacity-60" style={{ color: 'var(--body-text)' }}>{config.width}m × {config.length}m</p>
          </div>
          <Link href="/garden/3d"><Button variant="ghost" size="sm" className="gap-1 text-xs"><Eye className="w-4 h-4" />3D</Button></Link>
        </div>
      </header>

      {/* Current garden preview */}
      {config.plantedItems.length > 0 && (
        <div className="max-w-2xl mx-auto w-full px-4 pt-4">
          <Card>
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-sm">{L ? 'Jardin actuel' : 'Current garden'}</CardTitle>
              <button onClick={() => { if (confirm(L ? 'Vider le jardin ?' : 'Clear garden?')) clearGarden(); }}
                className="text-xs flex items-center gap-1 cursor-pointer opacity-60 hover:opacity-100" style={{ color: 'var(--tertiary)' }}>
                <Trash2 className="w-3 h-3" />{L ? 'Vider' : 'Clear'}
              </button>
            </div>
            <GardenSVG items={config.plantedItems} widthM={config.width} lengthM={config.length} compact />
            <div className="flex flex-wrap gap-1 mt-3">
              {plantedGroups.map(({ plant, count }) => (
                <span key={plant.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                  style={{ background: 'var(--badge-bg)', color: 'var(--badge-text)', border: '1px solid var(--badge-border)' }}>
                  {E[plant.category]} {plant.name[locale]} ×{count}
                </span>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Search + categories */}
      <div className="max-w-2xl mx-auto w-full px-4 pt-4">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" style={{ color: 'var(--on-surface)' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder={L ? 'Rechercher un légume...' : 'Search vegetables...'}
            className="w-full pl-9 pr-9 py-3 text-sm rounded-xl border focus:outline-none focus:ring-2"
            style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--on-surface)', '--tw-ring-color': 'var(--primary)' } as React.CSSProperties}
          />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 cursor-pointer"><X className="w-4 h-4" /></button>}
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {CATS.map(c => (
            <button key={c.key} onClick={() => setCatFilter(c.key)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer border`}
              style={catFilter === c.key
                ? { background: 'var(--primary)', color: 'var(--on-primary)', borderColor: 'var(--primary)' }
                : { background: 'var(--surface-container)', color: 'var(--on-surface)', borderColor: 'var(--outline-variant)', opacity: 0.8 }
              }>
              {c.e ? `${c.e} ` : ''}{c[locale]}
            </button>
          ))}
        </div>
      </div>

      {/* Plant list */}
      <div className="flex-1 overflow-y-auto px-4 pb-44 max-w-2xl mx-auto w-full">
        <div className="space-y-2 pt-3">
          {filtered.length === 0 && <p className="text-center text-sm py-8 opacity-40">{L ? 'Aucun résultat' : 'No results'}</p>}
          {filtered.map(plant => {
            const qty = cart.get(plant.id) || 0;
            const name = plant.name[locale];
            const cartIds = Array.from(cart.keys()).filter(id => id !== plant.id && (cart.get(id) || 0) > 0);
            const isComp = cartIds.some(id => plant.companionPlants.includes(id) || (getPlantById(id)?.companionPlants.includes(plant.id) ?? false));
            const isEnem = cartIds.some(id => plant.enemyPlants.includes(id) || (getPlantById(id)?.enemyPlants.includes(plant.id) ?? false));

            return (
              <Card key={plant.id} className={`!p-3 ${qty > 0 ? 'ring-2' : ''}`} style={qty > 0 ? { '--tw-ring-color': 'var(--primary)' } as React.CSSProperties : {}}>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ backgroundColor: plant.color + '18' }}>
                    {E[plant.category] || '🌱'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium truncate" style={{ color: 'var(--heading)' }}>{name}</span>
                      {isComp && <Heart className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--primary)' }} />}
                      {isEnem && <ShieldAlert className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--tertiary)' }} />}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] mt-0.5 opacity-50" style={{ color: 'var(--body-text)' }}>
                      <span>{plant.spacingCm}cm</span>
                      <span>·</span>
                      <span>{plant.harvestDays}{L ? 'j' : 'd'}</span>
                      <span>·</span>
                      <span>{plant.difficulty === 'easy' ? (L ? 'Facile' : 'Easy') : plant.difficulty === 'medium' ? (L ? 'Moyen' : 'Medium') : (L ? 'Difficile' : 'Hard')}</span>
                    </div>
                  </div>
                  {qty > 0 ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => setQty(plant.id, qty - 1)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-colors border"
                        style={{ background: 'var(--surface-container)', borderColor: 'var(--outline-variant)', color: 'var(--on-surface)' }}>
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-bold text-base w-8 text-center" style={{ color: 'var(--heading)' }}>{qty}</span>
                      <button onClick={() => setQty(plant.id, qty + 1)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-colors border"
                        style={{ background: 'var(--surface-container)', borderColor: 'var(--outline-variant)', color: 'var(--on-surface)' }}>
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setQty(plant.id, 1)}
                      className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-colors border"
                      style={{ background: 'var(--surface-container)', borderColor: 'var(--outline-variant)', color: 'var(--primary)' }}>
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Bottom CTA */}
      {cartTotal > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40">
          <div className="max-w-2xl mx-auto px-4" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
            <div className="rounded-t-2xl px-4 pt-3 pb-4 shadow-2xl border-t backdrop-blur-md"
              style={{ background: 'var(--nav-bg)', borderColor: 'var(--outline-variant)', boxShadow: '0 -4px 30px var(--shadow-lg)' }}>
              {/* Cart chips */}
              <div className="flex flex-wrap gap-1 mb-3">
                {cartItems.map(({ plant, qty }) => (
                  <span key={plant.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
                    style={{ background: 'var(--badge-bg)', color: 'var(--badge-text)', border: '1px solid var(--badge-border)' }}>
                    {E[plant.category]} {plant.name[locale]} <strong>×{qty}</strong>
                    <button onClick={() => setQty(plant.id, 0)} className="opacity-50 hover:opacity-100 ml-0.5 cursor-pointer"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
              {analysis.companions.length > 0 && (
                <p className="text-[10px] mb-1 flex items-center gap-1" style={{ color: 'var(--primary)' }}>
                  <Heart className="w-3 h-3 shrink-0" /> {analysis.companions.join(', ')}
                </p>
              )}
              {analysis.enemies.length > 0 && (
                <p className="text-[10px] mb-1 flex items-center gap-1" style={{ color: 'var(--tertiary)' }}>
                  <AlertTriangle className="w-3 h-3 shrink-0" /> {analysis.enemies.join(', ')}
                </p>
              )}
              <Button size="lg" className="w-full gap-2 text-sm" onClick={() => setStep('review')}>
                <ChevronRight className="w-5 h-5" />
                {L ? `Continuer avec ${cartTotal} plante${cartTotal > 1 ? 's' : ''}` : `Continue with ${cartTotal} plant${cartTotal > 1 ? 's' : ''}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  /* ═══════════════════════════════════════════════════════════════════════════
     STEP 2: REVIEW
     ═══════════════════════════════════════════════════════════════════════════ */
  if (step === 'review') {
    const totalArea = config.width * config.length;
    const neededArea = cartItems.reduce((a, { plant, qty }) => {
      const s = plant.spacingCm / 100;
      const rs = (plant.rowSpacingCm ?? plant.spacingCm * 1.5) / 100;
      return a + qty * s * rs;
    }, 0);
    const existingArea = config.plantedItems.reduce((a, item) => {
      const p = getPlantById(item.plantId);
      if (!p) return a;
      return a + (p.spacingCm / 100) * ((p.rowSpacingCm ?? p.spacingCm * 1.5) / 100);
    }, 0);
    const freeArea = totalArea - existingArea;
    const fits = neededArea <= freeArea;

    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
        <header className="sticky top-0 z-30 backdrop-blur-md border-b" style={{ background: 'var(--nav-bg)', borderColor: 'var(--outline-variant)' }}>
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
            <button onClick={() => setStep('select')} className="cursor-pointer" style={{ color: 'var(--primary)' }}><ArrowLeft className="w-5 h-5" /></button>
            <h1 className="font-bold text-base flex-1" style={{ color: 'var(--heading)' }}>{L ? 'Récapitulatif' : 'Review'}</h1>
          </div>
        </header>

        <div className="flex-1 px-4 py-4 max-w-2xl mx-auto w-full space-y-4 pb-36">
          {/* Space check */}
          <Card>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: fits ? 'var(--accent-muted)' : 'rgba(232, 169, 144, 0.15)' }}>
                {fits ? <Check className="w-5 h-5" style={{ color: 'var(--primary)' }} /> : <AlertTriangle className="w-5 h-5" style={{ color: 'var(--tertiary)' }} />}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--heading)' }}>
                  {fits ? (L ? 'Tout devrait rentrer !' : 'Everything should fit!') : (L ? 'Espace limité' : 'Limited space')}
                </p>
                <p className="text-[11px] opacity-60" style={{ color: 'var(--body-text)' }}>
                  {L ? `~${neededArea.toFixed(1)}m² nécessaire / ${freeArea.toFixed(1)}m² disponible` : `~${neededArea.toFixed(1)}m² needed / ${freeArea.toFixed(1)}m² available`}
                </p>
              </div>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-container)' }}>
              <div className="h-full rounded-full transition-all" style={{
                width: `${Math.min(100, Math.round((neededArea / Math.max(freeArea, 0.1)) * 100))}%`,
                background: fits ? 'var(--primary)' : 'var(--tertiary)',
              }} />
            </div>
          </Card>

          {/* Plant list */}
          <Card>
            <CardTitle className="text-sm mb-3">{L ? 'Mes plantes' : 'My plants'} ({cartTotal})</CardTitle>
            <div className="divide-y" style={{ borderColor: 'var(--outline-variant)' }}>
              {cartItems.map(({ plant, qty }) => (
                <div key={plant.id} className="flex items-center gap-3 py-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: plant.color + '18' }}>
                    {E[plant.category] || '🌱'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'var(--heading)' }}>{plant.name[locale]}</p>
                    <p className="text-[10px] opacity-50">{plant.spacingCm}cm {L ? 'entre chaque' : 'apart'}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => setQty(plant.id, qty - 1)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer border"
                      style={{ background: 'var(--surface-container)', borderColor: 'var(--outline-variant)' }}>
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-bold text-sm w-7 text-center" style={{ color: 'var(--heading)' }}>{qty}</span>
                    <button onClick={() => setQty(plant.id, qty + 1)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer border"
                      style={{ background: 'var(--surface-container)', borderColor: 'var(--outline-variant)' }}>
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Companion/enemy */}
          {analysis.companions.length > 0 && (
            <Card className="!p-4">
              <div className="flex items-start gap-2.5">
                <Heart className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--primary)' }} />
                <div>
                  <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--heading)' }}>{L ? 'Bons compagnons' : 'Good companions'}</p>
                  <p className="text-[11px] opacity-60">{analysis.companions.join(' · ')}</p>
                  <p className="text-[10px] opacity-40 mt-1">{L ? "L'algo les placera côte à côte" : 'Algorithm places them nearby'}</p>
                </div>
              </div>
            </Card>
          )}
          {analysis.enemies.length > 0 && (
            <Card className="!p-4">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--tertiary)' }} />
                <div>
                  <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--heading)' }}>{L ? 'Plantes ennemies' : 'Enemy plants'}</p>
                  <p className="text-[11px] opacity-60">{analysis.enemies.join(' · ')}</p>
                  <p className="text-[10px] opacity-40 mt-1">{L ? "L'algo les éloignera" : 'Algorithm keeps them apart'}</p>
                </div>
              </div>
            </Card>
          )}

          {/* How it works */}
          <Card className="!p-4">
            <p className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: 'var(--heading)' }}>
              <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
              {L ? 'Comment ça marche' : 'How it works'}
            </p>
            <div className="space-y-1.5 text-[11px] opacity-50">
              <p>✓ {L ? 'Espacement optimal entre chaque plante' : 'Optimal spacing between each plant'}</p>
              <p>✓ {L ? 'Compagnons placés proches' : 'Companions placed nearby'}</p>
              <p>✓ {L ? 'Ennemis éloignés' : 'Enemies kept apart'}</p>
              <p>✓ {L ? 'Plantes existantes respectées' : 'Existing plants respected'}</p>
            </div>
          </Card>
        </div>

        {/* CTA */}
        <div className="fixed bottom-0 left-0 right-0 z-40">
          <div className="max-w-2xl mx-auto px-4" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
            <div className="rounded-t-2xl px-4 pt-3 pb-4 shadow-2xl border-t backdrop-blur-md space-y-2"
              style={{ background: 'var(--nav-bg)', borderColor: 'var(--outline-variant)', boxShadow: '0 -4px 30px var(--shadow-lg)' }}>
              <Button size="lg" className="w-full gap-2" onClick={executePlacement}>
                <Zap className="w-5 h-5" />
                {L ? `Planter ${cartTotal} légume${cartTotal > 1 ? 's' : ''} automatiquement` : `Auto-plant ${cartTotal} vegetable${cartTotal > 1 ? 's' : ''}`}
              </Button>
              <button onClick={() => setStep('select')}
                className="w-full py-2.5 text-sm font-medium cursor-pointer opacity-60 hover:opacity-100" style={{ color: 'var(--on-surface)' }}>
                {L ? '← Modifier ma sélection' : '← Edit selection'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     STEP 3: DONE
     ═══════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      <header className="sticky top-0 z-30 backdrop-blur-md border-b" style={{ background: 'var(--nav-bg)', borderColor: 'var(--outline-variant)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/garden/dashboard" style={{ color: 'var(--primary)' }}><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="font-bold text-base flex-1" style={{ color: 'var(--heading)' }}>{L ? 'Mon Potager' : 'My Garden'}</h1>
          <Link href="/garden/3d"><Button variant="ghost" size="sm" className="gap-1 text-xs"><Eye className="w-4 h-4" />3D</Button></Link>
        </div>
      </header>

      <div className="flex-1 px-4 py-4 max-w-2xl mx-auto w-full space-y-4 pb-36">
        {/* Success */}
        <Card>
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--accent-muted)' }}>
              <Sparkles className="w-6 h-6" style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: 'var(--heading)' }}>
                {placedCount > 0
                  ? (L ? `${placedCount} plante${placedCount > 1 ? 's' : ''} placée${placedCount > 1 ? 's' : ''} !` : `${placedCount} plant${placedCount > 1 ? 's' : ''} placed!`)
                  : (L ? 'Aucune plante placée' : 'No plants placed')}
              </p>
              {skippedCount > 0 && (
                <p className="text-xs mt-0.5" style={{ color: 'var(--tertiary)' }}>
                  {L ? `${skippedCount} non placée${skippedCount > 1 ? 's' : ''} (manque de place)` : `${skippedCount} skipped (not enough space)`}
                </p>
              )}
              <p className="text-[11px] opacity-50 mt-1">{L ? 'Espacements et compagnonnage optimisés' : 'Spacing and companions optimized'}</p>
            </div>
          </div>
        </Card>

        {/* Garden SVG */}
        <Card>
          <CardTitle className="text-sm mb-3">
            {L ? 'Plan du jardin' : 'Garden layout'} — {config.plantedItems.length} {L ? 'plantes' : 'plants'}
          </CardTitle>
          <GardenSVG items={config.plantedItems} widthM={config.width} lengthM={config.length} />
          <div className="flex flex-wrap gap-1.5 mt-3">
            {plantedGroups.map(({ plant, count }) => (
              <span key={plant.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                style={{ background: 'var(--badge-bg)', color: 'var(--badge-text)', border: '1px solid var(--badge-border)' }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: plant.color }} />
                {plant.name[locale]} ×{count}
              </span>
            ))}
          </div>
        </Card>

        {/* Validation */}
        {validation.length > 0 && (
          <Card>
            <CardTitle className="text-sm mb-2">{L ? 'Analyse' : 'Analysis'}</CardTitle>
            <div className="space-y-1.5">
              {validation.slice(0, 10).map((v, i) => (
                <div key={i} className="flex items-start gap-2 text-[11px]" style={{ color: v.type === 'error' ? 'var(--tertiary)' : v.type === 'warning' ? '#b8860b' : 'var(--primary)' }}>
                  {v.type === 'good' ? <Heart className="w-3 h-3 mt-0.5 shrink-0" /> : <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />}
                  <span>{v.message}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Bottom actions */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <div className="max-w-2xl mx-auto px-4" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          <div className="rounded-t-2xl px-4 pt-3 pb-4 shadow-2xl border-t backdrop-blur-md space-y-2"
            style={{ background: 'var(--nav-bg)', borderColor: 'var(--outline-variant)', boxShadow: '0 -4px 30px var(--shadow-lg)' }}>
            <Button size="lg" className="w-full gap-2" onClick={() => { setStep('select'); setPlacedCount(0); setSkippedCount(0); }}>
              <Plus className="w-5 h-5" />
              {L ? 'Ajouter des plantes' : 'Add more plants'}
            </Button>
            <div className="flex gap-2">
              <Link href="/garden/3d" className="flex-1">
                <Button variant="outline" size="sm" className="w-full gap-2">
                  <Eye className="w-4 h-4" /> {L ? 'Vue 3D' : '3D View'}
                </Button>
              </Link>
              <Button variant="ghost" size="sm" className="gap-1"
                onClick={() => { if (confirm(L ? 'Tout effacer ?' : 'Clear all?')) { clearGarden(); setStep('select'); } }}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
