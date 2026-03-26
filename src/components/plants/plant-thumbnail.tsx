'use client';

import { useState } from 'react';
import { getPlantImageUrl } from '@/lib/plant-images';

interface PlantThumbnailProps {
  plantId: string;
  size?: number;
  fallbackEmoji?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Lightweight plant image thumbnail for grid cells and compact contexts.
 * Uses a plain <img> tag (no Next/Image) for performance in grids.
 */
export function PlantThumbnail({ plantId, size = 24, fallbackEmoji, className = '', style }: PlantThumbnailProps) {
  const [errored, setErrored] = useState(false);
  const imgUrl = getPlantImageUrl(plantId);

  if (!imgUrl || errored) {
    return fallbackEmoji ? (
      <span className={className} style={{ fontSize: size * 0.8, lineHeight: 1, ...style }}>
        {fallbackEmoji}
      </span>
    ) : null;
  }

  return (
    <img
      src={imgUrl.replace(/w=\d+&h=\d+/, `w=${size * 2}&h=${size * 2}`)}
      alt=""
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`}
      style={{ width: size, height: size, ...style }}
      onError={() => setErrored(true)}
      loading="lazy"
    />
  );
}
