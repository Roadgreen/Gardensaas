'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import {
  Sprout,
  Calendar,
  Eye,
  Users,
  Droplets,
  Bot,
  Gamepad2,
  Trophy,
} from 'lucide-react';

const features = [
  {
    icon: Sprout,
    title: 'Smart Plant Recommendations',
    description:
      'Get personalized plant suggestions based on your soil type, climate zone, and sun exposure. Never guess what to grow again.',
    color: 'text-green-400',
    bg: 'bg-green-900/50',
    xp: '+50 XP',
  },
  {
    icon: Eye,
    title: '3D Garden Visualization',
    description:
      'See your garden come alive in a charming 3D world with cute plants, butterflies, and Sprout your gardener companion.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-900/50',
    xp: '+30 XP',
  },
  {
    icon: Bot,
    title: 'AI Garden Advisor',
    description:
      'Your personal gardening expert, available 24/7. Knows your soil, climate, and plants to give tailored advice.',
    color: 'text-lime-400',
    bg: 'bg-lime-900/50',
    pro: true,
    xp: '+100 XP',
  },
  {
    icon: Calendar,
    title: 'Planting Calendar',
    description:
      'Month-by-month guidance on when to plant, water, and harvest each crop for your specific climate.',
    color: 'text-yellow-400',
    bg: 'bg-yellow-900/50',
    xp: '+25 XP',
  },
  {
    icon: Users,
    title: 'Companion Planting',
    description:
      'Discover which plants thrive together and which to keep apart. Maximize your yield with smart pairing.',
    color: 'text-teal-400',
    bg: 'bg-teal-900/50',
    xp: '+40 XP',
  },
  {
    icon: Droplets,
    title: 'Care Instructions',
    description:
      'Detailed watering schedules, soil preparation tips, and organic pest management for every plant.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-900/50',
    xp: '+20 XP',
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

export function FeaturesSection() {
  return (
    <section className="py-24 px-6" id="features">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-900/40 border border-green-800/30 text-green-400 text-sm font-medium mb-4"
            whileInView={{ scale: [0.9, 1] }}
            viewport={{ once: true }}
          >
            <Gamepad2 className="w-4 h-4" />
            Features & Abilities
          </motion.span>
          <h2 className="text-3xl md:text-4xl font-bold text-green-50 mb-4">
            Unlock Your Garden Powers
          </h2>
          <p className="text-green-200/60 text-lg max-w-2xl mx-auto">
            From planning to harvesting, level up your garden skills with every feature.
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
              <Card hover className="h-full relative game-card">
                {feature.pro && (
                  <span className="absolute top-4 right-4 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-full flex items-center gap-1">
                    <Trophy className="w-3 h-3" />
                    PRO
                  </span>
                )}
                {/* XP badge */}
                <span className="absolute top-4 left-4 px-2 py-0.5 bg-yellow-500/10 text-yellow-400 text-xs font-bold rounded-full border border-yellow-600/20">
                  {feature.xp}
                </span>
                <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4 mt-4`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <CardTitle className="mb-3">{feature.title}</CardTitle>
                <CardContent>
                  <p>{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
