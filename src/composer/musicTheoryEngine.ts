/**
 * @file musicTheoryEngine.ts
 * @description Motor central de teoría musical para el Editor de Composición:
 * - Cálculo exacto de tonalidades, armaduras y notas diatónicas con ortografía enarmónica
 * - Grados romanos, acordes de tríada y cuatríada con funciones armónicas
 * - Posicionamiento exacto en pentagrama para Clave de Sol, Clave de Fa y Clave de Do
 * - Cálculo métrico para compases simples (2/4, 3/4, 4/4, 5/4) y compuestos (6/8, 7/8, 9/8, 12/8)
 * - Inversiones de acordes, asistente armónico de tensiones y notas a evitar
 */

import { Key, Chord, Scale, Note, Interval } from 'tonal';
import {
  ClefType,
  TimeSignature,
  NoteDuration,
  ScoreNote,
  ScoreChord,
  KeySignatureInfo,
  DiatonicChordInfo,
  ScaleDefinition,
  HarmonicAssistantInfo
} from './types';
import { getSolfege, formatNoteName, NoteNotation } from '../utils/theory';

// Orden estándar de sostenidos y bemoles en armaduras
export const SHARPS_ORDER = ['F#', 'C#', 'G#', 'D#', 'A#', 'E#', 'B#'];
export const FLATS_ORDER = ['Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb', 'Fb'];

// Mapeo diatónico alfabético (C = 0, D = 1, E = 2, F = 3, G = 4, A = 5, B = 6)
export const STEP_INDEX: Record<string, number> = {
  C: 0,
  D: 1,
  E: 2,
  F: 3,
  G: 4,
  A: 5,
  B: 6
};

export const STEP_NAMES: Array<'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B'> = [
  'C', 'D', 'E', 'F', 'G', 'A', 'B'
];

/**
 * Retorna la duración en beats (negras / quarter notes) para una figura dada.
 */
export function getDurationInBeats(duration: NoteDuration, dotted = false): number {
  let base: number;
  switch (duration) {
    case 'whole':
      base = 4.0;
      break;
    case 'half':
      base = 2.0;
      break;
    case 'quarter':
      base = 1.0;
      break;
    case 'eighth':
      base = 0.5;
      break;
    case 'sixteenth':
      base = 0.25;
      break;
    default:
      base = 1.0;
  }
  return dotted ? base * 1.5 : base;
}

/**
 * Calcula la capacidad máxima en beats (negras) de un compás según su métrica.
 */
export function getMeasureCapacityBeats(timeSignature: TimeSignature): number {
  switch (timeSignature) {
    case '2/4':
      return 2.0;
    case '3/4':
      return 3.0;
    case '4/4':
      return 4.0;
    case '5/4':
      return 5.0;
    case '6/8':
      // 6 corcheas = 3 negras
      return 3.0;
    case '7/8':
      // 7 corcheas = 3.5 negras
      return 3.5;
    case '9/8':
      // 9 corcheas = 4.5 negras
      return 4.5;
    case '12/8':
      // 12 corcheas = 6 negras
      return 6.0;
    default:
      return 4.0;
  }
}

/**
 * Retorna las características de la métrica (número de pulsos principales y subdivisión).
 */
export function getMeterInfo(timeSignature: TimeSignature): {
  isCompound: boolean;
  pulseCount: number;
  pulseUnit: string;
  subdivision: string;
} {
  switch (timeSignature) {
    case '2/4':
      return { isCompound: false, pulseCount: 2, pulseUnit: 'Negra', subdivision: 'Binaria' };
    case '3/4':
      return { isCompound: false, pulseCount: 3, pulseUnit: 'Negra', subdivision: 'Ternaria' };
    case '4/4':
      return { isCompound: false, pulseCount: 4, pulseUnit: 'Negra', subdivision: 'Cuaternaria' };
    case '5/4':
      return { isCompound: false, pulseCount: 5, pulseUnit: 'Negra', subdivision: 'Irregular (3+2)' };
    case '6/8':
      return { isCompound: true, pulseCount: 2, pulseUnit: 'Negra con puntillo (3 corcheas c/u)', subdivision: 'Compuesta binaria' };
    case '7/8':
      return { isCompound: true, pulseCount: 3, pulseUnit: 'Corcheas agrupadas (2+2+3)', subdivision: 'Amalgama' };
    case '9/8':
      return { isCompound: true, pulseCount: 3, pulseUnit: 'Negra con puntillo (3 corcheas c/u)', subdivision: 'Compuesta ternaria' };
    case '12/8':
      return { isCompound: true, pulseCount: 4, pulseUnit: 'Negra con puntillo (3 corcheas c/u)', subdivision: 'Compuesta cuaternaria' };
    default:
      return { isCompound: false, pulseCount: 4, pulseUnit: 'Negra', subdivision: 'Binaria' };
  }
}

