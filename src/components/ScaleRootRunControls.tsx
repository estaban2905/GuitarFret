/**
 * @file ScaleRootRunControls.tsx
 * @description Panel de control para el modo "Desde una tónica":
 * - Permite elegir la aparición exacta de la tónica en el diapasón (cuerda y traste).
 * - Selector de sentido (Ascendente / Descendente) y extensión (1 octava / 2 octavas).
 * - Selector de digitaciones alternativas (variaciones ergonómicas en posición).
 * - Alternancia de modo de visualización: Orden de paso, Nombre de nota, Intervalo o Dedo.
 * - Interruptor para ocultar notas fuera del recorrido.
 * - Secuencia de notas y grados en solfeo (Do → Re → Mi...).
 * - Reproductor interactivo de audio con tempo regulable (BPM).
 */

import React, { useState, useRef } from 'react';
import {
  RootOccurrence,
  ScaleRunResult,
  ScaleRunVariation
} from '../utils/theory';
import { audioEngine } from '../utils/audio';
import {
  Play,
  Square,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ListOrdered
} from 'lucide-react';

interface ScaleRootRunControlsProps {
  scaleRunResult: ScaleRunResult;
  rootOccurrences: RootOccurrence[];
  selectedOccurrence: RootOccurrence | null;
  onSelectOccurrence: (occurrence: RootOccurrence) => void;
  direction: 'ascending' | 'descending';
  onChangeDirection: (dir: 'ascending' | 'descending') => void;
  span: '1_octave' | '2_octaves';
  onChangeSpan: (span: '1_octave' | '2_octaves') => void;
  selectedVariationIndex: number;
  onSelectVariationIndex: (index: number) => void;
  displayMode: 'steps' | 'notes' | 'intervals' | 'fingers';
  onSelectDisplayMode: (mode: 'steps' | 'notes' | 'intervals' | 'fingers') => void;
  hideOutsideRun: boolean;
  onToggleHideOutsideRun: (hide: boolean) => void;
  onActivePlayingMidiChange: (midi: number | null) => void;
  onActiveStepIndexChange?: (stepIndex: number | null) => void;
}

