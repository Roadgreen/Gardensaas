'use client';

import { create } from 'zustand';
import type { GardenConfig, PlantedItem, RaisedBed, GardenZone, Seedling } from '@/types';

const GARDEN_STORAGE_KEY = 'garden-config';
const SYNC_DEBOUNCE_MS = 2000;

export type SyncStatus = 'idle' | 'saving' | 'saved' | 'error';

const defaultConfig: GardenConfig = {
  length: 4,
  width: 3,
  soilType: 'loamy',
  climateZone: 'temperate',
  sunExposure: 'full-sun',
  plantedItems: [],
  raisedBeds: [],
  zones: [],
  seedlings: [],
  latitude: undefined,
  longitude: undefined,
  city: undefined,
};

function loadFromStorage(): GardenConfig {
  try {
    const stored = localStorage.getItem(GARDEN_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as GardenConfig;
      if (!parsed.raisedBeds) parsed.raisedBeds = [];
      if (!parsed.zones) parsed.zones = [];
      if (!parsed.seedlings) parsed.seedlings = [];
      parsed.zones = parsed.zones.map((z: GardenZone) => ({
        ...z,
        zoneType: z.zoneType || 'in-ground',
      }));
      return parsed;
    }
  } catch {
    // ignore
  }
  return defaultConfig;
}

