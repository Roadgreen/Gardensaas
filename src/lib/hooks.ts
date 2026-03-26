'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useGardenStore } from '@/lib/garden-store';

// Re-export useGarden as a thin wrapper around the Zustand store.
// All consumers get the same API but now share a single global store
// with cross-tab sync via the 'storage' event listener in garden-store.ts.
export function useGarden() {
  const store = useGardenStore();
  const { data: session, status: authStatus } = useSession();
  const hasSynced = useRef(false);

  // Initialize from localStorage on first mount
  useEffect(() => {
    store._initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync from server when authenticated
  useEffect(() => {
    if (authStatus === 'authenticated' && session?.user && store.isLoaded && !hasSynced.current) {
      hasSynced.current = true;
      store.syncFromServer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus, store.isLoaded]);

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
    addSeedling: store.addSeedling,
    removeSeedling: store.removeSeedling,
    updateSeedling: store.updateSeedling,
    transplantSeedling: store.transplantSeedling,
    isLoaded: store.isLoaded,
    isSetupComplete,
    hasBasicConfig,
    completeSetup: store.completeSetup,
    advanceOnboarding: store.advanceOnboarding,
    syncStatus: store.syncStatus,
    syncFromServer: store.syncFromServer,
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
