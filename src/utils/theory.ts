/**
 * @file theory.ts
 * @description Lógica musical: notas, escalas, acordes, intervalos, afinaciones,
 * cálculo de digitaciones (dedos 1, 2, 3, 4) y ordenación secuencial de cajas (CAGED / Pentatónicas / 3NPS).
 * Separa por completo las reglas de teoría musical de los componentes de UI.
 */

import { Note, Scale, Chord, Interval } from 'tonal';
import guitarChordsRaw from '@tombatossals/chords-db/lib/guitar.json';
import { FretboardSystem, Systems } from '@moonwave99/fretboard.js';

// ==========================================
// 1. TÓNICAS Y AFINACIONES
// ==========================================

export const ROOT_NOTES = [
  'C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'
] as const;

export type RootNote = (typeof ROOT_NOTES)[number];

export interface TuningConfig {
  id: string;
  name: string;
  notes: string[]; // De 6ta cuerda (grave) a 1ra cuerda (aguda) ej: ["E2", "A2", "D3", "G3", "B3", "E4"]
  labels: string[]; // ["E", "A", "D", "G", "B", "E"]
}

export const TUNINGS: Record<string, TuningConfig> = {
  standard: {
    id: 'standard',
    name: 'Estándar (E A D G B E)',
    notes: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
    labels: ['E', 'A', 'D', 'G', 'B', 'E']
  },
  dropD: {
    id: 'dropD',
    name: 'Drop D (D A D G B E)',
    notes: ['D2', 'A2', 'D3', 'G3', 'B3', 'E4'],
    labels: ['D', 'A', 'D', 'G', 'B', 'E']
  },
  halfStepDown: {
    id: 'halfStepDown',
    name: 'Medio tono abajo (Eb Ab Db Gb Bb Eb)',
    notes: ['Eb2', 'Ab2', 'Db3', 'Gb3', 'Bb3', 'Eb4'],
    labels: ['Eb', 'Ab', 'Db', 'Gb', 'Bb', 'Eb']
  }
};

export type TuningId = keyof typeof TUNINGS;

// ==========================================
// 2. FUNCIÓN PROPIA DE CÁLCULO DE NOTAS EN TRASTES
// ==========================================

export interface FretNoteInfo {
  string: number; // 1 (aguda) a 6 (grave)
  fret: number; // 0 (al aire) a N
  pitch: string; // ej: "C4"
  noteName: string; // ej: "C"
  chroma: number; // 0..11
  octave: number;
  midi: number;
  frequency: number; // Hz
}

// ==========================================
// 2.1. NOTACIÓN MUSICAL (AMERICANA vs ESPAÑOLA)
// ==========================================

export type NoteNotation = 'american' | 'spanish';

const SOLFEGE_MAP: Record<string, string> = {
  'C': 'Do', 'C#': 'Do#', 'Cb': 'Dob', 'Db': 'Reb', 'C##': 'Do##', 'Dbb': 'Rebb',
  'D': 'Re', 'D#': 'Re#', 'Eb': 'Mib', 'D##': 'Re##', 'Ebb': 'Mibb',
  'E': 'Mi', 'E#': 'Mi#', 'Fb': 'Fab',
  'F': 'Fa', 'F#': 'Fa#', 'Gb': 'Solb', 'F##': 'Fa##', 'Gbb': 'Solbb',
  'G': 'Sol', 'G#': 'Sol#', 'Ab': 'Lab', 'G##': 'Sol##', 'Abb': 'Labb',
  'A': 'La', 'A#': 'La#', 'Bb': 'Sib', 'A##': 'La##', 'Bbb': 'Sibb',
  'B': 'Si', 'B#': 'Si#'
};

/**
 * Convierte un nombre de nota en notación anglosajona (C, D, E...) a solfeo en español (Do, Re, Mi...).
 */
export function getSolfege(noteName: string): string {
  if (!noteName) return '';
  const pc = Note.pitchClass(noteName) || noteName;
  return SOLFEGE_MAP[pc] || pc;
}

/**
 * Formatea una clase de altura (pitch class) según la notación seleccionada.
 */
export function formatNoteName(noteName: string, notation: NoteNotation = 'american'): string {
  if (!noteName) return '';
  if (notation === 'spanish') {
    return getSolfege(noteName);
  }
  return Note.pitchClass(noteName) || noteName;
}

/**
 * Formatea una nota con octava (ej: "C4" -> "C4" o "Do4") según la notación seleccionada.
 */
