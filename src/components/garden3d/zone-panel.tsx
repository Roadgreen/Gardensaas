'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { GardenZone, SoilType, SunExposure, ZoneType } from '@/types';
import { ZONE_COLORS, SOIL_LABELS, SUN_LABELS, ZONE_TYPE_LABELS } from '@/types';

interface ZonePanelProps {
  zones: GardenZone[];
  selectedZoneId: string | null;
  onAddZone: (zone: GardenZone) => void;
  onRemoveZone: (zoneId: string) => void;
  onUpdateZone: (zoneId: string, partial: Partial<GardenZone>) => void;
  onSelectZone: (zoneId: string | null) => void;
  onClose: () => void;
  plantedItems: Array<{ zoneId?: string }>;
}

const SOIL_OPTIONS: SoilType[] = ['loamy', 'sandy', 'clay', 'silty', 'peaty', 'chalky'];
const SUN_OPTIONS: SunExposure[] = ['full-sun', 'partial-shade', 'full-shade'];

const moveBtnStyle: React.CSSProperties = {
  padding: '3px 10px',
  borderRadius: '6px',
  fontSize: '9px',
  background: 'rgba(74, 222, 128, 0.2)',
  border: '1px solid rgba(74, 222, 128, 0.3)',
  color: '#4ADE80',
  cursor: 'pointer',
  fontFamily: '"Nunito", system-ui, sans-serif',
};

const panelStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '80px',
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 50,
  width: 'min(95vw, 480px)',
  background: 'linear-gradient(145deg, rgba(10, 30, 18, 0.97), rgba(15, 45, 25, 0.97))',
  backdropFilter: 'blur(16px)',
  borderRadius: '16px',
  border: '2px solid rgba(74, 222, 128, 0.4)',
  padding: '20px',
  fontFamily: '"Nunito", system-ui, sans-serif',
  color: 'white',
  boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
  maxHeight: '70vh',
  overflowY: 'auto',
  scrollbarWidth: 'thin',
  scrollbarColor: 'rgba(74, 222, 128, 0.3) transparent',
};

