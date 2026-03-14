'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Check, Sparkles } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: '0',
    description: 'Perfect for getting started',
    features: [
      'Garden setup & configuration',
      'Plant encyclopedia (150+ plants)',
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
    price: '9.99',
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
  return (
    <section className="py-24 px-6" id="pricing">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-green-900/40 border border-green-800/30 text-green-400 text-sm font-medium mb-4">
            Pricing
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-green-50 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-green-200/60 text-lg max-w-2xl mx-auto">
            Start free and upgrade when you need more gardens and advanced features.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative rounded-2xl border p-8 ${
                plan.popular
                  ? 'border-green-500/50 bg-gradient-to-br from-green-900/40 to-emerald-900/20 shadow-xl shadow-green-900/20'
                  : 'border-green-900/40 bg-[#142A1E]'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 bg-green-600 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Most Popular
                  </span>
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-green-50 mb-1">{plan.name}</h3>
                <p className="text-sm text-green-300/60 mb-4">{plan.description}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-green-50">{plan.price}&euro;</span>
                  <span className="text-green-400/60">/month</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-green-200/80">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href={plan.href}>
                <Button
                  variant={plan.popular ? 'primary' : 'outline'}
                  className="w-full"
                >
                  {plan.cta}
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
