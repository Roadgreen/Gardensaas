'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import {
  Ruler,
  Sprout,
  Calendar,
  Eye,
  Users,
  Droplets,
} from 'lucide-react';

const features = [
  {
    icon: Ruler,
    title: 'Custom Dimensions',
    description:
      'Input your garden size and shape. Our planner calculates exactly how many plants fit and where they should go.',
  },
  {
    icon: Sprout,
    title: 'Smart Recommendations',
    description:
      'Get personalized plant suggestions based on your soil type, climate zone, and sun exposure.',
  },
  {
    icon: Calendar,
    title: 'Planting Calendar',
    description:
      'Know exactly when to plant, water, and harvest each crop with month-by-month guidance.',
  },
  {
    icon: Eye,
    title: '3D Garden View',
    description:
      'Visualize your garden in a charming 3D view with a little gardener character who gives daily tips.',
  },
  {
    icon: Users,
    title: 'Companion Planting',
    description:
      'Discover which plants thrive together and which ones to keep apart for a healthier garden.',
  },
  {
    icon: Droplets,
    title: 'Care Instructions',
    description:
      'Detailed watering schedules, soil preparation tips, and pest management for every plant.',
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export function Features() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-green-50 mb-4">
            Everything You Need to Grow
          </h2>
          <p className="text-green-200/60 text-lg max-w-2xl mx-auto">
            From planning to harvesting, our tools guide you every step of the way.
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
              <Card hover className="h-full">
                <div className="w-12 h-12 rounded-xl bg-green-900/50 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-green-400" />
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
