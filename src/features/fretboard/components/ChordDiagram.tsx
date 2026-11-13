/**
 * @file ChordDiagram.tsx
 * @description Diagrama clásico vertical de acorde (Chord Box SVG) con trastes, cejillas (barres),
 * cuerdas al aire (O), cuerdas muteadas (X), números de dedos e intervalos.
 */

import type React from 'react';
import { Volume2 } from 'lucide-react';
import { formatChordSymbol, formatNoteName } from '../../../utils/notation';
import { audioEngine } from '../services/guitarAudio';
import type { ChordPositionData, NoteNotation } from '../../../types/music.types';

interface ChordDiagramProps {
  chordName: string;
  symbol: string;
  notation: NoteNotation;
  position: ChordPositionData;
  positionIndex: number;
  totalPositions: number;
  displayMode: 'notes' | 'intervals' | 'fingers';
}

export const ChordDiagram: React.FC<ChordDiagramProps> = ({
  chordName,
  symbol,
  notation,
  position,
  positionIndex,
  totalPositions,
  displayMode
}) => {
  const { frets, fingers, baseFret, barres, stringNotes } = position;

  const width = 220;
  const height = 260;
  const marginX = 45;
  const startY = 46;
  const numFrets = 5;
  const numStrings = 6;
  const fretSpacing = 36;
  const stringSpacing = (width - marginX * 2) / (numStrings - 1);

  const handlePlayStrum = () => {
    const notesToPlay = stringNotes
      .filter(sn => sn.fret >= 0 && sn.midi > 0)
      .map(sn => ({ midi: sn.midi }));
    audioEngine.strumChord(notesToPlay, 35, 'down');
  };

  const barreElements: React.ReactNode[] = [];
  if (barres && barres.length > 0) {
    barres.forEach(barreFret => {
      const matchingStringIndices: number[] = [];
      frets.forEach((f, idx) => {
        if (f === barreFret) {
          matchingStringIndices.push(idx);
        }
      });

      if (matchingStringIndices.length >= 2) {
        const minIdx = Math.min(...matchingStringIndices);
        const maxIdx = Math.max(...matchingStringIndices);
        const x1 = marginX + minIdx * stringSpacing;
        const x2 = marginX + maxIdx * stringSpacing;
        const y = startY + (barreFret - 0.5) * fretSpacing;

        barreElements.push(
          <rect
            key={`barre-${barreFret}`}
            x={x1 - 10}
            y={y - 8}
            width={x2 - x1 + 20}
            height={16}
            rx={8}
            className="fill-amber-500/80 stroke-amber-400 stroke-1"
          />
        );
      }
    });
  }

  return (
    <div className="flex flex-col items-center bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl w-full max-w-sm">
      {/* Encabezado del diagrama */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-white tracking-tight">
              {formatChordSymbol(symbol, notation) || chordName}
            </span>
            <span className="text-xs text-slate-400 font-medium">({chordName})</span>
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            Posición {positionIndex + 1} de {totalPositions}
            {baseFret > 1 && ` · Traste ${baseFret}`}
          </div>
        </div>

        <button
          type="button"
          onClick={handlePlayStrum}
          title="Escuchar rasgueo"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
        >
          <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Rasguear</span>
        </button>
      </div>

      {/* SVG del Diagrama Vertical */}
      <div className="relative flex justify-center py-1">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="select-none overflow-visible"
          role="img"
          aria-label={`Diagrama del acorde ${formatChordSymbol(symbol, notation) || chordName}`}
        >
          {/* Indicador de traste base si es superior a 1 */}
          {baseFret > 1 && (
            <text
              x={marginX - 14}
              y={startY + fretSpacing * 0.65}
              textAnchor="end"
              className="fill-amber-400 font-mono text-xs font-bold"
            >
              {baseFret}fr
            </text>
          )}

          {/* Cejuela (Nut) gruesa si el traste base es 1 */}
          {baseFret === 1 ? (
            <line
              x1={marginX - 1}
              y1={startY}
              x2={marginX + (numStrings - 1) * stringSpacing + 1}
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
          {Array.from({ length: numFrets }).map((_, i) => {
            const y = startY + (i + 1) * fretSpacing;
            return (
              <line
                key={`fret-line-${i}`}
                x1={marginX}
                y1={y}
                x2={marginX + (numStrings - 1) * stringSpacing}
                y2={y}
                stroke="#475569"
                strokeWidth={1.2}
              />
            );
          })}

          {/* Líneas verticales de cuerdas */}
          {Array.from({ length: numStrings }).map((_, i) => {
            const x = marginX + i * stringSpacing;
            const strokeWidth = 2.4 - i * 0.28;
            return (
              <line
                key={`string-line-${i}`}
                x1={x}
                y1={startY}
                x2={x}
                y2={startY + numFrets * fretSpacing}
                stroke="#94a3b8"
                strokeWidth={strokeWidth}
              />
            );
          })}

          {/* Cejillas continuas */}
          {barreElements}

          {/* Marcadores de cejuela: X para muteadas, O para cuerdas al aire */}
          {frets.map((fretVal, strIdx) => {
            const x = marginX + strIdx * stringSpacing;
            const y = startY - 14;

            if (fretVal === -1) {
              return (
                <text
                  key={`marker-muted-${strIdx}`}
                  x={x}
                  y={y + 4}
                  textAnchor="middle"
                  className="fill-rose-400 font-mono text-xs font-bold"
                >
                  ✕
                </text>
              );
            }

            if (fretVal === 0) {
              return (
                <circle
                  key={`marker-open-${strIdx}`}
                  cx={x}
                  cy={y}
                  r={5}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth={2}
                />
              );
            }

            return null;
          })}

          {/* Puntos de digitación */}
          {frets.map((rawFret, strIdx) => {
            if (rawFret <= 0) return null;

            const x = marginX + strIdx * stringSpacing;
            const y = startY + (rawFret - 0.5) * fretSpacing;
            const finger = fingers[strIdx] || 0;
            const noteObj = stringNotes[strIdx];
            const isRoot = noteObj?.isRoot;

            let label = finger > 0 ? `${finger}` : '';
            if (displayMode === 'notes' && noteObj) {
              label = formatNoteName(noteObj.noteName, notation);
            } else if (displayMode === 'intervals' && noteObj) {
              label = noteObj.interval;
            } else if (displayMode === 'fingers') {
              label = finger > 0 ? `${finger}` : '•';
            }

            const isBarrePoint = barres.includes(rawFret);
            const dotTextClass =
              label.length >= 4
                ? 'text-[7.5px]'
                : label.length === 3
                  ? 'text-[8.5px]'
                  : 'text-[10px]';

            const playDot = () => {
              if (noteObj?.midi) audioEngine.playMidi(noteObj.midi, 1.8);
            };

            return (
              <g
                key={`dot-${strIdx}-${rawFret}`}
                className="cursor-pointer transition-transform hover:scale-110"
                role="button"
                tabIndex={0}
                aria-label={`Tocar nota ${noteObj ? formatNoteName(noteObj.noteName, notation) : ''}`}
                onClick={playDot}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    playDot();
                  }
                }}
              >
                <circle
                  cx={x}
                  cy={y}
                  r={10.5}
                  className={`${
                    isRoot
                      ? 'fill-amber-500 stroke-amber-200 stroke-2'
                      : isBarrePoint
                        ? 'fill-amber-600 stroke-amber-300 stroke-1'
                        : 'fill-sky-600 stroke-sky-200 stroke-1.5'
                  } shadow-md`}
                />
                <text
                  x={x}
                  y={y + 3.5}
                  textAnchor="middle"
                  className={`fill-white font-mono ${dotTextClass} font-bold pointer-events-none`}
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* Notas de cada cuerda al pie del diagrama */}
          {stringNotes.map((sn, idx) => {
            const x = marginX + idx * stringSpacing;
            const y = startY + numFrets * fretSpacing + 22;
            const isMuted = sn.fret === -1;

            return (
              <text
                key={`footer-note-${idx}`}
                x={x}
                y={y}
                textAnchor="middle"
                className={`font-mono text-[11px] font-medium ${
                  isMuted
                    ? 'fill-slate-600'
                    : sn.isRoot
                      ? 'fill-amber-400 font-bold'
                      : 'fill-slate-300'
                }`}
              >
                {isMuted ? '—' : formatNoteName(sn.noteName, notation)}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Notas y digitación en texto */}
      <div className="w-full mt-3 pt-3 border-t border-slate-800 text-xs text-slate-400 flex flex-wrap justify-between gap-y-1">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">Cuerdas:</span>
          <span className="font-mono text-slate-300 tracking-wider">
            {frets.map(f => (f === -1 ? 'X' : f === 0 ? '0' : f)).join(' ')}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">Dedos:</span>
          <span className="font-mono text-slate-300 tracking-wider">
            {fingers.map(f => (f === 0 ? '—' : f)).join(' ')}
          </span>
        </div>
      </div>
    </div>
  );
};
