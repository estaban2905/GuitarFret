/**
 * @file useInstrumentSettings.ts
 * @description Custom hook para centralizar la configuración global del instrumento y su persistencia.
 */

import { useCallback, useEffect, useState } from 'react';
import type { NoteNotation, TuningId } from '../types/music.types';
import { readStorage, writeStorage } from '../utils/storage';
import { audioEngine } from '../features/fretboard/services/guitarAudio';

const NOTATION_STORAGE_KEY = 'guitarfret_notation_v1';

export function useInstrumentSettings() {
  const [notation, setNotation] = useState<NoteNotation>(() => {
    const saved = readStorage(NOTATION_STORAGE_KEY);
    return saved === 'american' || saved === 'spanish' ? saved : 'american';
  });
  const [tuningId, setTuningId] = useState<TuningId>('standard');
  const [isLeftHanded, setIsLeftHanded] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [fretCount, setFretCount] = useState<number>(21);

  useEffect(() => {
    writeStorage(NOTATION_STORAGE_KEY, notation);
  }, [notation]);

  const toggleLeftHanded = useCallback(() => {
    setIsLeftHanded(prev => !prev);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      audioEngine.setMuted(next);
      return next;
    });
  }, []);

  const resetInstrumentSettings = useCallback(() => {
    setTuningId('standard');
    setNotation('american');
    setIsLeftHanded(false);
    setFretCount(21);
    setIsMuted(false);
    audioEngine.setMuted(false);
  }, []);

  return {
    notation,
    setNotation,
    tuningId,
    setTuningId,
    isLeftHanded,
    toggleLeftHanded,
    isMuted,
    toggleMute,
    fretCount,
    setFretCount,
    resetInstrumentSettings
  };
}
