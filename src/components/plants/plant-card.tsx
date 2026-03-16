'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Droplets, Sun, Clock, Leaf } from 'lucide-react';
import type { Plant } from '@/types';
import { getWateringLabel, isPlantableNow } from '@/lib/garden-utils';

interface PlantCardProps {
  plant: Plant;
  index?: number;
}

function getSeasonBadges(months: number[]): { name: string; emoji: string }[] {
  const seasons: { name: string; emoji: string }[] = [];
  if (months.some(m => [3,4,5].includes(m))) seasons.push({ name: 'Printemps', emoji: '\uD83C\uDF38' });
  if (months.some(m => [6,7,8].includes(m))) seasons.push({ name: 'Ete', emoji: '\u2600\uFE0F' });
  if (months.some(m => [9,10,11].includes(m))) seasons.push({ name: 'Automne', emoji: '\uD83C\uDF42' });
  if (months.some(m => [12,1,2].includes(m))) seasons.push({ name: 'Hiver', emoji: '\u2744\uFE0F' });
  return seasons;
}

const seasonColors: Record<string, string> = {
  Printemps: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  Ete: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  Automne: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
  Hiver: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
};

const difficultyLabels: Record<string, { label: string; emoji: string; class: string }> = {
  easy: { label: 'Facile', emoji: '\uD83D\uDE0A', class: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' },
  medium: { label: 'Moyen', emoji: '\uD83D\uDCAA', class: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400' },
  hard: { label: 'Difficile', emoji: '\uD83D\uDD25', class: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' },
};

const plantEmojis: Record<string, string> = {
  tomato: '\uD83C\uDF45', carrot: '\uD83E\uDD55', pepper: '\uD83C\uDF36\uFE0F', corn: '\uD83C\uDF3D',
  lettuce: '\uD83E\uDD6C', strawberry: '\uD83C\uDF53', potato: '\uD83E\uDD54', onion: '\uD83E\uDDC5',
  garlic: '\uD83E\uDDC4', broccoli: '\uD83E\uDD66', eggplant: '\uD83C\uDF46', cucumber: '\uD83E\uDD52',
  melon: '\uD83C\uDF48', lemon: '\uD83C\uDF4B', cherry: '\uD83C\uDF52', grape: '\uD83C\uDF47',
  peach: '\uD83C\uDF51', pear: '\uD83C\uDF50', apple: '\uD83C\uDF4E', banana: '\uD83C\uDF4C',
  peanut: '\uD83E\uDD5C', chestnut: '\uD83C\uDF30', mushroom: '\uD83C\uDF44', avocado: '\uD83E\uDD51',
  coconut: '\uD83E\uDD65', mango: '\uD83E\uDD6D', pineapple: '\uD83C\uDF4D', watermelon: '\uD83C\uDF49',
  kiwi: '\uD83E\uDD5D', blueberry: '\uD83E\uDED0', olive: '\uD83E\uDED2', bean: '\uD83E\uDED8',
  pea: '\uD83E\uDED1', herb: '\uD83C\uDF3F', basil: '\uD83C\uDF3F', mint: '\uD83C\uDF3F',
  thyme: '\uD83C\uDF3F', rosemary: '\uD83C\uDF3F', parsley: '\uD83C\uDF3F', chive: '\uD83C\uDF3F',
  radish: '\uD83E\uDD55', beet: '\uD83E\uDD55', turnip: '\uD83E\uDD55',
  zucchini: '\uD83E\uDD52', squash: '\uD83C\uDF83', pumpkin: '\uD83C\uDF83',
  sunflower: '\uD83C\uDF3B', flower: '\uD83C\uDF3A',
};

function getPlantEmoji(id: string): string {
  for (const [key, emoji] of Object.entries(plantEmojis)) {
    if (id.includes(key)) return emoji;
  }
  return '\uD83C\uDF3F';
}

export function PlantCard({ plant, index = 0 }: PlantCardProps) {
  const plantable = isPlantableNow(plant);
  const seasons = getSeasonBadges(plant.plantingMonths);
  const diff = difficultyLabels[plant.difficulty] || difficultyLabels.easy;
  const emoji = getPlantEmoji(plant.id);

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
                A planter
              </span>
            </div>
          )}

          {/* Plant emoji + name */}
          <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4 mt-1">
            <motion.div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex-shrink-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
              style={{ backgroundColor: plant.color + '20', border: `2px solid ${plant.color}30` }}
              whileHover={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 0.4 }}
            >
              <span className="text-xl sm:text-2xl">{emoji}</span>
            </motion.div>
            <div className="min-w-0 pt-0.5 sm:pt-1">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-green-50 group-hover:text-green-600 dark:group-hover:text-green-300 transition-colors truncate">
                {plant.name.en}
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 dark:text-green-400/60 italic">{plant.name.fr}</p>
            </div>
          </div>

          <p className="text-sm text-gray-500 dark:text-green-200/60 mb-4 line-clamp-2 leading-relaxed">
            {plant.description.en}
          </p>

          {/* Season badges with emojis */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {seasons.map(s => (
              <span key={s.name} className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 ${seasonColors[s.name]}`}>
                <span className="text-xs">{s.emoji}</span>
                {s.name}
              </span>
            ))}
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 ${diff.class}`}>
              <span className="text-xs">{diff.emoji}</span>
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
              {plant.sunExposure[0] === 'full-sun' ? 'Plein soleil' : plant.sunExposure[0] === 'partial-shade' ? 'Mi-ombre' : 'Ombre'}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {plant.harvestDays}j
            </span>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
