/**
 * @file staffTheory.ts
 * @description Lógica musical para el Pentagrama y Compositor Armónico:
 * - Posición diatónica de notas en el pentagrama (Clave de Sol)
 * - Cálculo de líneas adicionales (ledger lines) y sostenidos/bemoles
 * - Armonía diatónica: acordes y escalas compatibles para cualquier tonalidad (Mayor / Menor)
 * - Progresiones armónicas populares predefinidas (I-IV-V, I-V-vi-IV, ii-V-I...)
 * - Estructura de compases y tiempos rítmicos (4/4, 3/4, 6/8)
 */

import { Key, Chord, Scale, Note, Interval } from 'tonal';
import { getSolfege } from './theory';

export type TimeSignature = '4/4' | '3/4' | '6/8';
export type NoteDuration = 'whole' | 'half' | 'quarter' | 'eighth';

export interface NoteEvent {
  id: string;
  pitch: string; // ej: "C4", "E4", "G4"
  midi: number;
  solfege: string; // ej: "Do", "Mi", "Sol"
  duration: NoteDuration;
  beat: number; // 0, 1, 2, 3...
  isChordNote?: boolean;
}

export interface ChordEvent {
  id: string;
  symbol: string; // ej: "C", "G7", "Am", "F"
  name: string; // ej: "Do Mayor", "Sol 7"
  solfege: string; // ej: "Do", "Sol7"
  romanNumeral?: string; // ej: "I", "V7", "vi"
  pitches: string[]; // ej: ["C4", "E4", "G4"]
  midis: number[];
  beat: number;
}

export interface MeasureData {
  id: string;
  measureNumber: number;
  chord?: ChordEvent;
  notes: NoteEvent[];
}

export interface ProgressionPreset {
  id: string;
  name: string;
  description: string;
  numerals: string[]; // ej: ["I", "IV", "V"] o ["I", "V", "vi", "IV"]
}

export interface CompatibleScale {
  id: string;
  name: string;
  description: string;
  notes: string[]; // ["C", "D", "E", "G", "A"]
  solfeges: string[]; // ["Do", "Re", "Mi", "Sol", "La"]
  suggestedPitches: string[]; // ["C4", "D4", "E4", "G4", "A4", "C5"]
}

export interface KeyHarmonics {
  tonic: string;
  mode: 'major' | 'minor';
  name: string;
  solfegeTonic: string;
  keySignature: string; // ej: "1#" o "0" o "2b"
  chords: Array<{
    symbol: string;
    numeral: string;
    name: string;
    solfege: string;
    type: 'triad' | 'seventh';
    pitches: string[];
    midis: number[];
  }>;
  compatibleScales: CompatibleScale[];
  presets: ProgressionPreset[];
}

// Mapeo diatónico en Clave de Sol: C4 (Do central) = paso 0
const DIATONIC_INDEX: Record<string, number> = {
  'C': 0, 'D': 1, 'E': 2, 'F': 3, 'G': 4, 'A': 5, 'B': 6
};

/**
 * Retorna el paso diatónico relativo a C4 (Do central = 0).
 * E4 (Línea 1 del pentagrama) = paso 2.
 * F5 (Línea 5 del pentagrama) = paso 10.
 */
export function getDiatonicStep(pitch: string): number {
  if (!pitch) return 2;
  const pc = Note.pitchClass(pitch) || 'C';
  const letter = pc[0].toUpperCase();
  const oct = Note.octave(pitch) ?? 4;
  const base = DIATONIC_INDEX[letter] ?? 0;
  return (oct - 4) * 7 + base;
}

/**
 * Calcula la coordenada Y exacta en el SVG del pentagrama.
 * staffTopY: coordenada Y de la 5ta línea (F5)
 * lineSpacing: distancia vertical entre líneas del pentagrama (ej. 12px)
 */
export function getStaffY(pitch: string, staffTopY: number, lineSpacing = 12): number {
  const step = getDiatonicStep(pitch);
  const stepHeight = lineSpacing / 2;
  // Línea 1 (E4) está a 4 espacios por debajo de Línea 5 (F5)
  const line1Y = staffTopY + 4 * lineSpacing;
  // Cada paso sube (disminuye Y) o baja (aumenta Y) por stepHeight
  return line1Y - (step - 2) * stepHeight;
}

