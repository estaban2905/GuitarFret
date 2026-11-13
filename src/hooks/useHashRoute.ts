/**
 * @file useHashRoute.ts
 * @description Custom hook para sincronizar rutas por hash (#/escalas, #/acordes, #/compositor)
 * con el historial de navegación del navegador.
 */

import { useCallback, useEffect, useState } from 'react';
import type { AppRouteTab } from '../types/music.types';

export function getTabFromHash(hashValue?: string): AppRouteTab {
  const rawHash =
    hashValue !== undefined ? hashValue : typeof window !== 'undefined' ? window.location.hash : '';
  const normalized = rawHash.toLowerCase();

  if (
    normalized.includes('compositor') ||
    normalized.includes('pentagrama') ||
    normalized.includes('staff')
  ) {
    return 'compositor';
  }
  if (normalized.includes('acordes') || normalized.includes('chords')) {
    return 'chords';
  }
  return 'scales';
}

export function getHashForTab(tab: AppRouteTab): string {
  switch (tab) {
    case 'compositor':
      return '#/compositor';
    case 'chords':
      return '#/acordes';
    case 'scales':
    default:
      return '#/escalas';
  }
}

export function useHashRoute() {
  const [currentTab, setCurrentTab] = useState<AppRouteTab>(() => getTabFromHash());

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentTab(getTabFromHash());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateToTab = useCallback((tab: AppRouteTab) => {
    setCurrentTab(tab);
    if (typeof window !== 'undefined') {
      window.location.hash = getHashForTab(tab);
    }
  }, []);

  return { currentTab, navigateToTab };
}
