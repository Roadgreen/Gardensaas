'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TIPS = [
  "Hey there! I'm Sprout, your garden buddy!",
  "Did you know? Tomatoes love basil as a neighbor!",
  "Water your plants in the morning for best results!",
  "Companion planting boosts your harvest by 20%!",
  "Mulch keeps soil moist and weeds away!",
  "Rotate crops each season to keep soil healthy!",
  "Start your garden adventure with me!",
  "I know 150+ plants - ask me anything!",
  "Deep watering encourages strong roots!",
  "Native flowers attract helpful pollinators!",
];

interface GardenerGuideProps {
  compact?: boolean;
  initialTip?: string;
}

export function GardenerGuide({ compact = false, initialTip }: GardenerGuideProps) {
  const [tipIndex, setTipIndex] = useState(0);
  const [isWaving, setIsWaving] = useState(true);
  const [hearts, setHearts] = useState<number[]>([]);

  const tips = initialTip ? [initialTip, ...TIPS] : TIPS;

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [tips.length]);

  useEffect(() => {
    const waveInterval = setInterval(() => {
      setIsWaving(true);
      setTimeout(() => setIsWaving(false), 1500);
    }, 6000);
    return () => clearInterval(waveInterval);
  }, []);

  const handleClick = useCallback(() => {
    setIsWaving(true);
    setTimeout(() => setIsWaving(false), 1500);
    setTipIndex((prev) => (prev + 1) % tips.length);
    // Spawn a heart
    setHearts((prev) => [...prev, Date.now()]);
    setTimeout(() => setHearts((prev) => prev.slice(1)), 1200);
  }, [tips.length]);

  const svgWidth = compact ? 80 : 120;
  const svgHeight = compact ? 107 : 160;

  return (
    <div className="relative flex flex-col items-center cursor-pointer" onClick={handleClick}>
      {/* Floating hearts on click */}
      <AnimatePresence>
        {hearts.map((id) => (
          <motion.div
            key={id}
            initial={{ opacity: 1, y: 0, scale: 0.5 }}
            animate={{ opacity: 0, y: -40, scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute -top-8 text-red-400 text-lg pointer-events-none"
            style={{ left: `${40 + Math.random() * 40}px` }}
          >
            &#9829;
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Speech bubble */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tipIndex}
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.9 }}
          transition={{ duration: 0.4 }}
          className={`relative ${compact ? 'mb-2' : 'mb-4'} ${compact ? 'max-w-[200px]' : 'max-w-[240px]'}`}
        >
          <div className="bg-white rounded-2xl px-4 py-3 text-[#1a1a1a] text-sm font-medium shadow-lg pixel-border relative"
            style={{ fontFamily: '"Nunito", "Comic Sans MS", cursive, sans-serif', lineHeight: 1.5 }}
          >
            <div className="text-green-600 font-bold text-xs mb-1 flex items-center gap-1">
              Sprout
              <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            </div>
            {tips[tipIndex]}
            <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-green-400" />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Character SVG */}
      <motion.div
        animate={isWaving ? { rotate: [0, -3, 3, -3, 0] } : {}}
        transition={{ duration: 0.5, repeat: isWaving ? 2 : 0 }}
        className="drop-shadow-lg"
      >
        <svg width={svgWidth} height={svgHeight} viewBox="0 0 120 160">
          {/* Shadow */}
          <ellipse cx="60" cy="155" rx="30" ry="5" fill="rgba(0,0,0,0.15)" />

          {/* Boots */}
          <rect x="36" y="132" width="16" height="12" rx="3" fill="#5C3D1E" />
          <rect x="68" y="132" width="16" height="12" rx="3" fill="#5C3D1E" />

          {/* Legs */}
          <rect x="40" y="115" width="12" height="20" rx="4" fill="#5B8C5A" />
          <rect x="68" y="115" width="12" height="20" rx="4" fill="#5B8C5A" />

          {/* Body (overalls) */}
          <rect x="33" y="72" width="54" height="48" rx="8" fill="#4ADE80" />

          {/* Overalls straps */}
          <rect x="40" y="62" width="8" height="18" rx="3" fill="#2D9B52" />
          <rect x="72" y="62" width="8" height="18" rx="3" fill="#2D9B52" />

          {/* Pocket */}
          <rect x="48" y="92" width="24" height="14" rx="4" fill="#2D9B52" />
          {/* Pocket stitching */}
          <line x1="48" y1="99" x2="72" y2="99" stroke="#228B22" strokeWidth="0.5" strokeDasharray="2,2" />

          {/* Buttons */}
          <circle cx="42" cy="76" r="3" fill="#FFD700" />
          <circle cx="78" cy="76" r="3" fill="#FFD700" />

          {/* Arms */}
          <g>
            {/* Left arm */}
            <rect x="18" y="72" width="16" height="35" rx="6" fill="#4ADE80" />
            <circle cx="26" cy="110" r="7" fill="#FFD5B8" />
          </g>
          {/* Right arm - waving */}
          <motion.g
            animate={isWaving ? { rotate: [-20, 20, -20, 20, 0] } : {}}
            transition={{ duration: 0.6, repeat: isWaving ? 2 : 0 }}
            style={{ originX: '86px', originY: '72px' }}
          >
            <rect x="86" y="72" width="16" height="35" rx="6" fill="#4ADE80" />
            <circle cx="94" cy="110" r="7" fill="#FFD5B8" />
          </motion.g>

          {/* Head */}
          <circle cx="60" cy="45" r="24" fill="#FFD5B8" />

          {/* Hair (back) */}
          <ellipse cx="60" cy="32" rx="20" ry="10" fill="#8B5E3C" />

          {/* Eyes */}
          <circle cx="52" cy="44" r="3.5" fill="#1a1a1a" />
          <circle cx="68" cy="44" r="3.5" fill="#1a1a1a" />
          {/* Eye highlights */}
          <circle cx="53.5" cy="42.5" r="1.2" fill="#fff" />
          <circle cx="69.5" cy="42.5" r="1.2" fill="#fff" />

          {/* Rosy cheeks */}
          <circle cx="44" cy="50" r="4" fill="#FCA5A5" opacity="0.5" />
          <circle cx="76" cy="50" r="4" fill="#FCA5A5" opacity="0.5" />

          {/* Smile */}
          <path d="M 53 53 Q 60 60 67 53" stroke="#E11D48" strokeWidth="2" fill="none" strokeLinecap="round" />

          {/* Nose */}
          <circle cx="60" cy="48" r="1.5" fill="#F0C0A0" />

          {/* Hat brim */}
          <ellipse cx="60" cy="28" rx="30" ry="6" fill="#A0724A" />
          {/* Hat top */}
          <rect x="44" y="10" width="32" height="18" rx="6" fill="#A0724A" />
          {/* Hat band */}
          <rect x="44" y="22" width="32" height="6" rx="2" fill="#DC2626" />
          {/* Flower on hat */}
          <circle cx="78" cy="18" r="5" fill="#FFB7D5" />
          <circle cx="78" cy="18" r="2.5" fill="#FFEB3B" />
        </svg>
      </motion.div>

      {/* Click hint */}
      <motion.div
        className="text-xs text-green-500/40 mt-1"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        tap for more tips
      </motion.div>
    </div>
  );
}
