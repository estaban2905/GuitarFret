import { describe, expect, it } from 'vitest';
import { TUNINGS } from '../../constants/music';
import {
  formatChordSymbol,
  formatNoteName,
  formatPitchName,
  formatTuningLabels,
  getSolfege
} from '../../utils/notation';
import { readJsonStorage, readStorage, writeJsonStorage, writeStorage } from '../../utils/storage';
import {
  calculateScaleFretboard,
  generateScaleRuns,
  getChordData,
  getNoteAtFret,
  getRootOccurrences
} from '../../utils/theory';

describe('Teoría musical de guitarra y notación', () => {
  it('convierte correctamente notas al solfeo español', () => {
    expect(getSolfege('C')).toBe('Do');
    expect(getSolfege('D')).toBe('Re');
    expect(getSolfege('E')).toBe('Mi');
    expect(getSolfege('F')).toBe('Fa');
    expect(getSolfege('G')).toBe('Sol');
    expect(getSolfege('A')).toBe('La');
    expect(getSolfege('B')).toBe('Si');
    expect(getSolfege('Eb')).toBe('Mib');
    expect(getSolfege('F#')).toBe('Fa#');
  });

  it('calcula notas en trastes en afinación estándar y Drop D', () => {
    const eStandard = TUNINGS.standard.notes;
    expect(getNoteAtFret(6, 0, eStandard).pitch).toBe('E2');
    expect(getNoteAtFret(5, 3, eStandard).pitch).toBe('C3');
    expect(getNoteAtFret(6, 8, eStandard).pitch).toBe('C3');
    expect(getNoteAtFret(1, 0, eStandard).pitch).toBe('E4');
    expect(getNoteAtFret(1, 8, eStandard).pitch).toBe('C5');

    const dropDNotes = TUNINGS.dropD.notes;
    expect(getNoteAtFret(6, 0, dropDNotes).pitch).toBe('D2');
    expect(getNoteAtFret(6, 10, dropDNotes).pitch).toBe('C3');
  });

  it('detecta apariciones de la tónica Do en el diapasón', () => {
    const cOccurrences = getRootOccurrences('C', TUNINGS.standard.notes, 21);
    expect(cOccurrences.length).toBeGreaterThan(0);
    expect(cOccurrences.some(o => o.string === 5 && o.fret === 3)).toBe(true);
    expect(cOccurrences.some(o => o.string === 6 && o.fret === 8)).toBe(true);
  });

  it('genera recorrido exacto de C pentatónica mayor desde 5.ª cuerda traste 3', () => {
    const run = generateScaleRuns({
      startString: 5,
      startFret: 3,
      scaleId: 'major pentatonic',
      root: 'C',
      tuningId: 'standard',
      direction: 'ascending',
      span: '1_octave'
    });

    expect(run.variations.length).toBeGreaterThan(0);
    expect(run.activeVariation).not.toBeNull();
    const steps = run.activeVariation!.steps;
    expect(steps).toHaveLength(6);
    expect(steps[0].isStart).toBe(true);
    expect(steps.map(s => ({ string: s.string, fret: s.fret, note: s.noteName }))).toEqual([
      { string: 5, fret: 3, note: 'C' },
      { string: 5, fret: 5, note: 'D' },
      { string: 4, fret: 2, note: 'E' },
      { string: 4, fret: 5, note: 'G' },
      { string: 3, fret: 2, note: 'A' },
      { string: 3, fret: 5, note: 'C' }
    ]);
  });

  it('genera recorrido exacto de C pentatónica mayor desde 6.ª cuerda traste 8', () => {
    const run = generateScaleRuns({
      startString: 6,
      startFret: 8,
      scaleId: 'major pentatonic',
      root: 'C',
      tuningId: 'standard',
      direction: 'ascending',
      span: '1_octave'
    });

    expect(run.activeVariation).not.toBeNull();
    const steps = run.activeVariation!.steps;
    expect(steps.map(s => ({ string: s.string, fret: s.fret, note: s.noteName }))).toEqual([
      { string: 6, fret: 8, note: 'C' },
      { string: 6, fret: 10, note: 'D' },
      { string: 5, fret: 7, note: 'E' },
      { string: 5, fret: 10, note: 'G' },
      { string: 4, fret: 7, note: 'A' },
      { string: 4, fret: 10, note: 'C' }
    ]);
  });

  it('genera recorridos de 2 octavas y descendentes correctamente', () => {
    const run2Oct = generateScaleRuns({
      startString: 6,
      startFret: 8,
      scaleId: 'major pentatonic',
      root: 'C',
      tuningId: 'standard',
      direction: 'ascending',
      span: '2_octaves'
    });

    expect(run2Oct.activeVariation).not.toBeNull();
    expect(run2Oct.activeVariation!.steps).toHaveLength(11);
    const lastNote = run2Oct.activeVariation!.steps[10];
    expect(lastNote.noteName).toBe('C');
    expect(lastNote.string).toBe(1);
    expect(lastNote.fret).toBe(8);

    const runDesc = generateScaleRuns({
      startString: 3,
      startFret: 5,
      scaleId: 'major pentatonic',
      root: 'C',
      tuningId: 'standard',
      direction: 'descending',
      span: '1_octave'
    });

    expect(runDesc.activeVariation).not.toBeNull();
    const firstDesc = runDesc.activeVariation!.steps[0];
    const lastDesc = runDesc.activeVariation!.steps[runDesc.activeVariation!.steps.length - 1];
    expect(firstDesc.string).toBe(3);
    expect(firstDesc.fret).toBe(5);
    expect(firstDesc.midi).toBeGreaterThan(lastDesc.midi);
    expect(lastDesc.noteName).toBe('C');
  });

  it('genera C pentatónica mayor desde 2.ª cuerda traste 1', () => {
    const run21 = generateScaleRuns({
      startString: 2,
      startFret: 1,
      scaleId: 'major pentatonic',
      root: 'C',
      tuningId: 'standard',
      direction: 'ascending',
      span: '1_octave'
    });

    expect(run21.variations.length).toBeGreaterThan(0);
    expect(run21.activeVariation).not.toBeNull();
    const steps = run21.activeVariation!.steps;
    expect(steps[0].string).toBe(2);
    expect(steps[0].fret).toBe(1);
    expect(steps[steps.length - 1].noteName).toBe('C');
    const startDot = run21.dots.find(d => d.string === 2 && d.fret === 1);
    expect(startDot?.isStart).toBe(true);
    expect(startDot?.inBox).toBe(true);
  });

  it('mantiene las cajas CAGED/Blues/Armónica/Melódica y posiciones de acordes', () => {
    const cBluesBox1 = calculateScaleFretboard('C', 'blues', 'CAGED', 1, 'standard', 21);
    expect(new Set(cBluesBox1.dots.filter(d => d.inBox).map(d => d.chroma)).size).toBe(6);

    const cHarmBox1 = calculateScaleFretboard('C', 'harmonic minor', 'CAGED', 1, 'standard', 21);
    expect(new Set(cHarmBox1.dots.filter(d => d.inBox).map(d => d.chroma)).size).toBe(7);

    const cMelBox1 = calculateScaleFretboard('C', 'melodic minor', 'CAGED', 1, 'standard', 21);
    expect(new Set(cMelBox1.dots.filter(d => d.inBox).map(d => d.chroma)).size).toBe(7);

    const cMix = calculateScaleFretboard('C', 'mixolydian', 'CAGED', 1, 'standard', 21);
    expect(cMix.availableBoxes[0].shapeName.startsWith('Forma C')).toBe(true);

    const cPent15 = calculateScaleFretboard('C', 'major pentatonic', 'CAGED', 5, 'standard', 15);
    expect(cPent15.availableBoxes[0].minFret).toBe(0);
    expect(cPent15.availableBoxes[4].maxFret).toBeLessThanOrEqual(15);

    const csAug = getChordData('C#', 'aug', 0, 'standard', 21);
    expect(csAug.positions.length).toBeGreaterThan(0);
    expect(
      csAug.positions[0].stringNotes.every(
        sn => sn.fret === -1 || ['C#', 'E#', 'F', 'G##', 'A'].includes(sn.noteName)
      )
    ).toBe(true);

    const c9 = getChordData('C', '9', 0, 'standard', 21);
    expect(c9.positions[0].stringNotes.some(sn => sn.interval === 'b7')).toBe(true);

    const cmaj7 = getChordData('C', 'maj7', 0, 'standard', 21);
    expect(cmaj7.positions[0].absoluteFrets.join(',')).toBe('-1,3,2,0,0,0');
  });

  it('formatea consistentemente notación americana y española', () => {
    expect(formatNoteName('Eb', 'american')).toBe('Eb');
    expect(formatNoteName('Eb', 'spanish')).toBe('Mib');
    expect(formatPitchName('C4', 'american')).toBe('C4');
    expect(formatPitchName('C4', 'spanish')).toBe('Do4');
    expect(formatChordSymbol('F#m7b5', 'american')).toBe('F#m7b5');
    expect(formatChordSymbol('F#m7b5', 'spanish')).toBe('Fa#m7b5');
    expect(formatChordSymbol('C/G', 'spanish')).toBe('Do/Sol');
    expect(formatTuningLabels(['E', 'A', 'D', 'G', 'B', 'E'], 'spanish').join(' ')).toBe(
      'Mi La Re Sol Si Mi'
    );
  });

  it('persiste y valida datos de forma segura con utilidades de storage', () => {
    expect(writeStorage('k_test', 'val')).toBe(true);
    expect(readStorage('k_test')).toBe('val');

    expect(writeJsonStorage('k_json', { count: 4 })).toBe(true);
    const valid = readJsonStorage<{ count: number }>(
      'k_json',
      (data): data is { count: number } =>
        typeof data === 'object' && data !== null && 'count' in data
    );
    expect(valid).toEqual({ count: 4 });

    writeStorage('k_bad_json', '{invalid');
    expect(readJsonStorage('k_bad_json')).toBeNull();
  });
});
