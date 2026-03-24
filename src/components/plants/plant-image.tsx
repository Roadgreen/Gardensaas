'use client';

import { useState, useEffect } from 'react';

interface PlantImageProps {
  plantId: string;
  plantName: string; // English name for Wikipedia lookup
  emoji: string;
  color: string;
  size?: 'sm' | 'md';
}

// Wikipedia article title overrides for better image results
const WIKI_TITLE_MAP: Record<string, string> = {
  tomato: 'Tomato',
  carrot: 'Carrot',
  lettuce: 'Lettuce',
  pepper: 'Capsicum',
  'bell-pepper': 'Bell pepper',
  potato: 'Potato',
  onion: 'Onion',
  garlic: 'Garlic',
  broccoli: 'Broccoli',
  cucumber: 'Cucumber',
  strawberry: 'Strawberry',
  corn: 'Maize',
  basil: 'Basil',
  mint: 'Mentha',
  rosemary: 'Rosemary',
  thyme: 'Thyme',
  parsley: 'Parsley',
  chive: 'Chives',
  zucchini: 'Zucchini',
  squash: 'Squash (plant)',
  pumpkin: 'Pumpkin',
  eggplant: 'Eggplant',
  bean: 'Bean',
  pea: 'Pea',
  spinach: 'Spinach',
  radish: 'Radish',
  beet: 'Beetroot',
  turnip: 'Turnip',
  cabbage: 'Cabbage',
  cauliflower: 'Cauliflower',
  leek: 'Leek',
  celery: 'Celery',
  fennel: 'Fennel',
  artichoke: 'Artichoke',
  asparagus: 'Asparagus',
  sunflower: 'Helianthus annuus',
  lavender: 'Lavender',
  sage: 'Salvia officinalis',
  oregano: 'Origanum vulgare',
  coriander: 'Coriander',
  dill: 'Dill',
  tarragon: 'Tarragon',
  apple: 'Apple',
  pear: 'Pear',
  cherry: 'Cherry',
  peach: 'Peach',
  grape: 'Grape',
  blueberry: 'Blueberry',
  raspberry: 'Raspberry',
  blackberry: 'Blackberry',
  kiwi: 'Kiwifruit',
  lemon: 'Lemon',
  orange: 'Orange (fruit)',
  fig: 'Common fig',
  melon: 'Melon',
  watermelon: 'Watermelon',
};

function getWikiTitle(plantId: string, plantName: string): string {
  // Try exact match
  if (WIKI_TITLE_MAP[plantId]) return WIKI_TITLE_MAP[plantId];
  // Try prefix match
  for (const [key, title] of Object.entries(WIKI_TITLE_MAP)) {
    if (plantId.startsWith(key) || plantId.includes(key)) return title;
  }
  return plantName;
}

export function PlantImage({ plantId, plantName, emoji, color, size = 'md' }: PlantImageProps) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const wikiTitle = getWikiTitle(plantId, plantName);
  const sizeClass = size === 'sm' ? 'w-10 h-10' : 'w-12 h-12 sm:w-14 sm:h-14';
  const roundClass = size === 'sm' ? 'rounded-xl' : 'rounded-xl sm:rounded-2xl';

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/plant-image?name=${encodeURIComponent(wikiTitle)}`)
      .then(r => r.json())
      .then(data => { if (!cancelled && data.url) setImgUrl(data.url); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [wikiTitle]);

  const showImage = imgUrl && !errored;

  return (
    <div
      className={`${sizeClass} ${roundClass} flex-shrink-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 overflow-hidden`}
      style={!showImage ? { backgroundColor: color + '20', border: `2px solid ${color}30` } : undefined}
    >
      {showImage ? (
        <img
          src={imgUrl}
          alt={plantName}
          className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
        />
      ) : null}
      {/* Emoji shown while loading or on error */}
      {!showImage || !loaded ? (
        <span
          className={`${size === 'sm' ? 'text-lg' : 'text-xl sm:text-2xl'} absolute`}
          style={showImage ? { opacity: loaded ? 0 : 1 } : undefined}
        >
          {emoji}
        </span>
      ) : null}
    </div>
  );
}
