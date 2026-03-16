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
    title: 'Smart Plant Recommendations',
    description:
      'Get personalized plant suggestions based on your soil type, climate zone, and sun exposure.',
    iconColor: 'text-green-600 dark:text-green-400',
    iconBg: 'bg-green-100 dark:bg-green-900/50',
  },
  {
    icon: Eye,
    title: '3D Garden Visualization',
    description:
      'See your garden come alive in a charming 3D world with cute plants and your gardener companion.',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
  },
  {
    icon: Bot,
    title: 'AI Garden Advisor',
    description:
      'Your personal gardening expert, available 24/7. Tailored advice for your specific garden.',
    iconColor: 'text-violet-600 dark:text-violet-400',
    iconBg: 'bg-violet-100 dark:bg-violet-900/50',
    pro: true,
  },
  {
    icon: Calendar,
    title: 'Planting Calendar',
    description:
      'Month-by-month guidance on when to plant, water, and harvest each crop for your climate.',
    iconColor: 'text-amber-600 dark:text-yellow-400',
    iconBg: 'bg-amber-100 dark:bg-yellow-900/50',
  },
  {
    icon: Users,
    title: 'Companion Planting',
    description:
      'Discover which plants thrive together and which to keep apart. Maximize your yield.',
    iconColor: 'text-teal-600 dark:text-teal-400',
    iconBg: 'bg-teal-100 dark:bg-teal-900/50',
  },
  {
    icon: Droplets,
    title: 'Care Instructions',
    description:
      'Detailed watering schedules, soil preparation tips, and organic pest management.',
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
            Features
          </motion.span>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-green-50 mb-5 tracking-tight">
            Everything you need to grow
          </h2>
          <p className="text-gray-500 dark:text-green-200/60 text-lg max-w-2xl mx-auto">
            From planning to harvesting, powerful tools designed to make gardening simple and rewarding.
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
                <div className={`w-12 h-12 rounded-2xl ${feature.iconBg} flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110`}>
                  <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
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
