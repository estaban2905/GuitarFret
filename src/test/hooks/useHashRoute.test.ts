import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { getHashForTab, getTabFromHash, useHashRoute } from '../../hooks/useHashRoute';

describe('useHashRoute', () => {
  beforeEach(() => {
    window.location.hash = '';
  });

  it('resuelve correctamente las pestañas desde distintos hashes', () => {
    expect(getTabFromHash('#/compositor')).toBe('compositor');
    expect(getTabFromHash('#/pentagrama')).toBe('compositor');
    expect(getTabFromHash('#/staff')).toBe('compositor');
    expect(getTabFromHash('#/acordes')).toBe('chords');
    expect(getTabFromHash('#/chords')).toBe('chords');
    expect(getTabFromHash('#/escalas')).toBe('scales');
    expect(getTabFromHash('')).toBe('scales');
  });

  it('genera el hash canónico por pestaña', () => {
    expect(getHashForTab('scales')).toBe('#/escalas');
    expect(getHashForTab('chords')).toBe('#/acordes');
    expect(getHashForTab('compositor')).toBe('#/compositor');
  });

  it('navega y responde a eventos hashchange', () => {
    window.location.hash = '#/acordes';
    const { result } = renderHook(() => useHashRoute());

    expect(result.current.currentTab).toBe('chords');

    act(() => {
      result.current.navigateToTab('compositor');
    });
    expect(result.current.currentTab).toBe('compositor');
    expect(window.location.hash).toBe('#/compositor');

    act(() => {
      window.location.hash = '#/escalas';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(result.current.currentTab).toBe('scales');
  });
});
