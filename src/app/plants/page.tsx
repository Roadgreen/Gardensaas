'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PlantCard } from '@/components/plants/plant-card';
import { usePlants } from '@/lib/hooks';
import { Search, Sprout, X } from 'lucide-react';
import type { Difficulty } from '@/types';
import { SproutMascot } from '@/components/sprout-mascot';

type CategoryFilter = 'all' | 'vegetable' | 'herb' | 'fruit' | 'root' | 'ancient' | 'exotic';
type SeasonFilter = 'all' | 'spring' | 'summer' | 'autumn' | 'winter';

const seasonMonths: Record<string, number[]> = {
  spring: [3, 4, 5],
  summer: [6, 7, 8],
  autumn: [9, 10, 11],
  winter: [12, 1, 2],
};

const categoryOptions: { value: CategoryFilter; label: string; emoji: string }[] = [
  { value: 'all', label: 'Toutes', emoji: '\uD83C\uDF3F' },
  { value: 'vegetable', label: 'Legumes', emoji: '\uD83E\uDD6C' },
  { value: 'herb', label: 'Herbes', emoji: '\uD83C\uDF3F' },
  { value: 'fruit', label: 'Fruits', emoji: '\uD83C\uDF53' },
  { value: 'root', label: 'Racines', emoji: '\uD83E\uDD55' },
  { value: 'ancient', label: 'Anciennes', emoji: '\uD83C\uDFDB\uFE0F' },
  { value: 'exotic', label: 'Exotiques', emoji: '\uD83C\uDF34' },
];

const seasonOptions: { value: SeasonFilter; label: string; emoji: string }[] = [
  { value: 'all', label: 'Toutes', emoji: '\uD83D\uDD04' },
  { value: 'spring', label: 'Printemps', emoji: '\uD83C\uDF38' },
  { value: 'summer', label: 'Ete', emoji: '\u2600\uFE0F' },
  { value: 'autumn', label: 'Automne', emoji: '\uD83C\uDF42' },
  { value: 'winter', label: 'Hiver', emoji: '\u2744\uFE0F' },
];

const difficultyOptions: { value: Difficulty | 'all'; label: string; emoji: string }[] = [
  { value: 'all', label: 'Toutes', emoji: '\uD83C\uDFAF' },
  { value: 'easy', label: 'Facile', emoji: '\uD83D\uDE0A' },
  { value: 'medium', label: 'Moyen', emoji: '\uD83D\uDCAA' },
  { value: 'hard', label: 'Difficile', emoji: '\uD83D\uDD25' },
];

export default function PlantsPage() {
  const { plants, isLoading } = usePlants();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [season, setSeason] = useState<SeasonFilter>('all');
  const [difficulty, setDifficulty] = useState<Difficulty | 'all'>('all');

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

  const activeFilters = [category !== 'all', season !== 'all', difficulty !== 'all'].filter(Boolean).length;

  if (isLoading) {
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
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-green-50 mb-2 flex items-center gap-3">
            {'\uD83C\uDF3F'} Catalogue des plantes
          </h1>
          <p className="text-green-300/60">Decouvrez {plants.length} plantes avec des informations de culture detaillees.</p>
        </motion.div>

        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-600" />
            <input
              type="text"
              placeholder="Rechercher une plante (nom francais ou anglais)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl bg-[#142A1E] border border-green-900/40 pl-12 pr-10 py-3.5 text-green-50 placeholder-green-700 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30 text-base transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-green-600 hover:text-green-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>

        {/* Filter sections - always visible */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-8 space-y-4"
        >
          {/* Category filter */}
          <div>
            <label className="text-xs text-green-400/60 mb-2 block uppercase tracking-wider font-semibold">Categorie</label>
            <div className="flex flex-wrap gap-2">
              {categoryOptions.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer flex items-center gap-2 ${
                    category === c.value
                      ? 'bg-green-600 text-white shadow-lg shadow-green-600/20'
                      : 'bg-[#142A1E] text-green-400/60 hover:text-green-300 border border-green-900/40 hover:border-green-700/50'
                  }`}
                >
                  <span>{c.emoji}</span>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Season filter */}
          <div>
            <label className="text-xs text-green-400/60 mb-2 block uppercase tracking-wider font-semibold">Saison de semis</label>
            <div className="flex flex-wrap gap-2">
              {seasonOptions.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSeason(s.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer flex items-center gap-2 ${
                    season === s.value
                      ? 'bg-green-600 text-white shadow-lg shadow-green-600/20'
                      : 'bg-[#142A1E] text-green-400/60 hover:text-green-300 border border-green-900/40 hover:border-green-700/50'
                  }`}
                >
                  <span>{s.emoji}</span>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty filter */}
          <div>
            <label className="text-xs text-green-400/60 mb-2 block uppercase tracking-wider font-semibold">Difficulte</label>
            <div className="flex flex-wrap gap-2">
              {difficultyOptions.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDifficulty(d.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer flex items-center gap-2 ${
                    difficulty === d.value
                      ? 'bg-green-600 text-white shadow-lg shadow-green-600/20'
                      : 'bg-[#142A1E] text-green-400/60 hover:text-green-300 border border-green-900/40 hover:border-green-700/50'
                  }`}
                >
                  <span>{d.emoji}</span>
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Clear filters */}
          {activeFilters > 0 && (
            <button
              onClick={() => { setCategory('all'); setSeason('all'); setDifficulty('all'); setSearch(''); }}
              className="text-sm text-green-500/60 hover:text-green-400 transition-colors cursor-pointer underline underline-offset-2"
            >
              Effacer les filtres ({activeFilters})
            </button>
          )}
        </motion.div>

        {/* Results */}
        <p className="text-sm text-green-400/50 mb-4">
          {filtered.length} plante{filtered.length > 1 ? 's' : ''} trouvee{filtered.length > 1 ? 's' : ''}
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((plant, i) => (
            <PlantCard key={plant.id} plant={plant} index={i} />
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <span className="text-4xl block mb-4">{'\uD83D\uDE14'}</span>
            <p className="text-green-500/50 text-lg mb-2">Aucune plante ne correspond a vos filtres.</p>
            <button
              onClick={() => { setCategory('all'); setSeason('all'); setDifficulty('all'); setSearch(''); }}
              className="text-green-400 hover:text-green-300 underline text-sm cursor-pointer"
            >
              Reinitialiser les filtres
            </button>
          </div>
        )}
      </div>
      <SproutMascot page="plants" />
    </div>
  );
}
