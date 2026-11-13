/**
 * @file StaffCanvas.tsx
 * @description Renderizador interactivo SVG de partitura y pentagrama musical profesional:
 * - Geometría y espaciado corregidos: zonas verticales separadas para acordes, pentagrama y solfeo
 * - Sin solapamiento entre acordes superiores, líneas adicionales y notas
 * - Distribución horizontal inteligente con espaciado mínimo anticolisión
 * - Soporte para Clave de Sol (Treble), Clave de Fa (Bass) y Clave de Do (Alto)
 * - Métrica, armaduras, plicas direccionales, líneas adicionales automáticas y cursor sincronizado
 */

import React, { useRef } from 'react';
import {
  Measure,
  ScoreNote,
  ClefType,
  TimeSignature
} from '../types';
import {
  calculateNoteStaffY,
  calculateLedgerLines,
  getStemDirection,
  getMeasureCapacityBeats,
  getClefLine1Step
} from '../musicTheoryEngine';
import { NoteNotation, formatNoteName, formatPitchName, formatChordSymbol } from '../../utils/theory';

interface StaffCanvasProps {
  measures: Measure[];
  timeSignature: TimeSignature;
  clef: ClefType;
  notation?: NoteNotation;
  keySignatureNotes: string[];
  selectedMeasureIndex: number;
  selectedNoteId: string | null;
  onSelectMeasure: (idx: number) => void;
  onSelectNote: (note: ScoreNote, measureIndex: number) => void;
  onStaffClickToAddNote: (measureIndex: number, step: string, octave: number, beat: number) => void;
  onDeleteNote: (measureIndex: number, noteId: string) => void;
  activePlaybackMeasure: number | null;
  activePlaybackBeat: number | null;
  bpm: number;
}