/**
 * Retorna si la nota necesita líneas adicionales (ledger lines) por debajo o por encima del pentagrama.
 */
export function getLedgerLines(pitch: string, staffTopY: number, lineSpacing = 12): number[] {
  const step = getDiatonicStep(pitch);
  const stepHeight = lineSpacing / 2;
  const line1Y = staffTopY + 4 * lineSpacing;
  const linesY: number[] = [];

  // Por debajo de Línea 1 (E4 = paso 2):
  // C4 (paso 0) tiene 1 línea adicional en step 0
  // A3 (paso -2) tiene 2 líneas adicionales en step 0 y step -2
  if (step <= 0) {
    for (let s = 0; s >= step; s -= 2) {
      linesY.push(line1Y - (s - 2) * stepHeight);
    }
  }

  // Por encima de Línea 5 (F5 = paso 10):
  // A5 (paso 12) tiene 1 línea adicional en step 12
  // C6 (paso 14) tiene 2 líneas adicionales en step 12 y step 14
  if (step >= 12) {
    for (let s = 12; s <= step; s += 2) {
      linesY.push(line1Y - (s - 2) * stepHeight);
    }
  }

  return linesY;
}

/**
 * Extrae la alteración accidental (# o b) de un pitch para dibujarla en el pentagrama.
 */
export function getAccidental(pitch: string): '#' | 'b' | null {
  const pc = Note.pitchClass(pitch);
  if (pc.includes('#')) return '#';
  if (pc.includes('b')) return 'b';
  return null;
}

/**
 * Calcula un voicing cómodo para guitarra colocado en el registro de clave de sol (C4 a A5).
 */
