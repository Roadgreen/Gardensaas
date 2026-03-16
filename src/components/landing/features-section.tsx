'use client';

import { motion } from 'framer-motion';
import {
  Sprout,
  Calendar,
  Eye,
  Users,
  Droplets,
  Bot,
  Sparkles,
  Crown,
} from 'lucide-react';

const features = [
  {
    icon: Sprout,
    emoji: '\uD83C\uDF31',
    title: 'Recommandations intelligentes',
    description:
      'Des suggestions de plantes personnalisees selon votre sol, climat et ensoleillement.',
    iconColor: 'text-green-600 dark:text-green-400',
    iconBg: 'bg-green-100 dark:bg-green-900/50',
  },
  {
    icon: Eye,
    emoji: '\uD83C\uDFAE',
    title: 'Jardin 3D interactif',
    description:
      'Visualisez votre jardin comme dans un jeu video avec un personnage jardinier et des plantes 3D.',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
  },
  {
    icon: Bot,
    emoji: '\uD83E\uDD16',
    title: 'Conseiller IA',
    description:
      'Votre expert jardinage personnel, disponible 24h/24. Des conseils adaptes a votre jardin.',
    iconColor: 'text-violet-600 dark:text-violet-400',
    iconBg: 'bg-violet-100 dark:bg-violet-900/50',
    pro: true,
  },
  {
    icon: Calendar,
    emoji: '\uD83D\uDCC5',
    title: 'Calendrier de plantation',
    description:
      'Un guide mois par mois pour savoir quand semer, arroser et recolter chaque culture.',
    iconColor: 'text-amber-600 dark:text-yellow-400',
    iconBg: 'bg-amber-100 dark:bg-yellow-900/50',
  },
  {
    icon: Users,
    emoji: '\uD83E\uDD1D',
    title: 'Compagnonnage',
    description:
      'Decouvrez quelles plantes s\'entraident et lesquelles eviter de mettre cote a cote.',
    iconColor: 'text-teal-600 dark:text-teal-400',
    iconBg: 'bg-teal-100 dark:bg-teal-900/50',
  },
  {
    icon: Droplets,
    emoji: '\uD83D\uDCA7',
    title: 'Guide d\'entretien',
    description:
      'Calendriers d\'arrosage, preparation du sol et gestion bio des nuisibles.',
    iconColor: 'text-sky-600 dark:text-cyan-400',
    iconBg: 'bg-sky-100 dark:bg-cyan-900/50',
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

export function FeaturesSection() {
  return (
    <section className="py-24 md:py-32 px-6 bg-white dark:bg-[#0D1F17]" id="features">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-100 dark:bg-green-900/40 border border-green-200 dark:border-green-800/30 text-green-700 dark:text-green-400 text-sm font-medium mb-6"
            whileInView={{ scale: [0.9, 1] }}
            viewport={{ once: true }}
          >
            <Sparkles className="w-4 h-4" />
            Fonctionnalites
          </motion.span>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-green-50 mb-5 tracking-tight">
            Tout pour faire pousser vos reves
          </h2>
          <p className="text-gray-500 dark:text-green-200/60 text-lg max-w-2xl mx-auto">
            Du semis a la recolte, des outils puissants pour rendre le jardinage simple et gratifiant.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature) => (
            <motion.div key={feature.title} variants={itemVariants}>
              <div className="relative h-full p-6 rounded-2xl border border-gray-100 dark:border-green-900/40 bg-white dark:bg-[#142A1E] transition-all duration-300 hover:border-green-200 dark:hover:border-green-700/60 hover:shadow-lg hover:shadow-green-100/50 dark:hover:shadow-green-900/20 hover:-translate-y-1 group">
                {feature.pro && (
                  <span className="absolute top-4 right-4 px-2.5 py-1 bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold rounded-full flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    PRO
                  </span>
                )}
                <div className={`w-14 h-14 rounded-2xl ${feature.iconBg} flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110`}>
                  <span className="text-2xl">{feature.emoji}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-green-50 mb-2">{feature.title}</h3>
                <p className="text-gray-500 dark:text-green-200/60 text-sm leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