/**
 * Paso diatónico absoluto (C0 = 0).
 * C4 (Do central) = 4 * 7 + 0 = 28.
 */
export function getAbsoluteDiatonicStep(step: string, octave: number): number {
  const cleanStep = step.toUpperCase()[0];
  const stepIdx = STEP_INDEX[cleanStep] ?? 0;
  return octave * 7 + stepIdx;
}

/**
 * Retorna la línea base de referencia para una clave específica.
 * En cada clave, la primera línea inferior (Line 1) tiene un paso absoluto:
 * - Clave de Sol (Treble): Primera línea es E4 = 4 * 7 + 2 = 30.
 * - Clave de Fa (Bass): Primera línea es G2 = 2 * 7 + 4 = 18.
 * - Clave de Do en 3ra (Alto): Primera línea es F3 = 3 * 7 + 3 = 24.
 */
export function getClefLine1Step(clef: ClefType): number {
  switch (clef) {
    case 'treble':
      return 30; // E4
    case 'bass':
      return 18; // G2
    case 'alto':
      return 24; // F3
    default:
      return 30;
  }
}

/**
 * Calcula la coordenada Y en el pentagrama para una nota.
 * staffTopY: Y de la 5ta línea (superior).
 * lineSpacing: separación entre líneas (12px estándar).
 */
export function calculateNoteStaffY(
  step: string,
  octave: number,
  clef: ClefType,
  staffTopY: number,
  lineSpacing = 12
): number {
  const noteStep = getAbsoluteDiatonicStep(step, octave);
  const line1Step = getClefLine1Step(clef);
  const line1Y = staffTopY + 4 * lineSpacing;
  const stepHeight = lineSpacing / 2;

  // Cada paso diatónico asciende stepHeight píxeles
  return line1Y - (noteStep - line1Step) * stepHeight;
}

/**
 * Retorna las posiciones Y de líneas adicionales (ledger lines).
 */
export function calculateLedgerLines(
  step: string,
  octave: number,
  clef: ClefType,
  staffTopY: number,
  lineSpacing = 12
): number[] {
  const noteStep = getAbsoluteDiatonicStep(step, octave);
  const line1Step = getClefLine1Step(clef);
  const line5Step = line1Step + 8; // 4 espacios de línea = 8 pasos diatónicos
  const line1Y = staffTopY + 4 * lineSpacing;
  const stepHeight = lineSpacing / 2;
  const ledgerYList: number[] = [];

  // Por debajo de la línea 1:
  if (noteStep < line1Step) {
    for (let s = line1Step - 2; s >= noteStep - (noteStep % 2 !== 0 ? 1 : 0); s -= 2) {
      ledgerYList.push(line1Y - (s - line1Step) * stepHeight);
    }
  }

  // Por encima de la línea 5:
  if (noteStep > line5Step) {
    for (let s = line5Step + 2; s <= noteStep + (noteStep % 2 !== 0 ? 1 : 0); s += 2) {
      ledgerYList.push(line1Y - (s - line1Step) * stepHeight);
    }
  }

  return ledgerYList;
}

/**
 * Determina si la plica (stem) debe apuntar hacia arriba o abajo según las normas clásicas:
 * Si la nota está por debajo de la línea media (Línea 3 = line1Step + 4), la plica va hacia arriba por la derecha.
 * Si está en o por encima de la línea media, la plica va hacia abajo por la izquierda.
 */
export function getStemDirection(step: string, octave: number, clef: ClefType): 'up' | 'down' {
  const noteStep = getAbsoluteDiatonicStep(step, octave);
  const middleLineStep = getClefLine1Step(clef) + 4;
  return noteStep < middleLineStep ? 'up' : 'down';
}

/**
 * Información completa y precisa de armadura de tonalidad.
 */
