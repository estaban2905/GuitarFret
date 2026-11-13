/**
 * @file ScaleControls.tsx
 * @description Panel de control interactivo para el Modo Escalas:
 * - Selección de modo: "Patrones (CAGED / 3NPS)" o "Desde una tónica"
 * - Selección de tónica (C, C#, D, Eb...)
 * - Selección de escala organizada por familias (Diatónicas, Pentatónicas, Modos Griegos)
 * - Modo Patrones: alternancia entre sistema CAGED y 3 Notas Por Cuerda (3NPS),
 *   botones de Posición / Cajas ordenadas secuencialmente, alternancia de etiquetas y reproducción.
 * - Modo Desde una tónica: integración de ScaleRootRunControls.
 */

import React, { useState } from 'react';
import {
  ROOT_NOTES,
  SCALE_TYPES,
  ScaleSystem,
  ScaleResult,
  ScaleRunResult,
  RootOccurrence
} from '../utils/theory';
import { audioEngine } from '../utils/audio';
import { ScaleRootRunControls } from './ScaleRootRunControls';
import { Play, Square, Music, Layers, Compass } from 'lucide-react';

interface ScaleControlsProps {
  selectedRoot: string;
  onSelectRoot: (root: string) => void;
  selectedScaleId: string;
  onSelectScale: (scaleId: string) => void;
  // Modo de visualización de escalas: 'patterns' o 'root_run'
  scaleSubMode: 'patterns' | 'root_run';
  onChangeScaleSubMode: (mode: 'patterns' | 'root_run') => void;
  // Props para modo Patrones
  system: ScaleSystem;
  onSelectSystem: (system: ScaleSystem) => void;
  selectedPosition: number | null; // null = todo el mástil
  onSelectPosition: (pos: number | null) => void;
  displayMode: 'notes' | 'intervals' | 'fingers';
  onSelectDisplayMode: (mode: 'notes' | 'intervals' | 'fingers') => void;
  scaleResult: ScaleResult;
  highlightOnlyBox: boolean;
  onToggleHighlightOnlyBox: (val: boolean) => void;
  onActivePlayingMidiChange: (midi: number | null) => void;
  // Props para modo "Desde una tónica"
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
  runDisplayMode: 'steps' | 'notes' | 'intervals' | 'fingers';
  onChangeRunDisplayMode: (mode: 'steps' | 'notes' | 'intervals' | 'fingers') => void;
  hideOutsideRun: boolean;
  onToggleHideOutsideRun: (hide: boolean) => void;
  onActiveStepIndexChange?: (idx: number | null) => void;
}

