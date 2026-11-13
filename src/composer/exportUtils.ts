/**
 * @file exportUtils.ts
 * @description Utilidades para exportación musical profesional:
 * - Generador binario de archivos MIDI (.mid estándar SMF Tipo 0)
 * - Generador de archivos MusicXML (.musicxml compatible con MuseScore, Guitar Pro y Finale)
 * - Guardado y carga de proyectos en formato JSON
 */

import { CompositionProject, Measure, ScoreNote, TimeSignature, ClefType } from './types';

/**
 * Convierte un número en bytes de longitud variable para formato MIDI.
 */
function toVarInt(val: number): number[] {
  let buffer = val & 0x7f;
  const bytes: number[] = [];
  while ((val >>= 7)) {
    buffer <<= 8;
    buffer |= (val & 0x7f) | 0x80;
  }
  while (true) {
    bytes.push(buffer & 0xff);
    if (buffer & 0x80) buffer >>= 8;
    else break;
  }
  return bytes;
}

/**
 * Genera un archivo binario MIDI (.mid) compatible con cualquier DAW o visor de partituras.
 */
export function generateMidiFile(project: CompositionProject): Uint8Array {
  const ticksPerQuarter = 480;
  const microsecondsPerQuarter = Math.round(60000000 / (project.tempo || 120));

  interface MidiEvent {
    tick: number;
    type: 'note-on' | 'note-off';
    channel: number;
    midi: number;
    velocity: number;
  }

  const rawEvents: MidiEvent[] = [];
  let currentMeasureTick = 0;

  project.measures.forEach(measure => {
    let capacityBeats = 4;
    if (measure.timeSignature === '3/4' || measure.timeSignature === '6/8') capacityBeats = 3;
    else if (measure.timeSignature === '2/4') capacityBeats = 2;
    else if (measure.timeSignature === '5/4') capacityBeats = 5;
    else if (measure.timeSignature === '7/8') capacityBeats = 3.5;
    else if (measure.timeSignature === '9/8') capacityBeats = 4.5;
    else if (measure.timeSignature === '12/8') capacityBeats = 6;

    // Si tiene acorde
    if (measure.chord && measure.chord.midis.length > 0) {
      const chordStartTick = currentMeasureTick;
      const chordEndTick = chordStartTick + Math.round(capacityBeats * ticksPerQuarter * 0.95);
      measure.chord.midis.forEach(midi => {
        rawEvents.push({ tick: chordStartTick, type: 'note-on', channel: 0, midi, velocity: 65 });
        rawEvents.push({ tick: chordEndTick, type: 'note-off', channel: 0, midi, velocity: 0 });
      });
    }

    // Notas melódicas
    measure.notes.forEach(note => {
      if (!note.isRest && note.midi > 0) {
        const noteStartTick = currentMeasureTick + Math.round(note.startBeat * ticksPerQuarter);
        const noteDurationTicks = Math.round(note.durationBeats * ticksPerQuarter * 0.92);
        const noteEndTick = noteStartTick + noteDurationTicks;

        rawEvents.push({ tick: noteStartTick, type: 'note-on', channel: 0, midi: note.midi, velocity: 90 });
        rawEvents.push({ tick: noteEndTick, type: 'note-off', channel: 0, midi: note.midi, velocity: 0 });
      }
    });

    currentMeasureTick += Math.round(capacityBeats * ticksPerQuarter);
  });

  // Ordenar eventos cronológicamente
  rawEvents.sort((a, b) => {
    if (a.tick !== b.tick) return a.tick - b.tick;
    // note-off antes de note-on en el mismo tick
    return a.type === 'note-off' ? -1 : 1;
  });

  // Construir cuerpo de la pista MIDI (MTrk)
  const trackBytes: number[] = [];

  // 1. Meta Event: Tempo (0xFF 0x51 0x03 tt tt tt) en delta-time 0
  trackBytes.push(0x00, 0xff, 0x51, 0x03);
  trackBytes.push((microsecondsPerQuarter >> 16) & 0xff);
  trackBytes.push((microsecondsPerQuarter >> 8) & 0xff);
  trackBytes.push(microsecondsPerQuarter & 0xff);

  // 2. Meta Event: Time Signature (0xFF 0x58 0x04 nn dd cc bb)
  const [numStr, denStr] = (project.timeSignature || '4/4').split('/');
  const num = parseInt(numStr, 10) || 4;
  const den = parseInt(denStr, 10) || 4;
  const denPower = Math.round(Math.log2(den));
  trackBytes.push(0x00, 0xff, 0x58, 0x04, num, denPower, 24, 8);

  // 3. Escribir eventos de notas con delta-time
  let lastTick = 0;
  rawEvents.forEach(ev => {
    const delta = Math.max(0, ev.tick - lastTick);
    lastTick = ev.tick;
    trackBytes.push(...toVarInt(delta));

    const status = (ev.type === 'note-on' ? 0x90 : 0x80) | (ev.channel & 0x0f);
    trackBytes.push(status, ev.midi & 0x7f, ev.velocity & 0x7f);
  });

  // 4. Meta Event: Fin de Pista (0xFF 0x2F 0x00)
  trackBytes.push(0x00, 0xff, 0x2f, 0x00);

  // Construir archivo completo MThd + MTrk
  const fileBytes: number[] = [
    // Header MThd
    0x4d, 0x54, 0x68, 0x64, // "MThd"
    0x00, 0x00, 0x00, 0x06, // Longitud cabecera: 6 bytes
    0x00, 0x00,             // Formato 0 (pista única)
    0x00, 0x01,             // 1 pista
    (ticksPerQuarter >> 8) & 0xff,
    ticksPerQuarter & 0xff,

    // Track MTrk
    0x4d, 0x54, 0x72, 0x6b, // "MTrk"
    (trackBytes.length >> 24) & 0xff,
    (trackBytes.length >> 16) & 0xff,
    (trackBytes.length >> 8) & 0xff,
    trackBytes.length & 0xff,
    ...trackBytes
  ];

  return new Uint8Array(fileBytes);
}

