'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Plant } from '@/types';

interface GardenUIOverlayProps {
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  taskCount: number;
  dialogue: string;
  showDialogue: boolean;
  onDialogueClose: () => void;
  onIsometricToggle: () => void;
  isIsometric: boolean;
  plantCount: number;
  harvestReadyCount: number;
  // Plant placement (optional)
  plants?: Plant[];
  selectedPlantType?: string | null;
  onSelectPlantType?: (id: string | null) => void;
  isPlacementMode?: boolean;
  onTogglePlacement?: () => void;
  onRemoveSelectedPlant?: () => void;
  selectedPlantIndex?: number | null;
}

const SEASON_ICONS: Record<string, string> = {
  spring: '\u{1F338}',
  summer: '\u{2600}\u{FE0F}',
  autumn: '\u{1F342}',
  winter: '\u{2744}\u{FE0F}',
};

const SEASON_LABELS: Record<string, string> = {
  spring: 'Spring',
  summer: 'Summer',
  autumn: 'Autumn',
  winter: 'Winter',
};

const TIME_ICONS: Record<string, string> = {
  morning: '\u{1F305}',
  afternoon: '\u{2600}\u{FE0F}',
  evening: '\u{1F307}',
};

const CATEGORY_ICONS: Record<string, string> = {
  vegetable: '\u{1F966}',
  herb: '\u{1F33F}',
  fruit: '\u{1F353}',
  root: '\u{1F955}',
  all: '\u{1F331}',
};

function getWeather(season: string): string {
  const hour = new Date().getHours();
  if (season === 'winter') return hour % 3 === 0 ? 'Snowy' : 'Overcast';
  if (season === 'spring') return hour % 4 === 0 ? 'Light Rain' : 'Partly Cloudy';
  if (season === 'autumn') return hour % 3 === 0 ? 'Cloudy' : 'Breezy';
  const states = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Clear'];
  return states[hour % states.length];
}

const WEATHER_ICONS: Record<string, string> = {
  Sunny: '\u{2600}\u{FE0F}',
  'Partly Cloudy': '\u{26C5}',
  Cloudy: '\u{2601}\u{FE0F}',
  'Light Rain': '\u{1F327}\u{FE0F}',
  Clear: '\u{1F31F}',
  Snowy: '\u{1F328}\u{FE0F}',
  Overcast: '\u{2601}\u{FE0F}',
  Breezy: '\u{1F343}',
};

const overlayBase: React.CSSProperties = {
  background: 'rgba(15, 40, 24, 0.88)',
  backdropFilter: 'blur(12px)',
  borderRadius: '14px',
  padding: '8px 14px',
  border: '1px solid rgba(74, 222, 128, 0.25)',
  fontFamily: '"Nunito", system-ui, sans-serif',
  color: 'white',
  fontSize: '13px',
};

