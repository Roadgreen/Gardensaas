'use client';

import { useMemo } from 'react';
import type { Plant } from '@/types';

interface PlantInfoPanelProps {
  plant: Plant;
  plantedDate: string;
  allPlants: Plant[];
  onClose: () => void;
}

const SUN_ICONS: Record<string, string> = {
  'full-sun': '\u2600\uFE0F',
  'partial-shade': '\u26C5',
  'full-shade': '\uD83C\uDF27\uFE0F',
};

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function PlantInfoPanel({ plant, plantedDate, allPlants, onClose }: PlantInfoPanelProps) {
  const daysPlanted = useMemo(() => {
    const now = new Date();
    const planted = new Date(plantedDate);
    return Math.floor((now.getTime() - planted.getTime()) / (1000 * 60 * 60 * 24));
  }, [plantedDate]);

  const progress = Math.min(daysPlanted / plant.harvestDays, 1);
  const isHarvest = progress >= 1;

  const companionNames = useMemo(() =>
    plant.companionPlants.map((id) => {
      const p = allPlants.find((ap) => ap.id === id);
      return p ? p.name.en : id;
    }),
  [plant.companionPlants, allPlants]);

  const enemyNames = useMemo(() =>
    plant.enemyPlants.map((id) => {
      const p = allPlants.find((ap) => ap.id === id);
      return p ? p.name.en : id;
    }),
  [plant.enemyPlants, allPlants]);

  const plantingMonthsStr = useMemo(() =>
    plant.plantingMonths.map((m) => MONTH_SHORT[m - 1]).join(', '),
  [plant.plantingMonths]);

  return (
    <div
      style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        zIndex: 50,
        width: '320px',
        maxHeight: 'calc(100vh - 120px)',
        overflowY: 'auto',
        background: 'linear-gradient(145deg, rgba(10, 30, 18, 0.97), rgba(15, 45, 25, 0.97))',
        backdropFilter: 'blur(16px)',
        borderRadius: '16px',
        border: '2px solid rgba(74, 222, 128, 0.4)',
        padding: '20px',
        fontFamily: '"Nunito", system-ui, sans-serif',
        color: 'white',
        boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(74, 222, 128, 0.3) transparent',
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: 'rgba(255,255,255,0.1)',
          border: 'none',
          borderRadius: '8px',
          color: '#9CA3AF',
          cursor: 'pointer',
          padding: '4px 8px',
          fontSize: '14px',
          fontFamily: '"Nunito", system-ui, sans-serif',
        }}
      >
        {'\u2715'}
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '12px',
          background: `linear-gradient(135deg, ${plant.color}, ${plant.color}88)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid rgba(255,255,255,0.2)',
          fontSize: '24px',
        }}>
          {plant.category === 'vegetable' ? '\uD83E\uDD66' :
           plant.category === 'herb' ? '\uD83C\uDF3F' :
           plant.category === 'fruit' ? '\uD83C\uDF53' :
           plant.category === 'root' ? '\uD83E\uDD55' : '\uD83C\uDF31'}
        </div>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#86EFAC' }}>
            {plant.name.en}
          </div>
          <div style={{ fontSize: '13px', color: '#6EE7B7', opacity: 0.7 }}>
            {plant.name.fr}
          </div>
          <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px', textTransform: 'capitalize' }}>
            {plant.category} - {plant.difficulty}
          </div>
        </div>
      </div>

      {/* Description */}
      <div style={{
        fontSize: '12px', color: '#D1D5DB', lineHeight: '1.5',
        padding: '10px', borderRadius: '10px',
        background: 'rgba(0,0,0,0.2)',
        marginBottom: '14px',
      }}>
        {plant.description.en}
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '11px', color: '#9CA3AF' }}>Growth Progress</span>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: isHarvest ? '#FFD700' : '#4ADE80' }}>
            {Math.round(progress * 100)}% - Day {daysPlanted}/{plant.harvestDays}
          </span>
        </div>
        <div style={{
          background: '#1F2937', borderRadius: '6px', height: '8px', overflow: 'hidden',
        }}>
          <div style={{
            background: isHarvest
              ? 'linear-gradient(90deg, #FFD700, #FFA500)'
              : 'linear-gradient(90deg, #4ADE80, #22C55E)',
            height: '100%',
            width: `${Math.min(progress * 100, 100)}%`,
            borderRadius: '6px',
            transition: 'width 0.3s',
          }} />
        </div>
      </div>

      {/* Info grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px',
        marginBottom: '14px',
      }}>
        <InfoItem icon="\uD83D\uDCCF" label="Spacing" value={`${plant.spacingCm} cm`} />
        <InfoItem icon="\uD83D\uDCC8" label="Height" value={`${plant.heightCm} cm`} />
        <InfoItem icon="\uD83D\uDCA7" label="Watering" value={plant.wateringFrequency.replace(/-/g, ' ')} />
        <InfoItem icon="\uD83C\uDF31" label="Depth" value={`${plant.depthCm} cm`} />
        <InfoItem icon={SUN_ICONS[plant.sunExposure[0]] || '\u2600\uFE0F'} label="Sun" value={plant.sunExposure.map(s => s.replace(/-/g, ' ')).join(', ')} />
        <InfoItem icon="\uD83D\uDCC5" label="Harvest" value={`${plant.harvestDays} days`} />
      </div>

      {/* Planting months */}
      <div style={{
        marginBottom: '14px', padding: '10px', borderRadius: '10px',
        background: 'rgba(74, 222, 128, 0.08)',
        border: '1px solid rgba(74, 222, 128, 0.15)',
      }}>
        <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#9CA3AF', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {'\uD83D\uDCC5'} Best Planting Months
        </div>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {MONTH_SHORT.map((m, i) => {
            const isActive = plant.plantingMonths.includes(i + 1);
            return (
              <span key={m} style={{
                padding: '2px 6px', borderRadius: '4px', fontSize: '10px',
                background: isActive ? 'rgba(74, 222, 128, 0.3)' : 'rgba(0,0,0,0.2)',
                color: isActive ? '#86EFAC' : '#6B7280',
                fontWeight: isActive ? 'bold' : 'normal',
              }}>
                {m}
              </span>
            );
          })}
        </div>
      </div>

      {/* Soil types */}
      <div style={{
        marginBottom: '14px', padding: '10px', borderRadius: '10px',
        background: 'rgba(139, 105, 20, 0.1)',
        border: '1px solid rgba(139, 105, 20, 0.2)',
      }}>
        <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#9CA3AF', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {'\uD83E\uDEA8'} Preferred Soils
        </div>
        <div style={{ fontSize: '12px', color: '#D4A06C' }}>
          {plant.soilTypes.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')}
        </div>
      </div>

      {/* Companion plants */}
      {companionNames.length > 0 && (
        <div style={{
          marginBottom: '10px', padding: '10px', borderRadius: '10px',
          background: 'rgba(34, 197, 94, 0.08)',
          border: '1px solid rgba(34, 197, 94, 0.15)',
        }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#9CA3AF', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {'\uD83E\uDD1D'} Companion Plants
          </div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {companionNames.map((name) => (
              <span key={name} style={{
                padding: '2px 8px', borderRadius: '6px', fontSize: '11px',
                background: 'rgba(74, 222, 128, 0.2)',
                color: '#86EFAC',
              }}>
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Enemy plants */}
      {enemyNames.length > 0 && (
        <div style={{
          marginBottom: '10px', padding: '10px', borderRadius: '10px',
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.15)',
        }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#9CA3AF', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {'\u26A0\uFE0F'} Keep Away From
          </div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {enemyNames.map((name) => (
              <span key={name} style={{
                padding: '2px 8px', borderRadius: '6px', fontSize: '11px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#FCA5A5',
              }}>
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      {plant.tips.length > 0 && (
        <div style={{
          padding: '10px', borderRadius: '10px',
          background: 'rgba(251, 191, 36, 0.06)',
          border: '1px solid rgba(251, 191, 36, 0.15)',
        }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#9CA3AF', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {'\uD83D\uDCA1'} Growing Tips
          </div>
          <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: '#FBBF24', lineHeight: '1.6' }}>
            {plant.tips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={{
      padding: '8px', borderRadius: '8px',
      background: 'rgba(0,0,0,0.15)',
      border: '1px solid rgba(255,255,255,0.05)',
    }}>
      <div style={{ fontSize: '14px', marginBottom: '2px' }}>{icon}</div>
      <div style={{ fontSize: '9px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ fontSize: '11px', color: '#E5E7EB', fontWeight: 'bold' }}>{value}</div>
    </div>
  );
}
