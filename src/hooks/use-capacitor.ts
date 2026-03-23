'use client';

import { useEffect, useState } from 'react';

interface CapacitorState {
  isNative: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  platform: 'ios' | 'android' | 'web';
}

const defaultState: CapacitorState = {
  isNative: false,
  isIOS: false,
  isAndroid: false,
  platform: 'web',
};

export function useCapacitor(): CapacitorState {
  const [state, setState] = useState<CapacitorState>(defaultState);

  useEffect(() => {
    // Capacitor sets window.Capacitor when running in native app
    const cap = (window as any).Capacitor;
    if (cap) {
      const platform = cap.getPlatform?.() as 'ios' | 'android' | 'web';
      setState({
        isNative: platform !== 'web',
        isIOS: platform === 'ios',
        isAndroid: platform === 'android',
        platform: platform ?? 'web',
      });
    }
  }, []);

  return state;
}
