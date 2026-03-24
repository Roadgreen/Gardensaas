'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { Plant } from '@/types';

interface PlantCatalogSidebarProps {
  plants: Plant[];
  isOpen: boolean;
  onToggle: () => void;
  onDragStart: (plantId: string) => void;
  onDragEnd: () => void;
  onTouchDragStart?: (plantId: string, touch: { clientX: number; clientY: number }) => void;
  selectedPlantType: string | null;
  onSelectPlant: (plantId: string | null) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  vegetable: '\uD83E\uDD66',
  herb: '\uD83C\uDF3F',
  fruit: '\uD83C\uDF53',
  root: '\uD83E\uDD55',
  ancient: '\uD83C\uDFDB\uFE0F',
  exotic: '\uD83C\uDF34',
  all: '\uD83C\uDF31',
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: '#4ADE80',
  medium: '#FBBF24',
  hard: '#F87171',
};

export function PlantCatalogSidebar({
  plants,
  isOpen,
  onToggle,
  onDragStart,
  onDragEnd,
  onTouchDragStart,
  selectedPlantType,
  onSelectPlant,
}: PlantCatalogSidebarProps) {
  const locale = useLocale();
  const t = useTranslations('garden3d.catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [hoveredPlant, setHoveredPlant] = useState<string | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const touchHoldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);

  const categories = useMemo(() => {
    const cats = new Set(plants.map((p) => p.category));
    return ['all', ...Array.from(cats)];
  }, [plants]);

  const filteredPlants = useMemo(() => {
    let filtered = plants;
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((p) => p.category === categoryFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.en.toLowerCase().includes(q) ||
          p.name.fr.toLowerCase().includes(q) ||
          p.category.includes(q)
      );
    }
    return filtered;
  }, [plants, categoryFilter, searchQuery]);

  const handleDragStart = useCallback(
    (e: React.DragEvent, plantId: string) => {
      e.dataTransfer.setData('text/plain', plantId);
      e.dataTransfer.effectAllowed = 'copy';
      onDragStart(plantId);
      onSelectPlant(plantId);
    },
    [onDragStart, onSelectPlant]
  );

  const handleDragEnd = useCallback(() => {
    onDragEnd();
  }, [onDragEnd]);

  // Touch drag: long-press (300ms) to start dragging a plant on mobile
  const handleTouchStart = useCallback(
    (plantId: string, e: React.TouchEvent) => {
      const touch = e.touches[0];
      touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
      touchHoldTimerRef.current = setTimeout(() => {
        if (onTouchDragStart) {
          onTouchDragStart(plantId, { clientX: touch.clientX, clientY: touch.clientY });
          onSelectPlant(plantId);
        }
      }, 300);
    },
    [onTouchDragStart, onSelectPlant]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      // If finger moves more than 10px before hold timer fires, cancel (user is scrolling)
      if (touchHoldTimerRef.current && touchStartPosRef.current) {
        const touch = e.touches[0];
        const dx = touch.clientX - touchStartPosRef.current.x;
        const dy = touch.clientY - touchStartPosRef.current.y;
        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
          clearTimeout(touchHoldTimerRef.current);
          touchHoldTimerRef.current = null;
        }
      }
    },
    []
  );

  const handleTouchEnd = useCallback(() => {
    if (touchHoldTimerRef.current) {
      clearTimeout(touchHoldTimerRef.current);
      touchHoldTimerRef.current = null;
    }
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (touchHoldTimerRef.current) clearTimeout(touchHoldTimerRef.current);
    };
  }, []);

  return (
    <>
      {/* Mobile backdrop overlay - dismiss sidebar by tapping outside */}
      {isOpen && (
        <div
          onClick={onToggle}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 25,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'none',
          }}
          className="catalog-sidebar-backdrop"
        />
      )}
      <style>{`
        @media (max-width: 768px) {
          .catalog-sidebar-backdrop { display: block !important; }
          .catalog-category-btn {
            padding: 8px 12px !important;
            font-size: 13px !important;
            min-height: 44px !important;
            white-space: nowrap !important;
            flex-shrink: 0 !important;
          }
          .catalog-category-filters {
            flex-wrap: nowrap !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
            scrollbar-width: none !important;
            padding-bottom: 4px !important;
          }
          .catalog-category-filters::-webkit-scrollbar {
            display: none !important;
          }
        }
      `}</style>

      {/* Toggle button */}
      <button
        onClick={onToggle}
        style={{
          position: 'absolute',
          left: isOpen ? '280px' : '0',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 35,
          background: 'rgba(15, 40, 24, 0.92)',
          border: '2px solid rgba(74, 222, 128, 0.4)',
          borderLeft: isOpen ? 'none' : undefined,
          borderRadius: isOpen ? '0 12px 12px 0' : '0 12px 12px 0',
          padding: '12px 8px',
          color: '#86EFAC',
          cursor: 'pointer',
          fontFamily: '"Nunito", system-ui, sans-serif',
          fontSize: '18px',
          transition: 'left 0.3s ease',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <span>{isOpen ? '\u25C0' : '\u25B6'}</span>
        <span style={{ fontSize: '9px', writingMode: 'vertical-lr', letterSpacing: '1px' }}>
          {isOpen ? '' : t('title')}
        </span>
      </button>

      {/* Sidebar panel */}
      <div
        ref={sidebarRef}
        style={{
          position: 'absolute',
          left: isOpen ? '0' : '-280px',
          top: '0',
          bottom: '0',
          width: '280px',
          zIndex: 30,
          background: 'rgba(10, 28, 18, 0.95)',
          backdropFilter: 'blur(16px)',
          borderRight: '2px solid rgba(74, 222, 128, 0.3)',
          transition: 'left 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: '"Nunito", system-ui, sans-serif',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px',
            borderBottom: '1px solid rgba(74, 222, 128, 0.2)',
          }}
        >
          <h3
            style={{
              color: '#86EFAC',
              fontSize: '16px',
              fontWeight: 'bold',
              margin: '0 0 8px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span style={{ fontSize: '20px' }}>{'\uD83C\uDF3B'}</span>
            {t('title')}
          </h3>
          <p
            style={{
              color: '#6B7280',
              fontSize: '11px',
              margin: '0 0 10px 0',
            }}
          >
            {t('subtitle')}
          </p>

          {/* Search */}
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '10px',
              border: '1px solid rgba(74, 222, 128, 0.2)',
              background: 'rgba(0,0,0,0.3)',
              color: 'white',
              fontSize: '12px',
              fontFamily: '"Nunito", system-ui, sans-serif',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Category filter */}
        <div
          className="catalog-category-filters"
          style={{
            padding: '8px 16px',
            display: 'flex',
            gap: '4px',
            flexWrap: 'wrap',
            borderBottom: '1px solid rgba(74, 222, 128, 0.1)',
          }}
        >
          {categories.map((cat) => (
            <button
              key={cat}
              className="catalog-category-btn"
              onClick={() => setCategoryFilter(cat)}
              style={{
                background:
                  categoryFilter === cat
                    ? 'rgba(74, 222, 128, 0.25)'
                    : 'rgba(0,0,0,0.2)',
                border:
                  categoryFilter === cat
                    ? '1px solid #4ADE80'
                    : '1px solid transparent',
                borderRadius: '8px',
                padding: '4px 8px',
                color: categoryFilter === cat ? '#86EFAC' : '#9CA3AF',
                fontSize: '10px',
                cursor: 'pointer',
                fontFamily: '"Nunito", system-ui, sans-serif',
                transition: 'all 0.15s',
              }}
            >
              {CATEGORY_ICONS[cat] || '\uD83C\uDF3F'}{' '}
              {t((cat as Parameters<typeof t>[0]) || 'all')}
            </button>
          ))}
        </div>

        {/* Plant list */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(74, 222, 128, 0.3) transparent',
          }}
        >
          <div style={{ fontSize: '10px', color: '#6B7280', padding: '4px 8px', marginBottom: '4px' }}>
            {t('plantsFound', { count: filteredPlants.length })}
          </div>
          {filteredPlants.map((plant) => (
            <div
              key={plant.id}
              draggable
              onDragStart={(e) => handleDragStart(e, plant.id)}
              onDragEnd={handleDragEnd}
              onTouchStart={(e) => handleTouchStart(plant.id, e)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onClick={() =>
                onSelectPlant(selectedPlantType === plant.id ? null : plant.id)
              }
              onMouseEnter={() => setHoveredPlant(plant.id)}
              onMouseLeave={() => setHoveredPlant(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '10px',
                marginBottom: '4px',
                cursor: 'grab',
                background:
                  selectedPlantType === plant.id
                    ? 'rgba(74, 222, 128, 0.2)'
                    : hoveredPlant === plant.id
                    ? 'rgba(255,255,255,0.05)'
                    : 'transparent',
                border:
                  selectedPlantType === plant.id
                    ? '1px solid rgba(74, 222, 128, 0.5)'
                    : '1px solid transparent',
                transition: 'all 0.15s',
                userSelect: 'none',
              }}
            >
              {/* Plant color circle */}
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: `radial-gradient(circle at 35% 35%, ${plant.color}CC, ${plant.color})`,
                  border: '2px solid rgba(255,255,255,0.15)',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow:
                    selectedPlantType === plant.id
                      ? `0 0 10px ${plant.color}66`
                      : 'none',
                }}
              >
                <span style={{ fontSize: '14px' }}>
                  {CATEGORY_ICONS[plant.category] || '\uD83C\uDF3F'}
                </span>
              </div>

              {/* Plant info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    color: selectedPlantType === plant.id ? '#86EFAC' : '#E5E7EB',
                    fontSize: '12px',
                    fontWeight: selectedPlantType === plant.id ? 'bold' : 'normal',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {locale === 'fr' ? plant.name.fr : plant.name.en}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginTop: '2px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '9px',
                      color: '#9CA3AF',
                    }}
                  >
                    {plant.harvestDays}d
                  </span>
                  <span
                    style={{
                      fontSize: '9px',
                      color: DIFFICULTY_COLORS[plant.difficulty] || '#9CA3AF',
                    }}
                  >
                    {plant.difficulty}
                  </span>
                  <span
                    style={{
                      fontSize: '9px',
                      color: '#C084FC',
                    }}
                  >
                    {plant.spacingCm}cm
                  </span>
                  <span
                    style={{
                      fontSize: '9px',
                      color: '#9CA3AF',
                    }}
                  >
                    {plant.wateringFrequency.replace('-', ' ')}
                  </span>
                </div>
              </div>

              {/* Drag handle */}
              <div
                style={{
                  color: '#4B5563',
                  fontSize: '14px',
                  flexShrink: 0,
                }}
              >
                {'\u2261'}
              </div>
            </div>
          ))}
        </div>

        {/* Selected plant preview */}
        {selectedPlantType && (
          <SelectedPlantPreview
            plant={plants.find((p) => p.id === selectedPlantType) || null}
          />
        )}
      </div>
    </>
  );
}

