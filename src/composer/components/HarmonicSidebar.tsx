/**
 * @file HarmonicSidebar.tsx
 * @description Panel lateral izquierdo con 4 pestañas profesionales de composición:
 * 1. Tonalidades y Progresiones (Armaduras, grados I-vii°, funciones y presets)
 * 2. Explorador Inteligente de Acordes (Tríadas, 7mas, tensiones, inversiones e inserción)
 * 3. Explorador y Generador de Escalas (13+ escalas, fórmulas, acordes compatibles y generador melódico)
 * 4. Asistente Armónico Inteligente (Notas guía, tensiones, notas a evitar y escalas recomendadas)
 */

import React, { useState } from 'react';
import {
  KeySignatureInfo,
  DiatonicChordInfo,
  ScaleDefinition,
  HarmonicAssistantInfo,
  ClefType,
  ScoreChord,
  ScoreNote,
  NoteDuration
} from '../types';
import { Note } from 'tonal';
import {
  getDiatonicChords,
  getScaleDefinitions,
  getHarmonicAssistant,
  createVoicingForChord,
  createScoreNoteFromPitch,
  STEP_INDEX
} from '../musicTheoryEngine';
import { composerAudio } from '../composerAudio';
import { getSolfege, NoteNotation, formatNoteName, formatChordSymbol } from '../../utils/theory';
import {
  Volume2,
  Plus,
  Play,
  ArrowRight
} from 'lucide-react';

interface HarmonicSidebarProps {
  keyInfo: KeySignatureInfo;
  notation: NoteNotation;
  onChangeKey: (tonic: string, mode: 'major' | 'minor') => void;
  clef: ClefType;
  selectedMeasureIndex: number;
  onApplyChordToMeasure: (chord: ScoreChord, measureIndex: number) => void;
  onApplyProgressionToMeasures: (chordSymbols: string[]) => void;
  onInsertScaleNotesToStaff: (notes: string[], octave: number, duration: NoteDuration) => void;
}

const TONIC_VALUES = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'F', 'Bb', 'Eb', 'Ab', 'Db'];

