'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardTitle, CardContent } from '@/components/ui/card';
import {
  ArrowLeft,
  Droplets,
  Sun,
  Clock,
  Ruler,
  ArrowDown,
  ThermometerSun,
  Sprout,
  AlertTriangle,
  Heart,
  ShieldAlert,
} from 'lucide-react';
import type { Plant } from '@/types';
import {
  getWateringLabel,
  getDifficultyColor,
  isPlantableNow,
  getCompanionPlants,
  getEnemyPlants,
} from '@/lib/garden-utils';
import { MONTH_NAMES } from '@/types';
import { useLocale, useTranslations } from 'next-intl';
import { PlantImage } from './plant-image';

interface PlantDetailProps {
  plant: Plant;
}

const plantEmojis: Record<string, string> = {
  tomato: '\uD83C\uDF45', carrot: '\uD83E\uDD55', pepper: '\uD83C\uDF36\uFE0F', corn: '\uD83C\uDF3D',
  lettuce: '\uD83E\uDD6C', strawberry: '\uD83C\uDF53', potato: '\uD83E\uDD54', onion: '\uD83E\uDDC5',
  garlic: '\uD83E\uDDC4', broccoli: '\uD83E\uDD66', eggplant: '\uD83C\uDF46', cucumber: '\uD83E\uDD52',
  melon: '\uD83C\uDF48', lemon: '\uD83C\uDF4B', cherry: '\uD83C\uDF52', grape: '\uD83C\uDF47',
  peach: '\uD83C\uDF51', pear: '\uD83C\uDF50', apple: '\uD83C\uDF4E', pumpkin: '\uD83C\uDF83',
  mushroom: '\uD83C\uDF44', avocado: '\uD83E\uDD51', mango: '\uD83E\uDD6D', pineapple: '\uD83C\uDF4D',
  watermelon: '\uD83C\uDF49', bean: '\uD83E\uDED8', pea: '\uD83E\uDED1', sunflower: '\uD83C\uDF3B',
  zucchini: '\uD83E\uDD52', squash: '\uD83C\uDF83', radish: '\uD83E\uDD55', beet: '\uD83E\uDD55',
};

function getPlantEmoji(id: string): string {
  for (const [key, emoji] of Object.entries(plantEmojis)) {
    if (id.includes(key)) return emoji;
  }
  return '\uD83C\uDF3F';
}

const monthSeasonEmojis = ['\u2744\uFE0F', '\u2744\uFE0F', '\uD83C\uDF38', '\uD83C\uDF38', '\uD83C\uDF38', '\u2600\uFE0F', '\u2600\uFE0F', '\u2600\uFE0F', '\uD83C\uDF42', '\uD83C\uDF42', '\uD83C\uDF42', '\u2744\uFE0F'];

const difficultyEmojis: Record<string, string> = {
  easy: '\uD83D\uDE0A',
  medium: '\uD83D\uDCAA',
  hard: '\uD83D\uDD25',
};

