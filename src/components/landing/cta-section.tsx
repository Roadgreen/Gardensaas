'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sprout, ArrowRight } from 'lucide-react';

export function CTASection() {
  const t = useTranslations('cta');

  return (
    <section className="py-24 md:py-32 px-6 bg-white dark:bg-[#0D1F17]">
      <div className="max-w-4xl mx-auto text-center relative rounded-3xl overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 rounded-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.1)_0%,_transparent_60%)]" />
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />

        <div className="relative z-10 p-12 md:p-20">
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm mb-8"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <Sprout className="w-8 h-8 text-white" />
          </motion.div>

          <h2 className="text-3xl md:text-5xl font-bold text-white mb-5 tracking-tight">
            {t('title')}
          </h2>
          <p className="text-green-100/80 text-lg mb-10 max-w-xl mx-auto">
            {t('description')}
          </p>

          <Link href="/auth/register">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button size="lg" className="text-lg gap-2 px-10 py-4 bg-white text-green-700 hover:bg-green-50 shadow-xl shadow-green-900/20 border-0">
                {t('button')}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </motion.div>
          </Link>
          <p className="mt-5 text-sm text-green-100/50">
            {t('note')}
          </p>
        </div>
      </div>
    </section>
  );
}
