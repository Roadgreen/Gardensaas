'use client';

import { useState, useEffect, useCallback } from 'react';
import type { GardenConfig, PlantedItem } from '@/types';

const GARDEN_STORAGE_KEY = 'garden-config';

const defaultConfig: GardenConfig = {
  length: 4,
  width: 3,
  soilType: 'loamy',
  climateZone: 'temperate',
  sunExposure: 'full-sun',
  plantedItems: [],
};

export function useGarden() {
  const [config, setConfigState] = useState<GardenConfig>(defaultConfig);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(GARDEN_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as GardenConfig;
        setConfigState(parsed);
      }
    } catch {
      // ignore
    }
    setIsLoaded(true);
  }, []);

  const setConfig = useCallback((newConfig: GardenConfig) => {
    setConfigState(newConfig);
    try {
      localStorage.setItem(GARDEN_STORAGE_KEY, JSON.stringify(newConfig));
    } catch {
      // ignore
    }
  }, []);

  const updateConfig = useCallback(
    (partial: Partial<GardenConfig>) => {
      setConfigState((prev) => {
        const updated = { ...prev, ...partial };
        try {
          localStorage.setItem(GARDEN_STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
    },
    []
  );

  const addPlant = useCallback(
    (plantId: string, x: number, z: number) => {
      const item: PlantedItem = {
        plantId,
        x,
        z,
        plantedDate: new Date().toISOString(),
      };
      setConfigState((prev) => {
        const updated = {
          ...prev,
          plantedItems: [...prev.plantedItems, item],
        };
        try {
          localStorage.setItem(GARDEN_STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
    },
    []
  );

  const removePlant = useCallback(
    (index: number) => {
      setConfigState((prev) => {
        const updated = {
          ...prev,
          plantedItems: prev.plantedItems.filter((_, i) => i !== index),
        };
        try {
          localStorage.setItem(GARDEN_STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
    },
    []
  );

  const clearGarden = useCallback(() => {
    setConfigState((prev) => {
      const updated = { ...prev, plantedItems: [] };
      try {
        localStorage.setItem(GARDEN_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  const isSetupComplete = isLoaded && config.length > 0 && config.width > 0;

  return {
    config,
    setConfig,
    updateConfig,
    addPlant,
    removePlant,
    clearGarden,
    isLoaded,
    isSetupComplete,
  };
}

export function usePlants() {
  const [plants, setPlants] = useState<import('@/types').Plant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    import('@/data/plants.json').then((mod) => {
      setPlants(mod.default as import('@/types').Plant[]);
      setIsLoading(false);
    });
  }, []);

  return { plants, isLoading };
}