function SelectedPlantPreview({ plant }: { plant: Plant | null }) {
  const locale = useLocale();
  const t = useTranslations('garden3d.catalog');
  if (!plant) return null;

  return (
    <div
      style={{
        padding: '12px 16px',
        borderTop: '2px solid rgba(74, 222, 128, 0.3)',
        background: 'rgba(0,0,0,0.2)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '6px',
        }}
      >
        <div
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: plant.color,
            border: '2px solid rgba(255,255,255,0.2)',
          }}
        />
        <div>
          <div style={{ color: '#86EFAC', fontSize: '13px', fontWeight: 'bold' }}>
            {locale === 'fr' ? plant.name.fr : plant.name.en}
          </div>
          <div style={{ color: '#6B7280', fontSize: '10px' }}>{plant.name.fr}</div>
        </div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '4px',
          fontSize: '10px',
        }}
      >
        <div style={{ color: '#9CA3AF' }}>
          {'\u2600\uFE0F'} {plant.sunExposure.join(', ').replace(/-/g, ' ')}
        </div>
        <div style={{ color: '#9CA3AF' }}>
          {'\uD83D\uDCA7'} {plant.wateringFrequency.replace(/-/g, ' ')}
        </div>
        <div style={{ color: '#9CA3AF' }}>
          {'\uD83D\uDCC5'} {t('daysToHarvest', { days: plant.harvestDays })}
        </div>
        <div style={{ color: '#9CA3AF' }}>
          {'\uD83D\uDCC8'} {t('heightLabel', { cm: plant.heightCm })}
        </div>
      </div>
      {/* Spacing info */}
      <div style={{
        display: 'flex', gap: '6px', marginTop: '6px',
        padding: '6px 8px', borderRadius: '8px',
        background: 'rgba(168, 85, 247, 0.1)',
        border: '1px solid rgba(168, 85, 247, 0.2)',
      }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#C084FC' }}>{plant.spacingCm}cm</div>
          <div style={{ fontSize: '8px', color: '#9CA3AF' }}>{t('betweenPlants')}</div>
        </div>
        <div style={{ width: '1px', background: 'rgba(168, 85, 247, 0.2)' }} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#A78BFA' }}>{plant.rowSpacingCm || Math.round(plant.spacingCm * 1.5)}cm</div>
          <div style={{ fontSize: '8px', color: '#9CA3AF' }}>{t('betweenRows')}</div>
        </div>
      </div>
      <div
        style={{
          color: '#4ADE80',
          fontSize: '10px',
          marginTop: '6px',
          textAlign: 'center',
          padding: '4px',
          background: 'rgba(74, 222, 128, 0.1)',
          borderRadius: '6px',
        }}
      >
        {t('clickToPlant')}
      </div>
    </div>
  );
}
