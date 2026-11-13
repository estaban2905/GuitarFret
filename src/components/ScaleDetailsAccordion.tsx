/**
 * @file ScaleDetailsAccordion.tsx
 * @description Bloque desplegable secundario "Detalles de la escala":
 * Centraliza toda la información teórica en un solo lugar:
 * - Notas en solfeo español y notación internacional: Do (C) · Re (D)...
 * - Intervalos: 1 · 2 · 3 · 5 · 6...
 * - Breve descripción de la escala
 * - Secuencia ordenada del recorrido (cuando corresponda)
 * Evita repeticiones en la pantalla principal.
 */

import React, { useState } from 'react';
import { ScaleResult, ScaleRunStep, NoteNotation, formatNoteName } from '../utils/theory';
import { ChevronDown, ChevronRight, Info } from 'lucide-react';

interface ScaleDetailsAccordionProps {
  scaleResult: ScaleResult;
  selectedRoot: string;
  notation: NoteNotation;
  scaleDisplayName?: string;
  steps?: ScaleRunStep[];
  isRootRunMode?: boolean;
  defaultOpen?: boolean;
}

export const ScaleDetailsAccordion: React.FC<ScaleDetailsAccordionProps> = ({
  scaleResult,
  selectedRoot,
  notation,
  scaleDisplayName,
  steps,
  isRootRunMode = false,
  defaultOpen = false
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="w-full bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-md">
      {/* Encabezado desplegable */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-slate-200 hover:bg-slate-850 transition-colors cursor-pointer"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          {isOpen ? <ChevronDown className="w-4 h-4 text-amber-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
          <Info className="w-4 h-4 text-slate-400" />
          <span className="font-bold tracking-wide">Detalles de la escala</span>
          <span className="text-slate-400 font-normal">
            · {formatNoteName(selectedRoot, notation)} {scaleDisplayName || scaleResult.scaleType}
          </span>
        </div>
        <span className="text-[11px] text-slate-500 font-normal">
          {isOpen ? 'Ocultar' : 'Mostrar'}
        </span>
      </button>

      {/* Contenido */}
      {isOpen && (
        <div className="px-4 pb-4 pt-2 border-t border-slate-800/80 flex flex-col gap-3 text-xs">
          {/* Fila 1: Notas e Intervalos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Notas */}
            <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Notas ({scaleResult.notes.length})
              </span>
              <div className="flex flex-wrap gap-1.5 font-mono">
                {scaleResult.notes.map((n, idx) => {
                  const formatted = formatNoteName(n, notation);
                  const isRoot = n === selectedRoot;
                  return (
                    <span
                      key={`scale-det-note-${n}-${idx}`}
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        isRoot
                          ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                          : 'bg-slate-800 text-slate-200 border border-slate-700/60'
                      }`}
                    >
                      {formatted}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Intervalos */}
            <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Fórmula de Intervalos
              </span>
              <div className="flex flex-wrap gap-1.5 font-mono text-slate-300">
                {scaleResult.intervals.map((inv, idx) => (
                  <span
                    key={`scale-det-inv-${inv}-${idx}`}
                    className="bg-slate-800 px-2 py-0.5 rounded text-xs border border-slate-700/60 text-sky-300"
                  >
                    {inv}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Secuencia del recorrido cuando estamos en modo "Desde una tónica" */}
          {isRootRunMode && steps && steps.length > 0 && (
            <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Secuencia del recorrido
              </span>
              <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
                {steps.map((st, i) => {
                  const isLast = i === steps.length - 1;
                  return (
                    <React.Fragment key={`seq-det-step-${i}`}>
                      <span
                        className={`px-2 py-0.5 rounded font-semibold ${
                          st.isStart
                            ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                            : st.isRoot
                            ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-800 text-slate-200 border border-slate-700/60'
                        }`}
                      >
                        {formatNoteName(st.noteName, notation)}
                      </span>
                      {!isLast && <span className="text-slate-600">→</span>}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
