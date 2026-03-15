'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardTitle, CardContent } from '@/components/ui/card';
import { useGarden } from '@/lib/hooks';
import { getRecommendedPlants, getPlantById, getDailyTip } from '@/lib/garden-utils';
import {
  Sprout,
  Calendar,
  Eye,
  Lightbulb,
  Leaf,
  Plus,
  Settings,
  Trash2,
  LayoutDashboard,
  Map,
  Bot,
  BookOpen,
  CreditCard,
  ChevronRight,
  CloudSun,
  CheckCircle2,
  Circle,
  Droplets,
  TreeDeciduous,
} from 'lucide-react';
import { MONTH_NAMES, SOIL_LABELS, CLIMATE_LABELS, SUN_LABELS } from '@/types';
import { SproutMascot } from '@/components/sprout-mascot';

const sidebarLinks = [
  { href: '/garden/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/garden/planner', label: 'Garden Planner', icon: Map },
  { href: '/garden/3d', label: '3D View', icon: Eye },
  { href: '/garden/advisor', label: 'AI Advisor', icon: Bot, pro: true },
  { href: '/garden/tips', label: 'Garden Tips', icon: Lightbulb },
  { href: '/plants', label: 'Plant Encyclopedia', icon: BookOpen },
  { href: '/garden/settings', label: 'Billing & Settings', icon: CreditCard },
  { href: '/garden/setup', label: 'Garden Setup', icon: Settings },
];

function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:block w-64 shrink-0">
      <div className="sticky top-24 space-y-1">
        <div className="px-3 py-2 mb-4">
          <h2 className="text-xs font-semibold text-green-500/50 uppercase tracking-wider">Navigation</h2>
        </div>
        {sidebarLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-green-900/40 text-green-300 border border-green-800/30'
                  : 'text-green-400/60 hover:text-green-300 hover:bg-green-900/20'
              }`}
            >
              <link.icon className="w-4.5 h-4.5" />
              <span className="flex-1">{link.label}</span>
              {link.pro && (
                <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-semibold rounded">
                  PRO
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}

function WeatherWidget() {
  return (
    <Card className="bg-gradient-to-br from-[#142A1E] to-[#1A3528]">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
          <CloudSun className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-green-200">Weather Today</h3>
          <p className="text-xs text-green-500/50">Garden conditions</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="p-2 rounded-lg bg-[#0D1F17]/50">
          <p className="text-lg font-bold text-green-50">18&deg;</p>
          <p className="text-xs text-green-500/50">Temp</p>
        </div>
        <div className="p-2 rounded-lg bg-[#0D1F17]/50">
          <p className="text-lg font-bold text-green-50">65%</p>
          <p className="text-xs text-green-500/50">Humidity</p>
        </div>
        <div className="p-2 rounded-lg bg-[#0D1F17]/50">
          <p className="text-lg font-bold text-green-50">12h</p>
          <p className="text-xs text-green-500/50">Daylight</p>
        </div>
      </div>
      <p className="text-xs text-green-500/40 mt-3 text-center">
        Connect weather API for live data
      </p>
    </Card>
  );
}

function QuickActions() {
  const actions = [
    { href: '/plants', label: 'Add Plant', icon: Plus, color: 'bg-green-600/20 text-green-400' },
    { href: '/garden/planner', label: 'Check Tasks', icon: CheckCircle2, color: 'bg-yellow-600/20 text-yellow-400' },
    { href: '/garden/3d', label: 'View 3D Garden', icon: Eye, color: 'bg-cyan-600/20 text-cyan-400' },
    { href: '/garden/advisor', label: 'Ask AI Advisor', icon: Bot, color: 'bg-purple-600/20 text-purple-400' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {actions.map((action) => (
        <Link key={action.href} href={action.href}>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="p-4 rounded-xl bg-[#142A1E] border border-green-900/40 hover:border-green-700/50 transition-all cursor-pointer text-center"
          >
            <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center mx-auto mb-2`}>
              <action.icon className="w-5 h-5" />
            </div>
            <span className="text-sm text-green-200 font-medium">{action.label}</span>
          </motion.div>
        </Link>
      ))}
    </div>
  );
}

