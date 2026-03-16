'use client';

import { motion } from 'framer-motion';
import { Ruler, Sprout, Eye } from 'lucide-react';

const steps = [
  {
    icon: Ruler,
    step: '1',
    title: 'Set Up Your Garden',
    description: 'Enter your garden dimensions, soil type, climate zone, and sun exposure. It takes less than 2 minutes.',
    color: 'from-green-500 to-emerald-600',
  },
  {
    icon: Sprout,
    step: '2',
    title: 'Choose Your Plants',
    description: 'Browse 300+ plants with smart recommendations based on your garden. We tell you what grows best for you.',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    icon: Eye,
    step: '3',
    title: 'Grow & Visualize',
    description: 'Watch your garden in 3D, follow your care calendar, and ask the AI advisor when you need expert help.',
    color: 'from-teal-500 to-cyan-600',
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
            How It Works
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-green-50 mb-5 tracking-tight">
            Your garden in 3 simple steps
          </h2>
          <p className="text-gray-500 dark:text-green-200/60 text-lg max-w-2xl mx-auto">
            From setup to harvest, we make gardening simple and fun.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 md:gap-12 relative">
          {/* Connection line */}
          <div className="hidden md:block absolute top-10 left-[20%] right-[20%] h-px bg-gradient-to-r from-green-300/30 dark:from-green-800/50 via-green-400/40 dark:via-green-600/30 to-green-300/30 dark:to-green-800/50" />

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
                <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg shadow-green-500/10`}>
                  <step.icon className="w-9 h-9 text-white" />
                </div>
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
