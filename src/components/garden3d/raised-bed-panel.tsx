'use client';

import { useState } from 'react';
import type { RaisedBed, RaisedBedSoilType } from '@/types';
import { RAISED_BED_SOIL_LABELS } from '@/types';

interface RaisedBedPanelProps {
  beds: RaisedBed[];
  selectedBedId: string | null;
  onAddBed: (bed: RaisedBed) => void;
  onRemoveBed: (bedId: string) => void;
  onUpdateBed: (bedId: string, partial: Partial<RaisedBed>) => void;
  onSelectBed: (bedId: string | null) => void;
  onClose: () => void;
}

const SOIL_OPTIONS: { value: RaisedBedSoilType; label: string; emoji: string }[] = [
  { value: 'potting-mix', label: 'Potting Mix', emoji: '\uD83C\uDF31' },
  { value: 'compost', label: 'Compost Blend', emoji: '\u267B\uFE0F' },
  { value: 'loamy', label: 'Loamy Soil', emoji: '\u2B50' },
  { value: 'sandy', label: 'Sandy Mix', emoji: '\uD83C\uDFD6' },
  { value: 'peat-mix', label: 'Peat Mix', emoji: '\uD83C\uDF33' },
  { value: 'clay-mix', label: 'Clay Mix', emoji: '\uD83E\uDDF1' },
];

const PRESETS = [
  { label: 'Small (1x0.5m)', lengthM: 1, widthM: 0.5, heightM: 0.3 },
  { label: 'Medium (1.5x0.8m)', lengthM: 1.5, widthM: 0.8, heightM: 0.35 },
  { label: 'Large (2x1m)', lengthM: 2, widthM: 1, heightM: 0.4 },
  { label: 'XL (3x1.2m)', lengthM: 3, widthM: 1.2, heightM: 0.45 },
];

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
  border: '2px solid rgba(210, 160, 108, 0.4)',
  padding: '20px',
  fontFamily: '"Nunito", system-ui, sans-serif',
  color: 'white',
  boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
  maxHeight: '70vh',
  overflowY: 'auto',
  scrollbarWidth: 'thin',
  scrollbarColor: 'rgba(210, 160, 108, 0.3) transparent',
};

