/**
 * @file notation.ts
 * @description Utilidades puras para conversión y formateo consistente entre notación Americana (C, D, E)
 * y notación Española / Solfeo (Do, Re, Mi).
 */

import { Note } from 'tonal';
import { SOLFEGE_MAP } from '../constants/music';
import type { NoteNotation } from '../types/music.types';

/**
 * Convierte un nombre de nota anglosajón (C, D, E...) a solfeo en español (Do, Re, Mi...).
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
export function formatTuningLabels(
  labels: string[],
  notation: NoteNotation = 'american'
): string[] {
  return labels.map(label => formatNoteName(label, notation));
}
