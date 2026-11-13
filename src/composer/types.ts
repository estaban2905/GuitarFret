/**
 * @file types.ts
 * @description Definiciones de tipos para el Editor de Composición Musical.
 */

export type ClefType = 'treble' | 'bass' | 'alto';

export type TimeSignature =
  | '2/4'
  | '3/4'
  | '4/4'
  | '5/4'
  | '6/8'
  | '7/8'
  | '9/8'
  | '12/8';

export type NoteDuration =
  | 'whole'      // Redonda (1)
  | 'half'       // Blanca (1/2)
  | 'quarter'    // Negra (1/4)
  | 'eighth'     // Corchea (1/8)
  | 'sixteenth'; // Semicorchea (1/16)

export type AccidentalType = 'natural' | 'sharp' | 'flat' | 'double-sharp' | 'double-flat';

export type DynamicIntensity = 'pp' | 'p' | 'mp' | 'mf' | 'f' | 'ff';

export type InstrumentType = 'piano' | 'guitar' | 'bass' | 'strings' | 'synth';

export interface ScoreNote {
  id: string;
  step: 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';
  alter: number; // -2: bb, -1: b, 0: natural, +1: #, +2: ##
  octave: number; // 2 to 6
  duration: NoteDuration;
  dotted?: boolean;
  isRest?: boolean;
  tieStart?: boolean;
  tieEnd?: boolean;
  dynamic?: DynamicIntensity;
  // Posición temporal relativa al compás (en subdivisiones de semicorchea o pulsos)
  startBeat: number; // en negras (quarter notes), p.ej. 0, 0.5, 1, 1.5, 2...
  durationBeats: number; // duración efectiva en negras
  midi: number;
  pitch: string; // "C4", "F#4", "Bb3"
  solfege: string; // "Do", "Fa#", "Sib"
}

export interface ScoreChord {
  id: string;
  symbol: string; // "C", "Am7", "G7", "Fmaj7"
  name: string; // "Do mayor", "Sol 7"
  solfege: string;
  romanNumeral?: string; // "I", "V7", "ii"
  harmonicFunction?: 'tonic' | 'subdominant' | 'dominant';
  inversion?: number; // 0: fundamental, 1: 1ra, 2: 2da, 3: 3ra
  pitches: string[]; // ["C4", "E4", "G4"]
  midis: number[];
  startBeat: number;
  durationBeats: number;
}

export interface Measure {
  id: string;
  number: number;
  timeSignature: TimeSignature;
  clef: ClefType;
  chord?: ScoreChord;
  notes: ScoreNote[];
}

export interface KeySignatureInfo {
  tonic: string; // "C", "G", "F", "Eb"...
  mode: 'major' | 'minor';
  name: string;
  solfegeTonic: string;
  accidentalCount: number; // Positivo para sostenidos, negativo para bemoles
  accidentals: string[]; // ["F#", "C#"] o ["Bb", "Eb", "Ab"]
  scaleNotes: string[]; // 7 notas con ortografía enarmónica correcta
}

export interface DiatonicChordInfo {
  symbol: string;
  numeral: string;
  name: string;
  solfege: string;
  harmonicFunction: 'tonic' | 'subdominant' | 'dominant';
  type: 'triad' | 'seventh';
  notes: string[];
  suggestedPitches: string[];
  midis: number[];
}

export interface ScaleDefinition {
  id: string;
  name: string;
  category: 'diatonic' | 'pentatonic' | 'mode' | 'minor_variant' | 'symmetric';
  formula: string; // "1 2 3 4 5 6 7", "1 b3 4 b5 5 b7", etc.
  intervals: string[];
  notes: string[];
  solfeges: string[];
  description: string;
  compatibleChords: string[];
}

export interface HarmonicAssistantInfo {
  chordSymbol: string;
  root: string;
  chordNotes: string[];
  guideTones: string[]; // 3rd & 7th
  tensions: string[]; // 9, 11, 13, #11, b9...
  avoidNotes: string[]; // Notas a evitar en tiempo fuerte
  primaryScales: Array<{ name: string; type: string; notes: string[] }>;
}

export interface CompositionProject {
  id: string;
  title: string;
  composer: string;
  tempo: number; // BPM
  key: string; // "C", "G", "D"...
  mode: 'major' | 'minor';
  timeSignature: TimeSignature;
  clef: ClefType;
  measures: Measure[];
  createdAt: number;
  updatedAt: number;
}
