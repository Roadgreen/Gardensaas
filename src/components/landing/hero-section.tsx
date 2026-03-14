'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sprout, Leaf, Sun, TreeDeciduous, Flower2, Bug, Gamepad2, Heart, Sparkles } from 'lucide-react';
import { GardenerGuide } from './gardener-guide';

const MiniGardenPreview = dynamic(
  () => import('./mini-garden-preview').then((m) => ({ default: m.MiniGardenPreview })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[300px] md:h-[350px] rounded-2xl bg-green-900/20 border border-green-800/30 flex items-center justify-center">
        <div className="animate-pulse text-green-400 text-sm">Loading garden preview...</div>
      </div>
    ),
  }
);

const floatingElements = [
  { icon: Leaf, color: 'text-green-500/30', size: 'w-8 h-8', x: '8%', y: '20%', duration: 6 },
  { icon: Flower2, color: 'text-pink-400/25', size: 'w-10 h-10', x: '85%', y: '15%', duration: 7 },
  { icon: Sun, color: 'text-yellow-400/20', size: 'w-14 h-14', x: '92%', y: '35%', duration: 5 },
  { icon: TreeDeciduous, color: 'text-green-600/20', size: 'w-12 h-12', x: '5%', y: '60%', duration: 8 },
  { icon: Bug, color: 'text-amber-400/20', size: 'w-6 h-6', x: '78%', y: '70%', duration: 4 },
  { icon: Sprout, color: 'text-emerald-400/25', size: 'w-9 h-9', x: '15%', y: '80%', duration: 6.5 },
  { icon: Heart, color: 'text-red-400/15', size: 'w-7 h-7', x: '70%', y: '25%', duration: 5.5 },
  { icon: Sparkles, color: 'text-yellow-300/15', size: 'w-8 h-8', x: '25%', y: '40%', duration: 7.5 },
];

export function HeroSection() {
  return (
    <section className="relative min-h-[calc(100svh-72px)] flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#071510] via-[#0D1F17] to-[#0D1F17]">
      {/* Starfield dots */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(60)].map((_, i) => (
          <motion.div
            key={`star-${i}`}
            className="absolute w-1 h-1 rounded-full bg-green-300/15"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{ opacity: [0.05, 0.5, 0.05], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 2 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 3 }}
          />
        ))}
      </div>

      {/* Floating nature elements */}
      {floatingElements.map((el, i) => (
        <motion.div
          key={i}
          className={`absolute hidden md:block ${el.color}`}
          style={{ left: el.x, top: el.y }}
          animate={{
            y: [0, -18, 0],
            rotate: [0, 8, -8, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: el.duration, repeat: Infinity, delay: i * 0.4 }}
        >
          <el.icon className={el.size} />
        </motion.div>
      ))}

      {/* Central glow - warmer, more inviting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full bg-gradient-to-br from-green-900/20 via-emerald-900/15 to-yellow-900/10 blur-3xl pointer-events-none" />

      {/* Ground gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-green-950/50 to-transparent" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left column - Text */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            {/* Game-like badge */}
            <motion.div
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-green-900/40 border border-green-700/30 mb-8 animate-pulse-glow"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
            >
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Gamepad2 className="w-5 h-5 text-green-400" />
              </motion.div>
              <span className="text-green-300 font-medium text-sm tracking-wider">
                Your Garden Adventure Awaits
              </span>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-green-50 mb-6 leading-tight tracking-tight">
              Grow Your
              <motion.span
                className="block text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-300 to-lime-300 animate-gradient-flow"
                style={{ backgroundSize: '200% 200%' }}
              >
                Dream Garden
              </motion.span>
            </h1>

            <p className="text-lg md:text-xl text-green-200/60 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Like a game, but for real plants. Plan in 3D, complete daily quests,
              level up your gardener, and grow 150+ vegetables, herbs, and fruits.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
              <Link href="/garden/setup">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button size="lg" className="w-full sm:w-auto text-lg gap-2 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white px-8 shadow-lg shadow-green-900/40 animate-pulse-glow">
                    <Sprout className="w-5 h-5" />
                    Start Your Garden
                  </Button>
                </motion.div>
              </Link>
              <Link href="#features">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg gap-2 border-green-700 text-green-300 hover:bg-green-900/40">
                  <Leaf className="w-5 h-5" />
                  See Features
                </Button>
              </Link>
            </div>

            {/* Trust badges with XP styling */}
            <motion.div
              className="flex flex-wrap items-center justify-center lg:justify-start gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              {[
                { label: '150+ Plants', xp: '+50 XP', icon: Sprout },
                { label: '3D World', xp: '+30 XP', icon: Sparkles },
                { label: 'AI Advisor', xp: '+100 XP', icon: Heart },
                { label: 'Free to Play', xp: 'LVL 1', icon: Gamepad2 },
              ].map((badge) => (
                <motion.span
                  key={badge.label}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-900/30 border border-green-800/30 text-xs game-card cursor-default"
                  whileHover={{ scale: 1.08, borderColor: 'rgba(74, 222, 128, 0.5)' }}
                >
                  <badge.icon className="w-3 h-3 text-green-400" />
                  <span className="text-yellow-400 font-bold">{badge.xp}</span>
                  <span className="text-green-400/60">{badge.label}</span>
                </motion.span>
              ))}
            </motion.div>
          </motion.div>

          {/* Right column - 3D Preview + Gardener */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col items-center gap-6"
          >
            {/* Mini 3D garden preview */}
            <div className="relative w-full">
              <Suspense fallback={
                <div className="w-full h-[300px] md:h-[350px] rounded-2xl bg-green-900/20 border border-green-800/30 flex items-center justify-center">
                  <div className="animate-pulse text-green-400 text-sm">Loading garden preview...</div>
                </div>
              }>
                <MiniGardenPreview />
              </Suspense>
              {/* Game-like label on preview */}
              <motion.div
                className="absolute top-3 left-3 px-3 py-1 rounded-lg bg-black/50 backdrop-blur-sm border border-green-600/30 text-xs text-green-300 flex items-center gap-1.5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
              >
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Live Preview
              </motion.div>
            </div>

            {/* Gardener guide below the preview */}
            <div className="hidden md:block">
              <GardenerGuide />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom terrain silhouette */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <svg viewBox="0 0 1440 120" className="w-full h-16 md:h-24" preserveAspectRatio="none">
          <path
            d="M0,60 C240,20 480,100 720,50 C960,0 1200,80 1440,40 L1440,120 L0,120 Z"
            fill="#0a1a0f"
            opacity="0.6"
          />
          <path
            d="M0,80 C360,40 720,110 1080,60 C1260,40 1380,70 1440,60 L1440,120 L0,120 Z"
            fill="#0D1F17"
          />
        </svg>
      </div>
    </section>
  );
}
