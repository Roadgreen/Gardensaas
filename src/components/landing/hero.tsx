'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sprout, Leaf, Sun, TreeDeciduous, Flower2, Bug } from 'lucide-react';

const floatingElements = [
  { icon: Leaf, color: 'text-green-500/40', size: 'w-8 h-8', x: '8%', y: '20%', duration: 6 },
  { icon: Flower2, color: 'text-pink-400/30', size: 'w-10 h-10', x: '85%', y: '15%', duration: 7 },
  { icon: Sun, color: 'text-yellow-400/25', size: 'w-14 h-14', x: '92%', y: '35%', duration: 5 },
  { icon: TreeDeciduous, color: 'text-green-600/20', size: 'w-12 h-12', x: '5%', y: '60%', duration: 8 },
  { icon: Bug, color: 'text-amber-400/20', size: 'w-6 h-6', x: '78%', y: '70%', duration: 4 },
  { icon: Sprout, color: 'text-emerald-400/30', size: 'w-9 h-9', x: '15%', y: '80%', duration: 6.5 },
];

export function Hero() {
  return (
    <section className="relative min-h-[calc(100svh-72px)] flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#0a1a10] via-[#0D1F17] to-[#0D1F17]">
      {/* Starfield dots */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(40)].map((_, i) => (
          <motion.div
            key={`star-${i}`}
            className="absolute w-1 h-1 rounded-full bg-green-300/20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{ opacity: [0.1, 0.5, 0.1] }}
            transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 2 }}
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
            y: [0, -15, 0],
            rotate: [0, 5, -5, 0],
          }}
          transition={{ duration: el.duration, repeat: Infinity, delay: i * 0.3 }}
        >
          <el.icon className={el.size} aria-hidden="true" />
        </motion.div>
      ))}

      {/* Ground gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-green-950/50 to-transparent" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center py-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Game-like badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-900/40 border border-green-700/30 mb-8"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
          >
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Sprout className="w-5 h-5 text-green-400" />
            </motion.div>
            <span className="text-green-300 font-medium text-sm tracking-wider">
              Your Virtual Garden Companion
            </span>
          </motion.div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-green-50 mb-4 leading-tight tracking-tight">
            Cultivez Votre
            <motion.span
              className="block text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-300 to-lime-300"
              animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
              transition={{ duration: 5, repeat: Infinity }}
              style={{ backgroundSize: '200% 200%' }}
            >
              Jardin Parfait
            </motion.span>
          </h1>

          <p className="text-lg md:text-xl text-green-200/70 mb-8 max-w-2xl mx-auto leading-relaxed">
            Planifiez, visualisez en 3D comme dans un jeu, et suivez les conseils
            de votre jardinier virtuel. Plus de 150 legumes, herbes et fruits.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <Link href="/garden/setup">
              <Button size="lg" className="w-full sm:w-auto text-lg gap-2 bg-green-600 hover:bg-green-500 text-white">
                <Sprout className="w-5 h-5" />
                Commencer Gratuitement
              </Button>
            </Link>
            <Link href="/plants">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg gap-2 border-green-700 text-green-300 hover:bg-green-900/40">
                <Leaf className="w-5 h-5" />
                Explorer les Plantes
              </Button>
            </Link>
          </div>

          {/* Trust badges */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-4 text-green-400/50 text-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <span className="flex items-center gap-1">✓ 150+ plantes</span>
            <span className="flex items-center gap-1">✓ Vue 3D interactive</span>
            <span className="flex items-center gap-1">✓ IA jardinier</span>
            <span className="flex items-center gap-1">✓ 100% gratuit pour commencer</span>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom terrain silhouette */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <svg viewBox="0 0 1440 120" className="w-full h-16 md:h-24" preserveAspectRatio="none" aria-hidden="true">
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
