import { describe, expect, it, vi } from 'vitest';
import {
  downloadFile,
  generateMidiFile,
  generateMusicXml
} from '../../features/composer/services/exportUtils';
import type { CompositionProject } from '../../features/composer/types/composer.types';

function createSampleProject(): CompositionProject {
  return {
    id: 'proj-test-1',
    title: 'Estudio <1> & Prueba',
    composer: 'Autor "Demo"',
    key: 'C',
    mode: 'major',
    timeSignature: '4/4',
    tempo: 110,
    clef: 'treble',
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
    measures: [
      {
        id: 'm1',
        number: 1,
        timeSignature: '4/4',
        clef: 'treble',
        chord: {
          id: 'ch1',
          symbol: 'C',
          name: 'Do Mayor',
          solfege: 'Do',
          romanNumeral: 'I',
          harmonicFunction: 'tonic',
          pitches: ['C3', 'E3', 'G3'],
          midis: [48, 52, 55],
          startBeat: 0,
          durationBeats: 4
        },
        notes: [
          {
            id: 'n1',
            pitch: 'C4',
            step: 'C',
            alter: 0,
            octave: 4,
            midi: 60,
            solfege: 'Do',
            duration: 'quarter',
            durationBeats: 1,
            startBeat: 0,
            isRest: false
          },
          {
            id: 'n2',
            pitch: 'F#4',
            step: 'F',
            alter: 1,
            octave: 4,
            midi: 66,
            solfege: 'Fa#',
            duration: 'half',
            durationBeats: 3,
            startBeat: 1,
            isRest: false,
            dotted: true
          }
        ]
      },
      {
        id: 'm2',
        number: 2,
        timeSignature: '3/4',
        clef: 'treble',
        notes: [
          {
            id: 'n3',
            pitch: 'R',
            step: 'B',
            alter: 0,
            octave: 4,
            midi: 0,
            solfege: 'Silencio',
            duration: 'quarter',
            durationBeats: 1,
            startBeat: 0,
            isRest: true
          }
        ]
      },
      {
        id: 'm3',
        number: 3,
        timeSignature: '2/4',
        clef: 'treble',
        notes: []
      }
    ]
  };
}

describe('exportUtils', () => {
  it('genera un archivo MIDI estándar con cabecera MThd y MTrk', () => {
    const project = createSampleProject();
    const bytes = generateMidiFile(project);

    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(30);
    expect(String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3])).toBe('MThd');
    expect(String.fromCharCode(bytes[14], bytes[15], bytes[16], bytes[17])).toBe('MTrk');
  });

  it('genera MusicXML válido escapando caracteres especiales y claves', () => {
    const project = createSampleProject();
    const xml = generateMusicXml(project);

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<work-title>Estudio &lt;1&gt; &amp; Prueba</work-title>');
    expect(xml).toContain('<creator type="composer">Autor &quot;Demo&quot;</creator>');
    expect(xml).toContain('<sign>G</sign>');
    expect(xml).toContain('<harmony>');
    expect(xml).toContain('<alter>1</alter>');
    expect(xml).toContain('<dot/>');
    expect(xml).toContain('<rest/>');

    const bassXml = generateMusicXml({ ...project, clef: 'bass' });
    expect(bassXml).toContain('<sign>F</sign>');
    expect(bassXml).toContain('<line>4</line>');

    const altoXml = generateMusicXml({ ...project, clef: 'alto' });
    expect(altoXml).toContain('<sign>C</sign>');
    expect(altoXml).toContain('<line>3</line>');
  });

  it('dispara la descarga de un Blob y limpia el enlace temporal', () => {
    const createObjectURL = vi.fn(() => 'blob:mock-url');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    downloadFile('contenido', 'score.xml', 'application/xml');

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');

    clickSpy.mockRestore();
    vi.unstubAllGlobals();
  });
});
