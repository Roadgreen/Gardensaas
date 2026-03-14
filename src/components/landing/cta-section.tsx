'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sprout, ArrowRight, Gamepad2, Star } from 'lucide-react';

export function CTASection() {
  return (
    <section className="py-24 px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto text-center relative rounded-3xl overflow-hidden"
      >
        {/* Background with garden gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/60 via-emerald-900/40 to-green-950/60 border border-green-800/30 rounded-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(34,197,94,0.1)_0%,_transparent_60%)]" />

        <div className="relative z-10 p-12 md:p-16">
          {/* Game-like header badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-800/30 border border-green-700/30 mb-6"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Gamepad2 className="w-4 h-4 text-green-400" />
            <span className="text-green-300 text-sm font-medium">New Adventure Unlocked</span>
          </motion.div>

          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-600/20 border border-green-600/30 mb-6"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <Sprout className="w-8 h-8 text-green-400" />
          </motion.div>

          <h2 className="text-3xl md:text-4xl font-bold text-green-50 mb-4">
            Ready to Start Growing?
          </h2>
          <p className="text-green-200/60 text-lg mb-8 max-w-xl mx-auto">
            Join thousands of gardeners who plan smarter, grow better, and harvest more.
            Set up your garden in under 2 minutes.
          </p>

          {/* XP reward teaser */}
          <motion.div
            className="flex flex-wrap justify-center gap-3 mb-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            {['Setup +25 XP', 'First Plant +50 XP', '3D View +30 XP'].map((reward) => (
              <span key={reward} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-600/20 text-xs text-yellow-400 font-medium">
                <Star className="w-3 h-3" />
                {reward}
              </span>
            ))}
          </motion.div>

          <Link href="/auth/register">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button size="lg" className="text-lg gap-2 px-8 animate-pulse-glow">
                Start Growing for Free
                <ArrowRight className="w-5 h-5" />
              </Button>
            </motion.div>
          </Link>
          <p className="mt-4 text-sm text-green-500/40">
            No credit card required. Free forever on the basic plan.
          </p>
        </div>
      </motion.div>
    </section>
  );
}
