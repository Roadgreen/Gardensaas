'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
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
  // Tool system
  activeTool?: string | null;
  onToolSelect?: (tool: string | null) => void;
  gardenHealth?: number;
}

const SEASON_ICONS: Record<string, string> = {
  spring: '\u{1F338}',
  summer: '\u{2600}\u{FE0F}',
  autumn: '\u{1F342}',
  winter: '\u{2744}\u{FE0F}',
};

// Season labels are now loaded via translations

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

// Weather state keys (used as i18n keys)
type WeatherKey = 'snowy' | 'overcast' | 'lightRain' | 'partlyCloudy' | 'cloudy' | 'breezy' | 'sunny' | 'clear';

function getWeatherKey(season: string): WeatherKey {
  const hour = new Date().getHours();
  if (season === 'winter') return hour % 3 === 0 ? 'snowy' : 'overcast';
  if (season === 'spring') return hour % 4 === 0 ? 'lightRain' : 'partlyCloudy';
  if (season === 'autumn') return hour % 3 === 0 ? 'cloudy' : 'breezy';
  const states: WeatherKey[] = ['sunny', 'partlyCloudy', 'cloudy', 'lightRain', 'clear'];
  return states[hour % states.length];
}

const WEATHER_ICONS: Record<string, string> = {
  snowy: '\u{1F328}\u{FE0F}',
  overcast: '\u{2601}\u{FE0F}',
  lightRain: '\u{1F327}\u{FE0F}',
  partlyCloudy: '\u{26C5}',
  cloudy: '\u{2601}\u{FE0F}',
  breezy: '\u{1F343}',
  sunny: '\u{2600}\u{FE0F}',
  clear: '\u{1F31F}',
};

