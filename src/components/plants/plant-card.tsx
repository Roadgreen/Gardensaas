'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Droplets, Sun, Clock, Leaf } from 'lucide-react';
import type { Plant } from '@/types';
import { getWateringLabel, getDifficultyColor, isPlantableNow } from '@/lib/garden-utils';

interface PlantCardProps {
  plant: Plant;
  index?: number;
}

function getSeasonBadges(months: number[]): string[] {
  const seasons: string[] = [];
  if (months.some(m => [3,4,5].includes(m))) seasons.push('Spring');
  if (months.some(m => [6,7,8].includes(m))) seasons.push('Summer');
  if (months.some(m => [9,10,11].includes(m))) seasons.push('Autumn');
  if (months.some(m => [12,1,2].includes(m))) seasons.push('Winter');
  return seasons;
}

const seasonColors: Record<string, string> = {
  Spring: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  Summer: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  Autumn: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
  Winter: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
};

const difficultyLabels: Record<string, { label: string; class: string }> = {
  easy: { label: 'Easy', class: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' },
  medium: { label: 'Medium', class: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400' },
  hard: { label: 'Hard', class: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' },
};

export function PlantCard({ plant, index = 0 }: PlantCardProps) {
  const plantable = isPlantableNow(plant);
  const seasons = getSeasonBadges(plant.plantingMonths);
  const diff = difficultyLabels[plant.difficulty] || difficultyLabels.easy;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.03, 0.3) }}
    >
      <Link href={`/plants/${plant.id}`}>
        <Card hover className="relative overflow-hidden group cursor-pointer h-full">
          {/* Color accent bar */}
          <div
            className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl"
            style={{ backgroundColor: plant.color }}
          />

          {/* Plantable badge */}
          {plantable && (
            <div className="absolute top-4 right-4">
              <span className="px-2.5 py-1 text-xs font-semibold bg-green-100 dark:bg-green-600/30 text-green-700 dark:text-green-300 rounded-full border border-green-200 dark:border-green-600/40 flex items-center gap-1">
                <Leaf className="w-3 h-3" />
                Plant now
              </span>
            </div>
          )}

          {/* Plant color circle + name */}
          <div className="flex items-start gap-4 mb-4 mt-1">
            <div
              className="w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
              style={{ backgroundColor: plant.color + '20', border: `2px solid ${plant.color}30` }}
            >
              <div
                className="w-7 h-7 rounded-full shadow-sm"
                style={{ backgroundColor: plant.color }}
              />
            </div>
            <div className="min-w-0 pt-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-green-50 group-hover:text-green-600 dark:group-hover:text-green-300 transition-colors truncate">
                {plant.name.en}
              </h3>
              <p className="text-sm text-gray-400 dark:text-green-400/60 italic">{plant.name.fr}</p>
            </div>
          </div>

          <p className="text-sm text-gray-500 dark:text-green-200/60 mb-4 line-clamp-2 leading-relaxed">
            {plant.description.en}
          </p>

          {/* Season badges */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {seasons.map(s => (
              <span key={s} className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${seasonColors[s]}`}>
                {s}
              </span>
            ))}
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${diff.class}`}>
              {diff.label}
            </span>
          </div>

          {/* Plant info row */}
          <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-green-300/70 pt-3 border-t border-gray-100 dark:border-green-900/30">
            <span className="flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5" />
              {getWateringLabel(plant.wateringFrequency)}
            </span>
            <span className="flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5" />
              {plant.sunExposure[0] === 'full-sun' ? 'Full sun' : plant.sunExposure[0] === 'partial-shade' ? 'Partial' : 'Shade'}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {plant.harvestDays}d
            </span>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
