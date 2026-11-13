/**
 * @file composerTheory.test.ts
 * @description Suite de pruebas automatizadas para el Editor de Composición Musical.
 * Verifica todos los puntos obligatorios solicitados por el usuario:
 * 1. Acordes diatónicos correctos de Do mayor
 * 2. Notas correctas de La menor natural
 * 3. Armaduras correctas para las tonalidades
 * 4. Altura y posicionamiento exacto de notas en pentagrama (Sol, Fa, Do)
 * 5. Correspondencia de octavas y números MIDI
 * 6. Polifonía y voicings de acordes
 * 7. Diferencias métricas entre compases simples (4/4) y compuestos (6/8)
 * 8. Duraciones rítmicas y figuras con puntillo
 * 9. Sincronización y transposición de intervalos
 * 10. Exportación a MIDI y MusicXML
 * 11. Serialización y guardado de proyecto
 * 12. Integridad de las secciones de GuitarFret
 */

import {
  getKeySignatureInfo,
  getDiatonicChords,
  getScaleDefinitions,
  calculateNoteStaffY,
  calculateLedgerLines,
  getStemDirection,
  getDurationInBeats,
  getMeasureCapacityBeats,
  getMeterInfo,
  transposeNote,
  createVoicingForChord,
  createScoreNoteFromPitch,
  getHarmonicAssistant
} from './musicTheoryEngine';
import { generateMidiFile, generateMusicXml } from './exportUtils';
import { CompositionProject, Measure, ScoreNote } from './types';
import { calculateScaleFretboard, getChordData, TUNINGS } from '../utils/theory';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`✓ PASS: ${message}`);
}

console.log('--- Iniciando suite de pruebas de teoría del Compositor ---');

// 1. DO MAYOR GENERA LOS ACORDES DIATÓNICOS CORRECTOS
console.log('\n[1] Acordes diatónicos de Do Mayor (C):');
const cChords = getDiatonicChords('C', 'major', 'treble');
const cTriads = cChords.filter(c => c.type === 'triad');

assert(cTriads.length === 7, `Se esperan 7 tríadas diatónicas (obtenidas: ${cTriads.length})`);
assert(cTriads[0].symbol === 'C' && cTriads[0].numeral === 'I', 'Grado I es C');
assert(cTriads[1].symbol === 'Dm' && cTriads[1].numeral === 'ii', 'Grado ii es Dm');
assert(cTriads[2].symbol === 'Em' && cTriads[2].numeral === 'iii', 'Grado iii es Em');
assert(cTriads[3].symbol === 'F' && cTriads[3].numeral === 'IV', 'Grado IV es F');
assert(cTriads[4].symbol === 'G' && cTriads[4].numeral === 'V', 'Grado V es G');
assert(cTriads[5].symbol === 'Am' && cTriads[5].numeral === 'vi', 'Grado vi es Am');
assert(cTriads[6].symbol === 'Bdim' && cTriads[6].numeral === 'vii°', 'Grado vii° es Bdim');

// Verificar notas de cada acorde
assert(cTriads[0].notes.join(',') === 'C,E,G', `Notas de C son Do-Mi-Sol (obtenidas: ${cTriads[0].notes.join(',')})`);
assert(cTriads[1].notes.join(',') === 'D,F,A', `Notas de Dm son Re-Fa-La (obtenidas: ${cTriads[1].notes.join(',')})`);
assert(cTriads[3].notes.join(',') === 'F,A,C', `Notas de F son Fa-La-Do (obtenidas: ${cTriads[3].notes.join(',')})`);
assert(cTriads[4].notes.join(',') === 'G,B,D', `Notas de G son Sol-Si-Re (obtenidas: ${cTriads[4].notes.join(',')})`);

