'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Lock, Sparkles, Bug, Leaf, Calendar, FlaskConical } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function AiAdvisorLocked({ onClose }: { onClose: () => void }) {
  const t = useTranslations('advisor');

  const features = [
    {
      icon: Leaf,
      title: t('lockedFeature1Title'),
      description: t('lockedFeature1Desc'),
    },
    {
      icon: Bug,
      title: t('lockedFeature2Title'),
      description: t('lockedFeature2Desc'),
    },
    {
      icon: Calendar,
      title: t('lockedFeature3Title'),
      description: t('lockedFeature3Desc'),
    },
    {
      icon: FlaskConical,
      title: t('lockedFeature4Title'),
      description: t('lockedFeature4Desc'),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[400px] max-h-[70vh] bg-[#0D1F17] border border-green-800/50 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-green-900/80 to-emerald-900/80 px-5 py-4 border-b border-green-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden="true">🌱</span>
            <div>
              <h3 className="text-green-50 font-semibold text-base">
                {t('lockedTitle')}
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-full">
                <Sparkles className="w-3 h-3" />
                PRO
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-green-400/60 hover:text-green-300 transition-colors text-xl leading-none cursor-pointer"
            aria-label={t('lockedClose')}
          >
            &times;
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-green-900/50 border-2 border-green-700/50 flex items-center justify-center">
            <Lock className="w-7 h-7 text-green-400" />
          </div>
        </div>

        <h4 className="text-green-50 text-lg font-semibold text-center mb-2">
          {t('lockedHeading')}
        </h4>
        <p className="text-green-300/60 text-sm text-center mb-5">
          {t('lockedDescription')}
        </p>

        <div className="space-y-3 mb-6">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              className="flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-green-800/40 flex items-center justify-center shrink-0 mt-0.5">
                <feature.icon className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <p className="text-green-100 text-sm font-medium">
                  {feature.title}
                </p>
                <p className="text-green-400/50 text-xs">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <Link href="/pricing">
          <Button variant="primary" size="lg" className="w-full">
            <Sparkles className="w-4 h-4 mr-2" />
            {t('lockedUpgrade')}
          </Button>
        </Link>

        <p className="text-green-500/40 text-xs text-center mt-3">
          {t('lockedIncluded')}
        </p>
      </div>
    </motion.div>
  );
}