export function getKeySignatureInfo(
  tonic: string,
  mode: 'major' | 'minor' = 'major',
  notation: NoteNotation = 'spanish'
): KeySignatureInfo {
  let effectiveTonic = tonic;
  let keyData = mode === 'major' ? Key.majorKey(effectiveTonic) : Key.minorKey(effectiveTonic);

  // Si una tonalidad teórica supera 7 alteraciones (ej. Db menor = 8 bemoles), usar su enarmónico estándar (C# menor = 4 sostenidos)
  const rawSigStr = keyData.keySignature || '';
  if (rawSigStr.length > 7) {
    const enh = Note.enharmonic(tonic);
    if (enh && enh !== tonic) {
      effectiveTonic = enh;
      keyData = mode === 'major' ? Key.majorKey(effectiveTonic) : Key.minorKey(effectiveTonic);
    }
  }

  const solfegeTonic = getSolfege(effectiveTonic);
  const displayTonic = formatNoteName(effectiveTonic, notation);

  // Armaduras estándar: en Tonal.js, keySignature viene como "#", "##", "b", "bb", etc.
  const keySigStr = keyData.keySignature || '';
  const sharpCount = (keySigStr.match(/#/g) || []).length;
  const flatCount = (keySigStr.match(/b/g) || []).length;
  let count = 0;
  let accidentals: string[] = [];

  if (sharpCount > 0) {
    count = Math.min(7, sharpCount);
    accidentals = SHARPS_ORDER.slice(0, count);
  } else if (flatCount > 0) {
    count = -Math.min(7, flatCount);
    accidentals = FLATS_ORDER.slice(0, Math.min(7, flatCount));
  }

  const scaleNotes = mode === 'major'
    ? (keyData as ReturnType<typeof Key.majorKey>).scale
    : (keyData as ReturnType<typeof Key.minorKey>).natural.scale;

  return {
    tonic: effectiveTonic,
    mode,
    name: `${displayTonic} ${mode === 'major' ? 'Mayor' : 'Menor'}`,
    solfegeTonic,
    accidentalCount: count,
    accidentals,
    scaleNotes: scaleNotes && scaleNotes.length === 7 ? [...scaleNotes] : ['C', 'D', 'E', 'F', 'G', 'A', 'B']
  };
}

/**
 * Voicing armónico balanceado según clave y registro.
 */
export function createVoicingForChord(
  chordSymbol: string,
  clef: ClefType = 'treble',
  inversion = 0
): { pitches: string[]; midis: number[] } {
  try {
    const chordInfo = Chord.get(chordSymbol);
    const rawNotes = chordInfo.notes.length > 0 ? chordInfo.notes : ['C', 'E', 'G'];

    // Aplicar inversión rotando el array
    const invCount = inversion % rawNotes.length;
    const invertedNotes = [...rawNotes.slice(invCount), ...rawNotes.slice(0, invCount)];

    // Registro base según la clave:
    // Treble: C4 (60) a G5 (79)
    // Bass: C3 (48) a G4 (67)
    // Alto: G3 (55) a D5 (74)
    let startOctave = clef === 'bass' ? 3 : clef === 'alto' ? 3 : 4;

    const pitches: string[] = [];
    const midis: number[] = [];

    invertedNotes.forEach((nName, idx) => {
      if (idx > 0) {
        const prevStep = STEP_INDEX[invertedNotes[idx - 1][0].toUpperCase()] ?? 0;
        const curStep = STEP_INDEX[nName[0].toUpperCase()] ?? 0;
        if (curStep <= prevStep) {
          startOctave++;
        }
      }
      const pitchWithOctave = `${nName}${startOctave}`;
      const midiVal = Note.midi(pitchWithOctave) || (60 + idx * 4);
      pitches.push(pitchWithOctave);
      midis.push(midiVal);
    });

    return { pitches, midis };
  } catch {
    return { pitches: ['C4', 'E4', 'G4'], midis: [60, 64, 67] };
  }
}

/**
 * Calcula todos los acordes diatónicos y funciones armónicas de una tonalidad.
 */
export function getDiatonicChords(tonic: string, mode: 'major' | 'minor' = 'major', clef: ClefType = 'treble'): DiatonicChordInfo[] {
  const result: DiatonicChordInfo[] = [];

  if (mode === 'major') {
    const keyData = Key.majorKey(tonic);
    const triadNumerals = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
    const functions: Array<'tonic' | 'subdominant' | 'dominant'> = [
      'tonic',        // I
      'subdominant',  // ii
      'tonic',        // iii
      'subdominant',  // IV
      'dominant',     // V
      'tonic',        // vi
      'dominant'      // vii°
    ];

    keyData.triads.forEach((symbol, idx) => {
      const voicing = createVoicingForChord(symbol, clef);
      const rootNote = symbol.replace(/m|dim/g, '');
      const quality = symbol.includes('dim') ? 'disminuido' : symbol.includes('m') ? 'menor' : 'mayor';

      result.push({
        symbol,
        numeral: triadNumerals[idx] || `Grado ${idx + 1}`,
        name: `${getSolfege(rootNote)} ${quality}`,
        solfege: `${getSolfege(rootNote)}${symbol.includes('dim') ? '°' : symbol.includes('m') ? 'm' : ''}`,
        harmonicFunction: functions[idx] || 'tonic',
        type: 'triad',
        notes: Chord.get(symbol).notes,
        suggestedPitches: voicing.pitches,
        midis: voicing.midis
      });
    });

    // Añadir acordes de 7ma
    const seventhNumerals = ['Imaj7', 'ii7', 'iii7', 'IVmaj7', 'V7', 'vi7', 'viiø7'];
    keyData.chords.forEach((symbol, idx) => {
      const voicing = createVoicingForChord(symbol, clef);
      const rootNote = symbol.replace(/maj7|m7|7|m7b5/g, '');

      result.push({
        symbol,
        numeral: seventhNumerals[idx] || `Grado 7ma ${idx + 1}`,
        name: `${getSolfege(rootNote)} ${symbol.includes('maj7') ? 'maj7' : symbol.includes('m7b5') ? 'semidisminuido' : symbol.includes('m7') ? 'menor 7' : 'dominante 7'}`,
        solfege: `${getSolfege(rootNote)}${symbol.slice(rootNote.length)}`,
        harmonicFunction: functions[idx] || 'tonic',
        type: 'seventh',
        notes: Chord.get(symbol).notes,
        suggestedPitches: voicing.pitches,
        midis: voicing.midis
      });
    });
  } else {
    // Tonalidad Menor Natural & Armónica
    let keyData = Key.minorKey(tonic);
    if ((keyData.keySignature || '').length > 7) {
      const enh = Note.enharmonic(tonic);
      if (enh && enh !== tonic) {
        keyData = Key.minorKey(enh);
      }
    }

    const triadNumerals = ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'];
    const functions: Array<'tonic' | 'subdominant' | 'dominant'> = [
      'tonic',        // i
      'subdominant',  // ii°
      'tonic',        // III
      'subdominant',  // iv
      'dominant',     // v (o V armónico)
      'subdominant',  // VI
      'dominant'      // VII
    ];

    // En escala menor natural, el grado VII es MAYOR (ej. G en La menor, Bb en Do menor), no disminuido
    const triads = ['m', 'dim', '', 'm', 'm', '', ''].map((q, idx) => {
      const root = keyData.natural.scale[idx] || 'A';
      return `${root}${q}`;
    });

    triads.forEach((symbol, idx) => {
      const voicing = createVoicingForChord(symbol, clef);
      const rootNote = symbol.replace(/m|dim/g, '');
      const quality = symbol.includes('dim') ? 'disminuido' : symbol.includes('m') ? 'menor' : 'mayor';

      result.push({
        symbol,
        numeral: triadNumerals[idx] || `Grado ${idx + 1}`,
        name: `${getSolfege(rootNote)} ${quality}`,
        solfege: `${getSolfege(rootNote)}${symbol.includes('dim') ? '°' : symbol.includes('m') ? 'm' : ''}`,
        harmonicFunction: functions[idx] || 'tonic',
        type: 'triad',
        notes: Chord.get(symbol).notes,
        suggestedPitches: voicing.pitches,
        midis: voicing.midis
      });
    });

    // Cuatríadas diatónicas de la escala menor natural (im7, iiø7, IIImaj7, ivm7, vm7, VImaj7, VII7)
    const minorSeventhNumerals = ['im7', 'iiø7', 'IIImaj7', 'ivm7', 'vm7', 'VImaj7', 'VII7'];
    const minorSeventhSuffixes = ['m7', 'm7b5', 'maj7', 'm7', 'm7', 'maj7', '7'];
    minorSeventhSuffixes.forEach((suffix, idx) => {
      const rootNote = keyData.natural.scale[idx] || 'A';
      const symbol = `${rootNote}${suffix}`;
      const voicing = createVoicingForChord(symbol, clef);
      const qualityLabel =
        suffix === 'maj7'
          ? 'maj7'
          : suffix === 'm7b5'
          ? 'semidisminuido'
          : suffix === 'm7'
          ? 'menor 7'
          : 'dominante 7';

      result.push({
        symbol,
        numeral: minorSeventhNumerals[idx] || `Grado 7ma ${idx + 1}`,
        name: `${getSolfege(rootNote)} ${qualityLabel}`,
        solfege: `${getSolfege(rootNote)}${suffix}`,
        harmonicFunction: functions[idx] || 'tonic',
        type: 'seventh',
        notes: Chord.get(symbol).notes,
        suggestedPitches: voicing.pitches,
        midis: voicing.midis
      });
    });

    // Añadir Dominante Mayor V7 tradicional de menor armónica
    const domRoot = keyData.natural.scale[4] || 'E';
    const dom7Symbol = `${domRoot}7`;
    const domVoicing = createVoicingForChord(dom7Symbol, clef);
    result.push({
      symbol: dom7Symbol,
      numeral: 'V7 (Armónica)',
      name: `${getSolfege(domRoot)} Dominante 7`,
      solfege: `${getSolfege(domRoot)}7`,
      harmonicFunction: 'dominant',
      type: 'seventh',
      notes: Chord.get(dom7Symbol).notes,
      suggestedPitches: domVoicing.pitches,
      midis: domVoicing.midis
    });
  }

  return result;
}

/**
 * Explorador y generador exhaustivo de escalas para la tonalidad seleccionada.
 */
export function getScaleDefinitions(tonic: string, notation: NoteNotation = 'spanish'): ScaleDefinition[] {
  const solfege = formatNoteName(tonic, notation);

  const scalesList: Array<{
    id: string;
    tonalName: string;
    displayName: string;
    category: ScaleDefinition['category'];
    formula: string;
    desc: string;
    compatibleChords: string[];
  }> = [
    {
      id: 'major',
      tonalName: `${tonic} major`,
      displayName: `Mayor Natural (Jónica) de ${solfege}`,
      category: 'diatonic',
      formula: '1 2 3 4 5 6 7',
      desc: 'Escala madre del sistema tonal occidental. Sonido brillante, estable y triunfal.',
      compatibleChords: [`${tonic}`, `${tonic}maj7`, `${tonic}add9`]
    },
    {
      id: 'natural-minor',
      tonalName: `${tonic} minor`,
      displayName: `Menor Natural (Eólica) de ${solfege}`,
      category: 'diatonic',
      formula: '1 2 b3 4 5 b6 b7',
      desc: 'Base de la tonalidad menor. Sonido melancólico, introspectivo y oscuro.',
      compatibleChords: [`${tonic}m`, `${tonic}m7`]
    },
    {
      id: 'harmonic-minor',
      tonalName: `${tonic} harmonic minor`,
      displayName: `Menor Armónica de ${solfege}`,
      category: 'minor_variant',
      formula: '1 2 b3 4 5 b6 7',
      desc: 'Con 7ma mayor y salto característico de 2da aumentada. Sonido neoclásico y dramático.',
      compatibleChords: [`${tonic}m(maj7)`, `${tonic}m`]
    },
    {
      id: 'melodic-minor',
      tonalName: `${tonic} melodic minor`,
      displayName: `Menor Melódica (Jazz) de ${solfege}`,
      category: 'minor_variant',
      formula: '1 2 b3 4 5 6 7',
      desc: 'Sube con 6ta y 7ma mayores. Genera modos modernos como el Superlocrio y Lidio dominante.',
      compatibleChords: [`${tonic}m6`, `${tonic}m(maj7)`]
    },
    {
      id: 'major-pentatonic',
      tonalName: `${tonic} major pentatonic`,
      displayName: `Pentatónica Mayor de ${solfege}`,
      category: 'pentatonic',
      formula: '1 2 3 5 6',
      desc: 'Sin semitonos tensos (4ta y 7ma omitidas). Ideal para melodías fluidas e improvisación.',
      compatibleChords: [`${tonic}`, `${tonic}maj7`, `${tonic}6`]
    },
    {
      id: 'minor-pentatonic',
      tonalName: `${tonic} minor pentatonic`,
      displayName: `Pentatónica Menor de ${solfege}`,
      category: 'pentatonic',
      formula: '1 b3 4 5 b7',
      desc: 'La escala más representativa de los solos de guitarra en rock, blues y funk.',
      compatibleChords: [`${tonic}m`, `${tonic}m7`, `${tonic}7`]
    },
    {
      id: 'blues',
      tonalName: `${tonic} blues`,
      displayName: `Escala Blues de ${solfege}`,
      category: 'pentatonic',
      formula: '1 b3 4 b5 5 b7',
      desc: 'Pentatónica menor con la blue note (b5). Color expresivo y desgarrador.',
      compatibleChords: [`${tonic}7`, `${tonic}m7`]
    },
    {
      id: 'dorian',
      tonalName: `${tonic} dorian`,
      displayName: `Modo Dórico de ${solfege}`,
      category: 'mode',
      formula: '1 2 b3 4 5 6 b7',
      desc: 'Menor con 6ta mayor brillante. Esencial en jazz, funk y rock psicodélico.',
      compatibleChords: [`${tonic}m7`, `${tonic}m6`]
    },
    {
      id: 'phrygian',
      tonalName: `${tonic} phrygian`,
      displayName: `Modo Frigio de ${solfege}`,
      category: 'mode',
      formula: '1 b2 b3 4 5 b6 b7',
      desc: 'Menor con 2da menor exótica. Tensión flamenca y metal.',
      compatibleChords: [`${tonic}m`, `${tonic}sus4(b9)`]
    },
    {
      id: 'lydian',
      tonalName: `${tonic} lydian`,
      displayName: `Modo Lidio de ${solfege}`,
      category: 'mode',
      formula: '1 2 3 #4 5 6 7',
      desc: 'Mayor con 4ta aumentada. Sensación de ingravidez, magia y cinematografía.',
      compatibleChords: [`${tonic}maj7(#11)`, `${tonic}maj7`]
    },
    {
      id: 'mixolydian',
      tonalName: `${tonic} mixolydian`,
      displayName: `Modo Mixolidio de ${solfege}`,
      category: 'mode',
      formula: '1 2 3 4 5 6 b7',
      desc: 'Mayor con 7ma menor dominante. Esencial para solos de blues y rock clásico.',
      compatibleChords: [`${tonic}7`, `${tonic}9`]
    },
    {
      id: 'locrian',
      tonalName: `${tonic} locrian`,
      displayName: `Modo Locrio de ${solfege}`,
      category: 'mode',
      formula: '1 b2 b3 4 b5 b6 b7',
      desc: 'Tónica inestable con 5ta disminuida. Máxima tensión sobre acordes m7b5.',
      compatibleChords: [`${tonic}m7b5`, `${tonic}dim`]
    },
    {
      id: 'chromatic',
      tonalName: `${tonic} chromatic`,
      displayName: `Escala Cromática de ${solfege}`,
      category: 'symmetric',
      formula: '1 b2 2 b3 3 4 b5 5 b6 6 b7 7',
      desc: 'Los 12 semitonos. Enriquecimiento mediante aproximaciones cromáticas.',
      compatibleChords: [`${tonic}`, `${tonic}dim`]
    }
  ];

  return scalesList.map(item => {
    const scaleObj = Scale.get(item.tonalName);
    const notes = scaleObj.notes.length > 0 ? scaleObj.notes : [tonic];
    return {
      id: item.id,
      name: item.displayName,
      category: item.category,
      formula: item.formula,
      intervals: scaleObj.intervals,
      notes,
      solfeges: notes.map(getSolfege),
      description: item.desc,
      compatibleChords: item.compatibleChords
    };
  });
}

function formatIntervalPitch(root: string, interval: string, notation: NoteNotation = 'spanish'): string {
  const transposed = Note.transpose(root, interval);
  const simple = transposed.includes('##') || transposed.includes('bb')
    ? Note.simplify(transposed)
    : transposed;
  return formatNoteName(simple, notation) || simple;
}

/**
 * Asistente armónico inteligente para cualquier acorde.
 * Calcula notas del acorde, notas guía (3 y 7), tensiones (9, 11, 13) y notas a evitar (avoid notes).
 */
export function getHarmonicAssistant(chordSymbol: string, notation: NoteNotation = 'spanish'): HarmonicAssistantInfo {
  try {
    const chord = Chord.get(chordSymbol);
    const root = chord.tonic || 'C';
    const solfegeRoot = formatNoteName(root, notation);
    const notes = chord.notes.length > 0 ? chord.notes : ['C', 'E', 'G'];
    const type = (chord.type || '').toLowerCase();
    const symLower = chordSymbol.toLowerCase();

    const p9 = formatIntervalPitch(root, '9M', notation);
    const pb9 = formatIntervalPitch(root, '9m', notation);
    const p11 = formatIntervalPitch(root, '11P', notation);
    const ps11 = formatIntervalPitch(root, '11A', notation);
    const p13 = formatIntervalPitch(root, '13M', notation);
    const pb13 = formatIntervalPitch(root, '13m', notation);
    const p4 = formatIntervalPitch(root, '4P', notation);

    const guideTones: string[] = [];
    let tensions: string[] = [];
    let avoidNotes: string[] = [];
    const primaryScales: Array<{ name: string; type: string; notes: string[] }> = [];

    // Notas guía: 3ra (o suspensión) y 7ma
    if (notes.length >= 2) {
      guideTones.push(notes[1]);
    }
    if (notes.length >= 4) {
      guideTones.push(notes[3]);
    }

    // Orden estricto de especificidad: semidisminuidos, disminuidos, m(maj7), sus, aumentados, maj7/mayor, menor, dominante
    if (symLower.includes('m7b5') || symLower.includes('ø')) {
      tensions = [`11na (${p11})`, `b13 (${pb13})`, `9na natural (${p9} en Locrio #2)`];
      avoidNotes = [`b9 (${pb9}) choca medio tono sobre la tónica`];
      primaryScales.push({
        name: `Locria de ${solfegeRoot}`,
        type: 'Escala natural para acordes semidisminuidos',
        notes: Scale.get(`${root} locrian`).notes
      });
      primaryScales.push({
        name: `Locria #2 de ${solfegeRoot}`,
        type: 'Derivada de la menor melódica con 9na natural',
        notes: Scale.get(`${root} locrian #2`).notes
      });
    } else if (symLower.includes('dim')) {
      tensions = [`9na (${p9})`, `11na (${p11})`, `b13 (${pb13})`];
      avoidNotes = [`Notas a medio tono por debajo de cada tono del acorde`];
      primaryScales.push({
        name: `Disminuida (Tono-Semitono) de ${solfegeRoot}`,
        type: 'Escala simétrica estándar para dim7',
        notes: Scale.get(`${root} diminished`).notes
      });
      primaryScales.push({
        name: `Locria de ${solfegeRoot}`,
        type: 'Opción diatónica sobre tríada disminuida',
        notes: Scale.get(`${root} locrian`).notes
      });
    } else if (symLower.includes('mmaj7') || symLower.includes('m(maj7)')) {
      tensions = [`9na (${p9})`, `11na (${p11})`, `13na (${p13})`];
      avoidNotes = [`b6 (${pb13}) si se usa menor melódica; 6ta natural (${p13}) en menor armónica`];
      primaryScales.push({
        name: `Menor Melódica de ${solfegeRoot}`,
        type: 'Sonido jazz moderno sobre m(maj7)',
        notes: Scale.get(`${root} melodic minor`).notes
      });
      primaryScales.push({
        name: `Menor Armónica de ${solfegeRoot}`,
        type: 'Color dramático y neoclásico',
        notes: Scale.get(`${root} harmonic minor`).notes
      });
    } else if (symLower.includes('sus4') || symLower.includes('sus2')) {
      tensions = [`9na (${p9})`, `13na (${p13})`];
      avoidNotes = [`3ra mayor en tiempo fuerte si se quiere preservar el carácter suspendido`];
      primaryScales.push({
        name: `Mixolidia de ${solfegeRoot}`,
        type: 'Escala estándar para dominantes sus4 (V7sus4)',
        notes: Scale.get(`${root} mixolydian`).notes
      });
      primaryScales.push({
        name: `Pentatónica Mayor de ${solfegeRoot}`,
        type: 'Sonoridad abierta y consonante',
        notes: Scale.get(`${root} major pentatonic`).notes
      });
    } else if (symLower.includes('aug') || symLower.includes('+')) {
      tensions = [`9na (${p9})`, `#11 (${ps11})`];
      avoidNotes = [`5ta justa y 4ta justa en tiempos fuertes`];
      primaryScales.push({
        name: `Tonal (Tonos enteros) de ${solfegeRoot}`,
        type: 'Simétrica ideal para tríadas aumentadas',
        notes: Scale.get(`${root} whole tone`).notes
      });
      primaryScales.push({
        name: `Lidia Aumentada de ${solfegeRoot}`,
        type: 'Tercer modo de la menor melódica',
        notes: Scale.get(`${root} lydian augmented`).notes
      });
    } else if (symLower.includes('maj7') || (type.includes('major') && !/\d/.test(symLower.replace(/add9|6/, '')))) {
      tensions = [`9na (${p9})`, `13na (${p13})`, `#11 (${ps11} en contexto lidio)`];
      avoidNotes = [`4ta justa (${p4}) en tiempos fuertes porque choca medio tono con la 3ra mayor`];
      primaryScales.push({
        name: `Jónica / Mayor de ${solfegeRoot}`,
        type: 'Tonal primaria',
        notes: Scale.get(`${root} major`).notes
      });
      primaryScales.push({
        name: `Lidia de ${solfegeRoot} (#11)`,
        type: 'Color moderno y etéreo sin notas a evitar',
        notes: Scale.get(`${root} lydian`).notes
      });
      primaryScales.push({
        name: `Pentatónica Mayor de ${solfegeRoot}`,
        type: 'Improvisación segura sin choques',
        notes: Scale.get(`${root} major pentatonic`).notes
      });
    } else if (symLower.includes('m7') || symLower.includes('m6') || type.includes('minor') || (symLower.includes('m') && !symLower.includes('maj'))) {
      tensions = [`9na (${p9})`, `11na (${p11})`, `13na (${p13} en dórico)`];
      avoidNotes = [`b6 (${pb13}) en contexto dórico o sobre acorde m6`];
      primaryScales.push({
        name: `Dórica de ${solfegeRoot}`,
        type: 'Escala preferida en jazz/funk por la 6ta natural',
        notes: Scale.get(`${root} dorian`).notes
      });
      primaryScales.push({
        name: `Pentatónica Menor de ${solfegeRoot}`,
        type: 'Directo y expresivo',
        notes: Scale.get(`${root} minor pentatonic`).notes
      });
      primaryScales.push({
        name: `Eólica / Menor Natural de ${solfegeRoot}`,
        type: 'Tonal melancólica',
        notes: Scale.get(`${root} minor`).notes
      });
    } else if (/\d/.test(symLower)) {
      // Acorde Dominante (7, 9, 11, 13)
      tensions = [`9na (${p9})`, `13na (${p13})`, `b9 (${pb9})`, `#11 (${ps11})`, `b13 (${pb13})`];
      avoidNotes = [`4ta justa (${p4}) en tiempos fuertes porque choca con la 3ra mayor`];
      primaryScales.push({
        name: `Mixolidia de ${solfegeRoot}`,
        type: 'Escala dominante fundamental',
        notes: Scale.get(`${root} mixolydian`).notes
      });
      primaryScales.push({
        name: `Lidia Dominante de ${solfegeRoot} (#11)`,
        type: 'Ideal para dominantes con tensión #11 sin notas a evitar',
        notes: Scale.get(`${root} lydian dominant`).notes
      });
      primaryScales.push({
        name: `Blues de ${solfegeRoot}`,
        type: 'Sabor blues y rock auténtico',
        notes: Scale.get(`${root} blues`).notes
      });
      primaryScales.push({
        name: `Alterada / Superlocria de ${solfegeRoot}`,
        type: 'Máxima tensión antes de resolver',
        notes: Scale.get(`${root} altered`).notes
      });
    } else {
      tensions = [`9na (${p9})`, `13na (${p13})`];
      avoidNotes = [`4ta justa (${p4}) sobre tríada mayor en tiempo fuerte`];
      primaryScales.push({
        name: `Mayor de ${solfegeRoot}`,
        type: 'Escala básica',
        notes: Scale.get(`${root} major`).notes
      });
    }

    return {
      chordSymbol,
      root,
      chordNotes: notes,
      guideTones,
      tensions,
      avoidNotes,
      primaryScales
    };
  } catch {
    return {
      chordSymbol,
      root: 'C',
      chordNotes: ['C', 'E', 'G'],
      guideTones: ['E'],
      tensions: ['Re (9na)'],
      avoidNotes: [],
      primaryScales: []
    };
  }
}

/**
 * Transpone una nota musical por un número de semitonos.
 */
export function transposeNote(note: ScoreNote, semitones: number): ScoreNote {
  const newMidi = Math.max(24, Math.min(96, note.midi + semitones));
  const newPitch = Note.fromMidi(newMidi);
  const pc = Note.pitchClass(newPitch);
  const oct = Note.octave(newPitch) ?? 4;
  const stepLetter = pc[0].toUpperCase() as ScoreNote['step'];
  let alterVal = 0;
  if (pc.includes('##')) alterVal = 2;
  else if (pc.includes('#')) alterVal = 1;
  else if (pc.includes('bb')) alterVal = -2;
  else if (pc.includes('b')) alterVal = -1;

  return {
    ...note,
    step: stepLetter,
    alter: alterVal,
    octave: oct,
    midi: newMidi,
    pitch: newPitch,
    solfege: getSolfege(pc)
  };
}

/**
 * Convierte un nombre de nota como "C4", "F#5", "Bb3" en un ScoreNote válido.
 */
export function createScoreNoteFromPitch(
  pitch: string,
  duration: NoteDuration = 'quarter',
  startBeat = 0,
  dotted = false
): ScoreNote {
  const midiVal = Note.midi(pitch) || 60;
  const pc = Note.pitchClass(pitch) || 'C';
  const oct = Note.octave(pitch) ?? 4;
  const stepLetter = (pc[0].toUpperCase()) as ScoreNote['step'];
  let alterVal = 0;
  if (pc.includes('##')) alterVal = 2;
  else if (pc.includes('#')) alterVal = 1;
  else if (pc.includes('bb')) alterVal = -2;
  else if (pc.includes('b')) alterVal = -1;

  return {
    id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    step: stepLetter,
    alter: alterVal,
    octave: oct,
    duration,
    dotted,
    startBeat,
    durationBeats: getDurationInBeats(duration, dotted),
    midi: midiVal,
    pitch,
    solfege: getSolfege(pc),
    dynamic: 'mf'
  };
}
