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
  History,
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
  Sun,
  Snowflake,
  Flower2,
  CloudRain,
  Thermometer,
} from 'lucide-react';
import { MONTH_NAMES, SOIL_LABELS, CLIMATE_LABELS, SUN_LABELS } from '@/types';
import { SproutMascot } from '@/components/sprout-mascot';

const sidebarLinks = [
  { href: '/garden/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/garden/planner', label: 'Garden Planner', icon: Map },
  { href: '/garden/3d', label: '3D View', icon: Eye },
  { href: '/garden/history', label: 'Garden History', icon: History },
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

function getSeasonInfo() {
  const month = new Date().getMonth() + 1;
  if ([3, 4, 5].includes(month)) return { name: 'Printemps', emoji: '\uD83C\uDF38', icon: Flower2, color: 'text-pink-400', bg: 'bg-pink-500/20' };
  if ([6, 7, 8].includes(month)) return { name: 'Ete', emoji: '\u2600\uFE0F', icon: Sun, color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
  if ([9, 10, 11].includes(month)) return { name: 'Automne', emoji: '\uD83C\uDF42', icon: Leaf, color: 'text-orange-400', bg: 'bg-orange-500/20' };
  return { name: 'Hiver', emoji: '\u2744\uFE0F', icon: Snowflake, color: 'text-blue-400', bg: 'bg-blue-500/20' };
}

function WeatherWidget() {
  const season = getSeasonInfo();

  return (
    <Card className="bg-gradient-to-br from-[#142A1E] to-[#1A3528] overflow-hidden relative">
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/5 to-transparent rounded-full -translate-y-8 translate-x-8" />

      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
          <CloudSun className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-green-200">Meteo du jardin</h3>
          <p className="text-xs text-green-500/50 flex items-center gap-1">
            {season.emoji} {season.name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center mb-4">
        <div className="p-3 rounded-xl bg-[#0D1F17]/50 border border-green-900/20">
          <Thermometer className="w-4 h-4 text-orange-400 mx-auto mb-1" />
          <p className="text-xl font-bold text-green-50">18&deg;</p>
          <p className="text-xs text-green-500/50">Temperature</p>
        </div>
        <div className="p-3 rounded-xl bg-[#0D1F17]/50 border border-green-900/20">
          <Droplets className="w-4 h-4 text-blue-400 mx-auto mb-1" />
          <p className="text-xl font-bold text-green-50">65%</p>
          <p className="text-xs text-green-500/50">Humidite</p>
        </div>
        <div className="p-3 rounded-xl bg-[#0D1F17]/50 border border-green-900/20">
          <Sun className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
          <p className="text-xl font-bold text-green-50">12h</p>
          <p className="text-xs text-green-500/50">Ensoleillement</p>
        </div>
      </div>

      {/* 3-day mini forecast */}
      <div className="flex gap-2 mb-3">
        {[
          { day: 'Dem.', temp: '17\u00B0', icon: CloudSun, rain: false },
          { day: 'Mer.', temp: '20\u00B0', icon: Sun, rain: false },
          { day: 'Jeu.', temp: '15\u00B0', icon: CloudRain, rain: true },
        ].map((d) => (
          <div key={d.day} className="flex-1 text-center p-2 rounded-lg bg-[#0D1F17]/30">
            <p className="text-xs text-green-500/50">{d.day}</p>
            <d.icon className={`w-4 h-4 mx-auto my-1 ${d.rain ? 'text-blue-400' : 'text-yellow-400'}`} />
            <p className="text-xs font-medium text-green-200">{d.temp}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-green-500/40 text-center">
        Connectez l'API meteo pour des donnees en direct
      </p>
    </Card>
  );
}

function DailyTasksCalendar() {
  const today = new Date();
  const dayName = today.toLocaleDateString('fr-FR', { weekday: 'long' });
  const dateStr = today.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });

  const tasks = [
    { text: 'Arroser les tomates', emoji: '\uD83C\uDF45', done: false, time: 'Matin' },
    { text: 'Semer les radis', emoji: '\uD83E\uDD55', done: false, time: 'Matin' },
    { text: 'Pailler autour des poivrons', emoji: '\uD83C\uDF36\uFE0F', done: true, time: 'Fait' },
    { text: 'Verifier le basilic (pucerons)', emoji: '\uD83C\uDF3F', done: false, time: 'Apres-midi' },
    { text: 'Recolter la laitue', emoji: '\uD83E\uDD6C', done: false, time: 'Soir' },
  ];

  return (
    <Card>
      <CardTitle className="flex items-center justify-between mb-4">
        <span className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-green-400" />
          Taches du jour
        </span>
        <span className="text-xs font-normal text-green-500/50 capitalize">{dayName} {dateStr}</span>
      </CardTitle>
      <CardContent>
        <div className="space-y-2">
          {tasks.map((task, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                task.done
                  ? 'bg-green-900/20 border-green-800/20'
                  : 'bg-[#0D1F17] border-green-900/30 hover:border-green-700/40'
              }`}
            >
              {task.done ? (
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-green-700 shrink-0" />
              )}
              <span className="text-lg shrink-0">{task.emoji}</span>
              <span className={`text-sm flex-1 ${task.done ? 'text-green-500/50 line-through' : 'text-green-100'}`}>
                {task.text}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                task.done
                  ? 'bg-green-900/30 text-green-500/50'
                  : 'bg-green-900/40 text-green-400/70'
              }`}>
                {task.time}
              </span>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActions() {
  const actions = [
    { href: '/plants', label: 'Ajouter une plante', icon: Plus, color: 'bg-green-600/20 text-green-400', emoji: '\uD83C\uDF31' },
    { href: '/garden/planner', label: 'Planifier', icon: CheckCircle2, color: 'bg-yellow-600/20 text-yellow-400', emoji: '\uD83D\uDCCB' },
    { href: '/garden/3d', label: 'Vue 3D', icon: Eye, color: 'bg-cyan-600/20 text-cyan-400', emoji: '\uD83C\uDFAE' },
    { href: '/garden/advisor', label: 'Conseiller IA', icon: Bot, color: 'bg-purple-600/20 text-purple-400', emoji: '\uD83E\uDD16' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {actions.map((action) => (
        <Link key={action.href} href={action.href}>
          <motion.div
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="p-4 rounded-xl bg-[#142A1E] border border-green-900/40 hover:border-green-700/50 transition-all cursor-pointer text-center"
          >
            <span className="text-2xl block mb-2">{action.emoji}</span>
            <span className="text-sm text-green-200 font-medium">{action.label}</span>
          </motion.div>
        </Link>
      ))}
    </div>
  );
}

function RecentActivity() {
  const activities = [
    { icon: Sprout, text: 'Jardin cree', time: "Aujourd'hui", color: 'text-green-400', emoji: '\uD83C\uDF31' },
    { icon: Droplets, text: 'Rappel d\'arrosage programme', time: "Aujourd'hui", color: 'text-blue-400', emoji: '\uD83D\uDCA7' },
    { icon: TreeDeciduous, text: 'Encyclopedie consultee', time: 'Hier', color: 'text-emerald-400', emoji: '\uD83D\uDCDA' },
    { icon: Eye, text: 'Jardin 3D visite', time: 'Hier', color: 'text-cyan-400', emoji: '\uD83C\uDFAE' },
  ];

  return (
    <Card>
      <CardTitle className="flex items-center justify-between mb-4">
        <span className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-green-400" />
          Activite recente
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
              <span className="text-base">{activity.emoji}</span>
              <span className="text-sm text-green-200 flex-1">{activity.text}</span>
              <span className="text-xs text-green-500/40">{activity.time}</span>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

const plantEmojis: Record<string, string> = {
  tomato: '\uD83C\uDF45',
  carrot: '\uD83E\uDD55',
  pepper: '\uD83C\uDF36\uFE0F',
  corn: '\uD83C\uDF3D',
  lettuce: '\uD83E\uDD6C',
  strawberry: '\uD83C\uDF53',
  potato: '\uD83E\uDD54',
  onion: '\uD83E\uDDC5',
  garlic: '\uD83E\uDDC4',
  broccoli: '\uD83E\uDD66',
  eggplant: '\uD83C\uDF46',
  cucumber: '\uD83E\uDD52',
  default: '\uD83C\uDF3F',
};

function getPlantEmoji(id: string): string {
  for (const [key, emoji] of Object.entries(plantEmojis)) {
    if (id.includes(key)) return emoji;
  }
  return plantEmojis.default;
}

export function DashboardPageClient() {
  const { data: session } = useSession();
  const { config, isLoaded, addPlant, removePlant } = useGarden();
  const [tip, setTip] = useState('');

  const recommended = isLoaded ? getRecommendedPlants(config) : [];
  const currentMonth = new Date().getMonth() + 1;
  const season = getSeasonInfo();

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

  return (
    <div className="min-h-screen bg-[#0D1F17] py-8 px-6">
      <div className="max-w-7xl mx-auto flex gap-8">
        <Sidebar />

        <div className="flex-1 min-w-0">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
          >
            <div>
              <h1 className="text-3xl font-bold text-green-50 mb-1 flex items-center gap-3">
                {session?.user?.name ? `Bonjour, ${session.user.name}` : 'Mon Jardin'}
                <span className="text-2xl">{season.emoji}</span>
              </h1>
              <p className="text-green-300/60">
                {config.length}m x {config.width}m |{' '}
                {SOIL_LABELS[config.soilType]} |{' '}
                {CLIMATE_LABELS[config.climateZone]} |{' '}
                {SUN_LABELS[config.sunExposure]}
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/garden/3d">
                <Button variant="secondary" className="gap-2">
                  <Eye className="w-4 h-4" />
                  Vue 3D
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats cards */}
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
              className="p-5 rounded-xl bg-gradient-to-br from-green-900/40 to-green-900/10 border border-green-800/30"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-green-600/20 flex items-center justify-center text-2xl">
                  {'\uD83C\uDF31'}
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-50">{plantedPlants.length}</p>
                  <p className="text-xs text-green-500/50">Plantes en culture</p>
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
                <div className="w-12 h-12 rounded-xl bg-yellow-600/20 flex items-center justify-center text-2xl">
                  {'\u2705'}
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-50">3</p>
                  <p className="text-xs text-green-500/50">Taches aujourd'hui</p>
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
                <div className="w-12 h-12 rounded-xl bg-cyan-600/20 flex items-center justify-center text-2xl">
                  {season.emoji}
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-50">{plantableThisMonth.length}</p>
                  <p className="text-xs text-green-500/50">A planter ce mois-ci</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-green-400/60 mb-3 uppercase tracking-wider">Actions rapides</h2>
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
                <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center flex-shrink-0 text-2xl">
                  {'\uD83D\uDCA1'}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-green-300 mb-1">Conseil du jour</h3>
                  <p className="text-green-100">{tip}</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Daily tasks calendar */}
              <DailyTasksCalendar />

              {/* My plants */}
              <Card>
                <div className="flex justify-between items-center mb-4">
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-xl">{'\uD83C\uDF3F'}</span>
                    Mes plantes ({plantedPlants.length})
                  </CardTitle>
                  <Link href="/plants">
                    <Button variant="secondary" size="sm" className="gap-1">
                      <Plus className="w-4 h-4" />
                      Ajouter
                    </Button>
                  </Link>
                </div>
                <CardContent>
                  {plantedPlants.length === 0 ? (
                    <div className="text-center py-8">
                      <span className="text-4xl block mb-3">{'\uD83C\uDF31'}</span>
                      <p className="text-green-500/50 mb-3">Pas encore de plantes. Ajoutez-en pour commencer !</p>
                      <Link href="/plants">
                        <Button variant="outline" size="sm">Parcourir les plantes</Button>
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
                          className="flex items-center justify-between p-3 rounded-xl bg-[#0D1F17] border border-green-900/30 hover:border-green-700/40 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{getPlantEmoji(plant!.id)}</span>
                            <div>
                              <span className="text-green-50 font-medium text-sm">{plant!.name.en}</span>
                              <span className="text-xs text-green-500/50 ml-2">
                                {new Date(item.plantedDate).toLocaleDateString('fr-FR')}
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
                  <span className="text-xl">{'\uD83D\uDCC5'}</span>
                  Calendrier de plantation
                </CardTitle>
                <CardContent>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {MONTH_NAMES.map((name, i) => {
                      const month = i + 1;
                      const isCurrent = month === currentMonth;
                      const monthSeasonEmoji = [3,4,5].includes(month) ? '\uD83C\uDF38' : [6,7,8].includes(month) ? '\u2600\uFE0F' : [9,10,11].includes(month) ? '\uD83C\uDF42' : '\u2744\uFE0F';
                      return (
                        <div
                          key={name}
                          className={`p-3 rounded-xl text-center border transition-all ${
                            isCurrent
                              ? 'border-green-500 bg-green-900/30 shadow-lg shadow-green-900/20'
                              : 'border-green-900/30 bg-[#0D1F17] hover:border-green-800/50'
                          }`}
                        >
                          <span className="text-sm">{monthSeasonEmoji}</span>
                          <span
                            className={`block text-xs font-medium mt-1 ${
                              isCurrent ? 'text-green-300' : 'text-green-500/50'
                            }`}
                          >
                            {name.slice(0, 3)}
                          </span>
                          {isCurrent && (
                            <div className="mt-1">
                              <span className="text-xs text-green-400">{plantableThisMonth.length} plantes</span>
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
                  <span className="text-xl">{'\uD83C\uDF3E'}</span>
                  Recommande pour vous
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
                          className="flex items-center justify-between p-2.5 rounded-xl bg-[#0D1F17] border border-green-900/30 hover:border-green-700/40 transition-all"
                        >
                          <Link
                            href={`/plants/${plant.id}`}
                            className="flex items-center gap-2.5 min-w-0 flex-1"
                          >
                            <span className="text-lg">{getPlantEmoji(plant.id)}</span>
                            <div className="min-w-0">
                              <span className="text-green-50 text-sm font-medium truncate block">
                                {plant.name.en}
                              </span>
                            </div>
                          </Link>
                          {isPlanted ? (
                            <span className="text-xs text-green-500/50 ml-2 shrink-0">Ajoute</span>
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
                      Parcourir toutes les plantes
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
