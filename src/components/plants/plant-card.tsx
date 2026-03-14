'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Droplets, Sun, Clock } from 'lucide-react';
import type { Plant } from '@/types';
import { getWateringLabel, getDifficultyColor, isPlantableNow } from '@/lib/garden-utils';

interface PlantCardProps {
  plant: Plant;
  index?: number;
}

export function PlantCard({ plant, index = 0 }: PlantCardProps) {
  const plantable = isPlantableNow(plant);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link href={`/plants/${plant.id}`}>
        <Card hover className="relative overflow-hidden group cursor-pointer h-full">
          {/* Color accent bar */}
          <div
            className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
            style={{ backgroundColor: plant.color }}
          />

          {/* Plantable badge */}
          {plantable && (
            <div className="absolute top-3 right-3">
              <span className="px-2 py-0.5 text-xs font-medium bg-green-600/30 text-green-300 rounded-full border border-green-600/40">
                Plant now
              </span>
            </div>
          )}

          {/* Plant color circle */}
          <div className="flex items-start gap-4 mb-4">
            <div
              className="w-12 h-12 rounded-xl flex-shrink-0 shadow-inner"
              style={{ backgroundColor: plant.color + '30', border: `2px solid ${plant.color}50` }}
            >
              <div
                className="w-full h-full rounded-xl flex items-center justify-center"
              >
                <div
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: plant.color }}
                />
              </div>
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-green-50 group-hover:text-green-300 transition-colors truncate">
                {plant.name.en}
              </h3>
              <p className="text-sm text-green-400/60 italic">{plant.name.fr}</p>
            </div>
          </div>

          <p className="text-sm text-green-200/60 mb-4 line-clamp-2">
            {plant.description.en}
          </p>

          <div className="flex flex-wrap gap-3 text-xs text-green-300/70">
            <span className="flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5" />
              {getWateringLabel(plant.wateringFrequency)}
            </span>
            <span className="flex items-center gap-1">
              <Sun className="w-3.5 h-3.5" />
              {plant.sunExposure[0] === 'full-sun' ? 'Full sun' : plant.sunExposure[0] === 'partial-shade' ? 'Partial shade' : 'Shade'}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {plant.harvestDays}d
            </span>
            <span
              className="px-1.5 py-0.5 rounded text-xs font-medium"
              style={{
                color: getDifficultyColor(plant.difficulty),
                backgroundColor: getDifficultyColor(plant.difficulty) + '20',
              }}
            >
              {plant.difficulty}
            </span>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
