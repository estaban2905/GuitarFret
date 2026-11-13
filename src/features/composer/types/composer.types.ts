/**
 * @file composer.types.ts
 * @description Definiciones de tipos para el Editor de Composición Musical.
 */

export type ClefType = 'treble' | 'bass' | 'alto';

export type TimeSignature = '2/4' | '3/4' | '4/4' | '5/4' | '6/8' | '7/8' | '9/8' | '12/8';

export type NoteDuration = 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth';

export type AccidentalType = 'natural' | 'sharp' | 'flat' | 'double-sharp' | 'double-flat';

export type DynamicIntensity = 'pp' | 'p' | 'mp' | 'mf' | 'f' | 'ff';

export type InstrumentType = 'piano' | 'guitar' | 'bass' | 'strings' | 'synth';

export interface ScoreNote {
  id: string;
  step: 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';
  alter: number;
  octave: number;
  duration: NoteDuration;
  dotted?: boolean;
  isRest?: boolean;
  tieStart?: boolean;
  tieEnd?: boolean;
  dynamic?: DynamicIntensity;
  startBeat: number;
  durationBeats: number;
  midi: number;
  pitch: string;
  solfege: string;
}

export interface ScoreChord {
  id: string;
  symbol: string;
  name: string;
  solfege: string;
  romanNumeral?: string;
  harmonicFunction?: 'tonic' | 'subdominant' | 'dominant';
  inversion?: number;
  pitches: string[];
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
  tonic: string;
  mode: 'major' | 'minor';
  name: string;
  solfegeTonic: string;
  accidentalCount: number;
  accidentals: string[];
  scaleNotes: string[];
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
  formula: string;
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
  guideTones: string[];
  tensions: string[];
  avoidNotes: string[];
  primaryScales: Array<{ name: string; type: string; notes: string[] }>;
}

export interface CompositionProject {
  id: string;
  title: string;
  composer: string;
  tempo: number;
  key: string;
  mode: 'major' | 'minor';
  timeSignature: TimeSignature;
  clef: ClefType;
  measures: Measure[];
  createdAt: number;
  updatedAt: number;
}
