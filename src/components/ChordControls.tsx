/**
 * @file ChordControls.tsx
 * @description Panel de control interactivo para el Modo Acordes:
 * - Selección de tónica (C, C#, D, Eb...)
 * - Selección de tipo de acorde (mayor, menor, 7, maj7, m7, sus2, sus4, dim, aug, add9, m7b5, 9)
 * - Botones para alternar entre todas las posiciones (voicings) disponibles de chords-db
 * - Opción "Arpegio en todo el mástil" para marcar todas las notas del acorde a lo largo del diapasón
 * - Desglose de notas e intervalos calculados con Tonal
 * - Botón de rasgueo y reproducción de acorde
 */

import React from 'react';
import {
  ROOT_NOTES,
  CHORD_TYPES,
  ChordResult
} from '../utils/theory';
import { audioEngine } from '../utils/audio';
import { Volume2, Sparkles, BookOpen } from 'lucide-react';

interface ChordControlsProps {
  selectedRoot: string;
  onSelectRoot: (root: string) => void;
  selectedSuffix: string;
  onSelectSuffix: (suffix: string) => void;
  selectedPositionIndex: number;
  onSelectPositionIndex: (index: number) => void;
  allFretboardArpeggio: boolean;
  onToggleAllFretboardArpeggio: (val: boolean) => void;
  displayMode: 'notes' | 'intervals' | 'fingers';
  onSelectDisplayMode: (mode: 'notes' | 'intervals' | 'fingers') => void;
  chordResult: ChordResult;
}

export const ChordControls: React.FC<ChordControlsProps> = ({
  selectedRoot,
  onSelectRoot,
  selectedSuffix,
  onSelectSuffix,
  selectedPositionIndex,
  onSelectPositionIndex,
  allFretboardArpeggio,
  onToggleAllFretboardArpeggio,
  displayMode,
  onSelectDisplayMode,
  chordResult
}) => {
  const currentChordDef = CHORD_TYPES.find(c => c.suffix === selectedSuffix) || CHORD_TYPES[0];
  const totalPositions = chordResult.positions.length;

  const handleStrum = () => {
    if (!chordResult.currentPosition) return;
    const notesToPlay = chordResult.currentPosition.stringNotes
      .filter(sn => sn.fret >= 0 && sn.midi > 0)
      .map(sn => ({ midi: sn.midi }));
    audioEngine.strumChord(notesToPlay, 35, 'down');
  };

  return (
    <div className="flex flex-col gap-5 w-full bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 sm:p-6 shadow-md">
      {/* 1. Selector de Tónica */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Tónica del acorde
          </label>
          <span className="text-xs font-mono text-amber-400 font-bold">
            Raíz: {selectedRoot}
          </span>
        </div>
        <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
          {ROOT_NOTES.map(root => {
            const isSelected = root === selectedRoot;
            return (
              <button
                key={`chord-root-${root}`}
                onClick={() => {
                  onSelectRoot(root);
                  onSelectPositionIndex(0);
                }}
                className={`py-2 px-1 text-xs font-bold font-mono rounded-lg transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 scale-102 ring-2 ring-amber-400'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                }`}
              >
                {root}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Selector de Tipo de Acorde */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Tipo de acorde
          </label>
          <span className="text-xs text-amber-400 font-mono font-bold">
            {selectedRoot}
            {currentChordDef.symbol || ''} ({currentChordDef.name})
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {CHORD_TYPES.map(chord => {
            const isSelected = chord.suffix === selectedSuffix;
            return (
              <button
                key={`chord-type-${chord.suffix}`}
                onClick={() => {
                  onSelectSuffix(chord.suffix);
                  onSelectPositionIndex(0);
                }}
                className={`px-3 py-2.5 text-xs rounded-lg transition-all cursor-pointer flex flex-col items-start ${
                  isSelected
                    ? 'bg-sky-600 text-white font-semibold shadow-md'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
                }`}
              >
                <span className="font-mono font-bold text-sm">
                  {selectedRoot}
                  {chord.symbol || ''}
                </span>
                <span className="text-[11px] opacity-80 truncate w-full text-left">
                  {chord.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Descripción didáctica del acorde */}
        <p className="text-xs text-slate-400 mt-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
          <span className="font-semibold text-slate-300">{currentChordDef.name}: </span>
          {currentChordDef.description}
        </p>
      </div>

      {/* 3. Posiciones de chords-db y Modos de visualización */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Botones de Posición (Voicings) */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-400 mr-1">
              Posiciones ({totalPositions} disponibles):
            </span>

            {chordResult.positions.map((pos, idx) => {
              const isSelected = idx === selectedPositionIndex && !allFretboardArpeggio;
              return (
                <button
                  key={`chord-pos-btn-${idx}`}
                  onClick={() => {
                    onSelectPositionIndex(idx);
                    if (allFretboardArpeggio) onToggleAllFretboardArpeggio(false);
                  }}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 shadow-md ring-1 ring-amber-300'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                  }`}
                >
                  Posición {idx + 1}
                  {pos.baseFret > 1 ? ` (traste ${pos.baseFret})` : ' (abierto)'}
                </button>
              );
            })}
          </div>

          {/* Botón de rasgueo */}
          <button
            onClick={handleStrum}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Volume2 className="w-4 h-4" />
            <span>Rasguear posición</span>
          </button>
        </div>

        {/* Controles de visualización (Arpegio en todo el mástil y Etiquetas) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs">
          {/* Toggle Arpegio en todo el mástil */}
          <button
            onClick={() => onToggleAllFretboardArpeggio(!allFretboardArpeggio)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border font-semibold transition-all cursor-pointer ${
              allFretboardArpeggio
                ? 'bg-sky-600 text-white border-sky-500 shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Arpegio en todo el mástil</span>
          </button>

          {/* Toggle Etiqueta (Notas vs Intervalos vs Dedos) */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Mostrar en el mástil y diagrama:</span>
            <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800">
              <button
                onClick={() => onSelectDisplayMode('notes')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  displayMode === 'notes'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Notas (C, E...)
              </button>
              <button
                onClick={() => onSelectDisplayMode('intervals')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  displayMode === 'intervals'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Intervalos (1, 3, 5...)
              </button>
              <button
                onClick={() => onSelectDisplayMode('fingers')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  displayMode === 'fingers'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Dedos (1, 2...)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Notas e Intervalos que forman el acorde (Tonal) */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-slate-300">
            Notas de {chordResult.chordName} ({chordResult.symbol}):
          </span>
          <div className="flex flex-wrap gap-1 font-mono">
            {chordResult.notes.map((n, i) => (
              <span
                key={`chord-note-${n}-${i}`}
                className={`px-2 py-0.5 rounded ${
                  n === selectedRoot
                    ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                    : 'bg-slate-800 text-slate-300 border border-slate-700/60'
                }`}
              >
                {n}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">Intervalos:</span>
          <div className="flex flex-wrap gap-1 font-mono text-slate-400">
            {chordResult.intervals.map((inv, i) => (
              <span key={`chord-inv-${inv}-${i}`} className="text-slate-300">
                {inv}{i < chordResult.intervals.length - 1 ? ' ·' : ''}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
