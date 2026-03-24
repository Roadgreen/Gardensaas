'use client';

import { useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';

interface DragDropOverlayProps {
  isDragging: boolean;
  onDrop: (x: number, y: number) => void;
  /** For touch drag: current finger position (clientX/Y) */
  touchPosition?: { clientX: number; clientY: number } | null;
}

export function DragDropOverlay({ isDragging, onDrop, touchPosition }: DragDropOverlayProps) {
  const t = useTranslations('garden3d.catalog');
  const overlayRef = useRef<HTMLDivElement>(null);
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsOver(false);
      if (!overlayRef.current) return;
      const rect = overlayRef.current.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width;
      const relY = (e.clientY - rect.top) / rect.height;
      onDrop(relX, relY);
    },
    [onDrop]
  );

  // Check if touch position is over this overlay
  const isTouchOver = !!(touchPosition && overlayRef.current && (() => {
    const rect = overlayRef.current!.getBoundingClientRect();
    return (
      touchPosition.clientX >= rect.left &&
      touchPosition.clientX <= rect.right &&
      touchPosition.clientY >= rect.top &&
      touchPosition.clientY <= rect.bottom
    );
  })());

  const showOverState = isOver || isTouchOver;

  if (!isDragging) return null;

  return (
    <div
      ref={overlayRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 28,
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: showOverState ? 'rgba(74, 222, 128, 0.08)' : 'transparent',
        border: showOverState ? '3px dashed rgba(74, 222, 128, 0.5)' : '3px dashed rgba(74, 222, 128, 0.15)',
        borderRadius: '8px',
        transition: 'all 0.2s ease',
      }}
    >
      {showOverState && (
        <div
          style={{
            background: 'rgba(15, 40, 24, 0.85)',
            backdropFilter: 'blur(8px)',
            borderRadius: '16px',
            padding: '16px 24px',
            border: '2px solid rgba(74, 222, 128, 0.5)',
            fontFamily: '"Nunito", system-ui, sans-serif',
            color: '#86EFAC',
            fontSize: '16px',
            fontWeight: 'bold',
            textAlign: 'center',
            pointerEvents: 'none',
            boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '4px' }}>{'\uD83C\uDF31'}</div>
          {t('dropToPlant')}
        </div>
      )}
    </div>
  );
}
