/**
 * @file MainSelectionBar.tsx
 * @description Barra principal de selección ubicada inmediatamente antes del diapasón.
 */

import type React from 'react';
import { Layers, Compass, ChevronLeft, ChevronRight } from 'lucide-react';
import { CHORD_TYPES, ROOT_NOTES, SCALE_TYPES } from '../../../constants/music';
import { formatNoteName } from '../../../utils/notation';
import type { ChordResult, NoteNotation } from '../../../types/music.types';

interface MainSelectionBarProps {
  currentTab: 'scales' | 'chords';
  notation: NoteNotation;
  selectedScaleRoot: string;
  onSelectScaleRoot: (root: string) => void;
  selectedScaleId: string;
  onSelectScaleId: (scaleId: string) => void;
  scaleSubMode: 'patterns' | 'root_run';
  onChangeScaleSubMode: (mode: 'patterns' | 'root_run') => void;
  selectedChordRoot: string;
  onSelectChordRoot: (root: string) => void;
  selectedChordSuffix: string;
  onSelectChordSuffix: (suffix: string) => void;
  selectedChordPositionIndex: number;
  onSelectChordPositionIndex: (idx: number) => void;
  allFretboardArpeggio: boolean;
  onToggleAllFretboardArpeggio: (val: boolean) => void;
  chordResult?: ChordResult;
}

