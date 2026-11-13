import { describe, expect, it } from 'vitest';
import { generateMidiFile, generateMusicXml } from '../../features/composer/services/exportUtils';
import type { CompositionProject } from '../../features/composer/types/composer.types';
import {
  calculateLedgerLines,
  calculateNoteStaffY,
  createScoreNoteFromPitch,
  createVoicingForChord,
  getDiatonicChords,
  getDurationInBeats,
  getHarmonicAssistant,
  getKeySignatureInfo,
  getMeasureCapacityBeats,
  getMeterInfo,
  getScaleDefinitions,
  transposeNote
} from '../../features/composer/utils/musicTheoryEngine';
import { calculateScaleFretboard, getChordData } from '../../utils/theory';

describe('Motor de teoría y exportación del Compositor Musical', () => {
  it('calcula los 7 acordes diatónicos de Do mayor con sus notas', () => {
    const cChords = getDiatonicChords('C', 'major', 'treble');
    const cTriads = cChords.filter(c => c.type === 'triad');

    expect(cTriads).toHaveLength(7);
    expect(cTriads.map(c => `${c.numeral}:${c.symbol}`)).toEqual([
      'I:C',
      'ii:Dm',
      'iii:Em',
      'IV:F',
      'V:G',
      'vi:Am',
      'vii°:Bdim'
    ]);

    expect(cTriads[0].notes).toEqual(['C', 'E', 'G']);
    expect(cTriads[1].notes).toEqual(['D', 'F', 'A']);
    expect(cTriads[3].notes).toEqual(['F', 'A', 'C']);
    expect(cTriads[4].notes).toEqual(['G', 'B', 'D']);
  });

  it('calcula correctamente armaduras y enarmonías en mayor y menor', () => {
    const aMinorKey = getKeySignatureInfo('A', 'minor');
    expect(aMinorKey.scaleNotes).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G']);
    expect(aMinorKey.accidentalCount).toBe(0);

    const gMajor = getKeySignatureInfo('G', 'major');
    expect(gMajor.accidentalCount).toBe(1);
    expect(gMajor.accidentals).toEqual(['F#']);

    const dMajor = getKeySignatureInfo('D', 'major');
    expect(dMajor.accidentalCount).toBe(2);
    expect(dMajor.accidentals).toEqual(['F#', 'C#']);

    const fMajor = getKeySignatureInfo('F', 'major');
    expect(fMajor.accidentalCount).toBe(-1);
    expect(fMajor.accidentals).toEqual(['Bb']);

    const ebMajor = getKeySignatureInfo('Eb', 'major');
    expect(ebMajor.accidentalCount).toBe(-3);
    expect(ebMajor.accidentals).toEqual(['Bb', 'Eb', 'Ab']);

    const dbMinorInfo = getKeySignatureInfo('Db', 'minor');
    expect(dbMinorInfo.accidentalCount).toBe(4);
    expect(dbMinorInfo.accidentals).toHaveLength(4);
  });

  it('posiciona con precisión las notas en clave de Sol, Fa y Do', () => {
    const staffTopY = 56;
    const lineSpacing = 11;
    const line1Y = staffTopY + 4 * lineSpacing;
    const line2Y = staffTopY + 3 * lineSpacing;
    const line3Y = staffTopY + 2 * lineSpacing;
    const line4Y = staffTopY + 1 * lineSpacing;
    const line5Y = staffTopY;

    expect(calculateNoteStaffY('E', 4, 'treble', staffTopY, lineSpacing)).toBeCloseTo(line1Y, 1);
    expect(calculateNoteStaffY('G', 4, 'treble', staffTopY, lineSpacing)).toBeCloseTo(line2Y, 1);
    expect(calculateNoteStaffY('B', 4, 'treble', staffTopY, lineSpacing)).toBeCloseTo(line3Y, 1);
    expect(calculateNoteStaffY('D', 5, 'treble', staffTopY, lineSpacing)).toBeCloseTo(line4Y, 1);
    expect(calculateNoteStaffY('F', 5, 'treble', staffTopY, lineSpacing)).toBeCloseTo(line5Y, 1);

    expect(calculateLedgerLines('C', 4, 'treble', staffTopY, lineSpacing)).toHaveLength(1);
    expect(calculateNoteStaffY('G', 2, 'bass', staffTopY, lineSpacing)).toBeCloseTo(line1Y, 1);
    expect(calculateNoteStaffY('C', 4, 'alto', staffTopY, lineSpacing)).toBeCloseTo(line3Y, 1);
  });

  it('mapea alturas MIDI, voicings, inversiones y transposición', () => {
    expect(createScoreNoteFromPitch('C4').midi).toBe(60);
    expect(createScoreNoteFromPitch('A4').midi).toBe(69);
    expect(createScoreNoteFromPitch('C5').midi).toBe(72);

    const cVoicing = createVoicingForChord('C', 'treble');
    expect(cVoicing.pitches).toHaveLength(3);
    expect(cVoicing.midis).toEqual(expect.arrayContaining([60, 64, 67]));

    const cInv1 = createVoicingForChord('C', 'treble', 1);
    expect(cInv1.pitches[0].startsWith('E')).toBe(true);

    const c4Orig = createScoreNoteFromPitch('C4');
    const d4Trans = transposeNote(c4Orig, 2);
    expect(d4Trans.midi).toBe(62);
    expect(d4Trans.pitch).toBe('D4');

    const c5Trans = transposeNote(c4Orig, 12);
    expect(c5Trans.midi).toBe(72);
    expect(c5Trans.pitch).toBe('C5');
  });

  it('calcula métricas simples y compuestas y duraciones rítmicas', () => {
    expect(getMeasureCapacityBeats('4/4')).toBe(4.0);
    expect(getMeasureCapacityBeats('6/8')).toBe(3.0);

    const meter44 = getMeterInfo('4/4');
    expect(meter44.isCompound).toBe(false);
    expect(meter44.pulseCount).toBe(4);

    const meter68 = getMeterInfo('6/8');
    expect(meter68.isCompound).toBe(true);
    expect(meter68.pulseCount).toBe(2);

    expect(getDurationInBeats('whole')).toBe(4.0);
    expect(getDurationInBeats('half')).toBe(2.0);
    expect(getDurationInBeats('quarter')).toBe(1.0);
    expect(getDurationInBeats('eighth')).toBe(0.5);
    expect(getDurationInBeats('sixteenth')).toBe(0.25);
    expect(getDurationInBeats('quarter', true)).toBe(1.5);
    expect(getDurationInBeats('half', true)).toBe(3.0);
  });

  it('exporta proyectos válidos a MIDI y MusicXML', () => {
    const sampleProject: CompositionProject = {
      id: 'test-1',
      title: 'Test Score',
      composer: 'GuitarFret',
      tempo: 120,
      key: 'C',
      mode: 'major',
      timeSignature: '4/4',
      clef: 'treble',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      measures: [
        {
          id: 'm-1',
          number: 1,
          timeSignature: '4/4',
          clef: 'treble',
          chord: {
            id: 'ch-1',
            symbol: 'C',
            name: 'Do Mayor',
            solfege: 'Do',
            pitches: ['C4', 'E4', 'G4'],
            midis: [60, 64, 67],
            startBeat: 0,
            durationBeats: 4
          },
          notes: [
            {
              id: 'n-1',
              step: 'C',
              alter: 0,
              octave: 4,
              duration: 'quarter',
              startBeat: 0,
              durationBeats: 1,
              midi: 60,
              pitch: 'C4',
              solfege: 'Do'
            }
          ]
        }
      ]
    };

    const midiBytes = generateMidiFile(sampleProject);
    expect(midiBytes.length).toBeGreaterThan(20);
    expect(Array.from(midiBytes.slice(0, 4))).toEqual([0x4d, 0x54, 0x68, 0x64]);

    const xmlString = generateMusicXml(sampleProject);
    expect(xmlString).toContain('<score-partwise');
    expect(xmlString).toContain('</score-partwise>');
    expect(xmlString).toContain('<step>C</step>');
    expect(xmlString).toContain('<octave>4</octave>');
  });

  it('mantiene el asistente armónico, el modo menor natural y la compatibilidad con GuitarFret', () => {
    const amDiatonic = getDiatonicChords('A', 'minor', 'treble');
    const amVII = amDiatonic.find(c => c.numeral === 'VII');
    expect(amVII?.symbol).toBe('G');
    expect(amDiatonic.some(c => c.numeral === 'im7' && c.symbol === 'Am7')).toBe(true);
    expect(amDiatonic.some(c => c.numeral === 'iiø7' && c.symbol === 'Bm7b5')).toBe(true);

    expect(getHarmonicAssistant('Bm7b5').primaryScales[0].name).toContain('Locria');
    expect(getHarmonicAssistant('CmMaj7').primaryScales[0].name).toContain('Menor Melódica');
    expect(getHarmonicAssistant('G7sus4').primaryScales[0].name).toContain('Mixolidia');
    expect(getHarmonicAssistant('Gmaj7').tensions[0]).toContain('La');

    const scales = getScaleDefinitions('C', 'american');
    expect(scales.length).toBeGreaterThan(10);

    const scaleFret = calculateScaleFretboard('C', 'major pentatonic', 'CAGED', 1, 'standard', 21);
    expect(scaleFret.dots.length).toBeGreaterThan(0);

    const chordFret = getChordData('C', 'major', 0, 'standard', 21);
    expect(chordFret.positions.length).toBeGreaterThan(0);
  });
});
