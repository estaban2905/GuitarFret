/**
 * @file audio.ts
 * @description Motor de audio para guitarra mediante Web Audio API.
 * Sintetiza un sonido de cuerda pulsada realista (ataque percusivo + resonancia armónica),
 * permitiendo reproducir notas individuales, acordes rasgueados y escalas arpegiadas.
 */

class GuitarAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted = false;
  private volume = 0.8;
  private activeSequenceTimer: number | null = null;

  private getAudioContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtxClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopCurrentSequence();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  public getVolume(): number {
    return this.volume;
  }

  /**
   * Sintetiza una cuerda de guitarra pulsada con armónicos y cuerpo acústico.
   */
  public playNote(freq: number, duration = 1.8, velocity = 0.8) {
    if (this.isMuted || freq <= 20) return;

    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const actualGain = this.volume * velocity * 0.35;

      // 1. Oscilador fundamental (tipo triángulo/diente de sierra suave para emular cuerda metálica/nylon)
      const osc1 = ctx.createOscillator();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(freq, now);

      const osc2 = ctx.createOscillator();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(freq * 2, now); // segundo armónico brillante

      // 2. Filtro pasa-bajos dinámico (simula amortiguación de cuerda: agudos mueren más rápido)
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 6, now);
      filter.frequency.exponentialRampToValueAtTime(Math.max(freq * 1.2, 180), now + duration * 0.6);
      filter.Q.setValueAtTime(2.5, now);

      // 3. Generador de ataque percusivo (transitorio de púa)
      const bufferSize = ctx.sampleRate * 0.03; // 30ms de ruido transitorio
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.005));
      }
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(Math.min(freq * 4, 3000), now);
      noiseFilter.Q.setValueAtTime(1.5, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(actualGain * 0.4, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(filter);

      // 4. Envolvente de ganancia principal
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.linearRampToValueAtTime(actualGain, now + 0.004); // Ataque inmediato de púa
      gainNode.gain.exponentialRampToValueAtTime(actualGain * 0.45, now + 0.12); // Caída inicial
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration); // Decaimiento natural

      // Mezclar osciladores a través del filtro y envolvente
      const oscGain2 = ctx.createGain();
      oscGain2.gain.setValueAtTime(0.3, now);

      osc1.connect(gainNode);
      osc2.connect(oscGain2);
      oscGain2.connect(gainNode);

      gainNode.connect(filter);
      filter.connect(ctx.destination);

      // Iniciar fuentes
      osc1.start(now);
      osc2.start(now);
      noiseSource.start(now);

      // Detener fuentes tras duración
      osc1.stop(now + duration + 0.05);
      osc2.stop(now + duration + 0.05);
      noiseSource.stop(now + 0.05);
    } catch (e) {
      console.warn('Error al reproducir audio de guitarra:', e);
    }
  }

  /**
   * Reproduce una nota por su valor MIDI.
   */
  public playMidi(midi: number, duration = 1.8, velocity = 0.8) {
    if (midi <= 0) return;
    const freq = 440 * Math.pow(2, (midi - 69) / 12);
    this.playNote(freq, duration, velocity);
  }

  /**
   * Rasguea un acorde cuerda por cuerda con ligero retardo (delay entre 25ms y 45ms).
   */
  public strumChord(
    notes: Array<{ midi?: number; frequency?: number }>,
    speedMs = 35,
    direction: 'down' | 'up' = 'down'
  ) {
    this.stopCurrentSequence();
    const ordered = direction === 'down' ? [...notes] : [...notes].reverse();
    ordered.forEach((note, index) => {
      const delay = index * speedMs;
      window.setTimeout(() => {
        if (note.midi && note.midi > 0) {
          this.playMidi(note.midi, 2.2, 0.75 + (index === 0 ? 0.2 : 0));
        } else if (note.frequency && note.frequency > 20) {
          this.playNote(note.frequency, 2.2, 0.75);
        }
      }, delay);
    });
  }

  /**
   * Reproduce una secuencia de notas (escala o arpegio) a un tempo determinado.
   * Proporciona callbacks para resaltar en la UI la nota activa en cada paso.
   * Retorna una función para cancelar la reproducción anticipadamente.
   */
  public playScaleSequence(
    notes: Array<{ midi?: number; frequency?: number; note?: string }>,
    intervalMs = 280,
    onStep?: (index: number) => void,
    onComplete?: () => void
  ): () => void {
    this.stopCurrentSequence();

    if (notes.length === 0) {
      if (onComplete) onComplete();
      return () => {};
    }

    let currentIndex = 0;

    const playNext = () => {
      if (currentIndex >= notes.length) {
        if (onComplete) onComplete();
        this.activeSequenceTimer = null;
        return;
      }

      const note = notes[currentIndex];
      if (onStep) onStep(currentIndex);

      if (note.midi && note.midi > 0) {
        this.playMidi(note.midi, 0.6, 0.85);
      } else if (note.frequency && note.frequency > 20) {
        this.playNote(note.frequency, 0.6, 0.85);
      }

      currentIndex++;
      this.activeSequenceTimer = window.setTimeout(playNext, intervalMs);
    };

    playNext();

    return () => {
      this.stopCurrentSequence();
      if (onComplete) onComplete();
    };
  }

  public stopCurrentSequence() {
    if (this.activeSequenceTimer !== null) {
      window.clearTimeout(this.activeSequenceTimer);
      this.activeSequenceTimer = null;
    }
  }
}

export const audioEngine = new GuitarAudioEngine();