export const MainSelectionBar: React.FC<MainSelectionBarProps> = ({
  currentTab,
  notation,
  selectedScaleRoot,
  onSelectScaleRoot,
  selectedScaleId,
  onSelectScaleId,
  scaleSubMode,
  onChangeScaleSubMode,
  selectedChordRoot,
  onSelectChordRoot,
  selectedChordSuffix,
  onSelectChordSuffix,
  selectedChordPositionIndex,
  onSelectChordPositionIndex,
  allFretboardArpeggio,
  onToggleAllFretboardArpeggio,
  chordResult
}) => {
  const diatonicScales = SCALE_TYPES.filter(s => s.category === 'diatonic');
  const pentatonicScales = SCALE_TYPES.filter(s => s.category === 'pentatonic' || s.id === 'blues');
  const greekModes = SCALE_TYPES.filter(s => s.category === 'modes');
  const otherScales = SCALE_TYPES.filter(s => s.category === 'other');

  const totalChordPositions = chordResult?.positions.length || 1;

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3 sm:p-4 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
      {currentTab === 'scales' ? (
        <>
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 focus-within:border-amber-500/80">
              <label
                htmlFor="scale-root-select"
                className="text-slate-400 font-medium whitespace-nowrap"
              >
                Tónica:
              </label>
              <select
                id="scale-root-select"
                value={selectedScaleRoot}
                onChange={e => onSelectScaleRoot(e.target.value)}
                className="bg-transparent text-amber-300 font-bold focus:outline-none cursor-pointer pr-1"
                aria-label="Tónica de la escala"
              >
                {ROOT_NOTES.map(r => (
                  <option key={`scale-root-${r}`} value={r} className="bg-slate-900 text-slate-100">
                    {formatNoteName(r, notation)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 flex-1 min-w-[200px] focus-within:border-amber-500/80">
              <label
                htmlFor="scale-type-select"
                className="text-slate-400 font-medium whitespace-nowrap"
              >
                Escala:
              </label>
              <select
                id="scale-type-select"
                value={selectedScaleId}
                onChange={e => onSelectScaleId(e.target.value)}
                className="bg-transparent text-slate-100 font-semibold focus:outline-none cursor-pointer w-full"
                aria-label="Tipo de escala"
              >
                <optgroup
                  label="Pentatónicas y blues"
                  className="bg-slate-900 font-bold text-amber-400"
                >
                  {pentatonicScales.map(s => (
                    <option
                      key={s.id}
                      value={s.id}
                      className="bg-slate-900 text-slate-100 font-normal"
                    >
                      {s.name}
                    </option>
                  ))}
                </optgroup>

                <optgroup label="Diatónicas" className="bg-slate-900 font-bold text-sky-400">
                  {diatonicScales.map(s => (
                    <option
                      key={s.id}
                      value={s.id}
                      className="bg-slate-900 text-slate-100 font-normal"
                    >
                      {s.name}
                    </option>
                  ))}
                </optgroup>

                <optgroup label="Modos griegos" className="bg-slate-900 font-bold text-emerald-400">
                  {greekModes.map(s => (
                    <option
                      key={s.id}
                      value={s.id}
                      className="bg-slate-900 text-slate-100 font-normal"
                    >
                      {s.name}
                    </option>
                  ))}
                </optgroup>

                {otherScales.length > 0 && (
                  <optgroup
                    label="Jazz y simétricas"
                    className="bg-slate-900 font-bold text-violet-400"
                  >
                    {otherScales.map(s => (
                      <option
                        key={s.id}
                        value={s.id}
                        className="bg-slate-900 text-slate-100 font-normal"
                      >
                        {s.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
          </div>

          <div
            className="flex items-center p-0.5 bg-slate-950 border border-slate-800 rounded-lg shrink-0"
            role="group"
            aria-label="Modo de visualización de escala"
          >
            <button
              type="button"
              onClick={() => onChangeScaleSubMode('patterns')}
              aria-pressed={scaleSubMode === 'patterns'}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                scaleSubMode === 'patterns'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Patrones</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeScaleSubMode('root_run')}
              aria-pressed={scaleSubMode === 'root_run'}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                scaleSubMode === 'root_run'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Desde una tónica</span>
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 w-full">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5">
              <label htmlFor="chord-root-select" className="text-slate-400 font-medium">
                Tónica:
              </label>
              <select
                id="chord-root-select"
                value={selectedChordRoot}
                onChange={e => onSelectChordRoot(e.target.value)}
                className="bg-transparent text-amber-300 font-bold focus:outline-none cursor-pointer"
                aria-label="Tónica del acorde"
              >
                {ROOT_NOTES.map(r => (
                  <option key={`chord-root-${r}`} value={r} className="bg-slate-900 text-slate-100">
                    {formatNoteName(r, notation)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5">
              <label htmlFor="chord-type-select" className="text-slate-400 font-medium">
                Tipo:
              </label>
              <select
                id="chord-type-select"
                value={selectedChordSuffix}
                onChange={e => {
                  onSelectChordSuffix(e.target.value);
                  onSelectChordPositionIndex(0);
                }}
                className="bg-transparent text-slate-100 font-semibold focus:outline-none cursor-pointer"
                aria-label="Tipo de acorde"
              >
                {CHORD_TYPES.map(c => (
                  <option key={c.suffix} value={c.suffix} className="bg-slate-900 text-slate-100">
                    {c.name} {c.symbol ? `(${c.symbol})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1">
              <button
                type="button"
                disabled={selectedChordPositionIndex === 0}
                onClick={() =>
                  onSelectChordPositionIndex(Math.max(0, selectedChordPositionIndex - 1))
                }
                className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Posición anterior"
                aria-label="Posición anterior"
              >
                <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
              <span className="font-mono text-slate-200 px-1 font-medium">
                Posición {selectedChordPositionIndex + 1} de {totalChordPositions}
              </span>
              <button
                type="button"
                disabled={selectedChordPositionIndex >= totalChordPositions - 1}
                onClick={() =>
                  onSelectChordPositionIndex(
                    Math.min(totalChordPositions - 1, selectedChordPositionIndex + 1)
                  )
                }
                className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Siguiente posición"
                aria-label="Siguiente posición"
              >
                <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={allFretboardArpeggio}
              onChange={e => onToggleAllFretboardArpeggio(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
            />
            <span>Arpegio en todo el mástil</span>
          </label>
        </div>
      )}
    </div>
  );
};
