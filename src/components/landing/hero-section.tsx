'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Sprout, Leaf, Sun, TreeDeciduous, Flower2, Bug, Heart, Sparkles, ArrowRight, Check } from 'lucide-react';
import { GardenerGuide } from './gardener-guide';

const MiniGardenPreview = dynamic(
  () => import('./mini-garden-preview').then((m) => ({ default: m.MiniGardenPreview })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[220px] sm:h-[300px] md:h-[400px] rounded-3xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 flex items-center justify-center">
        <div className="animate-pulse text-green-500 dark:text-green-400 text-sm">Loading...</div>
      </div>
    ),
  }
);

const floatingElements = [
  { icon: Leaf, color: 'text-green-400/20 dark:text-green-500/30', size: 'w-8 h-8', x: '8%', y: '20%', duration: 6 },
  { icon: Flower2, color: 'text-pink-300/20 dark:text-pink-400/25', size: 'w-10 h-10', x: '85%', y: '15%', duration: 7 },
  { icon: Sun, color: 'text-yellow-400/15 dark:text-yellow-400/20', size: 'w-14 h-14', x: '92%', y: '35%', duration: 5 },
  { icon: TreeDeciduous, color: 'text-green-500/15 dark:text-green-600/20', size: 'w-12 h-12', x: '5%', y: '60%', duration: 8 },
  { icon: Bug, color: 'text-amber-400/15 dark:text-amber-400/20', size: 'w-6 h-6', x: '78%', y: '70%', duration: 4 },
  { icon: Sprout, color: 'text-emerald-400/20 dark:text-emerald-400/25', size: 'w-9 h-9', x: '15%', y: '80%', duration: 6.5 },
  { icon: Heart, color: 'text-red-300/10 dark:text-red-400/15', size: 'w-7 h-7', x: '70%', y: '25%', duration: 5.5 },
  { icon: Sparkles, color: 'text-yellow-300/10 dark:text-yellow-300/15', size: 'w-8 h-8', x: '25%', y: '40%', duration: 7.5 },
];

export function HeroSection() {
  const t = useTranslations('hero');
  return (
    <section className="relative min-h-[calc(100svh-72px)] flex items-start md:items-center justify-center overflow-x-hidden overflow-y-visible bg-gradient-to-br from-green-50 via-emerald-50/50 to-lime-50/30 dark:from-[#071510] dark:via-[#0D1F17] dark:to-[#0D1F17]">
      {/* Subtle background pattern - light mode */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none dark:hidden">
        <div className="absolute top-0 left-1/4 w-[900px] h-[500px] rounded-full bg-gradient-to-br from-green-200/50 via-emerald-100/40 to-transparent blur-3xl" />
        <div className="absolute top-1/3 right-0 w-[700px] h-[500px] rounded-full bg-gradient-to-tl from-lime-100/50 via-green-50/30 to-transparent blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[300px] rounded-full bg-gradient-to-tr from-emerald-100/40 to-transparent blur-3xl" />
      </div>

      {/* Starfield dots - dark mode */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden dark:block">
        {[...Array(40)].map((_, i) => (
          <motion.div
            key={`star-${i}`}
            className="absolute w-1 h-1 rounded-full bg-green-300/15"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{ opacity: [0.05, 0.4, 0.05], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 2 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 3 }}
          />
        ))}
      </div>

      {/* Floating nature elements */}
      {floatingElements.map((el, i) => (
        <motion.div
          key={i}
          className={`absolute hidden lg:block ${el.color}`}
          style={{ left: el.x, top: el.y }}
          animate={{
            y: [0, -14, 0],
            rotate: [0, 5, -5, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{ duration: el.duration, repeat: Infinity, delay: i * 0.4 }}
        >
          <el.icon className={el.size} />
        </motion.div>
      ))}

      {/* Central glow - dark mode */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full bg-gradient-to-br from-green-900/20 via-emerald-900/15 to-yellow-900/10 blur-3xl pointer-events-none hidden dark:block" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-16 md:pt-16 md:pb-28">
        <div className="grid lg:grid-cols-2 gap-5 sm:gap-8 lg:gap-16 items-center">
          {/* Left column - Text */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/40 border border-green-200 dark:border-green-700/30 mb-4 md:mb-8"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
            >
              <Sprout className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-green-700 dark:text-green-300 font-medium text-sm">
                {t('badge')}
              </span>
            </motion.div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[5.5rem] font-bold mb-3 sm:mb-7 leading-[1.18] sm:leading-[1.08] tracking-tight">
              <span className="text-gray-900 dark:text-green-50">{t('title1')}</span>
              <span className="block text-gradient animate-gradient-flow mt-1" style={{ backgroundSize: '200% 200%' }}>
                {t('title2')}
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-green-200/60 mb-4 sm:mb-12 max-w-[calc(100vw-2rem)] sm:max-w-xl mx-auto lg:mx-0 leading-relaxed">
              {t('description')}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 justify-center lg:justify-start mb-4 sm:mb-12">
              <Link href="/garden/setup" className="w-full sm:w-auto">
                <motion.div
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Button size="lg" className="w-full sm:w-auto text-lg gap-2.5 px-10 py-5 shadow-xl shadow-green-600/25">
                    <Sprout className="w-5 h-5" />
                    {t('cta')}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </motion.div>
              </Link>
              <Link href="#features" className="w-full sm:w-auto">
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg gap-2 px-8 py-5">
                    {t('seeFeatures')}
                  </Button>
                </motion.div>
              </Link>
            </div>

            {/* Trust signals */}
            <motion.div
              className="flex flex-wrap items-center justify-center lg:justify-start gap-x-3 sm:gap-x-6 gap-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              {[
                t('trust1'),
                t('trust2'),
                t('trust3'),
                t('trust4'),
              ].map((item) => (
                <span key={item} className="flex items-center gap-2 text-sm text-gray-500 dark:text-green-400/60">
                  <Check className="w-4 h-4 text-green-500 dark:text-green-400" />
                  {item}
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* Right column - 3D Preview + Gardener */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col items-center gap-6"
          >
            {/* Mini 3D garden preview */}
            <div className="relative w-full">
              <div className="absolute -inset-4 bg-gradient-to-r from-green-200/30 via-emerald-200/20 to-lime-200/30 dark:from-green-600/10 dark:via-emerald-600/5 dark:to-lime-600/10 rounded-[2rem] blur-xl pointer-events-none" />
              <Suspense fallback={
                <div className="w-full h-[220px] sm:h-[300px] md:h-[400px] rounded-3xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 flex items-center justify-center">
                  <div className="animate-pulse text-green-500 dark:text-green-400 text-sm">Loading...</div>
                </div>
              }>
                <MiniGardenPreview />
              </Suspense>
              {/* Live badge */}
              <motion.div
                className="absolute top-4 left-4 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-black/50 backdrop-blur-sm border border-green-200 dark:border-green-600/30 text-xs text-green-700 dark:text-green-300 flex items-center gap-2 shadow-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
              >
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                {t('livePreview')}
              </motion.div>
            </div>

            {/* Gardener guide below the preview */}
            <div className="hidden md:block">
              <GardenerGuide />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom wave divider */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <svg viewBox="0 0 1440 80" className="w-full h-12 md:h-20" preserveAspectRatio="none">
          <path
            d="M0,40 C360,10 720,70 1080,30 C1260,15 1380,45 1440,35 L1440,80 L0,80 Z"
            className="fill-white dark:fill-[#0D1F17]"
          />
        </svg>
      </div>
    </section>
  );
}
