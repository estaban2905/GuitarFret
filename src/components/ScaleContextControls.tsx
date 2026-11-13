/**
 * @file ScaleContextControls.tsx
 * @description Controles contextuales compactos ubicados debajo del diapasón:
 * - Muestra únicamente los controles del modo activo
 * - Modo Desde una tónica: Inicio, Sentido, Extensión y Digitación alternativa (si existe >1)
 * - Modo Patrones: Sistema (CAGED/3NPS) y Posiciones (Todo el mástil, Posición 1..5)
 * - Barra compacta de Reproducción con selector de BPM integrado
 * - Menú desplegable "Visualización" (Etiquetas: Notas / Intervalos / Pasos o Dedos, y Ocultar notas fuera de foco)
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  ScaleSystem,
  ScaleResult,
  ScaleRunResult,
  RootOccurrence,
  NoteNotation,
  formatNoteName,
  formatPitchName
} from '../utils/theory';
import { Play, Square, Eye, ChevronDown } from 'lucide-react';

interface ScaleContextControlsProps {
  notation: NoteNotation;
  scaleSubMode: 'patterns' | 'root_run';
  // Desde una tónica
  scaleRunResult: ScaleRunResult;
  rootOccurrences: RootOccurrence[];
  selectedStartOccurrence: RootOccurrence | null;
  onSelectStartOccurrence: (occ: RootOccurrence) => void;
  runDirection: 'ascending' | 'descending';
  onChangeRunDirection: (dir: 'ascending' | 'descending') => void;
  runSpan: '1_octave' | '2_octaves';
  onChangeRunSpan: (span: '1_octave' | '2_octaves') => void;
  selectedVariationIndex: number;
  onSelectVariationIndex: (idx: number) => void;
  // Patrones
  system: ScaleSystem;
  onSelectSystem: (sys: ScaleSystem) => void;
  selectedPosition: number | null;
  onSelectPosition: (pos: number | null) => void;
  scaleResult: ScaleResult;
  isDiatonic: boolean;
  // Visualización agrupada
  displayMode: 'notes' | 'intervals' | 'steps' | 'fingers';
  onChangeDisplayMode: (mode: 'notes' | 'intervals' | 'steps' | 'fingers') => void;
  hideOutside: boolean;
  onToggleHideOutside: (val: boolean) => void;
  // Reproducción
  isPlaying: boolean;
  bpm: number;
  onChangeBpm: (bpm: number) => void;
  onTogglePlay: () => void;
}

export const ScaleContextControls: React.FC<ScaleContextControlsProps> = ({
  notation,
  scaleSubMode,
  scaleRunResult,
  rootOccurrences,
  selectedStartOccurrence,
  onSelectStartOccurrence,
  runDirection,
  onChangeRunDirection,
  runSpan,
  onChangeRunSpan,
  selectedVariationIndex,
  onSelectVariationIndex,
  system,
  onSelectSystem,
  selectedPosition,
  onSelectPosition,
  scaleResult,
  isDiatonic,
  displayMode,
  onChangeDisplayMode,
  hideOutside,
  onToggleHideOutside,
  isPlaying,
  bpm,
  onChangeBpm,
  onTogglePlay
}) => {
  const [isVisualOpen, setIsVisualOpen] = useState(false);
  const visualRef = useRef<HTMLDivElement>(null);

  // Cerrar desplegable al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (visualRef.current && !visualRef.current.contains(e.target as Node)) {
        setIsVisualOpen(false);
      }
    };
    if (isVisualOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isVisualOpen]);

  const canDescend = scaleRunResult.availableDirections.find(d => d.id === 'descending')?.available ?? false;
  const canAscend2Octaves = scaleRunResult.availableSpans.find(s => s.id === '2_octaves')?.available ?? false;

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3 sm:p-4 shadow-md flex flex-col gap-3 text-xs">
      {/* 1. Fila de Controles Contextuales del Modo Activo */}
      {scaleSubMode === 'root_run' ? (
        /* MODO: DESDE UNA TÓNICA */
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Selector de Inicio legible */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5">
            <span className="text-slate-400 font-medium whitespace-nowrap">Inicio:</span>
            <select
              value={selectedStartOccurrence ? `${selectedStartOccurrence.string}-${selectedStartOccurrence.fret}` : ''}
              onChange={e => {
                const [s, f] = e.target.value.split('-').map(Number);
                const found = rootOccurrences.find(o => o.string === s && o.fret === f);
                if (found) onSelectStartOccurrence(found);
              }}
              className="bg-transparent text-amber-300 font-bold focus:outline-none cursor-pointer"
              aria-label="Aparición de tónica inicial"
            >
              {rootOccurrences.map(occ => (
                <option
                  key={`root-run-opt-${occ.string}-${occ.fret}`}
                  value={`${occ.string}-${occ.fret}`}
                  className="bg-slate-900 text-slate-100"
                >
                  {occ.string}.ª cuerda · traste {occ.fret} · {formatNoteName(occ.noteName, notation)} {occ.fret === 0 ? '(al aire)' : `(${formatPitchName(occ.pitch, notation)})`}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Sentido */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => onChangeRunDirection('ascending')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                runDirection === 'ascending'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Ascendente ↑
            </button>
            <button
              type="button"
              disabled={!canDescend}
              onClick={() => onChangeRunDirection('descending')}
              title={!canDescend ? 'Rango insuficiente para 1 octava descendente' : undefined}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                runDirection === 'descending'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : !canDescend
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Descendente ↓
            </button>
          </div>

          {/* Selector de Extensión */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => onChangeRunSpan('1_octave')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                runSpan === '1_octave'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              1 octava
            </button>
            <button
              type="button"
              disabled={!canAscend2Octaves}
              onClick={() => onChangeRunSpan('2_octaves')}
              title={!canAscend2Octaves ? 'Requiere tónicas en cuerdas 6.ª, 5.ª o 4.ª' : undefined}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                runSpan === '2_octaves'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : !canAscend2Octaves
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              2 octavas
            </button>
          </div>

          {/* Selector compacto de digitaciones alternativas (oculto si solo hay 1) */}
          {scaleRunResult.variations.length > 1 && (
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5">
              <span className="text-slate-400 font-medium whitespace-nowrap">Digitación:</span>
              <select
                value={selectedVariationIndex}
                onChange={e => onSelectVariationIndex(Number(e.target.value))}
                className="bg-transparent text-sky-300 font-semibold focus:outline-none cursor-pointer max-w-[210px] truncate"
                aria-label="Digitaciones alternativas"
              >
                {scaleRunResult.variations.map((v, idx) => (
                  <option key={v.id} value={idx} className="bg-slate-900 text-slate-100">
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {scaleRunResult.errorMessage && (
            <div className="w-full p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-300">
              {scaleRunResult.errorMessage}
            </div>
          )}
        </div>
      ) : (
        /* MODO: PATRONES */
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Selector de Sistema si la escala es diatónica */}
          {isDiatonic && (
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => {
                  onSelectSystem('CAGED');
                  if (selectedPosition && selectedPosition > 5) onSelectPosition(1);
                }}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                  system === 'CAGED'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                CAGED (5)
              </button>
              <button
                type="button"
                onClick={() => onSelectSystem('TNPS')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                  system === 'TNPS'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                3NPS (7)
              </button>
            </div>
          )}

          {/* Botones de Posición / Cajas */}
          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => onSelectPosition(null)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                selectedPosition === null
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-sm'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
              }`}
            >
              Todo el mástil
            </button>
            {scaleResult.availableBoxes.map(box => {
              const isSelected = selectedPosition === box.index;
              return (
                <button
                  key={`pat-pos-${box.index}`}
                  type="button"
                  onClick={() => onSelectPosition(box.index)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                  }`}
                  title={`${box.label}: ${box.shapeName || `Trastes ${box.minFret}–${box.maxFret}`}`}
                >
                  {box.label}
                  {box.shapeName ? ` (${box.shapeName.replace('Forma ', '')})` : ''}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Barra de Reproducción y Desplegable Visualización */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-800/80">
        {/* Reproducción con BPM integrado */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onTogglePlay}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              isPlaying
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-md'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
            }`}
          >
            {isPlaying ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isPlaying ? 'Detener' : 'Reproducir'}</span>
          </button>

          {/* Selector compacto de BPM */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1">
            <span className="text-[11px] text-slate-500">Tempo:</span>
            <select
              value={bpm}
              onChange={e => onChangeBpm(Number(e.target.value))}
              className="bg-transparent text-slate-200 font-mono text-xs font-semibold focus:outline-none cursor-pointer"
              aria-label="Velocidad de reproducción"
            >
              <option value={90} className="bg-slate-900 text-slate-100">90 BPM</option>
              <option value={120} className="bg-slate-900 text-slate-100">120 BPM</option>
              <option value={150} className="bg-slate-900 text-slate-100">150 BPM</option>
            </select>
          </div>
        </div>

        {/* Desplegable Visualización */}
        <div className="relative" ref={visualRef}>
          <button
            type="button"
            onClick={() => setIsVisualOpen(!isVisualOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-expanded={isVisualOpen}
          >
            <Eye className="w-3.5 h-3.5 text-sky-400" />
            <span>Visualización</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isVisualOpen && (
            <div className="absolute right-0 bottom-full mb-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-3 z-30 flex flex-col gap-3 animate-in fade-in duration-150">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Mostrar en diapasón
                </span>
                <div className="grid grid-cols-3 gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => onChangeDisplayMode('notes')}
                    className={`py-1 text-xs font-medium rounded transition-all cursor-pointer ${
                      displayMode === 'notes' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Notas
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeDisplayMode('intervals')}
                    className={`py-1 text-xs font-medium rounded transition-all cursor-pointer ${
                      displayMode === 'intervals' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Intervalos
                  </button>
                  {scaleSubMode === 'root_run' ? (
                    <button
                      type="button"
                      onClick={() => onChangeDisplayMode('steps')}
                      className={`py-1 text-xs font-medium rounded transition-all cursor-pointer ${
                        displayMode === 'steps' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Pasos
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onChangeDisplayMode('fingers')}
                      className={`py-1 text-xs font-medium rounded transition-all cursor-pointer ${
                        displayMode === 'fingers' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Dedos
                    </button>
                  )}
                </div>
              </div>

              <label className="flex items-center gap-2 pt-2 border-t border-slate-800/80 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hideOutside}
                  onChange={e => onToggleHideOutside(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
                />
                <span>
                  {scaleSubMode === 'root_run'
                    ? 'Ocultar notas fuera del recorrido'
                    : 'Ocultar notas fuera de la caja'}
                </span>
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