function saveToStorage(config: GardenConfig) {
  try {
    localStorage.setItem(GARDEN_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // ignore
  }
}

interface GardenStore {
  config: GardenConfig;
  isLoaded: boolean;
  syncStatus: SyncStatus;

  _initialize: () => void;
  _debouncedSync: ReturnType<typeof setTimeout> | null;
  setConfig: (config: GardenConfig) => void;
  updateConfig: (partial: Partial<GardenConfig>) => void;
  addPlant: (plantId: string, x: number, z: number, raisedBedId?: string, varietyId?: string, zoneId?: string) => void;
  removePlant: (index: number) => void;
  clearGarden: () => void;
  addRaisedBed: (bed: RaisedBed) => void;
  removeRaisedBed: (bedId: string) => void;
  updateRaisedBed: (bedId: string, partial: Partial<RaisedBed>) => void;
  addZone: (zone: GardenZone) => void;
  removeZone: (zoneId: string) => void;
  updateZone: (zoneId: string, partial: Partial<GardenZone>) => void;
  addSeedling: (seedling: Seedling) => void;
  removeSeedling: (seedlingId: string) => void;
  transplantSeedling: (seedlingId: string, x: number, z: number) => void;
  completeSetup: () => void;
  advanceOnboarding: (step: 'setup' | 'inspect' | 'plant' | 'done') => void;
  syncFromServer: () => Promise<void>;
  syncToServer: () => void;
}

export const useGardenStore = create<GardenStore>((set, get) => ({
  config: defaultConfig,
  isLoaded: false,
  syncStatus: 'idle' as SyncStatus,
  _debouncedSync: null,

  _initialize: () => {
    if (get().isLoaded) return;
    const loaded = loadFromStorage();
    set({ config: loaded, isLoaded: true });
  },

  syncFromServer: async () => {
    try {
      const res = await fetch('/api/garden');
      if (!res.ok) return;
      const data = await res.json();
      if (data.garden) {
        const serverConfig = data.garden as GardenConfig;
        // Ensure arrays exist
        if (!serverConfig.raisedBeds) serverConfig.raisedBeds = [];
        if (!serverConfig.zones) serverConfig.zones = [];
        if (!serverConfig.seedlings) serverConfig.seedlings = [];
        serverConfig.zones = serverConfig.zones.map((z: GardenZone) => ({
          ...z,
          zoneType: z.zoneType || 'in-ground',
        }));
        // Server data takes priority when it exists
        saveToStorage(serverConfig);
        set({ config: serverConfig });
      }
    } catch {
      // Non-blocking: if API fails, local data is preserved
    }
  },

  syncToServer: () => {
    // Clear any pending debounce
    const existing = get()._debouncedSync;
    if (existing) clearTimeout(existing);

    set({ syncStatus: 'saving' });

    const timer = setTimeout(async () => {
      try {
        const config = get().config;
        const res = await fetch('/api/garden', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config),
        });
        if (res.ok) {
          set({ syncStatus: 'saved' });
          // Reset to idle after 3 seconds
          setTimeout(() => {
            if (get().syncStatus === 'saved') {
              set({ syncStatus: 'idle' });
            }
          }, 3000);
        } else {
          set({ syncStatus: 'error' });
        }
      } catch {
        set({ syncStatus: 'error' });
      }
    }, SYNC_DEBOUNCE_MS);

    set({ _debouncedSync: timer });
  },

  setConfig: (newConfig: GardenConfig) => {
    saveToStorage(newConfig);
    set({ config: newConfig });
    get().syncToServer();
  },

  updateConfig: (partial: Partial<GardenConfig>) => {
    const updated = { ...get().config, ...partial };
    saveToStorage(updated);
    set({ config: updated });
    get().syncToServer();
  },

  addPlant: (plantId, x, z, raisedBedId?, varietyId?, zoneId?) => {
    const item: PlantedItem = {
      plantId,
      x,
      z,
      plantedDate: new Date().toISOString(),
      ...(raisedBedId ? { raisedBedId } : {}),
      ...(varietyId ? { varietyId } : {}),
      ...(zoneId ? { zoneId } : {}),
    };
    const prev = get().config;
    const updated = { ...prev, plantedItems: [...prev.plantedItems, item] };
    saveToStorage(updated);
    set({ config: updated });
    get().syncToServer();
  },

  removePlant: (index: number) => {
    const prev = get().config;
    const updated = { ...prev, plantedItems: prev.plantedItems.filter((_, i) => i !== index) };
    saveToStorage(updated);
    set({ config: updated });
    get().syncToServer();
  },

  clearGarden: () => {
    const prev = get().config;
    const updated = { ...prev, plantedItems: [], raisedBeds: [] };
    saveToStorage(updated);
    set({ config: updated });
    get().syncToServer();
  },

  addRaisedBed: (bed: RaisedBed) => {
    const prev = get().config;
    const updated = { ...prev, raisedBeds: [...(prev.raisedBeds || []), bed] };
    saveToStorage(updated);
    set({ config: updated });
    get().syncToServer();
  },

  removeRaisedBed: (bedId: string) => {
    const prev = get().config;
    const updated = {
      ...prev,
      raisedBeds: (prev.raisedBeds || []).filter((b) => b.id !== bedId),
      plantedItems: prev.plantedItems.filter((p) => p.raisedBedId !== bedId),
    };
    saveToStorage(updated);
    set({ config: updated });
    get().syncToServer();
  },

  updateRaisedBed: (bedId: string, partial: Partial<RaisedBed>) => {
    const prev = get().config;
    const updated = {
      ...prev,
      raisedBeds: (prev.raisedBeds || []).map((b) =>
        b.id === bedId ? { ...b, ...partial } : b
      ),
    };
    saveToStorage(updated);
    set({ config: updated });
    get().syncToServer();
  },

  addZone: (zone: GardenZone) => {
    const prev = get().config;
    const updated = { ...prev, zones: [...(prev.zones || []), zone] };
    saveToStorage(updated);
    set({ config: updated });
    get().syncToServer();
  },

  removeZone: (zoneId: string) => {
    const prev = get().config;
    const updated = {
      ...prev,
      zones: (prev.zones || []).filter((z) => z.id !== zoneId),
      plantedItems: prev.plantedItems.map((p) =>
        p.zoneId === zoneId ? { ...p, zoneId: undefined } : p
      ),
    };
    saveToStorage(updated);
    set({ config: updated });
    get().syncToServer();
  },

  updateZone: (zoneId: string, partial: Partial<GardenZone>) => {
    const prev = get().config;
    const updated = {
      ...prev,
      zones: (prev.zones || []).map((z) =>
        z.id === zoneId ? { ...z, ...partial } : z
      ),
    };
    saveToStorage(updated);
    set({ config: updated });
    get().syncToServer();
  },

  addSeedling: (seedling: Seedling) => {
    const prev = get().config;
    const updated = { ...prev, seedlings: [...(prev.seedlings || []), seedling] };
    saveToStorage(updated);
    set({ config: updated });
    get().syncToServer();
  },

  removeSeedling: (seedlingId: string) => {
    const prev = get().config;
    const updated = { ...prev, seedlings: (prev.seedlings || []).filter((s) => s.id !== seedlingId) };
    saveToStorage(updated);
    set({ config: updated });
    get().syncToServer();
  },

  transplantSeedling: (seedlingId: string, x: number, z: number) => {
    const prev = get().config;
    const seedling = (prev.seedlings || []).find((s) => s.id === seedlingId);
    if (!seedling) return;
    const item: PlantedItem = {
      plantId: seedling.plantId,
      x,
      z,
      plantedDate: new Date().toISOString(),
      ...(seedling.varietyId ? { varietyId: seedling.varietyId } : {}),
    };
    const updated = {
      ...prev,
      plantedItems: [...prev.plantedItems, item],
      seedlings: (prev.seedlings || []).filter((s) => s.id !== seedlingId),
    };
    saveToStorage(updated);
    set({ config: updated });
    get().syncToServer();
  },

  completeSetup: () => {
    const prev = get().config;
    const updated = { ...prev, setupCompleted: true, onboardingStep: 'inspect' as const };
    saveToStorage(updated);
    set({ config: updated });
    get().syncToServer();
  },

  advanceOnboarding: (step: 'setup' | 'inspect' | 'plant' | 'done') => {
    const prev = get().config;
    const updated = { ...prev, onboardingStep: step };
    saveToStorage(updated);
    set({ config: updated });
    get().syncToServer();
  },
}));

// Cross-tab sync: when another tab writes to localStorage, update this store
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === GARDEN_STORAGE_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue) as GardenConfig;
        if (!parsed.raisedBeds) parsed.raisedBeds = [];
        if (!parsed.zones) parsed.zones = [];
        if (!parsed.seedlings) parsed.seedlings = [];
        parsed.zones = parsed.zones.map((z: GardenZone) => ({
          ...z,
          zoneType: z.zoneType || 'in-ground',
        }));
        useGardenStore.setState({ config: parsed });
      } catch {
        // ignore
      }
    }
  });
}
