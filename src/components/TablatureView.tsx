/**
 * @file TablatureView.tsx
 * @description Tablatura secundaria de 6 cuerdas plegable para el modo "Desde una tónica":
 * - Sección desplegable con encabezado tipo acordeón ("Tablatura · 6 notas")
 * - Discreta ayuda única ("Haz clic en cualquier nota para escucharla")
 * - Sin leyendas duplicadas
 * - Sincronizada con la reproducción de audio y notas activas
 */

import React, { useState } from 'react';
import { ScaleRunStep, NoteNotation, formatNoteName, formatTuningLabels } from '../utils/theory';
import { audioEngine } from '../utils/audio';
import { ChevronDown, ChevronRight, FileText } from 'lucide-react';

interface TablatureViewProps {
  steps: ScaleRunStep[];
  notation: NoteNotation;
  activeStepIndex?: number | null;
  activePlayingMidi?: number | null;
  tuningLabels: string[]; // Cuerdas 6 a 1: ["E", "A", "D", "G", "B", "E"]
  defaultOpen?: boolean;
}

export const TablatureView: React.FC<TablatureViewProps> = ({
  steps,
  notation,
  activeStepIndex,
  activePlayingMidi,
  tuningLabels,
  defaultOpen = false
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!steps || steps.length === 0) return null;

  const formattedTuning = formatTuningLabels(tuningLabels, notation);
  // Cuerdas de la 1 (aguda, arriba) a la 6 (grave, abajo)
  const stringNames: Record<number, string> = {
    1: formattedTuning[5] || (notation === 'spanish' ? 'Mi' : 'E'),
    2: formattedTuning[4] || (notation === 'spanish' ? 'Si' : 'B'),
    3: formattedTuning[3] || (notation === 'spanish' ? 'Sol' : 'G'),
    4: formattedTuning[2] || (notation === 'spanish' ? 'Re' : 'D'),
    5: formattedTuning[1] || (notation === 'spanish' ? 'La' : 'A'),
    6: formattedTuning[0] || (notation === 'spanish' ? 'Mi' : 'E')
  };

  const handleNoteClick = (step: ScaleRunStep) => {
    if (step.midi) {
      audioEngine.playMidi(step.midi, 1.6);
    }
  };

  return (
    <div className="w-full bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-md">
      {/* Encabezado desplegable (Acordeón) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-slate-200 hover:bg-slate-850 transition-colors cursor-pointer"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          {isOpen ? <ChevronDown className="w-4 h-4 text-amber-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
          <FileText className="w-4 h-4 text-slate-400" />
          <span className="font-bold tracking-wide">Tablatura</span>
          <span className="text-slate-400 font-mono text-[11px]">
            · {steps.length} notas ({formatNoteName(steps[0].noteName, notation)} a {formatNoteName(steps[steps.length - 1].noteName, notation)})
          </span>
        </div>
        <span className="text-[11px] text-slate-500 font-normal">
          {isOpen ? 'Ocultar' : 'Mostrar'}
        </span>
      </button>

      {/* Contenido desplegado */}
      {isOpen && (
        <div className="px-4 pb-4 pt-1 border-t border-slate-800/80 flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Haz clic en cualquier nota para escucharla</span>
            <span className="font-mono text-slate-500">Cuerda 1 (arriba) a Cuerda 6 (abajo)</span>
          </div>

          <div className="w-full overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-700">
            <div className="min-w-[560px] flex flex-col select-none">
              {/* Rejilla de 6 cuerdas */}
              <div className="relative py-1.5 px-3 bg-slate-950/70 border border-slate-800/80 rounded-lg">
                {[1, 2, 3, 4, 5, 6].map(stringNum => {
                  return (
                    <div
                      key={`tab-string-${stringNum}`}
                      className="relative flex items-center h-6"
                    >
                      {/* Etiqueta de cuerda a la izquierda */}
                      <div className="w-14 flex items-center gap-1 text-[11px] font-mono font-bold text-slate-400 shrink-0 border-r border-slate-700/80 pr-2 z-10 bg-slate-950/90">
                        <span className="text-[10px] text-slate-500 font-normal">C{stringNum}</span>
                        <span className="text-sky-300">{stringNames[stringNum]}</span>
                      </div>

                      {/* Línea horizontal continua que simula la cuerda */}
                      <div
                        className="absolute left-14 right-0 h-[1.5px] bg-slate-700/60 z-0"
                        style={{
                          height: `${1 + (stringNum - 1) * 0.35}px`,
                          opacity: 0.5 + stringNum * 0.08
                        }}
                      />

                      {/* Pasos en esta cuerda */}
                      <div className="flex-1 flex justify-between px-3 z-10">
                        {steps.map((st, stepIdx) => {
                          const isCurrentString = st.string === stringNum;
                          const isPlaying =
                            activeStepIndex === stepIdx ||
                            (activePlayingMidi !== null && activePlayingMidi !== undefined && activePlayingMidi === st.midi);

                          if (!isCurrentString) {
                            return (
                              <div
                                key={`tab-cell-${stringNum}-${stepIdx}`}
                                className="w-8 h-6 flex items-center justify-center opacity-0"
                              >
                                -
                              </div>
                            );
                          }

                          let badgeStyle = 'bg-sky-950 text-sky-200 border-sky-600/70 hover:bg-sky-900';
                          if (st.isStart) {
                            badgeStyle = 'bg-amber-500 text-slate-950 border-white ring-2 ring-amber-400 font-black shadow-md scale-105';
                          } else if (st.isRoot) {
                            badgeStyle = 'bg-amber-600 text-white border-amber-300 font-bold hover:bg-amber-500';
                          }

                          if (isPlaying) {
                            badgeStyle = 'bg-amber-400 text-slate-950 border-white ring-4 ring-amber-300 scale-125 shadow-lg';
                          }

                          return (
                            <div
                              key={`tab-cell-${stringNum}-${stepIdx}`}
                              className="w-8 h-6 flex items-center justify-center relative cursor-pointer"
                              onClick={() => handleNoteClick(st)}
                              title={`Paso ${st.step}: ${formatNoteName(st.noteName, notation)} · Cuerda ${st.string}, Traste ${st.fret}`}
                            >
                              <span
                                className={`w-6 h-5 flex items-center justify-center rounded border font-mono text-[11px] font-bold transition-all ${badgeStyle}`}
                              >
                                {st.fret}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Fila compacta de notas / grados en solfeo */}
              <div className="flex items-center mt-1.5 px-3 pt-1 border-t border-slate-800/60 text-xs">
                <div className="w-14 text-right pr-2 text-[10px] text-slate-500 font-mono shrink-0">
                  Nota
                </div>
                <div className="flex-1 flex justify-between px-3">
                  {steps.map((st, stepIdx) => {
                    const isPlaying =
                      activeStepIndex === stepIdx ||
                      (activePlayingMidi !== null && activePlayingMidi !== undefined && activePlayingMidi === st.midi);

                    return (
                      <div
                        key={`tab-meta-${stepIdx}`}
                        className={`w-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                          isPlaying ? 'text-amber-300 font-bold scale-105' : 'text-slate-400 hover:text-white'
                        }`}
                        onClick={() => handleNoteClick(st)}
                      >
                        <span className="font-mono text-[11px] font-semibold">{formatNoteName(st.noteName, notation)}</span>
                        <span className="text-[9px] text-slate-500 font-mono">#{st.step}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