export const HarmonicSidebar: React.FC<HarmonicSidebarProps> = ({
  keyInfo,
  notation,
  onChangeKey,
  clef,
  selectedMeasureIndex,
  onApplyChordToMeasure,
  onApplyProgressionToMeasures,
  onInsertScaleNotesToStaff
}) => {
  const [activeTab, setActiveTab] = useState<'tonality' | 'chords' | 'scales' | 'assistant'>('tonality');

  // Cálculos dinámicos mediante el motor de teoría
  const diatonicChords = React.useMemo(() => {
    return getDiatonicChords(keyInfo.tonic, keyInfo.mode, clef);
  }, [keyInfo.tonic, keyInfo.mode, clef]);

  const scaleDefinitions = React.useMemo(() => {
    return getScaleDefinitions(keyInfo.tonic, notation);
  }, [keyInfo.tonic, notation]);

  // Estado del Explorador de Acordes
  const [chordRoot, setChordRoot] = useState<string>(keyInfo.tonic);
  const [chordType, setChordType] = useState<string>('major');
  const [chordInversion, setChordInversion] = useState<number>(0);

  // Acorde activo para el explorador
  const activeExplorerSymbol = React.useMemo(() => {
    switch (chordType) {
      case 'major': return chordRoot;
      case 'minor': return `${chordRoot}m`;
      case 'diminished': return `${chordRoot}dim`;
      case 'dim7': return `${chordRoot}dim7`;
      case 'augmented': return `${chordRoot}aug`;
      case 'sus2': return `${chordRoot}sus2`;
      case 'sus4': return `${chordRoot}sus4`;
      case 'maj7': return `${chordRoot}maj7`;
      case 'm7': return `${chordRoot}m7`;
      case 'mmaj7': return `${chordRoot}mMaj7`;
      case 'dom7': return `${chordRoot}7`;
      case 'm7b5': return `${chordRoot}m7b5`;
      case '9': return `${chordRoot}9`;
      case '11': return `${chordRoot}11`;
      case '13': return `${chordRoot}13`;
      default: return chordRoot;
    }
  }, [chordRoot, chordType]);

  const activeAssistantInfo: HarmonicAssistantInfo = React.useMemo(() => {
    return getHarmonicAssistant(activeExplorerSymbol, notation);
  }, [activeExplorerSymbol, notation]);

  // Estado de Inserción de Escala
  const [selectedScaleIndex, setSelectedScaleIndex] = useState<number>(0);
  const [scaleInsertOctave, setScaleInsertOctave] = useState<number>(4);
  const [scaleInsertDuration, setScaleInsertDuration] = useState<NoteDuration>('quarter');

  // Reproducir acorde activo del explorador
  const handleAuditionExplorerChord = () => {
    const voicing = createVoicingForChord(activeExplorerSymbol, clef, chordInversion);
    composerAudio.playChord(voicing.midis, 1.2, 30);
  };

  // Insertar acorde en el compás seleccionado
  const handleInsertExplorerChord = () => {
    const voicing = createVoicingForChord(activeExplorerSymbol, clef, chordInversion);
    const scoreChord: ScoreChord = {
      id: `chord-${Date.now()}`,
      symbol: activeExplorerSymbol,
      name: `${getSolfege(chordRoot)} ${chordType}`,
      solfege: `${getSolfege(chordRoot)}${activeExplorerSymbol.slice(chordRoot.length)}`,
      inversion: chordInversion,
      pitches: voicing.pitches,
      midis: voicing.midis,
      startBeat: 0,
      durationBeats: 4
    };
    onApplyChordToMeasure(scoreChord, selectedMeasureIndex);
  };

  return (
    <aside className="w-full lg:w-80 shrink-0 bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col text-xs">
      {/* Selector de pestañas */}
      <div className="grid grid-cols-4 bg-slate-950 border-b border-slate-800 p-1 gap-1 text-[11px] font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('tonality')}
          className={`py-1.5 px-1 rounded text-center transition-colors cursor-pointer ${
            activeTab === 'tonality' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
          }`}
          title="Tonalidades y Progresiones"
        >
          Tonalidad
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('chords')}
          className={`py-1.5 px-1 rounded text-center transition-colors cursor-pointer ${
            activeTab === 'chords' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
          }`}
          title="Explorador de Acordes"
        >
          Acordes
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('scales')}
          className={`py-1.5 px-1 rounded text-center transition-colors cursor-pointer ${
            activeTab === 'scales' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
          }`}
          title="Explorador de Escalas"
        >
          Escalas
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('assistant')}
          className={`py-1.5 px-1 rounded text-center transition-colors cursor-pointer ${
            activeTab === 'assistant' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
          }`}
          title="Asistente Armónico Inteligente"
        >
          Asistente
        </button>
      </div>

      {/* CONTENIDO DE PESTAÑAS */}
      <div className="p-3 sm:p-4 flex-1 overflow-y-auto max-h-[620px] flex flex-col gap-4">
        {/* PESTAÑA 1: TONALIDAD Y PROGRESIONES */}
        {activeTab === 'tonality' && (
          <div className="flex flex-col gap-3.5">
            {/* Selector de Tónica y Modo */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-400 font-semibold text-[11px]">Tonalidad activa:</label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={keyInfo.tonic}
                  onChange={(e) => onChangeKey(e.target.value, keyInfo.mode === 'minor' ? 'minor' : 'major')}
                  className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-bold focus:ring-1 focus:ring-amber-500"
                >
                  {TONIC_VALUES.map(val => (
                    <option key={val} value={val}>{formatNoteName(val, notation)}</option>
                  ))}
                </select>

                <div className="flex bg-slate-950 rounded-lg p-0.5 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => onChangeKey(keyInfo.tonic, 'major')}
                    className={`flex-1 py-1 rounded text-xs font-semibold cursor-pointer ${
                      keyInfo.mode === 'major' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Mayor
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeKey(keyInfo.tonic, 'minor')}
                    className={`flex-1 py-1 rounded text-xs font-semibold cursor-pointer ${
                      keyInfo.mode === 'minor' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Menor
                  </button>
                </div>
              </div>

              {/* Datos calculados de armadura */}
              <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80 text-[11px] flex flex-col gap-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Armadura:</span>
                  <span className="font-mono font-bold text-amber-400">
                    {keyInfo.accidentalCount === 0
                      ? 'Sin alteraciones (0)'
                      : `${Math.abs(keyInfo.accidentalCount)} ${keyInfo.accidentalCount > 0 ? 'sostenido(s)' : 'bemol(es)'} (${keyInfo.accidentals.map(a => formatNoteName(a, notation)).join(', ')})`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Notas escala:</span>
                  <span className="font-mono text-slate-200">{keyInfo.scaleNotes.map(n => formatNoteName(n, notation)).join(' · ')}</span>
                </div>
              </div>
            </div>

            {/* Progresiones Predefinidas */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-400 font-semibold text-[11px]">Progresiones populares:</label>
              <div className="flex flex-col gap-1.5">
                {(keyInfo.mode === 'minor'
                  ? [
                      { name: 'Épica / Pop Menor (i - VI - III - VII)', chords: ['i', 'VI', 'III', 'VII'] },
                      { name: 'Menor Natural (i - iv - v - i)', chords: ['i', 'iv', 'v', 'i'] },
                      { name: 'Armónica Clásica (i - iv - V7 - i)', chords: ['i', 'iv', 'V7 (Armónica)', 'i'] },
                      { name: 'Cadencia Jazz Menor (ii° - V7 - i)', chords: ['ii°', 'V7 (Armónica)', 'i'] },
                      { name: 'Andaluza (i - VII - VI - V7)', chords: ['i', 'VII', 'VI', 'V7 (Armónica)'] }
                    ]
                  : [
                      { name: 'Pop Universal (I - V - vi - IV)', chords: ['I', 'V', 'vi', 'IV'] },
                      { name: 'Clásica / Rock (I - IV - V - I)', chords: ['I', 'IV', 'V', 'I'] },
                      { name: 'Jazz Cadence (ii - V - I)', chords: ['ii', 'V', 'I'] },
                      { name: 'Doo-Wop (I - vi - IV - V)', chords: ['I', 'vi', 'IV', 'V'] },
                      { name: 'Dramática (vi - IV - I - V)', chords: ['vi', 'IV', 'I', 'V'] }
                    ]
                ).map(preset => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => onApplyProgressionToMeasures(preset.chords)}
                    className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800/80 hover:border-amber-500/40 text-left transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="font-bold text-slate-200 group-hover:text-amber-400">{preset.name}</div>
                      <div className="text-[10px] text-slate-500">Aplica a los compases automáticamente</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ))}
              </div>
            </div>

            {/* Grados Diatónicos calculados */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-400 font-semibold text-[11px]">Acordes diatónicos calculados:</label>
              <div className="grid grid-cols-1 gap-1.5">
                {diatonicChords.map(c => (
                  <div
                    key={`${c.numeral}-${c.symbol}`}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-8 px-1 py-0.5 rounded bg-slate-900 border border-slate-800 text-center font-mono font-bold text-amber-400 text-[11px]">
                        {c.numeral}
                      </span>
                      <div>
                        <div className="font-bold text-slate-200">{formatChordSymbol(c.symbol, notation)}</div>
                        <div className="text-[10px] text-slate-400">{c.notes.map(n => formatNoteName(n, notation)).join(' - ')}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => composerAudio.playChord(c.midis, 1.0, 25)}
                        className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                        title="Escuchar acorde"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const scoreChord: ScoreChord = {
                            id: `chord-${Date.now()}`,
                            symbol: c.symbol,
                            name: c.name,
                            solfege: c.solfege,
                            romanNumeral: c.numeral,
                            harmonicFunction: c.harmonicFunction,
                            pitches: c.suggestedPitches,
                            midis: c.midis,
                            startBeat: 0,
                            durationBeats: 4
                          };
                          onApplyChordToMeasure(scoreChord, selectedMeasureIndex);
                        }}
                        className="px-2 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] cursor-pointer"
                        title={`Insertar en compás ${selectedMeasureIndex + 1}`}
                      >
                        + Compás {selectedMeasureIndex + 1}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 2: EXPLORADOR INTELIGENTE DE ACORDES */}
        {activeTab === 'chords' && (
          <div className="flex flex-col gap-3.5">
            {/* Tónica del Acorde */}
            <div className="flex flex-col gap-1">
              <label className="text-slate-400 font-semibold text-[11px]">Tónica del acorde:</label>
              <select
                value={chordRoot}
                onChange={(e) => setChordRoot(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-bold"
              >
                {TONIC_VALUES.map(val => (
                  <option key={val} value={val}>{formatNoteName(val, notation)}</option>
                ))}
              </select>
            </div>

            {/* Tipo / Cualidad del Acorde */}
            <div className="flex flex-col gap-1">
              <label className="text-slate-400 font-semibold text-[11px]">Tipo de acorde:</label>
              <div className="grid grid-cols-3 gap-1 text-[11px]">
                {[
                  { id: 'major', label: 'Mayor' },
                  { id: 'minor', label: 'Menor' },
                  { id: 'diminished', label: 'Disminuido' },
                  { id: 'dim7', label: 'dim7' },
                  { id: 'augmented', label: 'Aumentado' },
                  { id: 'sus2', label: 'Sus2' },
                  { id: 'sus4', label: 'Sus4' },
                  { id: 'maj7', label: 'Maj7' },
                  { id: 'm7', label: 'm7' },
                  { id: 'mmaj7', label: 'mMaj7' },
                  { id: 'dom7', label: '7 (Dom)' },
                  { id: 'm7b5', label: 'm7b5' },
                  { id: '9', label: '9na' },
                  { id: '11', label: '11na' },
                  { id: '13', label: '13na' }
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setChordType(t.id)}
                    className={`py-1.5 px-1 rounded font-semibold cursor-pointer border text-center transition-colors ${
                      chordType === t.id
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Inversión del Acorde */}
            <div className="flex flex-col gap-1">
              <label className="text-slate-400 font-semibold text-[11px]">Inversión:</label>
              <div className="grid grid-cols-4 gap-1 text-[11px]">
                {[
                  { inv: 0, label: 'Fund.' },
                  { inv: 1, label: '1.ª inv' },
                  { inv: 2, label: '2.ª inv' },
                  { inv: 3, label: '3.ª inv' }
                ].map(item => (
                  <button
                    key={item.inv}
                    type="button"
                    onClick={() => setChordInversion(item.inv)}
                    className={`py-1 rounded font-semibold cursor-pointer text-center ${
                      chordInversion === item.inv
                        ? 'bg-sky-500 text-slate-950 font-bold'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tarjeta de Resumen del Acorde */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-base font-bold text-amber-400">{formatChordSymbol(activeExplorerSymbol, notation)}</div>
                  <div className="text-[11px] text-slate-400">{formatNoteName(chordRoot, notation)} {chordType}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleAuditionExplorerChord}
                    className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-amber-400 cursor-pointer"
                    title="Escuchar sonido"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-slate-300">
                <span className="text-slate-500">Notas reales: </span>
                <span className="font-mono font-bold text-sky-400">
                  {activeAssistantInfo.chordNotes.map(n => formatNoteName(n, notation)).join(' · ')}
                </span>
              </div>

              <button
                type="button"
                onClick={handleInsertExplorerChord}
                className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all mt-1"
              >
                <Plus className="w-4 h-4" />
                <span>Insertar en Compás {selectedMeasureIndex + 1}</span>
              </button>
            </div>
          </div>
        )}

        {/* PESTAÑA 3: EXPLORADOR Y GENERADOR DE ESCALAS */}
        {activeTab === 'scales' && (
          <div className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1">
              <label className="text-slate-400 font-semibold text-[11px]">Seleccionar escala:</label>
              <select
                value={selectedScaleIndex}
                onChange={(e) => setSelectedScaleIndex(parseInt(e.target.value, 10))}
                className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-bold"
              >
                {scaleDefinitions.map((s, idx) => (
                  <option key={s.id} value={idx}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Ficha técnica de la escala seleccionada */}
            {scaleDefinitions[selectedScaleIndex] && (() => {
              const curScale = scaleDefinitions[selectedScaleIndex];
              let runningOct = scaleInsertOctave;
              const scaleMidis = curScale.notes.map((n, i) => {
                if (i > 0) {
                  const prevStep = STEP_INDEX[curScale.notes[i - 1][0].toUpperCase()] ?? 0;
                  const curStep = STEP_INDEX[n[0].toUpperCase()] ?? 0;
                  if (curStep <= prevStep) runningOct++;
                }
                return Note.midi(`${n}${runningOct}`) ?? (60 + i);
              });
              if (scaleMidis.length > 0) {
                scaleMidis.push(scaleMidis[0] + 12);
              }

              return (
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400">{curScale.name}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          composerAudio.playScale(scaleMidis, 0.28, 'ascending');
                        }}
                        className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-amber-400 cursor-pointer"
                        title="Escuchar escala ascendente"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">{curScale.description}</p>

                  <div className="bg-slate-900/60 p-2 rounded border border-slate-800/80 flex flex-col gap-1 text-[11px]">
                    <div>
                      <span className="text-slate-500">Fórmula: </span>
                      <span className="font-mono text-amber-300 font-bold">{curScale.formula}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Notas: </span>
                      <span className="font-mono text-sky-300">{curScale.notes.map(n => formatNoteName(n, notation)).join(' · ')}</span>
                    </div>
                  </div>

                  {/* Parámetros para insertar notas en el pentagrama */}
                  <div className="flex flex-col gap-2 pt-1 border-t border-slate-800/80">
                    <label className="text-slate-400 font-semibold text-[11px]">Insertar notas en partitura:</label>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-500 block mb-0.5">Octava:</span>
                        <select
                          value={scaleInsertOctave}
                          onChange={(e) => setScaleInsertOctave(parseInt(e.target.value, 10))}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-slate-200"
                        >
                          <option value={3}>Octava 3 (Grave)</option>
                          <option value={4}>Octava 4 (Media)</option>
                          <option value={5}>Octava 5 (Aguda)</option>
                        </select>
                      </div>

                      <div>
                        <span className="text-slate-500 block mb-0.5">Figura rítmica:</span>
                        <select
                          value={scaleInsertDuration}
                          onChange={(e) => setScaleInsertDuration(e.target.value as NoteDuration)}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-slate-200"
                        >
                          <option value="quarter">Negra (𝅘𝅥)</option>
                          <option value="eighth">Corchea (𝅘𝅥𝅮)</option>
                          <option value="half">Blanca (𝅗𝅥)</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onInsertScaleNotesToStaff(curScale.notes, scaleInsertOctave, scaleInsertDuration)}
                      className="w-full py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all mt-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Distribuir en Pentagrama</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* PESTAÑA 4: ASISTENTE ARMÓNICO INTELIGENTE */}
        {activeTab === 'assistant' && (
          <div className="flex flex-col gap-3">
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] flex flex-col gap-1.5">
              <span className="text-slate-400">Analizando contexto para:</span>
              <span className="text-base font-bold text-amber-400">{formatChordSymbol(activeAssistantInfo.chordSymbol, notation)}</span>
            </div>

            {/* Notas Guía */}
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex flex-col gap-1">
              <span className="font-semibold text-emerald-400">Notas guía esenciales (3ra y 7ma):</span>
              <p className="text-[11px] text-slate-300 font-mono">
                {activeAssistantInfo.guideTones.length > 0
                  ? activeAssistantInfo.guideTones.map(n => formatNoteName(n, notation)).join(' · ')
                  : 'Tónica y 5ta'}
              </p>
              <span className="text-[10px] text-slate-500">Definen la cualidad y dirección tonal del acorde.</span>
            </div>

            {/* Tensiones armónicas */}
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex flex-col gap-1">
              <span className="font-semibold text-sky-400">Tensiones disponibles para improvisar:</span>
              <p className="text-[11px] text-slate-300 font-mono">
                {activeAssistantInfo.tensions.join(' · ')}
              </p>
            </div>

            {/* Notas a evitar */}
            {activeAssistantInfo.avoidNotes.length > 0 && (
              <div className="bg-slate-950 p-2.5 rounded-lg border border-rose-900/50 flex flex-col gap-1">
                <span className="font-semibold text-rose-400">Notas a evitar en tiempo fuerte:</span>
                <p className="text-[11px] text-rose-300/90 leading-tight">
                  {activeAssistantInfo.avoidNotes.join(' · ')}
                </p>
              </div>
            )}

            {/* Escalas compatibles clasificadas */}
            <div className="flex flex-col gap-1.5">
              <span className="text-slate-400 font-semibold text-[11px]">Escalas compatibles recomendadas:</span>
              <div className="flex flex-col gap-1.5">
                {activeAssistantInfo.primaryScales.map(sc => (
                  <div key={sc.name} className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="font-bold text-slate-200">{sc.name}</div>
                    <div className="text-[10px] text-amber-400/90">{sc.type}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{sc.notes.map(n => formatNoteName(n, notation)).join(' · ')}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