function RecentActivity() {
  const activities = [
    { icon: Sprout, text: 'Garden created', time: 'Today', color: 'text-green-400' },
    { icon: Droplets, text: 'Watering reminder set', time: 'Today', color: 'text-blue-400' },
    { icon: TreeDeciduous, text: 'Plant encyclopedia browsed', time: 'Yesterday', color: 'text-emerald-400' },
    { icon: Eye, text: '3D garden viewed', time: 'Yesterday', color: 'text-cyan-400' },
  ];

  return (
    <Card>
      <CardTitle className="flex items-center justify-between mb-4">
        <span className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-green-400" />
          Recent Activity
        </span>
      </CardTitle>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3 py-2"
            >
              <activity.icon className={`w-4 h-4 ${activity.color} shrink-0`} />
              <span className="text-sm text-green-200 flex-1">{activity.text}</span>
              <span className="text-xs text-green-500/40">{activity.time}</span>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardPageClient() {
  const { data: session } = useSession();
  const { config, isLoaded, addPlant, removePlant } = useGarden();
  const [tip, setTip] = useState('');

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
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Sprout className="w-8 h-8 text-green-400" />
        </motion.div>
      </div>
    );
  }

  const plantedPlants = config.plantedItems
    .map((item) => ({ item, plant: getPlantById(item.plantId) }))
    .filter((p) => p.plant !== undefined);

  const plantableThisMonth = recommended.filter((p) =>
    p.plantingMonths.includes(currentMonth)
  );

  const tasksToday = [
    { text: 'Water your tomatoes', done: false },
    { text: 'Check basil for pests', done: false },
    { text: 'Mulch around peppers', done: true },
  ];

  return (
    <div className="min-h-screen bg-[#0D1F17] py-8 px-6">
      <div className="max-w-7xl mx-auto flex gap-8">
        <Sidebar />

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-green-50 mb-1">
                {session?.user?.name ? `Welcome, ${session.user.name}` : 'My Garden'}
              </h1>
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
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
              className="p-5 rounded-xl bg-gradient-to-br from-green-900/40 to-green-900/10 border border-green-800/30"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-green-600/20 flex items-center justify-center">
                  <Sprout className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-50">{plantedPlants.length}</p>
                  <p className="text-xs text-green-500/50">Plants Growing</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-5 rounded-xl bg-gradient-to-br from-yellow-900/30 to-yellow-900/10 border border-yellow-800/20"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-yellow-600/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-50">
                    {tasksToday.filter((t) => !t.done).length}
                  </p>
                  <p className="text-xs text-green-500/50">Tasks Due Today</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-5 rounded-xl bg-gradient-to-br from-cyan-900/30 to-cyan-900/10 border border-cyan-800/20"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-cyan-600/20 flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-50">{plantableThisMonth.length}</p>
                  <p className="text-xs text-green-500/50">Plantable This Month</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-green-400/60 mb-3 uppercase tracking-wider">Quick Actions</h2>
            <QuickActions />
          </div>

          {/* Daily Tip */}
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
            {/* Left column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Tasks today */}
              <Card>
                <CardTitle className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-5 h-5 text-yellow-400" />
                  Tasks Due Today
                </CardTitle>
                <CardContent>
                  <div className="space-y-2">
                    {tasksToday.map((task, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 rounded-xl bg-[#0D1F17] border border-green-900/30"
                      >
                        {task.done ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-green-700 shrink-0" />
                        )}
                        <span className={`text-sm ${task.done ? 'text-green-500/50 line-through' : 'text-green-100'}`}>
                          {task.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* My plants */}
              <Card>
                <div className="flex justify-between items-center mb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Sprout className="w-5 h-5 text-green-400" />
                    My Plants ({plantedPlants.length})
                  </CardTitle>
                  <Link href="/plants">
                    <Button variant="secondary" size="sm" className="gap-1">
                      <Plus className="w-4 h-4" />
                      Add
                    </Button>
                  </Link>
                </div>
                <CardContent>
                  {plantedPlants.length === 0 ? (
                    <div className="text-center py-8">
                      <Sprout className="w-8 h-8 text-green-700 mx-auto mb-2" />
                      <p className="text-green-500/50 mb-3">No plants yet. Add some to get started!</p>
                      <Link href="/plants">
                        <Button variant="outline" size="sm">Browse Plants</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2">
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
                              <span className="text-green-50 font-medium text-sm">{plant!.name.en}</span>
                              <span className="text-xs text-green-500/50 ml-2">
                                {new Date(item.plantedDate).toLocaleDateString()}
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

              {/* Recent Activity */}
              <RecentActivity />

              {/* Calendar */}
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
                              <span className="text-xs text-green-400">{plantableThisMonth.length} plants</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right column */}
            <div className="space-y-6">
              <WeatherWidget />

              {/* Recommendations */}
              <Card>
                <CardTitle className="flex items-center gap-2 mb-4">
                  <Leaf className="w-5 h-5 text-green-400" />
                  Recommended for You
                </CardTitle>
                <CardContent>
                  <div className="space-y-2">
                    {recommended.slice(0, 6).map((plant) => {
                      const isPlanted = config.plantedItems.some(
                        (p) => p.plantId === plant.id
                      );
                      return (
                        <div
                          key={plant.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-[#0D1F17] border border-green-900/30"
                        >
                          <Link
                            href={`/plants/${plant.id}`}
                            className="flex items-center gap-2.5 min-w-0 flex-1"
                          >
                            <div
                              className="w-7 h-7 rounded-lg flex-shrink-0"
                              style={{
                                backgroundColor: plant.color + '30',
                                border: `2px solid ${plant.color}50`,
                              }}
                            />
                            <div className="min-w-0">
                              <span className="text-green-50 text-sm font-medium truncate block">
                                {plant.name.en}
                              </span>
                            </div>
                          </Link>
                          {isPlanted ? (
                            <span className="text-xs text-green-500/50 ml-2 shrink-0">Added</span>
                          ) : (
                            <button
                              onClick={() => {
                                const x = Math.random() * config.length;
                                const z = Math.random() * config.width;
                                addPlant(plant.id, x, z);
                              }}
                              className="text-green-600 hover:text-green-400 transition-colors p-1 ml-2 shrink-0 cursor-pointer"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <Link href="/plants" className="block mt-3">
                    <Button variant="ghost" size="sm" className="w-full gap-1">
                      Browse all plants
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <SproutMascot page="dashboard" />
    </div>
  );
}
