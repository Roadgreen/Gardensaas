'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { Sprout, Users, Leaf, Star } from 'lucide-react';

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const duration = 2000;
          const startTime = performance.now();
          const step = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, hasAnimated]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}{suffix}
    </span>
  );
}

export function StatsSection() {
  const t = useTranslations('stats');

  const stats = [
    {
      icon: Sprout,
      value: 300,
      suffix: '+',
      labelKey: 'plants' as const,
      descKey: 'plantsDesc' as const,
      color: 'text-green-500',
      bg: 'bg-green-100 dark:bg-green-900/40',
    },
    {
      icon: Users,
      value: 10000,
      suffix: '+',
      labelKey: 'gardeners' as const,
      descKey: 'gardenersDesc' as const,
      color: 'text-blue-500',
      bg: 'bg-blue-100 dark:bg-blue-900/40',
    },
    {
      icon: Leaf,
      value: 50000,
      suffix: '+',
      labelKey: 'grown' as const,
      descKey: 'grownDesc' as const,
      color: 'text-emerald-500',
      bg: 'bg-emerald-100 dark:bg-emerald-900/40',
    },
    {
      icon: Star,
      value: 4.9,
      suffix: '/5',
      labelKey: 'rating' as const,
      descKey: 'ratingDesc' as const,
      color: 'text-amber-500',
      bg: 'bg-amber-100 dark:bg-amber-900/40',
    },
  ];

  return (
    <section className="py-16 md:py-20 px-6 bg-gray-50 dark:bg-gradient-to-b dark:from-[#0D1F17] dark:to-[#0a1a10] relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '32px 32px' }} />

      <div className="max-w-6xl mx-auto relative">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat, i) => (
            <div
              key={stat.labelKey}
              className="text-center group"
            >
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ${stat.bg} mb-4 transition-transform duration-300 group-hover:scale-110`}>
                <stat.icon className={`w-7 h-7 ${stat.color}`} />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-green-50 mb-1 tracking-tight">
                {typeof stat.value === 'number' && stat.value >= 100 ? (
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                ) : (
                  <>{stat.value}{stat.suffix}</>
                )}
              </div>
              <div className="text-sm font-semibold text-gray-700 dark:text-green-200/80 mb-1">
                {t(stat.labelKey)}
              </div>
              <div className="text-xs text-gray-400 dark:text-green-400/50">
                {t(stat.descKey)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
