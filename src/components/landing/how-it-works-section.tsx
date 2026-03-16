'use client';

import { motion } from 'framer-motion';
import { Ruler, Sprout, Eye } from 'lucide-react';

const steps = [
  {
    icon: Ruler,
    emoji: '\uD83C\uDF31',
    step: '1',
    title: 'Configurez votre jardin',
    description: 'Entrez les dimensions, le type de sol, la zone climatique et l\'exposition au soleil. Ca prend moins de 2 minutes !',
    color: 'from-green-500 to-emerald-600',
    bgAccent: 'bg-green-100/60 dark:bg-green-900/30',
  },
  {
    icon: Sprout,
    emoji: '\uD83E\uDD55',
    step: '2',
    title: 'Choisissez vos plantes',
    description: 'Parcourez 300+ plantes avec des recommandations intelligentes basees sur votre jardin. On vous dit ce qui pousse le mieux chez vous.',
    color: 'from-emerald-500 to-teal-600',
    bgAccent: 'bg-emerald-100/60 dark:bg-emerald-900/30',
  },
  {
    icon: Eye,
    emoji: '\uD83C\uDFAE',
    step: '3',
    title: 'Cultivez & visualisez',
    description: 'Regardez votre jardin en 3D, suivez votre calendrier de soins et demandez conseil au jardinier IA quand vous avez besoin d\'aide.',
    color: 'from-teal-500 to-cyan-600',
    bgAccent: 'bg-teal-100/60 dark:bg-teal-900/30',
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-24 md:py-32 px-6 bg-gray-50 dark:bg-gradient-to-b dark:from-[#0D1F17] dark:to-[#0a1a10]">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-100 dark:bg-green-900/40 border border-green-200 dark:border-green-800/30 text-green-700 dark:text-green-400 text-sm font-medium mb-6">
            Comment ca marche
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-green-50 mb-5 tracking-tight">
            Votre jardin en 3 etapes simples
          </h2>
          <p className="text-gray-500 dark:text-green-200/60 text-lg max-w-2xl mx-auto">
            Du semis a la recolte, on rend le jardinage simple et amusant.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 md:gap-12 relative">
          {/* Connection line */}
          <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-px bg-gradient-to-r from-green-300/30 dark:from-green-800/50 via-green-400/40 dark:via-green-600/30 to-green-300/30 dark:to-green-800/50" />

          {steps.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative text-center"
            >
              <div className="relative inline-flex mb-6">
                <motion.div
                  className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg shadow-green-500/10`}
                  whileHover={{ scale: 1.08, rotate: 3 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <span className="text-4xl" role="img">{step.emoji}</span>
                </motion.div>
                <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white dark:bg-[#0D1F17] border-2 border-green-500 flex items-center justify-center text-sm font-bold text-green-600 dark:text-green-400 shadow-sm">
                  {step.step}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-green-50 mb-3">{step.title}</h3>
              <p className="text-gray-500 dark:text-green-200/60 leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