/**
 * Genera el documento XML estándar de MusicXML para la partitura.
 */
export function generateMusicXml(project: CompositionProject): string {
  const divisions = 4; // 1 negra = 4 divisiones; corchea = 2; semicorchea = 1

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <work>
    <work-title>${escapeXml(project.title || 'Composición sin título')}</work-title>
  </work>
  <identification>
    <creator type="composer">${escapeXml(project.composer || 'GuitarFret Composer')}</creator>
    <encoding>
      <software>GuitarFret Music Composer Engine</software>
      <encoding-date>${new Date().toISOString().slice(0, 10)}</encoding-date>
    </encoding>
  </identification>
  <part-list>
    <score-part id="P1">
      <part-name>Guitarra / Piano</part-name>
      <score-instrument id="P1-I1">
        <instrument-name>Acoustic Guitar / Piano</instrument-name>
      </score-instrument>
    </score-part>
  </part-list>
  <part id="P1">
`;

  project.measures.forEach((measure, mIdx) => {
    xml += `    <measure number="${mIdx + 1}">\n`;

    // Atributos en el primer compás
    if (mIdx === 0) {
      const [numStr, denStr] = (project.timeSignature || '4/4').split('/');
      const clefSign = project.clef === 'bass' ? 'F' : project.clef === 'alto' ? 'C' : 'G';
      const clefLine = project.clef === 'bass' ? '4' : project.clef === 'alto' ? '3' : '2';

      xml += `      <attributes>
        <divisions>${divisions}</divisions>
        <key>
          <fifths>0</fifths>
          <mode>${project.mode || 'major'}</mode>
        </key>
        <time>
          <beats>${numStr}</beats>
          <beat-type>${denStr}</beat-type>
        </time>
        <clef>
          <sign>${clefSign}</sign>
          <line>${clefLine}</line>
        </clef>
      </attributes>
      <direction placement="above">
        <direction-type>
          <metronome>
            <beat-unit>quarter</beat-unit>
            <per-minute>${project.tempo || 120}</per-minute>
          </metronome>
        </direction-type>
        <sound tempo="${project.tempo || 120}"/>
      </direction>\n`;
    }

    // Armonía (Acorde sobre el compás)
    if (measure.chord) {
      xml += `      <harmony>
        <root>
          <root-step>${measure.chord.symbol[0]}</root-step>
        </root>
        <kind text="${escapeXml(measure.chord.symbol)}">${measure.chord.symbol.includes('m') ? 'minor' : 'major'}</kind>
      </harmony>\n`;
    }

    // Si no hay notas, generar un silencio de compás entero
    if (measure.notes.length === 0) {
      let restDivisions = 16;
      if (measure.timeSignature === '3/4' || measure.timeSignature === '6/8') restDivisions = 12;
      else if (measure.timeSignature === '2/4') restDivisions = 8;
      xml += `      <note>
        <rest/>
        <duration>${restDivisions}</duration>
        <voice>1</voice>
        <type>whole</type>
      </note>\n`;
    } else {
      measure.notes.forEach(note => {
        const noteDivisions = Math.round(note.durationBeats * divisions);
        const typeStr = note.duration === 'whole'
          ? 'whole'
          : note.duration === 'half'
          ? 'half'
          : note.duration === 'quarter'
          ? 'quarter'
          : note.duration === 'eighth'
          ? 'eighth'
          : '16th';

        if (note.isRest) {
          xml += `      <note>
        <rest/>
        <duration>${noteDivisions}</duration>
        <voice>1</voice>
        <type>${typeStr}</type>
      </note>\n`;
        } else {
          xml += `      <note>
        <pitch>
          <step>${note.step}</step>
          ${note.alter !== 0 ? `<alter>${note.alter}</alter>` : ''}
          <octave>${note.octave}</octave>
        </pitch>
        <duration>${noteDivisions}</duration>
        <voice>1</voice>
        <type>${typeStr}</type>
        ${note.dotted ? '<dot/>' : ''}
      </note>\n`;
        }
      });
    }

    xml += `    </measure>\n`;
  });

  xml += `  </part>
</score-partwise>`;

  return xml;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, c => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

/**
 * Descarga cualquier blob de datos directamente en el navegador del usuario.
 */
export function downloadFile(data: Uint8Array | string, filename: string, mimeType: string) {
  const blob = typeof data === 'string'
    ? new Blob([data], { type: mimeType })
    : new Blob([data as unknown as BlobPart], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
