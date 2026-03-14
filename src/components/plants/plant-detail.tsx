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

interface PlantDetailProps {
  plant: Plant;
}

export function PlantDetail({ plant }: PlantDetailProps) {
  const plantable = isPlantableNow(plant);
  const companions = getCompanionPlants(plant.id);
  const enemies = getEnemyPlants(plant.id);

  return (
    <div className="min-h-screen bg-[#0D1F17] py-8 px-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/plants">
          <Button variant="ghost" size="sm" className="mb-6 gap-2">
            <ArrowLeft className="w-4 h-4" />
            All Plants
          </Button>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="flex items-start gap-6 mb-8">
            <div
              className="w-20 h-20 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg"
              style={{
                backgroundColor: plant.color + '25',
                border: `3px solid ${plant.color}60`,
              }}
            >
              <div
                className="w-10 h-10 rounded-full"
                style={{ backgroundColor: plant.color }}
              />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-green-50 mb-1">
                {plant.name.en}
              </h1>
              <p className="text-green-400/60 text-lg italic mb-3">{plant.name.fr}</p>
              <div className="flex flex-wrap gap-2">
                <span
                  className="px-3 py-1 rounded-full text-sm font-medium"
                  style={{
                    color: getDifficultyColor(plant.difficulty),
                    backgroundColor: getDifficultyColor(plant.difficulty) + '20',
                  }}
                >
                  {plant.difficulty}
                </span>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-900/50 text-green-300 capitalize">
                  {plant.category}
                </span>
                {plantable && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-600/30 text-green-300 border border-green-600/40">
                    Plant now
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <Card className="mb-6">
            <CardContent>
              <p className="text-green-100 text-lg leading-relaxed">{plant.description.en}</p>
            </CardContent>
          </Card>

          {/* Quick stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="flex flex-col items-center text-center">
                <Droplets className="w-6 h-6 text-blue-400 mb-2" />
                <span className="text-xs text-green-400/60 mb-1">Watering</span>
                <span className="text-sm font-medium text-green-100">
                  {getWateringLabel(plant.wateringFrequency)}
                </span>
              </div>
            </Card>
            <Card>
              <div className="flex flex-col items-center text-center">
                <Sun className="w-6 h-6 text-yellow-400 mb-2" />
                <span className="text-xs text-green-400/60 mb-1">Sun</span>
                <span className="text-sm font-medium text-green-100">
                  {plant.sunExposure.map(s => s === 'full-sun' ? 'Full sun' : s === 'partial-shade' ? 'Partial shade' : 'Shade').join(', ')}
                </span>
              </div>
            </Card>
            <Card>
              <div className="flex flex-col items-center text-center">
                <Clock className="w-6 h-6 text-orange-400 mb-2" />
                <span className="text-xs text-green-400/60 mb-1">Harvest</span>
                <span className="text-sm font-medium text-green-100">{plant.harvestDays} days</span>
              </div>
            </Card>
            <Card>
              <div className="flex flex-col items-center text-center">
                <Ruler className="w-6 h-6 text-green-400 mb-2" />
                <span className="text-xs text-green-400/60 mb-1">Spacing</span>
                <span className="text-sm font-medium text-green-100">{plant.spacingCm} cm</span>
              </div>
            </Card>
          </div>

          {/* Additional info */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardTitle className="flex items-center gap-2 mb-3">
                <ArrowDown className="w-5 h-5 text-green-400" />
                Planting Details
              </CardTitle>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-300/60">Planting depth</span>
                    <span className="text-green-100">{plant.depthCm} cm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-300/60">Plant height</span>
                    <span className="text-green-100">{plant.heightCm} cm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-300/60">Soil types</span>
                    <span className="text-green-100 capitalize">
                      {plant.soilTypes.join(', ')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardTitle className="flex items-center gap-2 mb-3">
                <ThermometerSun className="w-5 h-5 text-yellow-400" />
                Planting Months
              </CardTitle>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                    const active = plant.plantingMonths.includes(month);
                    return (
                      <span
                        key={month}
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          active
                            ? 'bg-green-600/30 text-green-300 border border-green-600/40'
                            : 'bg-green-950/50 text-green-700 border border-green-900/30'
                        }`}
                      >
                        {MONTH_NAMES[month - 1].slice(0, 3)}
                      </span>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Companion & enemy plants */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardTitle className="flex items-center gap-2 mb-3">
                <Sprout className="w-5 h-5 text-green-400" />
                Companion Plants
              </CardTitle>
              <CardContent>
                {companions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {companions.map((c) => (
                      <Link key={c.id} href={`/plants/${c.id}`}>
                        <span className="px-3 py-1 rounded-full text-sm bg-green-900/50 text-green-300 hover:bg-green-800/50 transition-colors cursor-pointer">
                          {c.name.en}
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-green-500/50">No companion plants listed.</p>
                )}
                {plant.companionPlants.filter(id => !companions.find(c => c.id === id)).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {plant.companionPlants.filter(id => !companions.find(c => c.id === id)).map(id => (
                      <span key={id} className="px-3 py-1 rounded-full text-sm bg-green-950/50 text-green-500/50 capitalize">
                        {id}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardTitle className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Keep Apart
              </CardTitle>
              <CardContent>
                {enemies.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {enemies.map((e) => (
                      <Link key={e.id} href={`/plants/${e.id}`}>
                        <span className="px-3 py-1 rounded-full text-sm bg-red-900/30 text-red-300 hover:bg-red-800/30 transition-colors cursor-pointer">
                          {e.name.en}
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-green-500/50">Gets along with everyone!</p>
                )}
                {plant.enemyPlants.filter(id => !enemies.find(e => e.id === id)).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {plant.enemyPlants.filter(id => !enemies.find(e => e.id === id)).map(id => (
                      <span key={id} className="px-3 py-1 rounded-full text-sm bg-red-950/50 text-red-400/50 capitalize">
                        {id}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tips */}
          <Card>
            <CardTitle className="mb-4">Growing Tips</CardTitle>
            <CardContent>
              <ul className="space-y-3">
                {plant.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-green-900/50 flex-shrink-0 flex items-center justify-center text-xs text-green-400 font-medium mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-green-100">{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