export function getChordVoicing(chordSymbol: string): { pitches: string[]; midis: number[] } {
  try {
    const chordInfo = Chord.get(chordSymbol);
    const chordNotes = chordInfo.notes.length > 0 ? chordInfo.notes : ['C', 'E', 'G'];

    // Distribuir notas alrededor del registro medio de guitarra (C4 = 60 a G5 = 79)
    const pitches: string[] = [];
    const midis: number[] = [];

    let currentOctave = 4;
    chordNotes.forEach((noteName, idx) => {
      // Si la nota es más grave alfabéticamente que la anterior, pasa a la octava superior
      if (idx > 0) {
        const prevStep = DIATONIC_INDEX[chordNotes[idx - 1][0].toUpperCase()] ?? 0;
        const curStep = DIATONIC_INDEX[noteName[0].toUpperCase()] ?? 0;
        if (curStep <= prevStep) {
          currentOctave++;
        }
      }
      const pitchWithOctave = `${noteName}${currentOctave}`;
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
 * Obtiene toda la información armónica de una tonalidad:
 * - Tríadas y acordes con séptima
 * - Escalas compatibles
 * - Presets de progresiones armónicas famosas
 */
export function getKeyHarmonics(tonic: string, mode: 'major' | 'minor' = 'major'): KeyHarmonics {
  const solfegeTonic = getSolfege(tonic);

  if (mode === 'major') {
    const keyData = Key.majorKey(tonic);
    const diatonicChords = keyData.chords;
    const triads = keyData.triads;
    const grades = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
    const seventhGrades = ['Imaj7', 'ii7', 'iii7', 'IVmaj7', 'V7', 'vi7', 'viiø7'];

    const chordsList: Array<{
      symbol: string;
      numeral: string;
      name: string;
      solfege: string;
      type: 'triad' | 'seventh';
      pitches: string[];
      midis: number[];
    }> = [
      ...triads.map((triadSymbol, idx) => {
        const voicing = getChordVoicing(triadSymbol);
        const rootNote = triadSymbol.replace(/m|dim/g, '');
        const quality = triadSymbol.includes('dim') ? 'disminuido' : triadSymbol.includes('m') ? 'menor' : 'mayor';
        return {
          symbol: triadSymbol,
          numeral: grades[idx],
          name: `${getSolfege(rootNote)} ${quality}`,
          solfege: `${getSolfege(rootNote)}${triadSymbol.includes('dim') ? '°' : triadSymbol.includes('m') ? 'm' : ''}`,
          type: 'triad' as const,
          pitches: voicing.pitches,
          midis: voicing.midis
        };
      }),
      ...diatonicChords.map((seventhSymbol, idx) => {
        const voicing = getChordVoicing(seventhSymbol);
        return {
          symbol: seventhSymbol,
          numeral: seventhGrades[idx],
          name: `${seventhSymbol}`,
          solfege: `${getSolfege(seventhSymbol.slice(0, 1))}${seventhSymbol.slice(1)}`,
          type: 'seventh' as const,
          pitches: voicing.pitches,
          midis: voicing.midis
        };
      })
    ];

    // Escalas compatibles recomendadas para la tonalidad mayor
    const majorPentatonic = Scale.get(`${tonic} major pentatonic`);
    const majorDiatonic = Scale.get(`${tonic} major`);
    const relativeMinor = keyData.minorRelative || 'A';
    const minorPentatonic = Scale.get(`${relativeMinor} minor pentatonic`);
    const mixolydianDominant = Scale.get(`${keyData.scale[4] || 'G'} mixolydian`);

    const compatibleScales: CompatibleScale[] = [
      {
        id: 'pentatonic-major',
        name: `Pentatónica mayor de ${solfegeTonic}`,
        description: 'La escala más dulce y segura para improvisar sobre cualquier acorde mayor.',
        notes: majorPentatonic.notes,
        solfeges: majorPentatonic.notes.map(getSolfege),
        suggestedPitches: majorPentatonic.notes.map(n => `${n}4`).concat([`${tonic}5`])
      },
      {
        id: 'major-diatonic',
        name: `Mayor natural (Jónica) de ${solfegeTonic}`,
        description: 'Escala completa de 7 notas que define la tonalidad.',
        notes: majorDiatonic.notes,
        solfeges: majorDiatonic.notes.map(getSolfege),
        suggestedPitches: majorDiatonic.notes.map(n => `${n}4`).concat([`${tonic}5`])
      },
      {
        id: 'relative-minor-pentatonic',
        name: `Pentatónica menor de ${getSolfege(relativeMinor)} (Relativa)`,
        description: 'Comparte las mismas notas que la mayor pero con un color más expresivo y blusero.',
        notes: minorPentatonic.notes,
        solfeges: minorPentatonic.notes.map(getSolfege),
        suggestedPitches: minorPentatonic.notes.map(n => `${n}4`).concat([`${relativeMinor}5`])
      },
      {
        id: 'mixolydian-v',
        name: `Mixolidia sobre el grado V (${getSolfege(keyData.scale[4] || 'G')})`,
        description: 'Ideal para pasajes de tensión que resuelven hacia la tónica.',
        notes: mixolydianDominant.notes,
        solfeges: mixolydianDominant.notes.map(getSolfege),
        suggestedPitches: mixolydianDominant.notes.map(n => `${n}4`).concat([`${keyData.scale[4] || 'G'}5`])
      }
    ];

    // Presets de progresiones armónicas populares
    const presets: ProgressionPreset[] = [
      {
        id: 'pop-1-5-6-4',
        name: 'Progresión Pop (I - V - vi - IV)',
        description: 'La progresión más famosa del pop contemporáneo y rock.',
        numerals: ['I', 'V', 'vi', 'IV']
      },
      {
        id: 'classic-1-4-5',
        name: 'Clásica (I - IV - V)',
        description: 'La base universal del rock and roll, blues y folklore.',
        numerals: ['I', 'IV', 'V']
      },
      {
        id: 'jazz-2-5-1',
        name: 'Cadencia Jazz (ii - V - I)',
        description: 'Resolución armónica por excelencia.',
        numerals: ['ii7', 'V7', 'Imaj7']
      },
      {
        id: 'doowop-1-6-4-5',
        name: 'Doo-Wop / Balada (I - vi - IV - V)',
        description: 'Sonido romántico de los 50s y baladas acústicas.',
        numerals: ['I', 'vi', 'IV', 'V']
      },
      {
        id: 'epic-minor-6-4-1-5',
        name: 'Épica (vi - IV - I - V)',
        description: 'Comienza en el acorde menor con fuerte carga dramática.',
        numerals: ['vi', 'IV', 'I', 'V']
      }
    ];

    return {
      tonic,
      mode: 'major',
      name: `${solfegeTonic} Mayor (${tonic})`,
      solfegeTonic,
      keySignature: keyData.keySignature || '0',
      chords: chordsList,
      compatibleScales,
      presets
    };
  } else {
    // Tonalidad Menor
    const keyData = Key.minorKey(tonic);
    const naturalChords = keyData.natural.chords;
    const triads = ['m', 'dim', '', 'm', 'm', '', 'dim'].map((q, idx) => {
      const root = keyData.natural.scale[idx] || 'A';
      return `${root}${q}`;
    });
    const grades = ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'];

    const chordsList = triads.map((triadSymbol, idx) => {
      const voicing = getChordVoicing(triadSymbol);
      const rootNote = triadSymbol.replace(/m|dim/g, '');
      return {
        symbol: triadSymbol,
        numeral: grades[idx],
        name: `${getSolfege(rootNote)} ${triadSymbol.includes('m') ? 'menor' : 'mayor'}`,
        solfege: `${getSolfege(rootNote)}${triadSymbol.includes('m') ? 'm' : ''}`,
        type: 'triad' as const,
        pitches: voicing.pitches,
        midis: voicing.midis
      };
    });

    const minorPentatonic = Scale.get(`${tonic} minor pentatonic`);
    const naturalMinor = Scale.get(`${tonic} minor`);
    const harmonicMinor = Scale.get(`${tonic} harmonic minor`);

    const compatibleScales: CompatibleScale[] = [
      {
        id: 'pentatonic-minor',
        name: `Pentatónica menor de ${solfegeTonic}`,
        description: 'La reina de los solos de blues, rock y solos emotivos.',
        notes: minorPentatonic.notes,
        solfeges: minorPentatonic.notes.map(getSolfege),
        suggestedPitches: minorPentatonic.notes.map(n => `${n}4`).concat([`${tonic}5`])
      },
      {
        id: 'natural-minor',
        name: `Menor natural (Eólica) de ${solfegeTonic}`,
        description: 'Toda la escala menor con sus 7 notas.',
        notes: naturalMinor.notes,
        solfeges: naturalMinor.notes.map(getSolfege),
        suggestedPitches: naturalMinor.notes.map(n => `${n}4`).concat([`${tonic}5`])
      },
      {
        id: 'harmonic-minor',
        name: `Menor armónica de ${solfegeTonic}`,
        description: 'Con séptima mayor, ideal para el acorde dominante V7.',
        notes: harmonicMinor.notes,
        solfeges: harmonicMinor.notes.map(getSolfege),
        suggestedPitches: harmonicMinor.notes.map(n => `${n}4`).concat([`${tonic}5`])
      }
    ];

    const presets: ProgressionPreset[] = [
      {
        id: 'minor-1-4-5',
        name: 'Menor Clásica (i - iv - V)',
        description: 'Cadencia menor dramática clásica.',
        numerals: ['i', 'iv', 'v']
      },
      {
        id: 'minor-1-6-3-7',
        name: 'Andaluza / Pop Menor (i - VI - III - VII)',
        description: 'Sonido melancólico y cinematográfico.',
        numerals: ['i', 'VI', 'III', 'VII']
      }
    ];

    return {
      tonic,
      mode: 'minor',
      name: `${solfegeTonic} Menor (${tonic}m)`,
      solfegeTonic,
      keySignature: keyData.keySignature || '0',
      chords: chordsList,
      compatibleScales,
      presets
    };
  }
}

/**
 * Convierte un grado romano ("I", "IV", "V", "vi"...) al acorde correspondiente de la tonalidad.
 */
export function getChordFromNumeral(numeral: string, keyHarmonics: KeyHarmonics): { symbol: string; name: string; solfege: string; pitches: string[]; midis: number[] } {
  const cleanNumeral = numeral.trim();
  const found = keyHarmonics.chords.find(c => c.numeral.toLowerCase() === cleanNumeral.toLowerCase());
  if (found) {
    return {
      symbol: found.symbol,
      name: found.name,
      solfege: found.solfege,
      pitches: found.pitches,
      midis: found.midis
    };
  }

  // Fallback a acorde tónico
  const fallback = keyHarmonics.chords[0];
  return {
    symbol: fallback?.symbol || 'C',
    name: fallback?.name || 'Do Mayor',
    solfege: fallback?.solfege || 'Do',
    pitches: fallback?.pitches || ['C4', 'E4', 'G4'],
    midis: fallback?.midis || [60, 64, 67]
  };
}

/**
 * Genera una composición inicial de demostración (ej. C - G - Am - F con melodía pentatónica).
 */
export function createDefaultComposition(tonic = 'C'): MeasureData[] {
  const harmonics = getKeyHarmonics(tonic, 'major');

  const cChord = getChordFromNumeral('I', harmonics);
  const gChord = getChordFromNumeral('V', harmonics);
  const amChord = getChordFromNumeral('vi', harmonics);
  const fChord = getChordFromNumeral('IV', harmonics);

  return [
    {
      id: 'm-1',
      measureNumber: 1,
      chord: {
        id: 'c-1',
        symbol: cChord.symbol,
        name: cChord.name,
        solfege: cChord.solfege,
        romanNumeral: 'I',
        pitches: cChord.pitches,
        midis: cChord.midis,
        beat: 0
      },
      notes: [
        { id: 'n-1-1', pitch: 'C4', midi: 60, solfege: 'Do', duration: 'quarter', beat: 0 },
        { id: 'n-1-2', pitch: 'E4', midi: 64, solfege: 'Mi', duration: 'quarter', beat: 1 },
        { id: 'n-1-3', pitch: 'G4', midi: 67, solfege: 'Sol', duration: 'half', beat: 2 }
      ]
    },
    {
      id: 'm-2',
      measureNumber: 2,
      chord: {
        id: 'c-2',
        symbol: gChord.symbol,
        name: gChord.name,
        solfege: gChord.solfege,
        romanNumeral: 'V',
        pitches: gChord.pitches,
        midis: gChord.midis,
        beat: 0
      },
      notes: [
        { id: 'n-2-1', pitch: 'D4', midi: 62, solfege: 'Re', duration: 'quarter', beat: 0 },
        { id: 'n-2-2', pitch: 'G4', midi: 67, solfege: 'Sol', duration: 'quarter', beat: 1 },
        { id: 'n-2-3', pitch: 'B4', midi: 71, solfege: 'Si', duration: 'half', beat: 2 }
      ]
    },
    {
      id: 'm-3',
      measureNumber: 3,
      chord: {
        id: 'c-3',
        symbol: amChord.symbol,
        name: amChord.name,
        solfege: amChord.solfege,
        romanNumeral: 'vi',
        pitches: amChord.pitches,
        midis: amChord.midis,
        beat: 0
      },
      notes: [
        { id: 'n-3-1', pitch: 'A4', midi: 69, solfege: 'La', duration: 'quarter', beat: 0 },
        { id: 'n-3-2', pitch: 'C5', midi: 72, solfege: 'Do', duration: 'quarter', beat: 1 },
        { id: 'n-3-3', pitch: 'E4', midi: 64, solfege: 'Mi', duration: 'half', beat: 2 }
      ]
    },
    {
      id: 'm-4',
      measureNumber: 4,
      chord: {
        id: 'c-4',
        symbol: fChord.symbol,
        name: fChord.name,
        solfege: fChord.solfege,
        romanNumeral: 'IV',
        pitches: fChord.pitches,
        midis: fChord.midis,
        beat: 0
      },
      notes: [
        { id: 'n-4-1', pitch: 'F4', midi: 65, solfege: 'Fa', duration: 'quarter', beat: 0 },
        { id: 'n-4-2', pitch: 'A4', midi: 69, solfege: 'La', duration: 'quarter', beat: 1 },
        { id: 'n-4-3', pitch: 'C4', midi: 60, solfege: 'Do', duration: 'half', beat: 2 }
      ]
    }
  ];
}
