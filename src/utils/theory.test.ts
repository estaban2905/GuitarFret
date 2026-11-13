/**
 * @file theory.test.ts
 * @description Suite de pruebas unitarias automatizadas para la teoría musical:
 * - Cálculo de notas según afinación
 * - Apariciones de tónica en el diapasón (getRootOccurrences)
 * - Prueba obligatoria: C mayor pentatónica desde 5.ª cuerda traste 3 (5:3 -> 5:5 -> 4:2 -> 4:5 -> 3:2 -> 3:5)
 * - Prueba obligatoria: C mayor pentatónica desde 6.ª cuerda traste 8 (6:8 -> 6:10 -> 5:7 -> 5:10 -> 4:7 -> 4:10)
 * - Recorrido de 2 octavas desde 6.ª cuerda traste 8
 * - Recorridos descendentes cuando sea físicamente posible
 * - Adaptación dinámica a afinaciones alternativas (Drop D, Medio tono abajo)
 */

import {
  getRootOccurrences,
  generateScaleRuns,
  calculateScaleFretboard,
  getChordData,
  getNoteAtFret,
  getSolfege,
  formatNoteName,
  formatPitchName,
  formatChordSymbol,
  formatTuningLabels,
  TUNINGS
} from './theory';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`✓ PASS: ${message}`);
}

console.log('--- Iniciando suite de pruebas de teoría musical ---');

// 1. Prueba de Solfeo en español
console.log('\n[1] Mapeo de Solfeo en español:');
assert(getSolfege('C') === 'Do', 'C es Do');
assert(getSolfege('D') === 'Re', 'D es Re');
assert(getSolfege('E') === 'Mi', 'E es Mi');
assert(getSolfege('F') === 'Fa', 'F es Fa');
assert(getSolfege('G') === 'Sol', 'G es Sol');
assert(getSolfege('A') === 'La', 'A es La');
assert(getSolfege('B') === 'Si', 'B es Si');
assert(getSolfege('Eb') === 'Mib', 'Eb es Mib');
assert(getSolfege('F#') === 'Fa#', 'F# es Fa#');

// 2. Cálculo de notas en afinación estándar
console.log('\n[2] Notas en trastes (Afinación Estándar):');
const eStandard = TUNINGS.standard.notes;
assert(getNoteAtFret(6, 0, eStandard).pitch === 'E2', 'Cuerda 6 traste 0 es E2');
assert(getNoteAtFret(5, 3, eStandard).pitch === 'C3', 'Cuerda 5 traste 3 es C3');
assert(getNoteAtFret(6, 8, eStandard).pitch === 'C3', 'Cuerda 6 traste 8 es C3');
assert(getNoteAtFret(1, 0, eStandard).pitch === 'E4', 'Cuerda 1 traste 0 es E4');
assert(getNoteAtFret(1, 8, eStandard).pitch === 'C5', 'Cuerda 1 traste 8 es C5');

// 3. Notas en afinación Drop D
console.log('\n[3] Afinación Drop D:');
const dropDNotes = TUNINGS.dropD.notes;
assert(getNoteAtFret(6, 0, dropDNotes).pitch === 'D2', 'Drop D: Cuerda 6 traste 0 es D2');
assert(getNoteAtFret(6, 10, dropDNotes).pitch === 'C3', 'Drop D: Cuerda 6 traste 10 es C3');

// 4. Apariciones de tónica Do (C) en el diapasón
console.log('\n[4] Apariciones de tónica Do en diapasón (Standard):');
const cOccurrences = getRootOccurrences('C', eStandard, 21);
assert(cOccurrences.length > 0, 'Se detectan apariciones de Do');
const has5_3 = cOccurrences.some(o => o.string === 5 && o.fret === 3);
assert(has5_3, 'Do en 5.ª cuerda traste 3 existe');
const has6_8 = cOccurrences.some(o => o.string === 6 && o.fret === 8);
assert(has6_8, 'Do en 6.ª cuerda traste 8 existe');