export function ZonePanel({
  zones, selectedZoneId, onAddZone, onRemoveZone, onUpdateZone, onSelectZone, onClose, plantedItems
}: ZonePanelProps) {
  const t = useTranslations('garden3d.zones');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState(t('defaultName') + ' ' + (zones.length + 1));
  const [newLength, setNewLength] = useState('2');
  const [newWidth, setNewWidth] = useState('1.5');
  const [newSoil, setNewSoil] = useState<SoilType>('loamy');
  const [newSun, setNewSun] = useState<SunExposure>('full-sun');

  const handleCreate = () => {
    const zone: GardenZone = {
      id: 'zone-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      name: newName || t('defaultName'),
      x: 50,
      z: 50,
      widthM: parseFloat(newWidth) || 1.5,
      lengthM: parseFloat(newLength) || 2,
      soilType: newSoil,
      sunExposure: newSun,
      zoneType: 'in-ground',
      color: ZONE_COLORS[zones.length % ZONE_COLORS.length],
    };
    onAddZone(zone);
    setShowCreate(false);
    setNewName(t('defaultName') + ' ' + (zones.length + 2));
  };

  const handleMoveZone = (zoneId: string, dx: number, dz: number) => {
    const zone = zones.find((z) => z.id === zoneId);
    if (!zone) return;
    const newX = Math.max(5, Math.min(95, zone.x + dx));
    const newZ = Math.max(5, Math.min(95, zone.z + dz));
    onUpdateZone(zoneId, { x: newX, z: newZ });
  };

  const getZonePlantCount = (zoneId: string) => {
    return plantedItems.filter((p) => p.zoneId === zoneId).length;
  };

  return (
    <div className="zone-panel-mobile" style={panelStyle}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>{'\uD83D\uDFE9'}</span>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#4ADE80' }}>{t('title')}</div>
            <div style={{ fontSize: '10px', color: '#9CA3AF' }}>{t('zonesPlaced', { count: zones.length })}</div>
          </div>
        </div>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px',
          color: '#9CA3AF', cursor: 'pointer', padding: '4px 10px', fontSize: '14px',
          fontFamily: '"Nunito", system-ui, sans-serif',
        }}>{'\u2715'}</button>
      </div>

      {/* Existing zones list */}
      {zones.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          {zones.map((zone) => (
            <div key={zone.id}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 10px', borderRadius: selectedZoneId === zone.id ? '10px 10px 0 0' : '10px', marginBottom: selectedZoneId === zone.id ? '0' : '4px',
                background: selectedZoneId === zone.id ? 'rgba(74, 222, 128, 0.15)' : 'rgba(0,0,0,0.15)',
                border: selectedZoneId === zone.id ? `1px solid ${zone.color}66` : '1px solid transparent',
                borderBottom: selectedZoneId === zone.id ? 'none' : undefined,
                cursor: 'pointer',
              }} onClick={() => onSelectZone(selectedZoneId === zone.id ? null : zone.id)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '12px', height: '12px', borderRadius: '3px',
                    background: zone.color, border: '1px solid rgba(255,255,255,0.2)',
                  }} />
                  <div>
                    <div style={{ fontSize: '12px', color: zone.color, fontWeight: 'bold' }}>{zone.name}</div>
                    <div style={{ fontSize: '10px', color: '#9CA3AF' }}>
                      {zone.lengthM}x{zone.widthM}m - {SOIL_LABELS[zone.soilType]} - {getZonePlantCount(zone.id)} {t('plantsInZone')}
                    </div>
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); onRemoveZone(zone.id); }} style={{
                  background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '6px', color: '#FCA5A5', cursor: 'pointer', padding: '4px 8px',
                  fontSize: '10px', fontFamily: '"Nunito", system-ui, sans-serif',
                }}>{'\uD83D\uDDD1'}</button>
              </div>
              {/* Position controls when selected */}
              {selectedZoneId === zone.id && (
                <div style={{
                  padding: '8px 10px', borderRadius: '0 0 10px 10px', marginBottom: '4px',
                  background: `${zone.color}12`,
                  border: `1px solid ${zone.color}66`,
                  borderTop: 'none',
                }}>
                  <div style={{ fontSize: '9px', color: '#9CA3AF', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {t('positionInGarden')}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <button onClick={(e) => { e.stopPropagation(); handleMoveZone(zone.id, 0, -5); }} style={moveBtnStyle}>{t('up')}</button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '2px' }}>
                    <button onClick={(e) => { e.stopPropagation(); handleMoveZone(zone.id, -5, 0); }} style={moveBtnStyle}>{t('left')}</button>
                    <div style={{ fontSize: '9px', color: zone.color, minWidth: '50px', textAlign: 'center' }}>
                      {Math.round(zone.x)}%, {Math.round(zone.z)}%
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); handleMoveZone(zone.id, 5, 0); }} style={moveBtnStyle}>{t('right')}</button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '2px' }}>
                    <button onClick={(e) => { e.stopPropagation(); handleMoveZone(zone.id, 0, 5); }} style={moveBtnStyle}>{t('down')}</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create new zone form */}
      {showCreate ? (
        <div style={{
          padding: '14px', borderRadius: '12px',
          background: 'rgba(0,0,0,0.2)',
          border: '1px solid rgba(74, 222, 128, 0.2)',
        }}>
          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#4ADE80', marginBottom: '10px' }}>
            {t('newZone')}
          </div>

          {/* Name */}
          <div style={{ marginBottom: '8px' }}>
            <label style={{ fontSize: '10px', color: '#9CA3AF', display: 'block', marginBottom: '4px' }}>{t('name')}</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              style={{
                width: '100%', padding: '6px 10px', borderRadius: '8px',
                border: '1px solid rgba(74, 222, 128, 0.3)', background: 'rgba(0,0,0,0.3)',
                color: 'white', fontSize: '12px', fontFamily: '"Nunito", system-ui, sans-serif',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Dimensions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
            <div>
              <label style={{ fontSize: '10px', color: '#9CA3AF', display: 'block', marginBottom: '2px' }}>{t('lengthM')}</label>
              <input type="number" min="0.5" max="10" step="0.5" value={newLength}
                onChange={(e) => setNewLength(e.target.value)}
                style={{
                  width: '100%', padding: '4px 6px', borderRadius: '6px',
                  border: '1px solid rgba(74, 222, 128, 0.2)', background: 'rgba(0,0,0,0.3)',
                  color: 'white', fontSize: '11px', fontFamily: '"Nunito", system-ui, sans-serif',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '10px', color: '#9CA3AF', display: 'block', marginBottom: '2px' }}>{t('widthM')}</label>
              <input type="number" min="0.5" max="10" step="0.5" value={newWidth}
                onChange={(e) => setNewWidth(e.target.value)}
                style={{
                  width: '100%', padding: '4px 6px', borderRadius: '6px',
                  border: '1px solid rgba(74, 222, 128, 0.2)', background: 'rgba(0,0,0,0.3)',
                  color: 'white', fontSize: '11px', fontFamily: '"Nunito", system-ui, sans-serif',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Soil type */}
          <div style={{ marginBottom: '8px' }}>
            <label style={{ fontSize: '10px', color: '#9CA3AF', display: 'block', marginBottom: '4px' }}>{t('soilType')}</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
              {SOIL_OPTIONS.map((soil) => (
                <button key={soil} onClick={() => setNewSoil(soil)} style={{
                  padding: '5px 4px', borderRadius: '6px', fontSize: '10px',
                  background: newSoil === soil ? 'rgba(74, 222, 128, 0.25)' : 'rgba(0,0,0,0.2)',
                  border: newSoil === soil ? '1px solid rgba(74, 222, 128, 0.5)' : '1px solid transparent',
                  color: newSoil === soil ? '#4ADE80' : '#9CA3AF',
                  cursor: 'pointer', fontFamily: '"Nunito", system-ui, sans-serif',
                }}>
                  {SOIL_LABELS[soil]}
                </button>
              ))}
            </div>
          </div>

          {/* Sun exposure */}
          <div style={{ marginBottom: '10px' }}>
            <label style={{ fontSize: '10px', color: '#9CA3AF', display: 'block', marginBottom: '4px' }}>{t('sunExposure')}</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
              {SUN_OPTIONS.map((sun) => (
                <button key={sun} onClick={() => setNewSun(sun)} style={{
                  padding: '5px 4px', borderRadius: '6px', fontSize: '9px',
                  background: newSun === sun ? 'rgba(251, 191, 36, 0.25)' : 'rgba(0,0,0,0.2)',
                  border: newSun === sun ? '1px solid rgba(251, 191, 36, 0.5)' : '1px solid transparent',
                  color: newSun === sun ? '#FBBF24' : '#9CA3AF',
                  cursor: 'pointer', fontFamily: '"Nunito", system-ui, sans-serif',
                }}>
                  {SUN_LABELS[sun]}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setShowCreate(false)} style={{
              flex: 1, padding: '8px', borderRadius: '8px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#9CA3AF', cursor: 'pointer', fontSize: '12px',
              fontFamily: '"Nunito", system-ui, sans-serif',
            }}>{t('cancel')}</button>
            <button onClick={handleCreate} style={{
              flex: 1, padding: '8px', borderRadius: '8px',
              background: 'rgba(74, 222, 128, 0.3)', border: '1px solid rgba(74, 222, 128, 0.5)',
              color: '#4ADE80', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold',
              fontFamily: '"Nunito", system-ui, sans-serif',
            }}>{t('addZone')}</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowCreate(true)} style={{
          width: '100%', padding: '10px', borderRadius: '10px',
          background: 'rgba(74, 222, 128, 0.1)',
          border: '2px dashed rgba(74, 222, 128, 0.4)',
          color: '#4ADE80', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold',
          fontFamily: '"Nunito", system-ui, sans-serif',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}>
          <span style={{ fontSize: '18px' }}>+</span> {t('addNewZone')}
        </button>
      )}

      {/* Tip */}
      <div style={{
        marginTop: '10px', fontSize: '10px', color: '#6B7280', textAlign: 'center',
        padding: '6px', borderRadius: '6px', background: 'rgba(0,0,0,0.1)',
      }}>
        {t('tip')}
      </div>
    </div>
  );
}
