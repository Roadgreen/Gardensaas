'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import type { Plant, PlantVariety, GardenZone, RaisedBed } from '@/types';

interface VarietyPickerProps {
  plant: Plant;
  zones: GardenZone[];
  raisedBeds: RaisedBed[];
  onConfirm: (varietyId: string | undefined, targetZoneId: string | undefined, targetBedId: string | undefined) => void;
  onCancel: () => void;
}

const panelStyle: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  zIndex: 60,
  width: 'min(95vw, 420px)',
  maxHeight: '80vh',
  overflowY: 'auto',
  background: 'linear-gradient(145deg, rgba(10, 30, 18, 0.98), rgba(15, 45, 25, 0.98))',
  backdropFilter: 'blur(20px)',
  borderRadius: '16px',
  border: '2px solid rgba(74, 222, 128, 0.5)',
  padding: '20px',
  fontFamily: '"Nunito", system-ui, sans-serif',
  color: 'white',
  boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
  scrollbarWidth: 'thin',
  scrollbarColor: 'rgba(74, 222, 128, 0.3) transparent',
};

export function VarietyPicker({ plant, zones, raisedBeds, onConfirm, onCancel }: VarietyPickerProps) {
  const t = useTranslations('garden3d.varietyPicker');
  const locale = useLocale();
  const [selectedVariety, setSelectedVariety] = useState<string | undefined>(undefined);
  const [selectedTarget, setSelectedTarget] = useState<string>('ground'); // 'ground' | 'zone-{id}' | 'bed-{id}'

  const varieties = plant.varieties || [];
  const hasVarieties = varieties.length > 0;

  const handleConfirm = () => {
    let zoneId: string | undefined;
    let bedId: string | undefined;
    if (selectedTarget.startsWith('zone-')) {
      zoneId = selectedTarget.replace('zone-', '');
    } else if (selectedTarget.startsWith('bed-')) {
      bedId = selectedTarget.replace('bed-', '');
    }
    onConfirm(selectedVariety, zoneId, bedId);
  };

  const selectedVarietyData = selectedVariety ? varieties.find(v => v.id === selectedVariety) : null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onCancel}
        style={{
          position: 'absolute', inset: 0, zIndex: 55,
          background: 'rgba(0,0,0,0.5)',
        }}
      />

      <div style={panelStyle}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '10px',
            background: `linear-gradient(135deg, ${selectedVarietyData?.color || plant.color}, ${selectedVarietyData?.color || plant.color}88)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid rgba(255,255,255,0.2)',
            fontSize: '20px',
          }}>
            {plant.category === 'vegetable' ? '\uD83E\uDD66' :
             plant.category === 'herb' ? '\uD83C\uDF3F' :
             plant.category === 'fruit' ? '\uD83C\uDF53' :
             plant.category === 'root' ? '\uD83E\uDD55' : '\uD83C\uDF31'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#86EFAC' }}>
              {t('plantingTitle', { name: locale === 'fr' ? plant.name.fr : plant.name.en })}
            </div>
            <div style={{ fontSize: '11px', color: '#6EE7B7', opacity: 0.7 }}>
              {plant.name.fr}
            </div>
          </div>
          <button onClick={onCancel} style={{
            background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px',
            color: '#9CA3AF', cursor: 'pointer', padding: '4px 8px', fontSize: '14px',
            fontFamily: '"Nunito", system-ui, sans-serif',
          }}>{'\u2715'}</button>
        </div>

        {/* Variety selection */}
        {hasVarieties && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              fontSize: '11px', fontWeight: 'bold', color: '#9CA3AF',
              marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              {t('selectVariety')} ({varieties.length} {t('available')})
            </div>

            {/* Default / no variety */}
            <div
              onClick={() => setSelectedVariety(undefined)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 10px', borderRadius: '10px', marginBottom: '4px',
                cursor: 'pointer',
                background: !selectedVariety ? 'rgba(74, 222, 128, 0.15)' : 'rgba(0,0,0,0.1)',
                border: !selectedVariety ? '1px solid rgba(74, 222, 128, 0.4)' : '1px solid transparent',
              }}
            >
              <div style={{
                width: '28px', height: '28px', borderRadius: '6px',
                background: plant.color,
                border: '2px solid rgba(255,255,255,0.15)',
              }} />
              <div>
                <div style={{ fontSize: '12px', color: !selectedVariety ? '#86EFAC' : '#D1D5DB', fontWeight: !selectedVariety ? 'bold' : 'normal' }}>
                  {t('standardVariety')}
                </div>
                <div style={{ fontSize: '9px', color: '#9CA3AF' }}>{plant.harvestDays} {t('days')}</div>
              </div>
            </div>

            {/* Variety options */}
            {varieties.map((v) => (
              <div
                key={v.id}
                onClick={() => setSelectedVariety(v.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '8px 10px', borderRadius: '10px', marginBottom: '4px',
                  cursor: 'pointer',
                  background: selectedVariety === v.id ? 'rgba(74, 222, 128, 0.15)' : 'rgba(0,0,0,0.1)',
                  border: selectedVariety === v.id ? '1px solid rgba(74, 222, 128, 0.4)' : '1px solid transparent',
                }}
              >
                <div style={{
                  width: '28px', height: '28px', borderRadius: '6px',
                  background: v.color || plant.color,
                  border: '2px solid rgba(255,255,255,0.15)',
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', color: selectedVariety === v.id ? '#86EFAC' : '#D1D5DB', fontWeight: selectedVariety === v.id ? 'bold' : 'normal' }}>
                    {locale === 'fr' ? v.name.fr : v.name.en}
                  </div>
                  <div style={{ fontSize: '9px', color: '#6EE7B7', opacity: 0.7 }}>{v.name.fr}</div>
                  {v.description && (
                    <div style={{ fontSize: '9px', color: '#9CA3AF', marginTop: '2px' }}>{locale === 'fr' ? v.description.fr : v.description.en}</div>
                  )}
                </div>
                <div style={{ fontSize: '10px', color: '#9CA3AF', whiteSpace: 'nowrap' }}>
                  {v.harvestDays || plant.harvestDays}d
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Target zone/bed selection */}
        {(zones.length > 0 || raisedBeds.length > 0) && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              fontSize: '11px', fontWeight: 'bold', color: '#9CA3AF',
              marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              {t('plantIn')}
            </div>

            {/* Ground (default) */}
            <div
              onClick={() => setSelectedTarget('ground')}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '7px 10px', borderRadius: '8px', marginBottom: '3px',
                cursor: 'pointer',
                background: selectedTarget === 'ground' ? 'rgba(74, 222, 128, 0.15)' : 'rgba(0,0,0,0.1)',
                border: selectedTarget === 'ground' ? '1px solid rgba(74, 222, 128, 0.4)' : '1px solid transparent',
              }}
            >
              <span style={{ fontSize: '14px' }}>{'\uD83C\uDF31'}</span>
              <span style={{ fontSize: '11px', color: selectedTarget === 'ground' ? '#86EFAC' : '#D1D5DB' }}>
                {t('directGround')}
              </span>
            </div>

            {/* Zones */}
            {zones.map((zone) => (
              <div
                key={zone.id}
                onClick={() => setSelectedTarget(`zone-${zone.id}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '7px 10px', borderRadius: '8px', marginBottom: '3px',
                  cursor: 'pointer',
                  background: selectedTarget === `zone-${zone.id}` ? `${zone.color}25` : 'rgba(0,0,0,0.1)',
                  border: selectedTarget === `zone-${zone.id}` ? `1px solid ${zone.color}66` : '1px solid transparent',
                }}
              >
                <div style={{
                  width: '10px', height: '10px', borderRadius: '2px',
                  background: zone.color,
                }} />
                <span style={{ fontSize: '11px', color: selectedTarget === `zone-${zone.id}` ? zone.color : '#D1D5DB' }}>
                  {zone.name}
                </span>
                <span style={{ fontSize: '9px', color: '#9CA3AF' }}>
                  {zone.lengthM}x{zone.widthM}m
                </span>
              </div>
            ))}

            {/* Raised beds */}
            {raisedBeds.map((bed) => (
              <div
                key={bed.id}
                onClick={() => setSelectedTarget(`bed-${bed.id}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '7px 10px', borderRadius: '8px', marginBottom: '3px',
                  cursor: 'pointer',
                  background: selectedTarget === `bed-${bed.id}` ? 'rgba(210, 160, 108, 0.15)' : 'rgba(0,0,0,0.1)',
                  border: selectedTarget === `bed-${bed.id}` ? '1px solid rgba(210, 160, 108, 0.4)' : '1px solid transparent',
                }}
              >
                <span style={{ fontSize: '14px' }}>{'\uD83E\uDDF1'}</span>
                <span style={{ fontSize: '11px', color: selectedTarget === `bed-${bed.id}` ? '#D4A06C' : '#D1D5DB' }}>
                  {bed.name}
                </span>
                <span style={{ fontSize: '9px', color: '#9CA3AF' }}>
                  {bed.lengthM}x{bed.widthM}m
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '10px', borderRadius: '10px',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#9CA3AF', cursor: 'pointer', fontSize: '12px',
            fontFamily: '"Nunito", system-ui, sans-serif',
          }}>{t('cancel')}</button>
          <button onClick={handleConfirm} style={{
            flex: 1, padding: '10px', borderRadius: '10px',
            background: 'rgba(74, 222, 128, 0.3)', border: '1px solid rgba(74, 222, 128, 0.5)',
            color: '#86EFAC', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold',
            fontFamily: '"Nunito", system-ui, sans-serif',
          }}>{t('confirmPlanting')}</button>
        </div>
      </div>
    </>
  );
}
