'use client';

import { create } from 'zustand';
import type { GardenConfig, PlantedItem, RaisedBed, GardenZone } from '@/types';

const GARDEN_STORAGE_KEY = 'garden-config';

const defaultConfig: GardenConfig = {
  length: 4,
  width: 3,
  soilType: 'loamy',
  climateZone: 'temperate',
  sunExposure: 'full-sun',
  plantedItems: [],
  raisedBeds: [],
  zones: [],
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

  _initialize: () => void;
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
  completeSetup: () => void;
  advanceOnboarding: (step: 'setup' | 'inspect' | 'plant' | 'done') => void;
}

export const useGardenStore = create<GardenStore>((set, get) => ({
  config: defaultConfig,
  isLoaded: false,

  _initialize: () => {
    if (get().isLoaded) return;
    const loaded = loadFromStorage();
    set({ config: loaded, isLoaded: true });
  },

  setConfig: (newConfig: GardenConfig) => {
    saveToStorage(newConfig);
    set({ config: newConfig });
  },

  updateConfig: (partial: Partial<GardenConfig>) => {
    const updated = { ...get().config, ...partial };
    saveToStorage(updated);
    set({ config: updated });
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
  },

  removePlant: (index: number) => {
    const prev = get().config;
    const updated = { ...prev, plantedItems: prev.plantedItems.filter((_, i) => i !== index) };
    saveToStorage(updated);
    set({ config: updated });
  },

  clearGarden: () => {
    const prev = get().config;
    const updated = { ...prev, plantedItems: [], raisedBeds: [] };
    saveToStorage(updated);
    set({ config: updated });
  },

  addRaisedBed: (bed: RaisedBed) => {
    const prev = get().config;
    const updated = { ...prev, raisedBeds: [...(prev.raisedBeds || []), bed] };
    saveToStorage(updated);
    set({ config: updated });
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
  },

  addZone: (zone: GardenZone) => {
    const prev = get().config;
    const updated = { ...prev, zones: [...(prev.zones || []), zone] };
    saveToStorage(updated);
    set({ config: updated });
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
  },

  completeSetup: () => {
    const prev = get().config;
    const updated = { ...prev, setupCompleted: true, onboardingStep: 'inspect' as const };
    saveToStorage(updated);
    set({ config: updated });
  },

  advanceOnboarding: (step: 'setup' | 'inspect' | 'plant' | 'done') => {
    const prev = get().config;
    const updated = { ...prev, onboardingStep: step };
    saveToStorage(updated);
    set({ config: updated });
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
