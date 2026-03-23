'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Droplets,
  Sun,
  Scissors,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import { MONTH_NAMES, SOIL_LABELS, CLIMATE_LABELS, SUN_LABELS } from '@/types';
import type { Plant, PlantedItem } from '@/types';

interface DailyTask {
  id: string;
  type: 'water' | 'harvest' | 'check' | 'plant';
  plantName: string;
  plantColor: string;
  plantId: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  icon: typeof Droplets;
}

function getSeason(): 'spring' | 'summer' | 'autumn' | 'winter' {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

function generateDailyTasks(plantedItems: PlantedItem[]): DailyTask[] {
  const tasks: DailyTask[] = [];
  const hour = new Date().getHours();
  const currentMonth = new Date().getMonth() + 1;
  const season = getSeason();

  plantedItems.forEach((item, idx) => {
    const plant = getPlantById(item.plantId);
    if (!plant) return;

    const now = new Date();
    const planted = new Date(item.plantedDate);
    const daysPassed = Math.floor((now.getTime() - planted.getTime()) / (1000 * 60 * 60 * 24));
    const progress = daysPassed / plant.harvestDays;

    // Watering tasks
    const needsWater =
      (plant.wateringFrequency === 'daily') ||
      (plant.wateringFrequency === 'every-2-days' && daysPassed % 2 === 0) ||
      (plant.wateringFrequency === 'twice-weekly' && [1, 4].includes(now.getDay())) ||
      (plant.wateringFrequency === 'weekly' && now.getDay() === 1);

    if (needsWater && hour >= 6) {
      tasks.push({
        id: `water-${idx}`,
        type: 'water',
        plantName: plant.name.en,
        plantColor: plant.color,
        plantId: plant.id,
        message: hour < 10
          ? `Water now (best time: early morning)`
          : hour < 18
          ? `Water today - avoid midday sun`
          : `Water this evening`,
        priority: plant.wateringFrequency === 'daily' ? 'high' : 'medium',
        icon: Droplets,
      });
    }

    // Harvest tasks
    if (progress >= 1.0) {
      tasks.push({
        id: `harvest-${idx}`,
        type: 'harvest',
        plantName: plant.name.en,
        plantColor: plant.color,
        plantId: plant.id,
        message: progress > 1.2
          ? `Overdue for harvest! Pick soon.`
          : `Ready to harvest!`,
        priority: progress > 1.2 ? 'high' : 'medium',
        icon: Scissors,
      });
    }

    // Check / inspect tasks for growing plants
    if (progress >= 0.4 && progress < 1.0 && daysPassed % 3 === 0) {
      tasks.push({
        id: `check-${idx}`,
        type: 'check',
        plantName: plant.name.en,
        plantColor: plant.color,
        plantId: plant.id,
        message: progress >= 0.7
          ? `Almost ready! Check for pests and health.`
          : `Check growth progress (${Math.round(progress * 100)}%)`,
        priority: 'low',
        icon: Eye,
      });
    }
  });

  // Seasonal planting suggestion
  const recommended = getRecommendedPlants({
    length: 4,
    width: 3,
    soilType: 'loamy',
    climateZone: 'temperate',
    sunExposure: 'full-sun',
    plantedItems: [],
    raisedBeds: [],
  });
  const plantableNow = recommended.filter((p) => p.plantingMonths.includes(currentMonth));
  const alreadyPlanted = new Set(plantedItems.map((i) => i.plantId));
  const suggestion = plantableNow.find((p) => !alreadyPlanted.has(p.id));

  if (suggestion && plantedItems.length < 20) {
    tasks.push({
      id: `plant-suggestion`,
      type: 'plant',
      plantName: suggestion.name.en,
      plantColor: suggestion.color,
      plantId: suggestion.id,
      message: `Great time to plant! Perfect for ${season}.`,
      priority: 'low',
      icon: Sprout,
    });
  }

  // Sort: high priority first
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  tasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return tasks;
}

const priorityStyles = {
  high: {
    border: 'border-red-500/30 dark:border-red-500/20',
    bg: 'bg-red-50 dark:bg-red-900/10',
    badge: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    icon: 'text-red-500',
  },
  medium: {
    border: 'border-amber-500/30 dark:border-amber-500/20',
    bg: 'bg-amber-50 dark:bg-amber-900/10',
    badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    icon: 'text-amber-500',
  },
  low: {
    border: 'border-green-500/30 dark:border-green-500/20',
    bg: 'bg-green-50 dark:bg-green-900/10',
    badge: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    icon: 'text-green-500',
  },
};

const typeLabels: Record<string, string> = {
  water: 'Water',
  harvest: 'Harvest',
  check: 'Check',
  plant: 'Plant',
};

export function DashboardView() {
  const { config, isLoaded, addPlant, removePlant } = useGarden();
  const [tip, setTip] = useState('');
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  const recommended = isLoaded ? getRecommendedPlants(config) : [];
  const currentMonth = new Date().getMonth() + 1;

  useEffect(() => {
    if (isLoaded) {
      setTip(getDailyTip(config.plantedItems));
    }
  }, [isLoaded, config.plantedItems]);

  const dailyTasks = useMemo(() => {
    if (!isLoaded) return [];
    return generateDailyTasks(config.plantedItems);
  }, [isLoaded, config.plantedItems]);

  const pendingTasks = dailyTasks.filter((t) => !completedTasks.has(t.id));
  const completedCount = completedTasks.size;

  const toggleTask = (taskId: string) => {
    setCompletedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0D1F17] flex items-center justify-center">
        <div className="animate-pulse text-green-600 dark:text-green-400">Loading garden...</div>
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
    <div className="min-h-screen bg-white dark:bg-[#0D1F17] py-6 sm:py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-green-50 mb-1">My Garden</h1>
            <p className="text-sm sm:text-base text-gray-500 dark:text-green-300/60">
              {config.length}m x {config.width}m |{' '}
              {SOIL_LABELS[config.soilType]} soil |{' '}
              {CLIMATE_LABELS[config.climateZone]} |{' '}
              {SUN_LABELS[config.sunExposure]}
            </p>
          </div>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <Link href="/garden/3d" className="flex-1 sm:flex-none">
              <Button variant="secondary" className="gap-2 w-full sm:w-auto">
                <Eye className="w-4 h-4" />
                <span className="sm:inline">3D View</span>
              </Button>
            </Link>
            <Link href="/garden/setup">
              <Button variant="ghost" size="sm" className="gap-2">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Today's Tasks Widget */}
        {dailyTasks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/15 border-green-200 dark:border-green-800/30 overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-green-50">
                      Today&apos;s Tasks
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-green-400/50">
                      {completedCount}/{dailyTasks.length} completed
                    </p>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="hidden sm:flex items-center gap-3">
                  <div className="w-32 h-2 rounded-full bg-gray-200 dark:bg-green-900/30 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-green-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${dailyTasks.length > 0 ? (completedCount / dailyTasks.length) * 100 : 0}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-500 dark:text-green-400/60">
                    {dailyTasks.length > 0 ? Math.round((completedCount / dailyTasks.length) * 100) : 0}%
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <AnimatePresence>
                  {dailyTasks.map((task) => {
                    const isCompleted = completedTasks.has(task.id);
                    const style = priorityStyles[task.priority];
                    const Icon = task.icon;

                    return (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: isCompleted ? 0.5 : 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                          isCompleted
                            ? 'border-gray-200 dark:border-green-900/20 bg-gray-50 dark:bg-green-900/5'
                            : `${style.border} ${style.bg}`
                        }`}
                      >
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleTask(task.id)}
                          className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center cursor-pointer transition-all ${
                            isCompleted
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'border-gray-300 dark:border-green-700/50 hover:border-green-500'
                          }`}
                        >
                          {isCompleted && <CheckCircle2 className="w-4 h-4" />}
                        </button>

                        {/* Plant indicator */}
                        <div
                          className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center"
                          style={{ backgroundColor: task.plantColor + '20', border: `2px solid ${task.plantColor}40` }}
                        >
                          <Icon className={`w-4 h-4 ${isCompleted ? 'text-gray-400' : style.icon}`} />
                        </div>

                        {/* Task info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium text-sm ${isCompleted ? 'line-through text-gray-400 dark:text-green-500/40' : 'text-gray-900 dark:text-green-50'}`}>
                              {task.plantName}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${isCompleted ? 'bg-gray-200 dark:bg-green-900/20 text-gray-400 dark:text-green-500/40' : style.badge}`}>
                              {typeLabels[task.type]}
                            </span>
                          </div>
                          <p className={`text-xs ${isCompleted ? 'text-gray-400 dark:text-green-500/30' : 'text-gray-500 dark:text-green-300/60'}`}>
                            {task.message}
                          </p>
                        </div>

                        {/* Link to plant */}
                        <Link href={`/plants/${task.plantId}`} className="flex-shrink-0 hidden sm:block">
                          <ChevronRight className="w-4 h-4 text-gray-400 dark:text-green-600/40 hover:text-green-500 transition-colors" />
                        </Link>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* All done message */}
              {completedCount === dailyTasks.length && dailyTasks.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-4 text-center py-3 bg-green-100 dark:bg-green-900/20 rounded-xl"
                >
                  <p className="text-green-700 dark:text-green-300 font-medium text-sm">
                    All tasks done! Your garden thanks you.
                  </p>
                </motion.div>
              )}
            </Card>
          </motion.div>
        )}

        {/* Daily tip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <Card className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-green-900/40 dark:to-emerald-900/20 border-yellow-200/50 dark:border-green-800/30">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-yellow-800 dark:text-green-300 mb-1">Daily Tip</h3>
                <p className="text-sm text-yellow-900/80 dark:text-green-100 italic leading-relaxed" style={{ fontFamily: 'var(--font-jakarta, "Plus Jakarta Sans", sans-serif)', fontStyle: 'italic' }}>{tip}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left column - Planted items + Calendar */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* My plants */}
            <Card>
              <div className="flex justify-between items-center mb-4">
                <CardTitle className="flex items-center gap-2">
                  <Sprout className="w-5 h-5 text-green-600 dark:text-green-400" />
                  My Plants ({plantedPlants.length})
                </CardTitle>
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-1"
                  onClick={() => setShowRecommendations(!showRecommendations)}
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add</span>
                </Button>
              </div>
              <CardContent>
                {plantedPlants.length === 0 ? (
                  <div className="text-center py-8">
                    <Sprout className="w-12 h-12 text-green-300/30 mx-auto mb-3" />
                    <p className="text-gray-400 dark:text-green-500/50 mb-2">
                      No plants yet. Add some from the recommendations!
                    </p>
                    <Link href="/plants">
                      <Button variant="secondary" size="sm" className="gap-1">
                        <Leaf className="w-3 h-3" />
                        Browse plants
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {plantedPlants.map(({ item, plant }, i) => {
                      const now = new Date();
                      const planted = new Date(item.plantedDate);
                      const daysPassed = Math.floor((now.getTime() - planted.getTime()) / (1000 * 60 * 60 * 24));
                      const progress = Math.min(daysPassed / plant!.harvestDays, 1);
                      const isReady = progress >= 1;

                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-[#0D1F17] border border-gray-100 dark:border-green-900/30"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div
                              className="w-8 h-8 rounded-lg flex-shrink-0"
                              style={{ backgroundColor: plant!.color + '30', border: `2px solid ${plant!.color}50` }}
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-900 dark:text-green-50 font-medium text-sm truncate">{plant!.name.en}</span>
                                {isReady && (
                                  <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 dark:bg-amber-600/20 text-amber-600 dark:text-amber-400 rounded-full font-semibold flex-shrink-0">
                                    Ready!
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400 dark:text-green-500/50">
                                  Day {daysPassed}/{plant!.harvestDays}
                                </span>
                                {/* Mini progress bar */}
                                <div className="w-16 h-1.5 rounded-full bg-gray-200 dark:bg-green-900/30 overflow-hidden hidden sm:block">
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                      width: `${Math.min(progress * 100, 100)}%`,
                                      backgroundColor: isReady ? '#F59E0B' : plant!.color,
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => removePlant(i)}
                            className="text-gray-300 dark:text-green-700 hover:text-red-400 transition-colors p-1 cursor-pointer flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Planting Calendar */}
            <Card>
              <CardTitle className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                Planting Calendar
              </CardTitle>
              <CardContent>
                <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {MONTH_NAMES.map((name, i) => {
                    const month = i + 1;
                    const isCurrent = month === currentMonth;
                    const plantCount = plantableThisMonth.length;
                    return (
                      <div
                        key={name}
                        className={`p-2 sm:p-3 rounded-xl text-center border transition-all ${
                          isCurrent
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                            : 'border-gray-100 dark:border-green-900/30 bg-gray-50 dark:bg-[#0D1F17]'
                        }`}
                      >
                        <span
                          className={`text-xs font-medium ${
                            isCurrent ? 'text-green-700 dark:text-green-300' : 'text-gray-400 dark:text-green-500/50'
                          }`}
                        >
                          {name.slice(0, 3)}
                        </span>
                        {isCurrent && (
                          <div className="mt-1">
                            <span className="text-xs text-green-600 dark:text-green-400">{plantCount} plants</span>
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
          <div className="space-y-4 sm:space-y-6">
            <Card>
              <CardTitle className="flex items-center gap-2 mb-4">
                <Leaf className="w-5 h-5 text-green-600 dark:text-green-400" />
                Recommended for You
              </CardTitle>
              <CardContent>
                <div className="space-y-2 sm:space-y-3">
                  {recommended.slice(0, 8).map((plant) => {
                    const isPlanted = config.plantedItems.some(
                      (p) => p.plantId === plant.id
                    );
                    return (
                      <div
                        key={plant.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-[#0D1F17] border border-gray-100 dark:border-green-900/30"
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
                            <span className="text-gray-900 dark:text-green-50 text-sm font-medium truncate block">
                              {plant.name.en}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-green-500/50">
                              {plant.harvestDays}d harvest
                            </span>
                          </div>
                        </Link>
                        {isPlanted ? (
                          <span className="text-xs text-gray-400 dark:text-green-500/50 ml-2 flex-shrink-0">Added</span>
                        ) : (
                          <button
                            onClick={() => {
                              const x = Math.random() * config.length;
                              const z = Math.random() * config.width;
                              addPlant(plant.id, x, z);
                            }}
                            className="text-green-600 hover:text-green-500 dark:text-green-600 dark:hover:text-green-400 transition-colors p-1 ml-2 flex-shrink-0 cursor-pointer"
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