export function RaisedBedPanel({
  beds, selectedBedId, onAddBed, onRemoveBed, onUpdateBed, onSelectBed, onClose
}: RaisedBedPanelProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('Raised Bed ' + (beds.length + 1));
  const [newLength, setNewLength] = useState('1.5');
  const [newWidth, setNewWidth] = useState('0.8');
  const [newHeight, setNewHeight] = useState('0.35');
  const [newSoil, setNewSoil] = useState<RaisedBedSoilType>('potting-mix');

  const handleCreate = () => {
    const bed: RaisedBed = {
      id: 'bed-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      name: newName || 'Raised Bed',
      x: 50, // Center of garden
      z: 50,
      widthM: parseFloat(newWidth) || 0.8,
      lengthM: parseFloat(newLength) || 1.5,
      heightM: parseFloat(newHeight) || 0.35,
      soilType: newSoil,
    };
    onAddBed(bed);
    setShowCreate(false);
    setNewName('Raised Bed ' + (beds.length + 2));
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setNewLength(preset.lengthM.toString());
    setNewWidth(preset.widthM.toString());
    setNewHeight(preset.heightM.toString());
  };

  const selectedBed = beds.find((b) => b.id === selectedBedId);

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>{'\uD83E\uDDF1'}</span>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#D4A06C' }}>Raised Beds</div>
            <div style={{ fontSize: '10px', color: '#9CA3AF' }}>{beds.length} bed{beds.length !== 1 ? 's' : ''} placed</div>
          </div>
        </div>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px',
          color: '#9CA3AF', cursor: 'pointer', padding: '4px 10px', fontSize: '14px',
          fontFamily: '"Nunito", system-ui, sans-serif',
        }}>{'\u2715'}</button>
      </div>

      {/* Existing beds list */}
      {beds.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          {beds.map((bed) => (
            <div key={bed.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 10px', borderRadius: '10px', marginBottom: '4px',
              background: selectedBedId === bed.id ? 'rgba(210, 160, 108, 0.2)' : 'rgba(0,0,0,0.15)',
              border: selectedBedId === bed.id ? '1px solid rgba(210, 160, 108, 0.4)' : '1px solid transparent',
              cursor: 'pointer',
            }} onClick={() => onSelectBed(selectedBedId === bed.id ? null : bed.id)}>
              <div>
                <div style={{ fontSize: '12px', color: '#D4A06C', fontWeight: 'bold' }}>{bed.name}</div>
                <div style={{ fontSize: '10px', color: '#9CA3AF' }}>
                  {bed.lengthM}x{bed.widthM}x{bed.heightM}m - {RAISED_BED_SOIL_LABELS[bed.soilType]}
                </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); onRemoveBed(bed.id); }} style={{
                background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '6px', color: '#FCA5A5', cursor: 'pointer', padding: '4px 8px',
                fontSize: '10px', fontFamily: '"Nunito", system-ui, sans-serif',
              }}>{'\uD83D\uDDD1'}</button>
            </div>
          ))}
        </div>
      )}

      {/* Create new bed form */}
      {showCreate ? (
        <div style={{
          padding: '14px', borderRadius: '12px',
          background: 'rgba(0,0,0,0.2)',
          border: '1px solid rgba(210, 160, 108, 0.2)',
        }}>
          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#D4A06C', marginBottom: '10px' }}>
            New Raised Bed
          </div>

          {/* Name */}
          <div style={{ marginBottom: '8px' }}>
            <label style={{ fontSize: '10px', color: '#9CA3AF', display: 'block', marginBottom: '4px' }}>Name</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              style={{
                width: '100%', padding: '6px 10px', borderRadius: '8px',
                border: '1px solid rgba(210, 160, 108, 0.3)', background: 'rgba(0,0,0,0.3)',
                color: 'white', fontSize: '12px', fontFamily: '"Nunito", system-ui, sans-serif',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Presets */}
          <div style={{ marginBottom: '8px' }}>
            <label style={{ fontSize: '10px', color: '#9CA3AF', display: 'block', marginBottom: '4px' }}>Quick Size</label>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {PRESETS.map((p) => (
                <button key={p.label} onClick={() => applyPreset(p)} style={{
                  padding: '4px 8px', borderRadius: '6px', fontSize: '10px',
                  background: newLength === p.lengthM.toString() && newWidth === p.widthM.toString()
                    ? 'rgba(210, 160, 108, 0.3)' : 'rgba(0,0,0,0.2)',
                  border: newLength === p.lengthM.toString() && newWidth === p.widthM.toString()
                    ? '1px solid rgba(210, 160, 108, 0.5)' : '1px solid transparent',
                  color: '#D4A06C', cursor: 'pointer',
                  fontFamily: '"Nunito", system-ui, sans-serif',
                }}>{p.label}</button>
              ))}
            </div>
          </div>

          {/* Dimensions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '8px' }}>
            <div>
              <label style={{ fontSize: '10px', color: '#9CA3AF', display: 'block', marginBottom: '2px' }}>Length (m)</label>
              <input type="number" min="0.3" max="5" step="0.1" value={newLength}
                onChange={(e) => setNewLength(e.target.value)}
                style={{
                  width: '100%', padding: '4px 6px', borderRadius: '6px',
                  border: '1px solid rgba(210, 160, 108, 0.2)', background: 'rgba(0,0,0,0.3)',
                  color: 'white', fontSize: '11px', fontFamily: '"Nunito", system-ui, sans-serif',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '10px', color: '#9CA3AF', display: 'block', marginBottom: '2px' }}>Width (m)</label>
              <input type="number" min="0.2" max="3" step="0.1" value={newWidth}
                onChange={(e) => setNewWidth(e.target.value)}
                style={{
                  width: '100%', padding: '4px 6px', borderRadius: '6px',
                  border: '1px solid rgba(210, 160, 108, 0.2)', background: 'rgba(0,0,0,0.3)',
                  color: 'white', fontSize: '11px', fontFamily: '"Nunito", system-ui, sans-serif',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '10px', color: '#9CA3AF', display: 'block', marginBottom: '2px' }}>Height (m)</label>
              <input type="number" min="0.15" max="1" step="0.05" value={newHeight}
                onChange={(e) => setNewHeight(e.target.value)}
                style={{
                  width: '100%', padding: '4px 6px', borderRadius: '6px',
                  border: '1px solid rgba(210, 160, 108, 0.2)', background: 'rgba(0,0,0,0.3)',
                  color: 'white', fontSize: '11px', fontFamily: '"Nunito", system-ui, sans-serif',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Soil type */}
          <div style={{ marginBottom: '10px' }}>
            <label style={{ fontSize: '10px', color: '#9CA3AF', display: 'block', marginBottom: '4px' }}>Soil Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
              {SOIL_OPTIONS.map((opt) => (
                <button key={opt.value} onClick={() => setNewSoil(opt.value)} style={{
                  padding: '6px 4px', borderRadius: '8px', fontSize: '10px',
                  background: newSoil === opt.value ? 'rgba(210, 160, 108, 0.25)' : 'rgba(0,0,0,0.2)',
                  border: newSoil === opt.value ? '1px solid rgba(210, 160, 108, 0.5)' : '1px solid transparent',
                  color: newSoil === opt.value ? '#D4A06C' : '#9CA3AF',
                  cursor: 'pointer', fontFamily: '"Nunito", system-ui, sans-serif',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '14px' }}>{opt.emoji}</div>
                  <div>{opt.label}</div>
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
            }}>Cancel</button>
            <button onClick={handleCreate} style={{
              flex: 1, padding: '8px', borderRadius: '8px',
              background: 'rgba(210, 160, 108, 0.3)', border: '1px solid rgba(210, 160, 108, 0.5)',
              color: '#D4A06C', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold',
              fontFamily: '"Nunito", system-ui, sans-serif',
            }}>Add Bed</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowCreate(true)} style={{
          width: '100%', padding: '10px', borderRadius: '10px',
          background: 'rgba(210, 160, 108, 0.15)',
          border: '2px dashed rgba(210, 160, 108, 0.4)',
          color: '#D4A06C', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold',
          fontFamily: '"Nunito", system-ui, sans-serif',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}>
          <span style={{ fontSize: '18px' }}>+</span> Add Raised Bed
        </button>
      )}

      {/* Tip */}
      <div style={{
        marginTop: '10px', fontSize: '10px', color: '#6B7280', textAlign: 'center',
        padding: '6px', borderRadius: '6px', background: 'rgba(0,0,0,0.1)',
      }}>
        Raised beds are placed in the center. Drag to reposition in the garden.
      </div>
    </div>
  );
}
