'use client';

import { useTranslations, useLocale } from 'next-intl';
import type { Plant } from '@/types';

interface SpacingInfoOverlayProps {
  plant: Plant | null;
  isVisible: boolean;
}

export function SpacingInfoOverlay({ plant, isVisible }: SpacingInfoOverlayProps) {
  const t = useTranslations('garden3d.catalog');
  const tInfo = useTranslations('garden3d.infoPanel');
  const locale = useLocale();
  if (!isVisible || !plant) return null;

  const rowSpacing = plant.rowSpacingCm || Math.round(plant.spacingCm * 1.5);

  return (
    <div
      style={{
        position: 'absolute',
        top: '12px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 40,
        background: 'linear-gradient(145deg, rgba(10, 30, 18, 0.95), rgba(15, 45, 25, 0.95))',
        backdropFilter: 'blur(12px)',
        borderRadius: '14px',
        border: '2px solid rgba(168, 85, 247, 0.4)',
        padding: '12px 20px',
        fontFamily: '"Nunito", system-ui, sans-serif',
        color: 'white',
        boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        maxWidth: 'min(95vw, 600px)',
      }}
    >
      {/* Plant color indicator */}
      <div style={{
        width: '36px', height: '36px', borderRadius: '10px',
        background: `linear-gradient(135deg, ${plant.color}, ${plant.color}88)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '2px solid rgba(255,255,255,0.2)',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: '18px' }}>
          {plant.category === 'vegetable' ? '\uD83E\uDD66' :
           plant.category === 'herb' ? '\uD83C\uDF3F' :
           plant.category === 'fruit' ? '\uD83C\uDF53' :
           plant.category === 'root' ? '\uD83E\uDD55' : '\uD83C\uDF31'}
        </span>
      </div>

      {/* Plant name */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#C084FC' }}>
          {locale === 'fr' ? plant.name.fr : plant.name.en}
        </div>
        <div style={{ fontSize: '10px', color: '#9CA3AF' }}>
          {t('placingPlant')}
        </div>
      </div>

      {/* Spacing divider */}
      <div style={{ width: '1px', height: '32px', background: 'rgba(168, 85, 247, 0.3)', flexShrink: 0 }} />

      {/* Spacing info */}
      <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '9px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
            {tInfo('betweenPlants')}
          </div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#C084FC' }}>
            {plant.spacingCm} cm
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '9px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
            {tInfo('betweenRows')}
          </div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#A78BFA' }}>
            {rowSpacing} cm
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '9px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
            {t('depthLabel')}
          </div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#818CF8' }}>
            {plant.depthCm} cm
          </div>
        </div>
      </div>

      {/* Grid snap indicator */}
      <div style={{
        flexShrink: 0, padding: '4px 10px', borderRadius: '8px',
        background: 'rgba(168, 85, 247, 0.15)',
        border: '1px solid rgba(168, 85, 247, 0.3)',
        fontSize: '9px', color: '#C084FC', textAlign: 'center',
      }}>
        <div>{'\uD83E\uDDF2'} {t('gridSnap')}</div>
        <div style={{ fontWeight: 'bold' }}>{plant.spacingCm}cm</div>
      </div>
    </div>
  );
}
