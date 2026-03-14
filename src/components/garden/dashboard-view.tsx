'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardTitle, CardContent } from '@/components/ui/card';
import { PlantCard } from '@/components/plants/plant-card';
import { useGarden } from '@/lib/hooks';
import { getRecommendedPlants, getPlantById, getPlantingCalendar, getDailyTip } from '@/lib/garden-utils';
import {
  Sprout,
  Calendar,
  Eye,
  Lightbulb,
  Leaf,
  Plus,
  Settings,
  Trash2,
} from 'lucide-react';
import { MONTH_NAMES, SOIL_LABELS, CLIMATE_LABELS, SUN_LABELS } from '@/types';

export function DashboardView() {
  const { config, isLoaded, addPlant, removePlant } = useGarden();
  const [tip, setTip] = useState('');
  const [showRecommendations, setShowRecommendations] = useState(false);

  const recommended = isLoaded ? getRecommendedPlants(config) : [];
  const currentMonth = new Date().getMonth() + 1;

  useEffect(() => {
    if (isLoaded) {
      setTip(getDailyTip(config.plantedItems));
    }
  }, [isLoaded, config.plantedItems]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#0D1F17] flex items-center justify-center">
        <div className="animate-pulse text-green-400">Loading garden...</div>
      </div>
    );
  }

  const plantedPlants = config.plantedItems
    .map((item) => ({ item, plant: getPlantById(item.plantId) }))
    .filter((p) => p.plant !== undefined);

  const plantableThisMonth = recommended.filter((p) =>
    p.plantingMonths.includes(currentMonth)
  );

  return (
    <div className="min-h-screen bg-[#0D1F17] py-8 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-green-50 mb-1">My Garden</h1>
            <p className="text-green-300/60">
              {config.length}m x {config.width}m |{' '}
              {SOIL_LABELS[config.soilType]} soil |{' '}
              {CLIMATE_LABELS[config.climateZone]} |{' '}
              {SUN_LABELS[config.sunExposure]}
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/garden/3d">
              <Button variant="secondary" className="gap-2">
                <Eye className="w-4 h-4" />
                3D View
              </Button>
            </Link>
            <Link href="/garden/setup">
              <Button variant="ghost" size="sm" className="gap-2">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Daily tip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-r from-green-900/40 to-emerald-900/20 border-green-800/30">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-green-300 mb-1">Daily Tip</h3>
                <p className="text-green-100">{tip}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left column - Planted items + Calendar */}
          <div className="lg:col-span-2 space-y-6">
            {/* My plants */}
            <Card>
              <div className="flex justify-between items-center mb-4">
                <CardTitle className="flex items-center gap-2">
                  <Sprout className="w-5 h-5 text-green-400" />
                  My Plants ({plantedPlants.length})
                </CardTitle>
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-1"
                  onClick={() => setShowRecommendations(!showRecommendations)}
                >
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              </div>
              <CardContent>
                {plantedPlants.length === 0 ? (
                  <p className="text-center py-8 text-green-500/50">
                    No plants yet. Add some from the recommendations below!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {plantedPlants.map(({ item, plant }, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center justify-between p-3 rounded-xl bg-[#0D1F17] border border-green-900/30"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg"
                            style={{ backgroundColor: plant!.color + '30', border: `2px solid ${plant!.color}50` }}
                          />
                          <div>
                            <span className="text-green-50 font-medium">{plant!.name.en}</span>
                            <span className="text-xs text-green-500/50 ml-2">
                              Planted {new Date(item.plantedDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => removePlant(i)}
                          className="text-green-700 hover:text-red-400 transition-colors p-1 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Planting Calendar */}
            <Card>
              <CardTitle className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-green-400" />
                Planting Calendar
              </CardTitle>
              <CardContent>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {MONTH_NAMES.map((name, i) => {
                    const month = i + 1;
                    const isCurrent = month === currentMonth;
                    const plantCount = plantableThisMonth.length;
                    return (
                      <div
                        key={name}
                        className={`p-3 rounded-xl text-center border transition-all ${
                          isCurrent
                            ? 'border-green-500 bg-green-900/30'
                            : 'border-green-900/30 bg-[#0D1F17]'
                        }`}
                      >
                        <span
                          className={`text-xs font-medium ${
                            isCurrent ? 'text-green-300' : 'text-green-500/50'
                          }`}
                        >
                          {name.slice(0, 3)}
                        </span>
                        {isCurrent && (
                          <div className="mt-1">
                            <span className="text-xs text-green-400">{plantCount} plants</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column - Recommendations */}
          <div className="space-y-6">
            <Card>
              <CardTitle className="flex items-center gap-2 mb-4">
                <Leaf className="w-5 h-5 text-green-400" />
                Recommended for You
              </CardTitle>
              <CardContent>
                <div className="space-y-3">
                  {recommended.slice(0, 8).map((plant) => {
                    const isPlanted = config.plantedItems.some(
                      (p) => p.plantId === plant.id
                    );
                    return (
                      <div
                        key={plant.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-[#0D1F17] border border-green-900/30"
                      >
                        <Link
                          href={`/plants/${plant.id}`}
                          className="flex items-center gap-3 min-w-0 flex-1"
                        >
                          <div
                            className="w-8 h-8 rounded-lg flex-shrink-0"
                            style={{
                              backgroundColor: plant.color + '30',
                              border: `2px solid ${plant.color}50`,
                            }}
                          />
                          <div className="min-w-0">
                            <span className="text-green-50 text-sm font-medium truncate block">
                              {plant.name.en}
                            </span>
                            <span className="text-xs text-green-500/50">
                              {plant.harvestDays}d harvest
                            </span>
                          </div>
                        </Link>
                        {isPlanted ? (
                          <span className="text-xs text-green-500/50 ml-2 flex-shrink-0">Added</span>
                        ) : (
                          <button
                            onClick={() => {
                              const x = Math.random() * config.length;
                              const z = Math.random() * config.width;
                              addPlant(plant.id, x, z);
                            }}
                            className="text-green-600 hover:text-green-400 transition-colors p-1 ml-2 flex-shrink-0 cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                <Link href="/plants" className="block mt-4">
                  <Button variant="ghost" size="sm" className="w-full">
                    Browse all plants
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
