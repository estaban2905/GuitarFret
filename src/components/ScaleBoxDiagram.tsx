/**
 * @file ScaleBoxDiagram.tsx
 * @description Diagrama vertical de caja de escala (Scale Box Diagram) con digitaciones recomendadas (1, 2, 3, 4),
 * tónica resaltada en amarillo brillante (#f59e0b) exactamente como en la lámina de Guitar Lions.
 * Permite visualizar la digitación de la posición seleccionada, escuchar el arpegio y alternar etiquetas.
 */

import React from 'react';
import { ScalePositionDot, BoxInfo, NoteNotation, formatNoteName } from '../utils/theory';
import { audioEngine } from '../utils/audio';
import { Volume2, Hand } from 'lucide-react';

interface ScaleBoxDiagramProps {
  scaleName: string;
  rootNote: string;
  notation: NoteNotation;
  boxInfo?: BoxInfo;
  boxDots: ScalePositionDot[];
  displayMode: 'notes' | 'intervals' | 'fingers';
  onSelectDisplayMode: (mode: 'notes' | 'intervals' | 'fingers') => void;
  positionIndex: number;
  totalPositions: number;
}

export const ScaleBoxDiagram: React.FC<ScaleBoxDiagramProps> = ({
  scaleName,
  rootNote,
  notation,
  boxInfo,
  boxDots,
  displayMode,
  onSelectDisplayMode,
  positionIndex,
  totalPositions
}) => {
  // Filtrar y ordenar los puntos de la caja activa
  const activeDots = boxDots.filter(d => d.inBox);

  const minFret = activeDots.length > 0
    ? Math.min(...activeDots.map(d => d.fret))
    : 0;
  const maxFret = activeDots.length > 0
    ? Math.max(...activeDots.map(d => d.fret))
    : 4;

  const hasOpenStrings = minFret === 0;
  const baseDisplayFret = minFret === 0 ? 1 : minFret;
  const numFretsInBox = Math.max(4, maxFret - baseDisplayFret + 1);

  // Parámetros de renderizado SVG del diagrama
  const width = 230;
  const marginX = 45;
  const startY = hasOpenStrings ? 58 : 48;
  const numStrings = 6;
  const fretSpacing = 38;
  const height = startY + numFretsInBox * fretSpacing + 24;
  const stringSpacing = (width - marginX * 2) / (numStrings - 1); // ~28px

  // Reproducir el arpegio de la caja en orden ascendente
  const handlePlayBox = () => {
    const sorted = [...activeDots]
      .filter(d => d.midi && d.midi > 0)
      .sort((a, b) => (a.midi || 0) - (b.midi || 0));

    // Eliminar repetidas idénticas
    const uniqueNotes: typeof sorted = [];
    const seen = new Set<number>();
    sorted.forEach(d => {
      if (d.midi && !seen.has(d.midi)) {
        seen.add(d.midi);
        uniqueNotes.push(d);
      }
    });

    audioEngine.playScaleSequence(uniqueNotes, 220);
  };

  return (
    <div className="flex flex-col items-center bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl w-full max-w-sm">
      {/* Encabezado del diagrama */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-white tracking-tight uppercase">
              Posición {positionIndex}
            </span>
            <span className="text-xs text-amber-400 font-semibold font-mono">
              (Trastes {minFret}-{maxFret})
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            {boxInfo?.shapeName || `Caja ${positionIndex} de ${totalPositions}`}
          </div>
        </div>

        <button
          onClick={handlePlayBox}
          title="Escuchar arpegio de la caja"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>Arpegio</span>
        </button>
      </div>

      {/* SVG del Diagrama Vertical de la Caja */}
      <div className="relative flex justify-center py-1">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="select-none overflow-visible"
        >
          {/* Indicador de traste inicial a la izquierda */}
          {baseDisplayFret > 1 && (
            <text
              x={marginX - 14}
              y={startY + fretSpacing * 0.65}
              textAnchor="end"
              className="fill-amber-400 font-mono text-xs font-bold"
            >
              {baseDisplayFret}fr
            </text>
          )}

          {/* Cejuela (Nut) gruesa si el traste inicial es 0 o 1 */}
          {minFret <= 1 ? (
            <line
              x1={marginX - 2}
              y1={startY}
              x2={marginX + (numStrings - 1) * stringSpacing + 2}
              y2={startY}
              stroke="#f8fafc"
              strokeWidth={5}
              strokeLinecap="round"
            />
          ) : (
            <line
              x1={marginX}
              y1={startY}
              x2={marginX + (numStrings - 1) * stringSpacing}
              y2={startY}
              stroke="#475569"
              strokeWidth={1.5}
            />
          )}

          {/* Líneas horizontales de trastes */}
          {Array.from({ length: numFretsInBox }).map((_, i) => {
            const y = startY + (i + 1) * fretSpacing;
            const currentFretNumber = baseDisplayFret + i;
            return (
              <g key={`box-fret-line-${i}`}>
                <line
                  x1={marginX}
                  y1={y}
                  x2={marginX + (numStrings - 1) * stringSpacing}
                  y2={y}
                  stroke="#475569"
                  strokeWidth={1.2}
                />
                {/* Número de traste lateral */}
                <text
                  x={marginX - 12}
                  y={y - fretSpacing * 0.4}
                  textAnchor="end"
                  className="fill-slate-500 font-mono text-[10px]"
                >
                  {currentFretNumber}
                </text>
              </g>
            );
          })}

          {/* Líneas verticales de cuerdas (de 6ta a 1ra cuerda, de izquierda a derecha) */}
          {Array.from({ length: numStrings }).map((_, i) => {
            const x = marginX + i * stringSpacing;
            // Grosor decreciente de 6ta cuerda (2.5px) a 1ra cuerda (1px)
            const strokeWidth = 2.4 - i * 0.28;
            return (
              <line
                key={`box-string-line-${i}`}
                x1={x}
                y1={startY}
                x2={x}
                y2={startY + numFretsInBox * fretSpacing}
                stroke="#94a3b8"
                strokeWidth={strokeWidth}
              />
            );
          })}

          {/* Encabezado de cuerdas arriba: 6, 5, 4, 3, 2, 1 */}
          {Array.from({ length: numStrings }).map((_, i) => {
            const x = marginX + i * stringSpacing;
            const stringNumber = 6 - i;
            return (
              <text
                key={`str-label-${i}`}
                x={x}
                y={hasOpenStrings ? startY - 34 : startY - 12}
                textAnchor="middle"
                className="fill-slate-500 font-mono text-[10px] font-medium"
              >
                C{stringNumber}
              </text>
            );
          })}

          {/* Puntos de notas en la caja con digitación (dedos o notas) */}
          {activeDots.map((dot, idx) => {
            // stringNumber: 6 = izquierda (idx 0), 1 = derecha (idx 5)
            const stringIdx = 6 - dot.string;
            const x = marginX + stringIdx * stringSpacing;
            const isOpen = dot.fret === 0;
            let y: number;
            if (isOpen) {
              // Cuerda al aire: dibujar justo encima de la cejuela
              y = startY - 16;
            } else {
              const fretRel = dot.fret - baseDisplayFret;
              if (fretRel < 0 || fretRel >= numFretsInBox) return null;
              y = startY + (fretRel + 0.5) * fretSpacing;
            }
            const isRoot = dot.isRoot;

            // Determinar texto del círculo
            let label = dot.finger ? `${dot.finger}` : '';
            if (displayMode === 'notes') {
              label = formatNoteName(dot.note, notation);
            } else if (displayMode === 'intervals') {
              label = dot.interval;
            } else if (displayMode === 'fingers') {
              label = isOpen ? '0' : (dot.finger ? `${dot.finger}` : '•');
            }

            const textSizeClass = label.length >= 4 ? 'text-[8px]' : label.length === 3 ? 'text-[9px]' : 'text-[10.5px]';

            return (
              <g
                key={`box-dot-${dot.string}-${dot.fret}-${idx}`}
                className="cursor-pointer transition-transform hover:scale-110"
                onClick={() => {
                  if (dot.midi) audioEngine.playMidi(dot.midi, 1.8);
                }}
              >
                <circle
                  cx={x}
                  cy={y}
                  r={isOpen ? 9.5 : 11}
                  className={`${
                    isRoot
                      ? 'fill-amber-400 stroke-amber-200 stroke-2 shadow-md'
                      : isOpen
                      ? 'fill-slate-950 stroke-sky-400 stroke-2'
                      : 'fill-slate-900 stroke-slate-500 stroke-1.5'
                  }`}
                />
                <text
                  x={x}
                  y={y + 3.5}
                  textAnchor="middle"
                  className={`font-mono ${textSizeClass} font-bold pointer-events-none ${
                    isRoot ? 'fill-slate-950 font-black' : 'fill-white'
                  }`}
                >
                  {label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Controles para cambiar lo que se muestra dentro de los círculos */}
      <div className="w-full mt-3 pt-3 border-t border-slate-800 flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Hand className="w-3.5 h-3.5 text-amber-400" />
            <span>Mostrar dentro de los puntos:</span>
          </span>

          <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800">
            <button
              onClick={() => onSelectDisplayMode('fingers')}
              className={`px-2 py-0.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                displayMode === 'fingers'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Mostrar dedos (1=Índice, 2=Medio, 3=Anular, 4=Meñique)"
            >
              Dedos
            </button>
            <button
              onClick={() => onSelectDisplayMode('notes')}
              className={`px-2 py-0.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                displayMode === 'notes'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title={`Mostrar nombre de la nota (ej. ${formatNoteName('C', notation)}, ${formatNoteName('D', notation)}, ${formatNoteName('E', notation)})`}
            >
              Notas
            </button>
            <button
              onClick={() => onSelectDisplayMode('intervals')}
              className={`px-2 py-0.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                displayMode === 'intervals'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Mostrar intervalo relativo a la tónica (1, b3, 5...)"
            >
              Intervalos
            </button>
          </div>
        </div>

        {/* Leyenda de dedos según lámina de Guitar Lions */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800/80">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
            <span>Tónica ({formatNoteName(rootNote, notation)})</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px] text-slate-300">
            <span>1: Índice</span>
            <span>2: Medio</span>
            <span>3: Anular</span>
            <span>4: Meñique</span>
          </div>
        </div>
      </div>
    </div>
  );
};