// Game toolbar tool ids - labels/descriptions come from translations
const TOOL_IDS = [
  { id: 'water', icon: '\u{1F4A7}', color: '#60A5FA' },
  { id: 'plant', icon: '\u{1F331}', color: '#4ADE80' },
  { id: 'harvest', icon: '\u{1F33E}', color: '#FFD700' },
  { id: 'info', icon: '\u{1F50D}', color: '#A78BFA' },
  { id: 'fertilize', icon: '\u{2728}', color: '#F59E0B' },
];

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
  activeTool = null,
  onToolSelect,
  gardenHealth = 100,
}: GardenUIOverlayProps) {
  const t = useTranslations('garden3d.overlay');
  const tCatalog = useTranslations('garden3d.catalog');
  const locale = useLocale();
  const [weatherKey, setWeatherKey] = useState<WeatherKey>('sunny');
  const [currentDate, setCurrentDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolTooltip, setToolTooltip] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Build TOOLS array with translated labels/descriptions
  const TOOLS = useMemo(() => [
    { id: 'water', icon: '\u{1F4A7}', label: t('water'), color: '#60A5FA', description: t('waterDesc') },
    { id: 'plant', icon: '\u{1F331}', label: t('plant'), color: '#4ADE80', description: t('plantDesc') },
    { id: 'harvest', icon: '\u{1F33E}', label: t('harvest'), color: '#FFD700', description: t('harvestDesc') },
    { id: 'info', icon: '\u{1F50D}', label: t('info'), color: '#A78BFA', description: t('infoDesc') },
    { id: 'fertilize', icon: '\u{2728}', label: t('boost'), color: '#F59E0B', description: t('boostDesc') },
  ], [t]);

  useEffect(() => {
    setWeatherKey(getWeatherKey(season));
    const now = new Date();
    setCurrentDate(now.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
    setIsMobile(window.innerWidth < 640);
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [season, locale]);

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

  const handleToolClick = useCallback((toolId: string) => {
    if (activeTool === toolId) {
      onToolSelect?.(null);
    } else {
      onToolSelect?.(toolId);
      // If plant tool, also trigger placement mode
      if (toolId === 'plant') {
        setShowToolbar(true);
        onTogglePlacement?.();
      }
    }
  }, [activeTool, onToolSelect, onTogglePlacement]);

  // Keyboard shortcuts: 1-5 for tools, Escape to deselect
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key;
      if (key >= '1' && key <= '5') {
        const toolIndex = parseInt(key) - 1;
        const tool = TOOLS[toolIndex];
        if (tool) handleToolClick(tool.id);
      } else if (key === 'Escape') {
        onToolSelect?.(null);
        setShowToolbar(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleToolClick, onToolSelect]);

  return (
    <>
      {/* ===== TOP-LEFT: Season & Weather ===== */}
      <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 20, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ ...overlayBase, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>{SEASON_ICONS[season]}</span>
          <div>
            <div style={{ fontWeight: 'bold', color: '#86EFAC', fontSize: '14px' }}>
              {t(season as 'spring' | 'summer' | 'autumn' | 'winter')}
            </div>
            <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
              {currentDate} {TIME_ICONS[timeOfDay]}
            </div>
          </div>
        </div>

        <div style={{ ...overlayBase, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
          <span style={{ fontSize: '16px' }}>{WEATHER_ICONS[weatherKey] || '\u{2600}\u{FE0F}'}</span>
          <span>{t(weatherKey as Parameters<typeof t>[0])}</span>
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
            animation: 'pulse 2s ease-in-out infinite',
          }}>
            <span>{'\u{1F4CB}'}</span>
            {t('tasks', { count: taskCount })}
          </div>
        )}

        <div style={{ ...overlayBase, fontSize: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{'\u{1F331}'}</span>
            <span>{t('plants', { count: plantCount })}</span>
          </div>
          {harvestReadyCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', color: '#FFD700' }}>
              <span>{'\u{2728}'}</span>
              <span>{t('harvestReady', { count: harvestReadyCount })}</span>
            </div>
          )}
          {/* Garden Health Bar */}
          <div style={{ marginTop: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span style={{ fontSize: '10px', color: '#9CA3AF' }}>
                {gardenHealth >= 80 ? '\u{1F49A}' : gardenHealth >= 50 ? '\u{1F49B}' : '\u{2764}\u{FE0F}'} {t('health')}
              </span>
              <span style={{
                fontSize: '10px',
                fontWeight: 'bold',
                color: gardenHealth >= 80 ? '#4ADE80' : gardenHealth >= 50 ? '#FBBF24' : '#F87171',
              }}>
                {gardenHealth}%
              </span>
            </div>
            <div style={{
              background: '#1F2937',
              borderRadius: '4px',
              height: '6px',
              overflow: 'hidden',
              width: '100%',
              minWidth: '80px',
            }}>
              <div style={{
                height: '100%',
                width: `${Math.min(gardenHealth, 100)}%`,
                borderRadius: '4px',
                background: gardenHealth >= 80
                  ? 'linear-gradient(90deg, #4ADE80, #22C55E)'
                  : gardenHealth >= 50
                    ? 'linear-gradient(90deg, #FBBF24, #F59E0B)'
                    : 'linear-gradient(90deg, #F87171, #EF4444)',
                transition: 'width 0.5s ease, background 0.5s ease',
                boxShadow: gardenHealth >= 80 ? '0 0 6px rgba(74, 222, 128, 0.4)' : 'none',
              }} />
            </div>
          </div>
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
          {isIsometric ? t('isometric') : t('freeCam')}
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
            {t('removePlant')}
          </button>
        )}
      </div>

      {/* ===== BOTTOM: Game Hotbar Toolbar ===== */}
      <div style={{
        position: 'absolute',
        bottom: showDialogue ? '120px' : (isMobile ? '76px' : '16px'),
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 25,
        transition: 'bottom 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
      }}>
        {/* Tool tooltip */}
        {toolTooltip && (
          <div style={{
            ...overlayBase,
            padding: '4px 12px',
            fontSize: '11px',
            color: '#86EFAC',
            borderRadius: '8px',
            animation: 'fadeInUp 0.2s ease-out',
          }}>
            {toolTooltip}
          </div>
        )}

        {/* Plant selection toolbar (when plant tool active) */}
        {showToolbar && (activeTool === 'plant' || isPlacementMode) && (
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
                  {CATEGORY_ICONS[cat] || '\u{1F33F}'} {tCatalog((cat as Parameters<typeof tCatalog>[0]) || 'all')}
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
                    {locale === 'fr' ? plant.name.fr : plant.name.en}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main hotbar - game style tool slots */}
        <div style={{
          ...overlayBase,
          padding: '6px 10px',
          borderRadius: '16px',
          display: 'flex',
          gap: '4px',
          alignItems: 'center',
          border: '2px solid rgba(74, 222, 128, 0.35)',
          background: 'rgba(10, 30, 18, 0.92)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.4), 0 0 15px rgba(74, 222, 128, 0.08)',
        }}>
          {TOOLS.map((tool, index) => (
            <div key={tool.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                onClick={() => handleToolClick(tool.id)}
                onMouseEnter={() => setToolTooltip(tool.description)}
                onMouseLeave={() => setToolTooltip(null)}
                style={{
                  width: isMobile ? '40px' : '48px',
                  height: isMobile ? '40px' : '48px',
                  borderRadius: '12px',
                  border: activeTool === tool.id
                    ? `2px solid ${tool.color}`
                    : '2px solid rgba(255,255,255,0.1)',
                  background: activeTool === tool.id
                    ? `${tool.color}22`
                    : 'rgba(0,0,0,0.3)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2px',
                  transition: 'all 0.2s',
                  position: 'relative',
                  fontFamily: '"Nunito", system-ui, sans-serif',
                  transform: activeTool === tool.id ? 'translateY(-4px) scale(1.05)' : 'translateY(0)',
                  boxShadow: activeTool === tool.id
                    ? `0 4px 12px ${tool.color}33, 0 0 8px ${tool.color}22`
                    : 'none',
                }}
              >
                <span style={{ fontSize: '20px', lineHeight: 1 }}>{tool.icon}</span>
                <span style={{
                  fontSize: '8px',
                  color: activeTool === tool.id ? tool.color : '#9CA3AF',
                  fontWeight: activeTool === tool.id ? 'bold' : 'normal',
                  letterSpacing: '0.5px',
                }}>
                  {tool.label}
                </span>

                {/* Hotkey number */}
                <span style={{
                  position: 'absolute',
                  top: '2px',
                  right: '4px',
                  fontSize: '8px',
                  color: 'rgba(156, 163, 175, 0.4)',
                  fontWeight: 'bold',
                }}>
                  {index + 1}
                </span>

                {/* Active indicator dot */}
                {activeTool === tool.id && (
                  <span style={{
                    position: 'absolute',
                    bottom: '-6px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: tool.color,
                    boxShadow: `0 0 6px ${tool.color}`,
                  }} />
                )}
              </button>
              {/* Separator between tools */}
              {index < TOOLS.length - 1 && (
                <div style={{
                  width: '1px',
                  height: '24px',
                  background: 'rgba(255,255,255,0.08)',
                  margin: '0 2px',
                }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ===== DIALOGUE BOX (Animal Crossing style) ===== */}
      {showDialogue && (
        <div
          onClick={onDialogueClose}
          style={{
            position: 'absolute',
            bottom: isMobile ? '160px' : '100px',
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
              {t('tapToContinue') + ' \u{25BC}'}
            </div>
          </div>
        </div>
      )}

      {/* ===== HINT (hidden on small screens via CSS media query) ===== */}
      <div
        className="garden-hint-desktop"
        style={{
          position: 'absolute',
          bottom: '4px',
          right: '12px',
          zIndex: 15,
          fontFamily: '"Nunito", system-ui, sans-serif',
          fontSize: '10px',
          color: 'rgba(156, 163, 175, 0.5)',
          pointerEvents: 'none',
        }}
      >
        {t('hint')}
      </div>
    </>
  );
}
