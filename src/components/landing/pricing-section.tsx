'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Check, Sparkles } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    monthlyPrice: '0',
    yearlyPrice: '0',
    description: 'Perfect for getting started',
    features: [
      'Garden setup & configuration',
      'Plant encyclopedia (300+ plants)',
      'Basic garden planner',
      'Daily gardening tips',
      '1 garden, up to 5 plants',
      '3D garden view',
    ],
    cta: 'Start Growing for Free',
    href: '/auth/register',
    popular: false,
  },
  {
    name: 'Pro',
    monthlyPrice: '9.99',
    yearlyPrice: '7.99',
    description: 'For serious gardeners',
    features: [
      'Everything in Free',
      'AI Garden Advisor (10 questions/day)',
      'Advanced 3D garden view',
      'Unlimited gardens & plants',
      'Companion planting alerts',
      'Export garden plans',
      'Detailed harvest predictions',
      'Priority support',
    ],
    cta: 'Go Pro',
    href: '/auth/register',
    popular: true,
  },
];

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section className="py-24 md:py-32 px-6 bg-gray-50 dark:bg-[#0a1a10]" id="pricing">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-100 dark:bg-green-900/40 border border-green-200 dark:border-green-800/30 text-green-700 dark:text-green-400 text-sm font-medium mb-6">
            Pricing
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-green-50 mb-5 tracking-tight">
            Simple, transparent pricing
          </h2>
          <p className="text-gray-500 dark:text-green-200/60 text-lg max-w-2xl mx-auto mb-10">
            Start free and upgrade when you need more gardens and advanced features.
          </p>

          {/* Monthly/Yearly Toggle */}
          <div className="inline-flex items-center gap-3 p-1.5 rounded-full bg-gray-100 dark:bg-[#142A1E] border border-gray-200 dark:border-green-900/40">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer ${
                !isYearly
                  ? 'bg-white dark:bg-green-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-green-400/60 hover:text-gray-700 dark:hover:text-green-300'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer flex items-center gap-2 ${
                isYearly
                  ? 'bg-white dark:bg-green-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-green-400/60 hover:text-gray-700 dark:hover:text-green-300'
              }`}
            >
              Yearly
              <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 text-xs font-semibold">
                -20%
              </span>
            </button>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, i) => {
            const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`relative rounded-2xl border p-8 transition-all duration-300 ${
                  plan.popular
                    ? 'border-green-400 dark:border-green-500/50 bg-white dark:bg-gradient-to-br dark:from-green-900/40 dark:to-emerald-900/20 shadow-xl shadow-green-100 dark:shadow-green-900/20 scale-[1.02]'
                    : 'border-gray-200 dark:border-green-900/40 bg-white dark:bg-[#142A1E]'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-semibold rounded-full flex items-center gap-1 shadow-lg shadow-green-500/25">
                      <Sparkles className="w-3 h-3" />
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-green-50 mb-1">{plan.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-green-300/60 mb-5">{plan.description}</p>
                  <div className="flex items-baseline gap-1">
                    <motion.span
                      key={price}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-5xl font-bold text-gray-900 dark:text-green-50 tracking-tight"
                    >
                      {price}&euro;
                    </motion.span>
                    <span className="text-gray-400 dark:text-green-400/60 text-sm">
                      /{isYearly ? 'mo, billed yearly' : 'month'}
                    </span>
                  </div>
                  {isYearly && plan.monthlyPrice !== '0' && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-2 font-medium">
                      Save {((parseFloat(plan.monthlyPrice) - parseFloat(plan.yearlyPrice)) * 12).toFixed(0)}&euro; per year
                    </p>
                  )}
                </div>
                <ul className="space-y-3.5 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-green-200/80">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href={plan.href}>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      variant={plan.popular ? 'primary' : 'outline'}
                      className="w-full py-3"
                    >
                      {plan.cta}
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
