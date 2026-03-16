'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Check, Sparkles } from 'lucide-react';

const plans = [
  {
    key: 'free' as const,
    monthlyPrice: '0',
    yearlyPrice: '0',
    featureKeys: ['f1', 'f2', 'f3', 'f4', 'f5', 'f6'] as const,
    href: '/auth/register',
    popular: false,
  },
  {
    key: 'pro' as const,
    monthlyPrice: '9.99',
    yearlyPrice: '7.99',
    featureKeys: ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8'] as const,
    href: '/auth/register',
    popular: true,
  },
];

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);
  const t = useTranslations('pricing');

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
            {t('badge')}
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-green-50 mb-5 tracking-tight">
            {t('title')}
          </h2>
          <p className="text-gray-500 dark:text-green-200/60 text-lg max-w-2xl mx-auto mb-10">
            {t('subtitle')}
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
              {t('monthly')}
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer flex items-center gap-2 ${
                isYearly
                  ? 'bg-white dark:bg-green-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-green-400/60 hover:text-gray-700 dark:hover:text-green-300'
              }`}
            >
              {t('yearly')}
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
                key={plan.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`relative rounded-2xl border p-8 transition-all duration-300 ${
                  plan.popular
                    ? 'border-green-400 dark:border-green-500/50 bg-gradient-to-br from-white to-green-50/50 dark:from-green-900/40 dark:to-emerald-900/20 shadow-2xl shadow-green-200/40 dark:shadow-green-900/30 scale-[1.03] ring-1 ring-green-200/50 dark:ring-green-600/20'
                    : 'border-gray-200 dark:border-green-900/40 bg-white dark:bg-[#142A1E] hover:border-gray-300 dark:hover:border-green-800/50'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="px-5 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-bold rounded-full flex items-center gap-1.5 shadow-lg shadow-green-500/30 animate-pulse-glow">
                      <Sparkles className="w-4 h-4" />
                      {t('mostPopular')}
                    </span>
                  </div>
                )}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-green-50 mb-1">{t(`${plan.key}.name`)}</h3>
                  <p className="text-sm text-gray-500 dark:text-green-300/60 mb-5">{t(`${plan.key}.description`)}</p>
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
                      {isYearly ? t('perMonthYearly') : t('perMonth')}
                    </span>
                  </div>
                  {isYearly && plan.monthlyPrice !== '0' && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-2 font-medium">
                      {t('savePerYear', { amount: ((parseFloat(plan.monthlyPrice) - parseFloat(plan.yearlyPrice)) * 12).toFixed(0) })}
                    </p>
                  )}
                </div>
                <ul className="space-y-3.5 mb-8">
                  {plan.featureKeys.map((fKey) => (
                    <li key={fKey} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-green-200/80">{t(`${plan.key}.${fKey}`)}</span>
                    </li>
                  ))}
                </ul>
                <Link href={plan.href}>
                  <motion.div whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      variant={plan.popular ? 'primary' : 'outline'}
                      className={`w-full py-3.5 text-base ${plan.popular ? 'shadow-lg shadow-green-600/20' : ''}`}
                    >
                      {t(`${plan.key}.cta`)}
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