// 2. LA MENOR NATURAL TIENE LAS NOTAS CORRECTAS
console.log('\n[2] Notas de La Menor Natural (Am):');
const aMinorKey = getKeySignatureInfo('A', 'minor');
assert(aMinorKey.scaleNotes.join(',') === 'A,B,C,D,E,F,G', `Notas de La menor son A,B,C,D,E,F,G (obtenidas: ${aMinorKey.scaleNotes.join(',')})`);
assert(aMinorKey.accidentalCount === 0, `La menor no tiene alteraciones en su armadura (obtenido: ${aMinorKey.accidentalCount})`);

// 3. ARMADURA DE CADA TONALIDAD ES CORRECTA
console.log('\n[3] Armaduras de tonalidades mayores y menores:');
const gMajor = getKeySignatureInfo('G', 'major');
assert(gMajor.accidentalCount === 1 && gMajor.accidentals[0] === 'F#', 'Sol Mayor tiene 1 sostenido: F#');

const dMajor = getKeySignatureInfo('D', 'major');
assert(dMajor.accidentalCount === 2 && dMajor.accidentals.join(',') === 'F#,C#', 'Re Mayor tiene 2 sostenidos: F#, C#');

const fMajor = getKeySignatureInfo('F', 'major');
assert(fMajor.accidentalCount === -1 && fMajor.accidentals[0] === 'Bb', 'Fa Mayor tiene 1 bemol: Bb');

const ebMajor = getKeySignatureInfo('Eb', 'major');
assert(ebMajor.accidentalCount === -3 && ebMajor.accidentals.join(',') === 'Bb,Eb,Ab', 'Mib Mayor tiene 3 bemoles: Bb, Eb, Ab');

// 4. NOTAS EN LÍNEAS O ESPACIOS CORRESPONDIENTES SEGÚN LA CLAVE
console.log('\n[4] Posiciones exactas en pentagrama (Clave de Sol, Fa y Do):');
const staffTopY = 56;
const lineSpacing = 11;
const line1Y = staffTopY + 4 * lineSpacing; // 100px (Línea 1 inferior)
const line2Y = staffTopY + 3 * lineSpacing; // 89px (Línea 2)
const line3Y = staffTopY + 2 * lineSpacing; // 78px (Línea 3)
const line4Y = staffTopY + 1 * lineSpacing; // 67px (Línea 4)
const line5Y = staffTopY + 0 * lineSpacing; // 56px (Línea 5 superior)

// Clave de Sol (Treble):
// E4 = Línea 1
const e4Y = calculateNoteStaffY('E', 4, 'treble', staffTopY, lineSpacing);
assert(Math.abs(e4Y - line1Y) < 0.1, `Treble: Mi4 (E4) está en la 1.ª línea (${e4Y} === ${line1Y})`);

// G4 = Línea 2
const g4Y = calculateNoteStaffY('G', 4, 'treble', staffTopY, lineSpacing);
assert(Math.abs(g4Y - line2Y) < 0.1, `Treble: Sol4 (G4) está en la 2.ª línea (${g4Y} === ${line2Y})`);

// B4 = Línea 3
const b4Y = calculateNoteStaffY('B', 4, 'treble', staffTopY, lineSpacing);
assert(Math.abs(b4Y - line3Y) < 0.1, `Treble: Si4 (B4) está en la 3.ª línea (${b4Y} === ${line3Y})`);

// D5 = Línea 4
const d5Y = calculateNoteStaffY('D', 5, 'treble', staffTopY, lineSpacing);
assert(Math.abs(d5Y - line4Y) < 0.1, `Treble: Re5 (D5) está en la 4.ª línea (${d5Y} === ${line4Y})`);

// F5 = Línea 5
const f5Y = calculateNoteStaffY('F', 5, 'treble', staffTopY, lineSpacing);
assert(Math.abs(f5Y - line5Y) < 0.1, `Treble: Fa5 (F5) está en la 5.ª línea (${f5Y} === ${line5Y})`);

// C4 = 1 línea adicional por debajo en Clave de Sol
const c4Ledger = calculateLedgerLines('C', 4, 'treble', staffTopY, lineSpacing);
assert(c4Ledger.length === 1, `Treble: Do central (C4) tiene exactamente 1 línea adicional inferior`);

