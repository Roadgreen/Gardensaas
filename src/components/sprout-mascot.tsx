'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PAGE_TIPS: Record<string, string[]> = {
  dashboard: [
    "Welcome back! Let's check on your plants!",
    "Don't forget to water your garden today!",
    "Harvest any ripe veggies before they overripen!",
    "Try adding companion plants for better growth!",
    "Check the planting calendar for this month's tasks!",
    "QUEST: Water 3 plants today for bonus XP!",
    "TIP: Rotate your crops every season for healthier soil.",
  ],
  planner: [
    "Drag and drop plants onto your garden grid!",
    "Space your plants properly for best growth!",
    "Try companion planting for healthier crops!",
    "Click any plant to see care instructions!",
    "QUEST: Plant your first 5 companions!",
    "TIP: Leave walking paths between rows.",
  ],
  advisor: [
    "Ask me anything about your garden!",
    "I can help with pest problems and soil tips!",
    "Try asking about companion planting pairs!",
    "Need help? Just type your question below!",
    "QUEST: Ask 3 questions to level up!",
  ],
  plants: [
    "Browse over 150 plants to find the perfect fit!",
    "Filter by sun exposure, soil type, or difficulty!",
    "Click any plant card to see full details!",
    "Check which plants are great for beginners!",
    "QUEST: Discover 10 new plants today!",
    "TIP: Sort by difficulty if you're just starting out.",
  ],
  settings: [
    "Customize your garden settings here!",
    "Update your soil type if it changes!",
    "Review your climate zone for accuracy!",
  ],
  default: [
    "Hey there! Need help? Just click me!",
    "I'm Sprout, your gardening companion!",
    "Explore the garden planner to get started!",
    "Check out the 3D view of your garden!",
    "QUEST: Set up your garden to earn +25 XP!",
    "TIP: I appear on every page with helpful advice!",
  ],
};

interface SproutMascotProps {
  page?: string;
  className?: string;
}