// 5. CASO DE PRUEBA OBLIGATORIO 1:
// Afinación estándar EADGBE, C mayor pentatónica, desde cuerda 5 traste 3.
// Recorrido exacto esperado:
// 5:3 (Do) -> 5:5 (Re) -> 4:2 (Mi) -> 4:5 (Sol) -> 3:2 (La) -> 3:5 (Do)
console.log('\n[5] CASO OBLIGATORIO 1: C pentatónica mayor desde 5.ª cuerda traste 3:');
const run5_3 = generateScaleRuns({
  startString: 5,
  startFret: 3,
  scaleId: 'major pentatonic',
  root: 'C',
  tuningId: 'standard',
  direction: 'ascending',
  span: '1_octave'
});

assert(run5_3.variations.length > 0, 'Genera variaciones de recorrido');
const activeVar1 = run5_3.activeVariation;
assert(activeVar1 !== null, 'Tiene variación activa');

const steps1 = activeVar1!.steps;
assert(steps1.length === 6, `Tiene 6 pasos para 1 octava pentatónica (obtenidos: ${steps1.length})`);

// Verificar primer paso: debe ser exactamente 5:3
assert(steps1[0].string === 5 && steps1[0].fret === 3, 'Paso 1 es Cuerda 5, Traste 3 (Do)');
assert(steps1[0].isStart === true, 'Paso 1 está marcado como isStart');
assert(steps1[0].noteName === 'C', 'Paso 1 es nota C');

// Secuencia esperada
const expectedSteps1 = [
  { string: 5, fret: 3, note: 'C' },
  { string: 5, fret: 5, note: 'D' },
  { string: 4, fret: 2, note: 'E' },
  { string: 4, fret: 5, note: 'G' },
  { string: 3, fret: 2, note: 'A' },
  { string: 3, fret: 5, note: 'C' }
];

const matchesExpected1 = expectedSteps1.every((exp, idx) => {
  const actual = steps1[idx];
  return actual.string === exp.string && actual.fret === exp.fret && actual.noteName === exp.note;
});

console.log('Pasos obtenidos:', steps1.map(s => `${s.string}:${s.fret} (${s.solfege})`).join(' -> '));
assert(matchesExpected1, 'La secuencia coincide EXACTAMENTE con: 5:3 (Do) -> 5:5 (Re) -> 4:2 (Mi) -> 4:5 (Sol) -> 3:2 (La) -> 3:5 (Do)');

// 6. CASO DE PRUEBA OBLIGATORIO 2:
// C mayor pentatónica desde 6.ª cuerda traste 8.
// Recorrido esperado: 6:8 -> 6:10 -> 5:7 -> 5:10 -> 4:7 -> 4:10
console.log('\n[6] CASO OBLIGATORIO 2: C pentatónica mayor desde 6.ª cuerda traste 8:');
const run6_8 = generateScaleRuns({
  startString: 6,
  startFret: 8,
  scaleId: 'major pentatonic',
  root: 'C',
  tuningId: 'standard',
  direction: 'ascending',
  span: '1_octave'
});

const activeVar2 = run6_8.activeVariation;
assert(activeVar2 !== null, 'Tiene variación activa desde 6:8');
const steps2 = activeVar2!.steps;
console.log('Pasos obtenidos desde 6:8:', steps2.map(s => `${s.string}:${s.fret} (${s.solfege})`).join(' -> '));

const expectedSteps2 = [
  { string: 6, fret: 8, note: 'C' },
  { string: 6, fret: 10, note: 'D' },
  { string: 5, fret: 7, note: 'E' },
  { string: 5, fret: 10, note: 'G' },
  { string: 4, fret: 7, note: 'A' },
  { string: 4, fret: 10, note: 'C' }
];

