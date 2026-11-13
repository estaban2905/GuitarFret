/**
 * @file music.types.ts
 * @description Definiciones de tipos e interfaces globales para teoría musical, diapasón y notación.
 */

export type AppRouteTab = 'scales' | 'chords' | 'compositor';

export type NoteNotation = 'american' | 'spanish';

export type ScaleSystem = 'CAGED' | 'TNPS';

export type FretboardDisplayMode = 'notes' | 'intervals' | 'steps' | 'fingers';

export type TuningId = 'standard' | 'dropD' | 'halfStepDown';

export interface TuningConfig {
  id: TuningId;
  name: string;
  notes: string[];
  labels: string[];
}

export interface FretNoteInfo {
  string: number;
  fret: number;
  pitch: string;
  noteName: string;
  chroma: number;
  octave: number;
  midi: number;
  frequency: number;
}

export interface RootOccurrence {
  string: number;
  fret: number;
  pitch: string;
  midi: number;
  noteName: string;
  solfege: string;
  octave: number;
  label: string;
}

export interface ScaleDefinition {
  id: string;
  name: string;
  tonalName: string;
  category: 'diatonic' | 'pentatonic' | 'modes' | 'other';
  description: string;
}

export interface ScalePositionDot {
  string: number;
  fret: number;
  note: string;
  interval: string;
  isRoot: boolean;
  inBox: boolean;
  pitch: string;
  finger?: number;
  octave?: number;
  chroma?: number;
  midi?: number;
  isStart?: boolean;
  stepNumber?: number;
  inRun?: boolean;
}

export interface ScaleRunStep {
  step: number;
  string: number;
  fret: number;
  pitch: string;
  noteName: string;
  solfege: string;
  interval: string;
  degree: number;
  isRoot: boolean;
  isStart: boolean;
  finger: number;
  midi: number;
}

export interface ScaleRunVariation {
  id: string;
  name: string;
  description: string;
  fretSpan: [number, number];
  steps: ScaleRunStep[];
  direction: 'ascending' | 'descending';
  span: '1_octave' | '2_octaves';
}

export interface ScaleRunResult {
  scaleName: string;
  root: string;
  solfegeRoot: string;
  startOccurrence: RootOccurrence;
  variations: ScaleRunVariation[];
  selectedVariationIndex: number;
  activeVariation: ScaleRunVariation | null;
  direction: 'ascending' | 'descending';
  span: '1_octave' | '2_octaves';
  availableDirections: Array<{
    id: 'ascending' | 'descending';
    name: string;
    available: boolean;
    reason?: string;
  }>;
  availableSpans: Array<{
    id: '1_octave' | '2_octaves';
    name: string;
    available: boolean;
    reason?: string;
  }>;
  dots: ScalePositionDot[];
  errorMessage?: string;
}

export interface BoxInfo {
  index: number;
  label: string;
  shapeName: string;
  minFret: number;
  maxFret: number;
}

export interface ScaleResult {
  root: string;
  scaleType: string;
  scaleName: string;
  notes: string[];
  intervals: string[];
  dots: ScalePositionDot[];
  boxFretRange?: [number, number];
  availableBoxes: BoxInfo[];
}

export interface ChordTypeDefinition {
  suffix: string;
  name: string;
  symbol: string;
  description: string;
}

export interface ChordStringNote {
  string: number;
  fret: number;
  noteName: string;
  interval: string;
  isRoot: boolean;
  finger: number;
  pitch: string;
  midi: number;
}

export interface ChordPositionData {
  frets: number[];
  fingers: number[];
  baseFret: number;
  barres: number[];
  midi?: number[];
  capo?: boolean;
  absoluteFrets: number[];
  stringNotes: ChordStringNote[];
}

export interface ChordResult {
  root: string;
  suffix: string;
  chordName: string;
  symbol: string;
  notes: string[];
  intervals: string[];
  positions: ChordPositionData[];
  selectedPositionIndex: number;
  currentPosition?: ChordPositionData;
  allFretboardDots: ScalePositionDot[];
}
