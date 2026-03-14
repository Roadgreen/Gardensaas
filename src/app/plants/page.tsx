'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PlantCard } from '@/components/plants/plant-card';
import { usePlants } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { Search, Filter } from 'lucide-react';
import type { Difficulty } from '@/types';

type CategoryFilter = 'all' | 'vegetable' | 'herb' | 'fruit' | 'root' | 'ancient' | 'exotic';
type SeasonFilter = 'all' | 'spring' | 'summer' | 'autumn' | 'winter';

const seasonMonths: Record<string, number[]> = {
  spring: [3, 4, 5],
  summer: [6, 7, 8],
  autumn: [9, 10, 11],
  winter: [12, 1, 2],
};

export default function PlantsPage() {
  const { plants, isLoading } = usePlants();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [season, setSeason] = useState<SeasonFilter>('all');
  const [difficulty, setDifficulty] = useState<Difficulty | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return plants.filter((plant) => {
      if (search) {
        const q = search.toLowerCase();
        const matchName = plant.name.en.toLowerCase().includes(q) || plant.name.fr.toLowerCase().includes(q);
        if (!matchName) return false;
      }
      if (category !== 'all' && plant.category !== category) return false;
      if (difficulty !== 'all' && plant.difficulty !== difficulty) return false;
      if (season !== 'all') {
        const months = seasonMonths[season];
        if (!plant.plantingMonths.some((m) => months.includes(m))) return false;
      }
      return true;
    });
  }, [plants, search, category, season, difficulty]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0D1F17] flex items-center justify-center">
        <div className="animate-pulse text-green-400">Loading plants...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D1F17] py-8 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-green-50 mb-2">Plant Catalog</h1>
          <p className="text-green-300/60">Discover {plants.length} plants with detailed growing information.</p>
        </motion.div>

        {/* Search + filters */}
        <div className="mb-8 space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-600" />
              <input
                type="text"
                placeholder="Search plants..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl bg-[#142A1E] border border-green-900/40 pl-10 pr-4 py-2.5 text-green-50 placeholder-green-700 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
            <Button
              variant="secondary"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-4 p-4 rounded-xl bg-[#142A1E] border border-green-900/40"
            >
              <div>
                <label className="text-xs text-green-400/60 mb-1 block">Category</label>
                <div className="flex gap-1">
                  {(['all', 'vegetable', 'herb', 'fruit', 'root', 'ancient', 'exotic'] as const).map((c) => (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        category === c
                          ? 'bg-green-600 text-white'
                          : 'bg-[#0D1F17] text-green-400/60 hover:text-green-300'
                      }`}
                    >
                      {c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-green-400/60 mb-1 block">Season</label>
                <div className="flex gap-1">
                  {(['all', 'spring', 'summer', 'autumn', 'winter'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSeason(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        season === s
                          ? 'bg-green-600 text-white'
                          : 'bg-[#0D1F17] text-green-400/60 hover:text-green-300'
                      }`}
                    >
                      {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-green-400/60 mb-1 block">Difficulty</label>
                <div className="flex gap-1">
                  {(['all', 'easy', 'medium', 'hard'] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        difficulty === d
                          ? 'bg-green-600 text-white'
                          : 'bg-[#0D1F17] text-green-400/60 hover:text-green-300'
                      }`}
                    >
                      {d === 'all' ? 'All' : d.charAt(0).toUpperCase() + d.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Results */}
        <p className="text-sm text-green-400/50 mb-4">{filtered.length} plants found</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((plant, i) => (
            <PlantCard key={plant.id} plant={plant} index={i} />
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-green-500/50 text-lg">No plants match your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
