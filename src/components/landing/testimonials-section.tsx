'use client';

import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';

const testimonials = [
  {
    name: 'Sophie M.',
    role: 'Urban Gardener, Lyon',
    avatar: 'S',
    color: 'bg-pink-500',
    text: "My little balcony has become a real vegetable paradise! The 3D view is adorable and the calendar tells me exactly when to water my cherry tomatoes.",
    stars: 5,
    emoji: '\uD83C\uDF45',
  },
  {
    name: 'Thomas K.',
    role: 'Amateur Gardener, Brittany',
    avatar: 'T',
    color: 'bg-blue-500',
    text: "Companion planting saved my tomatoes! I didn't know marigolds were such good neighbors. My harvest doubled this year.",
    stars: 5,
    emoji: '\uD83C\uDF3B',
  },
  {
    name: 'Emma L.',
    role: 'Motivated Beginner, Paris',
    avatar: 'E',
    color: 'bg-amber-500',
    text: "I was afraid to start gardening, but GardenSaas makes it fun like a game. Setting up my garden was as fun as a game of Animal Crossing!",
    stars: 5,
    emoji: '\uD83C\uDFAE',
  },
  {
    name: 'Marc D.',
    role: 'Community Garden Lead, Toulouse',
    avatar: 'M',
    color: 'bg-emerald-500',
    text: "We use GardenSaas to plan our community plots. The AI advisor is like having a master gardener available 24/7. Essential.",
    stars: 5,
    emoji: '\uD83E\uDDD1\u200D\uD83C\uDF3E',
  },
  {
    name: 'Jade P.',
    role: 'Permaculture Enthusiast, Provence',
    avatar: 'J',
    color: 'bg-purple-500',
    text: "Finally an app that understands soil types! The planting calendar perfectly adapted to my Mediterranean climate. A real game changer.",
    stars: 5,
    emoji: '\u2600\uFE0F',
  },
  {
    name: 'Olivier W.',
    role: 'Garden Owner, Alsace',
    avatar: 'O',
    color: 'bg-cyan-500',
    text: "The daily quests motivate me to visit the garden every day. 3 months of logging in every morning. My plants have never looked better!",
    stars: 5,
    emoji: '\uD83C\uDF3F',
  },
  {
    name: 'Sarah T.',
    role: 'Rooftop Gardener, Berlin',
    avatar: 'S',
    color: 'bg-rose-500',
    text: "The 3D visualization helped me plan the perfect layout for my rooftop space. I can see how tall plants will grow before I even plant them!",
    stars: 5,
    emoji: '\uD83C\uDFE2',
  },
  {
    name: 'David R.',
    role: 'Retired Teacher, Bordeaux',
    avatar: 'D',
    color: 'bg-orange-500',
    text: "At 68, I thought technology wasn't for me. But GardenSaas is so intuitive that even my grandchildren want to help me plan the garden now.",
    stars: 5,
    emoji: '\uD83D\uDC74',
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

function TestimonialCard({ t }: { t: typeof testimonials[0] }) {
  return (
    <div className="relative rounded-2xl bg-gray-50 dark:bg-[#142A1E] border border-gray-100 dark:border-green-900/40 p-6 h-full transition-all duration-300 hover:border-green-200 dark:hover:border-green-700/60 hover:shadow-lg hover:shadow-green-100/50 dark:hover:shadow-green-900/20 hover:-translate-y-0.5">
      <Quote className="absolute top-4 right-4 w-8 h-8 text-green-200/20 dark:text-green-800/30" />
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-12 h-12 rounded-full ${t.color} flex items-center justify-center text-white font-bold text-sm relative flex-shrink-0`}>
          {t.avatar}
          <span className="absolute -bottom-1 -right-1 text-base">{t.emoji}</span>
        </div>
        <div className="min-w-0">
          <div className="text-gray-900 dark:text-green-50 font-medium text-sm">{t.name}</div>
          <div className="text-gray-400 dark:text-green-500/50 text-xs truncate">{t.role}</div>
        </div>
      </div>
      <div className="flex gap-0.5 mb-3">
        {Array.from({ length: t.stars }).map((_, i) => (
          <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
        ))}
      </div>
      <p className="text-gray-600 dark:text-green-200/70 text-sm leading-relaxed">
        &laquo; {t.text} &raquo;
      </p>
    </div>
  );
}

export function TestimonialsSection() {
  const [activePage, setActivePage] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const cardsPerPage = { mobile: 1, tablet: 2, desktop: 3 };

  // Auto-advance carousel
  const startAutoPlay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setActivePage((prev) => (prev + 1) % Math.ceil(testimonials.length / 3));
    }, 5000);
  }, []);

  useEffect(() => {
    startAutoPlay();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startAutoPlay]);

  const totalPages = Math.ceil(testimonials.length / 3);

  const goTo = (page: number) => {
    setActivePage(page);
    startAutoPlay();
  };

  const goNext = () => goTo((activePage + 1) % totalPages);
  const goPrev = () => goTo((activePage - 1 + totalPages) % totalPages);

  return (
    <section className="py-24 md:py-32 px-6 bg-white dark:bg-gradient-to-b dark:from-[#0D1F17] dark:to-[#0a1a10] overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-100 dark:bg-green-900/40 border border-green-200 dark:border-green-800/30 text-green-700 dark:text-green-400 text-sm font-medium mb-6">
            Testimonials
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-green-50 mb-5 tracking-tight">
            Loved by 10,000+ Gardeners
          </h2>
          <p className="text-gray-500 dark:text-green-200/60 text-lg max-w-2xl mx-auto">
            Join a community of gardeners who plan better and harvest more.
          </p>
        </motion.div>

        {/* Desktop: carousel with 3 cards per page */}
        <div className="relative">
          {/* Navigation arrows */}
          <button
            onClick={goPrev}
            className="absolute -left-4 md:-left-12 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white dark:bg-[#142A1E] border border-gray-200 dark:border-green-900/40 shadow-lg flex items-center justify-center text-gray-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/50 transition-colors cursor-pointer hidden md:flex"
            aria-label="Previous testimonials"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goNext}
            className="absolute -right-4 md:-right-12 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white dark:bg-[#142A1E] border border-gray-200 dark:border-green-900/40 shadow-lg flex items-center justify-center text-gray-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/50 transition-colors cursor-pointer hidden md:flex"
            aria-label="Next testimonials"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Cards container with overflow */}
          <div className="overflow-hidden">
            <motion.div
              className="flex"
              animate={{ x: `${-activePage * 100}%` }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              {Array.from({ length: totalPages }).map((_, pageIdx) => (
                <div
                  key={pageIdx}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full flex-shrink-0"
                  style={{ minWidth: '100%' }}
                >
                  {testimonials.slice(pageIdx * 3, pageIdx * 3 + 3).map((t) => (
                    <motion.div key={t.name} variants={itemVariants}>
                      <TestimonialCard t={t} />
                    </motion.div>
                  ))}
                </div>
              ))}
            </motion.div>
          </div>

          {/* Pagination dots */}
          <div className="flex items-center justify-center gap-2 mt-8">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  i === activePage
                    ? 'w-8 h-2.5 bg-green-500'
                    : 'w-2.5 h-2.5 bg-gray-300 dark:bg-green-800/40 hover:bg-green-400 dark:hover:bg-green-700/50'
                }`}
                aria-label={`Go to page ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Trust bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-6 md:gap-10 text-sm text-gray-400 dark:text-green-400/50"
        >
          <span className="flex items-center gap-2">
            <span className="flex -space-x-2">
              {['bg-pink-500', 'bg-blue-500', 'bg-amber-500', 'bg-emerald-500'].map((color, i) => (
                <span key={i} className={`w-7 h-7 rounded-full ${color} border-2 border-white dark:border-[#0D1F17] flex items-center justify-center text-white text-[10px] font-bold`}>
                  {testimonials[i].avatar}
                </span>
              ))}
            </span>
            10,000+ active gardeners
          </span>
          <span className="flex items-center gap-1.5">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            4.9/5 average rating
          </span>
          <span>Featured in "Top Garden Apps 2026"</span>
        </motion.div>
      </div>
    </section>
  );
}
