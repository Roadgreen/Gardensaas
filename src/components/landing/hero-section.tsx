'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sprout, Leaf, Sun, TreeDeciduous, Flower2, Bug, ArrowRight } from 'lucide-react';

const floatingElements = [
  { icon: Leaf, color: 'text-green-500/30', size: 'w-8 h-8', x: '8%', y: '20%', duration: 6 },
  { icon: Flower2, color: 'text-pink-400/20', size: 'w-10 h-10', x: '85%', y: '15%', duration: 7 },
  { icon: Sun, color: 'text-yellow-400/20', size: 'w-14 h-14', x: '92%', y: '35%', duration: 5 },
  { icon: TreeDeciduous, color: 'text-green-600/15', size: 'w-12 h-12', x: '5%', y: '60%', duration: 8 },
  { icon: Bug, color: 'text-amber-400/15', size: 'w-6 h-6', x: '78%', y: '70%', duration: 4 },
  { icon: Sprout, color: 'text-emerald-400/20', size: 'w-9 h-9', x: '15%', y: '80%', duration: 6.5 },
];

export function HeroSection() {
  return (
    <section className="relative min-h-[calc(100svh-72px)] flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#071510] via-[#0D1F17] to-[#0D1F17]">
      {/* Starfield dots */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={`star-${i}`}
            className="absolute w-1 h-1 rounded-full bg-green-300/15"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{ opacity: [0.05, 0.4, 0.05] }}
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
            rotate: [0, 6, -6, 0],
          }}
          transition={{ duration: el.duration, repeat: Infinity, delay: i * 0.4 }}
        >
          <el.icon className={el.size} />
        </motion.div>
      ))}

      {/* Central glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full bg-green-900/15 blur-3xl pointer-events-none" />

      {/* Ground gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-green-950/50 to-transparent" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center py-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-green-900/40 border border-green-700/30 mb-8"
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
              Your Smart Garden Companion
            </span>
          </motion.div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-green-50 mb-6 leading-tight tracking-tight">
            Create Your
            <motion.span
              className="block text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-300 to-lime-300"
              animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
              transition={{ duration: 5, repeat: Infinity }}
              style={{ backgroundSize: '200% 200%' }}
            >
              Dream Garden
            </motion.span>
          </h1>

          <p className="text-lg md:text-xl text-green-200/60 mb-10 max-w-2xl mx-auto leading-relaxed">
            Plan, visualize in 3D, and grow with personalized AI advice.
            150+ plants, companion planting, seasonal calendars, and a virtual gardener
            who knows your soil, climate, and plants.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/auth/register">
              <Button size="lg" className="w-full sm:w-auto text-lg gap-2 bg-green-600 hover:bg-green-500 text-white px-8">
                <Sprout className="w-5 h-5" />
                Start Growing for Free
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg gap-2 border-green-700 text-green-300 hover:bg-green-900/40">
                See How It Works
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>

          {/* Trust badges */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-green-400/40 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500/60" />
              150+ Plants
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500/60" />
              Interactive 3D View
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500/60" />
              AI Garden Advisor
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500/60" />
              Free to Start
            </span>
          </motion.div>
        </motion.div>
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
