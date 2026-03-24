'use client';

import { useTranslations } from 'next-intl';
import { Ruler, Sprout, Eye } from 'lucide-react';

export function HowItWorksSection() {
  const t = useTranslations('howItWorks');

  const steps = [
    {
      icon: Ruler,
      emoji: '\uD83C\uDF31',
      step: '1',
      titleKey: 'step1Title' as const,
      descKey: 'step1Desc' as const,
      color: 'from-green-500 to-emerald-600',
      bgAccent: 'bg-green-100/60 dark:bg-green-900/30',
      illustration: [
        { type: 'rect', x: 20, y: 20, w: 60, h: 40, fill: '#5C3D1E', rx: 4 },
        { type: 'line', x1: 50, y1: 5, x2: 50, y2: 15, stroke: '#4ADE80' },
        { type: 'circle', cx: 50, cy: 5, r: 3, fill: '#FFD700' },
        { type: 'rect', x: 10, y: 62, w: 80, h: 3, fill: '#7EC850', rx: 1.5 },
      ],
    },
    {
      icon: Sprout,
      emoji: '\uD83E\uDD55',
      step: '2',
      titleKey: 'step2Title' as const,
      descKey: 'step2Desc' as const,
      color: 'from-emerald-500 to-teal-600',
      bgAccent: 'bg-emerald-100/60 dark:bg-emerald-900/30',
      illustration: [
        { type: 'circle', cx: 25, cy: 35, r: 12, fill: '#FF6347' },
        { type: 'circle', cx: 50, cy: 30, r: 10, fill: '#9370DB' },
        { type: 'circle', cx: 72, cy: 38, r: 11, fill: '#FFD700' },
        { type: 'line', x1: 25, y1: 47, x2: 25, y2: 60, stroke: '#4CAF50' },
        { type: 'line', x1: 50, y1: 40, x2: 50, y2: 60, stroke: '#4CAF50' },
        { type: 'line', x1: 72, y1: 49, x2: 72, y2: 60, stroke: '#4CAF50' },
        { type: 'rect', x: 10, y: 60, w: 80, h: 5, fill: '#5C3D1E', rx: 2 },
      ],
    },
    {
      icon: Eye,
      emoji: '\uD83C\uDFAE',
      step: '3',
      titleKey: 'step3Title' as const,
      descKey: 'step3Desc' as const,
      color: 'from-teal-500 to-cyan-600',
      bgAccent: 'bg-teal-100/60 dark:bg-teal-900/30',
      illustration: [
        { type: 'rect', x: 15, y: 25, w: 70, h: 35, fill: '#142A1E', rx: 6 },
        { type: 'rect', x: 20, y: 30, w: 60, h: 25, fill: '#7EC850', rx: 3 },
        { type: 'circle', cx: 35, cy: 40, r: 5, fill: '#FF6347' },
        { type: 'circle', cx: 55, cy: 38, r: 4, fill: '#9370DB' },
        { type: 'circle', cx: 68, cy: 42, r: 3, fill: '#FFD700' },
        { type: 'rect', x: 30, y: 15, w: 40, h: 10, fill: '#4ADE80', rx: 5 },
      ],
    },
  ];

  return (
    <section className="py-24 md:py-32 px-6 bg-gray-50 dark:bg-gradient-to-b dark:from-[#0D1F17] dark:to-[#0a1a10]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-100 dark:bg-green-900/40 border border-green-200 dark:border-green-800/30 text-green-700 dark:text-green-400 text-sm font-medium mb-6">
            {t('badge')}
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-green-50 mb-5 tracking-tight">
            {t('title')}
          </h2>
          <p className="text-gray-500 dark:text-green-200/60 text-lg max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 md:gap-12 relative">
          {/* Connection line */}
          <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-px bg-gradient-to-r from-green-300/30 dark:from-green-800/50 via-green-400/40 dark:via-green-600/30 to-green-300/30 dark:to-green-800/50" />

          {steps.map((step, i) => (
            <div
              key={step.step}
              className="relative text-center"
            >
              {/* Illustration */}
              <div className="mx-auto mb-4 w-32 h-24 relative">
                <svg viewBox="0 0 100 70" className="w-full h-full" aria-hidden="true">
                  {(step.illustration as Array<Record<string, unknown>>).map((el: Record<string, unknown>, j: number) => {
                    if (el.type === 'rect') return <rect key={j} x={el.x as number} y={el.y as number} width={el.w as number} height={el.h as number} fill={el.fill as string} rx={el.rx as number} />;
                    if (el.type === 'circle') return <circle key={j} cx={el.cx as number} cy={el.cy as number} r={el.r as number} fill={el.fill as string} />;
                    if (el.type === 'line') return <line key={j} x1={el.x1 as number} y1={el.y1 as number} x2={el.x2 as number} y2={el.y2 as number} stroke={el.stroke as string} strokeWidth="2" strokeLinecap="round" />;
                    return null;
                  })}
                </svg>
              </div>

              <div className="relative inline-flex mb-6">
                <div
                  className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg shadow-green-500/10 transition-transform duration-300 hover:scale-[1.08] hover:rotate-[3deg]`}
                >
                  <span className="text-4xl" role="img" aria-label={t(step.titleKey)}>{step.emoji}</span>
                </div>
                <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white dark:bg-[#0D1F17] border-2 border-green-500 flex items-center justify-center text-sm font-bold text-green-600 dark:text-green-400 shadow-sm">
                  {step.step}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-green-50 mb-3">{t(step.titleKey)}</h3>
              <p className="text-gray-500 dark:text-green-200/60 leading-relaxed">{t(step.descKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
