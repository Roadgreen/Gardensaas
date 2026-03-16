'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';

interface GardenSizeSelectorProps {
  currentLength: number;
  currentWidth: number;
  onResize: (length: number, width: number) => void;
  onClose: () => void;
}

const PRESETS = [
  { labelKey: 'windowBox', length: 1, width: 0.5, emoji: '\uD83E\uDE9F' },
  { labelKey: 'balcony', length: 2, width: 1, emoji: '\uD83C\uDFE0' },
  { labelKey: 'smallPlot', length: 3, width: 2, emoji: '\uD83C\uDF31' },
  { labelKey: 'mediumGarden', length: 5, width: 3, emoji: '\uD83C\uDF33' },
  { labelKey: 'largeGarden', length: 8, width: 5, emoji: '\uD83C\uDFE1' },
  { labelKey: 'farmPlot', length: 12, width: 8, emoji: '\uD83C\uDF3E' },
];

const panelStyle: React.CSSProperties = {
  position: 'absolute',
  top: '12px',
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 50,
  width: 'min(95vw, 420px)',
  background: 'linear-gradient(145deg, rgba(10, 30, 18, 0.97), rgba(15, 45, 25, 0.97))',
  backdropFilter: 'blur(16px)',
  borderRadius: '16px',
  border: '2px solid rgba(74, 222, 128, 0.4)',
  padding: '20px',
  fontFamily: '"Nunito", system-ui, sans-serif',
  color: 'white',
  boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
};

export function GardenSizeSelector({ currentLength, currentWidth, onResize, onClose }: GardenSizeSelectorProps) {
  const [length, setLength] = useState(currentLength.toString());
  const [width, setWidth] = useState(currentWidth.toString());
  const t = useTranslations('garden3d.dimensions');
  const tSetup = useTranslations('setup.dimensions');

  const handleApply = useCallback(() => {
    const l = parseFloat(length);
    const w = parseFloat(width);
    if (l > 0 && w > 0 && l <= 50 && w <= 50) {
      onResize(l, w);
      onClose();
    }
  }, [length, width, onResize, onClose]);

  const handlePreset = useCallback((preset: typeof PRESETS[0]) => {
    setLength(preset.length.toString());
    setWidth(preset.width.toString());
    onResize(preset.length, preset.width);
    onClose();
  }, [onResize, onClose]);

  const area = (parseFloat(length) || 0) * (parseFloat(width) || 0);

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>{'\uD83D\uDCCF'}</span>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#86EFAC' }}>{t('title')}</div>
            <div style={{ fontSize: '10px', color: '#9CA3AF' }}>
              {t('current', { length: currentLength, width: currentWidth, area: (currentLength * currentWidth).toFixed(1) })}
            </div>
          </div>
        </div>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px',
          color: '#9CA3AF', cursor: 'pointer', padding: '4px 10px', fontSize: '14px',
          fontFamily: '"Nunito", system-ui, sans-serif',
        }}>{'\u2715'}</button>
      </div>

      {/* Presets */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '10px', color: '#9CA3AF', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {t('quickPresets')}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
          {PRESETS.map((preset) => {
            const isActive = currentLength === preset.length && currentWidth === preset.width;
            return (
              <button
                key={preset.labelKey}
                onClick={() => handlePreset(preset)}
                style={{
                  padding: '8px 4px', borderRadius: '10px', fontSize: '11px',
                  background: isActive ? 'rgba(74, 222, 128, 0.25)' : 'rgba(0,0,0,0.2)',
                  border: isActive ? '1px solid rgba(74, 222, 128, 0.5)' : '1px solid rgba(255,255,255,0.05)',
                  color: isActive ? '#86EFAC' : '#D1D5DB',
                  cursor: 'pointer', fontFamily: '"Nunito", system-ui, sans-serif',
                  textAlign: 'center', transition: 'all 0.15s',
                }}
              >
                <div style={{ fontSize: '16px' }}>{preset.emoji}</div>
                <div style={{ fontWeight: 'bold' }}>{tSetup(preset.labelKey)}</div>
                <div style={{ fontSize: '9px', color: '#9CA3AF' }}>{preset.length}x{preset.width}m</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom dimensions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '8px', alignItems: 'end', marginBottom: '10px' }}>
        <div>
          <label style={{ fontSize: '10px', color: '#9CA3AF', display: 'block', marginBottom: '4px' }}>{t('length')}</label>
          <input
            type="number" min="0.5" max="50" step="0.5"
            value={length}
            onChange={(e) => setLength(e.target.value)}
            style={{
              width: '100%', padding: '8px 10px', borderRadius: '8px',
              border: '1px solid rgba(74, 222, 128, 0.3)', background: 'rgba(0,0,0,0.3)',
              color: 'white', fontSize: '14px', fontFamily: '"Nunito", system-ui, sans-serif',
              outline: 'none', boxSizing: 'border-box', textAlign: 'center',
            }}
          />
        </div>
        <div style={{ fontSize: '14px', color: '#6B7280', paddingBottom: '10px' }}>x</div>
        <div>
          <label style={{ fontSize: '10px', color: '#9CA3AF', display: 'block', marginBottom: '4px' }}>{t('width')}</label>
          <input
            type="number" min="0.5" max="50" step="0.5"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            style={{
              width: '100%', padding: '8px 10px', borderRadius: '8px',
              border: '1px solid rgba(74, 222, 128, 0.3)', background: 'rgba(0,0,0,0.3)',
              color: 'white', fontSize: '14px', fontFamily: '"Nunito", system-ui, sans-serif',
              outline: 'none', boxSizing: 'border-box', textAlign: 'center',
            }}
          />
        </div>
      </div>

      {/* Area info */}
      {area > 0 && (
        <div style={{
          fontSize: '11px', color: '#6EE7B7', textAlign: 'center', marginBottom: '10px',
          padding: '6px', borderRadius: '8px', background: 'rgba(74, 222, 128, 0.08)',
        }}>
          {t('totalArea')} <span style={{ fontWeight: 'bold' }}>{area.toFixed(1)} m&sup2;</span>
          {' '} - {t('roomForPlants', { count: Math.floor(area * 4) })}
        </div>
      )}

      {/* Apply button */}
      <button onClick={handleApply} style={{
        width: '100%', padding: '10px', borderRadius: '10px',
        background: 'rgba(74, 222, 128, 0.25)',
        border: '2px solid rgba(74, 222, 128, 0.5)',
        color: '#86EFAC', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold',
        fontFamily: '"Nunito", system-ui, sans-serif',
        transition: 'all 0.15s',
      }}>
        {t('apply')}
      </button>
    </div>
  );
}
