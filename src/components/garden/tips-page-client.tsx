'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardTitle, CardContent } from '@/components/ui/card';
import bioIntensiveData from '@/data/bio-intensive.json';
import {
  Lightbulb,
  ArrowLeft,
  Calendar,
  Leaf,
  Droplets,
  Bug,
  Recycle,
  Sprout,
  Sun,
  Snowflake,
  Flower2,
  TreeDeciduous,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Scissors,
  Shovel,
  Heart,
} from 'lucide-react';
import { MONTH_NAMES } from '@/types';

type Season = 'spring' | 'summer' | 'autumn' | 'winter';

const SEASON_CONFIG: Record<Season, { label: string; labelFr: string; icon: typeof Sun; months: number[]; color: string; bg: string }> = {
  spring: { label: 'Spring', labelFr: 'Printemps', icon: Flower2, months: [3, 4, 5], color: 'text-green-400', bg: 'bg-green-900/30' },
  summer: { label: 'Summer', labelFr: 'Été', icon: Sun, months: [6, 7, 8], color: 'text-yellow-400', bg: 'bg-yellow-900/30' },
  autumn: { label: 'Autumn', labelFr: 'Automne', icon: TreeDeciduous, months: [9, 10, 11], color: 'text-orange-400', bg: 'bg-orange-900/30' },
  winter: { label: 'Winter', labelFr: 'Hiver', icon: Snowflake, months: [12, 1, 2], color: 'text-blue-400', bg: 'bg-blue-900/30' },
};

const CATEGORIES = [
  { id: 'all', label: 'All Tips', icon: Lightbulb },
  { id: 'planting', label: 'Planting', icon: Sprout },
  { id: 'watering', label: 'Watering', icon: Droplets },
  { id: 'pests', label: 'Pest Control', icon: Bug },
  { id: 'soil', label: 'Soil Care', icon: Shovel },
  { id: 'harvest', label: 'Harvest', icon: Scissors },
  { id: 'companion', label: 'Companions', icon: Heart },
  { id: 'rotation', label: 'Rotation', icon: Recycle },
];

