/**
 * @file ScoreStaff.tsx
 * @description Pentagrama musical interactivo en SVG:
 * - 5 líneas horizontales con espaciado musical profesional
 * - Clave de Sol (𝄞) en el inicio
 * - Métrica de compás (4/4, 3/4, 6/8)
 * - Barras de compás divisorias con números
 * - Notas y acordes dibujados en sus posiciones diatónicas exactas
 * - Líneas adicionales (ledger lines) automáticas (ej. Do central C4)
 * - Cursor y resaltado dinámico sincronizado durante la reproducción de audio
 * - Clic interactivo en notas y compases para escuchar y editar
 */

import React from 'react';
import {
  MeasureData,
  TimeSignature,
  getStaffY,
  getLedgerLines,
  getAccidental
} from '../utils/staffTheory';
import { audioEngine } from '../utils/audio';
import { Volume2, Trash2 } from 'lucide-react';

interface ScoreStaffProps {
  measures: MeasureData[];
  timeSignature: TimeSignature;
  activeMeasureIndex: number | null;
  activeBeat: number | null;
  onSelectMeasure: (measureIndex: number) => void;
  onDeleteNote: (measureIndex: number, noteId: string) => void;
  onDeleteMeasure: (measureIndex: number) => void;
  selectedMeasureIndex: number;
}