export function SproutMascot({ page = 'default', className = '' }: SproutMascotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [isWaving, setIsWaving] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [hasEntrance, setHasEntrance] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  const tips = PAGE_TIPS[page] || PAGE_TIPS.default;

  // Check if current tip is a quest
  const isQuest = tips[tipIndex]?.startsWith('QUEST:');
  const isTip = tips[tipIndex]?.startsWith('TIP:');

  useEffect(() => {
    // Animated entrance after a delay
    const entranceTimer = setTimeout(() => {
      setHasEntrance(true);
    }, 500);

    // Auto-show on mount briefly
    const showTimer = setTimeout(() => {
      setIsOpen(true);
      setIsWaving(true);
      setTimeout(() => setIsWaving(false), 2000);
    }, 2000);

    const hideTimer = setTimeout(() => setIsOpen(false), 8000);

    return () => {
      clearTimeout(entranceTimer);
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  const handleClick = useCallback(() => {
    if (isDismissed) {
      setIsDismissed(false);
      setIsOpen(true);
      return;
    }
    setIsOpen((prev) => !prev);
    setIsWaving(true);
    setClickCount((c) => c + 1);
    setTimeout(() => setIsWaving(false), 1500);
    if (isOpen) {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }
  }, [isOpen, isDismissed, tips.length]);

  const handleDismiss = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
    setIsOpen(false);
  }, []);

  if (!hasEntrance) return null;

  return (
    <motion.div
      className={`fixed bottom-6 right-6 z-40 ${className}`}
      initial={{ y: 100, opacity: 0, scale: 0.5 }}
      animate={isDismissed ? { scale: 0.6, opacity: 0.5 } : { y: 0, opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
    >
      {/* Speech bubble */}
      <AnimatePresence>
        {isOpen && !isDismissed && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            transition={{ duration: 0.3, type: 'spring' }}
            className="absolute bottom-full right-0 mb-3 w-64"
          >
            <div className="relative">
              {/* Quest/Tip styling variant */}
              <div
                className={`rounded-2xl px-4 py-3 text-sm font-medium shadow-xl relative ${
                  isQuest
                    ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-400 text-amber-900'
                    : isTip
                    ? 'bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-cyan-400 text-cyan-900'
                    : 'bg-white border-2 border-green-400 text-[#1a1a1a]'
                }`}
                style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', lineHeight: 1.5 }}
              >
                {/* Header with type badge */}
                <div className="flex items-center justify-between mb-1">
                  <div className={`font-bold text-xs flex items-center gap-1 ${
                    isQuest ? 'text-amber-600' : isTip ? 'text-cyan-600' : 'text-green-600'
                  }`}>
                    {isQuest && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-600 text-[10px] font-bold">
                        QUEST
                      </span>
                    )}
                    {isTip && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-600 text-[10px] font-bold">
                        TIP
                      </span>
                    )}
                    Sprout
                    <span className={`w-2 h-2 rounded-full animate-pulse inline-block ${
                      isQuest ? 'bg-amber-400' : isTip ? 'bg-cyan-400' : 'bg-green-400'
                    }`} />
                  </div>
                  {/* Dismiss X */}
                  <button
                    onClick={handleDismiss}
                    className="text-gray-400 hover:text-gray-600 text-xs w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                  >
                    x
                  </button>
                </div>
                {(isQuest || isTip) ? tips[tipIndex].replace(/^(QUEST|TIP): /, '') : tips[tipIndex]}

                {/* Tip navigation dots */}
                <div className="flex items-center justify-center gap-1 mt-2">
                  {tips.map((_, i) => (
                    <span
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        i === tipIndex
                          ? (isQuest ? 'bg-amber-400 scale-125' : isTip ? 'bg-cyan-400 scale-125' : 'bg-green-400 scale-125')
                          : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>

                {/* Arrow tail */}
                <div className={`absolute -bottom-2.5 right-6 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] ${
                  isQuest ? 'border-t-yellow-400' : isTip ? 'border-t-cyan-400' : 'border-t-green-400'
                }`} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mascot button */}
      <motion.button
        onClick={handleClick}
        className="relative w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-900/30 border-2 border-green-400 flex items-center justify-center cursor-pointer overflow-hidden"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={isWaving ? { rotate: [0, -5, 5, -5, 0] } : {}}
        transition={{ duration: 0.4 }}
      >
        <svg width="36" height="40" viewBox="0 0 120 140" className="drop-shadow">
          {/* Head */}
          <circle cx="60" cy="50" r="28" fill="#FFD5B8" />
          {/* Hair */}
          <ellipse cx="60" cy="35" rx="22" ry="12" fill="#8B5E3C" />
          {/* Eyes */}
          <circle cx="50" cy="48" r="4" fill="#1a1a1a" />
          <circle cx="70" cy="48" r="4" fill="#1a1a1a" />
          {/* Eye highlights */}
          <circle cx="52" cy="46" r="1.5" fill="#fff" />
          <circle cx="72" cy="46" r="1.5" fill="#fff" />
          {/* Cheeks */}
          <circle cx="42" cy="55" r="5" fill="#FCA5A5" opacity="0.5" />
          <circle cx="78" cy="55" r="5" fill="#FCA5A5" opacity="0.5" />
          {/* Smile */}
          <path d="M 52 58 Q 60 66 68 58" stroke="#E11D48" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {/* Hat brim */}
          <ellipse cx="60" cy="30" rx="32" ry="7" fill="#A0724A" />
          {/* Hat top */}
          <rect x="42" y="12" width="36" height="18" rx="6" fill="#A0724A" />
          {/* Hat band */}
          <rect x="42" y="24" width="36" height="6" rx="2" fill="#DC2626" />
          {/* Flower */}
          <circle cx="80" cy="20" r="6" fill="#FFB7D5" />
          <circle cx="80" cy="20" r="3" fill="#FFEB3B" />
          {/* Body hint */}
          <rect x="42" y="78" width="36" height="30" rx="8" fill="#4ADE80" />
          {/* Overalls strap */}
          <rect x="49" y="70" width="6" height="14" rx="2" fill="#2D9B52" />
          <rect x="65" y="70" width="6" height="14" rx="2" fill="#2D9B52" />
        </svg>

        {/* Notification dot */}
        {!isOpen && !isDismissed && (
          <motion.div
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-yellow-400 border-2 border-white flex items-center justify-center"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <span className="text-[7px] font-bold text-yellow-900">!</span>
          </motion.div>
        )}
      </motion.button>
    </motion.div>
  );
}