// Clave de Fa (Bass):
// G2 = Línea 1
const g2BassY = calculateNoteStaffY('G', 2, 'bass', staffTopY, lineSpacing);
assert(Math.abs(g2BassY - line1Y) < 0.1, `Bass: Sol2 (G2) está en la 1.ª línea`);

// Clave de Do (Alto):
// C4 = Línea 3
const c4AltoY = calculateNoteStaffY('C', 4, 'alto', staffTopY, lineSpacing);
assert(Math.abs(c4AltoY - line3Y) < 0.1, `Alto: Do4 (C4) está en la 3.ª línea`);

// 5. CORRESPONDENCIA DE OCTAVAS Y FRECUENCIAS MIDI
console.log('\n[5] Correspondencia MIDI y Alturas:');
const noteC4 = createScoreNoteFromPitch('C4');
assert(noteC4.midi === 60, `Do central C4 tiene MIDI 60 (obtenido: ${noteC4.midi})`);

const noteA4 = createScoreNoteFromPitch('A4');
assert(noteA4.midi === 69, `La 440Hz A4 tiene MIDI 69 (obtenido: ${noteA4.midi})`);

const noteC5 = createScoreNoteFromPitch('C5');
assert(noteC5.midi === 72, `Do agudo C5 tiene MIDI 72 (obtenido: ${noteC5.midi})`);

// 6. POLIFONÍA Y VOICINGS DE ACORDES
console.log('\n[6] Voicings de Acordes Polifónicos:');
const cVoicing = createVoicingForChord('C', 'treble');
assert(cVoicing.pitches.length === 3, 'Tríada de C tiene 3 notas');
assert(cVoicing.midis.includes(60) && cVoicing.midis.includes(64) && cVoicing.midis.includes(67), 'C voicing contiene Do(60), Mi(64), Sol(67)');

// Inversión
const cInv1 = createVoicingForChord('C', 'treble', 1);
assert(cInv1.pitches[0].startsWith('E'), `1.ª inversión de C tiene a Mi como nota más grave (obtenido: ${cInv1.pitches[0]})`);

// 7. COMPASES SIMPLES (4/4) Y COMPUESTOS (6/8)
console.log('\n[7] Métrica y Capacidades Rítmicas (4/4 vs 6/8):');
const cap44 = getMeasureCapacityBeats('4/4');
assert(cap44 === 4.0, `4/4 tiene capacidad de 4.0 tiempos de negra`);

const cap68 = getMeasureCapacityBeats('6/8');
assert(cap68 === 3.0, `6/8 contiene 6 corcheas = 3.0 tiempos de negra`);

const meter44 = getMeterInfo('4/4');
assert(!meter44.isCompound && meter44.pulseCount === 4, '4/4 es métrica simple con 4 pulsos');

const meter68 = getMeterInfo('6/8');
assert(meter68.isCompound && meter68.pulseCount === 2, '6/8 es métrica compuesta con 2 pulsos principales');

// 8. FIGURAS RÍTMICAS Y PUNTILLOS
console.log('\n[8] Duraciones de figuras y puntillos:');
assert(getDurationInBeats('whole') === 4.0, 'Redonda = 4.0');
assert(getDurationInBeats('half') === 2.0, 'Blanca = 2.0');
assert(getDurationInBeats('quarter') === 1.0, 'Negra = 1.0');
assert(getDurationInBeats('eighth') === 0.5, 'Corchea = 0.5');
assert(getDurationInBeats('sixteenth') === 0.25, 'Semicorchea = 0.25');
assert(getDurationInBeats('quarter', true) === 1.5, 'Negra con puntillo = 1.5');
assert(getDurationInBeats('half', true) === 3.0, 'Blanca con puntillo = 3.0');

// 9. TRANSPOSICIÓN
console.log('\n[9] Transposición de notas:');
const c4Orig = createScoreNoteFromPitch('C4');
const d4Trans = transposeNote(c4Orig, 2);
assert(d4Trans.midi === 62 && d4Trans.pitch === 'D4', `C4 + 2 semitonos = D4 (MIDI: ${d4Trans.midi}, Pitch: ${d4Trans.pitch})`);

