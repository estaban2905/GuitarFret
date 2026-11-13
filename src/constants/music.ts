/**
 * @file music.ts
 * @description Constantes globales de teoría musical, afinaciones, escalas, acordes y notación.
 */

import type {
  ChordTypeDefinition,
  ScaleDefinition,
  TuningConfig,
  TuningId
} from '../types/music.types';

export const ROOT_NOTES = [
  'C',
  'C#',
  'D',
  'Eb',
  'E',
  'F',
  'F#',
  'G',
  'Ab',
  'A',
  'Bb',
  'B'
] as const;

export type RootNote = (typeof ROOT_NOTES)[number];

export const TUNINGS: Record<TuningId, TuningConfig> = {
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

export const SOLFEGE_MAP: Record<string, string> = {
  C: 'Do',
  'C#': 'Do#',
  Cb: 'Dob',
  Db: 'Reb',
  'C##': 'Do##',
  Dbb: 'Rebb',
  D: 'Re',
  'D#': 'Re#',
  Eb: 'Mib',
  'D##': 'Re##',
  Ebb: 'Mibb',
  E: 'Mi',
  'E#': 'Mi#',
  Fb: 'Fab',
  F: 'Fa',
  'F#': 'Fa#',
  Gb: 'Solb',
  'F##': 'Fa##',
  Gbb: 'Solbb',
  G: 'Sol',
  'G#': 'Sol#',
  Ab: 'Lab',
  'G##': 'Sol##',
  Abb: 'Labb',
  A: 'La',
  'A#': 'La#',
  Bb: 'Sib',
  'A##': 'La##',
  Bbb: 'Sibb',
  B: 'Si',
  'B#': 'Si#'
};

export const SCALE_TYPES: ScaleDefinition[] = [
  {
    id: 'major',
    name: 'Mayor',
    tonalName: 'major',
    category: 'diatonic',
    description: 'Escala diatónica mayor (Jónico). 1 - 2 - 3 - 4 - 5 - 6 - 7'
  },
  {
    id: 'minor',
    name: 'Menor natural',
    tonalName: 'minor',
    category: 'diatonic',
    description: 'Escala menor natural (Eólico). 1 - 2 - b3 - 4 - 5 - b6 - b7'
  },
  {
    id: 'harmonic minor',
    name: 'Menor armónica',
    tonalName: 'harmonic minor',
    category: 'diatonic',
    description: 'Menor con séptima mayor (#7). 1 - 2 - b3 - 4 - 5 - b6 - 7'
  },
  {
    id: 'melodic minor',
    name: 'Menor melódica',
    tonalName: 'melodic minor',
    category: 'diatonic',
    description: 'Menor con 6ta y 7ma mayores. 1 - 2 - b3 - 4 - 5 - 6 - 7'
  },
  {
    id: 'major pentatonic',
    name: 'Pentatónica mayor',
    tonalName: 'major pentatonic',
    category: 'pentatonic',
    description: 'Cinco notas dulces y consonantes. 1 - 2 - 3 - 5 - 6'
  },
  {
    id: 'minor pentatonic',
    name: 'Pentatónica menor',
    tonalName: 'minor pentatonic',
    category: 'pentatonic',
    description: 'La reina de los solos de blues y rock. 1 - b3 - 4 - 5 - b7'
  },
  {
    id: 'blues',
    name: 'Blues menor',
    tonalName: 'blues',
    category: 'pentatonic',
    description: 'Pentatónica menor con la blue note (b5). 1 - b3 - 4 - b5 - 5 - b7'
  },
  {
    id: 'major blues',
    name: 'Blues mayor',
    tonalName: 'major blues',
    category: 'pentatonic',
    description: 'Pentatónica mayor con nota de paso cromática (b3). 1 - 2 - b3 - 3 - 5 - 6'
  },
  {
    id: 'ionian',
    name: 'Jónico (Modo I)',
    tonalName: 'ionian',
    category: 'modes',
    description: 'Primer modo griego, idéntico a la escala mayor. 1 - 2 - 3 - 4 - 5 - 6 - 7'
  },
  {
    id: 'dorian',
    name: 'Dórico (Modo II)',
    tonalName: 'dorian',
    category: 'modes',
    description:
      'Menor con sexta mayor brillante. Clásico del funk y rock. 1 - 2 - b3 - 4 - 5 - 6 - b7'
  },
  {
    id: 'phrygian',
    name: 'Frigio (Modo III)',
    tonalName: 'phrygian',
    category: 'modes',
    description:
      'Menor con segunda menor (b2). Sonido flamenco y metal. 1 - b2 - b3 - 4 - 5 - b6 - b7'
  },
  {
    id: 'lydian',
    name: 'Lidio (Modo IV)',
    tonalName: 'lydian',
    category: 'modes',
    description: 'Mayor con cuarta aumentada (#4). Sonido místico. 1 - 2 - 3 - #4 - 5 - 6 - 7'
  },
  {
    id: 'mixolydian',
    name: 'Mixolidio (Modo V)',
    tonalName: 'mixolydian',
    category: 'modes',
    description: 'Mayor con séptima menor (b7). Ideal para rock y blues. 1 - 2 - 3 - 4 - 5 - 6 - b7'
  },
  {
    id: 'aeolian',
    name: 'Eólico (Modo VI)',
    tonalName: 'aeolian',
    category: 'modes',
    description: 'Sexto modo, idéntico a la menor natural. 1 - 2 - b3 - 4 - 5 - b6 - b7'
  },
  {
    id: 'locrian',
    name: 'Locrio (Modo VII)',
    tonalName: 'locrian',
    category: 'modes',
    description:
      'Modo con quinta disminuida (b5) y segunda menor (b2). 1 - b2 - b3 - 4 - b5 - b6 - b7'
  },
  {
    id: 'phrygian dominant',
    name: 'Frigia dominante',
    tonalName: 'phrygian dominant',
    category: 'other',
    description:
      'Quinto modo de la menor armónica. Sonido español y flamenco. 1 - b2 - 3 - 4 - 5 - b6 - b7'
  },
  {
    id: 'lydian dominant',
    name: 'Lidia dominante (Lidia b7)',
    tonalName: 'lydian dominant',
    category: 'other',
    description:
      'Cuarto modo de la menor melódica. Ideal para acordes 7(#11). 1 - 2 - 3 - #4 - 5 - 6 - b7'
  },
  {
    id: 'altered',
    name: 'Alterada (Superlocria)',
    tonalName: 'altered',
    category: 'other',
    description:
      'Séptimo modo de la menor melódica. Máxima tensión dominante. 1 - b2 - #2 - 3 - b5 - b6 - b7'
  },
  {
    id: 'diminished',
    name: 'Disminuida (Tono-Semitono)',
    tonalName: 'diminished',
    category: 'other',
    description:
      'Escala simétrica octatónica. Ideal para acordes dim7. 1 - 2 - b3 - 4 - b5 - b6 - 6 - 7'
  },
  {
    id: 'whole tone',
    name: 'Tonal (Tonos enteros)',
    tonalName: 'whole tone',
    category: 'other',
    description:
      'Escala simétrica hexatónica de tonos enteros. Ideal para acordes aug. 1 - 2 - 3 - #4 - #5 - b7'
  }
];

export const CHORD_TYPES: ChordTypeDefinition[] = [
  {
    suffix: 'major',
    name: 'Mayor',
    symbol: '',
    description: 'Tríada mayor: tónica, tercera mayor, quinta justa (1 - 3 - 5)'
  },
  {
    suffix: 'minor',
    name: 'Menor',
    symbol: 'm',
    description: 'Tríada menor: tónica, tercera menor, quinta justa (1 - b3 - 5)'
  },
  {
    suffix: '5',
    name: 'Quinta / Power Chord (5)',
    symbol: '5',
    description: 'Acorde de potencia sin tercera: tónica y quinta justa (1 - 5)'
  },
  {
    suffix: '7',
    name: 'Séptima dominante (7)',
    symbol: '7',
    description: 'Acorde dominante: 1 - 3 - 5 - b7. Tensión que resuelve'
  },
  {
    suffix: 'maj7',
    name: 'Mayor séptima (maj7)',
    symbol: 'maj7',
    description: 'Acorde elegante con séptima mayor: 1 - 3 - 5 - 7'
  },
  {
    suffix: 'm7',
    name: 'Menor séptima (m7)',
    symbol: 'm7',
    description: 'Acorde menor suave: 1 - b3 - 5 - b7'
  },
  {
    suffix: 'mmaj7',
    name: 'Menor mayor séptima (mMaj7)',
    symbol: 'mMaj7',
    description: 'Acorde menor con séptima mayor: 1 - b3 - 5 - 7'
  },
  {
    suffix: 'sus2',
    name: 'Suspendido 2 (sus2)',
    symbol: 'sus2',
    description: 'Tercera sustituida por segunda mayor: 1 - 2 - 5'
  },
  {
    suffix: 'sus4',
    name: 'Suspendido 4 (sus4)',
    symbol: 'sus4',
    description: 'Tercera sustituida por cuarta justa: 1 - 4 - 5'
  },
  {
    suffix: 'dim',
    name: 'Disminuido (dim)',
    symbol: 'dim',
    description: 'Tríada disminuida tensa: 1 - b3 - b5'
  },
  {
    suffix: 'dim7',
    name: 'Disminuido séptima (dim7)',
    symbol: 'dim7',
    description: 'Acorde simétrico disminuido con 7ma disminuida: 1 - b3 - b5 - bb7'
  },
  {
    suffix: 'aug',
    name: 'Aumentado (aug)',
    symbol: 'aug',
    description: 'Tríada con quinta aumentada: 1 - 3 - #5'
  },
  {
    suffix: 'add9',
    name: 'Añadida novena (add9)',
    symbol: 'add9',
    description: 'Tríada mayor con la novena agregada: 1 - 3 - 5 - 9'
  },
  {
    suffix: 'm7b5',
    name: 'Semidisminuido (m7b5)',
    symbol: 'm7b5',
    description: 'Acorde semidisminuido: 1 - b3 - b5 - b7'
  },
  {
    suffix: '9',
    name: 'Novena dominante (9)',
    symbol: '9',
    description: 'Dominante extendido con novena: 1 - 3 - 5 - b7 - 9'
  }
];
