'use client';

import { useState, useEffect } from 'react';
import { useGardenStore } from '@/lib/garden-store';

// Re-export useGarden as a thin wrapper around the Zustand store.
// All consumers get the same API but now share a single global store
// with cross-tab sync via the 'storage' event listener in garden-store.ts.
export function useGarden() {
  const store = useGardenStore();

  // Initialize from localStorage on first mount
  useEffect(() => {
    store._initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isSetupComplete = store.isLoaded && store.config.setupCompleted === true;
  const hasBasicConfig = store.isLoaded && store.config.length > 0 && store.config.width > 0;

  return {
    config: store.config,
    setConfig: store.setConfig,
    updateConfig: store.updateConfig,
    addPlant: store.addPlant,
    removePlant: store.removePlant,
    clearGarden: store.clearGarden,
    addRaisedBed: store.addRaisedBed,
    removeRaisedBed: store.removeRaisedBed,
    updateRaisedBed: store.updateRaisedBed,
    addZone: store.addZone,
    removeZone: store.removeZone,
    updateZone: store.updateZone,
    isLoaded: store.isLoaded,
    isSetupComplete,
    hasBasicConfig,
    completeSetup: store.completeSetup,
    advanceOnboarding: store.advanceOnboarding,
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