export function PlantDetail({ plant }: PlantDetailProps) {
  const locale = useLocale();
  const t = useTranslations('plantDetail');
  const plantable = isPlantableNow(plant);
  const companions = getCompanionPlants(plant.id);
  const enemies = getEnemyPlants(plant.id);
  const emoji = getPlantEmoji(plant.id);
  const diffEmoji = difficultyEmojis[plant.difficulty] || difficultyEmojis.easy;
  const diffLabel = t(plant.difficulty as 'easy' | 'medium' | 'hard');

  return (
    <div className="min-h-screen bg-[#0D1F17] py-8 px-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/plants">
          <Button variant="ghost" size="sm" className="mb-6 gap-2">
            <ArrowLeft className="w-4 h-4" />
            {t('backToAll')}
          </Button>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="flex items-start gap-6 mb-8">
            <motion.div
              className="flex-shrink-0 shadow-lg"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: 'spring' }}
            >
              <PlantImage
                plantId={plant.id}
                plantName={plant.name.en}
                emoji={emoji}
                color={plant.color}
                size="lg"
              />
            </motion.div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-green-50 mb-1">
                {locale === 'fr' ? plant.name.fr : plant.name.en}
              </h1>
              <p className="text-green-400/60 text-lg italic mb-3">{plant.name.fr}</p>
              <div className="flex flex-wrap gap-2">
                <span
                  className="px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"
                  style={{
                    color: getDifficultyColor(plant.difficulty),
                    backgroundColor: getDifficultyColor(plant.difficulty) + '20',
                  }}
                >
                  {diffEmoji} {diffLabel}
                </span>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-900/50 text-green-300 capitalize">
                  {plant.category}
                </span>
                {plantable && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-600/30 text-green-300 border border-green-600/40 flex items-center gap-1">
                    <Sprout className="w-3.5 h-3.5" />
                    {t('plantNow')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <Card className="mb-6">
            <CardContent>
              <p className="text-green-100 text-lg leading-relaxed">{locale === 'fr' ? plant.description.fr : plant.description.en}</p>
            </CardContent>
          </Card>

          {/* Quick stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { icon: Droplets, emoji: '\uD83D\uDCA7', label: t('watering'), value: getWateringLabel(plant.wateringFrequency), color: 'text-blue-400' },
              { icon: Sun, emoji: '\u2600\uFE0F', label: t('sun'), value: plant.sunExposure.map(s => s === 'full-sun' ? t('fullSun') : s === 'partial-shade' ? t('partialShade') : t('shade')).join(', '), color: 'text-yellow-400' },
              { icon: Clock, emoji: '\u23F0', label: t('harvest'), value: t('days', { count: plant.harvestDays }), color: 'text-orange-400' },
              { icon: Ruler, emoji: '\uD83D\uDCCF', label: t('spacing'), value: `${plant.spacingCm} cm`, color: 'text-green-400' },
            ].map((stat) => (
              <Card key={stat.label}>
                <div className="flex flex-col items-center text-center">
                  <span className="text-2xl mb-2" aria-hidden="true">{stat.emoji}</span>
                  <span className="text-xs text-green-400/60 mb-1">{stat.label}</span>
                  <span className="text-sm font-medium text-green-100">{stat.value}</span>
                </div>
              </Card>
            ))}
          </div>

          {/* Planting details + Visual calendar */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardTitle className="flex items-center gap-2 mb-3">
                <span className="text-lg" aria-hidden="true">{'\uD83C\uDF31'}</span>
                {t('plantingDetails')}
              </CardTitle>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center p-2 rounded-lg bg-[#0D1F17]/40">
                    <span className="text-green-300/60">{t('sowingDepth')}</span>
                    <span className="text-green-100 font-medium">{plant.depthCm} cm</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-[#0D1F17]/40">
                    <span className="text-green-300/60">{t('matureHeight')}</span>
                    <span className="text-green-100 font-medium">{plant.heightCm} cm</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-[#0D1F17]/40">
                    <span className="text-green-300/60">{t('soilTypes')}</span>
                    <span className="text-green-100 font-medium capitalize">
                      {plant.soilTypes.join(', ')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-[#0D1F17]/40">
                    <span className="text-green-300/60">{t('difficultyLabel')}</span>
                    <span className="text-green-100 font-medium">{diffEmoji} {diffLabel}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardTitle className="flex items-center gap-2 mb-3">
                <span className="text-lg" aria-hidden="true">{'\uD83D\uDCC5'}</span>
                {t('visualCalendar')}
              </CardTitle>
              <CardContent>
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                    const active = plant.plantingMonths.includes(month);
                    const isCurrent = month === new Date().getMonth() + 1;
                    return (
                      <motion.div
                        key={month}
                        className={`p-2 rounded-xl text-center border transition-all ${
                          active
                            ? isCurrent
                              ? 'bg-green-600/40 text-green-200 border-green-500 shadow-lg shadow-green-500/20'
                              : 'bg-green-600/20 text-green-300 border-green-600/40'
                            : 'bg-green-950/50 text-green-700 border-green-900/30'
                        }`}
                        whileHover={active ? { scale: 1.05 } : {}}
                      >
                        <span className="text-sm" aria-hidden="true">{monthSeasonEmojis[month - 1]}</span>
                        <span className={`block text-xs font-medium mt-0.5 ${active ? '' : 'opacity-50'}`}>
                          {MONTH_NAMES[month - 1].slice(0, 3)}
                        </span>
                        {active && (
                          <span className="block text-[10px] mt-0.5 text-green-400">{'\u2713'} {t('sowing')}</span>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Companion & enemy plants - visual */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardTitle className="flex items-center gap-2 mb-3">
                <Heart className="w-5 h-5 text-green-400" />
                <span className="text-lg" aria-hidden="true">{'\uD83E\uDD1D'}</span>
                {t('companions')}
              </CardTitle>
              <CardContent>
                {companions.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {companions.map((c) => (
                      <Link key={c.id} href={`/plants/${c.id}`}>
                        <motion.div
                          className="p-3 rounded-xl bg-green-900/30 border border-green-800/30 hover:border-green-600/50 transition-all cursor-pointer flex items-center gap-2 group"
                          whileHover={{ scale: 1.03 }}
                        >
                          <PlantImage
                            plantId={c.id}
                            plantName={c.name.en}
                            emoji={getPlantEmoji(c.id)}
                            color={plant.color}
                            size="sm"
                          />
                          <span className="text-sm text-green-200 truncate">{locale === 'fr' ? c.name.fr : c.name.en}</span>
                        </motion.div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-green-500/50">{t('noCompanions')}</p>
                )}
                {plant.companionPlants.filter(id => !companions.find(c => c.id === id)).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {plant.companionPlants.filter(id => !companions.find(c => c.id === id)).map(id => (
                      <span key={id} className="px-3 py-1 rounded-full text-sm bg-green-950/50 text-green-500/50 capitalize flex items-center gap-1">
                        {'\uD83C\uDF3F'} {id}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardTitle className="flex items-center gap-2 mb-3">
                <ShieldAlert className="w-5 h-5 text-red-400" />
                <span className="text-lg" aria-hidden="true">{'\u26A0\uFE0F'}</span>
                {t('enemies')}
              </CardTitle>
              <CardContent>
                {enemies.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {enemies.map((e) => (
                      <Link key={e.id} href={`/plants/${e.id}`}>
                        <motion.div
                          className="p-3 rounded-xl bg-red-900/20 border border-red-800/20 hover:border-red-600/40 transition-all cursor-pointer flex items-center gap-2 group"
                          whileHover={{ scale: 1.03 }}
                        >
                          <PlantImage
                            plantId={e.id}
                            plantName={e.name.en}
                            emoji={getPlantEmoji(e.id)}
                            color="#ef4444"
                            size="sm"
                          />
                          <span className="text-sm text-red-200 truncate">{locale === 'fr' ? e.name.fr : e.name.en}</span>
                        </motion.div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-green-500/50">{t('noEnemies')}</p>
                )}
                {plant.enemyPlants.filter(id => !enemies.find(e => e.id === id)).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {plant.enemyPlants.filter(id => !enemies.find(e => e.id === id)).map(id => (
                      <span key={id} className="px-3 py-1 rounded-full text-sm bg-red-950/50 text-red-400/50 capitalize flex items-center gap-1">
                        {'\u274C'} {id}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tips */}
          <Card>
            <CardTitle className="mb-4 flex items-center gap-2">
              <span className="text-lg" aria-hidden="true">{'\uD83D\uDCA1'}</span>
              {t('growingTips')}
            </CardTitle>
            <CardContent>
              <ul className="space-y-3">
                {plant.tips.map((tip, i) => (
                  <motion.li
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-xl bg-[#0D1F17]/40"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <span className="w-7 h-7 rounded-full bg-green-900/50 flex-shrink-0 flex items-center justify-center text-xs text-green-400 font-bold mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-green-100 text-sm leading-relaxed">{tip}</span>
                  </motion.li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