export function GardenUIOverlay({
  season,
  timeOfDay,
  taskCount,
  dialogue,
  showDialogue,
  onDialogueClose,
  onIsometricToggle,
  isIsometric,
  plantCount,
  harvestReadyCount,
  plants = [],
  selectedPlantType = null,
  onSelectPlantType,
  isPlacementMode = false,
  onTogglePlacement,
  onRemoveSelectedPlant,
  selectedPlantIndex = null,
}: GardenUIOverlayProps) {
  const [weather, setWeather] = useState('Sunny');
  const [currentDate, setCurrentDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showToolbar, setShowToolbar] = useState(false);

  useEffect(() => {
    setWeather(getWeather(season));
    const now = new Date();
    setCurrentDate(now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
  }, [season]);

  const filteredPlants = useMemo(() => {
    if (categoryFilter === 'all') return plants;
    return plants.filter((p) => p.category === categoryFilter);
  }, [plants, categoryFilter]);

  const categories = useMemo(() => {
    const cats = new Set(plants.map((p) => p.category));
    return ['all', ...Array.from(cats)];
  }, [plants]);

  const handlePlantSelect = useCallback((plantId: string) => {
    if (selectedPlantType === plantId) {
      onSelectPlantType?.(null);
    } else {
      onSelectPlantType?.(plantId);
    }
  }, [selectedPlantType, onSelectPlantType]);

  return (
    <>
      {/* ===== TOP-LEFT: Season & Weather ===== */}
      <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 20, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ ...overlayBase, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>{SEASON_ICONS[season]}</span>
          <div>
            <div style={{ fontWeight: 'bold', color: '#86EFAC', fontSize: '14px' }}>
              {SEASON_LABELS[season]}
            </div>
            <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
              {currentDate} {TIME_ICONS[timeOfDay]}
            </div>
          </div>
        </div>

        <div style={{ ...overlayBase, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
          <span style={{ fontSize: '16px' }}>{WEATHER_ICONS[weather] || '\u{2600}\u{FE0F}'}</span>
          <span>{weather}</span>
        </div>
      </div>

      {/* ===== TOP-RIGHT: Stats & Controls ===== */}
      <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 20, display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
        {taskCount > 0 && (
          <div style={{
            ...overlayBase,
            border: '1px solid rgba(251, 191, 36, 0.4)',
            color: '#FDE047',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span>{'\u{1F4CB}'}</span>
            {taskCount} task{taskCount !== 1 ? 's' : ''}
          </div>
        )}

        <div style={{ ...overlayBase, fontSize: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{'\u{1F331}'}</span>
            <span>{plantCount} plant{plantCount !== 1 ? 's' : ''}</span>
          </div>
          {harvestReadyCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', color: '#FFD700' }}>
              <span>{'\u{2728}'}</span>
              <span>{harvestReadyCount} ready!</span>
            </div>
          )}
        </div>

        {/* Camera toggle */}
        <button
          onClick={onIsometricToggle}
          style={{
            ...overlayBase,
            background: isIsometric ? 'rgba(74, 222, 128, 0.3)' : overlayBase.background,
            border: isIsometric ? '1px solid rgba(74, 222, 128, 0.6)' : overlayBase.border,
            color: isIsometric ? '#86EFAC' : '#9CA3AF',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            transition: 'all 0.2s',
          }}
        >
          <span>{'\u{1F3AE}'}</span>
          {isIsometric ? 'Isometric' : 'Free Cam'}
        </button>

        {/* Remove selected plant */}
        {selectedPlantIndex !== null && (
          <button
            onClick={() => onRemoveSelectedPlant?.()}
            style={{
              ...overlayBase,
              background: 'rgba(220, 38, 38, 0.3)',
              border: '1px solid rgba(220, 38, 38, 0.5)',
              color: '#FCA5A5',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>{'\u{1F5D1}'}</span>
            Remove Plant
          </button>
        )}
      </div>

      {/* ===== BOTTOM: Plant Toolbar ===== */}
      <div style={{
        position: 'absolute',
        bottom: showDialogue ? '110px' : '12px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 25,
        transition: 'bottom 0.3s ease',
      }}>
        {/* Toggle toolbar button */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
          <button
            onClick={() => { setShowToolbar(!showToolbar); if (!showToolbar) onTogglePlacement?.(); }}
            style={{
              ...overlayBase,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 'bold',
              background: isPlacementMode
                ? 'linear-gradient(135deg, rgba(74, 222, 128, 0.4), rgba(34, 197, 94, 0.4))'
                : overlayBase.background,
              border: isPlacementMode
                ? '2px solid #4ADE80'
                : '1px solid rgba(74, 222, 128, 0.3)',
              transition: 'all 0.2s',
              borderRadius: '16px',
            }}
          >
            <span style={{ fontSize: '18px' }}>{isPlacementMode ? '\u{2705}' : '\u{1F331}'}</span>
            {isPlacementMode ? (selectedPlantType ? 'Tap garden to plant!' : 'Select a plant below') : 'Plant Something'}
          </button>
        </div>

        {/* Plant selection toolbar */}
        {showToolbar && isPlacementMode && (
          <div style={{
            ...overlayBase,
            padding: '10px',
            borderRadius: '16px',
            maxWidth: 'min(92vw, 600px)',
            border: '2px solid rgba(74, 222, 128, 0.4)',
          }}>
            {/* Category filter */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  style={{
                    background: categoryFilter === cat ? 'rgba(74, 222, 128, 0.3)' : 'rgba(0,0,0,0.2)',
                    border: categoryFilter === cat ? '1px solid #4ADE80' : '1px solid transparent',
                    borderRadius: '8px',
                    padding: '4px 10px',
                    color: categoryFilter === cat ? '#86EFAC' : '#9CA3AF',
                    fontSize: '11px',
                    cursor: 'pointer',
                    fontFamily: '"Nunito", system-ui, sans-serif',
                    transition: 'all 0.15s',
                  }}
                >
                  {CATEGORY_ICONS[cat] || '\u{1F33F}'} {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>

            {/* Plant list - scrollable */}
            <div style={{
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              paddingBottom: '6px',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(74, 222, 128, 0.3) transparent',
            }}>
              {filteredPlants.map((plant) => (
                <button
                  key={plant.id}
                  onClick={() => handlePlantSelect(plant.id)}
                  style={{
                    background: selectedPlantType === plant.id
                      ? 'rgba(74, 222, 128, 0.35)'
                      : 'rgba(0,0,0,0.25)',
                    border: selectedPlantType === plant.id
                      ? '2px solid #4ADE80'
                      : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    padding: '8px 10px',
                    color: 'white',
                    cursor: 'pointer',
                    fontFamily: '"Nunito", system-ui, sans-serif',
                    fontSize: '11px',
                    minWidth: '72px',
                    flexShrink: 0,
                    transition: 'all 0.15s',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {/* Color dot */}
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: plant.color,
                    border: '2px solid rgba(255,255,255,0.3)',
                    boxShadow: selectedPlantType === plant.id ? `0 0 8px ${plant.color}` : 'none',
                  }} />
                  <span style={{
                    fontSize: '10px',
                    whiteSpace: 'nowrap',
                    color: selectedPlantType === plant.id ? '#86EFAC' : '#D1D5DB',
                    fontWeight: selectedPlantType === plant.id ? 'bold' : 'normal',
                  }}>
                    {plant.name.en}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ===== DIALOGUE BOX (Animal Crossing style) ===== */}
      {showDialogue && (
        <div
          onClick={onDialogueClose}
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 30,
            width: 'min(92%, 520px)',
            cursor: 'pointer',
          }}
        >
          <div style={{
            background: 'linear-gradient(145deg, rgba(15, 40, 24, 0.95), rgba(20, 50, 30, 0.95))',
            backdropFilter: 'blur(15px)',
            borderRadius: '18px',
            padding: '18px 22px',
            border: '2.5px solid #4ADE80',
            fontFamily: '"Nunito", "Comic Sans MS", cursive, sans-serif',
            color: 'white',
            boxShadow: '0 10px 40px rgba(0,0,0,0.4), 0 0 20px rgba(74, 222, 128, 0.1)',
            position: 'relative',
          }}>
            {/* Character name tag */}
            <div style={{
              position: 'absolute',
              top: '-14px',
              left: '16px',
              background: 'linear-gradient(135deg, #16A34A, #22C55E)',
              color: 'white',
              padding: '4px 14px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 'bold',
              border: '2px solid #4ADE80',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}>
              Sprout
            </div>

            <div style={{ marginTop: '6px', fontSize: '14px', lineHeight: '1.6' }}>
              {dialogue}
            </div>

            <div style={{
              textAlign: 'right',
              fontSize: '11px',
              color: '#6EE7B7',
              marginTop: '10px',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}>
              {'tap to continue \u{25BC}'}
            </div>
          </div>
        </div>
      )}

      {/* ===== HINT ===== */}
      <div style={{
        position: 'absolute',
        bottom: '4px',
        right: '12px',
        zIndex: 15,
        fontFamily: '"Nunito", system-ui, sans-serif',
        fontSize: '10px',
        color: 'rgba(156, 163, 175, 0.5)',
        pointerEvents: 'none',
      }}>
        Click plants for info | Click Sprout for tips | Scroll to zoom | Drag to rotate
      </div>
    </>
  );
}