export const ScaleControls: React.FC<ScaleControlsProps> = ({
  selectedRoot,
  onSelectRoot,
  selectedScaleId,
  onSelectScale,
  scaleSubMode,
  onChangeScaleSubMode,
  system,
  onSelectSystem,
  selectedPosition,
  onSelectPosition,
  displayMode,
  onSelectDisplayMode,
  scaleResult,
  highlightOnlyBox,
  onToggleHighlightOnlyBox,
  onActivePlayingMidiChange,
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
  runDisplayMode,
  onChangeRunDisplayMode,
  hideOutsideRun,
  onToggleHideOutsideRun,
  onActiveStepIndexChange
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const cancelPlaybackRef = React.useRef<(() => void) | null>(null);

  const currentScaleDef = SCALE_TYPES.find(s => s.id === selectedScaleId) || SCALE_TYPES[0];
  const isPentatonicOrBlues = currentScaleDef.category === 'pentatonic' || selectedScaleId === 'blues';

  // Usar las cajas disponibles calculadas en theory.ts
  const availableBoxes = scaleResult.availableBoxes;

  // Reproducir la escala en orden ascendente (de nota más grave a más aguda) en modo patrones
  const handlePlayScale = () => {
    if (isPlaying) {
      if (cancelPlaybackRef.current) cancelPlaybackRef.current();
      setIsPlaying(false);
      onActivePlayingMidiChange(null);
      return;
    }

    const dotsToPlay = (
      selectedPosition === null
        ? scaleResult.dots
        : scaleResult.dots.filter(d => d.inBox)
    )
      .filter(d => d.midi && d.midi > 0)
      .sort((a, b) => (a.midi || 0) - (b.midi || 0));

    const uniqueNotes: typeof dotsToPlay = [];
    const seenMidis = new Set<number>();
    for (const d of dotsToPlay) {
      if (d.midi && !seenMidis.has(d.midi)) {
        seenMidis.add(d.midi);
        uniqueNotes.push(d);
      }
    }

    const finalSequence = uniqueNotes.slice(0, 16);

    setIsPlaying(true);
    const stopFn = audioEngine.playScaleSequence(
      finalSequence,
      250,
      stepIndex => {
        const currentDot = finalSequence[stepIndex];
        if (currentDot && currentDot.midi) {
          onActivePlayingMidiChange(currentDot.midi);
        }
      },
      () => {
        setIsPlaying(false);
        onActivePlayingMidiChange(null);
      }
    );

    cancelPlaybackRef.current = stopFn;
  };

  return (
    <div className="flex flex-col gap-5 w-full bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 sm:p-6 shadow-md">
      {/* 0. Selector de Modo de Escalas (Patrones vs Desde una tónica) */}
      <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl">
        <button
          onClick={() => onChangeScaleSubMode('patterns')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            scaleSubMode === 'patterns'
              ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Patrones (CAGED / 3NPS)</span>
        </button>
        <button
          onClick={() => onChangeScaleSubMode('root_run')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            scaleSubMode === 'root_run'
              ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Desde una tónica (Recorrido)</span>
        </button>
      </div>

      {/* 1. Selector de Tónica (Común a ambos modos) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Tónica de la escala
          </label>
          <span className="text-xs font-mono text-amber-400 font-bold">
            Raíz: {selectedRoot} ({scaleRunResult.solfegeRoot})
          </span>
        </div>
        <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
          {ROOT_NOTES.map(root => {
            const isSelected = root === selectedRoot;
            return (
              <button
                key={`root-btn-${root}`}
                onClick={() => onSelectRoot(root)}
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

      {/* 2. Selector de Tipo de Escala (Común a ambos modos) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Tipo de escala
          </label>
          <span className="text-xs text-slate-400 font-medium truncate max-w-[260px]">
            {currentScaleDef.name}
          </span>
        </div>

        {/* Grupos de escalas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Diatónicas */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Diatónicas
            </span>
            <div className="flex flex-col gap-1">
              {SCALE_TYPES.filter(s => s.category === 'diatonic').map(scale => {
                const isSelected = scale.id === selectedScaleId;
                return (
                  <button
                    key={scale.id}
                    onClick={() => {
                      onSelectScale(scale.id);
                      if (selectedPosition && selectedPosition > 5) onSelectPosition(1);
                    }}
                    className={`text-left px-3 py-2 text-xs font-medium rounded-lg transition-all cursor-pointer truncate ${
                      isSelected
                        ? 'bg-sky-600 text-white font-semibold shadow-sm'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/40'
                    }`}
                  >
                    {scale.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pentatónicas & Blues */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Pentatónicas & Blues
            </span>
            <div className="flex flex-col gap-1">
              {SCALE_TYPES.filter(s => s.category === 'pentatonic').map(scale => {
                const isSelected = scale.id === selectedScaleId;
                return (
                  <button
                    key={scale.id}
                    onClick={() => {
                      onSelectScale(scale.id);
                      if (selectedPosition && selectedPosition > 5) onSelectPosition(1);
                    }}
                    className={`text-left px-3 py-2 text-xs font-medium rounded-lg transition-all cursor-pointer truncate ${
                      isSelected
                        ? 'bg-sky-600 text-white font-semibold shadow-sm'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/40'
                    }`}
                  >
                    {scale.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Modos Griegos */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Modos Griegos
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-1 gap-1 max-h-[190px] overflow-y-auto pr-1">
              {SCALE_TYPES.filter(s => s.category === 'modes').map(scale => {
                const isSelected = scale.id === selectedScaleId;
                return (
                  <button
                    key={scale.id}
                    onClick={() => {
                      onSelectScale(scale.id);
                      if (selectedPosition && selectedPosition > 5) onSelectPosition(1);
                    }}
                    className={`text-left px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer truncate ${
                      isSelected
                        ? 'bg-sky-600 text-white font-semibold shadow-sm'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/40'
                    }`}
                  >
                    {scale.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Resumen explicativo de la escala */}
        <p className="text-xs text-slate-400 mt-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
          <span className="font-semibold text-slate-300">{currentScaleDef.name}: </span>
          {currentScaleDef.description}
        </p>
      </div>

      {/* 3. Renderizado condicional según el sub-modo */}
      {scaleSubMode === 'patterns' ? (
        <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-4">
          {/* Interruptor de Sistema (CAGED vs 3NPS) para escalas diatónicas */}
          {!isPentatonicOrBlues && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Layers className="w-4 h-4 text-amber-400" />
                <span className="font-medium">Sistema de visualización:</span>
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
                <button
                  onClick={() => {
                    onSelectSystem('CAGED');
                    if (selectedPosition && selectedPosition > 5) onSelectPosition(1);
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    system === 'CAGED'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  CAGED (5 Posiciones)
                </button>
                <button
                  onClick={() => {
                    onSelectSystem('TNPS');
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    system === 'TNPS'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  3 Notas Por Cuerda (7 Cajas)
                </button>
              </div>
            </div>
          )}

          {/* Botones de Posiciones / Cajas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Posiciones del mástil ({isPentatonicOrBlues ? '5 Cajas Pentatónicas' : system === 'CAGED' ? 'Sistema CAGED' : 'Sistema 3NPS'})
              </label>
              <span className="text-xs text-amber-400 font-mono">
                {selectedPosition === null
                  ? 'Todo el mástil'
                  : `Caja ${selectedPosition} (${availableBoxes.find(b => b.index === selectedPosition)?.shapeName || ''})`}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => onSelectPosition(null)}
                className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer border ${
                  selectedPosition === null
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border-slate-700/60'
                }`}
              >
                Todo el mástil
              </button>

              {availableBoxes.map(box => {
                const isSelected = selectedPosition === box.index;
                return (
                  <button
                    key={`pos-btn-${box.index}`}
                    onClick={() => onSelectPosition(box.index)}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border-slate-700/60'
                    }`}
                  >
                    <span>{box.label}</span>
                    <span className="text-[10px] font-mono opacity-80">
                      ({box.shapeName || `T${box.minFret}-${box.maxFret}`})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Opciones de visualización y audio en modo patrones */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-800/80 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Mostrar en diapasón:</span>
              <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => onSelectDisplayMode('notes')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    displayMode === 'notes'
                      ? 'bg-slate-700 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Notas
                </button>
                <button
                  onClick={() => onSelectDisplayMode('intervals')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    displayMode === 'intervals'
                      ? 'bg-slate-700 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Intervalos
                </button>
                <button
                  onClick={() => onSelectDisplayMode('fingers')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    displayMode === 'fingers'
                      ? 'bg-slate-700 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Dedos (1, 2, 3, 4)
                </button>
              </div>
            </div>

            {selectedPosition !== null && (
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={highlightOnlyBox}
                  onChange={e => onToggleHighlightOnlyBox(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
                />
                <span>Ocultar notas fuera de la caja</span>
              </label>
            )}

            <button
              onClick={handlePlayScale}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isPlaying
                  ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/20'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
              }`}
            >
              {isPlaying ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Detener escala</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Escuchar escala</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Sub-modo: Desde una tónica */
        <ScaleRootRunControls
          scaleRunResult={scaleRunResult}
          rootOccurrences={rootOccurrences}
          selectedOccurrence={selectedStartOccurrence}
          onSelectOccurrence={onSelectStartOccurrence}
          direction={runDirection}
          onChangeDirection={onChangeRunDirection}
          span={runSpan}
          onChangeSpan={onChangeRunSpan}
          selectedVariationIndex={selectedVariationIndex}
          onSelectVariationIndex={onSelectVariationIndex}
          displayMode={runDisplayMode}
          onSelectDisplayMode={onChangeRunDisplayMode}
          hideOutsideRun={hideOutsideRun}
          onToggleHideOutsideRun={onToggleHideOutsideRun}
          onActivePlayingMidiChange={onActivePlayingMidiChange}
          onActiveStepIndexChange={onActiveStepIndexChange}
        />
      )}

      {/* 4. Notas e Intervalos de la escala calculados con Tonal */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Music className="w-4 h-4 text-sky-400" />
          <span className="font-semibold text-slate-300">Notas de {scaleResult.scaleName}:</span>
          <div className="flex flex-wrap gap-1 font-mono">
            {scaleResult.notes.map((n, i) => (
              <span
                key={`note-pill-${n}-${i}`}
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
            {scaleResult.intervals.map((inv, i) => (
              <span key={`inv-pill-${inv}-${i}`} className="text-slate-300">
                {inv}{i < scaleResult.intervals.length - 1 ? ' ·' : ''}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
