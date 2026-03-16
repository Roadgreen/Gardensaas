'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlantCard } from '@/components/plants/plant-card';
import { usePlants } from '@/lib/hooks';
import { Search, Sprout, X, Grid3x3, List, Droplets, Sun, Clock, Leaf, ChevronDown, SlidersHorizontal } from 'lucide-react';
import type { Difficulty, Plant } from '@/types';
import { SproutMascot } from '@/components/sprout-mascot';
import Link from 'next/link';
import { getWateringLabel, isPlantableNow } from '@/lib/garden-utils';

type CategoryFilter = 'all' | 'vegetable' | 'herb' | 'fruit' | 'root' | 'ancient' | 'exotic';
type SeasonFilter = 'all' | 'spring' | 'summer' | 'autumn' | 'winter';
type ViewMode = 'grid' | 'list';
type SortOption = 'name' | 'difficulty' | 'harvest' | 'plantable';

const seasonMonths: Record<string, number[]> = {
  spring: [3, 4, 5],
  summer: [6, 7, 8],
  autumn: [9, 10, 11],
  winter: [12, 1, 2],
};

const categoryOptions: { value: CategoryFilter; label: string; emoji: string }[] = [
  { value: 'all', label: 'All', emoji: '\uD83C\uDF3F' },
  { value: 'vegetable', label: 'Vegetables', emoji: '\uD83E\uDD6C' },
  { value: 'herb', label: 'Herbs', emoji: '\uD83C\uDF3F' },
  { value: 'fruit', label: 'Fruits', emoji: '\uD83C\uDF53' },
  { value: 'root', label: 'Roots', emoji: '\uD83E\uDD55' },
  { value: 'ancient', label: 'Heritage', emoji: '\uD83C\uDFDB\uFE0F' },
  { value: 'exotic', label: 'Exotic', emoji: '\uD83C\uDF34' },
];

const seasonOptions: { value: SeasonFilter; label: string; emoji: string }[] = [
  { value: 'all', label: 'All', emoji: '\uD83D\uDD04' },
  { value: 'spring', label: 'Spring', emoji: '\uD83C\uDF38' },
  { value: 'summer', label: 'Summer', emoji: '\u2600\uFE0F' },
  { value: 'autumn', label: 'Autumn', emoji: '\uD83C\uDF42' },
  { value: 'winter', label: 'Winter', emoji: '\u2744\uFE0F' },
];

const difficultyOptions: { value: Difficulty | 'all'; label: string; emoji: string }[] = [
  { value: 'all', label: 'All', emoji: '\uD83C\uDFAF' },
  { value: 'easy', label: 'Easy', emoji: '\uD83D\uDE0A' },
  { value: 'medium', label: 'Medium', emoji: '\uD83D\uDCAA' },
  { value: 'hard', label: 'Hard', emoji: '\uD83D\uDD25' },
];

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'name', label: 'Name A-Z' },
  { value: 'difficulty', label: 'Easiest first' },
  { value: 'harvest', label: 'Fastest harvest' },
  { value: 'plantable', label: 'Plantable now' },
];

const difficultyLabels: Record<string, { label: string; class: string }> = {
  easy: { label: 'Easy', class: 'text-green-400' },
  medium: { label: 'Medium', class: 'text-yellow-400' },
  hard: { label: 'Hard', class: 'text-red-400' },
};