function getCurrentSeason(): Season {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

function getSeasonalTips(season: Season): { en: string; fr: string; category: string }[] {
  const tips: { en: string; fr: string; category: string }[] = [];
  const data = bioIntensiveData as Record<string, unknown>;
  const tipsData = data.tips as { monthly?: Record<string, { en: string; fr: string }[]>; seasonal?: Record<string, { en: string; fr: string }[]> } | undefined;

  if (tipsData?.seasonal) {
    const seasonalTips = tipsData.seasonal[season];
    if (seasonalTips) {
      seasonalTips.forEach((tip: { en: string; fr: string }) => {
        tips.push({ ...tip, category: 'planting' });
      });
    }
  }

  return tips;
}

function getMonthlyTips(month: number): { en: string; fr: string }[] {
  const data = bioIntensiveData as Record<string, unknown>;
  const tipsData = data.tips as { monthly?: Record<string, { en: string; fr: string }[]> } | undefined;

  if (tipsData?.monthly) {
    return tipsData.monthly[String(month)] || [];
  }
  return [];
}

const EXTRA_SEASONAL_ADVICE: Record<Season, { en: string; fr: string; category: string }[]> = {
  spring: [
    { en: 'Start hardening off seedlings 1-2 weeks before transplanting outdoors.', fr: 'Commencez à endurcir les semis 1-2 semaines avant le repiquage en extérieur.', category: 'planting' },
    { en: 'Direct sow cool-season crops: peas, spinach, radishes, and lettuce.', fr: 'Semez directement les cultures de saison fraîche : pois, épinards, radis et laitue.', category: 'planting' },
    { en: 'Apply compost to beds before planting - 5cm layer worked into the top 15cm.', fr: 'Appliquez du compost sur les planches avant la plantation - couche de 5cm incorporée sur 15cm.', category: 'soil' },
    { en: 'Check for slug damage on emerging seedlings - use beer traps or copper barriers.', fr: 'Vérifiez les dégâts de limaces sur les jeunes pousses - utilisez des pièges à bière ou des barrières de cuivre.', category: 'pests' },
    { en: 'Set up drip irrigation lines before the season gets busy.', fr: 'Installez les lignes d\'irrigation goutte-à-goutte avant que la saison ne devienne chargée.', category: 'watering' },
    { en: 'Plant companion flowers like marigolds and nasturtiums alongside vegetables.', fr: 'Plantez des fleurs compagnes comme les œillets d\'Inde et les capucines aux côtés des légumes.', category: 'companion' },
    { en: 'Double-dig new beds now while soil is moist but not waterlogged.', fr: 'Effectuez le double bêchage des nouvelles planches maintenant pendant que le sol est humide mais pas détrempé.', category: 'soil' },
    { en: 'Sow green manure in any beds that won\'t be used until summer.', fr: 'Semez de l\'engrais vert dans les planches qui ne seront pas utilisées avant l\'été.', category: 'rotation' },
  ],
  summer: [
    { en: 'Water deeply but less frequently to encourage deep root growth.', fr: 'Arrosez en profondeur mais moins souvent pour encourager l\'enracinement profond.', category: 'watering' },
    { en: 'Mulch heavily (10-15cm) to keep soil cool and retain moisture during heat waves.', fr: 'Paillez abondamment (10-15cm) pour garder le sol frais et retenir l\'humidité pendant les canicules.', category: 'watering' },
    { en: 'Harvest zucchini and beans every 2-3 days to encourage continued production.', fr: 'Récoltez courgettes et haricots tous les 2-3 jours pour encourager la production continue.', category: 'harvest' },
    { en: 'Pinch off tomato suckers in the leaf axils for better fruit production.', fr: 'Pincez les gourmands de tomates dans les aisselles des feuilles pour une meilleure production.', category: 'harvest' },
    { en: 'Watch for powdery mildew on cucurbits - spray diluted milk (1:9) preventively.', fr: 'Surveillez l\'oïdium sur les cucurbitacées - pulvérisez du lait dilué (1:9) préventivement.', category: 'pests' },
    { en: 'Sow fall crops now: broccoli, cabbage, kale, and brussels sprouts starts.', fr: 'Semez les cultures d\'automne maintenant : brocoli, chou, chou frisé et choux de Bruxelles.', category: 'planting' },
    { en: 'Companion plant basil next to tomatoes to repel aphids and improve flavor.', fr: 'Plantez du basilic à côté des tomates pour repousser les pucerons et améliorer la saveur.', category: 'companion' },
    { en: 'Start saving seeds from your best performing heritage varieties.', fr: 'Commencez à récolter les graines de vos meilleures variétés patrimoniales.', category: 'harvest' },
    { en: 'Water in the early morning to reduce evaporation and fungal disease risk.', fr: 'Arrosez tôt le matin pour réduire l\'évaporation et le risque de maladies fongiques.', category: 'watering' },
    { en: 'Use floating row covers to protect brassicas from cabbage white butterflies.', fr: 'Utilisez des voiles de forçage pour protéger les brassicacées des piérides du chou.', category: 'pests' },
  ],
  autumn: [
    { en: 'Plant garlic cloves 15cm deep before the first frost for a summer harvest.', fr: 'Plantez les gousses d\'ail à 15cm de profondeur avant les premières gelées pour une récolte estivale.', category: 'planting' },
    { en: 'Collect fallen leaves for leaf mold - nature\'s best soil conditioner.', fr: 'Ramassez les feuilles mortes pour le terreau de feuilles - le meilleur amendement naturel.', category: 'soil' },
    { en: 'Sow winter green manures: field beans, winter rye, crimson clover.', fr: 'Semez les engrais verts d\'hiver : féveroles, seigle d\'hiver, trèfle incarnat.', category: 'rotation' },
    { en: 'Clean and oil garden tools before storing them for winter.', fr: 'Nettoyez et huilez les outils de jardin avant de les ranger pour l\'hiver.', category: 'soil' },
    { en: 'Harvest root vegetables before hard freezes: carrots, beets, turnips, parsnips.', fr: 'Récoltez les légumes-racines avant les fortes gelées : carottes, betteraves, navets, panais.', category: 'harvest' },
    { en: 'Apply thick mulch around perennial herbs and berry bushes for frost protection.', fr: 'Appliquez un paillis épais autour des herbes vivaces et des buissons de baies pour la protection contre le gel.', category: 'watering' },
    { en: 'Start a hot compost pile with all the garden debris and fallen leaves.', fr: 'Démarrez un compost chaud avec tous les débris du jardin et les feuilles mortes.', category: 'soil' },
    { en: 'Note which companion planting combinations worked best this year.', fr: 'Notez quelles combinaisons de plantes compagnes ont le mieux fonctionné cette année.', category: 'companion' },
  ],
  winter: [
    { en: 'Plan your crop rotation for next year using a 4-year cycle.', fr: 'Planifiez votre rotation des cultures pour l\'année prochaine avec un cycle de 4 ans.', category: 'rotation' },
    { en: 'Order seeds early - popular heritage varieties sell out fast.', fr: 'Commandez vos graines tôt - les variétés patrimoniales populaires se vendent vite.', category: 'planting' },
    { en: 'Build or repair raised beds and cold frames during the quiet season.', fr: 'Construisez ou réparez les planches surélevées et les châssis froids pendant la saison calme.', category: 'soil' },
    { en: 'Start early sowings indoors under grow lights: peppers, eggplant, onions.', fr: 'Démarrez les semis précoces en intérieur sous lumières : poivrons, aubergines, oignons.', category: 'planting' },
    { en: 'Check stored vegetables and remove any that show signs of rot.', fr: 'Vérifiez les légumes stockés et retirez ceux qui montrent des signes de pourriture.', category: 'harvest' },
    { en: 'Study companion planting charts and plan beneficial pairings for spring.', fr: 'Étudiez les tableaux de plantes compagnes et planifiez les associations bénéfiques pour le printemps.', category: 'companion' },
    { en: 'Test your soil pH and amend with lime or sulfur as needed before spring.', fr: 'Testez le pH de votre sol et amendez avec de la chaux ou du soufre si nécessaire avant le printemps.', category: 'soil' },
    { en: 'Turn your compost pile on mild days to keep decomposition active.', fr: 'Retournez votre compost les jours doux pour maintenir la décomposition active.', category: 'soil' },
  ],
};

const PEST_CONTROL_RECIPES = [
  {
    name: { en: 'Garlic & Chili Spray', fr: 'Spray Ail & Piment' },
    targets: { en: 'Aphids, whiteflies, spider mites', fr: 'Pucerons, mouches blanches, acariens' },
    recipe: { en: 'Blend 5 garlic cloves + 2 hot peppers in 1L water. Strain and add 1 tsp dish soap. Spray on affected plants.', fr: 'Mixez 5 gousses d\'ail + 2 piments forts dans 1L d\'eau. Filtrez et ajoutez 1 cc de savon. Pulvérisez sur les plantes affectées.' },
  },
  {
    name: { en: 'Neem Oil Solution', fr: 'Solution d\'Huile de Neem' },
    targets: { en: 'Aphids, caterpillars, fungal diseases', fr: 'Pucerons, chenilles, maladies fongiques' },
    recipe: { en: 'Mix 5ml neem oil + 2ml dish soap in 1L warm water. Spray weekly in the evening.', fr: 'Mélangez 5ml d\'huile de neem + 2ml de savon dans 1L d\'eau tiède. Pulvérisez chaque semaine le soir.' },
  },
  {
    name: { en: 'Baking Soda Fungicide', fr: 'Fongicide au Bicarbonate' },
    targets: { en: 'Powdery mildew, black spot', fr: 'Oïdium, taches noires' },
    recipe: { en: 'Mix 1 tbsp baking soda + 1 tsp soap + 1 tbsp vegetable oil in 4L water. Spray preventively every 7-10 days.', fr: 'Mélangez 1 cs de bicarbonate + 1 cc de savon + 1 cs d\'huile végétale dans 4L d\'eau. Pulvérisez préventivement tous les 7-10 jours.' },
  },
  {
    name: { en: 'Beer Slug Trap', fr: 'Piège à Limaces à la Bière' },
    targets: { en: 'Slugs and snails', fr: 'Limaces et escargots' },
    recipe: { en: 'Bury a container at soil level, fill with beer. Slugs are attracted and fall in. Replace every 2-3 days.', fr: 'Enterrez un récipient au niveau du sol, remplissez de bière. Les limaces sont attirées et tombent. Remplacez tous les 2-3 jours.' },
  },
  {
    name: { en: 'Nettle Fertilizer Tea', fr: 'Purin d\'Ortie' },
    targets: { en: 'General fertilizer + aphid repellent', fr: 'Engrais général + répulsif contre les pucerons' },
    recipe: { en: 'Soak 1kg nettles in 10L water for 2 weeks, stirring daily. Dilute 1:10 for watering, 1:20 for foliar spray.', fr: 'Faites macérer 1kg d\'orties dans 10L d\'eau pendant 2 semaines en remuant chaque jour. Diluez 1:10 pour l\'arrosage, 1:20 en pulvérisation foliaire.' },
  },
  {
    name: { en: 'Horsetail Decoction', fr: 'Décoction de Prêle' },
    targets: { en: 'Fungal diseases, strengthens plants', fr: 'Maladies fongiques, renforce les plantes' },
    recipe: { en: 'Simmer 100g dried horsetail in 5L water for 30 min. Strain, dilute 1:5. Spray every 2 weeks.', fr: 'Faites bouillir doucement 100g de prêle séchée dans 5L d\'eau pendant 30 min. Filtrez, diluez 1:5. Pulvérisez toutes les 2 semaines.' },
  },
];

const ROTATION_GUIDE = [
  { year: 1, group: { en: 'Legumes (Soil Builders)', fr: 'Légumineuses (Constructeurs de sol)' }, plants: { en: 'Peas, beans, broad beans, lentils', fr: 'Pois, haricots, fèves, lentilles' }, color: 'text-green-400', bg: 'bg-green-900/30' },
  { year: 2, group: { en: 'Brassicas (Leaf Crops)', fr: 'Brassicacées (Cultures feuillues)' }, plants: { en: 'Cabbage, broccoli, kale, cauliflower', fr: 'Chou, brocoli, chou frisé, chou-fleur' }, color: 'text-blue-400', bg: 'bg-blue-900/30' },
  { year: 3, group: { en: 'Solanaceae & Cucurbits (Fruit Crops)', fr: 'Solanacées & Cucurbitacées (Fruits)' }, plants: { en: 'Tomato, pepper, squash, cucumber', fr: 'Tomate, poivron, courge, concombre' }, color: 'text-red-400', bg: 'bg-red-900/30' },
  { year: 4, group: { en: 'Roots & Alliums', fr: 'Racines & Alliacées' }, plants: { en: 'Carrot, onion, garlic, beet, turnip', fr: 'Carotte, oignon, ail, betterave, navet' }, color: 'text-orange-400', bg: 'bg-orange-900/30' },
];

export function TipsPageClient() {
  const currentMonth = new Date().getMonth() + 1;
  const currentSeason = getCurrentSeason();

  const [selectedSeason, setSelectedSeason] = useState<Season>(currentSeason);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [activeTab, setActiveTab] = useState<'seasonal' | 'monthly' | 'pests' | 'rotation'>('seasonal');

  const seasonConfig = SEASON_CONFIG[selectedSeason];
  const SeasonIcon = seasonConfig.icon;

  const allTips = useMemo(() => {
    const fromData = getSeasonalTips(selectedSeason);
    const extras = EXTRA_SEASONAL_ADVICE[selectedSeason];
    return [...fromData, ...extras];
  }, [selectedSeason]);

  const filteredTips = useMemo(() => {
    if (selectedCategory === 'all') return allTips;
    return allTips.filter((t) => t.category === selectedCategory);
  }, [allTips, selectedCategory]);

  const monthlyTips = useMemo(() => getMonthlyTips(selectedMonth), [selectedMonth]);

  return (
    <div className="min-h-screen bg-[#0D1F17] py-8 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/garden/dashboard">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-green-50 flex items-center gap-3">
              <Lightbulb className="w-8 h-8 text-yellow-400" />
              Garden Tips & Bio-Intensive Guide
            </h1>
            <p className="text-green-300/60 mt-1">
              Seasonal advice, pest control recipes, companion planting, and crop rotation plans
            </p>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'seasonal' as const, label: 'Seasonal Tips', icon: Leaf },
            { id: 'monthly' as const, label: 'Monthly Calendar', icon: Calendar },
            { id: 'pests' as const, label: 'Pest Control', icon: Bug },
            { id: 'rotation' as const, label: 'Crop Rotation', icon: Recycle },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-green-900/40 text-green-300 border border-green-800/30'
                  : 'text-green-400/60 hover:text-green-300 hover:bg-green-900/20 border border-transparent'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Seasonal Tips Tab */}
          {activeTab === 'seasonal' && (
            <motion.div
              key="seasonal"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {/* Season selector */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {(Object.entries(SEASON_CONFIG) as [Season, typeof SEASON_CONFIG[Season]][]).map(([key, config]) => {
                  const Icon = config.icon;
                  const isCurrent = key === currentSeason;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedSeason(key)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer text-center ${
                        selectedSeason === key
                          ? `${config.bg} border-green-700/50 ${config.color}`
                          : 'bg-[#142A1E] border-green-900/40 text-green-500/50 hover:border-green-700/30'
                      }`}
                    >
                      <Icon className={`w-6 h-6 mx-auto mb-2 ${selectedSeason === key ? config.color : ''}`} />
                      <span className="text-sm font-medium">{config.label}</span>
                      {isCurrent && (
                        <span className="block text-xs text-green-500/40 mt-1">(current)</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Category filter */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-green-800/40 text-green-300'
                        : 'bg-[#142A1E] text-green-500/50 hover:text-green-400'
                    }`}
                  >
                    <cat.icon className="w-3.5 h-3.5" />
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Season header */}
              <Card className="mb-6 bg-gradient-to-r from-[#142A1E] to-[#1A3528]">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl ${seasonConfig.bg} flex items-center justify-center`}>
                    <SeasonIcon className={`w-7 h-7 ${seasonConfig.color}`} />
                  </div>
                  <div>
                    <h2 className={`text-xl font-bold ${seasonConfig.color}`}>
                      {seasonConfig.label} / {seasonConfig.labelFr}
                    </h2>
                    <p className="text-green-300/60 text-sm">
                      {seasonConfig.months.map((m) => MONTH_NAMES[m - 1]).join(', ')}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Tips list */}
              <div className="space-y-3">
                {filteredTips.length === 0 ? (
                  <Card>
                    <CardContent>
                      <p className="text-green-500/50 text-center py-8">
                        No tips found for this category. Try selecting &quot;All Tips&quot;.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredTips.map((tip, i) => {
                    const catConfig = CATEGORIES.find((c) => c.id === tip.category) || CATEGORIES[0];
                    const CatIcon = catConfig.icon;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                      >
                        <Card className="hover:border-green-700/50 transition-all">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-green-900/40 flex items-center justify-center shrink-0 mt-0.5">
                              <CatIcon className="w-4 h-4 text-green-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-green-100 text-sm leading-relaxed">{tip.en}</p>
                              <p className="text-green-500/40 text-xs mt-1 leading-relaxed">{tip.fr}</p>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}

          {/* Monthly Calendar Tab */}
          {activeTab === 'monthly' && (
            <motion.div
              key="monthly"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {/* Month selector */}
              <div className="flex items-center justify-between mb-6">
                <Button
                  variant="ghost"
                  onClick={() => setSelectedMonth((m) => (m === 1 ? 12 : m - 1))}
                  className="cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <h2 className={`text-xl font-bold ${selectedMonth === currentMonth ? 'text-green-400' : 'text-green-200'}`}>
                  {MONTH_NAMES[selectedMonth - 1]}
                  {selectedMonth === currentMonth && <span className="ml-2 text-xs text-green-400/60">(current month)</span>}
                </h2>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedMonth((m) => (m === 12 ? 1 : m + 1))}
                  className="cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>

              {/* Month grid for quick navigation */}
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-6">
                {MONTH_NAMES.map((name, i) => {
                  const month = i + 1;
                  return (
                    <button
                      key={name}
                      onClick={() => setSelectedMonth(month)}
                      className={`p-2 rounded-xl text-center border transition-all cursor-pointer ${
                        month === selectedMonth
                          ? 'border-green-500 bg-green-900/30 text-green-300'
                          : month === currentMonth
                            ? 'border-green-700/50 bg-[#142A1E] text-green-400'
                            : 'border-green-900/30 bg-[#0D1F17] text-green-500/50 hover:border-green-800/40'
                      }`}
                    >
                      <span className="text-xs font-medium">{name.slice(0, 3)}</span>
                    </button>
                  );
                })}
              </div>

              {/* Monthly tips */}
              <div className="space-y-3">
                {monthlyTips.length === 0 ? (
                  <Card>
                    <CardContent>
                      <p className="text-green-500/50 text-center py-8">
                        No specific tips available for {MONTH_NAMES[selectedMonth - 1]}.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  monthlyTips.map((tip, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card className="hover:border-green-700/50 transition-all">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-yellow-900/30 flex items-center justify-center shrink-0 mt-0.5">
                            <BookOpen className="w-4 h-4 text-yellow-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-green-100 text-sm leading-relaxed">{tip.en}</p>
                            <p className="text-green-500/40 text-xs mt-1 leading-relaxed">{tip.fr}</p>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* Pest Control Tab */}
          {activeTab === 'pests' && (
            <motion.div
              key="pests"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Card className="mb-6 bg-gradient-to-r from-[#142A1E] to-[#1A3528]">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-red-900/30 flex items-center justify-center">
                    <Bug className="w-7 h-7 text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-red-400">Natural Pest Control Recipes</h2>
                    <p className="text-green-300/60 text-sm">Organic solutions for common garden pests</p>
                  </div>
                </div>
              </Card>

              <div className="space-y-4">
                {PEST_CONTROL_RECIPES.map((recipe, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card>
                      <CardTitle className="flex items-center gap-2 mb-3">
                        <Bug className="w-4 h-4 text-red-400" />
                        <span>{recipe.name.en}</span>
                        <span className="text-green-500/40 text-xs font-normal">/ {recipe.name.fr}</span>
                      </CardTitle>
                      <CardContent>
                        <div className="space-y-2">
                          <div>
                            <span className="text-xs text-green-500/50 uppercase tracking-wider">Targets</span>
                            <p className="text-green-200 text-sm">{recipe.targets.en}</p>
                            <p className="text-green-500/40 text-xs">{recipe.targets.fr}</p>
                          </div>
                          <div className="pt-2 border-t border-green-900/30">
                            <span className="text-xs text-green-500/50 uppercase tracking-wider">Recipe</span>
                            <p className="text-green-100 text-sm mt-1">{recipe.recipe.en}</p>
                            <p className="text-green-500/40 text-xs mt-1">{recipe.recipe.fr}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Crop Rotation Tab */}
          {activeTab === 'rotation' && (
            <motion.div
              key="rotation"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Card className="mb-6 bg-gradient-to-r from-[#142A1E] to-[#1A3528]">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-purple-900/30 flex items-center justify-center">
                    <Recycle className="w-7 h-7 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-purple-400">4-Year Crop Rotation Plan</h2>
                    <p className="text-green-300/60 text-sm">
                      Rotate plant families to prevent disease buildup and maintain soil fertility
                    </p>
                  </div>
                </div>
              </Card>

              <div className="space-y-4">
                {ROTATION_GUIDE.map((year, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card>
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl ${year.bg} flex items-center justify-center shrink-0`}>
                          <span className={`text-xl font-bold ${year.color}`}>{year.year}</span>
                        </div>
                        <div className="flex-1">
                          <h3 className={`font-semibold ${year.color}`}>{year.group.en}</h3>
                          <p className="text-green-500/40 text-xs">{year.group.fr}</p>
                          <p className="text-green-200 text-sm mt-2">{year.plants.en}</p>
                          <p className="text-green-500/40 text-xs mt-0.5">{year.plants.fr}</p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Rotation rules */}
              <Card className="mt-6">
                <CardTitle className="flex items-center gap-2 mb-4">
                  <BookOpen className="w-5 h-5 text-green-400" />
                  Key Rotation Rules
                </CardTitle>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { en: 'Never plant the same family in the same spot two years in a row.', fr: 'Ne plantez jamais la meme famille au meme endroit deux annees de suite.' },
                      { en: 'Follow heavy feeders (tomatoes, corn) with legumes to restore nitrogen.', fr: 'Faites suivre les gros consommateurs (tomates, mais) par des legumineuses pour restaurer l\'azote.' },
                      { en: 'Wait 3-4 years before planting nightshades (Solanaceae) in the same bed.', fr: 'Attendez 3-4 ans avant de replanter des solanacees dans la meme planche.' },
                      { en: 'Root crops are excellent cleaners - they break compaction and use residual fertility.', fr: 'Les legumes-racines sont d\'excellents nettoyeurs - ils cassent le compactage et utilisent la fertilite residuelle.' },
                      { en: 'Always add compost when transitioning between rotation groups.', fr: 'Ajoutez toujours du compost lors de la transition entre les groupes de rotation.' },
                    ].map((rule, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <ChevronRight className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-green-100 text-sm">{rule.en}</p>
                          <p className="text-green-500/40 text-xs">{rule.fr}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
