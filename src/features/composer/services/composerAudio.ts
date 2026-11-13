/**
 * @file composerAudio.ts
 * @description Motor de audio polifónico profesional con Web Audio API para el Compositor Musical.
 */

import type { InstrumentType, Measure } from '../types/composer.types';

class ComposerAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted = false;
  private volume = 0.8;
  private currentInstrument: InstrumentType = 'piano';

  private isPlaying = false;
  private isPaused = false;
  private playbackTimeoutId: number | null = null;
  private animationFrameId: number | null = null;

  private onProgressCallback:
    ((measureIndex: number, beat: number, progressRatio: number) => void) | null = null;
  private onEndCallback: (() => void) | null = null;

  private initContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : this.volume, this.ctx.currentTime);
    }
  }

  public setInstrument(inst: InstrumentType) {
    this.currentInstrument = inst;
  }

  public getInstrument(): InstrumentType {
    return this.currentInstrument;
  }

  public playTone(midi: number, durationSec = 0.8, whenSec = 0, velocity = 0.8) {
    const ctx = this.initContext();
    if (!this.masterGain) return;

    const startTime = whenSec > 0 ? whenSec : ctx.currentTime;
    const freq = 440 * Math.pow(2, (midi - 69) / 12);

    const noteGain = ctx.createGain();
    noteGain.connect(this.masterGain);

    switch (this.currentInstrument) {
      case 'piano': {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const osc3 = ctx.createOscillator();

        osc1.type = 'triangle';
        osc2.type = 'sine';
        osc3.type = 'sine';

        osc1.frequency.setValueAtTime(freq, startTime);
        osc2.frequency.setValueAtTime(freq * 2, startTime);
        osc3.frequency.setValueAtTime(freq * 3, startTime);

        const g1 = ctx.createGain();
        const g2 = ctx.createGain();
        const g3 = ctx.createGain();

        g1.gain.setValueAtTime(0.7 * velocity, startTime);
        g2.gain.setValueAtTime(0.3 * velocity, startTime);
        g3.gain.setValueAtTime(0.15 * velocity, startTime);

        osc1.connect(g1);
        osc2.connect(g2);
        osc3.connect(g3);

        g1.connect(noteGain);
        g2.connect(noteGain);
        g3.connect(noteGain);

        noteGain.gain.setValueAtTime(0.001, startTime);
        noteGain.gain.exponentialRampToValueAtTime(0.9 * velocity, startTime + 0.008);
        noteGain.gain.exponentialRampToValueAtTime(0.4 * velocity, startTime + 0.15);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + Math.max(0.3, durationSec));

        osc1.start(startTime);
        osc2.start(startTime);
        osc3.start(startTime);

        const stopTime = startTime + Math.max(0.35, durationSec + 0.05);
        osc1.stop(stopTime);
        osc2.stop(stopTime);
        osc3.stop(stopTime);
        break;
      }

      case 'guitar': {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, startTime);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(Math.min(6000, freq * 4), startTime);
        filter.frequency.exponentialRampToValueAtTime(
          Math.min(2000, freq * 1.5),
          startTime + durationSec * 0.8
        );

        osc.connect(filter);
        filter.connect(noteGain);

        noteGain.gain.setValueAtTime(0.001, startTime);
        noteGain.gain.exponentialRampToValueAtTime(0.85 * velocity, startTime + 0.006);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec);

        osc.start(startTime);
        osc.stop(startTime + durationSec + 0.05);
        break;
      }

      case 'bass': {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        const sub = ctx.createOscillator();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(freq * 0.5, startTime);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, startTime);

        osc.connect(filter);
        sub.connect(filter);
        filter.connect(noteGain);

        noteGain.gain.setValueAtTime(0.001, startTime);
        noteGain.gain.exponentialRampToValueAtTime(0.95 * velocity, startTime + 0.012);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec * 1.2);

        osc.start(startTime);
        sub.start(startTime);
        const stopTime = startTime + durationSec * 1.25;
        osc.stop(stopTime);
        sub.stop(stopTime);
        break;
      }

      case 'strings': {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        osc1.type = 'sawtooth';
        osc2.type = 'sawtooth';
        osc1.frequency.setValueAtTime(freq, startTime);
        osc2.frequency.setValueAtTime(freq * 1.003, startTime);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(Math.min(3500, freq * 3), startTime);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(noteGain);

        noteGain.gain.setValueAtTime(0.0001, startTime);
        noteGain.gain.linearRampToValueAtTime(0.6 * velocity, startTime + 0.12);
        noteGain.gain.setValueAtTime(0.6 * velocity, startTime + Math.max(0.15, durationSec - 0.1));
        noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec + 0.2);

        osc1.start(startTime);
        osc2.start(startTime);
        const stopTime = startTime + durationSec + 0.25;
        osc1.stop(stopTime);
        osc2.stop(stopTime);
        break;
      }

      case 'synth':
      default: {
        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, startTime);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(freq * 3, startTime);
        filter.frequency.exponentialRampToValueAtTime(freq * 1.2, startTime + durationSec);

        osc.connect(filter);
        filter.connect(noteGain);

        noteGain.gain.setValueAtTime(0.001, startTime);
        noteGain.gain.exponentialRampToValueAtTime(0.7 * velocity, startTime + 0.01);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec);

        osc.start(startTime);
        osc.stop(startTime + durationSec + 0.05);
        break;
      }
    }
  }

  public playChord(midis: number[], durationSec = 1.4, strumMs = 25) {
    if (!midis || midis.length === 0) return;
    const ctx = this.initContext();
    const baseTime = ctx.currentTime;

    midis.forEach((midi, idx) => {
      const delaySec = (idx * strumMs) / 1000;
      this.playTone(midi, durationSec, baseTime + delaySec, 0.75);
    });
  }

  public playScale(
    midis: number[],
    stepSec = 0.3,
    direction: 'ascending' | 'descending' = 'ascending',
    onStep?: (index: number) => void,
    onComplete?: () => void
  ): () => void {
    if (!midis || midis.length === 0) return () => {};
    const ordered = direction === 'descending' ? [...midis].reverse() : [...midis];
    let step = 0;
    let isCancelled = false;
    let timeoutId: number | null = null;

    const playNext = () => {
      if (isCancelled || step >= ordered.length) {
        if (!isCancelled && onComplete) onComplete();
        return;
      }
      this.playTone(ordered[step], stepSec * 1.1, 0, 0.8);
      if (onStep) onStep(step);
      step++;
      timeoutId = window.setTimeout(playNext, stepSec * 1000);
    };

    playNext();

    return () => {
      isCancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }

  public playMetronomeClick(isBeatOne = false) {
    const ctx = this.initContext();
    if (!this.masterGain || this.isMuted) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isBeatOne ? 1500 : 900, ctx.currentTime);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  }

  public playComposition(
    measures: Measure[],
    bpm: number,
    startMeasureIndex = 0,
    isLoop = false,
    playMetronome = false,
    onProgress?: (measureIndex: number, beat: number, progressRatio: number) => void,
    onEnd?: () => void
  ) {
    this.stopComposition();

    if (!measures || measures.length === 0) return;
    const ctx = this.initContext();

    this.isPlaying = true;
    this.isPaused = false;
    this.onProgressCallback = onProgress || null;
    this.onEndCallback = onEnd || null;

    const secondsPerQuarter = 60 / bpm;
    const now = ctx.currentTime + 0.05;

    interface ScheduledEvent {
      time: number;
      midi: number;
      durationSec: number;
      velocity: number;
    }

    interface MeasureTimeline {
      measureIndex: number;
      startTime: number;
      durationTime: number;
      capacityBeats: number;
    }

    const events: ScheduledEvent[] = [];
    const measureTimelines: MeasureTimeline[] = [];
    let cumulativeTime = 0;

    const effectiveMeasures = measures.slice(startMeasureIndex);

    effectiveMeasures.forEach((measure, idx) => {
      const actualIndex = startMeasureIndex + idx;
      let capacityBeats = 4;
      if (measure.timeSignature === '3/4' || measure.timeSignature === '6/8') capacityBeats = 3;
      else if (measure.timeSignature === '2/4') capacityBeats = 2;
      else if (measure.timeSignature === '5/4') capacityBeats = 5;
      else if (measure.timeSignature === '7/8') capacityBeats = 3.5;
      else if (measure.timeSignature === '9/8') capacityBeats = 4.5;
      else if (measure.timeSignature === '12/8') capacityBeats = 6;

      const measureDurationSec = capacityBeats * secondsPerQuarter;
      const measureStartTime = now + cumulativeTime;

      measureTimelines.push({
        measureIndex: actualIndex,
        startTime: measureStartTime,
        durationTime: measureDurationSec,
        capacityBeats
      });

      if (measure.chord && measure.chord.midis.length > 0) {
        measure.chord.midis.forEach((midi, chordNoteIdx) => {
          events.push({
            time: measureStartTime + chordNoteIdx * 0.02,
            midi,
            durationSec: Math.min(2.5, measureDurationSec * 0.95),
            velocity: 0.55
          });
        });
      }

      measure.notes.forEach(note => {
        if (!note.isRest && note.midi > 0) {
          const noteStartTime = measureStartTime + note.startBeat * secondsPerQuarter;
          const noteDurationSec = note.durationBeats * secondsPerQuarter * 0.9;
          events.push({
            time: noteStartTime,
            midi: note.midi,
            durationSec: Math.max(0.1, noteDurationSec),
            velocity: 0.8
          });
        }
      });

      cumulativeTime += measureDurationSec;
    });

    events.forEach(ev => {
      this.playTone(ev.midi, ev.durationSec, ev.time, ev.velocity);
    });

    const tickAnimation = () => {
      if (!this.isPlaying || this.isPaused) return;

      const currentSec = ctx.currentTime - now;
      const totalSec = cumulativeTime;

      if (currentSec >= totalSec) {
        if (isLoop) {
          this.playComposition(
            measures,
            bpm,
            startMeasureIndex,
            isLoop,
            playMetronome,
            onProgress,
            onEnd
          );
          return;
        }
        this.stopComposition();
        if (this.onEndCallback) this.onEndCallback();
        return;
      }

      const absoluteCurrentTime = ctx.currentTime;
      let currentTimeline = measureTimelines[0];

      for (let i = 0; i < measureTimelines.length; i++) {
        const mt = measureTimelines[i];
        if (
          absoluteCurrentTime >= mt.startTime &&
          absoluteCurrentTime < mt.startTime + mt.durationTime
        ) {
          currentTimeline = mt;
          break;
        }
      }

      if (currentTimeline && this.onProgressCallback) {
        const timeInMeasure = Math.max(0, absoluteCurrentTime - currentTimeline.startTime);
        const beatInMeasure =
          (timeInMeasure / currentTimeline.durationTime) * currentTimeline.capacityBeats;
        const progressRatio = Math.min(1, Math.max(0, currentSec / totalSec));
        this.onProgressCallback(currentTimeline.measureIndex, beatInMeasure, progressRatio);
      }

      this.animationFrameId = requestAnimationFrame(tickAnimation);
    };

    this.animationFrameId = requestAnimationFrame(tickAnimation);
  }

  public stopComposition() {
    this.isPlaying = false;
    this.isPaused = false;

    if (this.playbackTimeoutId) {
      clearTimeout(this.playbackTimeoutId);
      this.playbackTimeoutId = null;
    }
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const composerAudio = new ComposerAudioEngine();