export const ScoreStaff: React.FC<ScoreStaffProps> = ({
  measures,
  timeSignature,
  activeMeasureIndex,
  activeBeat,
  onSelectMeasure,
  onDeleteNote,
  onDeleteMeasure,
  selectedMeasureIndex
}) => {
  // Dimensiones del pentagrama
  const staffTopY = 55; // Y de la 5ta línea (F5)
  const lineSpacing = 11; // Espacio entre líneas
  const staffHeight = 180;
  const startMargin = 70; // Margen para la clave de sol y métrica
  const measureWidth = 240; // Ancho de cada compás
  const totalSvgWidth = Math.max(780, startMargin + measures.length * measureWidth + 40);

  // Cantidad de pulsos según métrica
  const totalBeats = timeSignature === '4/4' ? 4 : timeSignature === '3/4' ? 3 : 6;

  // Manejar clic en una nota melódica para escucharla
  const handleNoteClick = (e: React.MouseEvent, midi: number) => {
    e.stopPropagation();
    audioEngine.playMidi(midi, 1.6);
  };

  // Manejar clic en un acorde para escucharlo
  const handleChordClick = (e: React.MouseEvent, midis: number[]) => {
    e.stopPropagation();
    audioEngine.strumChord(midis.map(m => ({ midi: m })), 35, 'down');
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col gap-3">
      {/* Barra de cabecera del pentagrama */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold tracking-wide uppercase text-slate-200">
            Pentagrama Musical (Clave de Sol)
          </span>
          <span className="text-amber-400 font-mono font-semibold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            {timeSignature}
          </span>
          <span className="text-slate-500 font-mono text-[11px]">
            {measures.length} {measures.length === 1 ? 'compás' : 'compases'}
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Volume2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Clic en una nota o acorde para escuchar</span>
          </span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline text-slate-500">
            Compás seleccionado: #{selectedMeasureIndex + 1}
          </span>
        </div>
      </div>

      {/* Contenedor desplazable horizontal para el pentagrama SVG */}
      <div className="relative w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
        <div className="min-w-[780px] select-none bg-slate-950/80 border border-slate-800/80 rounded-xl py-3 px-2">
          <svg
            width={totalSvgWidth}
            height={staffHeight}
            viewBox={`0 0 ${totalSvgWidth} ${staffHeight}`}
            className="overflow-visible"
          >
            <defs>
              {/* Gradiente para el cursor de reproducción */}
              <linearGradient id="cursorGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.1" />
              </linearGradient>
            </defs>

            {/* 1. Las 5 líneas horizontales continuas del pentagrama */}
            {[0, 1, 2, 3, 4].map(lineIndex => {
              const y = staffTopY + lineIndex * lineSpacing;
              return (
                <line
                  key={`staff-line-${lineIndex}`}
                  x1={20}
                  y1={y}
                  x2={totalSvgWidth - 20}
                  y2={y}
                  stroke="#475569"
                  strokeWidth="1.25"
                  opacity="0.8"
                />
              );
            })}

            {/* 2. Barra inicial de inicio del pentagrama */}
            <line
              x1={startMargin}
              y1={staffTopY}
              x2={startMargin}
              y2={staffTopY + 4 * lineSpacing}
              stroke="#64748b"
              strokeWidth="2"
            />

            {/* 3. Clave de Sol (Símbolo musical estilizado 𝄞) */}
            <g transform={`translate(28, ${staffTopY + 36}) scale(1.15)`}>
              <text
                x="0"
                y="0"
                fill="#f59e0b"
                fontSize="48"
                fontFamily="serif"
                textAnchor="middle"
                style={{ filter: 'drop-shadow(0 0 3px rgba(245, 158, 11, 0.4))' }}
              >
                𝄞
              </text>
            </g>

            {/* 4. Indicador de compás (Métrica 4/4, 3/4 o 6/8) */}
            <g transform={`translate(${startMargin - 16}, ${staffTopY + 16})`}>
              {timeSignature === '4/4' ? (
                <>
                  <text x="0" y="0" fill="#cbd5e1" fontSize="18" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">4</text>
                  <text x="0" y="20" fill="#cbd5e1" fontSize="18" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">4</text>
                </>
              ) : timeSignature === '3/4' ? (
                <>
                  <text x="0" y="0" fill="#cbd5e1" fontSize="18" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">3</text>
                  <text x="0" y="20" fill="#cbd5e1" fontSize="18" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">4</text>
                </>
              ) : (
                <>
                  <text x="0" y="0" fill="#cbd5e1" fontSize="18" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">6</text>
                  <text x="0" y="20" fill="#cbd5e1" fontSize="18" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">8</text>
                </>
              )}
            </g>

            {/* 5. Renderizado de cada compás */}
            {measures.map((measure, mIdx) => {
              const mStartX = startMargin + mIdx * measureWidth;
              const mEndX = mStartX + measureWidth;
              const isSelected = selectedMeasureIndex === mIdx;
              const isPlayingMeasure = activeMeasureIndex === mIdx;

              return (
                <g
                  key={measure.id}
                  onClick={() => onSelectMeasure(mIdx)}
                  className="cursor-pointer group"
                >
                  {/* Fondo del compás (resaltado si está seleccionado o reproduciéndose) */}
                  <rect
                    x={mStartX}
                    y={staffTopY - 26}
                    width={measureWidth}
                    height={staffHeight - 40}
                    fill={
                      isPlayingMeasure
                        ? 'rgba(245, 158, 11, 0.08)'
                        : isSelected
                        ? 'rgba(56, 189, 248, 0.06)'
                        : 'transparent'
                    }
                    stroke={isSelected ? '#38bdf8' : 'transparent'}
                    strokeWidth="1.5"
                    strokeDasharray={isSelected ? '4 2' : 'none'}
                    rx="6"
                  />

                  {/* Número de compás arriba */}
                  <text
                    x={mStartX + 8}
                    y={staffTopY - 14}
                    fill="#64748b"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    #{measure.measureNumber}
                  </text>

                  {/* Botón discreto para eliminar compás si hay más de uno */}
                  {measures.length > 1 && (
                    <g
                      transform={`translate(${mEndX - 20}, ${staffTopY - 24})`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteMeasure(mIdx);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                    >
                      <title>Eliminar este compás</title>
                      <circle cx="8" cy="8" r="8" fill="#e11d48" opacity="0.8" />
                      <text x="8" y="11" fill="#ffffff" fontSize="10" textAnchor="middle" fontWeight="bold">×</text>
                    </g>
                  )}

                  {/* Barra divisoria de fin de compás */}
                  <line
                    x1={mEndX}
                    y1={staffTopY}
                    x2={mEndX}
                    y2={staffTopY + 4 * lineSpacing}
                    stroke="#64748b"
                    strokeWidth="1.5"
                  />

                  {/* Subdivisión de pulsos/tiempos tenue en el compás */}
                  {Array.from({ length: totalBeats - 1 }).map((_, beatIdx) => {
                    const beatX = mStartX + ((beatIdx + 1) * measureWidth) / totalBeats;
                    return (
                      <line
                        key={`beat-line-${mIdx}-${beatIdx}`}
                        x1={beatX}
                        y1={staffTopY}
                        x2={beatX}
                        y2={staffTopY + 4 * lineSpacing}
                        stroke="#334155"
                        strokeWidth="0.75"
                        strokeDasharray="2 4"
                        opacity="0.4"
                      />
                    );
                  })}

                  {/* Cursor de reproducción activo en este compás */}
                  {isPlayingMeasure && activeBeat !== null && (
                    <g>
                      <line
                        x1={mStartX + (activeBeat * measureWidth) / totalBeats + 20}
                        y1={staffTopY - 20}
                        x2={mStartX + (activeBeat * measureWidth) / totalBeats + 20}
                        y2={staffTopY + 4 * lineSpacing + 25}
                        stroke="#f59e0b"
                        strokeWidth="2.5"
                        style={{ filter: 'drop-shadow(0 0 6px #f59e0b)' }}
                      />
                    </g>
                  )}

                  {/* A) Acorde del compás */}
                  {measure.chord && (
                    <g
                      transform={`translate(${mStartX + 16}, 0)`}
                      onClick={(e) => handleChordClick(e, measure.chord!.midis)}
                    >
                      {/* Etiqueta del acorde arriba del pentagrama */}
                      <rect
                        x="-4"
                        y={staffTopY - 32}
                        width="54"
                        height="20"
                        rx="4"
                        fill="#0f172a"
                        stroke="#f59e0b"
                        strokeWidth="1.5"
                      />
                      <text
                        x="23"
                        y={staffTopY - 18}
                        fill="#fef08a"
                        fontSize="12"
                        fontWeight="bold"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        {measure.chord.symbol}
                      </text>

                      {/* Grado romano si existe */}
                      {measure.chord.romanNumeral && (
                        <text
                          x="23"
                          y={staffTopY - 4}
                          fill="#94a3b8"
                          fontSize="9"
                          fontFamily="monospace"
                          textAnchor="middle"
                        >
                          {measure.chord.romanNumeral}
                        </text>
                      )}

                      {/* Notas del acorde apiladas armónicamente en el compás */}
                      {measure.chord.pitches.map((pitch, pIdx) => {
                        const noteY = getStaffY(pitch, staffTopY, lineSpacing);
                        const ledgers = getLedgerLines(pitch, staffTopY, lineSpacing);
                        const accidental = getAccidental(pitch);

                        return (
                          <g key={`chord-p-${pitch}-${pIdx}`}>
                            {/* Líneas adicionales para notas del acorde */}
                            {ledgers.map((lY, lIdx) => (
                              <line
                                key={`chord-ledger-${lIdx}-${pitch}`}
                                x1="12"
                                y1={lY}
                                x2="34"
                                y2={lY}
                                stroke="#64748b"
                                strokeWidth="1.2"
                              />
                            ))}

                            {/* Alteración si tiene */}
                            {accidental && (
                              <text x="10" y={noteY + 4} fill="#f59e0b" fontSize="11" fontWeight="bold">
                                {accidental === '#' ? '♯' : '♭'}
                              </text>
                            )}

                            {/* Cabeza de nota armónica */}
                            <ellipse
                              cx="23"
                              cy={noteY}
                              rx="5.5"
                              ry="4"
                              fill="#f59e0b"
                              stroke="#ffffff"
                              strokeWidth="1.2"
                              transform={`rotate(-20, 23, ${noteY})`}
                              opacity="0.85"
                            />
                          </g>
                        );
                      })}
                    </g>
                  )}

                  {/* B) Notas melódicas del compás */}
                  {measure.notes.map((note, nIdx) => {
                    const beatFraction = note.beat / totalBeats;
                    const noteX = mStartX + (measure.chord ? 80 : 25) + beatFraction * (measureWidth - 90);
                    const noteY = getStaffY(note.pitch, staffTopY, lineSpacing);
                    const ledgers = getLedgerLines(note.pitch, staffTopY, lineSpacing);
                    const accidental = getAccidental(note.pitch);

                    // Plica (stem): hacia arriba si está por debajo de la 3ra línea (B4), hacia abajo si está arriba
                    const step = noteY;
                    const stemUp = noteY > staffTopY + 2 * lineSpacing;
                    const stemHeight = 28;

                    return (
                      <g
                        key={note.id}
                        onClick={(e) => handleNoteClick(e, note.midi)}
                        className="group/note hover:opacity-100 cursor-pointer"
                      >
                        {/* Líneas adicionales si la nota está fuera de las 5 líneas */}
                        {ledgers.map((lY, lIdx) => (
                          <line
                            key={`note-ledger-${lIdx}-${note.id}`}
                            x1={noteX - 9}
                            y1={lY}
                            x2={noteX + 9}
                            y2={lY}
                            stroke="#94a3b8"
                            strokeWidth="1.4"
                          />
                        ))}

                        {/* Alteración (# o b) */}
                        {accidental && (
                          <text
                            x={noteX - 14}
                            y={noteY + 4}
                            fill="#38bdf8"
                            fontSize="13"
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            {accidental === '#' ? '♯' : '♭'}
                          </text>
                        )}

                        {/* Cabeza de la nota (elipse inclinada) */}
                        <ellipse
                          cx={noteX}
                          cy={noteY}
                          rx="5.5"
                          ry="4"
                          fill={note.duration === 'whole' || note.duration === 'half' ? '#0f172a' : '#38bdf8'}
                          stroke="#38bdf8"
                          strokeWidth="2"
                          transform={`rotate(-20, ${noteX}, ${noteY})`}
                          style={{ filter: 'drop-shadow(0 0 3px rgba(56, 189, 248, 0.4))' }}
                        />

                        {/* Plica (stem) para notas no redondas */}
                        {note.duration !== 'whole' && (
                          <line
                            x1={stemUp ? noteX + 4.8 : noteX - 4.8}
                            y1={noteY}
                            x2={stemUp ? noteX + 4.8 : noteX - 4.8}
                            y2={stemUp ? noteY - stemHeight : noteY + stemHeight}
                            stroke="#38bdf8"
                            strokeWidth="1.5"
                          />
                        )}

                        {/* Corchete (flag) para corcheas */}
                        {note.duration === 'eighth' && (
                          <path
                            d={
                              stemUp
                                ? `M ${noteX + 4.8} ${noteY - stemHeight} Q ${noteX + 12} ${noteY - stemHeight + 8} ${noteX + 10} ${noteY - stemHeight + 16}`
                                : `M ${noteX - 4.8} ${noteY + stemHeight} Q ${noteX + 4} ${noteY + stemHeight - 8} ${noteX + 2} ${noteY + stemHeight - 16}`
                            }
                            fill="none"
                            stroke="#38bdf8"
                            strokeWidth="1.8"
                          />
                        )}

                        {/* Etiqueta solfeo debajo del pentagrama */}
                        <text
                          x={noteX}
                          y={staffTopY + 4 * lineSpacing + 20}
                          fill="#e2e8f0"
                          fontSize="10"
                          fontWeight="bold"
                          fontFamily="monospace"
                          textAnchor="middle"
                        >
                          {note.solfege}
                        </text>

                        {/* Botón para eliminar nota al pasar el mouse */}
                        <g
                          transform={`translate(${noteX - 6}, ${staffTopY + 4 * lineSpacing + 26})`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteNote(mIdx, note.id);
                          }}
                          className="opacity-0 group-hover/note:opacity-100 transition-opacity"
                        >
                          <title>Eliminar esta nota</title>
                          <circle cx="6" cy="6" r="6" fill="#e11d48" />
                          <text x="6" y="9" fill="#ffffff" fontSize="9" textAnchor="middle" fontWeight="bold">×</text>
                        </g>
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
};