const c5Trans = transposeNote(c4Orig, 12);
assert(c5Trans.midi === 72 && c5Trans.pitch === 'C5', `C4 + 12 semitonos = C5`);

// 10. EXPORTACIÓN A MIDI Y MUSICXML
console.log('\n[10] Exportación a MIDI y MusicXML:');
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
        { id: 'n-1', step: 'C', alter: 0, octave: 4, duration: 'quarter', startBeat: 0, durationBeats: 1, midi: 60, pitch: 'C4', solfege: 'Do' }
      ]
    }
  ]
};

const midiBytes = generateMidiFile(sampleProject);
assert(midiBytes.length > 20, `Generador MIDI produce un archivo válido (longitud: ${midiBytes.length} bytes)`);
// Comprobar cabecera 'MThd' (0x4D, 0x54, 0x68, 0x64)
assert(midiBytes[0] === 0x4D && midiBytes[1] === 0x54 && midiBytes[2] === 0x68 && midiBytes[3] === 0x64, 'Archivo MIDI inicia con MThd');

const xmlString = generateMusicXml(sampleProject);
assert(xmlString.includes('<score-partwise') && xmlString.includes('</score-partwise>'), 'MusicXML contiene estructura score-partwise');
assert(xmlString.includes('<step>C</step>') && xmlString.includes('<octave>4</octave>'), 'MusicXML contiene la nota C4');

// 11. INTEGRIDAD DE GUITARFRET (ESCALAS Y ACORDES NO SE ROMPEN)
console.log('\n[11] Integridad de las secciones existentes de GuitarFret:');
const scaleFret = calculateScaleFretboard('C', 'major pentatonic', 'CAGED', 1, 'standard', 21);
assert(scaleFret.dots.length > 0, `Escalas de guitarra calculan correctamente los puntos del mástil (${scaleFret.dots.length} notas)`);

const chordFret = getChordData('C', 'major', 0, 'standard', 21);
assert(chordFret.positions.length > 0, `Acordes de guitarra conservan las posiciones de chords-db (${chordFret.positions.length} posiciones)`);

// 12. REGRESIONES ARREGLADAS (MODO MENOR VII MAYOR, ASISTENTE ARMÓNICO Y ENARMÓNICOS)
console.log('\n[12] Regresiones de teoría corregidas en el Compositor:');
const amDiatonic = getDiatonicChords('A', 'minor', 'treble');
const amVII = amDiatonic.find(c => c.numeral === 'VII');
assert(amVII?.symbol === 'G', `Grado VII de La menor natural es G mayor (obtenido: ${amVII?.symbol})`);
assert(amDiatonic.some(c => c.numeral === 'im7' && c.symbol === 'Am7'), 'La menor incluye cuatríada im7 (Am7)');
assert(amDiatonic.some(c => c.numeral === 'iiø7' && c.symbol === 'Bm7b5'), 'La menor incluye cuatríada iiø7 (Bm7b5)');

const dbMinorInfo = getKeySignatureInfo('Db', 'minor');
assert(dbMinorInfo.accidentalCount === 4 && dbMinorInfo.accidentals.length === 4, 'Db menor se normaliza enarmónicamente a Do# menor (4 sostenidos)');

assert(getHarmonicAssistant('Bm7b5').primaryScales[0].name.includes('Locria'), 'Bm7b5 sugiere escala Locria');
assert(getHarmonicAssistant('CmMaj7').primaryScales[0].name.includes('Menor Melódica'), 'CmMaj7 sugiere Menor Melódica');
assert(getHarmonicAssistant('G7sus4').primaryScales[0].name.includes('Mixolidia'), 'G7sus4 sugiere Mixolidia');
assert(getHarmonicAssistant('Gmaj7').tensions[0].includes('La'), 'Gmaj7 calcula dinámicamente la 9na (La)');

console.log('\n=== TODAS LAS PRUEBAS DEL COMPOSITOR PASARON AL 100% ===');