export function formatPitchName(pitch: string, notation: NoteNotation = 'american'): string {
  if (!pitch) return '';
  if (notation === 'american') return pitch;
  const match = pitch.match(/^([A-Ga-g][#b♯♭x]*)(-?\d+)$/);
  if (!match) return formatNoteName(pitch, notation);
  const [, rawPc, oct] = match;
  return `${getSolfege(rawPc)}${oct}`;
}

/**
 * Formatea un cifrado de acorde (ej: "Cmaj7", "F#m7b5", "C/G") según la notación seleccionada.
 */
export function formatChordSymbol(symbol: string, notation: NoteNotation = 'american'): string {
  if (!symbol || notation === 'american') return symbol;
  const match = symbol.match(/^([A-G](?:##|bb|#|b)?)([^/]*)(?:\/([A-G](?:##|bb|#|b)?))?$/);
  if (!match) return symbol;
  const [, rootPc, suffix, bassPc] = match;
  const rootFormatted = getSolfege(rootPc);
  const bassFormatted = bassPc ? `/${getSolfege(bassPc)}` : '';
  return `${rootFormatted}${suffix}${bassFormatted}`;
}

/**
 * Formatea las etiquetas de afinación (ej: ['E','A','D','G','B','E'] o ['Mi','La','Re','Sol','Si','Mi']).
 */
export function formatTuningLabels(labels: string[], notation: NoteNotation = 'american'): string[] {
  return labels.map(label => formatNoteName(label, notation));
}

export interface RootOccurrence {
  string: number; // 1 (más aguda) a 6 (más grave)
  fret: number; // 0 a N
  pitch: string; // ej: "C3"
  midi: number;
  noteName: string; // ej: "C"
  solfege: string; // ej: "Do"
  octave: number;
  label: string; // ej: "C — 5.ª cuerda — traste 3 (C3)" o "Do — 5.ª cuerda — traste 3 (Do3)"
}

/**
 * Calcula todas las apariciones de una tónica en el diapasón según la afinación activa.
 * Ordenadas de cuerda 6 (más grave) a cuerda 1 (más aguda) y por traste.
 */
export function getRootOccurrences(
  root: string,
  tuningNotes: string[],
  fretCount = 21,
  notation: NoteNotation = 'american'
): RootOccurrence[] {
  const rootChroma = Note.chroma(root) ?? 0;
  const solfege = getSolfege(root);
  const displayRoot = formatNoteName(root, notation);
  const occurrences: RootOccurrence[] = [];

  for (let s = 6; s >= 1; s--) {
    for (let f = 0; f <= fretCount; f++) {
      const noteInfo = getNoteAtFret(s, f, tuningNotes);
      if (noteInfo.chroma === rootChroma) {
        occurrences.push({
          string: s,
          fret: f,
          pitch: noteInfo.pitch,
          midi: noteInfo.midi,
          noteName: root,
          solfege,
          octave: noteInfo.octave,
          label: `${displayRoot} — ${s}.ª cuerda — traste ${f} (${formatPitchName(noteInfo.pitch, notation)})`
        });
      }
    }
  }

  return occurrences;
}

/**
 * Calcula la nota exacta de cualquier cuerda y traste según la afinación proporcionada.
 * stringNumber: 1 (1ra cuerda aguda) a 6 (6ta cuerda grave)
 * fret: 0 a N
 */
export function getNoteAtFret(
  stringNumber: number,
  fret: number,
  tuningNotes: string[]
): FretNoteInfo {
  const openStringIndex = 6 - stringNumber;
  const openPitch = tuningNotes[openStringIndex] || 'E2';
  const openMidi = Note.midi(openPitch) || 40;
  const targetMidi = openMidi + fret;
  const noteWithOctave = Note.fromMidi(targetMidi);
  const noteName = Note.pitchClass(noteWithOctave);
  const chroma = Note.chroma(noteName) ?? (targetMidi % 12);
  const octave = Note.octave(noteWithOctave) ?? Math.floor(targetMidi / 12) - 1;
  const frequency = Note.freq(noteWithOctave) || 440 * Math.pow(2, (targetMidi - 69) / 12);

  return {
    string: stringNumber,
    fret,
    pitch: noteWithOctave,
    noteName,
    chroma,
    octave,
    midi: targetMidi,
    frequency
  };
}

// ==========================================
// 3. INTERVALOS
// ==========================================

export function formatInterval(interval: string): string {
  if (!interval) return '';
  const clean = interval.trim();
  const map: Record<string, string> = {
    '1P': '1', '1d': 'b1', '1A': '#1',
    '2m': 'b2', '2M': '2', '2A': '#2', '2d': 'bb2',
    '3m': 'b3', '3M': '3', '3d': 'bb3', '3A': '#3',
    '4d': 'b4', '4P': '4', '4A': '#4',
    '5d': 'b5', '5P': '5', '5A': '#5',
    '6m': 'b6', '6M': '6', '6d': 'bb6', '6A': '#6',
    '7d': 'bb7', '7m': 'b7', '7M': '7', '7A': '#7',
    '8P': '1', '9m': 'b9', '9M': '9', '9A': '#9',
    '11P': '11', '11A': '#11', '13m': 'b13', '13M': '13'
  };

  return map[clean] || clean.replace('P', '').replace('M', '');
}

export function getIntervalBetween(root: string, targetNote: string): string {
  try {
    const dist = Interval.distance(root, targetNote);
    return formatInterval(Interval.simplify(dist));
  } catch {
    const rootChroma = Note.chroma(root) ?? 0;
    const targetChroma = Note.chroma(targetNote) ?? 0;
    const semitones = (targetChroma - rootChroma + 12) % 12;
    const semitoneMap: Record<number, string> = {
      0: '1', 1: 'b2', 2: '2', 3: 'b3', 4: '3', 5: '4',
      6: 'b5', 7: '5', 8: 'b6', 9: '6', 10: 'b7', 11: '7'
    };
    return semitoneMap[semitones] || '1';
  }
}

// ==========================================
// 4. TIPOS DE ESCALAS Y SISTEMAS
// ==========================================

export interface ScaleDefinition {
  id: string;
  name: string;
  tonalName: string;
  category: 'diatonic' | 'pentatonic' | 'modes' | 'other';
  description: string;
}

export const SCALE_TYPES: ScaleDefinition[] = [
  { id: 'major', name: 'Mayor', tonalName: 'major', category: 'diatonic', description: 'Escala diatónica mayor (Jónico). 1 - 2 - 3 - 4 - 5 - 6 - 7' },
  { id: 'minor', name: 'Menor natural', tonalName: 'minor', category: 'diatonic', description: 'Escala menor natural (Eólico). 1 - 2 - b3 - 4 - 5 - b6 - b7' },
  { id: 'harmonic minor', name: 'Menor armónica', tonalName: 'harmonic minor', category: 'diatonic', description: 'Menor con séptima mayor (#7). 1 - 2 - b3 - 4 - 5 - b6 - 7' },
  { id: 'melodic minor', name: 'Menor melódica', tonalName: 'melodic minor', category: 'diatonic', description: 'Menor con 6ta y 7ma mayores. 1 - 2 - b3 - 4 - 5 - 6 - 7' },
  { id: 'major pentatonic', name: 'Pentatónica mayor', tonalName: 'major pentatonic', category: 'pentatonic', description: 'Cinco notas dulces y consonantes. 1 - 2 - 3 - 5 - 6' },
  { id: 'minor pentatonic', name: 'Pentatónica menor', tonalName: 'minor pentatonic', category: 'pentatonic', description: 'La reina de los solos de blues y rock. 1 - b3 - 4 - 5 - b7' },
  { id: 'blues', name: 'Blues menor', tonalName: 'blues', category: 'pentatonic', description: 'Pentatónica menor con la blue note (b5). 1 - b3 - 4 - b5 - 5 - b7' },
  { id: 'major blues', name: 'Blues mayor', tonalName: 'major blues', category: 'pentatonic', description: 'Pentatónica mayor con nota de paso cromática (b3). 1 - 2 - b3 - 3 - 5 - 6' },
  { id: 'ionian', name: 'Jónico (Modo I)', tonalName: 'ionian', category: 'modes', description: 'Primer modo griego, idéntico a la escala mayor. 1 - 2 - 3 - 4 - 5 - 6 - 7' },
  { id: 'dorian', name: 'Dórico (Modo II)', tonalName: 'dorian', category: 'modes', description: 'Menor con sexta mayor brillante. Clásico del funk y rock. 1 - 2 - b3 - 4 - 5 - 6 - b7' },
  { id: 'phrygian', name: 'Frigio (Modo III)', tonalName: 'phrygian', category: 'modes', description: 'Menor con segunda menor (b2). Sonido flamenco y metal. 1 - b2 - b3 - 4 - 5 - b6 - b7' },
  { id: 'lydian', name: 'Lidio (Modo IV)', tonalName: 'lydian', category: 'modes', description: 'Mayor con cuarta aumentada (#4). Sonido místico. 1 - 2 - 3 - #4 - 5 - 6 - 7' },
  { id: 'mixolydian', name: 'Mixolidio (Modo V)', tonalName: 'mixolydian', category: 'modes', description: 'Mayor con séptima menor (b7). Ideal para rock y blues. 1 - 2 - 3 - 4 - 5 - 6 - b7' },
  { id: 'aeolian', name: 'Eólico (Modo VI)', tonalName: 'aeolian', category: 'modes', description: 'Sexto modo, idéntico a la menor natural. 1 - 2 - b3 - 4 - 5 - b6 - b7' },
  { id: 'locrian', name: 'Locrio (Modo VII)', tonalName: 'locrian', category: 'modes', description: 'Modo con quinta disminuida (b5) y segunda menor (b2). 1 - b2 - b3 - 4 - b5 - b6 - b7' },
  { id: 'phrygian dominant', name: 'Frigia dominante', tonalName: 'phrygian dominant', category: 'other', description: 'Quinto modo de la menor armónica. Sonido español y flamenco. 1 - b2 - 3 - 4 - 5 - b6 - b7' },
  { id: 'lydian dominant', name: 'Lidia dominante (Lidia b7)', tonalName: 'lydian dominant', category: 'other', description: 'Cuarto modo de la menor melódica. Ideal para acordes 7(#11). 1 - 2 - 3 - #4 - 5 - 6 - b7' },
  { id: 'altered', name: 'Alterada (Superlocria)', tonalName: 'altered', category: 'other', description: 'Séptimo modo de la menor melódica. Máxima tensión dominante. 1 - b2 - #2 - 3 - b5 - b6 - b7' },
  { id: 'diminished', name: 'Disminuida (Tono-Semitono)', tonalName: 'diminished', category: 'other', description: 'Escala simétrica octatónica. Ideal para acordes dim7. 1 - 2 - b3 - 4 - b5 - b6 - 6 - 7' },
  { id: 'whole tone', name: 'Tonal (Tonos enteros)', tonalName: 'whole tone', category: 'other', description: 'Escala simétrica hexatónica de tonos enteros. Ideal para acordes aug. 1 - 2 - 3 - #4 - #5 - b7' }
];

export type ScaleSystem = 'CAGED' | 'TNPS';

export interface ScalePositionDot {
  string: number; // 1..6
  fret: number; // 0..21
  note: string;
  interval: string;
  isRoot: boolean;
  inBox: boolean;
  pitch: string;
  finger?: number; // 1=Índice, 2=Medio, 3=Anular, 4=Meñique
  octave?: number;
  chroma?: number;
  midi?: number;
  isStart?: boolean; // Nota inicial seleccionada del recorrido
  stepNumber?: number; // Número de orden en el recorrido (1, 2, 3...)
  inRun?: boolean; // Si pertenece al recorrido activo
}

export interface ScaleRunStep {
  step: number; // 1, 2, 3...
  string: number; // 1..6
  fret: number;
  pitch: string; // ej: "C3"
  noteName: string; // ej: "C"
  solfege: string; // ej: "Do"
  interval: string; // ej: "1", "2", "3", "5", "6", "8"
  degree: number; // 1, 2, 3...
  isRoot: boolean;
  isStart: boolean;
  finger: number; // 1=Índice, 2=Medio, 3=Anular, 4=Meñique
  midi: number;
}

export interface ScaleRunVariation {
  id: string; // ej: "pos-compacta", "pos-extendida"
  name: string; // ej: "Variación 1: En posición (trastes 2–5)"
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
  availableDirections: Array<{ id: 'ascending' | 'descending'; name: string; available: boolean; reason?: string }>;
  availableSpans: Array<{ id: '1_octave' | '2_octaves'; name: string; available: boolean; reason?: string }>;
  dots: ScalePositionDot[];
  errorMessage?: string;
}

export interface BoxInfo {
  index: number; // 1..5 o 1..7
  label: string; // ej: "Posición 1"
  shapeName: string; // ej: "Forma E"
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

// ==========================================
// 5. CÁLCULO DE CAJAS ORDENADAS SECUENCIALMENTE
// ==========================================

const CAGED_KEYS = ['C', 'A', 'G', 'E', 'D'] as const;

/**
 * Calcula el dedo recomendado (1, 2, 3, 4) según la posición del traste en la caja
 */
export function calculateFingerForBox(fret: number, minBoxFret: number): number {
  if (fret === 0) return 0; // Cuerda al aire
  const delta = fret - minBoxFret;
  if (delta <= 0) return 1;
  if (delta === 1) return 2;
  if (delta === 2) return 3;
  return 4; // 3 o 4 trastes de distancia usa el meñique
}

function simplifyDoubleAccidental(noteName: string): string {
  if (!noteName) return noteName;
  if (noteName.includes('##') || noteName.includes('bb')) {
    return Note.simplify(noteName) || noteName;
  }
  return noteName;
}

/**
 * Obtiene las 5 cajas CAGED ancladas a la tónica elegida (`root major`) para identificar
 * el verdadero nombre de forma CAGED (C, A, G, E, D) de cualquier modo o escala sobre esa tónica.
 */
function getMajorCagedAnchors(fs: FretboardSystem, root: string) {
  const rootChroma = Note.chroma(root) ?? 0;
  return CAGED_KEYS.map(key => {
    const pos = fs.getScale({
      type: 'major',
      root,
      box: { system: Systems.CAGED, box: key }
    }).filter(p => p.inBox);

    const rootDots = new Set(
      pos
        .filter(p => (Note.chroma(p.note || '') ?? -1) === rootChroma)
        .map(p => `${p.string}:${p.fret}`)
    );
    const frets = pos.map(p => p.fret);
    return {
      key,
      rootDots,
      minFret: frets.length > 0 ? Math.min(...frets) : 0,
      maxFret: frets.length > 0 ? Math.max(...frets) : 4
    };
  });
}

function resolveTrueCagedShape(
  dots: Array<{ string: number; fret: number }>,
  tuningNotes: string[],
  rootChroma: number,
  anchors: ReturnType<typeof getMajorCagedAnchors>,
  fallbackKey: string
): string {
  const boxRoots = dots.filter(d => getNoteAtFret(d.string, d.fret, tuningNotes).chroma === rootChroma);
  if (boxRoots.length === 0) return fallbackKey;

  let bestKey = fallbackKey;
  let bestScore = -1;
  for (const anchor of anchors) {
    let score = 0;
    for (const r of boxRoots) {
      if (
        anchor.rootDots.has(`${r.string}:${r.fret}`) ||
        anchor.rootDots.has(`${r.string}:${r.fret + 12}`) ||
        anchor.rootDots.has(`${r.string}:${r.fret - 12}`)
      ) {
        score++;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestKey = anchor.key;
    }
  }
  return bestKey;
}

/**
 * Construye patrones 3NPS (3 notas por cuerda) puros a partir de las posiciones completas de una escala de 7 notas.
 */
function buildGeneric3NpsBoxes(
  allScaleNotes: Array<{ string: number; fret: number; chroma?: number; note?: string }>,
  tuningNotes: string[],
  scaleNotes: string[]
): Array<{ id: number; shapeName: string; dots: Array<{ string: number; fret: number }>; minFret: number; maxFret: number }> {
  const scaleChromas = scaleNotes.map(n => Note.chroma(n) ?? 0);
  const str6Notes = allScaleNotes
    .filter(p => p.string === 6 && p.fret <= 12)
    .sort((a, b) => a.fret - b.fret);

  // Tomar las primeras 7 apariciones en la 6ta cuerda (una por cada grado de la escala)
  const uniqueStartNotes: typeof str6Notes = [];
  const seenChromas = new Set<number>();
  for (const n of str6Notes) {
    const info = getNoteAtFret(6, n.fret, tuningNotes);
    if (!seenChromas.has(info.chroma)) {
      seenChromas.add(info.chroma);
      uniqueStartNotes.push(n);
    }
    if (uniqueStartNotes.length === 7) break;
  }

  const boxes: Array<{ id: number; shapeName: string; dots: Array<{ string: number; fret: number }>; minFret: number; maxFret: number }> = [];

  uniqueStartNotes.forEach((startDot, idx) => {
    const dots: Array<{ string: number; fret: number }> = [];
    const startInfo = getNoteAtFret(6, startDot.fret, tuningNotes);
    let currentMinMidi = startInfo.midi;
    let valid = true;

    for (let s = 6; s >= 1; s--) {
      const candidates = allScaleNotes
        .filter(p => p.string === s)
        .map(p => ({ string: s, fret: p.fret, midi: getNoteAtFret(s, p.fret, tuningNotes).midi }))
        .filter(c => c.midi >= currentMinMidi)
        .sort((a, b) => a.midi - b.midi);

      const picked = candidates.slice(0, 3);
      if (picked.length < 3) {
        valid = false;
        break;
      }
      picked.forEach(p => dots.push({ string: p.string, fret: p.fret }));
      currentMinMidi = picked[picked.length - 1].midi + 1;
    }

    if (valid && dots.length === 18) {
      const uniqueBoxChromas = new Set(dots.map(d => getNoteAtFret(d.string, d.fret, tuningNotes).chroma));
      if (uniqueBoxChromas.size === Math.min(7, scaleChromas.length)) {
        const frets = dots.map(d => d.fret);
        boxes.push({
          id: idx + 1,
          shapeName: `Patrón ${idx + 1}`,
          dots,
          minFret: Math.min(...frets),
          maxFret: Math.max(...frets)
        });
      }
    }
  });

  return boxes.sort((a, b) => a.minFret - b.minFret);
}

/**
 * Obtiene todas las cajas de una escala ordenadas geográficamente a lo largo del mástil.
 * Corrige notas faltantes en blues (b5), menor armónica/melódica (b3, b6), nombres de forma CAGED según tónica
 * y el orden secuencial sin recortar posiciones fuera del traste 15.
 */
export function calculateScaleFretboard(
  root: string,
  scaleId: string,
  system: ScaleSystem,
  positionIndex: number | null, // null = todo el mástil, 1..5 o 1..7 = posición específica
  tuningId: TuningId = 'standard',
  fretCount = 21
): ScaleResult {
  const scaleDef = SCALE_TYPES.find(s => s.id === scaleId) || SCALE_TYPES[0];
  const tonalScaleName = `${root} ${scaleDef.tonalName}`;
  const tonalData = Scale.get(tonalScaleName);

  const notes = (tonalData.notes.length > 0 ? tonalData.notes : [root]).map(simplifyDoubleAccidental);
  const intervals = tonalData.intervals.map(formatInterval);
  const tuning = TUNINGS[tuningId] || TUNINGS.standard;
  const rootChroma = Note.chroma(root) ?? 0;
  const isPentatonicOrBlues = scaleDef.category === 'pentatonic' || scaleId === 'blues' || scaleId === 'major blues';

  const fs = new FretboardSystem({
    tuning: tuning.notes,
    fretCount: 24 // Generar margen para calcular cajas completas
  });

  // 1. Obtener todas las posiciones de la escala completa en el mástil
  const allScaleNotes = fs.getScale({
    type: scaleDef.tonalName,
    root
  });

  // 2. Extraer y ordenar las cajas según el sistema
  interface RawBox {
    id: string | number;
    shapeName: string;
    dots: Array<{ string: number; fret: number }>;
    minFret: number;
    maxFret: number;
  }

  let rawBoxes: RawBox[] = [];

  if (isPentatonicOrBlues) {
    // 5 cajas pentatónicas (base menor para minor pentatonic / blues; mayor para major pentatonic / major blues)
    const pentShapeNames = ['Forma E', 'Forma D', 'Forma C', 'Forma A', 'Forma G'];
    const isMajorPentFamily = scaleId === 'major pentatonic' || scaleId === 'major blues';
    const basePentType = isMajorPentFamily ? 'major pentatonic' : 'minor pentatonic';
    const extraBlueChroma =
      scaleId === 'blues'
        ? (rootChroma + 6) % 12 // b5
        : scaleId === 'major blues'
        ? (rootChroma + 3) % 12 // b3
        : null;

    for (let b = 1; b <= 5; b++) {
      const basePositions = fs.getScale({
        type: basePentType,
        root,
        box: { system: Systems.pentatonic, box: b }
      }).filter(p => p.inBox);

      if (basePositions.length > 0) {
        let minFret = Math.min(...basePositions.map(p => p.fret));
        let maxFret = Math.max(...basePositions.map(p => p.fret));
        const dotMap = new Map<string, { string: number; fret: number }>();
        basePositions.forEach(p => {
          dotMap.set(`${p.string}-${p.fret}`, { string: p.string, fret: p.fret });
        });

        // Para blues y blues mayor, incluir la blue note (b5 o b3) dentro del rango de trastes de la caja
        if (extraBlueChroma !== null) {
          allScaleNotes.forEach(pos => {
            const noteInfo = getNoteAtFret(pos.string, pos.fret, tuning.notes);
            if (noteInfo.chroma === extraBlueChroma && pos.fret >= minFret && pos.fret <= maxFret) {
              dotMap.set(`${pos.string}-${pos.fret}`, { string: pos.string, fret: pos.fret });
            }
          });
        }

        const dots = Array.from(dotMap.values());
        minFret = Math.min(...dots.map(d => d.fret));
        maxFret = Math.max(...dots.map(d => d.fret));

        rawBoxes.push({
          id: b,
          shapeName: pentShapeNames[b - 1] || `Caja ${b}`,
          dots,
          minFret,
          maxFret
        });
      }
    }

    // Ordenar secuencialmente del traste más grave al más agudo (0-3 -> 2-5 -> 5-8 -> 7-10 -> 9-13)
    rawBoxes.sort((a, b) => a.minFret - b.minFret);
  } else if (system === 'CAGED') {
    const anchors = getMajorCagedAnchors(fs, root);

    // Mapeo de escalas con notas faltantes en fretboard.js mediante transformación exacta de intervalo (+1 semitono, nunca < 0)
    const derivedShiftRule: Record<string, { baseType: string; raiseChromaOffset: number }> = {
      'harmonic minor': { baseType: 'minor', raiseChromaOffset: 10 }, // b7 -> 7
      'melodic minor': { baseType: 'dorian', raiseChromaOffset: 10 }, // b7 -> 7
      'phrygian dominant': { baseType: 'phrygian', raiseChromaOffset: 3 }, // b3 -> 3
      'lydian dominant': { baseType: 'mixolydian', raiseChromaOffset: 5 } // 4 -> #4
    };

    const windowOnlyScales = new Set(['altered', 'diminished', 'whole tone']);

    if (windowOnlyScales.has(scaleId)) {
      for (const anchor of anchors) {
        const dotsInWindow = allScaleNotes
          .filter(p => p.fret >= anchor.minFret && p.fret <= anchor.maxFret)
          .map(p => ({ string: p.string, fret: p.fret }));

        if (dotsInWindow.length > 0) {
          rawBoxes.push({
            id: anchor.key,
            shapeName: `Forma ${anchor.key}`,
            dots: dotsInWindow,
            minFret: Math.min(...dotsInWindow.map(d => d.fret)),
            maxFret: Math.max(...dotsInWindow.map(d => d.fret))
          });
        }
      }
    } else if (derivedShiftRule[scaleId]) {
      const rule = derivedShiftRule[scaleId];
      const targetRaiseChroma = (rootChroma + rule.raiseChromaOffset) % 12;

      for (const key of CAGED_KEYS) {
        const basePositions = fs.getScale({
          type: rule.baseType,
          root,
          box: { system: Systems.CAGED, box: key }
        }).filter(p => p.inBox);

        if (basePositions.length > 0) {
          const dots = basePositions.map(p => {
            const info = getNoteAtFret(p.string, p.fret, tuning.notes);
            return info.chroma === targetRaiseChroma
              ? { string: p.string, fret: p.fret + 1 }
              : { string: p.string, fret: p.fret };
          });
          const trueKey = resolveTrueCagedShape(dots, tuning.notes, rootChroma, anchors, key);
          rawBoxes.push({
            id: trueKey,
            shapeName: `Forma ${trueKey}`,
            dots,
            minFret: Math.min(...dots.map(d => d.fret)),
            maxFret: Math.max(...dots.map(d => d.fret))
          });
        }
      }
    } else {
      // Escala mayor y modos griegos: identificar la verdadera forma CAGED relativa a la tónica elegida
      for (const key of CAGED_KEYS) {
        const positions = fs.getScale({
          type: scaleDef.tonalName,
          root,
          box: { system: Systems.CAGED, box: key }
        }).filter(p => p.inBox);

        if (positions.length > 0) {
          const dots = positions.map(p => ({ string: p.string, fret: p.fret }));
          const trueKey = resolveTrueCagedShape(dots, tuning.notes, rootChroma, anchors, key);
          rawBoxes.push({
            id: trueKey,
            shapeName: `Forma ${trueKey}`,
            dots,
            minFret: Math.min(...dots.map(d => d.fret)),
            maxFret: Math.max(...dots.map(d => d.fret))
          });
        }
      }
    }

    // Ordenar las 5 formas de CAGED de menor a mayor traste a lo largo del diapasón
    rawBoxes.sort((a, b) => a.minFret - b.minFret);
  } else {
    // Sistema 3 Notas Por Cuerda (3NPS / TNPS)
    const derivedShiftRule: Record<string, { baseType: string; raiseChromaOffset: number }> = {
      'harmonic minor': { baseType: 'minor', raiseChromaOffset: 10 },
      'melodic minor': { baseType: 'dorian', raiseChromaOffset: 10 },
      'phrygian dominant': { baseType: 'phrygian', raiseChromaOffset: 3 },
      'lydian dominant': { baseType: 'mixolydian', raiseChromaOffset: 5 }
    };

    if (derivedShiftRule[scaleId]) {
      const rule = derivedShiftRule[scaleId];
      const targetRaiseChroma = (rootChroma + rule.raiseChromaOffset) % 12;

      for (let b = 1; b <= 7; b++) {
        const basePositions = fs.getScale({
          type: rule.baseType,
          root,
          box: { system: Systems.TNPS, box: b }
        }).filter(p => p.inBox);

        if (basePositions.length > 0) {
          const dots = basePositions.map(p => {
            const info = getNoteAtFret(p.string, p.fret, tuning.notes);
            return info.chroma === targetRaiseChroma
              ? { string: p.string, fret: p.fret + 1 }
              : { string: p.string, fret: p.fret };
          });
          rawBoxes.push({
            id: b,
            shapeName: `Patrón ${b}`,
            dots,
            minFret: Math.min(...dots.map(d => d.fret)),
            maxFret: Math.max(...dots.map(d => d.fret))
          });
        }
      }
      rawBoxes.sort((a, b) => a.minFret - b.minFret);
    } else if (scaleId === 'altered') {
      rawBoxes = buildGeneric3NpsBoxes(allScaleNotes, tuning.notes, notes);
    } else if (scaleId === 'diminished' || scaleId === 'whole tone') {
      // Escalas simétricas de 6 u 8 notas: usar ventanas CAGED en ausencia de 3NPS heptatónico
      const anchors = getMajorCagedAnchors(fs, root);
      for (const anchor of anchors) {
        const dotsInWindow = allScaleNotes
          .filter(p => p.fret >= anchor.minFret && p.fret <= anchor.maxFret)
          .map(p => ({ string: p.string, fret: p.fret }));
        if (dotsInWindow.length > 0) {
          rawBoxes.push({
            id: anchor.key,
            shapeName: `Forma ${anchor.key}`,
            dots: dotsInWindow,
            minFret: Math.min(...dotsInWindow.map(d => d.fret)),
            maxFret: Math.max(...dotsInWindow.map(d => d.fret))
          });
        }
      }
      rawBoxes.sort((a, b) => a.minFret - b.minFret);
    } else {
      for (let b = 1; b <= 7; b++) {
        const positions = fs.getScale({
          type: scaleDef.tonalName,
          root,
          box: { system: Systems.TNPS, box: b }
        }).filter(p => p.inBox);

        if (positions.length > 0) {
          const minFret = Math.min(...positions.map(p => p.fret));
          const maxFret = Math.max(...positions.map(p => p.fret));
          rawBoxes.push({
            id: b,
            shapeName: `Patrón ${b}`,
            dots: positions.map(p => ({ string: p.string, fret: p.fret })),
            minFret,
            maxFret
          });
        }
      }
      rawBoxes.sort((a, b) => a.minFret - b.minFret);
    }

    // Reenumerar Patrón 1..7 en orden secuencial de menor a mayor traste para evitar etiquetas desordenadas (ej: Patrón 3 antes de Patrón 1)
    if (rawBoxes.length > 0 && rawBoxes[0].shapeName.startsWith('Patrón ')) {
      rawBoxes = rawBoxes.map((rb, idx) => ({
        ...rb,
        shapeName: `Patrón ${idx + 1}`
      }));
    }
  }

  // Lista descriptiva de cajas disponibles para botones de la UI
  const availableBoxes: BoxInfo[] = rawBoxes.map((rb, idx) => ({
    index: idx + 1,
    label: `Posición ${idx + 1}`,
    shapeName: `${rb.shapeName} (${rb.minFret}-${rb.maxFret})`,
    minFret: rb.minFret,
    maxFret: rb.maxFret
  }));

  // Determinar qué caja está activa (clamp seguro al máximo de cajas disponibles)
  let activeBox: RawBox | null = null;
  if (positionIndex !== null && rawBoxes.length > 0) {
    const safeIdx = Math.max(1, Math.min(positionIndex, rawBoxes.length));
    activeBox = rawBoxes[safeIdx - 1];
  }

  // Crear mapa rápido para verificar si una nota cae dentro de la caja activa
  const inBoxMap = new Set<string>();
  if (activeBox) {
    activeBox.dots.forEach(d => inBoxMap.add(`${d.string}-${d.fret}`));
  }

  const activeMinFret = activeBox ? activeBox.minFret : 0;

  // 3. Generar y enriquecer todos los puntos del mástil
  const dots: ScalePositionDot[] = allScaleNotes
    .filter(pos => pos.fret <= fretCount)
    .map(pos => {
      const noteInfo = getNoteAtFret(pos.string, pos.fret, tuning.notes);
      const noteChroma = noteInfo.chroma;
      const isRoot = noteChroma === rootChroma;

      const matchedNote = notes.find(n => (Note.chroma(n) ?? -1) === noteChroma);
      const finalNoteName = simplifyDoubleAccidental(matchedNote || pos.note || noteInfo.noteName);

      const interval = isRoot ? '1' : (formatInterval(pos.interval || '') || getIntervalBetween(root, finalNoteName));
      const isInActiveBox = activeBox === null ? true : inBoxMap.has(`${pos.string}-${pos.fret}`);

      const finger = isInActiveBox && activeBox
        ? calculateFingerForBox(pos.fret, activeMinFret)
        : undefined;

      return {
        string: pos.string,
        fret: pos.fret,
        note: finalNoteName,
        interval,
        isRoot,
        inBox: isInActiveBox,
        pitch: noteInfo.pitch,
        octave: pos.octave ?? noteInfo.octave,
        chroma: noteChroma,
        midi: noteInfo.midi,
        finger
      };
    });

  // Asegurar que los puntos de la caja activa existan en dots aunque caigan fuera de allScaleNotes por ortografía
  if (activeBox) {
    activeBox.dots.forEach(boxDot => {
      if (boxDot.fret <= fretCount && !dots.some(d => d.string === boxDot.string && d.fret === boxDot.fret)) {
        const noteInfo = getNoteAtFret(boxDot.string, boxDot.fret, tuning.notes);
        const isRoot = noteInfo.chroma === rootChroma;
        const matchedNote = notes.find(n => (Note.chroma(n) ?? -1) === noteInfo.chroma) || noteInfo.noteName;
        const finalNoteName = simplifyDoubleAccidental(matchedNote);
        const interval = isRoot ? '1' : getIntervalBetween(root, finalNoteName);
        const finger = calculateFingerForBox(boxDot.fret, activeMinFret);

        dots.push({
          string: boxDot.string,
          fret: boxDot.fret,
          note: finalNoteName,
          interval,
          isRoot,
          inBox: true,
          pitch: noteInfo.pitch,
          octave: noteInfo.octave,
          chroma: noteInfo.chroma,
          midi: noteInfo.midi,
          finger
        });
      }
    });
  }

  const boxFretRange: [number, number] | undefined = activeBox
    ? [activeBox.minFret, activeBox.maxFret]
    : undefined;

  return {
    root,
    scaleType: scaleDef.id,
    scaleName: `${root} ${scaleDef.name}`,
    notes,
    intervals,
    dots,
    boxFretRange,
    availableBoxes
  };
}

// ==========================================
// 5.1. RECORRIDO DE LA ESCALA DESDE UNA TÓNICA ESPECÍFICA
// ==========================================

export interface GenerateScaleRunsParams {
  startString: number; // 1..6
  startFret: number; // 0..21
  scaleId: string;
  root: string;
  tuningId?: TuningId;
  direction?: 'ascending' | 'descending';
  span?: '1_octave' | '2_octaves';
  selectedVariationIndex?: number;
  fretCount?: number;
}

/**
 * Calcula un recorrido ergonómico de la escala que comienza exactamente en la tónica elegida (cuerda y traste).
 * Respeta el orden de los grados de la escala, evita saltos de mano innecesarios
 * y ofrece variaciones de digitación alternativas cuando existan.
 */
export function generateScaleRuns({
  startString,
  startFret,
  scaleId,
  root,
  tuningId = 'standard',
  direction = 'ascending',
  span = '1_octave',
  selectedVariationIndex = 0,
  fretCount = 21
}: GenerateScaleRunsParams): ScaleRunResult {
  const scaleDef = SCALE_TYPES.find(s => s.id === scaleId) || SCALE_TYPES[0];
  const tuning = TUNINGS[tuningId] || TUNINGS.standard;
  const startNote = getNoteAtFret(startString, startFret, tuning.notes);
  const solfegeRoot = getSolfege(root);

  // Aparición inicial estructurada
  const startOccurrence: RootOccurrence = {
    string: startString,
    fret: startFret,
    pitch: startNote.pitch,
    midi: startNote.midi,
    noteName: root,
    solfege: solfegeRoot,
    octave: startNote.octave,
    label: `${solfegeRoot} — ${startString}.ª cuerda — traste ${startFret} (${startNote.pitch})`
  };

  const minGuitarMidi = Note.midi(tuning.notes[0]) || 40;
  const maxGuitarMidi = (Note.midi(tuning.notes[tuning.notes.length - 1]) || 64) + fretCount;

  // Evaluar disponibilidad de direcciones y extensiones para esta nota concreta
  const canDescend = startNote.midi - 12 >= minGuitarMidi && startString <= 5;
  const canAscend2Octaves = startNote.midi + 24 <= maxGuitarMidi && startString >= 4;

  const availableDirections = [
    {
      id: 'ascending' as const,
      name: 'Ascendente',
      available: true
    },
    {
      id: 'descending' as const,
      name: 'Descendente',
      available: canDescend,
      reason: canDescend ? undefined : 'No hay cuerdas o notas más graves para completar una octava descendente'
    }
  ];

  const availableSpans = [
    {
      id: '1_octave' as const,
      name: '1 octava',
      available: true
    },
    {
      id: '2_octaves' as const,
      name: '2 octavas',
      available: canAscend2Octaves,
      reason: canAscend2Octaves ? undefined : 'Requiere comenzar en cuerdas más graves (6.ª, 5.ª o 4.ª) y notas con suficiente rango hacia los agudos'
    }
  ];

  // Ajustar si la opción elegida no es válida físicamente
  const effectiveDirection = direction === 'descending' && !canDescend ? 'ascending' : direction;
  const effectiveSpan = span === '2_octaves' && (!canAscend2Octaves || effectiveDirection === 'descending')
    ? '1_octave'
    : span;

  // Obtener datos teóricos de la escala con Tonal
  const tonalScaleName = `${root} ${scaleDef.tonalName}`;
  const tonalData = Scale.get(tonalScaleName);
  const scaleNotes = tonalData.notes.length > 0 ? tonalData.notes : [root];
  const scaleIntervals = tonalData.intervals.length > 0 ? tonalData.intervals : ['1P'];

  // Semitonos de los grados de la escala
  const baseSemitones = scaleIntervals.map(inv => Interval.semitones(inv));

  let targetSemitones: number[] = [];
  let degreeIndices: number[] = []; // Grado relativo de la escala (1..N)

  if (effectiveSpan === '1_octave') {
    if (effectiveDirection === 'ascending') {
      targetSemitones = [...baseSemitones, 12];
      degreeIndices = [...baseSemitones.map((_, i) => i + 1), 1];
    } else {
      // 1 octava descendente: 0, -(12 - s_last)... -12
      const reversedFromOctave = [...baseSemitones].reverse().map(s => s - 12);
      targetSemitones = [0, ...reversedFromOctave];
      const reversedDegrees = [...baseSemitones.map((_, i) => i + 1)].reverse();
      degreeIndices = [1, ...reversedDegrees];
    }
  } else {
    // 2 octavas ascendentes
    const secondOctave = baseSemitones.slice(1).map(s => s + 12);
    targetSemitones = [...baseSemitones, 12, ...secondOctave, 24];
    degreeIndices = [
      ...baseSemitones.map((_, i) => i + 1),
      1,
      ...baseSemitones.slice(1).map((_, i) => i + 2),
      1
    ];
  }

  const targetMidis = targetSemitones.map(s => startNote.midi + s);

  // Buscar candidatos para cada paso
  const stepsCandidates = targetMidis.map((midi, stepIndex) => {
    if (stepIndex === 0) {
      return [{ step: 0, string: startString, fret: startFret, midi }];
    }
    const cands: Array<{ step: number; string: number; fret: number; midi: number }> = [];
    for (let s = 1; s <= 6; s++) {
      for (let f = 0; f <= fretCount; f++) {
        const n = getNoteAtFret(s, f, tuning.notes);
        if (n.midi === midi) {
          cands.push({ step: stepIndex, string: s, fret: f, midi });
        }
      }
    }
    return cands;
  });

  const validPaths: Array<Array<{ step: number; string: number; fret: number; midi: number }>> = [];

  if (!stepsCandidates.some(c => c.length === 0)) {
    // Cantidad de cuerdas disponibles en el sentido seleccionado
    const numStringsAvailable = effectiveDirection === 'ascending' ? startString : (7 - startString);
    const maxNotesPerString = numStringsAvailable === 1 ? 9 : (numStringsAvailable <= 2 ? 5 : (effectiveSpan === '2_octaves' ? 4 : 3));
    const allowedSpan = numStringsAvailable === 1 ? 14 : (numStringsAvailable <= 2 ? 8 : (effectiveSpan === '2_octaves' ? 7 : 5));

    function dfs(step: number, currentPath: Array<{ step: number; string: number; fret: number; midi: number }>) {
      if (step === targetMidis.length) {
        validPaths.push([...currentPath]);
        return;
      }
      if (validPaths.length > 250) return; // Límite de búsqueda

      const prev = currentPath[currentPath.length - 1];
      for (const cand of stepsCandidates[step]) {
        // En recorrido ascendente, las cuerdas van de grave (mayor número ej. 5) a aguda (menor número ej. 4, 3)
        if (effectiveDirection === 'ascending') {
          if (cand.string > prev.string) continue;
        } else {
          if (cand.string < prev.string) continue;
        }

        // Distancia máxima de traste entre notas consecutivas
        if (Math.abs(cand.fret - prev.fret) > 5) continue;

        // Amplitud física de la mano (las cuerdas al aire traste 0 no estiran la mano)
        const fretsSoFar = currentPath.map(p => p.fret).concat(cand.fret);
        const frettedFrets = fretsSoFar.filter(f => f > 0);
        const minF = frettedFrets.length > 0 ? Math.min(...frettedFrets) : 0;
        const maxF = frettedFrets.length > 0 ? Math.max(...frettedFrets) : 0;
        if (maxF - minF > allowedSpan) continue;

        // Máximo de notas en la misma cuerda
        const countOnString = currentPath.filter(p => p.string === cand.string).length;
        if (countOnString >= maxNotesPerString) continue;

        currentPath.push(cand);
        dfs(step + 1, currentPath);
        currentPath.pop();
      }
    }

    dfs(1, [stepsCandidates[0][0]]);
  }

  // Función de puntuación ergonómica
  function scorePath(path: Array<{ step: number; string: number; fret: number; midi: number }>) {
    let score = 0;
    const frets = path.map(p => p.fret);
    const minF = Math.min(...frets);
    const maxF = Math.max(...frets);
    const span = maxF - minF;

    score += span * 12;

    for (let i = 1; i < path.length; i++) {
      const stringJump = Math.abs(path[i - 1].string - path[i].string);
      if (stringJump > 1) score += 40 * stringJump;
    }

    // Si comienza en traste pisado (> 0), priorizar posición pisada movible estándar
    if (startFret > 0) {
      const hasOpen = frets.some(f => f === 0);
      if (hasOpen) score += 30;
    }

    const handCenter = startFret > 0 ? (startFret + 1.5) : 2;
    for (const f of frets) {
      score += Math.abs(f - handCenter) * 2;
    }

    return score;
  }

  validPaths.sort((a, b) => scorePath(a) - scorePath(b));

  // Generar variaciones distintas y descriptivas
  const variations: ScaleRunVariation[] = [];

  if (validPaths.length > 0) {
    // 1. Variación principal (más ergonómica en posición)
    const bestPath = validPaths[0];
    const frets1 = bestPath.map(p => p.fret);
    const minF1 = Math.min(...frets1);
    const maxF1 = Math.max(...frets1);

    variations.push({
      id: 'var-1',
      name: `Variación 1: En posición (trastes ${minF1}–${maxF1})`,
      description: `Digitación compacta estándar de ${effectiveSpan === '1_octave' ? '1 octava' : '2 octavas'} ${effectiveDirection === 'ascending' ? 'ascendente' : 'descendente'}.`,
      fretSpan: [minF1, maxF1],
      steps: mapPathToSteps(bestPath, scaleNotes, scaleIntervals, root, solfegeRoot, tuning.notes, minF1),
      direction: effectiveDirection,
      span: effectiveSpan
    });

    // 2. Buscar una segunda variación alternativa (con diferente distribución de cuerdas o trastes)
    const altPath = validPaths.find(p => {
      const diffStrings = p.some((pt, idx) => pt.string !== bestPath[idx].string);
      const diffFrets = p.some((pt, idx) => pt.fret !== bestPath[idx].fret);
      return diffStrings || diffFrets;
    });

    if (altPath) {
      const frets2 = altPath.map(p => p.fret);
      const minF2 = Math.min(...frets2);
      const maxF2 = Math.max(...frets2);
      const hasOpen = frets2.some(f => f === 0);
      const varName = hasOpen && startFret > 0
        ? `Variación 2: Con cuerdas al aire (trastes ${minF2}–${maxF2})`
        : `Variación 2: Alternativa (trastes ${minF2}–${maxF2})`;

      variations.push({
        id: 'var-2',
        name: varName,
        description: 'Digitación alternativa con diferente distribución de cuerdas o extensión.',
        fretSpan: [minF2, maxF2],
        steps: mapPathToSteps(altPath, scaleNotes, scaleIntervals, root, solfegeRoot, tuning.notes, minF2),
        direction: effectiveDirection,
        span: effectiveSpan
      });
    }

    // 3. Tercera variación si existe otra alternativa relevante
    const thirdPath = validPaths.find(p => {
      const isDiff1 = p.some((pt, idx) => pt.string !== bestPath[idx].string || pt.fret !== bestPath[idx].fret);
      const isDiff2 = altPath ? p.some((pt, idx) => pt.string !== altPath[idx].string || pt.fret !== altPath[idx].fret) : true;
      return isDiff1 && isDiff2;
    });

    if (thirdPath) {
      const frets3 = thirdPath.map(p => p.fret);
      const minF3 = Math.min(...frets3);
      const maxF3 = Math.max(...frets3);

      variations.push({
        id: 'var-3',
        name: `Variación 3: Extendida (trastes ${minF3}–${maxF3})`,
        description: 'Variación extendida a lo largo del diapasón.',
        fretSpan: [minF3, maxF3],
        steps: mapPathToSteps(thirdPath, scaleNotes, scaleIntervals, root, solfegeRoot, tuning.notes, minF3),
        direction: effectiveDirection,
        span: effectiveSpan
      });
    }
  }

  const safeVarIndex = Math.min(selectedVariationIndex, Math.max(0, variations.length - 1));
  const activeVariation = variations[safeVarIndex] || null;

  // Generar puntos del diapasón marcando los del recorrido
  const rootChroma = Note.chroma(root) ?? 0;
  const fs = new FretboardSystem({ tuning: tuning.notes, fretCount });
  const allScalePositions = fs.getScale({ type: scaleDef.tonalName, root });

  const runStepsMap = new Map<string, ScaleRunStep>();
  if (activeVariation) {
    activeVariation.steps.forEach(st => {
      runStepsMap.set(`${st.string}-${st.fret}`, st);
    });
  }

  const dots: ScalePositionDot[] = allScalePositions
    .filter(pos => pos.fret <= fretCount)
    .map(pos => {
      const rawNote = pos.note || '';
      const noteChroma = pos.chroma ?? (rawNote ? (Note.chroma(rawNote) || 0) : 0);
      const isRoot = noteChroma === rootChroma;
      const noteInfo = getNoteAtFret(pos.string, pos.fret, tuning.notes);

      let finalNoteName = rawNote;
      const matchedNote = scaleNotes.find(n => (Note.chroma(n) ?? -1) === noteChroma);
      if (matchedNote) finalNoteName = matchedNote;
      else if (!finalNoteName) finalNoteName = noteInfo.noteName;

      const interval = formatInterval(pos.interval || '') || getIntervalBetween(root, finalNoteName);
      const runStep = runStepsMap.get(`${pos.string}-${pos.fret}`);
      const inRun = Boolean(runStep);
      const isStart = runStep?.isStart ?? false;

      return {
        string: pos.string,
        fret: pos.fret,
        note: finalNoteName,
        interval,
        isRoot,
        inBox: inRun, // Usamos inBox para destacar las notas del recorrido
        inRun,
        isStart,
        stepNumber: runStep?.step,
        finger: runStep?.finger,
        pitch: noteInfo.pitch,
        octave: pos.octave ?? noteInfo.octave,
        chroma: noteChroma,
        midi: noteInfo.midi
      };
    });

  // Asegurar que todas las notas del recorrido existan en dots
  if (activeVariation) {
    activeVariation.steps.forEach(st => {
      if (!dots.some(d => d.string === st.string && d.fret === st.fret)) {
        dots.push({
          string: st.string,
          fret: st.fret,
          note: st.noteName,
          interval: st.interval,
          isRoot: st.isRoot,
          inBox: true,
          inRun: true,
          isStart: st.isStart,
          stepNumber: st.step,
          finger: st.finger,
          pitch: st.pitch,
          midi: st.midi
        });
      }
    });
  }

  // Asegurar que la tónica de inicio seleccionada siempre esté marcada como isStart e inBox
  const startDot = dots.find(d => d.string === startString && d.fret === startFret);
  if (startDot) {
    startDot.isStart = true;
    startDot.inBox = true;
  }

  return {
    scaleName: `${root} ${scaleDef.name}`,
    root,
    solfegeRoot,
    startOccurrence,
    variations,
    selectedVariationIndex: safeVarIndex,
    activeVariation,
    direction: effectiveDirection,
    span: effectiveSpan,
    availableDirections,
    availableSpans,
    dots,
    errorMessage: variations.length === 0
      ? `No es posible completar un recorrido ${effectiveDirection === 'ascending' ? 'ascendente' : 'descendente'} de ${effectiveSpan === '1_octave' ? '1 octava' : '2 octavas'} desde ${solfegeRoot} (${startString}.ª cuerda, traste ${startFret}) dentro del rango de ${fretCount} trastes.`
      : undefined
  };
}

/**
 * Función auxiliar para mapear un camino encontrado por DFS a ScaleRunStep[] enriquecidos.
 */
function mapPathToSteps(
  path: Array<{ step: number; string: number; fret: number; midi: number }>,
  scaleNotes: string[],
  scaleIntervals: string[],
  root: string,
  solfegeRoot: string,
  tuningNotes: string[],
  minBoxFret: number
): ScaleRunStep[] {
  const rootChroma = Note.chroma(root) ?? 0;

  return path.map((node, index) => {
    const noteInfo = getNoteAtFret(node.string, node.fret, tuningNotes);
    const isRoot = noteInfo.chroma === rootChroma;
    const isStart = index === 0;

    let finalNoteName = noteInfo.noteName;
    const matchedNote = scaleNotes.find(n => (Note.chroma(n) ?? -1) === noteInfo.chroma);
    if (matchedNote) finalNoteName = matchedNote;

    const solfege = getSolfege(finalNoteName);
    const interval = isRoot && isStart
      ? '1'
      : (formatInterval(getIntervalBetween(root, finalNoteName)) || '1');

    const finger = calculateFingerForBox(node.fret, minBoxFret);

    return {
      step: index + 1,
      string: node.string,
      fret: node.fret,
      pitch: noteInfo.pitch,
      noteName: finalNoteName,
      solfege,
      interval,
      degree: ((index) % scaleNotes.length) + 1,
      isRoot,
      isStart,
      finger,
      midi: node.midi
    };
  });
}

// ==========================================
// 6. ACORDES Y CHORDS-DB
// ==========================================

export interface ChordTypeDefinition {
  suffix: string; // Nombre en chords-db
  name: string; // Nombre en español
  symbol: string; // Símbolo usual
  description: string;
}

export const CHORD_TYPES: ChordTypeDefinition[] = [
  { suffix: 'major', name: 'Mayor', symbol: '', description: 'Tríada mayor: tónica, tercera mayor, quinta justa (1 - 3 - 5)' },
  { suffix: 'minor', name: 'Menor', symbol: 'm', description: 'Tríada menor: tónica, tercera menor, quinta justa (1 - b3 - 5)' },
  { suffix: '5', name: 'Quinta / Power Chord (5)', symbol: '5', description: 'Acorde de potencia sin tercera: tónica y quinta justa (1 - 5)' },
  { suffix: '7', name: 'Séptima dominante (7)', symbol: '7', description: 'Acorde dominante: 1 - 3 - 5 - b7. Tensión que resuelve' },
  { suffix: 'maj7', name: 'Mayor séptima (maj7)', symbol: 'maj7', description: 'Acorde elegante con séptima mayor: 1 - 3 - 5 - 7' },
  { suffix: 'm7', name: 'Menor séptima (m7)', symbol: 'm7', description: 'Acorde menor suave: 1 - b3 - 5 - b7' },
  { suffix: 'mmaj7', name: 'Menor mayor séptima (mMaj7)', symbol: 'mMaj7', description: 'Acorde menor con séptima mayor: 1 - b3 - 5 - 7' },
  { suffix: 'sus2', name: 'Suspendido 2 (sus2)', symbol: 'sus2', description: 'Tercera sustituida por segunda mayor: 1 - 2 - 5' },
  { suffix: 'sus4', name: 'Suspendido 4 (sus4)', symbol: 'sus4', description: 'Tercera sustituida por cuarta justa: 1 - 4 - 5' },
  { suffix: 'dim', name: 'Disminuido (dim)', symbol: 'dim', description: 'Tríada disminuida tensa: 1 - b3 - b5' },
  { suffix: 'dim7', name: 'Disminuido séptima (dim7)', symbol: 'dim7', description: 'Acorde simétrico disminuido con 7ma disminuida: 1 - b3 - b5 - bb7' },
  { suffix: 'aug', name: 'Aumentado (aug)', symbol: 'aug', description: 'Tríada con quinta aumentada: 1 - 3 - #5' },
  { suffix: 'add9', name: 'Añadida novena (add9)', symbol: 'add9', description: 'Tríada mayor con la novena agregada: 1 - 3 - 5 - 9' },
  { suffix: 'm7b5', name: 'Semidisminuido (m7b5)', symbol: 'm7b5', description: 'Acorde semidisminuido: 1 - b3 - b5 - b7' },
  { suffix: '9', name: 'Novena dominante (9)', symbol: '9', description: 'Dominante extendido con novena: 1 - 3 - 5 - b7 - 9' }
];

export interface ChordPositionData {
  frets: number[]; // Trastes en formato chords-db (index 0 = 6ta cuerda, index 5 = 1ra)
  fingers: number[]; // Dedos (0 = al aire/silencio, 1 = índice, 2 = medio, 3 = anular, 4 = meñique)
  baseFret: number; // Traste base donde inicia el diagrama vertical
  barres: number[]; // Cejillas relativas
  midi?: number[];
  capo?: boolean;
  absoluteFrets: number[]; // Trastes absolutos calculados en el mástil (0..N, o -1 si muteada)
  stringNotes: Array<{
    string: number; // 1..6
    fret: number; // -1 (muteada), 0 (al aire), >0
    noteName: string;
    interval: string;
    isRoot: boolean;
    finger: number;
    pitch: string;
    midi: number;
  }>;
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

function getChordsDbKey(root: string): string {
  if (root === 'C#') return 'Csharp';
  if (root === 'F#') return 'Fsharp';
  return root;
}

export function calculateAbsoluteFret(rawFret: number, baseFret: number): number {
  if (rawFret === -1) return -1;
  if (rawFret === 0) return 0;
  return baseFret + rawFret - 1;
}

interface RawDbPosition {
  frets: number[];
  fingers: number[];
  baseFret: number;
  barres?: number[];
  midi?: number[];
  capo?: boolean;
}

/**
 * Posiciones estándar canónicas (con tónica en el bajo y sin inversiones accidentales)
 * para corregir o priorizar digitaciones que en chords-db tienen notas erróneas o inversiones de 5ta en el bajo.
 */
const CANONICAL_CHORD_OVERRIDES: Record<string, RawDbPosition[]> = {
  'C:maj7': [
    { frets: [-1, 3, 2, 0, 0, 0], fingers: [0, 3, 2, 0, 0, 0], baseFret: 1, barres: [] }
  ],
  'B:major': [
    { frets: [-1, 1, 3, 3, 3, 1], fingers: [0, 1, 2, 3, 4, 1], baseFret: 2, barres: [1] }
  ],
  'B:minor': [
    { frets: [-1, 1, 3, 3, 2, 1], fingers: [0, 1, 3, 4, 2, 1], baseFret: 2, barres: [1] }
  ],
  'B:m7': [
    { frets: [-1, 1, 3, 1, 2, 1], fingers: [0, 1, 3, 1, 2, 1], baseFret: 2, barres: [1] }
  ],
  'B:sus2': [
    { frets: [-1, 1, 3, 3, 1, 1], fingers: [0, 1, 3, 4, 1, 1], baseFret: 2, barres: [1] }
  ],
  'B:sus4': [
    { frets: [-1, 1, 3, 3, 4, 1], fingers: [0, 1, 2, 3, 4, 1], baseFret: 2, barres: [1] }
  ],
  'C#:aug': [
    { frets: [-1, 4, 3, 2, 2, 1], fingers: [0, 4, 3, 2, 2, 1], baseFret: 1, barres: [] },
    { frets: [-1, 4, 3, 2, 2, -1], fingers: [0, 4, 3, 1, 2, 0], baseFret: 1, barres: [] }
  ]
};

/**
 * Genera voicings movibles estándar de Power Chords (5) en cuerdas 6, 5 y 4 para cualquier tónica.
 */
function buildPowerChordPositions(root: string): RawDbPosition[] {
  const stdTuning = TUNINGS.standard.notes;
  const rootChroma = Note.chroma(root) ?? 0;

  const findRootFretOnString = (stringNum: number): number => {
    const openChroma = getNoteAtFret(stringNum, 0, stdTuning).chroma;
    return (rootChroma - openChroma + 12) % 12;
  };

  const positions: RawDbPosition[] = [];

  // Forma en 6ta cuerda (6-5-4)
  const f6 = findRootFretOnString(6);
  positions.push(
    f6 === 0
      ? { frets: [0, 2, 2, -1, -1, -1], fingers: [0, 1, 2, 0, 0, 0], baseFret: 1, barres: [] }
      : { frets: [1, 3, 3, -1, -1, -1], fingers: [1, 3, 4, 0, 0, 0], baseFret: f6, barres: [] }
  );

  // Forma en 5ta cuerda (5-4-3)
  const f5 = findRootFretOnString(5);
  positions.push(
    f5 === 0
      ? { frets: [-1, 0, 2, 2, -1, -1], fingers: [0, 0, 1, 2, 0, 0], baseFret: 1, barres: [] }
      : { frets: [-1, 1, 3, 3, -1, -1], fingers: [0, 1, 3, 4, 0, 0], baseFret: f5, barres: [] }
  );

  // Forma en 4ta cuerda (4-3-2) — nota en 2da cuerda requiere +1 traste por afinación G-B
  const f4 = findRootFretOnString(4);
  positions.push(
    f4 === 0
      ? { frets: [-1, -1, 0, 2, 3, -1], fingers: [0, 0, 0, 1, 2, 0], baseFret: 1, barres: [] }
      : { frets: [-1, -1, 1, 3, 4, -1], fingers: [0, 0, 1, 3, 4, 0], baseFret: f4, barres: [] }
  );

  return positions.sort((a, b) => a.baseFret - b.baseFret);
}

/**
 * Valida que una digitación de chords-db (en afinación estándar) no contenga notas ajenas al acorde
 * y conserve los intervalos esenciales (3ra, 7ma, 9na, etc.).
 */
function isValidChordDbPosition(
  pos: RawDbPosition,
  requiredChromas: Set<number>,
  essentialChromas: Set<number>
): boolean {
  const stdTuning = TUNINGS.standard.notes;
  const baseFret = pos.baseFret || 1;
  const playedChromas = new Set<number>();

  for (let strIdx = 0; strIdx < 6; strIdx++) {
    const rf = pos.frets[strIdx];
    if (rf === -1) continue;
    const absFret = calculateAbsoluteFret(rf, baseFret);
    const stringNum = 6 - strIdx;
    const noteInfo = getNoteAtFret(stringNum, absFret, stdTuning);
    if (!requiredChromas.has(noteInfo.chroma)) {
      return false; // Contiene una nota extraña fuera del acorde
    }
    playedChromas.add(noteInfo.chroma);
  }

  // Verificar que estén presentes las notas guía esenciales (ej. b7 en acordes 9, b5 en dim/m7b5, #5 en aug)
  for (const ess of essentialChromas) {
    if (!playedChromas.has(ess)) {
      return false;
    }
  }

  return playedChromas.size > 0;
}

export function getChordData(
  root: string,
  suffix: string,
  positionIndex = 0,
  tuningId: TuningId = 'standard',
  fretCount = 21
): ChordResult {
  const chordsDict = (guitarChordsRaw as any).chords;
  const dbKey = getChordsDbKey(root);
  const chordsForKey = chordsDict[dbKey] || [];
  const foundChord = chordsForKey.find((c: any) => c.suffix === suffix);

  const chordDef = CHORD_TYPES.find(ct => ct.suffix === suffix) || CHORD_TYPES[0];
  const chordSymbol = `${root}${chordDef.symbol}`;

  const tonalChord = Chord.get(`${root}${chordDef.symbol || 'M'}`);
  const notes = (tonalChord.notes.length > 0 ? tonalChord.notes : [root]).map(simplifyDoubleAccidental);
  const intervals = tonalChord.intervals.map(formatInterval);

  const tuning = TUNINGS[tuningId] || TUNINGS.standard;
  const rootChroma = Note.chroma(root) ?? 0;
  const chordChromas = notes.map(n => Note.chroma(n) ?? 0);
  const requiredChromas = new Set(chordChromas);

  // Notas esenciales que no deben omitirse (todas excepto la 5ta justa y la tónica en voicings sin fundamental avanzados,
  // aunque en acordes de 9na exigimos al menos la 3ra, 7ma y 9na; en acordes normales exigimos todas excepto la 5P)
  const essentialChromas = new Set<number>();
  tonalChord.intervals.forEach((inv, idx) => {
    const c = chordChromas[idx];
    if (c === undefined) return;
    if (inv === '5P') return; // Omitir la 5ta justa es idiomático en guitarra
    if (suffix === '9' && inv === '1P') return; // Los voicings sin raíz (rootless) conservan 3, b7, 9
    essentialChromas.add(c);
  });

  const stdTuning = TUNINGS.standard.notes;
  let candidateRawPositions: RawDbPosition[] = [];

  if (suffix === '5') {
    candidateRawPositions = buildPowerChordPositions(root);
  } else {
    const dbPositions = ((foundChord?.positions || []) as RawDbPosition[]).filter(p =>
      isValidChordDbPosition(p, requiredChromas, essentialChromas)
    );

    // Priorizar posiciones con tónica en el bajo sobre inversiones de 5ta o 3ra
    const isRootInBass = (p: RawDbPosition) => {
      const baseFret = p.baseFret || 1;
      for (let strIdx = 0; strIdx < 6; strIdx++) {
        const rf = p.frets[strIdx];
        if (rf !== -1) {
          const absFret = calculateAbsoluteFret(rf, baseFret);
          return getNoteAtFret(6 - strIdx, absFret, stdTuning).chroma === rootChroma;
        }
      }
      return false;
    };

    const rootBassPositions = dbPositions.filter(isRootInBass);
    const inversionPositions = dbPositions.filter(p => !isRootInBass(p));
    const overrides = CANONICAL_CHORD_OVERRIDES[`${root}:${suffix}`] || [];

    candidateRawPositions = [...overrides, ...rootBassPositions, ...inversionPositions];
  }

  // Deduplicar posiciones por trastes absolutos
  const seenAbsKeys = new Set<string>();
  const uniqueRawPositions: RawDbPosition[] = [];
  for (const p of candidateRawPositions) {
    const baseFret = p.baseFret || 1;
    const absKey = p.frets.map(rf => calculateAbsoluteFret(rf, baseFret)).join(',');
    if (!seenAbsKeys.has(absKey)) {
      seenAbsKeys.add(absKey);
      uniqueRawPositions.push(p);
    }
  }

  const positions: ChordPositionData[] = uniqueRawPositions.map((pos: RawDbPosition) => {
    const baseFret = pos.baseFret || 1;
    const rawFrets = pos.frets;
    const rawFingers = pos.fingers || [0, 0, 0, 0, 0, 0];
    const barres = pos.barres || [];

    const absoluteFrets = rawFrets.map(rf => calculateAbsoluteFret(rf, baseFret));

    const stringNotes = rawFrets.map((rf, stringIdx) => {
      const stringNum = 6 - stringIdx;
      const absFret = calculateAbsoluteFret(rf, baseFret);
      const finger = rawFingers[stringIdx] || 0;

      if (absFret === -1) {
        return {
          string: stringNum,
          fret: -1,
          noteName: 'X',
          interval: '',
          isRoot: false,
          finger: 0,
          pitch: '',
          midi: 0
        };
      }

      const noteInfo = getNoteAtFret(stringNum, absFret, tuning.notes);
      const isRoot = noteInfo.chroma === rootChroma;
      const matchingChordNote = notes.find(n => (Note.chroma(n) ?? -1) === noteInfo.chroma);
      const finalNoteName = simplifyDoubleAccidental(matchingChordNote || noteInfo.noteName);
      const interval = isRoot ? '1' : getIntervalBetween(root, finalNoteName);

      return {
        string: stringNum,
        fret: absFret,
        noteName: finalNoteName,
        interval,
        isRoot,
        finger,
        pitch: noteInfo.pitch,
        midi: noteInfo.midi
      };
    });

    return {
      frets: rawFrets,
      fingers: rawFingers,
      baseFret,
      barres,
      midi: pos.midi,
      capo: pos.capo,
      absoluteFrets,
      stringNotes
    };
  });

  const allFretboardDots: ScalePositionDot[] = [];
  for (let stringNum = 1; stringNum <= 6; stringNum++) {
    for (let fret = 0; fret <= fretCount; fret++) {
      const noteInfo = getNoteAtFret(stringNum, fret, tuning.notes);
      if (chordChromas.includes(noteInfo.chroma)) {
        const isRoot = noteInfo.chroma === rootChroma;
        const matchingNote = notes.find(n => (Note.chroma(n) ?? -1) === noteInfo.chroma) || noteInfo.noteName;
        const finalNoteName = simplifyDoubleAccidental(matchingNote);
        const interval = isRoot ? '1' : getIntervalBetween(root, finalNoteName);

        allFretboardDots.push({
          string: stringNum,
          fret,
          note: finalNoteName,
          interval,
          isRoot,
          inBox: true,
          pitch: noteInfo.pitch,
          octave: noteInfo.octave,
          chroma: noteInfo.chroma,
          midi: noteInfo.midi
        });
      }
    }
  }

  const safePositionIndex = Math.min(positionIndex, Math.max(0, positions.length - 1));

  return {
    root,
    suffix,
    chordName: `${root} ${chordDef.name}`,
    symbol: chordSymbol,
    notes,
    intervals,
    positions,
    selectedPositionIndex: safePositionIndex,
    currentPosition: positions[safePositionIndex],
    allFretboardDots
  };
}