const matchesExpected2 = expectedSteps2.every((exp, idx) => {
  const actual = steps2[idx];
  return actual.string === exp.string && actual.fret === exp.fret && actual.noteName === exp.note;
});
assert(matchesExpected2, 'La secuencia coincide EXACTAMENTE con: 6:8 -> 6:10 -> 5:7 -> 5:10 -> 4:7 -> 4:10');

// 7. Prueba de 2 octavas desde 6.ª cuerda traste 8
console.log('\n[7] Recorrido de 2 octavas ascendente desde 6.ª cuerda traste 8:');
const run6_8_2oct = generateScaleRuns({
  startString: 6,
  startFret: 8,
  scaleId: 'major pentatonic',
  root: 'C',
  tuningId: 'standard',
  direction: 'ascending',
  span: '2_octaves'
});

assert(run6_8_2oct.activeVariation !== null, 'Genera variación de 2 octavas');
assert(run6_8_2oct.activeVariation!.steps.length === 11, `Tiene 11 notas para 2 octavas pentatónicas (obtenidas: ${run6_8_2oct.activeVariation!.steps.length})`);
const lastNote2Oct = run6_8_2oct.activeVariation!.steps[10];
assert(lastNote2Oct.noteName === 'C', 'Termina en la tónica C de la segunda octava');
assert(lastNote2Oct.string === 1 && lastNote2Oct.fret === 8, 'La nota final es Cuerda 1 traste 8 (C5)');

// 8. Prueba de recorrido descendente desde cuerda 3 traste 5 (Do)
console.log('\n[8] Recorrido descendente de 1 octava desde 3.ª cuerda traste 5:');
const runDescend = generateScaleRuns({
  startString: 3,
  startFret: 5,
  scaleId: 'major pentatonic',
  root: 'C',
  tuningId: 'standard',
  direction: 'descending',
  span: '1_octave'
});

assert(runDescend.activeVariation !== null, 'Genera variación descendente');
const firstDescend = runDescend.activeVariation!.steps[0];
const lastDescend = runDescend.activeVariation!.steps[runDescend.activeVariation!.steps.length - 1];
assert(firstDescend.string === 3 && firstDescend.fret === 5, 'Comienza en Cuerda 3 traste 5');
assert(firstDescend.midi > lastDescend.midi, 'Las notas van en sentido descendente de pitch');
assert(lastDescend.noteName === 'C', 'Termina en tónica C más grave');

// 9. Caso específico del usuario: C mayor pentatónica desde 2.ª cuerda traste 1 (Do)
console.log('\n[9] CASO USUARIO: C pentatónica mayor desde 2.ª cuerda traste 1:');
const run2_1 = generateScaleRuns({
  startString: 2,
  startFret: 1,
  scaleId: 'major pentatonic',
  root: 'C',
  tuningId: 'standard',
  direction: 'ascending',
  span: '1_octave'
});

assert(run2_1.variations.length > 0, 'Genera variaciones ascendentes desde cuerda 2 traste 1');
assert(run2_1.activeVariation !== null, 'Tiene variación activa desde 2:1');
const steps2_1 = run2_1.activeVariation!.steps;
console.log('Pasos obtenidos desde 2:1:', steps2_1.map(s => `${s.string}:${s.fret} (${s.solfege})`).join(' -> '));
assert(steps2_1[0].string === 2 && steps2_1[0].fret === 1, 'Inicia en Cuerda 2 traste 1 (Do)');
assert(steps2_1[steps2_1.length - 1].noteName === 'C', 'Termina en tónica Do');
const startDot2_1 = run2_1.dots.find(d => d.string === 2 && d.fret === 1);
assert(startDot2_1?.isStart === true && startDot2_1?.inBox === true, 'El punto inicial en 2:1 está marcado como isStart e inBox');

