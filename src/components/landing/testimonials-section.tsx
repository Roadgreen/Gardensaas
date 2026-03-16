'use client';

import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Sophie M.',
    role: 'Jardiniere urbaine, Lyon',
    avatar: 'S',
    color: 'bg-pink-500',
    text: "Mon petit balcon est devenu un vrai paradis de legumes ! La vue 3D est adorable et le calendrier me dit exactement quand arroser mes tomates cerises.",
    stars: 5,
    emoji: '\uD83C\uDF45',
  },
  {
    name: 'Thomas K.',
    role: 'Jardinier amateur, Bretagne',
    avatar: 'T',
    color: 'bg-blue-500',
    text: "Le compagnonnage des plantes a sauve mes tomates ! Je ne savais pas que les oeillets d'Inde etaient de si bons voisins. Ma recolte a double cette annee.",
    stars: 5,
    emoji: '\uD83C\uDF3B',
  },
  {
    name: 'Emma L.',
    role: 'Debutante motivee, Paris',
    avatar: 'E',
    color: 'bg-amber-500',
    text: "J'avais peur de me lancer dans le jardinage, mais GardenSaas rend tout ca ludique comme un jeu. Installer mon jardin etait aussi fun qu'une partie d'Animal Crossing !",
    stars: 5,
    emoji: '\uD83C\uDFAE',
  },
  {
    name: 'Marc D.',
    role: 'Responsable jardin partage, Toulouse',
    avatar: 'M',
    color: 'bg-emerald-500',
    text: "On utilise GardenSaas pour planifier nos parcelles communautaires. Le conseiller IA, c'est comme avoir un maitre jardinier disponible 24h/24. Indispensable.",
    stars: 5,
    emoji: '\uD83E\uDDD1\u200D\uD83C\uDF3E',
  },
  {
    name: 'Jade P.',
    role: 'Passionnee de permaculture, Provence',
    avatar: 'J',
    color: 'bg-purple-500',
    text: "Enfin une app qui comprend les types de sol ! Le calendrier de plantation s'est parfaitement adapte a mon climat mediterraneen. Un vrai game changer.",
    stars: 5,
    emoji: '\u2600\uFE0F',
  },
  {
    name: 'Olivier W.',
    role: "Proprietaire d'un potager, Alsace",
    avatar: 'O',
    color: 'bg-cyan-500',
    text: "Les quetes quotidiennes me motivent a aller au jardin tous les jours. 3 mois que je me connecte chaque matin. Mes plantes n'ont jamais ete aussi belles !",
    stars: 5,
    emoji: '\uD83C\uDF3F',
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function TestimonialsSection() {
  return (
    <section className="py-24 md:py-32 px-6 bg-white dark:bg-gradient-to-b dark:from-[#0D1F17] dark:to-[#0a1a10]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-100 dark:bg-green-900/40 border border-green-200 dark:border-green-800/30 text-green-700 dark:text-green-400 text-sm font-medium mb-6">
            Temoignages
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-green-50 mb-5 tracking-tight">
            Adore par 10 000+ jardiniers
          </h2>
          <p className="text-gray-500 dark:text-green-200/60 text-lg max-w-2xl mx-auto">
            Rejoignez une communaute de jardiniers qui planifient mieux et recoltent plus.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {testimonials.map((t) => (
            <motion.div key={t.name} variants={itemVariants}>
              <div className="relative rounded-2xl bg-gray-50 dark:bg-[#142A1E] border border-gray-100 dark:border-green-900/40 p-6 h-full transition-all duration-300 hover:border-green-200 dark:hover:border-green-700/60 hover:shadow-lg hover:shadow-green-100/50 dark:hover:shadow-green-900/20 hover:-translate-y-0.5">
                {/* Quote icon */}
                <Quote className="absolute top-4 right-4 w-8 h-8 text-green-200/20 dark:text-green-800/30" />

                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-full ${t.color} flex items-center justify-center text-white font-bold text-sm relative`}>
                    {t.avatar}
                    <span className="absolute -bottom-1 -right-1 text-base">{t.emoji}</span>
                  </div>
                  <div>
                    <div className="text-gray-900 dark:text-green-50 font-medium text-sm">{t.name}</div>
                    <div className="text-gray-400 dark:text-green-500/50 text-xs">{t.role}</div>
                  </div>
                </div>
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-green-200/70 text-sm leading-relaxed">
                  &laquo; {t.text} &raquo;
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
