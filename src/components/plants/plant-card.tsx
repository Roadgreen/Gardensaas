'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Droplets, Sun, Clock, Leaf } from 'lucide-react';
import type { Plant } from '@/types';
import { isPlantableNow } from '@/lib/garden-utils';
import { useLocale, useTranslations } from 'next-intl';

interface PlantCardProps {
  plant: Plant;
  index?: number;
}

type SeasonKey = 'spring' | 'summer' | 'autumn' | 'winter';

function getSeasonKeys(months: number[]): { key: SeasonKey; emoji: string }[] {
  const seasons: { key: SeasonKey; emoji: string }[] = [];
  if (months.some(m => [3,4,5].includes(m))) seasons.push({ key: 'spring', emoji: '\uD83C\uDF38' });
  if (months.some(m => [6,7,8].includes(m))) seasons.push({ key: 'summer', emoji: '\u2600\uFE0F' });
  if (months.some(m => [9,10,11].includes(m))) seasons.push({ key: 'autumn', emoji: '\uD83C\uDF42' });
  if (months.some(m => [12,1,2].includes(m))) seasons.push({ key: 'winter', emoji: '\u2744\uFE0F' });
  return seasons;
}

const seasonColors: Record<SeasonKey, string> = {
  spring: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  summer: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  autumn: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
  winter: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
};

const difficultyEmoji: Record<string, string> = {
  easy: '\uD83D\uDE0A',
  medium: '\uD83D\uDCAA',
  hard: '\uD83D\uDD25',
};

const difficultyClass: Record<string, string> = {
  easy: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  hard: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
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
  const locale = useLocale();
  const t = useTranslations('plants');
  const tPanel = useTranslations('garden3d.infoPanel');
  const tCatalog = useTranslations('garden3d.catalog');
  const plantable = isPlantableNow(plant);
  const seasons = getSeasonKeys(plant.plantingMonths);
  const diffEmoji = difficultyEmoji[plant.difficulty] || difficultyEmoji.easy;
  const diffCls = difficultyClass[plant.difficulty] || difficultyClass.easy;
  const emoji = getPlantEmoji(plant.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.03, 0.3) }}
    >
      <Link href={`/plants/${plant.id}`}>
        <Card hover className="relative overflow-hidden group cursor-pointer h-full">
          {/* No color accent bar - removed per design guidelines */}

          {/* Plantable badge */}
          {plantable && (
            <div className="absolute top-4 right-4">
              <span className="px-2.5 py-1 text-xs font-semibold bg-green-100 dark:bg-green-600/30 text-green-700 dark:text-green-300 rounded-full border border-green-200 dark:border-green-600/40 flex items-center gap-1">
                <Leaf className="w-3 h-3" />
                {t('now')}
              </span>
            </div>
          )}

          {/* Plant emoji + name */}
          <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4 mt-1 pr-16 sm:pr-0">
            <motion.div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex-shrink-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
              style={{ backgroundColor: plant.color + '20', border: `2px solid ${plant.color}30` }}
              whileHover={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 0.4 }}
            >
              <span className="text-xl sm:text-2xl">{emoji}</span>
            </motion.div>
            <div className="min-w-0 pt-0.5 sm:pt-1">
              <h3 className="text-base sm:text-lg font-semibold group-hover:text-green-600 dark:group-hover:text-green-300 transition-colors line-clamp-2 sm:truncate" style={{ color: 'var(--on-surface)' }}>
                {locale === 'fr' ? plant.name.fr : plant.name.en}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-green-400/60 italic font-medium">{locale === 'fr' ? plant.name.en : plant.name.fr}</p>
            </div>
          </div>

          <p className="text-sm mb-4 line-clamp-2 leading-relaxed" style={{ color: 'var(--on-surface)', opacity: 0.7 }}>
            {locale === 'fr' ? plant.description.fr : plant.description.en}
          </p>

          {/* Season badges with emojis */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {seasons.map(s => (
              <span key={s.key} className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 ${seasonColors[s.key]}`}>
                <span className="text-xs">{s.emoji}</span>
                {t(s.key)}
              </span>
            ))}
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 ${diffCls}`}>
              <span className="text-xs">{diffEmoji}</span>
              {t(plant.difficulty as 'easy' | 'medium' | 'hard')}
            </span>
          </div>

          {/* Plant info row */}
          <div className="flex flex-wrap gap-2 sm:gap-4 text-xs text-gray-500 dark:text-green-300/70 pt-2">
            <span className="flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5" />
              {(() => {
                const keyMap: Record<string, string> = { 'daily': 'daily', 'every-2-days': 'every2days', 'twice-weekly': 'twiceWeekly', 'weekly': 'weekly' };
                const key = keyMap[plant.wateringFrequency];
                return key ? tPanel(key as Parameters<typeof tPanel>[0]) : plant.wateringFrequency;
              })()}
            </span>
            <span className="flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5" />
              {plant.sunExposure[0] === 'full-sun' ? '\u2600\uFE0F\u2600\uFE0F' : plant.sunExposure[0] === 'partial-shade' ? '\u26C5' : '\uD83C\uDF27\uFE0F'}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {tCatalog('harvestDays', { days: plant.harvestDays })}
            </span>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
