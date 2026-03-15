'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardTitle, CardContent } from '@/components/ui/card';
import { useGarden } from '@/lib/hooks';
import { getPlantById } from '@/lib/garden-utils';
import {
  Sprout,
  Calendar,
  ArrowLeft,
  Plus,
  ChevronRight,
  ChevronDown,
  History,
  Leaf,
  MapPin,
  LayoutDashboard,
  Map,
  Eye,
  Bot,
  Lightbulb,
  BookOpen,
  CreditCard,
  Settings,
  Clock,
  Check,
  AlertCircle,
  Minus,
  Copy,
} from 'lucide-react';

// Types for season data
interface SeasonPlant {
  id: string;
  plantId: string;
  x: number;
  z: number;
  plantedDate: string | null;
  harvestedDate: string | null;
  yield: number | null;
  notes: string | null;
  health: string | null;
}

interface PlotHistoryItem {
  id: string;
  plotName: string;
  plantId: string;
  plantName: string;
  x: number;
  z: number;
  plantedDate: string | null;
  harvestedDate: string | null;
  yield: number | null;
  notes: string | null;
  health: string | null;
  success: boolean;
}

interface Season {
  id: string;
  gardenId: string;
  year: number;
  notes: string | null;
  createdAt: string;
  plants: SeasonPlant[];
  plotHistory: PlotHistoryItem[];
}

const sidebarLinks = [
  { href: '/garden/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/garden/planner', label: 'Garden Planner', icon: Map },
  { href: '/garden/3d', label: '3D View', icon: Eye },
  { href: '/garden/history', label: 'Garden History', icon: History },
  { href: '/garden/advisor', label: 'AI Advisor', icon: Bot, pro: true },
  { href: '/garden/tips', label: 'Garden Tips', icon: Lightbulb },
  { href: '/plants', label: 'Plant Encyclopedia', icon: BookOpen },
  { href: '/garden/settings', label: 'Billing & Settings', icon: CreditCard },
  { href: '/garden/setup', label: 'Garden Setup', icon: Settings },
];

function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:block w-64 shrink-0">
      <div className="sticky top-24 space-y-1">
        <div className="px-3 py-2 mb-4">
          <h2 className="text-xs font-semibold text-green-500/50 uppercase tracking-wider">Navigation</h2>
        </div>
        {sidebarLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-green-900/40 text-green-300 border border-green-800/30'
                  : 'text-green-400/60 hover:text-green-300 hover:bg-green-900/20'
              }`}
            >
              <link.icon className="w-4.5 h-4.5" />
              <span className="flex-1">{link.label}</span>
              {link.pro && (
                <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-semibold rounded">
                  PRO
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}

function HealthBadge({ health }: { health: string | null }) {
  if (!health) return null;
  const config: Record<string, { bg: string; text: string }> = {
    good: { bg: 'bg-green-500/20', text: 'text-green-400' },
    average: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
    poor: { bg: 'bg-red-500/20', text: 'text-red-400' },
  };
  const style = config[health] || config.average;
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${style.bg} ${style.text} capitalize`}>
      {health}
    </span>
  );
}

