import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { audioEngine } from '../../features/fretboard/services/guitarAudio';

function createMockAudioContext() {
  const param = {
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn()
  };

  const createOscillator = vi.fn(() => ({
    type: 'triangle',
    frequency: param,
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn()
  }));

  const createBiquadFilter = vi.fn(() => ({
    type: 'lowpass',
    frequency: param,
    Q: param,
    connect: vi.fn()
  }));

  const createGain = vi.fn(() => ({
    gain: param,
    connect: vi.fn()
  }));

  const createBuffer = vi.fn((_channels: number, length: number) => ({
    getChannelData: () => new Float32Array(length)
  }));

  const createBufferSource = vi.fn(() => ({
    buffer: null,
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn()
  }));

  return {
    state: 'running',
    currentTime: 0,
    sampleRate: 44100,
    destination: {},
    resume: vi.fn().mockResolvedValue(undefined),
    createOscillator,
    createBiquadFilter,
    createGain,
    createBuffer,
    createBufferSource
  };
}

describe('guitarAudio engine', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    audioEngine.setMuted(false);
    audioEngine.setVolume(0.8);
    const mockCtx = createMockAudioContext();
    vi.stubGlobal(
      'AudioContext',
      vi.fn(function MockAudioContext() {
        return mockCtx;
      })
    );
  });

  afterEach(() => {
    audioEngine.stopCurrentSequence();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('controla el estado de silencio y los límites de volumen', () => {
    audioEngine.setVolume(1.5);
    expect(audioEngine.getVolume()).toBe(1);

    audioEngine.setVolume(-0.4);
    expect(audioEngine.getVolume()).toBe(0);

    audioEngine.setMuted(true);
    expect(audioEngine.getMuted()).toBe(true);

    audioEngine.setMuted(false);
    expect(audioEngine.getMuted()).toBe(false);
  });

  it('reproduce notas por frecuencia, MIDI y secuencias de escala', () => {
    const onStep = vi.fn();
    const onComplete = vi.fn();

    audioEngine.playNote(440, 0.5, 0.7);
    audioEngine.playMidi(60, 0.5, 0.8);
    audioEngine.strumChord([{ midi: 48 }, { frequency: 329.63 }], 20, 'up');

    const cancel = audioEngine.playScaleSequence(
      [{ midi: 60 }, { midi: 62 }],
      100,
      onStep,
      onComplete
    );

    expect(onStep).toHaveBeenCalledWith(0);
    vi.advanceTimersByTime(110);
    expect(onStep).toHaveBeenCalledWith(1);
    vi.advanceTimersByTime(110);
    expect(onComplete).toHaveBeenCalled();

    cancel();
  });

  it('maneja secuencias vacías invocando onComplete inmediatamente', () => {
    const onComplete = vi.fn();
    const stop = audioEngine.playScaleSequence([], 200, undefined, onComplete);
    expect(onComplete).toHaveBeenCalledTimes(1);
    stop();
  });
});
