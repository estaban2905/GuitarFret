/**
 * @file useFretboardPlayback.ts
 * @description Custom hook para gestionar la reproducción de escalas y acordes en el diapasón con limpieza segura.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { clientEnv } from '../../../app/config/env';
import type { ChordResult, ScaleResult, ScaleRunResult } from '../../../types/music.types';
import { audioEngine } from '../services/guitarAudio';

interface UseFretboardPlaybackParams {
  currentTab: 'scales' | 'chords';
  scaleSubMode: 'patterns' | 'root_run';
  scalePosition: number | null;
  scaleResult: ScaleResult;
  scaleRunResult: ScaleRunResult;
  chordResult: ChordResult;
}

export function useFretboardPlayback({
  currentTab,
  scaleSubMode,
  scalePosition,
  scaleResult,
  scaleRunResult,
  chordResult
}: UseFretboardPlaybackParams) {
  const [activePlayingMidi, setActivePlayingMidi] = useState<number | null>(null);
  const [activeTabStepIndex, setActiveTabStepIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [bpm, setBpm] = useState<number>(clientEnv.defaultBpm);
  const cancelPlaybackRef = useRef<(() => void) | null>(null);

  const stopPlayback = useCallback(() => {
    cancelPlaybackRef.current?.();
    cancelPlaybackRef.current = null;
    audioEngine.stopCurrentSequence();
    setIsPlaying(false);
    setActivePlayingMidi(null);
    setActiveTabStepIndex(null);
  }, []);

  useEffect(() => {
    return () => {
      audioEngine.stopCurrentSequence();
    };
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      stopPlayback();
      return;
    }

    if (currentTab === 'scales') {
      if (scaleSubMode === 'root_run') {
        const steps = scaleRunResult.activeVariation?.steps || [];
        if (steps.length === 0) return;
        const stepDurationMs = Math.round((60000 / bpm) * 0.7);

        setIsPlaying(true);
        cancelPlaybackRef.current = audioEngine.playScaleSequence(
          steps.map(s => ({
            string: s.string,
            fret: s.fret,
            note: s.noteName,
            interval: s.interval,
            isRoot: s.isRoot,
            inBox: true,
            pitch: s.pitch,
            midi: s.midi
          })),
          stepDurationMs,
          stepIndex => {
            const currentStep = steps[stepIndex];
            if (currentStep) {
              setActivePlayingMidi(currentStep.midi);
              setActiveTabStepIndex(stepIndex);
            }
          },
          () => {
            setIsPlaying(false);
            setActivePlayingMidi(null);
            setActiveTabStepIndex(null);
          }
        );
        return;
      }

      const dotsToPlay = (
        scalePosition === null ? scaleResult.dots : scaleResult.dots.filter(d => d.inBox)
      )
        .filter(d => d.midi && d.midi > 0)
        .sort((a, b) => (a.midi || 0) - (b.midi || 0));

      const uniqueNotes: typeof dotsToPlay = [];
      const seenMidis = new Set<number>();
      for (const d of dotsToPlay) {
        if (d.midi && !seenMidis.has(d.midi)) {
          seenMidis.add(d.midi);
          uniqueNotes.push(d);
        }
      }
      const finalSeq = uniqueNotes.slice(0, 16);
      if (finalSeq.length === 0) return;

      const stepDurationMs = Math.round((60000 / bpm) * 0.65);
      setIsPlaying(true);
      cancelPlaybackRef.current = audioEngine.playScaleSequence(
        finalSeq,
        stepDurationMs,
        stepIndex => {
          const currentDot = finalSeq[stepIndex];
          if (currentDot?.midi) {
            setActivePlayingMidi(currentDot.midi);
          }
        },
        () => {
          setIsPlaying(false);
          setActivePlayingMidi(null);
        }
      );
      return;
    }

    if (!chordResult.currentPosition) return;
    const notesToPlay = chordResult.currentPosition.stringNotes
      .filter(sn => sn.fret >= 0 && sn.midi > 0)
      .map(sn => ({ midi: sn.midi }));
    audioEngine.strumChord(notesToPlay, 35, 'down');
  }, [
    isPlaying,
    stopPlayback,
    currentTab,
    scaleSubMode,
    scaleRunResult,
    bpm,
    scalePosition,
    scaleResult,
    chordResult
  ]);

  return {
    activePlayingMidi,
    activeTabStepIndex,
    isPlaying,
    bpm,
    setBpm,
    togglePlay,
    stopPlayback
  };
}