function SeasonCard({
  season,
  isExpanded,
  onToggle,
}: {
  season: Season;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  // Combine plants and plotHistory for display
  const allPlants = [
    ...season.plotHistory.map((ph) => ({
      id: ph.id,
      plantId: ph.plantId,
      label: ph.plotName,
      x: ph.x,
      z: ph.z,
      plantedDate: ph.plantedDate,
      harvestedDate: ph.harvestedDate,
      yieldKg: ph.yield,
      notes: ph.notes,
      health: ph.health,
      success: ph.success,
      source: 'plotHistory' as const,
    })),
    ...season.plants.map((sp) => ({
      id: sp.id,
      plantId: sp.plantId,
      label: null,
      x: sp.x,
      z: sp.z,
      plantedDate: sp.plantedDate,
      harvestedDate: sp.harvestedDate,
      yieldKg: sp.yield,
      notes: sp.notes,
      health: sp.health,
      success: true,
      source: 'seasonPlant' as const,
    })),
  ];

  const uniquePlantIds = new Set(allPlants.map((p) => p.plantId));
  const totalYield = allPlants.reduce((sum, p) => sum + (p.yieldKg || 0), 0);
  const successCount = allPlants.filter((p) => p.success).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      {/* Timeline dot */}
      <div className="absolute left-0 top-6 w-4 h-4 rounded-full bg-green-600 border-2 border-green-400 z-10 -ml-2" />

      <div className="ml-6">
        <Card className="overflow-hidden">
          <button
            onClick={onToggle}
            className="w-full text-left cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-600/20 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-green-50">{season.year}</h3>
                  <p className="text-sm text-green-500/60">
                    {uniquePlantIds.size} varieties planted
                    {totalYield > 0 && ` | ${totalYield.toFixed(1)} kg harvested`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {allPlants.length > 0 && (
                  <div className="hidden sm:flex items-center gap-1.5">
                    {successCount === allPlants.length ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-yellow-400" />
                    )}
                    <span className="text-xs text-green-500/50">
                      {successCount}/{allPlants.length} successful
                    </span>
                  </div>
                )}
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-5 h-5 text-green-500/50" />
                </motion.div>
              </div>
            </div>
          </button>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-4 border-t border-green-900/30">
                  {season.notes && (
                    <p className="text-sm text-green-300/70 mb-4 italic">
                      &quot;{season.notes}&quot;
                    </p>
                  )}

                  {allPlants.length === 0 ? (
                    <div className="text-center py-6">
                      <Leaf className="w-8 h-8 text-green-700 mx-auto mb-2" />
                      <p className="text-green-500/50 text-sm">No plants recorded for this season.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {allPlants.map((plant) => {
                        const plantData = getPlantById(plant.plantId);
                        const displayName = plantData?.name.en || plant.plantId;
                        return (
                          <div
                            key={plant.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-[#0D1F17] border border-green-900/30"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className="w-8 h-8 rounded-lg flex-shrink-0"
                                style={{
                                  backgroundColor: (plantData?.color || '#22C55E') + '30',
                                  border: `2px solid ${(plantData?.color || '#22C55E')}50`,
                                }}
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-green-50 font-medium text-sm truncate">
                                    {displayName}
                                  </span>
                                  <HealthBadge health={plant.health} />
                                  {!plant.success && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/20 text-red-400">
                                      Failed
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-green-500/50">
                                  {plant.label && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      {plant.label}
                                    </span>
                                  )}
                                  {plant.plantedDate && (
                                    <span>
                                      Planted {new Date(plant.plantedDate).toLocaleDateString()}
                                    </span>
                                  )}
                                  {plant.yieldKg != null && plant.yieldKg > 0 && (
                                    <span>{plant.yieldKg} kg</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {plant.notes && (
                              <span className="text-xs text-green-500/40 max-w-[120px] truncate hidden sm:block">
                                {plant.notes}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>
    </motion.div>
  );
}

function NewSeasonModal({
  isOpen,
  onClose,
  onSubmit,
  currentYear,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (year: number, notes: string, snapshot: boolean) => void;
  currentYear: number;
}) {
  const [year, setYear] = useState(currentYear);
  const [notes, setNotes] = useState('');
  const [snapshot, setSnapshot] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#142A1E] border border-green-900/40 rounded-2xl p-6 w-full max-w-md mx-4"
      >
        <h2 className="text-xl font-bold text-green-50 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-green-400" />
          Start New Season
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-green-300 mb-1.5">Year</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value, 10))}
              className="w-full px-4 py-2.5 rounded-xl bg-[#0D1F17] border border-green-900/40 text-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-green-300 mb-1.5">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Focused on tomatoes this year, tried new composting method..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl bg-[#0D1F17] border border-green-900/40 text-green-50 placeholder:text-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            />
          </div>

          <label className="flex items-start gap-3 p-3 rounded-xl bg-[#0D1F17] border border-green-900/30 cursor-pointer">
            <input
              type="checkbox"
              checked={snapshot}
              onChange={(e) => setSnapshot(e.target.checked)}
              className="mt-0.5 accent-green-500"
            />
            <div>
              <span className="text-sm font-medium text-green-200 flex items-center gap-1.5">
                <Copy className="w-3.5 h-3.5 text-green-400" />
                Snapshot current garden
              </span>
              <p className="text-xs text-green-500/50 mt-0.5">
                Save current planted crops as this season&apos;s history for future crop rotation reference.
              </p>
            </div>
          </label>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSubmit(year, notes, snapshot);
              onClose();
            }}
            className="flex-1 gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Season
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export function HistoryPageClient() {
  const { data: session } = useSession();
  const { config, isLoaded } = useGarden();
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedYear, setExpandedYear] = useState<number | null>(null);
  const [showNewSeason, setShowNewSeason] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // For demo purposes, use a mock gardenId
  // In production this would come from the user's actual garden
  const gardenId = 'demo-garden';

  const fetchSeasons = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/garden/history?gardenId=${gardenId}`);
      if (res.ok) {
        const data = await res.json();
        setSeasons(data.seasons || []);
      }
    } catch (err) {
      console.error('Failed to fetch seasons:', err);
    } finally {
      setLoading(false);
    }
  }, [gardenId]);

  useEffect(() => {
    fetchSeasons();
  }, [fetchSeasons]);

  const handleCreateSeason = async (year: number, notes: string, snapshot: boolean) => {
    try {
      setError(null);
      const res = await fetch('/api/garden/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gardenId,
          year,
          notes: notes || undefined,
          snapshotCurrentGarden: snapshot,
        }),
      });

      if (res.ok) {
        await fetchSeasons();
        setExpandedYear(year);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create season');
      }
    } catch (err) {
      setError('Failed to create season');
      console.error(err);
    }
  };

  // Generate demo seasons when no data exists
  const displaySeasons: Season[] = seasons.length > 0 ? seasons : getDemoSeasons();

  const currentYear = new Date().getFullYear();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#0D1F17] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Sprout className="w-8 h-8 text-green-400" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D1F17] py-8 px-6">
      <div className="max-w-7xl mx-auto flex gap-8">
        <Sidebar />

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Link href="/garden/dashboard">
                  <Button variant="ghost" size="sm" className="gap-1 -ml-2">
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                </Link>
                <h1 className="text-3xl font-bold text-green-50 flex items-center gap-3">
                  <History className="w-8 h-8 text-green-400" />
                  Garden History
                </h1>
              </div>
              <p className="text-green-300/60 ml-10">
                Track what you planted where, year over year. Essential for crop rotation planning.
              </p>
            </div>
            <Button
              onClick={() => setShowNewSeason(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              New Season
            </Button>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-red-900/20 border border-red-800/30 text-red-300 text-sm flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
              <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300 cursor-pointer">
                <Minus className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* Stats row */}
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
              className="p-5 rounded-xl bg-gradient-to-br from-green-900/40 to-green-900/10 border border-green-800/30"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-600/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-50">{displaySeasons.length}</p>
                  <p className="text-xs text-green-500/50">Seasons Recorded</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-5 rounded-xl bg-gradient-to-br from-cyan-900/30 to-cyan-900/10 border border-cyan-800/20"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-600/20 flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-50">
                    {new Set(
                      displaySeasons.flatMap((s) => [
                        ...s.plants.map((p) => p.plantId),
                        ...s.plotHistory.map((p) => p.plantId),
                      ])
                    ).size}
                  </p>
                  <p className="text-xs text-green-500/50">Unique Varieties Grown</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-5 rounded-xl bg-gradient-to-br from-yellow-900/30 to-yellow-900/10 border border-yellow-800/20"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-600/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-50">
                    {displaySeasons.length > 0
                      ? `${displaySeasons[displaySeasons.length - 1]?.year} - ${displaySeasons[0]?.year}`
                      : '-'}
                  </p>
                  <p className="text-xs text-green-500/50">Year Range</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Crop rotation tip */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="bg-gradient-to-r from-green-900/40 to-emerald-900/20 border-green-800/30">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-green-300 mb-1">Crop Rotation Tip</h3>
                  <p className="text-green-100 text-sm">
                    Avoid planting the same family of crops in the same spot two years in a row.
                    Use your history to plan rotations: leafy greens {'->'} legumes {'->'} fruiting crops {'->'} root vegetables.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Timeline */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Sprout className="w-8 h-8 text-green-400" />
              </motion.div>
            </div>
          ) : displaySeasons.length === 0 ? (
            <Card className="text-center py-12">
              <History className="w-12 h-12 text-green-700 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-green-200 mb-2">No seasons recorded yet</h3>
              <p className="text-green-500/50 mb-4 max-w-md mx-auto">
                Start tracking your garden history to see what grew well and plan better crop rotations.
              </p>
              <Button onClick={() => setShowNewSeason(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Start Your First Season
              </Button>
            </Card>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-0 top-0 bottom-0 w-px bg-green-800/40" />

              <div className="space-y-6">
                {displaySeasons.map((season) => (
                  <SeasonCard
                    key={season.id || season.year}
                    season={season}
                    isExpanded={expandedYear === season.year}
                    onToggle={() =>
                      setExpandedYear(expandedYear === season.year ? null : season.year)
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {/* Bottom CTA */}
          <div className="mt-8">
            <Card className="text-center">
              <CardContent>
                <p className="text-green-300/60 text-sm mb-3">
                  Keep recording your garden history every season for better crop rotation insights.
                </p>
                <div className="flex justify-center gap-3">
                  <Link href="/garden/planner">
                    <Button variant="secondary" size="sm" className="gap-1">
                      <Map className="w-4 h-4" />
                      Garden Planner
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                  <Link href="/garden/tips">
                    <Button variant="secondary" size="sm" className="gap-1">
                      <Lightbulb className="w-4 h-4" />
                      Rotation Tips
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <NewSeasonModal
        isOpen={showNewSeason}
        onClose={() => setShowNewSeason(false)}
        onSubmit={handleCreateSeason}
        currentYear={currentYear}
      />
    </div>
  );
}

// Demo data for display when no seasons exist in the database
function getDemoSeasons(): Season[] {
  return [
    {
      id: 'demo-2025',
      gardenId: 'demo',
      year: 2025,
      notes: 'Great year for tomatoes. Tried companion planting basil with tomatoes.',
      createdAt: '2025-03-01T00:00:00Z',
      plants: [],
      plotHistory: [
        {
          id: 'ph-1',
          plotName: 'Bed A',
          plantId: 'tomato',
          plantName: 'Tomato',
          x: 1,
          z: 1,
          plantedDate: '2025-04-15T00:00:00Z',
          harvestedDate: '2025-08-20T00:00:00Z',
          yield: 12.5,
          notes: 'Cherry tomatoes, very productive',
          health: 'good',
          success: true,
        },
        {
          id: 'ph-2',
          plotName: 'Bed A',
          plantId: 'basil',
          plantName: 'Basil',
          x: 1.5,
          z: 1,
          plantedDate: '2025-04-15T00:00:00Z',
          harvestedDate: '2025-09-01T00:00:00Z',
          yield: 0.8,
          notes: 'Great companion for tomatoes',
          health: 'good',
          success: true,
        },
        {
          id: 'ph-3',
          plotName: 'Bed B',
          plantId: 'carrot',
          plantName: 'Carrot',
          x: 2,
          z: 2,
          plantedDate: '2025-03-20T00:00:00Z',
          harvestedDate: '2025-07-10T00:00:00Z',
          yield: 5.2,
          notes: null,
          health: 'good',
          success: true,
        },
        {
          id: 'ph-4',
          plotName: 'Bed C',
          plantId: 'lettuce',
          plantName: 'Lettuce',
          x: 3,
          z: 1,
          plantedDate: '2025-03-15T00:00:00Z',
          harvestedDate: '2025-06-01T00:00:00Z',
          yield: 3.0,
          notes: 'Bolted early in heat wave',
          health: 'average',
          success: true,
        },
      ],
    },
    {
      id: 'demo-2024',
      gardenId: 'demo',
      year: 2024,
      notes: 'First year of the garden. Learning experience!',
      createdAt: '2024-03-01T00:00:00Z',
      plants: [],
      plotHistory: [
        {
          id: 'ph-5',
          plotName: 'Bed A',
          plantId: 'lettuce',
          plantName: 'Lettuce',
          x: 1,
          z: 1,
          plantedDate: '2024-04-01T00:00:00Z',
          harvestedDate: '2024-06-15T00:00:00Z',
          yield: 2.0,
          notes: 'Good first crop',
          health: 'good',
          success: true,
        },
        {
          id: 'ph-6',
          plotName: 'Bed B',
          plantId: 'tomato',
          plantName: 'Tomato',
          x: 2,
          z: 2,
          plantedDate: '2024-05-01T00:00:00Z',
          harvestedDate: '2024-08-30T00:00:00Z',
          yield: 8.0,
          notes: 'Blight issues late season',
          health: 'average',
          success: true,
        },
        {
          id: 'ph-7',
          plotName: 'Bed C',
          plantId: 'pepper',
          plantName: 'Pepper',
          x: 3,
          z: 1,
          plantedDate: '2024-05-15T00:00:00Z',
          harvestedDate: null,
          yield: null,
          notes: 'Frost killed before harvest',
          health: 'poor',
          success: false,
        },
      ],
    },
  ];
}