function PlantListItem({ plant, index }: { plant: Plant; index: number }) {
  const plantable = isPlantableNow(plant);
  const diff = difficultyLabels[plant.difficulty] || difficultyLabels.easy;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.02, 0.2) }}
    >
      <Link href={`/plants/${plant.id}`}>
        <div className="flex items-center gap-4 p-4 rounded-xl bg-[#142A1E] border border-green-900/40 hover:border-green-700/60 transition-all duration-200 group cursor-pointer hover:bg-[#1a3525]">
          {/* Color indicator */}
          <div
            className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
            style={{ backgroundColor: plant.color + '25', border: `2px solid ${plant.color}40` }}
          >
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: plant.color }} />
          </div>

          {/* Name and info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-green-50 font-medium truncate group-hover:text-green-300 transition-colors">
                {plant.name.en}
              </h3>
              {plantable && (
                <span className="flex-shrink-0 px-2 py-0.5 text-[10px] font-semibold bg-green-600/30 text-green-300 rounded-full border border-green-600/40 flex items-center gap-1">
                  <Leaf className="w-2.5 h-2.5" />
                  Now
                </span>
              )}
            </div>
            <p className="text-xs text-green-400/50 italic truncate">{plant.name.fr}</p>
          </div>

          {/* Stats - hidden on very small screens */}
          <div className="hidden sm:flex items-center gap-4 text-xs text-green-300/60 flex-shrink-0">
            <span className="flex items-center gap-1">
              <Droplets className="w-3 h-3" />
              {getWateringLabel(plant.wateringFrequency)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {plant.harvestDays}d
            </span>
            <span className={`font-medium ${diff.class}`}>{diff.label}</span>
          </div>

          {/* Category badge */}
          <span className="hidden md:inline-block text-[10px] px-2 py-1 rounded-lg bg-green-900/30 text-green-400/60 border border-green-900/30 capitalize flex-shrink-0">
            {plant.category}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

export default function PlantsPage() {
  const { plants, isLoading } = usePlants();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [season, setSeason] = useState<SeasonFilter>('all');
  const [difficulty, setDifficulty] = useState<Difficulty | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [showFilters, setShowFilters] = useState(true);

  const filtered = useMemo(() => {
    let result = plants.filter((plant) => {
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

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.en.localeCompare(b.name.en);
        case 'difficulty': {
          const order = { easy: 0, medium: 1, hard: 2 };
          return order[a.difficulty] - order[b.difficulty];
        }
        case 'harvest':
          return a.harvestDays - b.harvestDays;
        case 'plantable': {
          const aPlantable = isPlantableNow(a) ? 0 : 1;
          const bPlantable = isPlantableNow(b) ? 0 : 1;
          return aPlantable - bPlantable;
        }
        default:
          return 0;
      }
    });

    return result;
  }, [plants, search, category, season, difficulty, sortBy]);

  const activeFilters = [category !== 'all', season !== 'all', difficulty !== 'all'].filter(Boolean).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0D1F17] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Sprout className="w-8 h-8 text-green-600 dark:text-green-400" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0D1F17] py-6 sm:py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-green-50 mb-2 flex items-center gap-3">
            Plant Catalogue
          </h1>
          <p className="text-gray-500 dark:text-green-300/60 text-sm sm:text-base">Explore {plants.length} plants with detailed growing information.</p>
        </motion.div>

        {/* Search + Controls bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-4 sm:mb-6"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-green-600" />
              <input
                type="text"
                placeholder="Search plants by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl bg-gray-100 dark:bg-[#142A1E] border border-gray-200 dark:border-green-900/40 pl-12 pr-10 py-3 text-gray-900 dark:text-green-50 placeholder-gray-400 dark:placeholder-green-700 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30 text-base transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-green-600 hover:text-gray-600 dark:hover:text-green-400 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Controls row */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Sort dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="appearance-none rounded-xl bg-gray-100 dark:bg-[#142A1E] border border-gray-200 dark:border-green-900/40 px-4 py-3 pr-8 text-sm text-gray-700 dark:text-green-300 focus:border-green-500 focus:outline-none cursor-pointer"
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-green-600 pointer-events-none" />
              </div>

              {/* Filter toggle (mobile) */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`sm:hidden px-3 py-3 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-sm ${
                  showFilters || activeFilters > 0
                    ? 'bg-green-600/10 border-green-500/40 text-green-600 dark:text-green-400'
                    : 'bg-gray-100 dark:bg-[#142A1E] border-gray-200 dark:border-green-900/40 text-gray-600 dark:text-green-400/60'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                {activeFilters > 0 && (
                  <span className="w-5 h-5 rounded-full bg-green-600 text-white text-[10px] flex items-center justify-center font-bold">
                    {activeFilters}
                  </span>
                )}
              </button>

              {/* View mode toggle */}
              <div className="flex items-center rounded-xl border border-gray-200 dark:border-green-900/40 overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-3 transition-all cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 dark:bg-[#142A1E] text-gray-500 dark:text-green-400/60 hover:text-gray-700 dark:hover:text-green-300'
                  }`}
                  aria-label="Grid view"
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-3 transition-all cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 dark:bg-[#142A1E] text-gray-500 dark:text-green-400/60 hover:text-gray-700 dark:hover:text-green-300'
                  }`}
                  aria-label="List view"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filter sections */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mb-6 sm:mb-8 space-y-3 sm:space-y-4 overflow-hidden"
            >
              {/* Category filter */}
              <div>
                <label className="text-xs text-gray-400 dark:text-green-400/60 mb-2 block uppercase tracking-wider font-semibold">Category</label>
                <div className="flex flex-wrap gap-2">
                  {categoryOptions.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setCategory(c.value)}
                      className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer flex items-center gap-1.5 sm:gap-2 ${
                        category === c.value
                          ? 'bg-green-600 text-white shadow-lg shadow-green-600/20'
                          : 'bg-gray-100 dark:bg-[#142A1E] text-gray-600 dark:text-green-400/60 hover:text-gray-800 dark:hover:text-green-300 border border-gray-200 dark:border-green-900/40 hover:border-green-300 dark:hover:border-green-700/50'
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
                <label className="text-xs text-gray-400 dark:text-green-400/60 mb-2 block uppercase tracking-wider font-semibold">Planting Season</label>
                <div className="flex flex-wrap gap-2">
                  {seasonOptions.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setSeason(s.value)}
                      className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer flex items-center gap-1.5 sm:gap-2 ${
                        season === s.value
                          ? 'bg-green-600 text-white shadow-lg shadow-green-600/20'
                          : 'bg-gray-100 dark:bg-[#142A1E] text-gray-600 dark:text-green-400/60 hover:text-gray-800 dark:hover:text-green-300 border border-gray-200 dark:border-green-900/40 hover:border-green-300 dark:hover:border-green-700/50'
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
                <label className="text-xs text-gray-400 dark:text-green-400/60 mb-2 block uppercase tracking-wider font-semibold">Difficulty</label>
                <div className="flex flex-wrap gap-2">
                  {difficultyOptions.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => setDifficulty(d.value)}
                      className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer flex items-center gap-1.5 sm:gap-2 ${
                        difficulty === d.value
                          ? 'bg-green-600 text-white shadow-lg shadow-green-600/20'
                          : 'bg-gray-100 dark:bg-[#142A1E] text-gray-600 dark:text-green-400/60 hover:text-gray-800 dark:hover:text-green-300 border border-gray-200 dark:border-green-900/40 hover:border-green-300 dark:hover:border-green-700/50'
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
                  className="text-sm text-green-600 dark:text-green-500/60 hover:text-green-700 dark:hover:text-green-400 transition-colors cursor-pointer underline underline-offset-2"
                >
                  Clear filters ({activeFilters})
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-400 dark:text-green-400/50">
            {filtered.length} plant{filtered.length > 1 ? 's' : ''} found
          </p>
          {/* Desktop filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="hidden sm:flex items-center gap-1.5 text-sm text-gray-500 dark:text-green-400/60 hover:text-green-600 dark:hover:text-green-400 transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {showFilters ? 'Hide filters' : 'Show filters'}
          </button>
        </div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {viewMode === 'grid' ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
            >
              {filtered.map((plant, i) => (
                <PlantCard key={plant.id} plant={plant} index={i} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-2"
            >
              {filtered.map((plant, i) => (
                <PlantListItem key={plant.id} plant={plant} index={i} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <span className="text-4xl block mb-4">{'\uD83D\uDE14'}</span>
            <p className="text-gray-400 dark:text-green-500/50 text-lg mb-2">No plants match your filters.</p>
            <button
              onClick={() => { setCategory('all'); setSeason('all'); setDifficulty('all'); setSearch(''); }}
              className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 underline text-sm cursor-pointer"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>
      <SproutMascot page="plants" />
    </div>
  );
}