// 10. Regresiones de cajas de escalas (blues, menor armónica/melódica, CAGED por tónica, orden pentatónico)
console.log('\n[10] Regresiones de cajas de escalas y acordes:');
const cBluesBox1 = calculateScaleFretboard('C', 'blues', 'CAGED', 1, 'standard', 21);
const cBluesBox1Notes = new Set(cBluesBox1.dots.filter(d => d.inBox).map(d => d.chroma));
assert(cBluesBox1Notes.size === 6, `Blues box 1 incluye las 6 notas incluida la blue note b5 (obtenidas: ${cBluesBox1Notes.size})`);

const cHarmBox1 = calculateScaleFretboard('C', 'harmonic minor', 'CAGED', 1, 'standard', 21);
assert(new Set(cHarmBox1.dots.filter(d => d.inBox).map(d => d.chroma)).size === 7, 'Menor armónica CAGED incluye las 7 notas (con b3 y b6)');

const cMelBox1 = calculateScaleFretboard('C', 'melodic minor', 'CAGED', 1, 'standard', 21);
assert(new Set(cMelBox1.dots.filter(d => d.inBox).map(d => d.chroma)).size === 7, 'Menor melódica CAGED incluye las 7 notas (con b3)');

const cMix = calculateScaleFretboard('C', 'mixolydian', 'CAGED', 1, 'standard', 21);
assert(cMix.availableBoxes[0].shapeName.startsWith('Forma C'), `Mixolidio en C Posición 1 usa Forma C de C (obtenido: ${cMix.availableBoxes[0].shapeName})`);

const cPent15 = calculateScaleFretboard('C', 'major pentatonic', 'CAGED', 5, 'standard', 15);
assert(cPent15.availableBoxes[0].minFret === 0 && cPent15.availableBoxes[4].maxFret <= 15, 'Pentatónica ordenada secuencialmente sin recorte en 15 trastes');

const csAug = getChordData('C#', 'aug', 0, 'standard', 21);
assert(csAug.positions.length > 0 && csAug.positions[0].stringNotes.every(sn => sn.fret === -1 || ['C#', 'E#', 'F', 'G##', 'A'].includes(sn.noteName)), 'C#aug solo contiene notas válidas del acorde');

const c9 = getChordData('C', '9', 0, 'standard', 21);
assert(c9.positions[0].stringNotes.some(sn => sn.interval === 'b7'), 'C9 Posición 1 conserva la 7ma menor (b7)');

const cmaj7 = getChordData('C', 'maj7', 0, 'standard', 21);
assert(cmaj7.positions[0].absoluteFrets.join(',') === '-1,3,2,0,0,0', 'Cmaj7 Posición 1 prioriza X 3 2 0 0 0 con tónica en el bajo');

// 11. Consistencia de notación americana vs española
console.log('\n[11] Formateo consistente de notación americana y española:');
assert(formatNoteName('Eb', 'american') === 'Eb', 'Eb en americana es Eb');
assert(formatNoteName('Eb', 'spanish') === 'Mib', 'Eb en española es Mib');
assert(formatPitchName('C4', 'american') === 'C4', 'C4 en americana es C4');
assert(formatPitchName('C4', 'spanish') === 'Do4', 'C4 en española es Do4');
assert(formatChordSymbol('F#m7b5', 'american') === 'F#m7b5', 'F#m7b5 en americana es F#m7b5');
assert(formatChordSymbol('F#m7b5', 'spanish') === 'Fa#m7b5', 'F#m7b5 en española es Fa#m7b5');
assert(formatChordSymbol('C/G', 'spanish') === 'Do/Sol', 'C/G en española es Do/Sol');
assert(formatTuningLabels(['E', 'A', 'D', 'G', 'B', 'E'], 'spanish').join(' ') === 'Mi La Re Sol Si Mi', 'Afinación estándar en española es Mi La Re Sol Si Mi');

console.log('\n=== TODAS LAS PRUEBAS PASARON EXITOSAMENTE (100% OK) ===\n');
