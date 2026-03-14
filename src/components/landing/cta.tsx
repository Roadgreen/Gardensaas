'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function CTA() {
  return (
    <section className="py-24 px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto text-center rounded-3xl bg-gradient-to-br from-green-900/60 to-green-950/60 border border-green-800/30 p-12 md:p-16"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-green-50 mb-4">
          Ready to Start Growing?
        </h2>
        <p className="text-green-200/60 text-lg mb-8 max-w-xl mx-auto">
          Set up your garden in minutes and get a personalized plan for a thriving vegetable garden.
        </p>
        <Link href="/garden/setup">
          <Button size="lg" className="text-lg gap-2">
            Create Your Garden
            <ArrowRight className="w-5 h-5" />
          </Button>
        </Link>
      </motion.div>
    </section>
  );
}
