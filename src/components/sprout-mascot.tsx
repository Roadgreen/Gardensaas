'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PAGE_TIPS: Record<string, string[]> = {
  dashboard: [
    "Welcome back! Let's check on your plants!",
    "Don't forget to water your garden today!",
    "Harvest any ripe veggies before they overripen!",
    "Try adding companion plants for better growth!",
    "Check the planting calendar for this month's tasks!",
  ],
  planner: [
    "Drag and drop plants onto your garden grid!",
    "Space your plants properly for best growth!",
    "Try companion planting for healthier crops!",
    "Click any plant to see care instructions!",
  ],
  advisor: [
    "Ask me anything about your garden!",
    "I can help with pest problems and soil tips!",
    "Try asking about companion planting pairs!",
    "Need help? Just type your question below!",
  ],
  plants: [
    "Browse over 150 plants to find the perfect fit!",
    "Filter by sun exposure, soil type, or difficulty!",
    "Click any plant card to see full details!",
    "Check which plants are great for beginners!",
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

  const tips = PAGE_TIPS[page] || PAGE_TIPS.default;

  useEffect(() => {
    // Auto-show on mount briefly
    const showTimer = setTimeout(() => {
      setIsOpen(true);
      setIsWaving(true);
      setTimeout(() => setIsWaving(false), 2000);
    }, 2000);

    const hideTimer = setTimeout(() => setIsOpen(false), 8000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  const handleClick = useCallback(() => {
    setIsOpen((prev) => !prev);
    setIsWaving(true);
    setTimeout(() => setIsWaving(false), 1500);
    if (isOpen) {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }
  }, [isOpen, tips.length]);

  return (
    <div className={`fixed bottom-6 right-6 z-40 ${className}`}>
      {/* Speech bubble */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            transition={{ duration: 0.3, type: 'spring' }}
            className="absolute bottom-full right-0 mb-3 w-60"
          >
            <div className="bg-white rounded-2xl px-4 py-3 text-[#1a1a1a] text-sm font-medium shadow-xl border-2 border-green-400 relative"
              style={{ fontFamily: '"Nunito", "Comic Sans MS", cursive, sans-serif', lineHeight: 1.5 }}
            >
              <div className="text-green-600 font-bold text-xs mb-1 flex items-center gap-1">
                Sprout
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
              </div>
              {tips[tipIndex]}
              <div className="absolute -bottom-2.5 right-6 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-green-400" />
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
        {!isOpen && (
          <motion.div
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-yellow-400 border-2 border-white"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </motion.button>
    </div>
  );
}