export const ScaleRootRunControls: React.FC<ScaleRootRunControlsProps> = ({
  scaleRunResult,
  rootOccurrences,
  selectedOccurrence,
  onSelectOccurrence,
  direction,
  onChangeDirection,
  span,
  onChangeSpan,
  selectedVariationIndex,
  onSelectVariationIndex,
  displayMode,
  onSelectDisplayMode,
  hideOutsideRun,
  onToggleHideOutsideRun,
  onActivePlayingMidiChange,
  onActiveStepIndexChange
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState<number>(120);
  const cancelPlaybackRef = useRef<(() => void) | null>(null);

  const activeVar = scaleRunResult.activeVariation;
  const steps = activeVar ? activeVar.steps : [];

  // Reproducir el recorrido en orden de pasos
  const handlePlayRun = () => {
    if (isPlaying) {
      if (cancelPlaybackRef.current) cancelPlaybackRef.current();
      setIsPlaying(false);
      onActivePlayingMidiChange(null);
      if (onActiveStepIndexChange) onActiveStepIndexChange(null);
      return;
    }

    if (!steps || steps.length === 0) return;

    // Calcular duración por nota según BPM (ej: 120 bpm = 500ms por negra, o 300ms)
    const stepDurationMs = Math.round((60000 / bpm) * 0.7);

    setIsPlaying(true);
    const stopFn = audioEngine.playScaleSequence(
      steps.map(s => ({
        string: s.string,
        fret: s.fret,
        note: s.noteName,
        interval: s.interval,
        isRoot: s.isRoot,
        inBox: true,
        pitch: s.pitch,
        midi: s.midi
      })),
      stepDurationMs,
      stepIndex => {
        const currentStep = steps[stepIndex];
        if (currentStep) {
          onActivePlayingMidiChange(currentStep.midi);
          if (onActiveStepIndexChange) onActiveStepIndexChange(stepIndex);
        }
      },
      () => {
        setIsPlaying(false);
        onActivePlayingMidiChange(null);
        if (onActiveStepIndexChange) onActiveStepIndexChange(null);
      }
    );

    cancelPlaybackRef.current = stopFn;
  };

  return (
    <div className="flex flex-col gap-5 w-full bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 sm:p-6 shadow-md">
      {/* 1. Selección de la aparición exacta de la tónica */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <span>Aparición de la tónica de inicio ({scaleRunResult.solfegeRoot})</span>
          </label>
          <span className="text-[11px] text-amber-400 font-mono">
            {rootOccurrences.length} apariciones en el mástil
          </span>
        </div>

        {/* Selector dropdown accesible */}
        <select
          value={
            selectedOccurrence
              ? `${selectedOccurrence.string}-${selectedOccurrence.fret}`
              : ''
          }
          onChange={e => {
            const [s, f] = e.target.value.split('-').map(Number);
            const found = rootOccurrences.find(o => o.string === s && o.fret === f);
            if (found) onSelectOccurrence(found);
          }}
          className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs font-mono text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
        >
          {rootOccurrences.map(occ => (
            <option
              key={`root-opt-${occ.string}-${occ.fret}`}
              value={`${occ.string}-${occ.fret}`}
            >
              {occ.label}
            </option>
          ))}
        </select>

        {/* Botones de acceso rápido para cada aparición de la tónica */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {rootOccurrences.map(occ => {
            const isSelected =
              selectedOccurrence?.string === occ.string &&
              selectedOccurrence?.fret === occ.fret;

            return (
              <button
                key={`root-chip-${occ.string}-${occ.fret}`}
                onClick={() => onSelectOccurrence(occ)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-bold border-white ring-2 ring-amber-400/50 shadow-md'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-700 hover:text-white'
                }`}
                title={`Cuerda ${occ.string} (${occ.string === 1 ? 'más aguda' : occ.string === 6 ? 'más grave' : 'media'}), Traste ${occ.fret}`}
              >
                <span>C{occ.string}</span>
                <span className="text-[10px] opacity-75">T{occ.fret}</span>
                <span className="font-sans text-[10px] font-semibold">({occ.pitch})</span>
              </button>
            );
          })}
        </div>

        <p className="text-[11px] text-slate-500 flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>
            También puedes hacer clic directamente en cualquier tónica dorada del diapasón para seleccionarla.
          </span>
        </p>
      </div>

      {/* 2. Sentido, Extensión y Variaciones de digitación */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-800/80">
        {/* Sentido del recorrido */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Sentido del recorrido
          </label>
          <div className="grid grid-cols-2 gap-2">
            {scaleRunResult.availableDirections.map(dirOpt => {
              const isSelected = direction === dirOpt.id;
              const isDisabled = !dirOpt.available;

              return (
                <button
                  key={`dir-btn-${dirOpt.id}`}
                  disabled={isDisabled}
                  onClick={() => onChangeDirection(dirOpt.id)}
                  title={dirOpt.reason}
                  className={`py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-sm'
                      : isDisabled
                      ? 'bg-slate-950/60 text-slate-600 border-slate-800 cursor-not-allowed'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {dirOpt.id === 'ascending' ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                  <span>{dirOpt.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Extensión del recorrido */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Extensión
          </label>
          <div className="grid grid-cols-2 gap-2">
            {scaleRunResult.availableSpans.map(spanOpt => {
              const isSelected = span === spanOpt.id;
              const isDisabled = !spanOpt.available;

              return (
                <button
                  key={`span-btn-${spanOpt.id}`}
                  disabled={isDisabled}
                  onClick={() => onChangeSpan(spanOpt.id)}
                  title={spanOpt.reason}
                  className={`py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-sm'
                      : isDisabled
                      ? 'bg-slate-950/60 text-slate-600 border-slate-800 cursor-not-allowed'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{spanOpt.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Selector de Variaciones de Digitación */}
      {scaleRunResult.variations.length > 0 && (
        <div className="flex flex-col gap-2 pt-3 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Digitaciones alternativas ({scaleRunResult.variations.length} disponibles)</span>
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            {scaleRunResult.variations.map((v, idx) => {
              const isSelected = idx === scaleRunResult.selectedVariationIndex;
              return (
                <button
                  key={v.id}
                  onClick={() => onSelectVariationIndex(idx)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer border text-left flex flex-col gap-0.5 ${
                    isSelected
                      ? 'bg-sky-950/80 text-sky-200 border-sky-500 ring-2 ring-sky-500/30'
                      : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <span className="font-bold flex items-center gap-1.5">
                    {isSelected && <CheckCircle2 className="w-3 h-3 text-sky-400 inline" />}
                    {v.name}
                  </span>
                  <span className="text-[10px] font-normal text-slate-400 font-mono">
                    Rango: Trastes {v.fretSpan[0]} al {v.fretSpan[1]}
                  </span>
                </button>
              );
            })}
          </div>

          {activeVar && (
            <p className="text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
              <strong className="text-slate-300">Detalle de digitación:</strong> {activeVar.description}
            </p>
          )}
        </div>
      )}

      {/* Mensaje de error si no hay recorrido posible */}
      {scaleRunResult.errorMessage && (
        <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-lg text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{scaleRunResult.errorMessage}</span>
        </div>
      )}

      {/* 4. Secuencia de notas del recorrido */}
      {steps.length > 0 && (
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <span>Secuencia de notas ({steps.length} pasos):</span>
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Inicio: {steps[0].solfege} (C{steps[0].string}:T{steps[0].fret})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
            {steps.map((st, i) => {
              const isLast = i === steps.length - 1;
              return (
                <React.Fragment key={`seq-step-${i}`}>
                  <span
                    className={`px-2 py-0.5 rounded font-semibold flex items-center gap-1 border ${
                      st.isStart
                        ? 'bg-amber-500 text-slate-950 border-white ring-2 ring-amber-400/50 shadow-sm'
                        : st.isRoot
                        ? 'bg-amber-600/30 text-amber-300 border-amber-500/50'
                        : 'bg-slate-800 text-sky-300 border-slate-700/60'
                    }`}
                    title={`Paso ${st.step}: ${st.solfege} (${st.pitch}) · Cuerda ${st.string}, Traste ${st.fret}`}
                  >
                    <span>{st.solfege}</span>
                    <span className="text-[10px] opacity-75 font-normal">({st.interval})</span>
                  </span>
                  {!isLast && <span className="text-slate-600">→</span>}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Controles de visualización (Etiquetas en el diapasón), filtro y Audio */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-800/80 text-xs">
        {/* Selector de modo de etiqueta */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Mostrar en diapasón:</span>
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => onSelectDisplayMode('steps')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                displayMode === 'steps'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ListOrdered className="w-3 h-3" />
              <span>Paso (1, 2, 3...)</span>
            </button>
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
              Dedos (1-4)
            </button>
          </div>
        </div>

        {/* Interruptor para ocultar notas fuera del recorrido */}
        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={hideOutsideRun}
            onChange={e => onToggleHideOutsideRun(e.target.checked)}
            className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
          />
          <span>Ocultar notas fuera del recorrido</span>
        </label>

        {/* Reproductor con BPM */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>BPM:</span>
            <select
              value={bpm}
              onChange={e => setBpm(Number(e.target.value))}
              className="bg-slate-950 border border-slate-800 text-slate-300 rounded px-2 py-1 text-xs font-mono"
            >
              <option value="90">90 lento</option>
              <option value="120">120 normal</option>
              <option value="150">150 rápido</option>
            </select>
          </div>

          <button
            onClick={handlePlayRun}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              isPlaying
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/20'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
            }`}
          >
            {isPlaying ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Detener recorrido</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Escuchar recorrido</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
