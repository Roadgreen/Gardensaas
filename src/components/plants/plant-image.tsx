'use client';

import { useState } from 'react';
import Image from 'next/image';
import { getPlantImageUrl } from '@/lib/plant-images';

interface PlantImageProps {
  plantId: string;
  plantName: string;
  emoji: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
}

export function PlantImage({ plantId, plantName, emoji, color, size = 'md' }: PlantImageProps) {
  const [errored, setErrored] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const imgUrl = getPlantImageUrl(plantId);
  const sizeClass = size === 'lg' ? 'w-24 h-24' : size === 'sm' ? 'w-10 h-10' : 'w-12 h-12 sm:w-14 sm:h-14';
  const roundClass = size === 'lg' ? 'rounded-3xl' : size === 'sm' ? 'rounded-xl' : 'rounded-xl sm:rounded-2xl';
  const showImage = imgUrl && !errored;

  return (
    <div
      className={`${sizeClass} ${roundClass} flex-shrink-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 overflow-hidden relative`}
      style={!showImage ? { backgroundColor: color + '20', border: `2px solid ${color}30` } : undefined}
    >
      {showImage ? (
        <Image
          src={imgUrl}
          alt={`Photo of ${plantName}`}
          width={size === 'lg' ? 96 : size === 'sm' ? 40 : 56}
          height={size === 'lg' ? 96 : size === 'sm' ? 40 : 56}
          className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          loading="lazy"
          sizes={size === 'lg' ? '96px' : size === 'sm' ? '40px' : '56px'}
        />
      ) : null}
      {/* Emoji fallback while loading or on error */}
      {!showImage || !loaded ? (
        <span
          className={`${size === 'lg' ? 'text-5xl' : size === 'sm' ? 'text-lg' : 'text-xl sm:text-2xl'} absolute`}
          style={showImage ? { opacity: loaded ? 0 : 1 } : undefined}
          role="img"
          aria-label={plantName}
        >
          {emoji}
        </span>
      ) : null}
    </div>
  );
}