export const StaffCanvas: React.FC<StaffCanvasProps> = ({
  measures,
  timeSignature,
  clef,
  notation = 'american',
  selectedMeasureIndex,
  selectedNoteId,
  onSelectMeasure,
  onSelectNote,
  onStaffClickToAddNote,
  onDeleteNote,
  activePlaybackMeasure,
  activePlaybackBeat
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // ========================================================
  // GEOMETRÍA PROFESIONAL DE PARTITURA (ESPACIADO GENEROSO)
  // ========================================================
  const lineSpacing = 13; // Distancia entre líneas del pentagrama (13px legible)
  const staffHeight = 4 * lineSpacing; // 52px (Línea 1 a Línea 5)
  const systemTopPadding = 84; // Espacio vertical superior: pista de acordes (y=10..38) y notas agudas
  const systemBottomPadding = 76; // Espacio inferior: notas graves, solfeo y dinámicas
  const systemTotalHeight = systemTopPadding + staffHeight + systemBottomPadding; // 212px por sistema

  const clefAndKeyWidth = 96; // Ancho del bloque de Clave + Métrica
  const measureWidth = 340; // Ancho generoso por compás para evitar aglomeración de notas
  const measuresPerRow = 2; // 2 compases por fila: máxima claridad visual y espacio para notas
  const numRows = Math.ceil(measures.length / measuresPerRow);

  /**
   * Determina el paso diatónico y octava a partir de la coordenada Y del clic.
   */
  const handleMeasureClick = (
    e: React.MouseEvent<SVGRectElement>,
    measureIndex: number,
    mWidth: number
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const clickX = e.clientX - rect.left;

    // Línea 1 (inferior del pentagrama)
    const line1Y = systemTopPadding + 4 * lineSpacing;
    const stepHeight = lineSpacing / 2;
    const deltaSteps = Math.round((line1Y - clickY) / stepHeight);

    const line1Step = getClefLine1Step(clef);
    const targetAbsoluteStep = line1Step + deltaSteps;

    const octave = Math.floor(targetAbsoluteStep / 7);
    const stepInOct = ((targetAbsoluteStep % 7) + 7) % 7;
    const stepNames: Array<'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B'> = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const step = stepNames[stepInOct];

    // Calcular el tiempo/beat según clickX dentro del compás
    const capacity = getMeasureCapacityBeats(timeSignature);
    const leftMargin = 32;
    const availableWidth = mWidth - 54;
    const ratio = Math.max(0, Math.min(0.96, (clickX - leftMargin) / availableWidth));
    const rawBeat = ratio * capacity;
    const beat = Math.floor(rawBeat * 2) / 2; // Snap a corcheas (0.5)

    onStaffClickToAddNote(measureIndex, step, octave, beat);
  };

  /**
   * Calcula las posiciones horizontales X de las notas asegurando
   * que nunca se solapen entre sí y que los acordes compartan la misma X.
   */
  const computeNoteLayout = (notes: ScoreNote[], mWidth: number) => {
    const layoutMap = new Map<string, { x: number; headOffset: number; isCluster: boolean; clusterIndex: number; clusterTotal: number }>();
    if (notes.length === 0) return layoutMap;

    const capacity = getMeasureCapacityBeats(timeSignature);
    const leftMargin = 36;
    const rightMargin = 28;
    const availableWidth = mWidth - leftMargin - rightMargin;

    // 1. Ordenar notas cronológicamente
    const sorted = [...notes].sort((a, b) => {
      if (Math.abs(a.startBeat - b.startBeat) > 0.05) {
        return a.startBeat - b.startBeat;
      }
      return a.midi - b.midi;
    });

    // 2. Agrupar notas que comparten el mismo pulso (acordes o notas simultáneas)
    interface NoteGroup {
      beat: number;
      nominalX: number;
      actualX: number;
      notes: ScoreNote[];
    }

    const groups: NoteGroup[] = [];
    sorted.forEach(note => {
      const existing = groups.find(g => Math.abs(g.beat - note.startBeat) < 0.08);
      if (existing) {
        existing.notes.push(note);
      } else {
        const nominalX = leftMargin + (note.startBeat / capacity) * availableWidth;
        groups.push({
          beat: note.startBeat,
          nominalX,
          actualX: nominalX,
          notes: [note]
        });
      }
    });

    // 3. Aplicar espaciado mínimo de 42px entre grupos consecutivos para evitar solapamiento
    const minGroupSpacing = 44;
    for (let i = 1; i < groups.length; i++) {
      const prev = groups[i - 1];
      const curr = groups[i];
      if (curr.actualX < prev.actualX + minGroupSpacing) {
        curr.actualX = prev.actualX + minGroupSpacing;
      }
    }

    // 4. Si el último grupo se sale del ancho del compás, comprimir proporcionalmente
    const maxAllowedX = mWidth - rightMargin;
    if (groups.length > 0 && groups[groups.length - 1].actualX > maxAllowedX) {
      const minX = groups[0].actualX;
      const maxX = groups[groups.length - 1].actualX;
      const scale = (maxAllowedX - minX) / (maxX - minX);
      groups.forEach((g, idx) => {
        if (idx > 0) {
          g.actualX = minX + (g.actualX - minX) * scale;
        }
      });
    }

    // 5. Asignar coordenadas X finales a cada nota
    groups.forEach(group => {
      const isCluster = group.notes.length > 1;
      group.notes.forEach((note, nIdx) => {
        // En acordes con intervalo de 2da contigua, alternar cabeza a la derecha
        let headOffset = 0;
        if (nIdx > 0) {
          const prevNote = group.notes[nIdx - 1];
          const prevStep = getClefLine1Step(clef) + Math.round((prevNote.octave * 7 + (prevNote.step.charCodeAt(0) - 67)));
          const curStep = getClefLine1Step(clef) + Math.round((note.octave * 7 + (note.step.charCodeAt(0) - 67)));
          if (Math.abs(curStep - prevStep) === 1) {
            headOffset = 11;
          }
        }

        layoutMap.set(note.id, {
          x: group.actualX,
          headOffset,
          isCluster,
          clusterIndex: nIdx,
          clusterTotal: group.notes.length
        });
      });
    });

    return layoutMap;
  };

  return (
    <div
      ref={containerRef}
      className="w-full overflow-x-auto bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl backdrop-blur-md select-none"
    >
      <div className="min-w-[780px] flex flex-col gap-6">
        {Array.from({ length: numRows }).map((_, rowIndex) => {
          const rowMeasures = measures.slice(rowIndex * measuresPerRow, (rowIndex + 1) * measuresPerRow);
          const totalRowWidth = clefAndKeyWidth + rowMeasures.length * measureWidth;

          return (
            <div
              key={`system-${rowIndex}`}
              className="relative bg-slate-900/50 rounded-xl p-3 border border-slate-800/80 shadow-md"
            >
              <svg
                width={totalRowWidth}
                height={systemTotalHeight}
                className="overflow-visible block"
              >
                <defs>
                  {/* Símbolo de cabeza de nota negra / corchea */}
                  <g id="notehead-black">
                    <ellipse rx="5.8" ry="4.4" transform="rotate(-20)" fill="#f8fafc" />
                  </g>
                  {/* Símbolo de cabeza de nota blanca */}
                  <g id="notehead-half">
                    <ellipse rx="5.8" ry="4.4" transform="rotate(-20)" fill="#0f172a" stroke="#f8fafc" strokeWidth="2" />
                  </g>
                  {/* Símbolo de cabeza de nota redonda */}
                  <g id="notehead-whole">
                    <ellipse rx="6.8" ry="4.6" transform="rotate(-15)" fill="#0f172a" stroke="#f8fafc" strokeWidth="2.2" />
                  </g>
                </defs>

                {/* 1. BLOQUE DE CLAVE Y MÉTRICA AL INICIO DEL SISTEMA */}
                <g transform="translate(0, 0)">
                  {/* Fondo sutil del bloque de clave */}
                  <rect
                    x="2"
                    y={systemTopPadding - 12}
                    width={clefAndKeyWidth - 6}
                    height={staffHeight + 24}
                    fill="#0f172a"
                    fillOpacity="0.6"
                    rx="6"
                  />

                  {/* 5 Líneas del Pentagrama para la Clave */}
                  {[0, 1, 2, 3, 4].map(lineIdx => (
                    <line
                      key={`clef-line-${lineIdx}`}
                      x1="6"
                      y1={systemTopPadding + lineIdx * lineSpacing}
                      x2={clefAndKeyWidth}
                      y2={systemTopPadding + lineIdx * lineSpacing}
                      stroke="#475569"
                      strokeWidth="1.3"
                    />
                  ))}

                  {/* Barra inicial vertical gruesa */}
                  <line
                    x1="6"
                    y1={systemTopPadding}
                    x2="6"
                    y2={systemTopPadding + 4 * lineSpacing}
                    stroke="#94a3b8"
                    strokeWidth="2.5"
                  />

                  {/* Glifo de Clave */}
                  <text
                    x="18"
                    y={
                      clef === 'treble'
                        ? systemTopPadding + 3.2 * lineSpacing
                        : clef === 'bass'
                        ? systemTopPadding + 2.5 * lineSpacing
                        : systemTopPadding + 2.6 * lineSpacing
                    }
                    fontSize={clef === 'treble' ? '38' : '32'}
                    fill="#f59e0b"
                    fontFamily="serif"
                    className="select-none"
                  >
                    {clef === 'treble' ? '𝄞' : clef === 'bass' ? '𝄢' : '𝄡'}
                  </text>

                  {/* Indicador de Métrica (Compás) */}
                  <g transform={`translate(${clefAndKeyWidth - 28}, ${systemTopPadding + 1.2 * lineSpacing})`}>
                    <text
                      x="0"
                      y="1"
                      fill="#38bdf8"
                      fontSize="16"
                      fontWeight="bold"
                      fontFamily="sans-serif"
                      textAnchor="middle"
                    >
                      {timeSignature.split('/')[0]}
                    </text>
                    <text
                      x="0"
                      y="19"
                      fill="#38bdf8"
                      fontSize="16"
                      fontWeight="bold"
                      fontFamily="sans-serif"
                      textAnchor="middle"
                    >
                      {timeSignature.split('/')[1]}
                    </text>
                  </g>
                </g>

                {/* 2. COMPASES DEL SISTEMA */}
                {rowMeasures.map((measure, mLocalIdx) => {
                  const mGlobalIdx = rowIndex * measuresPerRow + mLocalIdx;
                  const measureX = clefAndKeyWidth + mLocalIdx * measureWidth;
                  const isSelected = selectedMeasureIndex === mGlobalIdx;
                  const isPlayingThisMeasure = activePlaybackMeasure === mGlobalIdx;
                  const noteLayout = computeNoteLayout(measure.notes, measureWidth);

                  return (
                    <g key={measure.id} transform={`translate(${measureX}, 0)`}>
                      {/* Fondo limpio del compás (Marco no invasivo, sin cajas punteadas cruzando notas) */}
                      <rect
                        x="2"
                        y="6"
                        width={measureWidth - 4}
                        height={systemTotalHeight - 12}
                        rx="10"
                        fill={
                          isSelected
                            ? 'rgba(245, 158, 11, 0.07)'
                            : isPlayingThisMeasure
                            ? 'rgba(56, 189, 248, 0.08)'
                            : 'transparent'
                        }
                        stroke={isSelected ? '#f59e0b' : 'transparent'}
                        strokeWidth="1.5"
                        className="cursor-pointer transition-colors"
                        onClick={(e) => {
                          onSelectMeasure(mGlobalIdx);
                          handleMeasureClick(e, mGlobalIdx, measureWidth);
                        }}
                      />

                      {/* Línea superior dorada indicadora de selección */}
                      {isSelected && (
                        <line
                          x1="12"
                          y1="6"
                          x2={measureWidth - 12}
                          y2="6"
                          stroke="#f59e0b"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                      )}

                      {/* 5 Líneas del Pentagrama para el compás */}
                      {[0, 1, 2, 3, 4].map(lineIdx => (
                        <line
                          key={`m-line-${mGlobalIdx}-${lineIdx}`}
                          x1="0"
                          y1={systemTopPadding + lineIdx * lineSpacing}
                          x2={measureWidth}
                          y2={systemTopPadding + lineIdx * lineSpacing}
                          stroke="#475569"
                          strokeWidth="1.2"
                        />
                      ))}

                      {/* Barra de compás vertical final */}
                      <line
                        x1={measureWidth}
                        y1={systemTopPadding}
                        x2={measureWidth}
                        y2={systemTopPadding + 4 * lineSpacing}
                        stroke="#94a3b8"
                        strokeWidth={mGlobalIdx === measures.length - 1 ? '3' : '1.5'}
                      />
                      {mGlobalIdx === measures.length - 1 && (
                        <line
                          x1={measureWidth - 5}
                          y1={systemTopPadding}
                          x2={measureWidth - 5}
                          y2={systemTopPadding + 4 * lineSpacing}
                          stroke="#94a3b8"
                          strokeWidth="1.2"
                        />
                      )}

                      {/* Número de Compás en esquina superior izquierda */}
                      <text
                        x="10"
                        y="22"
                        fill="#64748b"
                        fontSize="11"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {mGlobalIdx + 1}
                      </text>

                      {/* PISTA SUPERIOR DE ACORDES (Zona dedicada en y=12..38, libre de colisión) */}
                      {measure.chord && (
                        <g transform="translate(14, 12)">
                          <rect
                            x="0"
                            y="0"
                            width="74"
                            height="24"
                            fill="#1e293b"
                            stroke="#3b82f6"
                            strokeWidth="1.2"
                            rx="6"
                          />
                          <text
                            x="37"
                            y="16"
                            fill="#60a5fa"
                            fontSize="12.5"
                            fontWeight="bold"
                            textAnchor="middle"
                            fontFamily="sans-serif"
                          >
                            {formatChordSymbol(measure.chord.symbol, notation)}
                          </text>
                          {measure.chord.romanNumeral && (
                            <text
                              x="82"
                              y="17"
                              fill="#93c5fd"
                              fontSize="11"
                              fontWeight="bold"
                              fontFamily="serif"
                            >
                              {measure.chord.romanNumeral}
                            </text>
                          )}
                        </g>
                      )}

                      {/* Cursor de Reproducción Animado en Tiempo Real */}
                      {isPlayingThisMeasure && activePlaybackBeat !== null && (
                        <line
                          x1={Math.max(16, Math.min(measureWidth - 16, 36 + (activePlaybackBeat / getMeasureCapacityBeats(timeSignature)) * (measureWidth - 64)))}
                          y1={systemTopPadding - 24}
                          x2={Math.max(16, Math.min(measureWidth - 16, 36 + (activePlaybackBeat / getMeasureCapacityBeats(timeSignature)) * (measureWidth - 64)))}
                          y2={systemTopPadding + 4 * lineSpacing + 28}
                          stroke="#f59e0b"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          className="drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]"
                        />
                      )}

                      {/* Silencio de compás completo si no hay notas ni acordes */}
                      {measure.notes.length === 0 && !measure.chord && (
                        <g transform={`translate(${measureWidth / 2 - 8}, ${systemTopPadding + 1.5 * lineSpacing})`}>
                          <rect x="0" y="0" width="16" height="7" fill="#64748b" rx="1" />
                        </g>
                      )}

                      {/* NOTAS Y SILENCIOS DEL COMPÁS CON ESPACIADO GENEROSO */}
                      {measure.notes.map((note, nIdx) => {
                        const layout = noteLayout.get(note.id) || {
                          x: 40 + (note.startBeat / getMeasureCapacityBeats(timeSignature)) * (measureWidth - 80),
                          headOffset: 0,
                          isCluster: false,
                          clusterIndex: 0,
                          clusterTotal: 1
                        };

                        const noteX = layout.x + layout.headOffset;
                        const noteY = calculateNoteStaffY(note.step, note.octave, clef, systemTopPadding, lineSpacing);
                        const ledgerYList = calculateLedgerLines(note.step, note.octave, clef, systemTopPadding, lineSpacing);
                        const isNoteSelected = selectedNoteId === note.id;
                        const stemDir = getStemDirection(note.step, note.octave, clef);

                        // Si es silencio
                        if (note.isRest) {
                          return (
                            <g
                              key={note.id}
                              transform={`translate(${noteX}, ${systemTopPadding + 2 * lineSpacing})`}
                              className="cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectNote(note, mGlobalIdx);
                              }}
                            >
                              <title>{`Silencio de ${note.duration}`}</title>
                              <path
                                d="M 0,-8 L 6,-2 L -4,3 L 4,9 L 0,14"
                                stroke={isNoteSelected ? '#f59e0b' : '#94a3b8'}
                                strokeWidth="2.6"
                                fill="none"
                                strokeLinecap="round"
                              />
                            </g>
                          );
                        }

                        // Desplazamiento vertical del texto de solfeo para evitar solapamientos en notas densas
                        const solfegeY = layout.isCluster && layout.clusterIndex > 0
                          ? systemTopPadding + 4 * lineSpacing + 22 + layout.clusterIndex * 13
                          : systemTopPadding + 4 * lineSpacing + 22;

                        const notePc = `${note.step}${note.alter === 1 ? '#' : note.alter === -1 ? 'b' : note.alter === 2 ? '##' : note.alter === -2 ? 'bb' : ''}`;
                        const noteLabel = formatNoteName(notePc, notation);

                        return (
                          <g
                            key={note.id}
                            className="group/note cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectNote(note, mGlobalIdx);
                            }}
                          >
                            <title>{`${formatPitchName(note.pitch, notation)} - ${note.duration}`}</title>

                            {/* Líneas adicionales (Ledger Lines) */}
                            {ledgerYList.map((ledY, lIdx) => (
                              <line
                                key={`ledger-${note.id}-${lIdx}`}
                                x1={noteX - 11}
                                y1={ledY}
                                x2={noteX + 11}
                                y2={ledY}
                                stroke="#cbd5e1"
                                strokeWidth="1.4"
                              />
                            ))}

                            {/* Alteración accidental (♯, ♭, ♮) */}
                            {note.alter !== 0 && (
                              <text
                                x={noteX - 15}
                                y={noteY + 4}
                                fill={isNoteSelected ? '#f59e0b' : '#f8fafc'}
                                fontSize="14"
                                fontWeight="bold"
                                fontFamily="sans-serif"
                                textAnchor="middle"
                              >
                                {note.alter === 1 ? '♯' : note.alter === -1 ? '♭' : note.alter === 2 ? '𝄪' : '𝄫'}
                              </text>
                            )}

                            {/* Cabeza de la Nota */}
                            <g transform={`translate(${noteX}, ${noteY})`}>
                              {note.duration === 'whole' ? (
                                <use href="#notehead-whole" />
                              ) : note.duration === 'half' ? (
                                <use href="#notehead-half" />
                              ) : (
                                <use href="#notehead-black" />
                              )}
                              {isNoteSelected && (
                                <circle
                                  cx="0"
                                  cy="0"
                                  r="10"
                                  fill="none"
                                  stroke="#f59e0b"
                                  strokeWidth="2"
                                  className="animate-pulse"
                                />
                              )}
                            </g>

                            {/* Puntillo */}
                            {note.dotted && (
                              <circle
                                cx={noteX + 10}
                                cy={noteY - 2}
                                r="2.2"
                                fill="#f8fafc"
                              />
                            )}

                            {/* Plica (Stem) para figuras menores a redonda */}
                            {note.duration !== 'whole' && (
                              <line
                                x1={stemDir === 'up' ? noteX + 5.5 : noteX - 5.5}
                                y1={noteY}
                                x2={stemDir === 'up' ? noteX + 5.5 : noteX - 5.5}
                                y2={stemDir === 'up' ? noteY - 32 : noteY + 32}
                                stroke={isNoteSelected ? '#f59e0b' : '#f8fafc'}
                                strokeWidth="1.5"
                              />
                            )}

                            {/* Corchete para corchea y semicorchea */}
                            {(note.duration === 'eighth' || note.duration === 'sixteenth') && (
                              <path
                                d={
                                  stemDir === 'up'
                                    ? `M ${noteX + 5.5} ${noteY - 32} Q ${noteX + 15} ${noteY - 20} ${noteX + 12} ${noteY - 11}`
                                    : `M ${noteX - 5.5} ${noteY + 32} Q ${noteX + 5} ${noteY + 20} ${noteX + 2} ${noteY + 11}`
                                }
                                stroke={isNoteSelected ? '#f59e0b' : '#f8fafc'}
                                strokeWidth="2"
                                fill="none"
                                strokeLinecap="round"
                              />
                            )}

                            {/* Etiqueta de nota debajo del pentagrama (Separada con amplio margen) */}
                            <text
                              x={noteX}
                              y={solfegeY}
                              fill={isNoteSelected ? '#f59e0b' : '#cbd5e1'}
                              fontSize={noteLabel.length >= 4 ? '9.5' : '11'}
                              fontFamily="monospace"
                              fontWeight="bold"
                              textAnchor="middle"
                            >
                              {noteLabel}
                            </text>

                            {/* Botón flotante para eliminar nota al pasar el mouse */}
                            <g
                              transform={`translate(${noteX - 6}, ${solfegeY + 10})`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteNote(mGlobalIdx, note.id);
                              }}
                              className="opacity-0 group-hover/note:opacity-100 transition-opacity"
                            >
                              <title>Eliminar nota</title>
                              <circle cx="6" cy="6" r="6" fill="#e11d48" />
                              <text x="6" y="9.5" fill="#ffffff" fontSize="9" textAnchor="middle" fontWeight="bold">×</text>
                            </g>
                          </g>
                        );
                      })}
                    </g>
                  );
                })}
              </svg>
            </div>
          );
        })}
      </div>
    </div>
  );
};
