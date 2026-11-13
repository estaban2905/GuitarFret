import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useInstrumentSettings } from '../../hooks/useInstrumentSettings';

describe('useInstrumentSettings', () => {
  it('inicializa con valores por defecto y persiste la notación', () => {
    const { result } = renderHook(() => useInstrumentSettings());

    expect(result.current.notation).toBe('american');
    expect(result.current.tuningId).toBe('standard');
    expect(result.current.fretCount).toBe(21);
    expect(result.current.isLeftHanded).toBe(false);
    expect(result.current.isMuted).toBe(false);

    act(() => {
      result.current.setNotation('spanish');
      result.current.setTuningId('dropD');
      result.current.setFretCount(15);
      result.current.toggleLeftHanded();
      result.current.toggleMute();
    });

    expect(result.current.notation).toBe('spanish');
    expect(window.localStorage.getItem('guitarfret_notation_v1')).toBe('spanish');
    expect(result.current.tuningId).toBe('dropD');
    expect(result.current.fretCount).toBe(15);
    expect(result.current.isLeftHanded).toBe(true);
    expect(result.current.isMuted).toBe(true);

    act(() => {
      result.current.resetInstrumentSettings();
    });

    expect(result.current.notation).toBe('american');
    expect(result.current.tuningId).toBe('standard');
    expect(result.current.fretCount).toBe(21);
    expect(result.current.isLeftHanded).toBe(false);
    expect(result.current.isMuted).toBe(false);
  });
});
